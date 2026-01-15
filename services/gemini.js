import { GoogleGenerativeAI } from "@google/generative-ai";

// ⚠️ ADVERTENCIA: En un entorno de producción real, la API Key no debe estar expuesta en el cliente.
// Se recomienda usar un proxy o backend intermedio.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const SYSTEM_INSTRUCTION = `Eres un asistente veterinario útil y amable.
Tu objetivo es chatear con los usuarios como un humano normal, dando consejos prácticos sobre sus mascotas.
No uses formato HTML complejo, solo texto plano y saltos de línea normales.
Sé directo, empático y habla en español de forma natural.`;

if (!API_KEY) {
    console.warn("⚠️ Gemini: API Key no configurada. El chat de IA no funcionará.");
}

// Safe Initialization
let genAI = null;
let model = null;

if (API_KEY) {
    try {
        genAI = new GoogleGenerativeAI(API_KEY);
        model = genAI.getGenerativeModel({
            model: "gemini-flash-latest", // Alias más compatible para Free Tier
            systemInstruction: SYSTEM_INSTRUCTION
        });
        console.log("✅ Gemini inicializado correctamente");
    } catch (e) {
        console.error("Gemini Init Error:", e);
    }
}


let chatSession = null;

export async function initVetSession() {
    if (!model) {
        console.warn("⚠️ Modelo no inicializado (Falta API Key o Error)");
        return;
    }
    try {
        chatSession = model.startChat({
            history: [],
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
        return "⚠️ Error: Falta la API Key de Gemini. Configúrala en .env";
    }

    try {
        const result = await chatSession.sendMessage(userMessage);
        const response = await result.response;
        let text = response.text();

        // Limpieza básica
        text = text.replace(/```html/g, '').replace(/```/g, '');

        return text;
    } catch (error) {
        console.error("Error en Gemini:", error);
        return `Lo siento, ha ocurrido un error técnico (${error.message || 'Desconocido'}). Por favor intenta de nuevo.`;
    }
}
