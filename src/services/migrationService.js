import fs from 'fs'
import csv from "csv-parser"
import {pool} from '../config/postgres.js'




const migrarData = async (csvPath) => {

    const filas= []

    return new Promise ((resolve,reject)=>{

        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (data)=> filas.push(data))
            .on('end',async ()=>{

                const cliente = await pool.connect()

                try {

                    await cliente.query('BEGIN')

                    for (const fila of filas){
                        
                        await cliente.query(
                            `INSERT INTO patients (name, email, phone, address) 
                             VALUES ($1, $2, $3, $4) 
                             ON CONFLICT (email) DO NOTHING`,
                            [fila.patient_name, fila.patient_email, fila.patient_phone, fila.patient_address]

                        )
                    }
                    
                } catch (error) {
                    
                }




            })






    })





}