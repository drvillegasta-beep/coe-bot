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
    id: "consultas", nombre: "Agendar una cita", emoji: "",
    descripcion: "Primera vez, seguimiento o revisión",
    whatsapp: process.env.WA_NUM_CONSULTAS || "5213361110001",
    agente: "Recepción COE",
    imagen: process.env.IMG_CONSULTAS || "https://i.ibb.co/KjVnWpgQ/consultas.jpg",
    flujoEspecial: "intake_cita",
  },

  cirugia: {
    id: "cirugia", nombre: "Cirugía", emoji: "",
    descripcion: "Catarata, retina y corrección de visión",
    whatsapp: process.env.WA_NUM_CIRUGIA || "5213361110002",
    agente: "Área de Cirugía",
    imagen: process.env.IMG_CIRUGIA || "https://i.ibb.co/1fDhpR81/cirugia.jpg",
    faqs: [
      { id:"cir_1", pregunta:"Programar mi cirugía", flujoEspecial:"intake_cirugia" },
      { id:"cir_2", pregunta:"Duración de la cirugía",
        respuesta:"El tiempo depende del tipo de operación.\n\nUna cirugía de catarata o corrección de visión dura entre 15 y 30 minutos.\n\nOtros procedimientos pueden tomar hasta 2 horas.\n\nSu médico le indicará el tiempo exacto según su caso." },
      { id:"cir_3", pregunta:"Si duele la cirugía",
        respuesta:"No. Se aplica anestesia para que no sienta dolor durante la operación.\n\nDespués de la cirugía le daremos medicamentos para estar cómodo en casa.\n\nSu bienestar es lo más importante para nosotros." },
      { id:"cir_4", pregunta:"Graduaciones que se corrigen",
        respuesta:"Con cirugía podemos corregir:\n\n- Miopía: dificultad para ver lejos\n- Hipermetropía: dificultad para ver cerca\n- Astigmatismo: visión borrosa\n- Vista cansada: dificultad para leer\n\nPrimero hacemos un estudio para saber si usted es candidato." },
      { id:"cir_5", pregunta:"Costo de la cirugía",
        respuesta:"El costo depende del tipo de cirugía y de su caso particular.\n\nCada paciente es diferente, por eso damos un presupuesto personalizado después de la valoración.\n\n¿Le gustaría agendar una cita de valoración?", botonCita: true },
      { id:"cir_6", pregunta:"Tengo dudas sobre mi operación",
        respuesta:"Es normal tener preguntas antes de una cirugía.\n\nLe recomendamos agendar una consulta y llevar sus dudas escritas para aprovechar bien la cita.\n\nEstamos aquí para explicarle todo con calma." },
    ],
  },

  optica: {
    id: "optica", nombre: "Lentes y Optica", emoji: "",
    descripcion: "Lentes graduados, armazones y lentes de contacto",
    whatsapp: process.env.WA_NUM_OPTICA || "5213361110003",
    agente: "Optica COE",
    imagen: process.env.IMG_OPTICA || "https://i.ibb.co/Lzj1gqnN/optica.jpg",
    faqs: [
      { id:"o1", pregunta:"Examen de la vista", flujoEspecial:"intake_cita" },
      { id:"o2", pregunta:"Tiempo para entregar lentes",
        respuesta:"Depende del tipo de lente:\n\n- Lentes sencillos: 3 a 5 días\n- Lentes especiales o progresivos: hasta 15 días\n\nLe avisamos cuando estén listos." },
      { id:"o3", pregunta:"Lentes de contacto",
        respuesta:"Sí tenemos lentes de contacto de varios tipos:\n\n- Desechables de uso diario\n- De uso mensual\n- Para astigmatismo\n- Para ver de cerca y lejos\n\nNuestro optometrista le ayuda a elegir el más adecuado." },
      { id:"o4", pregunta:"Garantia de los lentes",
        respuesta:"Sí, todos nuestros lentes tienen garantía por defectos de fabricación y por adaptación.\n\nPregúntenos los detalles al momento de su compra." },
    ],
  },

  farmacia: {
    id: "farmacia", nombre: "Farmacia", emoji: "",
    descripcion: "Medicamentos, gotas y recetas",
    whatsapp: process.env.WA_NUM_FARMACIA || "5213361110004",
    agente: "Farmacia COE",
    imagen: process.env.IMG_FARMACIA || "https://i.ibb.co/rRzD3MQs/farmacia.jpg",
    faqs: [
      { id:"f1", pregunta:"Si tienen mi medicamento",
        respuesta:"Contamos con medicamentos especializados para los ojos: antibióticos, antiinflamatorios, gotas lubricantes y más.\n\nPara saber si tenemos su medicamento específico, nuestro farmacéutico le puede ayudar." },
      { id:"f2", pregunta:"Si necesito receta",
        respuesta:"Algunos medicamentos requieren receta médica:\n\n- Con receta: antibióticos, esteroides, gotas para presión\n- Sin receta: lubricantes, vitaminas, solución salina\n\nSi su receta es del COE ya está en nuestro sistema." },
      { id:"f3", pregunta:"Gotas para ojos secos",
        respuesta:"Sí, tenemos varias opciones:\n\n- Monodosis sin conservadores\n- Frascos para uso frecuente\n- Geles de mayor duración\n- Ungüentos para usar de noche\n\nLe recomendamos la más adecuada según su diagnóstico." },
      { id:"f4", pregunta:"Recetas de otro médico",
        respuesta:"Sí surtimos recetas de cualquier médico.\n\nSi no tenemos el medicamento, le orientamos sobre alternativas o hacemos un pedido especial." },
      { id:"f5", pregunta:"Horario de farmacia",
        respuesta:"Lunes a Sábado de 9:00 a 18:00 horas.\n\nDomingos cerrado.\n\nEn caso de urgencia, puede presentarse directamente a la clínica." },
    ],
  },

  caja: {
    id: "caja", nombre: "Pagos y Facturas", emoji: "",
    descripcion: "Formas de pago, seguros y facturación",
    whatsapp: process.env.WA_NUM_CAJA || "5213361110005",
    agente: "Caja COE",
    imagen: process.env.IMG_CONSULTAS || "https://i.ibb.co/KjVnWpgQ/consultas.jpg",
    faqs: [
      { id:"c1", pregunta:"Formas de pago",
        respuesta:"Aceptamos:\n\n- Efectivo\n- Tarjeta de débito o crédito\n- Transferencia bancaria\n- Seguro de gastos médicos mayores" },
      { id:"c2", pregunta:"Si aceptan mi seguro",
        respuesta:"Trabajamos con las principales aseguradoras de gastos médicos mayores.\n\nPara confirmar, necesitamos el nombre de su aseguradora y número de póliza." },
      { id:"c3", pregunta:"Como pedir mi factura",
        respuesta:"Puede solicitarla en caja el mismo día o por WhatsApp dentro de los 30 días después del servicio.\n\nNecesitamos su RFC, razón social y correo electrónico.\n\nDespués de 30 días ya no es posible facturar." },
      { id:"c4", pregunta:"Pagos con seguro privado",
        respuesta:"Sí aceptamos seguros de gastos médicos mayores.\n\nAlgunos requieren autorización previa. Nuestro equipo de caja le orienta en todo el proceso." },
    ],
  },

  quejas: {
    id: "quejas", nombre: "Quejas y Sugerencias", emoji: "",
    descripcion: "Comparta su experiencia o inconformidad",
    whatsapp: process.env.WA_NUM_ADMIN || process.env.WA_ALERT_NUMBER || "5213361110006",
    agente: "Administracion COE",
    imagen: process.env.IMG_BIENVENIDA || "https://i.ibb.co/Zz6LSv0f/bienvenida.jpg",
    flujoEspecial: "intake_queja",
  },
};

const SERVICIOS = {
  cirugia_refractiva: { nombre:"Cirugia Refractiva", emoji:"", descripcion:"LASIK, TransPRK y lente ICL. Correccion de miopia, hipermetropia, astigmatismo y vista cansada." },
  cataratas:          { nombre:"Cirugia de Cataratas", emoji:"", descripcion:"Operacion con microincision. Lentes intraoculares monofocales y premium de ultima generacion." },
  retina:             { nombre:"Retina y Vitreo", emoji:"", descripcion:"Retinopatia diabetica, degeneracion macular, desprendimiento de retina. Inyecciones y vitrectomia." },
  glaucoma:           { nombre:"Glaucoma", emoji:"", descripcion:"Diagnostico con OCT y campo visual. Tratamiento con gotas, laser y cirugia." },
  cornea:             { nombre:"Cornea y Superficie Ocular", emoji:"", descripcion:"Queratocono, pterigion, ojo seco, ulceras y trasplante corneal." },
  oculoplastica:      { nombre:"Parpados y Via Lagrimal", emoji:"", descripcion:"Cirugia de parpados caidos, exceso de piel, obstruccion lagrimal." },
  optometria:         { nombre:"Optometria", emoji:"", descripcion:"Examen de la vista, adaptacion de lentes de contacto y terapia visual." },
  laboratorio_optico: { nombre:"Laboratorio Optico", emoji:"", descripcion:"Fabricacion propia de lentes. Monofocales, progresivos y con tratamientos especiales." },
  estudios:           { nombre:"Estudios Diagnosticos", emoji:"", descripcion:"OCT, topografia corneal, campo visual, biometria optica y biomecánica corneal." },
};

const BIENVENIDA_TEXTO =
  "Bienvenido al Centro Ocular Especializado.\n\n" +
  "Estamos para ayudarle con el cuidado de sus ojos.\n\n" +
  "Seleccione la opcion que necesita:";

module.exports = { AREAS, SERVICIOS, BIENVENIDA_TEXTO, esUrgencia, NUM_URGENCIAS };
