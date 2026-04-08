/* =================================================================================
   ARCHIVO: movimientos.js
   Lógica: Listado, Agrupación, Borrado Masivo, Ordenamiento y Exportación a CSV.
================================================================================= */

const API_MOVIMIENTOS = `${API_BASE_URL_F}/admin_api.php`;

// Variables Globales del Motor
let movimientosDataOriginal = []; 
let movimientosInicializado = false; 

let movPaginaActual = 1;
let movTotalPaginas = 1;
let movLimitePagina = 15; 

// Variables para Ordenamiento Dinámico
let movColumnaOrden = 'fecha';
let movDireccionOrden = 'desc'; // 'desc' o 'asc'

// Estado para saber si vemos movimientos activos o papelera
let viendoPapeleraMovs = false;

// Array global que almacena el resultado actual del filtrado para poder exportarlo
let datosParaExportar = [];

// ==========================================
// 1. ESCUCHADOR DE NAVEGACIÓN Y GANCHOS
// ==========================================
document.addEventListener('moduloCargado', (e) => {
    if (e.detail.modulo === 'mod-analisis-ganancias') {
        inicializarModuloMovimientos();
        if(viendoPapeleraMovs) {
            cargarPapeleraMovimientos();
        } else {
            cargarMovimientosBase();
        }
        
        // 🚀 FIX: Forzar a la Papelera Global a inyectarse aquí
        if (typeof PapeleraEngine !== 'undefined') {
            setTimeout(() => {
                PapeleraEngine.inyectarBoton('mod-analisis-ganancias', 'movimientos');
            }, 150);
        }
    }
});

// ==========================================
// 2. INICIALIZACIÓN DEL MÓDULO Y CSS MÓVIL
// ==========================================
function inicializarModuloMovimientos() {
    if (movimientosInicializado) return; 
    movimientosInicializado = true;

    const seccionMovimientos = document.getElementById('mod-analisis-ganancias');
    if (seccionMovimientos && seccionMovimientos.innerHTML.trim() === "") {
        seccionMovimientos.innerHTML = `
            <style>
                @media (max-width: 768px) {
                    #tabla-movimientos, #tabla-movimientos thead, #tabla-movimientos tbody, 
                    #tabla-movimientos th, #tabla-movimientos td, #tabla-movimientos tr { display: block; }
                    #tabla-movimientos thead tr { position: absolute; top: -9999px; left: -9999px; }
                    #tabla-movimientos tr {
                        background: var(--bg-card); border: 1px solid var(--border-color);
                        border-radius: 12px; margin-bottom: 15px; padding: 15px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.05); position: relative;
                    }
                    #tabla-movimientos td {
                        border: none; border-bottom: 1px solid rgba(255,255,255,0.05);
                        position: relative; padding: 10px 0; padding-left: 40%;
                        text-align: right; min-height: 40px;
                    }
                    #tabla-movimientos td:last-child { border-bottom: 0; padding-bottom: 0; display: flex; justify-content: flex-end; gap: 10px; }
                    
                    /* Usamos data-label para hacerlo super dinámico en móvil y que no se rompa al ocultar la columna de checkbox */
                    #tabla-movimientos td::before {
                        content: attr(data-label);
                        position: absolute; top: 10px; left: 0; width: 35%;
                        font-weight: 700; color: var(--text-muted); text-align: left;
                        font-size: 0.85rem; text-transform: uppercase;
                    }
                }
                
                /* Estilos checkboxes tabla y filtros */
                .mov-cb { width: 18px; height: 18px; accent-color: var(--accent); cursor: pointer; }
                #mov-select-all { width: 18px; height: 18px; accent-color: var(--accent); cursor: pointer; }
                .filter-label { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 5px; display: block; }
                
                /* Estilos del Dropdown Autocomplete de Usuarios */
                .custom-dropdown-list { display: none; position: absolute; top: 100%; left: 0; width: 100%; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; margin-top: 5px; max-height: 220px; overflow-y: auto; z-index: 1000; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
                .custom-dropdown-item { padding: 10px 15px; cursor: pointer; border-bottom: 1px solid var(--border-light); color: var(--text-main); font-size: 0.9rem; transition: background 0.2s; display: flex; align-items: center; gap: 10px; }
                .custom-dropdown-item:last-child { border-bottom: none; }
                .custom-dropdown-item:hover { background: rgba(139, 92, 246, 0.08); color: #8b5cf6; }

                /* Estilo para los headers clickeables (Sort) */
                .sortable-th { cursor: pointer; transition: background 0.2s; user-select: none; }
                .sortable-th:hover { background: rgba(255,255,255,0.02); color: var(--accent); }
                .sort-icon-mov { margin-left: 4px; font-size: 0.8rem; display: inline-block; transition: transform 0.2s; }
            </style>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                <h2 id="titulo-movimientos" style="margin:0;"><i class="material-icons-round" style="vertical-align: bottom;">receipt_long</i> Historial Financiero</h2>
                
                <div id="contenedor-acciones-movimientos" style="display: flex; gap: 10px; align-items: center;">
                    <button onclick="exportarMovimientosCSV()" style="background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.3); padding: 8px 15px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 5px; box-shadow: var(--shadow-sm); font-weight: bold; transition: 0.2s;">
                        <i class="material-icons-round" style="font-size: 1.2rem;">download</i> <span class="hide-mobile">Exportar CSV</span>
                    </button>
                    
                    <button onclick="viendoPapeleraMovs ? cargarPapeleraMovimientos() : cargarMovimientosBase()" style="background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); padding: 8px 15px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 5px; box-shadow: var(--shadow-sm);">
                        <i class="material-icons-round" style="font-size: 1.2rem;">refresh</i> <span class="hide-mobile">Actualizar</span>
                    </button>
                </div>
            </div>

            <div style="background: var(--bg-card); padding: 15px 20px; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px;">
                
                <div style="flex: 1; min-width: 200px;">
                    <label class="filter-label">Buscar Texto Rápido:</label>
                    <div style="position: relative;">
                        <i class="material-icons-round" style="position: absolute; left: 10px; top: 10px; color: var(--text-muted); font-size: 1.2rem;">search</i>
                        <input type="text" id="buscar-movimiento" placeholder="Pedido o Motivo..." style="margin:0; padding-left: 35px; width: 100%;">
                    </div>
                </div>

                <div style="flex: 1; min-width: 150px; position: relative;" id="contenedor-filtro-usuario">
                    <label class="filter-label">Usuario:</label>
                    <div style="position: relative;">
                        <input type="text" id="filtro-usuario-mov" placeholder="Escribe para filtrar..." autocomplete="off" style="margin:0; width: 100%; padding-right: 35px;">
                        <i class="material-icons-round" style="position: absolute; right: 10px; top: 10px; color: var(--text-muted); pointer-events: none; font-size: 1.2rem;">arrow_drop_down</i>
                    </div>
                    <div id="lista-usuarios-mov" class="custom-dropdown-list"></div>
                </div>

                <div style="flex: 1; min-width: 130px;">
                    <label class="filter-label">Desde (Fecha):</label>
                    <input type="date" id="filtro-fecha-inicio" style="margin:0; width: 100%;">
                </div>

                <div style="flex: 1; min-width: 130px;">
                    <label class="filter-label">Hasta (Fecha):</label>
                    <input type="date" id="filtro-fecha-fin" style="margin:0; width: 100%;">
                </div>

                <div style="flex: 1; min-width: 140px;">
                    <label class="filter-label">Tipo Mov.:</label>
                    <select id="filtro-tipo-mov" style="margin:0; width: 100%;">
                        <option value="">Todos los tipos</option>
                        <option value="ingreso">Solo Ingresos (+)</option>
                        <option value="egreso">Solo Egresos (-)</option>
                    </select>
                </div>

                <div style="flex: 0; min-width: 80px;">
                    <label class="filter-label">Mostrar:</label>
                    <input type="number" id="filtro-limite-mov" value="15" min="1" style="margin:0; width: 100%;">
                </div>
            </div>

            <div id="contenedor-resumen-financiero"></div>

            <div style="overflow-x: auto; border-radius: 12px; box-shadow: var(--shadow-sm);">
                <table id="tabla-movimientos" style="margin-top: 0; width: 100%;">
                    <thead>
                        <tr>
                            <th id="th-cb-mov" style="width: 40px; text-align: center;"><input type="checkbox" id="mov-select-all" onchange="toggleSelectAllMovs(this)"></th>
                            <th class="sortable-th" onclick="ordenarMovimientos('fecha')">Fecha y Hora <span class="sort-icon-mov" data-col="fecha" style="color:var(--accent);">▼</span></th>
                            <th class="sortable-th" onclick="ordenarMovimientos('order_id')">Pedido / ID <span class="sort-icon-mov" data-col="order_id" style="color:var(--text-muted);">↕</span></th>
                            <th class="sortable-th" onclick="ordenarMovimientos('usuario')">Usuario Afectado <span class="sort-icon-mov" data-col="usuario" style="color:var(--text-muted);">↕</span></th>
                            <th>Detalle / Motivo</th>
                            <th class="sortable-th" onclick="ordenarMovimientos('monto')" style="text-align: right;">Monto Total <span class="sort-icon-mov" data-col="monto" style="color:var(--text-muted);">↕</span></th>
                            <th class="sortable-th" onclick="ordenarMovimientos('saldo')" style="text-align: right;">Saldo Final <span class="sort-icon-mov" data-col="saldo" style="color:var(--text-muted);">↕</span></th>
                            <th style="text-align:center;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tabla-movimientos-body"></tbody>
                </table>
            </div>
            
            <div style="margin-top: 15px; height: 40px;">
                <button id="btn-borrar-movs" onclick="window.borrarMovimientosSeleccionados()" style="display: none; background: var(--danger-bg); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.3); width: auto; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.1); padding: 8px 16px; border-radius: 8px; transition: all 0.3s ease; align-items: center; gap: 8px;">
                    <i class="material-icons-round" style="font-size: 1.2rem; vertical-align: middle;">delete_sweep</i> <span class="text-btn">Ocultar Selección en Papelera</span>
                </button>
            </div>

            <div id="paginacion-movimientos-container" style="display: flex; gap: 5px; margin-top: 20px; align-items: center; justify-content: center;"></div>
        `;
    }

    initEventosMovimientos();
}

// ==========================================
// 3. PETICIONES Y AGRUPACIÓN
// ==========================================
async function cargarMovimientosBase() {
    const tbody = document.getElementById('tabla-movimientos-body');
    if(!tbody) return;
    
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 40px;"><i class="material-icons-round" style="animation: spin 1s linear infinite; color: var(--accent); font-size: 2rem;">autorenew</i></td></tr>`;

    // Reseteamos el checkbox global al cargar nuevos datos
    const selectAll = document.getElementById('mov-select-all');
    if(selectAll) selectAll.checked = false;
    checkMovSelection();

    try {
        const response = await fetch(API_MOVIMIENTOS, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({
                accion: 'getFinanzasRaw',
                usuario: sessionStorage.getItem('admin_user'),
                token: sessionStorage.getItem('admin_token')
            })
        });
        
        const res = await response.json();
        if (res.success) procesarDatosAgrupados(res.datos);
        else mostrarToast("Error al cargar movimientos: " + res.msg, 'error'); 
        
    } catch (error) {
        mostrarToast("Error de conexión al cargar movimientos.", 'error');
    }
}

async function cargarPapeleraMovimientos() {
    const tbody = document.getElementById('tabla-movimientos-body');
    if(!tbody) return;
    
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 40px;"><i class="material-icons-round" style="animation: spin 1s linear infinite; color: #f59e0b; font-size: 2rem;">autorenew</i><p style="color:var(--text-gray); margin-top:10px;">Buscando en la papelera...</p></td></tr>`;

    try {
        const response = await fetch(API_MOVIMIENTOS, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({
                accion: 'getRegistrosPapelera',
                tabla: 'movimientos',
                usuario: sessionStorage.getItem('admin_user'),
                token: sessionStorage.getItem('admin_token')
            })
        });
        
        const res = await response.json();
        if (res.success) procesarDatosAgrupados(res.datos);
        else mostrarToast("Error: " + res.msg, 'error'); 
        
    } catch (error) {
        mostrarToast("Error de conexión.", 'error');
    }
}

function procesarDatosAgrupados(datosCrudos) {
    let agrupados = [];
    let mapaOrder = {};

    datosCrudos.forEach(mov => {
        if (mov.order_id) {
            if (!mapaOrder[mov.order_id]) {
                mapaOrder[mov.order_id] = { ...mov };
                mapaOrder[mov.order_id].monto_agrupado = 0;
                mapaOrder[mov.order_id].conteo_items = 0;
                mapaOrder[mov.order_id].saldo_final_orden = mov.saldo_nuevo; 
                // MUY IMPORTANTE: Guardamos todos los IDs internos de este pedido para poder borrarlos/restaurarlos juntos
                mapaOrder[mov.order_id].ids_agrupados = [];
                agrupados.push(mapaOrder[mov.order_id]);
            }
            mapaOrder[mov.order_id].monto_agrupado += (parseFloat(mov.movimiento) || 0);
            mapaOrder[mov.order_id].conteo_items++;
            mapaOrder[mov.order_id].ids_agrupados.push(mov.id);
        } else {
            mov.monto_agrupado = parseFloat(mov.movimiento) || 0;
            mov.saldo_final_orden = mov.saldo_nuevo;
            mov.ids_agrupados = [mov.id];
            agrupados.push(mov);
        }
    });

    agrupados.forEach(item => {
        if (item.conteo_items > 1 && !item.order_id.startsWith('REC-') && !item.order_id.startsWith('DES-')) {
            item.motivo = `Compra múltiple en tienda (${item.conteo_items} servicios)`;
        }
    });

    movimientosDataOriginal = agrupados;
    poblarFiltroUsuarios(); 
    ejecutarFiltrosYRenderMovimientos();
}

function poblarFiltroUsuarios() {
    const dataList = document.getElementById('lista-usuarios-mov');
    const inputUsr = document.getElementById('filtro-usuario-mov');
    if (!dataList || !inputUsr) return;

    const usuariosUnicos = [...new Set(movimientosDataOriginal.map(m => m.usuario))];
    usuariosUnicos.sort((a, b) => a.localeCompare(b));

    // Opción para limpiar
    let html = `<div class="custom-dropdown-item" data-val="" style="color: var(--text-gray); font-weight: bold;"><i class="material-icons-round" style="font-size: 1rem;">people</i> Todos los usuarios</div>`;
    
    // Opciones reales
    usuariosUnicos.forEach(usr => {
        html += `<div class="custom-dropdown-item" data-val="${usr}"><i class="material-icons-round" style="font-size: 1rem; color: var(--text-muted);">person</i> ${usr}</div>`;
    });
    
    dataList.innerHTML = html;

    // Asignar clics a los items del dropdown
    dataList.querySelectorAll('.custom-dropdown-item').forEach(item => {
        item.addEventListener('click', function() {
            inputUsr.value = this.dataset.val;
            dataList.style.display = 'none'; // Ocultar
            movPaginaActual = 1;
            ejecutarFiltrosYRenderMovimientos(); // Disparar filtro
        });
    });
}

// Lógica de Ordenamiento Dinámico al presionar Columnas
window.ordenarMovimientos = function(columna) {
    if (movColumnaOrden === columna) {
        movDireccionOrden = movDireccionOrden === 'asc' ? 'desc' : 'asc';
    } else {
        movColumnaOrden = columna;
        movDireccionOrden = 'desc'; // Por defecto al cambiar de columna, mayor a menor
    }

    // Actualizar iconos visualmente
    document.querySelectorAll('.sort-icon-mov').forEach(icon => {
        icon.innerHTML = '↕';
        icon.style.color = 'var(--text-muted)';
    });
    
    const activeIcon = document.querySelector(`.sort-icon-mov[data-col="${columna}"]`);
    if (activeIcon) {
        activeIcon.innerHTML = movDireccionOrden === 'asc' ? '▲' : '▼';
        activeIcon.style.color = 'var(--accent)';
    }

    ejecutarFiltrosYRenderMovimientos();
};

function ejecutarFiltrosYRenderMovimientos() {
    const filtroTexto = (document.getElementById('buscar-movimiento')?.value || '').toLowerCase().trim();
    const filtroTipo = (document.getElementById('filtro-tipo-mov')?.value || '');
    
    // Obtenemos el texto escrito en el input del usuario en minúsculas
    const filtroUsuario = (document.getElementById('filtro-usuario-mov')?.value || '').toLowerCase().trim();
    
    const dateStart = document.getElementById('filtro-fecha-inicio')?.value || '';
    const dateEnd = document.getElementById('filtro-fecha-fin')?.value || '';

    // 🔥 TRADUCTOR DE FECHAS
    const parseFechaSegura = (fechaStr) => {
        if (!fechaStr) return 0;
        let soloFecha = fechaStr.split(' ')[0]; 
        let tiempoObj = new Date();
        if (soloFecha.includes('-')) {
            let [y, m, d] = soloFecha.split('-');
            tiempoObj = new Date(y, m - 1, d);
        } else if (soloFecha.includes('/')) {
            let [d, m, y] = soloFecha.split('/');
            tiempoObj = new Date(y, m - 1, d);
        }
        if (fechaStr.includes(' ')) {
            let horaParts = fechaStr.split(' ')[1].split(':');
            tiempoObj.setHours(horaParts[0] || 0, horaParts[1] || 0, horaParts[2] || 0);
        }
        return tiempoObj.getTime();
    };

    let datosFiltrados = movimientosDataOriginal.filter(mov => {
        let matchTexto = true; let matchTipo = true; let matchUsuario = true; let matchDate = true;

        if (filtroTexto !== '') {
            let cadenaBusqueda = `${mov.usuario_que_realiza || ''} ${mov.motivo} ${mov.order_id || ''} ${mov.id}`.toLowerCase();
            matchTexto = cadenaBusqueda.includes(filtroTexto);
        }
        if (filtroTipo !== '') {
            const montoNum = parseFloat(mov.monto_agrupado) || 0;
            if (filtroTipo === 'ingreso') matchTipo = (montoNum > 0);
            if (filtroTipo === 'egreso') matchTipo = (montoNum < 0);
        }
        
        if (filtroUsuario !== '') { 
            matchUsuario = mov.usuario.toLowerCase().includes(filtroUsuario); 
        }

        if(dateStart || dateEnd) {
            let fObj = new Date(parseFechaSegura(mov.fecha));
            if(!isNaN(fObj.getTime())) {
                const mDate = fObj.toISOString().split('T')[0]; 
                if(dateStart && mDate < dateStart) matchDate = false;
                if(dateEnd && mDate > dateEnd) matchDate = false;
            }
        }
        
        return matchTexto && matchTipo && matchUsuario && matchDate;
    });

    // APLICAR ORDENAMIENTO (Sort) SOBRE LOS DATOS FILTRADOS
    datosFiltrados.sort((a, b) => {
        let valA, valB;
        
        switch(movColumnaOrden) {
            case 'fecha':
                valA = parseFechaSegura(a.fecha); valB = parseFechaSegura(b.fecha); break;
            case 'order_id':
                valA = (a.order_id || `M-${a.id}`).toLowerCase(); valB = (b.order_id || `M-${b.id}`).toLowerCase(); break;
            case 'usuario':
                valA = a.usuario.toLowerCase(); valB = b.usuario.toLowerCase(); break;
            case 'monto':
                valA = Math.abs(parseFloat(a.monto_agrupado) || 0); valB = Math.abs(parseFloat(b.monto_agrupado) || 0); break;
            case 'saldo':
                valA = parseFloat(a.saldo_final_orden) || 0; valB = parseFloat(b.saldo_final_orden) || 0; break;
            default:
                valA = parseFechaSegura(a.fecha); valB = parseFechaSegura(b.fecha);
        }

        if (valA < valB) return movDireccionOrden === 'asc' ? -1 : 1;
        if (valA > valB) return movDireccionOrden === 'asc' ? 1 : -1;
        return 0;
    });

    // Guardar los datos filtrados en la variable global para poder exportarlos luego
    datosParaExportar = [...datosFiltrados];

    let totalItems = datosFiltrados.length;
    movTotalPaginas = Math.ceil(totalItems / movLimitePagina) || 1;
    if (movPaginaActual > movTotalPaginas) movPaginaActual = movTotalPaginas;

    let startIndex = (movPaginaActual - 1) * movLimitePagina;
    let endIndex = startIndex + movLimitePagina;
    let datosPagina = datosFiltrados.slice(startIndex, endIndex);

    const tbody = document.getElementById('tabla-movimientos-body');
    tbody.innerHTML = '';
    renderPaginacionMovimientos(totalItems);

    // Esconder botón de borrado masivo por si cambiamos de página
    const btnBorrar = document.getElementById('btn-borrar-movs');
    if (btnBorrar) btnBorrar.style.display = 'none';

    // 🚀 LIBRERÍA DE INYECCIÓN (Avisa a movimientos2.js que debe recalcular sus tarjetas)
    document.dispatchEvent(new CustomEvent('datosMovimientosListos'));

    if (datosPagina.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 50px; color: var(--text-gray);">No se encontraron registros.</td></tr>`;
        return;
    }

    const fmtMoneda = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

    datosPagina.forEach((mov) => {
        let fFormat1 = mov.fecha;
        let fFormat2 = '';
        try {
            let fPura = mov.fecha.split(' ')[0];
            let fObj = new Date();
            if (fPura.includes('-')) {
                let [y, m, d] = fPura.split('-');
                fObj = new Date(y, m-1, d);
            } else if (fPura.includes('/')) {
                let [d, m, y] = fPura.split('/');
                fObj = new Date(y, m-1, d);
            }
            if(!isNaN(fObj.getTime())) {
                fFormat1 = fObj.toLocaleDateString('es-CO', {day:'2-digit', month:'short', year:'numeric'});
                fFormat2 = mov.fecha.includes(' ') ? mov.fecha.split(' ')[1] : '';
            }
        } catch(e){}

        const montoNum = parseFloat(mov.monto_agrupado) || 0;
        let montoClase = montoNum > 0 ? 'color: var(--success);' : 'color: var(--danger);';
        let signo = montoNum > 0 ? '+' : '';
        let montoFormat = `<strong style="${montoClase} font-size: 1.05rem;">${signo}${fmtMoneda.format(montoNum)}</strong>`;

        const saldoNum = parseFloat(mov.saldo_final_orden) || 0;
        let saldoFormat = `<span style="color: var(--text-main); font-family: monospace; font-size: 1.05rem;">${fmtMoneda.format(saldoNum)}</span>`;

        let pedidoFormat = mov.order_id 
            ? `<span class="stat-badge" style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6; border-color: rgba(139, 92, 246, 0.3); font-family: monospace; font-size: 0.9rem;">${mov.order_id}</span>` 
            : `<span style="color: var(--text-muted); font-size: 0.8rem;">Mov. #${mov.id}</span>`;

        let responsableFormat = mov.usuario_que_realiza ? `<br><span style="font-size: 0.75rem; color: var(--text-muted);">Por: <strong style="color: var(--text-gray);">${mov.usuario_que_realiza}</strong></span>` : '';

        // El checkbox oculta TODOS los registros asociados a ese pedido
        const idsStr = mov.ids_agrupados.join(',');
        let cbTd = `<td data-label="Sel." style="text-align: center;"><input type="checkbox" class="mov-cb" data-ids="${idsStr}" onchange="checkMovSelection()"></td>`;

        let btnDetalle = '';
        if (mov.order_id) {
            if(mov.order_id.startsWith('REC-') || mov.order_id.startsWith('DES-')) {
                const motivoCodificado = mov.motivo.replace(/"/g, '&quot;');
                btnDetalle = `<button class="btn-ver-detalle-pedido" data-order="${mov.order_id}" data-recarga="true" data-motivo="${motivoCodificado}" style="background: rgba(16, 185, 129, 0.1); color: var(--success); padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 600;"><i class="material-icons-round" style="font-size: 1rem; vertical-align: middle;">info</i> Ver Motivo</button>`;
            } else {
                btnDetalle = `<button class="btn-ver-detalle-pedido" data-order="${mov.order_id}" data-recarga="false" style="background: var(--accent-light); color: var(--accent); padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 600;"><i class="material-icons-round" style="font-size: 1rem; vertical-align: middle;">receipt_long</i> Ver Factura</button>`;
            }
        } else {
            btnDetalle = `<span style="font-size: 0.75rem; color: var(--text-muted);">Operación Antigua</span>`;
        }

        const tr = document.createElement('tr');
        if (viendoPapeleraMovs) tr.style.opacity = '0.7'; 
        tr.innerHTML = `
            ${cbTd}
            <td data-label="Fecha" style="color: var(--text-gray); font-size: 0.85rem;">
                <div style="display:flex; flex-direction:column;">
                    <span style="color:var(--text-main); font-weight:600;">${fFormat1}</span>
                    <span>${fFormat2}</span>
                </div>
            </td>
            <td data-label="Pedido / ID">${pedidoFormat}</td>
            <td data-label="Usuario"><strong style="color: var(--text-main); font-size: 0.95rem;">${mov.usuario}</strong>${responsableFormat}</td>
            <td data-label="Motivo" style="font-size: 0.85rem; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${mov.motivo}">${mov.motivo}</td>
            <td data-label="Monto Total" style="text-align: right;">${montoFormat}</td>
            <td data-label="Saldo Final" style="text-align: right;">${saldoFormat}</td>
            <td data-label="Acciones" style="text-align: center; white-space: nowrap;">${btnDetalle}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ==========================================
// NUEVO: EXPORTAR A CSV
// ==========================================
window.exportarMovimientosCSV = function() {
    if (datosParaExportar.length === 0) {
        if(typeof mostrarToast === 'function') mostrarToast("No hay datos para exportar con los filtros actuales.", "warning");
        else alert("No hay datos para exportar.");
        return;
    }

    // Definir las cabeceras del CSV
    let csvContent = "Fecha,ID_Pedido,Usuario_Afectado,Autor_Movimiento,Motivo,Monto,Saldo_Resultante\n";

    // Recorrer los datos filtrados y armar las filas
    datosParaExportar.forEach(row => {
        let fecha = row.fecha ? `"${row.fecha}"` : '""';
        let pedido = row.order_id ? `"${row.order_id}"` : '""';
        let usuario = row.usuario ? `"${row.usuario}"` : '""';
        let autor = row.usuario_que_realiza ? `"${row.usuario_que_realiza}"` : '""';
        let motivo = row.motivo ? `"${row.motivo.replace(/"/g, '""')}"` : '""'; // Escapar comillas dobles
        let monto = row.monto_agrupado || 0;
        let saldo = row.saldo_final_orden || 0;

        csvContent += `${fecha},${pedido},${usuario},${autor},${motivo},${monto},${saldo}\n`;
    });

    // Crear el Blob con el BOM universal para que Excel reconozca los acentos (UTF-8)
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    // Crear un enlace temporal para descargar
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Historial_Movimientos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    if(typeof mostrarToast === 'function') mostrarToast("Descarga CSV iniciada", "success");
};

// ==========================================
// 4. LÓGICA DE SELECCIÓN Y ENVÍO A PAPELERA
// ==========================================

window.toggleSelectAllMovs = function(source) {
    const checkboxes = document.querySelectorAll('.mov-cb');
    checkboxes.forEach(cb => cb.checked = source.checked);
    checkMovSelection();
};

window.checkMovSelection = function() {
    const selected = document.querySelectorAll('.mov-cb:checked');
    const btnBorrar = document.getElementById('btn-borrar-movs');
    if (btnBorrar) {
        if(selected.length > 0) {
            btnBorrar.style.display = 'inline-flex';
            const textSpan = btnBorrar.querySelector('.text-btn');
            if(textSpan) textSpan.innerText = `Ocultar Selección en Papelera (${selected.length})`;
        } else {
            btnBorrar.style.display = 'none';
        }
    }
};

// GLOBAL: Se dispara con el onclick del HTML
window.borrarMovimientosSeleccionados = async function() {
    const selected = document.querySelectorAll('.mov-cb:checked');
    if (selected.length === 0) return;

    let idsToTrash = [];
    selected.forEach(cb => {
        const idsStr = cb.getAttribute('data-ids');
        if (idsStr) {
            const ids = idsStr.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
            idsToTrash.push(...ids);
        }
    });

    if (idsToTrash.length === 0) return;

    const confirmar = confirm(`¿Mover a Papelera?\n\nSe ocultarán ${idsToTrash.length} transacciones de la vista principal. Podrás restaurarlas desde la papelera global si es necesario.`);
    if (!confirmar) return;

    const btnBorrar = document.getElementById('btn-borrar-movs');
    const txtOriginal = btnBorrar.innerHTML;
    btnBorrar.innerHTML = '<i class="material-icons-round" style="animation: spin 1s linear infinite;">autorenew</i> <span class="text-btn">Procesando...</span>';

    try {
        const response = await fetch(API_MOVIMIENTOS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                accion: 'moverAPapeleraMasivo',
                tabla: 'movimientos', 
                ids: idsToTrash,
                usuario: sessionStorage.getItem('admin_user'),
                token: sessionStorage.getItem('admin_token')
            })
        });
        
        const res = await response.json();
        
        if (res.success) {
            if(typeof mostrarToast === 'function') mostrarToast("Movimientos enviados a papelera", 'success');
            
            btnBorrar.style.display = 'none';
            const selectAll = document.getElementById('mov-select-all');
            if(selectAll) selectAll.checked = false;

            cargarMovimientosBase();
            
            if (typeof PapeleraEngine !== 'undefined' && PapeleraEngine.moduloActivo === 'movimientos') {
                PapeleraEngine.cargarDatos();
            }
        } else {
            if(typeof mostrarToast === 'function') mostrarToast("Error: " + res.msg, 'error');
            else alert("Error: " + res.msg);
        }
    } catch (e) {
        console.error(e);
        if(typeof mostrarToast === 'function') mostrarToast("Fallo de conexión al enviar a papelera", 'error');
        else alert("Fallo de conexión al enviar a papelera");
    } finally {
        btnBorrar.innerHTML = txtOriginal;
    }
};

// ==========================================
// 5. LÓGICA DE DETALLE (FACTURAS Y COPIADO)
// ==========================================
window.copiarAlPortapapeles = function(texto) {
    navigator.clipboard.writeText(texto).then(() => {
        if(typeof mostrarToast === 'function') mostrarToast('Copiado al portapapeles', 'success');
    }).catch(err => {
        if(typeof mostrarToast === 'function') mostrarToast('Error al copiar', 'error');
    });
};

async function abrirModalDesglosePedido(orderId) {
    const modalGeneral = document.getElementById('modal-general');
    const modalContent = document.getElementById('modal-general-content');
    
    if (!modalGeneral || !modalContent) return;

    // ESTILO DEL OVERLAY (IGUAL AL MODAL DE AUDITORÍA)
    Object.assign(modalGeneral.style, {
        background: 'rgba(10, 15, 25, 0.9)', 
        backdropFilter: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    });

    // ESTILO DEL CONTENEDOR TIPO FACTURA
    modalContent.className = 'modal-content';
    Object.assign(modalContent.style, {
        background: '#0b1120',
        color: '#f8fafc',
        padding: '25px',
        position: 'relative',
        maxWidth: '480px',
        width: '95%',
        maxHeight: '85vh',
        overflowY: 'auto',
        borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        display: 'block', // Cambiado de flex a block para evitar encimamientos
        border: '1px solid #1e293b'
    });

    modalContent.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <i class="material-icons-round" style="animation: spin 1s linear infinite; font-size: 3rem; color: #38bdf8;">autorenew</i>
            <p style="margin-top: 15px; color: #94a3b8;">Generando factura oficial...</p>
        </div>
    `;
    modalGeneral.style.display = 'flex';

    try {
        const response = await fetch(API_MOVIMIENTOS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                accion: 'getPedidos',
                usuario: sessionStorage.getItem('admin_user'),
                token: sessionStorage.getItem('admin_token'),
                filtro: orderId,
                limite: 200, 
                esAdmin: true
            })
        });
        const res = await response.json();

        if (res.success) {
            const itemsFactura = res.datos.filter(i => i.orderId === orderId);

            if (itemsFactura.length === 0) {
                modalContent.innerHTML = `
                    <div style="text-align: right; margin-bottom: 10px;">
                        <button onclick="document.getElementById('modal-general').style.display='none'" style="background: rgba(255,255,255,0.1); border:none; color:#fff; width:30px; height:30px; border-radius:50%; cursor:pointer;"><i class="material-icons-round">close</i></button>
                    </div>
                    <div style="padding: 20px; text-align: center;">
                        <i class="material-icons-round" style="font-size: 3rem; color: #ef4444; margin-bottom:10px;">error_outline</i>
                        <p style="color: #94a3b8;">No se encontraron cuentas asociadas.</p>
                    </div>`;
                return;
            }

            let agrupacionServicios = {};
            let totalGeneral = 0;

            itemsFactura.forEach(item => {
                if (!agrupacionServicios[item.servicio]) {
                    agrupacionServicios[item.servicio] = { cuentas: [], precioUnitario: parseFloat(item.precio) || 0 };
                }
                agrupacionServicios[item.servicio].cuentas.push(item);
            });

            let htmlServicios = '';
            const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
            let textoFacturaCompleta = `FACTURA DE COMPRA\nPEDIDO: ${orderId}\n\n`;

            for (const srv in agrupacionServicios) {
                const dataSrv = agrupacionServicios[srv];
                const cantidad = dataSrv.cuentas.length;
                const subtotal = cantidad * dataSrv.precioUnitario;
                totalGeneral += subtotal;

                let cuentasListaHtml = '';
                textoFacturaCompleta += `📌 SERVICIO: ${srv}\n`;

                dataSrv.cuentas.forEach(cData => {
                    const c = cData.cuenta;
                    textoFacturaCompleta += `${c}\n`;
                    const cuentaSafe = c.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    
                    let notasHTML = cData.notas 
                        ? `<div style="margin-top: 4px; font-size: 0.75rem; color: #f59e0b; background: rgba(245, 158, 11, 0.1); padding: 4px 8px; border-radius: 6px; border: 1px dashed rgba(245, 158, 11, 0.3); line-height: 1.3;"><i class="material-icons-round" style="font-size:0.9rem; vertical-align:middle; margin-right:3px;">history_edu</i> ${cData.notas}</div>` 
                        : '';
                    
                    let opacityStyle = (cData.estado === 'Reemplazada' || cData.estado === 'Vencida') ? 'opacity: 0.5;' : '';

                    cuentasListaHtml += `
                        <div style="margin-bottom: 10px; ${opacityStyle}">
                            <div onclick="copiarAlPortapapeles('${cuentaSafe}')" style="background: #0f172a; border: 1px solid #334155; padding: 10px 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: 0.2s;">
                                <span style="word-break: break-all; color: #f8fafc; font-family: monospace; font-size: 0.9rem;">${c}</span>
                                <i class="material-icons-round" style="font-size: 1.1rem; color: #94a3b8;">content_copy</i>
                            </div>
                            ${notasHTML}
                        </div>
                    `;
                });

                htmlServicios += `
                    <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; margin-bottom: 15px; overflow: hidden;">
                        <div style="padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; background: rgba(56, 189, 248, 0.05);">
                            <h4 style="color: #38bdf8; font-weight: 800; font-size: 0.95rem; text-transform: uppercase; margin: 0;">${srv}</h4>
                            <span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;">x${cantidad}</span>
                        </div>
                        <div style="padding: 15px;">${cuentasListaHtml}</div>
                        <div style="padding: 10px 15px; border-top: 1px dashed #334155; display: flex; justify-content: space-between; color: #cbd5e1; font-size: 0.8rem;">
                            <span>Unit: <strong>${fmt.format(dataSrv.precioUnitario)}</strong></span>
                            <span>Subtotal: <strong style="color: #fff;">${fmt.format(subtotal)}</strong></span>
                        </div>
                    </div>
                `;
            }

            textoFacturaCompleta += `\nTOTAL: ${fmt.format(totalGeneral)}`;
            const encodedTextoTodo = encodeURIComponent(textoFacturaCompleta);

            modalContent.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                    <div>
                        <h2 style="margin:0; font-size: 1.3rem; font-family: 'Righteous', sans-serif; color: #fff; display:flex; align-items:center; gap:8px;">
                            <i class="material-icons-round" style="color: #38bdf8;">local_mall</i> FACTURA
                        </h2>
                        <div style="background: rgba(56, 189, 248, 0.1); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 0.75rem; display: inline-block; margin-top: 5px;">${orderId}</div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="copiarAlPortapapeles(decodeURIComponent('${encodedTextoTodo}'))" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 8px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                            <i class="material-icons-round" style="font-size: 1rem;">receipt</i> COPIAR
                        </button>
                        <button onclick="document.getElementById('modal-general').style.display='none'" style="background: #334155; color: #fff; border: none; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items:center; justify-content: center;"><i class="material-icons-round">close</i></button>
                    </div>
                </div>
                
                ${htmlServicios}

                <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid #059669; border-radius: 12px; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
                    <span style="color: #94a3b8; font-weight: 800; font-size: 0.8rem; text-transform: uppercase;">Total Pedido</span>
                    <span style="color: #10b981; font-size: 1.5rem; font-weight: 900; font-family: monospace;">${fmt.format(totalGeneral)}</span>
                </div>
            `;

        } else {
            modalContent.innerHTML = `<div style="padding: 30px; text-align: center; color: #ef4444;">${res.msg}</div>`;
        }
    } catch (error) {
        modalContent.innerHTML = `<div style="padding: 30px; text-align: center; color: #ef4444;">Error de red al generar factura.</div>`;
    }
}

// ==========================================
// 6. EVENTOS LOCALES Y PAGINACIÓN
// ==========================================
function initEventosMovimientos() {
    
    document.getElementById('buscar-movimiento')?.addEventListener('keyup', () => { 
        movPaginaActual = 1; ejecutarFiltrosYRenderMovimientos(); 
    });
    
    // ==========================================
    // LOGICA DEL BUSCADOR DESPLEGABLE (TIPO EXCEL)
    // ==========================================
    const inputUsr = document.getElementById('filtro-usuario-mov');
    const dropdownUsr = document.getElementById('lista-usuarios-mov');
    const contenedorUsr = document.getElementById('contenedor-filtro-usuario');

    if (inputUsr && dropdownUsr) {
        // Mostrar lista al hacer clic o enfocar
        inputUsr.addEventListener('focus', () => { dropdownUsr.style.display = 'block'; });
        inputUsr.addEventListener('click', () => { dropdownUsr.style.display = 'block'; });

        // Filtrar mientras escribe
        inputUsr.addEventListener('input', function() {
            dropdownUsr.style.display = 'block';
            const val = this.value.toLowerCase().trim();
            
            dropdownUsr.querySelectorAll('.custom-dropdown-item').forEach(item => {
                const text = item.innerText.toLowerCase();
                if (item.dataset.val === "" || text.includes(val)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });

            // Filtrar también la tabla real en vivo mientras escribe
            movPaginaActual = 1; 
            ejecutarFiltrosYRenderMovimientos();
        });

        // Ocultar si se hace clic afuera
        document.addEventListener('click', (e) => {
            if (contenedorUsr && !contenedorUsr.contains(e.target)) {
                dropdownUsr.style.display = 'none';
            }
        });
    }
    
    document.getElementById('filtro-tipo-mov')?.addEventListener('change', () => {
        movPaginaActual = 1; ejecutarFiltrosYRenderMovimientos();
    });
    document.getElementById('filtro-fecha-inicio')?.addEventListener('change', () => { 
        movPaginaActual = 1; ejecutarFiltrosYRenderMovimientos(); 
    });
    document.getElementById('filtro-fecha-fin')?.addEventListener('change', () => { 
        movPaginaActual = 1; ejecutarFiltrosYRenderMovimientos(); 
    });

    document.getElementById('filtro-limite-mov')?.addEventListener('change', (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 1) { val = 15; e.target.value = val; }
        movLimitePagina = val;
        movPaginaActual = 1; ejecutarFiltrosYRenderMovimientos();
    });

    document.getElementById('tabla-movimientos-body')?.addEventListener('click', (e) => {
        const btnDetalle = e.target.closest('.btn-ver-detalle-pedido');
        if(btnDetalle) {
            const orderId = btnDetalle.getAttribute('data-order');
            const esRecarga = btnDetalle.getAttribute('data-recarga') === 'true';
            
            if (esRecarga) {
                const motivo = btnDetalle.getAttribute('data-motivo');
                const modalGeneral = document.getElementById('modal-general');
                const modalContent = document.getElementById('modal-general-content');
                if (modalGeneral && modalContent) {
                    // Lógica dinámica de colores
                    let isRecarga = orderId.startsWith('REC-');
                    let isDescuento = orderId.startsWith('DES-');
                    
                    let themeColor = isRecarga ? 'var(--success)' : (isDescuento ? '#f59e0b' : 'var(--accent)');
                    let themeBg = isRecarga ? 'rgba(16, 185, 129, 0.1)' : (isDescuento ? 'rgba(245, 158, 11, 0.1)' : 'rgba(99, 102, 241, 0.1)');
                    let iconName = isRecarga ? 'account_balance_wallet' : (isDescuento ? 'money_off' : 'info');
                    let titleText = isRecarga ? 'RECARGA DE SALDO' : (isDescuento ? 'DESCUENTO DE SALDO' : 'DETALLE DE OPERACIÓN');

                    // Convertimos a bloque el contenido para no dañar los modales que usen flex
                    modalContent.className = 'modal-content';
                    Object.assign(modalContent.style, {
                        background: 'var(--bg-card)',
                        padding: '25px',
                        maxWidth: '450px',
                        width: '95%',
                        borderRadius: '20px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                        border: '1px solid var(--border-color)',
                        position: 'relative',
                        display: 'block' // Evita que se rompa el diseño por flexbox heredado
                    });

                    modalContent.innerHTML = `
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 5px; background: linear-gradient(90deg, transparent, ${themeColor}, transparent);"></div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; position: relative;">
                            <div style="display: flex; gap: 15px; align-items: center;">
                                <div style="width: 50px; height: 50px; border-radius: 14px; background: ${themeBg}; display: flex; align-items: center; justify-content: center; border: 1px solid ${themeColor}; box-shadow: 0 0 15px ${themeBg};">
                                    <i class="material-icons-round" style="color:${themeColor}; font-size: 2rem;">${iconName}</i>
                                </div>
                                <div>
                                    <h2 style="margin:0; font-size: 1.1rem; font-family: 'Righteous', sans-serif; color: var(--text-main); letter-spacing: 0.5px;">${titleText}</h2>
                                    <div style="background: var(--bg-dark); color: var(--text-gray); border: 1px dashed var(--border-color); padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 0.8rem; display: inline-block; margin-top: 6px; font-weight: bold;">
                                        REF: <span style="color: ${themeColor};">${orderId}</span>
                                    </div>
                                </div>
                            </div>
                            <button onclick="document.getElementById('modal-general').style.display='none'" style="background: var(--bg-dark); color: var(--text-gray); border: 1px solid var(--border-color); width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items:center; justify-content: center; transition: 0.3s;" onmouseover="this.style.background='var(--danger)'; this.style.color='#fff'; this.style.borderColor='var(--danger)';" onmouseout="this.style.background='var(--bg-dark)'; this.style.color='var(--text-gray)'; this.style.borderColor='var(--border-color)';">
                                <i class="material-icons-round" style="font-size: 1.2rem;">close</i>
                            </button>
                        </div>

                        <div style="background: var(--bg-dark); border: 1px solid var(--border-color); border-radius: 12px; padding: 25px; text-align: left; margin-top: 25px; position: relative; overflow: hidden; box-shadow: inset 0 2px 10px rgba(0,0,0,0.05);">
                            <div style="position: absolute; top: -10px; right: -10px; opacity: 0.03;">
                                <i class="material-icons-round" style="font-size: 7rem;">description</i>
                            </div>
                            <p style="color: var(--text-muted); font-size: 0.75rem; font-weight: 800; text-transform: uppercase; margin-top: 0; margin-bottom: 12px; letter-spacing: 1.5px; display: flex; align-items: center; gap: 5px;">
                                <i class="material-icons-round" style="font-size: 1.1rem;">notes</i> Concepto Registrado
                            </p>
                            <div style="color: var(--text-main); line-height: 1.7; font-weight: 500; font-size: 1rem; position: relative; z-index: 1; word-break: break-word;">
                                ${motivo}
                            </div>
                        </div>

                        <button type="button" onclick="document.getElementById('modal-general').style.display='none'" style="width:100%; margin-top:25px; padding:14px; background: ${themeBg}; color: ${themeColor}; border: 1px solid ${themeColor}; border-radius:10px; font-weight:800; font-size: 0.95rem; cursor:pointer; transition:all 0.3s ease; text-transform: uppercase; letter-spacing: 1px;" onmouseover="this.style.background='${themeColor}'; this.style.color='#fff';" onmouseout="this.style.background='${themeBg}'; this.style.color='${themeColor}';">
                            <i class="material-icons-round" style="font-size: 1.1rem; vertical-align: middle; margin-right: 5px;">check_circle</i> ENTENDIDO
                        </button>
                    `;
                    modalGeneral.style.display = 'flex';
                }
            } else {
                abrirModalDesglosePedido(orderId);
            }
        }
    });

    const modalOverlay = document.getElementById('modal-general');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === this) this.style.display = 'none';
        });
    }
}

window.renderPaginacionMovimientos = function(totalItems = 0) {
    const container = document.getElementById('paginacion-movimientos-container');
    if (!container) return;

    let html = `<span style="color: var(--text-gray); margin-right: 15px;">Página ${movPaginaActual} de ${movTotalPaginas} | Registros: ${totalItems}</span>`;

    let firstDisabled = movPaginaActual === 1 ? 'opacity: 0.5; pointer-events: none;' : '';
    html += `<button onclick="cambiarPaginaMov(1)" style="width: 35px; height: 35px; padding: 0; display: flex; align-items: center; justify-content: center; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; margin: 0 2px; ${firstDisabled}"><i class="material-icons-round">first_page</i></button>`;

    let prevDisabled = movPaginaActual === 1 ? 'opacity: 0.5; pointer-events: none;' : '';
    html += `<button onclick="cambiarPaginaMov(${movPaginaActual - 1})" style="width: 35px; height: 35px; padding: 0; display: flex; align-items: center; justify-content: center; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; margin: 0 2px; ${prevDisabled}"><i class="material-icons-round">chevron_left</i></button>`;

    let startPage = Math.max(1, movPaginaActual - 1);
    let endPage = Math.min(movTotalPaginas, startPage + 2);
    if (endPage - startPage < 2) startPage = Math.max(1, endPage - 2);

    for (let i = startPage; i <= endPage; i++) {
        let isAct = i === movPaginaActual;
        html += `<button onclick="cambiarPaginaMov(${i})" style="width: 35px; height: 35px; padding: 0; display: flex; align-items: center; justify-content: center; background: ${isAct ? 'var(--accent)' : 'var(--bg-card)'}; color: ${isAct ? '#fff' : 'var(--text-main)'}; border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; margin: 0 2px;">${i}</button>`;
    }

    let nextDisabled = movPaginaActual === movTotalPaginas || movTotalPaginas === 0 ? 'opacity: 0.5; pointer-events: none;' : '';
    html += `<button onclick="cambiarPaginaMov(${movPaginaActual + 1})" style="width: 35px; height: 35px; padding: 0; display: flex; align-items: center; justify-content: center; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; margin: 0 2px; ${nextDisabled}"><i class="material-icons-round">chevron_right</i></button>`;

    let lastDisabled = movPaginaActual === movTotalPaginas || movTotalPaginas === 0 ? 'opacity: 0.5; pointer-events: none;' : '';
    html += `<button onclick="cambiarPaginaMov(${movTotalPaginas})" style="width: 35px; height: 35px; padding: 0; display: flex; align-items: center; justify-content: center; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 6px; cursor: margin: 0 2px; ${lastDisabled}"><i class="material-icons-round">last_page</i></button>`;

    container.innerHTML = html;
};

window.cambiarPaginaMov = function(nuevaPagina) {
    if (nuevaPagina >= 1 && nuevaPagina <= movTotalPaginas && nuevaPagina !== movPaginaActual) {
        movPaginaActual = nuevaPagina;
        ejecutarFiltrosYRenderMovimientos();
    }
};
