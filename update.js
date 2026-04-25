/* update.js */

// 1. HISTORIAL DE VERSIONES
const historicoVersiones = [
    {
        version: "V.1.5.0",
        fecha: "24/04/2026",
        tipo: "Soporte Visual Premium",
        cambios: [
            "📸 <b>Evidencia Fotográfica:</b> Nuevo motor de soporte que te permite adjuntar capturas de pantalla y comprobantes al responder tickets de los clientes.",
            "🚀 <b>Visor Nativo:</b> Tanto tú como el cliente podrán ver las imágenes en una miniatura ultrarrápida y ampliarlas a pantalla completa sin que se descarguen en el dispositivo."
        ]
    },
    {
        version: "V.1.4.0",
        fecha: "18/04/2026",
        tipo: "Gestión Masiva Premium",
        cambios: [
            "🚀 <b>Acciones Masivas Avanzadas:</b> Se integró un nuevo panel inteligente al seleccionar cuentas. Ahora puedes Archivar, Reciclar al stock, Renovar o Eliminar múltiples cuentas al mismo tiempo con un solo clic.",
            "↩️ <b>Reversión de Ventas:</b> Nuevo botón para deshacer ventas fácilmente. El sistema devuelve automáticamente la cuenta a tu inventario y te indica el monto exacto a reembolsar al cliente.",
            "🛡️ <b>Selección Segura:</b> El sistema de selección masiva ahora es a prueba de errores; omite automáticamente las cuentas que ya están vendidas o en garantía para evitar modificaciones accidentales.",
            "📊 <b>Contador en Tiempo Real:</b> Agregamos un indicador visual que te muestra exactamente cuántas cuentas tienes seleccionadas antes de ejecutar cualquier acción en bloque."
        ]
    }
];

// 2. INYECCIÓN AUTOMÁTICA DEL HTML DEL MODAL
function inyectarEstructuraModal() {
    if (document.getElementById('update-overlay')) return; // Evitar duplicados

    const modalHTML = `
        <div id="update-overlay" class="update-overlay hidden" style="display: none;" onclick="if(event.target === this) cerrarModalUpdates()"></div>
        <div class="update-modal" id="update-modal">
            <div class="update-header">
                <div class="update-header-title">
                    <span class="material-icons-round">campaign</span>
                    <h2>Novedades del Sistema</h2>
                </div>
                <button class="btn-close-update" onclick="cerrarModalUpdates()">
                    <i class="material-icons-round">close</i>
                </button>
            </div>
            <div class="update-body">
                <div id="update-timeline"></div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 3. INYECCIÓN AUTOMÁTICA DEL CSS
const updateStyles = `
    /* OVERLAY Y MODAL */
    .update-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(5px); 
        z-index: 10000; transition: opacity 0.3s ease;
    }
    .update-overlay.hidden { opacity: 0; pointer-events: none; }
    
    .update-modal {
        position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -45%) scale(0.95);
        width: 90%; max-width: 600px; max-height: 85vh;
        background: var(--bg-card, #fff); border-radius: 16px; 
        border: 1px solid var(--border-color, #e2e8f0);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        display: flex; flex-direction: column;
        opacity: 0; pointer-events: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 11000;
    }
    body.dark-mode .update-modal {
        background: var(--bg-card, #1e293b);
        border: 1px solid rgba(139, 92, 246, 0.5);
        box-shadow: 0 0 40px rgba(59, 130, 246, 0.15), 0 0 20px rgba(139, 92, 246, 0.1);
    }
    .update-modal.active {
        opacity: 1; pointer-events: auto;
        transform: translate(-50%, -50%) scale(1);
    }
    
    /* HEADER DEL MODAL */
    .update-header {
        padding: 20px 25px; display: flex; justify-content: space-between; align-items: center;
        border-bottom: 1px solid var(--border-color, #e2e8f0); 
        background: var(--bg-dark, #f8fafc); border-radius: 16px 16px 0 0;
    }
    body.dark-mode .update-header { background: var(--bg-dark, #0f172a); border-color: var(--border-color, #334155); }
    
    .update-header-title { display: flex; align-items: center; gap: 12px; }
    .update-header-title span { 
        font-size: 1.8rem; 
        background: var(--accent-gradient, linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%));
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .update-header-title h2 { margin: 0; font-size: 1.2rem; font-weight: 800; color: var(--text-main, #0f172a); }
    body.dark-mode .update-header-title h2 { color: #f8fafc; }
    
    .btn-close-update {
        background: transparent; border: none; cursor: pointer; padding: 0;
        color: var(--text-muted, #94a3b8); transition: 0.2s; font-size: 1.5rem; 
    }
    .btn-close-update:hover { color: var(--danger, #ef4444); transform: rotate(90deg); }
    
    /* CUERPO Y TIMELINE */
    .update-body { padding: 25px; overflow-y: auto; }
    .update-body::-webkit-scrollbar { width: 6px; }
    .update-body::-webkit-scrollbar-thumb { background: var(--border-color, #e2e8f0); border-radius: 10px; }
    
    .timeline-item { position: relative; padding-left: 25px; margin-bottom: 25px; border-left: 2px solid var(--border-light, #f1f5f9); }
    body.dark-mode .timeline-item { border-left-color: #334155; }
    .timeline-item:last-child { margin-bottom: 0; border-left-color: transparent; }
    .timeline-dot { position: absolute; left: -6px; top: 0; width: 10px; height: 10px; border-radius: 50%; }
    
    .timeline-content {
        background: var(--bg-dark, #f8fafc); border: 1px solid var(--border-light, #f1f5f9);
        padding: 18px; border-radius: 12px; top: -10px; position: relative;
    }
    body.dark-mode .timeline-content { background: var(--bg-dark, #0f172a); border-color: #334155; }
    
    .timeline-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px; }
    .timeline-header h3 { margin: 0; font-size: 1.05rem; display: flex; align-items: center; gap: 8px; color: var(--text-main, #0f172a); font-weight: 800;}
    body.dark-mode .timeline-header h3 { color: #f8fafc; }
    
    .version-badge-tag { font-size: 0.65rem; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; font-weight: 800; }
    .timeline-date { color: var(--text-gray, #64748b); font-size: 0.75rem; font-weight: 700; }
    
    .timeline-list { list-style: none; padding: 0; margin: 0; }
    .timeline-list li { color: var(--text-gray, #64748b); font-size: 0.9rem; margin-bottom: 8px; display: flex; align-items: flex-start; gap: 8px; font-weight: 500; line-height: 1.4;}
    body.dark-mode .timeline-list li { color: #94a3b8; }
    .timeline-list li .material-icons-round { font-size: 1.2rem; color: var(--accent, #7c3aed); margin-top: -1px;}

    /* BADGE EN EL HEADER */
    .version-badge {
        background: var(--bg-card, #ffffff); border: 1px solid var(--border-color, #e2e8f0);
        padding: 6px 16px; border-radius: 10px; display: flex; flex-direction: column;
        align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s ease; user-select: none;
    }
    body.dark-mode .version-badge { background: #1e293b; border-color: #334155; }
    .version-badge:hover { border-color: var(--accent, #7c3aed); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25); }
    .v-num { color: var(--text-main, #0f172a); font-family: 'Righteous', cursive; font-size: 1rem; letter-spacing: 1px; line-height: 1.1; }
    body.dark-mode .v-num { color: #f8fafc; }
    .v-date { color: var(--text-gray, #64748b); font-size: 0.65rem; text-transform: uppercase; font-weight: 700; margin-top: 2px; }
    
    @media(max-width: 768px) {
        .version-badge { padding: 4px 10px; border-radius: 8px; }
        .v-num { font-size: 0.9rem; }
        .v-date { font-size: 0.55rem; }
    }
`;

// 4. LÓGICA DE ABRIR / CERRAR Y RENDERIZAR
function abrirModalUpdates() {
    const overlay = document.getElementById('update-overlay');
    const modal = document.getElementById('update-modal');
    const timeline = document.getElementById('update-timeline');
    
    if (!overlay || !modal || !timeline) return;

    timeline.innerHTML = historicoVersiones.map((v, index) => {
        let isLatest = index === 0;
        let dotColor = isLatest ? "var(--success, #10b981)" : "var(--accent, #7c3aed)";
        let badgeStyle = isLatest 
            ? "background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);" 
            : "background: rgba(124, 58, 237, 0.1); color: #7c3aed; border: 1px solid rgba(124, 58, 237, 0.3);";
        
        let listHTML = v.cambios.map(c => `<li><span class="material-icons-round">chevron_right</span> <span>${c}</span></li>`).join('');

        return `
            <div class="timeline-item">
                <div class="timeline-dot" style="box-shadow: 0 0 10px ${dotColor}; background: ${dotColor};"></div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <h3>${v.version} <span class="version-badge-tag" style="${badgeStyle}">${v.tipo}</span></h3>
                        <span class="timeline-date">${v.fecha}</span>
                    </div>
                    <ul class="timeline-list">
                        ${listHTML}
                    </ul>
                </div>
            </div>
        `;
    }).join('');

    overlay.style.display = 'block';
    setTimeout(() => {
        overlay.classList.remove('hidden');
        modal.classList.add('active');
    }, 10);
}

function cerrarModalUpdates() {
    const overlay = document.getElementById('update-overlay');
    const modal = document.getElementById('update-modal');
    if (overlay) {
        overlay.classList.add('hidden');
        setTimeout(() => overlay.style.display = 'none', 300);
    }
    if (modal) modal.classList.remove('active');
}

// 5. INICIALIZACIÓN (AQUÍ SUCEDE LA MAGIA)
document.addEventListener("DOMContentLoaded", () => {
    // 1. Inyectamos los estilos en el <head>
    const styleTag = document.createElement("style");
    styleTag.innerText = updateStyles;
    document.head.appendChild(styleTag);

    // 2. Inyectamos el HTML del Modal en el <body>
    inyectarEstructuraModal();

    // 3. Pintamos los datos en el botón del Header
    if (historicoVersiones.length > 0) {
        const ultimaVersion = historicoVersiones[0];
        const numEl = document.getElementById("badge-v-num");
        const dateEl = document.getElementById("badge-v-date");
        
        if (numEl) numEl.innerText = ultimaVersion.version;
        if (dateEl) dateEl.innerText = `ACT. ${ultimaVersion.fecha}`;
    }
});
