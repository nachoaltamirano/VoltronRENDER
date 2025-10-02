const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const Turno = require('../models/turno');

// Middleware de autenticación
const authenticateAdmin = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.adminId);
        if (!admin) {
            return res.status(401).json({ error: 'Admin not found' });
        }
        req.admin = admin;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Login de administrador
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username });
        
        if (!admin || !(await admin.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { adminId: admin._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear nuevo turno disponible
router.post('/turnos', authenticateAdmin, async (req, res) => {
    try {
        const { fecha, sede } = req.body;
        const turno = new Turno({
            fecha,
            sede,
            createdBy: req.admin._id
        });
        
        await turno.save();
        res.json(turno);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener todos los turnos del admin
router.get('/turnos', authenticateAdmin, async (req, res) => {
    try {
        const turnos = await Turno.getTurnosAdmin(req.admin._id);
        res.json(turnos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener reservas pendientes
router.get('/reservas', authenticateAdmin, async (req, res) => {
    try {
        const reservas = await Turno.getReservasPendientes();
        res.json(reservas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar estado de una reserva
router.put('/reservas/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, mensaje } = req.body;
        
        if (!['confirmada', 'rechazada'].includes(estado)) {
            return res.status(400).json({ error: 'Estado inválido' });
        }

        const turno = await Turno.findById(id);
        if (!turno) {
            return res.status(404).json({ error: 'Turno no encontrado' });
        }

        await turno.actualizarEstadoReserva(estado, mensaje);
        res.json({ message: 'Estado actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar turno
router.delete('/turnos/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const turno = await Turno.findOneAndDelete({ 
            _id: id, 
            createdBy: req.admin._id 
        });
        
        if (!turno) {
            return res.status(404).json({ error: 'Turno no encontrado' });
        }
        
        res.json({ message: 'Turno eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;