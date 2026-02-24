import mongoose from "mongoose"

export const conectarMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log(' Conectado a MongoDB')
    } catch (error) {
        console.error(' Error de conexión a MongoDB:', error.message)
        process.exit(1)
    }
}