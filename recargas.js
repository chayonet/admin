const API_RECARGAS = `${API_BASE_URL_F}/admin_api.php`;
let usuariosParaRecarga = [];

window.abrirModalRecargaUsuario = async function(usuarioPreseleccionado = null) {
    
    crearDOMModalRecarga();

    const modal = document.getElementById('modal-recarga-usuario');
    modal.style.display = 'flex';

    const form = document.getElementById('form-recargas');
    if (form) form.reset();
    
    const inputOperacion = document.getElementById('recarga-operacion');
    if (inputOperacion) inputOperacion.value = 'sumar';
    
    resetTarjetaInfo();

    const boxBuscador = document.getElementById('box-buscador-recarga');
    const selectUsr = document.getElementById('recarga-usuario');
    const avisoBloqueo = document.getElementById('aviso-bloqueo-usr');

    if (usuarioPreseleccionado) {
        
        if (boxBuscador) boxBuscador.style.display = 'none';
        if (selectUsr) {
            selectUsr.disabled = true;
            selectUsr.style.opacity = '0.8';
            selectUsr.style.cursor = 'not-allowed';
        }
        if (avisoBloqueo) avisoBloqueo.style.display = 'inline-block';
    } else {
        
        if (boxBuscador) boxBuscador.style.display = 'block';
        if (selectUsr) {
            selectUsr.disabled = false;
            selectUsr.style.opacity = '1';
            selectUsr.style.cursor = 'pointer';
        }
        if (avisoBloqueo) avisoBloqueo.style.display = 'none';
    }

    await cargarListaUsuariosRecarga(usuarioPreseleccionado);
};

function crearDOMModalRecarga() {
    if (document.getElementById('modal-recarga-usuario')) return;

    const modal = document.createElement('div');
    modal.id = 'modal-recarga-usuario';
    modal.className = 'modal-overlay';

    Object.assign(modal.style, {
        display: 'none',
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: 'rgba(10, 15, 25, 0.9)', 
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
            max-width: 850px; 
            width: 95%; 
            max-height: 90vh; 
            overflow: hidden; 
            border-radius: 20px; 
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
            display: flex;
            flex-direction: column;
            border: 1px solid #334155;
        ">
            <div style="padding: 25px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; background: #1e293b;">
                <h2 style="margin:0; font-size: 1.4rem; display:flex; align-items:center; gap:12px; font-family: 'Righteous', sans-serif; letter-spacing: 1px;">
                    <i class="material-icons-round" style="color: #10b981; font-size: 28px;">account_balance_wallet</i> 
                    Gestión de Saldo
                </h2>
                <button type="button" onclick="document.getElementById('modal-recarga-usuario').style.display='none'" style="background: #334155; color: #94a3b8; border: none; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items:center; justify-content: center; transition: 0.3s;">
                    <i class="material-icons-round" style="font-size: 20px;">close</i>
                </button>
            </div>

            <div style="padding: 25px; overflow-y: auto; flex: 1; background: #0f172a;">
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 25px; align-items: start;">
                    
                    <div style="background: #1e293b; padding: 25px; border-radius: 16px; border: 1px solid #334155; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <h3 style="margin-top: 0; margin-bottom: 20px; color: #f8fafc; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                            <i class="material-icons-round" style="color: #38bdf8;">currency_exchange</i> Nueva Transacción
                        </h3>
                        
                        <form id="form-recargas">
                            
                            <div id="box-buscador-recarga" style="margin-bottom: 15px; position: relative;">
                                <label style="display:block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px; font-weight: 600;">BUSCAR USUARIO RÁPIDO</label>
                                <div style="position: relative; display: flex; align-items: center;">
                                    <i class="material-icons-round" style="position: absolute; left: 12px; color: #94a3b8; font-size: 1.2rem;">search</i>
                                    <input type="text" id="buscador-usuario-recarga" placeholder="Escribe nombre o usuario..." style="width: 100%; background: #0f172a; border: 1px solid #334155; color: #fff; padding: 12px 12px 12px 40px; border-radius: 10px; outline: none; margin-bottom: 0; box-sizing: border-box; transition: border 0.3s;">
                                </div>
                            </div>

                            <div style="margin-bottom: 20px;">
                                <label style="display:block; font-size: 0.75rem; color: #38bdf8; margin-bottom: 8px; font-weight: 600;">
                                    SELECCIONAR USUARIO <span style="color: #ef4444;">*</span>
                                    <span id="aviso-bloqueo-usr" style="display:none; float:right; color:#38bdf8; font-size:0.7rem;"><i class="material-icons-round" style="font-size:0.8rem; vertical-align:middle;">lock</i> Fijado</span>
                                </label>
                                <select id="recarga-usuario" required style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid #334155; color: #fff; border-radius: 10px; font-weight: 500; outline:none; margin-bottom: 0; box-sizing: border-box;">
                                    <option value="" disabled selected>Cargando usuarios...</option>
                                </select>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                                <div>
                                    <label style="display:block; font-size: 0.75rem; color: #38bdf8; margin-bottom: 8px; font-weight: 600;">OPERACIÓN <span style="color: #ef4444;">*</span></label>
                                    <select id="recarga-operacion" required style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid #334155; color: #fff; border-radius: 10px; font-weight: 500; outline:none; margin-bottom: 0; box-sizing: border-box;">
                                        <option value="sumar" selected>➕ Recargar (+)</option>
                                        <option value="restar">➖ Descontar (-)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style="display:block; font-size: 0.75rem; color: #38bdf8; margin-bottom: 8px; font-weight: 600;">MONTO ($) <span style="color: #ef4444;">*</span></label>
                                    <input type="number" id="recarga-monto" placeholder="Ej: 50000" min="1" step="0.01" required style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid #334155; color: #10b981; font-weight: bold; border-radius: 10px; outline:none; margin-bottom: 0; box-sizing: border-box;">
                                </div>
                            </div>

                            <div style="margin-bottom: 25px;">
                                <label style="display:block; font-size: 0.75rem; color: #38bdf8; margin-bottom: 8px; font-weight: 600;">MOTIVO / COMENTARIO <span style="color: #ef4444;">*</span></label>
                                <input type="text" id="recarga-motivo" placeholder="Ej: Recarga por transferencia Nequi #12345" required style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid #334155; color: #fff; border-radius: 10px; outline:none; margin-bottom: 0; box-sizing: border-box;">
                            </div>

                            <button type="submit" id="btn-procesar-recarga" style="width: 100%; font-size: 1rem; padding: 14px; background: #10b981; color: #fff; border: none; border-radius: 10px; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; font-weight: bold; transition: 0.3s; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
                                <i class="material-icons-round">send</i> APLICAR TRANSACCIÓN
                            </button>
                        </form>
                    </div>

                    <div id="card-info-usuario" style="background: #1e293b; padding: 30px; border-radius: 16px; border: 1px dashed #334155; text-align: center; opacity: 0.5; transition: all 0.3s ease; display:flex; flex-direction:column; justify-content:center; align-items:center; min-height: 250px;">
                        <i class="material-icons-round" style="font-size: 4rem; color: #64748b; margin-bottom: 15px;">person_search</i>
                        <h3 style="color: #cbd5e1; margin: 0;">Selecciona un usuario</h3>
                        <p style="color: #64748b; font-size: 0.85rem; margin-top: 5px;">Podrás ver su saldo actual aquí antes de procesar.</p>
                    </div>

                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    initEventosRecargasDOM();
}

async function cargarListaUsuariosRecarga(usuarioPreseleccionado) {
    const select = document.getElementById('recarga-usuario');
    if (!select) return;

    try {
        const payload = {
            accion: 'getUsuariosAdmin',
            usuario: sessionStorage.getItem('admin_user'),
            token: sessionStorage.getItem('admin_token')
        };

        const response = await fetch(API_RECARGAS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const res = await response.json();

        if (res.success) {
            usuariosParaRecarga = res.datos.sort((a, b) => a.usuario.localeCompare(b.usuario));
            renderSelectUsuariosRecarga(''); 

            if (usuarioPreseleccionado) {
                const usrMatch = usuariosParaRecarga.find(u => u.usuario === usuarioPreseleccionado);
                if (usrMatch) {
                    select.value = usrMatch.id;
                    select.dispatchEvent(new Event('change')); 
                }
            }

        } else {
            select.innerHTML = '<option value="" disabled>Error cargando usuarios</option>';
        }
    } catch (error) {
        select.innerHTML = '<option value="" disabled>Error de conexión</option>';
    }
}

function renderSelectUsuariosRecarga(filtroTexto) {
    const select = document.getElementById('recarga-usuario');
    if (!select) return;

    select.innerHTML = '<option value="" disabled selected>-- Selecciona un usuario --</option>';
    const txtFiltro = filtroTexto.toLowerCase().trim();

    let coincidencias = 0;

    usuariosParaRecarga.forEach(usr => {
        const cadenaBusqueda = `${usr.usuario} ${usr.nombre || ''} ${usr.apellido || ''} ${usr.rol}`.toLowerCase();
        
        if (cadenaBusqueda.includes(txtFiltro)) {
            coincidencias++;
            const opt = document.createElement('option');
            opt.value = usr.id;
            opt.textContent = `${usr.usuario} ${usr.nombre ? `(${usr.nombre})` : ''} - Rol: ${usr.rol}`;
            select.appendChild(opt);
        }
    });

    if (coincidencias === 0) {
        select.innerHTML = '<option value="" disabled selected>No se encontraron resultados...</option>';
    }
}

function initEventosRecargasDOM() {
    const selectUsr = document.getElementById('recarga-usuario');
    const buscadorUsr = document.getElementById('buscador-usuario-recarga');
    const cardInfo = document.getElementById('card-info-usuario');
    const form = document.getElementById('form-recargas');

    if(buscadorUsr) {
        buscadorUsr.addEventListener('focus', () => buscadorUsr.style.borderColor = '#38bdf8');
        buscadorUsr.addEventListener('blur', () => buscadorUsr.style.borderColor = '#334155');
    }

    if (buscadorUsr) {
        buscadorUsr.addEventListener('keyup', (e) => {
            renderSelectUsuariosRecarga(e.target.value);
            
            if (selectUsr.options.length === 2 && e.target.value.trim() !== '') {
                selectUsr.selectedIndex = 1;
                selectUsr.dispatchEvent(new Event('change')); 
            } else {
                resetTarjetaInfo();
            }
        });
    }

    if (selectUsr) {
        selectUsr.addEventListener('change', (e) => {
            const idSeleccionado = e.target.value;
            const usr = usuariosParaRecarga.find(u => u.id.toString() === idSeleccionado);
            
            if (usr) {
                const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
                const saldoActual = fmt.format(parseFloat(usr.saldo) || 0);

                let colorHex = usr.rol === 'Admin' ? '#f59e0b' : (usr.rol === 'Trabajador' ? '#38bdf8' : '#10b981');
                let colorBg = usr.rol === 'Admin' ? 'rgba(245, 158, 11, 0.1)' : (usr.rol === 'Trabajador' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(16, 185, 129, 0.1)');

                cardInfo.style.opacity = '1';
                cardInfo.style.borderStyle = 'solid';
                cardInfo.style.borderColor = colorHex;
                
                cardInfo.innerHTML = `
                    <div style="display: inline-block; padding: 15px; background: ${colorBg}; border-radius: 50%; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                        <i class="material-icons-round" style="font-size: 3.5rem; color: ${colorHex};">account_circle</i>
                    </div>
                    <h2 style="color: #f8fafc; margin: 0; font-size: 1.5rem; text-transform: uppercase; font-family: 'Righteous', sans-serif;">${usr.usuario}</h2>
                    <p style="color: #94a3b8; margin: 5px 0 20px 0; font-weight: 500;">${usr.nombre || 'Sin nombre real'} ${usr.apellido || ''}</p>
                    
                    <div style="background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 20px; display: inline-block; min-width: 85%; box-shadow: inset 0 2px 10px rgba(0,0,0,0.2);">
                        <span style="display: block; font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Saldo Actual</span>
                        <strong style="font-size: 2.2rem; color: #10b981; font-family: monospace; letter-spacing: -1px;">${saldoActual}</strong>
                    </div>
                    
                    <div style="margin-top: 25px; font-size: 0.85rem; color: #64748b; display: flex; align-items: center; justify-content: center; gap: 6px;">
                        <i class="material-icons-round" style="font-size: 1.1rem;">email</i> ${usr.correo || 'No registrado'}
                    </div>
                `;
            }
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const idUsuario = selectUsr.value;
            const operacion = document.getElementById('recarga-operacion').value;
            const monto = document.getElementById('recarga-monto').value;
            const motivo = document.getElementById('recarga-motivo').value.trim();

            if (!idUsuario) {
                if(typeof mostrarToast === 'function') mostrarToast("Debes seleccionar un usuario válido.", "warning");
                return;
            }

            const btn = document.getElementById('btn-procesar-recarga');
            const txtOriginal = btn.innerHTML;
            btn.innerHTML = '<i class="material-icons-round" style="animation: spin 1s linear infinite;">autorenew</i> Procesando...';
            btn.disabled = true;

            const prefijo = operacion === 'sumar' ? 'REC-' : 'DES-';
            const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
            const orderIdGenerado = prefijo + randomString;

            const payloadData = {
                accion: 'recargarSaldoUsuario',
                usuario: sessionStorage.getItem('admin_user'), 
                token: sessionStorage.getItem('admin_token'),
                id: idUsuario,
                monto: monto,
                operacion: operacion,
                comentario: motivo,
                order_id: orderIdGenerado
            };

            try {
                const response = await fetch(API_RECARGAS, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payloadData)
                });
                
                const res = await response.json();

                if (res.success) {
                    if(typeof mostrarToast === 'function') mostrarToast(`Transacción exitosa. Ref: ${orderIdGenerado}`, "success");
                    
                    document.getElementById('recarga-monto').value = '';
                    document.getElementById('recarga-motivo').value = '';
                    
                    const usrIndex = usuariosParaRecarga.findIndex(u => u.id.toString() === idUsuario);
                    if (usrIndex !== -1) {
                        usuariosParaRecarga[usrIndex].saldo = res.nuevo_saldo;
                        selectUsr.dispatchEvent(new Event('change')); 
                    }

                    if (typeof window.cargarUsuarios === 'function') {
                        window.cargarUsuarios();
                    }

                } else {
                    if(typeof mostrarToast === 'function') mostrarToast("Error: " + res.msg, "error");
                    else alert("Error: " + res.msg);
                }

            } catch (error) {
                if(typeof mostrarToast === 'function') mostrarToast("Error de conexión con el servidor.", "error");
                console.error(error);
            } finally {
                btn.innerHTML = txtOriginal;
                btn.disabled = false;
            }
        });
    }
}

function resetTarjetaInfo() {
    const cardInfo = document.getElementById('card-info-usuario');
    if (!cardInfo) return;
    cardInfo.style.opacity = '0.5';
    cardInfo.style.borderStyle = 'dashed';
    cardInfo.style.borderColor = '#334155';
    cardInfo.innerHTML = `
        <i class="material-icons-round" style="font-size: 4rem; color: #64748b; margin-bottom: 15px;">person_search</i>
        <h3 style="color: #cbd5e1; margin: 0;">Selecciona un usuario</h3>
        <p style="color: #64748b; font-size: 0.85rem; margin-top: 5px;">Podrás ver su saldo actual aquí antes de procesar.</p>
    `;
}
