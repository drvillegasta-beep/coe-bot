/**
 * Handler de Instagram Direct Messages
 * Requiere cuenta de Instagram Business conectada a la App de Meta
 */

const axios = require("axios");
const { getAIResponse } = require("../services/claude");

const IG_TOKEN = process.env.INSTAGRAM_TOKEN;

/**
 * Envía un mensaje por Instagram DM
 */
async function sendIGMessage(recipientId, text) {
  try {
    await axios.post(
      "https://graph.facebook.com/v19.0/me/messages",
      {
        recipient: { id: recipientId },
        message: { text },
        messaging_type: "RESPONSE",
      },
      {
        headers: {
          Authorization: `Bearer ${IG_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`📤 Instagram DM enviado a ${recipientId}`);
  } catch (err) {
    console.error("❌ Error enviando Instagram DM:", err.response?.data || err.message);
  }
}

/**
 * Procesa el payload del webhook de Instagram
 */
async function instagramHandler(body) {
  const entry = body.entry?.[0];
  const messaging = entry?.messaging;
  if (!messaging || messaging.length === 0) return;

  for (const event of messaging) {
    // Ignorar ecos y mensajes propios
    if (event.message?.is_echo) continue;

    // Manejar comentarios en posts (si se configura)
    if (event.changes) {
      const change = event.changes[0];
      if (change?.field === "comments") {
        const comment = change.value;
        console.log(`💬 Comentario en IG: "${comment.text}" de ${comment.from?.name}`);
        // Aquí podrías responder comentarios automáticamente si lo deseas
        // Por ahora solo logueamos
        continue;
      }
    }

    // DM de texto
    if (!event.message?.text) continue;

    const senderId = event.sender?.id;
    const text = event.message.text;

    console.log(`📩 Instagram DM de ${senderId}: "${text}"`);

    const reply = await getAIResponse(`ig_${senderId}`, text);
    await sendIGMessage(senderId, reply);
  }
}

module.exports = instagramHandler;
