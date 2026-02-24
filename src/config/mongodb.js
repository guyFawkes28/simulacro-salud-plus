import mongoose from "mongoose"

export const conectarMongo = async () => {

    try {

        await mongoose.connect(process.env.MONGO_URI)

        console.log("mongo melos")
        
    } catch (error) {

        console.error("mongo malo", error.message)

        process.exit(1)
        
    }
    
}