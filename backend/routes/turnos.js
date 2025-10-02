const express = require('express');
const router = express.Router();
const Turno = require('../models/turno');
const jwt = require('jsonwebtoken');

// Auth middleware
const authenticateAdmin = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.adminId = decoded.adminId;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Crear un nuevo turno
router.post('/', async (req, res) => {
    try {
        const turnoData = {
            ...req.body,
            created_by: req.adminId // Viene del middleware de autenticación
        };
        const turno = await Turno.crear(turnoData);
        res.status(201).json(turno);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener todos los turnos del admin
router.get('/', async (req, res) => {
    try {
        const turnos = await Turno.obtenerTodos(req.adminId);
        res.json(turnos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar disponibilidad de un turno
router.patch('/:id/disponibilidad', async (req, res) => {
    try {
        const actualizado = await Turno.actualizarDisponibilidad(
            req.params.id,
            req.body.disponible,
            req.adminId
        );
        if (!actualizado) {
            return res.status(404).json({ error: 'Turno no encontrado' });
        }
        res.json({ message: 'Disponibilidad actualizada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar un turno
router.delete('/:id', async (req, res) => {
    try {
        const eliminado = await Turno.eliminar(req.params.id, req.adminId);
        if (!eliminado) {
            return res.status(404).json({ error: 'Turno no encontrado' });
        }
        res.json({ message: 'Turno eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener reservas pendientes
router.get('/reservas/pendientes', async (req, res) => {
    try {
        const reservas = await Turno.obtenerReservasPendientes();
        res.json(reservas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar estado de una reserva
router.patch('/:id/reserva/estado', async (req, res) => {
    try {
        const resultado = await Turno.actualizarEstadoReserva(
            req.params.id,
            req.body.estado,
            req.body.mensaje
        );
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Asignar paciente a un turno
router.put('/:id/asignar', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, repetirMensualmente, fecha, sede } = req.body;

        console.log('Recibida solicitud para asignar turno:', {
            id,
            nombre,
            apellido,
            repetirMensualmente,
            fecha,
            sede,
            adminId: req.adminId
        });

        if (!nombre || !apellido) {
            console.log('Error: Faltan nombre o apellido');
            return res.status(400).json({ error: 'Nombre y apellido son requeridos' });
        }

        const turno = await Turno.findById(id);
        if (!turno) {
            return res.status(404).json({ error: 'Turno no encontrado' });
        }

        // Crear array para almacenar todos los turnos creados
        const turnosCreados = [];

        // Actualizar el turno original
        turno.asignado = true;
        turno.nombre_asignado = nombre;
        turno.apellido_asignado = apellido;
        turno.disponible = false;
        await turno.save();
        turnosCreados.push(turno);

        // Si se solicita repetición semanal, crear turnos adicionales
        if (req.body.repetirMensualmente) { // mantenemos el nombre del campo para no romper compatibilidad
            try {
                const fechaBase = new Date(req.body.fecha);
                const sedeAUsar = turno.sede || sede;
                
                console.log('Creando turnos semanales con:', {
                    fechaBase: fechaBase.toISOString(),
                    sede: sedeAUsar,
                    totalTurnos: 12,
                    intervalo: '7 días'
                });

                // Crear turnos para las próximas 12 semanas (3 meses)
                for (let i = 1; i <= 12; i++) {
                    const nuevaFecha = new Date(fechaBase.getTime());
                    // Agregar 7 días (una semana) por cada iteración
                    nuevaFecha.setDate(nuevaFecha.getDate() + (i * 7));
                    
                    console.log(`Intentando crear turno para fecha: ${nuevaFecha.toISOString()}`);

                    // Mantener la misma hora del turno original
                    nuevaFecha.setHours(fechaBase.getHours());
                    nuevaFecha.setMinutes(fechaBase.getMinutes());
                    
                    const nuevoTurno = new Turno({
                        fecha: nuevaFecha,
                        sede: sedeAUsar,
                        asignado: true,
                        nombre_asignado: nombre,
                        apellido_asignado: apellido,
                        disponible: false,
                        es_turno_repetido: true,
                        turno_original_id: id,
                        createdBy: req.adminId
                    });

                    console.log(`Creando turno ${i} de 12:`, {
                        fecha: nuevaFecha.toISOString(),
                        sede: sedeAUsar,
                        semana: i,
                        diasAgregados: i * 7
                    });

                    await nuevoTurno.save();
                    turnosCreados.push(nuevoTurno);
                }
            } catch (error) {
                console.error('Error al crear turnos semanales:', error);
                throw new Error('Error al crear turnos semanales: ' + error.message);
            }
        }

        if (!turno) {
            return res.status(404).json({ error: 'Turno no encontrado' });
        }

        res.json({
            message: 'Turnos asignados correctamente',
            turnos: turnosCreados
        });
    } catch (error) {
        console.error('Error al asignar turno:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;