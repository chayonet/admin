/* =================================================================================
   ARCHIVO: movimientos_modal.js
   Lógica: Modal Popup con Historial Premium, Paginación y Facturas 100% DOM.
================================================================================= */

const API_ADMIN_MOVS = `${API_BASE_URL_F}/admin_api.php`;

// Variables de Estado del Modal Principal
let modalMovsRaw = [];              
let modalMovsAgrupados = [];        
let modalUsuarioObjetivo = '';

let modalMovPaginaActual = 1;
let modalMovTotalPaginas = 1;
let modalMovLimitePagina = 10; 

// 🔥 Ordenamiento Dinámico de Mayor a Menor por Defecto
let modalMovColumnaOrden = 'fecha';
let modalMovDireccionOrden = 'desc';

// ==========================================
// 1. FUNCIÓN GLOBAL PARA ABRIR EL MODAL DE MOVIMIENTOS
// ==========================================
window.abrirModalMovimientosUsuario = async function(usuarioPreseleccionado) {
    if (!usuarioPreseleccionado) {
        if(typeof mostrarToast === 'function') mostrarToast("Usuario no válido", "error");
        return;
    }

    modalUsuarioObjetivo = usuarioPreseleccionado;
    
    // Resetear variables
    modalMovPaginaActual = 1;
    modalMovLimitePagina = 10;
    modalMovColumnaOrden = 'fecha';
    modalMovDireccionOrden = 'desc';
    modalMovsRaw = [];
    modalMovsAgrupados = [];

    // Crear DOM si no existe
    crearDOMModalMovimientos();
    crearDOMModalDetalle(); // Preparamos el modal secundario para facturas
    
    // Mostrar Modal y actualizar Título
    const modal = document.getElementById('modal-movimientos-usuario');
    modal.style.display = 'flex';
    document.getElementById('modal-movs-title-user').innerText = modalUsuarioObjetivo;
    
    // Limpiar Filtros Visuales
    document.getElementById('modal-mismovs-buscar').value = '';
    document.getElementById('modal-mismovs-inicio').value = '';
    document.getElementById('modal-mismovs-fin').value = '';
    document.getElementById('modal-mismovs-limite').value = '10';

    // Cargar Datos
    await cargarModalMovimientosBase();
};

// ==========================================
// 2. CREACIÓN DINÁMICA DEL DOM (MODAL PRINCIPAL)
// ==========================================
function crearDOMModalMovimientos() {
    if (document.getElementById('modal-movimientos-usuario')) return;

    const modal = document.createElement('div');
    modal.id = 'modal-movimientos-usuario';
    modal.className = 'modal-overlay';
    
    // Estilos del Overlay
    Object.assign(modal.style, {
        display: 'none',
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: 'rgba(10, 15, 25, 0.9)', 
        zIndex: '9990',
        alignItems: 'center',
        justifyContent: 'center'
    });

    modal.innerHTML = `
        <style>
            /* ESTILOS AISLADOS ADAPTATIVOS AL TEMA CLARO/OSCURO */
            .modal-movs-content {
                background: var(--bg-card); 
                color: var(--text-main);
                border: 1px solid var(--border-color);
                border-radius: 20px; 
                box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
                width: 95%; max-width: 1100px; max-height: 90vh; 
                display: flex; flex-direction: column; overflow: hidden;
            }
            .modal-movs-header {
                padding: 25px; border-bottom: 1px solid var(--border-color); 
                display: flex; justify-content: space-between; align-items: center; 
                background: var(--bg-card);
            }
            .modal-movs-body {
                padding: 25px; overflow-y: auto; flex: 1; background: var(--bg-dark);
            }
            .modal-movs-close {
                background: var(--bg-dark); color: var(--text-gray); border: 1px solid var(--border-color); width: 32px; height: 32px; 
                border-radius: 8px; cursor: pointer; display: flex; align-items:center; justify-content: center; transition: 0.3s;
            }
            .modal-movs-close:hover { background: var(--danger); color: #fff; border-color: var(--danger); }

            .stats-dashboard-modal { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 25px; }
            .stat-card-glass-modal { background: var(--bg-card); border: 1px solid var(--border-color); padding: 20px; border-radius: 16px; display: flex; align-items: center; gap: 15px; }
            .stat-icon-circle-modal { width: 55px; height: 55px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; }
            
            .bg-recarga-modal { background: rgba(16, 185, 129, 0.1); color: var(--success); }
            .bg-compra-modal { background: rgba(56, 189, 248, 0.1); color: var(--accent-text); }
            .bg-descuento-modal { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

            .filters-box-modal { background: var(--bg-card); border: 1px solid var(--border-color); padding: 20px; border-radius: 16px; margin-bottom: 25px; display: flex; flex-wrap: wrap; gap: 15px; align-items: flex-end; }
            .filter-input-group-modal { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 150px; }
            .filter-input-group-modal label { font-size: 0.75rem; font-weight: 600; color: var(--accent-text); text-transform: uppercase; }
            .filter-input-group-modal input, .filter-input-group-modal select { background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-main); padding: 12px; border-radius: 10px; font-size: 0.9rem; outline: none; transition: 0.3s; width: 100%; box-sizing: border-box; }
            .filter-input-group-modal input:focus, .filter-input-group-modal select:focus { border-color: var(--accent-text); box-shadow: 0 0 0 2px var(--accent-glow); }

            .premium-table-modal { background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border-color); overflow-x: auto; }
            .mov-table-modal { width: 100%; border-collapse: collapse; min-width: 800px; }
            .mov-table-modal thead th { background: var(--bg-dark); color: var(--text-gray); font-size: 0.75rem; text-transform: uppercase; padding: 18px 20px; letter-spacing: 1px; border-bottom: 1px solid var(--border-color); font-weight: 800; cursor: pointer; user-select: none; transition: color 0.2s; }
            .mov-table-modal thead th:hover { color: var(--accent-text); }
            .mov-row-modal { border-bottom: 1px solid var(--border-color); transition: 0.2s; background: transparent; }
            .mov-row-modal:hover { background: var(--bg-dark); }
            .mov-row-modal td { padding: 20px; font-size: 0.9rem; color: var(--text-main); vertical-align: middle; }

            .id-badge-premium-modal { padding: 6px 12px; border-radius: 6px; font-family: monospace; font-weight: 800; font-size: 0.75rem; letter-spacing: 1px; display: inline-block; }
            .id-badge-premium-modal.orden { background: rgba(56, 189, 248, 0.1); color: var(--accent-text); border: 1px solid rgba(56, 189, 248, 0.3); }
            .id-badge-premium-modal.recarga { background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.3); }
            .id-badge-premium-modal.descuento { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
            .id-badge-premium-modal.nulo { background: rgba(255, 255, 255, 0.05); color: var(--text-gray); border: 1px dashed var(--border-color); }

            .btn-receipt-modal { background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.4); color: var(--accent-text); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 800; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 6px; transition: all 0.3s ease; text-transform: uppercase; }
            .btn-receipt-modal:hover { background: var(--accent-text); color: #fff; border-color: var(--accent-text); transform: translateY(-2px); }
            
            .btn-info-modal { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.4); color: var(--success); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 800; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 6px; transition: all 0.3s ease; text-transform: uppercase; }
            .btn-info-modal:hover { background: var(--success); color: #fff; border-color: var(--success); transform: translateY(-2px); }

            .page-btn-modal { background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-gray); height: 38px; min-width: 38px; padding: 0 10px; border-radius: 8px; font-weight: 800; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; }
            .page-btn-modal:hover:not(:disabled) { background: var(--bg-card); color: var(--text-main); border-color: var(--accent-text); }
            .page-btn-modal.active { background: var(--accent-text); color: #fff; border-color: var(--accent-text); }
            .page-btn-modal:disabled { opacity: 0.3; cursor: not-allowed; }

            @media (max-width: 768px) {
                #modal-tabla-mis-movs, #modal-tabla-mis-movs thead, #modal-tabla-mis-movs tbody, #modal-tabla-mis-movs th, #modal-tabla-mis-movs td, #modal-tabla-mis-movs tr { display: block; }
                #modal-tabla-mis-movs thead tr { position: absolute; top: -9999px; left: -9999px; }
                #modal-tabla-mis-movs tr { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; margin-bottom: 20px; padding: 15px; position: relative; }
                #modal-tabla-mis-movs td { border: none; border-bottom: 1px solid var(--border-color); position: relative; padding: 12px 0; padding-left: 40%; text-align: right !important; min-height: 45px; font-size: 0.9rem; }
                #modal-tabla-mis-movs td:last-child { border-bottom: 0; padding-bottom: 0; display: flex; justify-content: flex-end; gap: 10px; }
                #modal-tabla-mis-movs td::before { content: attr(data-label); position: absolute; top: 12px; left: 0; width: 35%; font-weight: 800; color: var(--text-gray); text-align: left; font-size: 0.75rem; text-transform: uppercase; }
            }
        </style>

        <div class="modal-movs-content" id="modal-movs-content-box">
            <div class="modal-movs-header">
                <h2 style="margin:0; font-size: 1.4rem; display: flex; align-items: center; gap: 10px; font-family: 'Righteous', sans-serif;">
                    <i class="material-icons-round" style="color: var(--accent-text); font-size: 2rem;">history</i> 
                    Auditoría: <span id="modal-movs-title-user" style="color: var(--text-main);"></span>
                </h2>
                <button type="button" class="modal-movs-close" onclick="document.getElementById('modal-movimientos-usuario').style.display='none'">
                    <i class="material-icons-round" style="font-size: 20px;">close</i>
                </button>
            </div>
            
            <div class="modal-movs-body">
                <div class="stats-dashboard-modal">
                    <div class="stat-card-glass-modal">
                        <div class="stat-icon-circle-modal bg-recarga-modal"><i class="material-icons-round">account_balance</i></div>
                        <div style="display:flex; flex-direction:column;">
                            <span style="font-size: 0.75rem; font-weight: 800; color: var(--text-gray); text-transform: uppercase;">Recargas del Admin</span>
                            <span id="modal-tot-recargas" style="font-size: 1.4rem; font-weight: 900; color: var(--text-main); font-family: monospace;">$ 0</span>
                        </div>
                    </div>
                    <div class="stat-card-glass-modal">
                        <div class="stat-icon-circle-modal bg-compra-modal"><i class="material-icons-round">shopping_cart</i></div>
                        <div style="display:flex; flex-direction:column;">
                            <span style="font-size: 0.75rem; font-weight: 800; color: var(--text-gray); text-transform: uppercase;">Compras en Tienda</span>
                            <span id="modal-tot-compras" style="font-size: 1.4rem; font-weight: 900; color: var(--text-main); font-family: monospace;">$ 0</span>
                        </div>
                    </div>
                    <div class="stat-card-glass-modal">
                        <div class="stat-icon-circle-modal bg-descuento-modal"><i class="material-icons-round">money_off</i></div>
                        <div style="display:flex; flex-direction:column;">
                            <span style="font-size: 0.75rem; font-weight: 800; color: var(--text-gray); text-transform: uppercase;">Descuentos/Renovaciones</span>
                            <span id="modal-tot-descuentos" style="font-size: 1.4rem; font-weight: 900; color: var(--text-main); font-family: monospace;">$ 0</span>
                        </div>
                    </div>
                </div>

                <div class="filters-box-modal">
                    <div class="filter-input-group-modal" style="flex: 2;">
                        <label>Buscar en este historial</label>
                        <div style="position:relative;">
                            <i class="material-icons-round" style="position:absolute; left:12px; top:12px; color:var(--text-muted); font-size:1.1rem;">search</i>
                            <input type="text" id="modal-mismovs-buscar" placeholder="Concepto o referencia..." style="padding-left:40px;">
                        </div>
                    </div>
                    <div class="filter-input-group-modal">
                        <label>Desde Fecha</label>
                        <input type="date" id="modal-mismovs-inicio">
                    </div>
                    <div class="filter-input-group-modal">
                        <label>Hasta Fecha</label>
                        <input type="date" id="modal-mismovs-fin">
                    </div>
                    <div class="filter-input-group-modal" style="flex: 0; min-width: 140px;">
                        <label>Ver Registros</label>
                        <select id="modal-mismovs-limite">
                            <option value="10" selected>10 a la vez</option>
                            <option value="20">20 a la vez</option>
                            <option value="50">50 a la vez</option>
                        </select>
                    </div>
                </div>

                <div class="premium-table-modal">
                    <table class="mov-table-modal" id="modal-tabla-mis-movs">
                        <thead>
                            <tr>
                                <th onclick="ordenarModalMovimientos('fecha')" style="text-align: left;">Fecha y Hora <span class="sort-icon-mov" data-col="fecha" style="color:var(--accent-text);">▼</span></th>
                                <th onclick="ordenarModalMovimientos('orderId')" style="text-align: left;">Referencia <span class="sort-icon-mov" data-col="orderId">↕</span></th>
                                <th onclick="ordenarModalMovimientos('autor')" style="text-align: left;">Autor <span class="sort-icon-mov" data-col="autor">↕</span></th>
                                <th style="text-align: left;">Detalle de Operación</th>
                                <th onclick="ordenarModalMovimientos('monto')" style="text-align: right;">Monto Total <span class="sort-icon-mov" data-col="monto">↕</span></th>
                                <th onclick="ordenarModalMovimientos('saldoNuevo')" style="text-align: right;">Saldo Restante <span class="sort-icon-mov" data-col="saldoNuevo">↕</span></th>
                                <th style="text-align:center;">Acción</th>
                            </tr>
                        </thead>
                        <tbody id="modal-mis-movs-body">
                            <tr><td colspan="7" style="text-align:center; padding:60px;"><div class="spinner" style="margin: 0 auto; border-top-color: var(--accent-text);"></div></td></tr>
                        </tbody>
                    </table>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 25px; flex-wrap: wrap; gap: 15px; background: var(--bg-card); padding: 15px 20px; border-radius: 12px; border: 1px solid var(--border-color);">
                    <div id="modal-mis-movs-info" style="color:var(--text-gray); font-size:0.85rem; font-weight:600; letter-spacing:0.5px;"></div>
                    <div id="modal-mis-movs-pagination" style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap; justify-content: center;"></div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Cierre al dar clic fuera del contenido
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    bindEventosModalMovimientos();
}

// ==========================================
// 3. PETICIÓN AL SERVIDOR 
// ==========================================
async function cargarModalMovimientosBase() {
    const tbody = document.getElementById('modal-mis-movs-body');
    if(!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:60px;"><div class="spinner" style="margin: 0 auto; border-top-color: var(--accent-text);"></div><p style="color:var(--text-gray); margin-top:15px;">Extrayendo historial de ${modalUsuarioObjetivo}...</p></td></tr>`;

    try {
        const payloadData = {
            accion: 'getMovimientosUsuarioEspecifico', 
            usuario: sessionStorage.getItem('admin_user'), 
            token: sessionStorage.getItem('admin_token'),
            usuario_objetivo: modalUsuarioObjetivo
        };

        const response = await fetch(API_ADMIN_MOVS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadData)
        });
        
        const res = await response.json();

        if (res.success) {
            modalMovsRaw = res.datos || [];
            const totalesServer = res.totales || { recargas: 0, compras: 0, descuentos: 0 };
            procesarDataHistoricaModal(modalMovsRaw, totalesServer);
        } else {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 60px; color:var(--danger);">${res.msg || 'Error al conectar.'}</td></tr>`;
        }
    } catch (e) { 
        console.error(e); 
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 60px; color:var(--danger);">Fallo de conexión.</td></tr>`;
    }
}

// ==========================================
// 4. LÓGICA DE PROCESAMIENTO (AGRUPACIÓN Y PINTADO)
// ==========================================
function procesarDataHistoricaModal(datos, totalesServidor) {
    let agrupados = [];
    let mapa = {};

    datos.forEach(mov => {
        const montoNum = parseFloat(mov.monto) || 0;
        const ref = (mov.orderId || '').trim();

        if (ref.startsWith('ORD-')) {
            if (!mapa[ref]) {
                mapa[ref] = {
                    ...mov, orderId: ref, monto_agrupado: montoNum,
                    saldo_final_pedido: parseFloat(mov.saldoNuevo) || 0, conteo: 1,
                    usuario_que_realiza: mov.usuario_que_realiza
                };
                agrupados.push(mapa[ref]);
            } else {
                mapa[ref].monto_agrupado += montoNum;
                mapa[ref].conteo++;
                const currentSaldo = parseFloat(mov.saldoNuevo) || 0;
                if (currentSaldo < mapa[ref].saldo_final_pedido) {
                    mapa[ref].saldo_final_pedido = currentSaldo;
                }
            }
        } else {
            agrupados.push({
                ...mov, orderId: ref, monto_agrupado: montoNum,
                saldo_final_pedido: parseFloat(mov.saldoNuevo) || 0, conteo: 1
            });
        }
    });

    agrupados.forEach(item => {
        if (item.conteo > 1) {
            item.motivo = `Compra Múltiple (${item.conteo} servicios en tienda)`;
        }
    });

    modalMovsAgrupados = agrupados;

    const f = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    document.getElementById('modal-tot-recargas').innerText = `$ ${f.format(totalesServidor.recargas || 0)}`;
    document.getElementById('modal-tot-compras').innerText = `$ ${f.format(totalesServidor.compras || 0)}`;
    document.getElementById('modal-tot-descuentos').innerText = `$ ${f.format(totalesServidor.descuentos || 0)}`;

    renderizarHistoricoPremiumModal();
}

function renderizarHistoricoPremiumModal() {
    const filtro = (document.getElementById('modal-mismovs-buscar')?.value || '').toLowerCase().trim();
    const dIni = document.getElementById('modal-mismovs-inicio')?.value || '';
    const dFin = document.getElementById('modal-mismovs-fin')?.value || '';

    // 🔥 TRADUCTOR DE FECHAS BILINGÜE
    const parseFechaSeguraModal = (fechaStr) => {
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

    let filtrados = modalMovsAgrupados.filter(mov => {
        let matchText = `${mov.motivo} ${mov.orderId || ''} ${mov.usuario_que_realiza || ''}`.toLowerCase().includes(filtro);
        let matchDate = true;
        if(dIni || dFin) {
            let fObj = new Date(parseFechaSeguraModal(mov.fecha));
            if(!isNaN(fObj.getTime())) {
                const mDate = fObj.toISOString().split('T')[0];
                if(dIni && mDate < dIni) matchDate = false;
                if(dFin && mDate > dFin) matchDate = false;
            }
        }
        return matchText && matchDate;
    });

    filtrados.sort((a, b) => {
        let vA, vB;
        switch(modalMovColumnaOrden) {
            case 'fecha': vA = parseFechaSeguraModal(a.fecha); vB = parseFechaSeguraModal(b.fecha); break;
            case 'orderId': vA = (a.orderId || '').toLowerCase(); vB = (b.orderId || '').toLowerCase(); break;
            case 'autor': vA = (a.usuario_que_realiza || '').toLowerCase(); vB = (b.usuario_que_realiza || '').toLowerCase(); break;
            case 'monto': vA = Math.abs(a.monto_agrupado); vB = Math.abs(b.monto_agrupado); break;
            case 'saldoNuevo': vA = parseFloat(a.saldo_final_pedido); vB = parseFloat(b.saldo_final_pedido); break;
            default: vA = parseFechaSeguraModal(a.fecha); vB = parseFechaSeguraModal(b.fecha);
        }
        return modalMovDireccionOrden === 'asc' ? (vA > vB ? 1 : -1) : (vA < vB ? 1 : -1);
    });

    const total = filtrados.length;
    modalMovLimitePagina = parseInt(document.getElementById('modal-mismovs-limite')?.value || 10);
    modalMovTotalPaginas = Math.ceil(total / modalMovLimitePagina) || 1;
    
    if (modalMovPaginaActual > modalMovTotalPaginas) modalMovPaginaActual = Math.max(1, modalMovTotalPaginas);

    let start = (modalMovPaginaActual - 1) * modalMovLimitePagina;
    let pagina = filtrados.slice(start, start + modalMovLimitePagina);

    const tbody = document.getElementById('modal-mis-movs-body');
    tbody.innerHTML = '';

    if (pagina.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 60px; color:var(--text-gray);">No se encontraron movimientos.</td></tr>`;
        document.getElementById('modal-mis-movs-info').innerHTML = `MOSTRANDO PÁGINA <b>0</b> DE <b>0</b>`;
        document.getElementById('modal-mis-movs-pagination').innerHTML = '';
        return;
    }

    const fmt = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    pagina.forEach(mov => {
        const monto = mov.monto_agrupado;
        const isIngreso = monto > 0;
        const colorClass = isIngreso ? 'color: var(--success);' : 'color: var(--danger);';
        const signo = isIngreso ? '+' : '-';
        const montoAbs = Math.abs(monto);
        
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

        let autorHtml = mov.usuario_que_realiza ? mov.usuario_que_realiza : 'Sistema';

        let ref = mov.orderId || '';
        let badgeHTML = '';
        if (ref.startsWith('ORD-')) {
            badgeHTML = `<span class="id-badge-premium-modal orden">${ref}</span>`;
        } else if (ref.startsWith('REC-')) {
            badgeHTML = `<span class="id-badge-premium-modal recarga">${ref}</span>`;
        } else if (ref.startsWith('DES-')) {
            badgeHTML = `<span class="id-badge-premium-modal descuento">${ref}</span>`;
        } else if (ref !== '') {
            badgeHTML = `<span class="id-badge-premium-modal nulo">${ref}</span>`; 
        } else {
            badgeHTML = `<span class="id-badge-premium-modal nulo">S/N</span>`; 
        }

        const tr = document.createElement('tr');
        tr.className = "mov-row-modal";
        
        // Protegemos comillas para no romper atributos HTML (el modal "INFO" lo decodifica después)
        const motivoSafeTooltip = mov.motivo.replace(/"/g, '&quot;');

        tr.innerHTML = `
            <td data-label="Fecha" style="text-align: left;">
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <span style="color: var(--text-main); font-size: 0.85rem; font-weight: 500;">${fFormat1}</span>
                    <span style="color: var(--text-gray); font-size: 0.75rem;">${fFormat2}</span>
                </div>
            </td>
            <td data-label="Referencia" style="text-align: left;">${badgeHTML}</td>
            <td data-label="Autor" style="font-weight:600; color:var(--text-main);">${autorHtml}</td>
            
            <td data-label="Detalle" style="font-weight:500; color:var(--text-main); max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${motivoSafeTooltip}">
                ${mov.motivo}
            </td>
            
            <td data-label="Monto" style="text-align: right;"><strong style="${colorClass} font-size: 1.05rem; letter-spacing: 0.5px; font-family: monospace;">${signo}$ ${fmt.format(montoAbs)}</strong></td>
            <td data-label="Saldo Nuevo" style="text-align: right; color: var(--text-main); font-weight: 800; font-size: 1rem; font-family: monospace;">$ ${fmt.format(mov.saldo_final_pedido)}</td>
            <td data-label="Acciones" style="text-align: center; vertical-align: middle;">
                <div style="display:flex; justify-content:flex-end;">
                    ${generarBotonAccionModal(mov)}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    const numTotal = new Intl.NumberFormat('es-CO').format(total);
    document.getElementById('modal-mis-movs-info').innerHTML = `PÁGINA <b style="color:var(--text-main);">${modalMovPaginaActual}</b> DE <b style="color:var(--text-main);">${modalMovTotalPaginas}</b> <span style="margin-left:10px; opacity:0.6;">(Total: ${numTotal} registros)</span>`;
    renderizarPaginadorAvanzadoModal();
}

function generarBotonAccionModal(mov) {
    const ref = mov.orderId || '';
    const mot = encodeURIComponent(mov.motivo || 'Operación manual del Administrador');
    
    if (ref.startsWith('ORD-')) {
        return `<button class="btn-receipt-modal" onclick="invocarFacturaHTML('${ref}')"><i class="material-icons-round" style="font-size:1.1rem;">receipt_long</i> FACTURA</button>`;
    } else {
        let displayRef = ref === '' ? 'S/N' : ref;
        return `<button class="btn-info-modal" onclick="invocarMotivoHTML('${displayRef}', decodeURIComponent('${mot}'))"><i class="material-icons-round" style="font-size:1.1rem;">info</i> INFO</button>`;
    }
}

// ==========================================
// 5. MOTOR DE FACTURAS Y MOTIVOS 100% DOM (ESTILO PREMIUM)
// ==========================================

function crearDOMModalDetalle() {
    if (document.getElementById('modal-detalle-interno')) return;

    const modal = document.createElement('div');
    modal.id = 'modal-detalle-interno';
    modal.className = 'modal-overlay';
    
    Object.assign(modal.style, {
        display: 'none', position: 'fixed', top: '0', left: '0',
        width: '100%', height: '100%', background: 'rgba(10, 15, 25, 0.9)', 
        zIndex: '10005', alignItems: 'center', justifyContent: 'center'
    });

    modal.innerHTML = `
        <style>
            .factura-box { background: var(--bg-dark); border: 1px solid var(--border-color); border-radius: 16px; width: 90%; max-width: 480px; padding: 25px; position: relative; box-shadow: 0 20px 50px rgba(0,0,0,0.5); max-height: 85vh; overflow-y: auto; }
            .fac-header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
            .fac-title { color: var(--text-main); font-family: 'Righteous', sans-serif; font-size: 1.4rem; display: flex; align-items: center; gap: 8px; margin: 0; letter-spacing: 1px; }
            .fac-badge { background: rgba(56, 189, 248, 0.1); color: var(--accent-text); border: 1px solid rgba(56, 189, 248, 0.3); padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 0.8rem; display: inline-block; margin-top: 8px;}
            
            .fac-actions { display: flex; gap: 8px; align-items: center; }
            .btn-copiar-todo { background: rgba(56, 189, 248, 0.15); color: var(--accent-text); border: 1px solid rgba(56, 189, 248, 0.3); padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: 0.2s; }
            .btn-copiar-todo:hover { background: var(--accent-text); color: #fff; }
            .btn-cerrar-fac { background: var(--bg-card); color: var(--text-gray); border: 1px solid var(--border-color); width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
            .btn-cerrar-fac:hover { background: var(--danger); color: #fff; border-color: var(--danger); }

            .fac-divider { border: none; border-top: 1px dashed var(--border-color); margin: 20px 0; }

            .srv-block { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; margin-bottom: 15px; overflow: hidden; }
            .srv-header { padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); }
            .srv-name { color: var(--accent-text); font-weight: 800; font-size: 0.95rem; text-transform: uppercase; display: flex; align-items: center; gap: 8px; }
            .srv-qty { background: rgba(56, 189, 248, 0.2); color: var(--accent-text); padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; }
            .srv-body { padding: 15px; }
            
            .cta-item { background: var(--bg-dark); border: 1px solid var(--border-color); padding: 10px 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; transition: 0.2s; cursor: pointer;}
            .cta-item:last-child { margin-bottom: 0; }
            .cta-item:hover { border-color: var(--accent-text); }
            .cta-text { color: var(--text-main); font-family: monospace; font-size: 0.9rem; word-break: break-all; }
            
            .srv-footer { padding: 12px 15px; border-top: 1px dashed var(--border-color); display: flex; justify-content: space-between; color: var(--text-gray); font-size: 0.8rem; }
            .icon-copy { color: var(--text-gray); cursor: pointer; font-size: 1.1rem; transition: 0.2s; }
            .icon-copy:hover { color: var(--accent-text); }

            .fac-total-box { background: rgba(16, 185, 129, 0.05); border: 1px solid var(--success); border-radius: 12px; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }
            .fac-total-label { color: var(--text-gray); font-weight: 800; font-size: 0.8rem; letter-spacing: 1px; }
            .fac-total-value { color: var(--success); font-weight: 900; font-size: 1.6rem; font-family: monospace; }
        </style>
        <div class="factura-box" id="modal-detalle-body"></div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
}

// Lógica de copiado de factura 
window.copiarTextoFactura = function(textoEncoded, btnElement, modo) {
    const texto = decodeURIComponent(textoEncoded);
    navigator.clipboard.writeText(texto).then(() => {
        if(modo === 'boton') {
            const originalHTML = btnElement.innerHTML;
            btnElement.innerHTML = '<i class="material-icons-round">check</i> ¡Copiado!';
            btnElement.style.background = '#10b981';
            btnElement.style.color = '#fff';
            btnElement.style.borderColor = '#10b981';
            setTimeout(() => { 
                btnElement.innerHTML = originalHTML; 
                btnElement.style.background = '';
                btnElement.style.color = '';
                btnElement.style.borderColor = '';
            }, 2000);
        } else if (modo === 'icono') {
            const originalIcon = btnElement.innerText;
            const originalColor = btnElement.style.color;
            btnElement.innerText = 'check';
            btnElement.style.color = '#10b981';
            setTimeout(() => { 
                btnElement.innerText = originalIcon;
                btnElement.style.color = originalColor;
            }, 2000);
        }
    }).catch(err => {
        console.error('Error al copiar', err);
    });
};

window.invocarFacturaHTML = async function(orderId) {
    const modal = document.getElementById('modal-detalle-interno');
    const body = document.getElementById('modal-detalle-body');
    
    modal.style.display = 'flex';
    body.innerHTML = `
        <div style="text-align:center; padding: 40px;">
            <div class="spinner" style="margin: 0 auto; border-top-color: var(--accent-text);"></div>
            <p style="color:var(--text-gray); margin-top:15px;">Generando Factura...</p>
        </div>
    `;

    try {
        const payloadData = {
            accion: 'getFacturaModalAdmin',
            usuario: sessionStorage.getItem('admin_user'),
            token: sessionStorage.getItem('admin_token'),
            filtro: orderId
        };

        const res = await fetch(API_ADMIN_MOVS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadData)
        });
        
        const data = await res.json();

        if (data.success && data.datos.length > 0) {
            let htmlServicios = '';
            let granTotal = 0;
            const fmt = new Intl.NumberFormat('es-CO');
            
            // Aquí iremos construyendo el texto de "Copiar Todo"
            let textoCopiarTodo = `🌟 ${NOMBRE_NEGOCIO} - FACTURA DE COMPRA 🌟\nPEDIDO: ${orderId}\n`;
            
            let agrupados = {};
            data.datos.forEach(item => {
                if(!agrupados[item.servicio]) agrupados[item.servicio] = [];
                agrupados[item.servicio].push(item);
            });

            for(let srv in agrupados) {
                const cuentasArray = agrupados[srv];
                const cantidad = cuentasArray.length;
                const valorInd = parseFloat(cuentasArray[0].precio || 0);
                const subtotal = valorInd * cantidad;
                granTotal += subtotal;

                // Construimos el texto del Bloque (Servicio)
                let textoGrupo = `\n========================\n📌 SERVICIO: ${srv}\n`;

                let htmlCuentas = '';
                cuentasArray.forEach((item, idx) => {
                    const numCta = idx + 1;
                    // Agregamos la cuenta al texto del bloque
                    textoGrupo += `Cuenta ${numCta}: ${item.cuenta}\n`;

                    // Construimos el texto Individual (1 sola cuenta)
                    let textoInd = `Servicio: ${srv}\nCuenta: ${item.cuenta}\nValor: $ ${fmt.format(valorInd)}`;
                    const txtIndSafe = encodeURIComponent(textoInd);

                    htmlCuentas += `
                        <div class="cta-item" onclick="copiarTextoFactura('${txtIndSafe}', this.querySelector('.icon-copy'), 'icono')">
                            <span class="cta-text">${item.cuenta}</span>
                            <i class="material-icons-round icon-copy" title="Copiar cuenta">content_copy</i>
                        </div>
                    `;
                });

                // Finalizamos el texto del bloque
                textoGrupo += `------------------------\nValor individual: $ ${fmt.format(valorInd)}\nSubtotal del bloque: $ ${fmt.format(subtotal)}\n========================\n`;
                
                // Lo agregamos al texto general
                textoCopiarTodo += textoGrupo;

                const txtGrupoSafe = encodeURIComponent(textoGrupo);

                htmlServicios += `
                    <div class="srv-block">
                        <div class="srv-header">
                            <span class="srv-name">
                                ${srv} 
                                <i class="material-icons-round icon-copy" onclick="copiarTextoFactura('${txtGrupoSafe}', this, 'icono')" title="Copiar grupo" style="font-size:1.1rem;">content_copy</i>
                            </span>
                            <span class="srv-qty">x${cantidad}</span>
                        </div>
                        <div class="srv-body">
                            ${htmlCuentas}
                        </div>
                        <div class="srv-footer">
                            <span>Valor ind: <strong style="color:var(--text-main);">$ ${fmt.format(valorInd)}</strong></span>
                            <span>Subtotal: <strong style="color:var(--text-main);">$ ${fmt.format(subtotal)}</strong></span>
                        </div>
                    </div>
                `;
            }

            // Cerramos el texto de "Copiar Todo"
            textoCopiarTodo += `\n💰 TOTAL GENERAL: $ ${fmt.format(granTotal)}\n¡Gracias por tu preferencia!`;
            const txtTodoSafe = encodeURIComponent(textoCopiarTodo);

            body.innerHTML = `
                <div class="fac-header-row">
                    <div>
                        <h2 class="fac-title"><i class="material-icons-round" style="color:var(--accent-text);">local_mall</i> FACTURA OFICIAL</h2>
                        <div class="fac-badge">${orderId}</div>
                    </div>
                    <div class="fac-actions">
                        <button class="btn-copiar-todo" onclick="copiarTextoFactura('${txtTodoSafe}', this, 'boton')"><i class="material-icons-round" style="font-size:1.1rem;">receipt_long</i> Copiar Todo</button>
                        <button class="btn-cerrar-fac" onclick="document.getElementById('modal-detalle-interno').style.display='none'"><i class="material-icons-round" style="font-size:1.2rem;">close</i></button>
                    </div>
                </div>
                
                <hr class="fac-divider">
                
                <div style="padding-right: 5px;">
                    ${htmlServicios}
                </div>
                
                <div class="fac-total-box">
                    <span class="fac-total-label">TOTAL EST. ADQUISICIÓN</span>
                    <span class="fac-total-value">$ ${fmt.format(granTotal)}</span>
                </div>
            `;
        } else {
            body.innerHTML = `
                <div style="text-align:center; padding: 40px; color: var(--danger);">
                    <i class="material-icons-round" style="font-size:3rem; margin-bottom:10px;">warning</i>
                    <h3 style="margin:0; color:var(--text-main);">No disponible</h3>
                    <p style="font-size:0.9rem; color:var(--text-gray); margin-top:5px;">Los detalles de este pedido no están registrados o es muy antiguo.</p>
                    <button type="button" onclick="document.getElementById('modal-detalle-interno').style.display='none'" style="margin-top:20px; padding:8px 20px; background:var(--bg-card); color:var(--text-main); border:1px solid var(--border-color); border-radius:8px; cursor:pointer;">Cerrar</button>
                </div>
            `;
        }
    } catch (e) {
        body.innerHTML = `
            <div style="text-align:center; padding: 40px; color: var(--danger);">
                <i class="material-icons-round" style="font-size:3rem; margin-bottom:10px;">error</i>
                <h3 style="margin:0; color:var(--text-main);">Error de Red</h3>
                <p style="font-size:0.9rem; color:var(--text-gray); margin-top:5px;">Fallo al conectar con el servidor.</p>
                <button type="button" onclick="document.getElementById('modal-detalle-interno').style.display='none'" style="margin-top:20px; padding:8px 20px; background:var(--bg-card); color:var(--text-main); border:1px solid var(--border-color); border-radius:8px; cursor:pointer;">Cerrar</button>
            </div>
        `;
    }
};

window.invocarMotivoHTML = function(orderId, motivo) {
    const modal = document.getElementById('modal-detalle-interno');
    const body = document.getElementById('modal-detalle-body');
    
    // Lógica dinámica de colores según el tipo de movimiento
    let isRecarga = orderId.startsWith('REC-');
    let isDescuento = orderId.startsWith('DES-');

    let themeColor = isRecarga ? 'var(--success)' : (isDescuento ? '#f59e0b' : 'var(--accent-text)');
    let themeBg = isRecarga ? 'rgba(16, 185, 129, 0.1)' : (isDescuento ? 'rgba(245, 158, 11, 0.1)' : 'rgba(56, 189, 248, 0.1)');
    let iconName = isRecarga ? 'account_balance_wallet' : (isDescuento ? 'money_off' : 'info');
    let titleText = isRecarga ? 'RECARGA DE SALDO' : (isDescuento ? 'DESCUENTO DE SALDO' : 'DETALLE DE OPERACIÓN');

    // Resetear posibles clases de la factura para que no choquen estilos
    body.className = '';
    Object.assign(body.style, {
        background: 'var(--bg-card)',
        padding: '30px',
        maxWidth: '450px',
        width: '95%',
        borderRadius: '24px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        border: '1px solid var(--border-color)',
        position: 'relative',
        display: 'block' 
    });

    modal.style.display = 'flex';
    body.innerHTML = `
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 6px; background: linear-gradient(90deg, transparent, ${themeColor}, transparent);"></div>

        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; position: relative;">
            <div style="display: flex; gap: 18px; align-items: center;">
                <div style="width: 55px; height: 55px; border-radius: 16px; background: ${themeBg}; display: flex; align-items: center; justify-content: center; border: 1px solid ${themeColor}; box-shadow: 0 0 20px ${themeBg}; flex-shrink: 0;">
                    <i class="material-icons-round" style="color:${themeColor}; font-size: 2.2rem;">${iconName}</i>
                </div>
                <div>
                    <h2 style="margin:0; font-size: 1.25rem; font-family: 'Righteous', sans-serif; color: var(--text-main); letter-spacing: 0.5px;">${titleText}</h2>
                    <div style="background: var(--bg-dark); color: var(--text-gray); border: 1px dashed var(--border-color); padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 0.85rem; display: inline-block; margin-top: 8px; font-weight: bold;">
                        REF: <span style="color: ${themeColor};">${orderId}</span>
                    </div>
                </div>
            </div>
            <button onclick="document.getElementById('modal-detalle-interno').style.display='none'" style="background: var(--bg-dark); color: var(--text-gray); border: 1px solid var(--border-color); width: 36px; height: 36px; border-radius: 10px; cursor: pointer; display: flex; align-items:center; justify-content: center; transition: 0.3s; flex-shrink: 0;" onmouseover="this.style.background='var(--danger)'; this.style.color='#fff'; this.style.borderColor='var(--danger)';" onmouseout="this.style.background='var(--bg-dark)'; this.style.color='var(--text-gray)'; this.style.borderColor='var(--border-color)';">
                <i class="material-icons-round" style="font-size: 1.3rem;">close</i>
            </button>
        </div>

        <div style="background: var(--bg-dark); border: 1px solid var(--border-color); border-radius: 16px; padding: 25px; text-align: left; margin-top: 15px; position: relative; overflow: hidden; box-shadow: inset 0 4px 15px rgba(0,0,0,0.05);">
            <div style="position: absolute; top: -15px; right: -15px; opacity: 0.03;">
                <i class="material-icons-round" style="font-size: 8rem;">description</i>
            </div>
            <p style="color: var(--text-muted); font-size: 0.8rem; font-weight: 800; text-transform: uppercase; margin-top: 0; margin-bottom: 12px; letter-spacing: 1px; display: flex; align-items: center; gap: 6px;">
                <i class="material-icons-round" style="font-size: 1.2rem;">notes</i> Concepto Registrado
            </p>
            <div style="color: var(--text-main); line-height: 1.7; font-weight: 500; font-size: 1.05rem; position: relative; z-index: 1; word-break: break-word;">
                ${motivo}
            </div>
        </div>

        <button type="button" onclick="document.getElementById('modal-detalle-interno').style.display='none'" style="width:100%; margin-top:25px; padding:16px; background: ${themeBg}; color: ${themeColor}; border: 1px solid ${themeColor}; border-radius:12px; font-weight:800; font-size: 1rem; cursor:pointer; transition:all 0.3s ease; text-transform: uppercase; letter-spacing: 1.5px;" onmouseover="this.style.background='${themeColor}'; this.style.color='#fff';" onmouseout="this.style.background='${themeBg}'; this.style.color='${themeColor}';">
            <i class="material-icons-round" style="font-size: 1.3rem; vertical-align: middle; margin-right: 6px;">check_circle</i> ENTENDIDO
        </button>
    `;
};

// ==========================================
// 6. EVENTOS GLOBALES DE FILTROS DEL MODAL
// ==========================================
function bindEventosModalMovimientos() {
    let timeoutBusqueda;
    document.getElementById('modal-mismovs-buscar')?.addEventListener('keyup', (e) => { 
        clearTimeout(timeoutBusqueda);
        timeoutBusqueda = setTimeout(() => {
            modalMovPaginaActual = 1; renderizarHistoricoPremiumModal(); 
        }, 300); 
    });
    
    document.getElementById('modal-mismovs-inicio')?.addEventListener('change', () => { modalMovPaginaActual = 1; renderizarHistoricoPremiumModal(); });
    document.getElementById('modal-mismovs-fin')?.addEventListener('change', () => { modalMovPaginaActual = 1; renderizarHistoricoPremiumModal(); });
    document.getElementById('modal-mismovs-limite')?.addEventListener('change', () => { modalMovPaginaActual = 1; renderizarHistoricoPremiumModal(); });
}

// ==========================================
// 7. PAGINADOR AVANZADO 
// ==========================================
function renderizarPaginadorAvanzadoModal() {
    const container = document.getElementById('modal-mis-movs-pagination');
    if (!container) return;
    if (modalMovTotalPaginas <= 1) { container.innerHTML = ''; return; }

    let html = '';
    const btn = (p, text, active = false, disabled = false, title = '') => 
        `<button title="${title}" onclick="${disabled || active ? '' : `modalMovPaginaActual=${p}; renderizarHistoricoPremiumModal();`}" 
                 class="page-btn-modal ${active ? 'active' : ''}" 
                 ${disabled ? 'disabled' : ''}>${text}</button>`;

    html += btn(1, '<i class="material-icons-round" style="font-size:1.2rem;">first_page</i>', false, modalMovPaginaActual === 1, 'Ir a la primera página');
    html += btn(modalMovPaginaActual - 1, '<i class="material-icons-round" style="font-size:1.2rem;">chevron_left</i>', false, modalMovPaginaActual === 1, 'Página Anterior');
    
    let start = Math.max(1, modalMovPaginaActual - 1);
    let end = Math.min(modalMovTotalPaginas, start + 2);
    if (end - start < 2) {
        start = Math.max(1, end - 2);
    }

    for (let i = start; i <= end; i++) {
        html += btn(i, i, i === modalMovPaginaActual, false, `Página ${i}`);
    }

    html += btn(modalMovPaginaActual + 1, '<i class="material-icons-round" style="font-size:1.2rem;">chevron_right</i>', false, modalMovPaginaActual === modalMovTotalPaginas, 'Página Siguiente');
    html += btn(modalMovTotalPaginas, '<i class="material-icons-round" style="font-size:1.2rem;">last_page</i>', false, modalMovPaginaActual === modalMovTotalPaginas, 'Ir a la última página');

    container.innerHTML = html;
}

window.ordenarModalMovimientos = function(col) {
    if (modalMovColumnaOrden === col) modalMovDireccionOrden = modalMovDireccionOrden === 'asc' ? 'desc' : 'asc';
    else { modalMovColumnaOrden = col; modalMovDireccionOrden = 'desc'; }
    
    const container = document.getElementById('modal-movimientos-usuario');
    container.querySelectorAll('.sort-icon-mov').forEach(i => { i.innerText = '↕'; i.style.color = 'var(--text-muted)'; });
    
    const active = container.querySelector(`.sort-icon-mov[data-col="${col}"]`);
    if(active) { active.innerText = modalMovDireccionOrden === 'asc' ? '▲' : '▼'; active.style.color = 'var(--accent-text)'; }
    
    renderizarHistoricoPremiumModal();
};
