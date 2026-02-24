import pkg from 'pg'

const {Pool} =pkg

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})

pool.on('connect', () =>{

    console.log("conexion de postgress mela")
})

pool.on('error', (error)=>{
    console.error("error en el elefante ", error)
})