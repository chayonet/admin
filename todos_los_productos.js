const API_ADMIN_MODULE = `${API_BASE_URL_F}/admin_api.php`;

let productosExistentesEnBD = [];
let productosDataOriginal = []; 
let productosInicializado = false; 

let prodPaginaActual = 1;
let prodTotalPaginas = 1;
let prodLimitePagina = 10; 
let productoEditandoID = null;
let serviciosPrecioCache = {};

document.addEventListener('moduloCargado', (e) => {
    if (e.detail.modulo === 'mod-productos-todos') {
        inicializarModuloProductos();
        cargarProductosBase();
    }
});

function inicializarModuloProductos() {
    if (productosInicializado) return; 
    productosInicializado = true;

    const seccionProductos = document.getElementById('mod-productos-todos');
    if (seccionProductos && seccionProductos.innerHTML.trim() === "") {
        seccionProductos.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                <h2 style="margin:0; color: var(--text-main); font-family: 'Righteous', sans-serif;"><i class="material-icons-round" style="vertical-align: bottom; color: var(--accent);">inventory_2</i> Todos los Productos</h2>
                <div style="display: flex; gap: 10px;">
                    <button id="btn-nuevo-producto" style="width: auto; background: var(--accent); color: #fff; border: none; font-weight: bold; box-shadow: 0 4px 15px var(--accent-glow);"><i class="material-icons-round" style="font-size: 1.2rem;">add_circle</i> Nuevo Producto</button>
                    <button id="btn-importar-masivo-prod" style="width: auto; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color);"><i class="material-icons-round" style="font-size: 1.2rem;">upload_file</i> Importar Masivo</button>
                    <button id="btn-exportar-csv" style="width: auto; background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.3); font-weight: bold;"><i class="material-icons-round" style="font-size: 1.2rem;">table_view</i> CSV</button>
<button id="btn-exportar-txt" style="width: auto; background: rgba(56, 189, 248, 0.1); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); font-weight: bold;"><i class="material-icons-round" style="font-size: 1.2rem;">description</i> TXT</button>
                </div>
            </div>

            <div style="background: var(--bg-card); padding: 15px 20px; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 20px; display: flex; gap: 15px; flex-wrap: wrap; align-items: flex-end; box-shadow: var(--shadow-sm);">
                <div style="flex: 1; min-width: 180px;">
                    <label style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Buscar Credencial/PIN:</label>
                    <div style="position:relative; margin-top:5px;">
                        <i class="material-icons-round" style="position:absolute; left:10px; top:10px; color:var(--text-muted);">search</i>
                        <input type="text" id="buscar-producto" placeholder="Ej. correo@..." style="margin:0; padding-left:40px; width:100%; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-white); border-radius: 8px; outline:none; padding-top:10px; padding-bottom:10px; box-sizing:border-box;">
                    </div>
                </div>
                <div style="flex: 1; min-width: 150px;">
                    <label style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Filtrar Usuario:</label>
                    <div style="position:relative; margin-top:5px;">
                        <i class="material-icons-round" style="position:absolute; left:10px; top:10px; color:var(--text-muted);">person_search</i>
                        <input type="text" id="filtro-usuario-prod" list="lista-usuarios-prod" placeholder="Escribe o selecciona..." style="margin:0; padding-left:40px; width:100%; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-white); border-radius: 8px; outline:none; padding-top:10px; padding-bottom:10px; box-sizing:border-box;">
                        <datalist id="lista-usuarios-prod"></datalist>
                    </div>
                </div>
                <div style="flex: 1; min-width: 150px;">
                    <label style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Servicio:</label>
                    <select id="filtro-categoria-prod" style="margin:0; margin-top:5px; width:100%; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-white); border-radius: 8px; padding:10px; outline:none; box-sizing:border-box;"></select>
                </div>
                <div style="flex: 1; min-width: 150px;">
                    <label style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Estado:</label>
                    <select id="filtro-estado-prod" style="margin:0; margin-top:5px; width:100%; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-white); border-radius: 8px; padding:10px; outline:none; box-sizing:border-box;">
                        <option value="">Todos (Activos)</option>
                        <option value="Disponible">Disponibles (Stock)</option>
                        <option value="Vendida">Vendidas (Activas)</option>
                        <option value="Caducada">Caducadas (0 Días)</option>
                        <option value="Vencida">Historial Archivo / Vencidas</option>
                    </select>
                </div>
                <div style="flex: 0; min-width: 80px;">
                    <label style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Mostrar:</label>
                    <input type="number" id="filtro-limite-prod" value="10" min="1" style="margin:0; margin-top:5px; width:100%; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-white); border-radius: 8px; padding:10px; outline:none; box-sizing:border-box;">
                </div>
            </div>

            <div style="overflow-x: auto; background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
                <table id="tabla-productos" style="margin-top: 0; width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: var(--bg-dark);">
                            <th id="th-chk-prod" style="width: 40px; text-align: center; padding: 15px; border-bottom: 1px solid var(--border-color);"><input type="checkbox" id="chk-all-prod" onchange="toggleAllChkProd('chk-all-prod', 'chk-item-prod', 'bulk-actions-prod')" style="accent-color: var(--accent);"></th>
                            <th style="padding: 15px; color: var(--text-muted); text-transform: uppercase; font-size: 0.75rem; border-bottom: 1px solid var(--border-color); text-align:left;">ID</th>
                            <th style="padding: 15px; color: var(--text-muted); text-transform: uppercase; font-size: 0.75rem; border-bottom: 1px solid var(--border-color); text-align:left;">Servicio</th>
                            <th style="padding: 15px; color: var(--text-muted); text-transform: uppercase; font-size: 0.75rem; border-bottom: 1px solid var(--border-color); text-align:left;">Dato de Acceso</th>
                            <th style="padding: 15px; color: var(--text-muted); text-transform: uppercase; font-size: 0.75rem; border-bottom: 1px solid var(--border-color); text-align:left;">Compra</th>
                            <th style="padding: 15px; color: var(--text-muted); text-transform: uppercase; font-size: 0.75rem; border-bottom: 1px solid var(--border-color); text-align:left;">Días</th>
                            <th style="padding: 15px; color: var(--text-muted); text-transform: uppercase; font-size: 0.75rem; border-bottom: 1px solid var(--border-color); text-align:left;">Estado</th>
                            <th style="padding: 15px; color: var(--text-muted); text-transform: uppercase; font-size: 0.75rem; border-bottom: 1px solid var(--border-color); text-align:left;">Usuario</th>
                            <th style="padding: 15px; color: var(--text-muted); text-transform: uppercase; font-size: 0.75rem; border-bottom: 1px solid var(--border-color); text-align:center;">Acciones Post-Venta</th>
                        </tr>
                    </thead>
                    <tbody id="tabla-productos-body"></tbody>
                </table>
            </div>
            
            <div id="bulk-actions-prod" style="display: none; margin-top: 15px; align-items: center; gap: 10px; flex-wrap: wrap;">
    <span id="bulk-count-label" style="color: var(--text-muted); font-size: 0.85rem; font-weight: 600;"></span>
    <button id="btn-bulk-archivar" style="background: rgba(148,163,184,0.1); color: #94a3b8; border: 1px solid rgba(148,163,184,0.3); width: auto; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px;">
        <i class="material-icons-round" style="font-size: 1.1rem;">inventory_2</i> Archivar
    </button>
    <button id="btn-bulk-reciclar" style="background: rgba(56,189,248,0.1); color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); width: auto; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px;">
        <i class="material-icons-round" style="font-size: 1.1rem;">lock_open</i> Reciclar a Stock
    </button>
    <button id="btn-bulk-renovar" style="background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.3); width: auto; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px;">
        <i class="material-icons-round" style="font-size: 1.1rem;">autorenew</i> Renovar Clientes
    </button>
    <button id="btn-bulk-borrar" style="background: var(--danger-bg); color: var(--danger); border: 1px solid rgba(239,68,68,0.3); width: auto; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px;">
        <i class="material-icons-round" style="font-size: 1.1rem;">delete_sweep</i> Papelera
    </button>
</div>

            <div id="paginacion-productos-container" style="display: flex; gap: 5px; margin-top: 20px; align-items: center; justify-content: center;"></div>
        `;
    }

    prepararModalesProd();
    prepararModalesEspeciales(); 
    
    if(document.getElementById('filtro-categoria-prod')) {
        cargarServiciosEnSelectProd('filtro-categoria-prod');
    }

    const btnNuevoProd = document.getElementById('btn-nuevo-producto');
    if (btnNuevoProd) {
        btnNuevoProd.addEventListener('click', () => {
            if (productoEditandoID !== null) resetFormularioProducto();

            abrirModal('modal-crear-producto'); 

            cargarServiciosEnSelectProd('nuevo-producto-categoria');
            
            const inputFecha = document.getElementById('nuevo-producto-fecha');
            if(inputFecha) {
                const tzOffset = (new Date()).getTimezoneOffset() * 60000;
                inputFecha.value = new Date(Date.now() - tzOffset).toISOString().split('T')[0];
            }
        });
    }

    const btnImportarMasivo = document.getElementById('btn-importar-masivo-prod');
    if (btnImportarMasivo) {
        btnImportarMasivo.addEventListener('click', () => {
            
            abrirModal('modal-importar-producto');

            cargarServiciosEnSelectProd('importar-servicio');
            
            const inputFechaMasiva = document.getElementById('importar-fecha');
            if(inputFechaMasiva) {
                const tzOffset = (new Date()).getTimezoneOffset() * 60000;
                inputFechaMasiva.value = new Date(Date.now() - tzOffset).toISOString().split('T')[0];
            }
        });
    }

    initEventosProductos();
}

function prepararModalesProd() {
    
    if (!document.getElementById('modal-crear-producto')) {
        const modalCrear = document.createElement('div');
        modalCrear.id = 'modal-crear-producto';
        modalCrear.className = 'modal-overlay';
        Object.assign(modalCrear.style, {
            display: 'none', position: 'fixed', top: '0', left: '0',
            width: '100%', height: '100%', background: 'rgba(10, 15, 25, 0.9)', 
            zIndex: '9995', alignItems: 'center', justifyContent: 'center'
        });

        modalCrear.innerHTML = `
            <div class="modal-content" style="background: #1e293b; color: #f8fafc; padding: 0; position: relative; max-width: 550px; width: 95%; max-height: 90vh; overflow: hidden; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); display: flex; flex-direction: column; border: 1px solid #334155;">
                <div style="padding: 25px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; background: #0f172a;">
                    <h3 id="titulo-modal-producto" style="margin:0; font-size: 1.3rem; display:flex; align-items:center; gap:10px; color: #38bdf8;">
                        <i class="material-icons-round">add_circle</i> Agregar Inventario
                    </h3>
                    <button class="btn-close-modal" onclick="cerrarModal('modal-crear-producto')" style="background: #1e293b; color: #94a3b8; border: 1px solid #334155; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items:center; justify-content: center; transition: 0.3s;"><i class="material-icons-round" style="font-size: 1.2rem;">close</i></button>
                </div>
                
                <div style="padding: 25px; overflow-y: auto; flex: 1;">
                    <form id="form-crear-producto">
                        <label style="display:block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px; font-weight: 600;">CATEGORÍA / SERVICIO BASE:</label>
                        <select id="nuevo-producto-categoria" required style="width: 100%; margin-bottom: 20px; padding: 12px; background: #0f172a; border: 1px solid #334155; color: #fff; border-radius: 10px; outline:none; cursor:pointer;"><option value="">Cargando catálogo...</option></select>
                        
                        <label id="label-credenciales" style="display:block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px; font-weight: 600;">DATO DE ACCESO (CUENTA O PIN):</label>
                        <input type="text" id="nuevo-producto-credenciales" placeholder="..." required style="width: 100%; margin-bottom: 5px; padding: 12px; background: #0f172a; border: 1px solid #334155; color: #fff; border-radius: 10px; outline:none; box-sizing: border-box;">
                        <p id="helper-credenciales" style="font-size: 0.75rem; color: #64748b; margin-top: 5px; margin-bottom: 20px;">Selecciona un servicio arriba para ver el formato requerido.</p>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                            <div>
                                <label style="display:block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px; font-weight: 600;">FECHA CREACIÓN:</label>
                                <input type="date" id="nuevo-producto-fecha" required style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid #334155; color: #fff; border-radius: 10px; outline:none; box-sizing: border-box;">
                            </div>
                            <div>
                                <label style="display:block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px; font-weight: 600;">DURACIÓN (DÍAS):</label>
                                <input type="number" id="nuevo-producto-dias" value="30" required style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid #334155; color: #10b981; font-weight: bold; border-radius: 10px; outline:none; box-sizing: border-box;">
                            </div>
                        </div>
                    </form>
                </div>

                <div style="padding: 20px 25px; border-top: 1px solid #334155; display: flex; gap: 15px; background: #0f172a;">
                    <button type="button" onclick="cerrarModal('modal-crear-producto')" style="padding: 12px 20px; background: transparent; color: #94a3b8; border: 1px solid #334155; border-radius: 10px; font-weight: 600; cursor: pointer; flex: 1;">Cancelar</button>
                    <button type="submit" form="form-crear-producto" id="btn-guardar-producto" style="padding: 12px 20px; background: #38bdf8; color: #0f172a; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; flex: 2; display: flex; justify-content: center; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(56, 189, 248, 0.4);">
                        <i class="material-icons-round">save</i> Guardar Producto
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modalCrear);

        document.getElementById('nuevo-producto-categoria').addEventListener('change', function() {
            const opt = this.options[this.selectedIndex];
            if(!opt || !opt.dataset.tipo) return;

            const tipo = opt.dataset.tipo;
            const input = document.getElementById('nuevo-producto-credenciales');
            const label = document.getElementById('label-credenciales');
            const helper = document.getElementById('helper-credenciales');

            if (tipo === 'PIN') {
                label.innerText = 'CÓDIGO PIN DE ACTIVACIÓN:';
                input.placeholder = 'Ej. ABCD-1234-EFGH';
                helper.innerHTML = '<i class="material-icons-round" style="font-size:0.9rem; vertical-align:middle; color:#38bdf8;">info</i> Solo el PIN, sin contraseñas.';
            } else {
                label.innerText = 'CREDENCIALES (CORREO:CLAVE):';
                input.placeholder = 'ejemplo@correo.com:Clave123';
                helper.innerHTML = '<span style="color: #ef4444; font-weight: bold;">* IMPORTANTE:</span> Usa los dos puntos (<b style="color:#ef4444;">:</b>) para separar correo y clave.';
            }
        });
    }

    if (!document.getElementById('modal-importar-producto')) {
        const modalImportar = document.createElement('div');
        modalImportar.id = 'modal-importar-producto';
        modalImportar.className = 'modal-overlay';
        Object.assign(modalImportar.style, {
            display: 'none', position: 'fixed', top: '0', left: '0',
            width: '100%', height: '100%', background: 'rgba(10, 15, 25, 0.9)', 
            zIndex: '9995', alignItems: 'center', justifyContent: 'center'
        });

        modalImportar.innerHTML = `
            <div class="modal-content" style="background: #1e293b; color: #f8fafc; padding: 0; position: relative; max-width: 600px; width: 95%; max-height: 90vh; overflow: hidden; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); display: flex; flex-direction: column; border: 1px solid #334155;">
                <div style="padding: 25px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; background: #0f172a;">
                    <h3 style="margin:0; font-size: 1.3rem; display:flex; align-items:center; gap:10px; color: #10b981;">
                        <i class="material-icons-round">layer_group</i> Importación Masiva
                    </h3>
                    <button class="btn-close-modal" onclick="cerrarModal('modal-importar-producto')" style="background: #1e293b; color: #94a3b8; border: 1px solid #334155; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items:center; justify-content: center; transition: 0.3s;"><i class="material-icons-round" style="font-size: 1.2rem;">close</i></button>
                </div>
                
                <div style="padding: 25px; overflow-y: auto; flex: 1;">
                    <label style="display:block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px; font-weight: 600;">SERVICIO BASE:</label>
                    <select id="importar-servicio" required style="width: 100%; margin-bottom: 15px; padding: 12px; background: #0f172a; border: 1px solid #334155; color: #fff; border-radius: 10px; outline:none; cursor:pointer;"><option value="">Cargando catálogo...</option></select>
                    
                    <div id="helper-importacion" style="font-size: 0.85rem; color: #cbd5e1; margin-bottom: 20px; background: #0f172a; padding: 15px; border-radius: 10px; border-left: 4px solid #10b981;">
                        Selecciona un servicio para ver las instrucciones.
                    </div>

                    <label style="display:block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px; font-weight: 600;">SUBIR ARCHIVO (.CSV O .TXT):</label>
                    <input type="file" id="archivo-importar" accept=".csv, .txt" style="margin-bottom: 20px; width: 100%; padding: 12px; border: 1px dashed #334155; background: #0f172a; border-radius: 10px; color: #fff;">
                    
                    <label style="display:block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px; font-weight: 600;">O PEGA LOS DATOS AQUÍ (UNO POR LÍNEA):</label>
                    <textarea id="texto-importar" rows="4" placeholder="..." style="margin-bottom: 20px; width: 100%; border-radius: 10px; padding: 15px; font-family: monospace; background: #0f172a; border: 1px solid #334155; color: #fff; outline:none; resize:vertical; box-sizing: border-box;"></textarea>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="display:block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px; font-weight: 600;">DURACIÓN (DÍAS):</label>
                            <input type="number" id="importar-dias" value="30" required style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid #334155; color: #10b981; font-weight: bold; border-radius: 10px; outline:none; box-sizing: border-box;">
                        </div>
                        <div>
                            <label style="display:block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px; font-weight: 600;">FECHA DE SUBIDA:</label>
                            <input type="date" id="importar-fecha" required style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid #334155; color: #fff; border-radius: 10px; outline:none; box-sizing: border-box;">
                        </div>
                    </div>
                </div>

                <div style="padding: 20px 25px; border-top: 1px solid #334155; display: flex; gap: 15px; background: #0f172a;">
                    <button type="button" onclick="cerrarModal('modal-importar-producto')" style="padding: 12px 20px; background: transparent; color: #94a3b8; border: 1px solid #334155; border-radius: 10px; font-weight: 600; cursor: pointer; flex: 1;">Cancelar</button>
                    <button id="btn-procesar-importacion" style="padding: 12px 20px; background: #10b981; color: #fff; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; flex: 2; display: flex; justify-content: center; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
                        <i class="material-icons-round">cloud_upload</i> Procesar Inventario
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modalImportar);

        document.getElementById('importar-servicio').addEventListener('change', function() {
            const opt = this.options[this.selectedIndex];
            if(!opt || !opt.dataset.tipo) return;
            const tipo = opt.dataset.tipo;
            const helper = document.getElementById('helper-importacion');
            const textarea = document.getElementById('texto-importar');

            if (tipo === 'PIN') {
                helper.innerHTML = '📌 <b>Modo PIN activado:</b> Pega un código por línea sin contraseñas.';
                textarea.placeholder = 'ABCD-1234\nWXYZ-5678\n987654321';
            } else {
                helper.innerHTML = '👤 <b>Modo Cuenta activado:</b> Usa el formato <b style="color:#38bdf8;">correo:contraseña</b>.';
                textarea.placeholder = 'juan@dw.com:clave123\nana@dw.com:clave456';
            }
        });
    }

    if (!document.getElementById('modal-reporte-importacion')) {
        const modalReporte = document.createElement('div');
        modalReporte.id = 'modal-reporte-importacion';
        modalReporte.className = 'modal-overlay';
        Object.assign(modalReporte.style, {
            display: 'none', position: 'fixed', top: '0', left: '0',
            width: '100%', height: '100%', background: 'rgba(10, 15, 25, 0.95)', 
            zIndex: '9999', alignItems: 'center', justifyContent: 'center'
        });

        modalReporte.innerHTML = `
            <div class="modal-content" style="background: #1e293b; color: #f8fafc; padding: 25px; max-width: 500px; width: 90%; border-radius: 16px; border: 1px solid #ef4444; box-shadow: 0 10px 40px rgba(239, 68, 68, 0.2);">
                <h3 style="color: #ef4444; display: flex; align-items: center; gap: 10px; margin-top:0; margin-bottom: 15px;">
                    <i class="material-icons-round">report_problem</i> Reporte de Omisiones
                </h3>
                <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 15px;">
                    Los siguientes elementos <b>no se subieron</b> porque ya existen en este servicio o su formato es incorrecto:
                </p>
                <div id="lista-errores-import" style="max-height: 250px; overflow-y: auto; background: #0f172a; padding: 10px; border-radius: 8px; font-family: monospace; font-size: 0.85rem; border: 1px solid #334155; color: #f8fafc;">
                </div>
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button id="btn-copiar-omitidos" style="flex: 1; background: transparent; color: #94a3b8; border: 1px solid #334155; border-radius: 8px; padding: 10px; cursor:pointer; display:flex; justify-content:center; gap:5px; font-weight:600;">
                        <i class="material-icons-round" style="font-size:1.1rem;">content_copy</i> Copiar Errores
                    </button>
                    <button onclick="cerrarModal('modal-reporte-importacion')" style="flex: 1; background: #ef4444; color: #fff; border:none; border-radius: 8px; padding: 10px; cursor:pointer; font-weight:bold;">Entendido</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalReporte);

        document.getElementById('btn-copiar-omitidos').addEventListener('click', () => {
            const texto = Array.from(document.querySelectorAll('#lista-errores-import > div > span:first-child'))
                               .map(el => el.innerText).join('\n');
            navigator.clipboard.writeText(texto).then(() => {
                mostrarToast("Lista copiada al portapapeles", "success");
            });
        });
    }
}


function prepararModalesEspeciales() {

    // --- 1. MODAL PRINCIPAL DE GARANTÍA ---
    if (!document.getElementById('modal-garantia-producto')) {
        const modalGarantia = document.createElement('div');
        modalGarantia.id = 'modal-garantia-producto';
        modalGarantia.className = 'modal-overlay';
        Object.assign(modalGarantia.style, {
            display: 'none', position: 'fixed', top: '0', left: '0',
            width: '100%', height: '100%', background: 'rgba(10, 15, 25, 0.9)', 
            zIndex: '9995', alignItems: 'center', justifyContent: 'center'
        });

        modalGarantia.innerHTML = `
            <div class="modal-content" style="background: #1e293b; color: #f8fafc; padding: 0; position: relative; max-width: 500px; width: 95%; overflow: hidden; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(16, 185, 129, 0.2); border: 1px solid #334155;">
                <div style="padding: 25px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; background: #0f172a;">
                    <h3 style="margin:0; font-size: 1.3rem; display:flex; align-items:center; gap:10px; color: #10b981;">
                        <i class="material-icons-round">health_and_safety</i> Reemplazo por Garantía
                    </h3>
                    <button onclick="cerrarModal('modal-garantia-producto')" style="background: transparent; color: #94a3b8; border: none; font-size: 1.5rem; cursor: pointer; transition: 0.3s;"><i class="material-icons-round">close</i></button>
                </div>
                
                <div style="padding: 25px; background: #0f172a;">
                    <div style="background: #1e293b; padding: 15px; border-radius: 10px; border: 1px dashed #334155; margin-bottom: 20px;">
                        <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 5px;">SERVICIO AFECTADO</div>
                        <div id="garantia-servicio-txt" style="font-size: 1.1rem; color: #38bdf8; font-weight: bold; margin-bottom: 10px;">-</div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-size: 0.75rem; color: #94a3b8;">DÍAS A CUBRIR</div>
                                <div id="garantia-dias-txt" style="font-size: 1.5rem; color: #10b981; font-weight: 900; font-family: monospace;">0</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 0.75rem; color: #94a3b8;">CLIENTE</div>
                                <div id="garantia-usuario-txt" style="font-size: 1rem; color: #fff; font-weight: bold;">-</div>
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 10px; margin-bottom: 15px; background: #1e293b; padding: 5px; border-radius: 8px; border: 1px solid #334155;">
                        <button type="button" id="btn-gar-auto" onclick="setModoGarantia('auto')" style="flex:1; background: #10b981; color: #fff; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: bold; display:flex; align-items:center; justify-content:center; gap:5px; box-shadow: 0 4px 10px rgba(16,185,129,0.3); transition:0.2s;"><i class="material-icons-round" style="font-size:1.1rem;">bolt</i> Automática</button>
                        <button type="button" id="btn-gar-manual" onclick="setModoGarantia('manual')" style="flex:1; background: transparent; color: #94a3b8; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: bold; display:flex; align-items:center; justify-content:center; gap:5px; transition:0.2s;"><i class="material-icons-round" style="font-size:1.1rem;">keyboard</i> Manual</button>
                    </div>

                    <form id="form-garantia">
                        <input type="hidden" id="garantia-id-old">
                        <input type="hidden" id="garantia-dias-restantes">
                        <input type="hidden" id="garantia-modo" value="auto">
                        
                        <div id="box-garantia-auto" style="text-align: center; padding: 15px 0; animation: fadeIn 0.3s ease;">
                            <i class="material-icons-round" style="font-size: 3rem; color: #10b981; margin-bottom: 10px; opacity: 0.5;">inventory_2</i>
                            <p style="font-size: 0.85rem; color: #cbd5e1; margin: 0;">El sistema tomará la primera cuenta disponible del stock y la asignará al cliente inmediatamente.</p>
                            <p id="garantia-stock-txt" style="font-weight: bold; margin-top: 10px; color: #10b981; font-size: 0.85rem;"></p>
                        </div>

                        <div id="box-garantia-manual" style="display: none; animation: fadeIn 0.3s ease;">
                            <label style="display:block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px; font-weight: 600; text-transform: uppercase;">Nuevas Credenciales o PIN <span style="color: #ef4444;">*</span></label>
                            <input type="text" id="garantia-nueva-credencial" placeholder="correo@nuevo.com:claveNueva" style="width: 100%; margin-bottom: 5px; padding: 12px; background: #1e293b; border: 1px solid #334155; color: #fff; border-radius: 10px; outline:none; box-sizing: border-box;">
                        </div>
                        
                        <div style="display: flex; gap: 15px; margin-top: 25px;">
                            <button type="submit" id="btn-aplicar-garantia" style="padding: 14px 20px; background: #10b981; color: #fff; border: none; border-radius: 10px; font-weight: 800; cursor: pointer; width: 100%; display: flex; justify-content: center; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); font-size: 1rem;">
                                <i class="material-icons-round">check_circle</i> Confirmar Reemplazo
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modalGarantia);

        window.setModoGarantia = function(modo) {
            document.getElementById('garantia-modo').value = modo;
            const btnAuto = document.getElementById('btn-gar-auto');
            const btnManual = document.getElementById('btn-gar-manual');
            const boxAuto = document.getElementById('box-garantia-auto');
            const boxManual = document.getElementById('box-garantia-manual');
            
            if(modo === 'auto') {
                btnAuto.style.background = '#10b981'; btnAuto.style.color = '#fff'; btnAuto.style.boxShadow = '0 4px 10px rgba(16,185,129,0.3)';
                btnManual.style.background = 'transparent'; btnManual.style.color = '#94a3b8'; btnManual.style.boxShadow = 'none';
                boxAuto.style.display = 'block';
                boxManual.style.display = 'none';
                document.getElementById('garantia-nueva-credencial').required = false;
            } else {
                btnManual.style.background = 'var(--accent-gradient)'; btnManual.style.color = '#fff'; btnManual.style.boxShadow = '0 4px 10px var(--accent-glow)';
                btnAuto.style.background = 'transparent'; btnAuto.style.color = '#94a3b8'; btnAuto.style.boxShadow = 'none';
                boxManual.style.display = 'block';
                boxAuto.style.display = 'none';
                document.getElementById('garantia-nueva-credencial').required = true;
            }
        };

        document.getElementById('form-garantia').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-aplicar-garantia');
            btn.innerHTML = '<i class="material-icons-round" style="animation: spin 1s linear infinite;">autorenew</i> Ejecutando...';
            btn.disabled = true;

            const modo = document.getElementById('garantia-modo').value;

            if (typeof window.mostrarCargaPremium === 'function') {
                window.mostrarCargaPremium("Aplicando garantía. Modificando inventario...");
            }

            const payloadData = {
                accion: 'aplicarGarantia', 
                id_viejo: document.getElementById('garantia-id-old').value,
                tipo_garantia: modo, 
                nuevas_credenciales: modo === 'manual' ? document.getElementById('garantia-nueva-credencial').value.trim() : '',
                dias_restantes: document.getElementById('garantia-dias-restantes').value
            };

            try {
                const res = await peticionProductosAPI(payloadData);
                
                if (res.success) {
                    cerrarModal('modal-garantia-producto');
                    cargarProductosBase();
                    
                    // 🔥 BLINDAJE: Verificamos si PHP de verdad mandó el recibo
                    if (res.datosGarantia) {
                        mostrarModalExitoGarantia(res.datosGarantia);
                    } else {
                        mostrarToast("¡Éxito! Pero PHP no mandó el recibo. (Asegúrate de haber actualizado admin_api.php en Render)", "warning");
                    }
                } else {
                    mostrarToast(res.msg, 'error');
                }
            } catch(error) {
                // Si JavaScript falla por algo interno, lo escupe aquí en lugar de decir "error de conexión"
                console.error("🔥 Error interno en JavaScript:", error);
                mostrarToast("Ocurrió un error en el navegador. Presiona F12.", "error");
            } finally {
                btn.innerHTML = '<i class="material-icons-round">check_circle</i> Confirmar Reemplazo';
                btn.disabled = false;
                if (typeof window.ocultarCargaPremium === 'function') window.ocultarCargaPremium();
            }
        });
    }

    // --- 2. EL NUEVO MODAL DE ÉXITO DE GARANTÍA (CON BOTÓN COPIAR) ---
    if (!document.getElementById('modal-exito-garantia')) {
        const modalExitoGarantia = document.createElement('div');
        modalExitoGarantia.id = 'modal-exito-garantia';
        modalExitoGarantia.className = 'modal-overlay';
        Object.assign(modalExitoGarantia.style, {
            display: 'none', position: 'fixed', top: '0', left: '0',
            width: '100%', height: '100%', background: 'rgba(10, 15, 25, 0.9)', 
            zIndex: '9999', alignItems: 'center', justifyContent: 'center'
        });

        modalExitoGarantia.innerHTML = `
            <div class="modal-content" style="background: #1e293b; color: #f8fafc; padding: 0; position: relative; max-width: 450px; width: 95%; overflow: hidden; border-radius: 20px; box-shadow: 0 0 50px rgba(16, 185, 129, 0.2); border: 1px solid #10b981; animation: fadeIn 0.3s ease;">
                <div style="padding: 25px; text-align: center; border-bottom: 1px solid #334155; background: #0f172a;">
                    <i class="material-icons-round" style="font-size: 4rem; color: #10b981; text-shadow: 0 0 20px rgba(16, 185, 129, 0.5); margin-bottom: 10px;">check_circle</i>
                    <h3 style="margin:0; font-size: 1.5rem; color: #10b981; font-family: 'Righteous', sans-serif; letter-spacing: 1px;">¡Garantía Exitosa!</h3>
                </div>
                
                <div style="padding: 25px; background: #0f172a;">
                    <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 15px; text-align:center;">El reemplazo ha sido asignado. Copia el mensaje para enviarlo al cliente:</p>
                    
                    <div id="garantia-ticket-texto" style="background: #1e293b; padding: 20px; border-radius: 12px; border: 1px dashed #334155; font-family: monospace; font-size: 0.9rem; color: #e2e8f0; line-height: 1.6; white-space: pre-wrap; margin-bottom: 20px;">
                        </div>
                    
                    <div style="display: flex; gap: 15px;">
                        <button type="button" onclick="cerrarModal('modal-exito-garantia')" style="padding: 12px 20px; background: transparent; color: #94a3b8; border: 1px solid #334155; border-radius: 10px; font-weight: 600; cursor: pointer; flex: 1;">Cerrar</button>
                        <button type="button" id="btn-copiar-garantia" style="padding: 12px 20px; background: var(--accent-gradient); color: #fff; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; flex: 2; display: flex; justify-content: center; align-items: center; gap: 8px; box-shadow: 0 4px 15px var(--accent-glow);">
                            <i class="material-icons-round">content_copy</i> Copiar Mensaje
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalExitoGarantia);

        // FUNCIÓN GLOBAL PARA ABRIR ESTE MODAL Y GENERAR EL TEXTO
        window.mostrarModalExitoGarantia = function(datos) {
            let esCuenta = datos.cuenta_nueva.includes(':');
            let accesoVisual = '';
            
            if (esCuenta) {
                let p = datos.cuenta_nueva.split(':');
                accesoVisual = `📧 Correo: ${p[0]}\n🔑 Clave: ${p.slice(1).join(':')}`;
            } else {
                accesoVisual = `📌 PIN: ${datos.cuenta_nueva}`;
            }

            const textoCool = `Hola 👋\nEn respuesta a tu cuenta caída ${datos.cuenta_vieja}, aquí tienes tu reemplazo:\n\n📺 Servicio: ${datos.servicio}\n${accesoVisual}\n\n📅 Fecha de entrega: ${datos.fecha_hoy}\n⏳ Vencimiento: ${datos.fecha_fin}\n\n¡Gracias por preferirnos! ✨`;
            
            document.getElementById('garantia-ticket-texto').innerText = textoCool;
            
            const btnCopiar = document.getElementById('btn-copiar-garantia');
            btnCopiar.onclick = function() {
                navigator.clipboard.writeText(textoCool).then(() => {
                    this.innerHTML = '<i class="material-icons-round">check</i> ¡Copiado!';
                    setTimeout(() => {
                        this.innerHTML = '<i class="material-icons-round">content_copy</i> Copiar Mensaje';
                    }, 2000);
                });
            };
            
            abrirModal('modal-exito-garantia');
        };
    }

    // --- 3. MODAL DE GESTIÓN CADUCADA (Se mantiene intacto) ---
    if (!document.getElementById('modal-gestionar-caducada')) {
        const modalGestionar = document.createElement('div');
        modalGestionar.id = 'modal-gestionar-caducada';
        modalGestionar.className = 'modal-overlay';
        Object.assign(modalGestionar.style, {
            display: 'none', position: 'fixed', top: '0', left: '0',
            width: '100%', height: '100%', background: 'rgba(10, 15, 25, 0.9)', 
            zIndex: '9995', alignItems: 'center', justifyContent: 'center'
        });

        modalGestionar.innerHTML = `
            <div class="modal-content" style="background: #1e293b; color: #f8fafc; padding: 0; position: relative; max-width: 600px; width: 95%; overflow: hidden; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(239, 68, 68, 0.2); border: 1px solid #334155;">
                <div style="padding: 20px 25px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; background: #0f172a;">
                    <h3 style="margin:0; font-size: 1.2rem; display:flex; align-items:center; gap:10px; color: #ef4444;">
                        <i class="material-icons-round">warning_amber</i> Gestionar Cuenta Caducada
                    </h3>
                    <button onclick="cerrarModal('modal-gestionar-caducada')" style="background: transparent; color: #94a3b8; border: none; font-size: 1.5rem; cursor: pointer; transition: 0.3s;"><i class="material-icons-round">close</i></button>
                </div>
                
                <div style="padding: 25px; background: #0f172a;">
                    <div style="display: flex; justify-content: space-between; background: #1e293b; padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #334155;">
                        <div>
                            <span style="font-size: 0.75rem; color: #94a3b8; display:block;">SERVICIO</span>
                            <strong id="gestion-servicio-txt" style="color: #fff; font-size: 1.1rem;">-</strong>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-size: 0.75rem; color: #94a3b8; display:block;">CLIENTE ANTERIOR</span>
                            <strong id="gestion-cliente-txt" style="color: #38bdf8;">-</strong>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                        <button onclick="seleccionarAccionGestion('renovar')" id="btn-tab-renovar" style="padding: 15px 10px; background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; cursor: pointer; font-weight: bold; display: flex; flex-direction: column; align-items: center; gap: 5px; transition: 0.2s;">
                            <i class="material-icons-round" style="font-size: 1.5rem;">autorenew</i> Renovar Cliente
                        </button>
                        <button onclick="seleccionarAccionGestion('reciclar')" id="btn-tab-reciclar" style="padding: 15px 10px; background: rgba(56, 189, 248, 0.1); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 10px; cursor: pointer; font-weight: bold; display: flex; flex-direction: column; align-items: center; gap: 5px; transition: 0.2s;">
                            <i class="material-icons-round" style="font-size: 1.5rem;">lock_open</i> Liberar a Stock
                        </button>
                        <button onclick="seleccionarAccionGestion('archivar')" id="btn-tab-archivar" style="padding: 15px 10px; background: rgba(148, 163, 184, 0.1); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.3); border-radius: 10px; cursor: pointer; font-weight: bold; display: flex; flex-direction: column; align-items: center; gap: 5px; transition: 0.2s;">
                            <i class="material-icons-round" style="font-size: 1.5rem;">inventory_2</i> Archivar Cuenta
                        </button>
                    </div>

                    <form id="form-gestion-caducada" style="background: #1e293b; padding: 20px; border-radius: 10px; border: 1px dashed #334155; display: none; animation: fadeIn 0.3s ease;">
                        <input type="hidden" id="gestion-id-old">
                        <input type="hidden" id="gestion-accion-seleccionada">
                        
                        <div id="gestion-msg-contexto" style="font-size: 0.85rem; color: #cbd5e1; margin-bottom: 15px; line-height: 1.5;"></div>

                        <div id="grupo-credenciales" style="margin-bottom: 15px;">
                            <label style="display:block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px; font-weight: 600;">CREDENCIALES O CLAVE ACTUALIZADA:</label>
                            <input type="text" id="gestion-credenciales" required style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid #334155; color: #fff; border-radius: 8px; outline:none; box-sizing: border-box;">
                        </div>

                        <div id="grupo-renovacion" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                            <div>
                                <label style="display:block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px; font-weight: 600;">DÍAS A AÑADIR:</label>
                                <input type="number" id="gestion-dias" value="30" required style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid #334155; color: #10b981; font-weight:bold; border-radius: 8px; outline:none; box-sizing: border-box;">
                            </div>
                            <div id="grupo-precio">
                                <label style="display:block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px; font-weight: 600;">COBRAR AL CLIENTE ($):</label>
                                <input type="number" id="gestion-precio" value="0" required style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid #334155; color: #38bdf8; font-weight:bold; border-radius: 8px; outline:none; box-sizing: border-box;">
                            </div>
                        </div>

                        <button type="submit" id="btn-ejecutar-gestion" style="width: 100%; padding: 14px; background: #38bdf8; color: #0f172a; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 10px; font-size: 1rem;">
                            Confirmar Acción
                        </button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modalGestionar);

        window.seleccionarAccionGestion = function(accion) {
            const form = document.getElementById('form-gestion-caducada');
            form.style.display = 'block';
            document.getElementById('gestion-accion-seleccionada').value = accion;
            
            const msgContexto = document.getElementById('gestion-msg-contexto');
            const grpCred = document.getElementById('grupo-credenciales');
            const grpRenov = document.getElementById('grupo-renovacion');
            const grpPrecio = document.getElementById('grupo-precio');
            const btnEjecutar = document.getElementById('btn-ejecutar-gestion');

            document.getElementById('gestion-credenciales').required = false;
            document.getElementById('gestion-dias').required = false;
            document.getElementById('gestion-precio').required = false;

            document.querySelectorAll('[id^="btn-tab-"]').forEach(b => {
                b.style.boxShadow = 'none'; b.style.transform = 'scale(1)'; b.style.filter = 'grayscale(60%)';
            });
            const btnActivo = document.getElementById(`btn-tab-${accion}`);
            btnActivo.style.filter = 'grayscale(0%)';
            btnActivo.style.transform = 'scale(1.05)';
            
            if (accion === 'renovar') {
                btnActivo.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
                msgContexto.innerHTML = '<b>Renovación:</b> Se debitará el saldo indicado al cliente y se clonará la cuenta como activa por los días especificados.';
                grpCred.style.display = 'block'; 
                grpRenov.style.display = 'grid'; 
                grpPrecio.style.display = 'block';
                btnEjecutar.innerHTML = '<i class="material-icons-round">autorenew</i> Procesar Renovación';
                btnEjecutar.style.background = '#10b981'; btnEjecutar.style.color = '#fff';
            } 
            else if (accion === 'reciclar') {
                btnActivo.style.boxShadow = '0 4px 15px rgba(56, 189, 248, 0.3)';
                msgContexto.innerHTML = '<b>Liberar al Stock:</b> La cuenta actual pasará a "Vencida". Se creará una copia "Disponible" con la nueva contraseña.';
                grpCred.style.display = 'block'; 
                grpRenov.style.display = 'grid'; 
                grpPrecio.style.display = 'none'; 
                document.getElementById('gestion-precio').value = '0';
                btnEjecutar.innerHTML = '<i class="material-icons-round">lock_open</i> Liberar a Inventario';
                btnEjecutar.style.background = '#38bdf8'; btnEjecutar.style.color = '#0f172a';
            }
            else if (accion === 'archivar') {
                btnActivo.style.boxShadow = '0 4px 15px rgba(148, 163, 184, 0.3)';
                msgContexto.innerHTML = '<b>Archivar Cuenta:</b> Desaparecerá de esta lista y el cliente la verá como expirada.';
                grpCred.style.display = 'none'; 
                grpRenov.style.display = 'none';
                document.getElementById('gestion-precio').value = '0';
                document.getElementById('gestion-credenciales').value = 'archived_acc'; 
                btnEjecutar.innerHTML = '<i class="material-icons-round">inventory_2</i> Archivar Definitivamente';
                btnEjecutar.style.background = '#94a3b8'; btnEjecutar.style.color = '#0f172a';
            }
        };

        document.getElementById('form-gestion-caducada').addEventListener('submit', async (e) => {
            e.preventDefault();
            const accion = document.getElementById('gestion-accion-seleccionada').value;
            const credenciales = document.getElementById('gestion-credenciales').value.trim();
            const dias = document.getElementById('gestion-dias').value;

            if (accion !== 'archivar') {
                if (!credenciales || credenciales === 'archived_acc') return mostrarToast("Debes ingresar las credenciales.", "warning");
                if (!dias || dias <= 0) return mostrarToast("Debes ingresar los días.", "warning");
            }

            const btn = document.getElementById('btn-ejecutar-gestion');
            const originalHtml = btn.innerHTML;
            
            btn.innerHTML = '<i class="material-icons-round" style="animation: spin 1s linear infinite;">autorenew</i> Ejecutando...';
            btn.disabled = true;

            if (typeof window.mostrarCargaPremium === 'function') window.mostrarCargaPremium("Gestionando cuenta...");

            const payloadData = {
                accion: 'gestionarCuentaCaducada',
                tipo_gestion: accion,
                id_viejo: document.getElementById('gestion-id-old').value,
                nuevas_credenciales: credenciales,
                nuevos_dias: dias,
                precio_renovacion: document.getElementById('gestion-precio').value
            };

            try {
                const res = await peticionProductosAPI(payloadData);

                if (res.success) {
                    mostrarToast(res.msg, 'success');
                    cerrarModal('modal-gestionar-caducada');
                    cargarProductosBase();
                } else {
                    mostrarToast("Error: " + res.msg, 'error');
                }
            } catch (error) {
                mostrarToast("Error de conexión.", "error");
            } finally {
                btn.innerHTML = originalHtml;
                btn.disabled = false;
                if (typeof window.ocultarCargaPremium === 'function') window.ocultarCargaPremium();
            }
        });
    }
}

// LÓGICA REDISEÑADA PARA ABRIR Y EVALUAR LA GARANTÍA
window.abrirModalGarantia = function(objEncoded, diasRestantes) {
    const prod = JSON.parse(decodeURIComponent(objEncoded));
    document.getElementById('garantia-id-old').value = prod.id;
    document.getElementById('garantia-dias-restantes').value = diasRestantes;
    document.getElementById('garantia-servicio-txt').innerText = prod.servicio_nombre;
    document.getElementById('garantia-usuario-txt').innerText = prod.usuario_comprador;
    document.getElementById('garantia-dias-txt').innerText = diasRestantes;
    document.getElementById('garantia-nueva-credencial').value = ''; 
    
    // Contar stock disponible en la memoria del navegador
    const stockDisponible = productosDataOriginal.filter(p => p.servicio_nombre === prod.servicio_nombre && p.vendida === 'no').length;
    const txtStock = document.getElementById('garantia-stock-txt');
    const btnAuto = document.getElementById('btn-gar-auto');

    // Bloquear o desbloquear la pestaña automática según el stock
    if (stockDisponible > 0) {
        txtStock.innerHTML = `✅ Hay <strong>${stockDisponible}</strong> cuenta(s) en stock.`;
        txtStock.style.color = '#10b981';
        btnAuto.disabled = false;
        btnAuto.style.opacity = '1';
        btnAuto.style.cursor = 'pointer';
        setModoGarantia('auto'); // Tab automática por defecto
    } else {
        txtStock.innerHTML = `❌ No hay stock disponible para ${prod.servicio_nombre}.`;
        txtStock.style.color = '#ef4444';
        btnAuto.disabled = true;
        btnAuto.style.opacity = '0.4';
        btnAuto.style.cursor = 'not-allowed';
        setModoGarantia('manual'); // Tab manual obligatoria
    }

    abrirModal('modal-garantia-producto');
};

window.abrirModalGestionCaducada = function(objEncoded) {
    const prod = JSON.parse(decodeURIComponent(objEncoded));
    document.getElementById('gestion-id-old').value = prod.id;
    document.getElementById('gestion-servicio-txt').innerText = prod.servicio_nombre;
    document.getElementById('gestion-cliente-txt').title = prod.cuenta || '';
    document.getElementById('gestion-cliente-txt').style.cursor = 'help';
    document.getElementById('gestion-cliente-txt').innerHTML = `${prod.usuario_comprador || 'Sin Cliente'}<br><span style="font-size:0.7rem; color:#64748b; font-family:monospace; font-weight:normal;">${prod.cuenta || ''}</span>`;
    document.getElementById('form-gestion-caducada').style.display = 'none';
    document.getElementById('form-gestion-caducada').reset();
    document.getElementById('gestion-credenciales').value = prod.cuenta;
    document.querySelectorAll('[id^="btn-tab-"]').forEach(b => {
        b.style.boxShadow = 'none'; b.style.transform = 'scale(1)'; b.style.filter = 'grayscale(0%)';
    });

    const precioServicioActual = serviciosPrecioCache[prod.servicio_nombre] ?? prod.precio_compra ?? 0;
    document.getElementById('gestion-precio').value = precioServicioActual;
    
    abrirModal('modal-gestionar-caducada');
};

async function peticionProductosAPI(datos) {
    datos.usuario = sessionStorage.getItem('admin_user');
    datos.token = sessionStorage.getItem('admin_token');
    try {
        const response = await fetch(API_ADMIN_MODULE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        
        // Atrapamos la respuesta como texto primero para leer si PHP arrojó un error oculto
        const textoAPI = await response.text();
        try {
            return JSON.parse(textoAPI);
        } catch (err) {
            console.error("🔥 ERROR OCULTO EN PHP:", textoAPI);
            return { success: false, msg: "Fallo del Servidor. Presiona F12 y revisa la consola." };
        }
    } catch (error) {
        console.error("🔥 Error de red/fetch:", error);
        return { success: false, msg: "Error de red o conexión." };
    }
}

async function cargarServiciosEnSelectProd(idSelect, nombreSeleccionado = null) {
    const select = document.getElementById(idSelect);
    if (!select) return;

    const defaultOption = idSelect === 'filtro-categoria-prod' ? '<option value="">Todas las Categorías</option>' : '<option value="">-- Elige un Servicio --</option>';
    select.innerHTML = '<option value="">Cargando catálogo...</option>';
    
    const res = await peticionProductosAPI({ accion: 'getServiciosAdmin' });

    if (res.success) {
        select.innerHTML = defaultOption;
        res.datos.forEach(srv => {
            const option = document.createElement('option');
            option.value = srv.nombre; 
            option.dataset.nombre = srv.nombre;
            option.dataset.tipo = srv.tipo || 'Cuenta'; 
            // 🔥 NUEVO: Guardamos el flag de si es cuenta completa para la validación
            option.dataset.cuenta_completa = srv.cuenta_completa || 'no'; 
            option.textContent = srv.nombre;
            serviciosPrecioCache[srv.nombre] = parseFloat(srv.precio) || 0;
            
            if (nombreSeleccionado && srv.nombre === nombreSeleccionado) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        select.dispatchEvent(new Event('change'));

    } else {
        select.innerHTML = '<option value="">Error al cargar catálogo</option>';
    }
}

async function cargarProductosBase() {
    const tbody = document.getElementById('tabla-productos-body');
    if(!tbody) return;
    
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 40px;"><i class="material-icons-round" style="animation: spin 1s linear infinite; color: var(--accent); font-size: 2rem;">autorenew</i></td></tr>`;

    const res = await peticionProductosAPI({ accion: 'getInventario', pagina: 1, limite: 100000, filtro: '' });

    if (res.success) {
        // 🔥 BLINDAJE NIVEL DIOS: Si tiene comprador, ES VENDIDA obligatoriamente.
        productosDataOriginal = res.datos.map(item => {
            let est = (item.vendida || '').toString().trim().toLowerCase();
            let tieneComprador = (item.usuario_comprador && item.usuario_comprador.trim() !== '');

            if (est === 'garantia' || est === 'garantía') {
                item.vendida = 'Garantia';
            } else if (est === 'vencida') {
                item.vendida = 'Vencida';
            } else if (est === 'reemplazada') {
                item.vendida = 'Reemplazada';
            } else if (est === 'si' || tieneComprador) {
                // AQUÍ ESTÁ LA MAGIA: Si dice "si", o simplemente TIENE UN COMPRADOR, forzamos a que esté Vendida
                item.vendida = 'Si';
            } else {
                item.vendida = 'no'; // Solo queda "no" si realmente no tiene a nadie asignado
            }
            return item;
        });

        productosExistentesEnBD = [];
        productosDataOriginal.forEach(item => {
            const estadoActual = item.vendida.toLowerCase();

            if (estadoActual !== 'vencida' && estadoActual !== 'reemplazada' && estadoActual !== 'garantia') {
                let infoBruta = (item.cuenta || '').trim();
                let esCuenta = infoBruta.includes(':');
                let identificadorFinal = esCuenta ? infoBruta.split(':')[0].toLowerCase() : infoBruta.toLowerCase();
                let servicio = (item.servicio_nombre || '').toLowerCase().trim();
                productosExistentesEnBD.push(`${identificadorFinal}|${servicio}`);
            }
        });

        const datalistUsuarios = document.getElementById('lista-usuarios-prod');
        if (datalistUsuarios) {
            
            const usuariosUnicos = [...new Set(res.datos.map(p => p.usuario_comprador).filter(u => u && u.trim() !== ''))];
            datalistUsuarios.innerHTML = usuariosUnicos.sort().map(u => `<option value="${u}">`).join('');
        }

        ejecutarFiltrosYRender();

    } else {
        mostrarToast("Error al cargar productos: " + res.msg, 'error'); 
    }
}

function calcularDiasReales(prod) {
    if ((prod.vendida === 'Si' || prod.vendida === 'Garantia') && prod.fecha_venta) {
        let fechaPura = prod.fecha_venta.split(' ')[0]; // Quitamos la hora si la tiene
        let year, month, day;

        // Detectamos si la fecha viene con guiones (YYYY-MM-DD) o con barras (DD/MM/YYYY)
        if (fechaPura.includes('-')) {
            [year, month, day] = fechaPura.split('-');
        } else if (fechaPura.includes('/')) {
            [day, month, year] = fechaPura.split('/');
        } else {
            return parseInt(prod.dias_cuenta || 0); // Si es un formato rarísimo, evitamos que explote
        }

        const fVencimiento = new Date(year, month - 1, day);
        fVencimiento.setDate(fVencimiento.getDate() + parseInt(prod.dias_cuenta || 0));
        
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        return Math.round((fVencimiento.getTime() - hoy.getTime()) / (1000 * 3600 * 24));
    }
    return parseInt(prod.dias_cuenta || 0);
}

function ejecutarFiltrosYRender() {
    const filtroTexto = (document.getElementById('buscar-producto')?.value || '').toLowerCase().trim();
    const filtroCat = (document.getElementById('filtro-categoria-prod')?.value || '').toLowerCase().trim();
    const filtroEstado = (document.getElementById('filtro-estado-prod')?.value || '').toLowerCase().trim();
    const filtroUsuario = (document.getElementById('filtro-usuario-prod')?.value || '').toLowerCase().trim();

    let datosFiltrados = productosDataOriginal.filter(prod => {
        let matchTexto = true;
        let matchCat = true;
        let matchEstado = true;
        let matchUsuario = true;

        if (filtroTexto !== '') {
            let cadenaBusqueda = `${prod.cuenta} ${prod.servicio_nombre} ${prod.usuario_comprador || ''}`.toLowerCase();
            matchTexto = cadenaBusqueda.includes(filtroTexto);
        }

        if (filtroCat !== '') {
            matchCat = (prod.servicio_nombre || '').toLowerCase() === filtroCat;
        }

        if (filtroUsuario !== '') {
            let userComprador = (prod.usuario_comprador || '').toLowerCase();
            matchUsuario = userComprador.includes(filtroUsuario);
        }

        let diasRest = calcularDiasReales(prod);
        let estaCaducada = ((prod.vendida === 'Si' || prod.vendida === 'Garantia') && diasRest <= 0);

        if (filtroEstado !== '') {
            if (filtroEstado === 'disponible') matchEstado = (prod.vendida === 'no');
            else if (filtroEstado === 'vendida') matchEstado = ((prod.vendida === 'Si' || prod.vendida === 'Garantia') && !estaCaducada);
            else if (filtroEstado === 'caducada') matchEstado = estaCaducada;
            else if (filtroEstado === 'vencida') matchEstado = (prod.vendida === 'Vencida' || prod.vendida === 'Reemplazada');
        } else {
            matchEstado = (prod.vendida !== 'Vencida' && prod.vendida !== 'Reemplazada');
        }
        
        return matchTexto && matchCat && matchEstado && matchUsuario;
    });

    if (window.prodColumnaOrden) {
        
        // 🔥 Traductor de Fechas para JavaScript (Convierte Guiones o Barras a Milisegundos exactos)
        const parseFechaParaOrden = (fechaStr) => {
            if (!fechaStr) return 0;
            let soloFecha = fechaStr.split(' ')[0]; // Quitamos la hora si la tiene
            if (soloFecha.includes('-')) {
                let [y, m, d] = soloFecha.split('-');
                return new Date(y, m - 1, d).getTime();
            } else if (soloFecha.includes('/')) {
                let [d, m, y] = soloFecha.split('/');
                return new Date(y, m - 1, d).getTime();
            }
            return 0;
        };

        datosFiltrados.sort((a, b) => {
            let valA, valB;
            
            switch (window.prodColumnaOrden) {
                case 'id': 
                    valA = parseInt(a.id) || 0; 
                    valB = parseInt(b.id) || 0; 
                    break;
                case 'servicio': 
                    valA = (a.servicio_nombre || '').toLowerCase(); 
                    valB = (b.servicio_nombre || '').toLowerCase(); 
                    break;
                case 'cuenta': 
                    valA = (a.cuenta || '').toLowerCase(); 
                    valB = (b.cuenta || '').toLowerCase(); 
                    break;
                case 'fecha': 
                    // 🔥 Priorizamos fecha_venta. Si no está vendida aún, usamos la fecha_inicio para que no quede en 0
                    valA = parseFechaParaOrden(a.fecha_venta || a.fecha_inicio); 
                    valB = parseFechaParaOrden(b.fecha_venta || b.fecha_inicio); 
                    break;
                case 'dias': 
                    valA = calcularDiasReales(a); 
                    valB = calcularDiasReales(b); 
                    break;
                case 'estado': 
                    valA = (a.vendida || '').toLowerCase(); 
                    valB = (b.vendida || '').toLowerCase(); 
                    break;
                case 'usuario': 
                    valA = (a.usuario_comprador || '').toLowerCase(); 
                    valB = (b.usuario_comprador || '').toLowerCase(); 
                    break;
                default: 
                    valA = parseInt(a.id) || 0; 
                    valB = parseInt(b.id) || 0;
            }

            if (valA < valB) return window.prodDireccionOrden === 'asc' ? -1 : 1;
            if (valA > valB) return window.prodDireccionOrden === 'asc' ? 1 : -1;
            return 0;
        });
    }

    let totalItems = datosFiltrados.length;
    prodTotalPaginas = Math.ceil(totalItems / prodLimitePagina) || 1;
    if (prodPaginaActual > prodTotalPaginas) prodPaginaActual = prodTotalPaginas;

    let startIndex = (prodPaginaActual - 1) * prodLimitePagina;
    let endIndex = startIndex + prodLimitePagina;
    let datosPagina = datosFiltrados.slice(startIndex, endIndex);

    const tbody = document.getElementById('tabla-productos-body');
    tbody.innerHTML = '';
    
    renderPaginacionProd(totalItems);

    const chkAll = document.getElementById('chk-all-prod');
    if(chkAll) chkAll.checked = false;
    const btnBulk = document.getElementById('btn-bulk-prod');
    if(btnBulk) btnBulk.style.display = 'none';

    if (datosPagina.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 50px; color: var(--text-gray);">No se encontraron productos con estos filtros.</td></tr>`;
        return;
    }

    datosPagina.forEach((prod) => {
        let diasRest = calcularDiasReales(prod);
        let estaCaducada = ((prod.vendida === 'Si' || prod.vendida === 'Garantia') && diasRest <= 0);
        let estaActiva = ((prod.vendida === 'Si' || prod.vendida === 'Garantia') && diasRest > 0);

        let estadoHTML = '';
        let cbTd = '';
        let accionesHTML = '';
        const objEdit = encodeURIComponent(JSON.stringify(prod));

        cbTd = `<td style="text-align: center;"><input type="checkbox" class="chk-item-prod" value="${prod.id}" data-estado="${prod.vendida}" onchange="checkIndividualProd('chk-item-prod', 'bulk-actions-prod', 'chk-all-prod')"></td>`;

        if (prod.vendida === 'Vencida' || prod.vendida === 'Reemplazada') {
            estadoHTML = `<span style="background: rgba(255,255,255,0.05); color: var(--text-gray); border: 1px dashed var(--border-color); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: bold; display: inline-block;">Archivada</span>`;
            accionesHTML = `<span style="color: var(--text-muted); font-size: 0.75rem;">Historial</span>`;
        } else if (estaCaducada) {
            estadoHTML = `<span style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: bold; display: inline-block;">Caducada</span>`;
            accionesHTML = `<button onclick="abrirModalGestionCaducada('${objEdit}')" style="background: rgba(56, 189, 248, 0.1); color: #38bdf8; padding: 6px 12px; box-shadow: none; border: 1px solid rgba(56,189,248,0.3); border-radius: 6px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 5px; margin: 0 auto;"><i class="material-icons-round" style="font-size: 1rem;">settings</i> Gestionar</button>`;
        } else if (estaActiva) {
            if (prod.vendida === 'Garantia') {
                estadoHTML = `<span style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.3); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: bold; display: inline-block;"><i class="material-icons-round" style="font-size:0.8rem; vertical-align:middle;">health_and_safety</i> Garantía</span>`;
            } else {
                estadoHTML = `<span style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: bold; display: inline-block;">Vendida</span>`;
            }
            accionesHTML = `
    <div style="display:flex; justify-content:center; gap:5px;">
        <button onclick="abrirModalGarantia('${objEdit}', ${diasRest})" 
            style="background: rgba(16,185,129,0.1); color: #10b981; padding: 6px 12px; box-shadow: none; border: 1px solid rgba(16,185,129,0.3); border-radius: 6px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 5px;"
            title="Aplicar Garantía">
            <i class="material-icons-round" style="font-size: 1rem;">health_and_safety</i> Garantía
        </button>
        <button onclick="abrirModalReversarVenta('${objEdit}')"
            style="background: rgba(239,68,68,0.1); color: #ef4444; padding: 6px 10px; box-shadow: none; border: 1px solid rgba(239,68,68,0.3); border-radius: 6px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 5px;"
            title="Reversar venta y reembolsar">
            <i class="material-icons-round" style="font-size: 1rem;">undo</i>
        </button>
    </div>`;
        } else {
            estadoHTML = `<span style="background: var(--bg-dark); color: var(--text-main); border: 1px solid var(--border-color); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: bold; display: inline-block;">Disponible</span>`;
            accionesHTML = `
                <div style="display:flex; justify-content:center; gap:5px;">
                    <button class="btn-editar-prod" data-obj="${objEdit}" style="background: var(--accent-light); color: var(--accent); padding: 6px; box-shadow: none; border: none; border-radius: 6px; cursor: pointer;" title="Editar"><i class="material-icons-round">edit</i></button>
                    <button class="btn-borrar-prod" data-id="${prod.id}" style="background: var(--danger-bg); color: var(--danger); padding: 6px; box-shadow: none; border: none; border-radius: 6px; cursor: pointer;" title="Enviar a Papelera"><i class="material-icons-round">delete</i></button>
                </div>
            `;
        }

        let fechaSubida = prod.fecha_inicio ? prod.fecha_inicio.split(' ')[0] : '-';
        let fechaVenta = (prod.vendida === 'Si' || prod.vendida === 'Garantia' || prod.vendida === 'Vencida' || prod.vendida === 'Reemplazada') && prod.fecha_venta 
            ? prod.fecha_venta.split(' ')[0] 
            : 'En espera...';

        let fechaHTML = `
            <div style="display:flex; flex-direction:column; gap:4px;">
                <span style="font-size: 0.75rem; color: var(--text-gray);" title="Fecha de Registro"><i class="material-icons-round" style="font-size:0.9rem; vertical-align:middle; opacity:0.6;">add_task</i> ${fechaSubida}</span>
                <span style="font-size: 0.75rem; color: ${(prod.vendida === 'Si' || prod.vendida === 'Garantia') ? 'var(--success)' : 'var(--text-muted)'};" title="Fecha de Venta"><i class="material-icons-round" style="font-size:0.9rem; vertical-align:middle; opacity:0.6;">shopping_cart</i> ${fechaVenta}</span>
            </div>
        `;

        let diasInfo = estaActiva || estaCaducada
            ? `<div style="text-align: center;"><span style="background: ${estaCaducada ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; color: ${estaCaducada ? '#ef4444' : '#10b981'}; border: 1px solid ${estaCaducada ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 0.85rem; display: inline-block;">${diasRest} Días</span></div>`
            : `<div style="text-align: center;"><span style="background: var(--bg-dark); color: var(--text-main); border: 1px solid var(--border-color); padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 0.85rem; display: inline-block;">${prod.dias_cuenta} Días</span></div>`;

        let credencialesVisual = prod.cuenta;
        if (credencialesVisual.includes(':')) {
            let partes = credencialesVisual.split(':');
            credencialesVisual = `<span style="color: var(--accent); font-weight: 700;">${partes[0]}</span><span style="color: var(--text-muted);">:</span><span>${partes.slice(1).join(':')}</span>`;
        } else {
            credencialesVisual = `<i class="material-icons-round" style="font-size: 1rem; color: var(--text-muted); vertical-align: middle;">vpn_key</i> <span style="font-weight: 700; letter-spacing: 1px;">${credencialesVisual}</span>`;
        }
        
        let notasHTML = prod.notas 
            ? `<div style="margin-top: 8px; font-size: 0.75rem; color: #f59e0b; background: rgba(245, 158, 11, 0.1); padding: 4px 8px; border-radius: 6px; border: 1px dashed rgba(245, 158, 11, 0.3); line-height: 1.3;"><i class="material-icons-round" style="font-size:0.9rem; vertical-align:middle; margin-right:3px;">history_edu</i> ${prod.notas}</div>` 
            : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            ${cbTd}
            <td style="color: var(--text-gray); font-weight: 800; font-family: monospace;">#${prod.id}</td>
            <td><strong>${prod.servicio_nombre}</strong></td>
            <td>
                <div style="background: var(--bg-dark); padding: 6px 10px; border-radius: 6px; font-family: monospace; font-size: 0.85rem; display: inline-block; border: 1px solid var(--border-color);">${credencialesVisual}</div>
                ${notasHTML}
            </td>
            <td>${fechaHTML}</td>
            <td style="text-align: center;">${diasInfo}</td>
            <td style="text-align: center;">${estadoHTML}</td>
            <td><strong>${prod.usuario_comprador || '<span style="color:var(--text-muted); font-weight:normal;">Nadie</span>'}</strong></td>
            <td style="text-align: center; white-space: nowrap;">
                ${accionesHTML}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function cargarProductos() {
    await cargarProductosBase();
}

window.renderPaginacionProd = function(totalItems = 0) {
    const container = document.getElementById('paginacion-productos-container');
    if (!container) return;

    let html = `<span style="color: var(--text-gray); margin-right: 15px;">Total: ${totalItems}</span>`;

    let firstDisabled = prodPaginaActual === 1 ? 'opacity: 0.5; pointer-events: none;' : '';
    html += `<button onclick="cambiarPaginaProd(1)" style="width: 35px; height: 35px; padding: 0; display: flex; align-items: center; justify-content: center; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); box-shadow: none; border-radius: 6px; cursor: pointer; margin: 0 2px; ${firstDisabled}"><i class="material-icons-round" style="font-size: 1.2rem;">first_page</i></button>`;

    let prevDisabled = prodPaginaActual === 1 ? 'opacity: 0.5; pointer-events: none;' : '';
    html += `<button onclick="cambiarPaginaProd(${prodPaginaActual - 1})" style="width: 35px; height: 35px; padding: 0; display: flex; align-items: center; justify-content: center; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); box-shadow: none; border-radius: 6px; cursor: pointer; margin: 0 2px; ${prevDisabled}"><i class="material-icons-round" style="font-size: 1.2rem;">chevron_left</i></button>`;

    let startPage = Math.max(1, prodPaginaActual - 1);
    let endPage = Math.min(prodTotalPaginas, startPage + 2);
    
    if (endPage - startPage < 2) {
        startPage = Math.max(1, endPage - 2);
    }

    for (let i = startPage; i <= endPage; i++) {
        let isAct = i === prodPaginaActual;
        html += `<button onclick="cambiarPaginaProd(${i})" style="width: 35px; height: 35px; padding: 0; display: flex; align-items: center; justify-content: center; background: ${isAct ? 'var(--accent)' : 'var(--bg-card)'}; color: ${isAct ? '#fff' : 'var(--text-main)'}; border: 1px solid var(--border-color); box-shadow: none; border-radius: 6px; cursor: pointer; margin: 0 2px;">${i}</button>`;
    }

    let nextDisabled = prodPaginaActual === prodTotalPaginas || prodTotalPaginas === 0 ? 'opacity: 0.5; pointer-events: none;' : '';
    html += `<button onclick="cambiarPaginaProd(${prodPaginaActual + 1})" style="width: 35px; height: 35px; padding: 0; display: flex; align-items: center; justify-content: center; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); box-shadow: none; border-radius: 6px; cursor: pointer; margin: 0 2px; ${nextDisabled}"><i class="material-icons-round" style="font-size: 1.2rem;">chevron_right</i></button>`;

    let lastDisabled = prodPaginaActual === prodTotalPaginas || prodTotalPaginas === 0 ? 'opacity: 0.5; pointer-events: none;' : '';
    html += `<button onclick="cambiarPaginaProd(${prodTotalPaginas})" style="width: 35px; height: 35px; padding: 0; display: flex; align-items: center; justify-content: center; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); box-shadow: none; border-radius: 6px; cursor: margin: 0 2px; ${lastDisabled}"><i class="material-icons-round" style="font-size: 1.2rem;">last_page</i></button>`;

    container.innerHTML = html;
};

window.cambiarPaginaProd = function(nuevaPagina) {
    if (nuevaPagina >= 1 && nuevaPagina <= prodTotalPaginas && nuevaPagina !== prodPaginaActual) {
        prodPaginaActual = nuevaPagina;
        ejecutarFiltrosYRender(); 
    }
};

async function prepararEdicionProducto(objEncoded) {
    const prod = JSON.parse(decodeURIComponent(objEncoded));
    productoEditandoID = prod.id; 

    await cargarServiciosEnSelectProd('nuevo-producto-categoria', prod.servicio_nombre);

    document.getElementById('nuevo-producto-credenciales').value = prod.cuenta;
    document.getElementById('nuevo-producto-fecha').value = prod.fecha_inicio ? prod.fecha_inicio.split(' ')[0] : '';
    document.getElementById('nuevo-producto-dias').value = prod.dias_cuenta;

    document.getElementById('titulo-modal-producto').innerHTML = `<i class="material-icons-round" style="vertical-align: middle;">edit</i> Editar Producto #${prod.id}`;
    document.getElementById('btn-guardar-producto').innerHTML = `<i class="material-icons-round">save</i> Actualizar Producto`;
    
    abrirModal('modal-crear-producto'); 
}

function resetFormularioProducto() {
    productoEditandoID = null;
    document.getElementById('form-crear-producto')?.reset();
    document.getElementById('titulo-modal-producto').innerHTML = `<i class="material-icons-round" style="vertical-align: middle;">add_circle</i> Agregar Nuevo Producto`;
    document.getElementById('btn-guardar-producto').innerHTML = `<i class="material-icons-round">save</i> Guardar Producto`;
}

async function borrarProducto(id) {
    if(!confirm("¿Enviar este producto a la papelera?")) return;
    const res = await peticionProductosAPI({ accion: 'moverAPapelera', tabla: 'inventario', id: id });
    mostrarToast(res.msg, res.success ? 'success' : 'error'); 
    if(res.success) cargarProductosBase();
}

function initEventosProductos() {
    
    document.getElementById('tabla-productos-body')?.addEventListener('click', (e) => {
        const btnEdit = e.target.closest('.btn-editar-prod');
        if(btnEdit) prepararEdicionProducto(btnEdit.dataset.obj);

        const btnDel = e.target.closest('.btn-borrar-prod');
        if(btnDel) borrarProducto(btnDel.dataset.id);
    });

    document.getElementById('filtro-limite-prod')?.addEventListener('change', (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 1) { val = 10; e.target.value = val; }
        prodLimitePagina = val;
        prodPaginaActual = 1; 
        ejecutarFiltrosYRender(); 
    });

    document.getElementById('btn-bulk-borrar')?.addEventListener('click', () => borrarMasivoProd('inventario', 'chk-item-prod'));
document.getElementById('btn-bulk-archivar')?.addEventListener('click', () => gestionMasivaProd('archivar'));
document.getElementById('btn-bulk-reciclar')?.addEventListener('click', () => abrirModalBulkGestion('reciclar'));
document.getElementById('btn-bulk-renovar')?.addEventListener('click', () => abrirModalBulkGestion('renovar'));

    document.getElementById('buscar-producto')?.addEventListener('keyup', (e) => { 
        if (e.key === 'Enter') {
            prodPaginaActual = 1; 
            ejecutarFiltrosYRender();
        }
    });
    
    // 🔥 NUEVA MEJORA: Filtro automático al escribir o seleccionar usuario
    document.getElementById('filtro-usuario-prod')?.addEventListener('input', () => {
        prodPaginaActual = 1; 
        ejecutarFiltrosYRender();
    });
    
    document.getElementById('filtro-categoria-prod')?.addEventListener('change', () => {
        prodPaginaActual = 1; ejecutarFiltrosYRender();
    });
    
    document.getElementById('filtro-estado-prod')?.addEventListener('change', () => {
        prodPaginaActual = 1; ejecutarFiltrosYRender();
    });

    document.addEventListener('submit', async (e) => {
        if (e.target && e.target.id === 'form-crear-producto') {
            e.preventDefault();
            
            const credencialesInput = document.getElementById('nuevo-producto-credenciales').value.trim();
            const selectCategoria = document.getElementById('nuevo-producto-categoria');
            const opcionSeleccionada = selectCategoria.options[selectCategoria.selectedIndex];
            
            const nombreHistorico = opcionSeleccionada.dataset.nombre;
            const tipoServicio = opcionSeleccionada.dataset.tipo || 'Cuenta';
            const servicioInput = nombreHistorico.toLowerCase().trim();

            // 🔥 VALIDACIÓN: Verificamos si es cuenta completa para bloquear duplicados
            let esCuentaCompleta = opcionSeleccionada.dataset.cuenta_completa && (opcionSeleccionada.dataset.cuenta_completa.toLowerCase() === 'si' || opcionSeleccionada.dataset.cuenta_completa.toLowerCase() === 'sí');
            if (servicioInput.includes('pantalla') || servicioInput.includes('perfil')) {
                esCuentaCompleta = false;
            }

            let identificadorAValidar = '';

            if (tipoServicio === 'Cuenta') {
                if(!credencialesInput.includes(':')) {
                    mostrarToast('Falta el separador ":" en las credenciales.', 'warning');
                    return;
                }
                identificadorAValidar = credencialesInput.split(':')[0].toLowerCase().trim();
            } else {
                identificadorAValidar = credencialesInput.toLowerCase().trim();
            }

            const llaveValidacion = `${identificadorAValidar}|${servicioInput}`;
            
            // 🔥 MODIFICACIÓN: Solo bloquea si ES cuenta completa
            if (productoEditandoID === null && esCuentaCompleta && productosExistentesEnBD.includes(llaveValidacion)) {
                let mensajeError = tipoServicio === 'Cuenta' 
                    ? `La cuenta ${identificadorAValidar} ya existe y este servicio es de CUENTA COMPLETA.`
                    : `Este PIN ya fue registrado en este servicio completo.`;
                mostrarToast(mensajeError, 'error');
                return;
            }

            const btn = document.getElementById('btn-guardar-producto');
            const txtOriginal = btn.innerHTML;
            btn.innerHTML = '<i class="material-icons-round" style="animation: spin 1s linear infinite;">autorenew</i> Procesando...';
            btn.disabled = true;

            if (typeof window.mostrarCargaPremium === 'function') {
                window.mostrarCargaPremium("Guardando producto en la base de datos...");
            }

            const payloadData = {
                accion: productoEditandoID ? 'editarCuenta' : 'crearCuenta',
                id: productoEditandoID,
                servicio: nombreHistorico, 
                cuenta: credencialesInput, 
                fecha: document.getElementById('nuevo-producto-fecha').value,
                dias: document.getElementById('nuevo-producto-dias').value
            };

            try {
                const res = await peticionProductosAPI(payloadData);
                mostrarToast(res.msg, res.success ? 'success' : 'error');
                
                if (res.success) { 
                    resetFormularioProducto(); 
                    cerrarModal('modal-crear-producto'); 
                    cargarProductosBase(); 
                }
            } catch (err) {
                mostrarToast("Error de conexión al guardar el producto.", "error");
                console.error("Error guardando producto:", err);
            } finally {
                
                if (typeof window.ocultarCargaPremium === 'function') {
                    window.ocultarCargaPremium();
                }
                btn.innerHTML = txtOriginal;
                btn.disabled = false;
            }
        }
    });

    document.addEventListener('click', async (e) => {
        
        const btnImportar = e.target.closest('#btn-procesar-importacion');
        
        if(btnImportar) {
            e.preventDefault(); 
            const btn = btnImportar;
            const textoArea = document.getElementById('texto-importar').value;
            const fileInput = document.getElementById('archivo-importar');
            const selectServicio = document.getElementById('importar-servicio');
            const dias = parseInt(document.getElementById('importar-dias').value);
            const fechaImportacion = document.getElementById('importar-fecha').value;

            if(!textoArea.trim() && (!fileInput.files || fileInput.files.length === 0)) {
                return mostrarToast("Debes pegar datos o subir un archivo.", "error");
            }
            
            const opcionSeleccionada = selectServicio.options[selectServicio.selectedIndex];
            if(!opcionSeleccionada || !opcionSeleccionada.value) return mostrarToast("Selecciona un servicio.", "error");
            
            const nombreHistorico = opcionSeleccionada.dataset.nombre;
            const tipoServicio = opcionSeleccionada.dataset.tipo || 'Cuenta';
            const servicioAEnviar = nombreHistorico.toLowerCase().trim();

            // 🔥 VALIDACIÓN EN MASA: Verificamos si es cuenta completa
            let esCuentaCompleta = opcionSeleccionada.dataset.cuenta_completa && (opcionSeleccionada.dataset.cuenta_completa.toLowerCase() === 'si' || opcionSeleccionada.dataset.cuenta_completa.toLowerCase() === 'sí');
            if (servicioAEnviar.includes('pantalla') || servicioAEnviar.includes('perfil')) {
                esCuentaCompleta = false;
            }

            if(!dias || dias <= 0) return mostrarToast("Días inválidos.", "error");

            btn.innerHTML = '<i class="material-icons-round" style="animation: spin 1s linear infinite;">autorenew</i> Procesando...';
            btn.disabled = true;

            let cuentasLimpias = [];
            let omitidos = []; 

            const enviarAlServidor = async () => {

                if (cuentasLimpias.length > 0) {
                    
                    if (typeof window.mostrarCargaPremium === 'function') {
                        window.mostrarCargaPremium(`Importando ${cuentasLimpias.length} cuentas. Por favor espera...`);
                    }

                    try {
                        const res = await peticionProductosAPI({ accion: 'importarCuentasMasivas', cuentas: cuentasLimpias });
                        if (res.success) {
                            mostrarToast(res.msg, 'success');
                            prodPaginaActual = 1; 
                            cargarProductosBase(); 

                            cerrarModal('modal-importar-producto');
                        } else {
                            mostrarToast("Error del servidor: " + res.msg, 'error');
                        }
                    } catch (err) {
                        mostrarToast("Error de conexión durante la importación.", "error");
                    } finally {
                        
                        if (typeof window.ocultarCargaPremium === 'function') {
                            window.ocultarCargaPremium();
                        }
                    }
                }

                if (omitidos.length > 0) {
                    
                    cerrarModal('modal-importar-producto');
                    
                    const listaDiv = document.getElementById('lista-errores-import');
                    if(listaDiv) {
                        listaDiv.innerHTML = omitidos.map(o => `
                            <div style="border-bottom: 1px solid rgba(255,255,255,0.05); padding: 8px 0; display: flex; justify-content: space-between; gap: 10px;">
                                <span style="color:var(--text-main); word-break: break-all;">${o.dato}</span>
                                <span style="color:var(--danger); font-size:0.7rem; font-weight:bold; white-space:nowrap;">[${o.razon}]</span>
                            </div>
                        `).join('');
                        abrirModal('modal-reporte-importacion');
                    }
                } else if (cuentasLimpias.length === 0) {
                    mostrarToast("No se detectaron datos nuevos para procesar.", "warning");
                }

                btn.innerHTML = '<i class="material-icons-round">cloud_upload</i> Procesar Inventario';
                btn.disabled = false;
                document.getElementById('texto-importar').value = "";
                if(fileInput) fileInput.value = "";
            };

            const procesarFila = (linea) => {
                const credencial = linea.trim();
                if(!credencial) return;
                
                let identificadorPuro = '';

                if (tipoServicio === 'Cuenta') {
                    if(!credencial.includes(':')) {
                        omitidos.push({ dato: credencial, razon: "Falta ':'" });
                        return;
                    }
                    identificadorPuro = credencial.split(':')[0].toLowerCase().trim();
                } else {
                    identificadorPuro = credencial.toLowerCase().trim();
                }
                
                const llaveValidacion = `${identificadorPuro}|${servicioAEnviar}`;
                
                // 🔥 MODIFICACIÓN: Si es cuenta completa, bloquea el duplicado. Si es pantalla, lo ignora y lo agrega.
                if (esCuentaCompleta && productosExistentesEnBD.includes(llaveValidacion)) {
                    omitidos.push({ dato: credencial, razon: "Repetida en Cuenta Completa" });
                } else {
                    productosExistentesEnBD.push(llaveValidacion); // Lo agregamos para que valide internamente el mismo lote
                    cuentasLimpias.push({ cuenta: credencial, fecha: fechaImportacion, dias: dias, servicio: nombreHistorico });
                }
            };

            if(textoArea.trim()) {
                textoArea.split('\n').forEach(linea => procesarFila(linea));
            }

            if(fileInput && fileInput.files && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const reader = new FileReader();
                reader.onload = function(evento) {
                    const contenido = evento.target.result;
                    contenido.split('\n').forEach(linea => procesarFila(linea));
                    enviarAlServidor();
                };
                reader.readAsText(file);
            } else {
                enviarAlServidor();
            }
        }
    });

    window.ejecutarExportacion = function(formato) {
        const checkboxes = Array.from(document.querySelectorAll('.chk-item-prod:checked'));
        let idsSeleccionados = checkboxes.map(chk => chk.value);
        
        let datosAExportar = [];
        if (idsSeleccionados.length > 0) {
            datosAExportar = productosDataOriginal.filter(p => idsSeleccionados.includes(p.id.toString()));
        } else {
            datosAExportar = productosDataOriginal; 
        }

        if (datosAExportar.length === 0) return mostrarToast("No hay datos para exportar.", "warning");

        if (formato === 'csv') {
            const datosProcesados = datosAExportar.map(prod => {
                return {
                    "Servicio": prod.servicio_nombre,
                    "Acceso": prod.cuenta, 
                    "Estado": prod.vendida === 'Si' ? 'Vendido' : prod.vendida,
                    "Comprador": prod.usuario_comprador || 'Nadie',
                    "Fecha Creado": prod.fecha_inicio || 'N/A',
                    "Días Contratados": prod.dias_cuenta
                };
            });
            generarCSVProd(datosProcesados, "Inventario_DigitalWorld.csv");
            
        } else if (formato === 'txt') {
            
            let cuentasAgrupadas = {};
            datosAExportar.forEach(prod => {
                let srv = prod.servicio_nombre;
                if (!cuentasAgrupadas[srv]) {
                    cuentasAgrupadas[srv] = [];
                }
                cuentasAgrupadas[srv].push(prod.cuenta);
            });

            let contenido = `🌟 ${NOMBRE_NEGOCIO} - INVENTARIO 🌟\r\n`;
            contenido += "=======================================================\r\n\r\n";
            
            for (const srv in cuentasAgrupadas) {
                contenido += `Servicio: ${srv}\r\n`;

                cuentasAgrupadas[srv].forEach(cuenta => {
                    contenido += `${cuenta}\r\n`;
                });

                contenido += `-------------------------------------------------------\r\n`;
            }

            const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Inventario_DW_${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    document.getElementById('btn-exportar-csv')?.addEventListener('click', () => ejecutarExportacion('csv'));
    document.getElementById('btn-exportar-txt')?.addEventListener('click', () => ejecutarExportacion('txt'));
}

function generarCSVProd(datos, nombreArchivo) {
    const encabezados = Object.keys(datos[0]);
    const filasCSV = datos.map(fila => encabezados.map(campo => {
        let valor = fila[campo] === null ? "" : fila[campo].toString();
        if (valor.includes(',') || valor.includes('"')) valor = `"${valor.replace(/"/g, '""')}"`;
        return valor;
    }).join(','));
    const contenidoCSV = [encabezados.join(','), ...filasCSV].join('\r\n');
    const blob = new Blob(["\ufeff" + contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url); link.setAttribute("download", nombreArchivo);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

window.toggleAllChkProd = function(allId, itemClass, containerId) {
    const checked = document.getElementById(allId).checked;
    document.querySelectorAll('.' + itemClass).forEach(chk => {
        if (!chk.disabled) chk.checked = checked;
    });
    const total = document.querySelectorAll('.' + itemClass + ':checked:not(:disabled)').length;
    const container = document.getElementById(containerId);
    if (container) {
        container.style.display = total > 0 ? 'flex' : 'none';
        const label = document.getElementById('bulk-count-label');
        if (label) label.innerText = `${total} seleccionados:`;
    }
};

window.checkIndividualProd = function(itemClass, containerId, allId) {
    const total = document.querySelectorAll('.' + itemClass + ':not(:disabled)').length;
    const checked = document.querySelectorAll('.' + itemClass + ':checked:not(:disabled)').length;
    const allChk = document.getElementById(allId);
    if (allChk) allChk.checked = (total === checked && total > 0);
    const container = document.getElementById(containerId);
    if (container) {
        container.style.display = checked > 0 ? 'flex' : 'none';
        const label = document.getElementById('bulk-count-label');
        if (label) label.innerText = `${checked} seleccionados:`;
    }
};

window.borrarMasivoProd = async function(tabla, itemClass) {
    const checkboxes = Array.from(document.querySelectorAll('.' + itemClass + ':checked:not(:disabled)'));
    if(checkboxes.length === 0) return;
    
    let seleccionados = [];
    let protegidas = 0;

    checkboxes.forEach(chk => {
        const est = chk.getAttribute('data-estado');
        if (est === 'Si' || est === 'Garantia') {
            protegidas++;
        } else {
            seleccionados.push(chk.value);
        }
    });

    if (protegidas > 0) {
        mostrarToast(`Seguridad: Se omitieron ${protegidas} cuentas porque están Vendidas o en Garantía.`, "info");
    }

    if(seleccionados.length === 0) return; 
    
    if(!confirm(`¿Enviar ${seleccionados.length} cuentas disponibles/caducadas a la papelera?`)) return;
    
    let token = sessionStorage.getItem('admin_token');
    let user = sessionStorage.getItem('admin_user');
    
    const btn = document.getElementById('btn-bulk-prod');
    if(btn) btn.innerHTML = '<i class="material-icons-round" style="animation: spin 1s linear infinite;">autorenew</i> Borrando...';

    try {
        const response = await fetch(API_ADMIN_MODULE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accion: 'moverAPapeleraMasivo', tabla: tabla, ids: seleccionados, usuario: user, token: token })
        });
        const res = await response.json();
        
        mostrarToast(res.msg, res.success ? 'success' : 'error'); 
        if(res.success) {
            if(btn) btn.style.display = 'none';
            const chkAll = document.getElementById('chk-all-prod');
            if(chkAll) chkAll.checked = false;
            
            cargarProductosBase(); 
        }
    } catch(e) {
        mostrarToast("Error procesando solicitud", "error"); 
    } finally {
        if(btn) btn.innerHTML = '<i class="material-icons-round" style="font-size: 1.2rem; vertical-align: middle;">delete_sweep</i> <span>Borrar Selección</span>';
    }
}

window.prodColumnaOrden = 'id'; 
window.prodDireccionOrden = 'desc';

window.inicializarIconosOrdenProd = function() {
    document.querySelectorAll('#mod-productos-todos table thead th').forEach(th => {
        if (th.id !== 'th-chk-prod' && !th.innerText.includes('Acciones')) {

            let colName = 'id';
            let txt = th.innerText.toLowerCase().trim();
            if(txt.includes('servicio')) colName = 'servicio';
            else if(txt.includes('dato')) colName = 'cuenta';
            else if(txt.includes('compra')) colName = 'fecha';
            else if(txt.includes('días') || txt.includes('dias')) colName = 'dias';
            else if(txt.includes('estado')) colName = 'estado';
            else if(txt.includes('usuario')) colName = 'usuario';

            th.style.cursor = 'pointer';
            th.onclick = () => window.ordenarTablaProductos(colName);
            
            if (!th.querySelector('.sort-icon-prod')) {
                th.innerHTML += ` <span class="sort-icon-prod" data-col="${colName}" style="color:var(--text-muted); font-size:0.8rem; margin-left:5px; transition: 0.2s;">↕</span>`;
            }
        }
    });
};

window.ordenarTablaProductos = function(columna) {
    if (window.prodColumnaOrden === columna) {
        window.prodDireccionOrden = window.prodDireccionOrden === 'asc' ? 'desc' : 'asc';
    } else {
        window.prodColumnaOrden = columna;
        window.prodDireccionOrden = 'desc';
    }
    
    document.querySelectorAll('.sort-icon-prod').forEach(icon => { 
        icon.innerText = '↕'; 
        icon.style.color = 'var(--text-muted)'; 
    });
    
    const iconoActivo = document.querySelector(`.sort-icon-prod[data-col="${columna}"]`);
    if(iconoActivo) { 
        iconoActivo.innerText = window.prodDireccionOrden === 'asc' ? '▲' : '▼'; 
        iconoActivo.style.color = 'var(--accent)'; 
    }
    
    prodPaginaActual = 1;
    ejecutarFiltrosYRender();
};
function obtenerIdsSeleccionados() {
    return Array.from(document.querySelectorAll('.chk-item-prod:checked')).map(chk => ({
        id: chk.value,
        estado: chk.getAttribute('data-estado')
    }));
}
window.abrirModalReversarVenta = function(objEncoded) {
    const prod = JSON.parse(decodeURIComponent(objEncoded));
    const precio = parseFloat(prod.precio_compra) || 0;
    const isDark = document.body.classList.contains('dark-mode');
    Swal.fire({
        html: `
            <div style="text-align:center; padding: 10px;">
                <i class="material-icons-round" style="font-size: 3rem; color: #ef4444; margin-bottom:10px;">undo</i>
                <h2 style="color:var(--text-main); font-size:1.3rem; margin:0 0 10px 0;">Reversar Venta</h2>
                <p style="color:var(--text-gray); font-size:0.9rem; margin-bottom:15px;">
                    Se reembolsará <b style="color:#10b981;">$${new Intl.NumberFormat('es-CO').format(precio)}</b> 
                    a <b style="color:#38bdf8;">${prod.usuario_comprador}</b> y la cuenta volverá al inventario.
                </p>
                <div style="background:var(--bg-dark); border:1px solid var(--border-color); border-radius:10px; padding:12px; font-family:monospace; font-size:0.8rem; color:var(--text-muted); text-align:left;">
                    📦 ${prod.servicio_nombre}<br>
                    🔑 ${prod.cuenta}<br>
                    🏷️ Orden: ${prod.order_id || 'Sin orden'}
                </div>
            </div>
        `,
        background: isDark ? 'var(--bg-card)' : '#ffffff',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: 'transparent',
        confirmButtonText: '<i class="material-icons-round" style="vertical-align:middle; font-size:1rem;">undo</i> Confirmar Reembolso',
        cancelButtonText: 'Cancelar',
        customClass: { popup: 'premium-modal-radius', cancelButton: 'banco-btn-cancel' },
        showLoaderOnConfirm: true,
        preConfirm: async () => {
            const res = await peticionProductosAPI({
                accion: 'reversarVenta',
                id_cuenta: prod.id
            });
            if (!res.success) {
                Swal.showValidationMessage(`❌ ${res.msg}`);
                return false;
            }
            return res;
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            mostrarToast(result.value.msg, 'success');
            cargarProductosBase();
        }
    });
};
async function gestionMasivaProd(accion, cuentasConDatos = []) {
    // Si no vienen datos por cuenta (caso archivar), construimos la lista básica
    if (cuentasConDatos.length === 0) {
        const seleccionados = obtenerIdsSeleccionados();
        if (seleccionados.length === 0) return mostrarToast("No hay cuentas seleccionadas.", "warning");
        const protegidas = seleccionados.filter(i => {
            if (i.estado !== 'Si' && i.estado !== 'Garantia') return false;
            const prod = productosDataOriginal.find(p => p.id == i.id);
            return prod && calcularDiasReales(prod) > 0;
        });
        const idsProtegidas = new Set(protegidas.map(i => i.id));
        const validas = seleccionados.filter(i => !idsProtegidas.has(i.id));
        if (protegidas.length > 0) {
            mostrarToast(`⚠️ ${protegidas.length} cuenta(s) activa(s) omitidas.`, 'info');
        }
        if (validas.length === 0) return mostrarToast("No hay cuentas válidas para esta acción.", "warning");
        cuentasConDatos = validas.map(item => {
            const prod = productosDataOriginal.find(p => p.id == item.id);
            return { id: item.id, credenciales: prod ? prod.cuenta : 'archived_acc', dias: 30, precio: 0 };
        });
    }
    const nombresAccion = { archivar: 'archivar', reciclar: 'liberar al stock', renovar: 'renovar' };
    if (!confirm(`¿Confirmas ${nombresAccion[accion]} ${cuentasConDatos.length} cuenta(s)?`)) return;
    let exitosos = 0, fallidos = 0;
    for (const item of cuentasConDatos) {
        const res = await peticionProductosAPI({
            accion: 'gestionarCuentaCaducada',
            tipo_gestion: accion,
            id_viejo: item.id,
            nuevas_credenciales: item.credenciales || 'archived_acc',
            nuevos_dias: item.dias || 30,
            precio_renovacion: item.precio || 0
        });
        if (res.success) exitosos++; else fallidos++;
    }
    mostrarToast(`✅ ${exitosos} procesadas` + (fallidos > 0 ? ` | ❌ ${fallidos} fallaron` : ''), exitosos > 0 ? 'success' : 'error');
    const bulkEl = document.getElementById('bulk-actions-prod');
    if (bulkEl) bulkEl.style.display = 'none';
    const chkAll = document.getElementById('chk-all-prod');
    if (chkAll) chkAll.checked = false;
    cargarProductosBase();
}

window.abrirModalBulkGestion = function(accion) {
    const seleccionados = obtenerIdsSeleccionados();
    if (seleccionados.length === 0) return mostrarToast("No hay cuentas seleccionadas.", "warning");
    const protegidas = seleccionados.filter(i => {
        if (i.estado !== 'Si' && i.estado !== 'Garantia') return false;
        const prod = productosDataOriginal.find(p => p.id == i.id);
        return prod && calcularDiasReales(prod) > 0;
    });
    const idsProtegidas = new Set(protegidas.map(i => i.id));
    const validas = seleccionados.filter(i => !idsProtegidas.has(i.id));
    if (protegidas.length > 0) mostrarToast(`⚠️ ${protegidas.length} cuenta(s) activa(s) serán omitidas.`, 'info');
    if (validas.length === 0) return mostrarToast("No hay cuentas válidas.", "warning");
    const cuentasSeleccionadas = validas.map(item => productosDataOriginal.find(p => p.id == item.id) || { id: item.id, cuenta: '', servicio_nombre: '?', usuario_comprador: '-', precio_compra: 0 });
    const modalViejo = document.getElementById('modal-bulk-gestion');
    if (modalViejo) modalViejo.remove();
    const modal = document.createElement('div');
    modal.id = 'modal-bulk-gestion';
    modal.className = 'modal-overlay';
    Object.assign(modal.style, { display: 'none', position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', background: 'rgba(10,15,25,0.9)', zIndex: '9996', alignItems: 'center', justifyContent: 'center' });
    const esReciclar = accion === 'reciclar';
    const esRenovar  = accion === 'renovar';
    const count = cuentasSeleccionadas.length;
    const titulo = esReciclar ? `<i class="material-icons-round">lock_open</i> Reciclar ${count} Cuentas` : `<i class="material-icons-round">autorenew</i> Renovar ${count} Cuentas`;
    const info = esReciclar ? `Edita las credenciales antes de liberar al stock. Las originales quedan como <b>Vencidas</b>.` : `Edita las credenciales y el precio a cobrar a cada cliente.`;
    const thPrecio = esRenovar ? `<th style="padding: 10px 8px; color: #94a3b8; font-size: 0.72rem; text-align:center;">$ Cobrar</th>` : '';
    const filasTabla = cuentasSeleccionadas.map(prod => {
        const tdPrecio = esRenovar ? `<td style="padding: 8px;"><input type="number" class="bulk-precio-input" data-id="${prod.id}" value="${prod.precio_compra || 0}" style="width:75px; padding:7px; background:#0f172a; border:1px solid #334155; color:#38bdf8; font-weight:bold; border-radius:6px; outline:none; text-align:center;"></td>` : '';
        return `<tr style="border-bottom: 1px solid #1e293b;">
            <td style="padding: 8px 10px; font-size: 0.78rem; color: #94a3b8; white-space:nowrap;">${prod.servicio_nombre}</td>
            <td style="padding: 8px;"><input type="text" class="bulk-cred-input" data-id="${prod.id}" value="${prod.cuenta}" style="width:100%; padding:7px 10px; background:#0f172a; border:1px solid #334155; color:#fff; border-radius:6px; outline:none; font-family:monospace; font-size:0.8rem; box-sizing:border-box;"></td>
            <td style="padding: 8px; text-align:center;"><input type="number" class="bulk-dias-input" data-id="${prod.id}" value="30" style="width:65px; padding:7px; background:#0f172a; border:1px solid #334155; color:#10b981; font-weight:bold; border-radius:6px; outline:none; text-align:center;"></td>
            ${tdPrecio}
            <td style="padding: 8px 10px; font-size: 0.78rem; color: #38bdf8; white-space:nowrap;">${prod.usuario_comprador || '-'}</td>
        </tr>`;
    }).join('');
    modal.innerHTML = `
        <div style="background:#1e293b; border:1px solid #334155; border-radius:20px; max-width:720px; width:95%; max-height:85vh; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 25px 50px rgba(0,0,0,0.5);">
            <div style="padding:20px 25px; background:#0f172a; border-bottom:1px solid #334155; display:flex; justify-content:space-between; align-items:center; flex-shrink:0;">
                <h3 style="margin:0; color:#38bdf8; display:flex; align-items:center; gap:10px; font-size:1.1rem;">${titulo}</h3>
                <button onclick="cerrarModal('modal-bulk-gestion')" style="background:transparent; border:none; color:#94a3b8; cursor:pointer; font-size:1.5rem;"><i class="material-icons-round">close</i></button>
            </div>
            <div style="padding:12px 25px; background:#0f172a; border-bottom:1px solid #1e293b; flex-shrink:0;">
                <div style="font-size:0.83rem; color:#cbd5e1; background:#1e293b; padding:10px 15px; border-radius:8px; border:1px solid #334155;">${info}</div>
            </div>
            <div style="overflow-y:auto; flex:1;">
                <table style="width:100%; border-collapse:collapse;">
                    <thead style="background:#0f172a; position:sticky; top:0; z-index:1;">
                        <tr>
                            <th style="padding:10px; color:#94a3b8; font-size:0.72rem; text-align:left;">Servicio</th>
                            <th style="padding:10px; color:#94a3b8; font-size:0.72rem; text-align:left;">Nuevas Credenciales</th>
                            <th style="padding:10px 8px; color:#94a3b8; font-size:0.72rem; text-align:center;">Días</th>
                            ${thPrecio}
                            <th style="padding:10px; color:#94a3b8; font-size:0.72rem; text-align:left;">Cliente</th>
                        </tr>
                    </thead>
                    <tbody style="background:#1e293b;">${filasTabla}</tbody>
                </table>
            </div>
            <div style="padding:18px 25px; background:#0f172a; border-top:1px solid #334155; display:flex; gap:10px; flex-shrink:0;">
                <button onclick="cerrarModal('modal-bulk-gestion')" style="flex:1; padding:12px; background:transparent; color:#94a3b8; border:1px solid #334155; border-radius:8px; font-weight:600; cursor:pointer;">Cancelar</button>
                <button id="btn-bulk-confirmar" style="flex:2; padding:12px; background:${esReciclar ? '#38bdf8' : '#10b981'}; color:${esReciclar ? '#0f172a' : '#fff'}; border:none; border-radius:8px; font-weight:700; cursor:pointer; display:flex; justify-content:center; align-items:center; gap:8px;">
                    <i class="material-icons-round">${esReciclar ? 'lock_open' : 'autorenew'}</i> Confirmar ${esReciclar ? 'Reciclaje' : 'Renovación'}
                </button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    document.getElementById('btn-bulk-confirmar').addEventListener('click', async () => {
        const btn = document.getElementById('btn-bulk-confirmar');
        btn.innerHTML = '<i class="material-icons-round" style="animation:spin 1s linear infinite;">autorenew</i> Procesando...';
        btn.disabled = true;
        const cuentasConDatos = Array.from(document.querySelectorAll('.bulk-cred-input')).map(input => {
            const id = input.getAttribute('data-id');
            const diasEl   = document.querySelector(`.bulk-dias-input[data-id="${id}"]`);
            const precioEl = document.querySelector(`.bulk-precio-input[data-id="${id}"]`);
            return { id, credenciales: input.value.trim() || 'archived_acc', dias: diasEl ? parseInt(diasEl.value) || 30 : 30, precio: precioEl ? parseFloat(precioEl.value) || 0 : 0 };
        });
        cerrarModal('modal-bulk-gestion');
        await gestionMasivaProd(accion, cuentasConDatos);
    });
    abrirModal('modal-bulk-gestion');
};

// Wrapper (ESTO SIEMPRE AL FINAL)
const oldCargarProductosBase = cargarProductosBase;
cargarProductosBase = async function() {
    await oldCargarProductosBase();
    window.inicializarIconosOrdenProd();
};
