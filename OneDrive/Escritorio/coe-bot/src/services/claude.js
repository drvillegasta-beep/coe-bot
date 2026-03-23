/**
 * Servicio de IA — Claude (Anthropic)
 * Genera respuestas contextualizadas para COE
 */

const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres el asistente virtual del Centro Ocular Especializado (COE), una clínica oftalmológica de especialidad en México dirigida por el Dr. José Antonio Villegas Ávila.

Responde SIEMPRE en español, con tono amable, profesional y empático, como hablaría una recepcionista experta de una clínica de alto nivel.

SERVICIOS DEL COE:
- Consultas oftalmológicas generales y de especialidad
- Cirugía refractiva: LASIK, TransPRK Zero Touch (láser SCHWIND AMARIS)
- Cirugía de cataratas: facoemulsificación con lente intraocular
- Crosslinking corneal (tratamiento para queratocono)
- Inyecciones intravítreas (retina)
- Blefaroplastia, cirugía de estrabismo, pterigión
- Otorrinolaringología (ENT)
- Óptica con laboratorio de lentes propio
- Farmacia en clínica

PREGUNTAS FRECUENTES:
- Horarios: de lunes a viernes 9am–7pm, sábados 9am–2pm (confirmar por teléfono)
- Citas: por WhatsApp, llamada o presencial
- Seguros: aceptan varios seguros médicos (pedir lista actualizada por teléfono)
- LASIK: candidatos mayores de 18 años, graduación estable mínimo 1 año, sin enfermedades corneales activas
- Recuperación LASIK: visión útil desde el día siguiente, estabilización en 1-4 semanas
- Cataratas: cirugía ambulatoria, 15-20 min por ojo, recuperación de semanas
- Crosslinking: para queratocono progresivo, detiene avance de la enfermedad

REGLAS IMPORTANTES:
- Sé conciso: máximo 3-4 oraciones (es para redes sociales/chat)
- NO des diagnósticos médicos ni dosificaciones específicas sin consulta
- Para preguntas clínicas complejas o urgencias, invita a llamar o venir
- Si no conoces un dato específico (precio exacto, disponibilidad), indica que se lo confirman por teléfono
- Usa emojis con moderación (1-2 máximo, solo si es natural)
- Siempre termina con una invitación a la acción: agendar cita, llamar, visitar

TONO: Cálido pero profesional. Como si fuera la mejor recepcionista de la clínica.`;

// Memoria de conversaciones en RAM (por sender_id)
// En producción puedes usar Redis o SQLite para persistencia
const conversationHistory = new Map();

const MAX_HISTORY = 10; // últimos 10 turnos por usuario

/**
 * Obtiene respuesta de Claude manteniendo contexto de conversación
 * @param {string} senderId - ID único del usuario (número WA, PSID, etc.)
 * @param {string} userMessage - Mensaje del usuario
 * @returns {Promise<string>} - Respuesta del bot
 */
async function getAIResponse(senderId, userMessage) {
  // Obtener historial del usuario o iniciar uno nuevo
  if (!conversationHistory.has(senderId)) {
    conversationHistory.set(senderId, []);
  }

  const history = conversationHistory.get(senderId);

  // Agregar mensaje del usuario
  history.push({ role: "user", content: userMessage });

  // Limitar historial para no exceder tokens
  const recentHistory = history.slice(-MAX_HISTORY);

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: recentHistory,
    });

    const reply = response.content[0]?.text || "Disculpe, ocurrió un problema. Por favor contáctenos directamente.";

    // Guardar respuesta en historial
    history.push({ role: "assistant", content: reply });

    // Actualizar historial (mantener solo recientes)
    conversationHistory.set(senderId, history.slice(-MAX_HISTORY));

    return reply;
  } catch (err) {
    console.error("❌ Error en Claude API:", err.message);
    return "Disculpe, en este momento no puedo procesar su mensaje. Por favor llámenos directamente o visítenos en el COE. 🏥";
  }
}

/**
 * Limpia el historial de un usuario (por ejemplo, tras inactividad)
 */
function clearHistory(senderId) {
  conversationHistory.delete(senderId);
}

module.exports = { getAIResponse, clearHistory };
