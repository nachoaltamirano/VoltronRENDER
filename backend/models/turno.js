const mongoose = require('mongoose');

const turnoSchema = new mongoose.Schema({
    fecha: {
        type: Date,
        required: true
    },
    sede: {
        type: String,
        required: true
    },
    disponible: {
        type: Boolean,
        default: true
    },
    reserva: {
        nombre: String,
        apellido: String,
        edad: Number,
        motivo: String,
        pacienteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Paciente'
        },
        estado: {
            type: String,
            enum: ['pendiente', 'confirmada', 'rechazada'],
            default: 'pendiente'
        },
        mensajeAdmin: String,
        fechaReserva: {
            type: Date,
            default: Date.now
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    }
}, {
    timestamps: true
});

// Índices para búsquedas frecuentes
turnoSchema.index({ fecha: 1 });
turnoSchema.index({ sede: 1 });
turnoSchema.index({ createdBy: 1 });
turnoSchema.index({ 'reserva.estado': 1 });

// Métodos estáticos para manipulación de turnos
turnoSchema.statics.crear = async function(turnoData) {
    const turno = new this({
        fecha: turnoData.fecha,
        sede: turnoData.sede,
        createdBy: turnoData.created_by
    });
    await turno.save();
    return turno;
};

turnoSchema.statics.actualizarDisponibilidad = async function(id, disponible, adminId) {
    const turno = await this.findOneAndUpdate(
        { _id: id, createdBy: adminId },
        { disponible },
        { new: true }
    );
    return !!turno;
};

turnoSchema.statics.obtenerPorSede = async function(sede) {
    const query = {
        fecha: { $gte: new Date() },
        disponible: true
    };
    
    if (sede !== 'todas') {
        query.sede = sede;
    }

    return this.find(query).sort({ fecha: 1 });
};

turnoSchema.statics.obtenerTodos = async function(adminId) {
    return this.find({ createdBy: adminId }).sort({ fecha: 1 });
};

turnoSchema.statics.eliminar = async function(id, adminId) {
    const result = await this.deleteOne({ _id: id, createdBy: adminId });
    return result.deletedCount > 0;
};

turnoSchema.statics.validarTurno = async function(turnoId) {
    const turno = await this.findOne({
        _id: turnoId,
        disponible: true,
        fecha: { $gte: new Date() }
    });
    return !!turno;
};

turnoSchema.statics.obtenerReservasPendientes = async function() {
    return this.find({
        'reserva.estado': 'pendiente'
    })
    .sort({ 'reserva.fechaReserva': -1 });
};

turnoSchema.statics.actualizarEstadoReserva = async function(turnoId, estado, mensaje) {
    const turno = await this.findByIdAndUpdate(
        turnoId,
        {
            'reserva.estado': estado,
            'reserva.mensajeAdmin': mensaje,
            'reserva.fechaActualizacion': new Date()
        },
        { new: true }
    );

    if (!turno) {
        throw new Error('Turno no encontrado');
    }
    return { success: true, message: 'Estado actualizado correctamente' };
};

turnoSchema.statics.reservar = async function(turnoData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Validar datos requeridos
        if (!turnoData.turnoId || !turnoData.nombre || !turnoData.apellido || 
            !turnoData.edad || !turnoData.motivo) {
            throw new Error('Faltan datos requeridos para la reserva');
        }

        // Verificar y actualizar el turno en una sola operación
        const turno = await this.findOneAndUpdate(
            {
                _id: turnoData.turnoId,
                disponible: true,
                fecha: { $gte: new Date() }
            },
            {
                disponible: false,
                reserva: {
                    nombre: turnoData.nombre,
                    apellido: turnoData.apellido,
                    edad: turnoData.edad,
                    motivo: turnoData.motivo,
                    fechaReserva: new Date()
                }
            },
            { new: true, session }
        );

        if (!turno) {
            throw new Error('El turno seleccionado ya no está disponible');
        }

        await session.commitTransaction();
        return { success: true, message: 'Turno reservado exitosamente', turno };

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

const Turno = mongoose.model('Turno', turnoSchema);

module.exports = Turno;
