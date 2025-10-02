// Asignar paciente a un turno
router.put('/:id/asignar', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido } = req.body;

        if (!nombre || !apellido) {
            return res.status(400).json({ error: 'Nombre y apellido son requeridos' });
        }

        const turno = await Turno.findOneAndUpdate(
            { _id: id, createdBy: req.admin._id },
            {
                asignado: true,
                nombre_asignado: nombre,
                apellido_asignado: apellido,
                disponible: false
            },
            { new: true }
        );

        if (!turno) {
            return res.status(404).json({ error: 'Turno no encontrado' });
        }

        res.json(turno);
    } catch (error) {
        console.error('Error al asignar turno:', error);
        res.status(500).json({ error: error.message });
    }
});