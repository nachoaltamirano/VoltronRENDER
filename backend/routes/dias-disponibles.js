const express = require('express');
const router = express.Router();
const Turno = require('../models/turno');

// Ruta para obtener los días que tienen turnos disponibles en un mes específico
router.get('/', async (req, res) => {
    try {
        const { mes, sede } = req.query;

        // Construir la fecha de inicio y fin del mes
        const [year, month] = mes.split('-');
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        // Construir la consulta base
        let query = {
            fecha: {
                $gte: startDate,
                $lte: endDate
            },
            disponible: true
        };

        // Si se especifica una sede, agregar al filtro
        if (sede && sede !== 'todas') {
            query.sede = sede;
        }

        // Obtener todos los turnos disponibles del mes
        const turnos = await Turno.find(query)
            .select('fecha')
            .lean();

        // Extraer los días únicos
        const diasDisponibles = [...new Set(
            turnos.map(turno => turno.fecha.toISOString().split('T')[0])
        )];

        res.json(diasDisponibles);
    } catch (error) {
        console.error('Error al obtener días disponibles:', error);
        res.status(500).json({ error: 'Error al obtener días disponibles' });
    }
});

module.exports = router;