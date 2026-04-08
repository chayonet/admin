/* =================================================================================
   ARCHIVO: papelera.js
   Lógica: Recuperación, Eliminación Definitiva y Selección Múltiple.
================================================================================= */

const PapeleraEngine = {
    moduloActivo: '', // inventario, usuarios, servicios, movimientos
    intentosInyeccion: 0, // Control de intentos para evitar la condición de carrera
    
    // 1. INICIALIZADOR GLOBAL
    inicializar() {
        this.prepararModal();

        // Escuchamos el cambio de módulos para inyectar el botón dinámicamente
        document.addEventListener('moduloCargado', (e) => {
            const modulo = e.detail.modulo;
            this.intentosInyeccion = 0; // Reiniciamos el contador por cada cambio de pestaña
            
            // MEJORA: Un ligero retraso en el Event Loop para garantizar que el DOM ya existe
            setTimeout(() => {
                if (modulo === 'mod-productos-todos') this.inyectarBoton(modulo, 'inventario');
                if (modulo === 'mod-usuarios-editar' || modulo === 'mod-usuarios-crear') this.inyectarBoton(modulo, 'usuarios');
                if (modulo === 'mod-productos-servicios') this.inyectarBoton(modulo, 'servicios');
                
                // NUEVO: Agregamos el módulo de movimientos financieros
                if (modulo === 'mod-analisis-ganancias') this.inyectarBoton(modulo, 'movimientos');
            }, 50); 
        });
    },

    // 2. INYECTAR BOTÓN EN LA INTERFAZ
    inyectarBoton(containerId, tablaBase) {
        const seccion = document.getElementById(containerId);
        if(!seccion) return;

        // MEJORA: Hacemos la búsqueda del contenedor más inteligente
        // Busca un ID específico (si existe) o el div con display flex en la cabecera
        let contenedorBotones = seccion.querySelector('#contenedor-acciones-movimientos') || seccion.querySelector('div > div[style*="display: flex"]');
        
        // Sistema de Polling. Si el contenedor no está listo, reintenta hasta 5 veces (evita el lag de primer clic)
        if(!contenedorBotones) {
            if(this.intentosInyeccion < 5) {
                this.intentosInyeccion++;
                setTimeout(() => this.inyectarBoton(containerId, tablaBase), 100);
            }
            return;
        }

        // Evitar duplicados
        if(contenedorBotones.querySelector('.btn-papelera-global')) return;

        const btn = document.createElement('button');
        btn.className = 'btn-papelera-global';
        // Estilo especial para que destaque sutilmente
        btn.style.background = 'var(--bg-dark)';
        btn.style.color = '#8b5cf6'; // Morado premium
        btn.style.border = '1px solid #8b5cf6';
        btn.style.width = 'auto';
        btn.innerHTML = `<i class="material-icons-round" style="font-size: 1.2rem; vertical-align: middle;">delete_sweep</i> <span class="hide-mobile">Papelera</span>`;
        
        btn.onmouseenter = () => { btn.style.background = '#8b5cf6'; btn.style.color = '#fff'; };
        btn.onmouseleave = () => { btn.style.background = 'var(--bg-dark)'; btn.style.color = '#8b5cf6'; };
        
        btn.onclick = () => this.abrirPapelera(tablaBase);
        
        contenedorBotones.appendChild(btn);
    },

    // 3. CREAR EL MODAL NATIVO (Se inyecta una sola vez)
    prepararModal() {
        if (document.getElementById('modal-papelera-global')) return;

        const modalHtml = `
            <div class="modal-overlay" id="modal-papelera-global" style="display: none; z-index: 10000;">
                <div class="modal-content" style="padding: 30px; position: relative; max-width: 800px; width: 90%; max-height: 90vh; display: flex; flex-direction: column;">
                    <button class="btn-close-modal" onclick="cerrarModal('modal-papelera-global')" style="position: absolute; right: 20px; top: 20px; background: transparent; color: var(--text-muted); border: none; font-size: 1.2rem; cursor: pointer;"><i class="material-icons-round">close</i></button>
                    
                    <h3 id="titulo-papelera" style="color: #8b5cf6; margin-bottom: 20px; font-family: 'Righteous', cursive; letter-spacing: 1px; text-transform: uppercase;">
                        <i class="material-icons-round" style="vertical-align: middle;">delete_sweep</i> PAPELERA
                    </h3>

                    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                        <button id="btn-papelera-restaurar-masivo" style="display: none; background: var(--success-bg); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.3); padding: 8px 15px; font-size: 0.8rem; box-shadow: none;">
                            <i class="material-icons-round" style="font-size: 1rem; vertical-align: middle;">restore</i> Restaurar Selección
                        </button>
                        <button id="btn-papelera-purgar-masivo" style="display: none; background: var(--danger-bg); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.3); padding: 8px 15px; font-size: 0.8rem; box-shadow: none;">
                            <i class="material-icons-round" style="font-size: 1rem; vertical-align: middle;">delete_forever</i> Purgar Selección
                        </button>
                    </div>

                    <div style="overflow-x: auto; flex: 1;">
                        <table style="width: 100%; border-collapse: separate; border-spacing: 0; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px;">
                            <thead style="position: sticky; top: 0; background: var(--bg-dark); z-index: 10;">
                                <tr>
                                    <th style="padding: 12px; border-bottom: 1px solid var(--border-color); width: 40px; text-align: center;">
                                        <input type="checkbox" id="chk-all-papelera" onchange="PapeleraEngine.toggleAll()">
                                    </th>
                                    <th style="padding: 12px; border-bottom: 1px solid var(--border-color); color: var(--text-gray); font-size: 0.8rem;">ID</th>
                                    <th style="padding: 12px; border-bottom: 1px solid var(--border-color); color: var(--text-gray); font-size: 0.8rem;">DATOS ELIMINADOS</th>
                                    <th style="padding: 12px; border-bottom: 1px solid var(--border-color); color: var(--text-gray); font-size: 0.8rem; text-align: right;">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody id="lista-papelera-body">
                                </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Eventos Masivos
        document.getElementById('btn-papelera-restaurar-masivo').addEventListener('click', () => this.procesarMasivo('restaurar'));
        document.getElementById('btn-papelera-purgar-masivo').addEventListener('click', () => this.procesarMasivo('purgar'));
    },

    // 4. ABRIR Y CARGAR DATOS
    async abrirPapelera(tablaBase) {
        this.moduloActivo = tablaBase;
        document.getElementById('titulo-papelera').innerHTML = `<i class="material-icons-round" style="vertical-align: middle;">delete_sweep</i> PAPELERA: ${tablaBase.toUpperCase()}`;
        
        abrirModal('modal-papelera-global');
        await this.cargarDatos();
    },

    async cargarDatos() {
        const tbody = document.getElementById('lista-papelera-body');
        if(!tbody) return;
        
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 40px;"><i class="material-icons-round" style="animation: spin 1s linear infinite; color: #8b5cf6; font-size: 2rem;">autorenew</i></td></tr>`;
        
        // Esconder botones masivos
        this.actualizarBotonesMasivos();

        const usuario = sessionStorage.getItem('admin_user');
        const token = sessionStorage.getItem('admin_token');

        try {
            const response = await fetch(`${API_BASE_URL_F}/admin_api.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accion: 'getRegistrosPapelera', tabla: this.moduloActivo, usuario, token })
            });
            const res = await response.json();

            if (res.success && res.datos.length > 0) {
                tbody.innerHTML = '';
                
                res.datos.forEach((item) => {
                    let identificador = '';
                    if (this.moduloActivo === 'inventario') {
                        identificador = `<strong style="color: var(--accent);">${item.servicio_nombre}</strong><br><span style="color: var(--text-muted); font-family: monospace; font-size: 0.8rem;">${item.cuenta}</span>`;
                    } else if (this.moduloActivo === 'usuarios') {
                        identificador = `<strong style="color: var(--success);"><i class="material-icons-round" style="font-size: 1rem; vertical-align: middle;">person</i> ${item.usuario}</strong><br><span style="color: var(--text-muted); font-size: 0.8rem;">${item.correo || 'Sin correo'}</span>`;
                    } else if (this.moduloActivo === 'servicios') {
                        identificador = `<strong style="color: #8b5cf6;"><i class="material-icons-round" style="font-size: 1rem; vertical-align: middle;">category</i> ${item.nombre}</strong>`;
                    } 
                    // NUEVO: Formateo especial para los Movimientos Financieros
                    else if (this.moduloActivo === 'movimientos') {
                        const fmtMoneda = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
                        const monto = parseFloat(item.movimiento) || 0;
                        const montoColor = monto > 0 ? 'var(--success)' : 'var(--danger)';
                        
                        identificador = `
                            <strong style="color: var(--accent);">${item.motivo}</strong><br>
                            <span style="color: var(--text-muted); font-size: 0.8rem;">
                                Pedido: ${item.order_id || 'N/A'} | Usuario: <strong>${item.usuario}</strong> | 
                                <span style="color: ${montoColor}; font-weight: bold;">${fmtMoneda.format(monto)}</span>
                            </span>
                        `;
                    } else {
                        identificador = '<span style="color: var(--text-muted);">Sin detalles</span>';
                    }

                    const tr = document.createElement('tr');
                    tr.style.background = "var(--bg-card)";
                    tr.innerHTML = `
                        <td style="text-align: center; border-bottom: 1px solid var(--border-light); padding: 12px;">
                            <input type="checkbox" class="chk-item-papelera" value="${item.id}" onchange="PapeleraEngine.checkIndividual()">
                        </td>
                        <td style="border-bottom: 1px solid var(--border-light); padding: 12px; color: var(--text-gray); font-family: monospace;">#${item.id}</td>
                        <td style="border-bottom: 1px solid var(--border-light); padding: 12px;">${identificador}</td>
                        <td style="border-bottom: 1px solid var(--border-light); padding: 12px; text-align: right; white-space: nowrap;">
                            <button onclick="PapeleraEngine.restaurar(${item.id})" style="background: var(--success-bg); color: var(--success); border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; box-shadow: none; margin-right: 5px;" title="Restaurar">
                                <i class="material-icons-round" style="font-size: 1.1rem; vertical-align: middle;">restore</i>
                            </button>
                            <button onclick="PapeleraEngine.eliminarDefinitivo(${item.id})" style="background: var(--danger-bg); color: var(--danger); border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; box-shadow: none;" title="Eliminar Permanentemente">
                                <i class="material-icons-round" style="font-size: 1.1rem; vertical-align: middle;">delete_forever</i>
                            </button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center; padding: 60px 20px;">
                        <i class="material-icons-round" style="font-size: 4rem; color: var(--border-color); margin-bottom: 15px;">delete_outline</i>
                        <h3 style="color: var(--text-gray); margin: 0;">Papelera Vacía</h3>
                    </td>
                </tr>`;
            }
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px; color: var(--danger);">Error al cargar.</td></tr>`;
        }
    },

    // 5. ACCIONES INDIVIDUALES
    async restaurar(id) {
        const usuario = sessionStorage.getItem('admin_user');
        const token = sessionStorage.getItem('admin_token');
        const res = await fetch(`${API_BASE_URL_F}/admin_api.php`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accion: 'restaurarRegistro', tabla: this.moduloActivo, id: id, usuario, token })
        }).then(r => r.json());

        if(res.success) {
            mostrarToast(res.msg, 'success');
            this.cargarDatos(); 
            this.refrescarTablaOriginal(); 
        } else {
            mostrarToast(res.msg, 'error');
        }
    },

    async eliminarDefinitivo(id) {
        if(!confirm("¿BORRADO ABSOLUTO?\nEsta acción NO se puede deshacer. El registro será destruido permanentemente.")) return;

        const usuario = sessionStorage.getItem('admin_user');
        const token = sessionStorage.getItem('admin_token');
        const res = await fetch(`${API_BASE_URL_F}/admin_api.php`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accion: 'eliminarPermanente', tabla: this.moduloActivo, id: id, usuario, token })
        }).then(r => r.json());
        
        if(res.success) {
            mostrarToast(res.msg, 'success');
            this.cargarDatos(); 
        } else {
            mostrarToast(res.msg, 'error');
        }
    },

    // 6. LÓGICA MASIVA (CHECKBOXES)
    toggleAll() {
        const checked = document.getElementById('chk-all-papelera').checked;
        document.querySelectorAll('.chk-item-papelera').forEach(chk => chk.checked = checked);
        this.actualizarBotonesMasivos();
    },

    checkIndividual() {
        const total = document.querySelectorAll('.chk-item-papelera').length;
        const checked = document.querySelectorAll('.chk-item-papelera:checked').length;
        document.getElementById('chk-all-papelera').checked = (total === checked && total > 0);
        this.actualizarBotonesMasivos();
    },

    actualizarBotonesMasivos() {
        const checked = document.querySelectorAll('.chk-item-papelera:checked').length;
        const btnRestaurar = document.getElementById('btn-papelera-restaurar-masivo');
        const btnPurgar = document.getElementById('btn-papelera-purgar-masivo');
        
        if(checked > 0) {
            btnRestaurar.style.display = 'inline-flex';
            btnPurgar.style.display = 'inline-flex';
        } else {
            btnRestaurar.style.display = 'none';
            btnPurgar.style.display = 'none';
        }
    },

    async procesarMasivo(tipoAccion) {
        const seleccionados = Array.from(document.querySelectorAll('.chk-item-papelera:checked')).map(c => c.value);
        if(seleccionados.length === 0) return;

        let txtConfirmacion = tipoAccion === 'restaurar' 
            ? `¿Restaurar ${seleccionados.length} registros?` 
            : `¿Destruir PERMANENTEMENTE ${seleccionados.length} registros?`;

        if(!confirm(txtConfirmacion)) return;

        const usuario = sessionStorage.getItem('admin_user');
        const token = sessionStorage.getItem('admin_token');
        const accionAPI = tipoAccion === 'restaurar' ? 'restaurarRegistro' : 'eliminarPermanente';

        // Procesamiento en paralelo para máxima velocidad sin alterar el PHP
        const promesas = seleccionados.map(id => 
            fetch(`${API_BASE_URL_F}/admin_api.php`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accion: accionAPI, tabla: this.moduloActivo, id: id, usuario, token })
            }).then(r => r.json())
        );

        await Promise.all(promesas);

        mostrarToast(`Se han ${tipoAccion === 'restaurar' ? 'restaurado' : 'purgado'} los registros seleccionados.`, 'success');
        this.cargarDatos();
        if(tipoAccion === 'restaurar') this.refrescarTablaOriginal();
    },

    // 7. AUXILIAR: RECARGAR LAS TABLAS DEL FONDO
    refrescarTablaOriginal() {
        if(this.moduloActivo === 'inventario' && typeof cargarProductos === 'function') cargarProductos();
        if(this.moduloActivo === 'usuarios' && typeof cargarUsuarios === 'function') cargarUsuarios();
        if(this.moduloActivo === 'servicios' && typeof cargarCategorias === 'function') cargarCategorias();
        
        // NUEVO: Refrescar la tabla de movimientos en el fondo
        if(this.moduloActivo === 'movimientos' && typeof cargarMovimientosBase === 'function') cargarMovimientosBase();
    }
};

// Auto-inicializar la inyección de la papelera
PapeleraEngine.inicializar();
