const API_ADMIN_MODULE_CAT = `${API_BASE_URL_F}/admin_api.php`;
let categoriaEditandoID = null;
let categoriasInicializado = false; 
let listaUsuariosGlobal = []; 
let usuariosCargadosParaPrecios = false; // Bandera para caché de usuarios

let catDatosGlobales = [];
let catPaginaActual = 1;
let catLimitePagina = 10;

function convertirAThumbnail(url) {
    if (!url || url.trim() === "") return "";
    if (url.includes("uc?export=view&id=")) {
        return url.replace("uc?export=view&id=", "thumbnail?id=") + "&sz=w1000";
    }
    return url;
}

document.addEventListener('moduloCargado', (e) => {
    if (e.detail.modulo === 'mod-productos-servicios') {
        inicializarModuloCategorias();
        cargarCategoriasUltraRapido();
    }
});

function inicializarModuloCategorias() {
    if (categoriasInicializado) return; 
    categoriasInicializado = true;

    const seccionCategorias = document.getElementById('mod-productos-servicios');
    if (seccionCategorias && seccionCategorias.innerHTML.trim() === "") {
        seccionCategorias.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                <h2 style="margin:0;"><i class="material-icons-round" style="vertical-align: bottom;">category</i> Categorías de Productos</h2>
                <div style="display: flex; gap: 10px;">
                    <button id="btn-nueva-categoria" style="width: auto;"><i class="material-icons-round" style="font-size: 1.2rem;">add_circle</i> Nueva Categoría</button>
                </div>
            </div>

            <div style="background: var(--bg-card); padding: 15px 20px; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 20px; display: flex; gap: 15px; flex-wrap: wrap; align-items: flex-end;">
                <div style="flex: 1; min-width: 200px;">
                    <label>Buscar Categoría:</label>
                    <input type="text" id="buscar-categoria" placeholder="Nombre o descripción..." style="margin:0;">
                </div>
                <div style="flex: 1; min-width: 150px;">
                    <label>Filtrar Tipo:</label>
                    <select id="filtro-tipo-cat" style="margin:0;">
                        <option value="">Todos los Tipos</option>
                        <option value="Cuenta">Cuenta</option>
                        <option value="PIN">PIN</option>
                    </select>
                </div>
                <div style="flex: 0; min-width: 80px;">
                    <label>Mostrar:</label>
                    <input type="number" id="filtro-limite-cat" value="10" min="1" style="margin:0; width: 100%;">
                </div>
            </div>

            <div style="overflow-x: auto; position: relative;">
                <div id="indicador-sync-cat" style="display:none; position:absolute; top:-25px; right:10px; font-size:0.8rem; color:var(--accent); font-weight:bold;"><i class="material-icons-round" style="font-size:1rem; vertical-align:middle; animation: spin 1s linear infinite;">autorenew</i> Sincronizando nube...</div>
                <table id="tabla-categorias">
                    <thead>
                        <tr>
                            <th id="th-chk-cat" style="width: 40px; text-align: center;"><input type="checkbox" id="chk-all-cat" onchange="toggleAllChkCat('chk-all-cat', 'chk-item-cat', 'btn-bulk-cat')"></th>
                            <th style="text-align: center;">Fav</th>
                            <th style="text-align: center;">ID</th>
                            <th style="text-align: left;">Categoría / Servicio</th>
                            <th style="text-align: center;">Tipo</th>
                            <th style="text-align: right;">Precio Base</th>
                            <th style="text-align: center;">Variación</th>
                            <th style="text-align: center;">Precios Esp.</th>
                            <th style="text-align: center;">Stock Disp.</th> 
                            <th style="text-align: center;">Límites</th>
                            <th style="text-align: center;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tabla-categorias-body"></tbody>
                </table>
            </div>
            
            <div style="margin-top: 15px; height: 40px;">
                <button id="btn-bulk-cat" style="display: none; background: var(--danger-bg); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.3); width: auto; box-shadow: none; padding: 8px 16px; border-radius: 8px; transition: all 0.3s ease;">
                    <i class="material-icons-round" style="font-size: 1.2rem; vertical-align: middle;">delete_sweep</i> <span>Borrar Selección</span>
                </button>
            </div>

            <div id="paginacion-categorias-container" style="display: flex; gap: 5px; margin-top: 20px; align-items: center; justify-content: center;"></div>
        `;
    }

    prepararModalesCat();
    inicializarIconosOrdenCat();

    const btnNuevaCat = document.getElementById('btn-nueva-categoria');
    if (btnNuevaCat) {
        btnNuevaCat.addEventListener('click', () => {
            resetFormularioCategoria();
            abrirModal('modal-crear-categoria'); 
            cargarUsuariosParaPrecios(''); // Carga sin bloquear el modal
        });
    }

    initEventosCategorias();
}

async function cargarCategoriasUltraRapido() {
    const tbody = document.getElementById('tabla-categorias-body');
    const indicadorSync = document.getElementById('indicador-sync-cat');
    if(!tbody) return;

    const cache = localStorage.getItem('db_categorias_cache');
    if (cache) {
        try {
            catDatosGlobales = JSON.parse(cache);
            renderizarTablaCategorias();
            if(indicadorSync) indicadorSync.style.display = 'block'; // Avisamos que estamos verificando
        } catch(e) { console.error("Caché corrupto", e); }
    } else {
        tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding: 40px;"><i class="material-icons-round" style="animation: spin 1s linear infinite; color: var(--accent); font-size: 2rem;">autorenew</i> Cargando catálogo...</td></tr>`;
    }

    try {
        const datos = { accion: 'getServiciosAdmin', usuario: sessionStorage.getItem('admin_user'), token: sessionStorage.getItem('admin_token') };
        const response = await fetch(API_ADMIN_MODULE_CAT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
        const res = await response.json();

        if (res.success) {
            localStorage.setItem('db_categorias_cache', JSON.stringify(res.datos));
            catDatosGlobales = res.datos;
            catPaginaActual = 1;
            renderizarTablaCategorias();
        } else {
            if (!cache) mostrarToast("Error: " + res.msg, 'error');
        }
    } catch (error) {
        console.error("Error silencioso cargando categorías:", error);
    } finally {
        if(indicadorSync) indicadorSync.style.display = 'none';
    }
}

async function subirImagenADrive(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = function(event) {
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = async function() {
                // COMPRESIÓN CON CANVAS
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800; // Ancho máximo
                const MAX_HEIGHT = 800; // Alto máximo
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = "#ffffff"; // Fondo blanco por si hay transparencias
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                const base64Data = dataUrl.split(',')[1]; 

                const payload = {
                    fileName: file.name.split('.')[0] + '_comprimida.jpg', 
                    mimeType: 'image/jpeg',
                    base64: base64Data
                };

                try {
                    const scriptUrl = "https://script.google.com/macros/s/AKfycbxpAgifTGMqVEyrvWDKP8AYnYrSnbdltnWQ5ENcKTP-jQDE1va4EM7Shu4OKMBH3kWL/exec";
                    
                    const response = await fetch(scriptUrl, {
                        method: "POST",
                        headers: { "Content-Type": "text/plain;charset=utf-8" },
                        body: JSON.stringify(payload)
                    });
                    
                    const resultText = await response.text();
                    const result = JSON.parse(resultText); 
                    
                    if(result.success) resolve(result.url); 
                    else reject(result.error);
                } catch(err) {
                    console.error("Error en Fetch:", err);
                    reject("Error de conexión al leer respuesta de Drive.");
                }
            }
        };
    });
}

function prepararModalesCat() {
    if (!document.getElementById('modal-crear-categoria')) {
        const modalCrear = document.createElement('div');
        modalCrear.id = 'modal-crear-categoria';
        modalCrear.className = 'modal-overlay';
        modalCrear.style.display = 'none';
        modalCrear.innerHTML = `
            <div class="modal-content" style="padding: 30px; position: relative; max-width: 600px; max-height: 90vh; overflow-y: auto;">
                <button class="btn-close-modal" style="position: absolute; right: 20px; top: 20px; background: transparent; color: var(--text-muted); border: none; font-size: 1.2rem; cursor: pointer;" onclick="cerrarModal('modal-crear-categoria')"><i class="material-icons-round">close</i></button>
                <h3 id="titulo-modal-categoria" style="color: var(--text-main); margin-bottom: 20px;"><i class="material-icons-round" style="vertical-align: middle;">add_circle</i> Agregar Nueva Categoría</h3>
                
                <form id="form-crear-categoria" enctype="multipart/form-data">
                    
                    <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                        <div style="flex: 2;">
                            <label>Nombre del Servicio:</label>
                            <input type="text" id="nueva-cat-nombre" placeholder="Ej. Netflix Premium" required style="width: 100%; margin:0;">
                        </div>
                        <div style="flex: 1;">
                            <label>Tipo:</label>
                            <select id="nueva-cat-tipo" style="width: 100%; margin:0;">
                                <option value="Cuenta">Cuenta</option>
                                <option value="PIN">PIN</option>
                            </select>
                        </div>
                    </div>

                    <div style="display: flex; gap: 20px; margin-bottom: 15px; background: var(--bg-dark); padding: 10px 15px; border-radius: 8px; border: 1px solid var(--border-color); flex-wrap: wrap;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-main); font-weight: 700; text-transform: none;">
                            <input type="checkbox" id="nueva-cat-favorito" style="width: 18px; height: 18px; margin: 0; accent-color: #f59e0b;">
                            ⭐ Favorito
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-main); font-weight: 700; text-transform: none;">
                            <input type="checkbox" id="nueva-cat-completa" style="width: 18px; height: 18px; margin: 0; accent-color: #3b82f6;">
                            📺 Cuenta Completa
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-main); font-weight: 700; text-transform: none;">
                            <input type="checkbox" id="nueva-cat-oculto" style="width: 18px; height: 18px; margin: 0; accent-color: #ef4444;">
                            👁️‍🗨️ Ocultar del Catálogo
                        </label>
                    </div>

                    <label>Descripción del Servicio <span style="font-weight:normal; text-transform:none;">(Opcional)</span>:</label>
                    <textarea id="nueva-cat-descripcion" rows="3" placeholder="Detalla qué incluye este servicio..." style="width: 100%; margin-bottom: 15px; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-dark); color: var(--text-main); font-family: 'Inter', sans-serif; resize: vertical;"></textarea>
                    
                    <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                        <div style="flex: 1; display: flex; flex-direction: column;">
                            <label style="white-space: nowrap; margin-bottom: 5px;">Precio Actual:</label>
                            <input type="number" id="nueva-cat-precio" placeholder="0" required style="width: 100%; margin: 0;" min="0" step="0.01">
                        </div>
                        <div style="flex: 1; display: flex; flex-direction: column;">
                            <label style="white-space: nowrap; margin-bottom: 5px;">Precio Anterior <span style="font-weight:normal; text-transform:none;">(Opcional)</span>:</label>
                            <input type="number" id="nueva-cat-precio-ant" placeholder="0" style="width: 100%; margin: 0;" min="0" step="0.01">
                        </div>
                    </div>

                    <label>Precios Especiales por Usuario <span style="font-weight:normal; text-transform:none;">(Opcional)</span>:</label>
                    <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; background: var(--bg-dark); margin-bottom: 15px;">
                        <input type="text" id="buscador-usuarios-esp" placeholder="🔍 Buscar usuario..." style="width: 100%; padding: 8px; margin-bottom: 10px; border-radius: 6px; border: 1px solid var(--border-color);">
                        <div id="lista-usuarios-esp" style="max-height: 140px; overflow-y: auto; display: flex; flex-direction: column; gap: 5px;">
                            </div>
                    </div>

                    <label>Imagen o Logo:</label>
                    <div style="display: flex; gap: 15px; align-items: flex-start; margin-bottom: 15px;">
                        <div id="preview-img-container" style="width: 60px; height: 60px; border-radius: 8px; background: var(--bg-dark); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
                            <i class="material-icons-round" style="color: var(--text-muted);">image</i>
                        </div>
                        <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
                            <div style="display: flex; gap: 10px;">
                                <input type="file" id="nueva-cat-img-file" accept="image/*" style="flex: 1; margin: 0; padding: 6px; font-size: 0.8rem;">
                                <button type="button" id="btn-galeria-servidor" style="background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); padding: 6px 12px; font-size: 0.8rem; box-shadow: none; white-space: nowrap;">📁 Galería</button>
                            </div>
                            <input type="hidden" id="nueva-cat-img-actual" value="">
                            
                            <div id="galeria-servidor-container" style="display: none; background: var(--bg-dark); border: 1px solid var(--border-color); padding: 10px; border-radius: 8px;">
                                <p style="font-size: 0.75rem; margin: 0 0 10px 0; color: var(--text-muted);">Selecciona una imagen existente:</p>
                                <div id="galeria-grid" style="display: flex; gap: 10px; flex-wrap: wrap; max-height: 120px; overflow-y: auto;"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 15px; margin-bottom: 5px;">
                        <div style="flex: 1; display: flex; flex-direction: column;">
                            <label style="margin-bottom: 5px;">Mínimo de Compra:</label>
                            <input type="number" id="nueva-cat-min" placeholder="0 = Ilimitado" min="0" value="0" style="width: 100%; margin:0;">
                        </div>
                        <div style="flex: 1; display: flex; flex-direction: column;">
                            <label style="margin-bottom: 5px;">Máximo de Compra:</label>
                            <input type="number" id="nueva-cat-max" placeholder="0 = Ilimitado" min="0" value="0" style="width: 100%; margin:0;">
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-top: 25px;">
                        <button type="submit" id="btn-guardar-categoria" style="flex: 1;">Guardar Categoría</button>
                        <button type="button" onclick="cerrarModal('modal-crear-categoria')" style="flex: 1; background: var(--bg-dark); color: var(--text-main); border: 1px solid var(--border-color); box-shadow: none;">Cancelar</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modalCrear);

        // AL SELECCIONAR UN ARCHIVO, MUESTRA LA PREVISUALIZACIÓN INMEDIATAMENTE
        document.getElementById('nueva-cat-img-file').addEventListener('change', function(e) {
            const container = document.getElementById('preview-img-container');
            if(this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    container.innerHTML = `<img src="${evt.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
                }
                reader.readAsDataURL(this.files[0]);
                document.getElementById('nueva-cat-img-actual').value = "";
                document.getElementById('galeria-servidor-container').style.display = 'none';
            } else {
                container.innerHTML = `<i class="material-icons-round" style="color: var(--text-muted);">image</i>`;
                document.getElementById('nueva-cat-img-actual').value = "";
            }
        });

        document.getElementById('btn-galeria-servidor').addEventListener('click', cargarGaleriaServidor);

        document.getElementById('buscador-usuarios-esp').addEventListener('input', function(e) {
            const filtro = e.target.value.toLowerCase();
            document.querySelectorAll('.user-price-item').forEach(item => {
                const nombre = item.dataset.user.toLowerCase();
                item.style.display = nombre.includes(filtro) ? 'flex' : 'none';
            });
        });
    }
}


async function peticionCategoriasUploadAPI(formData) {
    formData.append('usuario', sessionStorage.getItem('admin_user'));
    formData.append('token', sessionStorage.getItem('admin_token'));
    try {
        const response = await fetch(API_ADMIN_MODULE_CAT, { 
            method: 'POST', 
            body: formData 
        });
        
        const textoRespuesta = await response.text();
        try {
            return JSON.parse(textoRespuesta);
        } catch (e) {
            console.error("🔥 Error crítico en PHP (Revisa este texto):", textoRespuesta);
            return { success: false, msg: "Fallo del Servidor. Revisa la consola (F12)." };
        }
    } catch (error) { 
        console.error("Error de Fetch:", error);
        return { success: false, msg: "Error al subir o conectar con el servidor." }; 
    }
}

function renderizarTablaCategorias() {
    const tbody = document.getElementById('tabla-categorias-body');
    if(!tbody) return;

    const filtroTexto = (document.getElementById('buscar-categoria')?.value || '').toLowerCase().trim();
    const filtroTipo = document.getElementById('filtro-tipo-cat')?.value || '';

    let datosFiltrados = catDatosGlobales.filter(srv => {
        let txt = (srv.nombre + ' ' + (srv.descripcion || '')).toLowerCase();
        let matchTexto = txt.includes(filtroTexto);
        let matchTipo = filtroTipo === '' || srv.tipo === filtroTipo;
        return matchTexto && matchTipo;
    });

    let totalItems = datosFiltrados.length;
    let totalPaginas = Math.ceil(totalItems / catLimitePagina) || 1;
    if(catPaginaActual > totalPaginas) catPaginaActual = totalPaginas;

    let startIndex = (catPaginaActual - 1) * catLimitePagina;
    let endIndex = startIndex + catLimitePagina;
    let datosPagina = datosFiltrados.slice(startIndex, endIndex);

    tbody.innerHTML = '';
    
    const chkAll = document.getElementById('chk-all-cat');
    if(chkAll) chkAll.checked = false;
    const btnBulk = document.getElementById('btn-bulk-cat');
    if(btnBulk) btnBulk.style.display = 'none';

    if (datosPagina.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding: 50px; color: var(--text-gray);">No se encontraron categorías.</td></tr>`;
        renderPaginacionCat(totalItems, totalPaginas);
        return;
    }

    datosPagina.forEach((srv) => {
        const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
        let pAct = parseFloat(srv.precio) || 0;
        let pAnt = parseFloat(srv.precio_anterior) || 0;
        const precioActual = fmt.format(pAct);
        const precioAnterior = pAnt > 0 ? fmt.format(pAnt) : '';

        let isOculto = srv.oculto === 'Si' || srv.oculto === 'sí';
        let isCompleta = srv.cuenta_completa === 'Si' || srv.cuenta_completa === 'sí';
        let isFav = srv.favorito === 'Si' || srv.favorito === 'X';

        let badgeVariacion = '<span style="color:var(--text-muted); font-size:0.8rem;">-</span>';
        let htmlPrecioAnt = '';
        
        if (pAnt > 0) {
            if (pAnt > pAct) {
                let porcentaje = Math.round(((pAnt - pAct) / pAnt) * 100);
                badgeVariacion = `<span class="stat-badge success" title="Bajó el precio"><i class="material-icons-round" style="font-size:0.8rem; vertical-align:middle;">arrow_downward</i> ${porcentaje}% (Oferta)</span>`;
                htmlPrecioAnt = `<span style="text-decoration: line-through; color: var(--text-muted); font-size: 0.85rem; margin-right: 8px;">${precioAnterior}</span>`;
            } else if (pAnt < pAct) {
                let porcentaje = Math.round(((pAct - pAnt) / pAnt) * 100);
                badgeVariacion = `<span class="stat-badge danger" title="Subió el precio"><i class="material-icons-round" style="font-size:0.8rem; vertical-align:middle;">arrow_upward</i> ${porcentaje}% (Subida)</span>`;
                htmlPrecioAnt = `<span style="text-decoration: line-through; color: var(--text-muted); font-size: 0.85rem; margin-right: 8px;">${precioAnterior}</span>`;
            }
        }

        let badgeTipo = srv.tipo === 'PIN' 
            ? `<span style="background: var(--bg-dark); border: 1px solid var(--text-muted); padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; color: var(--text-main);">🔑 PIN</span>`
            : (isCompleta ? `<span style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; color: #3b82f6;">📺 Cta. Completa</span>` 
                          : `<span style="background: var(--accent-light); border: 1px solid rgba(37, 99, 235, 0.2); padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; color: var(--accent);">👤 Pantalla</span>`);

        let badgeOculto = isOculto ? `<span class="stat-badge danger" style="padding:2px 6px; font-size:0.65rem; margin-top:4px;"><i class="material-icons-round" style="font-size:0.8rem; vertical-align:middle;">visibility_off</i> Oculto a Clientes</span>` : '';
        let iconFav = isFav ? `<i class="material-icons-round" style="color: #f59e0b; font-size: 1.2rem;">star</i>` : `<i class="material-icons-round" style="color: var(--border-color); font-size: 1.2rem;">star_border</i>`;

        let preciosEsp = srv.precios_especiales ? srv.precios_especiales.trim() : '';
        let badgePreciosEsp = preciosEsp !== '' 
            ? `<span class="stat-badge warning" title="${preciosEsp}"><i class="material-icons-round" style="font-size:0.9rem; vertical-align:middle;">group</i> Personalizado</span>` 
            : `<span style="color:var(--text-muted); font-size:0.8rem;">General</span>`;

        let stockCuentas = parseInt(srv.stock) || 0;
        let badgeStock = stockCuentas > 0 
            ? `<span class="stat-badge" style="background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.3); font-weight:800; font-family:monospace; font-size:0.9rem;">${stockCuentas}</span>`
            : `<span class="stat-badge" style="background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.3); font-weight:800; font-family:monospace; font-size:0.9rem;">0</span>`;

        let min = parseInt(srv.minimo_compra) || 0;
        let max = parseInt(srv.maximo_compra) || 0;
        let limitesInfo = (min === 0 && max === 0) ? `<span style="color: var(--text-muted); font-size: 0.8rem;"><i class="material-icons-round" style="font-size: 1rem; vertical-align: middle;">all_inclusive</i> Ilimitado</span>` : `<div style="background: var(--bg-dark); color: var(--text-main); padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; display: inline-block; white-space: nowrap;">${min>0?'Mín:'+min:''} ${min>0&&max>0?'|':''} ${max>0?'Máx:'+max:''}</div>`;

        // 🔥 PINTAR LA IMAGEN CON EL THUMBNAIL DE DRIVE
        const imgUrl = srv.imagen ? convertirAThumbnail(srv.imagen) : ''; 
        const imgHTML = imgUrl ? `<div style="background-image: url('${imgUrl}'); width: 40px; height: 40px; border-radius: 8px; background-size: cover; background-position: center; border: 1px solid var(--border-color); flex-shrink: 0;"></div>` : `<div style="width: 40px; height: 40px; border-radius: 8px; background: var(--bg-dark); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; color: var(--text-muted); flex-shrink: 0;"><i class="material-icons-round" style="font-size:1.2rem;">image</i></div>`;

        let desc = srv.descripcion || '';
        let htmlDesc = '';
        if (desc.trim() !== '') {
            htmlDesc = `<div style="font-size: 0.75rem; color: var(--text-gray); margin-top: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${desc}">${desc}</div>`;
        }

        const objEdit = encodeURIComponent(JSON.stringify(srv));

        const tr = document.createElement('tr');
        if (isOculto) tr.style.opacity = "0.6"; 
        
        tr.innerHTML = `
            <td style="text-align: center; vertical-align: middle;"><input type="checkbox" class="chk-item-cat" value="${srv.id}" onchange="checkIndividualCat('chk-item-cat', 'btn-bulk-cat', 'chk-all-cat')"></td>
            <td style="text-align: center; vertical-align: middle;">${iconFav}</td>
            <td style="color: var(--text-gray); font-weight: 800; text-align: center; vertical-align: middle;">#${srv.id}</td>
            <td style="vertical-align: middle;">
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                    ${imgHTML}
                    <div style="display: flex; flex-direction: column;">
                        <strong style="color: var(--text-main); font-size: 0.95rem;">${srv.nombre}</strong>
                        ${badgeOculto}
                        ${htmlDesc}
                    </div>
                </div>
            </td>
            <td style="text-align: center; vertical-align: middle;">${badgeTipo}</td>
            <td style="text-align: right; vertical-align: middle;">
                <div style="display: flex; align-items: center; justify-content: flex-end;">
                    ${htmlPrecioAnt}
                    <span style="color: var(--accent); font-weight: 800; font-size: 1.05rem;">${precioActual}</span>
                </div>
            </td>
            <td style="text-align: center; vertical-align: middle;">${badgeVariacion}</td>
            <td style="text-align: center; vertical-align: middle;">${badgePreciosEsp}</td>
            <td style="text-align: center; vertical-align: middle;">${badgeStock}</td> <td style="text-align: center; vertical-align: middle;">${limitesInfo}</td>
            <td style="text-align: center; vertical-align: middle; white-space: nowrap;">
                <button class="btn-editar-cat" data-obj="${objEdit}" style="background: var(--accent-light); color: var(--accent); padding: 6px; box-shadow: none; border: none; border-radius: 6px; cursor: pointer; margin-right: 4px;"><i class="material-icons-round">edit</i></button>
                <button class="btn-borrar-cat" data-id="${srv.id}" style="background: var(--danger-bg); color: var(--danger); padding: 6px; box-shadow: none; border: none; border-radius: 6px; cursor: pointer;"><i class="material-icons-round">delete</i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    renderPaginacionCat(totalItems, totalPaginas);
}

function renderPaginacionCat(totalItems, totalPaginas) {
    const container = document.getElementById('paginacion-categorias-container');
    if (!container) return;

    let html = `<span style="color: var(--text-gray); margin-right: 15px;">Total: ${totalItems}</span>`;

    let firstDisabled = catPaginaActual === 1 ? 'opacity: 0.5; pointer-events: none;' : '';
    html += `<button onclick="cambiarPaginaCat(1)" style="width: 35px; height: 35px; padding: 0; display: flex; align-items: center; justify-content: center; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); box-shadow: none; border-radius: 6px; cursor: pointer; margin: 0 2px; ${firstDisabled}"><i class="material-icons-round" style="font-size: 1.2rem;">first_page</i></button>`;

    let prevDisabled = catPaginaActual === 1 ? 'opacity: 0.5; pointer-events: none;' : '';
    html += `<button onclick="cambiarPaginaCat(${catPaginaActual - 1})" style="width: 35px; height: 35px; padding: 0; display: flex; align-items: center; justify-content: center; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); box-shadow: none; border-radius: 6px; cursor: pointer; margin: 0 2px; ${prevDisabled}"><i class="material-icons-round" style="font-size: 1.2rem;">chevron_left</i></button>`;

    let startPage = Math.max(1, catPaginaActual - 1);
    let endPage = Math.min(totalPaginas, startPage + 2);
    if (endPage - startPage < 2) startPage = Math.max(1, endPage - 2);

    for (let i = startPage; i <= endPage; i++) {
        let isAct = i === catPaginaActual;
        html += `<button onclick="cambiarPaginaCat(${i})" style="width: 35px; height: 35px; padding: 0; display: flex; align-items: center; justify-content: center; background: ${isAct ? 'var(--accent)' : 'var(--bg-card)'}; color: ${isAct ? '#fff' : 'var(--text-main)'}; border: 1px solid var(--border-color); box-shadow: none; border-radius: 6px; cursor: pointer; margin: 0 2px;">${i}</button>`;
    }

    let nextDisabled = catPaginaActual === totalPaginas || totalPaginas === 0 ? 'opacity: 0.5; pointer-events: none;' : '';
    html += `<button onclick="cambiarPaginaCat(${catPaginaActual + 1})" style="width: 35px; height: 35px; padding: 0; display: flex; align-items: center; justify-content: center; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); box-shadow: none; border-radius: 6px; cursor: pointer; margin: 0 2px; ${nextDisabled}"><i class="material-icons-round" style="font-size: 1.2rem;">chevron_right</i></button>`;

    let lastDisabled = catPaginaActual === totalPaginas || totalPaginas === 0 ? 'opacity: 0.5; pointer-events: none;' : '';
    html += `<button onclick="cambiarPaginaCat(${totalPaginas})" style="width: 35px; height: 35px; padding: 0; display: flex; align-items: center; justify-content: center; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); box-shadow: none; border-radius: 6px; cursor: pointer; margin: 0 2px; ${lastDisabled}"><i class="material-icons-round" style="font-size: 1.2rem;">last_page</i></button>`;

    container.innerHTML = html;
}

window.cambiarPaginaCat = function(nuevaPagina) {
    catPaginaActual = nuevaPagina;
    renderizarTablaCategorias();
};

async function cargarUsuariosParaPrecios(preciosActuales = '') {
    if (usuariosCargadosParaPrecios && listaUsuariosGlobal.length > 0) {
        renderizarListaUsuariosPrecios(preciosActuales);
        return;
    }

    const container = document.getElementById('lista-usuarios-esp');
    if (container) container.innerHTML = '<span style="color:var(--text-muted); font-size:0.8rem; padding:5px;">Cargando usuarios...</span>';
    
    try {
        const response = await fetch(API_ADMIN_MODULE_CAT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion: 'getUsuarios', usuario: sessionStorage.getItem('admin_user'), token: sessionStorage.getItem('admin_token') }) });
        const res = await response.json();
        if(res.success) {
            listaUsuariosGlobal = res.datos;
            usuariosCargadosParaPrecios = true; // Guardamos en memoria para no repetir
            renderizarListaUsuariosPrecios(preciosActuales);
        }
    } catch(e) {
        if (container) container.innerHTML = '<span style="color:var(--danger); font-size:0.8rem; padding:5px;">Error al cargar usuarios.</span>';
    }
}

function renderizarListaUsuariosPrecios(cadenaActual) {
    const container = document.getElementById('lista-usuarios-esp');
    if(!container) return;
    container.innerHTML = '';
    
    let preciosParseados = {};
    if(cadenaActual) {
        cadenaActual.split(',').forEach(par => {
            let p = par.split(':');
            if(p.length === 2) preciosParseados[p[0].trim()] = p[1].trim();
        });
    }

    listaUsuariosGlobal.forEach(u => {
        const username = u.usuario;
        const tienePrecio = preciosParseados[username] !== undefined;
        const precioValor = tienePrecio ? preciosParseados[username] : '';

        const div = document.createElement('div');
        div.className = 'user-price-item';
        div.dataset.user = username;
        div.style.cssText = `display:flex; align-items:center; gap:10px; background:var(--bg-card); padding:5px 10px; border-radius:6px; border:1px solid var(--border-light);`;
        
        div.innerHTML = `
            <input type="checkbox" class="chk-user-esp" value="${username}" ${tienePrecio ? 'checked' : ''} style="margin:0;">
            <span style="flex:1; font-weight:600; font-size:0.85rem;">${username}</span>
            <input type="number" class="input-precio-esp" placeholder="$ Precio" value="${precioValor}" ${tienePrecio ? '' : 'disabled'} style="width:100px; margin:0; padding:4px 8px; font-size:0.85rem; border: 1px solid var(--border-color); border-radius: 4px; ${tienePrecio ? '' : 'opacity:0.5;'}">
        `;
        
        div.querySelector('.chk-user-esp').addEventListener('change', function() {
            const input = div.querySelector('.input-precio-esp');
            input.disabled = !this.checked;
            input.style.opacity = this.checked ? '1' : '0.5';
            if(this.checked) {
                input.focus();
                input.style.borderColor = 'var(--accent)';
            } else {
                input.style.borderColor = 'var(--border-color)';
                input.value = '';
            }
        });

        container.appendChild(div);
    });
}

async function cargarGaleriaServidor() {
    const btn = document.getElementById('btn-galeria-servidor');
    const container = document.getElementById('galeria-servidor-container');
    const grid = document.getElementById('galeria-grid');
    
    if(container.style.display === 'block') {
        container.style.display = 'none';
        return;
    }
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
    
    try {
        const response = await fetch(API_ADMIN_MODULE_CAT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion: 'getImagenesServidor', usuario: sessionStorage.getItem('admin_user'), token: sessionStorage.getItem('admin_token') }) });
        const res = await response.json();
        btn.innerHTML = '📁 Galería';
        
        if(res.success) {
            grid.innerHTML = '';
            if(res.datos.length === 0) {
                grid.innerHTML = '<span style="font-size:0.8rem; color:var(--text-muted);">No hay imágenes subidas aún.</span>';
            } else {
                res.datos.forEach(url => {
                    const img = document.createElement('img');
                    // 🔥 THUMBNAIL APLICADO EN LA GALERÍA
                    img.src = `${convertirAThumbnail(url)}`;
                    img.style.cssText = `width: 50px; height: 50px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 2px solid transparent; transition: 0.2s;`;
                    img.onclick = () => {
                        document.getElementById('nueva-cat-img-actual').value = url;
                        // 🔥 THUMBNAIL APLICADO EN LA PREVISUALIZACIÓN DE EDICIÓN
                        document.getElementById('preview-img-container').innerHTML = `<img src="${convertirAThumbnail(url)}" style="width:100%; height:100%; object-fit:cover;">`;
                        document.getElementById('nueva-cat-img-file').value = ""; 
                        container.style.display = 'none'; 
                    };
                    img.onmouseenter = () => img.style.borderColor = 'var(--accent)';
                    img.onmouseleave = () => img.style.borderColor = 'transparent';
                    grid.appendChild(img);
                });
            }
            container.style.display = 'block';
        } else {
            mostrarToast("Error al cargar galería", "error");
        }
    } catch(e) { btn.innerHTML = '📁 Galería'; }
}

function prepararEdicionCategoria(objStr) {
    const srv = JSON.parse(decodeURIComponent(objStr)); 
    categoriaEditandoID = srv.id; 


    abrirModal('modal-crear-categoria'); 

    document.getElementById('nueva-cat-nombre').value = srv.nombre;
    document.getElementById('nueva-cat-tipo').value = srv.tipo || 'Cuenta';
    
    document.getElementById('nueva-cat-favorito').checked = (srv.favorito === 'Si' || srv.favorito === 'X');
    document.getElementById('nueva-cat-completa').checked = (srv.cuenta_completa === 'Si' || srv.cuenta_completa === 'sí');
    document.getElementById('nueva-cat-oculto').checked = (srv.oculto === 'Si' || srv.oculto === 'sí');

    document.getElementById('nueva-cat-descripcion').value = srv.descripcion || '';
    document.getElementById('nueva-cat-precio').value = srv.precio;
    document.getElementById('nueva-cat-precio-ant').value = srv.precio_anterior || '';
    document.getElementById('nueva-cat-min').value = srv.minimo_compra || 0;
    document.getElementById('nueva-cat-max').value = srv.maximo_compra || 0;
    
    document.getElementById('nueva-cat-img-file').value = ''; 
    document.getElementById('nueva-cat-img-actual').value = srv.imagen || '';
    document.getElementById('galeria-servidor-container').style.display = 'none';

    
    const container = document.getElementById('preview-img-container');
    if (srv.imagen && srv.imagen.trim() !== '') {
        container.innerHTML = `<img src="${convertirAThumbnail(srv.imagen)}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
        container.innerHTML = `<i class="material-icons-round" style="color: var(--text-muted);">image</i>`;
    }

    document.getElementById('titulo-modal-categoria').innerHTML = `<i class="material-icons-round" style="vertical-align: middle;">edit</i> Editar Categoría #${srv.id}`;
    document.getElementById('btn-guardar-categoria').innerHTML = `Actualizar Categoría`;

   
    cargarUsuariosParaPrecios(srv.precios_especiales || '');
}

function resetFormularioCategoria() {
    categoriaEditandoID = null;
    document.getElementById('form-crear-categoria')?.reset();
    document.getElementById('nueva-cat-img-actual').value = '';
    document.getElementById('nueva-cat-descripcion').value = '';
    document.getElementById('preview-img-container').innerHTML = `<i class="material-icons-round" style="color: var(--text-muted);">image</i>`;
    document.getElementById('galeria-servidor-container').style.display = 'none';
    
    document.getElementById('titulo-modal-categoria').innerHTML = `<i class="material-icons-round" style="vertical-align: middle;">add_circle</i> Agregar Nueva Categoría`;
    document.getElementById('btn-guardar-categoria').innerHTML = `Guardar Categoría`;
}

function initEventosCategorias() {
    
    document.getElementById('buscar-categoria')?.addEventListener('input', () => { catPaginaActual = 1; renderizarTablaCategorias(); });
    document.getElementById('filtro-tipo-cat')?.addEventListener('change', () => { catPaginaActual = 1; renderizarTablaCategorias(); });
    
    document.getElementById('filtro-limite-cat')?.addEventListener('change', (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 1) { val = 10; e.target.value = val; }
        catLimitePagina = val;
        catPaginaActual = 1; 
        renderizarTablaCategorias();
    });

    const tbodyCat = document.getElementById('tabla-categorias-body');
    if (tbodyCat) {
        tbodyCat.addEventListener('click', async (e) => {
            const btnEditar = e.target.closest('.btn-editar-cat');
            if (btnEditar) {
                e.preventDefault();
            
                prepararEdicionCategoria(btnEditar.dataset.obj);
            }

            const btnBorrar = e.target.closest('.btn-borrar-cat');
            if (btnBorrar) {
                e.preventDefault();
                if(!confirm("¿Enviar a la papelera? (Los inventarios vendidos no se afectan)")) return;
                
                try {
                    const response = await fetch(API_ADMIN_MODULE_CAT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion: 'moverAPapelera', tabla: 'servicios', id: btnBorrar.dataset.id, usuario: sessionStorage.getItem('admin_user'), token: sessionStorage.getItem('admin_token') }) });
                    const res = await response.json();
                    mostrarToast(res.msg, res.success ? 'success' : 'error'); 
                    if(res.success) cargarCategoriasUltraRapido();
                } catch(err) {}
            }
        });
    }


    document.addEventListener('submit', async (e) => {
        if (e.target && e.target.id === 'form-crear-categoria') {
            e.preventDefault();
            
            let arrayPrecios = [];
            document.querySelectorAll('.user-price-item').forEach(row => {
                const chk = row.querySelector('.chk-user-esp');
                const inp = row.querySelector('.input-precio-esp');
                if(chk && chk.checked && inp && inp.value.trim() !== '') {
                    arrayPrecios.push(`${chk.value}:${inp.value.trim()}`);
                }
            });
            const stringPreciosEsp = arrayPrecios.join(', ');

            const btn = document.getElementById('btn-guardar-categoria');
            btn.innerHTML = '<i class="material-icons-round" style="animation: spin 1s linear infinite; vertical-align: middle;">autorenew</i> Procesando...';
            btn.disabled = true;

            try {
                const fileInput = document.getElementById('nueva-cat-img-file');
                let urlDrive = "";


                if (fileInput && fileInput.files.length > 0) {
                    btn.innerHTML = '<i class="material-icons-round" style="animation: spin 1s linear infinite; vertical-align: middle;">cloud_upload</i> Subiendo imagen a Drive...';
                    urlDrive = await subirImagenADrive(fileInput.files[0]);
                }


                const formData = new FormData();
                formData.append('accion', categoriaEditandoID ? 'editarServicio' : 'crearServicio');
                if (categoriaEditandoID) formData.append('id', categoriaEditandoID);
                
                formData.append('nombre', document.getElementById('nueva-cat-nombre').value.trim());
                formData.append('descripcion', document.getElementById('nueva-cat-descripcion').value.trim());
                formData.append('tipo', document.getElementById('nueva-cat-tipo').value);
                

                formData.append('favorito', document.getElementById('nueva-cat-favorito').checked ? 'Si' : 'no');
                formData.append('cuenta_completa', document.getElementById('nueva-cat-completa').checked ? 'Si' : 'No');
                formData.append('oculto', document.getElementById('nueva-cat-oculto').checked ? 'Si' : 'No');

                formData.append('precio', document.getElementById('nueva-cat-precio').value);
                formData.append('precio_anterior', document.getElementById('nueva-cat-precio-ant').value || 0);
                formData.append('precios_especiales', stringPreciosEsp);
                formData.append('minimo_compra', parseInt(document.getElementById('nueva-cat-min').value) || 0);
                formData.append('maximo_compra', parseInt(document.getElementById('nueva-cat-max').value) || 0);
                
                if (urlDrive !== "") {
                    formData.append('imagen_url', urlDrive);
                } else {
                    formData.append('imagen_actual', document.getElementById('nueva-cat-img-actual').value);
                }

                btn.innerHTML = '<i class="material-icons-round" style="animation: spin 1s linear infinite; vertical-align: middle;">save</i> Guardando en BD...';

                const res = await peticionCategoriasUploadAPI(formData);

                if (res.success) { 
                    mostrarToast(res.msg, 'success');
                    resetFormularioCategoria(); 
                    cerrarModal('modal-crear-categoria'); 
                    cargarCategoriasUltraRapido(); 
                } else {
                    mostrarToast(res.msg, 'error');
                }
            } catch(error) {
                mostrarToast("Error en el proceso (Revisa la consola)", 'error');
                console.error(error);
            } finally {
                btn.innerHTML = 'Guardar Categoría';
                btn.disabled = false;
            }
        }
    });

    document.getElementById('btn-bulk-cat')?.addEventListener('click', async () => {
        const seleccionados = Array.from(document.querySelectorAll('.chk-item-cat:checked')).map(c => c.value);
        if(seleccionados.length === 0) return;
        
        if(!confirm(`¿Enviar ${seleccionados.length} categorías a la papelera?`)) return;
        
        const btn = document.getElementById('btn-bulk-cat');
        btn.innerHTML = '<i class="material-icons-round" style="font-size: 1.2rem; vertical-align: middle; animation: spin 1s linear infinite;">autorenew</i> <span>Borrando...</span>';
        
        try {
            const response = await fetch(API_ADMIN_MODULE_CAT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion: 'moverAPapeleraMasivo', tabla: 'servicios', ids: seleccionados, usuario: sessionStorage.getItem('admin_user'), token: sessionStorage.getItem('admin_token') }) });
            const res = await response.json();
            mostrarToast(res.msg, res.success ? 'success' : 'error'); 
            if(res.success) {
                btn.style.display = 'none';
                cargarCategoriasUltraRapido();
            } else {
                btn.innerHTML = '<i class="material-icons-round" style="font-size: 1.2rem; vertical-align: middle;">delete_sweep</i> <span>Borrar Selección</span>';
            }
        } catch(e) {
            btn.innerHTML = '<i class="material-icons-round" style="font-size: 1.2rem; vertical-align: middle;">delete_sweep</i> <span>Borrar Selección</span>';
        }
    });
}

window.toggleAllChkCat = function(allId, itemClass, btnId) {
    const checked = document.getElementById(allId).checked;
    document.querySelectorAll('.' + itemClass).forEach(chk => chk.checked = checked);
    const btn = document.getElementById(btnId);
    if(btn) {
        if(checked && document.querySelectorAll('.' + itemClass).length > 0) {
            btn.style.display = 'inline-block';
            btn.innerHTML = `<i class="material-icons-round" style="font-size: 1.2rem; vertical-align: middle;">delete_sweep</i> <span>Borrar Selección</span>`;
        } else {
            btn.style.display = 'none';
        }
    }
}

window.checkIndividualCat = function(itemClass, btnId, allId) {
    const total = document.querySelectorAll('.' + itemClass).length;
    const checked = document.querySelectorAll('.' + itemClass + ':checked').length;
    const allChk = document.getElementById(allId);
    if(allChk) allChk.checked = (total === checked && total > 0);
    const btn = document.getElementById(btnId);
    if(btn) {
        if(checked > 0) {
            btn.style.display = 'inline-block';
            btn.innerHTML = `<i class="material-icons-round" style="font-size: 1.2rem; vertical-align: middle;">delete_sweep</i> <span>Borrar Selección</span>`;
        } else {
            btn.style.display = 'none';
        }
    }
}

window.inicializarIconosOrdenCat = function() {
    document.querySelectorAll('#mod-productos-servicios table thead th').forEach(th => {
        if (th.id !== 'th-chk-cat' && !th.innerText.includes('Acciones') && !th.innerText.includes('Fav')) {
            th.style.cursor = 'pointer';
            if (!th.querySelector('.sort-icon-cat')) {
                th.innerHTML += ` <span class="sort-icon-cat" style="color:var(--text-muted); font-size:0.8rem; margin-left:5px; transition: 0.2s;">↕</span>`;
            }
        }
    });
};

document.addEventListener('click', function(e) {
    let th = e.target.closest('th');
    if (!th || (!th.id && !th.innerText)) return;
    if (th.id === 'th-chk-cat' || th.innerText.trim().includes('Acciones') || th.innerText.trim().includes('Fav')) return;
    
    const table = th.closest('table');
    if(!table || table.id !== 'tabla-categorias') return;

    const colIndex = Array.from(th.parentNode.children).indexOf(th);
    const order = th.dataset.order === 'desc' ? 'asc' : 'desc';
    
    table.querySelectorAll('.sort-icon-cat').forEach(icon => {
        icon.innerHTML = '↕';
        icon.style.color = 'var(--text-muted)';
        icon.closest('th').dataset.order = '';
    });

    th.dataset.order = order;
    const activeIcon = th.querySelector('.sort-icon-cat');
    if (activeIcon) {
        activeIcon.innerHTML = order === 'asc' ? '▲' : '▼';
        activeIcon.style.color = 'var(--accent)'; 
    }

    catDatosGlobales.sort((a, b) => {
        let valA, valB;
        if(colIndex === 2) { valA = parseInt(a.id); valB = parseInt(b.id); }
        else if(colIndex === 3) { valA = a.nombre.toLowerCase(); valB = b.nombre.toLowerCase(); }
        else if(colIndex === 4) { valA = a.tipo.toLowerCase(); valB = b.tipo.toLowerCase(); }
        else if(colIndex === 5) { valA = parseFloat(a.precio); valB = parseFloat(b.precio); }
        else if(colIndex === 8) { valA = parseInt(a.stock) || 0; valB = parseInt(b.stock) || 0; } 
        else { valA = a.id; valB = b.id; }

        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
    });

    catPaginaActual = 1;
    renderizarTablaCategorias();
});
