// Todos los números de balance del juego viven aquí y en ningún otro sitio.
// Si una constante numérica aparece en engine/ o ui/, es un bug.

export const BALANCE = Object.freeze({
  objetivoTerritorio: 15,

  manoInicial: 4,
  manoMaxima: 6,

  recursosIniciales: Object.freeze({ biomasa: 4, agua: 2, territorio: 0 }),
  // Compensación del segundo jugador (§9 de la spec).
  compensacionSegundoJugador: Object.freeze({ biomasa: 0, agua: 0, cartas: 0 }),

  robo: Object.freeze({ normal: 1, sinZonas: 2 }),

  // Las bajas salen del juego en vez de volver al descarte: cada muerte acerca
  // al rival a la extinción, que es la segunda vía de derrota (D4). Con `false`
  // se recupera el ciclo mazo→descarte→mazo de la spec original.
  muertePermanente: true,

  // D3: suelo de ingreso de Biomasa. Con 0 se reproduce la spec literal.
  ingresoMinimoBiomasa: 2,

  maxDesplieguesPorZona: 2,

  // La baraja estacional empieza a voltearse en este turno.
  turnoPrimeraEstacion: 4,

  // Tope duro del simulador. Una partida que lo alcanza se reporta como
  // "sin decisión": es una métrica de diseño, no un final legítimo.
  limiteTurnos: 40,

  zonas: Object.freeze([
    Object.freeze({ id: 1, nombre: 'Llanura de inundación', biomasa: 3, agua: 0, territorio: 0 }),
    Object.freeze({ id: 2, nombre: 'Canal fluvial trenzado', biomasa: 1, agua: 3, territorio: 0 }),
    Object.freeze({ id: 3, nombre: 'Bosque de coníferas ribereño', biomasa: 2, agua: 1, territorio: 0 }),
    Object.freeze({ id: 4, nombre: 'Sabana de helechos', biomasa: 1, agua: 0, territorio: 2 }),
  ]),

  // Adyacencia lineal siguiendo el gradiente de humedad (P5, default).
  adyacencia: Object.freeze({ 1: [2], 2: [1, 3], 3: [2, 4], 4: [3] }),

  // Zonas a las que apunta un rasgo por su id, para no dejar el número suelto
  // dentro de la lógica.
  zonasEspeciales: Object.freeze({ canalFluvial: 2, sabanaHelechos: 4 }),

  // Magnitud de cada rasgo. El texto de la carta vive en data/cards.js;
  // el número que el motor aplica vive aquí, para poder recalibrar sin tocar
  // la lógica.
  rasgos: Object.freeze({
    riberenoPoder: 2,
    gregarioPoderPorCompanero: 1,
    gregarismoPoder: 1,
    crecimientoPoder: 2,
    ramoneoBajoBiomasa: 1,
    gastrolitosBiomasa: 1,
    oportunistaBiomasaPorMuerte: 1,
    depredadorDominanteBajasExtra: 1,
    tagomizadorBajas: 1,
    masaColosalCargas: 1,
  }),

  estacion: Object.freeze({
    crecida: Object.freeze({ zonasDuplicadas: [1, 2], zonaRecargo: 4, recargo: 1 }),
  }),

  // Composición del mazo (§9). 20 cartas por bando, idéntico para ambos.
  mazo: Object.freeze([
    Object.freeze(['dryosaurus', 3]),
    Object.freeze(['ornitholestes', 2]),
    Object.freeze(['stegosaurus', 2]),
    Object.freeze(['diplodocus', 2]),
    Object.freeze(['camarasaurus', 2]),
    Object.freeze(['apatosaurus', 1]),
    Object.freeze(['ceratosaurus', 2]),
    Object.freeze(['allosaurus', 2]),
    Object.freeze(['torvosaurus', 1]),
    Object.freeze(['gregarismo', 1]),
    Object.freeze(['gastrolitos', 1]),
    Object.freeze(['crecimiento_acelerado', 1]),
  ]),

  // Pesos de la IA heurística (§11). La fórmula de la spec es
  //   valor = produccion_zona × P(ganar_zona) + territorio_zona × peso_fase − coste
  // implementada en su forma MARGINAL: lo que cuenta no es la probabilidad de
  // ganar la zona, sino cuánto la sube esta carta. Así no se apila en zonas ya
  // ganadas ni se tiran cartas a zonas perdidas.
  ia: Object.freeze({
    escalaPoder: 2.6,          // pendiente de la sigmoide de P(ganar zona)
    // Dominar una zona paga TODOS los turnos que se conserve, mientras que la
    // Biomasa se paga una sola vez. Sin este horizonte la IA se vuelve avara y
    // no despliega: es el error que delató la primera corrida (7,2 cartas por
    // partida frente a las 15,5 de la aleatoria).
    horizonte: 4,
    pesoProduccion: 1,
    valorAgua: 0.55,           // 1 de Agua vale menos que 1 de Biomasa
    pesoTerritorioBase: 2.2,   // al principio de la partida
    pesoTerritorioFinal: 5,    // cerca del umbral, el Territorio manda
    pesoCoste: 0.85,
    amenazaPorBiomasa: 0.75,   // Poder que el rival puede poner por Biomasa
    fraccionAmenazaZona: 0.4,  // fracción de su Biomasa que dedicará a esta zona
    descuentoCrecimiento: 0.55, // Crecimiento acelerado no puntúa hasta el turno siguiente
    umbralJugar: 0.05,          // por debajo de este valor, pasa
    perfiles: Object.freeze({
      aleatoria: null,
      // Sobrepondera la Sabana de helechos.
      territorial: Object.freeze({ favoritas: [4], multiplicador: 2.1, pesoTerritorio: 1.5, pesoProduccion: 1 }),
      // Sobrepondera Llanura y Bosque: asfixia por recursos.
      economista: Object.freeze({ favoritas: [1, 3], multiplicador: 1.9, pesoTerritorio: 1, pesoProduccion: 1.6 }),
      // Refuerza donde está perdiendo, que tras la resolución es exactamente
      // donde perdió el turno anterior.
      reactiva: Object.freeze({ favoritas: [], multiplicador: 1, pesoTerritorio: 1, pesoProduccion: 1,
        bonusZonaPerdida: 1.7, bonusDisputada: 1.25 }),
    }),
  }),

  mazoEstacional: Object.freeze([
    Object.freeze(['SEQUIA', 3]),
    Object.freeze(['CRECIDA', 3]),
  ]),
});

export const TOTAL_MAZO = BALANCE.mazo.reduce((n, [, copias]) => n + copias, 0);
