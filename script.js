// La configuración se manejará dentro del DOMContentLoaded para asegurar que Firebase esté listo
let database;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Firebase con seguridad
    try {
        const firebaseConfig = {
            databaseURL: "https://cecosesola-inventario-default-rtdb.firebaseio.com/"
        };
        // Verificar si firebase existe antes de usarlo
        if (typeof firebase !== 'undefined') {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            database = firebase.database();
            console.log("✅ Firebase conectado en Inicio");
        } else {
            console.warn("⚠️ Firebase no cargado (posible error de red o gstatic bloqueado)");
        }
    } catch (error) {
        console.error("❌ Error al iniciar Firebase:", error);
    }

    // --- EFECTO DE FONDO INTERACTIVO (Glow que sigue al mouse) ---
    const bgGlow = document.querySelector('.background-glow');
    if (bgGlow) {
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth) * 100;
            const y = (e.clientY / window.innerHeight) * 100;

            // 1. Inyectar variables para animaciones CSS
            bgGlow.style.setProperty('--x', `${x}%`);
            bgGlow.style.setProperty('--y', `${y}%`);

            // 2. Aplicar degradado premium directo
            bgGlow.style.background = `
                radial-gradient(circle at ${x}% ${y}%, rgba(255, 109, 0, 0.4) 0%, transparent 60%),
                radial-gradient(circle at ${100 - x}% ${100 - y}%, rgba(0, 210, 255, 0.2) 0%, transparent 60%)
            `;
        });
    }

    const loginForm = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');
    const responsableInput = document.getElementById('responsable');

    // Cargar responsable predeterminado
    const savedResponsable = localStorage.getItem('responsableDirecto');
    if (savedResponsable && responsableInput) {
        responsableInput.value = savedResponsable;
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const responsable = document.getElementById('responsable').value.trim();
        const assignedAisle = document.getElementById('assignedAisle').value;

        // 1. CASO ADMINISTRADOR (JAVIER CAMERO)
        if (responsable.toUpperCase() === "JAVIER CAMERO") {
            localStorage.setItem('isAdmin', 'true');
            localStorage.setItem('userName', "JAVIER CAMERO");
            localStorage.setItem('responsableDirecto', "JAVIER CAMERO");
            localStorage.setItem('assignedAisle', assignedAisle || "DASHBOARD");
            localStorage.setItem('cecosesolaUser', "JAVIER CAMERO");

            ejecutarEntrada();
            return;
        }

        // 2. CASO USUARIO NORMAL
        if (responsable && assignedAisle) {
            localStorage.setItem('isAdmin', 'false');
            localStorage.setItem('userName', responsable);
            localStorage.setItem('responsableDirecto', responsable);
            localStorage.setItem('assignedAisle', assignedAisle);
            localStorage.setItem('cecosesolaUser', responsable);
            
            // Si es la primera vez, preguntar por el token de GitHub (opcional ahora)
            if (!localStorage.getItem('github_token')) {
                console.log("💡 Sugerencia: Configura tu GitHub Token para sincronizar inventarios.");
            }

            ejecutarEntrada();
        } else {
            alert('Por favor, ingresa tu nombre y selecciona un pasillo.');
        }
    });

    // --- LÓGICA DE SINCRONIZACIÓN CON GITHUB ---
    function syncToGitHub() {
        const token = localStorage.getItem('github_token');
        const repo = "Cecosesolaorg/Prueba-Javier-Camero"; 
        
        if (!token) {
            let userToken = prompt("Para sincronizar con GitHub, ingresa tu Personal Access Token (PAT):");
            if (userToken) {
                userToken = userToken.trim(); // LIMPIAR ESPACIOS
                localStorage.setItem('github_token', userToken);
            } else {
                return;
            }
        }

        const syncBtn = document.getElementById('githubSyncBtn');
        const originalContent = syncBtn.innerHTML;
        syncBtn.disabled = true;
        syncBtn.innerHTML = '<span>Sincronizando...</span>';

        // 1. Obtener y estructurar los datos para Grafana (Array de objetos)
        const rawInventory = JSON.parse(localStorage.getItem('inventoryData') || "{}");
        const timestamp = new Date().toISOString();
        
        const structuredData = Object.keys(rawInventory).map(productName => {
            const item = rawInventory[productName];
            return {
                producto: productName,
                cantidad: item.qty || 0,
                diferencia: (item.qty || 0) - (item.redQty || 0),
                estado: item.checkState || 0,
                timestamp: timestamp,
                responsable: localStorage.getItem('responsableDirecto') || "SISTEMA",
                pasillo: localStorage.getItem('assignedAisle') || "GENERAL"
            };
        });

        const payload = {
            metadata: {
                last_updated: timestamp,
                total_items: structuredData.length,
                user: localStorage.getItem('responsableDirecto')
            },
            inventory: structuredData
        };

        fetch(`https://api.github.com/repos/${repo}/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${localStorage.getItem('github_token').trim()}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event_type: 'update_inventory',
                client_payload: {
                    data: JSON.stringify(payload, null, 2)
                }
            })
        })
        .then(async response => {
            if (response.ok || response.status === 204) {
                alert("✅ ¡Sincronización iniciada! Los datos se actualizarán en GitHub en unos momentos.");
            } else {
                const errData = await response.json().catch(() => ({}));
                if (response.status === 401) {
                    throw new Error("Token inválido o expirado. Por favor, revisa el token.");
                } else if (response.status === 403) {
                    throw new Error("Permisos insuficientes (403). El token no tiene permiso para escribir en este repositorio.\n\nSOLUCIÓN:\n1. Si usas 'Classic Token': Marca el cuadro 'repo'.\n2. Si usas 'Fine-grained Token': En 'Permissions', busca 'Contents' y cámbialo a 'Read & Write'.");
                } else if (response.status === 404) {
                    throw new Error("No se encontró el repositorio. Revisa el nombre o los permisos del token.");
                }
                throw new Error(`Error de GitHub (${response.status}): ${errData.message || 'Desconocido'}`);
            }
        })
        .catch(error => {
            console.error("❌ Error al sincronizar:", error);
            alert(`❌ Error al sincronizar:\n\n${error.message}`);
            // Borrar token si es error de permisos o autorización para permitir reintento
            if (error.message.includes("Token inválido") || error.message.includes("Permisos insuficientes")) {
                localStorage.removeItem('github_token');
            }
        })
        .finally(() => {
            syncBtn.disabled = false;
            syncBtn.innerHTML = originalContent;
        });
    }

    function ejecutarEntrada() {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Procesando...</span>';

        const assignedAisle = localStorage.getItem('assignedAisle');

        // Mapeo de pasillos a sus respectivos archivos HTML
        const aisleMap = {
            "PASILLO 1 PASTAS": "contenedor/pasillo1/pasillo1.html",
            "PASILLO 2 CAFE": "contenedor/pasillo2/pasillo2.html",
            "PASILLO 3 PANES": "contenedor/pasillo3/pasillo3.html",
            "PASILLO 4 GALLETAS": "contenedor/pasillo4/pasillo4.html",
            "PASILLO 5 SALSA": "contenedor/pasillo5/pasillo5.html",
            "PASILLO 6 JABON": "contenedor/pasillo6/pasillo6.html",
            "PASILLO 7 PAPEL": "contenedor/pasillo7/pasillo7.html",
            "PASILLO 8": "contenedor/pasillo8/pasillo8.html",
            "PASILLO 9 GRANOS": "contenedor/pasillo9/pasillo9.html",
            "PASILLO 10 CAVA CUARTO": "contenedor/pasillo10/pasillo10.html",
            "PASILLO 11": "contenedor/pasillo11/pasillo11.html",
            "PASILLO 12": "contenedor/pasillo12/pasillo12.html",
            "PASILLO 13": "contenedor/pasillo13/pasillo13.html",
            "PASILLO 14": "contenedor/pasillo14/pasillo14.html",
            "PASILLO 15": "contenedor/pasillo15/pasillo15.html",
            "PASILLO 16": "contenedor/pasillo16/pasillo16.html",
            "PASILLO 17": "contenedor/pasillo17/pasillo17.html",
            "PASILLO 18 DEPOSITO ABAJO": "contenedor/pasillo18/pasillo18.html",
            "PASILLO 19 DEPOSITO ARRIBA": "contenedor/pasillo19/pasillo19.html",
            "COORDINACIÓN": "contenedor/coordinacion/coordinacion.html"
        };

        const targetUrl = aisleMap[assignedAisle] || 'index.html';

        setTimeout(() => {
            if (targetUrl !== 'contenedor/coordinacion/coordinacion.html') {
                const modal = document.getElementById('partnerModal');
                const input = document.getElementById('partnerInput');
                const confirmBtn = document.getElementById('confirmPartnerBtn');
                const cancelBtn = document.getElementById('cancelPartnerBtn');

                modal.style.display = 'flex';
                input.focus();

                confirmBtn.onclick = () => {
                    const name = input.value.trim();
                    if (name) {
                        localStorage.setItem('companero', name.toUpperCase());
                        localStorage.setItem('userLastName', name.toUpperCase());
                        window.location.href = targetUrl;
                    } else {
                        alert("ERROR: Por favor, ingresa el nombre del compañero para continuar.");
                    }
                };

                cancelBtn.onclick = () => {
                    // Si cancela, cerramos el modal y reseteamos el login, no lo mandamos al mapa
                    modal.style.display = 'none';
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span>Iniciar Inventario</span>';
                };
            } else {
                window.location.href = targetUrl;
            }
        }, 800);
    }


    // --- API DE ASIGNACIONES LOCALES (FOOTPRINT) ---
    const DEFAULT_ASSIGNMENTS = {
        "PASILLO 1 PASTAS": "---",
        "PASILLO 2 CAFE": "---",
        "PASILLO 3 PANES": "---",
        "PASILLO 4 GALLETAS": "---",
        "PASILLO 5 SALSA": "---",
        "PASILLO 6 JABON": "---",
        "PASILLO 7 PAPEL": "---",
        "PASILLO 8": "---",
        "PASILLO 9 GRANOS": "---",
        "PASILLO 10 CAVA CUARTO": "---",
        "PASILLO 11": "---",
        "PASILLO 12": "---",
        "PASILLO 13": "---",
        "PASILLO 14": "---",
        "PASILLO 15": "---",
        "PASILLO 16": "---",
        "PASILLO 17": "---",
        "PASILLO 18 DEPOSITO ABAJO": "---",
        "PASILLO 19 DEPOSITO ARRIBA": "---",
        "COORDINACIÓN": "---"
    };

    // --- LÓGICA DE ASIGNACIONES (ICONO DE PERSONAS) ---
    const assignmentsBtn = document.getElementById('teamAssignmentsBtn');
    const assignmentsModal = document.getElementById('assignmentsModal');
    const assignmentsList = document.getElementById('assignmentsList');
    const closeAssignmentsBtn = document.getElementById('closeAssignmentsBtn');

    // Estado de sincronización
    let publishedStaffData = JSON.parse(localStorage.getItem('cachedPublishedStaff')) || {};
    let isSyncing = true;

    renderAssignments();

    // Escuchar cambios en tiempo real
    if (database) {
        // --- SALIDA DE EMERGENCIA PARA OFFLINE ---
        const syncTimeout = setTimeout(() => {
            if (isSyncing) {
                console.warn("⚠️ Tiempo de espera agotado, usando memoria local.");
                isSyncing = false;
                renderAssignments();
            }
        }, 3000);

        database.ref('publishedStaff').on('value', (snapshot) => {
            clearTimeout(syncTimeout);
            isSyncing = false;
            const cloudData = snapshot.val();
            console.log("📥 DATOS RECIBIDOS:", cloudData);

            if (cloudData && typeof cloudData === 'object' && Object.keys(cloudData).length > 0) {
                publishedStaffData = cloudData;
                localStorage.setItem('cachedPublishedStaff', JSON.stringify(publishedStaffData));
                renderAssignments("NUBE");
            } else {
                console.warn("⚠️ La nube está vacía, intentando respaldo GitHub...");
                loadAssignmentsFromGitHub();
            }
        }, (error) => {
            clearTimeout(syncTimeout);
            console.error("❌ Error Firebase:", error);
            loadAssignmentsFromGitHub();
        });
    } else {
        loadAssignmentsFromGitHub();
    }

    async function loadAssignmentsFromGitHub() {
        const repo = "Cecosesolaorg/Prueba-Javier-Camero";
        try {
            const resp = await fetch(`https://raw.githubusercontent.com/${repo}/main/data/staff_assignments.json?v=${Date.now()}`);
            if (resp.ok) {
                const cloudStaff = await resp.json();
                if (cloudStaff && cloudStaff.areas) {
                    console.log("☁️ Cargado respaldo de personal desde GitHub");
                    const assignments = {};
                    cloudStaff.areas.forEach(a => {
                        if (a.names && a.names.length > 0 && a.names.some(n => n.trim() !== "")) {
                            assignments[a.title] = a.names.join(" / ");
                        }
                    });
                    if (Object.keys(assignments).length > 0) {
                        publishedStaffData = assignments;
                        localStorage.setItem('cachedPublishedStaff', JSON.stringify(publishedStaffData));
                        renderAssignments("RESPALDO GITHUB");
                        return;
                    }
                }
            }
        } catch (e) {
            console.warn("No se pudo cargar respaldo de GitHub:", e);
        }
        isSyncing = false;
        renderAssignments("LOCAL");
    }

    function renderAssignments(source = "NUBE") {
        if (!assignmentsList) return;
        assignmentsList.innerHTML = '';

        // Estructura base completa
        const displayData = { ...DEFAULT_ASSIGNMENTS };

        // Normalización para comparación (ULTRA SENCILLA PARA EVITAR ERRORES)
        const normalize = s => s ? s.toString().toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/S$/g, "").replace(/\s/g, "") : "";

        // Mapear datos de la nube
        const cloudKeys = Object.keys(publishedStaffData);

        cloudKeys.forEach(cloudKey => {
            const cleanCloud = normalize(cloudKey);
            const namesFromCloud = publishedStaffData[cloudKey];

            let matched = false;
            for (const localArea in displayData) {
                const cleanLocal = normalize(localArea);

                // Si coinciden exactamente o por aproximación
                if (cleanLocal === cleanCloud || cleanLocal.includes(cleanCloud) || cleanCloud.includes(cleanLocal)) {
                    displayData[localArea] = namesFromCloud;
                    matched = true;
                    break;
                }
            }
            // Si el área no existe en el mapa predeterminado, se agrega al final
            if (!matched && cleanCloud !== "") {
                displayData[cloudKey] = namesFromCloud;
            }
        });

        // Título o estado de carga
        const statusHeader = document.createElement('div');
        statusHeader.style.cssText = 'display:flex; justify-content:space-between; align-items:center; font-size:0.7rem; opacity:0.8; margin-bottom:12px; color:var(--accent); background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.1);';

        const count = cloudKeys.length;
        statusHeader.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:2px;">
                <span>${isSyncing ? '⌛ Conectando...' : (count > 0 ? `✅ ${count} áreas (${source})` : '⚠️ No hay lista')}</span>
                <span style="font-size:0.55rem; opacity:0.6;">${new Date().toLocaleTimeString()}</span>
            </div>
            <div style="display:flex; gap:5px;">
                <button id="refreshSyncBtn" style="background:var(--primary); color:white; border:none; padding:4px 8px; border-radius:5px; cursor:pointer; font-size:0.6rem; font-weight:bold;">🔄 RECARGAR</button>
                <button id="hardResetBtn" style="background:#ff4757; color:white; border:none; padding:4px 8px; border-radius:5px; cursor:pointer; font-size:0.6rem; font-weight:bold;">RESET</button>
            </div>
        `;
        assignmentsList.appendChild(statusHeader);

        const refreshBtn = document.getElementById('refreshSyncBtn');
        if (refreshBtn) {
            refreshBtn.onclick = (e) => {
                e.stopPropagation();
                location.reload();
            };
        }

        const resetBtn = document.getElementById('hardResetBtn');
        if (resetBtn) {
            resetBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm("¿Limpiar memoria del sistema y reintentar? Esto borrará todos los datos guardados localmente.")) {
                    localStorage.clear();
                    location.reload();
                }
            };
        }

        const areas = Object.keys(displayData);
        areas.sort().forEach(area => {
            const names = displayData[area] || "---";
            const item = document.createElement('div');
            item.className = 'assignment-item';
            // Hacerlo cliqueable para auto-rellenar
            item.style.cursor = 'pointer';
            item.title = "Haz clic para seleccionar este pasillo";

            item.innerHTML = `
                <div class="assignment-info">
                    <span class="assignment-aisle">${area}</span>
                    <span class="assignment-names">${names.toLowerCase()}</span>
                </div>
                <span class="select-indicator">➡️</span>
            `;

            item.onclick = () => {
                // 1. Seleccionar el pasillo en el dropdown
                const aisleSelect = document.getElementById('assignedAisle');
                if (aisleSelect) {
                    // Intentamos encontrar la opción que más se parezca
                    for (let i = 0; i < aisleSelect.options.length; i++) {
                        if (normalize(aisleSelect.options[i].value) === normalize(area)) {
                            aisleSelect.selectedIndex = i;
                            break;
                        }
                    }
                }

                // 2. Extraer el primer nombre para el campo Responsable (SISTEMA)
                const firstName = names.split('/')[0].split(' ')[0].trim();
                const responsableInput = document.getElementById('responsable');
                if (responsableInput && firstName !== "---") {
                    responsableInput.value = firstName;
                }

                // 3. Cerrar el modal
                assignmentsModal.style.display = 'none';

                // 4. Efecto visual de focus
                if (aisleSelect) aisleSelect.focus();
            };

            assignmentsList.appendChild(item);
        });
    }

    if (assignmentsBtn) {
        assignmentsBtn.onclick = () => {
            assignmentsModal.style.display = 'flex';
        };
    }

    if (closeAssignmentsBtn) {
        closeAssignmentsBtn.onclick = () => {
            assignmentsModal.style.display = 'none';
        };
    }

    // --- LÓGICA DE REINICIO DE CICLO (8 DÍAS) ---
    const cycleBtn = document.getElementById('cycleResetBtn');
    const cycleText = document.getElementById('cycleStatusText');
    const CYCLE_DAYS = 8;
    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    function updateCycleUI() {
        let lastReset = localStorage.getItem('lastCycleResetDate');
        if (!lastReset) {
            lastReset = Date.now();
            localStorage.setItem('lastCycleResetDate', lastReset);
        }

        const elapsedMs = Date.now() - parseInt(lastReset);
        const elapsedDays = Math.floor(elapsedMs / MS_PER_DAY);
        const daysRemaining = CYCLE_DAYS - elapsedDays;

        if (elapsedDays >= CYCLE_DAYS) {
            cycleBtn.classList.add('ready');
            cycleText.textContent = "CICLO COMPLETADO: RESETEAR";
            cycleBtn.querySelector('.cycle-icon').textContent = "✅";
        } else {
            cycleBtn.classList.remove('ready');
            cycleText.textContent = `Día ${elapsedDays + 1} de ${CYCLE_DAYS} (Faltan ${daysRemaining})`;
            cycleBtn.querySelector('.cycle-icon').textContent = "⏳";
        }
    }

    if (cycleBtn) {
        cycleBtn.addEventListener('click', () => {
            let lastReset = localStorage.getItem('lastCycleResetDate');
            const elapsedMs = Date.now() - parseInt(lastReset);
            const elapsedDays = Math.floor(elapsedMs / MS_PER_DAY);

            let confirmMsg = "¿Confirmas que deseas reiniciar el ciclo de 8 días? Esto borrará todos los conteos actuales de los pasillos para empezar de nuevo.";

            if (elapsedDays < CYCLE_DAYS) {
                const daysLeft = CYCLE_DAYS - elapsedDays;
                confirmMsg = `Aún faltan ${daysLeft} días para completar el ciclo de 8 días.\n\n¿Estás SEGURO de que deseas BORRAR TODO el historial y reiniciar el ciclo ahora?`;
            }

            if (confirm(confirmMsg)) {
                // Borrar datos de inventario y datos de usuario
                const userKeys = [
                    'responsableDirecto', 'userName', 'cecosesolaUser',
                    'companero', 'userLastName', 'isAdmin', 'assignedAisle'
                ];

                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    // Borrar historial de inventario
                    if (key.startsWith('inventoryData_') || key === 'inventoryData') {
                        localStorage.removeItem(key);
                    }
                    // Borrar datos del responsable/equipo
                    if (userKeys.includes(key)) {
                        localStorage.removeItem(key);
                    }
                });

                localStorage.setItem('lastCycleResetDate', Date.now());
                alert("¡Sistema reiniciado con éxito! Se han borrado los conteos y el responsable.");
                location.reload();
            }
        });

        // Actualizar al cargar
        updateCycleUI();
        // Chequeo automático cada minuto mientras la pestaña esté abierta
        setInterval(updateCycleUI, 60000);
    }

    // Botón de Sincronización GitHub
    const githubSyncBtn = document.getElementById('githubSyncBtn');
    if (githubSyncBtn) {
        githubSyncBtn.onclick = syncToGitHub;
    }
});
