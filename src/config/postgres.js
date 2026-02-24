import pkg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const { Pool } = pkg

// Resuelve la ruta a init.sql relativa a este archivo
const __dirname = dirname(fileURLToPath(import.meta.url))

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})

pool.on('connect', () => {
    console.log(' Conectado a PostgreSQL')
})

pool.on('error', (error) => {
    console.error('Error en PostgreSQL:', error.message)
})

// Ejecuta una consulta SQL usando el pool
export const query = (text, params) => pool.query(text, params)

// Obtiene un cliente dedicado para transacciones — recuerda llamar client.release() al terminar
export const getClient = () => pool.connect()

// Crea tablas e índices leyendo scripts/init.sql — seguro de ejecutar varias veces
export const initializeSchema = async () => {
    const sqlPath = join(__dirname, '..', '..', 'scripts', 'init.sql')
    const sql = readFileSync(sqlPath, 'utf8')
    await pool.query(sql)
    console.log(' Esquema de PostgreSQL inicializado')
}

// Wipe all rows and reset sequences — used by the migration when clearBefore = true
export const clearAllTables = async () => {
    await pool.query(
        'TRUNCATE TABLE appointments, patients, doctors, insurances RESTART IDENTITY CASCADE'
    )
    console.log(' Tablas de PostgreSQL limpiadas')
}