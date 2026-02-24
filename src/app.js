import 'dotenv/config'
import express from 'express'
import morgan from 'morgan'
import { initializeSchema } from './config/postgres.js'
import { conectarMongo } from './config/mongodb.js'
import simulacroRoutes from './routes/simulacro.js'
import doctorsRoutes from './routes/doctors.js'
import reportsRoutes from './routes/reports.js'
import patientsRoutes from './routes/patients.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(morgan('dev'))

app.get('/', (req, res) => {
    res.json({ ok: true, message: 'API SaludPlus en ejecución ' })
})

app.use('/api/simulacro', simulacroRoutes)
app.use('/api/doctors', doctorsRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/patients', patientsRoutes)

app.use((req, res) => {
    res.status(404).json({ ok: false, error: 'Endpoint no encontrado' })
})

const startServer = async () => {
    try {
        await conectarMongo()
        await initializeSchema()
        app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`))
    } catch (error) {
        console.error(' Error al iniciar el servidor:', error.message)
        process.exit(1)
    }
}

startServer()

export default app