import { Router } from 'express'
import { getPatientHistory } from '../services/patientService.js'

const router = Router()

router.get('/:email/history', async (req, res) => {
    try {
        const { email } = req.params

        if (!email || !email.includes('@')) {
            return res.status(400).json({
                ok: false,
                error: 'Formato de email invalido'
            })
        }

        const history = await getPatientHistory(email)

        if (!history) {
            return res.status(404).json({
                ok: false,
                error: 'Paciente no encontrado'
            })
        }

        res.status(200).json({
            ok: true,
            history
        })
    } catch (error) {
        console.error('Error al obtener historial de paciente:', error.message)
        res.status(500).json({
            ok: false,
            error: error.message
        })
    }
})

export default router
