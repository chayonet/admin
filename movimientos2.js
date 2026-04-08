/* =================================================================================
   ARCHIVO: movimientos2.js
   Lógica: Resumen Financiero Dinámico (Recargas vs Gastos y Descuentos)
================================================================================= */

// Escuchar cuando el módulo principal de movimientos termina de cargar datos
document.addEventListener('datosMovimientosListos', renderizarResumenFinanciero);

function renderizarResumenFinanciero() {
    const contenedor = document.getElementById('contenedor-resumen-financiero');
    if(!contenedor) return;

    // Si la estructura HTML aún no existe, la creamos
    if(!document.getElementById('resumen-fin-ui')) {
        
        // Obtener fecha actual y primer día del mes
        const tzOffset = (new Date()).getTimezoneOffset() * 60000;
        const hoy = new Date(Date.now() - tzOffset).toISOString().split('T')[0];
        const primerDiaMes = hoy.substring(0, 8) + '01'; // Fuerza a YYYY-MM-01
        
        contenedor.innerHTML = `
            <div id="resumen-fin-ui" style="background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-color); padding: 20px; margin-bottom: 20px; box-shadow: var(--shadow-sm);">
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 15px; border-bottom: 1px dashed var(--border-color); padding-bottom: 15px;">
                    <h3 style="margin: 0; color: var(--text-main); font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                        <i class="material-icons-round" style="color: var(--accent);">account_balance_wallet</i> Flujo de Caja
                    </h3>
                    
                    <div style="display: flex; gap: 10px; align-items: center; background: var(--bg-dark); padding: 5px 10px; border-radius: 8px; border: 1px solid var(--border-color);">
                        <i class="material-icons-round" style="color: var(--text-muted); font-size: 1.1rem;">date_range</i>
                        <input type="date" id="resumen-fecha-inicio" value="${primerDiaMes}" style="margin:0; padding: 4px 8px; border: none; background: transparent; color: var(--text-main); outline: none;">
                        <span style="color: var(--text-muted); font-size: 0.8rem; font-weight: bold;">HASTA</span>
                        <input type="date" id="resumen-fecha-fin" value="${hoy}" style="margin:0; padding: 4px 8px; border: none; background: transparent; color: var(--text-main); outline: none;">
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px;" id="resumen-fin-cards">
                    </div>
            </div>
        `;

        // Asignar eventos de escucha a los nuevos selectores de fecha
        document.getElementById('resumen-fecha-inicio').addEventListener('change', calcularResumenFinanciero);
        document.getElementById('resumen-fecha-fin').addEventListener('change', calcularResumenFinanciero);
    }

    // Calcular y pintar los valores
    calcularResumenFinanciero();
}

function calcularResumenFinanciero() {
    const fInicio = document.getElementById('resumen-fecha-inicio').value;
    const fFin = document.getElementById('resumen-fecha-fin').value;
    
    let recargas = 0;
    let compras = 0;
    let descuentos = 0;

    // Utilizamos la variable global de movimientos.js
    if (typeof movimientosDataOriginal !== 'undefined') {
        movimientosDataOriginal.forEach(mov => {
            // 🔥 TRADUCTOR DE FECHAS: Pasamos todo a YYYY-MM-DD para comparar
            let movDate = mov.fecha.split(' ')[0]; 
            if (movDate.includes('/')) {
                let [d, m, y] = movDate.split('/');
                movDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }
            
            // Filtrar si está dentro del rango de fechas
            if (movDate >= fInicio && movDate <= fFin) {
                const monto = parseFloat(mov.monto_agrupado) || 0;
                
                if (monto > 0) {
                    recargas += monto;
                } else if (monto < 0) {
                    const orderId = (mov.order_id || '').toUpperCase();
                    if (orderId.startsWith('DES')) {
                        descuentos += Math.abs(monto);
                    } else {
                        compras += Math.abs(monto);
                    }
                }
            }
        });
    }

    const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

    const cardsContainer = document.getElementById('resumen-fin-cards');
    if(cardsContainer) {
        cardsContainer.innerHTML = `
            <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.02)); border: 1px solid rgba(16, 185, 129, 0.3); padding: 20px; border-radius: 12px; position: relative; overflow: hidden;">
                <div style="position: absolute; right: -15px; top: -15px; opacity: 0.1;">
                    <i class="material-icons-round" style="font-size: 5rem; color: #10b981;">add_circle</i>
                </div>
                <span style="color: var(--text-gray); font-size: 0.8rem; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">(Recargas)</span>
                <h4 style="margin: 8px 0 0 0; color: #10b981; font-size: 1.8rem; font-family: monospace; font-weight: 900;">${fmt.format(recargas)}</h4>
            </div>

            <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.02)); border: 1px solid rgba(239, 68, 68, 0.3); padding: 20px; border-radius: 12px; position: relative; overflow: hidden;">
                <div style="position: absolute; right: -15px; top: -15px; opacity: 0.1;">
                    <i class="material-icons-round" style="font-size: 5rem; color: #ef4444;">shopping_cart</i>
                </div>
                <span style="color: var(--text-gray); font-size: 0.8rem; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">(Compras)</span>
                <h4 style="margin: 8px 0 0 0; color: #ef4444; font-size: 1.8rem; font-family: monospace; font-weight: 900;">${fmt.format(compras)}</h4>
            </div>

            <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.02)); border: 1px solid rgba(245, 158, 11, 0.3); padding: 20px; border-radius: 12px; position: relative; overflow: hidden;">
                <div style="position: absolute; right: -15px; top: -15px; opacity: 0.1;">
                    <i class="material-icons-round" style="font-size: 5rem; color: #f59e0b;">money_off</i>
                </div>
                <span style="color: var(--text-gray); font-size: 0.8rem; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">(Descuentos)</span>
                <h4 style="margin: 8px 0 0 0; color: #f59e0b; font-size: 1.8rem; font-family: monospace; font-weight: 900;">${fmt.format(descuentos)}</h4>
            </div>
        `;
    }
}
