let moduloInicioInicializado = false;

document.addEventListener('moduloCargado', (e) => {
    if (e.detail.modulo === 'mod-inicio') {
        inicializarModuloInicio();
    }
});

function inicializarModuloInicio() {
    if (moduloInicioInicializado) {
        cargarBrandingUltraRapido(); 
        return;
    }
    moduloInicioInicializado = true;

    const seccion = document.getElementById('mod-inicio');
    if (seccion && seccion.innerHTML.trim() === "") {

        const estilosInicio = `
            <style>
                .inicio-hero {
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
                    border: 1px solid rgba(139, 92, 246, 0.2);
                    border-radius: 16px;
                    padding: 40px 30px;
                    margin-bottom: 35px;
                    display: flex;
                    align-items: center;
                    gap: 25px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.02);
                }
                .inicio-hero::after {
                    content: ''; position: absolute; right: -50px; top: -50px; width: 250px; height: 250px; 
                    background: rgba(139, 92, 246, 0.15); filter: blur(60px); border-radius: 50%; pointer-events: none;
                }
                .hero-icon {
                    background: linear-gradient(135deg, #8b5cf6, #3b82f6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    font-size: 4rem !important;
                }
                
                .brand-box {
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    padding: 30px;
                    transition: all 0.3s ease;
                    box-shadow: var(--shadow-sm);
                    position: relative;
                }
                .brand-box:hover {
                    box-shadow: 0 12px 30px rgba(139, 92, 246, 0.08);
                    border-color: rgba(139, 92, 246, 0.3);
                    transform: translateY(-3px);
                }
                
                .preview-container {
                    width: 100%;
                    height: 180px;
                    background: var(--bg-dark);
                    border: 2px dashed var(--border-color);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 20px 0;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }
                .preview-container:hover {
                    border-color: #8b5cf6;
                    background: rgba(139, 92, 246, 0.03);
                }
                .preview-container img {
                    max-width: 90%;
                    max-height: 90%;
                    object-fit: contain;
                    z-index: 2;
                    transition: transform 0.4s ease;
                    border-radius: 8px;
                }
                .preview-container:hover img {
                    transform: scale(1.05);
                }
                
                .btn-select-file {
                    background: transparent;
                    color: var(--text-main);
                    border: 1px solid var(--border-color);
                    padding: 12px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    width: 100%;
                    font-weight: 600;
                    font-size: 0.9rem;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin-bottom: 12px;
                }
                .btn-select-file:hover {
                    background: var(--bg-dark);
                    border-color: #8b5cf6;
                    color: #8b5cf6;
                }
                
                .btn-upload-file {
                    background: linear-gradient(135deg, #8b5cf6, #6366f1);
                    color: #fff;
                    border: none;
                    padding: 14px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    width: 100%;
                    font-weight: 700;
                    font-size: 0.95rem;
                    letter-spacing: 0.5px;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    box-shadow: 0 6px 15px rgba(139, 92, 246, 0.25);
                }
                .btn-upload-file:hover:not(:disabled) {
                    box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
                    transform: translateY(-1px);
                    filter: brightness(1.1);
                }
                .btn-upload-file:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .btn-delete-brand {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    padding: 10px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: 0.3s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .btn-delete-brand:hover {
                    background: #ef4444;
                    color: #fff;
                    box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
                }
                
                .spec-badge {
                    position: absolute;
                    top: 25px;
                    right: 25px;
                    background: var(--bg-dark);
                    border: 1px solid var(--border-color);
                    color: var(--text-muted);
                    font-size: 0.7rem;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-family: monospace;
                    font-weight: bold;
                }

                .loading-overlay { 
                    position: absolute; inset: 0; background: rgba(15,23,42,0.7); 
                    backdrop-filter: blur(2px); display: flex; align-items: center; 
                    justify-content: center; z-index: 10; border-radius: 12px; 
                    color: white; font-weight: bold; opacity: 0; transition: opacity 0.3s; pointer-events: none; 
                }
                .loading-overlay.active { opacity: 1; pointer-events: all; }
            </style>
        `;

        seccion.innerHTML = `
            ${estilosInicio}
            
            <div class="inicio-hero">
                <i class="material-icons-round hero-icon">admin_panel_settings</i>
                <div style="z-index: 1;">
                    <h2 style="margin: 0; color: var(--text-main); font-size: 2rem; font-weight: 800; font-family: 'Righteous', cursive; letter-spacing: 1px;">Centro de Mando</h2>
                    <p style="color: var(--text-gray); margin-top: 8px; font-size: 1.05rem; max-width: 600px;">
                        `Bienvenido a <strong>${NOMBRE_NEGOCIO}</strong>. Desde aquí podrás gestionar el catálogo, monitorear los ingresos y personalizar la experiencia visual de tus clientes.`
                    </p>
                </div>
            </div>

            <h3 style="margin-top: 0; margin-bottom: 20px; color: var(--text-main); font-size: 1.3rem; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid rgba(139, 92, 246, 0.2); padding-bottom: 10px; display: inline-flex;">
                <i class="material-icons-round" style="color: #8b5cf6;">palette</i> Diseño y Marca General
            </h3>
            <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 30px;">Actualiza el logotipo principal y el banner de bienvenida. Se cargan al instante gracias a la caché local.</p>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 30px; margin-bottom: 50px;">
                
                <div class="brand-box">
                    <span class="spec-badge">PNG / JPG</span>
                    <h4 style="color: var(--text-main); margin-top: 0; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                        <i class="material-icons-round" style="color: var(--accent-text);">token</i> Logo Principal
                    </h4>
                    <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 5px;">Se muestra en la barra lateral del cliente.</p>
                    
                    <div class="preview-container">
                        <div id="loader-logo" class="loading-overlay active"><i class="material-icons-round" style="animation: spin 1s linear infinite; margin-right: 8px;">autorenew</i> Validando...</div>
                        <img id="preview-logo" src="https://via.placeholder.com/200x200?text=Cargando..." alt="Logo Actual" onerror="this.onerror=null; this.src='https://via.placeholder.com/200x200?text=Sin+Logo'">
                    </div>
                    
                    <input type="file" id="file-logo" accept="image/png, image/jpeg, image/webp" style="display: none;" onchange="mostrarVistaPreviaLocal(this, 'preview-logo')">
                    
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-select-file" onclick="document.getElementById('file-logo').click()" style="flex: 1; margin-bottom: 0;" title="Explorar Archivos">
                            <i class="material-icons-round">image_search</i>
                        </button>
                        <button id="btn-subir-logo" class="btn-upload-file" onclick="subirImagenBranding('logo')" style="flex: 2;">
                            <i class="material-icons-round">cloud_upload</i> Guardar Logo
                        </button>
                        <button class="btn-delete-brand" onclick="borrarImagenBranding('logo')" title="Borrar Logo">
                            <i class="material-icons-round">delete</i>
                        </button>
                    </div>
                </div>

                <div class="brand-box">
                    <span class="spec-badge">ALTA RESOLUCIÓN</span>
                    <h4 style="color: var(--text-main); margin-top: 0; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                        <i class="material-icons-round" style="color: var(--accent-text);">wallpaper</i> Banner de Acceso
                    </h4>
                    <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 5px;">Se muestra de fondo en la pantalla de Login.</p>
                    
                    <div class="preview-container" style="background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.02) 75%, rgba(255,255,255,0.02)); background-size: 20px 20px;">
                        <div id="loader-banner" class="loading-overlay active"><i class="material-icons-round" style="animation: spin 1s linear infinite; margin-right: 8px;">autorenew</i> Validando...</div>
                        <img id="preview-banner" src="https://via.placeholder.com/400x200?text=Cargando..." alt="Banner Actual" style="object-fit: cover; width: 100%; height: 100%; max-width: 100%; max-height: 100%;" onerror="this.onerror=null; this.src='https://via.placeholder.com/400x200?text=Sin+Banner'">
                    </div>
                    
                    <input type="file" id="file-banner" accept="image/png, image/jpeg, image/webp" style="display: none;" onchange="mostrarVistaPreviaLocal(this, 'preview-banner')">
                    
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-select-file" onclick="document.getElementById('file-banner').click()" style="flex: 1; margin-bottom: 0;" title="Explorar Archivos">
                            <i class="material-icons-round">image_search</i>
                        </button>
                        <button id="btn-subir-banner" class="btn-upload-file" onclick="subirImagenBranding('banner')" style="flex: 2;">
                            <i class="material-icons-round">cloud_upload</i> Guardar Banner
                        </button>
                        <button class="btn-delete-brand" onclick="borrarImagenBranding('banner')" title="Borrar Banner">
                            <i class="material-icons-round">delete</i>
                        </button>
                    </div>
                </div>

            </div>
        `;
        
        cargarBrandingUltraRapido(); 
    }
}

async function cargarBrandingUltraRapido() {
    const plataformasAll = ['logo', 'banner'];

    const configCacheLocal = localStorage.getItem('db_configuracion_branding');
    let configActual = {};

    if (configCacheLocal) {
        try {
            configActual = JSON.parse(configCacheLocal);
            plataformasAll.forEach(tipo => {
                const imgElement = document.getElementById(`preview-${tipo}`);
                if (imgElement) {
                    if (configActual[tipo] && configActual[tipo].trim() !== '') {
                        imgElement.src = obtenerThumbnailDrive(configActual[tipo]);
                    } else {
                        let txt = tipo === 'logo' ? 'Sin+Logo' : 'Sin+Banner';
                        imgElement.src = `https://via.placeholder.com/200x200?text=${txt}`;
                    }
                    
                    document.getElementById(`loader-${tipo}`)?.classList.remove('active');
                }
            });
        } catch(e) { console.error("Error leyendo caché de branding", e); }
    } else {
        plataformasAll.forEach(tipo => {
            document.getElementById(`loader-${tipo}`)?.classList.add('active');
        });
    }

    try {
        const payload = {
            accion: 'getConfiguracion',
            usuario: sessionStorage.getItem('admin_user'),
            token: sessionStorage.getItem('admin_token')
        };

        // ACTUALIZADO AL SERVIDOR ZZD6 Y CON PARSEO SEGURO (Aspiradora JSON)
        fetch(`${API_BASE_URL_F}/admin_api.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => res.text())
        .then(textRaw => {
            const cleanJson = textRaw.substring(textRaw.indexOf('{'), textRaw.lastIndexOf('}') + 1);
            const res = JSON.parse(cleanJson);
            
            if (res.success) {
                const configDB = res.datos;
                let huboCambios = false;

                plataformasAll.forEach(tipo => {
                    let urlVieja = configActual[tipo] || '';
                    let urlNueva = configDB[tipo] || '';

                    if (urlVieja !== urlNueva) {
                        huboCambios = true;
                        const imgElement = document.getElementById(`preview-${tipo}`);
                        if (imgElement) {
                            if (urlNueva.trim() !== '') {
                                imgElement.src = obtenerThumbnailDrive(urlNueva) + "&v=" + Date.now();
                            } else {
                                let txt = tipo === 'logo' ? 'Sin+Logo' : 'Sin+Banner';
                                imgElement.src = `https://via.placeholder.com/200x200?text=${txt}`;
                            }
                        }
                    }
                });

                if (huboCambios || !configCacheLocal) {
                    localStorage.setItem('db_configuracion_branding', JSON.stringify(configDB));
                }
            }
        })
        .catch(err => console.error("Error silencioso validando branding: ", err))
        .finally(() => {
            plataformasAll.forEach(tipo => {
                document.getElementById(`loader-${tipo}`)?.classList.remove('active');
            });
        });

    } catch (error) {
        console.error("Error de conexión al cargar configuracion", error);
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
                
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800; 
                const MAX_HEIGHT = 800; 
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
                    
                    // PARSEO SEGURO PARA EL SCRIPT DE DRIVE
                    const resultText = await response.text();
                    const cleanJson = resultText.substring(resultText.indexOf('{'), resultText.lastIndexOf('}') + 1);
                    const result = JSON.parse(cleanJson); 
                    
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

window.mostrarVistaPreviaLocal = function(input, imgId) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgElement = document.getElementById(imgId);
            imgElement.style.opacity = '0';
            setTimeout(() => {
                imgElement.src = e.target.result;
                imgElement.style.opacity = '1';
            }, 150);
        }
        reader.readAsDataURL(input.files[0]);
    }
}

window.subirImagenBranding = async function(tipo) {
    const inputId = `file-${tipo}`;
    const fileInput = document.getElementById(inputId);
    const file = fileInput.files[0];

    if (!file) {
        return mostrarToast('Por favor, selecciona una imagen nueva primero.', 'warning');
    }

    const btn = document.getElementById(`btn-subir-${tipo}`);
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '<i class="material-icons-round" style="animation: spin 1s linear infinite;">autorenew</i> Subiendo a Drive...';
    btn.disabled = true;

    try {
        
        const urlDrive = await subirImagenADrive(file);

        const formData = new FormData();
        formData.append('accion', 'actualizarBranding');
        formData.append('tipo', tipo);
        formData.append('imagen_url', urlDrive); 
        formData.append('usuario', sessionStorage.getItem('admin_user'));
        formData.append('token', sessionStorage.getItem('admin_token'));

        // ACTUALIZADO AL SERVIDOR ZZD6
        const response = await fetch(`${API_BASE_URL_F}/admin_api.php`, {
            method: 'POST',
            body: formData 
        });
        
        // PARSEO SEGURO (Aspiradora de JSON)
        const textRaw = await response.text();
        const cleanJson = textRaw.substring(textRaw.indexOf('{'), textRaw.lastIndexOf('}') + 1);
        const res = JSON.parse(cleanJson);

        if (res.success) {
            mostrarToast(`¡${tipo.toUpperCase()} actualizado con éxito!`, 'success');

            document.getElementById(`preview-${tipo}`).src = obtenerThumbnailDrive(urlDrive) + "&v=" + Date.now();
            fileInput.value = ""; 

            let configCacheLocal = localStorage.getItem('db_configuracion_branding');
            if (configCacheLocal) {
                let configActual = JSON.parse(configCacheLocal);
                configActual[tipo] = urlDrive;
                localStorage.setItem('db_configuracion_branding', JSON.stringify(configActual));
            }
        } else {
            mostrarToast("Error en BD: " + res.msg, 'error');
        }
    } catch (error) {
        mostrarToast("Error al procesar la imagen.", 'error');
        console.error(error);
    } finally {
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
    }
}

window.borrarImagenBranding = async function(tipo) {
    if (!confirm(`¿Estás seguro de que deseas eliminar la imagen de ${tipo.toUpperCase()}?`)) return;

    try {
        // ACTUALIZADO AL SERVIDOR ZZD6
        const response = await fetch(`${API_BASE_URL_F}/admin_api.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                accion: 'borrarBranding',
                tipo: tipo,
                usuario: sessionStorage.getItem('admin_user'),
                token: sessionStorage.getItem('admin_token')
            })
        });
        
        // PARSEO SEGURO
        const textRaw = await response.text();
        const cleanJson = textRaw.substring(textRaw.indexOf('{'), textRaw.lastIndexOf('}') + 1);
        const res = JSON.parse(cleanJson);
        
        if (res.success) {
            mostrarToast(res.msg, 'success');
            let txt = tipo === 'logo' ? 'Sin+Logo' : 'Sin+Banner';
            document.getElementById(`preview-${tipo}`).src = `https://via.placeholder.com/200x200?text=${txt}`;
            document.getElementById(`file-${tipo}`).value = "";

            let configCacheLocal = localStorage.getItem('db_configuracion_branding');
            if (configCacheLocal) {
                let configActual = JSON.parse(configCacheLocal);
                configActual[tipo] = "";
                localStorage.setItem('db_configuracion_branding', JSON.stringify(configActual));
            }
        } else {
            mostrarToast("Error: " + res.msg, 'error');
        }
    } catch (e) {
        mostrarToast("Error de conexión al intentar borrar.", "error");
        console.error(e);
    }
}

window.obtenerThumbnailDrive = function(urlOriginal) {
    if (!urlOriginal) return '';

    if (!urlOriginal.includes('drive.google.com')) return urlOriginal;

    let fileId = '';

    const matchId = urlOriginal.match(/id=([^&]+)/);
    if (matchId) {
        fileId = matchId[1];
    } else {
        const matchD = urlOriginal.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (matchD) {
            fileId = matchD[1];
        }
    }

    if (fileId) {
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
    }

    return urlOriginal;
};

document.addEventListener('DOMContentLoaded', async () => {
    
    if (!sessionStorage.getItem('admin_token')) return;

    try {
        const payload = {
            accion: 'getConteoTickets',
            usuario: sessionStorage.getItem('admin_user'),
            token: sessionStorage.getItem('admin_token')
        };

        // ACTUALIZADO AL SERVIDOR ZZD6
        const response = await fetch(`${API_BASE_URL_F}/admin_api.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        // PARSEO SEGURO
        const textRaw = await response.text();
        const cleanJson = textRaw.substring(textRaw.indexOf('{'), textRaw.lastIndexOf('}') + 1);
        const res = JSON.parse(cleanJson);
        
        if (res.success && res.count > 0) {
            const abiertos = res.count;

            const badgeGlobal = document.getElementById('global-badge-tickets');
            
            if (badgeGlobal) {
                badgeGlobal.innerText = abiertos;
                badgeGlobal.style.display = 'inline-flex';
                
                badgeGlobal.style.background = '#ef4444';
                badgeGlobal.style.color = '#fff';
                badgeGlobal.style.borderRadius = '50%';
                badgeGlobal.style.padding = '2px 6px';
                badgeGlobal.style.fontSize = '0.75rem';
                badgeGlobal.style.marginLeft = 'auto';
                badgeGlobal.style.animation = 'pulse 2s infinite';
            }
        }
    } catch (error) {
        console.warn("Verificación silenciosa de tickets ignorada.", error);
    }
});

const stylePulse = document.createElement('style');
stylePulse.innerHTML = `@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }`;
document.head.appendChild(stylePulse);
