import { GoogleGenerativeAI } from "@google/generative-ai";

// ⚠️ ADVERTENCIA: En un entorno de producción real, la API Key no debe estar expuesta en el cliente.
// Se recomienda usar un proxy o backend intermedio.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ Faltan la API Key de Gemini. Configura VITE_GEMINI_API_KEY en tu archivo .env");
}

// Safe Initialization
let genAI = null;
let model = null;

if (API_KEY) {
    try {
        genAI = new GoogleGenerativeAI(API_KEY);
        model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            // systemInstruction moving to startChat or kept here if SDK supports it
            systemInstruction: SYSTEM_INSTRUCTION
        });
    } catch (e) {
        console.error("Gemini Init Error:", e);
    }
}

// --- SYSTEM PROMPT / PERSONALIDAD ---
const SYSTEM_INSTRUCTION = `Eres la Dra. Alma, una veterinaria de urgencias experta, empática y altamente profesional.
Tu misión es realizar un triaje inicial y dar consejos de primeros auxilios a dueños de mascotas preocupados.

REGLAS DE ACTUACIÓN:
1.  **Seguridad Ante Todo**: Nunca des un diagnóstico médico definitivo a distancia. Usa frases como "Podría tratarse de...", "Los síntomas sugieren...".
2.  **Urgencia**: Identifica rápidamente si es una emergencia vital (dificultad respiratoria, convulsiones, hemorragias profusas). Si es así, insta al usuario a ir al veterinario INMEDIATAMENTE mientras le das indicaciones de soporte vital.
3.  **Tono**: Cálido pero firme. Transmite calma. Habla como una persona, no como una lista de pasos robótica.
4.  **Estructura**:
    *   Empatiza brevemente ("Veo que estás preocupado...").
    *   Evalúa la severidad.
    *   Da 1-2 instrucciones claras y accionables (pasos de primeros auxilios).
    *   Haz una pregunta de control para verificar el estado del animal.
5.  **Formato HTML**: Responde SIEMPRE en formato HTML limpio (sin markdown, sin bloques de código). Usa <p>, <strong>, <em>, y listas <ul>/<li> si es necesario.
    *   Usa <div class="vet-alert">...</div> para advertencias críticas.
    *   Usa <div class="vet-step">...</div> para pasos a seguir.

CONTEXTO ACTUAL:
Estás integrado en la app "Alma Elite".
`;

let chatSession = null;

export async function initVetSession() {
    if (!model) {
        console.warn("⚠️ Modelo no inicializado (Falta API Key o Error)");
        return;
    }
    try {
        chatSession = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: "Hola, soy el sistema. Compórtate como la Dra. Alma según tus instrucciones." }],
                },
                {
                    role: "model",
                    parts: [{ text: "Entendido. Soy la Dra. Alma. Estoy lista para atender emergencias con profesionalidad y calma. ¿Cuál es la situación?" }],
                },
            ],
        });
        console.log("✅ Sesión de Gemini (Dra. Alma) inicializada.");
    } catch (error) {
        console.error("Error al iniciar sesión de IA:", error);
    }
}

export async function getVetResponse(userMessage) {
    if (!chatSession) {
        await initVetSession();
    }

    if (!API_KEY) {
        return `
            <div class="vet-alert">
                <i class="fa-solid fa-triangle-exclamation"></i> <strong>Error de Configuración</strong>
                <p>No se ha detectado la API Key de Gemini. Por favor, configura el archivo <code>.env</code>.</p>
            </div>
        `;
    }

    try {
        const result = await chatSession.sendMessage(userMessage);
        const response = await result.response;
        let text = response.text();

        // Limpieza básica por si el modelo devuelve markdown
        text = text.replace(/```html/g, '').replace(/```/g, '');

        return text;
    } catch (error) {
        console.error("Error en Gemini:", error);
        return `
            <div class="vet-alert" style="border-color: #ff4444; background: rgba(255,0,0,0.1);">
                <i class="fa-solid fa-bug"></i> <strong>Error Técnico:</strong>
                <p style="font-size: 11px; font-family: monospace;">${error.message || error.toString()}</p>
            </div>
            <p><strong>Dra. Alma:</strong> Lo siento, ha ocurrido un error interno. Por favor, intenta enviarme el mensaje de nuevo.</p>
        `;
    }
}
