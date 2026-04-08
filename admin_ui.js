// =========================================================
// ARCHIVO: admin_ui.js
// Lógica de Interfaz de Usuario (UI) para el Panel Admin
// (ACTUALIZADO: INTERRUPTOR DE TEMA Y NAVEGACIÓN MEJORADA)
// =========================================================

document.addEventListener('DOMContentLoaded', () => {

    // -----------------------------------------------------
    // 1. RELOJ DIGITAL (AM/PM)
    // -----------------------------------------------------
    function updateClock() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        // Lógica AM/PM
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // La hora '0' debe ser '12'
        
        const strTime = `${hours}:${minutes}:${seconds} ${ampm}`;
        
        const clockElement = document.getElementById('digital-clock');
        if(clockElement) {
            clockElement.textContent = strTime;
        }
    }
    // Iniciar el reloj y actualizar cada segundo
    setInterval(updateClock, 1000);
    updateClock();
    
    // -----------------------------------------------------
    // 1.5. SISTEMA DE LOGIN Y SESIÓN PROTEGIDA
    // -----------------------------------------------------
    const loginForm = document.getElementById('login-form');
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');

    // Verificar si ya hay una sesión activa al recargar la página (F5)
    if (sessionStorage.getItem('admin_token')) {
        if(loginSection) loginSection.style.display = 'none';
        if(dashboardSection) dashboardSection.style.display = 'flex';
        const nameDisplay = document.getElementById('admin-name-display');
        if(nameDisplay) nameDisplay.innerText = sessionStorage.getItem('admin_user');
        
        // Aplicar permisos visuales si recarga la página
        aplicarPermisosVisuales();

        // 🔥 MEJORA: Escáner activado al recargar la página (F5)
        if (typeof escanearTicketsPendientes === 'function') {
            escanearTicketsPendientes();
        }

        // 🚀 FIX: Forzar la carga visual de la pestaña INICIO al recargar con F5
        setTimeout(() => {
            const btnInicio = document.querySelector('.nav-btn[data-target="mod-inicio"]');
            if (btnInicio) {
                btnInicio.click();
            } else {
                // Fallback por si el botón no tiene la clase exacta
                const modInicio = document.getElementById('mod-inicio');
                if(modInicio) modInicio.style.display = 'block';
                document.dispatchEvent(new CustomEvent('moduloCargado', { detail: { modulo: 'mod-inicio' } }));
            }
        }, 200);

    } else {
        if(loginSection) loginSection.style.display = 'flex';
        if(dashboardSection) dashboardSection.style.display = 'none';
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = loginForm.querySelector('button');
            const user = document.getElementById('admin-user').value;
            const pass = document.getElementById('admin-pass').value;

            btnSubmit.innerHTML = 'Verificando...';
            btnSubmit.disabled = true;

            try {
                const response = await fetch(`${API_BASE_URL_F}/admin_api.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accion: 'loginAdmin', usuario: user, clave: pass })
                });
                
                const res = await response.json();

                if (res.success) {
                    // Guardar datos de sesión
                    sessionStorage.setItem('admin_token', res.token);
                    sessionStorage.setItem('admin_user', res.usuario);
                    sessionStorage.setItem('admin_rol', res.rol);
                    // Guardamos el JSON de permisos tal cual viene de la BD
                    sessionStorage.setItem('admin_permisos', res.permisos || "[]");

                    document.getElementById('admin-name-display').innerText = res.usuario;
                    mostrarToast(`Bienvenido a ${NOMBRE_NEGOCIO}-ADMIN`, 'success');
                    
                    // Aplicar la aduana visual antes de mostrar el panel
                    aplicarPermisosVisuales();

                    // 🔥 MEJORA: Escáner activado justo al iniciar sesión
                    if (typeof escanearTicketsPendientes === 'function') {
                        escanearTicketsPendientes();
                    }

                    setTimeout(() => {
                        loginSection.style.display = 'none';
                        dashboardSection.style.display = 'flex';
                        // Forzar click en el botón de inicio para cargar los datos
                        const btnInicio = document.querySelector('.nav-btn[data-target="mod-inicio"]');
                        if(btnInicio) btnInicio.click();
                    }, 800);
                } else {
                    mostrarToast(res.msg, 'error');
                }
            } catch (error) {
                mostrarToast("Error de conexión con el servidor.", 'error');
            } finally {
                btnSubmit.innerHTML = 'Ingresar al Panel';
                btnSubmit.disabled = false;
            }
        });
    }

    // -----------------------------------------------------
    // 1.8. ADUANA VISUAL DE PERMISOS
    // -----------------------------------------------------
    function aplicarPermisosVisuales() {
        const rolUsuario = sessionStorage.getItem('admin_rol');
        
        // Si es Admin, no hacemos nada, ve todo por defecto.
        if (rolUsuario === 'Admin') return;

        let permisosPermitidos = [];
        try {
            permisosPermitidos = JSON.parse(sessionStorage.getItem('admin_permisos') || "[]");
        } catch (e) {
            console.error("Error leyendo permisos locales", e);
        }

        // 1. Ocultar SUB-BOTONES (Las opciones específicas)
        const botonesDeModulos = document.querySelectorAll('.submenu .nav-btn[data-target]');
        botonesDeModulos.forEach(boton => {
            const targetModulo = boton.getAttribute('data-target');
            
            // Si el ID del módulo NO está en la lista de permisos del trabajador, ocultamos el botón de la lista (<li>)
            if (!permisosPermitidos.includes(targetModulo)) {
                boton.parentElement.style.display = 'none';
            } else {
                boton.parentElement.style.display = 'block';
            }
        });

        // 2. Ocultar BOTONES PRINCIPALES (Acordeones vacíos)
        const botonesPrincipales = document.querySelectorAll('.nav-btn[data-toggle]');
        botonesPrincipales.forEach(botonPrincipal => {
            const idSubmenu = botonPrincipal.getAttribute('data-toggle'); 
            const ulSubmenu = document.getElementById(idSubmenu);
            
            if (ulSubmenu) {
                const opcionesVisibles = Array.from(ulSubmenu.querySelectorAll('li')).some(li => li.style.display !== 'none');
                if (!opcionesVisibles) {
                    botonPrincipal.parentElement.style.display = 'none';
                } else {
                    botonPrincipal.parentElement.style.display = 'block';
                }
            }
        });
    }

    // -----------------------------------------------------
    // 2. SISTEMA DE NAVEGACIÓN (CAMBIO DE MÓDULOS)
    // -----------------------------------------------------
    const navButtons = document.querySelectorAll('.nav-btn[data-target]');
    const modulos = document.querySelectorAll('.modulo');
    const pageTitle = document.getElementById('page-title');

    navButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // 1. Quitar la clase 'active' de todos los botones de navegación
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            
            // 2. Agregar 'active' al botón clicado
            this.classList.add('active');

            // 3. Ocultar todos los módulos
            modulos.forEach(mod => mod.style.display = 'none');

            // 4. Mostrar el módulo objetivo
            const targetId = this.getAttribute('data-target');
            const targetModulo = document.getElementById(targetId);
            if (targetModulo) {
                targetModulo.style.display = 'block';
                
                // Disparador de eventos global
                const eventoModulo = new CustomEvent('moduloCargado', { detail: { modulo: targetId } });
                document.dispatchEvent(eventoModulo);
            }

            // 5. Actualizar el título de la página
            if(pageTitle && this.getAttribute('data-title')) {
                pageTitle.innerText = this.getAttribute('data-title');
            }

            // 6. Si estamos en móvil, cerrar el menú lateral al elegir una opción
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('mobile-open');
            }
        });
    });

    // -----------------------------------------------------
    // 3. ACORDEÓN DE SUBMENÚS
    // -----------------------------------------------------
    const toggleButtons = document.querySelectorAll('.nav-btn[data-toggle]');
    
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-toggle');
            const submenu = document.getElementById(targetId);
            
            // Si el menú lateral está contraído, forzamos la apertura
            const sidebarEl = document.getElementById('sidebar');
            if(sidebarEl && sidebarEl.classList.contains('collapsed')) {
                sidebarEl.classList.remove('collapsed');
            }

            // Cerrar otros submenús que estén abiertos
            document.querySelectorAll('.submenu').forEach(sub => {
                if (sub.id !== targetId) {
                    sub.classList.remove('open');
                }
            });

            // Alternar la clase 'open' para mostrar/ocultar el actual
            if (submenu) {
                submenu.classList.toggle('open');
            }
        });
    });

    // -----------------------------------------------------
    // 4. MENÚ HAMBURGUESA / COLAPSO LATERAL
    // -----------------------------------------------------
    const sidebar = document.getElementById('sidebar');
    const btnToggleDesktop = document.getElementById('btn-toggle-desktop') || document.getElementById('btn-toggle-menu');

    if (btnToggleDesktop) {
        btnToggleDesktop.addEventListener('click', () => {
            if (window.innerWidth > 768) {
                sidebar.classList.toggle('collapsed');
                if(sidebar.classList.contains('collapsed')) {
                    document.querySelectorAll('.submenu').forEach(sub => sub.classList.remove('open'));
                }
                const icon = btnToggleDesktop.querySelector('i');
                if(icon) {
                    icon.innerText = sidebar.classList.contains('collapsed') ? 'menu' : 'menu_open';
                }
            } else {
                sidebar.classList.toggle('mobile-open');
            }
        });
    }

    const btnToggleMenuHeader = document.getElementById('btn-toggle-menu');
    if (btnToggleMenuHeader) {
        btnToggleMenuHeader.addEventListener('click', (e) => {
            if(window.innerWidth <= 768) {
                e.stopPropagation();
                sidebar.classList.toggle('mobile-open');
            }
        });
    }

    // -----------------------------------------------------
    // 5. MODO OSCURO / CLARO (INTERRUPTOR)
    // -----------------------------------------------------
    const themeToggle = document.getElementById('checkbox-theme-toggle');

    const aplicarTema = (tema) => {
        if (tema === 'dark') {
            document.body.classList.add('dark-mode');
            if (themeToggle) themeToggle.checked = true;
        } else {
            document.body.classList.remove('dark-mode');
            if (themeToggle) themeToggle.checked = false;
        }
        localStorage.setItem('admin_theme', tema);
    };

    // Inicialización del tema al cargar
    const temaGuardado = localStorage.getItem('admin_theme');
    if (temaGuardado) {
        aplicarTema(temaGuardado);
    } else {
        // Detección automática por sistema operativo
        const prefiereOscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        aplicarTema(prefiereOscuro ? 'dark' : 'light');
    }

    // Escuchar el cambio en el switch
    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            aplicarTema(themeToggle.checked ? 'dark' : 'light');
        });
    }

    // -----------------------------------------------------
    // 6. CERRAR SESIÓN (AHORA DESTRUYE LA SESIÓN REAL)
    // -----------------------------------------------------
    const btnLogout = document.getElementById('btn-logout');
    if(btnLogout) {
        const nuevoBtnLogout = btnLogout.cloneNode(true);
        btnLogout.parentNode.replaceChild(nuevoBtnLogout, btnLogout);
        
        nuevoBtnLogout.addEventListener('click', () => {
            mostrarToast('Cerrando sesión...', 'success');
            sessionStorage.clear(); 
            
            // 🔥 MEJORA: Apagamos la bolita de notificaciones al salir
            const badgeGlobal = document.getElementById('global-badge-tickets');
            if (badgeGlobal) badgeGlobal.style.display = 'none';

            setTimeout(() => {
                if(dashboardSection) dashboardSection.style.display = 'none';
                if(loginSection) loginSection.style.display = 'flex';
                const userInp = document.getElementById('admin-user');
                const passInp = document.getElementById('admin-pass');
                if(userInp) userInp.value = '';
                if(passInp) passInp.value = '';
                
                document.querySelectorAll('li').forEach(li => li.style.display = 'block');
            }, 1000);
        });
    }
});

// -----------------------------------------------------
// 7. FUNCIÓN GLOBAL DE NOTIFICACIONES (TOASTS)
// -----------------------------------------------------
function mostrarToast(mensaje, tipo = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    const icon = tipo === 'success' ? 'check_circle' : (tipo === 'warning' ? 'warning' : 'error');
    
    toast.innerHTML = `
        <i class="material-icons-round">${icon}</i>
        <span>${mensaje}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 400); 
    }, 3500);
}

// -----------------------------------------------------
// 8. FUNCIONES GLOBALES PARA MODALES
// -----------------------------------------------------
function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) {
        modal.style.display = 'flex';
        const btnClose = modal.querySelector('.btn-close-modal');
        if(btnClose) {
            btnClose.onclick = () => cerrarModal(modalId);
        }
    }
}

function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) modal.style.display = 'none';
}
