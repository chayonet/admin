/* =================================================================================
   ARCHIVO: tickets_resueltos.js
   Lógica: Listado de tickets cerrados, lectura de contexto, resolución y visualización de adjuntos.
================================================================================= */

const API_TICKETS_RESUELTOS = `${API_BASE_URL_F}/admin_api.php`;
let moduloTicketsResueltosInicializado = false;

// 🔥 Memoria Global para guardar los tickets sin romper el HTML 🔥
let ticketsCerradosEnMemoria = [];

// ==========================================
// 1. ESCUCHADOR DE NAVEGACIÓN
// ==========================================
document.addEventListener('moduloCargado', (e) => {
    if (e.detail.modulo === 'mod-tickets-resueltos') {
        inicializarModuloTicketsResueltos();
        cargarTicketsResueltos();
    }
});

// ==========================================
// 2. INICIALIZACIÓN DEL MÓDULO Y UI
// ==========================================
function inicializarModuloTicketsResueltos() {
    if (moduloTicketsResueltosInicializado) return;
    moduloTicketsResueltosInicializado = true;

    const seccion = document.getElementById('mod-tickets-resueltos');
    if (seccion && seccion.innerHTML.trim() === "") {
        
        // Estilos Premium inyectados (Variante de color Verde/Cerrado)
        const estilosTicketsResueltos = `
            <style>
                .tickets-res-header-container {
                    display: flex; justify-content: space-between; align-items: center; 
                    margin-bottom: 25px; flex-wrap: wrap; gap: 15px;
                }
                .tickets-res-title {
                    margin: 0; color: var(--text-main); font-size: 1.8rem; 
                    font-family: 'Righteous', cursive; letter-spacing: 1px; display: flex; align-items: center; gap: 10px;
                }
                .btn-refresh-tickets-res {
                    background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); 
                    padding: 8px 15px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px;
                    transition: all 0.2s ease; font-weight: 600; box-shadow: var(--shadow-sm);
                }
                .btn-refresh-tickets-res:hover {
                    background: var(--bg-dark); border-color: var(--success); color: var(--success);
                }
                
                .tickets-res-grid {
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;
                }
                
                .ticket-res-card {
                    background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; 
                    padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); transition: transform 0.2s, box-shadow 0.2s;
                    display: flex; flex-direction: column; position: relative; overflow: hidden; opacity: 0.9;
                }
                .ticket-res-card:hover {
                    transform: translateY(-4px); box-shadow: 0 8px 25px rgba(16, 185, 129, 0.1);
                    border-color: rgba(16, 185, 129, 0.3); opacity: 1;
                }
                
                /* Tira lateral de color para indicar estado (Verde para resuelto) */
                .ticket-res-card::before {
                    content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--success);
                }
                
                .ticket-res-header {
                    display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;
                }
                .ticket-res-user-info { display: flex; align-items: center; gap: 10px; }
                .ticket-res-avatar {
                    width: 40px; height: 40px; background: rgba(16, 185, 129, 0.1); color: var(--success); 
                    border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;
                }
                .ticket-res-user-name { margin: 0; color: var(--text-main); font-weight: 800; font-size: 1.05rem; }
                .ticket-res-date { margin: 0; color: var(--text-muted); font-size: 0.75rem; }
                
                .ticket-res-badge {
                    background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: var(--success);
                    padding: 3px 8px; border-radius: 6px; font-family: monospace; font-size: 0.8rem; font-weight: bold;
                    display: flex; align-items: center; gap: 4px;
                }
                
                .ticket-res-type {
                    display: inline-block; background: var(--bg-dark); color: var(--text-gray); 
                    padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 800; 
                    text-transform: uppercase; margin-bottom: 12px; border: 1px solid var(--border-color);
                }
                
                .ticket-res-context {
                    background: var(--bg-dark); border: 1px dashed var(--border-color); border-radius: 8px;
                    padding: 15px; color: var(--text-main); font-size: 0.9rem; line-height: 1.5; margin-bottom: 20px;
                    flex-grow: 1; word-wrap: break-word; white-space: pre-wrap;
                    height: 80px; overflow: hidden; position: relative;
                }
                /* Degradado para cortar el texto largo */
                .ticket-res-context::after {
                    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 30px;
                    background: linear-gradient(transparent, var(--bg-dark));
                }
                
                .btn-view-ticket {
                    background: transparent; color: var(--text-main); border: 1px solid var(--border-color); 
                    padding: 12px; border-radius: 8px; font-weight: 800; font-size: 0.9rem; cursor: pointer; 
                    display: flex; align-items: center; justify-content: center; gap: 8px; 
                    transition: all 0.2s; width: 100%;
                }
                .btn-view-ticket:hover {
                    background: var(--bg-dark); border-color: var(--success); color: var(--success);
                }
                
                .empty-tickets-res-state {
                    grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: var(--bg-card); 
                    border: 1px dashed var(--border-color); border-radius: 12px;
                }
                .empty-tickets-res-state i { font-size: 4rem; color: var(--text-muted); margin-bottom: 15px; opacity: 0.5; }
                .empty-tickets-res-state h3 { color: var(--text-main); margin-bottom: 5px; }
                .empty-tickets-res-state p { color: var(--text-muted); font-size: 0.95rem; }
            </style>
        `;

        seccion.innerHTML = `
            ${estilosTicketsResueltos}
            
            <div class="tickets-res-header-container">
                <h2 class="tickets-res-title">
                    <i class="material-icons-round" style="color: var(--success);">check_circle</i> 
                    Casos Cerrados 
                    <span id="badge-contador-resueltos" style="background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-gray); font-size: 0.9rem; padding: 2px 10px; border-radius: 12px; font-family: 'Inter', sans-serif;">0</span>
                </h2>
                <button class="btn-refresh-tickets-res" onclick="cargarTicketsResueltos()">
                    <i class="material-icons-round">refresh</i> Actualizar
                </button>
            </div>

            <div id="contenedor-tickets-resueltos" class="tickets-res-grid">
                <div style="grid-column: 1/-1; text-align:center; padding:50px;">
                    <i class="material-icons-round" style="animation: spin 1s linear infinite; font-size: 3rem; color: var(--accent);">autorenew</i>
                    <p style="color: var(--text-gray); margin-top: 15px;">Recuperando historial de soporte...</p>
                </div>
            </div>
        `;
    }
}

// ==========================================
// 🔥 FUNCIÓN AUXILIAR: Convertir a Thumbnail
// ==========================================
function convertirAThumbnailTicketResuelto(url) {
    if (!url || url.trim() === "") return "";
    if (url.includes("uc?export=view&id=")) {
        return url.replace("uc?export=view&id=", "thumbnail?id=") + "&sz=w600";
    }
    return url;
}

// ==========================================
// 3. CARGAR DATOS DESDE EL SERVIDOR
// ==========================================
async function cargarTicketsResueltos() {
    const contenedor = document.getElementById('contenedor-tickets-resueltos');
    const badgeContador = document.getElementById('badge-contador-resueltos');
    
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:50px;">
            <i class="material-icons-round" style="animation: spin 1s linear infinite; font-size: 3rem; color: var(--success);">autorenew</i>
        </div>`;

    try {
        const payload = {
            accion: 'getTickets',
            usuario: sessionStorage.getItem('admin_user'),
            token: sessionStorage.getItem('admin_token')
        };

        const response = await fetch(API_TICKETS_RESUELTOS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const res = await response.json();

        if (res.success) {
            // Filtrar solo los tickets que tienen estado 'Cerrado' y guardarlos en memoria
            ticketsCerradosEnMemoria = res.datos.filter(t => t.estado === 'Cerrado');
            
            // Actualizar el contador del header
            if (badgeContador) badgeContador.innerText = ticketsCerradosEnMemoria.length;

            renderizarTarjetasResueltos(ticketsCerradosEnMemoria, contenedor);
        } else {
            contenedor.innerHTML = `<div class="empty-tickets-res-state" style="border-color: var(--danger);"><i class="material-icons-round" style="color: var(--danger);">error</i><h3 style="color: var(--danger);">Error</h3><p>${res.msg}</p></div>`;
        }
    } catch (error) {
        contenedor.innerHTML = `<div class="empty-tickets-res-state" style="border-color: var(--danger);"><i class="material-icons-round" style="color: var(--danger);">wifi_off</i><h3 style="color: var(--danger);">Sin Conexión</h3><p>Error de red al conectar con el servidor.</p></div>`;
    }
}

// ==========================================
// 4. RENDERIZAR INTERFAZ GRÁFICA
// ==========================================
function renderizarTarjetasResueltos(tickets, contenedor) {
    contenedor.innerHTML = '';

    if (tickets.length === 0) {
        contenedor.innerHTML = `
            <div class="empty-tickets-res-state">
                <i class="material-icons-round">inbox</i>
                <h3>Historial Vacío</h3>
                <p>Aún no hay tickets cerrados en el sistema.</p>
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
        card.className = 'ticket-res-card';
        card.innerHTML = `
            <div class="ticket-res-header">
                <div class="ticket-res-user-info">
                    <div class="ticket-res-avatar">${inicial}</div>
                    <div>
                        <h4 class="ticket-res-user-name">${ticket.usuario}</h4>
                        <p class="ticket-res-date"><i class="material-icons-round" style="font-size:0.8rem; vertical-align:middle;">schedule</i> ${fechaFormateada}</p>
                    </div>
                </div>
                <div class="ticket-res-badge"><i class="material-icons-round" style="font-size: 0.9rem;">done_all</i> #${ticket.id}</div>
            </div>
            
            <div class="ticket-res-type"><i class="material-icons-round" style="font-size:0.8rem; vertical-align:middle;">label</i> ${ticket.tipo_solicitud || 'Soporte'}</div>
            
            <div class="ticket-res-context">
                ${ticket.contexto || 'Sin descripción detallada.'}
            </div>
            
            <button class="btn-view-ticket" onclick="abrirModalVerRespuesta('${ticket.id}')">
                <i class="material-icons-round">visibility</i> Ver Resolución
            </button>
        `;

        contenedor.appendChild(card);
    });
}

// ==========================================
// 4.5 VISOR EXPANDIDO DE IMAGEN
// ==========================================
window.abrirImagenResueltaExpandida = function(urlCodificada) {
    const urlLimpia = decodeURIComponent(urlCodificada);
    
    // Transformamos a alta resolución para evitar descargas
    let urlAltaResolucion = urlLimpia;
    if (urlLimpia.includes("uc?export=view&id=")) {
        urlAltaResolucion = urlLimpia.replace("uc?export=view&id=", "thumbnail?id=") + "&sz=w2500";
    }

    const isDark = document.body.classList.contains('dark-mode');
    
    Swal.fire({
        imageUrl: urlAltaResolucion,
        imageAlt: 'Evidencia de soporte',
        showConfirmButton: false,
        showCloseButton: true,
        width: 'auto',
        padding: '10px',
        background: isDark ? '#1e293b' : '#ffffff',
        customClass: { popup: 'swal-border-radius' }
    });
};

// ==========================================
// 5. LÓGICA PARA VER RESOLUCIÓN (SWEETALERT2 PREMIUM)
// ==========================================
window.abrirModalVerRespuesta = function(idTicket) {
    // 1. Buscamos el ticket completo en la memoria usando el ID
    const ticketSeleccionado = ticketsCerradosEnMemoria.find(t => t.id == idTicket);

    // 2. Si no lo encuentra, evitamos errores
    if (!ticketSeleccionado) {
        Swal.fire('Error', 'No se encontraron los datos de este ticket. Sincroniza el historial.', 'error');
        return;
    }

    const nombreUsuario = ticketSeleccionado.usuario;
    const tipoProblema = ticketSeleccionado.tipo_solicitud || 'Soporte General';
    const contextoOriginal = ticketSeleccionado.contexto || 'Sin descripción detallada.';
    const textoRespuesta = ticketSeleccionado.respuesta || 'Sin respuesta registrada.';
    const imgUrlOriginal = ticketSeleccionado.imagen_adjunta || '';
    
    // Generar miniatura si hay imagen
    const imgUrlMiniatura = convertirAThumbnailTicketResuelto(imgUrlOriginal);
    
    // Restablecer saltos de línea para el HTML
    const contextoRender = contextoOriginal.replace(/\n/g, '<br>');
    const respuestaRender = textoRespuesta.replace(/\n/g, '<br>');

    // Detectar modo claro/oscuro para estilo adaptativo
    const esModoOscuro = document.body.classList.contains('dark-mode');
    const bgColor = esModoOscuro ? '#1e293b' : '#ffffff';
    const textColor = esModoOscuro ? '#f8fafc' : '#0f172a';
    const textMuted = esModoOscuro ? '#94a3b8' : '#64748b';
    const panelBgProblem = esModoOscuro ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)';
    const panelBgSolution = esModoOscuro ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)';
    const borderClaro = esModoOscuro ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    let modalHtml = `
        <div style="text-align: left; font-size: 0.95rem; font-family: 'Inter', sans-serif;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid ${borderClaro}; padding-bottom: 15px; margin-bottom: 20px;">
                <div>
                    <strong style="color: ${textMuted}; font-size: 0.8rem; text-transform: uppercase;">Usuario:</strong><br>
                    <span style="color: ${textColor}; font-weight: 700;">${nombreUsuario}</span>
                </div>
                <div style="text-align: right;">
                    <strong style="color: ${textMuted}; font-size: 0.8rem; text-transform: uppercase;">Asunto:</strong><br>
                    <span style="background: ${borderClaro}; color: ${textColor}; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 600;">${tipoProblema}</span>
                </div>
            </div>

            <div style="margin-bottom: 25px;">
                <strong style="color: var(--danger); display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">
                    <i class="material-icons-round" style="font-size: 1.2rem;">report_problem</i> Reporte Inicial
                </strong>
                <div style="background: ${panelBgProblem}; border-left: 4px solid var(--danger); padding: 15px; border-radius: 6px 12px 12px 6px; color: ${textColor}; font-size: 0.9rem; max-height: 150px; overflow-y: auto; line-height: 1.5;">
                    ${contextoRender}
                </div>
            </div>

            <div>
                <strong style="color: var(--success); display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">
                    <i class="material-icons-round" style="font-size: 1.2rem;">verified_user</i> Resolución Aplicada
                </strong>
                <div style="background: ${panelBgSolution}; border-left: 4px solid var(--success); padding: 15px; border-radius: 6px 12px 12px 6px; color: ${textColor}; font-weight: 500; font-size: 0.95rem; max-height: 200px; overflow-y: auto; line-height: 1.6;">
                    ${respuestaRender}
                </div>
            </div>
    `;

    // Si hay una imagen, creamos la miniatura cliqueable
    if (imgUrlOriginal !== "") {
        const urlSeguraParaClic = encodeURIComponent(imgUrlOriginal);
        modalHtml += `
            <div style="margin-top: 15px; text-align: center;">
                <span style="font-size: 0.8rem; color: var(--success); font-weight: bold; margin-bottom: 8px; display: block; text-transform: uppercase; letter-spacing: 1px;">
                    <i class="material-icons-round" style="font-size: 1.1rem; vertical-align: middle;">image</i> Evidencia Adjunta:
                </span>
                <img src="${imgUrlMiniatura}" 
                     style="max-width: 100%; max-height: 150px; border-radius: 8px; cursor: zoom-in; border: 1px solid var(--border-color); transition: all 0.3s ease; box-shadow: 0 4px 10px rgba(0,0,0,0.1); display: inline-block;" 
                     onclick="abrirImagenResueltaExpandida(\`${urlSeguraParaClic}\`)" 
                     onmouseover="this.style.transform='scale(1.03)'" 
                     onmouseout="this.style.transform='scale(1)'">
            </div>
        `;
    }

    modalHtml += `</div>`;

    Swal.fire({
        title: `<div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                    <i class="material-icons-round" style="color: var(--success); font-size: 2rem;">check_circle</i>
                    <span style="font-family: 'Righteous', cursive; color: ${textColor}; font-size: 1.5rem;">Caso #${idTicket} Cerrado</span>
                </div>`,
        html: modalHtml,
        background: bgColor,
        color: textColor,
        showConfirmButton: true,
        confirmButtonText: '<i class="material-icons-round" style="vertical-align: middle; margin-right: 5px;">done</i> Cerrar Visor',
        buttonsStyling: false,
        customClass: {
            container: 'swal-top-layer',
            popup: 'swal-border-radius',
            confirmButton: 'swal-btn-resuelto-close'
        }
    });

    // Inyectar estilos para los botones del modal resuelto si no existen
    if (!document.getElementById('swal-resueltos-styles')) {
        const style = document.createElement('style');
        style.id = 'swal-resueltos-styles';
        style.innerHTML = `
            .swal-btn-resuelto-close { background: var(--bg-dark); color: var(--text-main); border: 1px solid var(--border-color); padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm); transition: all 0.2s; width: 100%; margin-top: 10px; }
            .swal-btn-resuelto-close:hover { background: var(--border-color); transform: translateY(-2px); }
        `;
        document.head.appendChild(style);
    }
}
