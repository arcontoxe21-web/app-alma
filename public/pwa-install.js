/**
 * PWA Install Manager v3.0
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
        browser: 'unknown',
        debug: true,
        promptReady: false
    };

    // Utilidad de logging
    function log(message, type = 'info') {
        if (!window.PWAInstall.debug) return;
        const prefix = '📱 PWA:';
        if (type === 'error') console.error(prefix, message);
        else if (type === 'warn') console.warn(prefix, message);
        else console.log(prefix, message);
    }

    // Detectar plataforma y navegador
    function detectPlatform() {
        const ua = navigator.userAgent || navigator.vendor || window.opera;

        // Detectar iOS
        if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
            window.PWAInstall.platform = 'ios';
            window.PWAInstall.browser = /CriOS/.test(ua) ? 'chrome' : (/FxiOS/.test(ua) ? 'firefox' : 'safari');
            log('Plataforma: iOS, Navegador: ' + window.PWAInstall.browser);
            return 'ios';
        }

        // Detectar Android
        if (/android/i.test(ua)) {
            window.PWAInstall.platform = 'android';
            // Detectar navegador en Android
            if (/Chrome\//.test(ua) && !/Edge|Edg|OPR|Opera/.test(ua)) {
                window.PWAInstall.browser = 'chrome';
            } else if (/Firefox/.test(ua)) {
                window.PWAInstall.browser = 'firefox';
            } else if (/SamsungBrowser/.test(ua)) {
                window.PWAInstall.browser = 'samsung';
            } else {
                window.PWAInstall.browser = 'other';
            }
            log('Plataforma: Android, Navegador: ' + window.PWAInstall.browser);
            return 'android';
        }

        window.PWAInstall.platform = 'desktop';
        window.PWAInstall.browser = 'desktop';
        log('Plataforma: Desktop');
        return 'desktop';
    }

    // Verificar si ya está instalada
    function checkIfInstalled() {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isIOSStandalone = window.navigator.standalone === true;

        // Solo considerar instalada si realmente está en modo standalone AHORA
        // No basarse en URL params porque pueden persistir incorrectamente
        const isActuallyInstalled = isStandalone || isIOSStandalone;

        window.PWAInstall.isInstalled = isActuallyInstalled;

        // Si estamos en browser normal, limpiar cualquier flag de instalación anterior
        if (!isActuallyInstalled) {
            sessionStorage.removeItem('pwa_install_skipped');
        }

        log('¿Está instalada? ' + window.PWAInstall.isInstalled);
        return window.PWAInstall.isInstalled;
    }

    // Mostrar toast de notificación
    function showToast(message, type = 'info') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            container.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;gap:10px;width:90%;max-width:350px;';
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
            text-align: center;
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
                html: '<i class="fa-solid fa-download"></i> INSTALAR APP',
                bg: 'linear-gradient(135deg, #10fbba, #0a8e69)',
                disabled: false
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
            'android-manual': {
                html: '<i class="fa-solid fa-ellipsis-vertical"></i> VER INSTRUCCIONES',
                bg: 'linear-gradient(135deg, #10fbba, #0a8e69)',
                disabled: false
            }
        };

        const config = states[state] || states['waiting'];
        btn.innerHTML = config.html;
        btn.style.background = config.bg;
        btn.disabled = config.disabled;

        log('Botón actualizado a estado: ' + state);
    }

    // Crear modal de Android si no existe
    function createAndroidModal() {
        if (document.getElementById('android-install-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'android-install-modal';
        modal.className = 'modal hidden';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            z-index: 10000;
            justify-content: center;
            align-items: center;
            padding: 20px;
            box-sizing: border-box;
        `;
        modal.innerHTML = `
            <div style="background: linear-gradient(145deg, #1a1a1a, #0d0d0d); border-radius: 24px; padding: 30px; max-width: 340px; width: 100%; border: 1px solid rgba(16, 251, 186, 0.2); box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
                <span onclick="PWAInstall.closeAndroidModal()" style="position: absolute; top: 15px; right: 20px; font-size: 28px; color: #888; cursor: pointer;">&times;</span>
                <div style="text-align: center; margin-bottom: 20px;">
                    <i class="fa-brands fa-android" style="font-size: 48px; color: #3DDC84;"></i>
                </div>
                <h3 style="color: white; font-size: 20px; font-weight: 800; text-align: center; margin-bottom: 15px;">Instalar en Android</h3>
                <p style="color: #888; font-size: 14px; text-align: center; margin-bottom: 20px;">Para instalar la app, sigue estos pasos:</p>
                <ol style="color: #ccc; font-size: 14px; line-height: 2; padding-left: 20px; margin-bottom: 25px;">
                    <li>Toca el menú <strong style="color: white;">⋮</strong> (tres puntos arriba a la derecha)</li>
                    <li>Selecciona <strong style="color: #10fbba;">"Instalar aplicación"</strong> o <strong style="color: #10fbba;">"Añadir a pantalla de inicio"</strong></li>
                    <li>Confirma tocando <strong style="color: white;">Instalar</strong></li>
                </ol>
                <button onclick="PWAInstall.closeAndroidModal()" style="width: 100%; padding: 16px; background: linear-gradient(135deg, #10fbba, #0a8e69); border: none; border-radius: 14px; color: #000; font-size: 16px; font-weight: 800; cursor: pointer;">
                    ENTENDIDO
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Mostrar modal de Android
    function showAndroidModal() {
        createAndroidModal();
        const modal = document.getElementById('android-install-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            log('Modal Android mostrado');
        }
    }

    // Cerrar modal de Android
    function closeAndroidModal() {
        const modal = document.getElementById('android-install-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
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
        log('Prompt disponible: ' + !!window.PWAInstall.deferredPrompt);
        log('Plataforma: ' + window.PWAInstall.platform);
        log('Navegador: ' + window.PWAInstall.browser);

        const platform = window.PWAInstall.platform;

        // iOS: Siempre mostrar instrucciones manuales
        if (platform === 'ios') {
            log('Mostrando instrucciones para iOS');
            showIOSModal();
            return;
        }

        // Android/Desktop: Intentar usar el prompt nativo
        if (window.PWAInstall.deferredPrompt) {
            log('Mostrando prompt de instalación nativo');
            updateButton('installing');

            try {
                const prompt = window.PWAInstall.deferredPrompt;
                prompt.prompt();

                prompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        log('Usuario aceptó la instalación');
                        showToast('¡Instalación iniciada!', 'success');
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
            } catch (err) {
                log('Error al mostrar prompt: ' + err, 'error');
                // Fallback a instrucciones manuales
                if (platform === 'android') {
                    showAndroidModal();
                }
            }
        } else {
            // No hay prompt disponible - mostrar instrucciones manuales
            log('No hay prompt disponible, mostrando instrucciones manuales', 'warn');

            if (platform === 'android') {
                showAndroidModal();
            } else {
                // Desktop sin prompt
                showToast('Usa el menú del navegador para instalar la app', 'info');
            }
        }
    }

    // Inicializar sistema de instalación
    function init() {
        log('Inicializando sistema de instalación PWA v3.0');

        // 1. Detectar plataforma
        detectPlatform();

        // 2. Verificar si ya está instalada
        if (checkIfInstalled()) {
            log('App ya instalada, saltando landing');
            skipInstall();
            return;
        }

        // 3. Crear modal de Android
        createAndroidModal();

        // 4. Capturar evento beforeinstallprompt ANTES de configurar el botón
        window.addEventListener('beforeinstallprompt', (e) => {
            log('✅ Evento beforeinstallprompt capturado!');
            e.preventDefault();
            window.PWAInstall.deferredPrompt = e;
            window.PWAInstall.promptReady = true;
            updateButton('ready');
        });

        // 5. Configurar el botón
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
                // En Android/Desktop, mostrar el botón activo inmediatamente
                // El prompt puede llegar después
                updateButton('waiting');
            }
        }

        // 6. Detectar cuando se instala
        window.addEventListener('appinstalled', () => {
            log('✅ App instalada exitosamente');
            window.PWAInstall.isInstalled = true;
            updateButton('installed');
            showToast('¡Alma Elite instalada!', 'success');

            // Ocultar landing después de un momento
            setTimeout(skipInstall, 2000);
        });

        // 7. Configurar cierre del modal iOS
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
        log('Esperando evento beforeinstallprompt...');
    }

    // Exponer funciones globalmente
    window.PWAInstall.init = init;
    window.PWAInstall.handleInstall = handleInstallClick;
    window.PWAInstall.skipInstall = skipInstall;
    window.PWAInstall.closeIOSModal = closeIOSModal;
    window.PWAInstall.closeAndroidModal = closeAndroidModal;
    window.PWAInstall.showToast = showToast;

    // Auto-inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM ya está listo
        init();
    }

})();
