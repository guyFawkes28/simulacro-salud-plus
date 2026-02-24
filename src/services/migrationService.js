import fs from 'fs'
import csv from "csv-parser"
import { pool } from '../config/postgres.js'
import PatientHistory from '../models/PatientHistory.js'

export const migrarData = async (csvPath) => {
    const filas = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (data) => filas.push(data))
            .on('end', async () => {
                // 1. En 'pg', el método correcto es .connect(), no .Connection()
                const cliente = await pool.connect();

                try {
                    // Iniciamos una transacción para que todo sea seguro
                    await cliente.query('BEGIN');

                    for (const fila of filas) {
                        // 1. Insertar Seguro y obtener ID
                        const resIns = await cliente.query(
                            `INSERT INTO insurances (name, coverage_percentage) 
         VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
                            [fila.insurance_provider, parseInt(fila.coverage_percentage) || 0]
                        );

                        // 2. Insertar Paciente y obtener ID
                        const resPat = await cliente.query(
                            `INSERT INTO patients (name, email, phone, address) 
         VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
                            [fila.patient_name, fila.patient_email, fila.patient_phone, fila.patient_address]
                        );

                        // 3. Insertar Doctor y obtener ID
                        const resDoc = await cliente.query(
                            `INSERT INTO doctors (name, email, specialty) 
         VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
                            [fila.doctor_name, fila.doctor_email, fila.specialty]
                        );

                        // 4. Insertar la Cita (usando los IDs obtenidos arriba)
                        await cliente.query(
                            `INSERT INTO appointments (appointment_id, appointment_date, patient_id, doctor_id, insurance_id, treatment_cost, amount_paid) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (appointment_id) DO NOTHING`,
                            [
                                fila.appointment_id,
                                fila.appointment_date,
                                resPat.rows[0].id,
                                resDoc.rows[0].id,
                                resIns.rows[0].id,
                                parseFloat(fila.treatment_cost),
                                parseFloat(fila.amount_paid)
                            ]
                        );

                        // 5. MongoDB: Historial (Este ya lo tienes melo)
                        await PatientHistory.updateOne(
                            { patientEmail: fila.patient_email },
                            {
                                $set: { patientName: fila.patient_name },
                                $addToSet: {
                                    appointments: {
                                        appointmentId: fila.appointment_id,
                                        doctorName: fila.doctor_name,
                                        amountPaid: parseFloat(fila.amount_paid)
                                    }
                                }
                            },
                            { upsert: true }
                        );
                    }

                    await cliente.query('COMMIT');
                    console.log("Migración terminada con éxito");
                    resolve(filas.length);
                } catch (error) {
                    await cliente.query('ROLLBACK');
                    console.error("Error migrando datos:", error);
                    reject(error);
                } finally {

                    cliente.release();
                }
            })
            .on('error', (err) => reject(err));
    });
};