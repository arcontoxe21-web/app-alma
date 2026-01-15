/**
 * SOS Rescue Module - Sistema de Alertas SOS con GPS
 * Implementación limpia y funcional
 */

// Variables globales del módulo
let sosMap = null;
let sosMarker = null;
let currentPosition = null;
let gpsWatchId = null;

// Configuración
const DEFAULT_POSITION = [40.4168, -3.7038]; // Madrid
const MAP_ZOOM = 15;

// Flag para evitar múltiples inicializaciones de GPS y event listeners
let sosSystemInitialized = false;

/**
 * Inicializa el sistema SOS completo
 */
function initSOSSystem() {
    console.log("🆘 SOS System: Iniciando...");

    // Configurar tabs SIEMPRE (la función internamente evita duplicados)
    setupRescueTabs();

    // Inicializar mapa
    initSOSMap();

    // Inicializar GPS y listeners solo la primera vez
    if (!sosSystemInitialized) {
        initGPS();
        setupSOSEventListeners();
        sosSystemInitialized = true;
    }

    console.log("✅ SOS System: Listo");
}

/**
 * Inicializa el mapa Leaflet
 */
function initSOSMap() {
    const mapContainer = document.getElementById('rescue-map');
    if (!mapContainer) {
        // Can fail silently if we are not in the right tab
        return;
    }

    // Verificar si Leaflet está disponible
    if (typeof L === 'undefined') {
        console.error("❌ SOS Map: Leaflet no disponible");
        return;
    }

    // CRITICAL: Check if map instance refers to a valid container
    if (sosMap) {
        try {
            const container = sosMap.getContainer();
            // If container is different from current one (DOM replaced), destroy and recreate
            if (container !== mapContainer && container.parentElement !== mapContainer) {
                console.log("📍 SOS Map: Container mismatch, resetting map...");
                sosMap.remove();
                sosMap = null;
            } else {
                console.log("📍 SOS Map: Refrescando mapa existente");
                setTimeout(() => {
                    sosMap.invalidateSize();
                    if (currentPosition) sosMap.setView(currentPosition, MAP_ZOOM);
                }, 100);
                return;
            }
        } catch (e) {
            console.warn("⚠️ Error checking map container, forcing reset:", e);
            sosMap = null;
        }
    }

    // Usar última posición guardada o default
    const savedPos = localStorage.getItem('sos_last_position');
    const startPos = savedPos ? JSON.parse(savedPos) : DEFAULT_POSITION;

    console.log("📍 SOS Map: Creando mapa en", startPos);

    // Crear mapa
    try {
        sosMap = L.map('rescue-map', {
            zoomControl: false,
            attributionControl: false
        }).setView(startPos, MAP_ZOOM);

        // Añadir tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(sosMap);

        // Crear marcador
        sosMarker = L.marker(startPos, { draggable: true }).addTo(sosMap);

        // Eventos map
        sosMap.on('click', function (e) {
            const pos = [e.latlng.lat, e.latlng.lng];
            if (sosMarker) sosMarker.setLatLng(pos);
            currentPosition = pos;
            updateLocationDisplay(pos, "manual");
        });

        // Eventos marker
        sosMarker.on('dragend', function (e) {
            const pos = e.target.getLatLng();
            currentPosition = [pos.lat, pos.lng];
            savePosition(currentPosition);
            updateLocationDisplay(currentPosition, "manual");
        });
    } catch (err) {
        console.error("Error creating Leaflet map:", err);
    }

    // Actualizar posición inicial
    currentPosition = startPos;
    updateLocationDisplay(startPos, "saved");

    console.log("✅ SOS Map: Mapa creado correctamente");
}

/**
 * Inicializa el sistema GPS
 */
function initGPS() {
    if (!navigator.geolocation) {
        console.warn("⚠️ GPS: No disponible en este dispositivo");
        showLocationStatus("GPS no disponible", "warning");
        return;
    }

    showLocationStatus("Buscando ubicación GPS...", "loading");

    // Obtener posición inicial
    navigator.geolocation.getCurrentPosition(
        (position) => {
            handleGPSSuccess(position, "initial");
        },
        (error) => {
            handleGPSError(error, "initial");
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        }
    );

    // Iniciar seguimiento continuo
    startGPSWatch();
}

/**
 * Inicia el seguimiento GPS continuo
 */
function startGPSWatch() {
    if (gpsWatchId) {
        navigator.geolocation.clearWatch(gpsWatchId);
    }

    gpsWatchId = navigator.geolocation.watchPosition(
        (position) => {
            handleGPSSuccess(position, "watch");
        },
        (error) => {
            // Solo logear, no mostrar error en watch
            console.warn("📍 GPS Watch error:", error.message);
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 5000
        }
    );
}

/**
 * Maneja éxito de GPS
 */
function handleGPSSuccess(position, source) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const accuracy = position.coords.accuracy;

    console.log(`✅ GPS (${source}): ${lat.toFixed(5)}, ${lng.toFixed(5)} (±${Math.round(accuracy)}m)`);

    const newPos = [lat, lng];

    // Solo actualizar si la nueva posición es significativamente diferente
    if (currentPosition && sosMap) {
        const distance = sosMap.distance(currentPosition, newPos);
        if (distance < 10 && source === "watch") {
            return; // Ignorar cambios menores de 10m
        }
    }

    currentPosition = newPos;
    savePosition(currentPosition);

    // Actualizar mapa
    if (sosMap && sosMarker) {
        sosMap.setView(currentPosition, MAP_ZOOM);
        sosMarker.setLatLng(currentPosition);
    }

    // Actualizar display
    updateLocationDisplay(currentPosition, "gps", accuracy);
}

/**
 * Maneja error de GPS
 */
function handleGPSError(error, source) {
    console.warn(`⚠️ GPS Error (${source}):`, error.message);

    let message = "No se pudo obtener la ubicación";

    switch (error.code) {
        case error.PERMISSION_DENIED:
            message = "Permiso de ubicación denegado";
            break;
        case error.POSITION_UNAVAILABLE:
            message = "Ubicación no disponible";
            break;
        case error.TIMEOUT:
            message = "Tiempo de espera agotado";
            break;
    }

    if (source === "initial") {
        showLocationStatus(message + ". Arrastra el pin.", "error");

        // Intentar fallback por IP
        fallbackToIPLocation();
    }
}

/**
 * Fallback: obtener ubicación por IP
 */
async function fallbackToIPLocation() {
    try {
        console.log("📍 Intentando ubicación por IP...");
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        if (data.latitude && data.longitude) {
            const ipPos = [data.latitude, data.longitude];
            console.log("✅ Ubicación por IP:", ipPos);

            currentPosition = ipPos;
            savePosition(currentPosition);

            if (sosMap && sosMarker) {
                sosMap.setView(currentPosition, 13); // Zoom menor para IP
                sosMarker.setLatLng(currentPosition);
            }

            updateLocationDisplay(currentPosition, "ip");
            showToast("📍 Ubicación aproximada por red", "info");
        }
    } catch (e) {
        console.warn("⚠️ Fallback IP falló:", e);
    }
}

/**
 * Fuerza re-localización GPS
 */
function forceLocate() {
    console.log("🔄 Forzando re-localización...");
    showLocationStatus("Buscando señal GPS...", "loading");

    if (gpsWatchId) {
        navigator.geolocation.clearWatch(gpsWatchId);
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            handleGPSSuccess(position, "forced");
            showToast("✅ Ubicación actualizada", "success");
            startGPSWatch();
        },
        (error) => {
            handleGPSError(error, "forced");
            startGPSWatch();
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
}

/**
 * Busca una dirección y centra el mapa
 */
async function searchAddress() {
    const input = document.getElementById('search-address-input');
    if (!input || !input.value.trim()) {
        showToast("Escribe una dirección para buscar", "warning");
        return;
    }

    const address = input.value.trim();
    console.log("🔍 Buscando dirección:", address);

    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
        const response = await fetch(url);
        const results = await response.json();

        if (results && results.length > 0) {
            const result = results[0];
            const newPos = [parseFloat(result.lat), parseFloat(result.lon)];

            console.log("✅ Dirección encontrada:", result.display_name);

            currentPosition = newPos;
            savePosition(currentPosition);

            if (sosMap && sosMarker) {
                sosMap.setView(currentPosition, MAP_ZOOM);
                sosMarker.setLatLng(currentPosition);
            }

            updateLocationDisplay(currentPosition, "search", null, result.display_name);
            showToast("📍 " + result.display_name.split(',')[0], "success");
        } else {
            showToast("No se encontró la dirección", "error");
        }
    } catch (e) {
        console.error("Error buscando dirección:", e);
        showToast("Error al buscar dirección", "error");
    }
}

/**
 * Actualiza el display de ubicación
 */
function updateLocationDisplay(position, source, accuracy, addressName) {
    const display = document.getElementById('location-display');
    if (!display) return;

    let icon = 'fa-location-crosshairs';
    let text = '';

    if (source === "gps") {
        icon = 'fa-satellite';
        text = `${position[0].toFixed(5)}, ${position[1].toFixed(5)}`;
        if (accuracy) {
            text += ` (±${Math.round(accuracy)}m)`;
        }
    } else if (source === "ip") {
        icon = 'fa-wifi';
        text = `${position[0].toFixed(4)}, ${position[1].toFixed(4)} (aproximado)`;
    } else if (source === "manual") {
        icon = 'fa-hand-pointer';
        text = `${position[0].toFixed(5)}, ${position[1].toFixed(5)} (manual)`;
    } else if (source === "search" && addressName) {
        icon = 'fa-magnifying-glass-location';
        text = addressName.substring(0, 50) + (addressName.length > 50 ? '...' : '');
    } else {
        text = `${position[0].toFixed(5)}, ${position[1].toFixed(5)}`;
    }

    display.innerHTML = `<i class="fa-solid ${icon}" style="color: var(--primary); margin-right: 8px;"></i>${text}`;
}

/**
 * Muestra estado de ubicación (loading, error, etc)
 */
function showLocationStatus(message, type) {
    const display = document.getElementById('location-display');
    if (!display) return;

    let icon = 'fa-circle-info';
    let color = 'var(--text-muted)';

    if (type === "loading") {
        icon = 'fa-spinner fa-spin';
        color = 'var(--primary)';
    } else if (type === "error") {
        icon = 'fa-triangle-exclamation';
        color = 'var(--danger)';
    } else if (type === "warning") {
        icon = 'fa-circle-exclamation';
        color = '#ffcc00';
    }

    display.innerHTML = `<i class="fa-solid ${icon}" style="color: ${color}; margin-right: 8px;"></i>${message}`;
}

/**
 * Guarda la posición en localStorage
 */
function savePosition(position) {
    localStorage.setItem('sos_last_position', JSON.stringify(position));
}

/**
 * Configura los event listeners del SOS
 */
function setupSOSEventListeners() {
    // Botón de localizar
    const locateBtn = document.getElementById('btn-locate-me');
    if (locateBtn) {
        locateBtn.onclick = forceLocate;
    }

    // Botón de buscar dirección
    const searchBtn = document.getElementById('btn-search-address');
    if (searchBtn) {
        searchBtn.onclick = searchAddress;
    }

    // Enter en campo de búsqueda
    const searchInput = document.getElementById('search-address-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchAddress();
            }
        });
    }

    // Botón de enviar alerta
    const submitBtn = document.getElementById('btn-submit-rescue');
    if (submitBtn) {
        submitBtn.onclick = submitRescueAlert;
    }
}

/**
 * Maneja selección de foto
 */
function handlePhotoSelect(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const preview = document.getElementById('rescue-photo-preview');
            const img = document.getElementById('preview-img');
            if (preview && img) {
                img.src = e.target.result;
                preview.style.display = 'block';
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
}

/**
 * Limpia la foto seleccionada
 */
function clearPhoto() {
    const preview = document.getElementById('rescue-photo-preview');
    const input = document.getElementById('rescue-photo');
    const img = document.getElementById('preview-img');

    if (preview) preview.style.display = 'none';
    if (input) input.value = '';
    if (img) img.src = '';
}

/**
 * Envía la alerta de rescate
 */
async function submitRescueAlert() {
    // Validar ubicación
    if (!currentPosition) {
        showToast("⚠️ Primero selecciona una ubicación", "error");
        return;
    }

    // Recoger datos del formulario
    const type = document.getElementById('rescue-type')?.value || 'otro';
    const condition = document.getElementById('rescue-condition')?.value || '';
    const photoInput = document.getElementById('rescue-photo');
    const photoFile = photoInput && photoInput.files && photoInput.files[0];

    // Validar descripción
    if (!condition.trim()) {
        showToast("⚠️ Describe la situación del animal", "error");
        return;
    }

    // Procesar foto si existe
    let photoUrl = null;
    if (photoFile) {
        try {
            photoUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(photoFile);
            });
        } catch (e) {
            console.error("Error leyendo foto:", e);
        }
    }

    // Crear objeto de alerta
    const alert = {
        id: 'sos-' + Date.now(),
        type: type,
        condition: condition,
        status: 'En espera', // Evita crash en enterRescueChat (.toUpperCase)
        position: currentPosition,
        loc: currentPosition, // COMPATIBILIDAD: main.js espera .loc
        hasPhoto: !!photoUrl,
        photoUrl: photoUrl, // AÑADIDO: URL de la imagen para mostrar en chat
        timestamp: new Date().toISOString(),
        user: window.Auth?.user?.name || 'Anónimo',
        messages: ['ALERTA DE CAMPO', condition], // COMPATIBILIDAD: main.js usa índice 1 como descripción
        title: `SOS: ${type.toUpperCase()}`,
        address: `Lat: ${currentPosition[0].toFixed(4)}, Lng: ${currentPosition[1].toFixed(4)}`, // En production usar geocoding reverso real
        distance: '0.0'
    };

    // Guardar en array global
    communityAlerts.unshift(alert);
    if (window.sosAlerts) window.sosAlerts = communityAlerts;

    // PERSISTENCIA: Guardar en localStorage
    localStorage.setItem('sos_community_alerts', JSON.stringify(communityAlerts));

    console.log("🆘 Enviando alerta SOS:", alert);

    // Actualizar UI
    renderAlertList();

    // Cambiar a tab radar (esto dispara initRadarMap -> refreshRadarMarkers)
    const radarTab = document.querySelector('.rescue-tab[data-tab="radar"]');
    if (radarTab) radarTab.click();

    // Simular envío (aquí iría la llamada a tu backend)
    showToast("🆘 ¡Alerta SOS enviada correctamente!", "success");

    // Limpiar formulario
    document.getElementById('rescue-condition').value = '';
    clearPhoto();

    // Mostrar confirmación visual
    const submitBtn = document.getElementById('btn-submit-rescue');
    if (submitBtn) {
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-check" style="margin-right: 10px;"></i> ¡ALERTA ENVIADA!';
        submitBtn.style.background = 'var(--primary)';

        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.style.background = 'var(--danger)';
        }, 3000);
    }
}

/**
 * Muestra un toast de notificación
 * Usa implementación local simple para evitar conflictos con main.js
 */
function showToast(message, type = "info") {
    // Usar fallback local simple
    const existing = document.querySelector('.sos-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'sos-toast';
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? '#ff3b30' : type === 'success' ? '#10fbba' : '#333'};
        color: ${type === 'success' ? '#000' : '#fff'};
        padding: 12px 24px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        z-index: 9999;
        animation: fadeInUp 0.3s ease;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}

// ============== RADAR SOCIAL ==============

let radarMap = null;
let radarMarkers = null; // LayerGroup para gestionar marcadores

// Cargar alertas guardadas o usar defaults
const savedAlerts = localStorage.getItem('sos_community_alerts');
const defaultAlerts = [
    { id: 'al-1', type: 'Gato', status: 'En espera', loc: [40.4233, -3.6912], address: 'Calle de Hortaleza, 48, Madrid', title: 'Gato atrapado en cornisa', user: 'Ana M.', messages: ['ALERTA DE CAMPO', 'Se encuentra en el tercer piso...'] },
    { id: 'al-2', type: 'Perro', status: 'Coordinando', loc: [40.4100, -3.7150], address: 'C. de Toledo, 72, Madrid', title: 'Perro herido en parque', user: 'Marcos T.', messages: ['ALERTA DE CAMPO', 'Cojea de la pata trasera...'] }
];

const communityAlerts = savedAlerts ? JSON.parse(savedAlerts) : defaultAlerts;

// Exponer globalmente para que main.js pueda acceder (chat)
window.sosAlerts = communityAlerts;

/**
 * Inicializa el mapa del Radar Social
 */
function initRadarMap() {
    const mapContainer = document.getElementById('radar-map');
    if (!mapContainer || typeof L === 'undefined') return;

    if (radarMap) {
        console.log("📍 Radar Map: Refrescando mapa existente");
        setTimeout(() => {
            radarMap.invalidateSize();
            if (currentPosition) {
                radarMap.setView(currentPosition, 13);
            }
        }, 100);
    } else {
        const startPos = currentPosition || DEFAULT_POSITION;

        radarMap = L.map('radar-map', {
            zoomControl: true,
            attributionControl: false
        }).setView(startPos, 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(radarMap);

        // Inicializar layer group de marcadores
        radarMarkers = L.layerGroup().addTo(radarMap);
    }

    // SIEMPRE refrescar los marcadores al iniciar el mapa
    refreshRadarMarkers();

    // Renderizar lista de alertas
    renderAlertList();

    console.log("✅ Radar Map: Inicializado y Sincronizado");
}

/**
 * Borra y vuelve a pintar los marcadores del radar
 */
function refreshRadarMarkers() {
    if (!radarMap || !radarMarkers) return;

    radarMarkers.clearLayers(); // Limpiar anteriores

    communityAlerts.forEach(alert => {
        const pos = alert.loc || alert.position;
        if (!pos) return;

        const icon = L.divIcon({
            className: 'alert-marker',
            html: `<div style="
                width: 32px; height: 32px;
                background: ${alert.status === 'En espera' ? '#ff3b30' : '#ff9500'};
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                color: white; font-weight: bold; font-size: 14px;
                border: 3px solid white;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            ">${alert.type === 'Gato' ? '🐱' : '🐕'}</div>`,
            iconSize: [32, 32]
        });

        const marker = L.marker(pos, { icon });

        marker.bindPopup(`
                <div style="font-family: sans-serif; min-width: 200px;">
                    <strong style="font-size: 14px;">${alert.title}</strong><br>
                    <span style="color: #666; font-size: 12px;">📍 ${alert.address || 'Ubicación desconocida'}</span><br>
                    <span style="color: ${alert.status === 'En espera' ? '#ff3b30' : '#ff9500'}; font-size: 11px; font-weight: 600;">
                        ● ${alert.status}
                    </span>
                </div>
            `);

        marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            focusAlert(alert.id);
        });

        radarMarkers.addLayer(marker);
    });
}

/**
 * Renderiza la lista de alertas del Radar
 */
function renderAlertList() {
    const container = document.getElementById('community-alerts-list');
    if (!container) {
        console.warn("⚠️ Radar List: No se encontró el contenedor 'community-alerts-list'");
        return;
    }

    container.innerHTML = communityAlerts.map(alert => `
        <div style="
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 16px;
            padding: 15px;
            margin-bottom: 12px;
            cursor: pointer;
            transition: all 0.2s;
        " onmouseover="this.style.background='rgba(16,251,186,0.05)'" 
           onmouseout="this.style.background='rgba(255,255,255,0.03)'"
           onmouseout="this.style.background='rgba(255,255,255,0.03)'"
           onclick="focusAlert('${alert.id}')">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <span style="font-size: 20px;">${alert.type === 'Gato' ? '🐱' : '🐕'}</span>
                <span style="
                    background: ${alert.status === 'En espera' ? 'rgba(255,59,48,0.2)' : 'rgba(255,149,0,0.2)'};
                    color: ${alert.status === 'En espera' ? '#ff3b30' : '#ff9500'};
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 700;
                ">${alert.status}</span>
            </div>
            <h4 style="font-size: 14px; font-weight: 700; margin: 0 0 5px 0;">${alert.title}</h4>
            <p style="font-size: 12px; color: var(--text-muted); margin: 0;">
                <i class="fa-solid fa-location-dot" style="margin-right: 5px;"></i>${alert.address}
            </p>
            <p style="font-size: 11px; color: var(--text-dim); margin: 5px 0 0 0;">
                Reportado por ${alert.user}
            </p>
        </div>
    `).join('');
}

/**
 * Centra el mapa del Radar en una alerta específica
 */
function focusAlert(alertId) {
    // Si queremos abrir el chat directament:
    if (window.enterRescueChat) {
        window.enterRescueChat(alertId);
        return;
    }

    const alert = communityAlerts.find(a => a.id === alertId);
    if (alert && radarMap) {
        radarMap.setView(alert.loc || alert.position, 16);
        showToast(`Viendo: ${alert.title}`, 'info');
    }
}

/**
 * Configura los tabs del Centro de Rescate
 * Usa data-listener para evitar añadir listeners duplicados
 */
function setupRescueTabs() {
    const tabs = document.querySelectorAll('.rescue-tab');

    if (tabs.length === 0) {
        console.warn("⚠️ SOS Tabs: No se encontraron tabs (.rescue-tab)");
        return false; // Indicar que no se pudo inicializar
    }

    let listenersAdded = 0;

    tabs.forEach(tab => {
        // Solo añadir listener si no tiene uno ya
        if (tab.dataset.listenerAttached === 'true') {
            return;
        }

        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            console.log(`📌 Tab clicked: ${tabId}`);

            // Actualizar estilos de tabs
            document.querySelectorAll('.rescue-tab').forEach(t => {
                t.classList.remove('active');
                t.style.color = 'var(--text-dim)';
            });
            tab.classList.add('active');
            tab.style.color = 'var(--primary)';

            // Mostrar contenido correspondiente
            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            const content = document.getElementById(`tab-${tabId}`);
            if (content) content.style.display = 'block';

            if (tabId === 'report') {
                initSOSMap();
            } else if (tabId === 'radar') {
                initRadarMap();
            }
        });

        // Marcar que este tab ya tiene listener
        tab.dataset.listenerAttached = 'true';
        listenersAdded++;
    });

    console.log(`✅ SOS Tabs: ${listenersAdded} listeners añadidos`);
    return listenersAdded > 0;
}

// Exponer funciones al window
window.initSOSSystem = initSOSSystem;
window.initSOSMap = initSOSMap;
window.initRescueMap = initSOSMap; // Alias para compatibilidad con main.js
window.forceLocate = forceLocate;
window.searchAddress = searchAddress;
window.handlePhotoSelect = handlePhotoSelect;
window.clearPhoto = clearPhoto;
window.submitRescueAlert = submitRescueAlert;
window.initRadarMap = initRadarMap;
window.focusAlert = focusAlert;
window.setupRescueTabs = setupRescueTabs;

// Auto-inicializar cuando se carga el script
console.log("🆘 SOS Module: Cargado y listo");
