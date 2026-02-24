import 'dotenv/config'
import express from 'express'
import morgan from 'morgan'
import { initializeSchema } from './config/postgres.js'
import { conectarMongo } from './config/mongodb.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(morgan('dev'))

app.get('/', (req, res) => {
    res.json({ ok: true, message: 'Salu plus api' })
})

app.use((req, res) => {
    res.status(404).json({ ok: false, error: 'Endpoint en construcion' })
})

const startServer = async () => {
    try {
        await conectarMongo()
        await initializeSchema()
        app.listen(PORT, () => console.log(` http://localhost:${PORT}`))
    } catch (error) {
        console.error(' error', error.message)
        process.exit(1)
    }
}

startServer()

export default app