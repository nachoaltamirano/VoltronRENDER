const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const db = new sqlite3.Database('turnos.db');
const Admin = require('./models/admin');

require('dotenv').config();
const mongoose = require('mongoose');
const AdminModel = require('./models/admin');

async function createDefaultAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado a MongoDB');

        // Datos del administrador por defecto
        const defaultAdmin = {
            username: 'admin',
            password: 'admin123', // Esta contraseña será hasheada automáticamente por el modelo
            email: 'admin@example.com'
        };

        // Verificar si ya existe un admin
        const existingAdmin = await Admin.findOne({ username: defaultAdmin.username });
        
        if (existingAdmin) {
            console.log('El usuario administrador ya existe');
        } else {
            // Crear nuevo admin
            const admin = new AdminModel(defaultAdmin);
            await admin.save();
            console.log('Usuario administrador creado exitosamente');
            console.log('Username:', defaultAdmin.username);
            console.log('Password:', defaultAdmin.password);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

createDefaultAdmin();