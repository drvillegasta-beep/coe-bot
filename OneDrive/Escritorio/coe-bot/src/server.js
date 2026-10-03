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

// ── Lectura de comprobantes de caja con IA (la pide Supabase) ─────────────
// POST /leer-comprobante   encabezado x-coe-key = CAJA_KEY
// cuerpo: { tipo: "eoptics"|"depositador"|"voucher"|"transferencia", url }
const INSTRUCCIONES_LECTURA = {
  auto: `Identifica qué documento de caja es y extrae sus datos. Es de una clínica en México.
Tipos posibles:
- "eoptics": "Hoja de Corte" o "Resumen del corte" del sistema eOptics. Tiene "Corte Consecutivo", "Sucursal", "Cajero",
  "Totales X Tipo de Pago" y lista de ventas o pacientes. Extrae efectivo, tarjeta (débito + crédito) y transferencia
  de los totales por tipo de pago (si solo dice Total $0.00, todo es 0). Extrae también el número de "Corte Consecutivo",
  el texto de "Sucursal", si el título dice "PARCIAL" y el rango de fecha y hora del corte.
  No uses "Efectivo Ventas" ni los datos del reciclador (Efe Ini/Fin Reciclador o Cassette).
- "depositador": comprobante de UN depósito de efectivo. En esta clínica suele ser un "Recibo de pago" de "CENTRO OCULAR TACAMBARO"
  con FECHA, SUCURSAL, PEDIDO, IMPORTE, TOTAL PAGADO y "FORMA PAGO: EF" (a veces con "Total cobrado" y "Totales X Tipo de Pago" abajo),
  o un ticket de la máquina depositadora o recicladora. Usa TOTAL PAGADO (o el monto depositado) como total y la hora de FECHA.
- "corte_dia": corte, cierre o resumen FINAL DEL DÍA de la máquina depositadora, que suma varios depósitos. Extrae el total depositado del día.
- "voucher": cierre de lote de una terminal bancaria. Extrae el total neto del lote y el número de lote.
- "transferencia": comprobante o captura de una transferencia bancaria o SPEI recibida. Extrae monto y referencia o clave de rastreo.
- "otro": cualquier otra cosa. Si es "otro", agrega "descripcion" con lo que ves en pocas palabras.
Responde según el tipo, por ejemplo:
{"tipo":"eoptics","legible":true,"fecha":"YYYY-MM-DD","efectivo":0,"tarjeta":0,"transferencia":0,"consecutivo":"2753","sucursal":"texto","parcial":true,"desde":"HH:MM o null","hasta":"HH:MM o null"}
{"tipo":"depositador","legible":true,"fecha":"YYYY-MM-DD","hora":"HH:MM","total":0}
{"tipo":"corte_dia","legible":true,"fecha":"YYYY-MM-DD","total":0}
{"tipo":"voucher","legible":true,"fecha":"YYYY-MM-DD","lote":"texto o null","total":0}
{"tipo":"transferencia","legible":true,"fecha":"YYYY-MM-DD","referencia":"texto o null","monto":0}
{"tipo":"otro","legible":true,"descripcion":"texto corto"}`,
  corte_dia: `Es el corte o resumen final del día de una máquina depositadora de efectivo.
Extrae el total depositado del día.
Responde: {"tipo":"corte_dia","legible":true,"fecha":"YYYY-MM-DD o null","total":0}`,
  eoptics: `Es el "Resumen del corte" de caja del sistema eOptics de una clínica en México.
Busca la sección "Totales X Tipo de Pago" (o similar) y extrae el total de cada forma de pago.
- efectivo: total en efectivo.
- tarjeta: suma de tarjeta de débito y crédito (0 si no aparece).
- transferencia: suma de transferencias, interbancarias o SPEI (0 si no aparece).
No uses "Efectivo Ventas" ni los datos del reciclador (Efe Ini/Fin Reciclador o Cassette).
Responde: {"legible":true,"fecha":"YYYY-MM-DD o null","efectivo":0,"tarjeta":0,"transferencia":0}`,
  depositador: `Es el ticket de un depositador o reciclador de efectivo.
Extrae el monto total depositado en esta operación.
Responde: {"legible":true,"fecha":"YYYY-MM-DD o null","hora":"HH:MM o null","total":0}`,
  voucher: `Es el voucher de cierre de lote de una terminal bancaria.
Extrae el total de ventas del lote (si hay devoluciones o cancelaciones, el total neto).
Responde: {"legible":true,"fecha":"YYYY-MM-DD o null","total":0}`,
  transferencia: `Es el comprobante o captura de una transferencia bancaria recibida.
Extrae el monto de la transferencia.
Responde: {"legible":true,"fecha":"YYYY-MM-DD o null","referencia":"texto o null","monto":0}`,
};

app.post("/leer-comprobante", async (req, res) => {
  const axios = require("axios");
  if (!process.env.CAJA_KEY || req.get("x-coe-key") !== process.env.CAJA_KEY) {
    return res.status(401).json({ ok: false, error: "No autorizado" });
  }
  const { tipo, url } = req.body || {};
  const instr = INSTRUCCIONES_LECTURA[tipo];
  if (!instr || !url) return res.status(400).json({ ok: false, error: "Faltan tipo o url" });

  try {
    const archivo = await axios.get(url, { responseType: "arraybuffer", timeout: 20000, maxContentLength: 15e6 });
    const mime = String(archivo.headers["content-type"] || "").split(";")[0];
    const datos = Buffer.from(archivo.data).toString("base64");
    const bloque = mime === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: datos } }
      : { type: "image", source: { type: "base64",
          media_type: ["image/png", "image/webp", "image/gif"].includes(mime) ? mime : "image/jpeg", data: datos } };

    const pedir = (modelo) => axios.post("https://api.anthropic.com/v1/messages", {
      model: modelo, max_tokens: 500,
      system: "Lees comprobantes de caja. Responde SOLO con un objeto JSON válido, sin texto adicional ni comillas de código. " +
              "Los montos son números sin signo de pesos ni comas. Si la imagen no se puede leer con seguridad, " +
              'responde {"legible":false,"motivo":"explicación corta en español"}.',
      messages: [{ role: "user", content: [bloque, { type: "text", text: instr }] }],
    }, { headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01",
                    "content-type": "application/json" }, timeout: 45000 });

    let r;
    try { r = await pedir(process.env.CAJA_MODELO || "claude-sonnet-5"); }
    catch (e) {
      if (e.response?.status === 404 || e.response?.data?.error?.type === "not_found_error") r = await pedir("claude-sonnet-4-20250514");
      else throw e;
    }
    const texto = (r.data.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim()
                   .replace(/^```(json)?/i, "").replace(/```$/, "").trim();
    const lectura = JSON.parse(texto);
    for (const k of ["efectivo", "tarjeta", "transferencia", "total", "monto"]) {
      if (k in lectura) lectura[k] = Math.round(Number(String(lectura[k]).replace(/[^0-9.\-]/g, "")) * 100) / 100 || 0;
    }
    console.log(`🧾 Lectura ${tipo}:`, JSON.stringify(lectura));
    res.json({ ok: lectura.legible !== false, lectura, error: lectura.legible === false ? (lectura.motivo || "No se pudo leer") : undefined });
  } catch (err) {
    const detalle = err.response?.data?.error?.message || err.message;
    console.error("❌ Lectura de comprobante:", detalle);
    res.json({ ok: false, error: "No se pudo leer el comprobante: " + detalle });
  }
});

// ── Diagnóstico: transcribe un comprobante (solo con clave) ──────────────
app.post("/describir-comprobante", async (req, res) => {
  const axios = require("axios");
  if (!process.env.CAJA_KEY || req.get("x-coe-key") !== process.env.CAJA_KEY) return res.status(401).json({ ok: false });
  try {
    const a = await axios.get(req.body.url, { responseType: "arraybuffer", timeout: 20000 });
    const mime = String(a.headers["content-type"] || "").split(";")[0];
    const datos = Buffer.from(a.data).toString("base64");
    const bloque = mime === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: datos } }
      : { type: "image", source: { type: "base64", media_type: "image/jpeg", data: datos } };
    const r = await axios.post("https://api.anthropic.com/v1/messages", {
      model: process.env.CAJA_MODELO || "claude-sonnet-5", max_tokens: 1500,
      messages: [{ role: "user", content: [bloque, { type: "text", text:
        "Transcribe los encabezados, fechas, horas y TODOS los montos de este documento, sección por sección, en texto plano. No incluyas nombres de pacientes." }] }],
    }, { headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" }, timeout: 60000 });
    res.json({ ok: true, paginas: mime, texto: (r.data.content || []).map(b => b.text || "").join("") });
  } catch (e) { res.json({ ok: false, error: e.response?.data?.error?.message || e.message }); }
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
