# LOGICA DE GPS - Sistema de Geolocalización Robusta

Este documento detalla la arquitectura y el código del sistema de localización implementado en **Alma Elite**. Esta lógica está diseñada para ser resiliente, rápida y ofrecer siempre una respuesta al usuario, incluso cuando el GPS falla.

## 🏗️ Estrategia de las 4 Capas (Multi-Layer)

El sistema intenta obtener la ubicación en niveles progresivos de precisión y velocidad:

1.  **Capa Rápida (GPS Low Accuracy):** Intento inicial con un timeout muy corto (3-5s). El objetivo es centrar el mapa lo antes posible para dar sensación de velocidad.
2.  **Capa Precisa (`watchPosition`):** Seguimiento continuo con alta precisión. Es la fuente principal de datos una vez se establece la señal.
3.  **Capa de Rescate (Fallback IP):** Si el GPS no responde en 10-15s, se dispara una petición a una API externa (como `ipapi.co`) para obtener una ubicación aproximada por red.
4.  **Capa de Control (Modo Manual):** Si todo falla o el usuario prefiere precisión absoluta, se habilita el arrastre manual del marcador con feedback visual.

---

## 💻 Implementación de Referencia (JavaScript)

### 1. Inicialización y Gestión de Estados
Se recomienda un objeto `LocationManager` para centralizar el estado:

```javascript
const LocationManager = {
    pos: JSON.parse(localStorage.getItem('last_known_pos')) || [40.4168, -3.7038],
    status: 'idle', // locating, success, error, manual
    
    async init() {
        this.status = 'locating';
        this.updateUI('Buscando señal GPS...');

        // Intento Rápido
        navigator.geolocation.getCurrentPosition(
            (p) => this.processUpdate(p, 'fast'),
            (err) => console.warn("GPS Rápido falló, esperando precisión..."),
            { enableHighAccuracy: false, timeout: 3000 }
        );

        // Seguimiento de Alta Precisión
        this.watchId = navigator.geolocation.watchPosition(
            (p) => this.processUpdate(p, 'high-accuracy'),
            (err) => this.handleError(err),
            { enableHighAccuracy: true, timeout: 15000 }
        );

        // Fallback por IP automático después de 10s
        setTimeout(() => {
            if (this.status === 'locating') this.locateByIP();
        }, 10000);
    }
};
```

### 2. Fallback por IP
Fundamental para apps que funcionan en interiores o zonas con mala cobertura satelital:

```javascript
async locateByIP() {
    try {
        const resp = await fetch('https://ipapi.co/json/');
        const data = await resp.json();
        if (data.latitude && data.longitude) {
            const ipPos = [data.latitude, data.longitude];
            // Aplicar pequeño jitter para evitar solapamientos exactos
            ipPos[0] += (Math.random() - 0.5) * 0.01;
            this.processUpdate({ coords: { latitude: ipPos[0], longitude: ipPos[1] } }, 'ip');
        }
    } catch (e) {
        console.error("Fallo total de geolocalización");
    }
}
```

### 3. Filtrado de Movimiento (Distance Threshold)
Para evitar que el mapa "salte" por errores mínimos de precisión del GPS:

```javascript
processUpdate(position, source) {
    const newPos = [position.coords.latitude, position.coords.longitude];
    
    // Solo actualizar si el movimiento es > 10 metros
    if (this.pos && calculateDistance(this.pos, newPos) < 10 && source === 'watch') {
        return; 
    }

    this.pos = newPos;
    this.status = 'success';
    localStorage.setItem('last_known_pos', JSON.stringify(newPos));
    this.syncMap(newPos);
}
```

---

## 🛠️ Requisitos Críticos
1.  **HTTPS:** La API de `geolocation` solo funciona en contextos seguros (https:// o localhost).
2.  **Permisos:** El usuario debe aceptar el permiso de ubicación. Es vital mostrar un mensaje claro de *por qué* se necesita.
3.  **Persistencia:** Guardar siempre la última posición en `localStorage` para que la app no empiece en "Madrid" por defecto si el usuario está en otra ciudad.

## 🎨 Feedback Visual Recomendado
- **Iconos Dinámicos:** Cambiar el icono del marcador o del texto según la fuente:
    - 🛰️ Satélite (GPS Alta precisión)
    - 📶 WiFi (IP/Red)
    - 👆 Mano (Manual)
- **Overlay de Carga:** Mientras se busca el GPS, mostrar un overlay semitransparente sobre el mapa para indicar que la ubicación está "en proceso".
