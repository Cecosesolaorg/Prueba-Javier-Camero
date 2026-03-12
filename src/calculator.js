// ============================================================
// CALCULADORA PREMIUM — 100% AUTÓNOMA (HTML + CSS + LÓGICA)
// Solo necesitas: <script src="../../src/calculator.js"></script>
// ============================================================

(function () {
    'use strict';

    // ── 1. INYECTAR CSS ──────────────────────────────────────
    const CALC_CSS = `
/* ===== PREMIUM CALCULATOR CSS ===== */
.premium-calculator {
    display: flex !important;
    background: #1a1a1a;
    width: 380px;
    max-width: 95%;
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 0 40px 80px rgba(0, 0, 0, 0.6);
    flex-direction: column;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.calc-header {
    background: #121212;
    padding: 1.25rem 1.5rem;
    border-bottom: 2px solid #222;
}

.calc-header-top {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 1rem;
}

.calc-menu-icon {
    font-size: 1.4rem;
    color: #fff;
    cursor: pointer;
    opacity: 0.8;
}

.calc-product-title {
    font-size: 1rem;
    color: #fff;
    margin: 0;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.calc-header-display {
    text-align: right;
    min-height: 80px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
}

.calc-saved-badge {
    color: #5dade2;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 5px;
}

.calc-main-display {
    color: #fff;
    font-size: 3.5rem;
    font-weight: 400;
    font-family: 'Outfit', sans-serif;
    line-height: 1;
    word-break: break-all;
}

.calc-grid {
    display: grid !important;
    grid-template-columns: repeat(4, 1fr);
    gap: 1px;
    background: #444;
}

.calc-btn {
    background: #1c1c1c;
    border: none;
    color: #fff;
    padding: 18px 0;
    font-size: 1.2rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.1s;
    display: flex !important;
    align-items: center;
    justify-content: center;
}

.calc-btn:active { background: #333; }

.calc-btn.light { background: #232323; }

.calc-btn.math-op { font-size: 1.4rem; }

.calc-btn.spec-btn {
    background: #2a2a2a;
    color: #5dade2;
    font-weight: 800;
    font-size: 0.95rem;
}

.calc-btn.equal-btn {
    background: #5dade2;
    color: #000;
}

.calc-btn.equal-btn:active { background: #3498db; }

.calc-footer {
    display: flex;
    padding: 0;
}

.btn-calc-cancelar,
.btn-calc-guardar {
    flex: 1;
    border: none;
    padding: 20px;
    font-size: 1rem;
    font-weight: 800;
    color: #fff;
    cursor: pointer;
}

.btn-calc-cancelar { background: #8b1c1c; }
.btn-calc-guardar  { background: #58d68d; color: #000; }
.btn-calc-cancelar:active { background: #6a0000; }
.btn-calc-guardar:active  { background: #2ecc71; }

.modal-content.premium-calculator {
    display: flex !important;
    margin: auto;
}

/* Modal overlay (solo si no existe ya en tu CSS) */
#calcModal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0; top: 0;
    width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(5px);
    align-items: center;
    justify-content: center;
}

/* CUSTOM ALERT POPUP */
.calc-alert-overlay {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.calc-alert-card {
    background: #2a2a2a;
    padding: 2rem;
    border-radius: 1rem;
    border: 1px solid rgba(255,255,255,0.1);
    text-align: center;
    max-width: 80%;
    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
}

.calc-alert-icon { font-size: 3rem; margin-bottom: 1rem; display: block; }
.calc-alert-text { 
    color: #fff; 
    font-size: 1.1rem; 
    line-height: 1.5; 
    margin-bottom: 1.5rem; 
    white-space: pre-wrap; 
}
.calc-alert-btn {
    background: #5dade2;
    color: #000;
    border: none;
    padding: 10px 25px;
    border-radius: 5px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.1s;
}
.calc-alert-btn:active { transform: scale(0.95); }
`;

    const styleEl = document.createElement('style');
    styleEl.textContent = CALC_CSS;
    document.head.appendChild(styleEl);


    // ── 2. INYECTAR HTML ─────────────────────────────────────
    const CALC_HTML = `
<div id="calcModal" class="modal">
    <div class="modal-content premium-calculator">
        <header class="calc-header">
            <div class="calc-header-top">
                <span class="calc-menu-icon" id="calcMenuIcon">☰</span>
                <h3 id="calc-product-name" class="calc-product-title">PRODUCTO</h3>
            </div>
            <div class="calc-header-display">
                <div class="calc-saved-badge">Guardado: <span id="current-saved-val">0</span></div>
                <div id="calcResult" class="calc-main-display">0</div>
            </div>
        </header>
        <div class="calc-grid">
            <button class="calc-btn op-btn light" data-op="CE">CE</button>
            <button class="calc-btn op-btn light" data-op="C">C</button>
            <button class="calc-btn op-btn light" data-op="BS">⌫</button>
            <button class="calc-btn math-op" data-op="÷">÷</button>
            <button class="calc-btn num-btn">7</button>
            <button class="calc-btn num-btn">8</button>
            <button class="calc-btn num-btn">9</button>
            <button class="calc-btn math-op" data-op="×">×</button>
            <button class="calc-btn num-btn">4</button>
            <button class="calc-btn num-btn">5</button>
            <button class="calc-btn num-btn">6</button>
            <button class="calc-btn math-op" data-op="−">−</button>
            <button class="calc-btn num-btn">1</button>
            <button class="calc-btn num-btn">2</button>
            <button class="calc-btn num-btn">3</button>
            <button class="calc-btn math-op" data-op="+">+</button>
            <button class="calc-btn num-btn" style="grid-column:span 2">0</button>
            <button class="calc-btn num-btn">.</button>
            <button class="calc-btn equal-btn" data-op="=">=</button>
        </div>
        <footer class="calc-footer">
            <button class="btn-calc-cancelar" id="calcCancelBtn">CANCELAR</button>
            <button class="btn-calc-guardar" id="calcSaveBtn">GUARDAR</button>
        </footer>

        <!-- CUSTOM ALERT -->
        <div id="calcAlert" class="calc-alert-overlay">
            <div class="calc-alert-card">
                <span class="calc-alert-icon">⚠️</span>
                <p id="calcAlertMsg" class="calc-alert-text"></p>
                <button class="calc-alert-btn" id="calcAlertBtn">ENTENDIDO</button>
            </div>
        </div>
    </div>
</div>
`;

    // Inyectamos el modal al final del body
    document.addEventListener('DOMContentLoaded', () => {
        const container = document.createElement('div');
        container.innerHTML = CALC_HTML.trim();
        document.body.appendChild(container.firstChild);

        // Bindings de botones de footer
        document.getElementById('calcCancelBtn').addEventListener('click', () => CalcApp.close());
        document.getElementById('calcSaveBtn').addEventListener('click', () => {
            // Si hay algo pendiente por calcular, avisamos al usuario
            if (CalcApp.currentExpression !== "0") {
                CalcApp.showAlert("¡Atención! Primero debes presionar el botón '=' para calcular el resultado antes de guardar.");
                return;
            }
            if (window.saveCalculation) window.saveCalculation();
        });

        // Binding del botón de alerta
        document.getElementById('calcAlertBtn').addEventListener('click', () => CalcApp.hideAlert());

        // Binding del menú historial
        document.getElementById('calcMenuIcon').addEventListener('click', () => CalcApp.toggleHistory());
    });


    // ── 3. LÓGICA DE LA CALCULADORA ──────────────────────────
    const CalcApp = {
        tempTotal: 0,
        tempHistory: "0",
        currentExpression: "0",
        activeProduct: "",

        // --- UI ---
        updateUI: function () {
            const display = document.getElementById('calcResult');
            const saved = document.getElementById('current-saved-val');
            if (display) display.textContent = this.currentExpression;
            if (saved) saved.textContent = this.tempTotal;
        },

        // --- ABRIR ---
        open: function (product, currentQty, currentHistory) {
            this.activeProduct = product;
            this.tempTotal = currentQty || 0;
            this.tempHistory = currentHistory || "0";
            this.currentExpression = "0";

            const title = document.getElementById('calc-product-name');
            if (title) title.textContent = product;

            this.updateUI();
            const modal = document.getElementById('calcModal');
            if (modal) modal.style.display = 'flex';
        },

        // --- CERRAR ---
        close: function () {
            const modal = document.getElementById('calcModal');
            if (modal) modal.style.display = 'none';
        },

        // --- INPUT (botones) ---
        handleInput: function (val, op) {
            if (op === 'C' || op === 'CE') {
                this.currentExpression = "0";
            } else if (op === 'BS') {
                this.currentExpression = this.currentExpression.length > 1
                    ? this.currentExpression.slice(0, -1)
                    : "0";
            } else if (op === '=') {
                this.performCalc();
                return;
            } else {
                this.currentExpression = (this.currentExpression === "0" && !isNaN(val))
                    ? val
                    : this.currentExpression + val;
            }
            this.updateUI();
        },

        // --- CALCULAR ---
        performCalc: function () {
            try {
                if (this.currentExpression === "0") return;

                let expr = this.currentExpression
                    .replace(/×/g, '*')
                    .replace(/÷/g, '/')
                    .replace(/−/g, '-')
                    .replace(/,/g, '.');

                let res = eval(expr);
                if (!isNaN(res)) {
                    let old = this.tempTotal;
                    this.tempTotal = old + res;

                    let step = ` (${this.currentExpression} = ${this.tempTotal})`;

                    this.tempHistory = (this.tempHistory === "0" || this.tempHistory === "")
                        ? `${this.currentExpression} = ${this.tempTotal}`
                        : this.tempHistory + " + " + step;

                    this.currentExpression = "0";
                }
            } catch (e) {
                alert("Operación inválida");
            }
            this.updateUI();
        },

        // --- GUARDAR ---
        save: function (onSaveCallback) {
            // Ya no bloqueamos si currentExpression !== "0" porque lo manejamos en el evento click
            if (onSaveCallback) onSaveCallback(this.activeProduct, this.tempTotal, this.tempHistory);
            this.close();
        },

        // --- ALERTA PERSONALIZADA ---
        showAlert: function (msg) {
            const alertEl = document.getElementById('calcAlert');
            const msgEl = document.getElementById('calcAlertMsg');
            if (alertEl && msgEl) {
                msgEl.textContent = msg;
                alertEl.style.display = 'flex';
            }
        },

        hideAlert: function () {
            const alertEl = document.getElementById('calcAlert');
            if (alertEl) alertEl.style.display = 'none';
        },

        // --- HISTORIAL ---
        toggleHistory: function () {
            this.showAlert("HISTORIAL:\n" + this.tempHistory);
        }
    };


    // ── 4. BIND BOTONES DE LA GRID ───────────────────────────
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('calc-btn')) {
            const btn = e.target;
            CalcApp.handleInput(btn.textContent, btn.dataset.op);
        }
    });


    // ── 5. EXPONER GLOBALES ──────────────────────────────────
    window.CalcApp = CalcApp;
    window.closeCalculator = () => CalcApp.close();
    window.toggleCalcHistory = () => CalcApp.toggleHistory();

})();
