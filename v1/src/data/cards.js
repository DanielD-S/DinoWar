// Definiciones de carta. Inmutables: nunca se copian ni se mutan.
// El estado propio de cada carta en juego vive en las instancias (engine/state.js).
//
// RESTRICCIÓN DURA (§2 de la spec): todos los taxones existen, están descritos
// formalmente, y proceden de la Formación Morrison (Jurásico Superior,
// Kimmeridgiense–Titoniense). Ningún híbrido, ninguna especie inventada,
// ningún anacronismo. `nivel_evidencia` califica al RASGO, no al taxón.

export const EVIDENCIA = Object.freeze({
  ESTABLECIDO: 'ESTABLECIDO',
  INFERIDO: 'INFERIDO',
  DEBATIDO: 'DEBATIDO',
});

export const TIPO = Object.freeze({
  DINOSAURIO: 'DINOSAURIO',
  ADAPTACION: 'ADAPTACION',
});

export const RASGO = Object.freeze({
  DEPREDADOR_DOMINANTE: 'DEPREDADOR_DOMINANTE',
  RIBERENO: 'RIBERENO',
  ESCASO: 'ESCASO',
  OPORTUNISTA: 'OPORTUNISTA',
  MASA_COLOSAL: 'MASA_COLOSAL',
  RAMONEO_BAJO: 'RAMONEO_BAJO',
  MIGRADOR: 'MIGRADOR',
  TAGOMIZADOR: 'TAGOMIZADOR',
  GREGARIO: 'GREGARIO',
  GREGARISMO: 'GREGARISMO',
  GASTROLITOS: 'GASTROLITOS',
  CRECIMIENTO_ACELERADO: 'CRECIMIENTO_ACELERADO',
});

export const CARTAS = Object.freeze({
  allosaurus: Object.freeze({
    id: 'allosaurus',
    tipo: TIPO.DINOSAURIO,
    binomial: 'Allosaurus fragilis',
    genero: 'Allosaurus',
    poder: 5,
    coste: 4,
    consumoHidrico: 1,
    rasgo: RASGO.DEPREDADOR_DOMINANTE,
    rasgoNombre: 'Depredador dominante',
    rasgoTexto: 'Al ganar una zona, elimina un segundo dinosaurio rival de esa zona.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Taxón de terópodo más abundante de la Morrison. Marcas de mordida atribuidas a Allosaurus aparecen en huesos de saurópodos y de Stegosaurus.',
  }),

  ceratosaurus: Object.freeze({
    id: 'ceratosaurus',
    tipo: TIPO.DINOSAURIO,
    binomial: 'Ceratosaurus nasicornis',
    genero: 'Ceratosaurus',
    poder: 4,
    coste: 3,
    consumoHidrico: 2,
    rasgo: RASGO.RIBERENO,
    rasgoNombre: 'Ribereño',
    rasgoTexto: '+2 Poder en Canal fluvial.',
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: 'Menos frecuente que Allosaurus. Se ha propuesto una dieta con mayor componente de presa acuática y un uso preferente de ambientes ribereños, a partir de morfología dental y contexto de hallazgos. Hipótesis discutida.',
  }),

  torvosaurus: Object.freeze({
    id: 'torvosaurus',
    tipo: TIPO.DINOSAURIO,
    binomial: 'Torvosaurus tanneri',
    genero: 'Torvosaurus',
    poder: 6,
    coste: 6,
    consumoHidrico: 2,
    rasgo: RASGO.ESCASO,
    rasgoNombre: 'Escaso',
    rasgoTexto: 'Solo 1 copia en el mazo. Sin sinergias.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'El terópodo de mayor tamaño de la formación, pero genuinamente raro en el registro. Su escasez en el mazo replica su escasez fósil.',
  }),

  ornitholestes: Object.freeze({
    id: 'ornitholestes',
    tipo: TIPO.DINOSAURIO,
    binomial: 'Ornitholestes hermanni',
    genero: 'Ornitholestes',
    poder: 1,
    coste: 1,
    consumoHidrico: 0,
    rasgo: RASGO.OPORTUNISTA,
    rasgoNombre: 'Oportunista',
    rasgoTexto: '+1 Biomasa cada vez que muere cualquier dinosaurio en su zona.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Terópodo pequeño (~2 m). El comportamiento carroñero es una inferencia a partir de talla y analogía ecológica, no de evidencia directa.',
  }),

  apatosaurus: Object.freeze({
    id: 'apatosaurus',
    tipo: TIPO.DINOSAURIO,
    binomial: 'Apatosaurus louisae',
    genero: 'Apatosaurus',
    poder: 6,
    coste: 5,
    consumoHidrico: 3,
    rasgo: RASGO.MASA_COLOSAL,
    rasgoNombre: 'Masa colosal',
    rasgoTexto: 'Sobrevive la primera baja que le correspondería.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'La talla adulta de los diplodócidos es en sí misma la principal defensa antipredatoria. Nota: la validez de Brontosaurus como género separado sigue en discusión; el juego usa Apatosaurus.',
  }),

  diplodocus: Object.freeze({
    id: 'diplodocus',
    tipo: TIPO.DINOSAURIO,
    binomial: 'Diplodocus carnegii',
    genero: 'Diplodocus',
    poder: 4,
    coste: 4,
    consumoHidrico: 3,
    rasgo: RASGO.RAMONEO_BAJO,
    rasgoNombre: 'Ramoneo bajo',
    rasgoTexto: '+1 Biomasa de producción en su zona.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'El desgaste dental y la postura del cuello sustentan una partición de nicho por ramoneo bajo respecto de otros saurópodos coexistentes.',
  }),

  camarasaurus: Object.freeze({
    id: 'camarasaurus',
    tipo: TIPO.DINOSAURIO,
    binomial: 'Camarasaurus grandis',
    genero: 'Camarasaurus',
    poder: 5,
    coste: 5,
    consumoHidrico: 2,
    rasgo: RASGO.MIGRADOR,
    rasgoNombre: 'Migrador',
    rasgoTexto: 'Puede reubicarse a una zona adyacente en vez de desplegar. Inmune a Sequía estacional.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Análisis isotópicos de esmalte dental sugieren desplazamientos estacionales hacia tierras altas durante la estación seca, a diferencia de otros saurópodos de la misma formación. El rasgo Migrador refleja ese resultado.',
  }),

  stegosaurus: Object.freeze({
    id: 'stegosaurus',
    tipo: TIPO.DINOSAURIO,
    binomial: 'Stegosaurus stenops',
    genero: 'Stegosaurus',
    poder: 3,
    coste: 3,
    consumoHidrico: 1,
    rasgo: RASGO.TAGOMIZADOR,
    rasgoNombre: 'Tagomizador',
    rasgoTexto: 'Aunque pierda la zona, elimina un dinosaurio del bando ganador.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Una vértebra caudal de Allosaurus con una perforación compatible con una púa caudal de Stegosaurus es evidencia directa de uso defensivo del tagomizador.',
  }),

  dryosaurus: Object.freeze({
    id: 'dryosaurus',
    tipo: TIPO.DINOSAURIO,
    binomial: 'Dryosaurus altus',
    genero: 'Dryosaurus',
    poder: 1,
    coste: 1,
    consumoHidrico: 0,
    rasgo: RASGO.GREGARIO,
    rasgoNombre: 'Gregario',
    rasgoTexto: '+1 Poder por cada otro Dryosaurus en la misma zona.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Ornitópodo pequeño y cursorial. El gregarismo se infiere de acumulaciones multiindividuo, no está demostrado.',
  }),

  gregarismo: Object.freeze({
    id: 'gregarismo',
    tipo: TIPO.ADAPTACION,
    binomial: 'Gregarismo',
    poder: 0,
    coste: 2,
    consumoHidrico: 0,
    rasgo: RASGO.GREGARISMO,
    rasgoNombre: 'Gregarismo',
    rasgoTexto: 'Todos los dinosaurios de la misma especie en esa zona ganan +1 Poder.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Acumulaciones monoespecíficas en la Morrison sugieren agregación en varios taxones. La interpretación de estos yacimientos es discutida (¿manada viva o concentración tafonómica?).',
  }),

  gastrolitos: Object.freeze({
    id: 'gastrolitos',
    tipo: TIPO.ADAPTACION,
    binomial: 'Gastrolitos',
    poder: 0,
    coste: 2,
    consumoHidrico: 0,
    rasgo: RASGO.GASTROLITOS,
    rasgoNombre: 'Gastrolitos',
    rasgoTexto: 'El dinosaurio objetivo aporta +1 Biomasa de producción mientras siga en juego.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Piedras de molleja asociadas a esqueletos de saurópodos jurásicos. Su función exacta en la digestión sigue en debate.',
  }),

  crecimiento_acelerado: Object.freeze({
    id: 'crecimiento_acelerado',
    tipo: TIPO.ADAPTACION,
    binomial: 'Crecimiento acelerado',
    poder: 0,
    coste: 3,
    consumoHidrico: 0,
    rasgo: RASGO.CRECIMIENTO_ACELERADO,
    rasgoNombre: 'Crecimiento acelerado',
    rasgoTexto: 'El dinosaurio objetivo gana +2 Poder permanente si sobrevive al turno en que se juega.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'La osteohistología muestra tasas de crecimiento altas y sostenidas en saurópodos y en Allosaurus, alcanzando talla adulta en pocas décadas o menos.',
  }),
});

export const ESTACIONES = Object.freeze({
  SEQUIA: Object.freeze({
    id: 'SEQUIA',
    nombre: 'Sequía estacional',
    texto: 'Cada dinosaurio en juego debe pagar su Consumo hídrico en Agua. Los que no se puedan pagar mueren. Camarasaurus es inmune.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Los paleosuelos, los depósitos evaporíticos y la estructura de los yacimientos de la Morrison indican un clima marcadamente estacional, semiárido, con precipitación concentrada. Algunas acumulaciones óseas se han interpretado como mortandades asociadas a sequía o a eventos de crecida.',
  }),
  CRECIDA: Object.freeze({
    id: 'CRECIDA',
    nombre: 'Crecida monzónica',
    texto: 'Llanura de inundación y Canal fluvial duplican su producción este turno. Desplegar en Sabana de helechos cuesta +1 Biomasa.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Los paleosuelos, los depósitos evaporíticos y la estructura de los yacimientos de la Morrison indican un clima marcadamente estacional, semiárido, con precipitación concentrada. Algunas acumulaciones óseas se han interpretado como mortandades asociadas a sequía o a eventos de crecida.',
  }),
});

/** Constante 0: el único dinosaurio inmune a la Sequía es Camarasaurus. */
export const INMUNE_SEQUIA = Object.freeze(['camarasaurus']);

export function carta(cardId) {
  const c = CARTAS[cardId];
  if (!c) throw new Error(`Carta desconocida: ${cardId}`);
  return c;
}
