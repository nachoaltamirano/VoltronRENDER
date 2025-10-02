require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/admin');

async function createDefaultAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado a MongoDB');

        // Crear admin por defecto
        const adminData = {
            username: 'admin',
            password: 'admin123',
            email: 'admin@example.com'
        };

        // Verificar si ya existe un admin
        const existingAdmin = await Admin.findOne({ username: adminData.username });
        if (existingAdmin) {
            console.log('El usuario administrador ya existe');
            process.exit(0);
        }

        // Crear nuevo admin
        const admin = new Admin(adminData);
        await admin.save();
        
        console.log('Usuario administrador creado exitosamente');
        console.log('Username:', adminData.username);
        console.log('Password:', adminData.password);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

createDefaultAdmin();