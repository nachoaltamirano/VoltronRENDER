// Función para cargar turnos
async function loadTurnos() {
    try {
        const response = await fetch('/api/admin/turnos', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const turnos = await response.json();
        
        // Actualizar calendario
        calendar.removeAllEvents();
        turnos.forEach(turno => {
            // Verificar que el turno tiene ID
            if (!turno._id) {
                console.error('Turno sin ID:', turno);
                return;
            }

            // Normalizar el flag 'disponible'
            const disponibleFlag = (turno.disponible === 1 || turno.disponible === '1' || turno.disponible === true || turno.disponible === 'true');
            // Si el turno está reservado (no disponible), mostrar en rojo y como 'Ocupado'
            const ocupado = !disponibleFlag || !!turno.reserva_id;
            const title = ocupado && turno.reserva_id ? `${turno.reserva_nombre} ${turno.reserva_apellido} - ${turno.sede}` : `Turno ${turno.sede}`;
            const color = ocupado ? '#dc3545' : '#28a745';
            calendar.addEvent({
                id: turno._id,
                title: title,
                start: turno.fecha,
                backgroundColor: color,
                extendedProps: {
                    turnoId: turno._id,
                    sede: turno.sede,
                    disponible: disponibleFlag,
                    reserva: turno.reserva_id ? {
                        id: turno.reserva_id,
                        nombre: turno.reserva_nombre,
                        apellido: turno.reserva_apellido,
                        edad: turno.reserva_edad,
                        motivo: turno.reserva_motivo,
                        estado: turno.reserva_estado
                    } : null
                }
            });
        });

        // Actualizar lista
        const turnosList = document.getElementById('turnos-list');
        turnosList.innerHTML = turnos
            .map(turno => {
                const fechaTexto = new Date(turno.fecha).toLocaleString();
                const disponible = (turno.disponible === 1 || turno.disponible === '1' || turno.disponible === true || turno.disponible === 'true');
                
                // Si existe reserva vinculada, mostrar datos del cliente y marcar como ocupado
                if (turno.reserva_id) {
                    return `
                        <div class="card mb-2 border-danger">
                            <div class="card-body d-flex justify-content-between align-items-start">
                                <div>
                                    <strong>${fechaTexto}</strong><br>
                                    <small>${turno.sede} - <span class="badge bg-danger">Ocupado</span></small>
                                    <div class="mt-2">
                                        <strong>Cliente:</strong> ${turno.reserva_nombre} ${turno.reserva_apellido}<br>
                                        <strong>Edad:</strong> ${turno.reserva_edad || '-'}<br>
                                        <strong>Motivo:</strong> ${turno.reserva_motivo || '-'}
                                    </div>
                                </div>
                                <div class="text-end">
                                    <button class="btn btn-sm btn-outline-danger" onclick="deleteTurno('${turno._id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // Si el turno tiene reserva o no está disponible, mostrar 'Ocupado' y deshabilitar toggle
                const tieneReserva = !!turno.reserva_id;
                const ocupado = !disponible || tieneReserva;
                return `
                    <div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded border-${ocupado ? 'danger' : 'success'}">
                        <div>
                            <strong>${fechaTexto}</strong>
                            <br>
                            <small>${turno.sede} - <span class="badge bg-${ocupado ? 'danger' : 'success'}">${ocupado ? 'Ocupado' : 'Disponible'}</span></small>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-${ocupado ? 'secondary' : 'success'}" ${ocupado ? 'disabled' : ''}
                                    onclick="toggleDisponibilidad('${turno._id}', ${!disponible})">
                                ${ocupado ? 'Ocupado' : 'Disponible'}
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteTurno('${turno._id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            })
            .join('');
    } catch (error) {
        console.error('Error al cargar turnos:', error);
        Swal.fire('Error', 'No se pudieron cargar los turnos', 'error');
    }
}

// Función para eliminar turno
async function deleteTurno(id) {
    if (!id) {
        console.error('ID de turno no válido:', id);
        Swal.fire('Error', 'ID de turno no válido', 'error');
        return;
    }

    const result = await Swal.fire({
        title: '¿Eliminar turno?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545'
    });

    if (result.isConfirmed) {
        try {
            console.log('Intentando eliminar turno con ID:', id);
            const response = await fetch(`/api/admin/turnos/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al eliminar el turno');
            }

            await loadTurnos();
            Swal.fire('Eliminado', 'El turno ha sido eliminado', 'success');
        } catch (error) {
            console.error('Error al eliminar turno:', error);
            Swal.fire('Error', error.message || 'Error al eliminar el turno', 'error');
        }
    }
}

// Función para cambiar disponibilidad
async function toggleDisponibilidad(id, disponible) {
    if (!id) {
        console.error('ID de turno no válido:', id);
        return;
    }

    try {
        const response = await fetch(`/api/admin/turnos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ disponible })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al actualizar el turno');
        }

        await loadTurnos();
    } catch (error) {
        console.error('Error al actualizar turno:', error);
        Swal.fire('Error', error.message || 'Error al actualizar el turno', 'error');
    }
}