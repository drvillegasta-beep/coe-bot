/**
 * COE Bot — Handler WhatsApp v4
 * Nuevas funcionalidades:
 * - Menú de servicios informativos
 * - Detección y alerta de urgencias
 * - Botón de reagendar cita
 * - Botón de menú principal desde cualquier punto
 */

const axios = require("axios");
const { AREAS, SERVICIOS, esUrgencia, NUM_URGENCIAS } = require("../config/areas");
const {
  buildWelcome, buildServiciosMenu, buildServicioDetalle,
  buildFaqMenu, buildFaqAnswer, buildUrgenciaMessage,
  buildIntakeQuestion, buildIntakeConfirmation,
  buildIntakeCirugiaQuestion, buildIntakeCirugiaConfirmation,
  buildTransferMessage, buildAreaNotification, buildUrgenciaNotification,
  INTAKE_STEPS,
} = require("../services/messages");
const {
  getSession, updateSession, startUnreadTimer, cancelUnreadTimer,
} = require("../services/session");
const { estaAbierto, mensajeFueraDeHorario } = require("../services/horario");

const WA_TOKEN    = process.env.WHATSAPP_TOKEN;
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const BASE_URL    = `https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`;
const HEADERS     = { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" };
const delay       = (ms) => new Promise((r) => setTimeout(r, ms));

async function sendMsg(to, payload) {
  try {
    await axios.post(BASE_URL, { messaging_product: "whatsapp", to, ...payload }, { headers: HEADERS });
  } catch (err) {
    console.error("❌ sendMsg:", JSON.stringify(err.response?.data || err.message));
  }
}

async function sendAll(to, payloads) {
  for (const p of payloads) { await sendMsg(to, p); await delay(400); }
}

async function markRead(msgId) {
  try {
    await axios.post(BASE_URL, { messaging_product: "whatsapp", status: "read", message_id: msgId }, { headers: HEADERS });
  } catch (_) {}
}

async function markAsUnread(phone) {
  await sendMsg(process.env.WA_ALERT_NUMBER || phone, {
    type: "text",
    text: { body: `⚠️ *COE — Atención* Paciente +${phone} lleva más de 5 min sin respuesta. Por favor retomen la conversación. 🙏` },
  });
}

async function notifyArea(areaId, patientNum, msg) {
  const n = buildAreaNotification(areaId, patientNum, msg);
  if (n) await sendMsg(n.waNumber, { type: "text", text: { body: n.message } });
}

async function notifyUrgencia(patientNum, mensaje) {
  const n = buildUrgenciaNotification(patientNum, mensaje);
  await sendMsg(NUM_URGENCIAS, { type: "text", text: { body: n.message } });
  console.log(`🚨 Urgencia notificada al número general: ${patientNum}`);
}

// ── Intake de cita paso a paso ────────────────────────────────────────────
async function handleIntakeCita(from, textBody) {
  const session   = getSession(from);
  const data      = session.intakeCita || {};
  const step      = session.intakeStep;
  if (step) data[step] = textBody;
  const steps     = INTAKE_STEPS.map((s) => s.key);
  const stepIdx   = step ? steps.indexOf(step) : -1;
  const nextStep  = steps[stepIdx + 1];

  if (nextStep) {
    updateSession(from, { intakeCita: data, intakeStep: nextStep });
    await sendAll(from, buildIntakeQuestion(nextStep));
  } else {
    updateSession(from, { intakeCita: data, intakeStep: null, stage: "transferred" });
    await sendAll(from, buildIntakeConfirmation(data));
    const resumen = `SOLICITUD DE CITA\nNombre: ${data.nombre}\nTel 1: ${data.tel1}\nTel 2: ${data.tel2||"—"}\nDomicilio: ${data.domicilio}\nMotivo: ${data.motivo}`;
    await notifyArea("consultas", from, resumen);
  }
}

// ── Router principal ──────────────────────────────────────────────────────
async function routeMessage(from, interactionId, textBody) {
  const session = getSession(from);

  // ── Reagendar cita ────────────────────────────────────────────────────
  if (interactionId === "reagendar") {
    updateSession(from, { stage: "intake_cita", areaId: "consultas", intakeCita: {}, intakeStep: INTAKE_STEPS[0].key });
    await sendAll(from, [
      { type: "text", text: { body: "Con gusto le ayudamos a reagendar su cita 🔄\n\nVoy a necesitar sus datos nuevamente:" } },
      ...buildIntakeQuestion(INTAKE_STEPS[0].key),
    ]);
    return;
  }

  // ── Menú principal desde cualquier punto ──────────────────────────────
  if (interactionId === "menu_inicio") {
    updateSession(from, { stage: "menu" });
    await sendAll(from, buildWelcome());
    return;
  }

  // ── Urgencia detectada ────────────────────────────────────────────────
  if (interactionId === "asesor_urgencia") {
    await sendAll(from, buildTransferMessage("consultas"));
    await notifyUrgencia(from, session.lastMessage || "Urgencia reportada");
    updateSession(from, { stage: "transferred" });
    return;
  }

  // ── Intake de CITA en progreso ────────────────────────────────────────
  if (session.stage === "intake_cita") {
    await handleIntakeCita(from, textBody);
    return;
  }

  // ── Intake de CIRUGÍA en progreso ─────────────────────────────────────
  if (session.stage === "intake_cirugia") {
    updateSession(from, { stage: "transferred" });
    await sendAll(from, buildIntakeCirugiaConfirmation(textBody?.trim()));
    await notifyArea("cirugia", from, `Solicitud de cirugía — Paciente: ${textBody?.trim()}`);
    return;
  }

  // ── Verificar horario ─────────────────────────────────────────────────
  if (!estaAbierto() && session.stage === "idle") {
    await sendMsg(from, { type: "text", text: { body: mensajeFueraDeHorario(null) } });
    await delay(500);
    await sendAll(from, buildWelcome());
    updateSession(from, { stage: "menu" });
    return;
  }

  // ── Detección de URGENCIA en texto libre ──────────────────────────────
  if (textBody && esUrgencia(textBody) && session.stage !== "transferred") {
    console.log(`🚨 Urgencia detectada de ${from}: "${textBody}"`);
    updateSession(from, { lastMessage: textBody });
    await sendAll(from, buildUrgenciaMessage());
    await notifyUrgencia(from, textBody);
    return;
  }

  // ── Menú de servicios ─────────────────────────────────────────────────
  if (interactionId === "servicios") {
    await sendAll(from, buildServiciosMenu());
    updateSession(from, { stage: "servicios" });
    return;
  }

  // ── Detalle de un servicio ────────────────────────────────────────────
  if (interactionId?.startsWith("srv_")) {
    const srvId = interactionId.replace("srv_", "");
    if (SERVICIOS[srvId]) {
      await sendAll(from, buildServicioDetalle(srvId));
      return;
    }
  }

  // ── Iniciar intake de CITA ────────────────────────────────────────────
  if (interactionId === "consultas" || interactionId === "start_intake_cita") {
    updateSession(from, { stage: "intake_cita", areaId: "consultas", intakeCita: {}, intakeStep: INTAKE_STEPS[0].key });
    await sendAll(from, [
      { type: "text", text: { body: "Con gusto le ayudamos a agendar su cita 📅\n\nVoy a necesitar algunos datos:" } },
      ...buildIntakeQuestion(INTAKE_STEPS[0].key),
    ]);
    return;
  }

  // ── FAQ especial: programar cirugía ──────────────────────────────────
  if (interactionId === "cir_1") {
    updateSession(from, { stage: "intake_cirugia", areaId: "cirugia" });
    await sendAll(from, buildIntakeCirugiaQuestion());
    return;
  }

  // ── Área del menú principal ───────────────────────────────────────────
  if (AREAS[interactionId]) {
    const area = AREAS[interactionId];
    updateSession(from, { areaId: interactionId, lastMessage: textBody || area.nombre });
    if (area.flujoEspecial === "intake_cita") {
      updateSession(from, { stage: "intake_cita", intakeCita: {}, intakeStep: INTAKE_STEPS[0].key });
      await sendAll(from, [
        { type: "text", text: { body: "Con gusto le ayudamos a agendar su cita 📅\n\nVoy a necesitar algunos datos:" } },
        ...buildIntakeQuestion(INTAKE_STEPS[0].key),
      ]);
    } else {
      updateSession(from, { stage: `faq_${interactionId}` });
      await sendAll(from, buildFaqMenu(interactionId));
    }
    return;
  }

  // ── FAQ seleccionada ──────────────────────────────────────────────────
  const faqArea = Object.values(AREAS).find((a) => a.faqs?.some((f) => f.id === interactionId));
  if (faqArea) {
    await sendAll(from, buildFaqAnswer(faqArea.id, interactionId));
    return;
  }

  // ── Hablar con asesor ─────────────────────────────────────────────────
  if (interactionId?.startsWith("asesor_")) {
    const areaId = interactionId.replace("asesor_", "");
    await sendAll(from, buildTransferMessage(areaId));
    await notifyArea(areaId, from, session.lastMessage || "Consulta general");
    updateSession(from, { stage: "transferred" });
    return;
  }

  // ── Ver más preguntas ─────────────────────────────────────────────────
  if (interactionId?.startsWith("menu_")) {
    const areaId = interactionId.replace("menu_", "");
    if (AREAS[areaId]) { await sendAll(from, buildFaqMenu(areaId)); return; }
  }

  // ── Texto libre / primer mensaje ──────────────────────────────────────
  if (!estaAbierto()) {
    await sendMsg(from, { type: "text", text: { body: mensajeFueraDeHorario(null) } });
    await delay(600);
  }
  await sendAll(from, buildWelcome());
  updateSession(from, { stage: "menu", lastMessage: textBody });
}

// ── Entry point ───────────────────────────────────────────────────────────
async function whatsappHandler(body) {
  const value    = body.entry?.[0]?.changes?.[0]?.value;
  if (value?.statuses) return;
  const messages = value?.messages;
  if (!messages?.length) return;

  for (const message of messages) {
    const from  = message.from;
    const msgId = message.id;

    cancelUnreadTimer(from);
    await markRead(msgId);

    let interactionId = null;
    let textBody      = null;

    if (message.type === "interactive") {
      const ia = message.interactive;
      if (ia.type === "button_reply") { interactionId = ia.button_reply.id;  textBody = ia.button_reply.title; }
      else if (ia.type === "list_reply") { interactionId = ia.list_reply.id; textBody = ia.list_reply.title; }
    } else if (message.type === "text") {
      textBody = message.text.body;
      const sess = getSession(from);
      if (!["intake_cita","intake_cirugia"].includes(sess.stage)) {
        const lower = textBody.toLowerCase();
        interactionId = Object.keys(AREAS).find((k) =>
          lower.includes(AREAS[k].nombre.toLowerCase().split(" ")[0].toLowerCase())
        ) || null;
      }
    } else {
      await sendMsg(from, { type: "text", text: { body: "Hola 👋 Solo proceso texto y botones. ¿En qué le puedo ayudar?" } });
      continue;
    }

    console.log(`📩 WA ${from} | id:${interactionId||"–"} | txt:"${textBody}"`);
    await routeMessage(from, interactionId || textBody, textBody);
    startUnreadTimer(from, () => markAsUnread(from));
  }
}

module.exports = whatsappHandler;
