import { Router } from 'express'
import { getAllDoctors, getDoctorById, updateDoctor } from '../services/doctorService.js'

const router = Router()

router.get('/', async (req, res) => {
    try {
        const { specialty } = req.query
        const doctors = await getAllDoctors(specialty)

        res.status(200).json({
            ok: true,
            count: doctors.length,
            doctors
        })
    } catch (error) {
        console.error('Error al obtener medicos:', error.message)
        res.status(500).json({
            ok: false,
            error: error.message
        })
    }
})

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const doctor = await getDoctorById(parseInt(id))

        if (!doctor) {
            return res.status(404).json({
                ok: false,
                error: 'Medico no encontrado'
            })
        }

        res.status(200).json({
            ok: true,
            doctor
        })
    } catch (error) {
        console.error('Error al obtener medico:', error.message)
        res.status(500).json({
            ok: false,
            error: error.message
        })
    }
})

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { name, email, specialty } = req.body

        if (!name && !email && !specialty) {
            return res.status(400).json({
                ok: false,
                error: 'Debe proporcionar al menos un campo (name, email, specialty)'
            })
        }

        const updatedDoctor = await updateDoctor(parseInt(id), { name, email, specialty })

        if (!updatedDoctor) {
            return res.status(404).json({
                ok: false,
                error: 'Medico no encontrado'
            })
        }

        res.status(200).json({
            ok: true,
            message: 'Medico actualizado exitosamente',
            doctor: updatedDoctor
        })
    } catch (error) {
        console.error('Error al actualizar medico:', error.message)
        res.status(500).json({
            ok: false,
            error: error.message
        })
    }
})

export default router
