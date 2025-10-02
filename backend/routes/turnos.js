const express = require('express');
const router = express.Router();
const Turno = require('../models/turno');

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

module.exports = router;