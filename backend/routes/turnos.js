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
        const { nombre, apellido, repetirMensualmente, numeroSesiones, fecha, sede } = req.body;

        console.log('Recibida solicitud para asignar turno:', {
            id,
            nombre,
            apellido,
            repetirMensualmente,
            numeroSesiones,
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
        if (repetirMensualmente) {
            try {
                const fechaBase = new Date(fecha);
                const sedeAUsar = turno.sede || sede;
                
                console.log('Creando turnos semanales con:', {
                    fechaBase,
                    sede: sedeAUsar,
                    numeroSesiones
                });

                // Usar el número de sesiones especificado (mínimo 1, máximo 52)
                const numSesiones = Math.min(Math.max(parseInt(numeroSesiones) || 1, 1), 52);
                
                // Crear turnos semanales (i comienza en 1 porque el turno original es la primera sesión)
                for (let i = 1; i < numSesiones; i++) {
                    const nuevaFecha = new Date(fechaBase);
                    // Agregar 7 días (una semana) por cada iteración
                    nuevaFecha.setDate(fechaBase.getDate() + (i * 7));
                    
                    // Verificar que no estamos creando un turno en un día pasado
                    if (nuevaFecha < new Date()) {
                        continue;
                    }

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

                    console.log('Creando nuevo turno semanal:', {
                        fecha: nuevaFecha,
                        sede: sedeAUsar
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