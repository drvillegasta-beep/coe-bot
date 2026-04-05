/**
 * COE Bot — Servicio de Mensajes Programados
 *
 * Maneja:
 *   1. Confirmaciones de cita (enviadas por el admin)
 *   2. Mensajes postoperatorios (semana 1 y mes 1)
 *   3. Encuesta de satisfacción (mañana siguiente)
 *
 * Almacenamiento: archivo JSON local (coe-scheduled.json)
 * Para producción con Railway, migrar a Supabase para persistencia
 */

const fs   = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "../../coe-scheduled.json");

// ── Helpers de persistencia ───────────────────────────────────────────────
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }
  } catch (_) {}
  return { confirmaciones: {}, postop: [], encuestas: [] };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("❌ Error guardando datos programados:", err.message);
  }
}

// ── Confirmaciones de cita ────────────────────────────────────────────────

/**
 * Registra una solicitud de cita pendiente de confirmación
 * @param {string} patientPhone - número del paciente
 * @param {object} citaData - { nombre, telefono, motivo }
 */
function registrarSolicitudCita(patientPhone, citaData) {
  const data = loadData();
  data.confirmaciones[patientPhone] = {
    ...citaData,
    solicitadoEn: new Date().toISOString(),
    confirmado: false,
  };
  saveData(data);
  console.log(`📋 Solicitud de cita registrada: ${patientPhone}`);
}

/**
 * Marca una cita como confirmada y prepara el mensaje para el paciente
 * El admin activa esto enviando un comando al bot
 * Formato del comando: CONFIRMAR [numero] [fecha] [hora]
 * Ejemplo: CONFIRMAR 5214432068104 martes 3 de abril 10:30am
 */
function confirmarCita(patientPhone, fechaHora) {
  const data = loadData();
  const solicitud = data.confirmaciones[patientPhone];
  if (!solicitud) return null;

  solicitud.confirmado  = true;
  solicitud.fechaHora   = fechaHora;
  solicitud.confirmadoEn = new Date().toISOString();
  saveData(data);

  return {
    to:      patientPhone,
    mensaje:
      `✅ *Cita confirmada — Centro Ocular Especializado*\n\n` +
      `Hola ${solicitud.nombre}, tu cita ha sido confirmada.\n\n` +
      `📅 *Fecha y hora:* ${fechaHora}\n` +
      `💬 *Motivo:* ${solicitud.motivo}\n\n` +
      `📍 COE · Tacámbaro, Michoacán\n\n` +
      `*Recomendaciones:*\n` +
      `• Llega 10 minutos antes\n` +
      `• Trae identificación oficial\n` +
      `• Si usas lentes de contacto, no los uses ese día\n\n` +
      `¡Te esperamos! 🏥`,
  };
}

// ── Mensajes postoperatorios ──────────────────────────────────────────────

/**
 * Registra a un paciente para seguimiento postoperatorio
 * @param {string} patientPhone
 * @param {string} nombrePaciente
 * @param {string} tipoCirugia - ej: "LASIK", "cataratas", "retina"
 * @param {Date} fechaCirugia
 */
function registrarPostop(patientPhone, nombrePaciente, tipoCirugia, fechaCirugia) {
  const data   = loadData();
  const fecha  = new Date(fechaCirugia);

  const semana = new Date(fecha);
  semana.setDate(semana.getDate() + 7);

  const mes = new Date(fecha);
  mes.setMonth(mes.getMonth() + 1);

  data.postop.push({
    phone:        patientPhone,
    nombre:       nombrePaciente,
    cirugia:      tipoCirugia,
    fechaCirugia: fecha.toISOString(),
    mensajes: [
      { tipo: "semana1", enviarEn: semana.toISOString(), enviado: false },
      { tipo: "mes1",    enviarEn: mes.toISOString(),    enviado: false },
    ],
  });
  saveData(data);
  console.log(`🏥 Postop registrado: ${patientPhone} — ${tipoCirugia}`);
}

function getMensajePostop(tipo, nombre, cirugia) {
  if (tipo === "semana1") {
    return (
      `👋 Hola ${nombre}, soy el asistente del *Centro Ocular Especializado*.\n\n` +
      `Han pasado 7 días desde tu cirugía de *${cirugia}* y queremos saber cómo te encuentras.\n\n` +
      `¿Cómo ha sido tu recuperación?\n\n` +
      `• ¿Tienes alguna molestia o duda?\n` +
      `• ¿Has estado usando tus medicamentos según las indicaciones?\n\n` +
      `Si tienes algún síntoma de alarma (dolor intenso, visión borrosa repentina, ojo muy rojo), ` +
      `*preséntate de inmediato al COE*.\n\n` +
      `¡Seguimos al pendiente de tu recuperación! 🏥`
    );
  }
  if (tipo === "mes1") {
    return (
      `👋 Hola ${nombre}, un saludo del *Centro Ocular Especializado*.\n\n` +
      `Ha pasado un mes desde tu cirugía de *${cirugia}*. ` +
      `Esperamos que tu recuperación haya sido excelente. 😊\n\n` +
      `Recuerda que es importante *acudir a tu revisión del mes* si aún no lo has hecho, ` +
      `para asegurarnos de que todo va perfecto.\n\n` +
      `¿Tienes alguna duda o necesitas agendar tu cita de seguimiento?\n\n` +
      `¡Estamos para servirte! 🏥`
    );
  }
  return null;
}

// ── Encuesta de satisfacción ──────────────────────────────────────────────

/**
 * Programa encuesta para el día siguiente a las 9am
 */
function programarEncuesta(patientPhone, nombrePaciente, servicio) {
  const data    = loadData();
  const manana  = new Date();
  manana.setDate(manana.getDate() + 1);
  manana.setHours(9, 0, 0, 0);

  // Evitar duplicados del mismo día
  const yaExiste = data.encuestas.some(
    e => e.phone === patientPhone && !e.enviado &&
         new Date(e.enviarEn).toDateString() === manana.toDateString()
  );
  if (yaExiste) return;

  data.encuestas.push({
    phone:    patientPhone,
    nombre:   nombrePaciente || "paciente",
    servicio: servicio || "el servicio",
    enviarEn: manana.toISOString(),
    enviado:  false,
  });
  saveData(data);
  console.log(`📊 Encuesta programada: ${patientPhone} para ${manana.toLocaleString("es-MX")}`);
}

function getMensajeEncuesta(nombre, servicio) {
  return (
    `👋 Buenos días ${nombre},\n\n` +
    `Soy el asistente del *Centro Ocular Especializado*.\n\n` +
    `Ayer tuviste contacto con nuestra área de *${servicio}* y nos importa mucho tu experiencia.\n\n` +
    `¿Podrías calificar la atención que recibiste?\n\n` +
    `⭐ *1* — Muy mala\n` +
    `⭐⭐ *2* — Mala\n` +
    `⭐⭐⭐ *3* — Regular\n` +
    `⭐⭐⭐⭐ *4* — Buena\n` +
    `⭐⭐⭐⭐⭐ *5* — Excelente\n\n` +
    `Responde solo con el número. ¡Gracias por ayudarnos a mejorar! 🏥`
  );
}

// ── Verificador periódico (corre cada minuto) ─────────────────────────────
let sendMessageCallback = null;

function setSendCallback(fn) {
  sendMessageCallback = fn;
}

async function checkPendientes() {
  if (!sendMessageCallback) return;

  const data  = loadData();
  const ahora = new Date();
  let   changed = false;

  // Postoperatorios
  for (const p of data.postop) {
    for (const m of p.mensajes) {
      if (!m.enviado && new Date(m.enviarEn) <= ahora) {
        const msg = getMensajePostop(m.tipo, p.nombre, p.cirugia);
        if (msg) {
          await sendMessageCallback(p.phone, msg);
          m.enviado  = true;
          changed    = true;
          console.log(`📤 Postop ${m.tipo} enviado a ${p.phone}`);
        }
      }
    }
  }

  // Encuestas
  for (const e of data.encuestas) {
    if (!e.enviado && new Date(e.enviarEn) <= ahora) {
      const msg = getMensajeEncuesta(e.nombre, e.servicio);
      await sendMessageCallback(e.phone, msg);
      e.enviado = true;
      changed   = true;
      console.log(`📤 Encuesta enviada a ${e.phone}`);
    }
  }

  if (changed) saveData(data);
}

/**
 * Inicia el verificador periódico (cada 60 segundos)
 */
function iniciarScheduler(sendFn) {
  setSendCallback(sendFn);
  setInterval(checkPendientes, 60 * 1000);
  console.log("⏰ Scheduler de mensajes programados activo");
}

module.exports = {
  registrarSolicitudCita,
  confirmarCita,
  registrarPostop,
  programarEncuesta,
  iniciarScheduler,
  checkPendientes,
  getMensajeEncuesta,
};
