require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require('path');

// Import routes
const adminRoutes = require('./routes/admin');
const turnosRoutes = require('./routes/turnos');
const pacientesRoutes = require('./routes/pacientes');
const diasDisponiblesRoutes = require('./routes/dias-disponibles');

// Import models
const Admin = require('./models/admin');
const Turno = require('./models/turno');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado a MongoDB exitosamente'))
  .catch(err => {
    console.error('Error conectando a MongoDB:', err);
    process.exit(1);
  });

// Middleware
// CORS configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL || 'https://tu-app.onrender.com']
        : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Auth middleware
const authenticateAdmin = (req, res, next) => {
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

// Admin login route (public)
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;

    try {
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
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Public routes
app.use('/api/dias-disponibles', diasDisponiblesRoutes);

// Route for checking turnos disponibles (public)
app.get('/api/turnos/disponibles', async (req, res) => {
    try {
        const { sede } = req.query;
        const turnos = await Turno.obtenerPorSede(sede || 'todas');
        res.json(turnos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route for reserving turnos (public)
app.post('/api/turnos', async (req, res) => {
    try {
        const resultado = await Turno.reservar(req.body);
        res.json(resultado);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Protected admin routes
app.use('/api/admin/turnos', authenticateAdmin, turnosRoutes);
app.use('/api/admin/pacientes', authenticateAdmin, pacientesRoutes);
app.use('/api/admin', authenticateAdmin, adminRoutes);

// Fallback route for SPA
app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
    } else {
        next();
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});