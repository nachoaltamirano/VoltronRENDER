const express = require('express');
const router = express.Router();
const Paciente = require('../models/paciente');
const auth = require('../middleware/auth');

// Get all patients
router.get('/', auth, async (req, res) => {
    try {
        const pacientes = await Paciente.find().sort({ apellido: 1, nombre: 1 });
        res.json(pacientes);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener pacientes' });
    }
});

// Get patient by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const paciente = await Paciente.findById(req.params.id);
        if (!paciente) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        res.json(paciente);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el paciente' });
    }
});

// Create new patient
router.post('/', auth, async (req, res) => {
    try {
        const paciente = new Paciente(req.body);
        await paciente.save();
        res.status(201).json(paciente);
    } catch (error) {
        if (error.code === 11000) {
            // MongoDB duplicate key error
            res.status(400).json({ error: 'El DNI o email ya está registrado' });
        } else {
            res.status(500).json({ error: 'Error al crear el paciente' });
        }
    }
});

// Update patient
router.put('/:id', auth, async (req, res) => {
    try {
        const paciente = await Paciente.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!paciente) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        res.json(paciente);
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ error: 'El DNI o email ya está registrado' });
        } else {
            res.status(500).json({ error: 'Error al actualizar el paciente' });
        }
    }
});

// Delete patient
router.delete('/:id', auth, async (req, res) => {
    try {
        const Turno = require('../models/turno');
        
        // Primero, eliminamos cualquier turno asociado al paciente
        await Turno.updateMany(
            { 'reserva.pacienteId': req.params.id },
            { 
                $unset: { reserva: 1 },
                $set: { disponible: true }
            }
        );

        // Luego eliminamos el paciente
        const paciente = await Paciente.findByIdAndDelete(req.params.id);
        if (!paciente) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }

        res.json({ message: 'Paciente eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar paciente:', error);
        res.status(500).json({ error: 'Error al eliminar el paciente: ' + error.message });
    }
});

// Add medical note
router.post('/:id/notas', auth, async (req, res) => {
    try {
        const paciente = await Paciente.findById(req.params.id);
        if (!paciente) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }

        paciente.notasMedicas.push({
            contenido: req.body.contenido,
            fecha: new Date()
        });

        await paciente.save();
        const nuevaNota = paciente.notasMedicas[paciente.notasMedicas.length - 1];
        res.json({ 
            message: 'Nota agregada exitosamente',
            nota: nuevaNota
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al agregar la nota médica' });
    }
});

// Get patient's medical notes
router.get('/:id/notas', auth, async (req, res) => {
    try {
        const paciente = await Paciente.findById(req.params.id);
        if (!paciente) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        res.json(paciente.notasMedicas);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las notas médicas' });
    }
});

module.exports = router;