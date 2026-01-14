/**
 * Auth System v3.0 - Standalone
 * Sistema de autenticación independiente para Alma Elite
 * Se carga antes de main.js para evitar dependencias
 */

(function () {
    'use strict';

    console.log('🔐 Auth System v3.0 cargando...');

    // ============================================
    // MÓDULO DE AUTENTICACIÓN
    // ============================================

    const Auth = {
        user: null,

        // Inicializar desde localStorage
        init() {
            try {
                const stored = localStorage.getItem('alma_user');
                if (stored) {
                    this.user = JSON.parse(stored);
                    console.log('✅ Sesión restaurada para:', this.user.name);
                    return true;
                }
            } catch (e) {
                console.warn('Error al restaurar sesión:', e);
                localStorage.removeItem('alma_user');
            }
            return false;
        },

        // Registrar nuevo usuario
        register(name, password, animalType = 'wolf') {
            if (!name || !password) {
                return { success: false, error: 'Nombre y contraseña requeridos' };
            }

            if (name.length < 2) {
                return { success: false, error: 'Nombre muy corto' };
            }

            if (password.length < 3) {
                return { success: false, error: 'Contraseña muy corta' };
            }

            const newUser = {
                id: 'user_' + Date.now(),
                name: name.trim(),
                password: password,
                animalType: animalType,
                avatar: this.getAvatar(animalType),
                level: 1,
                xp: 0,
                stats: { alerts: 0, sponsored: 0, events: 0 },
                history: [{
                    date: new Date().toLocaleDateString(),
                    action: 'Te uniste a la Manada',
                    icon: 'fa-paw'
                }],
                createdAt: new Date().toISOString()
            };

            localStorage.setItem('alma_user', JSON.stringify(newUser));
            this.user = newUser;

            console.log('✅ Usuario registrado:', name);
            return { success: true, user: newUser };
        },

        // Login con nombre y contraseña
        login(name, password) {
            const stored = localStorage.getItem('alma_user');
            if (!stored) {
                return { success: false, error: 'No hay usuarios registrados' };
            }

            try {
                const user = JSON.parse(stored);
                if (user.name.toLowerCase() === name.toLowerCase() && user.password === password) {
                    this.user = user;
                    console.log('✅ Login exitoso:', name);
                    return { success: true };
                }
            } catch (e) {
                console.error('Error en login:', e);
            }

            return { success: false, error: 'Usuario o contraseña incorrectos' };
        },

        // Login con Google (Demo)
        async loginWithGoogle() {
            // Simular delay de conexión
            await new Promise(r => setTimeout(r, 600));

            const nombres = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey'];
            const randomName = nombres[Math.floor(Math.random() * nombres.length)];

            const googleUser = {
                id: 'google_' + Date.now(),
                name: randomName,
                email: randomName.toLowerCase() + '@gmail.com',
                animalType: 'eagle',
                avatar: 'https://ui-avatars.com/api/?name=' + randomName + '&background=10fbba&color=000&size=200',
                level: 1,
                xp: 0,
                stats: { alerts: 0, sponsored: 0, events: 0 },
                history: [{ date: new Date().toLocaleDateString(), action: 'Conectado con Google', icon: 'fa-google' }],
                isGoogleUser: true
            };

            localStorage.setItem('alma_user', JSON.stringify(googleUser));
            this.user = googleUser;

            return { success: true, user: googleUser };
        },

        logout() {
            localStorage.removeItem('alma_user');
            this.user = null;
            window.location.reload();
        },

        getAvatar(type) {
            const avatars = {
                'wolf': 'https://images.unsplash.com/photo-1534251369789-5067c8b8dc32?q=80&w=200&auto=format&fit=crop',
                'fox': 'https://images.unsplash.com/photo-1516934024742-b461fba47600?q=80&w=200&auto=format&fit=crop',
                'eagle': 'https://images.unsplash.com/photo-1611000962228-444f5bd63ac9?q=80&w=200&auto=format&fit=crop',
                'cat': 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=200&auto=format&fit=crop'
            };
            return avatars[type] || avatars['wolf'];
        },

        // Actualizar la UI basado en el estado de auth
        updateUI() {
            const isLandingActive = document.getElementById('screen-landing')?.classList.contains('active');
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

            if (isLandingActive && !isStandalone && !this.user) {
                console.log("🛑 Landing activa, esperando...");
                return;
            }

            if (this.user) {
                console.log('🔐 Usuario activo:', this.user.name);

                // Ocultar pantallas de auth
                document.getElementById('screen-login')?.classList.remove('active');
                document.getElementById('screen-register')?.classList.remove('active');
                document.getElementById('screen-landing')?.classList.remove('active');

                const landing = document.getElementById('screen-landing');
                if (landing) landing.style.display = 'none';

                // Mostrar home
                document.getElementById('screen-home')?.classList.add('active');
                document.querySelector('.bottom-nav')?.classList.remove('hidden');

                // Actualizar nombre en header
                const nameEl = document.querySelector('#screen-home h1');
                if (nameEl) {
                    nameEl.innerHTML = `Hola, ${this.user.name.split(' ')[0]} <span style="font-size: 20px;">👋</span>`;
                }

                // Actualizar avatares
                document.querySelectorAll('.user-avatar img').forEach(img => {
                    img.src = this.user.avatar;
                });
            } else {
                console.log('🔐 No hay usuario, mostrando registro');
                document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
                document.getElementById('screen-register')?.classList.add('active');
                document.querySelector('.bottom-nav')?.classList.add('hidden');
            }
        }
    };

    // ============================================
    // FUNCIONES UI GLOBALES
    // ============================================

    function showToast(message, type = 'info') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            container.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:99999;width:90%;max-width:320px;';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        const bgColor = type === 'success' ? '#0a8e69' : type === 'error' ? '#ff3b30' : '#333';
        toast.style.cssText = `
            background: ${bgColor};
            color: white;
            padding: 14px 20px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            text-align: center;
            margin-bottom: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        `;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ============================================
    // HANDLERS GLOBALES
    // ============================================

    window.handleRegister = function () {
        console.log('📝 handleRegister llamado');

        const name = document.getElementById('reg-name')?.value?.trim();
        const pass = document.getElementById('reg-pass')?.value;
        const spirit = document.getElementById('reg-spirit')?.value || 'wolf';

        if (!name || !pass) {
            showToast('Completa nombre y contraseña', 'error');
            return;
        }

        const result = Auth.register(name, pass, spirit);

        if (result.success) {
            showToast('¡Bienvenido, ' + name + '!', 'success');
            setTimeout(() => Auth.updateUI(), 500);
        } else {
            showToast(result.error, 'error');
        }
    };

    window.handleLogin = function () {
        console.log('📝 handleLogin llamado');

        const name = document.getElementById('login-name')?.value?.trim();
        const pass = document.getElementById('login-pass')?.value;

        if (!name || !pass) {
            showToast('Ingresa nombre y contraseña', 'error');
            return;
        }

        const result = Auth.login(name, pass);

        if (result.success) {
            showToast('¡Bienvenido de vuelta!', 'success');
            setTimeout(() => Auth.updateUI(), 500);
        } else {
            showToast(result.error, 'error');
        }
    };

    window.handleGoogleSignIn = async function () {
        console.log('🔵 Google Sign-In llamado');
        showToast('Conectando con Google...', 'info');

        try {
            const result = await Auth.loginWithGoogle();
            if (result.success) {
                showToast('¡Conectado como ' + result.user.name + '!', 'success');
                setTimeout(() => Auth.updateUI(), 500);
            }
        } catch (e) {
            console.error('Error Google:', e);
            showToast('Error al conectar', 'error');
        }
    };

    window.showRegister = function () {
        console.log('📝 showRegister llamado');
        document.getElementById('screen-login')?.classList.remove('active');
        document.getElementById('screen-register')?.classList.add('active');
        document.querySelector('.bottom-nav')?.classList.add('hidden');
    };

    window.showLogin = function () {
        console.log('📝 showLogin llamado');
        document.getElementById('screen-register')?.classList.remove('active');
        document.getElementById('screen-login')?.classList.add('active');
        document.querySelector('.bottom-nav')?.classList.add('hidden');
    };

    window.selectSpirit = function (type, el) {
        document.querySelectorAll('.animal-option').forEach(o => o.classList.remove('selected'));
        if (el) el.classList.add('selected');
        const input = document.getElementById('reg-spirit');
        if (input) input.value = type;
    };

    // Exponer Auth globalmente
    window.Auth = Auth;

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    function initAuth() {
        console.log('🔐 Inicializando Auth...');
        Auth.init();

        // Si ya hay usuario, actualizar UI
        if (Auth.user) {
            Auth.updateUI();
        }
    }

    // Inicializar cuando DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        initAuth();
    }

    console.log('✅ Auth System v3.0 cargado correctamente');

})();
