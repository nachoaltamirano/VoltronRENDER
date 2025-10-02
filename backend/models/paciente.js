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
  edad: Number,
  altura: Number,
  peso: Number,
  telefono: String,
  notasMedicas: [notaMedicaSchema]
}, {
  timestamps: true
});

// Métodos estáticos
pacienteSchema.statics.crear = async function(paciente) {
  return await this.create(paciente);
};

pacienteSchema.statics.obtenerTodos = async function() {
  return await this.find().sort({ apellido: 1, nombre: 1 });
};

pacienteSchema.statics.obtenerPorId = async function(id) {
  return await this.findById(id);
};

// Método estático para eliminar paciente y actualizar turnos relacionados
pacienteSchema.statics.eliminar = async function(id) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Primero obtener el paciente para asegurarnos que existe
    const paciente = await this.findById(id).session(session);
    if (!paciente) {
      await session.abortTransaction();
      return false;
    }

    // Importar modelo Turno
    const Turno = require('./turno');

    // Actualizar turnos donde este paciente tiene reservas
    await Turno.updateMany(
      { 'reserva.pacienteId': id },
      {
        $unset: { reserva: 1 },
        $set: { disponible: true }
      },
      { session }
    );

    // Eliminar el paciente
    await this.findByIdAndDelete(id).session(session);

    // Todo salió bien, confirmar la transacción
    await session.commitTransaction();
    return true;
  } catch (error) {
    // Si hay error, revertir todo
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Métodos de instancia
pacienteSchema.methods.agregarNota = async function(contenido) {
  this.notasMedicas.push({ contenido });
  return await this.save();
};

pacienteSchema.methods.obtenerNotas = function() {
  return this.notasMedicas.sort((a, b) => b.fecha - a.fecha);
};

const Paciente = mongoose.model('Paciente', pacienteSchema);
module.exports = Paciente;