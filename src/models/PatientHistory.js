import mongoose from 'mongoose';

const PatientHistorySchema = new mongoose.Schema({
    patientEmail: { 
        type: String, 
        unique: true, 
        required: true, 
        index: true  
    },
    patientName: { 
        type: String, 
        required: true 
    },
     // NoSQL: Guardamos un ARRAY de objetos (citas)
    // Esto se llama "Embedding" o Incrustación.
    appointments: [
        {
            appointmentId: { type: String },
            date: { type: String },
            doctorName: { type: String },
            specialty: { type: String },
            treatmentDescription: { type: String },
            amountPaid: { type: Number }
        }
    ]
}, { 
    timestamps: true // Esto crea automáticamente campos "createdAt" y "updatedAt"
});

// Exportamos el modelo para usarlo en el servicio de migración y en las rutas
export default mongoose.model('PatientHistory', PatientHistorySchema);