# LOGICA DE AGENTE IA - Asistente Veterinario con Gemini

Este documento detalla la implementación del agente de IA basado en **Google Gemini** para el proyecto **Alma Elite**. Describe cómo configurar el modelo, gestionar el contexto y procesar las respuestas para un uso fluido y empático.

---

## 🛠️ Tecnologías Utilizadas
- **SDK:** `@google/generative-ai`
- **Modelo:** `gemini-flash-latest` (Optimizado para baja latencia y free tier).
- **Contexto:** Instrucciones de sistema persistentes.

---

## 🏗️ Arquitectura del Agente

### 1. Instrucción de Sistema (System Prompt)
Es el núcleo de la personalidad del agente. Define el rol, el tono y las restricciones de formato:

```javascript
const SYSTEM_INSTRUCTION = `Eres un asistente veterinario útil y amable.
Tu objetivo es chatear con los usuarios como un humano normal, dando consejos prácticos sobre sus mascotas.
No uses formato HTML complejo, solo texto plano y saltos de línea normales.
Sé directo, empático y habla en español de forma natural.`;
```

### 2. Inicialización de Sesión
Para que la IA tenga "memoria" durante la conversación, se utiliza el método `startChat`. Esto permite enviar el historial acumulado en cada mensaje de forma automática por el SDK:

```javascript
let chatSession = null;

async function initVetSession() {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
        model: "gemini-flash-latest",
        systemInstruction: SYSTEM_INSTRUCTION
    });
    
    // Inicia una sesión de chat vacía (el SDK gestionará el historial interno)
    chatSession = model.startChat({ history: [] });
}
```

### 3. Flujo de Respuesta
La función principal gestiona la llamada asíncrona y realiza una limpieza básica de la respuesta para evitar artefactos de Markdown (como bloques de código HTML innecesarios):

```javascript
async function getVetResponse(userMessage) {
    if (!chatSession) await initVetSession();

    try {
        const result = await chatSession.sendMessage(userMessage);
        const response = await result.response;
        let text = response.text();

        // Limpieza de formato para evitar ruido visual en la UI
        text = text.replace(/```html/g, '').replace(/```/g, '');

        return text;
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Lo siento, ha ocurrido un error técnico. Inténtalo de nuevo.";
    }
}
```

---

## 💡 Mejores Prácticas Implementadas

1.  **Contexto Persistente:** Al usar `startChat`, el agente recuerda lo mencionado anteriormente en la misma sesión sin que el desarrollador tenga que gestionar manualmente el array de historial en cada llamada.
2.  **Seguridad (Vigilancia):** Se incluye una advertencia sobre la exposición de la `API_KEY` en el cliente. En producción, estas llamadas deben realizarse desde un `backend` o `edge function`.
3.  **Manejo de Errores:** Se han incluido bloques `try/catch` para capturar fallos de red o de cuotas de la API sin que la aplicación se detenga.
4.  **Limpieza de Output:** La IA a veces intenta responder en Markdown o bloques HTML; el código implementado limpia estos tags para que el texto se integre perfectamente en las burbujas de chat de la app.

---

## 🚀 Cómo Reutilizar
1.  Instalar el SDK: `npm install @google/generative-ai`.
2.  Configurar la `VITE_GEMINI_API_KEY` en el archivo `.env`.
3.  Copiar la lógica de `initVetSession` y `getVetResponse` adaptando el `SYSTEM_INSTRUCTION` a las necesidades del nuevo proyecto.
