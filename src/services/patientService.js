import { pool } from '../config/postgres.js'
import PatientHistory from '../models/PatientHistory.js'

// Obtiene el historial de un paciente desde MongoDB con resumen calculado
export const getPatientHistory = async (email) => {
    // Normalizar email a minúsculas para búsqueda insensible a mayúsculas
    const normalizedEmail = email.trim().toLowerCase()

    // Verificar si el paciente existe en PostgreSQL
    const patientResult = await pool.query(
        'SELECT * FROM patients WHERE LOWER(email) = $1',
        [normalizedEmail]
    )

    if (patientResult.rows.length === 0) {
        return null
    }

    const patient = patientResult.rows[0]

    // Obtener historial del paciente desde MongoDB
    const history = await PatientHistory.findOne({ 
        patientEmail: normalizedEmail 
    }).lean()

    if (!history || !history.appointments || history.appointments.length === 0) {
        return {
            patient: {
                name: patient.name,
                email: patient.email,
                phone: patient.phone,
                address: patient.address
            },
            appointments: [],
            summary: {
                totalAppointments: 0,
                totalSpent: 0,
                mostFrequentSpecialty: null
            }
        }
    }

    // Calcular estadísticas de resumen
    const totalSpent = history.appointments.reduce(
        (sum, app) => sum + (app.amountPaid || 0),
        0
    )

    // Contar frecuencias de especialidades
    const specialtyCount = {}
    history.appointments.forEach(app => {
        if (app.specialty) {
            specialtyCount[app.specialty] = (specialtyCount[app.specialty] || 0) + 1
        }
    })

    // Encontrar especialidad más frecuente
    let mostFrequentSpecialty = null
    let maxCount = 0
    
    for (const [specialty, count] of Object.entries(specialtyCount)) {
        if (count > maxCount) {
            maxCount = count
            mostFrequentSpecialty = specialty
        }
    }

    return {
        patient: {
            name: history.patientName,
            email: history.patientEmail,
            phone: patient.phone,
            address: patient.address
        },
        appointments: history.appointments.map(app => ({
            appointmentId: app.appointmentId,
            date: app.date,
            doctorName: app.doctorName,
            doctorEmail: app.doctorEmail,
            specialty: app.specialty,
            treatmentCode: app.treatmentCode,
            treatmentDescription: app.treatmentDescription,
            treatmentCost: app.treatmentCost,
            insuranceProvider: app.insuranceProvider,
            coveragePercentage: app.coveragePercentage,
            amountPaid: app.amountPaid
        })),
        summary: {
            totalAppointments: history.appointments.length,
            totalSpent: parseFloat(totalSpent.toFixed(2)),
            mostFrequentSpecialty
        }
    }
}
