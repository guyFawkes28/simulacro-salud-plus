import { pool } from '../config/postgres.js'
import PatientHistory from '../models/PatientHistory.js'

// Obtiene todos los médicos con filtro opcional por especialidad
export const getAllDoctors = async (specialty) => {
    let query = 'SELECT * FROM doctors'
    let params = []

    if (specialty) {
        query += ' WHERE LOWER(specialty) = LOWER($1)'
        params.push(specialty)
    }

    query += ' ORDER BY name ASC'

    const result = await pool.query(query, params)
    return result.rows
}

// Obtiene un médico por su ID
export const getDoctorById = async (id) => {
    const result = await pool.query(
        'SELECT * FROM doctors WHERE id = $1',
        [id]
    )
    return result.rows[0] || null
}

// Actualiza un médico en PostgreSQL y propaga cambios de nombre/email a MongoDB
export const updateDoctor = async (id, data) => {
    const client = await pool.connect()

    try {
        await client.query('BEGIN')

        // Obtener datos actuales del médico antes de actualizar
        const currentDoctor = await client.query(
            'SELECT * FROM doctors WHERE id = $1',
            [id]
        )

        if (currentDoctor.rows.length === 0) {
            await client.query('ROLLBACK')
            return null
        }

        const oldDoctor = currentDoctor.rows[0]

        // Actualizar médico en PostgreSQL
        const result = await client.query(
            `UPDATE doctors 
             SET name = COALESCE($1, name),
                 email = COALESCE($2, email),
                 specialty = COALESCE($3, specialty)
             WHERE id = $4
             RETURNING *`,
            [data.name, data.email, data.specialty, id]
        )

        const updatedDoctor = result.rows[0]

        // Propagar cambios a MongoDB si cambió nombre o email
        const nameChanged = data.name && data.name !== oldDoctor.name
        const emailChanged = data.email && data.email !== oldDoctor.email

        if (nameChanged || emailChanged) {
            // Actualizar historiales de pacientes con citas de este médico
            const updateFields = {}
            
            if (nameChanged) {
                updateFields['appointments.$[elem].doctorName'] = updatedDoctor.name
            }
            
            if (emailChanged) {
                updateFields['appointments.$[elem].doctorEmail'] = updatedDoctor.email
            }

            const mongoResult = await PatientHistory.updateMany(
                { 'appointments.doctorEmail': oldDoctor.email },
                { $set: updateFields },
                { 
                    arrayFilters: [{ 'elem.doctorEmail': oldDoctor.email }]
                }
            )

            console.log(`Propagados cambios de medico a ${mongoResult.modifiedCount} historiales`)
        }

        await client.query('COMMIT')
        return updatedDoctor

    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    } finally {
        client.release()
    }
}
