/**
 * COE Bot — Servicio de Triaje
 * 
 * Flujo por conversación:
 *   1. Usuario escribe su duda
 *   2. Claude identifica el área responsable
 *   3. Bot responde con respuesta breve + ofrece conectar con el área
 *   4. Usuario confirma → bot notifica al área y cierra el hilo principal
 */

const Anthropic = require("@anthropic-ai/sdk");
const AREAS = require("../config/areas");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─────────────────────────────────────────────────────────────
// Estado de sesión por usuario
// { stage: 'triage' | 'confirming' | 'transferred', area: string }
// ─────────────────────────────────────────────────────────────
const sessions = new Map();

const TRIAGE_SYSTEM = `Eres el asistente de triaje del Centro Ocular Especializado (COE), clínica oftalmológica en México.

Tu trabajo es:
1. Entender brevemente la duda del paciente (1-2 oraciones empáticas y útiles)
2. Identificar a cuál área pertenece su consulta
3. Ofrecer conectarlo con esa área

ÁREAS DISPONIBLES:
${Object.entries(AREAS).map(([key, a]) => `- ${key}: ${a.descripcion}`).join("\n")}

RESPONDE SIEMPRE con este JSON exacto (sin markdown, sin explicación extra):
{
  "area": "<clave del área o null si no aplica ninguna>",
  "respuesta": "<mensaje amable de 2-3 oraciones para el paciente, en español>",
  "oferta": "<frase corta ofreciendo conectarlos, ej: ¿Le gustaría que le transfiriera con nuestro equipo de Cirugía Láser?>"
}

Si el mensaje es un saludo genérico o no está claro, usa area: null y pide más detalles en la respuesta.`;

/**
 * Analiza el mensaje del paciente y determina área + respuesta
 */
async function triageMessage(userMessage) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 400,
    system: TRIAGE_SYSTEM,
    messages: [{ role: "user", content: userMessage }],
  });

  const raw = response.content[0]?.text || "{}";

  try {
    // Limpiar posibles backticks si el modelo los añade
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return {
      area: null,
      respuesta: "Gracias por contactarnos. ¿En qué le puedo ayudar hoy? 😊",
      oferta: null,
    };
  }
}

/**
 * Procesa un mensaje entrante según la etapa de la sesión
 * Retorna { replyToPatient, notifyArea }
 */
async function processMessage(senderId, userMessage) {
  const session = sessions.get(senderId) || { stage: "triage" };

  // ── Etapa: esperando confirmación del paciente ─────────────
  if (session.stage === "confirming") {
    const affirmative = /s[ií]|claro|ok|sí|si|dale|por favor|adelante|okay/i.test(userMessage);
    const negative = /no|nel|luego|después|ahora no/i.test(userMessage);

    if (affirmative) {
      const area = AREAS[session.area];
      sessions.set(senderId, { stage: "transferred", area: session.area });

      return {
        replyToPatient:
          `Perfecto, le voy a conectar ahora con ${area.agente}. ` +
          `En un momento le contactarán. Si prefiere escribirles directamente, ` +
          `puede hacerlo aquí: https://wa.me/${area.whatsapp}\n\n` +
          `¡Que tenga un excelente día! 🏥`,
        notifyArea: {
          numero: area.whatsapp,
          areaName: area.nombre,
          patientId: senderId,
          mensaje: session.mensajeOriginal,
        },
      };
    }

    if (negative) {
      sessions.set(senderId, { stage: "triage" });
      return {
        replyToPatient:
          "Entendido, con gusto le ayudo aquí. ¿Tiene alguna otra duda o algo más en lo que pueda orientarle? 😊",
        notifyArea: null,
      };
    }

    // No se entendió la respuesta, volver a preguntar
    const area = AREAS[session.area];
    return {
      replyToPatient: `Disculpe, no entendí su respuesta. ¿Desea que le conectemos con ${area.agente}? Responda *Sí* o *No*.`,
      notifyArea: null,
    };
  }

  // ── Etapa: ya fue transferido, recordarle ─────────────────
  if (session.stage === "transferred") {
    const area = AREAS[session.area];
    return {
      replyToPatient:
        `Ya le pusimos en contacto con ${area.agente}. ` +
        `Si tiene una consulta diferente, con gusto le ayudo. ¿En qué más le puedo orientar?`,
      notifyArea: null,
    };
  }

  // ── Etapa: triaje normal ───────────────────────────────────
  const triage = await triageMessage(userMessage);
  const { area: areaKey, respuesta, oferta } = triage;

  if (areaKey && AREAS[areaKey]) {
    // Guardar sesión esperando confirmación
    sessions.set(senderId, {
      stage: "confirming",
      area: areaKey,
      mensajeOriginal: userMessage,
    });

    const mensaje = oferta
      ? `${respuesta}\n\n${oferta} Responda *Sí* o *No*.`
      : `${respuesta}\n\n¿Desea que le conectemos con el área correspondiente? Responda *Sí* o *No*.`;

    return { replyToPatient: mensaje, notifyArea: null };
  }

  // Sin área clara — respuesta genérica de bienvenida
  sessions.set(senderId, { stage: "triage" });
  return { replyToPatient: respuesta, notifyArea: null };
}

/**
 * Limpia la sesión de un usuario
 */
function clearSession(senderId) {
  sessions.delete(senderId);
}

module.exports = { processMessage, clearSession };
