/**
 * COE Bot — Gestor de Sesiones v2
 *
 * Stages posibles:
 *   idle            → sin conversación activa
 *   menu            → viendo el menú principal
 *   faq_<area>      → viendo FAQs de un área
 *   intake_cita     → recopilando datos para cita (paso a paso)
 *   intake_cirugia  → recopilando nombre para cirugía
 *   transferred     → derivado al asesor
 *
 * intakeCita almacena los campos recopilados:
 *   { nombre, tel1, tel2, domicilio, motivo }
 */

const UNREAD_TIMEOUT_MS = 5 * 60 * 1000;

const sessions = new Map();

function getSession(senderId) {
  if (!sessions.has(senderId)) {
    sessions.set(senderId, {
      stage:       "idle",
      areaId:      null,
      lastMessage: null,
      unreadTimer: null,
      intakeCita:  {},       // datos de cita en progreso
      intakeStep:  null,     // paso actual del intake
    });
  }
  return sessions.get(senderId);
}

function updateSession(senderId, updates) {
  const s = getSession(senderId);
  Object.assign(s, updates);
  sessions.set(senderId, s);
}

function startUnreadTimer(senderId, onTimeout) {
  const s = getSession(senderId);
  if (s.unreadTimer) clearTimeout(s.unreadTimer);
  const timer = setTimeout(async () => {
    try { await onTimeout(); } catch (e) { console.error("unread timer:", e.message); }
  }, UNREAD_TIMEOUT_MS);
  updateSession(senderId, { unreadTimer: timer });
}

function cancelUnreadTimer(senderId) {
  const s = getSession(senderId);
  if (s.unreadTimer) {
    clearTimeout(s.unreadTimer);
    updateSession(senderId, { unreadTimer: null });
  }
}

function clearSession(senderId) {
  cancelUnreadTimer(senderId);
  sessions.delete(senderId);
}

module.exports = { getSession, updateSession, startUnreadTimer, cancelUnreadTimer, clearSession };
