/**
 * COE Bot — Mensajes v7
 * Tono profesional · Sin emojis · Lenguaje simple · Usted
 */
const { AREAS, SERVICIOS, BIENVENIDA_TEXTO } = require("../config/areas");

const IMAGENES = {
  bienvenida: process.env.IMG_BIENVENIDA || "https://i.ibb.co/Zz6LSv0f/bienvenida.jpg",
  consultas:  process.env.IMG_CONSULTAS  || "https://i.ibb.co/KjVnWpgQ/consultas.jpg",
  cirugia:    process.env.IMG_CIRUGIA    || "https://i.ibb.co/1fDhpR81/cirugia.jpg",
  optica:     process.env.IMG_OPTICA     || "https://i.ibb.co/Lzj1gqnN/optica.jpg",
  farmacia:   process.env.IMG_FARMACIA   || "https://i.ibb.co/rRzD3MQs/farmacia.jpg",
};

// ── 1. Bienvenida ─────────────────────────────────────────────────────────
function buildWelcome() {
  const rows = Object.values(AREAS).map(a => ({
    id: a.id, title: a.nombre, description: a.descripcion,
  }));
  rows.push({ id: "servicios", title: "Nuestros servicios", description: "Especialidades y estudios disponibles" });

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
        header:  { type: "text", text: "¿En que podemos ayudarle?" },
        body:    { text: "Seleccione el area que necesita y le atendemos de inmediato." },
        footer:  { text: "Centro Ocular Especializado · Tacambaro, Michoacan" },
        action:  { button: "Ver opciones", sections: [{ title: "Areas de atencion", rows }] },
      },
    },
  ];
}

// ── 2. Menu FAQs ──────────────────────────────────────────────────────────
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
      body:   { text: `${area.nombre}\n\nSeleccione su pregunta:` },
      footer: { text: "Centro Ocular Especializado" },
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

  if (extra.length > 0 || true) {
    msgs.push({
      type: "interactive",
      interactive: {
        type: "button",
        body:   { text: "¿No encontro lo que busca?" },
        footer: { text: "Centro Ocular Especializado" },
        action: {
          buttons: [
            ...extra,
            { type: "reply", reply: { id: `asesor_${areaId}`, title: "Hablar con un asesor" } },
          ],
        },
      },
    });
  }
  return msgs;
}

// ── 3. Respuesta FAQ ──────────────────────────────────────────────────────
function buildFaqAnswer(areaId, faqId) {
  const area = AREAS[areaId];
  if (!area) return [];
  const faq = area.faqs?.find(f => f.id === faqId);
  if (!faq) return [];

  const buttons = faq.botonCita
    ? [
        { type:"reply", reply:{ id:"start_intake_cita", title:"Agendar valoracion" } },
        { type:"reply", reply:{ id:`asesor_${areaId}`,  title:"Hablar con un asesor" } },
      ]
    : [
        { type:"reply", reply:{ id:`asesor_${areaId}`,  title:"Hablar con un asesor" } },
        { type:"reply", reply:{ id:`menu_${areaId}`,    title:"Ver mas preguntas" } },
      ];

  return [{
    type: "interactive",
    interactive: {
      type: "button",
      body:   { text: `${faq.pregunta}\n\n${faq.respuesta}` },
      footer: { text: "Centro Ocular Especializado" },
      action: { buttons },
    },
  }];
}

// ── 4. Servicios ──────────────────────────────────────────────────────────
function buildServiciosMenu() {
  return [{
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "Nuestros servicios" },
      body:   { text: "Seleccione una especialidad para conocer mas." },
      footer: { text: "Centro Ocular Especializado" },
      action: {
        button: "Ver especialidades",
        sections: [{
          title: "Especialidades",
          rows: Object.entries(SERVICIOS).map(([id,s]) => ({
            id: `srv_${id}`, title: s.nombre, description: s.descripcion.substring(0,60),
          })),
        }],
      },
    },
  }];
}

// ── 5. Detalle servicio ───────────────────────────────────────────────────
function buildServicioDetalle(srvId) {
  const srv = SERVICIOS[srvId];
  if (!srv) return [];
  return [{
    type: "interactive",
    interactive: {
      type: "button",
      body:   { text: `${srv.nombre}\n\n${srv.descripcion}` },
      footer: { text: "Centro Ocular Especializado" },
      action: {
        buttons: [
          { type:"reply", reply:{ id:"consultas", title:"Agendar una cita" } },
          { type:"reply", reply:{ id:"servicios", title:"Ver mas servicios" } },
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
          "Hemos identificado que puede tener una urgencia oftalmologica.\n\n" +
          "Le recomendamos presentarse sin cita previa al COE y le atendemos de inmediato.\n\n" +
          "Centro Ocular Especializado\n" +
          "Luis Donaldo Colosio 160, Jardines de la Purisima\n" +
          "Tacambaro, Michoacan\n\n" +
          "Si no puede trasladarse, un asesor le contactara a la brevedad.",
      },
      footer: { text: "Centro Ocular Especializado · Urgencias" },
      action: {
        buttons: [
          { type:"reply", reply:{ id:"asesor_urgencia", title:"Hablar con un asesor" } },
          { type:"reply", reply:{ id:"menu_inicio",     title:"Volver al inicio" } },
        ],
      },
    },
  }];
}

// ── 7. Intake cita ────────────────────────────────────────────────────────
const INTAKE_STEPS = [
  { key:"nombre",    pregunta:"Por favor escriba su nombre completo:" },
  { key:"tel1",      pregunta:"¿Cual es su numero de telefono principal?" },
  { key:"tel2",      pregunta:"¿Tiene un segundo numero de contacto?\n(Si no tiene, escriba No)" },
  { key:"domicilio", pregunta:"¿Cual es su domicilio? (calle, colonia y ciudad)" },
  { key:"motivo",    pregunta:"¿Cual es el motivo de su consulta? Describalo brevemente." },
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
          "Su solicitud de cita fue registrada.\n\n" +
          `Nombre: ${data.nombre}\n` +
          `Telefono: ${data.tel1}\n` +
          `Segundo telefono: ${data.tel2||"No proporcionado"}\n` +
          `Domicilio: ${data.domicilio}\n` +
          `Motivo: ${data.motivo}\n\n` +
          "Nuestro equipo le contactara a la brevedad para confirmar su cita.\n\nGracias por comunicarse con el COE.",
      },
      footer: { text: "Centro Ocular Especializado" },
      action: {
        buttons: [
          { type:"reply", reply:{ id:"reagendar",   title:"Reagendar la cita" } },
          { type:"reply", reply:{ id:"menu_inicio",  title:"Volver al inicio" } },
        ],
      },
    },
  }];
}

function buildIntakeCirugiaQuestion() {
  return [{ type:"text", text:{ body:"Para programar su cirugia, por favor escriba su nombre completo:" } }];
}

function buildIntakeCirugiaConfirmation(nombre) {
  return [{
    type: "interactive",
    interactive: {
      type: "button",
      body: { text:`Gracias, ${nombre}.\n\nUn asesor del area de Cirugia le contactara para coordinar su valoracion preoperatoria.\n\nHasta pronto.` },
      footer: { text: "Centro Ocular Especializado" },
      action: { buttons: [{ type:"reply", reply:{ id:"menu_inicio", title:"Volver al inicio" } }] },
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
        `Le conectamos con ${area.agente}.\n\n` +
        `Un asesor le contactara en breve.\n\n` +
        `Tambien puede escribirles directamente:\n` +
        `https://wa.me/${area.whatsapp}\n\n` +
        `Que tenga un excelente dia.`,
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
      `Nuevo paciente - ${area.nombre}\n\n` +
      `Numero: +${patientNumber}\n` +
      `Mensaje: "${patientMessage}"\n\n` +
      `Por favor contactarle a la brevedad.`,
  };
}

function buildUrgenciaNotification(patientNumber, mensaje) {
  return {
    message:
      `URGENCIA OFTALMOLOGICA - COE Bot\n\n` +
      `Paciente: +${patientNumber}\n` +
      `Mensaje: "${mensaje}"\n\n` +
      `Contactar de inmediato.`,
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
