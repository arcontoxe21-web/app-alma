/**
 * PWA Install Manager v2.0
 * Sistema de instalación PWA independiente y robusto
 * Funciona en Android (Chrome), iOS (Safari) y Desktop
 */

(function () {
    'use strict';

    // Estado global de instalación
    window.PWAInstall = {
        deferredPrompt: null,
        isInstalled: false,
        platform: 'unknown',
        debug: true
    };

    // Utilidad de logging
    function log(message, type = 'info') {
        if (!window.PWAInstall.debug) return;
        const prefix = '📱 PWA:';
        if (type === 'error') console.error(prefix, message);
        else if (type === 'warn') console.warn(prefix, message);
        else console.log(prefix, message);
    }

    // Detectar plataforma
    function detectPlatform() {
        const ua = navigator.userAgent || navigator.vendor || window.opera;

        if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
            window.PWAInstall.platform = 'ios';
            log('Plataforma detectada: iOS');
            return 'ios';
        }

        if (/android/i.test(ua)) {
            window.PWAInstall.platform = 'android';
            log('Plataforma detectada: Android');
            return 'android';
        }

        window.PWAInstall.platform = 'desktop';
        log('Plataforma detectada: Desktop');
        return 'desktop';
    }

    // Verificar si ya está instalada
    function checkIfInstalled() {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isIOSStandalone = window.navigator.standalone === true;
        const fromPWA = window.location.search.includes('source=pwa');

        window.PWAInstall.isInstalled = isStandalone || isIOSStandalone || fromPWA;
        log('¿Está instalada? ' + window.PWAInstall.isInstalled);

        return window.PWAInstall.isInstalled;
    }

    // Mostrar toast de notificación
    function showToast(message, type = 'info') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            container.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;gap:10px;';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.style.cssText = `
            background: ${type === 'success' ? '#0a8e69' : type === 'error' ? '#ff3b30' : '#333'};
            color: white;
            padding: 14px 24px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Actualizar estado del botón
    function updateButton(state) {
        const btn = document.getElementById('btn-install-pwa');
        if (!btn) return;

        const states = {
            'ready': {
                html: '<i class="fa-solid fa-download"></i> INSTALAR APP',
                bg: 'linear-gradient(135deg, #10fbba, #0a8e69)',
                disabled: false
            },
            'waiting': {
                html: '<i class="fa-solid fa-hourglass-half"></i> ESPERANDO...',
                bg: '#444',
                disabled: true
            },
            'installing': {
                html: '<i class="fa-solid fa-spinner fa-spin"></i> INSTALANDO...',
                bg: '#0a8e69',
                disabled: true
            },
            'installed': {
                html: '<i class="fa-solid fa-check"></i> ¡INSTALADA!',
                bg: '#0a8e69',
                disabled: true
            },
            'ios': {
                html: '<i class="fa-solid fa-arrow-up-from-bracket"></i> VER INSTRUCCIONES',
                bg: 'linear-gradient(135deg, #10fbba, #0a8e69)',
                disabled: false
            },
            'unavailable': {
                html: '<i class="fa-solid fa-globe"></i> ABRIR EN NAVEGADOR',
                bg: '#666',
                disabled: false
            }
        };

        const config = states[state] || states['waiting'];
        btn.innerHTML = config.html;
        btn.style.background = config.bg;
        btn.disabled = config.disabled;

        log('Botón actualizado a estado: ' + state);
    }

    // Mostrar modal de iOS
    function showIOSModal() {
        const modal = document.getElementById('ios-install-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            log('Modal iOS mostrado');
        }
    }

    // Cerrar modal de iOS
    function closeIOSModal() {
        const modal = document.getElementById('ios-install-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    }

    // Saltar instalación e ir al registro/login
    function skipInstall() {
        log('Saltando instalación...');
        const landing = document.getElementById('screen-landing');
        if (landing) {
            landing.classList.remove('active');
            landing.style.display = 'none';
        }

        // Mostrar pantalla de registro
        const register = document.getElementById('screen-register');
        if (register) {
            register.classList.add('active');
        }
    }

    // Manejar click en botón de instalación
    function handleInstallClick() {
        log('Click en botón de instalación');
        const platform = window.PWAInstall.platform;

        // iOS: Mostrar instrucciones manuales
        if (platform === 'ios') {
            log('Mostrando instrucciones para iOS');
            showIOSModal();
            return;
        }

        // Android/Desktop: Usar el prompt nativo
        if (window.PWAInstall.deferredPrompt) {
            log('Mostrando prompt de instalación nativo');
            updateButton('installing');

            const prompt = window.PWAInstall.deferredPrompt;
            prompt.prompt();

            prompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    log('Usuario aceptó la instalación');
                    showToast('¡Instalación iniciada! Revisa tu pantalla de inicio.', 'success');
                    updateButton('installed');
                } else {
                    log('Usuario rechazó la instalación');
                    showToast('Instalación cancelada', 'info');
                    updateButton('ready');
                }
                window.PWAInstall.deferredPrompt = null;
            }).catch((err) => {
                log('Error en userChoice: ' + err, 'error');
                updateButton('ready');
            });
        } else {
            // No hay prompt disponible
            log('No hay prompt disponible', 'warn');
            showToast('Instalación no disponible. Intenta recargar la página.', 'error');

            // Sugerir agregar manualmente
            if (platform === 'android') {
                showToast('Usa el menú ⋮ → "Añadir a pantalla de inicio"', 'info');
            }
        }
    }

    // Inicializar sistema de instalación
    function init() {
        log('Inicializando sistema de instalación PWA v2.0');

        // 1. Detectar plataforma
        detectPlatform();

        // 2. Verificar si ya está instalada
        if (checkIfInstalled()) {
            log('App ya instalada, saltando landing');
            skipInstall();
            return;
        }

        // 3. Configurar el botón
        const btn = document.getElementById('btn-install-pwa');
        if (btn) {
            // Remover listeners anteriores clonando el botón
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            // Agregar nuevo listener
            newBtn.addEventListener('click', handleInstallClick);
            log('Listener de click configurado');

            // Estado inicial según plataforma
            if (window.PWAInstall.platform === 'ios') {
                updateButton('ios');
                const helper = document.getElementById('ios-helper');
                if (helper) helper.style.display = 'block';
            } else {
                updateButton('waiting');
            }
        }

        // 4. Capturar evento beforeinstallprompt (Android/Desktop)
        window.addEventListener('beforeinstallprompt', (e) => {
            log('✅ Evento beforeinstallprompt capturado!');
            e.preventDefault();
            window.PWAInstall.deferredPrompt = e;
            updateButton('ready');
            showToast('¡App lista para instalar!', 'success');
        });

        // 5. Detectar cuando se instala
        window.addEventListener('appinstalled', () => {
            log('✅ App instalada exitosamente');
            window.PWAInstall.isInstalled = true;
            updateButton('installed');
            showToast('¡Alma Elite instalada! Ábrela desde tu pantalla de inicio.', 'success');

            // Ocultar landing después de un momento
            setTimeout(skipInstall, 2000);
        });

        // 6. Configurar cierre del modal iOS
        const closeBtn = document.querySelector('#ios-install-modal .close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeIOSModal);
        }

        const modalBg = document.getElementById('ios-install-modal');
        if (modalBg) {
            modalBg.addEventListener('click', (e) => {
                if (e.target === modalBg) closeIOSModal();
            });
        }

        log('Sistema de instalación inicializado correctamente');
    }

    // Exponer funciones globalmente
    window.PWAInstall.init = init;
    window.PWAInstall.handleInstall = handleInstallClick;
    window.PWAInstall.skipInstall = skipInstall;
    window.PWAInstall.closeIOSModal = closeIOSModal;
    window.PWAInstall.showToast = showToast;

    // Auto-inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM ya está listo
        init();
    }

})();
