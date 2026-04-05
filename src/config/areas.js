const NUM_URGENCIAS = process.env.WA_NUM_GENERAL || process.env.WA_ALERT_NUMBER || "5214431234567";

const PALABRAS_URGENCIA = [
  "dolor intenso","urgente","urgencia","emergencia","perdí la visión","perdi la vision",
  "no veo","ojo rojo","golpe","trauma","quemadura","químico","accidente",
  "cuerpo extraño","me cayó algo","sangre","inflamado","muy inflamado",
  "párpado caído","veo doble","diplopía",
];

function esUrgencia(texto) {
  const lower = (texto || "").toLowerCase();
  return PALABRAS_URGENCIA.some(p => lower.includes(p));
}

const AREAS = {

  consultas: {
    id: "consultas", nombre: "Consultas y Agenda", emoji: "📅",
    descripcion: "Agendar cita, primera vez, seguimientos",
    whatsapp: process.env.WA_NUM_CONSULTAS || "5213361110001",
    agente: "Recepción COE",
    imagen: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80",
    flujoEspecial: "intake_cita",
  },

  cirugia: {
    id: "cirugia", nombre: "Cirugía", emoji: "🔬",
    descripcion: "Catarata · Retina · Refractiva",
    whatsapp: process.env.WA_NUM_CIRUGIA || "5213361110002",
    agente: "Asesor de Cirugía",
    imagen: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&q=80",
    faqs: [
      { id:"cir_1", pregunta:"Quiero programar mi cirugía",   flujoEspecial:"intake_cirugia" },
      { id:"cir_2", pregunta:"¿Cuánto dura la cirugía?",      respuesta:"Depende del tipo de procedimiento. Puede durar desde *15 minutos* hasta aproximadamente *2 horas*.\n\nPor ejemplo, una cirugía de catarata o LASIK suele ser rápida, mientras que procedimientos de retina o cirugías complejas pueden tomar más tiempo.\n\nTu cirujano te indicará el tiempo estimado según tu caso." },
      { id:"cir_3", pregunta:"¿Duele la cirugía?",            respuesta:"Habitualmente la anestesia hace muy buen trabajo y el procedimiento se realiza sin dolor.\n\nAdemás, siempre contamos con medidas específicas para *evitar o minimizar el dolor en el postquirúrgico*, tanto con medicación como con indicaciones de cuidado en casa.\n\nLa comodidad del paciente es nuestra prioridad." },
      { id:"cir_4", pregunta:"¿Qué graduaciones se corrigen?", respuesta:"Con la cirugía refractiva podemos corregir:\n\n👁 *Miopía* — dificultad para ver de lejos\n👁 *Hipermetropía* — dificultad para ver de cerca\n👁 *Astigmatismo* — visión distorsionada\n👁 *Vista cansada (presbicia)* — dificultad para enfocar de cerca\n\nLa candidatura se determina con el estudio preoperatorio." },
      { id:"cir_5", pregunta:"¿Cuánto cuesta la cirugía?",    respuesta:"El costo está en función de la *cirugía a la cual seamos candidatos* y a la *complejidad de la misma*.\n\nCada caso es diferente, por lo que la cotización es personalizada tras la valoración.\n\n¿Te gustaría agendar una cita de valoración?", botonCita: true },
      { id:"cir_6", pregunta:"Tengo dudas sobre mi cirugía",  respuesta:"Es completamente normal tener dudas antes de una cirugía. Te recomendamos *agendar una cita con el especialista* y acudir con tus dudas apuntadas para aprovechar al máximo la consulta.\n\nNinguna pregunta es pequeña — estamos aquí para que te vayas tranquilo/a y con toda la información clara. 🏥" },
    ],
  },

  optica: {
    id: "optica", nombre: "Óptica y Lentes", emoji: "👓",
    descripcion: "Lentes graduados, armazones, contacto",
    whatsapp: process.env.WA_NUM_OPTICA || "5213361110003",
    agente: "Óptica COE",
    imagen: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=80",
    faqs: [
      { id:"o1", pregunta:"Quiero agendar examen de la vista", flujoEspecial:"intake_cita_optica" },
      { id:"o2", pregunta:"¿Cuánto tardan los lentes?",        respuesta:"Los lentes pueden estar listos en un rango de *3 a 15 días* dependiendo del tipo de lente:\n\n• Monofocales sencillos: 3-5 días\n• Progresivos o con tratamientos especiales: hasta 15 días\n\nTe avisamos en cuanto estén listos." },
      { id:"o3", pregunta:"¿Tienen lentes de contacto?",       respuesta:"Sí, contamos con lentes de contacto de muchos tipos:\n\n• Desechables diarios y mensuales\n• Blandos esféricos y tóricos (astigmatismo)\n• Multifocales (presbicia)\n• Lentes especiales para queratocono y ojo seco\n\nPregunta a nuestro asesor sobre el más adecuado para ti." },
      { id:"o4", pregunta:"¿Tienen garantía los lentes?",      respuesta:"Sí, contamos con garantía tanto en *adaptación* como en *defectos de fabricación*.\n\nLos detalles dependen del tipo de lente y armazón. Pregunta a nuestro asesor de óptica para conocer los términos específicos de tu compra." },
    ],
  },

  farmacia: {
    id: "farmacia", nombre: "Farmacia", emoji: "💊",
    descripcion: "Medicamentos oftalmológicos, gotas, recetas",
    whatsapp: process.env.WA_NUM_FARMACIA || "5213361110004",
    agente: "Farmacia COE",
    imagen: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80",
    faqs: [
      { id:"f1", pregunta:"¿Tienen mi medicamento?",    respuesta:"Contamos con inventario especializado en oftalmología: antibióticos, antiinflamatorios, lubricantes, antialérgicos, hipotensores oculares y midriáticos.\n\nPara confirmar disponibilidad de un medicamento específico, nuestro farmacéutico te puede ayudar." },
      { id:"f2", pregunta:"¿Necesito receta?",          respuesta:"📋 *Requieren receta:* antibióticos, esteroides, hipotensores, midriáticos.\n✅ *Sin receta:* lubricantes oculares, vitaminas, solución salina.\n\nSi tu receta es del COE, está en nuestro sistema y podemos surtirla directamente." },
      { id:"f3", pregunta:"¿Tienen gotas lubricantes?", respuesta:"Sí, contamos con varias presentaciones:\n\n• *Monodosis sin conservadores* — uso frecuente o ojo seco severo\n• *Multidosis* — uso moderado\n• *Geles* — mayor tiempo de contacto\n• *Ungüentos nocturnos* — ojo seco nocturno\n\nTe recomendamos el más adecuado según tu diagnóstico." },
      { id:"f4", pregunta:"¿Surten recetas externas?",  respuesta:"Sí, surtimos recetas de cualquier médico. Si no tenemos el medicamento, orientamos sobre alternativas equivalentes o hacemos pedido especial." },
      { id:"f5", pregunta:"¿Cuál es el horario?",       respuesta:"Lunes a Sábado 9:00am – 6:00pm dentro del COE.\n\nDomingos cerrado. En urgencias, preséntate directamente a la clínica." },
    ],
  },

  caja: {
    id: "caja", nombre: "Caja y Pagos", emoji: "💳",
    descripcion: "Pagos, facturas, seguros médicos",
    whatsapp: process.env.WA_NUM_CAJA || "5213361110005",
    agente: "Caja COE",
    imagen: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
    faqs: [
      { id:"c1", pregunta:"¿Qué formas de pago aceptan?", respuesta:"💵 Efectivo\n💳 Débito/Crédito (Visa, Mastercard, American Express)\n🏦 Transferencia bancaria\n🏥 Seguro médico de gastos mayores" },
      { id:"c2", pregunta:"¿Aceptan mi seguro médico?",   respuesta:"Trabajamos con las principales aseguradoras de gastos médicos mayores. Para confirmar cobertura necesitamos el nombre de la aseguradora y número de póliza. Verificamos directamente con ellos." },
      { id:"c3", pregunta:"¿Cómo solicito mi factura?",   respuesta:"En caja el mismo día, o por WhatsApp dentro de los *30 días naturales* del servicio.\n\nNecesitamos RFC, razón social y correo electrónico. La enviamos en PDF.\n\n⚠️ Después de 30 días no es posible facturar por disposición fiscal." },
      { id:"c4", pregunta:"¿Aceptan seguros privados?",   respuesta:"Sí, gastos médicos mayores. Algunos requieren carta de autorización previa. Nuestro equipo de caja te orienta en todo el proceso de autorización." },
    ],
  },

  quejas: {
    id: "quejas", nombre: "Quejas y Sugerencias", emoji: "📝",
    descripcion: "Comparte tu experiencia, sugerencias o inconformidades",
    whatsapp: process.env.WA_NUM_ADMIN || process.env.WA_ALERT_NUMBER || "5213361110006",
    agente: "Administración COE",
    imagen: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
    flujoEspecial: "intake_queja",
  },
};

const SERVICIOS = {
  cirugia_refractiva: { nombre:"Cirugía Refractiva", emoji:"✨", descripcion:"LASIK, TransPRK Zero Touch, ICL. Corrección de miopía, hipermetropía, astigmatismo y vista cansada." },
  cataratas:          { nombre:"Cirugía de Cataratas", emoji:"🔵", descripcion:"Facoemulsificación con microincisión. LIO monofocales, EDOF y multifocales premium." },
  retina:             { nombre:"Retina y Vítreo", emoji:"🔴", descripcion:"Retinopatía diabética, DMRE, desprendimiento de retina. Inyecciones intravítreas y vitrectomía." },
  glaucoma:           { nombre:"Glaucoma", emoji:"🟢", descripcion:"Diagnóstico con OCT y campimetría. Tratamiento médico, láser (SLT) y quirúrgico." },
  cornea:             { nombre:"Córnea y Superficie", emoji:"🟡", descripcion:"Queratocono (crosslinking), pterigión, ojo seco, úlceras, trasplante corneal." },
  oculoplastica:      { nombre:"Oculoplástica", emoji:"🟣", descripcion:"Blefaroplastia, ptosis palpebral, ectropión/entropión, obstrucción lagrimal." },
  optometria:         { nombre:"Optometría", emoji:"👁", descripcion:"Examen de refracción, adaptación de lentes de contacto, terapia visual." },
  contactologia:      { nombre:"Contactología", emoji:"🔵", descripcion:"Lentes blandos, tóricos, multifocales, rígidos y esclerales." },
};

const BIENVENIDA_TEXTO =
  "👁️ *Bienvenido al COE*\n\n" +
  "Has llegado al lugar indicado para el cuidado de tus ojos.\n\n" +
  "Cuéntanos, ¿en qué podemos ayudarte hoy? Selecciona el área que necesitas 👇";

module.exports = { AREAS, SERVICIOS, BIENVENIDA_TEXTO, esUrgencia, NUM_URGENCIAS };

// ── Nuevos servicios adicionales ──────────────────────────────────────────
const SERVICIOS_EXTRA = {
  laboratorio_optico: {
    nombre: "Laboratorio Óptico",
    emoji: "🔧",
    descripcion:
      "Laboratorio propio dentro del COE para fabricación de lentes oftálmicos.\n\n" +
      "🔹 Lentes monofocales, bifocales y progresivos\n" +
      "🔹 Tratamientos: antirreflejante, fotocromático, polarizado, filtro de luz azul\n" +
      "🔹 Lentes de alta graduación y diseños especiales\n" +
      "🔹 Tiempos de entrega: 3 a 15 días según el tipo de lente\n\n" +
      "Tener laboratorio propio nos permite mayor control de calidad y tiempos más rápidos que las ópticas convencionales.",
  },
  estudios_especialidad: {
    nombre: "Estudios de Especialidad",
    emoji: "🖥️",
    descripcion:
      "Estudios diagnósticos avanzados para evaluación oftalmológica completa:\n\n" +
      "👁 *OCT (Tomografía de Coherencia Óptica)* — imagen de alta resolución de retina, nervio óptico y mácula.\n" +
      "👁 *Topografía Corneal* — mapa de la superficie de la córnea. Indispensable para candidatura a cirugía refractiva y diagnóstico de queratocono.\n" +
      "👁 *Campo Visual (Campimetría)* — evaluación del campo visual periférico. Fundamental en glaucoma y neuroftalmología.\n" +
      "👁 *Biometría Óptica* — medición precisa del ojo para selección del lente intraocular en cirugía de cataratas.\n" +
      "👁 *Biomecánica Corneal (Corvis ST)* — resistencia y elasticidad corneal para candidatura a LASIK/TransPRK.",
  },
};

// Agregar a SERVICIOS existente
Object.assign(module.exports.SERVICIOS || {}, SERVICIOS_EXTRA);
// Re-exportar con los extras incluidos
const SERVICIOS_COMPLETOS = {
  ...module.exports.SERVICIOS,
  ...SERVICIOS_EXTRA,
};
module.exports.SERVICIOS = SERVICIOS_COMPLETOS;
