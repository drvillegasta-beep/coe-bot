/**
 * COE Bot — Servidor de Webhook
 * Maneja mensajes de WhatsApp Business, Instagram DM y Facebook Messenger
 * y responde automáticamente con IA (Claude)
 */

const express = require("express");
const app = express();
app.use(express.json());

const whatsappHandler = require("./handlers/whatsapp");
const instagramHandler = require("./handlers/instagram");
const facebookHandler = require("./handlers/facebook");

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "coe_webhook_2024";
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────
// VERIFICACIÓN DE WEBHOOKS (GET)
// Meta llama a esta URL cuando configuras el webhook
// ─────────────────────────────────────────────
app.get("/webhook", (req, res) => {
  const mode      = req.query["hub.mode"];
  const token     = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado por Meta");
    return res.status(200).send(challenge);
  }
  console.warn("❌ Verificación fallida — token incorrecto");
  res.sendStatus(403);
});

// ─────────────────────────────────────────────
// RECEPCIÓN DE MENSAJES (POST)
// ─────────────────────────────────────────────
app.post("/webhook", async (req, res) => {
  const body = req.body;

  // Responder 200 inmediatamente para que Meta no reintente
  res.sendStatus(200);

  try {
    const object = body?.object;

    if (object === "whatsapp_business_account") {
      await whatsappHandler(body);
    } else if (object === "instagram") {
      await instagramHandler(body);
    } else if (object === "page") {
      await facebookHandler(body);
    } else {
      console.log("📦 Objeto desconocido:", object);
    }
  } catch (err) {
    console.error("❌ Error procesando mensaje:", err.message);
  }
});

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString(), bot: "COE Bot v1.0" });
});

app.listen(PORT, () => {
  console.log(`🤖 COE Bot corriendo en puerto ${PORT}`);
  console.log(`📡 Webhook URL: http://TU_IP:${PORT}/webhook`);
});
