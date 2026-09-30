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

// ── Alertas de Caja COE (las manda Supabase) ─────────────────────────────
// POST /alerta-caja   encabezado x-coe-key = CAJA_KEY
// cuerpo: { tipo, mensaje, telefonos: ["52443..."] }
app.post("/alerta-caja", async (req, res) => {
  const axios = require("axios");
  if (!process.env.CAJA_KEY || req.get("x-coe-key") !== process.env.CAJA_KEY) {
    return res.status(401).json({ error: "No autorizado" });
  }
  const { tipo, mensaje, telefonos } = req.body || {};
  if (!mensaje || !Array.isArray(telefonos) || telefonos.length === 0) {
    return res.status(400).json({ error: "Faltan mensaje o telefonos" });
  }
  // Las plantillas de Meta no aceptan saltos de línea ni muchos espacios en las variables
  const texto = String(mensaje).replace(/[\r\n\t]+/g, " · ").replace(/ {4,}/g, "   ").slice(0, 1000);
  const url = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`;
  const headers = { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" };
  const plantilla = process.env.CAJA_TEMPLATE || "alerta_caja";
  const idioma = process.env.CAJA_TEMPLATE_LANG || "es_MX";
  const resultados = [];

  for (const to of telefonos.slice(0, 10)) {
    try {
      await axios.post(url, {
        messaging_product: "whatsapp", to, type: "template",
        template: { name: plantilla, language: { code: idioma },
                    components: [{ type: "body", parameters: [{ type: "text", text: texto }] }] },
      }, { headers });
      resultados.push({ to, ok: true, via: "plantilla" });
    } catch (err) {
      const errPlantilla = err.response?.data?.error?.message || err.message;
      try {
        // Respaldo: texto libre (solo llega si la persona escribió al bot en las últimas 24 h)
        await axios.post(url, { messaging_product: "whatsapp", to, type: "text",
                                text: { body: `Aviso de Caja COE: ${texto}` } }, { headers });
        resultados.push({ to, ok: true, via: "texto", aviso: errPlantilla });
      } catch (err2) {
        resultados.push({ to, ok: false, error: errPlantilla });
      }
    }
  }
  console.log(`📣 Alerta de caja (${tipo || "sin tipo"}):`, JSON.stringify(resultados));
  res.json({ ok: resultados.some(r => r.ok), resultados });
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
