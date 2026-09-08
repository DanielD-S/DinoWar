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
});

/** Sobre qué actúa un evento. Decide dónde se suelta y qué valida el motor. */
export const OBJETIVO = Object.freeze({
  PROPIO: 'PROPIO',   // un dinosaurio tuyo
  RIVAL: 'RIVAL',     // un dinosaurio del rival
  CLADO: 'CLADO',     // todos los rivales de un clado que eliges
  CAMPO: 'CAMPO',     // el campo entero
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
});

/** Clados reales. El "triángulo de tipos" es una red trófica, no un capricho. */
export const CLADO = Object.freeze({
  TEROPODO: 'TEROPODO',
  SAUROPODO: 'SAUROPODO',
  TIREOFORO: 'TIREOFORO',
  ORNITOPODO: 'ORNITOPODO',
  MARGINOCEFALO: 'MARGINOCEFALO',
  PTEROSAURIO: 'PTEROSAURIO',
});

export const CLADO_NOMBRE = Object.freeze({
  TEROPODO: 'Terópodo',
  SAUROPODO: 'Saurópodo',
  TIREOFORO: 'Tireóforo',
  ORNITOPODO: 'Ornitópodo',
  MARGINOCEFALO: 'Marginocéfalo',
  PTEROSAURIO: 'Pterosaurio',
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
  DESGARRO: 'DESGARRO',
  CORAZA: 'CORAZA',
  GOLA: 'GOLA',
  VUELO: 'VUELO',
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
const evento = (o) => Object.freeze({ tipo: TIPO.EVENTO, ataque: 0, defensa: 0, vida: 0, ...o });
const clima = (o) => Object.freeze({ tipo: TIPO.CLIMA, objetivo: OBJETIVO.CAMPO, ataque: 0, defensa: 0, vida: 0, coste: 2, ...o });
// Los pulsos se juegan BOCA ARRIBA y surten efecto al instante: dar Biomasa
// "este turno" no sirve de nada si se resuelve después del despliegue. A cambio
// el rival los ve venir, que es parte de su precio.
const recurso = (o) => Object.freeze({ tipo: TIPO.RECURSO, objetivo: OBJETIVO.CAMPO, ataque: 0, defensa: 0, vida: 0, coste: 0, ...o });

export const CARTAS = Object.freeze({

  // ------------------------------------------------------------ dinosaurios

  dryosaurus: dino({
    id: 'dryosaurus', rareza: RAREZA.COMUN, clado: CLADO.ORNITOPODO,
    binomial: 'Dryosaurus altus',
    coste: 1, ataque: 1, defensa: 0, vida: 2,
    rasgo: RASGO.GREGARIO, rasgoNombre: 'Gregario',
    rasgoTexto: '+1 Poder por cada otro Dryosaurus propio en el campo.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Ornitópodo pequeño y cursorial. El gregarismo se infiere de acumulaciones multiindividuo, no está demostrado.',
  }),

  ornitholestes: dino({
    id: 'ornitholestes', rareza: RAREZA.COMUN, clado: CLADO.TEROPODO,
    binomial: 'Ornitholestes hermanni',
    coste: 2, ataque: 2, defensa: 0, vida: 2,
    rasgo: RASGO.OPORTUNISTA, rasgoNombre: 'Oportunista',
    rasgoTexto: '+1 Vida permanente cada vez que muere un dinosaurio en el campo.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Terópodo pequeño (~2 m). El comportamiento carroñero es una inferencia a partir de talla y analogía ecológica, no de evidencia directa.',
  }),

  ceratosaurus: dino({
    id: 'ceratosaurus', rareza: RAREZA.COMUN, clado: CLADO.TEROPODO,
    binomial: 'Ceratosaurus nasicornis',
    coste: 3, ataque: 4, defensa: 1, vida: 3,
    rasgo: RASGO.RIBERENO, rasgoNombre: 'Ribereño',
    rasgoTexto: '+2 Poder mientras el campo activo sea Canal fluvial trenzado.',
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: 'Menos frecuente que Allosaurus. Se ha propuesto una dieta con mayor componente de presa acuática y un uso preferente de ambientes ribereños, a partir de morfología dental y contexto de hallazgos. Hipótesis discutida.',
  }),

  stegosaurus: dino({
    id: 'stegosaurus', rareza: RAREZA.EPICO, clado: CLADO.TIREOFORO,
    binomial: 'Stegosaurus stenops',
    coste: 4, ataque: 3, defensa: 3, vida: 6,
    rasgo: RASGO.TAGOMIZADOR, rasgoNombre: 'Tagomizador',
    rasgoTexto: 'Devuelve 2 de daño adicional a quien lo ataque, además del que ya devuelve su clado.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Una vértebra caudal de Allosaurus con una perforación compatible con una púa caudal de Stegosaurus es evidencia directa de uso defensivo del tagomizador.',
  }),

  allosaurus: dino({
    id: 'allosaurus', rareza: RAREZA.EPICO, clado: CLADO.TEROPODO,
    binomial: 'Allosaurus fragilis',
    coste: 5, ataque: 6, defensa: 1, vida: 5,
    rasgo: RASGO.DEPREDADOR_DOMINANTE, rasgoNombre: 'Depredador dominante',
    rasgoTexto: 'Si mata a su rival, el daño sobrante pasa al hábitat enemigo.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Taxón de terópodo más abundante de la Morrison. Marcas de mordida atribuidas a Allosaurus aparecen en huesos de saurópodos y de Stegosaurus.',
  }),

  camarasaurus: dino({
    id: 'camarasaurus', rareza: RAREZA.EPICO, clado: CLADO.SAUROPODO,
    binomial: 'Camarasaurus grandis',
    coste: 5, ataque: 3, defensa: 2, vida: 7,
    rasgo: RASGO.MIGRADOR, rasgoNombre: 'Migrador',
    rasgoTexto: 'Puede cambiar de ranura en vez de desplegar. Inmune a Sequía estacional.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Análisis isotópicos de esmalte dental sugieren desplazamientos estacionales hacia tierras altas durante la estación seca, a diferencia de otros saurópodos de la misma formación. El rasgo Migrador refleja ese resultado.',
  }),

  diplodocus: dino({
    id: 'diplodocus', rareza: RAREZA.LEGENDARIO, clado: CLADO.SAUROPODO,
    binomial: 'Diplodocus carnegii',
    coste: 5, ataque: 3, defensa: 2, vida: 10,
    rasgo: RASGO.RAMONEO_BAJO, rasgoNombre: 'Ramoneo bajo',
    rasgoTexto: 'Cura 1 herida al final de cada turno.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'El desgaste dental y la postura del cuello sustentan una partición de nicho por ramoneo bajo respecto de otros saurópodos coexistentes.',
  }),

  apatosaurus: dino({
    id: 'apatosaurus', rareza: RAREZA.LEGENDARIO, clado: CLADO.SAUROPODO,
    binomial: 'Apatosaurus louisae',
    coste: 7, ataque: 4, defensa: 3, vida: 12,
    rasgo: RASGO.MASA_COLOSAL, rasgoNombre: 'Masa colosal',
    rasgoTexto: '+1 de Defensa adicional: es la mayor masa del set.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'La talla adulta de los diplodócidos es en sí misma la principal defensa antipredatoria. Nota: la validez de Brontosaurus como género separado sigue en discusión; el juego usa Apatosaurus.',
  }),

  torvosaurus: dino({
    id: 'torvosaurus', rareza: RAREZA.LEGENDARIO, clado: CLADO.TEROPODO,
    binomial: 'Torvosaurus tanneri',
    coste: 7, ataque: 8, defensa: 1, vida: 6,
    rasgo: RASGO.ESCASO, rasgoNombre: 'Escaso',
    rasgoTexto: 'Sólo 1 copia en el mazo. No admite adaptaciones.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'El terópodo de mayor tamaño de la formación, pero genuinamente raro en el registro. Su escasez en el mazo replica su escasez fósil.',
  }),

  // --------------------------------- fuera de la Morrison (ver README, §fauna)

  nodosaurus: dino({
    id: 'nodosaurus', rareza: RAREZA.RARO, clado: CLADO.TIREOFORO,
    binomial: 'Nodosaurus textilis',
    coste: 4, ataque: 2, defensa: 4, vida: 6,
    rasgo: RASGO.CORAZA, rasgoNombre: 'Coraza dorsal',
    rasgoTexto: '+2 de Defensa. La coraza protege; no es un arma, a diferencia de la cola del estegosaurio.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Formación Frontier, Wyoming, Cenomaniense (~100 Ma). Los osteodermos en bandas sobre el dorso están documentados directamente. El taxón en sí es material fragmentario y varios autores lo tratan como nomen dubium: la coraza es firme, la especie lo es menos.',
  }),

  riparovenator: dino({
    id: 'riparovenator', rareza: RAREZA.EPICO, clado: CLADO.TEROPODO,
    binomial: 'Riparovenator milnerae',
    coste: 5, ataque: 5, defensa: 1, vida: 5,
    rasgo: RASGO.RIBERENO, rasgoNombre: 'Ribereño',
    rasgoTexto: '+2 Poder mientras el Canal fluvial esté en el campo.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Formación Wessex, isla de Wight, Barremiense (~125 Ma), descrito en 2021. Espinosáurido de hocico alargado y dientes cónicos, morfología asociada a capturar peces. En su pariente Baryonyx se conservaron escamas de pez en la cavidad abdominal; para este género es inferencia por morfología.',
  }),

  lokiceratops: dino({
    id: 'lokiceratops', rareza: RAREZA.EPICO, clado: CLADO.MARGINOCEFALO,
    binomial: 'Lokiceratops rangiformis',
    coste: 5, ataque: 4, defensa: 2, vida: 7,
    rasgo: RASGO.GOLA, rasgoNombre: 'Gola ornamentada',
    rasgoTexto: '+2 de Defensa.',
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: 'Formación Judith River, Montana, Campaniense (~78 Ma), descrito en 2024. La gola lleva las mayores hojas óseas conocidas en un ceratópsido, asimétricas entre lados. Si servían para defensa, para exhibición o para reconocerse entre especies es justamente lo que se discute.',
  }),

  brachylophosaurus: dino({
    id: 'brachylophosaurus', rareza: RAREZA.EPICO, clado: CLADO.ORNITOPODO,
    binomial: 'Brachylophosaurus canadensis',
    coste: 4, ataque: 3, defensa: 1, vida: 6,
    rasgo: RASGO.GREGARIO, rasgoNombre: 'Gregario',
    rasgoTexto: '+1 Poder por cada copia suya que tengas en el campo.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Formaciones Judith River y Oldman, Montana y Alberta, Campaniense (~78 Ma). Los lechos de huesos monoespecíficos de hadrosaurios son la mejor evidencia de vida en manada de todo el registro. De este taxón se conocen además ejemplares con tejido blando conservado.',
  }),

  tyrannotitan: dino({
    id: 'tyrannotitan', rareza: RAREZA.LEGENDARIO, clado: CLADO.TEROPODO,
    binomial: 'Tyrannotitan chubutensis',
    coste: 8, ataque: 9, defensa: 1, vida: 7,
    rasgo: RASGO.DESGARRO, rasgoNombre: 'Desgarro',
    rasgoTexto: 'A quien hiere no se le cura ninguna herida ese turno.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Formación Cerro Barcino, Chubut, Argentina, Aptiense (~113 Ma). Carcarodontosáurido de unos 12 metros con dientes comprimidos y aserrados, de filo cortante en vez de aplastante. Que eso implique cortar carne y provocar hemorragias se infiere de la forma del diente, no de una herida fósil.',
  }),

  huaxiadraco: dino({
    id: 'huaxiadraco', rareza: RAREZA.EPICO, clado: CLADO.PTEROSAURIO,
    binomial: 'Huaxiadraco corollatus',
    coste: 4, ataque: 3, defensa: 0, vida: 3,
    rasgo: RASGO.VUELO, rasgoNombre: 'Vuelo',
    rasgoTexto: 'Sobrevuela la ranura: golpea siempre al hábitat rival y no recibe daño de combate.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Formación Jiufotang, Liaoning, China, Aptiense (~120 Ma). No es un dinosaurio: es un pterosaurio tapejárido, sin dientes y con cresta craneal. Los tapejáridos conservan picnofibras, filamentos tegumentarios reales — la razón por la que este juego no pone plumas a los dinosaurios es que ellos no las tienen, no una regla estética.',
  }),

  // ---------------------------------------------- eventos: mejoran a los tuyos

  gregarismo: evento({
    id: 'gregarismo', rareza: RAREZA.RARO, binomial: 'Gregarismo', coste: 2,
    objetivo: OBJETIVO.PROPIO,
    rasgo: RASGO.GREGARISMO, rasgoNombre: 'Gregarismo',
    rasgoTexto: '+2 Poder a todos tus dinosaurios de la misma especie que el objetivo.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Acumulaciones monoespecíficas en la Morrison sugieren agregación en varios taxones. La interpretación de estos yacimientos es discutida (¿manada viva o concentración tafonómica?).',
  }),

  gastrolitos: evento({
    id: 'gastrolitos', rareza: RAREZA.EPICO, binomial: 'Gastrolitos', coste: 2,
    objetivo: OBJETIVO.PROPIO,
    rasgo: RASGO.GASTROLITOS, rasgoNombre: 'Gastrolitos',
    rasgoTexto: 'El objetivo cura 1 herida al final de cada turno.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Piedras de molleja asociadas a esqueletos de saurópodos jurásicos. Su función exacta en la digestión sigue en debate.',
  }),

  crecimiento_acelerado: evento({
    id: 'crecimiento_acelerado', rareza: RAREZA.LEGENDARIO, binomial: 'Crecimiento acelerado', coste: 3,
    objetivo: OBJETIVO.PROPIO,
    rasgo: RASGO.CRECIMIENTO_ACELERADO, rasgoNombre: 'Crecimiento acelerado',
    rasgoTexto: '+2 Poder y +2 Vida permanentes.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'La osteohistología muestra tasas de crecimiento altas y sostenidas en saurópodos y en Allosaurus, alcanzando talla adulta en pocas décadas o menos.',
  }),

  neumaticidad: evento({
    id: 'neumaticidad', rareza: RAREZA.EPICO, binomial: 'Neumaticidad ósea', coste: 2,
    objetivo: OBJETIVO.PROPIO,
    rasgo: RASGO.NEUMATICIDAD, rasgoNombre: 'Neumaticidad ósea',
    rasgoTexto: '+2 Poder. Sólo sobre terópodos y saurópodos.',
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
    id: 'competencia', rareza: RAREZA.EPICO, binomial: 'Competencia trófica', coste: 2,
    objetivo: OBJETIVO.CLADO,
    rasgo: RASGO.COMPETENCIA, rasgoNombre: 'Competencia trófica',
    rasgoTexto: '−2 Poder a todos los dinosaurios rivales del clado que elijas.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'La coexistencia de varios saurópodos y de varios terópodos grandes en la misma formación implica reparto de recursos. La partición de nicho está sustentada por el desgaste dental; su intensidad como presión competitiva es una inferencia.',
  }),

  trampa: evento({
    id: 'trampa', rareza: RAREZA.RARO, binomial: 'Trampa de depredadores', coste: 3,
    objetivo: OBJETIVO.CAMPO,
    rasgo: RASGO.TRAMPA, rasgoNombre: 'Trampa de depredadores',
    rasgoTexto: 'El rival pierde 12 cartas de su mazo. Tú pierdes 3: el fango no distingue.',
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: 'La cantera Cleveland-Lloyd, en la Morrison de Utah, acumula decenas de individuos de Allosaurus en una proporción de depredadores frente a presas que no se da en un ecosistema vivo. La trampa de depredadores es una de las explicaciones; también se ha propuesto sequía o agua envenenada. El yacimiento es un hecho, su mecanismo no.',
  }),

  mortandad: evento({
    id: 'mortandad', rareza: RAREZA.LEGENDARIO, binomial: 'Mortandad estacional', coste: 3,
    objetivo: OBJETIVO.CAMPO,
    rasgo: RASGO.MORTANDAD, rasgoNombre: 'Mortandad estacional',
    rasgoTexto: '2 de daño a TODOS los dinosaurios del campo, incluidos los tuyos.',
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: 'Algunas acumulaciones óseas de la Morrison se han interpretado como mortandades masivas asociadas a sequía o a eventos de crecida. La causa concreta de cada yacimiento sigue discutiéndose.',
  }),

  // ------------------------------------------------------------- recursos

  rebrote: recurso({
    id: 'rebrote', rareza: RAREZA.RARO, binomial: 'Rebrote tras incendio',
    rasgo: RASGO.REBROTE, rasgoNombre: 'Rebrote tras incendio',
    rasgoTexto: '+3 Biomasa ahora mismo. Todos tus dinosaurios reciben 1 herida.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Los sedimentos de la Morrison contienen fusaíta —carbón vegetal fósil—, prueba directa de incendios recurrentes. El rebrote nutritivo posterior se infiere por analogía con sabanas actuales, no está medido en el registro.',
  }),

  carrona: recurso({
    id: 'carrona', rareza: RAREZA.EPICO, binomial: 'Carroña abundante',
    rasgo: RASGO.CARRONA, rasgoNombre: 'Carroña abundante',
    rasgoTexto: '+3 Biomasa ahora mismo. El rival gana 1 Biomasa.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Marcas de mordida y dientes desprendidos de terópodo asociados a esqueletos de saurópodo indican consumo de carroña. Un cadáver grande alimenta a más de un carroñero, y no sólo al que llegó primero.',
  }),

  lago: recurso({
    id: 'lago', rareza: RAREZA.EPICO, binomial: 'Lago efímero',
    rasgo: RASGO.LAGO, rasgoNombre: 'Lago efímero',
    rasgoTexto: '+2 Biomasa ahora mismo. Tu hábitat pierde 1.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'La Morrison conserva depósitos de lagos alcalinos efímeros de gran extensión, como el llamado lago T’oo’dichi’. Concentran recursos mientras duran; al secarse dejan salinas que el paisaje tarda en recuperar.',
  }),

  // --------------------------------------------------------------- clima

  llanura: clima({
    id: 'llanura', rareza: RAREZA.EPICO, binomial: 'Llanura de inundación',
    rasgo: RASGO.CAMPO_LLANURA, rasgoNombre: 'Llanura de inundación',
    rasgoTexto: '+1 Biomasa por turno a los dos bandos.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Las llanuras de inundación de la Morrison concentran la mayor productividad vegetal estacional de la formación.',
  }),

  canal: clima({
    id: 'canal', rareza: RAREZA.LEGENDARIO, binomial: 'Canal fluvial trenzado',
    rasgo: RASGO.CAMPO_CANAL, rasgoNombre: 'Canal fluvial trenzado',
    rasgoTexto: 'Agua permanente: la Sequía estacional no mata a nadie.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Los sistemas fluviales trenzados de la formación mantienen agua durante la estación seca, con vegetación ribereña estrecha a ambos lados.',
  }),

  bosque: clima({
    id: 'bosque', rareza: RAREZA.LEGENDARIO, binomial: 'Bosque de coníferas ribereño',
    rasgo: RASGO.CAMPO_BOSQUE, rasgoNombre: 'Bosque de coníferas ribereño',
    rasgoTexto: 'Los saurópodos curan 1 herida al final de cada turno.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Los bosques de coníferas ribereños ofrecen ramoneo alto sostenido, el estrato del que dependen los saurópodos de cuello elevado.',
  }),

  aridez: clima({
    id: 'aridez', rareza: RAREZA.EPICO, binomial: 'Deriva árida',
    rasgo: RASGO.CAMPO_ARIDEZ, rasgoNombre: 'Deriva árida',
    rasgoTexto: 'Cada turno, los dos bandos pierden 5 cartas del mazo.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Los paleosuelos calcáreos, las evaporitas y los depósitos eólicos de la Morrison documentan un clima semiárido y muy estacional que se acentúa hacia el techo de la formación. Que esa deriva mermara las poblaciones es una inferencia razonable, no una medida.',
  }),

  sabana: clima({
    id: 'sabana', rareza: RAREZA.COMUN, binomial: 'Sabana de helechos',
    rasgo: RASGO.CAMPO_SABANA, rasgoNombre: 'Sabana de helechos',
    rasgoTexto: 'Terreno abierto, sin cobertura: +1 al daño contra los biomas.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Extensiones abiertas de helechos sobre suelos semiáridos, sin dosel que rompa la línea de visión ni frene un avance.',
  }),
});

export const ESTACIONES = Object.freeze({
  SEQUIA: Object.freeze({
    id: 'SEQUIA', nombre: 'Sequía estacional',
    texto: 'Cada dinosaurio recibe 1 herida, y 2 si tiene 7 o más de Vida: el cuerpo grande necesita más agua. Camarasaurus es inmune; el Canal fluvial protege a todos.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Los paleosuelos, los depósitos evaporíticos y la estructura de los yacimientos de la Morrison indican un clima marcadamente estacional, semiárido, con precipitación concentrada.',
  }),
  CRECIDA: Object.freeze({
    id: 'CRECIDA', nombre: 'Crecida monzónica',
    texto: 'Todos los dinosaurios curan 1 herida. Este turno los biomas no reciben daño.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'La precipitación concentrada de la estación húmeda reverdece la llanura y desborda los canales; el agua rehace el paisaje y frena cualquier avance.',
  }),
});

export const INMUNE_SEQUIA = Object.freeze(['camarasaurus']);

export function carta(cardId) {
  const c = CARTAS[cardId];
  if (!c) throw new Error(`Carta desconocida: ${cardId}`);
  return c;
}

export const esDino = (cardId) => carta(cardId).tipo === TIPO.DINOSAURIO;
