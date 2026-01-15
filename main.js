import { getVetResponse, initVetSession } from './services/gemini.js';

// --- GLOBAL MAP VARIABLES (must be declared early to avoid TDZ) ---
let rescueMap, rescueMarker, radarMap;

/* --- AUTHENTICATION MODULE v2.0 --- */
const Auth = {
    user: null,

    // Inicializar desde localStorage
    init() {
        try {
            const stored = localStorage.getItem('alma_user');
            if (stored) {
                this.user = JSON.parse(stored);
                console.log('✅ Sesión restaurada para:', this.user.name);
            }
        } catch (e) {
            console.warn('Error al restaurar sesión:', e);
            localStorage.removeItem('alma_user');
        }
    },

    // Registrar nuevo usuario (solo nombre y contraseña)
    register(name, password, animalType = 'wolf') {
        // Verificar si el nombre ya existe
        const existingUsers = this.getAllUsers();
        if (existingUsers.find(u => u.name.toLowerCase() === name.toLowerCase())) {
            return { success: false, error: 'Este nombre de usuario ya existe' };
        }

        const newUser = {
            id: 'user_' + Date.now(),
            name: name.trim(),
            password: password, // En producción: hashear
            animalType: animalType,
            avatar: this.getAnimalAvatar(animalType),
            level: 1,
            xp: 0,
            stats: {
                alerts: 0,
                sponsored: 0,
                events: 0
            },
            history: [
                { date: new Date().toLocaleDateString(), action: 'Te has unido a la Manada', icon: 'fa-paw' }
            ],
            createdAt: new Date().toISOString()
        };

        // Guardar en lista de usuarios
        existingUsers.push({ name: newUser.name, password: newUser.password, id: newUser.id });
        localStorage.setItem('alma_users', JSON.stringify(existingUsers));

        // Guardar sesión actual
        localStorage.setItem('alma_user', JSON.stringify(newUser));
        this.user = newUser;

        console.log('✅ Usuario registrado:', name);
        return { success: true, user: newUser };
    },

    // Login con nombre y contraseña
    login(name, password) {
        const users = this.getAllUsers();
        const found = users.find(u =>
            u.name.toLowerCase() === name.toLowerCase() &&
            u.password === password
        );

        if (found) {
            // Buscar datos completos del usuario
            const stored = localStorage.getItem('alma_user');
            let userData = stored ? JSON.parse(stored) : null;

            // Si el usuario guardado no es el que hace login, crear uno nuevo
            if (!userData || userData.name.toLowerCase() !== name.toLowerCase()) {
                userData = {
                    id: found.id,
                    name: found.name,
                    password: found.password,
                    animalType: 'wolf',
                    avatar: this.getAnimalAvatar('wolf'),
                    level: 1,
                    xp: 0,
                    stats: { alerts: 0, sponsored: 0, events: 0 },
                    history: [{ date: new Date().toLocaleDateString(), action: 'Sesión iniciada', icon: 'fa-sign-in' }]
                };
            }

            localStorage.setItem('alma_user', JSON.stringify(userData));
            this.user = userData;
            console.log('✅ Login exitoso:', name);
            return { success: true };
        }

        return { success: false, error: 'Usuario o contraseña incorrectos' };
    },

    // Login con Google (DEMO - simulado)
    async loginWithGoogle() {
        // Simulamos un pequeño delay para parecer real
        await new Promise(resolve => setTimeout(resolve, 800));

        // Generar nombre aleatorio para la demo
        const nombres = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn'];
        const randomName = nombres[Math.floor(Math.random() * nombres.length)];

        const mockGoogleUser = {
            id: 'google_' + Date.now(),
            name: randomName,
            email: randomName.toLowerCase() + '@gmail.com',
            animalType: 'eagle',
            avatar: 'https://ui-avatars.com/api/?name=' + randomName + '&background=10fbba&color=000&size=200&bold=true',
            level: 1,
            xp: 0,
            stats: { alerts: 0, sponsored: 0, events: 0 },
            history: [{ date: new Date().toLocaleDateString(), action: 'Conectado con Google', icon: 'fa-google' }],
            isGoogleUser: true
        };

        localStorage.setItem('alma_user', JSON.stringify(mockGoogleUser));
        this.user = mockGoogleUser;

        return { success: true, user: mockGoogleUser };
    },

    // Obtener todos los usuarios registrados
    getAllUsers() {
        try {
            const users = localStorage.getItem('alma_users');
            return users ? JSON.parse(users) : [];
        } catch (e) {
            return [];
        }
    },

    logout() {
        localStorage.removeItem('alma_user');
        this.user = null;
        window.location.reload();
    },

    getAnimalAvatar(type) {
        const avatars = {
            'wolf': 'https://images.unsplash.com/photo-1534251369789-5067c8b8dc32?q=80&w=200&auto=format&fit=crop',
            'fox': 'https://images.unsplash.com/photo-1516934024742-b461fba47600?q=80&w=200&auto=format&fit=crop',
            'eagle': 'https://images.unsplash.com/photo-1611000962228-444f5bd63ac9?q=80&w=200&auto=format&fit=crop',
            'cat': 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=200&auto=format&fit=crop',
            'lion': 'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?q=80&w=200&auto=format&fit=crop'
        };
        return avatars[type] || avatars['wolf'];
    },

    updateUI() {
        // EXCEPCIÓN: Si estamos en la Landing Page del navegador, no forzar login aún
        const isLandingActive = document.getElementById('screen-landing')?.classList.contains('active');
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

        if (isLandingActive && !isStandalone && !this.user) {
            console.log("🛑 Auth: Landing PWA activa en navegador. Esperando instalación o login manual.");
            return;
        }

        if (this.user) {
            // Update Header Name
            const nameEl = document.querySelector('#screen-home h1');
            if (nameEl) nameEl.innerHTML = `Hola, ${this.user.name.split(' ')[0]} <span style="font-size: 20px;">👋</span>`;

            // Update Avatars
            document.querySelectorAll('.user-avatar img').forEach(img => {
                img.src = this.user.avatar;
            });

            // Show App, Hide Login
            document.getElementById('screen-login')?.classList.remove('active');
            document.getElementById('screen-register')?.classList.remove('active');
            document.getElementById('screen-landing')?.classList.remove('active');

            // Ocultar landing completamente
            const landing = document.getElementById('screen-landing');
            if (landing) landing.style.display = 'none';

            // Mostrar home y nav
            document.getElementById('screen-home')?.classList.add('active');
            document.querySelector('.bottom-nav')?.classList.remove('hidden');

            console.log('✅ UI actualizada para usuario:', this.user.name);
        } else {
            // No hay usuario - mostrar registro
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById('screen-register')?.classList.add('active');
            document.querySelector('.bottom-nav')?.classList.add('hidden');
        }
    }
};

// Inicializar Auth al cargar
Auth.init();
window.Auth = Auth;



// El array 'animals' ahora se carga desde public/data.js
// y está disponible globalmente como window.animals
const animals = window.animals || [];


// --- CATALOG LOGIC ---

function filterCatalog(category, btnElement) {
    // 1. Update UI Filters
    if (btnElement) {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        btnElement.classList.add('active');
    }

    const list = document.getElementById('full-catalog-list');
    const donationContainer = document.getElementById('donation-container');

    // Handle 'donate' view separate from animal list
    if (category === 'donate') {
        if (list) list.style.display = 'none';
        if (donationContainer) {
            donationContainer.style.display = 'block';
            renderDonationUI(donationContainer);
        }
        return;
    }

    // Handle normal animal views
    if (list) list.style.display = 'grid'; // Restore grid
    if (donationContainer) donationContainer.style.display = 'none';

    if (!list) return;
    list.innerHTML = '';

    const filtered = category === 'all' ? animals : animals.filter(a => a.type === category || (category === 'urgent' && a.urgent));

    if (filtered.length === 0) {
        list.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: gray;">No hay animales en esta categoría.</div>`;
    } else {
        filtered.forEach(a => {
            list.appendChild(createAnimalCard(a));
        });
    }
}

// Expose filterCatalog globally for HTML onclicks
window.filterCatalog = filterCatalog;

const posts = window.posts || [
    { id: 1, author: 'Marta Soler', text: 'MAXIMUS hoy nos ha dado una lección de coraje.', img: animals[0]?.imageUrl, likes: 45, time: '1h' },
    { id: 2, author: 'Refugio Alma', text: 'Nuevas llegadas al santuario.', img: animals[1]?.imageUrl, likes: 89, time: '3h' }
];


/* --- DONATION UI --- */
function renderDonationUI(container) {
    container.innerHTML = `
        <div class="glass-card" style="padding: 30px; text-align: center; border: 1px solid rgba(16, 251, 186, 0.2); background: linear-gradient(135deg, rgba(8,8,8,0.95), rgba(20,20,20,0.9)); margin-bottom: 25px;">
            <div style="width: 80px; height: 80px; background: rgba(16, 251, 186, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 0 20px rgba(16, 251, 186, 0.1);">
                <i class="fa-solid fa-hand-holding-heart" style="font-size: 32px; color: var(--primary);"></i>
            </div>
            <h3 style="font-size: 24px; font-weight: 900; margin-bottom: 10px;">Tu Ayuda Salva Vidas</h3>
            <p style="color: var(--text-muted); font-size: 15px; line-height: 1.6; margin-bottom: 25px;">Cada euro se destina íntegramente a tratamientos veterinarios y alimentación de rescates críticos.</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 25px;">
                <button onclick="window.location.href='#'" style="padding: 15px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; color: white; font-weight: 700; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                    5€ <span style="font-size: 10px; opacity: 0.7;">/ mes</span>
                </button>
                <button onclick="window.location.href='#'" style="padding: 15px; background: var(--primary); color: #000; border: none; border-radius: 16px; font-weight: 800; cursor: pointer; box-shadow: 0 5px 15px rgba(16, 251, 186, 0.3);">
                    15€ <span style="font-size: 10px; opacity: 0.7;">/ mes</span>
                </button>
            </div>

            <button class="btn-primary" style="width: 100%; border-radius: 18px; padding: 18px; font-size: 16px;" onclick="window.open('https://paypal.me/almarescue', '_blank')">
                <i class="fa-brands fa-paypal" style="margin-right: 10px;"></i> Donación Puntual
            </button>
            <p style="font-size: 11px; color: var(--text-dim); margin-top: 15px;">🔒 Pago seguro vía PayPal / Stripe</p>
        </div>

        <h4 style="font-size: 14px; font-weight: 800; margin-bottom: 15px; color: var(--text-muted); letter-spacing: 1px;">IMPACTO REAL</h4>
        <div style="display: flex; gap: 15px; overflow-x: auto; padding-bottom: 10px;">
            <div style="min-width: 200px; background: var(--bg-surface); padding: 15px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.05);">
                <div style="font-size: 24px; font-weight: 900; color: var(--accent); margin-bottom: 5px;">1.400€</div>
                <div style="font-size: 12px; color: white; font-weight: 700;">Operación de 'Tobby'</div>
                <div style="font-size: 11px; color: var(--text-muted);">Cubierto al 100%</div>
            </div>
             <div style="min-width: 200px; background: var(--bg-surface); padding: 15px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.05);">
                <div style="font-size: 24px; font-weight: 900; color: var(--danger); margin-bottom: 5px;">320 sacos</div>
                <div style="font-size: 12px; color: white; font-weight: 700;">Pienso Mensual</div>
                <div style="font-size: 11px; color: var(--text-muted);">Cubierto al 85%</div>
            </div>
        </div>
    `;
}

/* --- UI TOOLKIT --- */
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type} `;
    const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');
    toast.innerHTML = `
            < i class="fa-solid ${icon}" ></i >
                <span style="font-size: 14px; font-weight: 600;">${message}</span>
        `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        toast.style.transition = 'all 0.4s ease';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

/* --- ROUTER ENGINE --- */
const Router = {
    activeScreen: 'home',
    init() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(link.getAttribute('data-screen'));
            });
        });
    },
    navigate(screenId) {
        this.activeScreen = screenId;

        // Controlar visibilidad de Nav Bar
        const nav = document.querySelector('.bottom-nav');
        if (screenId === 'detail' || screenId === 'chat') {
            nav.classList.add('hidden');
        } else {
            nav.classList.remove('hidden');
        }

        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

        const target = document.getElementById(`screen-${screenId}`);
        if (target) target.classList.add('active');

        const navLink = document.querySelector(`[data-screen="${screenId}"]`);
        if (navLink) navLink.classList.add('active');

        const viewPort = document.getElementById(`screen-${screenId}`);
        if (viewPort) viewPort.scrollTop = 0;

        // Force Social Hub Init
        if (screenId === 'community') {
            console.log("📍 Entering Social Hub (Community ID)...");
            if (window.switchSocialTab) {
                window.switchSocialTab('heroes');
            }
        }

        // Force Rescue/SOS Section Init
        if (screenId === 'rescue') {
            console.log("📍 Router: Entering Rescue Section...");
            // Llamar inmediatamente y con delay para asegurar inicialización
            if (typeof window.initSOSSystem === 'function') {
                console.log("📍 Router: Calling initSOSSystem immediately");
                window.initSOSSystem();
            } else {
                console.error("❌ Router: window.initSOSSystem not found!");
            }
        }
    }
};

// Exports moved to end of file to avoid TDZ errors



/* --- RENDERERS --- */
function createAnimalCard(animal) {
    const div = document.createElement('div');
    div.className = 'animal-card-dark';
    div.innerHTML = `
            <div class="card-img-container">
      <img src="${animal.imageUrl}" loading="lazy">
      <div style="position: absolute; top: 16px; left: 16px;">
        <span class="badge-elite">${animal.status}</span>
      </div>
    </div>
    <div class="card-info-dark">
      <h3 style="font-size: 22px; font-weight: 800; margin-bottom: 4px;">${animal.name}</h3>
      <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 15px;">${animal.breed} • ${animal.age}</p>
      <div style="display: flex; gap: 8px;">
        ${animal.attributes.map(a => `<span class="pill-tag">${a}</span>`).join('')}
      </div>
    </div>
        `;
    div.onclick = () => showDetail(animal);
    return div;
}

function showDetail(animal) {
    const screen = document.getElementById('screen-detail');
    screen.innerHTML = `
            < div style = "position: relative; height: 50vh;" >
      <img src="${animal.imageUrl}" style="width: 100%; height: 100%; object-fit: cover; filter: brightness(0.6);">
      <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(transparent, var(--bg-dark));"></div>
      <button id="close-detail" style="position: absolute; top: 40px; left: 24px; width: 50px; height: 50px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); color: white; cursor: pointer;">
        <i class="fa-solid fa-arrow-left"></i>
      </button>
    </div>
    <div style="padding: 0 30px 150px; margin-top: -60px; position: relative; z-index: 100;">
        <h1 style="font-size: 48px; font-weight: 900; margin-bottom: 30px; font-family: var(--font-display);">${animal.name}</h1>
        
        <div style="display: flex; gap: 12px; margin-bottom: 35px;">
            <div style="flex: 1; background: var(--bg-surface); padding: 22px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.03);">
                <p style="color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase;">EDAD</p>
                <p style="font-weight: 800; font-size: 18px; margin-top: 5px;">${animal.age}</p>
            </div>
            <div style="flex: 1; background: var(--bg-surface); padding: 22px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.03);">
                <p style="color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase;">GENERO</p>
                <p style="font-weight: 800; font-size: 18px; margin-top: 5px;">${animal.gender}</p>
            </div>
        </div>

        <h3 style="font-size: 20px; font-weight: 800; margin-bottom: 12px; color: var(--primary);">NUESTRA HISTORIA</h3>
        <p style="line-height: 1.8; color: var(--text-muted); font-size: 16px; margin-bottom: 40px;">${animal.story}</p>
        
        <div style="background: var(--bg-surface); padding: 30px; border-radius: 30px; margin-bottom: 40px; border: 1px solid rgba(255,255,255,0.02);">
            <h3 style="font-size: 14px; font-weight: 900; margin-bottom: 25px; letter-spacing: 2px; color: var(--accent);">ESTADÍSTICAS ELITE</h3>
            ${Object.entries(animal.stats).map(([k, v]) => `
                <div style="margin-bottom: 18px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 11px; font-weight: 700; color: var(--text-muted);">
                        <span style="text-transform: uppercase;">${k}</span>
                        <span>${v}%</span>
                    </div>
                    <div style="height: 5px; background: rgba(255,255,255,0.03); border-radius: 10px; overflow: hidden;">
                        <div style="width: ${v}%; height: 100%; background: linear-gradient(to right, var(--primary), #00d2ff);"></div>
                    </div>
                </div>
            `).join('')}
        </div>

        <button class="btn-noir" style="height: 70px;">CONECTAR CON ${animal.name}</button>
    </div>
        `;
    Router.navigate('detail');
    document.getElementById('close-detail').onclick = () => Router.navigate('catalog');
}

/* --- RESCUE & RADAR LOGIC --- */
const LocationManager = {
    pos: JSON.parse(localStorage.getItem('alma_last_pos')) || null,
    watchId: null,
    status: 'idle', // idle, locating, success, error, manual
    error: null,
    manuallyMoved: false,

    async init() {
        console.log("📍 LocationManager: Iniciando secuencia robusta...");
        this.status = 'locating';
        this.updateStatusOverlay('Buscando señal GPS...');

        // 0. Check de seguridad y HTTPS
        if (!navigator.geolocation) {
            console.warn("⚠️ API Geo no disponible.");
            this.handleError({ code: 0, message: "Tu dispositivo no soporta geolocalización." });
            this.locateByIP("API no disponible");
            return;
        }

        // 1. Capa Rápida (3s timeout) - Objetivo: Centrar mapa rápido
        console.log("📍 Intentando Capa 1: GPS Rápido...");
        navigator.geolocation.getCurrentPosition(
            (p) => {
                console.log("✅ Capa 1 Éxito");
                this.updateInternal(p, 'fast-gps');
            },
            (err) => {
                console.warn("⚠️ Capa 1 Falló:", err.message);
                this.updateStatusOverlay('GPS débil, aumentando potencia...');
            },
            { enableHighAccuracy: false, maximumAge: 60000, timeout: 3000 }
        );

        // 2. Capa Precisa (Watch) - Objetivo: Ubicación real para SOS
        console.log("📍 Iniciando Capa 2: Watch Alta Precisión...");
        this.startWatch();

        // 3. Fallback a IP automático si no hay éxito en 10s
        setTimeout(() => {
            if (!this.pos && this.status === 'locating') {
                console.warn("⏰ Tiempo de espera GPS excedido. Intentando IP...");
                this.updateStatusOverlay('Señal débil, triangulando por red...');
                this.locateByIP("Timeout GPS");
            }
        }, 10000);

        // 4. Fallback Manual Definitivo a los 18s
        setTimeout(() => {
            if (!this.pos && this.status !== 'success') {
                this.handleError({ code: 3, message: "No se pudo obtener ubicación automática." });
            }
        }, 18000);
    },

    async locateByIP(reason) {
        try {
            const resp = await fetch('https://ipapi.co/json/');
            const data = await resp.json();
            if (data.latitude && data.longitude && !this.pos) {
                console.log(`📍 IP Fallback Éxito(${reason})`);
                const ipPos = [data.latitude, data.longitude];
                this.pos = ipPos;
                this.status = 'success';
                // Añadimos un pequeño jitter para que no todos los usuarios de IP (misma ciudad) caigan en el mismo pixel
                this.pos[0] += (Math.random() - 0.5) * 0.01;
                this.pos[1] += (Math.random() - 0.5) * 0.01;

                this.syncUI();
                showToast("Ubicación aproximada por red WiFi", "info");
            }
        } catch (e) {
            console.warn("⚠️ Fallo fallback IP:", e);
            if (!this.pos) this.handleError({ code: 99, message: "Fallo total de ubicación." });
        }
    },

    startWatch() {
        if (this.watchId) navigator.geolocation.clearWatch(this.watchId);
        this.watchId = navigator.geolocation.watchPosition(
            (p) => this.updateInternal(p, 'high-accuracy-watch'),
            (err) => {
                if (this.status === 'locating' && err.code !== 1) {
                    // Si falla high accuracy, intentamos low accuracy
                    this.startWatchLow();
                } else {
                    this.handleError(err);
                }
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    },

    startWatchLow() {
        if (this.watchId) navigator.geolocation.clearWatch(this.watchId);
        this.watchId = navigator.geolocation.watchPosition(
            (p) => this.updateInternal(p, 'low-accuracy-watch'),
            (err) => this.handleError(err), // Si falla aquí, ya lo manejamos en los timeouts
            { enableHighAccuracy: false, timeout: 20000, maximumAge: 10000 }
        );
    },

    updateInternal(p, source) {
        // Ignorar actualizaciones antiguas si ya tenemos una reciente buena
        if (this.status === 'success' && source === 'fast-gps') return;

        const newPos = [p.coords.latitude, p.coords.longitude];

        // Evitar saltos pequeños
        if (this.pos && L.latLng(this.pos).distanceTo(newPos) < 10) return;

        this.pos = newPos;
        this.status = 'success';
        this.error = null;
        localStorage.setItem('alma_last_pos', JSON.stringify(newPos));

        console.log(`📍 Posición actualizada(${source}): `, newPos);
        this.removeOverlay();
        this.syncUI();
    },

    handleError(err) {
        console.warn("⚠️ GPS Error Handler:", err.message);

        // Si ya tenemos posición, ignoramos errores transitorios de watch
        if (this.pos && this.status === 'success') return;

        this.status = 'error';
        this.error = err;

        // Mensaje amigable
        let msg = "No pudimos encontrarte.";
        let action = "Mueve el mapa manualmente.";

        if (err.code === 1) msg = "Permiso denegado.";
        if (err.code === 2 || err.code === 3) msg = "Señal GPS no disponible.";

        // Mostrar overlay de error manual
        this.updateStatusOverlay(`
            < i class="fa-solid fa-map-location-dot" style = "font-size:30px; color:var(--danger); margin-bottom:15px;" ></i >
            <span>${msg}</span>
            <p style="font-size:11px; color:#aaa; margin-top:5px; text-align:center;">${action}</p>
            <button onclick="LocationManager.enableManualMode()" class="btn-manual-override">
                USAR MAPA MANUALMENTE
            </button>
        `, true);
    },

    enableManualMode() {
        this.status = 'manual';
        this.manuallyMoved = true;
        this.removeOverlay();
        showToast("Modo Manual Activado: Arrastra el pin", "info");

        // Si no hay posición, poner default Madrid
        if (!this.pos) {
            this.pos = [40.4168, -3.7038];
            this.syncUI();
        }
    },

    syncUI() {
        // 1. Texto
        if (this.pos) {
            const display = document.getElementById('location-display');
            if (display) {
                // Si es manual, mostrar icono diferente
                const icon = this.status === 'manual' || this.manuallyMoved ? 'fa-hand-pointer' : 'fa-location-crosshairs';
                display.innerHTML = `< i class="fa-solid ${icon}" style = "color: var(--primary); margin-right: 8px;" ></i > ${this.pos[0].toFixed(5)}, ${this.pos[1].toFixed(5)} `;
            }
        }

        // 2. Mapas
        if (rescueMap && rescueMarker) {
            // Solo mover el mapa automáticamente si NO es movimiento manual
            if (!this.manuallyMoved) {
                rescueMap.flyTo(this.pos, 16);
                rescueMarker.setLatLng(this.pos);
            }
        }

        if (radarMap) {
            if (!radarMap._hasCentered && this.pos) {
                radarMap.flyTo(this.pos, 13);
                radarMap._hasCentered = true;
            }
            // Recalcular distancias
            if (this.pos) {
                activeAlerts.forEach(a => {
                    a.distance = (L.latLng(this.pos).distanceTo(L.latLng(a.loc)) / 1000).toFixed(1);
                });
                renderAlertList();
            }
        }
    },

    async forceLocate() {
        console.log("📍 Forzando re-localización manual...");
        this.manuallyMoved = false;
        this.status = 'locating';
        this.pos = null; // Resetear para forzar búsqueda real
        this.init(); // Re-iniciar todo el proceso robusto
    },

    // --- OVERLAY SYSTEM ---
    updateStatusOverlay(htmlContent, isError = false) {
        const mapContainer = document.getElementById('rescue-map');
        if (!mapContainer) return;

        // Eliminar existente
        this.removeOverlay();

        const overlay = document.createElement('div');
        overlay.id = 'gps-status-overlay';
        overlay.style = `
        position: absolute; top: 0; left: 0; width: 100 %; height: 100 %;
        background: rgba(0, 0, 0, 0.85); backdrop - filter: blur(4px);
        display: flex; flex - direction: column; justify - content: center; align - items: center;
        z - index: 2000; border - radius: 24px; color: white;
        font - size: 14px; font - weight: 700; padding: 20px;
        transition: all 0.3s ease;
        `;

        if (!isError) {
            overlay.innerHTML = `
            < i class="fa-solid fa-satellite-dish fa-beat" style = "font-size:30px; color:var(--primary); margin-bottom:15px; --fa-animation-duration: 2s;" ></i >
                <span>${htmlContent}</span>
                <p style="font-size:10px; color:var(--text-muted); margin-top:10px;">Mantén la app abierta...</p>
        `;
        } else {
            overlay.innerHTML = htmlContent;
        }

        mapContainer.appendChild(overlay);
    },

    removeOverlay() {
        const existing = document.getElementById('gps-status-overlay');
        if (existing) {
            existing.style.opacity = '0';
            setTimeout(() => existing.remove(), 300);
        }
    }
};


// Usar window.sosAlerts si existe (de sos-module.js), sino usar default
const activeAlerts = window.sosAlerts || [
    { id: 'al-1', type: 'Gato', status: 'En espera', loc: [40.4233, -3.6912], address: 'Calle de Hortaleza, 48, Madrid', title: 'Gato atrapado en cornisa', user: 'Ana M.', messages: ['ALERTA DE CAMPO', 'Se encuentra en el tercer piso, parece asustado.', '¿Alguien tiene una escalera?', 'Estoy cerca, llego en 5 min.'] },
    { id: 'al-2', type: 'Perro', status: 'Coordinando', loc: [40.4100, -3.7150], address: 'C. de Toledo, 72, Madrid', title: 'Perro herido en parque', user: 'Marcos T.', messages: ['ALERTA DE CAMPO', 'Cojea de la pata trasera derecha, está muy tranquilo.', 'Ya hemos llamado al veterinario.', 'Necesitamos transporte.'] }
];

/* --- GPS UTILS --- */

function initRescueTabs() {
    document.querySelectorAll('.rescue-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const id = tab.getAttribute('data-tab');
            document.querySelectorAll('.rescue-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            document.getElementById(`tab - ${id} `).style.display = 'block';

            if (id === 'radar') setTimeout(initRadarMap, 150);
            if (id === 'report') {
                setTimeout(() => {
                    initRescueMap();
                    if (rescueMap) rescueMap.invalidateSize();
                }, 200);
            }
        });
    });
}

function initRescueMap() {
    if (typeof L === 'undefined') {
        showToast("Error: Mapas no disponibles offline", "error");
        return;
    }

    const mapContainer = document.getElementById('rescue-map');
    if (!mapContainer) return;

    // Si ya existe, solo invalidar tamaño
    if (rescueMap) {
        setTimeout(() => {
            rescueMap.invalidateSize();
            if (rescueMarker) rescueMap.setView(rescueMarker.getLatLng());
        }, 100);
        return;
    }

    console.log("📍 Map Engine: Inicializando Leaflet...");

    // Posición inicial: O la última conocida o Default Madrid
    // MUST use window.LocationManager to avoid TDZ (LocationManager is defined after Router)
    const lm = window.LocationManager;
    const startPos = (lm && lm.pos) ? lm.pos : [40.4168, -3.7038];
    rescueMap = L.map('rescue-map', { zoomControl: false, attributionControl: false }).setView(startPos, 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(rescueMap);

    // Marcador arrastrable
    rescueMarker = L.marker(startPos, { draggable: true }).addTo(rescueMap);

    // Eventos de arrastre manual
    rescueMarker.on('dragstart', () => {
        LocationManager.manuallyMoved = true;
        LocationManager.removeOverlay();
        LocationManager.status = 'manual';
    });

    rescueMarker.on('dragend', () => {
        const pos = rescueMarker.getLatLng();
        LocationManager.pos = [pos.lat, pos.lng];
        LocationManager.syncUI();
        showToast("Ubicación fijada manualmente", "success");
    });

    // Añadir estilo CSS dinámico para el botón manual
    if (!document.getElementById('gps-styles')) {
        const style = document.createElement('style');
        style.id = 'gps-styles';
        style.textContent = `
            .btn - manual - override {
            margin - top: 15px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid var(--danger);
            color: white;
            padding: 10px 20px;
            border - radius: 12px;
            font - weight: 700;
            font - size: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }
            .btn - manual - override:active {
            background: var(--danger);
            transform: scale(0.95);
        }
        `;
        document.head.appendChild(style);
    }

    // Inicializar UI con estado actual (safe check)
    if (lm && lm.syncUI) lm.syncUI();

    // Si estábamos buscando y no hay resultados, restaurar overlay
    if (lm && lm.status === 'locating' && lm.updateStatusOverlay) {
        lm.updateStatusOverlay("Recuperando señal...");
    }
}

function initRadarMap() {
    const startPos = LocationManager.pos || [40.4168, -3.7038];

    if (radarMap) {
        // Limpiar marcadores anteriores para regenerarlos si hay nuevos SOS
        radarMap.eachLayer((layer) => {
            if (layer instanceof L.Marker) radarMap.removeLayer(layer);
        });
        if (LocationManager.pos) {
            radarMap.setView(LocationManager.pos, 13);
            radarMap._hasCentered = true;
        }
    } else {
        radarMap = L.map('radar-map', { zoomControl: false, attributionControl: false }).setView(startPos, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(radarMap);
        if (LocationManager.pos) radarMap._hasCentered = true;
    }


    // Añadir marcadores
    activeAlerts.forEach(alert => {
        const marker = L.marker(alert.loc).addTo(radarMap);
        // Usar un listener robusto
        marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            window.enterRescueChat(alert.id);
        });
        marker.bindTooltip(alert.title, { direction: 'top', offset: [0, -10] });
    });

    // Distancias iniciales si hay caché
    if (LocationManager.pos) {
        activeAlerts.forEach(a => {
            a.distance = (L.latLng(LocationManager.pos).distanceTo(L.latLng(a.loc)) / 1000).toFixed(1);
        });
    }

    renderAlertList();
}

function renderAlertList() {
    const list = document.getElementById('radar-alerts-list');
    if (!list) return;
    list.innerHTML = activeAlerts.map(a => `
            < div class="glass-card" style = "display: flex; gap: 15px; align-items: center; padding: 18px; margin-bottom: 12px; border: 1px solid rgba(16,251,186,0.1); cursor:pointer;" onclick = "window.enterRescueChat('${a.id}')" >
            <div class="pulse-marker" style="width: 12px; height: 12px; background: ${a.type === 'Gato' ? 'var(--primary)' : 'var(--danger)'}; border-radius: 50%;"></div>
            <div style="flex: 1;">
                <h5 style="font-size: 15px; font-weight: 800;">${a.title}</h5>
                <p style="font-size: 12px; color: var(--text-muted);">${a.type} • ${a.status} ${a.distance ? `• a ${a.distance} km` : ''}</p>
            </div>
            <i class="fa-solid fa-chevron-right" style="color: var(--text-dim); font-size: 12px;"></i>
        </div >
            `).join('');
}

window.enterRescueChat = (alertId) => {
    // Buscar en la fuente global actualizada (sos-module.js)
    const source = window.sosAlerts || activeAlerts;
    const alert = source.find(a => a.id === alertId);

    console.log("💬 enterRescueChat:", alertId, alert ? "Encontrada" : "No encontrada", "en array de tamaño:", source.length);

    if (!alert) {
        console.error("Alert not found:", alertId);
        return;
    }

    const screen = document.getElementById('screen-chat');
    // Reiniciar scroll y contenido
    screen.scrollTop = 0;

    screen.innerHTML = `
            <div style="height: 100%; display: flex; flex-direction: column; background: #000;">
            <!--Header Operativo Reforzado-->
            <header style="padding: 55px 25px 25px; background: rgba(21, 21, 21, 0.98); backdrop-filter: blur(30px); border-bottom: 1px solid rgba(16,251,186,0.15); display: flex; align-items: center; gap: 20px; position: sticky; top: 0; z-index: 1000;">
                <button onclick="Router.navigate('rescue')" style="background: var(--bg-surface); border: 1px solid rgba(255,255,255,0.1); color: white; width: 50px; height: 50px; border-radius: 18px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; flex-shrink: 0;" onmousedown="this.style.transform='scale(0.9)'" onmouseup="this.style.transform='scale(1)'">
                    <i class="fa-solid fa-chevron-left" style="font-size: 20px;"></i>
                </button>
                <div style="flex: 1; overflow: hidden;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <span class="badge-elite" style="background: var(--primary); color: #000; font-size: 9px; padding: 4px 10px; font-weight: 900; border-radius: 100px;">${alert.type.toUpperCase()}</span>
                        <span style="color: var(--text-dim); font-size: 10px; font-weight: 800; letter-spacing: 1px;">ID: ${alert.id}</span>
                    </div>
                    <h3 style="font-size: 18px; font-weight: 900; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${alert.title}</h3>
                    <p style="font-size: 12px; color: var(--text-muted); font-weight: 600; margin-top: 2px;"><i class="fa-solid fa-location-dot" style="color: var(--primary); margin-right: 5px;"></i>${alert.address || 'Ubicación aproximada'}</p>
                </div>
            </header>

            <div id="chat-content-scroller" style="flex: 1; overflow-y: auto;">
                <!-- SECCIÓN INFO: EL EXPEDIENTE -->
                <div style="padding: 25px;">
                    <div id="mini-map-${alert.id}" style="height: 180px; border-radius: 24px; margin-bottom: 25px; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 10px 30px rgba(0,0,0,0.5);"></div>
                    
                    ${alert.photoUrl ? `
                    <div style="margin-bottom: 25px; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                        <img src="${alert.photoUrl}" style="width: 100%; display: block;" alt="Evidencia SOS">
                    </div>
                    ` : ''}

                    <div class="glass-card" style="padding: 24px; border: 1px solid rgba(16,251,186,0.1); background: rgba(16,251,186,0.02); margin-bottom: 0;">
                        <h4 style="font-size: 11px; color: var(--primary); font-weight: 900; letter-spacing: 2px; margin-bottom: 15px;">INFORME DE CAMPO</h4>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-muted); font-size: 13px;">Reportante:</span>
                                <span style="color: white; font-weight: 700; font-size: 13px;">${alert.user}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span style="color: var(--text-muted); font-size: 13px;">Estado:</span>
                                <span style="color: var(--primary); font-weight: 800; font-size: 13px;">${alert.status.toUpperCase()}</span>
                            </div>
                            <div style="padding: 15px; background: rgba(0,0,0,0.3); border-radius: 12px; font-size: 14px; color: white; border-left: 3px solid var(--primary); line-height: 1.5;">
                                "${alert.messages[1] || 'Sin diagnóstico detallado'}"
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN COMUNICACIÓN: CHAT -->
                <div id="chat-messages" style="padding: 0 25px 50px; display: flex; flex-direction: column; gap: 15px;">
                    <div style="text-align: center; margin: 10px 0;">
                        <span style="font-size: 10px; color: var(--text-dim); font-weight: 800; background: rgba(255,255,255,0.05); padding: 5px 15px; border-radius: 20px;">INTERCOMUNICADOR SEGURO ACTIVADO</span>
                    </div>
                    ${alert.messages.slice(2).map(m => `<div class="chat-bubble other">${m}</div>`).join('')}
                </div>
            </div>

            <!--Entrada de Mensajes Flotante-->
            <div class="chat-input-container" style="background: rgba(10,10,10,0.98); backdrop-filter: blur(30px); padding: 20px 25px 45px; border-top: 1px solid rgba(255,255,255,0.08);">
                <div style="display: flex; gap: 12px;">
                    <input type="text" id="msg-input" placeholder="Enviar informe al equipo..." style="flex: 1; background: var(--bg-surface); border: 1px solid rgba(16,251,186,0.1); padding: 18px 20px; border-radius: 20px; color: white; font-family: var(--font-body); font-size: 14px;">
                        <button onclick="window.sendMessage('${alert.id}')" style="width: 58px; height: 58px; border-radius: 20px; background: var(--primary); border: none; color: #000; display:flex; align-items:center; justify-content:center; box-shadow: var(--shadow-neon);">
                            <i class="fa-solid fa-paper-plane" style="font-size: 20px;"></i>
                        </button>
                </div>
            </div>
        </div>
            `;

    // Cambiar de pantalla
    Router.navigate('chat');

    // Renderizar mini mapa con delay para asegurar que el DOM existe
    setTimeout(() => {
        // CORRECCIÓN: Eliminar espacios en el ID
        const miniContainer = document.getElementById(`mini-map-${alert.id}`);
        if (!miniContainer) return;

        const miniMap = L.map(`mini-map-${alert.id}`, { zoomControl: false, attributionControl: false, dragging: true }).setView(alert.loc || alert.position, 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(miniMap);
        L.marker(alert.loc || alert.position).addTo(miniMap);

        // Scroll automático al final
        const scroller = document.getElementById('chat-content-scroller');
        if (scroller) scroller.scrollTop = scroller.scrollHeight;
    }, 450);
};

window.sendMessage = (alertId) => {
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    if (!text) return;

    const alert = activeAlerts.find(a => a.id === alertId);
    alert.messages.push(text);

    const chatMessages = document.getElementById('chat-messages');
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble user';
    bubble.innerText = text;
    chatMessages.appendChild(bubble);

    input.value = '';
    const scroller = document.getElementById('chat-content-scroller');
    scroller.scrollTop = scroller.scrollHeight;

    // Simular respuesta rápida
    setTimeout(() => {
        const replyText = "Entendido, estoy monitorizando la zona. ¿Necesitáis algo más?";
        const reply = document.createElement('div');
        reply.className = 'chat-bubble other';
        reply.innerText = replyText;
        chatMessages.appendChild(reply);
        scroller.scrollTop = scroller.scrollHeight;
        alert.messages.push(replyText);
    }, 1500);
};

function updateLocationDisplay(lat, lng) {
    const display = document.getElementById('location-display');
    if (display) display.innerHTML = `< i class="fa-solid fa-location-dot" style = "color: var(--primary); margin-right: 8px;" ></i > ${lat.toFixed(5)}, ${lng.toFixed(5)} `;
}

// (Lógica SOS extraída al nivel de módulo)
async function searchAddress() {
    const input = document.getElementById('search-address-input');
    const query = input.value.trim();
    if (!query) return;

    const btn = document.getElementById('btn-search-address');
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data && data.length > 0) {
            const result = data[0];
            const pos = [parseFloat(result.lat), parseFloat(result.lon)];

            rescueMap.flyTo(pos, 16);
            rescueMarker.setLatLng(pos);
            LocationManager.pos = pos;
            LocationManager.syncUI();
            showToast("Ubicación encontrada", "success");
            input.value = '';
        } else {
            showToast("No se encontró la dirección.", "info");
        }
    } catch (error) {
        console.error("Error en búsqueda:", error);
        showToast("Error al conectar con el servidor de mapas.", "error");
    } finally {
        btn.innerHTML = originalContent;
    }
}

window.searchAddress = searchAddress;

// function handleLocateMe() {
//     const btn = document.getElementById('btn-locate-me');
//     if (!btn) return;
// 
//     const originalIcon = btn.innerHTML;
//     btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
//     btn.disabled = true;
// 
//     // Ensure map is rendered before locating
//     if (rescueMap) rescueMap.invalidateSize();
// 
//     LocationManager.forceLocate()
//         .then(() => {
//             btn.innerHTML = originalIcon;
//             btn.disabled = false;
//             showToast("Ubicación actualizada", "success");
//         })
//         .catch(err => {
//             console.error("Fallo manual GPS:", err);
//             let msg = "No se pudo obtener señal.";
//             let detail = "Mueve el pin o usa el buscador.";
// 
//             if (err.code === 1) {
//                 msg = "Permiso denegado.";
//                 detail = "Actívalo en el icono del candado de tu navegador.";
//             } else if (err.code === 2) {
//                 msg = "Señal no disponible.";
//                 detail = "Revisa el WiFi o usa el buscador.";
//             } else if (err.code === 3) {
//                 msg = "Tiempo agotado.";
//                 detail = "Prueba de nuevo cerca de una ventana.";
//             }
// 
//             showToast(`${msg} ${detail}`, "error");
//             btn.innerHTML = originalIcon;
//             btn.disabled = false;
//         });
// }

/* --- PHOTO EVIDENCE LOGIC --- */
window.handlePhotoSelect = (input) => {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
            document.getElementById('preview-img').src = e.target.result;
            document.getElementById('rescue-photo-preview').style.display = 'block';
        }

        reader.readAsDataURL(file);
    }
}

window.clearPhoto = () => {
    document.getElementById('rescue-photo').value = '';
    document.getElementById('rescue-photo-preview').style.display = 'none';
    document.getElementById('preview-img').src = '';
}


/*
function handleRescueSubmit() {
    console.log("Evento 'Enviar Alerta' capturado.");
    const type = document.getElementById('rescue-type').value;
    const condition = document.getElementById('rescue-condition').value.trim();
    const photoInput = document.getElementById('rescue-photo');
    const hasPhoto = photoInput.files && photoInput.files[0];
 
    if (!rescueMarker) {
        showToast("El mapa no se ha cargado correctamente.", "error");
        return;
    }
 
    const pos = rescueMarker.getLatLng();
 
    if (!condition) {
        showToast("Describe el estado del animal para que los voluntarios puedan ayudar.", "info");
        document.getElementById('rescue-condition').focus();
        return;
    }
 
    const btn = document.getElementById('btn-submit-rescue');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> DESPLEGANDO SOS...';
    btn.disabled = true;
 
    setTimeout(() => {
        const newAlert = {
            id: `SOS-${Date.now().toString().slice(-4)}`,
            type: type.charAt(0).toUpperCase() + type.slice(1),
            status: 'URGENTE SOS',
            loc: [pos.lat, pos.lng],
            address: `Lat: ${pos.lat.toFixed(4)}, Lng: ${pos.lng.toFixed(4)}`, // Simulation
            title: `SOS: ${type.toUpperCase()} EN PELIGRO`,
            user: 'Tú (Hace un momento)',
            messages: ['ALERTA SOS', condition],
            hasPhoto: hasPhoto, // Flag for UI logic later if needed
            // If we had a backend, we would upload the photo here.
            distance: '0.0'
        };
        activeAlerts.unshift(newAlert);
 
        btn.innerHTML = '<i class="fa-solid fa-check"></i> ALERTA ENVIADA';
        btn.style.background = 'var(--primary)';
        btn.style.color = '#000';
 
        setTimeout(() => {
            showToast("¡Alerta SOS publicada con éxito!", "success");
            btn.innerHTML = originalText;
            btn.style.background = 'var(--danger)';
            btn.style.color = '#fff';
            btn.disabled = false;
            document.getElementById('rescue-condition').value = '';
 
            // Ir al radar para ver la nueva alerta
            const radarTab = document.querySelector('.rescue-tab[data-tab="radar"]');
            if (radarTab) radarTab.click();
        }, 800);
    }, 1000);
}
*/


/* --- INITIALIZATION --- */
/* --- INITIALIZATION --- */
async function init() {
    Router.init();
    // Tabs are now handled by sos-module.js via setupRescueTabs()
    // initRescueTabs();
    // LocationManager.init(); // CONFLICTO: Desactivado para usar sos-module.js

    // Auth Init
    Auth.init();
    // The following listeners are kept but use sos-module.js functions via window.*
    /*
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (link.getAttribute('data-screen') === 'rescue') {
                setTimeout(() => {
                    const activeTab = document.querySelector('.rescue-tab.active');
                    if (activeTab) {
                        const id = activeTab.getAttribute('data-tab');
                        if (id === 'report') initRescueMap();
                        else if (id === 'radar') initRadarMap();
                    }
                }, 100);
            }
        });
    });
 
    if (Router.activeScreen === 'rescue') {
        setTimeout(initRescueMap, 300);
    }
    */

    /*
    // Botones de acción SOS
    const submitBtn = document.getElementById('btn-submit-rescue');
    if (submitBtn) submitBtn.onclick = handleRescueSubmit;
 
    const locateBtn = document.getElementById('btn-locate-me');
    if (locateBtn) locateBtn.onclick = handleLocateMe;
    */

    /* --- VET AI LOGIC --- */
    window.sendVetMessage = async (predefinedText) => {
        const input = document.getElementById('vet-input');
        const text = predefinedText || input.value.trim();
        if (!text) return;

        const chatContainer = document.getElementById('vet-ai-chat');

        // Añadir mensaje del usuario
        const userBubble = document.createElement('div');
        userBubble.className = 'chat-bubble user';
        userBubble.innerText = text;
        chatContainer.appendChild(userBubble);

        if (!predefinedText) input.value = '';
        chatContainer.scrollTop = chatContainer.scrollHeight;

        // Simular "IA escribiendo..." (Animación de carga real)
        const typing = document.createElement('div');
        typing.className = 'chat-bubble other';
        typing.id = 'ai-typing-indicator';
        typing.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Escribiendo...';
        chatContainer.appendChild(typing);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        try {
            // Llamada REAL a la IA
            const aiResponseText = await getVetResponse(text);

            // Eliminar indicador de carga
            const typingIndicator = document.getElementById('ai-typing-indicator');
            if (typingIndicator) typingIndicator.remove();

            // Renderizar respuesta (Texto plano)
            const reply = document.createElement('div');
            reply.className = 'chat-bubble other';
            reply.innerText = aiResponseText; // Usar innerText para seguridad y simplicidad
            chatContainer.appendChild(reply);
            chatContainer.scrollTop = chatContainer.scrollHeight;

        } catch (error) {
            console.error("Error en UI Vet:", error);
            const typingIndicator = document.getElementById('ai-typing-indicator');
            if (typingIndicator) typingIndicator.remove();

            const errReply = document.createElement('div');
            errReply.className = 'chat-bubble other error';
            errReply.innerText = "Error de conexión. Inténtalo de nuevo.";
            chatContainer.appendChild(errReply);
        }
    };


    const hf = document.getElementById('home-featured-list');
    if (hf) {
        hf.innerHTML = ''; // Limpiar placeholders
        animals.slice(0, 2).forEach(a => hf.appendChild(createAnimalCard(a)));
    }

    const cf = document.getElementById('full-catalog-list');
    if (cf) {
        cf.innerHTML = '';
        animals.forEach(a => cf.appendChild(createAnimalCard(a)));
    }

    // Social Hub init (if needed on load)
    if (window.switchSocialTab) window.switchSocialTab('heroes');


}

document.addEventListener('DOMContentLoaded', init);

// --- SOCIAL HUB LOGIC ---

/* --- SOCIAL HUB ENGINE --- */

function switchSocialTab(tabId) {
    // 1. Update Tab UI (Robust Selector)
    document.querySelectorAll('.social-tab-new').forEach(t => {
        t.style.background = '#222';
        t.style.color = 'gray';
        t.classList.remove('active');
    });

    // Select by strict data-tab match
    const activeBtn = document.querySelector(`.social-tab-new[data-tab="${tabId}"]`);
    if (activeBtn) {
        activeBtn.style.background = '#0a8e69'; // Green Highlight
        activeBtn.style.color = 'white';
        activeBtn.classList.add('active');
    }

    // 2. Render Content
    const container = document.getElementById('social-content');
    if (!container) return;

    if (tabId === 'heroes') {
        renderHeroesFeed(container);
    } else if (tabId === 'missions') {
        renderMissions(container);
    } else if (tabId === 'chat') {
        renderChat(container, 'general');
    } else if (tabId === 'success') {
        renderSuccessStories(container);
    } else if (tabId === 'events') {
        renderEventsFeed(container);
    }
}

window.switchSocialTab = switchSocialTab;


function renderEventsFeed(container) {
    const events = [
        {
            title: "Mercadillo Benéfico 'Patitas'",
            date: "Sáb, 24 Oct • 10:00 AM",
            location: "Plaza Mayor, Madrid",
            img: "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=1000&auto=format&fit=crop",
            desc: "Stands de artesanía, comida vegana y adopción. Todo lo recaudado va para el refugio municipal.",
            type: "Mercadillo"
        },
        {
            title: "Taller: Primeros Auxilios Caninos",
            date: "Dom, 25 Oct • 17:00 PM",
            location: "Centro Cívico Norte",
            img: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?q=80&w=1000&auto=format&fit=crop",
            desc: "Aprende RCP básica y vendajes de emergencia con veterinarios expertos.",
            type: "Educación"
        },
        {
            title: "Gala 'Noche de los Gatos'",
            date: "Vie, 30 Oct • 21:00 PM",
            location: "Hotel Palace",
            img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1000&auto=format&fit=crop",
            desc: "Cena benéfica de etiqueta. Subasta silenciosa de arte animalista.",
            type: "Gala"
        }
    ];

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <h3 style="font-size:20px; font-weight:800; color:white;">Agenda Solidaria</h3>
            <span style="font-size:12px; color:var(--primary); font-weight:700;">Octubre</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 20px;">
            ${events.map(event => `
                <div class="glass-card" style="padding: 0; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); background: var(--bg-surface);">
                    <div style="position: relative; height: 160px;">
                        <img src="${event.img}" style="width: 100%; height: 100%; object-fit: cover;">
                        <div style="position: absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); color: white; padding: 5px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; border: 1px solid rgba(255,255,255,0.2);">
                            ${event.type}
                        </div>
                    </div>
                    <div style="padding: 20px;">
                        <div style="color: var(--primary); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">
                            <i class="fa-regular fa-calendar" style="margin-right: 5px;"></i> ${event.date}
                        </div>
                        <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 8px; line-height: 1.3; color:white;">${event.title}</h3>
                        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 15px; line-height: 1.5;">${event.desc}</p>
                        <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px;">
                            <span style="font-size: 12px; color: var(--text-dim); font-weight: 600;">
                                <i class="fa-solid fa-location-dot" style="margin-right: 5px;"></i> ${event.location}
                            </span>
                            <button style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                                <i class="fa-solid fa-chevron-right" style="font-size: 12px;"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div style="text-align:center; margin-top:30px; margin-bottom: 20px;">
             <button class="btn-noir" style="width:auto; padding: 0 25px; height: 45px; font-size: 13px;">Proponer Evento</button>
        </div>
    `;
}

const successStories = [
    {
        id: 1,
        name: 'Baltasar',
        breed: 'Mestizo de Vida',
        // Before: Sad, street, cold
        beforeImg: 'https://images.unsplash.com/photo-1529429617124-95b109e86bb8?q=80&w=1000&auto=format&fit=crop',
        // After: Happy, bed, home
        afterImg: 'https://images.unsplash.com/photo-1601979031925-424e53b6caaa?q=80&w=1000&auto=format&fit=crop',
        story: 'Lo encontramos ovillado bajo la lluvia, invisible para el mundo. Tenía miedo hasta de comer. Hoy, Baltasar no solo tiene una cama caliente, tiene una familia que le lee cuentos antes de dormir. Su cola no ha parado de moverse desde que cruzó ese umbral.'
    },
    {
        id: 2,
        name: 'Luna y Sol',
        breed: 'Hermanos Inseparables',
        // Before: Dirty, scared kitten
        beforeImg: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?q=80&w=1000&auto=format&fit=crop',
        // After: Clean, hugging, sleeping
        afterImg: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?q=80&w=1000&auto=format&fit=crop',
        story: 'Sobrevivieron al invierno dándose calor mutuamente entre cartones. Prometimos no separarlos nunca. Ahora comparten el sofá más cómodo de la ciudad y han descubierto que las ventanas son en realidad televisiones de pájaros.'
    }
];

function renderSuccessStories(container) {
    container.innerHTML = '<div style="padding: 20px;"></div>';
    const list = container.querySelector('div');

    successStories.forEach(s => {
        const card = document.createElement('div');
        card.className = 'story-card';
        card.innerHTML = `
            <div class="story-header">
                <div>
                    <h4 style="margin:0; font-size:16px;">${s.name}</h4>
                    <span style="font-size:11px; color:var(--text-muted);">${s.breed}</span>
                </div>
                <i class="fa-solid fa-heart" style="color:var(--primary);"></i>
            </div>
            <div class="story-transformation" onclick="this.classList.toggle('reveal')">
                <img src="${s.beforeImg}" class="story-image before" alt="Antes">
                <img src="${s.afterImg}" class="story-image after" alt="Después">
                
                <span class="story-badge badge-before">ANTES</span>
                <span class="story-badge badge-after">AHORA</span>
                
                <div class="tap-hint" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.5); color:white; padding:10px 20px; border-radius:30px; font-size:12px; font-weight:700; pointer-events:none; backdrop-filter:blur(5px); border:1px solid rgba(255,255,255,0.2); transition: opacity 0.3s;">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> TOCAR
                </div>
            </div>
            <style>
                .story-transformation.reveal .tap-hint { opacity: 0; }
            </style>
            <div class="story-content">
                <p style="font-size:14px; line-height:1.6; color:#e0e0e0; font-weight:400; margin:0;">"${s.story}"</p>
            </div>
        `;
        list.appendChild(card);
    });
}



function renderHeroesFeed(container) {
    const prizeHTML = `
        <div style="border-radius: 30px; overflow: hidden; margin-bottom: 30px; box-shadow: 0 15px 40px rgba(0,0,0,0.5); background: var(--bg-surface);">
            <div style="position: relative; height: 320px;">
                <img src="prize-hoodie.png" style="width: 100%; height: 100%; object-fit: cover;">
                <div style="position: absolute; top: 20px; right: 20px; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255, 215, 0, 0.5); color: #FFD700; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; display: flex; align-items: center; gap: 6px;">
                    <i class="fa-solid fa-trophy"></i> PREMIO DE TEMPORADA
                </div>
            </div>

            <div style="padding: 25px; position: relative; z-index: 2;">
                <h3 style="color: #FFD700; font-size: 13px; font-weight: 800; letter-spacing: 2px; margin-bottom: 8px; text-transform: uppercase;">Objetivo: 2000 XP</h3>
                <h2 style="font-size: 24px; font-weight: 900; line-height: 1.2; margin-bottom: 12px; font-family: var(--font-display); color: white;">La Sudadera Oficial<br><span style="color: var(--primary);">"Guardián de Alma"</span></h2>
                <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 20px; line-height: 1.5;">Exclusiva para el héroe top del mes. Llévala con orgullo mientras salvas vidas.</p>
                
                <button class="btn-noir" style="background: white; color: black; font-weight: 800; border: none; width: 100%;">
                    QUIERO PARTICIPAR <i class="fa-solid fa-arrow-right" style="margin-left: 8px;"></i>
                </button>
                <p style="font-size: 10px; color: var(--text-dim); margin-top: 15px; text-align: center;">* Los premios cambian cada mes. ¡Sigue ganando XP!</p>
            </div>
        </div>
    `;

    const leaderboardHTML = `
        <div class="leaderboard-container">
            <div class="leader-profile">
                <div class="leader-rank" style="background:silver;">2</div>
                <img src="https://images.unsplash.com/photo-1474511320723-9a56873867b5?q=80&w=200&auto=format&fit=crop" style="width:45px; height:45px; border-radius:50%; border:2px solid silver; object-fit:cover;">
                <span style="font-size:11px; margin-top:5px; font-weight:700;">Carlos</span>
                <span style="font-size:10px; color:var(--primary);">950 XP</span>
            </div>
            <div class="leader-profile" style="transform: scale(1.1); margin-top:-10px;">
                <div class="leader-rank" style="background:#FFD700;">1</div>
                <img src="https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=200&auto=format&fit=crop" style="width:55px; height:55px; border-radius:50%; border:2px solid #FFD700; box-shadow: 0 0 15px rgba(255, 215, 0, 0.3); object-fit:cover;">
                <span style="font-size:12px; margin-top:5px; font-weight:800; color:#FFD700;">María G.</span>
                <span style="font-size:10px; color:var(--primary);">1200 XP</span>
            </div>
            <div class="leader-profile">
                <div class="leader-rank" style="background:#cd7f32;">3</div>
                <img src="https://images.unsplash.com/photo-1579313262691-e490586e344e?q=80&w=200&auto=format&fit=crop" style="width:45px; height:45px; border-radius:50%; border:2px solid #cd7f32; object-fit:cover;">
                <span style="font-size:11px; margin-top:5px; font-weight:700;">Roberto</span>
                <span style="font-size:10px; color:var(--primary);">820 XP</span>
            </div>
        </div>
    `;

    const events = [
        { user: 'María G.', action: 'Donó 15€ para Rex', time: 'Hace 2 min', icon: 'fa-heart', color: '#ff3b30', img: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=200&auto=format&fit=crop' },
        { user: 'Carlos R.', action: 'Adoptó a Luna', time: 'Hace 1 hora', icon: 'fa-house', color: '#10fbba', img: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?q=80&w=200&auto=format&fit=crop' },
        { user: 'Ana P.', action: 'Completó misión: Transporte', time: 'Hace 3 horas', icon: 'fa-car', color: '#FFD700', img: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=200&auto=format&fit=crop' },
        { user: 'Roberto', action: 'Nuevo Padrino Elite', time: 'Hace 5 horas', icon: 'fa-medal', color: '#bf5af2', img: 'https://images.unsplash.com/photo-1579313262691-e490586e344e?q=80&w=200&auto=format&fit=crop' }
    ];

    container.innerHTML = prizeHTML + leaderboardHTML + '<h4 style="margin: 0 0 15px 5px; font-size:14px; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px;">Actividad Reciente</h4>' + events.map(e => `
        <div class="feed-card">
            <img src="${e.img}" class="hero-avatar" alt="Avatar" style="object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200&auto=format&fit=crop'">
            <div style="flex:1;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4 style="font-size:15px; font-weight:700; color:white;">${e.user}</h4>
                    <span style="font-size:11px; color:var(--text-dim);"><i class="fa-regular fa-clock"></i> ${e.time}</span>
                </div>
                <p style="font-size:13px; color:var(--text-muted); margin-top:4px;">${e.action}</p>
            </div>
            <div class="action-icon" style="background: ${e.color}20; color: ${e.color};">
                <i class="fa-solid ${e.icon}"></i>
            </div>
        </div>
    `).join('') + '<div style="text-align:center; padding:20px;"><small style="color:var(--text-dim);">Estás al día</small></div>';
}

function renderMissions(container) {
    const missions = [
        { type: 'TRANSPORTE', title: 'Llevar a Toby al Vet', time: 'Hoy, 17:00', loc: 'Centro -> Clínica Sur', xp: 50, icon: 'fa-car' },
        { type: 'ACOGIDA', title: 'Casa temporal para gatitos', time: 'Urgente (3 días)', loc: 'Madrid Centro', xp: 150, icon: 'fa-house-chimney' },
        { type: 'EVENTO', title: 'Feria de Adopción', time: 'Sábado, 10:00', loc: 'Parque del Retiro', xp: 100, icon: 'fa-tent' }
    ];

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <h3 style="font-size:20px; font-weight:800;">Misiones Activas</h3>
            <span class="badge-elite" style="background:rgba(255,255,255,0.1); color:white;">Tu Nivel: 3</span>
        </div>
        ${missions.map(m => `
            <div class="mission-card">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span class="mission-tag">${m.type}</span>
                    <span style="font-weight:800; color:#FFD700; font-size:12px;">+${m.xp} XP</span>
                </div>
                <h4 style="font-size:18px; font-weight:700; margin-bottom:5px;">${m.title}</h4>
                <div style="display:flex; gap:15px; color:var(--text-muted); font-size:13px; margin-bottom:15px;">
                    <span><i class="fa-regular fa-clock"></i> ${m.time}</span>
                    <span><i class="fa-solid fa-location-dot"></i> ${m.loc}</span>
                </div>
                <button class="btn-join-mission">Me apunto <i class="fa-solid fa-arrow-right" style="margin-left:5px;"></i></button>
                <i class="fa-solid ${m.icon}" style="position:absolute; bottom:-10px; right:-10px; font-size:80px; opacity:0.05; transform:rotate(-15deg);"></i>
            </div>
        `).join('')}
    `;
}

window.socialMessages = window.socialMessages || {
    general: [
        { user: 'Elena R.', text: '¿Alguien sabe si el refugio necesita mantas ahora?', time: '10:30', avatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=200&auto=format&fit=crop' },
        { user: 'Juan P.', text: 'Sí, Elena! Justo puse una alerta de misión', time: '10:32', avatar: 'https://images.unsplash.com/photo-1534251369789-5067c8b8dc32?q=80&w=200&auto=format&fit=crop', isMe: true },
        { user: 'Sofía L.', text: 'Yo puedo llevar algunas mañana por la tarde.', time: '10:35', avatar: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?q=80&w=200&auto=format&fit=crop' }
    ],
    emergency: [
        { user: 'Admin', text: '⚠️ Aviso: Gato atrapado en Calle Mayor 4. Se necesita escalera.', time: '09:15', avatar: 'https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?q=80&w=200&auto=format&fit=crop' },
        { user: 'Carlos Bombero', text: 'Voy de camino con equipo.', time: '09:20', avatar: 'https://images.unsplash.com/photo-1616198906103-e8473de0e359?q=80&w=200&auto=format&fit=crop' }
    ],
    adoptions: [
        { user: 'Ana', text: '¡Mirad qué feliz está Rex en su nueva casa!', time: 'Ayer', avatar: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?q=80&w=200&auto=format&fit=crop' }
    ]
};

window.sendSocialMessage = (channel) => {
    const input = document.getElementById('social-chat-input');
    if (!input || !input.value.trim()) return;

    const msg = {
        user: Auth.user ? Auth.user.name : 'Invitado',
        text: input.value.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: Auth.user ? Auth.user.avatar : 'https://images.unsplash.com/photo-1534251369789-5067c8b8dc32?q=80&w=200',
        isMe: true
    };

    window.socialMessages[channel].push(msg);
    renderChat(document.getElementById('social-content'), channel);
};

function renderChat(container, channel = 'general') {
    // 1. Storage check
    if (!window.socialMessages[channel]) window.socialMessages[channel] = [];
    const messages = window.socialMessages[channel];

    // Channels UI
    const channels = [
        { id: 'general', name: '# General' },
        { id: 'emergency', name: '🚨 Emergencias' },
        { id: 'adoptions', name: '🏠 Adopciones' }
    ];

    const channelsHTML = `
        <div class="channel-selector">
            ${channels.map(c => `<div class="channel-pill ${c.id === channel ? 'active' : ''}" onclick="window.renderChat(document.getElementById('social-content'), '${c.id}')">${c.name}</div>`).join('')}
        </div>
    `;

    container.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction: column;">
            ${channelsHTML}
            <div id="community-chat-messages" style="flex: 1; overflow-y:auto; display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px; padding-bottom:10px; max-height: 400px;">
                ${messages.map(msg => `
                    <div style="display: flex; gap: 10px; ${msg.isMe ? 'flex-direction: row-reverse;' : ''}">
                        <img src="${msg.avatar}" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover;">
                        <div style="${msg.isMe ? 'background: rgba(16, 251, 186, 0.1); border-radius: 15px 0 15px 15px;' : 'background: rgba(255,255,255,0.05); border-radius: 0 15px 15px 15px;'} padding: 10px 15px;">
                            ${!msg.isMe ? `<h5 style="color: var(--accent); font-size: 12px; margin-bottom: 2px;">${msg.user}</h5>` : ''}
                            <p style="font-size: 13px; color: ${msg.isMe ? '#fff' : '#ddd'};">${msg.text}</p>
                            <span style="font-size:9px; color:var(--text-dim); display:block; margin-top:4px; text-align:right;">${msg.time}</span>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Input Area -->
            <div style="display: flex; gap: 10px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);">
                <input type="text" id="social-chat-input" placeholder="Escribe en ${channels.find(c => c.id === channel).name}..." 
                    style="flex: 1; background: transparent; border: none; color: white; padding: 0 10px; outline: none;"
                    onkeypress="if(event.key === 'Enter') window.sendSocialMessage('${channel}')">
                <button onclick="window.sendSocialMessage('${channel}')" 
                    style="width: 35px; height: 35px; background: var(--primary); border-radius: 50%; border: none; color: #000; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                    <i class="fa-solid fa-paper-plane" style="font-size: 14px;"></i>
                </button>
            </div>
        </div>
    `;

    // Auto-scroll
    setTimeout(() => {
        const chatBox = document.getElementById('community-chat-messages');
        if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
    }, 50);

    // Quick Fix: Expose helper for onclick
    window.renderChat = renderChat;

    // Quick Fix: Expose helper for onclick
    window.renderChat = renderChat;
}

// Init Social Hub logic if screen is active (or call manually)
// We create a global init for social to be safe
window.initSocialHub = () => {
    switchSocialTab('heroes');
};

// Add to global initialization or just run it once to populate default
setTimeout(() => {
    if (window.switchSocialTab) window.switchSocialTab('heroes');
}, 1000);


window.togglePointsGuide = () => {
    const modal = document.getElementById('info-modal');
    if (!modal) return;

    const content = modal.querySelector('.info-modal-content');

    if (modal.classList.contains('active')) {
        modal.classList.remove('active');
    } else {
        // Render Content
        content.innerHTML = `
            <div class="info-header">
                <i class="fa-solid fa-shield-cat" style="font-size: 40px; color: var(--primary); margin-bottom: 10px;"></i>
                <h3 style="margin: 0; color: white; font-size: 22px; font-weight: 900;">EL CAMINO DEL HÉROE</h3>
                <p style="margin: 5px 0 0; color: #888; font-size: 13px;">Tu impacto real en la comunidad</p>
            </div>
            
            <div style="padding: 10px 0 30px;">
                <div class="xp-card">
                    <div class="xp-icon"><i class="fa-solid fa-truck-medical" style="color:#ff3b30;"></i></div>
                    <div>
                        <strong style="color:white; font-size:15px;">Guardián del SOS</strong>
                        <span class="xp-value">+500 XP</span>
                        <p style="margin: 5px 0 0; font-size: 11px; color: #888; line-height: 1.4;">
                            Por reportar una emergencia real que resulte en un rescate exitoso.
                        </p>
                    </div>
                </div>

                <div class="xp-card">
                    <div class="xp-icon"><i class="fa-solid fa-hand-holding-heart" style="color:var(--primary);"></i></div>
                    <div>
                        <strong style="color:white; font-size:15px;">Alma Madrina</strong>
                        <span class="xp-value">+100 XP</span>
                        <p style="margin: 5px 0 0; font-size: 11px; color: #888; line-height: 1.4;">
                            Por cada donación verificada o apadrinamiento de un animal.
                        </p>
                    </div>
                </div>

                <div class="xp-card">
                    <div class="xp-icon"><i class="fa-solid fa-bullhorn" style="color:#faa916;"></i></div>
                    <div>
                        <strong style="color:white; font-size:15px;">Voz de la Manada</strong>
                        <span class="xp-value">+50 XP</span>
                        <p style="margin: 5px 0 0; font-size: 11px; color: #888; line-height: 1.4;">
                            Por compartir casos urgentes y ayudar a difundir la misión.
                        </p>
                    </div>
                </div>

                <div style="text-align:center; margin-top:30px;">
                    <button onclick="togglePointsGuide()" style="background:var(--bg-dark); border:1px solid #333; color:white; padding:12px 30px; border-radius:20px; font-weight:bold; cursor:pointer;">
                        ENTENDIDO
                    </button>
                </div>
            </div>
        `;

    }
};


// Home News Renderer
// Home News Renderer - EXPERIENCIA COMUNITARIA V2.1 (Refined & Centered)
function renderHomeNews() {
    const container = document.getElementById('home-news-feed');
    if (!container) return;

    // 1. FECHA Y SALUDO
    const dateOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    const today = new Date().toLocaleDateString('es-ES', dateOptions);
    const userName = window.Auth?.user?.name || 'Amigo';

    // 2. DATOS SIMULADOS
    const stats = { adopted: 12, urgent: 3, volunteers: 45 };

    // Contenido Rico - DISEÑO UNIFICADO Y CENTRADO
    const dashboardHTML = `
        <div style="padding: 0 20px; max-width: 600px; margin: 0 auto;">
            
            <!-- HEADER CENTRADO -->
            <div style="text-align: center; margin-bottom: 30px; padding-top: 10px;">
                <p style="color: var(--text-dim); font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; margin-bottom: 8px;">${today}</p>
                <h2 style="font-size: 28px; font-family: var(--font-display); font-weight: 900; line-height: 1.1;">Hola, <span style="color: var(--primary);">${userName}</span></h2>
            </div>

            <!-- SECCIÓN 1: PULSO DE LA MANADA (Diseño Unificado) -->
            <div class="glass-card" style="padding: 20px; border-radius: 24px; margin-bottom: 30px; border: 1px solid rgba(255,255,255,0.08); background: var(--bg-surface); display: flex; justify-content: space-around; text-align: center;">
                <div>
                    <h3 style="font-size: 22px; font-weight: 900; color: white; margin-bottom: 4px;">${stats.adopted}</h3>
                    <p style="font-size: 10px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Adopciones</p>
                </div>
                <div style="width: 1px; background: rgba(255,255,255,0.1);"></div>
                <div>
                    <h3 style="font-size: 22px; font-weight: 900; color: var(--danger); margin-bottom: 4px;">${stats.urgent}</h3>
                    <p style="font-size: 10px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Urgencias</p>
                </div>
                <div style="width: 1px; background: rgba(255,255,255,0.1);"></div>
                 <div>
                    <h3 style="font-size: 22px; font-weight: 900; color: #0a84ff; margin-bottom: 4px;">${stats.volunteers}</h3>
                    <p style="font-size: 10px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Voluntarios</p>
                </div>
            </div>

            <!-- SECCIÓN 2: PROTAGONISTA (Hero Card Limpia) -->
            <div style="margin-bottom: 35px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 15px;">
                    <h3 style="font-size: 14px; font-weight: 900; letter-spacing: 0.5px; margin: 0;">CASO DEL DÍA</h3>
                    <span style="font-size: 11px; color: var(--primary); font-weight: 700; cursor: pointer;" onclick="Router.navigate('catalog')">Ver catálogo</span>
                </div>
                
                <div class="news-card" style="position: relative; height: 360px; overflow: hidden; border-radius: 30px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); cursor: pointer;" onclick="Router.navigate('catalog')">
                    <img src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1000&auto=format&fit=crop" style="width: 100%; height: 100%; object-fit: cover;" alt="Protagonista">
                    <div style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 30px; background: linear-gradient(to top, rgba(0,0,0,0.95) 10%, transparent);">
                        <div style="background: var(--primary); color: #000; display: inline-flex; align-items: center; padding: 5px 12px; border-radius: 20px; font-size: 10px; font-weight: 900; margin-bottom: 12px; letter-spacing: 0.5px;">
                            <i class="fa-solid fa-star" style="margin-right: 5px; font-size: 9px;"></i> DESTACADO
                        </div>
                        <h2 style="font-size: 32px; margin-bottom: 8px; font-weight: 900; font-family: var(--font-display); line-height: 1;">Bruno</h2>
                        <p style="font-size: 15px; color: #ddd; line-height: 1.5; margin-bottom: 0;">Sobrevivió 3 días en una tubería. Ahora busca un rey para su sofá.</p>
                    </div>
                </div>
            </div>

            <!-- SECCIÓN 0: PROMO (Premio del Mes) -->
            <div style="margin-bottom: 35px; position: relative;">
                <div style="height: 380px; border-radius: 32px; overflow: hidden; position: relative; box-shadow: 0 20px 50px rgba(16, 251, 186, 0.15);">
                    <img src="prize-hoodie-official.jpg" style="width: 100%; height: 100%; object-fit: cover; object-position: center;">
                    
                    <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 70%; background: linear-gradient(to top, #000 20%, transparent); padding: 25px; display: flex; flex-direction: column; justify-content: flex-end;">
                        
                        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                            <div>
                                <div style="background: var(--primary); color: #000; padding: 6px 14px; border-radius: 100px; font-size: 11px; font-weight: 900; display: inline-flex; align-items: center; gap: 6px; margin-bottom: 15px; box-shadow: 0 0 20px rgba(16, 251, 186, 0.4);">
                                    <i class="fa-solid fa-crown"></i> PREMIO MENSUAL
                                </div>
                                <h2 style="font-size: 32px; font-weight: 900; line-height: 1; margin-bottom: 8px; font-family: var(--font-display); text-shadow: 0 2px 10px rgba(0,0,0,0.8);">
                                    LA SUDADERA<br>
                                    <span style="color: var(--primary); text-shadow: 0 0 20px rgba(16, 251, 186, 0.3);">OFICIAL ALMA</span>
                                </h2>
                                <p style="font-size: 13px; color: #ccc; margin-bottom: 0px; font-weight: 500;">Diseño exclusivo "Alma Hondón".</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            <!-- SECCIÓN 3: CONSEJO (Diseño Minimal) -->
            <div style="margin-bottom: 35px;">
                <div style="background: rgba(16,251,186,0.03); border: 1px solid rgba(16,251,186,0.1); border-radius: 24px; padding: 25px; display: flex; align-items: center; gap: 20px;">
                    <div style="background: rgba(16,251,186,0.1); width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <i class="fa-solid fa-user-doctor" style="color: var(--primary); font-size: 20px;"></i>
                    </div>
                    <div>
                        <h4 style="color: var(--primary); font-size: 10px; font-weight: 800; letter-spacing: 1px; margin-bottom: 5px; text-transform: uppercase;">Dra. Alma Dice:</h4>
                        <p style="font-size: 13px; font-weight: 600; line-height: 1.4; color: #eee;">"En días de calor, prueba la regla de los 5 segundos: si el asfalto quema tu mano, quemará sus patas."</p>
                    </div>
                </div>
            </div>

            <!-- SECCIÓN 4: FINALES FELICES (Compacto) -->
            <div style="margin-bottom: 100px;">
                 <h3 style="font-size: 14px; font-weight: 900; letter-spacing: 0.5px; margin-bottom: 20px;">FINALES FELICES</h3>
                 <div style="background: var(--bg-surface); border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); padding: 5px;">
                    <div style="display: flex; align-items: center; gap: 15px; padding: 15px;">
                        <img src="https://images.unsplash.com/photo-1596495578065-6e0763fa1178?q=80&w=600&auto=format&fit=crop" style="width: 60px; height: 60px; border-radius: 18px; object-fit: cover;">
                        <div style="flex: 1;">
                            <h4 style="font-size: 15px; font-weight: 800; margin-bottom: 4px;">Luna & Familia Pérez</h4>
                            <p style="font-size: 12px; color: var(--text-muted);">"Es un ángel en casa."</p>
                        </div>
                        <i class="fa-solid fa-heart" style="color: var(--danger); font-size: 16px; margin-right: 10px;"></i>
                    </div>
                    <div style="height: 1px; background: rgba(255,255,255,0.05); margin: 0 20px;"></div>
                    <div style="display: flex; align-items: center; gap: 15px; padding: 15px;">
                        <img src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=600&auto=format&fit=crop" style="width: 60px; height: 60px; border-radius: 18px; object-fit: cover;">
                        <div style="flex: 1;">
                            <h4 style="font-size: 15px; font-weight: 800; margin-bottom: 4px;">Thor el Guerrero</h4>
                            <p style="font-size: 12px; color: var(--text-muted);">"Corre maratones con nosotros."</p>
                        </div>
                        <i class="fa-solid fa-heart" style="color: var(--danger); font-size: 16px; margin-right: 10px;"></i>
                    </div>
                 </div>
            </div>
            
        </div>
    `;

    container.innerHTML = dashboardHTML;
}

// Expose final version of renderHomeNews
window.renderHomeNews = renderHomeNews;

// Navigation helper
window.navigateToRadar = () => {
    Router.navigate('rescue');
    setTimeout(() => {
        const radarTab = document.querySelector('.rescue-tab[data-tab="radar"]');
        if (radarTab) radarTab.click();
    }, 300);
};


/* --- AUTH UI HANDLERS v2.0 --- */

// Función para mostrar toast desde Auth
function showAuthToast(message, type = 'info') {
    if (window.PWAInstall && window.PWAInstall.showToast) {
        window.PWAInstall.showToast(message, type);
    } else {
        // Fallback: crear toast simple
        const toast = document.createElement('div');
        toast.style.cssText = `
                position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
                background: ${type === 'success' ? '#0a8e69' : type === 'error' ? '#ff3b30' : '#333'};
                color: white; padding: 14px 24px; border-radius: 12px; z-index: 99999;
                font-size: 14px; font-weight: 600;
            `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

window.handleRegister = () => {
    const name = document.getElementById('reg-name')?.value?.trim();
    const pass = document.getElementById('reg-pass')?.value;
    const spirit = document.getElementById('reg-spirit')?.value || 'wolf';

    if (!name || !pass) {
        showAuthToast('Por favor completa nombre y contraseña', 'error');
        return;
    }

    if (name.length < 3) {
        showAuthToast('El nombre debe tener al menos 3 caracteres', 'error');
        return;
    }

    if (pass.length < 4) {
        showAuthToast('La contraseña debe tener al menos 4 caracteres', 'error');
        return;
    }

    const result = Auth.register(name, pass, spirit);

    if (result.success) {
        showAuthToast('¡Bienvenido a la Manada, ' + name + '!', 'success');
        Auth.updateUI();
    } else {
        showAuthToast(result.error || 'Error al crear cuenta', 'error');
    }
};

window.handleLogin = () => {
    const name = document.getElementById('login-name')?.value?.trim();
    const pass = document.getElementById('login-pass')?.value;

    if (!name || !pass) {
        showAuthToast('Por favor ingresa nombre y contraseña', 'error');
        return;
    }

    const result = Auth.login(name, pass);

    if (result.success) {
        showAuthToast('¡Bienvenido de vuelta!', 'success');
        Auth.updateUI();
    } else {
        showAuthToast(result.error || 'Credenciales incorrectas', 'error');
    }
};

window.handleGoogleSignIn = async () => {
    showAuthToast('Conectando con Google...', 'info');

    try {
        const result = await Auth.loginWithGoogle();
        if (result.success) {
            showAuthToast('¡Conectado con Google!', 'success');
            Auth.updateUI();
        }
    } catch (e) {
        showAuthToast('Error al conectar con Google', 'error');
    }
};

window.showRegister = () => {
    document.getElementById('screen-login')?.classList.remove('active');
    document.getElementById('screen-register')?.classList.add('active');
    document.querySelector('.bottom-nav')?.classList.add('hidden');
};

window.showLogin = () => {
    document.getElementById('screen-register')?.classList.remove('active');
    document.getElementById('screen-login')?.classList.add('active');
    document.querySelector('.bottom-nav')?.classList.add('hidden');
};

window.selectSpirit = (type, el) => {
    document.querySelectorAll('.animal-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('reg-spirit').value = type;
};

// Initialize Auth UI
document.addEventListener('DOMContentLoaded', () => {
    Auth.updateUI();
});

window.renderProfile = () => {
    if (!Auth.user) return;

    document.querySelector('#screen-profile .user-avatar img').src = Auth.user.avatar;
    document.querySelector('#profile-name').innerText = Auth.user.name;
    document.querySelector('#stat-alerts').innerText = Auth.user.stats.alerts;
    document.querySelector('#stat-sponsored').innerText = Auth.user.stats.sponsored;

    const historyContainer = document.getElementById('profile-history');
    historyContainer.innerHTML = Auth.user.history.map(h => `
        <div style="background: var(--bg-surface); padding: 15px; border-radius: 12px; display: flex; align-items: center; gap: 15px;">
            <div style="background: rgba(255,255,255,0.05); width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                <i class="fa-solid ${h.icon || 'fa-star'}"></i>
            </div>
            <div>
                <strong style="display: block; font-size: 13px;">${h.action}</strong>
                <span style="font-size: 11px; color: var(--text-muted);">${h.date}</span>
            </div>
        </div>
    `).join('');
};

/* --- PWA INSTALL LOGIC ---
 * NOTA: La lógica de instalación PWA ahora está en /public/pwa-install.js
 * Se carga antes que main.js para capturar el evento beforeinstallprompt correctamente.
 * Ver: PWAInstall global object
 */


/* --- SERVICE WORKER CONTROL (v6.0 - STABLE) --- */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('✅ SW v7.2 Registered:', registration);
                // Si hay una actualización esperando, forzarla
                if (registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
            })
            .catch(error => {
                console.log('❌ SW Registration failed:', error);
            });
    });
}

// Final check for news on load
setTimeout(() => {
    if (window.renderHomeNews) window.renderHomeNews();
}, 1000);

// Auto-start App when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
    init();
}

/* --- GLOBAL EXPORTS --- */
// Moved here to ensure all consts/functions are defined
window.Router = Router;
window.LocationManager = LocationManager;
window.createAnimalCard = createAnimalCard;
window.showDetail = showDetail;
window.switchSocialTab = switchSocialTab;
window.renderHomeNews = renderHomeNews;
window.renderCatalog = () => filterCatalog('all');
window.renderCommunity = () => switchSocialTab('heroes');
