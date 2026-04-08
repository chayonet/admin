/* =================================================================================
   ARCHIVO: volumen_de_ventas.js
   Lógica: Filtros, Insights IA Avanzados (Dinámicos), Gráficos y Tablas comparativas.
================================================================================= */

let moduloVolumenInicializado = false;
let chartVolumenInstance = null;

// Lista de servicios dinámica obtenida de la base de datos
let serviciosCatalogoDinamico = [];

// ==========================================
// 1. ESCUCHADOR DE NAVEGACIÓN
// ==========================================
document.addEventListener('moduloCargado', (e) => {
    if (e.detail.modulo === 'mod-analisis-volumen') {
        initVolumenVentas();
    }
});

// ==========================================
// 2. INICIALIZACIÓN DEL MÓDULO Y DEPENDENCIA
// ==========================================
async function initVolumenVentas() {
    if (moduloVolumenInicializado) return;
    
    const seccion = document.getElementById('mod-analisis-volumen');
    if (!seccion) return;

    // Mostrar loader mientras se carga todo
    seccion.innerHTML = `<div style="text-align:center; padding: 50px;"><i class="material-icons-round" style="animation: spin 1s linear infinite; font-size: 3rem; color: var(--accent);">psychology</i><p style="color:var(--text-gray); margin-top:15px;">Iniciando motor de Inteligencia Artificial...</p></div>`;

    // 1. Asegurarse de que Chart.js esté cargado
    await cargarChartJS();

    // 2. Obtener los servicios REALES de la base de datos
    await cargarServiciosReales();

    // 3. Renderizar toda la interfaz con los servicios correctos
    renderizarUIVolumen(seccion);
    bindEventosVolumen();
    
    // Ejecutar el primer análisis por defecto
    ejecutarAnalisisVolumen();
    
    moduloVolumenInicializado = true;
}

function cargarChartJS() {
    return new Promise((resolve, reject) => {
        if (window.Chart) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Fallo al cargar Chart.js'));
        document.head.appendChild(script);
    });
}

async function cargarServiciosReales() {
    try {
        const response = await fetch(`${API_BASE_URL_F}/admin_api.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                accion: 'getServiciosAdmin',
                usuario: sessionStorage.getItem('admin_user'),
                token: sessionStorage.getItem('admin_token')
            })
        });
        const res = await response.json();
        
        if (res.success && Array.isArray(res.datos)) {
            // Extraer solo los nombres de los servicios disponibles en la BD
            serviciosCatalogoDinamico = res.datos.map(srv => srv.nombre);
        } else {
            console.error("No se pudieron cargar los servicios para el filtro.");
            serviciosCatalogoDinamico = [];
        }
    } catch (e) {
        console.error("Error cargando servicios:", e);
        serviciosCatalogoDinamico = [];
    }
}

// ==========================================
// 3. GENERACIÓN DE INTERFAZ (UI)
// ==========================================
function renderizarUIVolumen(contenedor) {
    
    let checkboxesHTML = '';
    
    if (serviciosCatalogoDinamico.length === 0) {
        checkboxesHTML = `<span style="color: var(--text-muted); font-size: 0.9rem;">No hay servicios configurados en el sistema.</span>`;
    } else {
        checkboxesHTML = serviciosCatalogoDinamico.map(srv => `
            <label class="vol-checkbox-label">
                <input type="checkbox" value="${srv}" checked class="vol-servicio-cb">
                <span>${srv}</span>
            </label>
        `).join('');
    }

    const hoy = new Date();
    const hace7Dias = new Date(hoy); hace7Dias.setDate(hoy.getDate() - 7);
    const hace14Dias = new Date(hoy); hace14Dias.setDate(hoy.getDate() - 14);

    const formatFecha = (d) => d.toISOString().split('T')[0];

    const uiHTML = `
        <style>
            .vol-dashboard { display: flex; flex-direction: column; gap: 25px; color: var(--text-main); }
            .vol-header { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }
            .vol-header h2 { margin: 0; color: var(--text-main); font-size: 1.8rem; font-family: 'Righteous', cursive; letter-spacing: 1px; }
            
            .vol-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 25px; box-shadow: var(--shadow-sm); }
            
            .vol-filters-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px; }
            .vol-filter-group { display: flex; flex-direction: column; gap: 8px; }
            .vol-filter-group label { font-size: 0.85rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
            .vol-filter-group input[type="date"], .vol-filter-group select { padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-dark); color: var(--text-main); outline: none; font-family: monospace; font-size: 1rem; }
            
            .vol-servicios-container { display: flex; flex-wrap: wrap; gap: 10px; background: var(--bg-dark); padding: 15px; border-radius: 8px; border: 1px dashed var(--border-color); max-height: 120px; overflow-y: auto; }
            .vol-checkbox-label { display: flex; align-items: center; gap: 6px; font-size: 0.9rem; cursor: pointer; color: var(--text-main); background: var(--bg-card); padding: 6px 12px; border-radius: 20px; border: 1px solid var(--border-color); transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
            .vol-checkbox-label:hover { border-color: var(--accent); color: var(--accent); }
            
            .vol-btn-analizar { background: linear-gradient(135deg, #8b5cf6, #3b82f6); color: white; border: none; padding: 14px 24px; border-radius: 8px; font-weight: 800; font-size: 1.05rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: transform 0.2s; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3); width: 100%; margin-top: 10px; }
            .vol-btn-analizar:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4); filter: brightness(1.1); }
            
            /* Contenedor AI Premium */
            .vol-insights-box { background: linear-gradient(145deg, rgba(139, 92, 246, 0.05), rgba(59, 130, 246, 0.05)); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 12px; padding: 25px; box-shadow: inset 0 2px 10px rgba(0,0,0,0.02); position: relative; overflow: hidden; }
            .vol-insights-box::before { content: ""; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: linear-gradient(to bottom, #8b5cf6, #3b82f6); }
            .vol-insights-title { display: flex; align-items: center; gap: 10px; color: var(--accent); font-weight: 900; font-size: 1.3rem; margin-top: 0; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px dashed rgba(139, 92, 246, 0.2); padding-bottom: 15px; }
            
            /* AI Executive Summary */
            .ai-executive-summary { font-size: 1.05rem; line-height: 1.6; color: var(--text-main); margin-bottom: 25px; padding: 18px; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border-color); font-style: normal; position: relative; }
            .ai-executive-summary strong { color: var(--accent); font-weight: 900; }

            .insights-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 15px; }
            .vol-insight-item { display: flex; align-items: flex-start; gap: 12px; padding: 18px; border-radius: 8px; font-size: 0.95rem; line-height: 1.5; background: var(--bg-card); border-left: 4px solid transparent; box-shadow: 0 2px 5px rgba(0,0,0,0.03); transition: transform 0.2s; }
            .vol-insight-item:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
            .vol-insight-item i { font-size: 1.5rem; }
            
            /* Tipos de Insights */
            .insight-positive { border-left-color: #10b981; }
            .insight-positive i { color: #10b981; }
            .insight-negative { border-left-color: #ef4444; }
            .insight-negative i { color: #ef4444; }
            .insight-neutral { border-left-color: #f59e0b; }
            .insight-neutral i { color: #f59e0b; }
            .insight-info { border-left-color: #3b82f6; }
            .insight-info i { color: #3b82f6; }
            .insight-star { border-left-color: #8b5cf6; background: rgba(139, 92, 246, 0.05); }
            .insight-star i { color: #8b5cf6; }
            
            .vol-chart-container { position: relative; height: 400px; width: 100%; margin-top: 15px; }
            
            /* Estilos Tablas Premium */
            .vol-table { width: 100%; border-collapse: separate; border-spacing: 0 5px; margin-top: 10px; }
            .vol-table th { padding: 12px 15px; text-align: left; background: transparent; color: var(--text-muted); font-weight: 800; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px; border-bottom: 2px solid var(--border-color); }
            .vol-table td { padding: 15px; background: var(--bg-dark); color: var(--text-main); font-size: 0.95rem; font-weight: 500; border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); }
            .vol-table td:first-child { border-left: 1px solid var(--border-color); border-top-left-radius: 8px; border-bottom-left-radius: 8px; }
            .vol-table td:last-child { border-right: 1px solid var(--border-color); border-top-right-radius: 8px; border-bottom-right-radius: 8px; }
            .vol-table tr:hover td { background: var(--bg-card); box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
            
            .text-right { text-align: right !important; }
            .text-center { text-align: center !important; }
            .badge-var-pos { background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 0.8rem; }
            .badge-var-neg { background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 0.8rem; }
            .badge-var-neu { background: rgba(148, 163, 184, 0.1); color: #94a3b8; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 0.8rem; }
            
            /* Barras de progreso en la tabla */
            .progress-bar-bg { width: 100%; background: rgba(0,0,0,0.05); height: 6px; border-radius: 3px; margin-top: 8px; overflow: hidden; }
            .progress-bar-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--accent), #60a5fa); transition: width 0.5s ease; }
            body.dark-mode .progress-bar-bg { background: rgba(255,255,255,0.05); }

            /* Toggle Switch P2 */
            .switch-container { display: flex; align-items: center; justify-content: space-between; background: var(--bg-dark); padding: 10px 15px; border-radius: 8px; border: 1px solid var(--border-color); cursor: pointer; }
            .switch-container label { cursor: pointer; font-weight: bold; color: var(--accent); margin: 0; display: flex; align-items: center; gap: 8px; }
            .switch-container input { width: 18px; height: 18px; accent-color: var(--accent); cursor: pointer; }
        </style>

        <div class="vol-dashboard">
            <div class="vol-header">
                <i class="material-icons-round">query_stats</i>
                <h2>Análisis de Volumen de Ventas</h2>
            </div>

            <div class="vol-card">
                <div class="vol-filters-grid">
                    <div class="vol-filter-group">
                        <label>Agrupar Gráfica por</label>
                        <select id="vol-agrupacion">
                            <option value="dia">Día</option>
                            <option value="semana">Semana</option>
                            <option value="mes">Mes</option>
                        </select>
                    </div>

                    <div class="vol-filter-group">
                        <label>Período 1 (Análisis Principal)</label>
                        <div style="display: flex; gap: 10px;">
                            <input type="date" id="vol-p1-start" value="${formatFecha(hace7Dias)}" style="width: 50%;">
                            <input type="date" id="vol-p1-end" value="${formatFecha(hoy)}" style="width: 50%;">
                        </div>
                    </div>

                    <div class="vol-filter-group">
                        <div class="switch-container" id="container-toggle-p2">
                            <label for="vol-enable-p2"><i class="material-icons-round">compare_arrows</i> Activar Período 2 (Comparativa)</label>
                            <input type="checkbox" id="vol-enable-p2" checked>
                        </div>
                        <div id="vol-p2-inputs" style="display: flex; gap: 10px; margin-top: 8px; transition: opacity 0.3s;">
                            <input type="date" id="vol-p2-start" value="${formatFecha(hace14Dias)}" style="width: 50%;">
                            <input type="date" id="vol-p2-end" value="${formatFecha(hace7Dias)}" style="width: 50%;">
                        </div>
                    </div>
                </div>

                <div class="vol-filter-group">
                    <label>Filtro de Servicios a Incluir</label>
                    <div class="vol-servicios-container" id="vol-servicios-wrapper">
                        ${checkboxesHTML}
                    </div>
                </div>

                <button id="vol-btn-analizar" class="vol-btn-analizar">
                    <i class="material-icons-round">psychology</i> Ejecutar Análisis IA
                </button>
            </div>

            <div id="vol-insights-container" class="vol-insights-box" style="display: none;">
                <h3 class="vol-insights-title"><i class="material-icons-round">auto_awesome</i> Diagnóstico Estratégico IA</h3>
                <div id="ai-executive-summary" class="ai-executive-summary"></div>
                <div id="vol-insights-content" class="insights-grid"></div>
            </div>

            <div class="vol-card">
                <h3 style="margin-top:0; color:var(--text-main); font-size:1.1rem; border-bottom: 1px dashed var(--border-color); padding-bottom: 10px;"><i class="material-icons-round" style="vertical-align: middle; color:var(--accent);">show_chart</i> Tendencia de Volumen</h3>
                <div class="vol-chart-container">
                    <canvas id="volChartCanvas"></canvas>
                </div>
            </div>
            
            <div class="vol-card" style="padding-top: 15px;">
                <h3 style="margin-top:0; color:var(--text-main); font-size:1.1rem; padding-bottom: 15px;"><i class="material-icons-round" style="vertical-align: middle; color:var(--accent);">table_chart</i> Desglose Financiero por Servicio</h3>
                <div style="overflow-x: auto;">
                    <table class="vol-table" id="vol-data-table">
                        </table>
                </div>
            </div>
        </div>
    `;

    contenedor.innerHTML = uiHTML;
}

// ==========================================
// 4. BINDEO DE EVENTOS
// ==========================================
function bindEventosVolumen() {
    const btnAnalizar = document.getElementById('vol-btn-analizar');
    const chkEnableP2 = document.getElementById('vol-enable-p2');
    const divP2Inputs = document.getElementById('vol-p2-inputs');
    const inputP2Start = document.getElementById('vol-p2-start');
    const inputP2End = document.getElementById('vol-p2-end');

    if (btnAnalizar) {
        btnAnalizar.addEventListener('click', ejecutarAnalisisVolumen);
    }

    if (chkEnableP2) {
        chkEnableP2.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            divP2Inputs.style.opacity = isChecked ? '1' : '0.4';
            divP2Inputs.style.pointerEvents = isChecked ? 'auto' : 'none';
            inputP2Start.disabled = !isChecked;
            inputP2End.disabled = !isChecked;
        });
    }
}

// ==========================================
// 5. OBTENER DATOS DE LA BASE DE DATOS
// ==========================================
async function fetchVentasRealData(p1Start, p1End, p2Start, p2End, servicios) {
    try {
        const response = await fetch(`${API_BASE_URL_F}/admin_api.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                accion: 'getAnalisisVolumen',
                usuario: sessionStorage.getItem('admin_user'),
                token: sessionStorage.getItem('admin_token')
            })
        });
        
        const res = await response.json();
        
        if (res.success) {
            const todosLosDatos = res.datos;
            const tP1Start = new Date(p1Start).getTime();
            const tP1End = new Date(p1End).getTime() + 86400000; 
            
            const isP2Enabled = p2Start !== p1Start || p2End !== p1End;
            const tP2Start = isP2Enabled ? new Date(p2Start).getTime() : null;
            const tP2End = isP2Enabled ? new Date(p2End).getTime() + 86400000 : null;

            const datosFiltradosBD = todosLosDatos.filter(item => {
                if (item.Vendida !== 'Si' || !item.FechaVenta) return false; 
                if (servicios.length > 0 && !servicios.includes(item.Servicio)) return false; 

                const dVenta = new Date(item.FechaVenta).getTime();
                const inP1 = dVenta >= tP1Start && dVenta <= tP1End;
                const inP2 = isP2Enabled ? (dVenta >= tP2Start && dVenta <= tP2End) : false;

                return inP1 || inP2;
            });

            return datosFiltradosBD.map(d => ({
                fecha_venta: d.FechaVenta,
                servicio_nombre: d.Servicio,
                precio: parseFloat(d.precio_compra) || parseFloat(d.precio) || 0 
            }));

        } else {
            console.error("Error del servidor:", res.msg);
            alert("No se pudieron cargar los datos: " + res.msg);
            return [];
        }
    } catch (error) {
        console.error("Error en Fetch BD:", error);
        alert("Error de conexión al cargar los datos reales.");
        return [];
    }
}

// ==========================================
// 6. ORQUESTADOR DE ANÁLISIS
// ==========================================
async function ejecutarAnalisisVolumen() {
    const btn = document.getElementById('vol-btn-analizar');
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '<i class="material-icons-round" style="animation: spin 1s linear infinite;">autorenew</i> Procesando Datos...';
    btn.disabled = true;

    const agrupacion = document.getElementById('vol-agrupacion').value;
    const p1Start = document.getElementById('vol-p1-start').value;
    const p1End = document.getElementById('vol-p1-end').value;
    
    const isP2Enabled = document.getElementById('vol-enable-p2').checked;
    const p2Start = document.getElementById('vol-p2-start').value;
    const p2End = document.getElementById('vol-p2-end').value;

    const cbServicios = document.querySelectorAll('.vol-servicio-cb:checked');
    const serviciosSeleccionados = Array.from(cbServicios).map(cb => cb.value);

    if (serviciosSeleccionados.length === 0) {
        alert("El motor de análisis requiere al menos un servicio seleccionado.");
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
        return;
    }

    try {
        const datosCrudos = await fetchVentasRealData(
            p1Start, 
            p1End, 
            isP2Enabled ? p2Start : p1Start, 
            isP2Enabled ? p2End : p1End, 
            serviciosSeleccionados
        );
        
        const tP1Start = new Date(p1Start).getTime();
        const tP1End = new Date(p1End).getTime() + 86400000;
        const p1Datos = datosCrudos.filter(d => new Date(d.fecha_venta).getTime() >= tP1Start && new Date(d.fecha_venta).getTime() <= tP1End);
        
        let p2Datos = [];
        if (isP2Enabled) {
            const tP2Start = new Date(p2Start).getTime();
            const tP2End = new Date(p2End).getTime() + 86400000;
            p2Datos = datosCrudos.filter(d => new Date(d.fecha_venta).getTime() >= tP2Start && new Date(d.fecha_venta).getTime() <= tP2End);
        }

        const dataProcesada = procesarDatosParaGrafico(p1Datos, p2Datos, isP2Enabled, agrupacion);
        renderizarGraficoVolumen(dataProcesada.labels, dataProcesada.p1Valores, dataProcesada.p2Valores, isP2Enabled, agrupacion);
        
        // Ejecutar motor IA Dinámico
        generarInsightsInteligentes(p1Datos, p2Datos, isP2Enabled, serviciosSeleccionados, p1Start, p1End);

        // Renderizar Tablas Completas
        renderizarTablasVolumen(p1Datos, p2Datos, isP2Enabled, serviciosSeleccionados);
        
    } catch (error) {
        console.error("Error en el análisis de volumen:", error);
    } finally {
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
    }
}

// ==========================================
// 7. PROCESAMIENTO DE DATOS PARA CHART.JS
// ==========================================
function procesarDatosParaGrafico(p1Datos, p2Datos, isP2Enabled, agrupacion) {
    const getGroupKey = (dateString, tipo) => {
        if(!dateString) return 'Desconocido';
        const d = new Date(dateString);
        if (tipo === 'dia') return d.toISOString().split('T')[0];
        if (tipo === 'mes') return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        if (tipo === 'semana') {
            const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
            const pastDaysOfYear = (d - firstDayOfYear) / 86400000;
            const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
            return `${d.getFullYear()}-W${weekNum}`;
        }
        return d.toISOString().split('T')[0];
    };

    const mapP1 = {};
    const mapP2 = {};

    p1Datos.forEach(item => {
        const key = getGroupKey(item.fecha_venta, agrupacion);
        mapP1[key] = (mapP1[key] || 0) + 1;
    });

    if (isP2Enabled) {
        p2Datos.forEach(item => {
            const key = getGroupKey(item.fecha_venta, agrupacion);
            mapP2[key] = (mapP2[key] || 0) + 1;
        });
    }

    const sortedKeysP1 = Object.keys(mapP1).sort();
    const sortedKeysP2 = Object.keys(mapP2).sort();

    const maxLen = isP2Enabled ? Math.max(sortedKeysP1.length, sortedKeysP2.length) : sortedKeysP1.length;
    const labelsRelativos = [];
    const p1Valores = [];
    const p2Valores = [];

    let prefijo = agrupacion === 'dia' ? 'Día' : (agrupacion === 'semana' ? 'Semana' : 'Mes');

    for (let i = 0; i < maxLen; i++) {
        labelsRelativos.push(`${prefijo} ${i + 1}`);
        const keyP1 = sortedKeysP1[i];
        p1Valores.push(keyP1 ? mapP1[keyP1] : 0);

        if (isP2Enabled) {
            const keyP2 = sortedKeysP2[i];
            p2Valores.push(keyP2 ? mapP2[keyP2] : 0);
        }
    }

    return { labels: labelsRelativos, p1Valores, p2Valores };
}

// ==========================================
// 8. RENDERIZADO DEL GRÁFICO (CHART.JS)
// ==========================================
function renderizarGraficoVolumen(labels, p1Data, p2Data, isP2Enabled, agrupacion) {
    const ctx = document.getElementById('volChartCanvas').getContext('2d');
    
    if (chartVolumenInstance) {
        chartVolumenInstance.destroy();
    }

    const gradientP1 = ctx.createLinearGradient(0, 0, 0, 400);
    gradientP1.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
    gradientP1.addColorStop(1, 'rgba(139, 92, 246, 0.0)');

    const datasets = [{
        label: 'Volumen Principal',
        data: p1Data,
        borderColor: '#8b5cf6',
        backgroundColor: gradientP1,
        borderWidth: 3,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#8b5cf6',
        pointBorderWidth: 2,
        pointRadius: 4,
        fill: true,
        tension: 0.4
    }];

    if (isP2Enabled) {
        const gradientP2 = ctx.createLinearGradient(0, 0, 0, 400);
        gradientP2.addColorStop(0, 'rgba(148, 163, 184, 0.3)');
        gradientP2.addColorStop(1, 'rgba(148, 163, 184, 0.0)');

        datasets.push({
            label: 'Volumen Comparativo',
            data: p2Data,
            borderColor: '#94a3b8',
            backgroundColor: gradientP2,
            borderWidth: 2,
            borderDash: [5, 5],
            pointBackgroundColor: '#fff',
            pointBorderColor: '#94a3b8',
            pointBorderWidth: 2,
            pointRadius: 3,
            fill: true,
            tension: 0.4
        });
    }

    chartVolumenInstance = new Chart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { font: { family: "'Inter', sans-serif", weight: 'bold' }, color: '#475569' } },
                tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 10, cornerRadius: 8 }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)', borderDash: [5, 5] } },
                x: { grid: { display: false } }
            },
            interaction: { mode: 'index', intersect: false }
        }
    });
}

// ==========================================
// 9. MOTOR DE RECOMENDACIONES E INSIGHTS (IA LÓGICA EXTENDIDA Y DINÁMICA)
// ==========================================
function generarInsightsInteligentes(p1Datos, p2Datos, isP2Enabled, serviciosFiltro, p1Start, p1End) {
    const contenedorInsights = document.getElementById('vol-insights-container');
    const contentInsights = document.getElementById('vol-insights-content');
    const summaryAI = document.getElementById('ai-executive-summary');
    
    contenedorInsights.style.display = 'block';
    
    const fmtMoneda = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
    const insights = []; 
    
    const createInsight = (type, icon, html) => {
        insights.push(`<div class="vol-insight-item insight-${type}"><i class="material-icons-round">${icon}</i> <span>${html}</span></div>`);
    };

    const totalP1 = p1Datos.length;
    const totalP2 = p2Datos.length;
    
    const ingresosTotalesP1 = p1Datos.reduce((acc, curr) => acc + (parseFloat(curr.precio) || 0), 0);
    const ingresosTotalesP2 = p2Datos.reduce((acc, curr) => acc + (parseFloat(curr.precio) || 0), 0);

    const d1 = new Date(p1Start);
    const d2 = new Date(p1End);
    const diffDays = Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)) + 1;

    // --- MANEJO DE SIN DATOS ---
    if (totalP1 === 0) {
        summaryAI.innerHTML = `<span style="font-size:1.2rem; display:inline-block; margin-bottom:5px;">🔍</span><br>He escaneado el rango de fechas seleccionado y <strong>no detecto movimiento transaccional</strong>. Mi recomendación es revisar el abastecimiento del inventario o evaluar si existen cuellos de botella en la adquisición de clientes durante este ciclo.`;
        contentInsights.innerHTML = `<div class="vol-insight-item insight-negative"><i class="material-icons-round">error_outline</i> <span><strong>Anomalía Crítica:</strong> Volumetría comercial en cero absoluto.</span></div>`;
        return; 
    }

    // ==========================================
    // ANÁLISIS DE PRODUCTOS INDIVIDUALES (REVENUE & VOLUME)
    // ==========================================
    const statsSrvP1 = {};
    serviciosFiltro.forEach(s => { statsSrvP1[s] = { vol: 0, ingresos: 0 }; });

    p1Datos.forEach(d => { 
        if (statsSrvP1[d.servicio_nombre] !== undefined) {
            statsSrvP1[d.servicio_nombre].vol++; 
            statsSrvP1[d.servicio_nombre].ingresos += (parseFloat(d.precio) || 0);
        }
    });

    let topVolProduct = null; let maxVol = -1;
    let topRevProduct = null; let maxRev = -1;
    const serviciosMuertos = [];
    let serviciosOrdenadosXIngresos = [];

    for (const [srv, data] of Object.entries(statsSrvP1)) {
        if (data.vol > maxVol) { maxVol = data.vol; topVolProduct = srv; }
        if (data.ingresos > maxRev) { maxRev = data.ingresos; topRevProduct = srv; }
        if (data.vol === 0) serviciosMuertos.push(srv);
        
        if (data.ingresos > 0) {
            serviciosOrdenadosXIngresos.push({ srv, ingresos: data.ingresos });
        }
    }
    serviciosOrdenadosXIngresos.sort((a, b) => b.ingresos - a.ingresos);

    // ==========================================
    // GENERACIÓN DE RESUMEN EJECUTIVO IA (CON VARIACIONES SEMÁNTICAS)
    // ==========================================
    
    // Arrays de frases para darle naturalidad y variedad a la IA
    const frasesApertura = [
        "Diagnóstico completado.", "Análisis de métricas finalizado.", 
        "He procesado los datos de tu ecosistema.", "Resultados de la auditoría comercial:"
    ];
    const frasesCierrePositivo = [
        "El panorama es alentador.", "Las estrategias de retención están dando frutos.", 
        "Mantén la presión comercial en los productos estrella."
    ];
    const frasesCierreNegativo = [
        "Te sugiero revisar las campañas de marketing activas.", "Es un buen momento para aplicar promociones cruzadas.", 
        "La alerta temprana indica una posible fuga de capital."
    ];

    // Función para obtener un string aleatorio de un array
    const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    let resumenTexto = `<span style="font-size:1.2rem; display:inline-block; margin-bottom:5px;">📊</span><br><strong>${getRandom(frasesApertura)}</strong> Durante este ciclo, se han concretado <strong>${totalP1} activaciones</strong>, inyectando un total de <strong>${fmtMoneda.format(ingresosTotalesP1)}</strong> en ingresos líquidos. `;
    
    if (isP2Enabled && totalP2 > 0) {
        let diffRev = ingresosTotalesP1 - ingresosTotalesP2;
        let pctRev = ((diffRev / ingresosTotalesP2) * 100).toFixed(1);
        if (diffRev > 0) {
            resumenTexto += `Comparativamente, detecto una <span style="color:#10b981; font-weight:bold; background: rgba(16, 185, 129, 0.1); padding: 2px 6px; border-radius: 4px;">tendencia de expansión (+${pctRev}%)</span> frente al período anterior. ${getRandom(frasesCierrePositivo)} `;
        } else if (diffRev < 0) {
            resumenTexto += `Sin embargo, se registra una <span style="color:#ef4444; font-weight:bold; background: rgba(239, 68, 68, 0.1); padding: 2px 6px; border-radius: 4px;">contracción del ${Math.abs(pctRev)}%</span> respecto al ciclo base. ${getRandom(frasesCierreNegativo)} `;
        } else {
            resumenTexto += `La métrica de ingresos se mantiene <span style="color:#f59e0b; font-weight:bold;">completamente plana (0%)</span> frente al ciclo base. `;
        }
    }
    
    if (topRevProduct) {
        resumenTexto += `A nivel de inventario, <strong>${topRevProduct}</strong> destaca como tu activo de mayor jerarquía financiera.`;
    }
    summaryAI.innerHTML = resumenTexto;

    // ==========================================
    // INSIGHTS ESPECÍFICOS (ARPU, PARETO, TRACCIÓN)
    // ==========================================

    // 1. TICKET PROMEDIO (ARPU)
    let ticketPromedioP1 = ingresosTotalesP1 / totalP1;
    let textoTicket = `<strong>Métrica de ARPU (Gasto Promedio):</strong> Tu cliente promedio desembolsa <strong>${fmtMoneda.format(ticketPromedioP1)}</strong> por transacción.`;
    if (isP2Enabled && totalP2 > 0) {
        let ticketPromedioP2 = ingresosTotalesP2 / totalP2;
        if (ticketPromedioP1 > ticketPromedioP2) {
            textoTicket += ` Has logrado escalar el margen de gasto por usuario respecto al ciclo pasado.`;
            createInsight('star', 'insights', textoTicket);
        } else {
            textoTicket += ` El modelo alerta una reducción en el gasto por ticket. Tu audiencia está migrando hacia opciones más económicas.`;
            createInsight('warning', 'trending_down', textoTicket);
        }
    } else {
        createInsight('info', 'shopping_basket', textoTicket);
    }

    // 2. REGLA DEL 80/20 (PARETO)
    let umbral80 = ingresosTotalesP1 * 0.8;
    let sumaAcumulada = 0;
    let serviciosPareto = [];
    
    for (let item of serviciosOrdenadosXIngresos) {
        sumaAcumulada += item.ingresos;
        serviciosPareto.push(item.srv);
        if (sumaAcumulada >= umbral80) break;
    }

    let pctCatalogoPareto = ((serviciosPareto.length / serviciosFiltro.length) * 100).toFixed(0);
    
    if (pctCatalogoPareto < 40) {
        createInsight('negative', 'pie_chart', `<strong>Riesgo de Dependencia:</strong> El 80% de tu facturación recae estructuralmente en apenas <strong>${serviciosPareto.length} producto(s)</strong> (${serviciosPareto.join(', ')}). Es imperativo diversificar.`);
    } else {
        createInsight('positive', 'donut_large', `<strong>Distribución Sana:</strong> Los algoritmos muestran un catálogo robusto. Tu flujo de capital no depende de un solo servicio, reduciendo vulnerabilidades.`);
    }

    // 3. VELOCIDAD DE TRACCIÓN
    const velDiaria = (totalP1 / diffDays).toFixed(1);
    if (velDiaria > 15) {
        createInsight('positive', 'speed', `<strong>Tracción en Escala:</strong> Flujo dinámico sostenido de <strong>${velDiaria} ventas diarias</strong>. Tu ecosistema posee alta rotación.`);
    } else {
        createInsight('neutral', 'av_timer', `<strong>Rotación Estándar:</strong> El sistema procesa un promedio de <strong>${velDiaria} activaciones al día</strong>.`);
    }

    // 4. PESO MUERTO
    if (serviciosMuertos.length > 0 && serviciosMuertos.length < serviciosFiltro.length) {
        // Rotamos de forma aleatoria los servicios muertos para que no siempre diga los mismos 3
        const shuffedMuertos = serviciosMuertos.sort(() => 0.5 - Math.random());
        const srvNames = shuffedMuertos.slice(0, 3).join(', ') + (shuffedMuertos.length > 3 ? '...' : '');
        createInsight('neutral', 'inventory_2', `<strong>Inventario Inactivo:</strong> Servicios como <strong>${srvNames}</strong> no han registrado volumen en este corte.`);
    }

    contentInsights.innerHTML = insights.join('');
}

// ==========================================
// 10. RENDERIZADO DE TABLAS EXACTAS CON BARRAS (CON INGRESOS P2 EXPLICITOS)
// ==========================================
function renderizarTablasVolumen(p1Datos, p2Datos, isP2Enabled, serviciosFiltro) {
    const tableEl = document.getElementById('vol-data-table');
    const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
    
    let stats = {};
    let totalP1 = 0;
    let totalP2 = 0;
    let totalDineroP1 = 0;
    let totalDineroP2 = 0;

    serviciosFiltro.forEach(s => stats[s] = { p1: 0, p2: 0, dineroP1: 0, dineroP2: 0 });

    p1Datos.forEach(d => { 
        if(stats[d.servicio_nombre] !== undefined) {
            stats[d.servicio_nombre].p1++; 
            stats[d.servicio_nombre].dineroP1 += (parseFloat(d.precio) || 0);
            totalP1++;
            totalDineroP1 += (parseFloat(d.precio) || 0);
        }
    });

    if(isP2Enabled) {
        p2Datos.forEach(d => { 
            if(stats[d.servicio_nombre] !== undefined) {
                stats[d.servicio_nombre].p2++;
                stats[d.servicio_nombre].dineroP2 += (parseFloat(d.precio) || 0);
                totalP2++;
                totalDineroP2 += (parseFloat(d.precio) || 0);
            }
        });
    }

    // Obtener el máximo de ingresos para renderizar la barra de progreso basada en dinero (es más preciso)
    const maxRev = Math.max(...Object.values(stats).map(s => s.dineroP1));

    // Cabeceras (AÑADIDO "INGRESOS P2" EXPLÍCITAMENTE)
    let theadHTML = `
        <thead>
            <tr>
                <th style="width: 25%;">Servicio Mapeado</th>
                <th class="text-center" style="width: 15%;">Activaciones P1</th>
                <th class="text-right" style="width: 15%;">Ingresos P1</th>
                ${isP2Enabled ? `<th class="text-center" style="width: 15%;">Activ. P2</th><th class="text-right" style="width: 15%;">Ingresos P2</th><th class="text-right" style="width: 15%;">Variación</th>` : ''}
            </tr>
        </thead>
    `;

    // Cuerpo
    let tbodyHTML = `<tbody>`;

    // Ordenar para mostrar los que más ingresos generan primero
    let statsArray = Object.keys(stats).map(key => ({ srv: key, ...stats[key] }));
    statsArray.sort((a, b) => b.dineroP1 - a.dineroP1);

    for (const item of statsArray) {
        let diffHTML = '';
        if (isP2Enabled) {
            let moneyDiff = item.dineroP1 - item.dineroP2;
            let pctDiff = item.dineroP2 > 0 ? ((moneyDiff / item.dineroP2) * 100).toFixed(1) : (item.dineroP1 > 0 ? 100 : 0);
            
            let badgeClass = 'badge-var-neu';
            let signo = '';
            if (moneyDiff > 0) { badgeClass = 'badge-var-pos'; signo = '+'; }
            else if (moneyDiff < 0) { badgeClass = 'badge-var-neg'; }

            // SE AGREGÓ LA COLUMNA DE DINEROP2
            diffHTML = `
                <td class="text-center" style="color: var(--text-gray); font-family: monospace; font-size: 1.1rem;">${item.p2}</td>
                <td class="text-right" style="color: var(--text-muted); font-family: monospace; font-size: 1.05rem;">${fmt.format(item.dineroP2)}</td>
                <td class="text-right"><span class="${badgeClass}">${signo}${fmt.format(moneyDiff)} (${signo}${pctDiff}%)</span></td>
            `;
        }

        // Mini Gráfica de Barras para el Volumen (basada en ingresos)
        let barWidth = maxRev > 0 ? (item.dineroP1 / maxRev) * 100 : 0;
        let barHTML = `
            <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${barWidth}%;"></div>
            </div>
        `;

        tbodyHTML += `
            <tr>
                <td>
                    <div style="font-weight: 800; color: var(--text-main); font-size: 1rem;"><i class="material-icons-round" style="font-size:1rem; vertical-align:middle; color:var(--accent); margin-right:5px;">auto_awesome_mosaic</i> ${item.srv}</div>
                    ${barHTML}
                </td>
                <td class="text-center" style="font-family: monospace; font-size: 1.2rem; color: var(--text-main); font-weight: 900;">${item.p1}</td>
                <td class="text-right" style="font-family: monospace; font-size: 1.15rem; color: var(--success); font-weight: bold;">${fmt.format(item.dineroP1)}</td>
                ${isP2Enabled ? diffHTML : ''}
            </tr>
        `;
    }

    // Fila Global
    let totalDiffHTML = '';
    if (isP2Enabled) {
        let tMoneyDiff = totalDineroP1 - totalDineroP2;
        let tPctDiff = totalDineroP2 > 0 ? ((tMoneyDiff / totalDineroP2) * 100).toFixed(1) : (totalDineroP1 > 0 ? 100 : 0);
        
        let tBadgeClass = 'badge-var-neu';
        let tSigno = '';
        if (tMoneyDiff > 0) { tBadgeClass = 'badge-var-pos'; tSigno = '+'; }
        else if (tMoneyDiff < 0) { tBadgeClass = 'badge-var-neg'; }

        // SE AGREGÓ LA COLUMNA DE TOTAL DINEROP2
        totalDiffHTML = `
            <td class="text-center" style="font-family: monospace; font-size: 1.3rem; font-weight: 900; color: var(--text-gray);">${totalP2}</td>
            <td class="text-right" style="font-family: monospace; font-size: 1.3rem; font-weight: 900; color: var(--text-muted);">${fmt.format(totalDineroP2)}</td>
            <td class="text-right"><span class="${tBadgeClass}">${tSigno}${fmt.format(tMoneyDiff)} (${tSigno}${tPctDiff}%)</span></td>
        `;
    }

    tbodyHTML += `
        <tr>
            <td style="font-weight: 900; text-transform: uppercase; font-size: 1.1rem; color: var(--accent);">📊 Consolidado Global</td>
            <td class="text-center" style="font-family: monospace; font-size: 1.4rem; font-weight: 900; color: var(--text-main);">${totalP1}</td>
            <td class="text-right" style="font-family: monospace; font-size: 1.4rem; font-weight: 900; color: var(--success);">${fmt.format(totalDineroP1)}</td>
            ${isP2Enabled ? totalDiffHTML : ''}
        </tr>
    </tbody>`;

    tableEl.innerHTML = theadHTML + tbodyHTML;
}
