/* =================================================================================
   ARCHIVO: ranking.js (PANEL ADMIN)
   Lógica: Top del Mes Actual por Inversión y Volumen (Desde Materialized View).
================================================================================= */

const API_RANKING = `${API_BASE_URL_F}/admin_api.php`;
let rankingInicializado = false;

// Variables Globales de Datos
let datosRankingCompletos = [];
let usuariosTotalesList = [];
let modoFiltroActual = 'dinero'; // 'dinero' o 'cuentas'

// ==========================================
// 1. ESCUCHADOR DE NAVEGACIÓN
// ==========================================
document.addEventListener('moduloCargado', (e) => {
    if (e.detail.modulo === 'mod-ranking') {
        inicializarModuloRanking();
    }
});

// ==========================================
// 2. INICIALIZACIÓN DEL MÓDULO Y UI
// ==========================================
function inicializarModuloRanking() {
    if (rankingInicializado) return;
    rankingInicializado = true;

    const seccionRanking = document.getElementById('mod-ranking');
    if (!seccionRanking) return;

    // Obtener el nombre del mes actual para la UI
    const nombreMes = new Intl.DateTimeFormat('es-CO', { month: 'long' }).format(new Date()).toUpperCase();

    seccionRanking.innerHTML = `
        <style>
            .rank-dashboard { display: flex; flex-direction: column; gap: 20px; color: var(--text-main); max-width: 900px; margin: 0 auto; padding-bottom: 30px; }
            .rank-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px; }
            .rank-header h2 { margin: 0; color: var(--text-main); font-size: 1.8rem; font-family: 'Righteous', cursive; letter-spacing: 1px; display: flex; align-items: center; gap: 10px; }
            
            /* Filtros Box */
            .rank-filters-box { background: var(--bg-card); border: 1px solid var(--border-color); padding: 20px; border-radius: 16px; display: flex; flex-wrap: wrap; gap: 15px; align-items: flex-end; box-shadow: var(--shadow-sm); }
            .rank-filter-group { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 150px; position: relative; }
            .rank-filter-group label { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
            .rank-filter-group input, .rank-filter-group select { padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-dark); color: var(--text-main); outline: none; font-size: 0.95rem; width: 100%; box-sizing: border-box; }
            .rank-filter-group input:focus { border-color: var(--accent); }

            /* Toggle Buttons (Dinero vs Cuentas) */
            .toggle-ranking-btn { flex: 1; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-dark); color: var(--text-gray); font-weight: 800; cursor: pointer; transition: 0.3s; display: flex; justify-content: center; align-items: center; gap: 8px; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px; }
            .toggle-ranking-btn.active { background: var(--accent-gradient); color: #fff; border-color: transparent; box-shadow: 0 4px 15px var(--accent-glow); }
            .toggle-ranking-btn:not(.active):hover { border-color: var(--accent-text); color: var(--accent-text); }

            /* Autocomplete Dropdown */
            .rank-dropdown-list { display: none; position: absolute; top: 100%; left: 0; width: 100%; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; margin-top: 5px; max-height: 200px; overflow-y: auto; z-index: 100; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
            .rank-dropdown-item { padding: 10px 15px; cursor: pointer; border-bottom: 1px solid var(--border-light); color: var(--text-main); font-size: 0.9rem; transition: background 0.2s; display: flex; align-items: center; gap: 10px; }
            .rank-dropdown-item:last-child { border-bottom: none; }
            .rank-dropdown-item:hover { background: rgba(139, 92, 246, 0.08); color: #8b5cf6; }

            /* Tarjeta Mi Rendimiento */
            .my-stats-card { background: var(--bg-dark); border: 1px solid var(--border-color); border-radius: 16px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); position: relative; overflow: hidden; margin-bottom: 10px; }
            .my-stats-card::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, var(--accent-text), var(--accent-glow)); }
            .my-stats-header { display: flex; align-items: center; justify-content: space-between; font-family: 'Righteous', sans-serif; color: var(--text-main); font-size: 1.2rem; margin-bottom: 25px; opacity: 0.9; }
            .mes-badge { font-size: 0.7rem; background: var(--accent-gradient); color: #fff; padding: 4px 10px; border-radius: 20px; font-family: 'Inter', sans-serif; letter-spacing: 1px; }
            .my-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .stat-item { text-align: center; }
            .border-left { border-left: 1px solid var(--border-color); }
            .stat-label { color: var(--text-gray); font-size: 0.75rem; font-weight: 800; letter-spacing: 2px; margin-bottom: 8px; }
            .stat-value { font-size: 2.5rem; font-weight: 900; color: var(--text-white); line-height: 1; font-family: 'Inter', monospace; }
            .text-accent { color: var(--accent-text); text-shadow: 0 0 15px var(--accent-glow); }
            .rank-1-text { color: #f59e0b; text-shadow: 0 0 15px rgba(245, 158, 11, 0.4); }
            .my-stats-footer { margin-top: 25px; background: var(--bg-card); border: 1px solid var(--border-color); padding: 12px; border-radius: 10px; text-align: center; font-size: 0.85rem; color: var(--text-gray); display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; }

            /* Leaderboard */
            .leaderboard-container { background: var(--bg-card); border-radius: 20px; border: 1px solid var(--border-color); padding: 25px; box-shadow: 0 5px 20px rgba(0,0,0,0.02); }
            .leaderboard-title { text-align: center; font-family: 'Righteous', sans-serif; color: var(--text-main); margin-top: 0; margin-bottom: 25px; letter-spacing: 1px; text-transform: uppercase; font-size: 1.4rem; }
            .leaderboard-list { display: flex; flex-direction: column; gap: 12px; }
            
            .rank-item { display: flex; align-items: center; justify-content: space-between; background: var(--bg-dark); padding: 15px 20px; border-radius: 12px; border: 1px solid var(--border-color); transition: transform 0.3s ease, border-color 0.3s ease; opacity: 0; animation: slideInRight 0.4s ease forwards; }
            .rank-item:hover { transform: translateX(5px); border-color: var(--accent-text); box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
            .rank-left { display: flex; align-items: center; gap: 15px; }
            .rank-right { text-align: right; display: flex; flex-direction: column; align-items: flex-end; }
            .rank-number { font-family: 'Righteous', sans-serif; color: var(--text-muted); font-size: 1.2rem; width: 30px; text-align: center; }
            .rank-name { font-weight: 700; color: var(--text-main); font-size: 1rem; }
            .rank-score { font-weight: 900; font-size: 1.15rem; font-family: 'Inter', monospace; color: var(--success); }
            .rank-label { font-size: 0.65rem; color: var(--text-gray); text-transform: uppercase; font-weight: 800; letter-spacing: 1px; }

            .medal-icon { font-size: 1.6rem; width: 30px; text-align: center; }
            .gold { color: #f59e0b; filter: drop-shadow(0 0 8px rgba(245,158,11,0.5)); }
            .silver { color: #94a3b8; filter: drop-shadow(0 0 8px rgba(148,163,184,0.5)); }
            .bronze { color: #d97706; filter: drop-shadow(0 0 8px rgba(217,119,6,0.5)); }

            .rank-gold { background: linear-gradient(90deg, rgba(245, 158, 11, 0.05), transparent); border-color: rgba(245, 158, 11, 0.2); }
            .rank-silver { background: linear-gradient(90deg, rgba(148, 163, 184, 0.05), transparent); border-color: rgba(148, 163, 184, 0.2); }
            .rank-bronze { background: linear-gradient(90deg, rgba(217, 119, 6, 0.05), transparent); border-color: rgba(217, 119, 6, 0.2); }
            .its-me { border-color: var(--accent-text); box-shadow: inset 0 0 10px var(--accent-glow); }
            .its-me .rank-name { color: var(--accent-text); }

            @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
            @media (max-width: 480px) { .stat-value { font-size: 1.8rem !important; } }
        </style>

        <div class="rank-dashboard">
            <div class="rank-header">
                <h2><i class="material-icons-round" style="color:var(--accent);">leaderboard</i> Clasificación del Mes</h2>
                <button onclick="forzarActualizacionRanking()" style="background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); padding: 10px 20px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: bold; box-shadow: var(--shadow-sm);">
                    <i class="material-icons-round" style="font-size: 1.2rem;">sync</i> Sincronizar
                </button>
            </div>

            <div class="rank-filters-box">
                <div style="width: 100%; display: flex; gap: 10px; margin-bottom: 5px;">
                    <button id="btn-rank-dinero" class="toggle-ranking-btn active" onclick="cambiarModoRanking('dinero')">
                        <i class="material-icons-round">attach_money</i> Top por Dinero
                    </button>
                    <button id="btn-rank-cuentas" class="toggle-ranking-btn" onclick="cambiarModoRanking('cuentas')">
                        <i class="material-icons-round">shopping_cart</i> Top por Cuentas
                    </button>
                </div>

                <div class="rank-filter-group" style="flex: 2;">
                    <label>Buscar Cliente:</label>
                    <div style="position: relative;">
                        <input type="text" id="rank-filtro-usuario" placeholder="Busca tu cliente..." autocomplete="off">
                        <i class="material-icons-round" style="position: absolute; right: 10px; top: 12px; color: var(--text-muted); pointer-events: none;">arrow_drop_down</i>
                    </div>
                    <div id="rank-lista-usuarios" class="rank-dropdown-list"></div>
                </div>

                <div class="rank-filter-group" style="flex: 0; min-width: 150px;">
                    <label>Top a Mostrar:</label>
                    <select id="rank-limite">
                        <option value="5">Top 5</option>
                        <option value="10">Top 10</option>
                        <option value="20" selected>Top 20</option>
                        <option value="50">Top 50</option>
                        <option value="999">Todos</option>
                    </select>
                </div>
            </div>

            <div id="ranking-content-body">
                <div style="text-align:center; padding: 60px;">
                    <div class="spinner" style="margin: 0 auto;"></div>
                    <p style="color:var(--text-gray); margin-top:20px; font-family: 'Righteous', sans-serif; letter-spacing: 1px;">CARGANDO DATOS DEL MES...</p>
                </div>
            </div>
        </div>
    `;

    bindEventosFiltrosRanking();
    cargarDatosBaseRanking();
}

window.cambiarModoRanking = function(modo) {
    modoFiltroActual = modo;
    document.getElementById('btn-rank-dinero').classList.remove('active');
    document.getElementById('btn-rank-cuentas').classList.remove('active');
    
    document.getElementById(`btn-rank-${modo}`).classList.add('active');
    ejecutarAnalisisRanking();
};

window.forzarActualizacionRanking = async function() {
    const btn = document.querySelector('.rank-header button');
    btn.innerHTML = `<i class="material-icons-round fa-spin" style="font-size: 1.2rem;">sync</i> Calculando...`;
    btn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL_F}/dw_api.php`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ accion: 'actualizarRankingDiario' })
        });
        const res = await response.json();
        
        if(res.success) {
            localStorage.removeItem('dw_admin_ranking_data'); // Limpiamos caché viejo
            await cargarDatosBaseRanking();
            Toast.fire({ icon: 'success', title: 'Ranking sincronizado al instante.' });
        } else {
            Toast.fire({ icon: 'error', title: res.msg });
        }
    } catch (e) {
        Toast.fire({ icon: 'error', title: 'Fallo al conectar con el servidor.' });
    } finally {
        btn.innerHTML = `<i class="material-icons-round" style="font-size: 1.2rem;">sync</i> Sincronizar`;
        btn.disabled = false;
    }
};

// ==========================================
// 3. PETICIÓN AL SERVIDOR (LECTURA TABLA MATERIALIZED VIEW)
// ==========================================
async function cargarDatosBaseRanking() {
    const cacheKey = 'dw_admin_ranking_data';
    const cacheDateKey = 'dw_admin_ranking_date';
    
    // Forzamos actualización de caché por la fecha local exacta
    const hoyDate = new Date();
    const hoy = `${hoyDate.getFullYear()}-${hoyDate.getMonth()+1}-${hoyDate.getDate()}`;

    const cacheRaw = localStorage.getItem(cacheKey);
    const cacheDate = localStorage.getItem(cacheDateKey);

    if (cacheRaw && cacheDate === hoy) {
        datosRankingCompletos = JSON.parse(cacheRaw);
        usuariosTotalesList = datosRankingCompletos.map(u => u.usuarios).sort((a,b)=>a.localeCompare(b));
        poblarDesplegableUsuariosRanking();
        ejecutarAnalisisRanking();
        return;
    }

    try {
        const response = await fetch(API_RANKING, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({
                accion: 'getRankingAdmin', 
                usuario: sessionStorage.getItem('admin_user'),
                token: sessionStorage.getItem('admin_token')
            })
        });
        
        const res = await response.json();
        
        if (res.success) {
            datosRankingCompletos = res.datos;
            localStorage.setItem(cacheKey, JSON.stringify(datosRankingCompletos));
            localStorage.setItem(cacheDateKey, hoy);

            usuariosTotalesList = datosRankingCompletos.map(u => u.usuarios).sort((a,b)=>a.localeCompare(b));
            
            poblarDesplegableUsuariosRanking();
            ejecutarAnalisisRanking(); 
        } else {
            document.getElementById('ranking-content-body').innerHTML = `<p style="text-align:center; color:var(--danger); font-weight: bold;">Error: ${res.msg}</p>`;
        }
    } catch (error) {
        document.getElementById('ranking-content-body').innerHTML = `<p style="text-align:center; color:var(--danger); font-weight: bold;">Fallo de conexión al servidor.</p>`;
    }
}

// ==========================================
// 4. LÓGICA DEL BUSCADOR DESPLEGABLE
// ==========================================
function poblarDesplegableUsuariosRanking() {
    const dataList = document.getElementById('rank-lista-usuarios');
    const inputUsr = document.getElementById('rank-filtro-usuario');
    if (!dataList || !inputUsr) return;

    let html = `<div class="rank-dropdown-item" data-val="" style="color: var(--text-gray); font-weight: bold;"><i class="material-icons-round">people</i> Borrar Filtro (Ver Todos)</div>`;
    
    usuariosTotalesList.forEach(usr => {
        html += `<div class="rank-dropdown-item" data-val="${usr}"><i class="material-icons-round" style="color: var(--text-muted);">person</i> ${usr}</div>`;
    });
    
    dataList.innerHTML = html;

    dataList.querySelectorAll('.rank-dropdown-item').forEach(item => {
        item.addEventListener('click', function() {
            inputUsr.value = this.dataset.val;
            dataList.style.display = 'none';
            ejecutarAnalisisRanking(); 
        });
    });
}

function bindEventosFiltrosRanking() {
    const inputUsr = document.getElementById('rank-filtro-usuario');
    const dropdownUsr = document.getElementById('rank-lista-usuarios');
    
    if (inputUsr && dropdownUsr) {
        inputUsr.addEventListener('focus', () => { dropdownUsr.style.display = 'block'; });
        inputUsr.addEventListener('click', () => { dropdownUsr.style.display = 'block'; });

        inputUsr.addEventListener('input', function() {
            dropdownUsr.style.display = 'block';
            const val = this.value.toLowerCase().trim();
            
            dropdownUsr.querySelectorAll('.rank-dropdown-item').forEach(item => {
                const text = item.innerText.toLowerCase();
                if (item.dataset.val === "" || text.includes(val)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
            ejecutarAnalisisRanking();
        });

        document.addEventListener('click', (e) => {
            if (!inputUsr.contains(e.target) && !dropdownUsr.contains(e.target)) {
                dropdownUsr.style.display = 'none';
            }
        });
    }

    document.getElementById('rank-limite')?.addEventListener('change', ejecutarAnalisisRanking);
}

// ==========================================
// 5. MOTOR DE RENDERIZADO (POR DINERO O CUENTAS)
// ==========================================
function ejecutarAnalisisRanking() {
    const container = document.getElementById('ranking-content-body');
    if (!container) return;

    const usuarioEspecifico = document.getElementById('rank-filtro-usuario').value.trim().toLowerCase();
    const limiteTop = parseInt(document.getElementById('rank-limite').value) || 10;
    
    const adminUserActual = sessionStorage.getItem('admin_user'); 

    // 1. Mapear datos según el filtro activo (Dinero o Cuentas)
    let rankingArray = datosRankingCompletos.map(u => {
        return {
            usuario: u.usuarios,
            valor: modoFiltroActual === 'dinero' ? (parseFloat(u.saldos) || 0) : (parseInt(u.conteo) || 0)
        };
    });

    // 2. Ordenar Mayor a Menor
    rankingArray.sort((a, b) => b.valor - a.valor); 

    // 3. Obtener "Mi Data" antes de recortar el array
    let miData = { posicion: 0, valor: 0, usuario: adminUserActual };
    const miIndiceReal = rankingArray.findIndex(u => u.usuario === adminUserActual);
    
    if (miIndiceReal !== -1) {
        miData.posicion = miIndiceReal + 1;
        miData.valor = rankingArray[miIndiceReal].valor;
    }

    // 4. Filtrar por usuario específico (Buscador)
    let arrayAVisualizar = [...rankingArray];
    if (usuarioEspecifico !== "") {
        arrayAVisualizar = rankingArray.filter(u => u.usuario.toLowerCase().includes(usuarioEspecifico));
    }

    // 5. Aplicar Límite
    const topFinal = arrayAVisualizar.slice(0, limiteTop);

    // 6. Construir HTML Visual
    renderHTMLRanking(container, topFinal, miData, rankingArray);
}

function renderHTMLRanking(container, topData, miData, rankingCompletoOriginal) {
    container.innerHTML = "";
    const fmt = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const strEtiqueta = modoFiltroActual === 'dinero' ? 'INVERSIÓN MENSUAL' : 'CUENTAS DEL MES';
    const strValorMi = modoFiltroActual === 'dinero' ? `$ ${fmt.format(miData.valor)}` : `${fmt.format(miData.valor)} CTS`;
    const nombreMesActual = new Intl.DateTimeFormat('es-CO', { month: 'long' }).format(new Date()).toUpperCase();

    // --- A. TARJETA DEL USUARIO ACTUAL (MI ESTADÍSTICA) ---
    const divMiStats = document.createElement('div');
    divMiStats.className = 'my-stats-card';
    
    let mensajeAnimo = "¡El mes apenas empieza, a vender se ha dicho!";
    let iconoPosicion = "trending_up";
    let clasePosicion = "";

    if (miData.posicion === 1 && miData.valor > 0) { 
        mensajeAnimo = "¡ERES EL REY DEL MES! 👑"; 
        iconoPosicion = "emoji_events";
        clasePosicion = "rank-1-text";
    } else if (miData.posicion > 0 && miData.posicion <= 3 && miData.valor > 0) {
        mensajeAnimo = "¡Estás en el podio del mes! Mantén el ritmo.";
        iconoPosicion = "military_tech";
    } else if (miData.posicion > 0 && miData.posicion <= 10 && miData.valor > 0) {
        mensajeAnimo = "¡Estás en el Top 10 mensual!";
        iconoPosicion = "star";
    }

    divMiStats.innerHTML = `
        <div class="my-stats-header">
            <div style="display:flex; align-items:center; gap:10px;">
                <span class="material-icons-round" style="color:var(--accent-text);">account_circle</span>
                <span>MI RENDIMIENTO</span>
            </div>
            <span class="mes-badge">${nombreMesActual}</span>
        </div>
        <div class="my-stats-grid">
            <div class="stat-item">
                <div class="stat-label">POSICIÓN GLOBAL</div>
                <div class="stat-value ${clasePosicion}">#${miData.posicion > 0 && miData.valor > 0 ? miData.posicion : '-'}</div>
            </div>
            <div class="stat-item border-left">
                <div class="stat-label">${strEtiqueta}</div>
                <div class="stat-value text-accent" style="font-size: 1.8rem;">${strValorMi}</div>
            </div>
        </div>
        <div class="my-stats-footer">
            <span class="material-icons-round">${iconoPosicion}</span> ${mensajeAnimo}
        </div>
    `;
    container.appendChild(divMiStats);

    // --- B. LISTA DEL TOP ---
    const divLeaderboard = document.createElement('div');
    divLeaderboard.className = 'leaderboard-container';
    
    let tituloTop = document.getElementById('rank-filtro-usuario').value !== "" ? "RESULTADOS DE BÚSQUEDA" : `🏆 CLASIFICACIÓN DEL MES`;
    let htmlList = `<h3 class="leaderboard-title">${tituloTop}</h3><div class="leaderboard-list">`;

    // 🔴 AQUÍ ESTABA EL FILTRO: YA LO QUITÉ PARA MOSTRAR A TODOS INCLUSO CON 0
    if(!topData || topData.length === 0) {
        htmlList += `<div style="text-align:center; padding:40px; color:var(--text-gray);"><i class="material-icons-round" style="font-size:3rem; opacity:0.5; margin-bottom:10px;">receipt_long</i><br>Aún no hay compras registradas en el mes de ${nombreMesActual}.</div>`;
    } else {
        topData.forEach((user, index) => {
            const rankOriginal = rankingCompletoOriginal.findIndex(u => u.usuario === user.usuario) + 1;
            
            let rankClass = "rank-item";
            let iconHtml = `<span class="rank-number">#${rankOriginal}</span>`;
            
            // El color oro, plata o bronce solo se da a los que realmente compraron algo
            if (rankOriginal === 1 && user.valor > 0) {
                rankClass += " rank-gold";
                iconHtml = `<span class="material-icons-round medal-icon gold">emoji_events</span>`;
            } else if (rankOriginal === 2 && user.valor > 0) {
                rankClass += " rank-silver";
                iconHtml = `<span class="material-icons-round medal-icon silver">military_tech</span>`;
            } else if (rankOriginal === 3 && user.valor > 0) {
                rankClass += " rank-bronze";
                iconHtml = `<span class="material-icons-round medal-icon bronze">military_tech</span>`;
            }

            if (user.usuario === miData.usuario) rankClass += " its-me";

            const delay = index * 0.05; 
            
            const strValorLista = modoFiltroActual === 'dinero' ? `$ ${fmt.format(user.valor)}` : `${fmt.format(user.valor)}`;
            const strEtiquetaLista = modoFiltroActual === 'dinero' ? 'Invertido' : 'Cuentas';

            // Damos opacidad baja a los usuarios que tienen 0 compras para distinguirlos
            const styleExtra = user.valor === 0 ? 'opacity: 0.6;' : '';

            htmlList += `
                <div class="${rankClass}" style="animation-delay: ${delay}s; ${styleExtra}">
                    <div class="rank-left">
                        ${iconHtml}
                        <span class="rank-name">${user.usuario}</span>
                    </div>
                    <div class="rank-right">
                        <span class="rank-score">${strValorLista}</span>
                        <span class="rank-label">${strEtiquetaLista}</span>
                    </div>
                </div>
            `;
        });
    }

    htmlList += `</div>`;
    divLeaderboard.innerHTML = htmlList;
    container.appendChild(divLeaderboard);
}
