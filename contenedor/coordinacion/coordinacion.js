// CONFIGURACIÓN DE FIREBASE (Base de datos en tiempo real)
const firebaseConfig = {
    databaseURL: "https://cecosesola-inventario-default-rtdb.firebaseio.com/"
};

// Inicializar Firebase de inmediato al cargar el script
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

document.addEventListener('DOMContentLoaded', () => {
    // Pedir clave de acceso a coordinación (Bypass si es el Admin)
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
        const accessPass = prompt("ACCESO RESTRINGIDO - COORDINACIÓN\nIntroduzca la clave:");
        if (accessPass !== "124578963") {
            alert("CLAVE INCORRECTA - VOLVIENDO AL MAPA");
            window.location.href = "../../index.html";
            return;
        }
    }

    const mainTitle = document.getElementById('mainTitle');
    const coordGrid = document.getElementById('coordGrid');

    // Quitar el "CARGANDO" de inmediato una vez aceptada la clave
    mainTitle.textContent = `EQUIPO DE INVENTARIO ${new Date().toLocaleDateString()}`;

    // Referencias a botones
    const addAreaBtn = document.getElementById('addAreaBtn');
    const saveBtn = document.getElementById('saveBtn');
    const clearBtn = document.getElementById('clearBtn');
    const exportBtn = document.getElementById('exportBtn');
    const publishBtn = document.getElementById('publishBtn');

    // Áreas por defecto sincronizadas con el Mapa
    const defaultAreas = [
        { title: "PASILLO 1 PASTAS", names: ["", ""] },
        { title: "PASILLO 2 CAFE", names: ["", ""] },
        { title: "PASILLO 3 PANES", names: ["", ""] },
        { title: "PASILLO 4 GALLETAS", names: ["", ""] },
        { title: "PASILLO 5 SALSA", names: ["", ""] },
        { title: "PASILLO 6 JABON", names: ["", ""] },
        { title: "PASILLO 7 PAPEL", names: ["", ""] },
        { title: "PASILLO 8", names: ["", ""] },
        { title: "PASILLO 9 GRANOS", names: ["", ""] },
        { title: "PASILLO 10 CAVA CUARTO", names: ["", ""] },
        { title: "PASILLO 11", names: ["", ""] },
        { title: "PASILLO 12", names: ["", ""] },
        { title: "PASILLO 13", names: ["", ""] },
        { title: "PASILLO 14", names: ["", ""] },
        { title: "PASILLO 15", names: ["", ""] },
        { title: "PASILLO 16", names: ["", ""] },
        { title: "PASILLO 17", names: ["", ""] },
        { title: "PASILLO 18 DEPOSITO ABAJO", names: ["", ""] },
        { title: "PASILLO 19 DEPOSITO ARRIBA", names: ["", ""] }
    ];

    let currentCoordData = {
        title: `EQUIPO DE INVENTARIO ${new Date().toLocaleDateString()}`,
        areas: defaultAreas
    };

    // FUNCIÓN PARA CARGAR DESDE FIREBASE O RESPALDO
    const loadFromFirebase = () => {
        // Cargar respaldo local primero para rapidez
        const backup = localStorage.getItem('coordDataBackup');
        if (backup) {
            currentCoordData = JSON.parse(backup);
            renderGrid();
        }

        if (!firebase.apps.length || !database) return;

        database.ref('coordinacion').once('value').then((snapshot) => {
            const data = snapshot.val();
            if (data && data.areas) {
                currentCoordData = data;
                mainTitle.textContent = currentCoordData.title;
                renderGrid();
            }
        }).catch(err => {
            console.error("Error Firebase:", err);
        });
    };

    const renderGrid = () => {
        coordGrid.innerHTML = '';
        let totalStaffCount = 0;
        let coveredAreasCount = 0;

        currentCoordData.areas.forEach((area, index) => {
            const card = document.createElement('article');
            card.className = 'area-card';

            const names = area.names || [];
            const hasPeople = names.some(n => n.trim() !== '');
            if (hasPeople) coveredAreasCount++;
            
            let namesHTML = '';
            names.forEach((name, nIndex) => {
                const trimmedName = (name || '').trim();
                if (trimmedName !== '') totalStaffCount++;
                namesHTML += `<input type="text" class="name-input" value="${trimmedName}" data-area="${index}" data-name="${nIndex}" placeholder="NOMBRE...">`;
            });

            card.innerHTML = `
                <div class="area-header">
                    <span class="area-title" contenteditable="true" data-index="${index}">${area.title}</span>
                </div>
                <div class="names-list">
                    ${namesHTML}
                    <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
                        <button class="btn-add-name" onclick="addName(${index})" style="background:none; border:none; color:#3ca1e3; cursor:pointer; font-size:0.75rem;">+ persona</button>
                        <button class="btn-remove-area" onclick="removeArea(${index})" style="background:none; border:none; color:#eb5757; cursor:pointer; font-size:0.75rem;">eliminar</button>
                    </div>
                </div>
            `;
            coordGrid.appendChild(card);
        });

        // Actualizar Dashboard
        const totalStaffEl = document.getElementById('totalStaff');
        const coveredAreasEl = document.getElementById('coveredAreas');
        const totalProductsEl = document.getElementById('totalProducts');

        if (totalStaffEl) totalStaffEl.innerText = totalStaffCount;
        if (coveredAreasEl) coveredAreasEl.innerText = coveredAreasCount;
        
        if (totalProductsEl && window.ALL_PRODUCTS) {
            let pCount = 0;
            Object.values(window.ALL_PRODUCTS).forEach(list => {
                if (Array.isArray(list)) pCount += list.length;
            });
            totalProductsEl.innerText = pCount;
        }

        // --- Agregar Listeners a los nuevos elementos ---
        // Actualizar datos locales al cambiar nombres
        document.querySelectorAll('.name-input').forEach(input => {
            input.oninput = (e) => {
                const aIdx = e.target.dataset.area;
                const nIdx = e.target.dataset.name;
                currentCoordData.areas[aIdx].names[nIdx] = e.target.value.toUpperCase();
                // GUARDAR RESPALDO LOCAL INMEDIATO
                localStorage.setItem('coordDataBackup', JSON.stringify(currentCoordData));
            };
        });

        // Actualizar títulos locales
        document.querySelectorAll('.area-title').forEach(title => {
            title.onblur = (e) => {
                const idx = e.target.dataset.index;
                currentCoordData.areas[idx].title = e.target.textContent.toUpperCase();
            };
        });
    };

    // Funciones globales para botones dinámicos
    window.addName = (areaIndex) => {
        if (!currentCoordData.areas[areaIndex].names) currentCoordData.areas[areaIndex].names = [];
        currentCoordData.areas[areaIndex].names.push("");
        renderGrid();
    };

    window.removeArea = (areaIndex) => {
        if (confirm("¿Eliminar esta área de coordinación?")) {
            currentCoordData.areas.splice(areaIndex, 1);
            renderGrid();
        }
    };

    addAreaBtn.onclick = () => {
        const title = prompt("NOMBRE DE LA NUEVA ÁREA:");
        if (title) {
            currentCoordData.areas.push({ title: title.toUpperCase(), names: [""] });
            renderGrid();
        }
    };

    saveBtn.onclick = () => {
        currentCoordData.title = mainTitle.textContent;
        // GUARDAR EN FIREBASE
        database.ref('coordinacion').set(currentCoordData).then(() => {
            alert("¡Datos de coordinación guardados en la nube!");
        }).catch(err => {
            console.error(err);
            alert("Error al guardar en la nube.");
        });
    };

    // --- LÓGICA DE SINCRONIZACIÓN CON GITHUB ---
    const githubSyncBtn = document.getElementById('githubSyncBtn');
    
    async function syncToGitHub(forcedType = null) {
        const token = localStorage.getItem('github_token');
        const repo = "Cecosesolaorg/Prueba-Javier-Camero"; 
        
        if (!token) {
            // Si es forzado (desde publicar), no pedimos token para no interrumpir
            if (forcedType) {
                console.warn("⚠️ No hay token de GitHub, omitiendo respaldo permanente.");
                return;
            }
            let userToken = prompt("Para sincronizar con GitHub, ingresa tu Personal Access Token (PAT):");
            if (userToken) {
                userToken = userToken.trim();
                localStorage.setItem('github_token', userToken);
            } else return;
        }

        const activeTab = forcedType || (tabStaff.classList.contains('active') ? 'staff' : 'products');
        const originalBtnContent = githubSyncBtn.innerHTML;
        githubSyncBtn.disabled = true;
        githubSyncBtn.innerHTML = "<span>⌛</span> SINCRONIZANDO...";

        let payload = {};
        let filePath = "";

        if (activeTab === 'staff') {
            payload = currentCoordData;
            filePath = "data/staff_assignments.json";
        } else {
            // Sincronizar maestro de productos completo (si lo tenemos cargado)
            payload = window.ALL_PRODUCTS || {};
            filePath = "src/products.json"; // Vamos a guardarlo como JSON para que sea fácil leerlo
        }

        try {
            const response = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${token.trim()}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event_type: 'update_inventory',
                    client_payload: {
                        file_path: filePath,
                        data: JSON.stringify(payload, null, 2)
                    }
                })
            });

            if (response.ok || response.status === 204) {
                alert(`✅ Sincronización de ${activeTab} iniciada en GitHub.`);
            } else {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.message || `Error ${response.status}`);
            }
        } catch (error) {
            console.error(error);
            alert(`❌ Error al sincronizar: ${error.message}`);
            if (error.message.includes("401") || error.message.includes("403")) {
                localStorage.removeItem('github_token');
            }
        } finally {
            githubSyncBtn.disabled = false;
            githubSyncBtn.innerHTML = originalBtnContent;
        }
    }

    if (githubSyncBtn) githubSyncBtn.onclick = syncToGitHub;

    publishBtn.onclick = () => {
        // Bloquear botón para evitar doble clic
        publishBtn.disabled = true;
        publishBtn.innerHTML = "<span>⌛</span> PUBLICANDO...";

        const currentUser = (localStorage.getItem('userName') || "").toUpperCase();
        const currentLastName = (localStorage.getItem('userLastName') || "").toUpperCase();
        const fullUserName = `${currentUser} ${currentLastName}`.trim();

        // VALIDACIÓN DE SEGURIDAD PARA JAVIER CAMERO
        if (fullUserName !== "JAVIER CAMERO" && localStorage.getItem('isAdmin') !== 'true') {
            const pass = prompt("SOLO JAVIER CAMERO O ADMIN PUEDEN PUBLICAR.\nIntroduzca clave de autorización:");
            if (pass !== "124578963") {
                alert("AUTORIZACIÓN DENEGADA");
                publishBtn.disabled = false;
                publishBtn.innerHTML = "<span>📢</span> PUBLICAR";
                return;
            }
        }

        currentCoordData.title = mainTitle.textContent;

        // Crear mapa para el personal publicado
        const staffMap = {};
        currentCoordData.areas.forEach(area => {
            const names = area.names.filter(n => n && n.trim() !== "");
            if (names.length > 0) {
                const cleanTitle = area.title.trim().toUpperCase();
                staffMap[cleanTitle] = names.join(" / ");
            }
        });

        console.log("📤 Intentando publicar en Firebase:", staffMap);

        // --- SALIDA DE EMERGENCIA ---
        const safetyTimeout = setTimeout(() => {
            console.warn("⚠️ Tiempo de espera agotado, forzando redirección...");
            window.location.href = "../../index.html";
        }, 3000);

        // Intento de envío real
        // 1. GUARDAR EN LA "NUBE LOCAL" (LocalStorage) PARA QUE SEA AL INSTANTE
        localStorage.setItem('cachedPublishedStaff', JSON.stringify(staffMap));

        // 2. INTENTAR GUARDAR EN LA NUBE REAL (Firebase) COMO RESPALDO
        if (database) {
            database.ref().update({
                'publishedStaff': staffMap,
                'lastSync': Date.now()
            }).then(async () => {
                // 3. RESPALDO PERMANENTE EN GITHUB (Si hay token)
                if (localStorage.getItem('github_token')) {
                    console.log("☁️ Iniciando respaldo permanente en GitHub...");
                    await syncToGitHub('staff');
                }
                
                clearTimeout(safetyTimeout);
                console.log("✅ Sincronizado en Firebase.");
                alert("🚀 ¡SINCRO TOTAL!\nDatos guardados en este equipo y en la nube.\nTodos tus compañeros los verán ahora mismo.");
                window.location.href = "../../index.html";
            }).catch(async err => {
                // Intentar GitHub incluso si Firebase falla
                if (localStorage.getItem('github_token')) {
                    await syncToGitHub('staff');
                }
                clearTimeout(safetyTimeout);
                console.error("❌ ERROR NUBE:", err);
                alert("⚠️ SOLO GUARDADO LOCAL\nEl internet falló o Firebase está bloqueado.\nSus compañeros NO podrán ver esta lista hasta que se arregle la nube.");
                window.location.href = "../../index.html";
            });
        }
    };

    clearBtn.onclick = () => {
        const pass = prompt("CONTRASEÑA PARA BORRAR TODO:");
        if (pass === "085030140") {
            currentCoordData = {
                title: `EQUIPO DE INVENTARIO ${new Date().toLocaleDateString()}`,
                areas: [...defaultAreas]
            };
            mainTitle.textContent = currentCoordData.title;
            database.ref('coordinacion').set(currentCoordData);
            localStorage.removeItem('coordDataBackup');
            renderGrid();
        } else if (pass !== null) {
            alert("CONTRASEÑA INCORRECTA");
        }
    };

    exportBtn.onclick = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Coordinación');
        const colWidths = [25, 25, 25, 25, 25];
        worksheet.columns = colWidths.map(w => ({ width: w }));

        const mainHeaderRow = worksheet.addRow([mainTitle.textContent]);
        worksheet.mergeCells(`A1:E1`);
        const mainCell = worksheet.getCell('A1');
        mainCell.font = { size: 18, bold: true, color: { argb: 'FFF39C12' } };
        mainCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1D' } };
        mainCell.alignment = { horizontal: 'center' };

        let currentRow = 3;
        let currentCol = 1;
        currentCoordData.areas.forEach((area) => {
            const headerCell = worksheet.getCell(currentRow, currentCol);
            headerCell.value = area.title;
            headerCell.font = { bold: true, color: { argb: 'FF3CA1E3' } };
            headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C2C2E' } };

            area.names.forEach((name, i) => {
                const cell = worksheet.getCell(currentRow + i + 1, currentCol);
                cell.value = name || "---";
                cell.border = { bottom: { style: 'thin' } };
            });

            currentCol++;
            if (currentCol > 5) {
                currentCol = 1;
                currentRow += 6;
            }
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `Coordinacion_Inventario.xlsx`);
    };

    // --- PRODUCT MANAGEMENT ADDITION (CLOUD API) ---
    const tabStaff = document.getElementById('tabStaff');
    const tabProducts = document.getElementById('tabProducts');
    const productAdmin = document.getElementById('productAdmin');
    const aisleSelect = document.getElementById('aisleSelect');
    const productListDisplay = document.getElementById('productListDisplay');
    const btnAddProd = document.getElementById('addProductBtn');

    let selectedAisle = "";
    let activeProducts = [];

    // Tab Switching
    tabStaff.onclick = () => {
        tabStaff.classList.add('active');
        tabProducts.classList.remove('active');
        coordGrid.style.display = 'grid';
        productAdmin.style.display = 'none';
        document.querySelector('.actions-footer').style.display = 'flex';
    };

    tabProducts.onclick = () => {
        tabProducts.classList.add('active');
        tabStaff.classList.remove('active');
        coordGrid.style.display = 'none';
        productAdmin.style.display = 'block';
        document.querySelector('.actions-footer').style.display = 'none';

        // Cargar siempre que entremos si hay algo seleccionado
        if (aisleSelect.value) {
            handleAisleSelection(aisleSelect.value);
        } else {
            populateAisles();
        }
    };

    const populateAisles = () => {
        // Solo poblar si está vacío (excepto el placeholder)
        if (aisleSelect.options.length <= 1) {
            const products = window.ALL_PRODUCTS || {};
            const sortedAisles = Object.keys(products).sort();

            sortedAisles.forEach(aisle => {
                const opt = document.createElement('option');
                opt.value = aisle;
                opt.textContent = aisle;
                aisleSelect.appendChild(opt);
            });
        }

        // Si no hay nada seleccionado, seleccionar el primero disponible
        if (aisleSelect.selectedIndex <= 0 && aisleSelect.options.length > 1) {
            aisleSelect.selectedIndex = 1;
            handleAisleSelection(aisleSelect.value);
        }
    };

    const getAisleId = (name) => {
        if (!name) return "PALL";
        const n = String(name).toUpperCase();
        if (n.includes("ABAJO")) return "P18";
        if (n.includes("ARRIBA")) return "P19";
        if (n.includes("CAVA")) return "P10";
        if (n.includes("GRANOS")) return "P9";
        const num = n.match(/\d+/);
        return num ? `P${num[0]}` : `P${n.replace(/[^A-Z0-9]/g, '')}`;
    };

    const handleAisleSelection = (aisleName) => {
        if (!aisleName || aisleName === "") {
            productListDisplay.innerHTML = '<p style="text-align:center; opacity:0.5; padding:2rem;">Selecciona un pasillo para empezar</p>';
            return;
        }

        selectedAisle = aisleName;
        const aisleId = getAisleId(selectedAisle);

        console.log(`🛠️ API: Procesando ${selectedAisle} (ID: ${aisleId})`);
        productListDisplay.innerHTML = '<div style="text-align:center; padding:2rem;"><span style="font-size:2rem; display:block; margin-bottom:1rem;">⌛</span><p style="opacity:0.7;">Sincronizando con la nube...</p></div>';

        // CARGA INICIAL INMEDIATA (Para que vea los cambios al segundo)
        useFallbackData(aisleId);
        renderProductList();

        let timeoutReached = false;
        const timer = setTimeout(() => {
            timeoutReached = true;
            console.warn("⏳ API: Tiempo de espera agotado.");
        }, 3000);

        database.ref(`masterProducts/${aisleId}`).once('value').then(snap => {
            if (timeoutReached) return;
            clearTimeout(timer);
            const cloudProds = snap.val();

            // Si la nube tiene datos, comparamos.
            if (cloudProds && Array.isArray(cloudProds) && cloudProds.length > 0) {
                // DETECCIÓN DE LISTA VIEJA (FANTASMA)
                const isOldList = cloudProds.some(p => String(p).includes("ACEITE DIANA") || String(p).includes("ARROZ MARY"));

                if (aisleId === "P1" && isOldList) {
                    console.log("⚡ API: Lista vieja detectada en P1. Limpiando y forzando nueva...");
                    useFallbackData(aisleId); // Carga la lista del código
                    saveProducts();          // Pisa la nube con lo nuevo
                } else if (aisleId === "P1" && cloudProds.length > 0) {
                    // Si ya tiene los nuevos, los dejamos
                    activeProducts = cloudProds;
                    renderProductList();
                } else {
                    activeProducts = cloudProds;
                    renderProductList();
                }
            } else {
                console.log("⚠️ API: Sincronizando datos locales a la nube.");
                saveProducts();
            }
        }).catch(err => {
            if (timeoutReached) return;
            clearTimeout(timer);
            console.error("❌ API Error:", err);
        });
    };

    const useFallbackData = (aisleId) => {
        const local = localStorage.getItem(`productsList_${aisleId}`);
        if (local) {
            activeProducts = JSON.parse(local);
        } else {
            activeProducts = [];
            const clean = s => String(s).replace(/[^A-Z0-9]/g, "");
            const selClean = clean(selectedAisle);
            for (const key in window.ALL_PRODUCTS) {
                const keyClean = clean(key);
                if (selClean.includes(keyClean) || keyClean.includes(selClean)) {
                    activeProducts = [...window.ALL_PRODUCTS[key]];
                    break;
                }
            }
            if (activeProducts.length === 0) {
                const num = selectedAisle.match(/\d+/);
                if (num) {
                    for (const key in window.ALL_PRODUCTS) {
                        if (key.includes(`PASILLO ${num[0]}`)) { activeProducts = [...window.ALL_PRODUCTS[key]]; break; }
                    }
                }
            }
        }
    };

    aisleSelect.onchange = (e) => handleAisleSelection(e.target.value);

    const btnResetProd = document.getElementById('resetProductBtn');

    btnResetProd.onclick = () => {
        if (!selectedAisle) return alert("Selecciona un pasillo primero");
        if (confirm(`⚠️ ¿FORZAR CARGA DESDE EL CÓDIGO?\nEsto borrará la lista actual de "${selectedAisle}" y pondrá la lista nueva del sistema.`)) {
            const aisleId = getAisleId(selectedAisle);

            // 1. Limpiar local storage para forzar lectura del código
            localStorage.removeItem(`productsList_${aisleId}`);

            // 2. Cargar desde ALL_PRODUCTS ignorando localstorage
            activeProducts = [];
            const clean = s => String(s).replace(/[^A-Z0-9]/g, "");
            const selClean = clean(selectedAisle);
            for (const key in window.ALL_PRODUCTS) {
                if (clean(key) === selClean) {
                    activeProducts = [...window.ALL_PRODUCTS[key]];
                    break;
                }
            }

            // 3. Guardar y Refrescar
            saveProducts();
            renderProductList();
            alert("✅ ACTUALIZADO: Los productos del código fueron cargados y sincronizados con la nube.");
        }
    };

    const renderProductList = () => {
        productListDisplay.innerHTML = '';
        if (activeProducts.length === 0) {
            productListDisplay.innerHTML = `<div style="text-align:center; padding:3rem; opacity:0.5;">
                <p>No hay productos en "${selectedAisle}"</p>
                <p style="font-size:0.8rem; margin-top:1rem;">Pulsa "+ PRODUCTO" para añadir el primero</p>
            </div>`;
            return;
        }

        activeProducts.forEach((p, idx) => {
            const div = document.createElement('div');
            div.className = 'product-item';
            div.innerHTML = `
                <span class="product-name-txt">${p}</span>
                <div class="product-actions">
                    <button class="btn-mini edit" title="Editar">✏️</button>
                    <button class="btn-mini delete" title="Borrar">🗑️</button>
                </div>
            `;
            div.querySelector('.edit').onclick = () => {
                const n = prompt("Nuevo nombre:", p);
                if (n && n.trim()) {
                    activeProducts[idx] = n.trim().toUpperCase();
                    renderProductList();
                    saveProducts();
                }
            };
            div.querySelector('.delete').onclick = () => {
                if (confirm(`¿Borrar "${p}"?`)) {
                    activeProducts.splice(idx, 1);
                    renderProductList();
                    saveProducts();
                }
            };
            productListDisplay.appendChild(div);
        });
    };

    const saveProducts = () => {
        if (!selectedAisle) return;
        const aisleId = getAisleId(selectedAisle);

        // Guardar local inmediatamente para UI fluida
        localStorage.setItem(`productsList_${aisleId}`, JSON.stringify(activeProducts));

        // Intentar guardar en nube
        database.ref(`masterProducts/${aisleId}`).set(activeProducts).then(() => {
            console.log("✅ API: Sincronizada con éxito.");
        }).catch(err => {
            console.warn("⚠️ API: Error al sincronizar con nube, pero se guardó localmente.");
        });
    };

    btnAddProd.onclick = () => {
        if (!selectedAisle) { alert("⚠️ SELECCIONA UN PASILLO PRIMERO"); return; }
        const n = prompt("Nombre del nuevo producto:");
        if (n && n.trim()) {
            activeProducts.push(n.trim().toUpperCase());
            renderProductList(); // Actualizar UI de inmediato
            saveProducts();
        }
    };

    // Inicializar todo
    populateAisles();
    loadFromFirebase();
});
