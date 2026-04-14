// =============================================================
// data.js — Knowledge Wall v2 · Gestión Ambiental
//
// CAMBIOS v2:
//  • Soporte para N grupos dinámicos (hasta 5 por sesión)
//  • Pesos de calificación configurables por categoría
//  • Las notas NO muestran su texto — se revelan al azar
//  • El estado guarda el match actual (qué dos grupos compiten)
// =============================================================

const WALL_DATA = {

  // ── Configuración general ──────────────────────────────────
  config: {
    title:       "Transporte y Dispersión de los Contaminantes",
    subtitle:    "Tratamiento y Corrección de la Contaminación",
    institution: "Universidad de Córdoba · Ingeniería Industrial",
    course:      "Gestión Ambiental",
    sheetsUrl:   "https://script.google.com/macros/s/AKfycbz4eahszenqYQXKK4X2Jtiu4dPEhbNmmWzVB6Tv5oZxUT3UjBbAqQVT7Wu1DTfqWbGbIA/exec",
    // ── RONDAS: lista de pares de IDs de grupo que se enfrentan
    // Ejemplo: [["G1","G3"],["G3","G2"],["G2","G1"]]
    // Se puede editar aquí o desde la UI de configuración
    rounds: [
      ["G3", "G4"],
      ["G5", "G3"],
      ["G4", "G5"],
      ["G3", "G2"],
      ["G2", "G4"],
      ["G5", "G2"],
    ],
  },

  // ── Pesos de puntos por categoría (editables desde UI) ────
  // Multiplicador sobre el puntaje base de cada nota
  weights: {
    glosario:    1.0,
    proceso:     1.0,
    tratamiento: 1.0,
    concepto:    1.0,
    articulo:    1.0,
    reto:        1.0,
  },

  // ── Grupos del salón (dinámicos — se pueden agregar/quitar) ─
  // id: clave interna · name: nombre visible · color: hex
  groups: [
    { id: "G1", name: "Grupo 1",  color: "#7b1c1c", score: 0 },
    { id: "G2", name: "Grupo 2",  color: "#1a3a5c", score: 0 },
    { id: "G3", name: "Grupo 3",  color: "#15803d", score: 0 },
    { id: "G4", name: "Grupo 4",  color: "#854d0e", score: 0 },
    { id: "G5", name: "Grupo 5",  color: "#5b21b6", score: 0 },
  ],

  // ── Notas del tablero ──────────────────────────────────────
  // IMPORTANTE: las notas se barajarán al iniciar; la UI
  // muestra solo "???" en la tarjeta hasta que se revela.
  notes: [
    // ── GLOSARIO (10 notas) ──────────────────────────────
    {
      id: 1, category: "glosario", basePoints: 100, label: "GLOSARIO",
      front: "Define\nLIXIVIACIÓN",
      answer: "Proceso por el cual el agua se filtra a través del suelo transportando nutrientes disueltos y contaminantes hacia masas de agua subterráneas o superficiales.",
      hint: "Relacionado con lluvias intensas y suelos porosos.",
    },
    {
      id: 2, category: "glosario", basePoints: 100, label: "GLOSARIO",
      front: "Define\nADVECCIÓN",
      answer: "Transporte de una sustancia en un fluido debido a su movimiento masivo. Es el mecanismo de transporte horizontal en la atmósfera.",
      hint: "Movimiento horizontal. Piensa en el viento transportando gases.",
    },
    {
      id: 3, category: "glosario", basePoints: 100, label: "GLOSARIO",
      front: "Define\nTURBULENCIA ATMOSFÉRICA",
      answer: "Movimientos irregulares del aire a pequeña escala, provocados por vientos que varían en velocidad y dirección. Ayuda a dispersar contaminantes.",
      hint: "Los edificios y bosques la generan a escala local.",
    },
    {
      id: 4, category: "glosario", basePoints: 100, label: "GLOSARIO",
      front: "Define\nPLUMA",
      answer: "Flujo disperso de contaminante que se libera desde una fuente puntual hacia la atmósfera o cuerpos de agua.",
      hint: "Como el humo de una chimenea viéndose desde lejos.",
    },
    {
      id: 5, category: "glosario", basePoints: 100, label: "GLOSARIO",
      front: "Define\nCONVECCIÓN",
      answer: "Movimiento vertical del aire generado por diferencias de temperatura. Permite el transporte vertical de contaminantes.",
      hint: "El calor sube. Contrario a la advección que es horizontal.",
    },
    {
      id: 6, category: "glosario", basePoints: 100, label: "GLOSARIO",
      front: "¿Qué es la\nINVERSIÓN TÉRMICA?",
      answer: "Condición atmosférica donde una capa de aire caliente actúa como 'tapa', impidiendo que los contaminantes se eleven. Causa acumulación de smog cerca de la superficie.",
      hint: "Ocurre cuando la temperatura aumenta con la altura (al revés de lo normal).",
    },
    {
      id: 7, category: "glosario", basePoints: 100, label: "GLOSARIO",
      front: "Define\nBIORREMEDIACIÓN",
      answer: "Técnica que utiliza microorganismos como bacterias y hongos para degradar contaminantes orgánicos, transformándolos en compuestos menos dañinos.",
      hint: "Bio = vida. Usa seres vivos para limpiar el suelo.",
    },
    {
      id: 8, category: "glosario", basePoints: 100, label: "GLOSARIO",
      front: "Define\nFITORREMEDIACIÓN",
      answer: "Técnica que emplea plantas capaces de absorber, acumular o transformar contaminantes. Útil en suelos con metales pesados o hidrocarburos.",
      hint: "Fito = planta. Más lenta pero económica y sostenible.",
    },
    {
      id: 9, category: "glosario", basePoints: 100, label: "GLOSARIO",
      front: "Define\nDEPOSICIÓN",
      answer: "Proceso que permite que las sustancias pasen de la atmósfera al suelo o al agua. Puede ser húmeda (lluvia) o seca (sedimentación de partículas).",
      hint: "La lluvia 'limpia' el aire porque hace esto.",
    },
    {
      id: 10, category: "glosario", basePoints: 100, label: "GLOSARIO",
      front: "Define\nADSORCIÓN",
      answer: "Proceso por el cual algunos contaminantes quedan retenidos en la superficie del suelo, limitando su movilidad aunque sin eliminarlos.",
      hint: "El suelo 'atrapa' al contaminante en su superficie.",
    },
    // ── PROCESOS (8 notas) ───────────────────────────────
    {
      id: 11, category: "proceso", basePoints: 200, label: "PROCESO",
      front: "¿Qué factores\nMETEOROLÓGICOS\nafectan el transporte?",
      answer: "El viento (dirección y velocidad), la humedad y precipitación (lavado de partículas) y la radiación solar (forma contaminantes secundarios).",
      hint: "Piensa en las condiciones del clima que cambian cada día.",
    },
    {
      id: 12, category: "proceso", basePoints: 200, label: "PROCESO",
      front: "¿Cómo afecta\nla TOPOGRAFÍA\na la contaminación?",
      answer: "Los valles actúan como muros que impiden la dispersión lateral, atrapando el smog. Los edificios y bosques generan turbulencia que dispersa contaminantes localmente.",
      hint: "¿Por qué ciudades como Medellín tienen más smog en ciertos días?",
    },
    {
      id: 13, category: "proceso", basePoints: 200, label: "PROCESO",
      front: "Diferencia entre\nTRANSPORTE\ny DISPERSIÓN",
      answer: "El transporte es el movimiento físico del contaminante desde su fuente. La dispersión es el proceso de dilución, mezcla y distribución en el medio.",
      hint: "Uno se mueve, el otro se expande.",
    },
    {
      id: 14, category: "proceso", basePoints: 200, label: "PROCESO",
      front: "¿Cómo se\ntransportan\ncontaminantes en RÍOS?",
      answer: "A través del movimiento del agua que arrastra contaminantes a grandes distancias. La dispersión ocurre por mezcla y difusión dentro del cuerpo de agua.",
      hint: "El río no espera: lleva lo que cae en él muy lejos.",
    },
    {
      id: 15, category: "proceso", basePoints: 200, label: "PROCESO",
      front: "¿Qué papel juega\nla POROSIDAD\ndel suelo?",
      answer: "Suelos arenosos (alta porosidad) permiten transporte rápido hacia acuíferos. Suelos arcillosos (baja permeabilidad) actúan como filtro, retardando el movimiento.",
      hint: "Arena vs. arcilla: ¿cuál deja pasar el agua más rápido?",
    },
    {
      id: 16, category: "proceso", basePoints: 200, label: "PROCESO",
      front: "¿Qué son los\ncontaminantes\nSECUNDARIOS?",
      answer: "Contaminantes formados en la atmósfera cuando la radiación solar activa reacciones químicas con contaminantes primarios (NOx + COV = ozono troposférico / smog fotoquímico).",
      hint: "No salen directamente de la fuente, se 'fabrican' en el aire.",
    },
    {
      id: 17, category: "proceso", basePoints: 200, label: "PROCESO",
      front: "¿Qué es la\nVOLATILIZACIÓN\ny para qué sirve?",
      answer: "Proceso por el cual contaminantes del suelo o agua se convierten en gas y regresan a la atmósfera. Conecta el ciclo entre los medios ambientales.",
      hint: "El movimiento inverso a la deposición.",
    },
    {
      id: 18, category: "proceso", basePoints: 200, label: "PROCESO",
      front: "Estudio de\nVALLEDUPAR:\n¿qué vehículo emite\nmás CO y PM10?",
      answer: "Las motocicletas emiten la mayor cantidad de CO y PM10. Los automóviles particulares lideran en SOx, NOx, CO2 y N2O.",
      hint: "Son los vehículos de dos ruedas más comunes en ciudades intermedias.",
    },
    // ── TRATAMIENTO (8 notas) ────────────────────────────
    {
      id: 19, category: "tratamiento", basePoints: 200, label: "TRATAMIENTO",
      front: "3 etapas del\ntratamiento de\nAGUAS RESIDUALES",
      answer: "1) Primario: procesos físicos (sedimentación, filtración). 2) Secundario: degradación biológica por microorganismos (30-60% materia orgánica). 3) Terciario: elimina nutrientes, metales pesados y patógenos específicos.",
      hint: "Físico → Biológico → Avanzado.",
    },
    {
      id: 20, category: "tratamiento", basePoints: 200, label: "TRATAMIENTO",
      front: "¿Qué es la\nBIOFILTRACIÓN\ndel AIRE?",
      answer: "Tecnología basada en microorganismos que degradan contaminantes del aire de forma natural. Especialmente útil para olores y ácido sulfhídrico. Es económica y ambientalmente sostenible.",
      hint: "Alternativa ecológica a los tratamientos químicos para el aire.",
    },
    {
      id: 21, category: "tratamiento", basePoints: 200, label: "TRATAMIENTO",
      front: "¿Qué son los\nSCRUBBERS\no lavadores de gas?",
      answer: "Sistemas tecnológicos que permiten eliminar partículas, aerosoles y compuestos solubles del aire. Contribuyen al cumplimiento de normativas ambientales.",
      hint: "Como una 'ducha' para el aire contaminado de industrias.",
    },
    {
      id: 22, category: "tratamiento", basePoints: 200, label: "TRATAMIENTO",
      front: "Diferencia entre\nIN SITU\ny EX SITU",
      answer: "In situ: tratamiento en el lugar de la contaminación sin excavar. Ex situ: se excava el suelo y se trata fuera del sitio. La elección depende del contaminante, concentración y características del suelo.",
      hint: "¿Hay que mover la tierra o no?",
    },
    {
      id: 23, category: "tratamiento", basePoints: 200, label: "TRATAMIENTO",
      front: "¿Cómo funcionan\nlos TRATAMIENTOS\nTÉRMICOS del suelo?",
      answer: "Aplican altas temperaturas para destruir o volatilizar contaminantes. Logran alta descontaminación en poco tiempo, pero son costosos y energéticamente intensivos.",
      hint: "Efectivos pero caros. La rapidez tiene un precio.",
    },
    {
      id: 24, category: "tratamiento", basePoints: 200, label: "TRATAMIENTO",
      front: "¿Qué eliminan\nla COAGULACIÓN\ny FLOCULACIÓN?",
      answer: "Agrupan partículas finas del agua para facilitar su eliminación. La coagulación neutraliza cargas eléctricas; la floculación une esas partículas en flóculos más grandes que sedimentan.",
      hint: "De pequeñas partículas invisibles a grupos que caen al fondo.",
    },
    {
      id: 25, category: "tratamiento", basePoints: 200, label: "TRATAMIENTO",
      front: "¿Qué es la\nREDUCCIÓN\nCATALÍTICA (SCR)?",
      answer: "Sistema de reducción catalítica selectiva (SCR): tecnología avanzada para tratamiento del aire que transforma contaminantes como NOx en compuestos menos dañinos mediante catalizadores.",
      hint: "Se usa mucho en industrias con emisiones de óxidos de nitrógeno.",
    },
    {
      id: 26, category: "tratamiento", basePoints: 200, label: "TRATAMIENTO",
      front: "Diferencia entre\nTRATAMIENTO\ny CORRECCIÓN\nambiental",
      answer: "El tratamiento reduce o neutraliza los contaminantes ya generados. La corrección busca restaurar las condiciones originales o aceptables del medio afectado. Son complementarios.",
      hint: "Uno mitiga, el otro restaura.",
    },
    // ── CONCEPTOS (6 notas) ──────────────────────────────
    {
      id: 27, category: "concepto", basePoints: 150, label: "CONCEPTO",
      front: "¿Qué es el\nMODELO\nHYSPLIT?",
      answer: "Hybrid Single Particle Lagrangian Integrated Trajectory: modelo computacional que simula la trayectoria de partículas en la atmósfera. Se usó en Valledupar para predecir hacia dónde se mueven los contaminantes según la estación climática.",
      hint: "Se usó para saber si los contaminantes van al norte o al sur.",
    },
    {
      id: 28, category: "concepto", basePoints: 150, label: "CONCEPTO",
      front: "¿Qué propone el\nMODELO DE CIUDAD\nCAMINABLE?",
      answer: "Reducir el uso del automóvil, promover movilidad peatonal y en bicicleta, rehabilitar espacios públicos y áreas verdes. Demostró reducción de contaminación auditiva en el Centro Histórico de Ciudad de México.",
      hint: "Menos carros, más pies y bicicletas, menos ruido.",
    },
    {
      id: 29, category: "concepto", basePoints: 150, label: "CONCEPTO",
      front: "¿Cuántas muertes\ncausó la contaminación\nen Colombia (2015)?",
      answer: "10.527 muertes y 67,8 millones de síntomas/enfermedades. Los gastos económicos relacionados representaron el 1,593% del PIB en 2015.",
      hint: "Datos del Departamento Nacional de Planeación de Colombia.",
    },
    {
      id: 30, category: "concepto", basePoints: 150, label: "CONCEPTO",
      front: "¿Hacia dónde van\nlos contaminantes en\nVALLEDUPAR según\nla temporada?",
      answer: "Temporada lluviosa → Noreste. Temporada seca → Sureste. El patrón cambia porque los vientos varían entre estaciones.",
      hint: "La lluvia y la sequía cambian la dirección del viento.",
    },
    {
      id: 31, category: "concepto", basePoints: 150, label: "CONCEPTO",
      front: "¿Qué % del parque\nvehicular creció en\nciudades intermedias\ncolombianas desde 2008?",
      answer: "74% de crecimiento en el parque vehicular registrado de ciudades como Valledupar desde 2008. Esto las convierte en focos crecientes de contaminación urbana.",
      hint: "Casi duplicó en menos de 20 años.",
    },
    {
      id: 32, category: "concepto", basePoints: 150, label: "CONCEPTO",
      front: "¿Qué es la\nCONTAMINACIÓN\nAUDITIVA?",
      answer: "Todo sonido indeseable que afecta o perjudica a las personas. Causada por transporte, construcción, crecimiento poblacional. Provoca estrés y afecta la salud física y mental.",
      hint: "El ruido también es contaminación, aunque no se vea.",
    },
    // ── ARTÍCULO (4 notas) ───────────────────────────────
    {
      id: 33, category: "articulo", basePoints: 150, label: "ARTÍCULO",
      front: "¿Qué software\nusó el estudio de\nVALLEDUPAR para\nestimar emisiones?",
      answer: "Software IVE (International Vehicle Emissions), que estima emisiones de contaminantes criterio y gases de efecto invernadero según el tipo de vehículo y combustible.",
      hint: "Sus siglas en inglés significan 'Emisiones Internacionales de Vehículos'.",
    },
    {
      id: 34, category: "articulo", basePoints: 150, label: "ARTÍCULO",
      front: "¿Qué % de las\nemisiones en Bogotá\ny Medellín son\nde vehículos?",
      answer: "Bogotá: 78% de emisiones contaminantes son vehiculares. Medellín: 81%. Las fuentes móviles dominan la contaminación urbana en Colombia.",
      hint: "La mayor parte sale de los tubos de escape.",
    },
    {
      id: 35, category: "articulo", basePoints: 150, label: "ARTÍCULO",
      front: "Según la OMS:\n¿cuántas muertes\ncausa el aire\ncontaminado\nglobalmente?",
      answer: "Una de cada 8 muertes a nivel mundial se debe a la contaminación del aire, según la Organización Mundial de la Salud.",
      hint: "12.5% de todas las muertes en el mundo.",
    },
    {
      id: 36, category: "articulo", basePoints: 150, label: "ARTÍCULO",
      front: "¿Qué acciones propone\nel artículo sobre\nCONTAMINACIÓN\nAUDITIVA?",
      answer: "Construir polígono peatonal/ciclista, elaborar mapa de ruido, colocar barreras naturales (árboles), integrar planeación urbana con cuidado ambiental.",
      hint: "Soluciones urbanas para reducir el ruido en la ciudad.",
    },
    // ── RETO DOBLE (4 notas, valen el doble) ────────────
    {
      id: 37, category: "reto", basePoints: 400, label: "RETO ×2",
      front: "RETO DOBLE\nExplica el ciclo\nCOMPLETO de un\ncontaminante desde\nsu emisión hasta\nsu depósito final",
      answer: "Emisión desde fuente → Transporte (advección horizontal) → Dispersión (turbulencia) → Posible transformación (fotoquímica) → Deposición (húmeda o seca) → Lixiviación al suelo → Adsorción o transporte a acuíferos.",
      hint: "Recorre todos los medios: aire → suelo → agua.",
    },
    {
      id: 38, category: "reto", basePoints: 400, label: "RETO ×2",
      front: "RETO DOBLE\nCompara biorremediación\nvs. fitorremediación:\nventajas y limitaciones\nde cada una",
      answer: "Biorremediación: usa microorganismos, más rápida, optimizable con bioestimulación/bioaumentación, ideal para contaminantes orgánicos. Fitorremediación: usa plantas, más lenta, bajo costo, mínimo impacto, útil para metales pesados e hidrocarburos.",
      hint: "Ambas son biológicas y sostenibles, pero con velocidades y usos distintos.",
    },
    {
      id: 39, category: "reto", basePoints: 400, label: "RETO ×2",
      front: "RETO DOBLE\nMenciona 3 tecnologías\nde tratamiento del AIRE\ny explica brevemente\ncómo funciona cada una",
      answer: "1) Oxidación catalítica: destruye contaminantes con catalizador. 2) Biofiltración: microorganismos degradan olores. 3) Scrubbers/lavadores: eliminan partículas y aerosoles con agua. Bonus: SCR reduce NOx.",
      hint: "Piensa en distintos tipos: química, biológica y física.",
    },
    {
      id: 40, category: "reto", basePoints: 400, label: "RETO ×2",
      front: "RETO DOBLE\n¿Por qué la\ncontaminación\nno se queda\ndonde se genera?\nExplica con ejemplos",
      answer: "Porque el viento (advección), la lluvia (deposición húmeda) y los ríos transportan los contaminantes a zonas alejadas. Ej: contaminantes de Valledupar viajan 100s de km según el viento estacional; lluvia ácida afecta bosques lejos de las fábricas.",
      hint: "La contaminación no conoce fronteras administrativas.",
    },
  ],
};

// =============================================================
// Calcular puntos reales aplicando el peso de la categoría
// =============================================================
function calcPoints(note) {
  const w = WALL_DATA.weights[note.category] ?? 1.0;
  return Math.round(note.basePoints * w);
}

// =============================================================
// ESTADO GLOBAL
// =============================================================
const WALL_STATE = {
  revealed:    new Set(),   // IDs de notas ya reveladas (en este match)
  scores:      {},          // { groupId: points } — puntaje del match actual
  activeGroup: null,        // ID del grupo cuyo turno es ahora
  activeNote:  null,        // nota abierta en el modal
  shuffledIds: [],          // orden barajado de IDs de notas

  // Match actual: qué dos grupos se enfrentan
  matchGroupA: null,
  matchGroupB: null,

  // Puntajes acumulados por grupo en todas las rondas
  totalScores: {},          // { groupId: points }
};

// =============================================================
// Barajar notas (Fisher-Yates)
// =============================================================
function shuffleNotes() {
  const ids = WALL_DATA.notes.map(n => n.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  WALL_STATE.shuffledIds = ids;
}

// =============================================================
// Persistencia localStorage
// =============================================================
function loadWallState() {
  try {
    const s = localStorage.getItem("kwall_state_v2");
    if (!s) return;
    const p = JSON.parse(s);
    if (p.revealed)     WALL_STATE.revealed     = new Set(p.revealed);
    if (p.scores)       WALL_STATE.scores        = p.scores;
    if (p.activeGroup)  WALL_STATE.activeGroup   = p.activeGroup;
    if (p.shuffledIds && p.shuffledIds.length)
                        WALL_STATE.shuffledIds   = p.shuffledIds;
    if (p.matchGroupA)  WALL_STATE.matchGroupA   = p.matchGroupA;
    if (p.matchGroupB)  WALL_STATE.matchGroupB   = p.matchGroupB;
    if (p.totalScores)  WALL_STATE.totalScores   = p.totalScores;
    if (p.weights)      WALL_DATA.weights        = p.weights;
  } catch(e) {}
}

function saveWallState() {
  localStorage.setItem("kwall_state_v2", JSON.stringify({
    revealed:    [...WALL_STATE.revealed],
    scores:      WALL_STATE.scores,
    activeGroup: WALL_STATE.activeGroup,
    shuffledIds: WALL_STATE.shuffledIds,
    matchGroupA: WALL_STATE.matchGroupA,
    matchGroupB: WALL_STATE.matchGroupB,
    totalScores: WALL_STATE.totalScores,
    weights:     WALL_DATA.weights,
  }));
}
