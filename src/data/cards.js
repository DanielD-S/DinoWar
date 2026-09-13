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

import { QUE, CUANDO, INMUNE, TODOS } from './mecanicas.js';

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
  // Las búsquedas en el mazo y los disparos al entrar en juego ESTUVIERON aquí,
  // como nueve etiquetas más de este enum. Se fueron a `mecanica` —el campo de
  // datos de cada criatura, descrito en mecanicas.js— porque el mismo efecto
  // sale con números distintos en cada carta y una etiqueta no lleva número:
  // hacían falta nueve constantes de balance para seis cartas.
  //
  // Lo que queda aquí es lo de las 16 cartas de SOPORTE, que son dieciséis
  // reglas distintas y ninguna se repite. Ésas sí son un enum.
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
  // Los cinco biomas que fueron clima, ya como eventos, y un nido.
  SABANA_HELECHOS: 'SABANA_HELECHOS',
  INUNDACION: 'INUNDACION',
  CANAL_TRENZADO: 'CANAL_TRENZADO',
  BOSQUE_RIBERENO: 'BOSQUE_RIBERENO',
  DERIVA_ARIDA: 'DERIVA_ARIDA',
  NIDO: 'NIDO',
  // pulsos
  REBROTE: 'REBROTE',
  CARRONA: 'CARRONA',
  LAGO: 'LAGO',
  INSECTOS: 'INSECTOS',
  MANADA_PASO: 'MANADA_PASO',
  FRUTOS: 'FRUTOS',
  // biomasa
  BIOMASA: 'BIOMASA',
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
// Las cartas de Biomasa se bajan como recurso —una por turno, gratis— y llevan
// sus números en `biomasa`. La dieta es la vegetal porque en la economía FIJA,
// que es la que se publica, no tiene efecto; en la TIPADA una pradera da planta.
const biomasa = (o) => Object.freeze({ tipo: TIPO.BIOMASA, dieta: 'HERBIVORO', objetivo: OBJETIVO.NINGUNO, ataque: 0, vida: 0, coste: 0, rasgo: RASGO.BIOMASA, ...o });

export const CARTAS = Object.freeze({

  // ------------------------------------------------------------ dinosaurios

  dryosaurus: dino({
    id: 'dryosaurus', rareza: RAREZA.COMUN, clado: CLADO.ORNITOPODO,
    binomial: 'Dryosaurus altus',
    coste: 0, ataque: 1, vida: 2,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Bandada nerviosa',
    rasgoTexto: 'Gana +1 de Ataque por cada Dryosaurus en juego, sea de quien sea y este incluido.',
    mecanica: Object.freeze({ cuenta: { que: QUE.MISMA, ambos: true, ataque: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Ornitópodo pequeño y cursorial. El gregarismo se infiere de acumulaciones multiindividuo, no está demostrado.',
  }),

  ornitholestes: dino({
    id: 'ornitholestes', rareza: RAREZA.COMUN, clado: CLADO.TEROPODO,
    binomial: 'Ornitholestes hermanni',
    coste: 1, ataque: 2, vida: 2,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Salto de entrada',
    rasgoTexto: 'Cuando entra en juego hiere en 2 al dinosaurio de enfrente.',
    mecanica: Object.freeze({ entrada: { emboscada: 2 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Terópodo pequeño (~2 m). El comportamiento carroñero es una inferencia a partir de talla y analogía ecológica, no de evidencia directa.',
  }),

  ceratosaurus: dino({
    id: 'ceratosaurus', rareza: RAREZA.COMUN, clado: CLADO.TEROPODO,
    binomial: 'Ceratosaurus nasicornis',
    coste: 2, ataque: 4, vida: 2,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Ayuno del cazador',
    rasgoTexto: 'Cuando entra en juego descarta 2 cartas de tu mazo.',
    mecanica: Object.freeze({ entrada: { muelePropio: 2 } }),
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: 'Menos frecuente que Allosaurus. Se ha propuesto una dieta con mayor componente de presa acuática y un uso preferente de ambientes ribereños, a partir de morfología dental y contexto de hallazgos. Hipótesis discutida.',
  }),

  stegosaurus: dino({
    id: 'stegosaurus', rareza: RAREZA.COMUN, clado: CLADO.TIREOFORO,
    binomial: 'Stegosaurus stenops',
    coste: 2, ataque: 1, vida: 5,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Muro de placas',
    rasgoTexto: 'Gana +1 de Ataque por cada Stegosaurus que tengas en juego, este incluido.',
    mecanica: Object.freeze({ cuenta: { que: QUE.MISMA, ambos: false, ataque: 1 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Una vértebra caudal de Allosaurus con una perforación compatible con una púa caudal de Stegosaurus es evidencia directa de uso defensivo del tagomizador.',
  }),

  allosaurus: dino({
    id: 'allosaurus', rareza: RAREZA.RARO, clado: CLADO.TEROPODO,
    binomial: 'Allosaurus fragilis',
    coste: 3, ataque: 5, vida: 5,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Zarpazo por sorpresa',
    rasgoTexto: 'Cuando entra en juego descarta 1 carta al azar de la mano de tu rival.',
    mecanica: Object.freeze({ entrada: { manoRival: 1 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Taxón de terópodo más abundante de la Morrison. Marcas de mordida atribuidas a Allosaurus aparecen en huesos de saurópodos y de Stegosaurus.',
  }),

  camarasaurus: dino({
    id: 'camarasaurus', rareza: RAREZA.RARO, clado: CLADO.SAUROPODO,
    binomial: 'Camarasaurus grandis',
    coste: 3, ataque: 1, vida: 8,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Rumia',
    rasgoTexto: 'Al final de tu turno recupera 1 de Vida.',
    mecanica: Object.freeze({ regenera: { propia: 1 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Análisis isotópicos de esmalte dental sugieren desplazamientos estacionales hacia tierras altas durante la estación seca, a diferencia de otros saurópodos de la misma formación. El rasgo Migrador refleja ese resultado.',
  }),

  diplodocus: dino({
    id: 'diplodocus', rareza: RAREZA.RARO, clado: CLADO.SAUROPODO,
    binomial: 'Diplodocus carnegii',
    coste: 2, ataque: 3, vida: 8,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Pisa y abona',
    rasgoTexto: 'Cuando entra en juego tu hábitat recupera 1 punto.',
    mecanica: Object.freeze({ entrada: { curaHabitat: 1 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'El desgaste dental y la postura del cuello sustentan una partición de nicho por ramoneo bajo respecto de otros saurópodos coexistentes.',
  }),

  apatosaurus: dino({
    id: 'apatosaurus', rareza: RAREZA.RARO, clado: CLADO.SAUROPODO,
    binomial: 'Apatosaurus louisae',
    coste: 3, ataque: 2, vida: 10,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Pisa y abona',
    rasgoTexto: 'Cuando entra en juego tu hábitat recupera 1 punto.',
    mecanica: Object.freeze({ entrada: { curaHabitat: 1 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'La talla adulta de los diplodócidos es en sí misma la principal defensa antipredatoria. Nota: la validez de Brontosaurus como género separado sigue en discusión; el juego usa Apatosaurus.',
  }),

  torvosaurus: dino({
    id: 'torvosaurus', rareza: RAREZA.EPICO, clado: CLADO.TEROPODO,
    binomial: 'Torvosaurus tanneri',
    coste: 4, ataque: 8, vida: 5,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Indiferente al cielo',
    rasgoTexto: 'No le afectan los efectos del clima.',
    mecanica: Object.freeze({ inmune: INMUNE.CLIMA }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'El terópodo de mayor tamaño de la formación, pero genuinamente raro en el registro. Su escasez en el mazo replica su escasez fósil.',
  }),

  // --------------------------------- fuera de la Morrison (ver README, §fauna)

  nodosaurus: dino({
    id: 'nodosaurus', rareza: RAREZA.EPICO, clado: CLADO.TIREOFORO,
    binomial: 'Nodosaurus textilis',
    coste: 3, ataque: 3, vida: 8,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Indiferente al cielo',
    rasgoTexto: 'No le afectan los efectos del clima.',
    mecanica: Object.freeze({ inmune: INMUNE.CLIMA }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Formación Frontier, Wyoming, Cenomaniense (~100 Ma). Los osteodermos en bandas sobre el dorso están documentados directamente. El taxón en sí es material fragmentario y varios autores lo tratan como nomen dubium: la coraza es firme, la especie lo es menos.',
  }),

  riparovenator: dino({
    id: 'riparovenator', rareza: RAREZA.EPICO, clado: CLADO.TEROPODO,
    binomial: 'Riparovenator milnerae',
    coste: 3, ataque: 3, vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Fuera del alcance',
    rasgoTexto: 'No le afectan las cartas de evento de tu rival.',
    mecanica: Object.freeze({ inmune: INMUNE.EVENTO }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Formación Wessex, isla de Wight, Barremiense (~125 Ma), descrito en 2021. Espinosáurido de hocico alargado y dientes cónicos, morfología asociada a capturar peces. En su pariente Baryonyx se conservaron escamas de pez en la cavidad abdominal; para este género es inferencia por morfología.',
  }),

  lokiceratops: dino({
    id: 'lokiceratops', rareza: RAREZA.EPICO, clado: CLADO.MARGINOCEFALO,
    binomial: 'Lokiceratops rangiformis',
    coste: 3, ataque: 4, vida: 7,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Fuera del alcance',
    rasgoTexto: 'No le afectan las cartas de evento de tu rival.',
    mecanica: Object.freeze({ inmune: INMUNE.EVENTO }),
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: 'Formación Judith River, Montana, Campaniense (~78 Ma), descrito en 2024. La gola lleva las mayores hojas óseas conocidas en un ceratópsido, asimétricas entre lados. Si servían para defensa, para exhibición o para reconocerse entre especies es justamente lo que se discute.',
  }),

  brachylophosaurus: dino({
    id: 'brachylophosaurus', rareza: RAREZA.RARO, clado: CLADO.ORNITOPODO,
    binomial: 'Brachylophosaurus canadensis',
    coste: 2, ataque: 0, vida: 10,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Rebaño de tres',
    rasgoTexto: 'Si llegas a tener 3 Brachylophosaurus en juego, éste gana +6 de Ataque para siempre.',
    mecanica: Object.freeze({ trio: { copias: 3, ataque: 6 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Formaciones Judith River y Oldman, Montana y Alberta, Campaniense (~78 Ma). Los lechos de huesos monoespecíficos de hadrosaurios son la mejor evidencia de vida en manada de todo el registro. De este taxón se conocen además ejemplares con tejido blando conservado.',
  }),

  tyrannotitan: dino({
    id: 'tyrannotitan', rareza: RAREZA.LEGENDARIO, clado: CLADO.TEROPODO,
    binomial: 'Tyrannotitan chubutensis',
    coste: 4, ataque: 10, vida: 7,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Tijera',
    rasgoTexto: 'Cuando entra en juego manda al descarte 1 dinosaurio rival de hasta 4 de Vida.',
    mecanica: Object.freeze({ entrada: { fulmina: 4 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Formación Cerro Barcino, Chubut, Argentina, Aptiense (~113 Ma). Carcarodontosáurido de unos 12 metros con dientes comprimidos y aserrados, de filo cortante en vez de aplastante. Que eso implique cortar carne y provocar hemorragias se infiere de la forma del diente, no de una herida fósil.',
  }),

  huaxiadraco: dino({
    id: 'huaxiadraco', rareza: RAREZA.RARO, clado: CLADO.PTEROSAURIO,
    binomial: 'Huaxiadraco corollatus',
    coste: 2, ataque: 2, vida: 4,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Vuelo de reconocimiento',
    rasgoTexto: 'Cuando entra en juego robas 1 carta.',
    mecanica: Object.freeze({ entrada: { roba: 1 } }),
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


  // ------------------------- eventos: los biomas que fueron clima, y un nido

  sabana_helechos: evento({
    id: 'sabana_helechos', rareza: RAREZA.COMUN, binomial: 'Sabana de helechos', coste: 0,
    objetivo: OBJETIVO.NINGUNO,
    rasgo: RASGO.SABANA_HELECHOS, rasgoNombre: 'Sabana de helechos',
    rasgoTexto: 'Robas 2 cartas. Luego descartas 1 carta de tu mano al azar.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Las llanuras abiertas de la Morrison estaban dominadas por helechos y no por hierba, que no existía. Una pradera de helecho es pasto abundante y de poca calidad: se come mucho y aprovecha poco.',
  }),

  inundacion: evento({
    id: 'inundacion', rareza: RAREZA.RARO, binomial: 'Llanura de inundación', coste: 2,
    objetivo: OBJETIVO.NINGUNO,
    rasgo: RASGO.INUNDACION, rasgoNombre: 'Llanura de inundación',
    rasgoTexto: 'Ambos jugadores pierden 3 cartas del mazo. Tú robas 1.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Las llanuras de inundación de la Morrison se construyeron crecida a crecida: limo de desbordamiento sobre paleosuelos. Una crecida arrasa a los dos lados del río, pero deja el suelo nuevo a quien vuelve primero.',
  }),

  canal_trenzado: evento({
    id: 'canal_trenzado', rareza: RAREZA.RARO, binomial: 'Canal fluvial trenzado', coste: 1,
    objetivo: OBJETIVO.NINGUNO,
    rasgo: RASGO.CANAL_TRENZADO, rasgoNombre: 'Canal fluvial trenzado',
    rasgoTexto: 'Todos tus dinosaurios recuperan 2 de Vida.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Los ríos de la Morrison eran trenzados: canales someros y cambiantes entre barras de arena, con agua todo el año en los tramos principales. Donde hay agua permanente hay descanso, bebida y sombra.',
  }),

  bosque_ribereno: evento({
    id: 'bosque_ribereno', rareza: RAREZA.EPICO, binomial: 'Bosque de coníferas ribereño', coste: 2,
    objetivo: OBJETIVO.NINGUNO,
    rasgo: RASGO.BOSQUE_RIBERENO, rasgoNombre: 'Bosque de coníferas ribereño',
    rasgoTexto: 'Tu rival descarta 2 cartas de su mano al azar.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Los bosques de galería pegados a los ríos son el único sitio de la Morrison donde la vegetación cierra la vista. Una manada que se mete en ellos deja de ver venir y pierde el rastro de lo que perseguía: se infiere de la etología de los grandes herbívoros actuales.',
  }),

  deriva_arida: evento({
    id: 'deriva_arida', rareza: RAREZA.EPICO, binomial: 'Deriva árida', coste: 2,
    objetivo: OBJETIVO.NINGUNO,
    rasgo: RASGO.DERIVA_ARIDA, rasgoNombre: 'Deriva árida',
    rasgoTexto: 'Ambos jugadores descartan la mano entera y roban otras tantas cartas.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'El clima de la Morrison se fue secando a lo largo del Kimmeridgiense y el Titoniense: paleosuelos con caliche, dunas al norte de la cuenca. Cuando el paisaje cambia, lo que cada uno tenía planeado deja de valer y hay que volver a empezar.',
  }),

  nido: evento({
    id: 'nido', rareza: RAREZA.COMUN, binomial: 'Nido con huevos', coste: 1,
    objetivo: OBJETIVO.NINGUNO,
    rasgo: RASGO.NIDO, rasgoNombre: 'Nido con huevos',
    rasgoTexto: 'Robas 2 cartas.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'La Morrison conserva nidos y huevos de saurópodo y de terópodo pequeño, y cáscaras dispersas en muchos yacimientos. Un nido es la promesa de lo que viene después.',
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


  insectos: recurso({
    id: 'insectos', rareza: RAREZA.COMUN, binomial: 'Nube de insectos',
    rasgo: RASGO.INSECTOS, rasgoNombre: 'Nube de insectos',
    rasgoTexto: '+1 Biomasa ahora mismo. Robas 1 carta.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Los humedales de la Morrison sostenían nubes de insectos: hay coprolitos y ámbar con restos, y los pequeños terópodos y pterosaurios vivían de ellos. Comida fácil, y donde hay insectos hay más cosas que encontrar.',
  }),

  manada_paso: recurso({
    id: 'manada_paso', rareza: RAREZA.RARO, binomial: 'Manada de paso',
    rasgo: RASGO.MANADA_PASO, rasgoNombre: 'Manada de paso',
    rasgoTexto: '+2 Biomasa ahora mismo. Pierdes 3 cartas de tu mazo.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Los rastros de la Morrison muestran grupos de saurópodos moviéndose juntos en la misma dirección. Una manada que cruza tu territorio deja mucho detrás, y se lleva por delante lo que había.',
  }),

  frutos: recurso({
    id: 'frutos', rareza: RAREZA.RARO, binomial: 'Frutos de cícada',
    rasgo: RASGO.FRUTOS, rasgoNombre: 'Frutos de cícada',
    rasgoTexto: '+3 Biomasa ahora mismo. Tu rival roba 1 carta.',
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Las cícadas y bennettitales producen semillas carnosas y aromáticas que atraen a quien las dispersa. Una cosecha así no se guarda: la huele todo el mundo.',
  }),

  // --------------------------------------------------------------- clima

  llanura: clima({
    id: 'llanura', coste: 1, rareza: RAREZA.EPICO, binomial: 'Crecida estacional',
    rasgo: RASGO.CAMPO_LLANURA, rasgoNombre: 'Crecida estacional',
    rasgoTexto: 'Mientras esté en el campo, cada jugador puede cambiar una carta de su mano por otra del mazo, una vez por turno.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'La riada estacional desborda el cauce y revuelve el paisaje: lo que había en un sitio aparece en otro.',
  }),

  canal: clima({
    id: 'canal', coste: 1, rareza: RAREZA.LEGENDARIO, binomial: 'Bruma de valle',
    rasgo: RASGO.CAMPO_CANAL, rasgoNombre: 'Bruma de valle',
    rasgoTexto: '+1 de Vida a todos los dinosaurios del campo, mientras siga en el campo.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Niebla de radiación en los fondos de valle al amanecer. Baja el estrés térmico de todo lo que respira, y en un clima estacionalmente seco eso es aguante.',
  }),

  bosque: clima({
    id: 'bosque', coste: 1, rareza: RAREZA.LEGENDARIO, binomial: 'Estación de lluvias',
    rasgo: RASGO.CAMPO_BOSQUE, rasgoNombre: 'Estación de lluvias',
    rasgoTexto: 'Los saurópodos curan 1 herida al final de cada turno.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'La estación húmeda rebrota el dosel de coníferas de ribera, al que sólo llegan los cuellos largos: es comida que los demás no alcanzan.',
  }),

  aridez: clima({
    id: 'aridez', coste: 1, rareza: RAREZA.LEGENDARIO, binomial: 'Sequía prolongada',
    rasgo: RASGO.CAMPO_ARIDEZ, rasgoNombre: 'Sequía prolongada',
    rasgoTexto: 'Durante 3 turnos, ambos jugadores pierden 1 carta del mazo al robar.',
    // Único clima que caduca: `duracion` son los turnos que se queda puesto,
    // contados en la fase de robo de los turnos siguientes.
    duracion: 3,
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Las secas del Kimmeridgiense dejaron paleosuelos con nódulos de caliche y acumulaciones de huesos en las charcas que se iban quedando sin agua.',
  }),

  sabana: clima({
    id: 'sabana', coste: 1, rareza: RAREZA.COMUN, binomial: 'Monzón de verano',
    rasgo: RASGO.CAMPO_SABANA, rasgoNombre: 'Monzón de verano',
    rasgoTexto: '+1 de Biomasa cada turno para los dos jugadores, mientras siga en el campo.',
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'La Morrison estaba bajo circulación monzónica: lluvias de verano concentradas que disparaban la productividad vegetal y dejaban el resto del año seco.',
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
    coste: 3, ataque: 8, vida: 4,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Sigue a los grandes',
    rasgoTexto: 'Gana +2 de Ataque si tienes en juego algún dinosaurio con más de 6 de Vida.',
    mecanica: Object.freeze({ si: { cuando: CUANDO.ALIADO_CON_VIDA, umbral: 6, ataque: 2 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Plesiosaurio pliosáurido del Cretácico Superior de Wyoming. No es un dinosaurio: es un reptil marino de cuello corto y cráneo enorme.',
  }),
  ojoraptorsaurus: dino({
    id: 'ojoraptorsaurus', rareza: RAREZA.RARO, clado: CLADO.TEROPODO,
    binomial: 'Ojoraptorsaurus boerei',
    coste: 2, ataque: 2, vida: 4,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Salto de entrada',
    rasgoTexto: 'Cuando entra en juego hiere en 2 al dinosaurio de enfrente.',
    mecanica: Object.freeze({ entrada: { emboscada: 2 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Oviraptorosaurio caenagnátido de la Formación Ojo Alamo, Nuevo México, Maastrichtiense. Se conoce por poco material pélvico.',
  }),
  dromaeosaurus: dino({
    id: 'dromaeosaurus', rareza: RAREZA.COMUN, clado: CLADO.TEROPODO,
    binomial: 'Dromaeosaurus albertensis',
    coste: 2, ataque: 3, vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Jauría',
    rasgoTexto: 'Gana +1 de Ataque por cada Dromaeosaurus en juego, sea de quien sea y este incluido.',
    mecanica: Object.freeze({ cuenta: { que: QUE.MISMA, ambos: true, ataque: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Dromeosáurido de la Formación Dinosaur Park, Alberta, Campaniense. Es el género que da nombre a toda la familia.',
  }),
  athenar: dino({
    id: 'athenar', rareza: RAREZA.COMUN, clado: CLADO.SAUROPODO,
    binomial: 'Athenar bermani',
    coste: 2, ataque: 2, vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Olfato de tormenta',
    rasgoTexto: 'Al jugarlo, puedes llevarte a la mano una carta de evento de tu mazo.',
    mecanica: Object.freeze({ busca: QUE.EVENTO }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Formación Morrison, cantera Carnegie del Dinosaur National Monument, Utah, Titoniense inferior (~149–145 Ma). Descrito en 2025 sobre un neurocráneo y techo craneal (CM 26552) que llevaba décadas archivado como Diplodocus. Es un dicreosáurido: saurópodos de cuello corto y talla modesta para el grupo, no un terópodo.',
  }),
  sanjuansaurus: dino({
    id: 'sanjuansaurus', rareza: RAREZA.RARO, clado: CLADO.TEROPODO,
    binomial: 'Sanjuansaurus gordilloi',
    coste: 2, ataque: 3, vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Olfato de tormenta',
    rasgoTexto: 'Al jugarlo, puedes llevarte a la mano una carta de clima de tu mazo.',
    mecanica: Object.freeze({ busca: QUE.CLIMA }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Herrerasáurido de la Formación Ischigualasto, Argentina, Carniense (~231 Ma). Los herrerasáuridos son saurisquios muy basales; su colocación entre los terópodos se discute.',
  }),
  suchomimus: dino({
    id: 'suchomimus', rareza: RAREZA.EPICO, clado: CLADO.TEROPODO,
    binomial: 'Suchomimus tenerensis',
    coste: 3, ataque: 7, vida: 7,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Rastreo de orilla',
    rasgoTexto: 'Cuando entra en juego descarta 1 carta del mazo de tu rival.',
    mecanica: Object.freeze({ entrada: { mueleRival: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Espinosáurido de la Formación Elrhaz, Níger, Aptiense. Hocico largo y cónico, adaptado a la pesca.',
  }),
  eosinopteryx: dino({
    id: 'eosinopteryx', rareza: RAREZA.COMUN, clado: CLADO.TEROPODO,
    binomial: 'Eosinopteryx brevipenna',
    coste: 0, ataque: 1, vida: 1,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Percha compartida',
    rasgoTexto: 'Gana +1 de Vida por cada Eosinopteryx que tengas en juego, este incluido.',
    mecanica: Object.freeze({ cuenta: { que: QUE.MISMA, ambos: false, vida: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Paraviano diminuto de la Formación Tiaojishan, China, Jurásico Superior. Conserva impresiones de plumas.',
  }),
  troodon: dino({
    id: 'troodon', rareza: RAREZA.COMUN, clado: CLADO.TEROPODO,
    binomial: 'Troodon formosus',
    coste: 1, ataque: 1, vida: 2,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Caza coordinada',
    rasgoTexto: 'Gana +1 de Ataque por cada Troodon que tengas en juego, este incluido.',
    mecanica: Object.freeze({ cuenta: { que: QUE.MISMA, ambos: false, ataque: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Terópodo maniraptor del Cretácico Superior de Norteamérica. El nombre se basa en dientes aislados y su validez está discutida.',
  }),
  carnotaurus: dino({
    id: 'carnotaurus', rareza: RAREZA.EPICO, clado: CLADO.TEROPODO,
    binomial: 'Carnotaurus sastrei',
    coste: 3, ataque: 7, vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Territorio exclusivo',
    rasgoTexto: 'Para jugarlo tienes que descartar 2 cartas de tu mano.',
    mecanica: Object.freeze({ costeExtra: { descartar: 2 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Abelisáurido de la Formación La Colonia, Argentina, Maastrichtiense. Cuernos frontales y brazos reducidos al extremo.',
  }),
  spinosaurus: dino({
    id: 'spinosaurus', rareza: RAREZA.LEGENDARIO, clado: CLADO.TEROPODO,
    binomial: 'Spinosaurus aegyptiacus',
    coste: 4, ataque: 10, vida: 8,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Draga el río',
    rasgoTexto: 'Cuando entra en juego descarta 5 cartas del mazo de tu rival y 2 del tuyo.',
    mecanica: Object.freeze({ entrada: { mueleRival: 5, muelePropio: 2 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Espinosáurido de los Kem Kem, Marruecos, Cenomaniense. Vela dorsal y un estilo de vida acuático que sigue debatiéndose.',
  }),
  mosasaurus: dino({
    id: 'mosasaurus', rareza: RAREZA.LEGENDARIO, clado: CLADO.MARINO,
    binomial: 'Mosasaurus hoffmannii',
    coste: 4, ataque: 8, vida: 10,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Draga el río',
    rasgoTexto: 'Cuando entra en juego descarta 5 cartas del mazo de tu rival y 2 del tuyo.',
    mecanica: Object.freeze({ entrada: { mueleRival: 5, muelePropio: 2 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Mosasaurio del Maastrichtiense. No es un dinosaurio: es un escamoso marino, pariente de varanos y serpientes.',
  }),
  halszkaraptor: dino({
    id: 'halszkaraptor', rareza: RAREZA.RARO, clado: CLADO.TEROPODO,
    binomial: 'Halszkaraptor escuilliei',
    coste: 1, ataque: 2, vida: 2,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Nadador de temporal',
    rasgoTexto: 'Gana +2 de Vida mientras haya un clima en el campo.',
    mecanica: Object.freeze({ si: { cuando: CUANDO.CLIMA, vida: 2 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Dromeosáurido halszkaraptorino de Mongolia, Campaniense. Cuello largo y hocico con muchos dientes pequeños; se ha propuesto un modo de vida semiacuático.',
  }),
  tongtianlong: dino({
    id: 'tongtianlong', rareza: RAREZA.COMUN, clado: CLADO.TEROPODO,
    binomial: 'Tongtianlong limosus',
    coste: 1, ataque: 1, vida: 1,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Nadador de temporal',
    rasgoTexto: 'Gana +2 de Ataque mientras haya un clima en el campo.',
    mecanica: Object.freeze({ si: { cuando: CUANDO.CLIMA, ataque: 2 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Oviraptorosaurio de la Formación Nanxiong, China, Maastrichtiense. El holotipo se conservó en postura de haber quedado atrapado en el barro.',
  }),
  scanisaurus: dino({
    id: 'scanisaurus', rareza: RAREZA.RARO, clado: CLADO.MARINO,
    binomial: 'Scanisaurus nazarowi',
    coste: 4, ataque: 3, vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Banco de caza',
    rasgoTexto: 'Mientras esté en juego, tus reptiles marinos ganan +1 de Ataque.',
    mecanica: Object.freeze({ aura: { clado: CLADO.MARINO, ataque: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Plesiosaurio elasmosáurido del Cretácico Superior del Báltico. No es un dinosaurio, y su validez como género está discutida.',
  }),
  monolophosaurus: dino({
    id: 'monolophosaurus', rareza: RAREZA.RARO, clado: CLADO.TEROPODO,
    binomial: 'Monolophosaurus jiangi',
    coste: 4, ataque: 3, vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Cresta de mando',
    rasgoTexto: 'Mientras esté en juego, tus terópodos ganan +1 de Vida.',
    mecanica: Object.freeze({ aura: { clado: CLADO.TEROPODO, vida: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Terópodo tetanuro de la Formación Shishugou, China, Jurásico Medio. Una sola cresta ósea recorre el cráneo.',
  }),
  invictarx: dino({
    id: 'invictarx', rareza: RAREZA.RARO, clado: CLADO.TIREOFORO,
    binomial: 'Invictarx zephyri',
    coste: 3, ataque: 1, vida: 1,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Formación cerrada',
    rasgoTexto: 'Mientras esté en juego, tus tireóforos ganan +1 de Vida.',
    mecanica: Object.freeze({ aura: { clado: CLADO.TIREOFORO, vida: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Anquilosaurio nodosáurido de la Formación Menefee, Nuevo México, Campaniense.',
  }),
  medusaceratops: dino({
    id: 'medusaceratops', rareza: RAREZA.EPICO, clado: CLADO.MARGINOCEFALO,
    binomial: 'Medusaceratops lokii',
    coste: 3, ataque: 2, vida: 10,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Muralla de golas',
    rasgoTexto: 'Mientras esté en juego, tus marginocéfalos ganan +1 de Ataque y +1 de Vida.',
    mecanica: Object.freeze({ aura: { clado: CLADO.MARGINOCEFALO, ataque: 1, vida: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Ceratópsido casmosaurino de la Formación Judith River, Montana, Campaniense.',
  }),
  platyceratops: dino({
    id: 'platyceratops', rareza: RAREZA.COMUN, clado: CLADO.MARGINOCEFALO,
    binomial: 'Platyceratops tatarinovi',
    coste: 1, ataque: 1, vida: 2,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Llamada de manada',
    rasgoTexto: 'Al jugarlo, puedes llevarte a la mano otro Platyceratops de tu mazo.',
    mecanica: Object.freeze({ busca: QUE.MISMA }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Ceratopsio bagaceratópsido de Mongolia, Campaniense. Pequeño y sin cuernos.',
  }),
  loricatosaurus: dino({
    id: 'loricatosaurus', rareza: RAREZA.COMUN, clado: CLADO.TIREOFORO,
    binomial: 'Loricatosaurus priscus',
    coste: 3, ataque: 0, vida: 8,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Terraplén',
    rasgoTexto: 'Cuando entra en juego tu hábitat recupera 2 puntos.',
    mecanica: Object.freeze({ entrada: { curaHabitat: 2 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Estegosáurido del Calloviense de Inglaterra y Francia. Se separó del material antes atribuido a Lexovisaurus.',
  }),
  therizinosaurus: dino({
    id: 'therizinosaurus', rareza: RAREZA.COMUN, clado: CLADO.TEROPODO,
    binomial: 'Therizinosaurus cheloniformis',
    coste: 3, ataque: 1, vida: 6,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Garra de sequía',
    rasgoTexto: 'Gana +3 de Ataque mientras haya un clima en el campo.',
    mecanica: Object.freeze({ si: { cuando: CUANDO.CLIMA, ataque: 3 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Terizinosaurio de la Formación Nemegt, Mongolia, Maastrichtiense. Terópodo herbívoro con las garras manuales más largas que se conocen.',
  }),
  alaskacephale: dino({
    id: 'alaskacephale', rareza: RAREZA.RARO, clado: CLADO.MARGINOCEFALO,
    binomial: 'Alaskacephale gangloffi',
    coste: 2, ataque: 2, vida: 4,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Testarazo',
    rasgoTexto: 'Cuando entra en juego hiere en 2 al dinosaurio de enfrente.',
    mecanica: Object.freeze({ entrada: { emboscada: 2 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Paquicefalosaurio de la Formación Prince Creek, Alaska, Campaniense.',
  }),
  titanoceratops: dino({
    id: 'titanoceratops', rareza: RAREZA.EPICO, clado: CLADO.MARGINOCEFALO,
    binomial: 'Titanoceratops ouranos',
    coste: 3, ataque: 5, vida: 7,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Cuerno mayor',
    rasgoTexto: 'Gana +1 de Ataque por cada marginocéfalo que tengas en juego, este incluido.',
    mecanica: Object.freeze({ cuenta: { que: QUE.CLADO, ambos: false, ataque: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Ceratópsido casmosaurino de Nuevo México, Campaniense. Se propuso separándolo de material asignado a Pentaceratops, y no todos lo aceptan.',
  }),
  atlasaurus: dino({
    id: 'atlasaurus', rareza: RAREZA.EPICO, clado: CLADO.SAUROPODO,
    binomial: 'Atlasaurus imelakei',
    coste: 3, ataque: 2, vida: 10,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Sombra del cuello',
    rasgoTexto: 'Mientras esté en juego, tus saurópodos ganan +1 de Vida.',
    mecanica: Object.freeze({ aura: { clado: CLADO.SAUROPODO, vida: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Saurópodo del Jurásico Medio de Marruecos. Extremidades desproporcionadamente largas para un saurópodo.',
  }),
  stegoceras: dino({
    id: 'stegoceras', rareza: RAREZA.COMUN, clado: CLADO.MARGINOCEFALO,
    binomial: 'Stegoceras validum',
    coste: 2, ataque: 1, vida: 8,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Cabezazo de vuelta',
    rasgoTexto: 'Devuelve 2 de daño a quien lo hiera en combate.',
    mecanica: Object.freeze({ espinas: 2 }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Paquicefalosaurio de la Formación Dinosaur Park, Alberta, Campaniense. Domo craneal grueso.',
  }),
  maiasaura: dino({
    id: 'maiasaura', rareza: RAREZA.LEGENDARIO, clado: CLADO.ORNITOPODO,
    binomial: 'Maiasaura peeblesorum',
    coste: 3, ataque: 3, vida: 10,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Buena madre',
    rasgoTexto: 'Al final de tu turno, todos tus dinosaurios recuperan 1 de Vida.',
    mecanica: Object.freeze({ regenera: { aliados: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Hadrosáurido de la Formación Two Medicine, Montana, Campaniense. Sus nidadas documentan cuidado parental.',
  }),
  edmontosaurus: dino({
    id: 'edmontosaurus', rareza: RAREZA.LEGENDARIO, clado: CLADO.ORNITOPODO,
    binomial: 'Edmontosaurus annectens',
    coste: 4, ataque: 2, vida: 10,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Migración en masa',
    rasgoTexto: 'Mientras esté en juego, tus ornitópodos ganan +1 de Ataque y +1 de Vida.',
    mecanica: Object.freeze({ aura: { clado: CLADO.ORNITOPODO, ataque: 1, vida: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Hadrosáurido del Maastrichtiense de Norteamérica. Uno de los dinosaurios con más ejemplares conocidos.',
  }),
  plateosauravus: dino({
    id: 'plateosauravus', rareza: RAREZA.COMUN, clado: CLADO.SAUROPODO,
    binomial: 'Plateosauravus cullingworthi',
    coste: 2, ataque: 2, vida: 2,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Colonia de ribera',
    rasgoTexto: 'Gana +1 de Ataque y +1 de Vida por cada Plateosauravus que tengas en juego, este incluido.',
    mecanica: Object.freeze({ cuenta: { que: QUE.MISMA, ambos: false, ataque: 1, vida: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Sauropodomorfo basal de la Formación Elliot, Sudáfrica, Triásico Superior. No es un saurópodo verdadero; se agrupa aquí por plan corporal. Su posición es incierta incluso dentro de los plateosaurios, y parte del material asignado se considera indeterminado.',
  }),
  gargoyleosaurus: dino({
    id: 'gargoyleosaurus', rareza: RAREZA.RARO, clado: CLADO.TIREOFORO,
    binomial: 'Gargoyleosaurus parkpinorum',
    coste: 2, ataque: 2, vida: 4,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Osteodermos',
    rasgoTexto: 'Devuelve 3 de daño a quien lo hiera en combate.',
    mecanica: Object.freeze({ espinas: 3 }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Anquilosaurio de la Formación Morrison, Jurásico Superior. Uno de los anquilosaurios más antiguos que se conocen bien.',
  }),
  wendiceratops: dino({
    id: 'wendiceratops', rareza: RAREZA.EPICO, clado: CLADO.MARGINOCEFALO,
    binomial: 'Wendiceratops pinhornensis',
    coste: 3, ataque: 5, vida: 8,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Embestida',
    rasgoTexto: 'Cuando entra en juego manda al descarte 1 dinosaurio rival de hasta 2 de Vida.',
    mecanica: Object.freeze({ entrada: { fulmina: 2 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Ceratópsido centrosaurino de la Formación Oldman, Alberta, Campaniense.',
  }),
  antarctosaurus: dino({
    id: 'antarctosaurus', rareza: RAREZA.LEGENDARIO, clado: CLADO.SAUROPODO,
    binomial: 'Antarctosaurus wichmannianus',
    coste: 4, ataque: 2, vida: 12,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Refugio polar',
    rasgoTexto: 'Mientras esté en juego, a ninguno de tus dinosaurios le afectan los efectos del clima.',
    mecanica: Object.freeze({ aura: { clado: TODOS, inmune: INMUNE.CLIMA } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Titanosaurio del Cretácico Superior de Argentina. El material asignado al género es heterogéneo y su validez se discute.',
  }),
  liaoceratops: dino({
    id: 'liaoceratops', rareza: RAREZA.COMUN, clado: CLADO.MARGINOCEFALO,
    binomial: 'Liaoceratops yanzigouensis',
    coste: 1, ataque: 1, vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Grito de aviso',
    rasgoTexto: 'Al jugarlo, puedes llevarte a la mano un marginocéfalo de tu mazo.',
    mecanica: Object.freeze({ busca: CLADO.MARGINOCEFALO }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Neoceratopsio basal de la Formación Yixian, China, Barremiense. Pequeño y sin gola desarrollada.',
  }),
  rhinorex: dino({
    id: 'rhinorex', rareza: RAREZA.EPICO, clado: CLADO.ORNITOPODO,
    binomial: 'Rhinorex condrupus',
    coste: 3, ataque: 3, vida: 8,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Última llanura',
    rasgoTexto: 'Gana +2 de Ataque mientras tu hábitat esté por debajo del de tu rival.',
    mecanica: Object.freeze({ si: { cuando: CUANDO.HABITAT_DETRAS, ataque: 2 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Hadrosáurido saurolofino de la Formación Neslen, Utah, Campaniense. Destaca por el gran arco nasal.',
  }),
  bienosaurus: dino({
    id: 'bienosaurus', rareza: RAREZA.COMUN, clado: CLADO.TIREOFORO,
    binomial: 'Bienosaurus lufengensis',
    coste: 1, ataque: 1, vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Cría acorazada',
    rasgoTexto: 'Gana +1 de Vida por cada tireóforo que tengas en juego, este incluido.',
    mecanica: Object.freeze({ cuenta: { que: QUE.CLADO, ambos: false, vida: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Tireóforo basal de la Formación Lufeng, China, Jurásico Inferior. Se conoce por una mandíbula, y su validez está discutida.',
  }),
  shuangmiaosaurus: dino({
    id: 'shuangmiaosaurus', rareza: RAREZA.COMUN, clado: CLADO.ORNITOPODO,
    binomial: 'Shuangmiaosaurus gilmorei',
    coste: 2, ataque: 2, vida: 4,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Ramoneo de orilla',
    rasgoTexto: 'Cuando entra en juego tu hábitat recupera 1 punto.',
    mecanica: Object.freeze({ entrada: { curaHabitat: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Hadrosauroideo basal de la Formación Sunjiawan, China, Cretácico Superior.',
  }),
  chasmosaurus: dino({
    id: 'chasmosaurus', rareza: RAREZA.COMUN, clado: CLADO.MARGINOCEFALO,
    binomial: 'Chasmosaurus belli',
    coste: 2, ataque: 2, vida: 4,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Vigía de la gola',
    rasgoTexto: 'Cuando entra en juego robas 1 carta.',
    mecanica: Object.freeze({ entrada: { roba: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Ceratópsido casmosaurino de la Formación Dinosaur Park, Alberta, Campaniense. Gola muy grande con dos aberturas amplias.',
  }),


  // ------------------------------------------ la ronda de las cien cartas

  tyrannosaurus: dino({
    id: 'tyrannosaurus', rareza: RAREZA.LEGENDARIO, clado: CLADO.TEROPODO,
    binomial: 'Tyrannosaurus rex',
    coste: 4, ataque: 11, vida: 9,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Rugido',
    rasgoTexto: 'Cuando entra en juego tu rival descarta 2 cartas de su mano al azar.',
    mecanica: Object.freeze({ entrada: { manoRival: 2 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Tiranosáurido de la Formación Hell Creek, Maastrichtiense. El oído interno y la caja craneal sugieren sensibilidad a frecuencias bajas; el rugido es una licencia, los animales actuales de ese tamaño no rugen.',
  }),
  velociraptor: dino({
    id: 'velociraptor', rareza: RAREZA.COMUN, clado: CLADO.TEROPODO,
    binomial: 'Velociraptor mongoliensis',
    coste: 0, ataque: 3, vida: 2,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Garra impaciente',
    rasgoTexto: 'Para jugarlo tienes que descartar 1 carta de tu mano.',
    mecanica: Object.freeze({ costeExtra: { descartar: 1 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Dromeosáurido de la Formación Djadokhta, Mongolia, Campaniense. Del tamaño de un pavo y con plumas: los cúbitos llevan las inserciones de las rémiges.',
  }),
  brachiosaurus: dino({
    id: 'brachiosaurus', rareza: RAREZA.LEGENDARIO, clado: CLADO.SAUROPODO,
    binomial: 'Brachiosaurus altithorax',
    coste: 4, ataque: 3, vida: 13,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Sombra del gigante',
    rasgoTexto: 'Mientras esté en juego, todos tus dinosaurios ganan +1 de Vida.',
    mecanica: Object.freeze({ aura: { clado: TODOS, vida: 1 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Saurópodo de la Morrison, raro en el registro. Patas delanteras más largas que las traseras y cuello alzado: comía donde ningún otro llegaba.',
  }),
  argentinosaurus: dino({
    id: 'argentinosaurus', rareza: RAREZA.EPICO, clado: CLADO.SAUROPODO,
    binomial: 'Argentinosaurus huinculensis',
    coste: 4, ataque: 4, vida: 14,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Peso muerto',
    rasgoTexto: 'Para jugarlo tienes que descartar 2 cartas de tu mano.',
    mecanica: Object.freeze({ costeExtra: { descartar: 2 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Titanosaurio de la Formación Huincul, Argentina, Cenomaniense. Se conoce por unas pocas vértebras y una tibia; la masa estimada, de 65 a 75 toneladas, es de las mayores de cualquier animal terrestre.',
  }),
  mamenchisaurus: dino({
    id: 'mamenchisaurus', rareza: RAREZA.RARO, clado: CLADO.SAUROPODO,
    binomial: 'Mamenchisaurus hochuanensis',
    coste: 4, ataque: 1, vida: 11,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Cuello sin fin',
    rasgoTexto: 'Al final de tu turno recupera 1 de Vida.',
    mecanica: Object.freeze({ regenera: { propia: 1 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Saurópodo de la Formación Shaximiao, China, Jurásico Superior. Diecinueve vértebras cervicales: el cuello más largo en proporción al cuerpo de cualquier saurópodo conocido.',
  }),
  amargasaurus: dino({
    id: 'amargasaurus', rareza: RAREZA.RARO, clado: CLADO.SAUROPODO,
    binomial: 'Amargasaurus cazadorensis',
    coste: 2, ataque: 2, vida: 5,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Rebaño de cuellos',
    rasgoTexto: 'Gana +1 de Vida por cada saurópodo que tengas en juego, este incluido.',
    mecanica: Object.freeze({ cuenta: { que: QUE.CLADO, ambos: false, vida: 1 } }),
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: 'Dicreosáurido de la Formación La Amarga, Argentina, Barremiense. Las espinas neurales bífidas del cuello se han interpretado como vela, como defensa y como estructura de exhibición; no hay consenso.',
  }),
  ankylosaurus: dino({
    id: 'ankylosaurus', rareza: RAREZA.LEGENDARIO, clado: CLADO.TIREOFORO,
    binomial: 'Ankylosaurus magniventris',
    coste: 4, ataque: 2, vida: 12,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Maza de cola',
    rasgoTexto: 'Devuelve 4 de daño a quien lo hiera en combate.',
    mecanica: Object.freeze({ espinas: 4 }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Anquilosáurido de Hell Creek, Maastrichtiense. La maza caudal está formada por osteodermos fusionados sobre vértebras rígidas; los modelos biomecánicos le dan fuerza para romper hueso.',
  }),
  kentrosaurus: dino({
    id: 'kentrosaurus', rareza: RAREZA.COMUN, clado: CLADO.TIREOFORO,
    binomial: 'Kentrosaurus aethiopicus',
    coste: 1, ataque: 1, vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Púas de hombro',
    rasgoTexto: 'Devuelve 1 de daño a quien lo hiera en combate.',
    mecanica: Object.freeze({ espinas: 1 }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Estegosáurido de la Formación Tendaguru, Tanzania, Kimmeridgiense: contemporáneo de la Morrison al otro lado del mundo. Púas largas en la cola y una par en los hombros o la cadera.',
  }),
  euoplocephalus: dino({
    id: 'euoplocephalus', rareza: RAREZA.RARO, clado: CLADO.TIREOFORO,
    binomial: 'Euoplocephalus tutus',
    coste: 3, ataque: 2, vida: 8,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Párpados de hueso',
    rasgoTexto: 'No le afectan las cartas de evento de tu rival.',
    mecanica: Object.freeze({ inmune: INMUNE.EVENTO }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Anquilosáurido de la Formación Dinosaur Park, Alberta, Campaniense. Tenía párpados óseos: un osteodermo articulado que cerraba sobre el ojo.',
  }),
  triceratops: dino({
    id: 'triceratops', rareza: RAREZA.EPICO, clado: CLADO.MARGINOCEFALO,
    binomial: 'Triceratops horridus',
    coste: 4, ataque: 5, vida: 8,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Tres cuernos',
    rasgoTexto: 'Cuando entra en juego manda al descarte 1 dinosaurio rival de hasta 3 de Vida.',
    mecanica: Object.freeze({ entrada: { fulmina: 3 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Ceratópsido de Hell Creek y Lance, Maastrichtiense. Las lesiones cicatrizadas en golas y cuernos de otros Triceratops indican combates entre ellos con los cuernos.',
  }),
  pachycephalosaurus: dino({
    id: 'pachycephalosaurus', rareza: RAREZA.RARO, clado: CLADO.MARGINOCEFALO,
    binomial: 'Pachycephalosaurus wyomingensis',
    coste: 2, ataque: 3, vida: 4,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Cabezazo',
    rasgoTexto: 'Cuando entra en juego hiere en 3 al dinosaurio de enfrente.',
    mecanica: Object.freeze({ entrada: { emboscada: 3 } }),
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: 'Paquicefalosáurido de Hell Creek y Lance, Maastrichtiense. La cúpula de 25 cm de hueso macizo se ha interpretado como arma de topetazo; las lesiones en cúpulas de varios ejemplares lo apoyan, la estructura interna lo discute.',
  }),
  iguanodon: dino({
    id: 'iguanodon', rareza: RAREZA.RARO, clado: CLADO.ORNITOPODO,
    binomial: 'Iguanodon bernissartensis',
    coste: 2, ataque: 3, vida: 5,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Manada de Bernissart',
    rasgoTexto: 'Gana +1 de Ataque por cada Iguanodon en juego, sea de quien sea y este incluido.',
    mecanica: Object.freeze({ cuenta: { que: QUE.MISMA, ambos: true, ataque: 1 } }),
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: 'Ornitópodo del Barremiense de Bélgica. Los más de treinta esqueletos de la mina de Bernissart se interpretaron como una manada muerta a la vez; hoy se cree que se acumularon en varios episodios.',
  }),
  parasaurolophus: dino({
    id: 'parasaurolophus', rareza: RAREZA.RARO, clado: CLADO.ORNITOPODO,
    binomial: 'Parasaurolophus walkeri',
    coste: 3, ataque: 2, vida: 8,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Llamada resonante',
    rasgoTexto: 'Cuando entra en juego robas 1 carta y tu hábitat recupera 1 punto.',
    mecanica: Object.freeze({ entrada: { roba: 1, curaHabitat: 1 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Hadrosáurido de la Formación Dinosaur Park, Alberta, Campaniense. La cresta tubular es un resonador: los modelos acústicos le dan una nota grave, en torno a los 30 Hz.',
  }),
  pteranodon: dino({
    id: 'pteranodon', rareza: RAREZA.COMUN, clado: CLADO.PTEROSAURIO,
    binomial: 'Pteranodon longiceps',
    coste: 0, ataque: 2, vida: 2,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Planeo',
    rasgoTexto: 'Cuando entra en juego pierdes 1 carta de tu mazo y robas 1.',
    mecanica: Object.freeze({ entrada: { muelePropio: 1, roba: 1 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Pterosaurio de la Niobrara, Kansas, Santoniense, con más de mil ejemplares conocidos. Envergadura de hasta seis metros y sin dientes: pescaba en un mar interior.',
  }),
  quetzalcoatlus: dino({
    id: 'quetzalcoatlus', rareza: RAREZA.EPICO, clado: CLADO.PTEROSAURIO,
    binomial: 'Quetzalcoatlus northropi',
    coste: 3, ataque: 5, vida: 4,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Sombra en la llanura',
    rasgoTexto: 'Cuando entra en juego tu rival pierde 3 cartas del mazo.',
    mecanica: Object.freeze({ entrada: { mueleRival: 3 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Azdárquido de la Formación Javelina, Texas, Maastrichtiense. Envergadura de diez metros y patas largas: se le reconstruye cazando a pie por la llanura, como una cigüeña gigante.',
  }),
  elasmosaurus: dino({
    id: 'elasmosaurus', rareza: RAREZA.RARO, clado: CLADO.MARINO,
    binomial: 'Elasmosaurus platyurus',
    coste: 3, ataque: 2, vida: 9,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Cuello de vigía',
    rasgoTexto: 'Resta 1 a cada golpe que llegue a tu hábitat.',
    mecanica: Object.freeze({ guardia: { habitat: 1 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Plesiosaurio de la Niobrara, Kansas, Campaniense. Setenta y dos vértebras cervicales, más que ningún otro animal conocido; el cuello era poco flexible y probablemente servía para acercarse a los bancos de peces desde abajo.',
  }),
  // ------------------------------------------------------------- biomasa

  // La única carta que no se juega para HACER algo, sino para poder hacerlo:
  // da Biomasa y te cuesta una carta de tu propio mazo. Es la decisión que la
  // renta fija no ofrecía —acelerar hoy o durar más— y por eso el coste es el
  // MAZO y no Biomasa: pagar con lo mismo que da no sería una decisión.
  //
  // Van en CARTAS y no en CARTAS_ECONOMIA. Las de ahí son el mazo de tierras de
  // una variante que no se publica; éstas salen en sobres, se funden y se llevan
  // en el mazo como cualquier otra.
  //
  // Son DIEZ y no una: siete comunes que hacen lo mismo con otra ilustración
  // —las tierras básicas de Magic—, dos épicas de +2 y una legendaria de +3.
  // Los números van en cada carta, en `biomasa`, y no en BALANCE, porque ya
  // no son un número: son tres. `test/textos.test.js` los compara con el texto.
  //
  // Medido antes de escribirlas (600 partidas, bandos alternados, contra el
  // mazo de referencia): la épica en vez de dos Praderas gana el 50,0 %, la
  // legendaria en vez de una el 51,3 %. La Biomasa no es el cuello de botella
  // de este juego —lo es la mano— y moler no muerde con la extinción en el
  // 0,3 %. Y NO hace falta un tope compartido entre las diez: meter más de
  // siete desplaza criaturas y el mazo empeora (44,8 % con doce, 39,8 % con
  // catorce Praderas). Se autolimitan, como las tierras.
  biomasa: biomasa({
    id: 'biomasa', rareza: RAREZA.COMUN,
    binomial: 'Pradera de helechos', rasgoNombre: 'Pradera de helechos',
    rasgoTexto: '+1 Biomasa al bajarla. Pierdes 1 carta de tu mazo. Una por turno.',
    biomasa: Object.freeze({ da: 1, muele: 1 }),
    // El tope de copias NO sale de su rareza: es la única carta del set con uno
    // propio. Siete en un mazo de 55 es lo que se midió; con cinco el efecto se
    // queda a una décima de cumplir el objetivo del jugador inicial. Las seis
    // comunes gemelas van a 3 por rareza, como todo: el 7 se queda aquí porque
    // es lo que da la colección de salida y lo que los ocho jugadores ya tienen.
    copiasMax: 7,
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Los helechos dominan el registro polínico de la Morrison y son la base de la productividad vegetal que sostenía a los saurópodos. La pradera de helecho se infiere de esa abundancia junto a la escasez de troncos en las llanuras aluviales.',
  }),
  araucarias: biomasa({
    id: 'araucarias', rareza: RAREZA.COMUN,
    binomial: 'Bosque de araucarias', rasgoNombre: 'Bosque de araucarias',
    rasgoTexto: '+1 Biomasa al bajarla. Pierdes 1 carta de tu mazo. Una por turno.',
    biomasa: Object.freeze({ da: 1, muele: 1 }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'La madera fósil de tipo araucariáceo y el follaje de Brachyphyllum son de lo más abundante del registro vegetal de la Morrison: las coníferas formaban el dosel donde había agua bastante para sostener árboles.',
  }),
  ginkgos: biomasa({
    id: 'ginkgos', rareza: RAREZA.COMUN,
    binomial: 'Arboleda de ginkgos', rasgoNombre: 'Arboleda de ginkgos',
    rasgoTexto: '+1 Biomasa al bajarla. Pierdes 1 carta de tu mazo. Una por turno.',
    biomasa: Object.freeze({ da: 1, muele: 1 }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Hojas en abanico de tipo Ginkgoites aparecen en la flora de la Morrison, aunque son mucho más raras que las coníferas. Que formasen arboledas y no árboles sueltos se infiere de floras jurásicas contemporáneas mejor conservadas.',
  }),
  cicadas: biomasa({
    id: 'cicadas', rareza: RAREZA.COMUN,
    binomial: 'Matorral de cícadas', rasgoNombre: 'Matorral de cícadas',
    rasgoTexto: '+1 Biomasa al bajarla. Pierdes 1 carta de tu mazo. Una por turno.',
    biomasa: Object.freeze({ da: 1, muele: 1 }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Cícadas y bennettitales, como Zamites, están bien representadas en la Morrison. Son plantas de porte bajo, tronco grueso y hoja rígida, propias de terreno seco y abierto.',
  }),
  equisetos: biomasa({
    id: 'equisetos', rareza: RAREZA.COMUN,
    binomial: 'Juncal de equisetos', rasgoNombre: 'Juncal de equisetos',
    rasgoTexto: '+1 Biomasa al bajarla. Pierdes 1 carta de tu mazo. Una por turno.',
    biomasa: Object.freeze({ da: 1, muele: 1 }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: 'Los equisetos —colas de caballo— se conservan en la Morrison en posición de vida, en los depósitos de orilla. Crecen densos y rebrotan rápido, y se les supone un papel importante en la dieta de los saurópodos.',
  }),
  galeria: biomasa({
    id: 'galeria', rareza: RAREZA.COMUN,
    binomial: 'Bosque de galería', rasgoNombre: 'Bosque de galería',
    rasgoTexto: '+1 Biomasa al bajarla. Pierdes 1 carta de tu mazo. Una por turno.',
    biomasa: Object.freeze({ da: 1, muele: 1 }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'En una cuenca semiárida los árboles se concentran donde hay agua permanente: las franjas de coníferas y helechos arborescentes pegadas a los canales se infieren de la distribución de la madera fósil y de la sedimentología de los ríos de la Morrison.',
  }),
  helechal: biomasa({
    id: 'helechal', rareza: RAREZA.COMUN,
    binomial: 'Helechal arborescente', rasgoNombre: 'Helechal arborescente',
    rasgoTexto: '+1 Biomasa al bajarla. Pierdes 1 carta de tu mazo. Una por turno.',
    biomasa: Object.freeze({ da: 1, muele: 1 }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Frondas de helecho de tipo Coniopteris y de otras formas afines a los helechos arborescentes actuales aparecen en la Morrison. Que formasen sotobosques cerrados y húmedos se infiere de sus parientes vivos, que no toleran el sol directo ni la sequía.',
  }),
  vega: biomasa({
    id: 'vega', rareza: RAREZA.EPICO,
    binomial: 'Vega de aluvión', rasgoNombre: 'Vega de aluvión',
    rasgoTexto: '+2 Biomasa al bajarla. Pierdes 2 cartas de tu mazo. Una por turno.',
    biomasa: Object.freeze({ da: 2, muele: 2 }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'Las llanuras de inundación de la Morrison están hechas de limo de crecida, y los paleosuelos que conservan muestran raíces y bioturbación. Un suelo recién cubierto por una crecida es lo más fértil que ofrece la cuenca, y lo primero que rebrota son los helechos.',
  }),
  humedal: biomasa({
    id: 'humedal', rareza: RAREZA.EPICO,
    binomial: 'Humedal de tierras bajas', rasgoNombre: 'Humedal de tierras bajas',
    rasgoTexto: '+2 Biomasa al bajarla. Pierdes 2 cartas de tu mazo. Una por turno.',
    biomasa: Object.freeze({ da: 2, muele: 2 }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'El miembro Brushy Basin conserva depósitos de charcas y marismas con carofitas, ostrácodos y restos de plantas acuáticas. Un humedal en una cuenca seca concentra la vida vegetal y la animal que va detrás; el yacimiento de Mygatt-Moore se interpreta como uno de ellos.',
  }),
  manantial: biomasa({
    id: 'manantial', rareza: RAREZA.LEGENDARIO,
    binomial: 'Manantial perenne', rasgoNombre: 'Manantial perenne',
    rasgoTexto: '+3 Biomasa al bajarla. Pierdes 3 cartas de tu mazo. Una por turno.',
    biomasa: Object.freeze({ da: 3, muele: 3 }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: 'El clima de la Morrison era estacional y semiárido, con largas secas. Un manantial que no se seca es el sitio más raro y más rico de una cuenca así: alrededor crece lo que no crece en ninguna otra parte, y hacia él convergen los animales en la estación seca. Se infiere de los paleosuelos y de las concentraciones de fauna; ninguno está identificado como tal.',
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
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Dueño de la llanura',
    rasgoTexto: 'Mientras esté en juego, tus terópodos ganan +1 de Ataque.',
    mecanica: Object.freeze({ aura: { clado: CLADO.TEROPODO, ataque: 1 } }),
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
    rasgo: RASGO.NINGUNO,
    rasgoNombre: 'Cortina de cuellos',
    rasgoTexto: 'Mientras esté en juego, tu hábitat recibe 1 punto menos de daño de cada dinosaurio rival.',
    mecanica: Object.freeze({ guardia: { habitat: 1 } }),
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
