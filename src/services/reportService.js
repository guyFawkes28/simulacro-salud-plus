import { pool } from '../config/postgres.js'

// Obtiene reporte de recaudación agrupado por proveedor de seguro
export const getRevenueReport = async (startDate, endDate) => {
    let query = `
        SELECT 
            i.name AS insurance_provider,
            COUNT(a.id) AS total_appointments,
            SUM(a.amount_paid) AS total_revenue
        FROM appointments a
        LEFT JOIN insurances i ON a.insurance_id = i.id
    `

    const params = []
    const conditions = []

    if (startDate) {
        conditions.push(`a.appointment_date >= $${params.length + 1}`)
        params.push(startDate)
    }

    if (endDate) {
        conditions.push(`a.appointment_date <= $${params.length + 1}`)
        params.push(endDate)
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ')
    }

    query += `
        GROUP BY i.name
        ORDER BY total_revenue DESC
    `

    const result = await pool.query(query, params)

    // Calcular totales generales
    const overallTotals = result.rows.reduce(
        (acc, row) => ({
            totalAppointments: acc.totalAppointments + parseInt(row.total_appointments),
            totalRevenue: acc.totalRevenue + parseFloat(row.total_revenue || 0)
        }),
        { totalAppointments: 0, totalRevenue: 0 }
    )

    return {
        byInsurance: result.rows.map(row => ({
            insuranceProvider: row.insurance_provider || 'No Insurance',
            totalAppointments: parseInt(row.total_appointments),
            totalRevenue: parseFloat(row.total_revenue || 0)
        })),
        summary: {
            totalAppointments: overallTotals.totalAppointments,
            totalRevenue: parseFloat(overallTotals.totalRevenue.toFixed(2))
        }
    }
}
