/* =================================================================================
   ARCHIVO: tickets_pendientes.js
   Lógica: Listado de tickets abiertos, lectura de contexto y envío de respuestas.
================================================================================= */

const API_TICKETS = `${API_BASE_URL_F}/admin_api.php`;
let moduloTicketsInicializado = false;

// 🔥 Memoria Global para guardar los tickets sin romper el HTML 🔥
let ticketsEnMemoria = []; 

// ==========================================
// 1. ESCUCHADOR DE NAVEGACIÓN
// ==========================================
document.addEventListener('moduloCargado', (e) => {
    if (e.detail.modulo === 'mod-tickets-pendientes') {
        inicializarModuloTickets();
        cargarTicketsPendientes();
    }
});

// ==========================================
// 2. INICIALIZACIÓN DEL MÓDULO Y UI
// ==========================================
function inicializarModuloTickets() {
    if (moduloTicketsInicializado) return;
    moduloTicketsInicializado = true;

    const seccion = document.getElementById('mod-tickets-pendientes');
    if (seccion && seccion.innerHTML.trim() === "") {
        
        // Estilos Premium inyectados
        const estilosTickets = `
            <style>
                .tickets-header-container {
                    display: flex; justify-content: space-between; align-items: center; 
                    margin-bottom: 25px; flex-wrap: wrap; gap: 15px;
                }
                .tickets-title {
                    margin: 0; color: var(--text-main); font-size: 1.8rem; 
                    font-family: 'Righteous', cursive; letter-spacing: 1px; display: flex; align-items: center; gap: 10px;
                }
                .btn-refresh-tickets {
                    background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); 
                    padding: 8px 15px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px;
                    transition: all 0.2s ease; font-weight: 600; box-shadow: var(--shadow-sm);
                }
                .btn-refresh-tickets:hover {
                    background: var(--bg-dark); border-color: var(--accent); color: var(--accent);
                }
                
                .tickets-grid {
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;
                }
                
                .ticket-card {
                    background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; 
                    padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); transition: transform 0.2s, box-shadow 0.2s;
                    display: flex; flex-direction: column; position: relative; overflow: hidden;
                }
                .ticket-card:hover {
                    transform: translateY(-4px); box-shadow: 0 8px 25px rgba(139, 92, 246, 0.1);
                    border-color: rgba(139, 92, 246, 0.3);
                }
                
                /* Tira lateral de color para indicar estado (Naranja para pendiente) */
                .ticket-card::before {
                    content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: #f59e0b;
                }
                
                .ticket-card-header {
                    display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;
                }
                .ticket-user-info { display: flex; align-items: center; gap: 10px; }
                .ticket-avatar {
                    width: 40px; height: 40px; background: rgba(139, 92, 246, 0.1); color: #8b5cf6; 
                    border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;
                }
                .ticket-user-name { margin: 0; color: var(--text-main); font-weight: 800; font-size: 1.05rem; }
                .ticket-date { margin: 0; color: var(--text-muted); font-size: 0.75rem; }
                
                .ticket-id-badge {
                    background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-gray);
                    padding: 3px 8px; border-radius: 6px; font-family: monospace; font-size: 0.8rem; font-weight: bold;
                }
                
                .ticket-type {
                    display: inline-block; background: rgba(245, 158, 11, 0.1); color: #d97706; 
                    padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 800; 
                    text-transform: uppercase; margin-bottom: 12px; border: 1px solid rgba(245, 158, 11, 0.2);
                }
                
                .ticket-context {
                    background: var(--bg-dark); border: 1px dashed var(--border-color); border-radius: 8px;
                    padding: 15px; color: var(--text-main); font-size: 0.9rem; line-height: 1.5; margin-bottom: 20px;
                    flex-grow: 1; word-wrap: break-word; white-space: pre-wrap;
                }
                
                .btn-respond-ticket {
                    background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; 
                    padding: 12px; border-radius: 8px; font-weight: 800; font-size: 0.9rem; cursor: pointer; 
                    display: flex; align-items: center; justify-content: center; gap: 8px; 
                    box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2); transition: all 0.2s; width: 100%;
                }
                .btn-respond-ticket:hover {
                    box-shadow: 0 6px 15px rgba(16, 185, 129, 0.4); filter: brightness(1.1);
                }
                
                .empty-tickets-state {
                    grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: var(--bg-card); 
                    border: 1px dashed var(--border-color); border-radius: 12px;
                }
                .empty-tickets-state i { font-size: 4rem; color: var(--success); margin-bottom: 15px; opacity: 0.5; }
                .empty-tickets-state h3 { color: var(--text-main); margin-bottom: 5px; }
                .empty-tickets-state p { color: var(--text-muted); font-size: 0.95rem; }
            </style>
        `;

        seccion.innerHTML = `
            ${estilosTickets}
            
            <div class="tickets-header-container">
                <h2 class="tickets-title">
                    <i class="material-icons-round" style="color: #f59e0b;">support_agent</i> 
                    Bandeja de Soporte 
                    <span id="badge-contador-tickets" style="background: #ef4444; color: white; font-size: 0.9rem; padding: 2px 10px; border-radius: 12px; font-family: 'Inter', sans-serif;">0</span>
                </h2>
                <button class="btn-refresh-tickets" onclick="cargarTicketsPendientes()">
                    <i class="material-icons-round">refresh</i> Sincronizar
                </button>
            </div>

            <div id="contenedor-tickets-pendientes" class="tickets-grid">
                <div style="grid-column: 1/-1; text-align:center; padding:50px;">
                    <i class="material-icons-round" style="animation: spin 1s linear infinite; font-size: 3rem; color: var(--accent);">autorenew</i>
                    <p style="color: var(--text-gray); margin-top: 15px;">Buscando solicitudes pendientes...</p>
                </div>
            </div>
        `;
    }
}

// ==========================================
// 3. CARGAR DATOS DESDE EL SERVIDOR
// ==========================================
async function cargarTicketsPendientes() {
    const contenedor = document.getElementById('contenedor-tickets-pendientes');
    const badgeContador = document.getElementById('badge-contador-tickets');
    
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:50px;">
            <i class="material-icons-round" style="animation: spin 1s linear infinite; font-size: 3rem; color: var(--accent);">autorenew</i>
        </div>`;

    try {
        const payload = {
            accion: 'getTickets',
            usuario: sessionStorage.getItem('admin_user'),
            token: sessionStorage.getItem('admin_token')
        };

        const response = await fetch(API_TICKETS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const res = await response.json();

        if (res.success) {
            // Guardamos los tickets en la memoria global del script
            ticketsEnMemoria = res.datos.filter(t => t.estado === 'Abierto');
            
            // Actualizar el contador del header
            if (badgeContador) badgeContador.innerText = ticketsEnMemoria.length;

            renderizarTarjetasTickets(ticketsEnMemoria, contenedor);
        } else {
            contenedor.innerHTML = `<div class="empty-tickets-state" style="border-color: var(--danger);"><i class="material-icons-round" style="color: var(--danger);">error</i><h3 style="color: var(--danger);">Error</h3><p>${res.msg}</p></div>`;
        }
    } catch (error) {
        contenedor.innerHTML = `<div class="empty-tickets-state" style="border-color: var(--danger);"><i class="material-icons-round" style="color: var(--danger);">wifi_off</i><h3 style="color: var(--danger);">Sin Conexión</h3><p>Error de red al conectar con el servidor.</p></div>`;
    }
}

// ==========================================
// 4. RENDERIZAR INTERFAZ GRÁFICA
// ==========================================
function renderizarTarjetasTickets(tickets, contenedor) {
    contenedor.innerHTML = '';

    if (tickets.length === 0) {
        contenedor.innerHTML = `
            <div class="empty-tickets-state">
                <i class="material-icons-round">task_alt</i>
                <h3>¡Todo al día!</h3>
                <p>No tienes tickets de soporte pendientes por responder en este momento.</p>
            </div>
        `;
        return;
    }

    tickets.forEach(ticket => {
        // Formatear Fecha
        const fechaObj = new Date(ticket.hora);
        const fechaFormateada = fechaObj.toLocaleString('es-CO', { 
            day: '2-digit', month: 'short', year: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        });

        // Extraer la primera letra del usuario para el Avatar
        const inicial = ticket.usuario.charAt(0).toUpperCase();

        const card = document.createElement('div');
        card.className = 'ticket-card';
        card.innerHTML = `
            <div class="ticket-card-header">
                <div class="ticket-user-info">
                    <div class="ticket-avatar">${inicial}</div>
                    <div>
                        <h4 class="ticket-user-name">${ticket.usuario}</h4>
                        <p class="ticket-date"><i class="material-icons-round" style="font-size:0.8rem; vertical-align:middle;">schedule</i> ${fechaFormateada}</p>
                    </div>
                </div>
                <div class="ticket-id-badge">#${ticket.id}</div>
            </div>
            
            <div class="ticket-type"><i class="material-icons-round" style="font-size:0.8rem; vertical-align:middle;">label</i> ${ticket.tipo_solicitud || 'Soporte'}</div>
            
            <div class="ticket-context">
                ${ticket.contexto || 'Sin descripción detallada.'}
            </div>
            
            <button class="btn-respond-ticket" onclick="abrirModalRespuesta('${ticket.id}')">
                <i class="material-icons-round">reply</i> Redactar Respuesta
            </button>
        `;

        contenedor.appendChild(card);
    });
}

// ==========================================
// 5. LÓGICA DE RESPUESTA (SWEETALERT2 MEJORADO)
// ==========================================
window.abrirModalRespuesta = function(idTicket) {
    // 1. Buscamos el ticket completo en la memoria usando el ID
    const ticketSeleccionado = ticketsEnMemoria.find(t => t.id == idTicket);

    // 2. Si por algún motivo no lo encuentra, evitamos errores
    if (!ticketSeleccionado) {
        Swal.fire('Error', 'No se encontraron los datos de este ticket. Sincroniza la bandeja.', 'error');
        return;
    }

    const nombreUsuario = ticketSeleccionado.usuario;
    const tipoProblema = ticketSeleccionado.tipo_solicitud || 'Soporte General';

    // Determinar si estamos en modo oscuro
    const esModoOscuro = document.body.classList.contains('dark-mode');
    const bgColor = esModoOscuro ? '#1e293b' : '#ffffff';
    const textColor = esModoOscuro ? '#f8fafc' : '#0f172a';
    const textMuted = esModoOscuro ? '#94a3b8' : '#64748b';
    const inputBg = esModoOscuro ? '#0f172a' : '#f8fafc';
    const inputBorder = esModoOscuro ? '#334155' : '#e2e8f0';

    // Usamos SweetAlert2 para un modal de respuesta limpio y profesional
    Swal.fire({
        title: `<div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                    <i class="material-icons-round" style="color: var(--accent); font-size: 2rem;">support_agent</i>
                    <span style="font-family: 'Righteous', cursive; color: ${textColor}; font-size: 1.5rem;">Ticket #${idTicket}</span>
                </div>`,
        html: `
            <div style="text-align: left; margin-bottom: 20px; font-size: 0.95rem; background: ${inputBg}; padding: 15px; border-radius: 12px; border: 1px solid ${inputBorder};">
                <div style="margin-bottom: 8px;">
                    <strong style="color: ${textMuted}; font-size: 0.8rem; text-transform: uppercase;">Usuario:</strong><br>
                    <span style="color: ${textColor}; font-weight: 600;">${nombreUsuario}</span>
                </div>
                <div>
                    <strong style="color: ${textMuted}; font-size: 0.8rem; text-transform: uppercase;">Asunto:</strong><br>
                    <span style="color: var(--accent); font-weight: 700; background: var(--accent-light); padding: 2px 8px; border-radius: 6px; display: inline-block; margin-top: 4px;">${tipoProblema}</span>
                </div>
            </div>
            
            <div style="text-align: left;">
                <strong style="color: ${textColor}; font-size: 0.9rem; display: block; margin-bottom: 8px;">Tu Respuesta:</strong>
                <textarea id="swal-input-respuesta" placeholder="Escribe la solución detallada aquí..." 
                    style="width: 100%; min-height: 140px; background: ${inputBg}; color: ${textColor}; border: 1px solid ${inputBorder}; border-radius: 12px; padding: 15px; font-family: 'Inter', sans-serif; font-size: 0.95rem; resize: vertical; outline: none; transition: border-color 0.3s box-shadow 0.3s;"
                    onfocus="this.style.borderColor='var(--accent)'; this.style.boxShadow='0 0 0 3px var(--accent-light)';"
                    onblur="this.style.borderColor='${inputBorder}'; this.style.boxShadow='none';"></textarea>
            </div>
        `,
        background: bgColor,
        color: textColor,
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: 'transparent',
        confirmButtonText: '<i class="material-icons-round" style="vertical-align:middle; font-size: 1.2rem; margin-right: 5px;">send</i> Enviar Respuesta',
        cancelButtonText: 'Cancelar',
        buttonsStyling: false,
        customClass: {
            container: 'swal-top-layer',
            popup: 'swal-border-radius',
            confirmButton: 'swal-btn-confirm',
            cancelButton: 'swal-btn-cancel'
        },
        preConfirm: () => {
            const respuesta = document.getElementById('swal-input-respuesta').value.trim();
            if (!respuesta) {
                Swal.showValidationMessage('La respuesta no puede estar vacía');
                return false;
            }
            return respuesta;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            procesarRespuestaTicket(idTicket, result.value);
        }
    });

    // Inyectar estilos para los botones del modal si no existen
    if (!document.getElementById('swal-custom-styles')) {
        const style = document.createElement('style');
        style.id = 'swal-custom-styles';
        style.innerHTML = `
            .swal-border-radius { border-radius: 20px !important; border: 1px solid var(--border-color); box-shadow: var(--shadow-float) !important;}
            .swal-btn-confirm { background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2); transition: all 0.2s; margin-left: 10px; }
            .swal-btn-confirm:hover { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(16, 185, 129, 0.4); filter: brightness(1.1); }
            .swal-btn-cancel { background: transparent; color: var(--text-gray); border: 1px solid var(--border-color); padding: 12px 20px; border-radius: 10px; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; }
            .swal-btn-cancel:hover { background: var(--bg-dark); color: var(--danger); border-color: var(--danger); }
        `;
        document.head.appendChild(style);
    }
}

async function procesarRespuestaTicket(idTicket, textoRespuesta) {
    // Mostrar loader de guardando
    Swal.fire({ 
        title: 'Enviando...', 
        text: 'Cerrando el ticket en la base de datos',
        didOpen: () => Swal.showLoading(), 
        allowOutsideClick: false,
        background: '#ffffff', color: '#0f172a',
        customClass: { container: 'swal-top-layer' }
    });

    try {
        const payload = {
            accion: 'responderTicket',
            usuario: sessionStorage.getItem('admin_user'),
            token: sessionStorage.getItem('admin_token'),
            id: idTicket,
            respuesta: textoRespuesta
        };

        const response = await fetch(API_TICKETS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const res = await response.json();

        if (res.success) {
            Swal.fire({
                icon: 'success',
                title: '¡Respuesta Enviada!',
                text: 'El ticket ha sido cerrado correctamente.',
                timer: 2000,
                showConfirmButton: false,
                background: '#ffffff', color: '#0f172a',
                customClass: { container: 'swal-top-layer' }
            });
            // Recargar la tabla para que desaparezca la tarjeta
            cargarTicketsPendientes();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: res.msg,
                background: '#ffffff', color: '#0f172a',
                customClass: { container: 'swal-top-layer' }
            });
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error de Red',
            text: 'No se pudo enviar la respuesta. Intenta de nuevo.',
            background: '#ffffff', color: '#0f172a',
            customClass: { container: 'swal-top-layer' }
        });
    }
}
