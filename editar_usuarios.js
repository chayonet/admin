const API_ADMIN_USERS = `${API_BASE_URL_F}/admin_api.php`;

// Variables Globales del Motor
let usuariosDataOriginal = []; 
let usuariosInicializado = false; 

let usrPaginaActual = 1;
let usrTotalPaginas = 1;
let usrLimitePagina = 10; 
let usuarioEditandoID = null;

// ==========================================
// 1. ESCUCHADOR DE NAVEGACIÓN
// ==========================================
document.addEventListener('moduloCargado', (e) => {
    if (e.detail.modulo === 'mod-usuarios-editar') {
        inicializarModuloUsuarios();
        cargarUsuariosBase();
    }
});

// Función global exportada para abrir el modal de creación
window.abrirModalCreacionUsuario = function() {
    crearDOMModalCrearUsuario();
    
    const modal = document.getElementById('modal-crear-usuario');
    modal.style.display = 'flex';
    
    const form = document.getElementById('form-crear-usuario');
    if (form) form.reset();
    
    const seccionPermisos = document.getElementById('seccion-permisos');
    if (seccionPermisos) seccionPermisos.style.display = 'none';
};

// ==========================================
// 2. INICIALIZACIÓN DEL MÓDULO Y CSS MÓVIL
// ==========================================
function inicializarModuloUsuarios() {
    if (usuariosInicializado) return; 
    usuariosInicializado = true;

    // ----- LÓGICA DE PERMISOS PARA EL BOTÓN SUPERIOR DE CREAR -----
    const rolActual = sessionStorage.getItem('admin_rol');
    let permisosActuales = [];
    try { permisosActuales = JSON.parse(sessionStorage.getItem('admin_permisos') || "[]"); } catch(e){}
    
    let btnNuevoUsuarioHTML = '';
    // Si es Admin, o si es Trabajador CON permiso, dibujamos el botón.
    if (rolActual === 'Admin' || permisosActuales.includes('mod-usuarios-crear')) {
        btnNuevoUsuarioHTML = `
            <button id="btn-abrir-modal-crear" style="background: var(--accent); color: #fff; border: none; width: auto; font-weight: bold; box-shadow: 0 4px 15px var(--accent-glow);">
                <i class="material-icons-round" style="font-size: 1.2rem; vertical-align: middle;">person_add</i> Nuevo Usuario
            </button>
        `;
    }

    const seccionUsuarios = document.getElementById('mod-usuarios-editar');
    if (seccionUsuarios && seccionUsuarios.innerHTML.trim() === "") {
        seccionUsuarios.innerHTML = `
            <style>
                @media (max-width: 768px) {
                    #tabla-usuarios, #tabla-usuarios thead, #tabla-usuarios tbody, 
                    #tabla-usuarios th, #tabla-usuarios td, #tabla-usuarios tr { display: block; }
                    #tabla-usuarios thead tr { position: absolute; top: -9999px; left: -9999px; }
                    #tabla-usuarios tr {
                        background: var(--bg-card); border: 1px solid var(--border-color);
                        border-radius: 12px; margin-bottom: 15px; padding: 15px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.05); position: relative;
                    }
                    #tabla-usuarios td {
                        border: none; border-bottom: 1px solid rgba(255,255,255,0.05);
                        position: relative; padding: 10px 0; padding-left: 45%;
                        text-align: right; min-height: 40px;
                    }
                    #tabla-usuarios td:last-child { border-bottom: 0; padding-bottom: 0; display: flex; justify-content: flex-end; gap: 10px; }
                    #tabla-usuarios td::before {
                        position: absolute; top: 10px; left: 0; width: 40%;
                        font-weight: 700; color: var(--text-muted); text-align: left;
                        font-size: 0.85rem; text-transform: uppercase;
                    }
                    #tabla-usuarios td:nth-of-type(1)::before { content: "Sel."; }
                    #tabla-usuarios td:nth-of-type(2)::before { content: "ID"; }
                    #tabla-usuarios td:nth-of-type(3)::before { content: "Usuario"; }
                    #tabla-usuarios td:nth-of-type(4)::before { content: "Rol"; }
                    #tabla-usuarios td:nth-of-type(5)::before { content: "Correo"; }
                    #tabla-usuarios td:nth-of-type(6)::before { content: "Teléfono"; }
                    #tabla-usuarios td:nth-of-type(7)::before { content: "Saldo"; }
                    #tabla-usuarios td:nth-of-type(8)::before { content: "Acciones"; }
                    
                    #tabla-usuarios td:nth-of-type(1) { text-align: right; }
                }

                /* ESTILOS DEL MODAL DE ASIGNACIÓN / REGALO */
                .modal-asignacion-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(10, 15, 25, 0.95); z-index: 9999; display: none; justify-content: center; align-items: center; }
                .modal-asignacion-content { background: var(--bg-main); width: 95%; max-width: 500px; border-radius: 16px; border: 1px solid var(--border-color); overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
                .modal-asignacion-header { background: var(--bg-card); padding: 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
                .modal-asignacion-header h3 { margin: 0; color: var(--text-main); font-family: 'Righteous', sans-serif; display: flex; align-items: center; gap: 10px; }
                .modal-asignacion-body { padding: 20px; }
                
                .asignacion-tabs { display: flex; gap: 10px; margin-bottom: 20px; }
                .tab-btn { flex: 1; padding: 12px; background: var(--bg-dark); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-gray); font-weight: bold; cursor: pointer; transition: 0.3s; }
                .tab-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); box-shadow: 0 4px 15px var(--accent-glow); }
                
                .form-group-asig { margin-bottom: 15px; }
                .form-group-asig label { display: block; font-size: 0.8rem; font-weight: bold; color: var(--text-gray); margin-bottom: 5px; text-transform: uppercase; }
                .form-group-asig input, .form-group-asig select { width: 100%; padding: 12px; background: var(--bg-dark); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-main); font-family: 'Inter', sans-serif; box-sizing: border-box; }
                
                .modal-asignacion-footer { background: var(--bg-card); padding: 20px; border-top: 1px solid var(--border-color); display: flex; gap: 10px; }
                .btn-asig-cancelar { flex: 1; padding: 12px; background: transparent; border: 1px solid var(--border-color); color: var(--text-gray); border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.3s; }
                .btn-asig-cancelar:hover { background: var(--bg-dark); color: var(--text-main); }
                .btn-asig-confirmar { flex: 2; padding: 12px; background: var(--accent); border: none; color: #fff; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.3s; display: flex; justify-content: center; align-items: center; gap: 8px; }
                .btn-asig-confirmar:hover { filter: brightness(1.2); }
                .btn-asig-confirmar:disabled { opacity: 0.7; cursor: not-allowed; }
            </style>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                <h2 style="margin:0;"><i class="material-icons-round" style="vertical-align: bottom;">manage_accounts</i> Gestionar Usuarios</h2>
                
                <div style="display: flex; gap: 10px;">
                    ${btnNuevoUsuarioHTML}
                    
                    <button class="btn-papelera-global" style="background: var(--bg-dark); color: #8b5cf6; border: 1px solid #8b5cf6; width: auto;" onmouseenter="this.style.background='#8b5cf6'; this.style.color='#fff'" onmouseleave="this.style.background='var(--bg-dark)'; this.style.color='#8b5cf6'" onclick="if(typeof PapeleraEngine !== 'undefined') PapeleraEngine.abrirPapelera('usuarios')">
                        <i class="material-icons-round" style="font-size: 1.2rem; vertical-align: middle;">delete_sweep</i> Papelera
                    </button>
                </div>
            </div>

            <div style="background: var(--bg-card); padding: 15px 20px; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 20px; display: flex; gap: 15px; flex-wrap: wrap; align-items: flex-end;">
                <div style="flex: 2; min-width: 250px;">
                    <label>Buscar Usuario Rápido:</label>
                    <div style="position:relative;">
                        <i class="material-icons-round" style="position:absolute; left:10px; top:10px; color:var(--text-muted);">search</i>
                        <input type="text" id="buscar-usuario" placeholder="Usuario, nombre o correo..." style="margin:0; padding-left:40px; width:100%; box-sizing:border-box;">
                    </div>
                </div>
                <div style="flex: 1; min-width: 150px;">
                    <label>Filtrar por Rol:</label>
                    <select id="filtro-rol-usr" style="margin:0; width:100%; box-sizing:border-box;">
                        <option value="">Todos los Roles</option>
                        <option value="Admin">Administrador</option>
                        <option value="Trabajador">Trabajador</option>
                        <option value="Cliente">Cliente</option>
                    </select>
                </div>
                <div style="flex: 0; min-width: 80px;">
                    <label>Mostrar:</label>
                    <input type="number" id="filtro-limite-usr" value="10" min="1" style="margin:0; width: 100%; box-sizing:border-box;">
                </div>
            </div>

            <div style="overflow-x: auto; border-radius: 12px; box-shadow: var(--shadow-sm);">
                <table id="tabla-usuarios" style="margin-top: 0; width: 100%;">
                    <thead>
                        <tr>
                            <th id="th-chk-usr" style="width: 40px; text-align: center; border-bottom: 2px solid var(--border-color);"><input type="checkbox" id="chk-all-usr" onchange="toggleAllChkUsr('chk-all-usr', 'chk-item-usr', 'btn-bulk-usr')"></th>
                            <th class="sortable-th" onclick="ordenarTablaUsuarios('id')" style="cursor: pointer; border-bottom: 2px solid var(--border-color);">ID <span class="sort-icon-usr" data-col="id" style="color:var(--text-gray); font-size:0.8rem; margin-left:4px;">↕</span></th>
                            <th class="sortable-th" onclick="ordenarTablaUsuarios('usuario')" style="cursor: pointer; border-bottom: 2px solid var(--border-color);">Usuario <span class="sort-icon-usr" data-col="usuario" style="color:var(--text-gray); font-size:0.8rem; margin-left:4px;">↕</span></th>
                            <th class="sortable-th" onclick="ordenarTablaUsuarios('rol')" style="cursor: pointer; border-bottom: 2px solid var(--border-color);">Rol <span class="sort-icon-usr" data-col="rol" style="color:var(--text-gray); font-size:0.8rem; margin-left:4px;">↕</span></th>
                            <th class="sortable-th" onclick="ordenarTablaUsuarios('correo')" style="cursor: pointer; border-bottom: 2px solid var(--border-color);">Correo <span class="sort-icon-usr" data-col="correo" style="color:var(--text-gray); font-size:0.8rem; margin-left:4px;">↕</span></th>
                            <th style="border-bottom: 2px solid var(--border-color);">Teléfono</th>
                            <th class="sortable-th" onclick="ordenarTablaUsuarios('saldo')" style="cursor: pointer; border-bottom: 2px solid var(--border-color);">Saldo <span class="sort-icon-usr" data-col="saldo" style="color:var(--text-gray); font-size:0.8rem; margin-left:4px;">↕</span></th>
                            <th style="text-align:center; border-bottom: 2px solid var(--border-color);">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tabla-usuarios-body"></tbody>
                </table>
            </div>
            
            <div style="margin-top: 15px; height: 40px;">
                <button id="btn-bulk-usr" style="display: none; background: var(--danger-bg); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.3); width: auto; box-shadow: none; padding: 8px 16px; border-radius: 8px; transition: all 0.3s ease;">
                    <i class="material-icons-round" style="font-size: 1.2rem; vertical-align: middle;">delete_sweep</i> <span>Borrar Selección</span>
                </button>
            </div>

            <div id="paginacion-usuarios-container" style="display: flex; gap: 5px; margin-top: 20px; align-items: center; justify-content: center;"></div>
        `;
    }

    prepararModalCrearUsuario();
    prepararModalEdicionUsuario();
    prepararModalAsignacionManual(); // INYECTAMOS EL NUEVO MODAL
    initEventosUsuarios();
}

// ==========================================
// 3. CONSTRUCCIÓN DE MODALES (CREAR, EDITAR Y ASIGNAR)
// ==========================================

function prepararModalAsignacionManual() {
    if (document.getElementById('modal-asignacion-regalo')) return;

    const modal = document.createElement('div');
    modal.id = 'modal-asignacion-regalo';
    modal.className = 'modal-asignacion-overlay';
    
    modal.innerHTML = `
        <div class="modal-asignacion-content">
            <div class="modal-asignacion-header">
                <h3><i class="material-icons-round" style="color: #f59e0b;">card_giftcard</i> Asignación Manual</h3>
                <button type="button" onclick="cerrarModalAsignacion()" style="background: none; border: none; color: var(--text-gray); cursor: pointer;"><i class="material-icons-round">close</i></button>
            </div>
            
            <div class="modal-asignacion-body">
                <input type="hidden" id="asig-usuario-objetivo">
                <p style="font-size: 0.85rem; color: var(--text-gray); margin-bottom: 15px;">Usuario destino: <strong id="asig-usuario-label" style="color: var(--text-main);"></strong></p>
                
                <div class="asignacion-tabs">
                    <button class="tab-btn active" id="tab-asig-stock" onclick="cambiarTabAsignacion('stock')">Desde Inventario</button>
                    <button class="tab-btn" id="tab-asig-nueva" onclick="cambiarTabAsignacion('nueva')">Cuenta Nueva</button>
                </div>
                
                <div id="panel-asig-stock">
                    <div class="form-group-asig">
                        <label>Servicio</label>
                        <select id="asig-stock-servicio" onchange="cargarCuentasAsignacionLibres(this.value)">
                            <option value="">Cargando servicios...</option>
                        </select>
                    </div>
                    <div class="form-group-asig">
                        <label>Cuenta Disponible</label>
                        <select id="asig-stock-cuenta" disabled>
                            <option value="">Primero seleccione un servicio...</option>
                        </select>
                    </div>
                </div>
                
                <div id="panel-asig-nueva" style="display: none;">
                    <div class="form-group-asig">
                        <label>Servicio</label>
                        <select id="asig-nueva-servicio">
                            <option value="">Cargando servicios...</option>
                        </select>
                    </div>
                    <div class="form-group-asig">
                        <label>Credenciales de la Cuenta (Correo:Clave)</label>
                        <input type="text" id="asig-nueva-credenciales" placeholder="ejemplo@gmail.com:123456">
                    </div>
                    <div style="display: flex; gap: 15px;">
                        <div class="form-group-asig" style="flex: 1;">
                            <label>Días de Cuenta</label>
                            <input type="number" id="asig-nueva-dias" value="30" min="1">
                        </div>
                        <div class="form-group-asig" style="flex: 1;">
                            <label>Fecha de Inicio</label>
                            <input type="date" id="asig-nueva-fecha" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="modal-asignacion-footer">
                <button class="btn-asig-cancelar" onclick="cerrarModalAsignacion()">Cancelar</button>
                <button class="btn-asig-confirmar" id="btn-procesar-asignacion" onclick="procesarAsignacionRegalo()">
                    <i class="material-icons-round">check_circle</i> Confirmar Asignación
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModalAsignacion();
    });
}

function prepararModalCrearUsuario() {
    if (document.getElementById('modal-crear-usuario')) return;

    const modal = document.createElement('div');
    modal.id = 'modal-crear-usuario';
    modal.className = 'modal-overlay';
    
    // Estilo Limpio (Sin desenfoque, fondo oscuro sólido)
    Object.assign(modal.style, {
        display: 'none', position: 'fixed', top: '0', left: '0',
        width: '100%', height: '100%', background: 'rgba(10, 15, 25, 0.95)', 
        zIndex: '9995', alignItems: 'center', justifyContent: 'center'
    });

    // REGLA DE NEGOCIO: Si es trabajador, solo puede crear clientes
    const miRol = sessionStorage.getItem('admin_rol');
    let opcionesRolCrear = '';
    
    if (miRol === 'Trabajador') {
        opcionesRolCrear = `<option value="Cliente" selected>Cliente (Solo cuentas de cliente)</option>`;
    } else {
        opcionesRolCrear = `
            <option value="Cliente" selected>Cliente (Acceso estándar)</option>
            <option value="Trabajador">Trabajador (Acceso restringido)</option>
            <option value="Admin">Administrador (Acceso total)</option>
        `;
    }

    modal.innerHTML = `
        <div class="modal-content" style="background: var(--bg-main); color: var(--text-main); padding: 0; position: relative; max-width: 650px; width: 95%; max-height: 85vh; overflow: hidden; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); display: flex; flex-direction: column; border: 1px solid var(--border-color);">
            <div style="padding: 25px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--bg-card);">
                <h2 style="margin:0; font-size: 1.4rem; display:flex; align-items:center; gap:12px; font-family: 'Righteous', sans-serif;">
                    <i class="material-icons-round" style="color: var(--accent);">person_add</i> Registrar Nuevo Usuario
                </h2>
                <button type="button" onclick="document.getElementById('modal-crear-usuario').style.display='none'" style="background: var(--bg-dark); color: var(--text-muted); border: none; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items:center; justify-content: center; transition: 0.3s;">
                    <i class="material-icons-round" style="font-size: 20px;">close</i>
                </button>
            </div>

            <div style="padding: 25px; overflow-y: auto; flex: 1;">
                <form id="form-crear-usuario">
                    <p style="color: var(--text-gray); font-size: 0.85rem; margin-bottom: 20px; text-transform: uppercase; font-weight: 700;">Información de Cuenta</p>
                    
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                        <div style="grid-column: span 1;">
                            <label style="display:block; font-size: 0.75rem; color: var(--text-gray); margin-bottom: 8px; font-weight: 600;">USUARIO <span style="color:var(--danger)">*</span></label>
                            <input type="text" id="nuevo-user-login" required style="width:100%; padding: 12px; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-white); border-radius: 10px; outline:none; box-sizing:border-box;">
                        </div>
                        <div style="grid-column: span 1;">
                            <label style="display:block; font-size: 0.75rem; color: var(--text-gray); margin-bottom: 8px; font-weight: 600;">CONTRASEÑA <span style="color:var(--danger)">*</span></label>
                            <input type="password" id="nuevo-user-clave" required style="width:100%; padding: 12px; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-white); border-radius: 10px; outline:none; box-sizing:border-box;">
                        </div>
                        <div style="grid-column: span 2;">
                            <label style="display:block; font-size: 0.75rem; color: var(--text-gray); margin-bottom: 8px; font-weight: 600;">ROL DE ACCESO <span style="color:var(--danger)">*</span></label>
                            <select id="nuevo-user-rol" required style="width:100%; padding: 12px; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-white); border-radius: 10px; outline:none; box-sizing:border-box; ${miRol === 'Trabajador' ? 'pointer-events: none; opacity: 0.7;' : ''}">
                                ${opcionesRolCrear}
                            </select>
                        </div>
                    </div>

                    <p style="color: var(--text-gray); font-size: 0.85rem; margin-top: 30px; margin-bottom: 20px; text-transform: uppercase; font-weight: 700;">Detalles Personales</p>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                        <div>
                            <label style="display:block; font-size: 0.75rem; color: var(--text-gray); margin-bottom: 8px;">NOMBRE</label>
                            <input type="text" id="nuevo-user-nombre" style="width:100%; padding: 12px; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-white); border-radius: 10px; outline:none; box-sizing:border-box;">
                        </div>
                        <div>
                            <label style="display:block; font-size: 0.75rem; color: var(--text-gray); margin-bottom: 8px;">APELLIDO</label>
                            <input type="text" id="nuevo-user-apellido" style="width:100%; padding: 12px; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-white); border-radius: 10px; outline:none; box-sizing:border-box;">
                        </div>
                        <div>
                            <label style="display:block; font-size: 0.75rem; color: var(--text-gray); margin-bottom: 8px;">EMAIL</label>
                            <input type="email" id="nuevo-user-correo" style="width:100%; padding: 12px; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-white); border-radius: 10px; outline:none; box-sizing:border-box;">
                        </div>
                        <div>
                            <label style="display:block; font-size: 0.75rem; color: var(--text-gray); margin-bottom: 8px;">TELÉFONO</label>
                            <input type="text" id="nuevo-user-telefono" style="width:100%; padding: 12px; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-white); border-radius: 10px; outline:none; box-sizing:border-box;">
                        </div>
                    </div>

                    <div id="seccion-permisos" style="display: none; margin-top: 25px; background: var(--bg-dark); padding: 20px; border-radius: 15px; border: 1px solid var(--border-color);">
                        <h4 style="margin-top:0; margin-bottom: 15px; color: var(--warning); display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                            <i class="material-icons-round">vpn_key</i> Permisos del Trabajador
                        </h4>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;" id="contenedor-checkbox-permisos">
                            <label style="display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: var(--text-main); cursor: pointer;"><input type="checkbox" class="chk-permiso" value="mod-productos-todos"> Productos</label>
                            <label style="display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: var(--text-main); cursor: pointer;"><input type="checkbox" class="chk-permiso" value="mod-productos-servicios"> Categorías</label>
                            <label style="display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: var(--text-main); cursor: pointer;"><input type="checkbox" class="chk-permiso" value="mod-analisis-resumen"> Resumen Análisis</label>
                            <label style="display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: var(--text-main); cursor: pointer;"><input type="checkbox" class="chk-permiso" value="mod-analisis-volumen"> Volumen de Ventas</label>
                            <label style="display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: var(--text-main); cursor: pointer;"><input type="checkbox" class="chk-permiso" value="mod-analisis-ganancias"> Ganancias</label>
                            <label style="display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: var(--text-main); cursor: pointer;"><input type="checkbox" class="chk-permiso" value="mod-usuarios-crear"> Crear Usuarios</label>
                            <label style="display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: var(--text-main); cursor: pointer;"><input type="checkbox" class="chk-permiso" value="mod-usuarios-recargas"> Recargas</label>
                            <label style="display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: var(--text-main); cursor: pointer;"><input type="checkbox" class="chk-permiso" value="mod-tickets-pendientes"> Tickets Pendientes</label>
                            <label style="display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: var(--text-main); cursor: pointer;"><input type="checkbox" class="chk-permiso" value="mod-tickets-resueltos"> Tickets Resueltos</label>
                        </div>
                        
                        <button type="button" id="btn-marcar-todos-permisos-crear" style="margin-top: 15px; background: transparent; color: var(--accent); border: 1px solid var(--accent); padding: 5px 10px; font-size: 0.7rem; border-radius: 6px; cursor: pointer;">Seleccionar Todos</button>
                    </div>
                </form>
            </div>

            <div style="padding: 20px 25px; border-top: 1px solid var(--border-color); display: flex; gap: 15px; background: var(--bg-card);">
                <button type="button" id="btn-limpiar-form-usuario" style="padding: 12px 20px; background: transparent; color: var(--text-gray); border: 1px solid var(--border-color); border-radius: 10px; font-weight: 600; cursor: pointer; flex: 1;">Limpiar</button>
                <button type="submit" form="form-crear-usuario" id="btn-guardar-usuario" style="padding: 12px 20px; background: var(--accent); color: #fff; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; flex: 2; display: flex; justify-content: center; align-items: center; gap: 8px;">
                    <i class="material-icons-round">save</i> Guardar Usuario
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    initEventosModalCrear();
}

function prepararModalEdicionUsuario() {
    if (!document.getElementById('modal-editar-usuario')) {
        const modal = document.createElement('div');
        modal.id = 'modal-editar-usuario';
        modal.className = 'modal-overlay';
        
        Object.assign(modal.style, {
            display: 'none', position: 'fixed', top: '0', left: '0',
            width: '100%', height: '100%', background: 'rgba(10, 15, 25, 0.95)', 
            zIndex: '9995', alignItems: 'center', justifyContent: 'center'
        });

        modal.innerHTML = `
            <div class="modal-content" style="background: var(--bg-main); color: var(--text-main); padding: 0; position: relative; max-width: 650px; width: 95%; max-height: 90vh; overflow: hidden; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); display: flex; flex-direction: column; border: 1px solid var(--border-color);">
                <div style="padding: 25px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--bg-card);">
                    <h3 id="titulo-modal-usr" style="color: var(--text-main); margin: 0; display: flex; align-items: center; gap: 8px; font-family: 'Righteous', sans-serif;"><i class="material-icons-round" style="color: var(--accent);">manage_accounts</i> Editar Usuario</h3>
                    <button type="button" onclick="document.getElementById('modal-editar-usuario').style.display='none'" style="background: var(--bg-dark); color: var(--text-muted); border: none; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items:center; justify-content: center; transition: 0.3s;">
                        <i class="material-icons-round" style="font-size: 20px;">close</i>
                    </button>
                </div>
                
                <div style="padding: 25px; overflow-y: auto; flex: 1;">
                    <form id="form-editar-usuario">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px;">
                            <div>
                                <label style="display:block; font-size: 0.8rem; font-weight: 800; color: var(--text-gray); text-transform: uppercase; margin-bottom: 5px;">Usuario (Login):</label>
                                <input type="text" id="edit-usr-login" readonly style="width:100%; padding: 12px; background: var(--bg-dark); opacity: 0.7; cursor: not-allowed; border: 1px solid var(--border-color); color: var(--text-white); border-radius: 10px; box-sizing:border-box;">
                            </div>
                            <div id="container-edit-clave" style="display: none;">
                                <label style="display:block; font-size: 0.8rem; font-weight: 800; color: var(--text-gray); text-transform: uppercase; margin-bottom: 5px;">Nueva Contraseña <span style="font-size: 0.7rem; text-transform:none; font-weight:normal;">(Opcional)</span>:</label>
                                <input type="password" id="edit-usr-clave" placeholder="Dejar en blanco para no cambiar" style="width:100%; padding: 12px; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-white); border-radius: 10px; box-sizing:border-box; outline:none;">
                            </div>
                            <div>
                                <label style="display:block; font-size: 0.8rem; font-weight: 800; color: var(--text-gray); text-transform: uppercase; margin-bottom: 5px;">Rol:</label>
                                <select id="edit-usr-rol" required style="width:100%; padding: 12px; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-white); border-radius: 10px; box-sizing:border-box; outline:none;">
                                    <option value="Cliente">Cliente</option>
                                    <option value="Trabajador">Trabajador</option>
                                    <option value="Admin">Administrador</option>
                                </select>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            <div><label style="display:block; font-size: 0.8rem; font-weight: 800; color: var(--text-gray); text-transform: uppercase; margin-bottom: 5px;">Nombre:</label><input type="text" id="edit-usr-nombre" style="width:100%; padding: 12px; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-white); border-radius: 10px; box-sizing:border-box; outline:none;"></div>
                            <div><label style="display:block; font-size: 0.8rem; font-weight: 800; color: var(--text-gray); text-transform: uppercase; margin-bottom: 5px;">Apellido:</label><input type="text" id="edit-usr-apellido" style="width:100%; padding: 12px; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-white); border-radius: 10px; box-sizing:border-box; outline:none;"></div>
                            <div><label style="display:block; font-size: 0.8rem; font-weight: 800; color: var(--text-gray); text-transform: uppercase; margin-bottom: 5px;">Correo:</label><input type="email" id="edit-usr-correo" style="width:100%; padding: 12px; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-white); border-radius: 10px; box-sizing:border-box; outline:none;"></div>
                            <div><label style="display:block; font-size: 0.8rem; font-weight: 800; color: var(--text-gray); text-transform: uppercase; margin-bottom: 5px;">Teléfono:</label><input type="text" id="edit-usr-telefono" style="width:100%; padding: 12px; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-white); border-radius: 10px; box-sizing:border-box; outline:none;"></div>
                        </div>

                        <div id="edit-seccion-permisos" style="display: none; margin-top: 15px; background: var(--bg-dark); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
                            <h4 style="margin-top:0; margin-bottom: 15px; color: var(--warning); display: flex; align-items: center; gap: 8px;">
                                <i class="material-icons-round">security</i> Permisos (Trabajador)
                            </h4>
                            
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;" id="edit-checkbox-permisos">
                                <label style="display:flex; align-items:center; gap:8px; color: var(--text-main);"><input type="checkbox" class="edit-chk-permiso" value="mod-productos-todos"> Todos los Productos</label>
                                <label style="display:flex; align-items:center; gap:8px; color: var(--text-main);"><input type="checkbox" class="edit-chk-permiso" value="mod-productos-servicios"> Categorías</label>
                                <label style="display:flex; align-items:center; gap:8px; color: var(--text-main);"><input type="checkbox" class="edit-chk-permiso" value="mod-analisis-resumen"> Resumen Análisis</label>
                                <label style="display:flex; align-items:center; gap:8px; color: var(--text-main);"><input type="checkbox" class="edit-chk-permiso" value="mod-analisis-volumen"> Volumen de Ventas</label>
                                <label style="display:flex; align-items:center; gap:8px; color: var(--text-main);"><input type="checkbox" class="edit-chk-permiso" value="mod-analisis-ganancias"> Ganancias</label>
                                <label style="display:flex; align-items:center; gap:8px; color: var(--text-main);"><input type="checkbox" class="edit-chk-permiso" value="mod-usuarios-crear"> Crear Usuarios</label>
                                <label style="display:flex; align-items:center; gap:8px; color: var(--text-main);"><input type="checkbox" class="edit-chk-permiso" value="mod-usuarios-recargas"> Recargas</label>
                                <label style="display:flex; align-items:center; gap:8px; color: var(--text-main);"><input type="checkbox" class="edit-chk-permiso" value="mod-tickets-pendientes"> Tickets Pendientes</label>
                                <label style="display:flex; align-items:center; gap:8px; color: var(--text-main);"><input type="checkbox" class="edit-chk-permiso" value="mod-tickets-resueltos"> Tickets Resueltos</label>
                            </div>

                            <div style="margin-top: 15px; border-top: 1px dashed var(--border-color); padding-top: 10px;">
                                <button type="button" id="edit-btn-marcar-todos-permisos" style="background: transparent; color: var(--accent); border: 1px solid var(--accent); padding: 6px 12px; font-size: 0.75rem; box-shadow: none; border-radius: 6px;">Seleccionar Todos</button>
                            </div>
                        </div>
                    </form>
                </div>

                <div style="padding: 20px 25px; border-top: 1px solid var(--border-color); display: flex; gap: 15px; background: var(--bg-card);">
                    <button type="button" onclick="document.getElementById('modal-editar-usuario').style.display='none'" style="padding: 12px 20px; background: transparent; color: var(--text-gray); border: 1px solid var(--border-color); border-radius: 10px; font-weight: 600; cursor: pointer; flex: 1;">Cancelar</button>
                    <button type="submit" form="form-editar-usuario" id="btn-actualizar-usr" style="padding: 12px 20px; background: var(--accent); color: #fff; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; flex: 2; display: flex; justify-content: center; align-items: center; gap: 8px;">
                        <i class="material-icons-round">save</i> Actualizar
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // --- CERRAR AL HACER CLIC AFUERA ---
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });

        document.getElementById('edit-usr-rol').addEventListener('change', (e) => {
            const seccion = document.getElementById('edit-seccion-permisos');
            if (e.target.value === 'Trabajador') {
                seccion.style.display = 'block';
                seccion.style.animation = 'fadeIn 0.3s ease';
            } else {
                seccion.style.display = 'none';
            }
        });

        const btnMarcarTodos = document.getElementById('edit-btn-marcar-todos-permisos');
        const checkboxesPermisos = document.querySelectorAll('.edit-chk-permiso');
        if (btnMarcarTodos) {
            btnMarcarTodos.addEventListener('click', () => {
                const estanTodosMarcados = Array.from(checkboxesPermisos).every(chk => chk.checked);
                if (estanTodosMarcados) {
                    checkboxesPermisos.forEach(chk => chk.checked = false);
                    btnMarcarTodos.innerText = 'Seleccionar Todos';
                } else {
                    checkboxesPermisos.forEach(chk => chk.checked = true);
                    btnMarcarTodos.innerText = 'Desmarcar Todos';
                }
            });
        }
    }
}

// ==========================================
// 4. PETICIONES Y MOTOR DE FILTROS DE TABLA
// ==========================================
async function peticionUsuariosAPI(datos) {
    datos.usuario = sessionStorage.getItem('admin_user');
    datos.token = sessionStorage.getItem('admin_token');
    try {
        const response = await fetch(API_ADMIN_USERS, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos)
        });
        return await response.json();
    } catch (error) {
        return { success: false, msg: "Error de conexión." };
    }
}

async function cargarUsuariosBase() {
    const tbody = document.getElementById('tabla-usuarios-body');
    if(!tbody) return;
    
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 40px;"><i class="material-icons-round" style="animation: spin 1s linear infinite; color: var(--accent); font-size: 2rem;">autorenew</i></td></tr>`;

    const res = await peticionUsuariosAPI({ accion: 'getUsuariosAdmin' });

    if (res.success) {
        usuariosDataOriginal = res.datos;
        ejecutarFiltrosYRenderUsuarios();
    } else {
        if(typeof mostrarToast === 'function') mostrarToast("Error al cargar usuarios: " + res.msg, 'error'); 
        else alert("Error al cargar usuarios: " + res.msg);
    }
}

window.cargarUsuarios = cargarUsuariosBase;

function ejecutarFiltrosYRenderUsuarios() {
    const filtroTexto = (document.getElementById('buscar-usuario')?.value || '').toLowerCase().trim();
    const filtroRol = (document.getElementById('filtro-rol-usr')?.value || '').toLowerCase().trim();
    
    // EXTRAEMOS LOS PERMISOS DEL USUARIO LOGUEADO PARA LA TABLA
    const miRol = sessionStorage.getItem('admin_rol'); 
    let permisosActuales = [];
    try { permisosActuales = JSON.parse(sessionStorage.getItem('admin_permisos') || "[]"); } catch(e){}

    let datosFiltrados = usuariosDataOriginal.filter(usr => {
        let matchTexto = true;
        let matchRol = true;

        if (filtroTexto !== '') {
            let cadenaBusqueda = `${usr.usuario} ${usr.nombre || ''} ${usr.correo || ''}`.toLowerCase();
            matchTexto = cadenaBusqueda.includes(filtroTexto);
        }

        if (filtroRol !== '') {
            matchRol = (usr.rol || '').toLowerCase() === filtroRol;
        }
        
        return matchTexto && matchRol;
    });

    // --- NUEVO MOTOR DE ORDENAMIENTO DE USUARIOS ---
    if (window.usrColumnaOrden) {
        datosFiltrados.sort((a, b) => {
            let valA, valB;
            
            switch (window.usrColumnaOrden) {
                case 'id': 
                    valA = parseInt(a.id) || 0; 
                    valB = parseInt(b.id) || 0; 
                    break;
                case 'saldo': 
                    valA = parseFloat(a.saldo) || 0; 
                    valB = parseFloat(b.saldo) || 0; 
                    break;
                case 'usuario': 
                    valA = (a.usuario || '').toLowerCase(); 
                    valB = (b.usuario || '').toLowerCase(); 
                    break;
                case 'rol': 
                    valA = (a.rol || '').toLowerCase(); 
                    valB = (b.rol || '').toLowerCase(); 
                    break;
                case 'correo': 
                    valA = (a.correo || '').toLowerCase(); 
                    valB = (b.correo || '').toLowerCase(); 
                    break;
                default: 
                    valA = parseInt(a.id) || 0; 
                    valB = parseInt(b.id) || 0;
            }

            if (valA < valB) return window.usrDireccionOrden === 'asc' ? -1 : 1;
            if (valA > valB) return window.usrDireccionOrden === 'asc' ? 1 : -1;
            return 0;
        });
    }
    // -----------------------------------------------

    let totalItems = datosFiltrados.length;
    usrTotalPaginas = Math.ceil(totalItems / usrLimitePagina) || 1;
    
    if (usrPaginaActual > usrTotalPaginas) usrPaginaActual = Math.max(1, usrTotalPaginas);

    let startIndex = (usrPaginaActual - 1) * usrLimitePagina;
    let endIndex = startIndex + usrLimitePagina;
    let datosPagina = datosFiltrados.slice(startIndex, endIndex);

    const tbody = document.getElementById('tabla-usuarios-body');
    tbody.innerHTML = '';
    
    renderPaginacionUsuarios(totalItems);

    const chkAll = document.getElementById('chk-all-usr');
    if(chkAll) chkAll.checked = false;
    const btnBulk = document.getElementById('btn-bulk-usr');
    if(btnBulk) btnBulk.style.display = 'none';

    if (datosPagina.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 50px; color: var(--text-gray);">No se encontraron usuarios.</td></tr>`;
        return;
    }

    datosPagina.forEach((usr) => {
        let badgeRol = '';
        if(usr.rol === 'Admin') badgeRol = `<span class="stat-badge warning"><i class="material-icons-round" style="font-size:0.8rem; vertical-align:middle;">local_police</i> Admin</span>`;
        else if (usr.rol === 'Trabajador') badgeRol = `<span class="stat-badge" style="background:var(--accent-light); color:var(--accent); border-color:var(--accent);"><i class="material-icons-round" style="font-size:0.8rem; vertical-align:middle;">engineering</i> Trabajador</span>`;
        else badgeRol = `<span class="stat-badge success"><i class="material-icons-round" style="font-size:0.8rem; vertical-align:middle;">person</i> Cliente</span>`;

        const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
        const saldoFormat = fmt.format(parseFloat(usr.saldo) || 0);

        // LÓGICA DE RESTRICCIONES (Bloqueo de Checkbox)
        let disableCheck = (miRol === 'Trabajador' && usr.rol === 'Admin') ? 'disabled' : '';

        // --- CONSTRUCCIÓN DINÁMICA Y SEGURA DE LOS BOTONES DE LA FILA ---
        const objEdit = encodeURIComponent(JSON.stringify(usr));
        let htmlBotones = '';

        // 1. Botón Editar: Se muestra si eres Admin O si tienes específicamente el permiso de editar usuarios
        if (miRol === 'Admin' || permisosActuales.includes('mod-usuarios-editar')) {
            // Un trabajador no debe poder editar al Admin
            if (!(miRol === 'Trabajador' && usr.rol === 'Admin')) {
                htmlBotones += `<button class="btn-editar-usr" data-obj="${objEdit}" style="background: var(--accent-light); color: var(--accent); padding: 6px; box-shadow: none; border: none; border-radius: 6px; cursor: pointer; margin-right: 4px;" title="Editar Usuario"><i class="material-icons-round">edit</i></button>`;
            }
        }

        // 2. Botón Recargas: Se muestra si eres Admin O si tienes específicamente el permiso de recargas
        if (miRol === 'Admin' || permisosActuales.includes('mod-usuarios-recargas')) {
            htmlBotones += `<button class="btn-recargar-usr" data-usuario="${usr.usuario}" style="background: rgba(16, 185, 129, 0.1); color: var(--success); padding: 6px; box-shadow: none; border: none; border-radius: 6px; cursor: pointer; margin-right: 4px;" title="Recargar / Multar Saldo"><i class="material-icons-round">account_balance_wallet</i></button>`;
        }

        // 3. Botón Movimientos: Se muestra si eres Admin O si tienes específicamente el permiso de movimientos (ganancias)
        if (miRol === 'Admin' || permisosActuales.includes('mod-analisis-ganancias')) {
            htmlBotones += `<button class="btn-movimientos-usr" data-usuario="${usr.usuario}" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 6px; box-shadow: none; border: none; border-radius: 6px; cursor: pointer; margin-right: 4px;" title="Ver Historial de Movimientos"><i class="material-icons-round">history</i></button>`;
        }

        // 4. NUEVO: Botón Asignar Regalo / Cuenta Manual
        if (miRol === 'Admin' || permisosActuales.includes('mod-asignacion') || permisosActuales.includes('mod-inventario')) {
            htmlBotones += `<button class="btn-asignar-regalo-usr" data-usuario="${usr.usuario}" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; padding: 6px; box-shadow: none; border: none; border-radius: 6px; cursor: pointer; margin-right: 4px;" title="Asignar Cuenta Manual (Regalo / Sin Cobro)"><i class="material-icons-round">card_giftcard</i></button>`;
        }

        // 5. Botón Borrar/Papelera: (Nunca borra a un Admin. Si es Trabajador, necesita permiso de editar)
        if (miRol === 'Admin' || (miRol === 'Trabajador' && usr.rol !== 'Admin' && permisosActuales.includes('mod-usuarios-editar'))) {
            htmlBotones += `<button class="btn-borrar-usr" data-id="${usr.id}" data-rol="${usr.rol}" style="background: var(--danger-bg); color: var(--danger); padding: 6px; box-shadow: none; border: none; border-radius: 6px; cursor: pointer;" title="Enviar a Papelera"><i class="material-icons-round">delete</i></button>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align: center;"><input type="checkbox" class="chk-item-usr" value="${usr.id}" onchange="checkIndividualUsr('chk-item-usr', 'btn-bulk-usr', 'chk-all-usr')" ${disableCheck}></td>
            <td style="color: var(--text-gray); font-weight: 800;">#${usr.id}</td>
            <td><strong style="color: var(--text-main); font-size:1rem;">${usr.usuario}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">${usr.nombre || ''} ${usr.apellido || ''}</span></td>
            <td>${badgeRol}</td>
            <td style="font-size: 0.85rem;">${usr.correo || '<span style="color:var(--text-muted);">N/A</span>'}</td>
            <td style="font-size: 0.85rem;">${usr.telefono || '<span style="color:var(--text-muted);">N/A</span>'}</td>
            <td><strong style="color:var(--success); font-size:1.05rem;">${saldoFormat}</strong></td>
            <td style="text-align: center; white-space: nowrap;">
                ${htmlBotones}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ==========================================
// 5. PAGINACIÓN DE USUARIOS
// ==========================================
window.renderPaginacionUsuarios = function(totalItems = 0) {
    const container = document.getElementById('paginacion-usuarios-container');
    if (!container) return;

    let html = `<span style="color: var(--text-gray); margin-right: 15px;">Página ${usrPaginaActual} de ${usrTotalPaginas} | Total: ${totalItems}</span>`;

    let firstDisabled = usrPaginaActual === 1 ? 'opacity: 0.5; pointer-events: none;' : '';
    html += `<button onclick="cambiarPaginaUsr(1)" style="width: 35px; height: 35px; padding: 0; display: flex; align-items: center; justify-content: center; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); box-shadow: none; border-radius: 6px; cursor: pointer; margin: 0 2px; ${firstDisabled}"><i class="material-icons-round" style="font-size: 1.2rem;">first_page</i></button>`;

    let prevDisabled = usrPaginaActual === 1 ? 'opacity: 0.5; pointer-events: none;' : '';
    html += `<button onclick="cambiarPaginaUsr(${usrPaginaActual - 1})" style="width: 35px; height: 35px; padding: 0; display: flex; align-items: center; justify-content: center; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); box-shadow: none; border-radius: 6px; cursor: pointer; margin: 0 2px; ${prevDisabled}"><i class="material-icons-round" style="font-size: 1.2rem;">chevron_left</i></button>`;

    let startPage = Math.max(1, usrPaginaActual - 1);
    let endPage = Math.min(usrTotalPaginas, startPage + 2);
    if (endPage - startPage < 2) startPage = Math.max(1, endPage - 2);

    for (let i = startPage; i <= endPage; i++) {
        let isAct = i === usrPaginaActual;
        html += `<button onclick="cambiarPaginaUsr(${i})" style="width: 35px; height: 35px; padding: 0; display: flex; align-items: center; justify-content: center; background: ${isAct ? 'var(--accent)' : 'var(--bg-card)'}; color: ${isAct ? '#fff' : 'var(--text-main)'}; border: 1px solid var(--border-color); box-shadow: none; border-radius: 6px; cursor: pointer; margin: 0 2px;">${i}</button>`;
    }

    let nextDisabled = usrPaginaActual === usrTotalPaginas || usrTotalPaginas === 0 ? 'opacity: 0.5; pointer-events: none;' : '';
    html += `<button onclick="cambiarPaginaUsr(${usrPaginaActual + 1})" style="width: 35px; height: 35px; padding: 0; display: flex; align-items: center; justify-content: center; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); box-shadow: none; border-radius: 6px; cursor: pointer; margin: 0 2px; ${nextDisabled}"><i class="material-icons-round" style="font-size: 1.2rem;">chevron_right</i></button>`;

    let lastDisabled = usrPaginaActual === usrTotalPaginas || usrTotalPaginas === 0 ? 'opacity: 0.5; pointer-events: none;' : '';
    html += `<button onclick="cambiarPaginaUsr(${usrTotalPaginas})" style="width: 35px; height: 35px; padding: 0; display: flex; align-items: center; justify-content: center; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); box-shadow: none; border-radius: 6px; cursor: margin: 0 2px; ${lastDisabled}"><i class="material-icons-round" style="font-size: 1.2rem;">last_page</i></button>`;

    container.innerHTML = html;
};

window.cambiarPaginaUsr = function(nuevaPagina) {
    if (nuevaPagina >= 1 && nuevaPagina <= usrTotalPaginas && nuevaPagina !== usrPaginaActual) {
        usrPaginaActual = nuevaPagina;
        ejecutarFiltrosYRenderUsuarios();
    }
};

// ==========================================
// 6. FUNCION DE APERTURA EDICION USUARIO
// ==========================================
function prepararEdicionUsuario(objEncoded) {
    let usr;
    try {
        usr = JSON.parse(decodeURIComponent(objEncoded));
    } catch(e) {
        console.error("Error al leer datos del usuario", e);
        if(typeof mostrarToast === 'function') mostrarToast("Error al procesar los datos del usuario.", "error");
        return;
    }

    const miRol = sessionStorage.getItem('admin_rol');

    // RESTRICCIÓN DE SEGURIDAD VISUAL: Trabajador no puede editar a un Admin.
    if (miRol === 'Trabajador' && usr.rol === 'Admin') {
        if(typeof mostrarToast === 'function') mostrarToast("No tienes permisos para editar a un Administrador.", "error");
        return;
    }

    usuarioEditandoID = usr.id; 

    // Llenar campos básicos
    document.getElementById('edit-usr-login').value = usr.usuario;
    document.getElementById('edit-usr-nombre').value = usr.nombre || '';
    document.getElementById('edit-usr-apellido').value = usr.apellido || '';
    document.getElementById('edit-usr-correo').value = usr.correo || '';
    document.getElementById('edit-usr-telefono').value = usr.telefono || '';

    // Manejo de Permisos Visuales y Selector de Rol
    const selectRol = document.getElementById('edit-usr-rol');
    const seccionPermisos = document.getElementById('edit-seccion-permisos');
    const containerClave = document.getElementById('container-edit-clave');
    const inputClave = document.getElementById('edit-usr-clave');
    const checkboxes = document.querySelectorAll('.edit-chk-permiso');
    const btnMarcarTodos = document.getElementById('edit-btn-marcar-todos-permisos');
    
    selectRol.value = usr.rol || 'Cliente';
    checkboxes.forEach(chk => chk.checked = false);

    // RESTRICCIÓN: Si soy Trabajador, se me bloquea el selector de rol, la bóveda de permisos y NO veo el input de clave.
    if (miRol === 'Trabajador') {
        selectRol.disabled = true;
        seccionPermisos.style.display = 'none';
        containerClave.style.display = 'none'; 
        inputClave.value = '';
    } else {
        // Soy Admin, puedo modificar roles y veo el campo para cambiar claves
        selectRol.disabled = false;
        containerClave.style.display = 'block'; 
        inputClave.value = ''; 
        
        if (usr.rol === 'Trabajador') {
            seccionPermisos.style.display = 'block';
            try {
                let permisosArray = JSON.parse(usr.permisos || "[]");
                checkboxes.forEach(chk => {
                    if(permisosArray.includes(chk.value)) chk.checked = true;
                });
                
                if(btnMarcarTodos) {
                    const estanTodosMarcados = Array.from(checkboxes).every(chk => chk.checked);
                    btnMarcarTodos.innerText = estanTodosMarcados ? 'Desmarcar Todos' : 'Seleccionar Todos';
                }
            } catch (e) { console.error("Error parseando permisos", e); }
        } else {
            seccionPermisos.style.display = 'none';
        }
    }

    // ABRIR EL MODAL 
    const modalEdit = document.getElementById('modal-editar-usuario');
    if(modalEdit) {
        modalEdit.style.display = 'flex';
    }
}

// ==========================================
// 7. LÓGICA DE ASIGNACIÓN MANUAL (NUEVA) - CARGA ASÍNCRONA
// ==========================================
window.abrirModalAsignacionManual = function(usuarioObjetivo) {
    const modal = document.getElementById('modal-asignacion-regalo');
    if (!modal) return;
    
    // 1. Rellenar datos locales instantáneos
    document.getElementById('asig-usuario-objetivo').value = usuarioObjetivo;
    document.getElementById('asig-usuario-label').innerText = usuarioObjetivo;
    
    // 2. Limpiar Selects
    document.getElementById('asig-stock-servicio').innerHTML = '<option value="">Cargando servicios...</option>';
    document.getElementById('asig-nueva-servicio').innerHTML = '<option value="">Cargando servicios...</option>';
    document.getElementById('asig-stock-cuenta').innerHTML = '<option value="">Primero seleccione un servicio...</option>';
    document.getElementById('asig-stock-cuenta').disabled = true;
    document.getElementById('asig-nueva-credenciales').value = '';
    
    // 3. Mostrar modal de inmediato
    cambiarTabAsignacion('stock'); 
    modal.style.display = 'flex';
    
    // 4. Lanzar petición en segundo plano
    cargarServiciosEnSegundoPlano();
};

async function cargarServiciosEnSegundoPlano() {
    try {
        const resServ = await peticionUsuariosAPI({ accion: 'getServiciosAdmin' });
        if (resServ.success) {
            let htmlServicios = '<option value="">Seleccione un servicio...</option>';
            resServ.datos.forEach(s => {
                htmlServicios += `<option value="${s.nombre}">${s.nombre}</option>`;
            });
            document.getElementById('asig-stock-servicio').innerHTML = htmlServicios;
            document.getElementById('asig-nueva-servicio').innerHTML = htmlServicios;
        } else {
            const errHtml = '<option value="">Error al cargar servicios</option>';
            document.getElementById('asig-stock-servicio').innerHTML = errHtml;
            document.getElementById('asig-nueva-servicio').innerHTML = errHtml;
        }
    } catch (e) {
        console.error(e);
        const errHtml = '<option value="">Error de conexión</option>';
        document.getElementById('asig-stock-servicio').innerHTML = errHtml;
        document.getElementById('asig-nueva-servicio').innerHTML = errHtml;
    }
}

window.cerrarModalAsignacion = function() {
    const modal = document.getElementById('modal-asignacion-regalo');
    if (modal) modal.style.display = 'none';
};

window.cambiarTabAsignacion = function(tabName) {
    const btnStock = document.getElementById('tab-asig-stock');
    const btnNueva = document.getElementById('tab-asig-nueva');
    const panelStock = document.getElementById('panel-asig-stock');
    const panelNueva = document.getElementById('panel-asig-nueva');
    
    if (tabName === 'stock') {
        btnStock.classList.add('active');
        btnNueva.classList.remove('active');
        panelStock.style.display = 'block';
        panelNueva.style.display = 'none';
    } else {
        btnNueva.classList.add('active');
        btnStock.classList.remove('active');
        panelNueva.style.display = 'block';
        panelStock.style.display = 'none';
    }
};

window.cargarCuentasAsignacionLibres = async function(servicioNombre) {
    const selectCuentas = document.getElementById('asig-stock-cuenta');
    
    if (!servicioNombre) {
        selectCuentas.innerHTML = '<option value="">Primero seleccione un servicio...</option>';
        selectCuentas.disabled = true;
        return;
    }
    
    selectCuentas.innerHTML = '<option value="">Cargando cuentas...</option>';
    selectCuentas.disabled = true;
    
    try {
        // Hacemos una petición rápida al inventario filtrando por este servicio
        const res = await peticionUsuariosAPI({ 
            accion: 'getInventario', 
            pagina: 1, 
            limite: 500, // Traemos bastantes para asegurar que haya libres
            filtro: servicioNombre 
        });
        
        if (res.success && res.datos) {
            const cuentasLibres = res.datos.filter(c => c.vendida.toLowerCase() === 'no' && c.servicio_nombre === servicioNombre);
            
            if (cuentasLibres.length > 0) {
                let html = '<option value="">Seleccione una cuenta libre...</option>';
                cuentasLibres.forEach(c => {
                    html += `<option value="${c.id}">${c.cuenta}</option>`;
                });
                selectCuentas.innerHTML = html;
                selectCuentas.disabled = false;
            } else {
                selectCuentas.innerHTML = '<option value="">NO hay cuentas libres de este servicio en stock</option>';
            }
        } else {
            selectCuentas.innerHTML = '<option value="">Error al cargar cuentas</option>';
        }
    } catch (e) {
        selectCuentas.innerHTML = '<option value="">Error de conexión</option>';
    }
};

window.procesarAsignacionRegalo = async function() {
    const tabActiva = document.querySelector('.tab-btn.active').id === 'tab-asig-stock' ? 'stock' : 'nueva';
    const usuarioDestino = document.getElementById('asig-usuario-objetivo').value;
    const btnProcesar = document.getElementById('btn-procesar-asignacion');
    const originalHtml = btnProcesar.innerHTML;
    
    let payload = {
        accion: 'asignarCuentaRegalo',
        usuario_destino: usuarioDestino,
        tipo_asignacion: tabActiva
    };
    
    if (tabActiva === 'stock') {
        const idCuenta = document.getElementById('asig-stock-cuenta').value;
        const servicio = document.getElementById('asig-stock-servicio').value;
        
        if (!servicio || !idCuenta) {
            return typeof mostrarToast === 'function' ? mostrarToast("Selecciona el servicio y la cuenta.", "warning") : alert("Selecciona el servicio y la cuenta.");
        }
        payload.id_cuenta = idCuenta;
        
    } else {
        const servicio = document.getElementById('asig-nueva-servicio').value;
        const credenciales = document.getElementById('asig-nueva-credenciales').value.trim();
        const dias = document.getElementById('asig-nueva-dias').value;
        const fecha = document.getElementById('asig-nueva-fecha').value;
        
        if (!servicio || !credenciales || !dias || !fecha) {
            return typeof mostrarToast === 'function' ? mostrarToast("Completa todos los campos de la nueva cuenta.", "warning") : alert("Completa todos los campos.");
        }
        
        payload.servicio = servicio;
        payload.credenciales = credenciales;
        payload.dias = dias;
        payload.fecha = fecha;
    }
    
    // Procesando...
    btnProcesar.innerHTML = '<i class="material-icons-round" style="animation: spin 1s linear infinite;">autorenew</i> Procesando...';
    btnProcesar.disabled = true;
    
    try {
        const res = await peticionUsuariosAPI(payload);
        if (res.success) {
            if(typeof mostrarToast === 'function') mostrarToast("Cuenta asignada y sincronizada correctamente.", "success");
            cerrarModalAsignacion();
        } else {
            if(typeof mostrarToast === 'function') mostrarToast("Error: " + res.msg, "error");
            else alert("Error: " + res.msg);
        }
    } catch (error) {
        console.error(error);
        if(typeof mostrarToast === 'function') mostrarToast("Error de conexión al servidor.", "error");
    } finally {
        btnProcesar.innerHTML = originalHtml;
        btnProcesar.disabled = false;
    }
};


// ==========================================
// 8. EVENTOS GENERALES
// ==========================================
function initEventosUsuarios() {
    
    // BOTÓN ABRIR MODAL CREAR USUARIO
    document.getElementById('btn-abrir-modal-crear')?.addEventListener('click', () => {
        if (typeof window.abrirModalCreacionUsuario === 'function') {
            window.abrirModalCreacionUsuario();
        }
    });

    // Delegación de clic en tabla
    document.getElementById('tabla-usuarios-body')?.addEventListener('click', async (e) => {
        
        // Clic en Editar
        const btnEdit = e.target.closest('.btn-editar-usr');
        if(btnEdit) prepararEdicionUsuario(btnEdit.dataset.obj);

        // Clic en Borrar
        const btnDel = e.target.closest('.btn-borrar-usr');
        if(btnDel) {
            const miRol = sessionStorage.getItem('admin_rol');
            const rolObjetivo = btnDel.getAttribute('data-rol');
            
            // EL TRABAJADOR NO PUEDE BORRAR AL ADMIN
            if (miRol === 'Trabajador' && rolObjetivo === 'Admin') {
                if(typeof mostrarToast === 'function') mostrarToast("No tienes permisos para eliminar a un Administrador.", "error");
                return;
            }

            if(!confirm("¿Enviar este usuario a la papelera?")) return;
            const res = await peticionUsuariosAPI({ accion: 'moverAPapelera', tabla: 'usuarios', id: btnDel.dataset.id });
            if(typeof mostrarToast === 'function') mostrarToast(res.msg, res.success ? 'success' : 'error'); 
            if(res.success) cargarUsuariosBase();
        }

        // Clic en Recargar (Conexión al JS de recargas)
        const btnRecarga = e.target.closest('.btn-recargar-usr');
        if (btnRecarga) {
            const usuarioObjetivo = btnRecarga.getAttribute('data-usuario');
            if (typeof window.abrirModalRecargaUsuario === 'function') {
                window.abrirModalRecargaUsuario(usuarioObjetivo);
            } else {
                if(typeof mostrarToast === 'function') mostrarToast("El módulo de recargas se está inicializando...", "info");
            }
        }

        // Clic en Movimientos (Conexión al JS de historial/movimientos)
        const btnMovs = e.target.closest('.btn-movimientos-usr');
        if (btnMovs) {
            const usuarioObjetivo = btnMovs.getAttribute('data-usuario');
            if (typeof window.abrirModalMovimientosUsuario === 'function') {
                window.abrirModalMovimientosUsuario(usuarioObjetivo);
            } else {
                if(typeof mostrarToast === 'function') mostrarToast("El módulo de movimientos se está inicializando...", "info");
            }
        }

        // NUEVO: Clic en Asignar Regalo / Cuenta Manual
        const btnRegalo = e.target.closest('.btn-asignar-regalo-usr');
        if (btnRegalo) {
            const usuarioObjetivo = btnRegalo.getAttribute('data-usuario');
            window.abrirModalAsignacionManual(usuarioObjetivo);
        }
    });

    // Filtro Límite
    document.getElementById('filtro-limite-usr')?.addEventListener('change', (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 1) { val = 10; e.target.value = val; }
        usrLimitePagina = val;
        usrPaginaActual = 1; 
        ejecutarFiltrosYRenderUsuarios();
    });

    // Buscador Dinámico en Tiempo Real 
    document.getElementById('buscar-usuario')?.addEventListener('input', (e) => { 
        usrPaginaActual = 1; 
        ejecutarFiltrosYRenderUsuarios(); 
    });

    document.getElementById('filtro-rol-usr')?.addEventListener('change', () => {
        usrPaginaActual = 1; ejecutarFiltrosYRenderUsuarios();
    });

    // Guardar Edición
    const formEditar = document.getElementById('form-editar-usuario');
    if (formEditar) {
        formEditar.addEventListener('submit', async (e) => {
            e.preventDefault();

            const miRol = sessionStorage.getItem('admin_rol');
            const selectRol = document.getElementById('edit-usr-rol');
            const rolSeleccionado = selectRol.value;
            let arregloPermisos = [];
            let nuevaClave = '';

            // Solo recogemos permisos si el dropdown no está desactivado
            if (!selectRol.disabled) {
                if (rolSeleccionado === 'Trabajador') {
                    document.querySelectorAll('.edit-chk-permiso:checked').forEach(chk => {
                        arregloPermisos.push(chk.value);
                    });
                    
                    // INYECCIÓN OCULTA: Forzar siempre el permiso de Editar Usuarios
                    if (!arregloPermisos.includes('mod-usuarios-editar')) {
                        arregloPermisos.push('mod-usuarios-editar');
                    }

                    if (arregloPermisos.length === 0) {
                        if(typeof mostrarToast === 'function') mostrarToast("Debes asignar al menos un permiso al Trabajador.", "warning");
                        return;
                    }
                } else if (rolSeleccionado === 'Admin') {
                    arregloPermisos = ['all'];
                }
            }

            // Extraemos la contraseña solo si soy admin
            if (miRol === 'Admin') {
                nuevaClave = document.getElementById('edit-usr-clave').value.trim();
            }

            const btn = document.getElementById('btn-actualizar-usr');
            const txtOriginal = btn.innerHTML;
            btn.innerHTML = '<i class="material-icons-round" style="animation: spin 1s linear infinite;">autorenew</i> Guardando...';
            btn.disabled = true;

            const payloadData = {
                accion: 'editarUsuarioExistente',
                id: usuarioEditandoID,
                clave: nuevaClave, 
                rol: rolSeleccionado,
                saldo: null, 
                nombre: document.getElementById('edit-usr-nombre').value.trim(),
                apellido: document.getElementById('edit-usr-apellido').value.trim(),
                correo: document.getElementById('edit-usr-correo').value.trim(),
                telefono: document.getElementById('edit-usr-telefono').value.trim(),
                permisos: JSON.stringify(arregloPermisos)
            };

            const res = await peticionUsuariosAPI(payloadData);

            if(typeof mostrarToast === 'function') mostrarToast(res.msg, res.success ? 'success' : 'error');
            btn.innerHTML = txtOriginal;
            btn.disabled = false;
            
            if (res.success) { 
                const modalEdit = document.getElementById('modal-editar-usuario');
                if (modalEdit) modalEdit.style.display = 'none';
                cargarUsuariosBase(); 
            }
        });
    }

    // Borrado Masivo
    document.getElementById('btn-bulk-usr')?.addEventListener('click', async () => {
        const seleccionados = Array.from(document.querySelectorAll('.chk-item-usr:checked')).map(c => c.value);
        if(seleccionados.length === 0) return;
        
        if(!confirm(`¿Enviar ${seleccionados.length} usuarios a la papelera?`)) return;
        
        const btn = document.getElementById('btn-bulk-usr');
        btn.innerHTML = '<i class="material-icons-round" style="animation: spin 1s linear infinite;">autorenew</i> Borrando...';

        const res = await peticionUsuariosAPI({ accion: 'moverAPapeleraMasivo', tabla: 'usuarios', ids: seleccionados });
        if(typeof mostrarToast === 'function') mostrarToast(res.msg, res.success ? 'success' : 'error'); 
        
        if(res.success) {
            btn.style.display = 'none';
            document.getElementById('chk-all-usr').checked = false;
            cargarUsuariosBase();
        } else {
            btn.innerHTML = '<i class="material-icons-round" style="font-size: 1.2rem; vertical-align: middle;">delete_sweep</i> <span>Borrar Selección</span>';
        }
    });
}

// LÓGICA DEL FORMULARIO DE CREAR USUARIO (Se activa cuando envían el form en el Modal)
function initEventosModalCrear() {
    const formCrear = document.getElementById('form-crear-usuario');
    const selectRolCrear = document.getElementById('nuevo-user-rol');
    const seccionPermisosCrear = document.getElementById('seccion-permisos');
    const checkboxesPermisosCrear = document.querySelectorAll('.chk-permiso');
    const btnMarcarTodosCrear = document.getElementById('btn-marcar-todos-permisos-crear');

    if (selectRolCrear) {
        selectRolCrear.addEventListener('change', (e) => {
            if (e.target.value === 'Trabajador') {
                seccionPermisosCrear.style.display = 'block';
                seccionPermisosCrear.style.animation = 'fadeIn 0.3s ease';
            } else {
                seccionPermisosCrear.style.display = 'none';
                checkboxesPermisosCrear.forEach(chk => chk.checked = false);
            }
        });
    }

    if (btnMarcarTodosCrear) {
        btnMarcarTodosCrear.addEventListener('click', () => {
            const estanTodosMarcados = Array.from(checkboxesPermisosCrear).every(chk => chk.checked);
            checkboxesPermisosCrear.forEach(chk => chk.checked = !estanTodosMarcados);
            btnMarcarTodosCrear.innerText = estanTodosMarcados ? 'Seleccionar Todos' : 'Desmarcar Todos';
        });
    }

    document.getElementById('btn-limpiar-form-usuario')?.addEventListener('click', () => {
        if (formCrear) formCrear.reset();
        if (seccionPermisosCrear) seccionPermisosCrear.style.display = 'none';
    });

    if (formCrear) {
        formCrear.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnGuardar = document.getElementById('btn-guardar-usuario');
            const originalHtml = btnGuardar.innerHTML;
            
            btnGuardar.innerHTML = '<i class="material-icons-round" style="animation: spin 1s linear infinite;">autorenew</i> Procesando...';
            btnGuardar.disabled = true;

            let arregloPermisos = [];
            if (selectRolCrear.value === 'Trabajador') {
                checkboxesPermisosCrear.forEach(chk => { if (chk.checked) arregloPermisos.push(chk.value); });
                
                // INYECCIÓN OCULTA: Forzar siempre el permiso de Editar Usuarios
                if (!arregloPermisos.includes('mod-usuarios-editar')) {
                    arregloPermisos.push('mod-usuarios-editar');
                }

                if (arregloPermisos.length === 0) {
                    if (typeof mostrarToast === 'function') {
                        mostrarToast("Selecciona al menos un permiso.", "warning");
                    } else {
                        alert("Selecciona al menos un permiso.");
                    }
                    btnGuardar.innerHTML = originalHtml;
                    btnGuardar.disabled = false;
                    return;
                }
            } else if (selectRolCrear.value === 'Admin') {
                arregloPermisos = ['all'];
            }

            const payloadData = {
                accion: 'crearUsuario',
                usuario: sessionStorage.getItem('admin_user'),
                token: sessionStorage.getItem('admin_token'),
                nuevo_usuario: document.getElementById('nuevo-user-login').value.trim(),
                clave: document.getElementById('nuevo-user-clave').value.trim(),
                rol: selectRolCrear.value,
                nombre: document.getElementById('nuevo-user-nombre').value.trim() || null,
                apellido: document.getElementById('nuevo-user-apellido').value.trim() || null,
                correo: document.getElementById('nuevo-user-correo').value.trim() || null,
                telefono: document.getElementById('nuevo-user-telefono').value.trim() || null,
                permisos: JSON.stringify(arregloPermisos)
            };

            try {
                const response = await fetch(API_ADMIN_USERS, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payloadData)
                });
                const res = await response.json();

                if (res.success) {
                    if(typeof mostrarToast === 'function') mostrarToast("Usuario creado con éxito", "success");
                    document.getElementById('modal-crear-usuario').style.display = 'none';
                    if (typeof window.cargarUsuarios === 'function') window.cargarUsuarios();
                } else {
                    if(typeof mostrarToast === 'function') mostrarToast("Error: " + res.msg, "error");
                    else alert("Error: " + res.msg);
                }
            } catch (error) {
                console.error(error);
                if(typeof mostrarToast === 'function') mostrarToast("Error de conexión.", "error");
            } finally {
                btnGuardar.innerHTML = originalHtml;
                btnGuardar.disabled = false;
            }
        });
    }
}

// ==========================================
// 9. FUNCIONES CHECKBOX Y MODAL
// ==========================================
window.toggleAllChkUsr = function(allId, itemClass, btnId) {
    const checked = document.getElementById(allId).checked;
    document.querySelectorAll('.' + itemClass).forEach(chk => {
        if(!chk.disabled) chk.checked = checked;
    });
    const btn = document.getElementById(btnId);
    if(btn) btn.style.display = (checked && document.querySelectorAll('.' + itemClass + ':not(:disabled):checked').length > 0) ? 'inline-block' : 'none';
}

window.checkIndividualUsr = function(itemClass, btnId, allId) {
    const total = document.querySelectorAll('.' + itemClass + ':not(:disabled)').length;
    const checked = document.querySelectorAll('.' + itemClass + ':not(:disabled):checked').length;
    const allChk = document.getElementById(allId);
    if(allChk) allChk.checked = (total === checked && total > 0);
    const btn = document.getElementById(btnId);
    if(btn) btn.style.display = checked > 0 ? 'inline-block' : 'none';
}

window.cerrarModal = function(id) {
    const m = document.getElementById(id);
    if (m) m.style.display = 'none';
}
// ==========================================
// 10. LÓGICA DE ORDENAMIENTO DINÁMICO
// ==========================================
window.usrColumnaOrden = 'id'; // Por defecto ordena por ID
window.usrDireccionOrden = 'desc';

window.ordenarTablaUsuarios = function(columna) {
    // Si tocan la misma columna, invierte el orden. Si es nueva, la pone descendente por defecto.
    if (window.usrColumnaOrden === columna) {
        window.usrDireccionOrden = window.usrDireccionOrden === 'asc' ? 'desc' : 'asc';
    } else {
        window.usrColumnaOrden = columna;
        window.usrDireccionOrden = 'desc';
    }
    
    // Reseteamos todos los iconos a su estado inactivo
    document.querySelectorAll('.sort-icon-usr').forEach(icon => { 
        icon.innerText = '↕'; 
        icon.style.color = 'var(--text-gray)'; 
    });
    
    // Activamos el icono de la columna seleccionada
    const iconoActivo = document.querySelector(`.sort-icon-usr[data-col="${columna}"]`);
    if(iconoActivo) { 
        iconoActivo.innerText = window.usrDireccionOrden === 'asc' ? '▲' : '▼'; 
        iconoActivo.style.color = 'var(--accent-text)'; 
    }
    
    // Reiniciamos a la página 1 y volvemos a pintar
    usrPaginaActual = 1;
    ejecutarFiltrosYRenderUsuarios();
};
