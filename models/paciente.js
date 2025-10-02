const mongoose = require('mongoose');

const notaMedicaSchema = new mongoose.Schema({
    contenido: {
        type: String,
        required: true
    },
    fecha: {
        type: Date,
        default: Date.now
    }
});

const pacienteSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    apellido: {
        type: String,
        required: true
    },
    dni: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    telefono: {
        type: String,
        required: true
    },
    notasMedicas: [notaMedicaSchema]
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

// Método para generar el nombre completo
pacienteSchema.virtual('nombreCompleto').get(function() {
    return `${this.nombre} ${this.apellido}`;
});

// Índices para búsqueda rápida
pacienteSchema.index({ dni: 1 });
pacienteSchema.index({ email: 1 });
pacienteSchema.index({ apellido: 1 });

const Paciente = mongoose.model('Paciente', pacienteSchema);

module.exports = Paciente;