/**
 * COE Bot — Horario de Atención
 * 
 * Horario COE:
 *   Lunes a Viernes: 9:00am – 7:00pm
 *   Sábados:         9:00am – 2:00pm
 *   Domingos:        Cerrado
 * 
 * Zona horaria: America/Mexico_City (CST/CDT)
 */

const TIMEZONE = "America/Mexico_City";

const HORARIO = {
  // 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
  1: { abre: 9, cierra: 19 },
  2: { abre: 9, cierra: 19 },
  3: { abre: 9, cierra: 19 },
  4: { abre: 9, cierra: 19 },
  5: { abre: 9, cierra: 19 },
  6: { abre: 9, cierra: 14 },
};

/**
 * Retorna la hora actual en México como objeto Date
 */
function ahoraEnMexico() {
  const ahora = new Date();
  // Convertir a string en zona horaria México y volver a parsear
  const str = ahora.toLocaleString("en-US", { timeZone: TIMEZONE });
  return new Date(str);
}

/**
 * Retorna si el COE está abierto ahora mismo
 */
function estaAbierto() {
  const ahora  = ahoraEnMexico();
  const dia    = ahora.getDay();    // 0-6
  const hora   = ahora.getHours();  // 0-23
  const minuto = ahora.getMinutes();
  const turno  = HORARIO[dia];

  if (!turno) return false; // domingo

  const horaDecimal = hora + minuto / 60;
  return horaDecimal >= turno.abre && horaDecimal < turno.cierra;
}

/**
 * Retorna el mensaje de fuera de horario con el próximo horario de apertura
 */
function mensajeFueraDeHorario(nombrePaciente) {
  const ahora = ahoraEnMexico();
  const dia   = ahora.getDay();

  // Calcular cuándo abren próximamente
  let proximoMensaje = "";

  if (dia === 0) {
    // Domingo → lunes
    proximoMensaje = "el lunes a las 9:00am";
  } else if (dia === 6) {
    // Sábado
    const hora = ahora.getHours() + ahora.getMinutes() / 60;
    if (hora < 9) {
      proximoMensaje = "hoy a partir de las 9:00am";
    } else {
      proximoMensaje = "el lunes a las 9:00am";
    }
  } else {
    // Lunes-Viernes
    const hora = ahora.getHours() + ahora.getMinutes() / 60;
    if (hora < 9) {
      proximoMensaje = "hoy a partir de las 9:00am";
    } else if (hora >= 19) {
      // Ya cerró hoy
      if (dia === 5) {
        // Viernes — siguiente día hábil es lunes
        proximoMensaje = "el lunes a las 9:00am";
      } else {
        proximoMensaje = "mañana a las 9:00am";
      }
    }
  }

  const saludo = nombrePaciente ? `Hola ${nombrePaciente}, ` : "Hola, ";

  return (
    `${saludo}gracias por contactar al *Centro Ocular Especializado — COE* 👁️\n\n` +
    `En este momento nos encontramos fuera de nuestro horario de atención.\n\n` +
    `🕐 *Horario de atención:*\n` +
    `• Lunes a Viernes: 9:00am – 7:00pm\n` +
    `• Sábados: 9:00am – 2:00pm\n\n` +
    `Nuestro equipo estará disponible *${proximoMensaje}*. ` +
    `Tu mensaje quedó registrado y te atenderemos en cuanto abramos.\n\n` +
    `Si tienes una *urgencia oftalmológica*, por favor acude a urgencias del hospital más cercano.\n\n` +
    `¡Hasta pronto! 🏥`
  );
}

/**
 * Retorna el texto del horario para mostrar en conversación
 */
function textoHorario() {
  return (
    "🕐 *Horario de atención COE:*\n" +
    "• Lunes a Viernes: 9:00am – 7:00pm\n" +
    "• Sábados: 9:00am – 2:00pm\n" +
    "• Domingos: Cerrado"
  );
}

module.exports = { estaAbierto, mensajeFueraDeHorario, textoHorario };
