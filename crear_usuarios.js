const API_ADMIN_CREAR_USER = `${API_BASE_URL_F}/admin_api.php`;

// Escuchador de navegación
document.addEventListener('moduloCargado', (e) => {
    if (e.detail.modulo === 'mod-usuarios-crear') {
        window.abrirModalCreacionUsuario();
    }
});

// Función global para abrir el modal
window.abrirModalCreacionUsuario = function() {
    crearDOMModalCrearUsuario();
    
    const modal = document.getElementById('modal-crear-usuario');
    modal.style.display = 'flex';
    
    const form = document.getElementById('form-crear-usuario');
    if (form) form.reset();
    
    const seccionPermisos = document.getElementById('seccion-permisos');
    if (seccionPermisos) seccionPermisos.style.display = 'none';
};

// Creación dinámica del DOM (MODAL REDISEÑADO)
function crearDOMModalCrearUsuario() {
    if (document.getElementById('modal-crear-usuario')) return;

    const modal = document.createElement('div');
    modal.id = 'modal-crear-usuario';
    modal.className = 'modal-overlay';
    // Estilos del Overlay: Sin desenfoque, fondo sólido oscuro profesional
    Object.assign(modal.style, {
        display: 'none',
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: 'rgba(10, 15, 25, 0.9)', // Fondo sólido oscuro
        zIndex: '9995',
        alignItems: 'center',
        justifyContent: 'center'
    });

    modal.innerHTML = `
        <div class="modal-content" style="
            background: #1e293b; 
            color: #f8fafc;
            padding: 0; 
            position: relative; 
            max-width: 650px; 
            width: 95%; 
            max-height: 85vh; 
            overflow: hidden; 
            border-radius: 20px; 
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
            display: flex;
            flex-direction: column;
            border: 1px solid #334155;
        ">
            <div style="padding: 25px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; background: #1e293b;">
                <h2 style="margin:0; font-size: 1.4rem; display:flex; align-items:center; gap:12px; font-family: 'Poppins', sans-serif; font-weight: 600;">
                    <i class="material-icons-round" style="color: #38bdf8; font-size: 28px;">person_add</i> 
                    Registrar Usuario
                </h2>
                <button type="button" onclick="document.getElementById('modal-crear-usuario').style.display='none'" style="background: #334155; color: #94a3b8; border: none; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items:center; justify-content: center; transition: 0.3s;">
                    <i class="material-icons-round" style="font-size: 20px;">close</i>
                </button>
            </div>

            <div style="padding: 25px; overflow-y: auto; flex: 1; background: #0f172a;">
                <form id="form-crear-usuario">
                    
                    <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 20px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Información de Cuenta</p>
                    
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                        <div style="grid-column: span 1;">
                            <label style="display:block; font-size: 0.75rem; color: #38bdf8; margin-bottom: 8px; font-weight: 600;">USUARIO</label>
                            <input type="text" id="nuevo-user-login" placeholder="Ex: amartinez" required style="width:100%; padding: 12px; background: #1e293b; border: 1px solid #334155; color: #fff; border-radius: 10px; outline:none; transition: border 0.3s;">
                        </div>
                        <div style="grid-column: span 1;">
                            <label style="display:block; font-size: 0.75rem; color: #38bdf8; margin-bottom: 8px; font-weight: 600;">CONTRASEÑA</label>
                            <input type="password" id="nuevo-user-clave" placeholder="••••••••" required style="width:100%; padding: 12px; background: #1e293b; border: 1px solid #334155; color: #fff; border-radius: 10px; outline:none;">
                        </div>
                        <div style="grid-column: span 2;">
                            <label style="display:block; font-size: 0.75rem; color: #38bdf8; margin-bottom: 8px; font-weight: 600;">ROL DE ACCESO</label>
                            <select id="nuevo-user-rol" required style="width:100%; padding: 12px; background: #1e293b; border: 1px solid #334155; color: #fff; border-radius: 10px; outline:none; cursor: pointer;">
                                <option value="Cliente" selected>Cliente (Acceso estándar)</option>
                                <option value="Trabajador">Trabajador (Acceso restringido)</option>
                                <option value="Admin">Administrador (Acceso total)</option>
                            </select>
                        </div>
                    </div>

                    <p style="color: #94a3b8; font-size: 0.85rem; margin-top: 30px; margin-bottom: 20px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Detalles Personales</p>
                    
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                        <div>
                            <label style="display:block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px;">NOMBRE</label>
                            <input type="text" id="nuevo-user-nombre" style="width:100%; padding: 12px; background: #1e293b; border: 1px solid #334155; color: #fff; border-radius: 10px; outline:none;">
                        </div>
                        <div>
                            <label style="display:block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px;">APELLIDO</label>
                            <input type="text" id="nuevo-user-apellido" style="width:100%; padding: 12px; background: #1e293b; border: 1px solid #334155; color: #fff; border-radius: 10px; outline:none;">
                        </div>
                        <div>
                            <label style="display:block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px;">EMAIL</label>
                            <input type="email" id="nuevo-user-correo" placeholder="correo@ejemplo.com" style="width:100%; padding: 12px; background: #1e293b; border: 1px solid #334155; color: #fff; border-radius: 10px; outline:none;">
                        </div>
                        <div>
                            <label style="display:block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px;">TELÉFONO</label>
                            <input type="text" id="nuevo-user-telefono" placeholder="+57 ..." style="width:100%; padding: 12px; background: #1e293b; border: 1px solid #334155; color: #fff; border-radius: 10px; outline:none;">
                        </div>
                    </div>

                    <div id="seccion-permisos" style="display: none; margin-top: 25px; background: #1e293b; padding: 20px; border-radius: 15px; border: 1px solid #38bdf855;">
                        <h4 style="margin-top:0; margin-bottom: 15px; color: #38bdf8; display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                            <i class="material-icons-round">vpn_key</i> Permisos del Trabajador
                        </h4>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;" id="contenedor-checkbox-permisos">
                            <label class="permiso-item"><input type="checkbox" class="chk-permiso" value="mod-productos-todos"> Productos</label>
                            <label class="permiso-item"><input type="checkbox" class="chk-permiso" value="mod-productos-servicios"> Categorías</label>
                            <label class="permiso-item"><input type="checkbox" class="chk-permiso" value="mod-analisis-resumen"> Análisis</label>
                            <label class="permiso-item"><input type="checkbox" class="chk-permiso" value="mod-usuarios-crear"> Crear Usuarios</label>
                            <label class="permiso-item"><input type="checkbox" class="chk-permiso" value="mod-usuarios-recargas"> Recargas</label>
                            <label class="permiso-item"><input type="checkbox" class="chk-permiso" value="mod-tickets-pendientes"> Tickets</label>
                        </div>
                        
                        <button type="button" id="btn-marcar-todos-permisos" style="margin-top: 15px; background: transparent; color: #38bdf8; border: 1px solid #38bdf8; padding: 5px 10px; font-size: 0.7rem; border-radius: 6px; cursor: pointer;">Seleccionar Todos</button>
                    </div>
                </form>
            </div>

            <div style="padding: 20px 25px; border-top: 1px solid #334155; display: flex; gap: 15px; background: #1e293b;">
                <button type="button" id="btn-limpiar-form-usuario" style="padding: 12px 20px; background: transparent; color: #94a3b8; border: 1px solid #334155; border-radius: 10px; font-weight: 600; cursor: pointer; flex: 1;">Limpiar</button>
                <button type="submit" form="form-crear-usuario" id="btn-guardar-usuario" style="padding: 12px 20px; background: #38bdf8; color: #0f172a; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; flex: 2; display: flex; justify-content: center; align-items: center; gap: 8px; transition: 0.3s;">
                    <i class="material-icons-round">save</i> Guardar Usuario
                </button>
            </div>
        </div>

        <style>
            .permiso-item {
                display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: #cbd5e1; cursor: pointer;
            }
            .permiso-item input {
                accent-color: #38bdf8; width: 16px; height: 16px;
            }
            #btn-guardar-usuario:hover { background: #7dd3fc; transform: translateY(-2px); }
            #nuevo-user-login:focus { border-color: #38bdf8 !important; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        </style>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    initEventosCrearUsuario();
}

// Lógica de interfaz y eventos (Sin cambios en la lógica funcional, solo integración)
function initEventosCrearUsuario() {
    const form = document.getElementById('form-crear-usuario');
    const selectRol = document.getElementById('nuevo-user-rol');
    const seccionPermisos = document.getElementById('seccion-permisos');
    const checkboxesPermisos = document.querySelectorAll('.chk-permiso');
    const btnMarcarTodos = document.getElementById('btn-marcar-todos-permisos');

    selectRol.addEventListener('change', (e) => {
        if (e.target.value === 'Trabajador') {
            seccionPermisos.style.display = 'block';
            seccionPermisos.style.animation = 'fadeIn 0.3s ease';
        } else {
            seccionPermisos.style.display = 'none';
            checkboxesPermisos.forEach(chk => chk.checked = false);
        }
    });

    btnMarcarTodos.addEventListener('click', () => {
        const estanTodosMarcados = Array.from(checkboxesPermisos).every(chk => chk.checked);
        checkboxesPermisos.forEach(chk => chk.checked = !estanTodosMarcados);
        btnMarcarTodos.innerText = estanTodosMarcados ? 'Seleccionar Todos' : 'Desmarcar Todos';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnGuardar = document.getElementById('btn-guardar-usuario');
        const originalHtml = btnGuardar.innerHTML;
        
        btnGuardar.innerHTML = '<i class="material-icons-round" style="animation: spin 1s linear infinite;">autorenew</i> Procesando...';
        btnGuardar.disabled = true;

        let arregloPermisos = [];
        if (selectRol.value === 'Trabajador') {
            checkboxesPermisos.forEach(chk => { if (chk.checked) arregloPermisos.push(chk.value); });
            if (arregloPermisos.length === 0) {
                alert("Selecciona al menos un permiso."); // Reemplazar con mostrarToast si existe
                btnGuardar.innerHTML = originalHtml;
                btnGuardar.disabled = false;
                return;
            }
        } else if (selectRol.value === 'Admin') {
            arregloPermisos = ['all'];
        }

        const payload = {
            accion: 'crearUsuario',
            usuario: sessionStorage.getItem('admin_user'),
            token: sessionStorage.getItem('admin_token'),
            nuevo_usuario: document.getElementById('nuevo-user-login').value.trim(),
            clave: document.getElementById('nuevo-user-clave').value.trim(),
            rol: selectRol.value,
            nombre: document.getElementById('nuevo-user-nombre').value.trim() || null,
            apellido: document.getElementById('nuevo-user-apellido').value.trim() || null,
            correo: document.getElementById('nuevo-user-correo').value.trim() || null,
            telefono: document.getElementById('nuevo-user-telefono').value.trim() || null,
            permisos: JSON.stringify(arregloPermisos)
        };

        try {
            const response = await fetch(API_ADMIN_CREAR_USER, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const res = await response.json();

            if (res.success) {
                if(window.mostrarToast) mostrarToast("Usuario creado con éxito", "success");
                document.getElementById('modal-crear-usuario').style.display = 'none';
                if (typeof window.cargarUsuarios === 'function') window.cargarUsuarios();
            } else {
                alert("Error: " + res.msg);
            }
        } catch (error) {
            console.error(error);
        } finally {
            btnGuardar.innerHTML = originalHtml;
            btnGuardar.disabled = false;
        }
    });
}
