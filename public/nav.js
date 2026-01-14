/**
 * Navigation System v1.0 - Standalone
 * Sistema de navegación independiente para Alma Elite
 * Se carga antes de main.js para asegurar que funcione
 */

(function () {
    'use strict';

    console.log('🧭 Navigation System v1.0 cargando...');

    // ============================================
    // ROUTER - Sistema de navegación entre pantallas
    // ============================================

    const Router = {
        activeScreen: 'home',

        init() {
            console.log('🧭 Inicializando Router...');

            // Añadir listeners a todos los nav-links
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const screen = link.getAttribute('data-screen');
                    if (screen) {
                        this.navigate(screen);
                    }
                });
            });

            console.log('✅ Router inicializado');
        },

        navigate(screenId) {
            console.log('🧭 Navegando a:', screenId);
            this.activeScreen = screenId;

            // Controlar visibilidad de Nav Bar
            const nav = document.querySelector('.bottom-nav');
            if (nav) {
                if (screenId === 'detail' || screenId === 'chat') {
                    nav.classList.add('hidden');
                } else {
                    nav.classList.remove('hidden');
                }
            }

            // Ocultar todas las pantallas
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

            // Desactivar todos los nav-links
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

            // Activar la pantalla objetivo
            const target = document.getElementById(`screen-${screenId}`);
            if (target) {
                target.classList.add('active');
            } else {
                console.warn('🧭 Pantalla no encontrada:', `screen-${screenId}`);
            }

            // Activar el nav-link correspondiente
            const navLink = document.querySelector(`[data-screen="${screenId}"]`);
            if (navLink) {
                navLink.classList.add('active');
            }

            // Scroll al inicio
            const viewPort = document.getElementById(`screen-${screenId}`);
            if (viewPort) {
                viewPort.scrollTop = 0;
            }

            // Callbacks especiales por pantalla
            if (screenId === 'home') {
                console.log("📍 Entrando a Home...");
                if (typeof window.renderHomeNews === 'function') {
                    window.renderHomeNews();
                }
            }

            if (screenId === 'catalog') {
                console.log("📍 Entrando a Catálogo...");
                // Renderizar catálogo si existe la función
                if (typeof window.renderCatalog === 'function') {
                    window.renderCatalog();
                }
            }

            if (screenId === 'community') {
                console.log("📍 Entrando a Social Hub...");
                if (typeof window.switchSocialTab === 'function') {
                    window.switchSocialTab('heroes');
                }
            }

            if (screenId === 'rescue') {
                console.log("📍 Entrando a Centro de Rescate...");
                // Trigger para inicializar mapas
                setTimeout(() => {
                    if (typeof window.initRescueMap === 'function') {
                        window.initRescueMap();
                    }
                    if (typeof window.initRadarMap === 'function') {
                        window.initRadarMap();
                    }
                }, 200);
            }

            if (screenId === 'vet-ai') {
                console.log("📍 Entrando a Vet AI...");
                if (typeof window.initVetSession === 'function') {
                    window.initVetSession();
                }
            }

            if (screenId === 'profile') {
                console.log("📍 Entrando a Perfil...");
                if (typeof window.renderProfile === 'function') {
                    window.renderProfile();
                }
            }
        }
    };


    // Exponer Router globalmente
    window.Router = Router;

    // Función global para mostrar pantalla (compatibilidad)
    window.showScreen = function (screenId) {
        Router.navigate(screenId);
    };

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    function initNavigation() {
        console.log('🧭 Inicializando navegación...');
        Router.init();
    }

    // Inicializar cuando DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavigation);
    } else {
        initNavigation();
    }

    console.log('✅ Navigation System v1.0 cargado correctamente');

})();
