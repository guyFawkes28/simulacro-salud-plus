import fs from 'fs'
import csv from 'csv-parser'
import { pool, clearAllTables } from '../config/postgres.js'
import PatientHistory from '../models/PatientHistory.js'

// Normaliza un string: quita espacios y pone en minúsculas
const limpiarEmail = (str) => str?.trim().toLowerCase() ?? ''

// Normaliza un string: quita espacios
const limpiarTexto = (str) => str?.trim() ?? ''

// Lee el CSV y devuelve un array de filas ya normalizadas
const leerCSV = (csvPath) =>
    new Promise((resolve, reject) => {
        const filas = []
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (fila) => {
                // Normalización: emails en minúscula, strings sin espacios extra
                filas.push({
                    appointment_id:       limpiarTexto(fila.appointment_id),
                    appointment_date:     limpiarTexto(fila.appointment_date),
                    patient_name:         limpiarTexto(fila.patient_name),
                    patient_email:        limpiarEmail(fila.patient_email),
                    patient_phone:        limpiarTexto(fila.patient_phone),
                    patient_address:      limpiarTexto(fila.patient_address),
                    doctor_name:          limpiarTexto(fila.doctor_name),
                    doctor_email:         limpiarEmail(fila.doctor_email),
                    specialty:            limpiarTexto(fila.specialty),
                    treatment_code:       limpiarTexto(fila.treatment_code),
                    treatment_description:limpiarTexto(fila.treatment_description),
                    treatment_cost:       parseFloat(fila.treatment_cost) || 0,
                    insurance_provider:   limpiarTexto(fila.insurance_provider),
                    coverage_percentage:  parseInt(fila.coverage_percentage) || 0,
                    amount_paid:          parseFloat(fila.amount_paid) || 0,
                })
            })
            .on('end', () => resolve(filas))
            .on('error', reject)
    })

export const migrarData = async (csvPath, clearBefore = false) => {
    const filas = await leerCSV(csvPath)

    // Limpiar datos existentes si se solicita (idempotencia total)
    if (clearBefore) {
        await clearAllTables()
        await PatientHistory.deleteMany({})
        console.log('🗑️  Datos anteriores eliminados')
    }

    const cliente = await pool.connect()

    // Contadores para las estadísticas finales
    let pacientes = 0, doctores = 0, seguros = 0, citas = 0

    try {
        await cliente.query('BEGIN')

        for (const f of filas) {
            // 1. Seguro — upsert, devuelve siempre el id
            const resIns = await cliente.query(
                `INSERT INTO insurances (name, coverage_percentage)
                 VALUES ($1, $2)
                 ON CONFLICT (name) DO UPDATE SET coverage_percentage = EXCLUDED.coverage_percentage
                 RETURNING id, (xmax = 0) AS inserted`,
                [f.insurance_provider, f.coverage_percentage]
            )
            if (resIns.rows[0].inserted) seguros++

            // 2. Paciente — upsert por email (fuente única de verdad)
            const resPat = await cliente.query(
                `INSERT INTO patients (name, email, phone, address)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
                 RETURNING id, (xmax = 0) AS inserted`,
                [f.patient_name, f.patient_email, f.patient_phone, f.patient_address]
            )
            if (resPat.rows[0].inserted) pacientes++

            // 3. Doctor — upsert por email
            const resDoc = await cliente.query(
                `INSERT INTO doctors (name, email, specialty)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, specialty = EXCLUDED.specialty
                 RETURNING id, (xmax = 0) AS inserted`,
                [f.doctor_name, f.doctor_email, f.specialty]
            )
            if (resDoc.rows[0].inserted) doctores++

            // 4. Cita — incluye treatment_code y treatment_description
            const resCita = await cliente.query(
                `INSERT INTO appointments
                    (appointment_id, appointment_date, patient_id, doctor_id, insurance_id,
                     treatment_code, treatment_description, treatment_cost, amount_paid)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (appointment_id) DO NOTHING
                 RETURNING id`,
                [
                    f.appointment_id,
                    f.appointment_date,
                    resPat.rows[0].id,
                    resDoc.rows[0].id,
                    resIns.rows[0].id,
                    f.treatment_code,
                    f.treatment_description,
                    f.treatment_cost,
                    f.amount_paid,
                ]
            )
            if (resCita.rows.length > 0) citas++

            // 5. MongoDB — historial del paciente con cita embebida
            // Para evitar el error cuando 'appointments' no existe y asegurar idempotencia
            // primero eliminamos cualquier cita con el mismo appointmentId, luego hacemos upsert con $push
            const appointmentObj = {
                appointmentId:        f.appointment_id,
                date:                 f.appointment_date,
                doctorName:           f.doctor_name,
                doctorEmail:          f.doctor_email,
                specialty:            f.specialty,
                treatmentCode:        f.treatment_code,
                treatmentDescription: f.treatment_description,
                treatmentCost:        f.treatment_cost,
                insuranceProvider:    f.insurance_provider,
                coveragePercentage:   f.coverage_percentage,
                amountPaid:           f.amount_paid,
            }

            // Eliminamos (si existe) la cita con el mismo appointmentId
            await PatientHistory.updateOne(
                { patientEmail: f.patient_email },
                { $pull: { appointments: { appointmentId: f.appointment_id } } }
            )

            // Insertamos la cita (o creamos el documento si no existe)
            await PatientHistory.updateOne(
                { patientEmail: f.patient_email },
                {
                    $set: { patientName: f.patient_name },
                    $push: { appointments: appointmentObj }
                },
                { upsert: true }
            )
        }

        await cliente.query('COMMIT')

        // Conteo de historiales únicos en Mongo
        const historiales = await PatientHistory.countDocuments()

        const estadisticas = {
            patients:    pacientes,
            doctors:     doctores,
            insurances:  seguros,
            appointments: citas,
            histories:   historiales,
            csvPath,
        }

        console.log('✅ Migración terminada:', estadisticas)
        return estadisticas

    } catch (error) {
        await cliente.query('ROLLBACK')
        console.error(' Error en la migración, se hizo ROLLBACK:', error.message)
        throw error
    } finally {
        cliente.release()
    }
}