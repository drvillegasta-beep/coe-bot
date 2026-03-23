/**
 * COE Bot — Constructor de Mensajes WhatsApp v3
 */

const { AREAS, BIENVENIDA_IMAGEN, BIENVENIDA_TEXTO } = require("../config/areas");

// ── 1. Bienvenida ─────────────────────────────────────────────────────────
function buildWelcome() {
  const rows = Object.values(AREAS).map((a) => ({
    id: a.id, title: `${a.emoji} ${a.nombre}`, description: a.descripcion,
  }));
  return [
    {
      type: "image",
      image: { link: BIENVENIDA_IMAGEN, caption: BIENVENIDA_TEXTO },
    },
    {
      type: "interactive",
      interactive: {
        type: "list",
        header:  { type: "text", text: "🏥 ¿Con qué área deseas hablar?" },
        body:    { text: "Elige una opción y te conectamos de inmediato." },
        footer:  { text: "COE · Centro Ocular Especializado" },
        action:  { button: "Ver opciones", sections: [{ title: "Áreas del COE", rows }] },
      },
    },
  ];
}

// ── 2. Menú FAQs de área ──────────────────────────────────────────────────
function buildFaqMenu(areaId) {
  const area = AREAS[areaId];
  if (!area || area.derivacionDirecta) return [];
  const faqs = area.faqs || [];
  const msgs = [];

  // Mensaje 1: imagen + FAQs 1-3
  msgs.push({
    type: "interactive",
    interactive: {
      type: "button",
      header: { type: "image", image: { link: area.imagen } },
      body:   { text: `${area.emoji} *${area.nombre}*\n\nPreguntas frecuentes — toca la que necesites 👇` },
      footer: { text: "COE · Centro Ocular Especializado" },
      action: {
        buttons: faqs.slice(0, 3).map((f) => ({
          type: "reply", reply: { id: f.id, title: f.pregunta.substring(0, 20) },
        })),
      },
    },
  });

  // Mensaje 2: FAQs 4-5 + asesor
  const extra = faqs.slice(3, 5).map((f) => ({
    type: "reply", reply: { id: f.id, title: f.pregunta.substring(0, 20) },
  }));
  msgs.push({
    type: "interactive",
    interactive: {
      type: "button",
      body:   { text: "¿Tu duda no está aquí? Habla con un asesor 👇" },
      footer: { text: "COE · Centro Ocular Especializado" },
      action: {
        buttons: [
          ...extra,
          { type: "reply", reply: { id: `asesor_${areaId}`, title: "💬 Hablar con asesor" } },
        ],
      },
    },
  });
  return msgs;
}

// ── 3. Respuesta a FAQ ────────────────────────────────────────────────────
function buildFaqAnswer(areaId, faqId) {
  const area = AREAS[areaId];
  if (!area) return [];
  const faq = area.faqs?.find((f) => f.id === faqId);
  if (!faq) return [];

  // FAQ con botón de "Agendar cita de valoración"
  if (faq.botonCita) {
    return [{
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: `*${faq.pregunta}*\n\n${faq.respuesta}` },
        footer: { text: "COE · Centro Ocular Especializado" },
        action: {
          buttons: [
            { type: "reply", reply: { id: "start_intake_cita", title: "📅 Agendar valoración" } },
            { type: "reply", reply: { id: `asesor_${areaId}`, title: "💬 Hablar con asesor" } },
          ],
        },
      },
    }];
  }

  return [{
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: `*${faq.pregunta}*\n\n${faq.respuesta}` },
      footer: { text: "COE · Centro Ocular Especializado" },
      action: {
        buttons: [
          { type: "reply", reply: { id: `asesor_${areaId}`, title: "💬 Hablar con asesor" } },
          { type: "reply", reply: { id: `menu_${areaId}`, title: "↩ Ver más preguntas" } },
        ],
      },
    },
  }];
}

// ── 4. Intake de cita — preguntas paso a paso ─────────────────────────────
const INTAKE_STEPS = [
  { key: "nombre",   pregunta: "¿Cuál es tu *nombre completo*?" },
  { key: "tel1",     pregunta: "¿Cuál es tu *número de teléfono principal*?" },
  { key: "tel2",     pregunta: "¿Tienes un *segundo número de contacto*?\n(Si no, responde \"No\")" },
  { key: "domicilio",pregunta: "¿Cuál es tu *domicilio* (calle, colonia, ciudad)?" },
  { key: "motivo",   pregunta: "Por último, ¿cuál es el *motivo de tu consulta*? Descríbelo brevemente." },
];

function buildIntakeQuestion(stepKey) {
  const step = INTAKE_STEPS.find((s) => s.key === stepKey);
  if (!step) return [];
  return [{ type: "text", text: { body: step.pregunta } }];
}

function buildIntakeConfirmation(data) {
  const resumen =
    `✅ *Solicitud de cita registrada*\n\n` +
    `📋 Nombre: ${data.nombre}\n` +
    `📱 Tel 1: ${data.tel1}\n` +
    `📱 Tel 2: ${data.tel2 || "—"}\n` +
    `🏠 Domicilio: ${data.domicilio}\n` +
    `💬 Motivo: ${data.motivo}\n\n` +
    `Nuestro equipo se comunicará contigo a la brevedad para confirmar tu cita. ¡Gracias! 🏥`;
  return [{ type: "text", text: { body: resumen } }];
}

// ── 5. Intake de cirugía — solo nombre ───────────────────────────────────
function buildIntakeCirugiaQuestion() {
  return [{
    type: "text",
    text: { body: "Para programar tu cirugía, por favor indícanos tu *nombre completo* 👇" },
  }];
}

function buildIntakeCirugiaConfirmation(nombre, areaId) {
  return [{
    type: "text",
    text: {
      body:
        `✅ Gracias, *${nombre}*.\n\n` +
        `Uno de nuestros asesores de Cirugía se pondrá en contacto contigo para coordinar ` +
        `tu valoración preoperatoria y los siguientes pasos.\n\n` +
        `¡Nos vemos pronto en el COE! 🏥`,
    },
  }];
}

// ── 6. Transferencia al asesor ────────────────────────────────────────────
function buildTransferMessage(areaId) {
  const area = AREAS[areaId];
  if (!area) return [];
  return [{
    type: "text",
    text: {
      body:
        `✅ Le vamos a conectar con *${area.agente}* (${area.emoji} ${area.nombre}).\n\n` +
        `Un asesor le contactará en breve. Si prefiere escribirles directamente:\n` +
        `👉 https://wa.me/${area.whatsapp}\n\n¡Que tenga excelente día! 🏥`,
    },
  }];
}

// ── 7. Notificación interna ───────────────────────────────────────────────
function buildAreaNotification(areaId, patientNumber, patientMessage) {
  const area = AREAS[areaId];
  if (!area) return null;
  return {
    waNumber: area.whatsapp,
    message:
      `🔔 *Nuevo paciente derivado — ${area.emoji} ${area.nombre}*\n\n` +
      `📱 Número: +${patientNumber}\n` +
      `💬 Mensaje: _"${patientMessage}"_\n\n` +
      `Por favor contáctenle a la brevedad. ✅`,
  };
}

module.exports = {
  buildWelcome,
  buildFaqMenu,
  buildFaqAnswer,
  buildIntakeQuestion,
  buildIntakeConfirmation,
  buildIntakeCirugiaQuestion,
  buildIntakeCirugiaConfirmation,
  buildTransferMessage,
  buildAreaNotification,
  INTAKE_STEPS,
};
