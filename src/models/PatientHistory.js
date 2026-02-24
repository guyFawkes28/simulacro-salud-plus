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
     // Embedding: guardamos todas las citas dentro del mismo documento
    // para leer el historial completo en una sola consulta sin joins
    appointments: [
        {
            appointmentId:       { type: String },
            date:                { type: String },
            doctorName:          { type: String },
            doctorEmail:         { type: String },
            specialty:           { type: String },
            treatmentCode:       { type: String },
            treatmentDescription:{ type: String },
            treatmentCost:       { type: Number },
            insuranceProvider:   { type: String },
            coveragePercentage:  { type: Number },
            amountPaid:          { type: Number }
        }
    ]
}, { 
    timestamps: true // Esto crea automáticamente campos "createdAt" y "updatedAt"
});

// Exportamos el modelo para usarlo en el servicio de migración y en las rutas
export default mongoose.model('PatientHistory', PatientHistorySchema);