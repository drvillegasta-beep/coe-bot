/**
 * COE Bot — Mensajes v6
 * Flujo: imagen bienvenida → menú áreas → FAQs
 */
const { AREAS, SERVICIOS, BIENVENIDA_TEXTO } = require("../config/areas");

// ── IMÁGENES ──────────────────────────────────────────────────────────────
// Reemplaza las URLs por fotos reales del COE cuando las tengas.
// Para cambiarlas sin editar código, agrégalas como variables en Railway.
// Requisitos WhatsApp: HTTPS · JPG/PNG · máx 5MB · mín 500px ancho
const IMAGENES = {
  bienvenida: process.env.IMG_BIENVENIDA || "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=900&q=80",
  consultas:  process.env.IMG_CONSULTAS  || "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80",
  cirugia:    process.env.IMG_CIRUGIA    || "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&q=80",
  optica:     process.env.IMG_OPTICA     || "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=80",
  farmacia:   process.env.IMG_FARMACIA   || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80",
  caja:       process.env.IMG_CAJA       || "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
  quejas:     process.env.IMG_QUEJAS     || "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
};

// ── 1. Bienvenida: imagen + menú de áreas ────────────────────────────────
function buildWelcome() {
  const rows = Object.values(AREAS).map(a => ({
    id: a.id, title: `${a.emoji} ${a.nombre}`, description: a.descripcion,
  }));
  rows.push({ id: "servicios", title: "ℹ️ Nuestros Servicios", description: "Especialidades y estudios diagnósticos" });

  return [
    {
      type: "image",
      image: {
        link: IMAGENES.bienvenida,
        caption: BIENVENIDA_TEXTO,
      },
    },
    {
      type: "interactive",
      interactive: {
        type: "list",
        header:  { type: "text", text: "👁️ ¿En qué podemos ayudarte?" },
        body:    { text: "Selecciona el área que necesitas y te conectamos de inmediato." },
        footer:  { text: "COE · Centro Ocular Especializado · Tacámbaro, Mich." },
        action:  { button: "Ver áreas", sections: [{ title: "Áreas del COE", rows }] },
      },
    },
  ];
}


// ── 2. Menú FAQs de área ──────────────────────────────────────────────────
function buildFaqMenu(areaId) {
  const area = AREAS[areaId];
  if (!area || area.flujoEspecial) return [];
  const faqs = area.faqs || [];
  const msgs = [];

  msgs.push({
    type: "interactive",
    interactive: {
      type: "button",
      header: { type: "image", image: { link: area.imagen } },
      body:   { text: `${area.emoji} *${area.nombre}*\n\nEstas son las preguntas más frecuentes. Selecciona la que necesites 👇` },
      footer: { text: "COE · Centro Ocular Especializado" },
      action: {
        buttons: faqs.slice(0,3).map(f => ({
          type: "reply", reply: { id: f.id, title: f.pregunta.substring(0,20) },
        })),
      },
    },
  });

  const extra = faqs.slice(3,5).map(f => ({
    type: "reply", reply: { id: f.id, title: f.pregunta.substring(0,20) },
  }));
  msgs.push({
    type: "interactive",
    interactive: {
      type: "button",
      body:   { text: "¿No encontraste lo que buscas?" },
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
  const faq = area.faqs?.find(f => f.id === faqId);
  if (!faq) return [];

  const buttons = faq.botonCita
    ? [
        { type:"reply", reply:{ id:"start_intake_cita", title:"📅 Agendar valoración" } },
        { type:"reply", reply:{ id:`asesor_${areaId}`,  title:"💬 Hablar con asesor" } },
      ]
    : [
        { type:"reply", reply:{ id:`asesor_${areaId}`,  title:"💬 Hablar con asesor" } },
        { type:"reply", reply:{ id:`menu_${areaId}`,    title:"↩ Ver más preguntas" } },
      ];

  return [{
    type: "interactive",
    interactive: {
      type: "button",
      body:   { text: `*${faq.pregunta}*\n\n${faq.respuesta}` },
      footer: { text: "COE · Centro Ocular Especializado" },
      action: { buttons },
    },
  }];
}

// ── 4. Menú de servicios ──────────────────────────────────────────────────
function buildServiciosMenu() {
  return [{
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "ℹ️ Servicios del COE" },
      body:   { text: "Selecciona una especialidad para conocer más." },
      footer: { text: "COE · Centro Ocular Especializado" },
      action: {
        button: "Ver especialidades",
        sections: [{
          title: "Especialidades",
          rows: Object.entries(SERVICIOS).map(([id,s]) => ({
            id: `srv_${id}`, title: `${s.emoji} ${s.nombre}`, description: s.descripcion.substring(0,60),
          })),
        }],
      },
    },
  }];
}

// ── 5. Detalle de servicio ────────────────────────────────────────────────
function buildServicioDetalle(srvId) {
  const srv = SERVICIOS[srvId];
  if (!srv) return [];
  return [{
    type: "interactive",
    interactive: {
      type: "button",
      body:   { text: `${srv.emoji} *${srv.nombre}*\n\n${srv.descripcion}` },
      footer: { text: "COE · Centro Ocular Especializado" },
      action: {
        buttons: [
          { type:"reply", reply:{ id:"consultas",  title:"📅 Agendar cita" } },
          { type:"reply", reply:{ id:"servicios",  title:"↩ Ver más" } },
        ],
      },
    },
  }];
}

// ── 6. Urgencia ───────────────────────────────────────────────────────────
function buildUrgenciaMessage() {
  return [{
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text:
          "🚨 *Hemos detectado una posible urgencia oftalmológica*\n\n" +
          "Por favor *preséntate sin cita previa* al COE y te atendemos de inmediato.\n\n" +
          "📍 Centro Ocular Especializado · Tacámbaro, Michoacán\n\n" +
          "Si no puedes trasladarte, un asesor te contactará a la brevedad.",
      },
      footer: { text: "COE · Atención de Urgencias" },
      action: {
        buttons: [
          { type:"reply", reply:{ id:"asesor_urgencia", title:"📞 Hablar ahora" } },
          { type:"reply", reply:{ id:"menu_inicio",     title:"🏠 Menú principal" } },
        ],
      },
    },
  }];
}

// ── 7. Intake cita ────────────────────────────────────────────────────────
const INTAKE_STEPS = [
  { key:"nombre",    pregunta:"¿Cuál es tu *nombre completo*?" },
  { key:"tel1",      pregunta:"¿Cuál es tu *número de teléfono principal*?" },
  { key:"tel2",      pregunta:"¿Tienes un *segundo número de contacto*?\n(Si no, responde \"No\")" },
  { key:"domicilio", pregunta:"¿Cuál es tu *domicilio* (calle, colonia, ciudad)?" },
  { key:"motivo",    pregunta:"¿Cuál es el *motivo de tu consulta*? Descríbelo brevemente." },
];

function buildIntakeQuestion(stepKey) {
  const step = INTAKE_STEPS.find(s => s.key === stepKey);
  if (!step) return [];
  return [{ type:"text", text:{ body: step.pregunta } }];
}

function buildIntakeConfirmation(data) {
  return [{
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text:
          `✅ *Solicitud de cita registrada*\n\n` +
          `📋 Nombre: ${data.nombre}\n📱 Tel 1: ${data.tel1}\n📱 Tel 2: ${data.tel2||"—"}\n` +
          `🏠 Domicilio: ${data.domicilio}\n💬 Motivo: ${data.motivo}\n\n` +
          `Nuestro equipo te contactará a la brevedad para confirmar. ¡Gracias! 🏥`,
      },
      footer: { text: "COE · Centro Ocular Especializado" },
      action: {
        buttons: [
          { type:"reply", reply:{ id:"reagendar",   title:"🔄 Reagendar cita" } },
          { type:"reply", reply:{ id:"menu_inicio",  title:"🏠 Menú principal" } },
        ],
      },
    },
  }];
}

function buildIntakeCirugiaQuestion() {
  return [{ type:"text", text:{ body:"Para programar tu cirugía, indícanos tu *nombre completo* 👇" } }];
}

function buildIntakeCirugiaConfirmation(nombre) {
  return [{
    type: "interactive",
    interactive: {
      type: "button",
      body: { text:`✅ Gracias, *${nombre}*.\n\nUn asesor de Cirugía te contactará para coordinar tu valoración preoperatoria. ¡Nos vemos pronto en el COE! 🏥` },
      footer: { text: "COE · Centro Ocular Especializado" },
      action: { buttons: [{ type:"reply", reply:{ id:"menu_inicio", title:"🏠 Menú principal" } }] },
    },
  }];
}

// ── 8. Transferencia ──────────────────────────────────────────────────────
function buildTransferMessage(areaId) {
  const area = AREAS[areaId];
  if (!area) return [];
  return [{
    type: "text",
    text: {
      body:
        `✅ Le conectamos con *${area.agente}* (${area.emoji} ${area.nombre}).\n\n` +
        `Un asesor le contactará en breve. También puede escribirles directamente:\n` +
        `👉 https://wa.me/${area.whatsapp}\n\n¡Que tenga excelente día! 🏥`,
    },
  }];
}

// ── 9. Notificaciones ─────────────────────────────────────────────────────
function buildAreaNotification(areaId, patientNumber, patientMessage) {
  const area = AREAS[areaId];
  if (!area) return null;
  return {
    waNumber: area.whatsapp,
    message:
      `🔔 *Nuevo paciente — ${area.emoji} ${area.nombre}*\n\n` +
      `📱 Número: +${patientNumber}\n💬 Mensaje: _"${patientMessage}"_\n\n` +
      `Por favor contáctenle a la brevedad. ✅`,
  };
}

function buildUrgenciaNotification(patientNumber, mensaje) {
  return {
    message:
      `🚨 *URGENCIA OFTALMOLÓGICA — COE Bot*\n\n` +
      `📱 Paciente: +${patientNumber}\n💬 Mensaje: _"${mensaje}"_\n\n` +
      `⚡ Contactar de inmediato.`,
  };
}

module.exports = {
  buildWelcome, buildFaqMenu, buildFaqAnswer,
  buildServiciosMenu, buildServicioDetalle,
  buildUrgenciaMessage, buildIntakeQuestion, buildIntakeConfirmation,
  buildIntakeCirugiaQuestion, buildIntakeCirugiaConfirmation,
  buildTransferMessage, buildAreaNotification, buildUrgenciaNotification,
  INTAKE_STEPS,
};

// ── Intake CITA simplificado (3 campos) ───────────────────────────────────
const INTAKE_CITA_SIMPLE = [
  { key:"nombre",  pregunta:"¿Cuál es tu *nombre completo*?" },
  { key:"telefono",pregunta:"¿Cuál es tu *número de teléfono*?" },
  { key:"motivo",  pregunta:"¿Cuál es el *motivo de tu consulta*?" },
];

function buildIntakeCitaSimple(stepKey) {
  const step = INTAKE_CITA_SIMPLE.find(s => s.key === stepKey);
  if (!step) return [];
  return [{ type:"text", text:{ body: step.pregunta } }];
}

function buildIntakeCitaSimpleConfirm(data) {
  return [{
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text:
          `✅ *Solicitud de cita registrada*\n\n` +
          `📋 Nombre: ${data.nombre}\n` +
          `📱 Teléfono: ${data.telefono}\n` +
          `💬 Motivo: ${data.motivo}\n\n` +
          `Nuestro equipo te contactará a la brevedad. ¡Gracias! 🏥`,
      },
      footer: { text: "COE · Centro Ocular Especializado" },
      action: {
        buttons: [
          { type:"reply", reply:{ id:"reagendar",  title:"🔄 Reagendar cita" } },
          { type:"reply", reply:{ id:"menu_inicio", title:"🏠 Menú principal" } },
        ],
      },
    },
  }];
}

// ── Intake CIRUGÍA (nombre + teléfono + foto cotización) ──────────────────
const INTAKE_CIRUGIA_STEPS = [
  { key:"nombre",   pregunta:"Para programar tu cirugía necesitamos algunos datos.\n\n¿Cuál es tu *nombre completo*?" },
  { key:"telefono", pregunta:"¿Cuál es tu *número de teléfono*?" },
  { key:"foto",     pregunta:"Por último, envíanos la *foto de tu cotización* o el documento de tu valoración preoperatoria.\n\n_(Si aún no la tienes, escribe \"Pendiente\" y te orientamos sobre los siguientes pasos.)_" },
];

function buildIntakeCirugiaStep(stepKey) {
  const step = INTAKE_CIRUGIA_STEPS.find(s => s.key === stepKey);
  if (!step) return [];
  return [{ type:"text", text:{ body: step.pregunta } }];
}

function buildIntakeCirugiaComplete(data) {
  return [{
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text:
          `✅ *Solicitud de cirugía registrada*\n\n` +
          `📋 Nombre: ${data.nombre}\n` +
          `📱 Teléfono: ${data.telefono}\n` +
          `📄 Cotización: ${data.foto === "Pendiente" ? "Pendiente de enviar" : "Recibida ✅"}\n\n` +
          `Un asesor de Cirugía se pondrá en contacto contigo a la brevedad para coordinar los siguientes pasos. ¡Nos vemos en el COE! 🏥`,
      },
      footer: { text: "COE · Centro Ocular Especializado" },
      action: {
        buttons: [
          { type:"reply", reply:{ id:"menu_inicio", title:"🏠 Menú principal" } },
        ],
      },
    },
  }];
}

// ── Intake QUEJA / SUGERENCIA ─────────────────────────────────────────────
const INTAKE_QUEJA_STEPS = [
  { key:"tipo",    pregunta:"¿Es una *queja*, *sugerencia* o *felicitación*?\n\n(Escribe la que corresponda)" },
  { key:"nombre",  pregunta:"¿Cuál es tu *nombre completo*?" },
  { key:"mensaje", pregunta:"Por favor escribe tu *mensaje con todos los detalles* que consideres importantes:" },
];

function buildIntakeQuejaStep(stepKey) {
  const step = INTAKE_QUEJA_STEPS.find(s => s.key === stepKey);
  if (!step) return [];
  return [{ type:"text", text:{ body: step.pregunta } }];
}

function buildIntakeQuejaConfirm(data) {
  const emoji = data.tipo?.toLowerCase().includes("felicitación") || data.tipo?.toLowerCase().includes("felicitacion") ? "🌟" :
                data.tipo?.toLowerCase().includes("sugerencia") ? "💡" : "📋";
  return [{
    type: "text",
    text: {
      body:
        `${emoji} *${data.tipo} registrada*\n\n` +
        `Gracias, *${data.nombre}*, por tomarte el tiempo de compartir tu experiencia con nosotros.\n\n` +
        `Tu mensaje ha sido enviado a la Administración del COE y lo atenderemos con la importancia que merece.\n\n` +
        `¡Gracias por ayudarnos a mejorar! 🏥`,
    },
  }];
}

module.exports.INTAKE_CITA_SIMPLE    = INTAKE_CITA_SIMPLE;
module.exports.INTAKE_CIRUGIA_STEPS  = INTAKE_CIRUGIA_STEPS;
module.exports.INTAKE_QUEJA_STEPS    = INTAKE_QUEJA_STEPS;
module.exports.buildIntakeCitaSimple          = buildIntakeCitaSimple;
module.exports.buildIntakeCitaSimpleConfirm   = buildIntakeCitaSimpleConfirm;
module.exports.buildIntakeCirugiaStep         = buildIntakeCirugiaStep;
module.exports.buildIntakeCirugiaComplete     = buildIntakeCirugiaComplete;
module.exports.buildIntakeQuejaStep           = buildIntakeQuejaStep;
module.exports.buildIntakeQuejaConfirm        = buildIntakeQuejaConfirm;
