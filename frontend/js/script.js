let calendar = null;

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar AOS
    AOS.init({
        duration: 800,
        offset: 100,
        once: true
    });

    // Manejar el botón de selección de fecha
    const selectDateBtn = document.getElementById('select-date-btn');
    if (selectDateBtn) {
        selectDateBtn.addEventListener('click', () => {
            const sede = document.getElementById('sede').value;
            if (!sede) {
                Swal.fire({
                    title: 'Sede requerida',
                    text: 'Por favor, selecciona una sede primero',
                    icon: 'warning'
                });
                document.getElementById('sede').focus();
                return;
            }
            showCalendarModal(sede);
        });
    }

    // Manejar el envío del formulario
    const form = document.getElementById('reserva-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Obtener todos los valores del formulario
            const formData = {
                nombre: document.getElementById('nombre').value.trim(),
                apellido: document.getElementById('apellido').value.trim(),
                edad: document.getElementById('edad').value.trim(),
                sede: document.getElementById('sede-seleccionada').value || document.getElementById('sede').value,
                motivo: document.getElementById('motivo').value.trim(),
                fechaHora: document.getElementById('fecha-hora').value
            };

            // Validar campos
            if (!formData.nombre || !formData.apellido || !formData.edad || !formData.motivo || !formData.fechaHora || !formData.sede) {
                Swal.fire({
                    title: 'Campos incompletos',
                    text: 'Por favor, completa todos los campos y selecciona un turno',
                    icon: 'warning'
                });
                return;
            }

            // Formatear fecha y hora
            const fechaObj = new Date(formData.fechaHora);
            const dia = fechaObj.toLocaleDateString('es-AR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const hora = fechaObj.toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit'
            });

            // Crear mensaje de WhatsApp
            const mensaje = `Hola, soy ${formData.nombre} ${formData.apellido} tengo ${formData.edad} años y quiero reservar un turno en ${formData.sede} el dia ${dia} a las ${hora}. El motivo de mi consulta es ${formData.motivo}`;
            const whatsappUrl = `https://wa.me/1124033492?text=${encodeURIComponent(mensaje)}`;

            // Mostrar confirmación y abrir WhatsApp
            Swal.fire({
                title: '¡Turno Reservado!',
                icon: 'success',
                text: '¡Te redirigiremos a WhatsApp para confirmar!',
                showConfirmButton: true,
                confirmButtonText: 'Abrir WhatsApp',
                allowOutsideClick: false
            }).then((result) => {
                if (result.isConfirmed) {
                    window.open(whatsappUrl, '_blank');
                    // Limpiar formulario
                    form.reset();
                    document.getElementById('fecha-hora').value = '';
                    document.getElementById('sede-seleccionada').value = '';
                    document.getElementById('resumen-turno').classList.add('d-none');
                }
            });
        });
    }

    // Smooth Scroll para links de navegación
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 75,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Navbar Scroll Effect
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
});

// Función para mostrar el calendario modal
function showCalendarModal(sede) {
    // Eliminar modal existente si hay uno
    let existingModal = document.getElementById('calendar-modal-container');
    if (existingModal) {
        existingModal.remove();
    }

    // Crear el nuevo modal
    const modalContainer = document.createElement('div');
    modalContainer.id = 'calendar-modal-container';
    modalContainer.className = 'modal fade';
    modalContainer.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Seleccionar Día</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div id="calendar"></div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modalContainer);

    // Destruir el calendario existente si hay uno
    if (calendar) {
        calendar.destroy();
        calendar = null;
    }

    // Esperar a que el modal esté completamente visible antes de inicializar el calendario
    const modal = new bootstrap.Modal(modalContainer);
    modal.show();

    modalContainer.addEventListener('shown.bs.modal', function () {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'es',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth'
            },
            buttonText: {
                today: 'Hoy',
                month: 'Mes'
            },
            selectable: true,
            selectConstraint: 'businessHours',
            businessHours: {
                daysOfWeek: [1, 2, 3, 4, 5, 6],
                startTime: '08:00',
                endTime: '20:00',
            },
            selectMirror: true,
            dayCellDidMount: async function(info) {
                // Obtener los días disponibles para el mes actual
                const diasDisponibles = await getDiasDisponibles(
                    info.date.toISOString().split('T')[0].substring(0, 7),
                    sede
                );
                
                // Si el día actual tiene turnos disponibles, pintarlo de verde
                const fechaStr = info.date.toISOString().split('T')[0];
                if (diasDisponibles.includes(fechaStr)) {
                    info.el.style.backgroundColor = '#e8f5e9';
                    info.el.style.cursor = 'pointer';
                }
            },
            dateClick: async function(info) {
                // Cerrar el modal del calendario
                const modalInstance = bootstrap.Modal.getInstance(modalContainer);
                if (modalInstance) {
                    modalInstance.hide();
                }
                // Mostrar los horarios disponibles
                await showTimeSlots(info.date, sede);
            },
            eventClassNames: function(arg) {
                return ['rounded-pill'];
            }
        });

        // Renderizar el calendario
        calendar.render();
    });
}

// Función para obtener turnos disponibles
async function fetchTurnosDisponibles(fecha, sede) {
    try {
        let url = `/api/turnos/disponibles?fecha=${fecha.toISOString().split('T')[0]}`;
        if (sede !== 'todas') {
            url += `&sede=${sede}`;
        }

        console.log('Buscando turnos para:', {
            fecha: fecha.toLocaleDateString(),
            sede: sede,
            url: url
        });

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const turnos = await response.json();
        console.log('Turnos encontrados:', turnos);
        return turnos;
    } catch (error) {
        console.error('Error al obtener turnos:', error);
        alert('Error al obtener los turnos disponibles. Por favor, intenta nuevamente.');
        return [];
    }
}

// Función para obtener los días con turnos disponibles
async function getDiasDisponibles(mes, sede) {
    try {
        let url = `/api/turnos/dias-disponibles?mes=${mes}`;
        if (sede !== 'todas') {
            url += `&sede=${sede}`;
        }
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error al obtener días disponibles:', error);
        return [];
    }
}

// Función para mostrar el selector de horarios
async function showTimeSlots(date, sede) {
    const turnosDisponibles = await fetchTurnosDisponibles(date, sede);
    
    if (turnosDisponibles.length === 0) {
        alert('No hay turnos disponibles para la fecha seleccionada');
        return;
    }

    // Crear el contenedor de horarios si no existe
    let container = document.getElementById('time-slots-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'time-slots-container';
        container.className = 'time-slots-container';
        document.body.appendChild(container);
    } else {
        container.innerHTML = ''; // Limpiar el contenedor si ya existe
    }

    // Formato de fecha para mostrar
    const dateStr = date.toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    container.innerHTML = `
        <div class="time-slots-content">
            <div class="time-slots-header">
                <h4>${dateStr}</h4>
                <button type="button" class="btn-close" aria-label="Close"></button>
            </div>
            <div class="time-slots-grid"></div>
            <div class="time-slots-actions">
                <button type="button" class="btn btn-secondary" data-action="cancel">Cancelar</button>
                <button type="button" class="btn btn-primary" data-action="confirm" disabled>Confirmar</button>
            </div>
        </div>
    `;

    const grid = container.querySelector('.time-slots-grid');
    let selectedSlot = null;

    // Ordenar turnos por hora
    turnosDisponibles.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    console.log('Turnos a mostrar:', turnosDisponibles);

    turnosDisponibles.forEach(turno => {
        if (!turno.disponible) return; // Solo mostrar turnos disponibles

        const fecha = new Date(turno.fecha);
        const hora = fecha.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const div = document.createElement('div');
        div.className = 'time-slot';
        
        // Mostrar hora y sede si es necesario
        if (sede === 'todas') {
            div.innerHTML = `${hora}<br><small class="text-muted">Sede: ${turno.sede}</small>`;
        } else {
            div.textContent = hora;
        }
        
        div.dataset.turnoId = turno.id;
        div.dataset.fecha = turno.fecha;
        div.dataset.sede = turno.sede;
        div.dataset.hora = hora;
        
        div.addEventListener('click', () => {
            if (selectedSlot) {
                selectedSlot.classList.remove('selected');
            }
            div.classList.add('selected');
            selectedSlot = div;

            // Habilitar el botón de confirmar
            container.querySelector('[data-action="confirm"]').disabled = false;
        });

        grid.appendChild(div);
    });

    // Mostrar el contenedor con animación
    requestAnimationFrame(() => {
        container.classList.add('show');
    });

    // Manejar eventos de botones
    container.querySelector('.btn-close').addEventListener('click', () => closeTimeSlots());
    container.querySelector('[data-action="cancel"]').addEventListener('click', () => closeTimeSlots());
    container.querySelector('[data-action="confirm"]').addEventListener('click', () => {
        if (selectedSlot) {
            const turnoId = selectedSlot.dataset.turnoId;
            const fechaTurno = new Date(selectedSlot.dataset.fecha);
            const sedeSeleccionada = selectedSlot.dataset.sede || sede;

            try {
                // Obtener y formatear la fecha
                const fechaSinHora = fechaTurno.toLocaleDateString('es-AR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                
                const hora = selectedSlot.dataset.hora;
                const fechaFormateada = `${fechaSinHora} a las ${hora}`;
                
                console.log('Datos del turno:', {
                    fecha: fechaFormateada,
                    sede: sedeSeleccionada,
                    turnoId: selectedSlot.dataset.turnoId
                });
                
                // Guardar valores en los campos ocultos
                // IMPORTANTE: el backend busca la fecha exactamente como está almacenada en la BD,
                // por eso guardamos el valor crudo (ISO) que viene en dataset.fecha en lugar del texto formateado.
                document.getElementById('fecha-hora').value = selectedSlot.dataset.fecha;
                document.getElementById('sede-seleccionada').value = sedeSeleccionada;
                
                // Actualizar resumen del turno con mejor formato
                const resumenTurno = document.getElementById('resumen-turno');
                const resumenTexto = document.getElementById('resumen-turno-texto');
                if (resumenTurno && resumenTexto) {
                    resumenTexto.innerHTML = `
                        <div class="d-flex align-items-center">
                            <i class="fas fa-calendar-check text-success me-2"></i>
                            <div>
                                <strong>Día:</strong> ${fechaSinHora}<br>
                                <strong>Hora:</strong> ${hora}<br>
                                <strong>Sede:</strong> ${sedeSeleccionada}
                            </div>
                        </div>`;
                    resumenTurno.classList.remove('d-none');
                }
                
                // Agregar clase para mostrar que se ha seleccionado un turno
                document.querySelector('.form-card').classList.add('turno-seleccionado');
                
                closeTimeSlots();
            } catch (error) {
                console.error('Error al procesar el turno:', error);
                alert('Hubo un error al procesar el turno seleccionado. Por favor, intenta nuevamente.');
            }
        }
    });
}

// Función para cerrar el selector de horarios
function closeTimeSlots() {
    const container = document.getElementById('time-slots-container');
    if (container) {
        container.classList.remove('show');
        setTimeout(() => container.remove(), 300);
    }
}

// Función para manejar el envío del formulario
async function handleFormSubmit(e) {
    e.preventDefault(); // Prevenir el envío normal del formulario
    
    // Validar todos los campos requeridos
    const campos = {
        nombre: document.getElementById('nombre').value,
        apellido: document.getElementById('apellido').value,
        edad: document.getElementById('edad').value,
        motivo: document.getElementById('motivo').value,
        fechaHora: document.getElementById('fecha-hora').value
    };

    // Verificar que se haya seleccionado una sede
    const sede = document.getElementById('sede-seleccionada').value || document.getElementById('sede').value;
    if (!sede) {
        Swal.fire({
            title: 'Sede requerida',
            text: 'Por favor, selecciona una sede',
            icon: 'warning'
        });
        return;
    }

    // Validar campos y mostrar errores
    const errores = [];
    for (const [campo, valor] of Object.entries(campos)) {
        if (!valor) {
            errores.push(`El campo ${campo} es requerido`);
            document.getElementById(campo).classList.add('is-invalid');
        } else {
            document.getElementById(campo).classList.remove('is-invalid');
        }
    }

    if (errores.length > 0) {
        Swal.fire({
            title: 'Campos Requeridos',
            html: errores.join('<br>'),
            icon: 'warning',
            confirmButtonText: 'Entendido'
        });
        return;
    }

    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';

    // Obtener la sede del campo hidden si se seleccionó desde el modal de turnos
    const sedeSeleccionada = document.getElementById('sede-seleccionada').value;
    const sedeForm = document.getElementById('sede').value;
    
    const formData = {
        nombre: document.getElementById('nombre').value,
        apellido: document.getElementById('apellido').value,
        edad: document.getElementById('edad').value,
        sede: sedeSeleccionada || sedeForm,
        motivo: document.getElementById('motivo').value,
        fechaHora: document.getElementById('fecha-hora').value
    };

    try {
        // Agregar el estado "pendiente" a los datos
        formData.estado = 'pendiente';
        console.log('Enviando datos de reserva:', formData);
        const response = await fetch('/api/turnos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        console.log('Respuesta del servidor:', response.status, result);

        if (response.ok) {
            try {
                // Formatear la fecha
                const fechaObj = new Date(formData.fechaHora);
                const dia = fechaObj.toLocaleDateString('es-AR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                const hora = fechaObj.toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                // Crear mensaje con el formato exacto especificado
                const mensaje = `Hola, soy ${formData.nombre} ${formData.apellido} tengo ${formData.edad} años y quiero reservar un turno en ${formData.sede} el dia ${dia} a las ${hora}. El motivo de mi consulta es ${formData.motivo}`;
                const whatsappUrl = `https://wa.me/1124033492?text=${encodeURIComponent(mensaje)}`;

                // Mostrar SweetAlert2 de éxito y luego abrir WhatsApp
                Swal.fire({
                    title: '¡Turno Reservado!',
                    icon: 'success',
                    html: `
                        <div class="text-center mb-4">
                            <i class="fas fa-check-circle text-success fa-4x mb-3"></i>
                            <p class="mb-4">Te redirigiremos a WhatsApp para confirmar los detalles.</p>
                        </div>
                    `,
                    showConfirmButton: true,
                    confirmButtonText: 'Abrir WhatsApp',
                    allowOutsideClick: false
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.open(whatsappUrl, '_blank');
                    }
                });

                // Limpiar el formulario
                e.target.reset();
                document.getElementById('fecha-hora').value = '';
                document.getElementById('sede-seleccionada').value = '';
                document.getElementById('resumen-turno').classList.add('d-none');
            } catch (error) {
                console.error('Error al procesar el turno:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Hubo un error al procesar el turno. Por favor, intenta nuevamente.',
                    icon: 'error'
                });
            }

            // Animar limpieza del formulario
            const form = e.target;
            form.classList.add('fade-out');

            // Resetear formulario con animación
            setTimeout(() => {
                form.reset();
                document.getElementById('fecha-hora').value = '';
                document.getElementById('sede-seleccionada').value = '';
                document.getElementById('resumen-turno').classList.add('d-none');
                form.classList.remove('fade-out');
                
                // Scroll al principio del formulario
                form.scrollIntoView({ behavior: 'smooth' });
            }, 500);
        } else {
            // Mostrar mensaje de error más descriptivo
            const errorMessage = result?.message || result?.error || 'Error al procesar el turno';
            console.error('Reserva fallida:', errorMessage);
            await Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
                confirmButtonText: 'Entendido'
            });
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('Error al reservar turno:', error);
        // Mostrar error con animación
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger fade';
        errorAlert.style.position = 'fixed';
        errorAlert.style.top = '20px';
        errorAlert.style.right = '20px';
        errorAlert.style.zIndex = '1050';
        errorAlert.textContent = 'Hubo un error al reservar el turno. Por favor, intente nuevamente.';
        document.body.appendChild(errorAlert);
        
        // Mostrar alert con fade
        setTimeout(() => errorAlert.classList.add('show'), 100);
        
        // Remover alert después de 3 segundos
        setTimeout(() => {
            errorAlert.classList.remove('show');
            setTimeout(() => errorAlert.remove(), 150);
        }, 3000);
    } finally {
        // Restaurar botón
        submitButton.disabled = false;
        submitButton.innerHTML = 'Confirmar Reserva';
    }
}