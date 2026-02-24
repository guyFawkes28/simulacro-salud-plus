import { Router } from 'express'
import { getRevenueReport } from '../services/reportService.js'

const router = Router()

router.get('/revenue', async (req, res) => {
    try {
        const { startDate, endDate } = req.query

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        
        if (startDate && !dateRegex.test(startDate)) {
            return res.status(400).json({
                ok: false,
                error: 'Formato de startDate invalido. Use YYYY-MM-DD'
            })
        }

        if (endDate && !dateRegex.test(endDate)) {
            return res.status(400).json({
                ok: false,
                error: 'Formato de endDate invalido. Use YYYY-MM-DD'
            })
        }

        const report = await getRevenueReport(startDate, endDate)

        res.status(200).json({
            ok: true,
            filters: {
                startDate: startDate || 'none',
                endDate: endDate || 'none'
            },
            report
        })
    } catch (error) {
        console.error('Error al generar reporte de recaudacion:', error.message)
        res.status(500).json({
            ok: false,
            error: error.message
        })
    }
})

export default router
