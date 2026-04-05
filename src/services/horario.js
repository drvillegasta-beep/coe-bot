/**
 * COE Bot — Horario de Atención v2
 * Lunes-Sábado 9am-6pm · Domingos cerrado + info urgencias
 */
const TIMEZONE = "America/Mexico_City";
const HORARIO = { 1:{abre:9,cierra:18}, 2:{abre:9,cierra:18}, 3:{abre:9,cierra:18}, 4:{abre:9,cierra:18}, 5:{abre:9,cierra:18}, 6:{abre:9,cierra:18} };

function ahoraEnMexico() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: TIMEZONE }));
}
function estaAbierto() {
  const a = ahoraEnMexico(), dia = a.getDay(), t = HORARIO[dia];
  if (!t) return false;
  const h = a.getHours() + a.getMinutes()/60;
  return h >= t.abre && h < t.cierra;
}
function esDomingo() { return ahoraEnMexico().getDay() === 0; }

function mensajeFueraDeHorario(nombre) {
  const a = ahoraEnMexico(), dia = a.getDay(), h = a.getHours() + a.getMinutes()/60;
  let proximo = "";
  const esDom = dia === 0;
  if (esDom) proximo = "el lunes a las 9:00am";
  else if (dia === 6 && h >= 18) proximo = "el lunes a las 9:00am";
  else proximo = h < 9 ? "hoy a partir de las 9:00am" : "mañana a las 9:00am";

  const saludo = nombre ? `Hola ${nombre}, ` : "Hola, ";
  return (
    `${saludo}gracias por contactar al *Centro Ocular Especializado — COE* 👁️\n\n` +
    `En este momento estamos fuera de horario.\n\n` +
    `🕐 *Horario:* Lunes a Sábado 9:00am – 6:00pm · Domingos cerrado\n\n` +
    (esDom
      ? `Hoy es domingo y descansamos para atenderle mejor. Nuestro equipo regresa *el lunes a las 9:00am*.\n\n`
      : `Estaremos disponibles *${proximo}*.\n\n`) +
    `🚨 *¿Es una urgencia?*\nSi tienes dolor intenso, pérdida súbita de visión o trauma ocular, ` +
    `puedes *presentarte sin cita previa* y te atendemos de inmediato.\n\n` +
    `📍 COE · Tacámbaro, Michoacán\n\nTu mensaje quedó registrado. ¡Hasta pronto! 🏥`
  );
}
function textoHorario() {
  return "🕐 *Horario COE:*\n• Lunes a Sábado: 9:00am – 6:00pm\n• Domingos: Cerrado\n\n🚨 *Urgencias:* preséntate sin cita previa en cualquier momento.";
}
module.exports = { estaAbierto, esDomingo, mensajeFueraDeHorario, textoHorario };
