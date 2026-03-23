/**
 * Handler de Facebook Messenger
 */

const axios = require("axios");
const { getAIResponse } = require("../services/claude");

const PAGE_TOKEN = process.env.PAGE_ACCESS_TOKEN;

/**
 * Envía un mensaje por Facebook Messenger
 */
async function sendFBMessage(recipientId, text) {
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
          Authorization: `Bearer ${PAGE_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`📤 Facebook Messenger enviado a ${recipientId}`);
  } catch (err) {
    console.error("❌ Error enviando FB Messenger:", err.response?.data || err.message);
  }
}

/**
 * Procesa el payload del webhook de Facebook Messenger
 */
async function facebookHandler(body) {
  const entry = body.entry?.[0];
  const messaging = entry?.messaging;
  if (!messaging || messaging.length === 0) return;

  for (const event of messaging) {
    // Ignorar eco de mensajes propios
    if (event.message?.is_echo) continue;

    // Solo procesar mensajes de texto
    if (!event.message?.text) {
      console.log("⚠️ FB Messenger: mensaje sin texto, ignorando");
      continue;
    }

    const senderId = event.sender?.id;
    const text = event.message.text;

    console.log(`📩 Facebook Messenger de ${senderId}: "${text}"`);

    // Activar indicador de escritura (opcional, mejora UX)
    try {
      await axios.post(
        "https://graph.facebook.com/v19.0/me/messages",
        { recipient: { id: senderId }, sender_action: "typing_on" },
        { headers: { Authorization: `Bearer ${PAGE_TOKEN}`, "Content-Type": "application/json" } }
      );
    } catch (_) { /* no crítico */ }

    const reply = await getAIResponse(`fb_${senderId}`, text);
    await sendFBMessage(senderId, reply);
  }
}

module.exports = facebookHandler;
