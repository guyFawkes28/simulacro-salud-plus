import { Router } from 'express'
import { migrarData } from '../services/migrationService.js'

const router = Router()

const CSV_PATH = process.env.CSV_PATH || './data/simulation_saludplus_data.csv'

// GET /api/simulacro — info del endpoint
router.get('/', (req, res) => {
    res.json({
        ok: true,
        message: 'Endpoint de migración SaludPlus',
        uso: 'POST /api/simulacro/migrate',
        body: { clearBefore: 'boolean (opcional) — borra datos existentes antes de migrar' }
    })
})

// POST /api/simulacro/migrate — ejecuta la migración desde el CSV
router.post('/migrate', async (req, res) => {
    const { clearBefore = false } = req.body

    try {
        const result = await migrarData(CSV_PATH, clearBefore)

        res.status(200).json({
            ok: true,
            message: 'Migración completada exitosamente',
            result
        })
    } catch (error) {
        console.error(' Error en la migración:', error.message)
        res.status(500).json({
            ok: false,
            error: error.message
        })
    }
})

export default router
