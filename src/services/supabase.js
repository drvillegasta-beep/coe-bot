/**
 * COE Bot — Servicio Supabase
 * Guarda conversaciones, mensajes, encuestas y citas en tiempo real
 */

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── Conversaciones ────────────────────────────────────────────────────────

async function upsertConversacion(numero, data) {
  try {
    const { error } = await supabase
      .from("coe_conversaciones")
      .upsert({
        numero,
        ...data,
        updated_at: new Date().toISOString(),
      }, { onConflict: "numero,fecha" });
    if (error) console.error("❌ Supabase upsertConversacion:", error.message);
  } catch (err) {
    console.error("❌ Supabase error:", err.message);
  }
}

async function getConversacionesHoy() {
  try {
    const hoy = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("coe_conversaciones")
      .select("*")
      .eq("fecha", hoy)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("❌ Supabase getConversacionesHoy:", err.message);
    return [];
  }
}

async function updateEstado(numero, estado) {
  try {
    const hoy = new Date().toISOString().split("T")[0];
    const { error } = await supabase
      .from("coe_conversaciones")
      .update({ estado, updated_at: new Date().toISOString() })
      .eq("numero", numero)
      .eq("fecha", hoy);
    if (error) throw error;
  } catch (err) {
    console.error("❌ Supabase updateEstado:", err.message);
  }
}

// ── Mensajes ──────────────────────────────────────────────────────────────

async function guardarMensaje(numero, tipo, contenido, area) {
  try {
    const { error } = await supabase
      .from("coe_mensajes")
      .insert({ numero, tipo, contenido, area });
    if (error) throw error;
  } catch (err) {
    console.error("❌ Supabase guardarMensaje:", err.message);
  }
}

// ── Encuestas ─────────────────────────────────────────────────────────────

async function guardarEncuesta(numero, nombre, servicio, calificacion) {
  try {
    const { error } = await supabase
      .from("coe_encuestas")
      .insert({ numero, nombre, servicio, calificacion });
    if (error) throw error;
    console.log(`⭐ Encuesta guardada: ${numero} → ${calificacion}/5`);
  } catch (err) {
    console.error("❌ Supabase guardarEncuesta:", err.message);
  }
}

async function getPromedioEncuestas(servicio) {
  try {
    const { data, error } = await supabase
      .from("coe_encuestas")
      .select("calificacion")
      .eq("servicio", servicio);
    if (error || !data?.length) return null;
    const avg = data.reduce((a, b) => a + b.calificacion, 0) / data.length;
    return avg.toFixed(1);
  } catch (err) {
    return null;
  }
}

// ── Citas ─────────────────────────────────────────────────────────────────

async function guardarCita(numero, citaData) {
  try {
    const { error } = await supabase
      .from("coe_citas")
      .upsert({ numero, ...citaData }, { onConflict: "numero" });
    if (error) throw error;
    console.log(`📋 Cita guardada: ${numero}`);
  } catch (err) {
    console.error("❌ Supabase guardarCita:", err.message);
  }
}

async function confirmarCitaDB(numero, fechaHora) {
  try {
    const { data, error } = await supabase
      .from("coe_citas")
      .update({
        confirmado: true,
        fecha_hora: fechaHora,
        confirmado_en: new Date().toISOString(),
      })
      .eq("numero", numero)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("❌ Supabase confirmarCita:", err.message);
    return null;
  }
}

async function getCitaPendiente(numero) {
  try {
    const { data, error } = await supabase
      .from("coe_citas")
      .select("*")
      .eq("numero", numero)
      .eq("confirmado", false)
      .single();
    if (error) return null;
    return data;
  } catch (err) {
    return null;
  }
}

// ── Dashboard ─────────────────────────────────────────────────────────────

async function getDashboard() {
  try {
    const [convs, encuestas] = await Promise.all([
      getConversacionesHoy(),
      supabase.from("coe_encuestas").select("calificacion, servicio").then(r => r.data || []),
    ]);

    const totalHoy = convs.length;
    const pendientes = convs.filter(c => c.estado === "pendiente").length;
    const transferidos = convs.filter(c => c.estado === "transferido").length;
    const promEncuesta = encuestas.length
      ? (encuestas.reduce((a, b) => a + b.calificacion, 0) / encuestas.length).toFixed(1)
      : null;

    const porArea = {};
    convs.forEach(c => {
      if (!porArea[c.area]) porArea[c.area] = 0;
      porArea[c.area]++;
    });

    return { totalHoy, pendientes, transferidos, promEncuesta, porArea, conversaciones: convs };
  } catch (err) {
    console.error("❌ Supabase getDashboard:", err.message);
    return null;
  }
}

module.exports = {
  upsertConversacion,
  getConversacionesHoy,
  updateEstado,
  guardarMensaje,
  guardarEncuesta,
  getPromedioEncuestas,
  guardarCita,
  confirmarCitaDB,
  getCitaPendiente,
  getDashboard,
};
