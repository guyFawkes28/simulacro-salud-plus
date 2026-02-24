import pkg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const { Pool } = pkg

// Resolve path to init.sql relative to this file
const __dirname = dirname(fileURLToPath(import.meta.url))

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})

pool.on('connect', () => {
    console.log('✅ PostgreSQL connected')
})

pool.on('error', (error) => {
    console.error('❌ PostgreSQL error:', error.message)
})

// Run a SQL query using the pool
export const query = (text, params) => pool.query(text, params)

// Get a dedicated client for transactions — remember to call client.release() when done
export const getClient = () => pool.connect()

// Create all tables and indexes from init.sql — safe to call multiple times
export const initializeSchema = async () => {
    const sqlPath = join(__dirname, '..', '..', 'scripts', 'init.sql')
    const sql = readFileSync(sqlPath, 'utf8')
    await pool.query(sql)
    console.log('✅ PostgreSQL schema initialized')
}

// Wipe all rows and reset sequences — used by the migration when clearBefore = true
export const clearAllTables = async () => {
    await pool.query(
        'TRUNCATE TABLE appointments, patients, doctors, insurances RESTART IDENTITY CASCADE'
    )
    console.log('✅ PostgreSQL tables cleared')
}