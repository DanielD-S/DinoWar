// DinoWar — definiciones de carta. Inmutables: nunca se copian ni se mutan.
//
// RESTRICCIÓN DURA (heredada de GAME_SPEC.md §2, no se relaja en la v2):
// todos los taxones existen, están descritos formalmente y proceden de la
// Formación Morrison (Jurásico Superior, Kimmeridgiense–Titoniense), así que
// pudieron coincidir en el tiempo y en el espacio. Ningún híbrido, ninguna
// especie inventada, ningún anacronismo. Ninguno lleva plumas: ninguno tiene
// evidencia tegumentaria que las respalde.
//
// `nivel_evidencia` califica al RASGO o al efecto, no a la existencia del taxón.

export const EVIDENCIA = Object.freeze({
  ESTABLECIDO: 'ESTABLECIDO',
  INFERIDO: 'INFERIDO',
  DEBATIDO: 'DEBATIDO',
});

export const TIPO = Object.freeze({
  DINOSAURIO: 'DINOSAURIO',
  EVENTO: 'EVENTO',     // te beneficia o le estorba al rival
  CLIMA: 'CLIMA',       // afecta a los dos bandos, para bien o para mal
  RECURSO: 'RECURSO',   // Biomasa inmediata a cambio de un inconveniente
  // Sólo en la variante de economía por cartas. No está en CARTAS ni sale en
  // sobres: ver CARTAS_ECONOMIA al final del fichero.
  BIOMASA: 'BIOMASA',
});

/** Sobre qué actúa un evento. Decide dónde se suelta y qué valida el motor. */
export const OBJETIVO = Object.freeze({
  PROPIO: 'PROPIO',   // un dinosaurio tuyo
  RIVAL: 'RIVAL',     // un dinosaurio del rival
  CLADO: 'CLADO',     // todos los rivales de un clado que eliges
  RIVALES: 'RIVALES', // varios dinosaurios del rival, elegidos uno a uno
  // No se elige nada: la carta cae sobre la mesa entera. Antes esto se llamaba
  // CAMPO y valía a la vez para «no tiene objetivo» y para «ocupa la ranura de
  // clima», que son cosas distintas: por eso una Mortandad se podía soltar
  // sobre la franja del clima y parecía que la estabas poniendo de clima.
  // Qué ocupa la ranura lo dice el tipo de la carta, no su objetivo.
  NINGUNO: 'NINGUNO',
});

/**
 * Rareza. Gobierna cuántas copias caben en el mazo y —cuando existan los
 * sobres— con qué frecuencia aparece. Sigue la abundancia fósil real: los
 * taxones corrientes de la Morrison son comunes, y *Torvosaurus*, genuinamente
 * raro en el registro, es legendario.
 */
export const RAREZA = Object.freeze({
  COMUN: 'COMUN', RARO: 'RARO', EPICO: 'EPICO', LEGENDARIO: 'LEGENDARIO',
});

export const RAREZA_NOMBRE = Object.freeze({
  COMUN: 'Común', RARO: 'Rara', EPICO: 'Épica', LEGENDARIO: 'Legendaria',
});

export const TIPO_NOMBRE = Object.freeze({
  DINOSAURIO: 'Dinosaurio', EVENTO: 'Evento', CLIMA: 'Clima', RECURSO: 'Recurso',
  BIOMASA: 'Biomasa',
});

/** Clados reales. El "triángulo de tipos" es una red trófica, no un capricho. */
export const CLADO = Object.freeze({
  TEROPODO: 'TEROPODO',
  SAUROPODO: 'SAUROPODO',
  TIREOFORO: 'TIREOFORO',
  ORNITOPODO: 'ORNITOPODO',
  MARGINOCEFALO: 'MARGINOCEFALO',
  // Ni pterosaurios ni marinos son dinosaurios. Están porque el set se abrió a
  // la fauna que compartía paisaje con ellos, y llevan clado propio para que la
  // ficha no mienta al llamarlos dinosaurio.
  PTEROSAURIO: 'PTEROSAURIO',
  MARINO: 'MARINO',
});

export const CLADO_NOMBRE = Object.freeze({
  TEROPODO: 'Terópodo',
  SAUROPODO: 'Saurópodo',
  TIREOFORO: 'Tireóforo',
  ORNITOPODO: 'Ornitópodo',
  MARGINOCEFALO: 'Marginocéfalo',
  PTEROSAURIO: 'Pterosaurio',
  MARINO: 'Reptil marino',
});

/**
 * Qué clados son dinosaurios de verdad. Pterosaurios y reptiles marinos entran
 * en la misma ranura y son del mismo tipo de carta, pero llamarlos dinosaurio
 * en la ficha sería decir una falsedad en la única pantalla que existe para no
 * decirlas.
 */
export const ES_DINOSAURIO = Object.freeze({
  [CLADO.TEROPODO]: true,
  [CLADO.SAUROPODO]: true,
  [CLADO.TIREOFORO]: true,
  [CLADO.ORNITOPODO]: true,
  [CLADO.MARGINOCEFALO]: true,
  [CLADO.PTEROSAURIO]: false,
  [CLADO.MARINO]: false,
});

export const RASGO = Object.freeze({
  // Sin rasgo. Una carta que sólo trae sus cifras es una carta legítima, y es
  // además el punto de partida de toda carta nueva mientras se decide qué hace.
  NINGUNO: 'NINGUNO',
  DEPREDADOR_DOMINANTE: 'DEPREDADOR_DOMINANTE',
  RIBERENO: 'RIBERENO',
  OPORTUNISTA: 'OPORTUNISTA',
  RAMONEO_BAJO: 'RAMONEO_BAJO',
  MIGRADOR: 'MIGRADOR',
  GREGARIO: 'GREGARIO',
  DESGARRO: 'DESGARRO',
  CORAZA: 'CORAZA',
  VUELO: 'VUELO',
  // Rasgos que sólo valen acompañados: piden que haya otro de los suyos —o de
  // su clado— en el campo. Antes eran bonificaciones planas.
  CAZA_EN_GRUPO: 'CAZA_EN_GRUPO',       // Ceratosaurus: hacen falta tres
  MURO_DE_PLACAS: 'MURO_DE_PLACAS',     // Stegosaurus: con otro igual
  GOLA: 'GOLA',                         // Lokiceratops: con otro igual
  MANADA: 'MANADA',                     // Apatosaurus: con otro saurópodo
  // Buscar en el propio mazo al jugar la carta.
  BUSCA_EVENTO: 'BUSCA_EVENTO',
  BUSCA_CLIMA: 'BUSCA_CLIMA',
  BUSCA_GREGARISMO: 'BUSCA_GREGARISMO',
  // adaptaciones
  GREGARISMO: 'GREGARISMO',
  GASTROLITOS: 'GASTROLITOS',
  CRECIMIENTO_ACELERADO: 'CRECIMIENTO_ACELERADO',
  NEUMATICIDAD: 'NEUMATICIDAD',
  // presiones
  TRAMPA: 'TRAMPA',
  FRACTURA: 'FRACTURA',
  COMPETENCIA: 'COMPETENCIA',
  MORTANDAD: 'MORTANDAD',
  // pulsos
  REBROTE: 'REBROTE',
  CARRONA: 'CARRONA',
  LAGO: 'LAGO',
  // campo
  CAMPO_LLANURA: 'CAMPO_LLANURA',
  CAMPO_CANAL: 'CAMPO_CANAL',
  CAMPO_BOSQUE: 'CAMPO_BOSQUE',
  CAMPO_SABANA: 'CAMPO_SABANA',
  CAMPO_ARIDEZ: 'CAMPO_ARIDEZ',
});

const dino = (o) => Object.freeze({ tipo: TIPO.DINOSAURIO, ...o });
const evento = (o) => Object.freeze({ tipo: TIPO.EVENTO, ataque: 0, vida: 0, ...o });
// Un clima no elige objetivo: ocupa la ranura de clima, y eso lo dice su tipo.
const clima = (o) => Object.freeze({ tipo: TIPO.CLIMA, ataque: 0, vida: 0, coste: 2, ...o });
// Los pulsos se juegan BOCA ARRIBA y surten efecto al instante: dar Biomasa
// "este turno" no sirve de nada si se resuelve después del despliegue. A cambio
// el rival los ve venir, que es parte de su precio.
const recurso = (o) => Object.freeze({ tipo: TIPO.RECURSO, objetivo: OBJETIVO.NINGUNO, ataque: 0, vida: 0, coste: 0, ...o });

export const CARTAS = Object.freeze({

  // ------------------------------------------------------------ dinosaurios

  dryosaurus: dino({
    id: 'dryosaurus', rareza: RAREZA.COMUN, clado: CLADO.ORNITOPODO,
    binomial: 'Dryosaurus altus',
    coste: 0, ataque: 1, vida: 2,
    rasgo: RASGO.GREGARIO, rasgoNombre: 'Gregario',
    rasgoTexto: '+1 de Ataque por cada otro Dryosaurus propio en el campo.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Ornitópodo pequeño y cursorial. El gregarismo se infiere de acumulaciones multiindividuo, no está demostrado.',
  }),

  ornitholestes: dino({
    id: 'ornitholestes', rareza: RAREZA.COMUN, clado: CLADO.TEROPODO,
    binomial: 'Ornitholestes hermanni',
    coste: 1, ataque: 2, vida: 2,
    rasgo: RASGO.OPORTUNISTA, rasgoNombre: 'Oportunista',
    rasgoTexto: '+1 Vida permanente cada vez que muere un dinosaurio en el campo.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Terópodo pequeño (~2 m). El comportamiento carroñero es una inferencia a partir de talla y analogía ecológica, no de evidencia directa.',
  }),

  ceratosaurus: dino({
    id: 'ceratosaurus', rareza: RAREZA.COMUN, clado: CLADO.TEROPODO,
    binomial: 'Ceratosaurus nasicornis',
    coste: 1, ataque: 3, vida: 3,
    rasgo: RASGO.CAZA_EN_GRUPO, rasgoNombre: 'Caza en grupo',
    rasgoTexto: '+2 de Ataque si hay tres Ceratosaurus tuyos en el campo.',
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: 'Menos frecuente que Allosaurus. Se ha propuesto una dieta con mayor componente de presa acuática y un uso preferente de ambientes ribereños, a partir de morfología dental y contexto de hallazgos. Hipótesis discutida.',
  }),

  stegosaurus: dino({
    id: 'stegosaurus', rareza: RAREZA.COMUN, clado: CLADO.TIREOFORO,
    binomial: 'Stegosaurus stenops',
    coste: 2, ataque: 1, vida: 9,
    rasgo: RASGO.MURO_DE_PLACAS, rasgoNombre: 'Muro de placas',
    rasgoTexto: '+1 de Vida si tienes otro Stegosaurus en el campo.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Una vértebra caudal de Allosaurus con una perforación compatible con una púa caudal de Stegosaurus es evidencia directa de uso defensivo del tagomizador.',
  }),

  allosaurus: dino({
    id: 'allosaurus', rareza: RAREZA.RARO, clado: CLADO.TEROPODO,
    binomial: 'Allosaurus fragilis',
    coste: 3, ataque: 5, vida: 5,
    rasgo: RASGO.DEPREDADOR_DOMINANTE, rasgoNombre: 'Depredador dominante',
    rasgoTexto: 'Si mata a su rival, el daño sobrante que pasa al hábitat enemigo se duplica.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Taxón de terópodo más abundante de la Morrison. Marcas de mordida atribuidas a Allosaurus aparecen en huesos de saurópodos y de Stegosaurus.',
  }),

  camarasaurus: dino({
    id: 'camarasaurus', rareza: RAREZA.RARO, clado: CLADO.SAUROPODO,
    binomial: 'Camarasaurus grandis',
    coste: 3, ataque: 2, vida: 7,
    rasgo: RASGO.BUSCA_EVENTO, rasgoNombre: 'Migrador',
    rasgoTexto: 'Al jugarla, busca un evento en tu mazo y llévatelo a la mano.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Análisis isotópicos de esmalte dental sugieren desplazamientos estacionales hacia tierras altas durante la estación seca, a diferencia de otros saurópodos de la misma formación. El rasgo Migrador refleja ese resultado.',
  }),

  diplodocus: dino({
    id: 'diplodocus', rareza: RAREZA.EPICO, clado: CLADO.SAUROPODO,
    binomial: 'Diplodocus carnegii',
    coste: 2, ataque: 3, vida: 13,
    rasgo: RASGO.RAMONEO_BAJO, rasgoNombre: 'Ramoneo bajo',
    rasgoTexto: 'Recupera +1 de vida al final de cada uno de tus turnos',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'El desgaste dental y la postura del cuello sustentan una partición de nicho por ramoneo bajo respecto de otros saurópodos coexistentes.',
  }),

  apatosaurus: dino({
    id: 'apatosaurus', rareza: RAREZA.EPICO, clado: CLADO.SAUROPODO,
    binomial: 'Apatosaurus louisae',
    coste: 3, ataque: 2, vida: 15,
    rasgo: RASGO.MANADA, rasgoNombre: 'Manada',
    rasgoTexto: '+1 de Vida si tienes otro saurópodo en el campo.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'La talla adulta de los diplodócidos es en sí misma la principal defensa antipredatoria. Nota: la validez de Brontosaurus como género separado sigue en discusión; el juego usa Apatosaurus.',
  }),

  torvosaurus: dino({
    id: 'torvosaurus', rareza: RAREZA.LEGENDARIO, clado: CLADO.TEROPODO,
    binomial: 'Torvosaurus tanneri',
    coste: 4, ataque: 7, vida: 6,
    rasgo: RASGO.BUSCA_CLIMA, rasgoNombre: 'Rastreador',
    rasgoTexto: 'Al jugarla, busca un clima en tu mazo y llévatelo a la mano.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'El terópodo de mayor tamaño de la formación, pero genuinamente raro en el registro. Su escasez en el mazo replica su escasez fósil.',
  }),

  // --------------------------------- fuera de la Morrison (ver README, §fauna)

  nodosaurus: dino({
    id: 'nodosaurus', rareza: RAREZA.RARO, clado: CLADO.TIREOFORO,
    binomial: 'Nodosaurus textilis',
    coste: 2, ataque: 2, vida: 8,
    rasgo: RASGO.BUSCA_GREGARISMO, rasgoNombre: 'Llamada de manada',
    rasgoTexto: 'Al jugarla, busca un Gregarismo en tu mazo y llévatelo a la mano.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Formación Frontier, Wyoming, Cenomaniense (~100 Ma). Los osteodermos en bandas sobre el dorso están documentados directamente. El taxón en sí es material fragmentario y varios autores lo tratan como nomen dubium: la coraza es firme, la especie lo es menos.',
  }),

  riparovenator: dino({
    id: 'riparovenator', rareza: RAREZA.EPICO, clado: CLADO.TEROPODO,
    binomial: 'Riparovenator milnerae',
    coste: 2, ataque: 4, vida: 5,
    rasgo: RASGO.RIBERENO, rasgoNombre: 'Ribereño',
    rasgoTexto: '+2 de ataque mientras el Canal fluvial esté en el campo.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Formación Wessex, isla de Wight, Barremiense (~125 Ma), descrito en 2021. Espinosáurido de hocico alargado y dientes cónicos, morfología asociada a capturar peces. En su pariente Baryonyx se conservaron escamas de pez en la cavidad abdominal; para este género es inferencia por morfología.',
  }),

  lokiceratops: dino({
    id: 'lokiceratops', rareza: RAREZA.EPICO, clado: CLADO.MARGINOCEFALO,
    binomial: 'Lokiceratops rangiformis',
    coste: 3, ataque: 4, vida: 8,
    rasgo: RASGO.GOLA, rasgoNombre: 'Gola ornamentada',
    rasgoTexto: '+2 de Vida si tienes otro Lokiceratops en el campo.',
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: 'Formación Judith River, Montana, Campaniense (~78 Ma), descrito en 2024. La gola lleva las mayores hojas óseas conocidas en un ceratópsido, asimétricas entre lados. Si servían para defensa, para exhibición o para reconocerse entre especies es justamente lo que se discute.',
  }),

  brachylophosaurus: dino({
    id: 'brachylophosaurus', rareza: RAREZA.RARO, clado: CLADO.ORNITOPODO,
    binomial: 'Brachylophosaurus canadensis',
    coste: 2, ataque: 2, vida: 7,
    rasgo: RASGO.GREGARIO, rasgoNombre: 'Gregario',
    rasgoTexto: '+1 Poder por cada copia suya que tengas en el campo.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Formaciones Judith River y Oldman, Montana y Alberta, Campaniense (~78 Ma). Los lechos de huesos monoespecíficos de hadrosaurios son la mejor evidencia de vida en manada de todo el registro. De este taxón se conocen además ejemplares con tejido blando conservado.',
  }),

  tyrannotitan: dino({
    id: 'tyrannotitan', rareza: RAREZA.LEGENDARIO, clado: CLADO.TEROPODO,
    binomial: 'Tyrannotitan chubutensis',
    coste: 4, ataque: 10, vida: 6,
    rasgo: RASGO.DESGARRO, rasgoNombre: 'Desgarro',
    rasgoTexto: 'A quien hiere no se le cura ninguna herida ese turno.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Formación Cerro Barcino, Chubut, Argentina, Aptiense (~113 Ma). Carcarodontosáurido de unos 12 metros con dientes comprimidos y aserrados, de filo cortante en vez de aplastante. Que eso implique cortar carne y provocar hemorragias se infiere de la forma del diente, no de una herida fósil.',
  }),

  huaxiadraco: dino({
    id: 'huaxiadraco', rareza: RAREZA.RARO, clado: CLADO.PTEROSAURIO,
    binomial: 'Huaxiadraco corollatus',
    coste: 2, ataque: 2, vida: 4,
    rasgo: RASGO.VUELO, rasgoNombre: 'Vuelo',
    rasgoTexto: 'Sobrevuela la ranura: golpea siempre al hábitat rival, pero quien tenga enfrente le alcanza igual.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Formación Jiufotang, Liaoning, China, Aptiense (~120 Ma). No es un dinosaurio: es un pterosaurio tapejárido, sin dientes y con cresta craneal. Los tapejáridos conservan picnofibras, filamentos tegumentarios reales — la razón por la que este juego no pone plumas a los dinosaurios es que ellos no las tienen, no una regla estética.',
  }),

  // ---------------------------------------------- eventos: mejoran a los tuyos

  gregarismo: evento({
    id: 'gregarismo', rareza: RAREZA.RARO, binomial: 'Gregarismo', coste: 1,
    objetivo: OBJETIVO.PROPIO,
    rasgo: RASGO.GREGARISMO, rasgoNombre: 'Gregarismo',
    rasgoTexto: '+1 de Ataque a todos tus dinosaurios de la misma especie que el objetivo.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Acumulaciones monoespecíficas en la Morrison sugieren agregación en varios taxones. La interpretación de estos yacimientos es discutida (¿manada viva o concentración tafonómica?).',
  }),

  gastrolitos: evento({
    id: 'gastrolitos', rareza: RAREZA.EPICO, binomial: 'Gastrolitos', coste: 1,
    objetivo: OBJETIVO.PROPIO,
    rasgo: RASGO.GASTROLITOS, rasgoNombre: 'Gastrolitos',
    rasgoTexto: 'Cura +1 de vida a un dinosaurio al final del turno',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Piedras de molleja asociadas a esqueletos de saurópodos jurásicos. Su función exacta en la digestión sigue en debate.',
  }),

  crecimiento_acelerado: evento({
    id: 'crecimiento_acelerado', rareza: RAREZA.LEGENDARIO, binomial: 'Crecimiento acelerado', coste: 1,
    objetivo: OBJETIVO.PROPIO,
    rasgo: RASGO.CRECIMIENTO_ACELERADO, rasgoNombre: 'Crecimiento acelerado',
    rasgoTexto: '+2 Poder y +2 Vida permanentes a un dinosaurio que elijas.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'La osteohistología muestra tasas de crecimiento altas y sostenidas en saurópodos y en Allosaurus, alcanzando talla adulta en pocas décadas o menos.',
  }),

  neumaticidad: evento({
    id: 'neumaticidad', rareza: RAREZA.EPICO, binomial: 'Neumaticidad ósea', coste: 2,
    objetivo: OBJETIVO.PROPIO,
    rasgo: RASGO.NEUMATICIDAD, rasgoNombre: 'Neumaticidad ósea',
    rasgoTexto: '+2 de Ataque permanentes. Sólo sobre terópodos y saurópodos.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Los saurisquios de la Morrison presentan neumatización postcraneal: vértebras invadidas por divertículos de sacos aéreos. Aligera el esqueleto sin perder resistencia. No aparece en tireóforos ni en ornitópodos.',
  }),

  // ------------------------------------- eventos: presiones sobre el rival

  fractura: evento({
    id: 'fractura', rareza: RAREZA.EPICO, binomial: 'Fractura consolidada', coste: 2,
    objetivo: OBJETIVO.RIVAL,
    rasgo: RASGO.FRACTURA, rasgoNombre: 'Fractura consolidada',
    rasgoTexto: '−2 Poder permanente a un dinosaurio rival.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'El registro patológico de la Morrison es abundante: costillas fracturadas y consolidadas, infecciones óseas y lesiones por estrés, especialmente documentadas en ejemplares de Allosaurus. Un animal cojo caza peor, pero sigue vivo.',
  }),

  competencia: evento({
    id: 'competencia', rareza: RAREZA.EPICO, binomial: 'Competencia trófica', coste: 3,
    objetivo: OBJETIVO.RIVALES,
    rasgo: RASGO.COMPETENCIA, rasgoNombre: 'Competencia trófica',
    rasgoTexto: '−2 de Vida a dos dinosaurios rivales que elijas.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'La coexistencia de varios saurópodos y de varios terópodos grandes en la misma formación implica reparto de recursos. La partición de nicho está sustentada por el desgaste dental; su intensidad como presión competitiva es una inferencia.',
  }),

  trampa: evento({
    id: 'trampa', rareza: RAREZA.RARO, binomial: 'Trampa de depredadores', coste: 1,
    objetivo: OBJETIVO.NINGUNO,
    rasgo: RASGO.TRAMPA, rasgoNombre: 'Trampa de depredadores',
    rasgoTexto: 'El rival pierde 5 cartas de su mazo. Tú pierdes 3: el fango no distingue.',
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: 'La cantera Cleveland-Lloyd, en la Morrison de Utah, acumula decenas de individuos de Allosaurus en una proporción de depredadores frente a presas que no se da en un ecosistema vivo. La trampa de depredadores es una de las explicaciones; también se ha propuesto sequía o agua envenenada. El yacimiento es un hecho, su mecanismo no.',
  }),

  mortandad: evento({
    id: 'mortandad', rareza: RAREZA.LEGENDARIO, binomial: 'Mortandad estacional', coste: 1,
    objetivo: OBJETIVO.NINGUNO,
    rasgo: RASGO.MORTANDAD, rasgoNombre: 'Mortandad estacional',
    rasgoTexto: '3 de daño a TODOS los dinosaurios del campo, incluidos los tuyos.',
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: 'Algunas acumulaciones óseas de la Morrison se han interpretado como mortandades masivas asociadas a sequía o a eventos de crecida. La causa concreta de cada yacimiento sigue discutiéndose.',
  }),

  // ------------------------------------------------------------- recursos

  rebrote: recurso({
    id: 'rebrote', rareza: RAREZA.RARO, binomial: 'Rebrote tras incendio',
    rasgo: RASGO.REBROTE, rasgoNombre: 'Rebrote tras incendio',
    rasgoTexto: '+2 Biomasa ahora mismo. Todos tus dinosaurios reciben 1 herida.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Los sedimentos de la Morrison contienen fusaíta —carbón vegetal fósil—, prueba directa de incendios recurrentes. El rebrote nutritivo posterior se infiere por analogía con sabanas actuales, no está medido en el registro.',
  }),

  carrona: recurso({
    id: 'carrona', rareza: RAREZA.LEGENDARIO, binomial: 'Carroña abundante',
    rasgo: RASGO.CARRONA, rasgoNombre: 'Carroña abundante',
    rasgoTexto: '+3 Biomasa ahora mismo. El rival gana 1 Biomasa.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Marcas de mordida y dientes desprendidos de terópodo asociados a esqueletos de saurópodo indican consumo de carroña. Un cadáver grande alimenta a más de un carroñero, y no sólo al que llegó primero.',
  }),

  lago: recurso({
    id: 'lago', rareza: RAREZA.EPICO, binomial: 'Lago efímero',
    rasgo: RASGO.LAGO, rasgoNombre: 'Lago efímero',
    rasgoTexto: '+2 Biomasa ahora mismo. Tu hábitat pierde 2 puntos.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'La Morrison conserva depósitos de lagos alcalinos efímeros de gran extensión, como el llamado lago T’oo’dichi’. Concentran recursos mientras duran; al secarse dejan salinas que el paisaje tarda en recuperar.',
  }),

  // --------------------------------------------------------------- clima

  llanura: clima({
    id: 'llanura', coste: 1, rareza: RAREZA.EPICO, binomial: 'Llanura de inundación',
    rasgo: RASGO.CAMPO_LLANURA, rasgoNombre: 'Llanura de inundación',
    rasgoTexto: '+1 Biomasa para ambos jugadores',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Las llanuras de inundación de la Morrison concentran la mayor productividad vegetal estacional de la formación.',
  }),

  canal: clima({
    id: 'canal', coste: 1, rareza: RAREZA.LEGENDARIO, binomial: 'Canal fluvial trenzado',
    rasgo: RASGO.CAMPO_CANAL, rasgoNombre: 'Canal fluvial trenzado',
    rasgoTexto: 'Agua permanente en el campo: los ribereños pelean a gusto.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Los sistemas fluviales trenzados de la formación mantienen agua durante la estación seca, con vegetación ribereña estrecha a ambos lados.',
  }),

  bosque: clima({
    id: 'bosque', coste: 1, rareza: RAREZA.LEGENDARIO, binomial: 'Bosque de coníferas ribereño',
    rasgo: RASGO.CAMPO_BOSQUE, rasgoNombre: 'Bosque de coníferas ribereño',
    rasgoTexto: 'Los saurópodos curan 1 herida al final de cada turno.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Los bosques de coníferas ribereños ofrecen ramoneo alto sostenido, el estrato del que dependen los saurópodos de cuello elevado.',
  }),

  aridez: clima({
    id: 'aridez', coste: 1, rareza: RAREZA.LEGENDARIO, binomial: 'Deriva árida',
    rasgo: RASGO.CAMPO_ARIDEZ, rasgoNombre: 'Deriva árida',
    rasgoTexto: 'Ambos jugadores pierden 5 cartas del mazo',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Los paleosuelos calcáreos, las evaporitas y los depósitos eólicos de la Morrison documentan un clima semiárido y muy estacional que se acentúa hacia el techo de la formación. Que esa deriva mermara las poblaciones es una inferencia razonable, no una medida.',
  }),

  sabana: clima({
    id: 'sabana', coste: 1, rareza: RAREZA.COMUN, binomial: 'Sabana de helechos',
    rasgo: RASGO.CAMPO_SABANA, rasgoNombre: 'Sabana de helechos',
    rasgoTexto: '+1 de Biomasa cada turno para los dos jugadores, mientras siga en el campo.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Extensiones abiertas de helechos sobre suelos semiáridos, sin dosel que rompa la línea de visión ni frene un avance.',
  }),

  // --------------------------------------------------- fauna por estrenar
  //
  // Treinta y seis taxones que entran con ilustración y sin nada más: 1/1/1,
  // coste 1, común y sin rasgo. Están aquí para poder repartirles cifras y
  // habilidades desde RECOSTE.xlsx, que es donde se decide. El clado sí va
  // puesto y sale de la posición filogenética real, no del parecido.
  plesiopleurodon: dino({
    id: 'plesiopleurodon', rareza: RAREZA.EPICO, clado: CLADO.MARINO,
    binomial: 'Plesiopleurodon wellesi',
    coste: 3, ataque: 9, vida: 6,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Plesiosaurio pliosáurido del Cretácico Superior de Wyoming. No es un dinosaurio: es un reptil marino de cuello corto y cráneo enorme.',
  }),
  ojoraptorsaurus: dino({
    id: 'ojoraptorsaurus', rareza: RAREZA.RARO, clado: CLADO.TEROPODO,
    binomial: 'Ojoraptorsaurus boerei',
    coste: 2, ataque: 4, vida: 5,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Oviraptorosaurio caenagnátido de la Formación Ojo Alamo, Nuevo México, Maastrichtiense. Se conoce por poco material pélvico.',
  }),
  dromaeosaurus: dino({
    id: 'dromaeosaurus', rareza: RAREZA.COMUN, clado: CLADO.TEROPODO,
    binomial: 'Dromaeosaurus albertensis',
    coste: 2, ataque: 5, vida: 4,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Dromeosáurido de la Formación Dinosaur Park, Alberta, Campaniense. Es el género que da nombre a toda la familia.',
  }),
  athenar: dino({
    id: 'athenar', rareza: RAREZA.COMUN, clado: CLADO.SAUROPODO,
    binomial: 'Athenar bermani',
    coste: 2, ataque: 2, vida: 7,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Formación Morrison, cantera Carnegie del Dinosaur National Monument, Utah, Titoniense inferior (~149–145 Ma). Descrito en 2025 sobre un neurocráneo y techo craneal (CM 26552) que llevaba décadas archivado como Diplodocus. Es un dicreosáurido: saurópodos de cuello corto y talla modesta para el grupo, no un terópodo.',
  }),
  sanjuansaurus: dino({
    id: 'sanjuansaurus', rareza: RAREZA.RARO, clado: CLADO.TEROPODO,
    binomial: 'Sanjuansaurus gordilloi',
    coste: 2, ataque: 5, vida: 4,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Herrerasáurido de la Formación Ischigualasto, Argentina, Carniense (~231 Ma). Los herrerasáuridos son saurisquios muy basales; su colocación entre los terópodos se discute.',
  }),
  suchomimus: dino({
    id: 'suchomimus', rareza: RAREZA.EPICO, clado: CLADO.TEROPODO,
    binomial: 'Suchomimus tenerensis',
    coste: 3, ataque: 8, vida: 7,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Espinosáurido de la Formación Elrhaz, Níger, Aptiense. Hocico largo y cónico, adaptado a la pesca.',
  }),
  eosinopteryx: dino({
    id: 'eosinopteryx', rareza: RAREZA.COMUN, clado: CLADO.TEROPODO,
    binomial: 'Eosinopteryx brevipenna',
    coste: 1, ataque: 2, vida: 2,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Paraviano diminuto de la Formación Tiaojishan, China, Jurásico Superior. Conserva impresiones de plumas.',
  }),
  troodon: dino({
    id: 'troodon', rareza: RAREZA.COMUN, clado: CLADO.TEROPODO,
    binomial: 'Troodon formosus',
    coste: 2, ataque: 4, vida: 5,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Terópodo maniraptor del Cretácico Superior de Norteamérica. El nombre se basa en dientes aislados y su validez está discutida.',
  }),
  carnotaurus: dino({
    id: 'carnotaurus', rareza: RAREZA.EPICO, clado: CLADO.TEROPODO,
    binomial: 'Carnotaurus sastrei',
    coste: 3, ataque: 9, vida: 6,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Abelisáurido de la Formación La Colonia, Argentina, Maastrichtiense. Cuernos frontales y brazos reducidos al extremo.',
  }),
  spinosaurus: dino({
    id: 'spinosaurus', rareza: RAREZA.LEGENDARIO, clado: CLADO.TEROPODO,
    binomial: 'Spinosaurus aegyptiacus',
    coste: 4, ataque: 11, vida: 11,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Espinosáurido de los Kem Kem, Marruecos, Cenomaniense. Vela dorsal y un estilo de vida acuático que sigue debatiéndose.',
  }),
  mosasaurus: dino({
    id: 'mosasaurus', rareza: RAREZA.LEGENDARIO, clado: CLADO.MARINO,
    binomial: 'Mosasaurus hoffmannii',
    coste: 4, ataque: 12, vida: 10,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Mosasaurio del Maastrichtiense. No es un dinosaurio: es un escamoso marino, pariente de varanos y serpientes.',
  }),
  halszkaraptor: dino({
    id: 'halszkaraptor', rareza: RAREZA.COMUN, clado: CLADO.TEROPODO,
    binomial: 'Halszkaraptor escuilliei',
    coste: 1, ataque: 2, vida: 2,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Dromeosáurido halszkaraptorino de Mongolia, Campaniense. Cuello largo y hocico con muchos dientes pequeños; se ha propuesto un modo de vida semiacuático.',
  }),
  tongtianlong: dino({
    id: 'tongtianlong', rareza: RAREZA.COMUN, clado: CLADO.TEROPODO,
    binomial: 'Tongtianlong limosus',
    coste: 1, ataque: 1, vida: 3,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Oviraptorosaurio de la Formación Nanxiong, China, Maastrichtiense. El holotipo se conservó en postura de haber quedado atrapado en el barro.',
  }),
  scanisaurus: dino({
    id: 'scanisaurus', rareza: RAREZA.RARO, clado: CLADO.MARINO,
    binomial: 'Scanisaurus nazarowi',
    coste: 2, ataque: 4, vida: 5,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Plesiosaurio elasmosáurido del Cretácico Superior del Báltico. No es un dinosaurio, y su validez como género está discutida.',
  }),
  monolophosaurus: dino({
    id: 'monolophosaurus', rareza: RAREZA.RARO, clado: CLADO.TEROPODO,
    binomial: 'Monolophosaurus jiangi',
    coste: 2, ataque: 5, vida: 4,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Terópodo tetanuro de la Formación Shishugou, China, Jurásico Medio. Una sola cresta ósea recorre el cráneo.',
  }),
  invictarx: dino({
    id: 'invictarx', rareza: RAREZA.RARO, clado: CLADO.TIREOFORO,
    binomial: 'Invictarx zephyri',
    coste: 2, ataque: 2, vida: 7,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Anquilosaurio nodosáurido de la Formación Menefee, Nuevo México, Campaniense.',
  }),
  medusaceratops: dino({
    id: 'medusaceratops', rareza: RAREZA.EPICO, clado: CLADO.MARGINOCEFALO,
    binomial: 'Medusaceratops lokii',
    coste: 3, ataque: 5, vida: 10,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Ceratópsido casmosaurino de la Formación Judith River, Montana, Campaniense.',
  }),
  platyceratops: dino({
    id: 'platyceratops', rareza: RAREZA.COMUN, clado: CLADO.MARGINOCEFALO,
    binomial: 'Platyceratops tatarinovi',
    coste: 1, ataque: 1, vida: 3,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Ceratopsio bagaceratópsido de Mongolia, Campaniense. Pequeño y sin cuernos.',
  }),
  loricatosaurus: dino({
    id: 'loricatosaurus', rareza: RAREZA.EPICO, clado: CLADO.TIREOFORO,
    binomial: 'Loricatosaurus priscus',
    coste: 3, ataque: 4, vida: 11,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Estegosáurido del Calloviense de Inglaterra y Francia. Se separó del material antes atribuido a Lexovisaurus.',
  }),
  therizinosaurus: dino({
    id: 'therizinosaurus', rareza: RAREZA.EPICO, clado: CLADO.TEROPODO,
    binomial: 'Therizinosaurus cheloniformis',
    coste: 3, ataque: 6, vida: 9,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Terizinosaurio de la Formación Nemegt, Mongolia, Maastrichtiense. Terópodo herbívoro con las garras manuales más largas que se conocen.',
  }),
  alaskacephale: dino({
    id: 'alaskacephale', rareza: RAREZA.RARO, clado: CLADO.MARGINOCEFALO,
    binomial: 'Alaskacephale gangloffi',
    coste: 2, ataque: 3, vida: 6,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Paquicefalosaurio de la Formación Prince Creek, Alaska, Campaniense.',
  }),
  titanoceratops: dino({
    id: 'titanoceratops', rareza: RAREZA.EPICO, clado: CLADO.MARGINOCEFALO,
    binomial: 'Titanoceratops ouranos',
    coste: 3, ataque: 6, vida: 9,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Ceratópsido casmosaurino de Nuevo México, Campaniense. Se propuso separándolo de material asignado a Pentaceratops, y no todos lo aceptan.',
  }),
  atlasaurus: dino({
    id: 'atlasaurus', rareza: RAREZA.EPICO, clado: CLADO.SAUROPODO,
    binomial: 'Atlasaurus imelakei',
    coste: 3, ataque: 3, vida: 12,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Saurópodo del Jurásico Medio de Marruecos. Extremidades desproporcionadamente largas para un saurópodo.',
  }),
  stegoceras: dino({
    id: 'stegoceras', rareza: RAREZA.COMUN, clado: CLADO.MARGINOCEFALO,
    binomial: 'Stegoceras validum',
    coste: 2, ataque: 3, vida: 6,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Paquicefalosaurio de la Formación Dinosaur Park, Alberta, Campaniense. Domo craneal grueso.',
  }),
  maiasaura: dino({
    id: 'maiasaura', rareza: RAREZA.EPICO, clado: CLADO.ORNITOPODO,
    binomial: 'Maiasaura peeblesorum',
    coste: 3, ataque: 4, vida: 11,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Hadrosáurido de la Formación Two Medicine, Montana, Campaniense. Sus nidadas documentan cuidado parental.',
  }),
  edmontosaurus: dino({
    id: 'edmontosaurus', rareza: RAREZA.LEGENDARIO, clado: CLADO.ORNITOPODO,
    binomial: 'Edmontosaurus annectens',
    coste: 4, ataque: 5, vida: 17,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Hadrosáurido del Maastrichtiense de Norteamérica. Uno de los dinosaurios con más ejemplares conocidos.',
  }),
  plateosauravus: dino({
    id: 'plateosauravus', rareza: RAREZA.COMUN, clado: CLADO.SAUROPODO,
    binomial: 'Plateosauravus cullingworthi',
    coste: 2, ataque: 2, vida: 7,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Sauropodomorfo basal de la Formación Elliot, Sudáfrica, Triásico Superior. No es un saurópodo verdadero; se agrupa aquí por plan corporal. Su posición es incierta incluso dentro de los plateosaurios, y parte del material asignado se considera indeterminado.',
  }),
  gargoyleosaurus: dino({
    id: 'gargoyleosaurus', rareza: RAREZA.RARO, clado: CLADO.TIREOFORO,
    binomial: 'Gargoyleosaurus parkpinorum',
    coste: 2, ataque: 2, vida: 7,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Anquilosaurio de la Formación Morrison, Jurásico Superior. Uno de los anquilosaurios más antiguos que se conocen bien.',
  }),
  wendiceratops: dino({
    id: 'wendiceratops', rareza: RAREZA.EPICO, clado: CLADO.MARGINOCEFALO,
    binomial: 'Wendiceratops pinhornensis',
    coste: 3, ataque: 5, vida: 10,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Ceratópsido centrosaurino de la Formación Oldman, Alberta, Campaniense.',
  }),
  antarctosaurus: dino({
    id: 'antarctosaurus', rareza: RAREZA.LEGENDARIO, clado: CLADO.SAUROPODO,
    binomial: 'Antarctosaurus wichmannianus',
    coste: 4, ataque: 4, vida: 18,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Titanosaurio del Cretácico Superior de Argentina. El material asignado al género es heterogéneo y su validez se discute.',
  }),
  liaoceratops: dino({
    id: 'liaoceratops', rareza: RAREZA.COMUN, clado: CLADO.MARGINOCEFALO,
    binomial: 'Liaoceratops yanzigouensis',
    coste: 1, ataque: 1, vida: 3,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Neoceratopsio basal de la Formación Yixian, China, Barremiense. Pequeño y sin gola desarrollada.',
  }),
  rhinorex: dino({
    id: 'rhinorex', rareza: RAREZA.EPICO, clado: CLADO.ORNITOPODO,
    binomial: 'Rhinorex condrupus',
    coste: 3, ataque: 4, vida: 11,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Hadrosáurido saurolofino de la Formación Neslen, Utah, Campaniense. Destaca por el gran arco nasal.',
  }),
  bienosaurus: dino({
    id: 'bienosaurus', rareza: RAREZA.COMUN, clado: CLADO.TIREOFORO,
    binomial: 'Bienosaurus lufengensis',
    coste: 1, ataque: 1, vida: 3,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Tireóforo basal de la Formación Lufeng, China, Jurásico Inferior. Se conoce por una mandíbula, y su validez está discutida.',
  }),
  shuangmiaosaurus: dino({
    id: 'shuangmiaosaurus', rareza: RAREZA.COMUN, clado: CLADO.ORNITOPODO,
    binomial: 'Shuangmiaosaurus gilmorei',
    coste: 2, ataque: 3, vida: 6,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Hadrosauroideo basal de la Formación Sunjiawan, China, Cretácico Superior.',
  }),
  chasmosaurus: dino({
    id: 'chasmosaurus', rareza: RAREZA.COMUN, clado: CLADO.MARGINOCEFALO,
    binomial: 'Chasmosaurus belli',
    coste: 2, ataque: 2, vida: 7,
    rasgo: RASGO.NINGUNO, rasgoNombre: 'Sin rasgo',
    rasgoTexto: 'Todavía no hace nada especial.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Ceratópsido casmosaurino de la Formación Dinosaur Park, Alberta, Campaniense. Gola muy grande con dos aberturas amplias.',
  }),
});


/**
 * Cartas que SÓLO existen en la variante de economía por cartas
 * (`BALANCE.economia.modo === 'CARTAS'`, ver sim/economias.js).
 *
 * Deliberadamente fuera de CARTAS: no salen en sobres, no se coleccionan, no
 * cuentan en el set y no las mide BALANCE.md. Están aquí y no en un módulo
 * aparte para que `carta()` sepa resolverlas sin que cards.js dependa de nadie.
 *
 * No son cartas de juego: son el mazo de tierras de una variante que estamos
 * midiendo para decidir si existe. Si la variante se descarta, se borra este
 * bloque y no queda rastro en ninguna otra parte.
 */
export const CARTAS_ECONOMIA = Object.freeze({
  biomasa_vegetal: Object.freeze({
    id: 'biomasa_vegetal', tipo: TIPO.BIOMASA, dieta: 'HERBIVORO', coste: 0,
    binomial: 'Ramoneo', rareza: RAREZA.COMUN, rasgo: RASGO.NINGUNO,
  }),
  biomasa_animal: Object.freeze({
    id: 'biomasa_animal', tipo: TIPO.BIOMASA, dieta: 'CARNIVORO', coste: 0,
    binomial: 'Presa abatida', rareza: RAREZA.COMUN, rasgo: RASGO.NINGUNO,
  }),
});

/**
 * Cartas que SÓLO se consiguen tumbando a su jefe. Fuera de CARTAS a propósito:
 * no salen en sobres, no se funden y no cuentan en el set medido. Son la razón
 * de que la capa cooperativa no sea un adorno — si estas cartas cayeran de un
 * sobre, nadie coordinaría nada.
 */
export const CARTAS_DE_JEFE = Object.freeze({
  jefe_saurophaganax: Object.freeze({
    id: 'jefe_saurophaganax',
    tipo: TIPO.DINOSAURIO, clado: CLADO.TEROPODO, rareza: RAREZA.LEGENDARIO,
    binomial: 'Saurophaganax maximus',
    coste: 4, ataque: 7, vida: 8,
    rasgo: RASGO.DEPREDADOR_DOMINANTE,
    evidencia: 'DEBATIDO',
    nota: 'El mayor terópodo conocido de la Formación Morrison, y también el más '
      + 'discutido: parte de los autores lo consideran un Allosaurus de gran talla '
      + 'y no un género propio. La carta lo declara porque la duda es el dato.',
    formacion: 'Formación Morrison', edad: 'Kimmeridgiense–Titoniense (~155–150 Ma)',
  }),
  jefe_barosaurus: Object.freeze({
    id: 'jefe_barosaurus',
    tipo: TIPO.DINOSAURIO, clado: CLADO.SAUROPODO, rareza: RAREZA.LEGENDARIO,
    binomial: 'Barosaurus lentus',
    coste: 4, ataque: 3, vida: 13,
    rasgo: RASGO.MANADA,
    evidencia: 'ESTABLECIDO',
    nota: 'Diplodócido de cuello desmesurado incluso para su familia: vértebras '
      + 'cervicales alargadas que lo hacían capaz de ramonear donde ningún otro '
      + 'saurópodo de la Morrison llegaba.',
    formacion: 'Formación Morrison', edad: 'Kimmeridgiense–Titoniense (~155–150 Ma)',
  }),
});

/** ¿Existe esta carta en algún registro? El set, las de jefe o las de economía. */
export const existeCarta = (cardId) => Boolean(
  CARTAS[cardId] ?? CARTAS_DE_JEFE[cardId] ?? CARTAS_ECONOMIA[cardId],
);

/**
 * Las que un mazo puede llevar: el set y las de jefe. Nunca las de economía,
 * que no son cartas de juego sino el mazo de tierras de una variante.
 */
export const cartasJugables = () => ({ ...CARTAS, ...CARTAS_DE_JEFE });

export function carta(cardId) {
  const c = CARTAS[cardId] ?? CARTAS_DE_JEFE[cardId] ?? CARTAS_ECONOMIA[cardId];
  if (!c) throw new Error(`Carta desconocida: ${cardId}`);
  return c;
}

export const esDino = (cardId) => carta(cardId).tipo === TIPO.DINOSAURIO;
