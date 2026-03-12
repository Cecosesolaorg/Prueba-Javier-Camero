document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded - Ultra Modular pasillo.js");

    // 1. Core State
    const aisleTitleEl = document.querySelector('.aisle-title');
    const aisleTitle = aisleTitleEl ? aisleTitleEl.innerText.toUpperCase() : "PASILLO";
    const aisleId = aisleTitle.match(/\d+/) ? `P${aisleTitle.match(/\d+/)[0]}` : "PALL";

    let responsable = localStorage.getItem('responsableDirecto') || "SIN ASIGNAR";
    let companero = localStorage.getItem('companero') || "SIN ASIGNAR";
    let inventoryData = JSON.parse(localStorage.getItem('inventoryData')) || {};
    let searchTerm = "";

    // 2. Load Products
    let productsList = [];
    try {
        const localProds = localStorage.getItem(`productsList_${aisleId}`);
        if (localProds) {
            productsList = JSON.parse(localProds);
        } else if (window.ALL_PRODUCTS) {
            for (const name in window.ALL_PRODUCTS) {
                const cleanName = name.replace(/[^A-Z0-9]/g, "");
                const cleanTitle = aisleTitle.replace(/[^A-Z0-9]/g, "");
                if (cleanTitle.includes(cleanName) || cleanName.includes(cleanTitle)) {
                    productsList = window.ALL_PRODUCTS[name];
                    break;
                }
            }
        }
    } catch (e) { productsList = []; }

    // Update Global Labels
    const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    setText('current-date', `FECHA: ${new Date().toLocaleDateString()}`);
    setText('team1-resp1', responsable.toUpperCase());
    setText('team1-resp2', companero.toUpperCase());

    // 3. Render Wrapper
    const renderTable = () => {
        const body = document.getElementById('inventory-body');
        window.InventoryCore.render(body, productsList, inventoryData, searchTerm, aisleId, {
            onCheckToggle: (p) => {
                const cur = inventoryData[p] || { qty: 0, history: "0", checkState: 0, redQty: null };
                const next = cur.checkState === 1 ? 2 : (cur.checkState === 2 ? 1 : 2);
                let red = (cur.checkState === 0 || !cur.checkState) ? (cur.qty || 0) : cur.redQty;
                inventoryData[p] = { ...cur, checkState: next, redQty: red };
                localStorage.setItem('inventoryData', JSON.stringify(inventoryData));
                renderTable();
            },
            onOpenCalc: (p) => {
                const cur = inventoryData[p] || { qty: 0, history: "0" };
                window.CalcApp.open(p, cur.qty, cur.history);
            },
            onEditClick: (p) => {
                const c = prompt("1. Renombrar 2. Eliminar", "1");
                if (c === "1") {
                    const n = prompt("Nombre:", p);
                    if (n && n.trim()) {
                        const finalP = n.trim().toUpperCase();
                        const idx = productsList.indexOf(p);
                        if (idx !== -1) {
                            productsList[idx] = finalP;
                            inventoryData[finalP] = inventoryData[p];
                            delete inventoryData[p];
                            localStorage.setItem('inventoryData', JSON.stringify(inventoryData));
                            localStorage.setItem(`productsList_${aisleId}`, JSON.stringify(productsList));
                            renderTable();
                        }
                    }
                } else if (c === "2" && confirm("¿Eliminar?")) {
                    const idx = productsList.indexOf(p);
                    if (idx !== -1) {
                        productsList.splice(idx, 1);
                        delete inventoryData[p];
                        localStorage.setItem('inventoryData', JSON.stringify(inventoryData));
                        localStorage.setItem(`productsList_${aisleId}`, JSON.stringify(productsList));
                        renderTable();
                    }
                }
            }
        });
    };

    // 4. Bind Global Actions
    window.saveCalculation = () => {
        window.CalcApp.save((prod, qty, hist) => {
            inventoryData[prod] = { ...inventoryData[prod], qty: qty, history: hist };
            localStorage.setItem('inventoryData', JSON.stringify(inventoryData));
            renderTable();
        });
    };
    window.closeCalculator = () => window.CalcApp.close();
    window.toggleCalcHistory = () => window.CalcApp.toggleHistory();
    window.openHelperModal = () => window.HelperApp.open();
    window.closeHelperModal = () => window.HelperApp.close();

    // 5. Tool Bar Actions
    if (document.getElementById('helperBtn')) document.getElementById('helperBtn').onclick = window.openHelperModal;
    if (document.getElementById('downloadBtn')) document.getElementById('downloadBtn').onclick = () => window.ExportApp.downloadAisle(aisleTitle, responsable, companero, productsList, inventoryData);
    if (document.getElementById('addProductBtn')) document.getElementById('addProductBtn').onclick = () => {
        const n = prompt("Nuevo producto:");
        if (n && n.trim()) {
            const fn = n.trim().toUpperCase();
            productsList.push(fn);
            localStorage.setItem(`productsList_${aisleId}`, JSON.stringify(productsList));
            renderTable();
        }
    };
    if (document.getElementById('clearBtn')) document.getElementById('clearBtn').onclick = () => {
        if (prompt("CLAVE:") === "085030140" && confirm("¿Borrar?")) {
            inventoryData = {};
            localStorage.setItem('inventoryData', JSON.stringify(inventoryData));
            renderTable();
        }
    };

    // 6. Search & Filter
    const sInp = document.getElementById('productSearch');
    if (sInp) sInp.oninput = (e) => { searchTerm = e.target.value; renderTable(); };

    const fTgl = document.getElementById('fullListToggle');
    if (fTgl) fTgl.onchange = () => renderTable();

    // 7. Firebase Sync (THE API)
    try {
        if (!firebase.apps.length) firebase.initializeApp({ databaseURL: "https://cecosesola-inventario-default-rtdb.firebaseio.com/" });

        // A. Multi-User Staff Sync
        firebase.database().ref('publishedStaff').on('value', (snap) => {
            const data = snap.val() || {};
            const clean = s => s.replace(/[^A-Z0-9]/g, "");
            const cT = clean(aisleTitle);
            for (const area in data) {
                if (cT.includes(clean(area)) || clean(area).includes(cT)) {
                    const names = data[area].split(" / ");
                    setText('team1-resp1', (names[0] || responsable).toUpperCase());
                    setText('team1-resp2', (names[1] || companero).toUpperCase());
                    break;
                }
            }
        });

        // B. Cloud Product API Sync
        firebase.database().ref(`masterProducts/${aisleId}`).on('value', (snap) => {
            const cloudProds = snap.val();
            if (cloudProds && Array.isArray(cloudProds)) {
                console.log("☁️ API: Sincronizando productos desde la nube para " + aisleId);
                productsList = cloudProds;
                localStorage.setItem(`productsList_${aisleId}`, JSON.stringify(productsList));
                renderTable();
            }
        });

    } catch (e) { console.warn("Firebase Sync Error:", e); }

    renderTable();
});
