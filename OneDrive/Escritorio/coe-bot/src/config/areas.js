/**
 * COE Bot — Configuración de Áreas (v3)
 * Reemplaza números de WhatsApp por los reales cuando los tengas.
 */

const AREAS = {

  // ── Consultas / Agenda ───────────────────────────────────────────────────
  consultas: {
    id: "consultas",
    nombre: "Consultas y Agenda",
    emoji: "📅",
    descripcion: "Agendar cita, primera vez, seguimientos",
    whatsapp: process.env.WA_NUM_CONSULTAS || "5213361110001",
    agente: "Recepción COE",
    imagen: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80",
    derivacionDirecta: false,
    flujoEspecial: "intake_cita",   // recolecta datos del paciente paso a paso
  },

  // ── Cirugía (Catarata · Retina · Refractiva) ─────────────────────────────
  cirugia: {
    id: "cirugia",
    nombre: "Cirugía",
    emoji: "🔬",
    descripcion: "Catarata · Retina · Refractiva (LASIK/TransPRK)",
    whatsapp: process.env.WA_NUM_CIRUGIA || "5213361110002",
    agente: "Asesor de Cirugía",
    imagen: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&q=80",
    derivacionDirecta: false,
    faqs: [
      {
        id: "cir_1",
        pregunta: "Quiero programar mi cirugía",
        flujoEspecial: "intake_cirugia",  // recolecta nombre completo
      },
      {
        id: "cir_2",
        pregunta: "¿Cuánto dura la recuperación?",
        respuesta: "Los tiempos varían según el procedimiento:\n\n• *Catarata:* ~7 días para actividades básicas.\n• *Pterigión (carnosidad):* ~3 semanas.\n• *Retina:* hasta 3 meses según la técnica.\n• *LASIK / Refractiva:* ~1 semana para estabilización.\n\nEn todos los casos tu cirujano te dará las indicaciones específicas para tu caso.",
      },
      {
        id: "cir_3",
        pregunta: "¿Duele la cirugía?",
        respuesta: "Las molestias son muy escasas gracias al avance en anestesia. Utilizamos anestesia tópica en gotas y, cuando el caso lo requiere, bloqueos peribulbares. La mayoría de nuestros pacientes reportan no haber sentido dolor durante el procedimiento.",
      },
      {
        id: "cir_4",
        pregunta: "¿Qué graduaciones se corrigen?",
        respuesta: "Corregimos las principales ametropías:\n\n• *Miopía* (ver de lejos borroso)\n• *Hipermetropía* (ver de cerca borroso)\n• *Astigmatismo* (visión distorsionada a cualquier distancia)\n\nLos rangos exactos dependen del estudio preoperatorio de cada paciente.",
      },
      {
        id: "cir_5",
        pregunta: "¿Cuánto cuesta la cirugía?",
        respuesta: "El costo depende de la técnica quirúrgica y la dificultad del caso. Cada paciente recibe una cotización personalizada tras su valoración.\n\n¿Le gustaría agendar una cita de valoración para recibir su cotización?",
        botonCita: true,
      },
    ],
  },

  // ── Óptica ───────────────────────────────────────────────────────────────
  optica: {
    id: "optica",
    nombre: "Óptica y Lentes",
    emoji: "👓",
    descripcion: "Lentes graduados, armazones, lentes de contacto",
    whatsapp: process.env.WA_NUM_OPTICA || "5213361110003",
    agente: "Óptica COE",
    imagen: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=80",
    derivacionDirecta: false,
    faqs: [
      { id: "optica_1", pregunta: "¿Hacen examen de vista?",        respuesta: "Sí, realizamos examen de vista completo con equipo de última generación, incluyendo refracción subjetiva y objetiva. Si ya tienes receta de tu oftalmólogo, también fabricamos tus lentes directamente con ella." },
      { id: "optica_2", pregunta: "¿Cuánto tardan los lentes?",     respuesta: "Nuestro laboratorio es propio y está dentro del COE. Lentes monofocales estándar en 24-48 h. Progresivos o con tratamientos especiales: 3-5 días hábiles." },
      { id: "optica_3", pregunta: "¿Tienen lentes de contacto?",    respuesta: "Sí, manejamos lentes de contacto blandos, tóricos (astigmatismo) y multifocales de las principales marcas, con prueba de adaptación incluida." },
      { id: "optica_4", pregunta: "¿Qué tipos de lentes fabrican?", respuesta: "Monofocales, bifocales, progresivos, ocupacionales y de seguridad. Tratamientos: antirreflejante, fotocromático, polarizado, filtro azul y endurecido." },
      { id: "optica_5", pregunta: "¿Tienen garantía?",              respuesta: "Sí, todos nuestros lentes tienen garantía de fabricación. En caso de defecto los reponemos sin costo. La garantía del armazón depende de la marca." },
    ],
  },

  // ── Farmacia ─────────────────────────────────────────────────────────────
  farmacia: {
    id: "farmacia",
    nombre: "Farmacia",
    emoji: "💊",
    descripcion: "Medicamentos, gotas, recetas",
    whatsapp: process.env.WA_NUM_FARMACIA || "5213361110004",
    agente: "Farmacia COE",
    imagen: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80",
    derivacionDirecta: false,
    faqs: [
      { id: "farm_1", pregunta: "¿Tienen el medicamento que me recetaron?", respuesta: "Contamos con amplio inventario de medicamentos oftalmológicos: antibióticos, antiinflamatorios, lubricantes, antialérgicos y para presión ocular. Para confirmar disponibilidad, nuestro farmacéutico te puede ayudar." },
      { id: "farm_2", pregunta: "¿Necesito receta?",                        respuesta: "Los medicamentos de prescripción requieren receta médica vigente. Lubricantes y vitaminas no la requieren. Si tu receta es del COE, está en nuestro sistema y podemos surtirla directamente." },
      { id: "farm_3", pregunta: "¿Tienen gotas lubricantes?",               respuesta: "Sí: sin conservadores (monodosis), con conservadores, geles y ungüentos nocturnos. Te recomendamos el más adecuado según tu diagnóstico." },
      { id: "farm_4", pregunta: "¿Surten recetas de otros médicos?",        respuesta: "Sí, surtimos recetas de cualquier médico. Si el medicamento no está en inventario, orientamos sobre alternativas equivalentes o hacemos el pedido." },
      { id: "farm_5", pregunta: "¿Cuál es el horario?",                     respuesta: "Lunes a viernes 9am-7pm, sábados 9am-2pm, dentro de las instalaciones del COE." },
    ],
  },

  // ── Caja y Pagos ─────────────────────────────────────────────────────────
  caja: {
    id: "caja",
    nombre: "Caja y Pagos",
    emoji: "💳",
    descripcion: "Pagos, facturas, seguros médicos",
    whatsapp: process.env.WA_NUM_CAJA || "5213361110005",
    agente: "Caja COE",
    imagen: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
    derivacionDirecta: false,
    faqs: [
      { id: "caja_1", pregunta: "¿Qué formas de pago aceptan?", respuesta: "Efectivo, tarjeta débito/crédito (Visa, Mastercard, American Express), transferencia bancaria y pago con seguro médico." },
      { id: "caja_2", pregunta: "¿Aceptan mi seguro médico?",   respuesta: "Trabajamos con las principales aseguradoras. Para confirmar cobertura necesitamos el nombre de tu aseguradora y número de póliza. Verificamos directamente con ellos." },
      { id: "caja_3", pregunta: "¿Cómo solicito mi factura?",   respuesta: "En caja el mismo día del servicio o por WhatsApp dentro de los 30 días naturales. Necesitamos tu RFC y correo electrónico. La enviamos en PDF." },
      { id: "caja_4", pregunta: "¿Aceptan seguros privados?",   respuesta: "Sí, trabajamos con seguros de gastos médicos mayores. El proceso depende de tu póliza; nuestro equipo te orienta en caja para la autorización." },
      { id: "caja_5", pregunta: "¿Tienen precios de lista?",    respuesta: "Sí, contamos con lista de precios para consultas y estudios. Para procedimientos quirúrgicos la cotización es personalizada. Con gusto un asesor te informa." },
    ],
  },
};

const BIENVENIDA_IMAGEN = "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=800&q=80";
const BIENVENIDA_TEXTO  =
  "👁️ *Bienvenido al Centro Ocular Especializado — COE*\n\n" +
  "Acabas de ingresar al lugar indicado para el cuidado de tus ojos.\n\n" +
  "Selecciona el área con la que deseas comunicarte 👇";

module.exports = { AREAS, BIENVENIDA_IMAGEN, BIENVENIDA_TEXTO };
