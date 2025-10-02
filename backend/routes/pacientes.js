const express = require('express');
const router = express.Router();
const Paciente = require('../models/paciente');

// Obtener todos los pacientes
router.get('/', async (req, res) => {
    try {
        const pacientes = await Paciente.find().sort({ apellido: 1, nombre: 1 });
        res.json(pacientes);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener pacientes' });
    }
});

// Crear nuevo paciente
router.post('/', async (req, res) => {
    try {
        // Validar campos requeridos
        const { nombre, apellido, dni } = req.body;
        if (!nombre || !apellido || !dni) {
            return res.status(400).json({
                error: 'Faltan campos requeridos',
                details: {
                    nombre: !nombre ? 'El nombre es requerido' : null,
                    apellido: !apellido ? 'El apellido es requerido' : null,
                    dni: !dni ? 'El DNI es requerido' : null
                }
            });
        }

        const paciente = new Paciente(req.body);
        await paciente.save();
        
        return res.status(201).json({ 
            success: true,
            id: paciente._id, 
            message: 'Paciente creado exitosamente' 
        });
    } catch (error) {
        console.error('Error al crear paciente:', error);
        if (error.code === 11000) { // MongoDB duplicate key error
            return res.status(400).json({ error: 'Ya existe un paciente con ese DNI' });
        } else {
            return res.status(500).json({ error: 'Error al crear paciente', details: error.message });
        }
    }
});

// Obtener un paciente específico con sus notas
router.get('/:id', async (req, res) => {
    try {
        const paciente = await Paciente.findById(req.params.id);
        if (!paciente) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        
        // Devolver el paciente y sus notas en el formato esperado
        res.json({
            paciente: {
                _id: paciente._id,
                nombre: paciente.nombre,
                apellido: paciente.apellido,
                dni: paciente.dni,
                edad: paciente.edad,
                altura: paciente.altura,
                peso: paciente.peso,
                telefono: paciente.telefono,
                fecha_creacion: paciente.createdAt
            },
            notas: paciente.notasMedicas.sort((a, b) => b.fecha - a.fecha)
        });
    } catch (error) {
        console.error('Error al obtener paciente:', error);
        res.status(500).json({ error: 'Error al obtener paciente' });
    }
});

// Agregar nota médica
router.post('/:id/notas', async (req, res) => {
    try {
        console.log('Intentando agregar nota para paciente:', req.params.id);
        const paciente = await Paciente.findById(req.params.id);
        if (!paciente) {
            console.log('Paciente no encontrado');
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }

        const nuevaNota = {
            contenido: req.body.contenido,
            fecha: new Date()
        };
        paciente.notasMedicas.push(nuevaNota);

        await paciente.save();
        console.log('Nota agregada exitosamente');
        res.json({ 
            message: 'Nota agregada exitosamente',
            nota: nuevaNota
        });
    } catch (error) {
        console.error('Error al agregar nota:', error);
        res.status(500).json({ error: 'Error al agregar nota: ' + error.message });
    }
});

// Eliminar paciente y sus notas médicas
router.delete('/:id', async (req, res) => {
    try {
        console.log('Intentando eliminar paciente:', req.params.id);
        const eliminado = await Paciente.eliminar(req.params.id);
        if (eliminado) {
            console.log('Paciente eliminado exitosamente');
            res.json({ message: 'Paciente eliminado exitosamente' });
        } else {
            console.log('Paciente no encontrado');
            res.status(404).json({ error: 'Paciente no encontrado' });
        }
    } catch (error) {
        console.error('Error al eliminar paciente:', error);
        res.status(500).json({ error: 'Error al eliminar paciente: ' + error.message });
    }
});

module.exports = router;