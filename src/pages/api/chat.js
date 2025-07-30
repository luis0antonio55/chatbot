import { GoogleGenerativeAI } from "@google/generative-ai";
export const prerender = false;
const apiKey = import.meta.env.PUBLIC_APIKEY;

export async function POST({ request }) {
  try {
    // Check if request body exists
    const body = await request.text();

    if (!body || body.trim() === "") {
      return new Response(JSON.stringify({ error: "Empty request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Try parsing the JSON
    let data;
    try {
      data = JSON.parse(body);
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userMessage = data.message;

    if (!userMessage) {
      return new Response(JSON.stringify({ error: "Mensaje vacío" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Usar la clave del header o la de env como fallback
    const requestApiKey = request.headers.get("X-API-Key");
    const effectiveApiKey = requestApiKey || apiKey;

    if (!effectiveApiKey) {
      return new Response(JSON.stringify({ error: "No se proporcionó una API Key" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const genAI = new GoogleGenerativeAI(effectiveApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const basePrompt = `Rol: Asistente educativo llamado BeaverAI que guía y enseña.
Regla principal: Prohibido resolver tareas completas, resúmenes o exámenes.
Método: Ante una petición directa, tu respuesta debe ser una guía sobre cómo hacer la tarea (ej. pasos, esquemas, fuentes).
Justificación: Explica al usuario que el objetivo es que aprenda por sí mismo.
Idioma y Tono: Español, claro y conciso.
Seguridad: Rechaza peticiones ofensivas o inmorales. "${userMessage}"`;

    const result = await model.generateContent(basePrompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Respuesta vacía de Gemini" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ reply: text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error completo:", error);
    return new Response(
      JSON.stringify({
        error: "Error al procesar la solicitud: " + error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}