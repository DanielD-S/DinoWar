// DinoWar — Edge Function del asalto, EMPAQUETADA.
//
// GENERADO por `node tools/empaquetar-asalto.mjs`. **No editar a mano**: el
// original es supabase/functions/asalto/index.ts y lo que se toque aquí se
// pierde en el siguiente empaquetado.
//
// Existe sólo para poder desplegar desde el editor del panel de Supabase, que
// es de un fichero. Con la CLI no hace falta: `supabase functions deploy asalto`
// resuelve los imports él solo.
//
// Lleva dentro el motor de juego entero —el MISMO que corre en el navegador—
// porque el servidor re-juega la partida para calcular el daño en vez de
// creerse lo que le diga el cliente.
//
// huella: 7f94f1201968a812
//
// Lleva dentro estos 16 ficheros del repositorio. La lista la da
// esbuild, no una suposición mía: si mañana la función importa un módulo más,
// aparece aquí solo. Un test recalcula la huella sobre esta misma lista y falla
// si el paquete se ha quedado atrás del código.
// fuente: src/data/cards.js
// fuente: src/data/balance.js
// fuente: src/engine/rng.js
// fuente: src/engine/state.js
// fuente: src/data/dietas.js
// fuente: src/engine/economia.js
// fuente: src/engine/resolve.js
// fuente: src/engine/actions.js
// fuente: src/engine/ai.js
// fuente: src/data/tribu.js
// fuente: src/data/eventos.js
// fuente: supabase/functions/_compartido/validarPartida.js
// fuente: supabase/functions/_compartido/validarAsalto.js
// fuente: src/data/coleccion.js
// fuente: supabase/functions/_compartido/validarSolitario.js
// fuente: supabase/functions/asalto/index.ts

// supabase/functions/asalto/index.ts
import { createClient } from "jsr:@supabase/supabase-js@2";

// src/data/cards.js
var EVIDENCIA = Object.freeze({
  ESTABLECIDO: "ESTABLECIDO",
  INFERIDO: "INFERIDO",
  DEBATIDO: "DEBATIDO"
});
var TIPO = Object.freeze({
  DINOSAURIO: "DINOSAURIO",
  EVENTO: "EVENTO",
  // te beneficia o le estorba al rival
  CLIMA: "CLIMA",
  // afecta a los dos bandos, para bien o para mal
  RECURSO: "RECURSO",
  // Biomasa inmediata a cambio de un inconveniente
  // Sólo en la variante de economía por cartas. No está en CARTAS ni sale en
  // sobres: ver CARTAS_ECONOMIA al final del fichero.
  BIOMASA: "BIOMASA"
});
var OBJETIVO = Object.freeze({
  PROPIO: "PROPIO",
  // un dinosaurio tuyo
  RIVAL: "RIVAL",
  // un dinosaurio del rival
  CLADO: "CLADO",
  // todos los rivales de un clado que eliges
  RIVALES: "RIVALES",
  // varios dinosaurios del rival, elegidos uno a uno
  // No se elige nada: la carta cae sobre la mesa entera. Antes esto se llamaba
  // CAMPO y valía a la vez para «no tiene objetivo» y para «ocupa la ranura de
  // clima», que son cosas distintas: por eso una Mortandad se podía soltar
  // sobre la franja del clima y parecía que la estabas poniendo de clima.
  // Qué ocupa la ranura lo dice el tipo de la carta, no su objetivo.
  NINGUNO: "NINGUNO"
});
var RAREZA = Object.freeze({
  COMUN: "COMUN",
  RARO: "RARO",
  EPICO: "EPICO",
  LEGENDARIO: "LEGENDARIO"
});
var RAREZA_NOMBRE = Object.freeze({
  COMUN: "Com\xFAn",
  RARO: "Rara",
  EPICO: "\xC9pica",
  LEGENDARIO: "Legendaria"
});
var TIPO_NOMBRE = Object.freeze({
  DINOSAURIO: "Dinosaurio",
  EVENTO: "Evento",
  CLIMA: "Clima",
  RECURSO: "Recurso",
  BIOMASA: "Biomasa"
});
var CLADO = Object.freeze({
  TEROPODO: "TEROPODO",
  SAUROPODO: "SAUROPODO",
  TIREOFORO: "TIREOFORO",
  ORNITOPODO: "ORNITOPODO",
  MARGINOCEFALO: "MARGINOCEFALO",
  // Ni pterosaurios ni marinos son dinosaurios. Están porque el set se abrió a
  // la fauna que compartía paisaje con ellos, y llevan clado propio para que la
  // ficha no mienta al llamarlos dinosaurio.
  PTEROSAURIO: "PTEROSAURIO",
  MARINO: "MARINO"
});
var CLADO_NOMBRE = Object.freeze({
  TEROPODO: "Ter\xF3podo",
  SAUROPODO: "Saur\xF3podo",
  TIREOFORO: "Tire\xF3foro",
  ORNITOPODO: "Ornit\xF3podo",
  MARGINOCEFALO: "Marginoc\xE9falo",
  PTEROSAURIO: "Pterosaurio",
  MARINO: "Reptil marino"
});
var ES_DINOSAURIO = Object.freeze({
  [CLADO.TEROPODO]: true,
  [CLADO.SAUROPODO]: true,
  [CLADO.TIREOFORO]: true,
  [CLADO.ORNITOPODO]: true,
  [CLADO.MARGINOCEFALO]: true,
  [CLADO.PTEROSAURIO]: false,
  [CLADO.MARINO]: false
});
var RASGO = Object.freeze({
  // Sin rasgo. Una carta que sólo trae sus cifras es una carta legítima, y es
  // además el punto de partida de toda carta nueva mientras se decide qué hace.
  NINGUNO: "NINGUNO",
  DEPREDADOR_DOMINANTE: "DEPREDADOR_DOMINANTE",
  RIBERENO: "RIBERENO",
  OPORTUNISTA: "OPORTUNISTA",
  RAMONEO_BAJO: "RAMONEO_BAJO",
  MIGRADOR: "MIGRADOR",
  GREGARIO: "GREGARIO",
  DESGARRO: "DESGARRO",
  CORAZA: "CORAZA",
  VUELO: "VUELO",
  // Rasgos que sólo valen acompañados: piden que haya otro de los suyos —o de
  // su clado— en el campo. Antes eran bonificaciones planas.
  CAZA_EN_GRUPO: "CAZA_EN_GRUPO",
  // Ceratosaurus: hacen falta tres
  MURO_DE_PLACAS: "MURO_DE_PLACAS",
  // Stegosaurus: con otro igual
  GOLA: "GOLA",
  // Lokiceratops: con otro igual
  MANADA: "MANADA",
  // Apatosaurus: con otro saurópodo
  // Buscar en el propio mazo al jugar la carta.
  BUSCA_EVENTO: "BUSCA_EVENTO",
  BUSCA_CLIMA: "BUSCA_CLIMA",
  BUSCA_GREGARISMO: "BUSCA_GREGARISMO",
  // adaptaciones
  GREGARISMO: "GREGARISMO",
  GASTROLITOS: "GASTROLITOS",
  CRECIMIENTO_ACELERADO: "CRECIMIENTO_ACELERADO",
  NEUMATICIDAD: "NEUMATICIDAD",
  // presiones
  TRAMPA: "TRAMPA",
  FRACTURA: "FRACTURA",
  COMPETENCIA: "COMPETENCIA",
  MORTANDAD: "MORTANDAD",
  // pulsos
  REBROTE: "REBROTE",
  CARRONA: "CARRONA",
  LAGO: "LAGO",
  // campo
  CAMPO_LLANURA: "CAMPO_LLANURA",
  CAMPO_CANAL: "CAMPO_CANAL",
  CAMPO_BOSQUE: "CAMPO_BOSQUE",
  CAMPO_SABANA: "CAMPO_SABANA",
  CAMPO_ARIDEZ: "CAMPO_ARIDEZ"
});
var dino = (o) => Object.freeze({ tipo: TIPO.DINOSAURIO, ...o });
var evento = (o) => Object.freeze({ tipo: TIPO.EVENTO, ataque: 0, defensa: 0, vida: 0, ...o });
var clima = (o) => Object.freeze({ tipo: TIPO.CLIMA, ataque: 0, defensa: 0, vida: 0, coste: 2, ...o });
var recurso = (o) => Object.freeze({ tipo: TIPO.RECURSO, objetivo: OBJETIVO.NINGUNO, ataque: 0, defensa: 0, vida: 0, coste: 0, ...o });
var CARTAS = Object.freeze({
  // ------------------------------------------------------------ dinosaurios
  dryosaurus: dino({
    id: "dryosaurus",
    rareza: RAREZA.COMUN,
    clado: CLADO.ORNITOPODO,
    binomial: "Dryosaurus altus",
    coste: 0,
    ataque: 1,
    defensa: 0,
    vida: 2,
    rasgo: RASGO.GREGARIO,
    rasgoNombre: "Gregario",
    rasgoTexto: "+1 de Ataque por cada otro Dryosaurus propio en el campo.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Ornit\xF3podo peque\xF1o y cursorial. El gregarismo se infiere de acumulaciones multiindividuo, no est\xE1 demostrado."
  }),
  ornitholestes: dino({
    id: "ornitholestes",
    rareza: RAREZA.COMUN,
    clado: CLADO.TEROPODO,
    binomial: "Ornitholestes hermanni",
    coste: 1,
    ataque: 2,
    defensa: 0,
    vida: 2,
    rasgo: RASGO.OPORTUNISTA,
    rasgoNombre: "Oportunista",
    rasgoTexto: "+1 Vida permanente cada vez que muere un dinosaurio en el campo.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Ter\xF3podo peque\xF1o (~2 m). El comportamiento carro\xF1ero es una inferencia a partir de talla y analog\xEDa ecol\xF3gica, no de evidencia directa."
  }),
  ceratosaurus: dino({
    id: "ceratosaurus",
    rareza: RAREZA.COMUN,
    clado: CLADO.TEROPODO,
    binomial: "Ceratosaurus nasicornis",
    coste: 1,
    ataque: 3,
    defensa: 0,
    vida: 3,
    rasgo: RASGO.CAZA_EN_GRUPO,
    rasgoNombre: "Caza en grupo",
    rasgoTexto: "+2 de Ataque si hay tres Ceratosaurus tuyos en el campo.",
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: "Menos frecuente que Allosaurus. Se ha propuesto una dieta con mayor componente de presa acu\xE1tica y un uso preferente de ambientes ribere\xF1os, a partir de morfolog\xEDa dental y contexto de hallazgos. Hip\xF3tesis discutida."
  }),
  stegosaurus: dino({
    id: "stegosaurus",
    rareza: RAREZA.COMUN,
    clado: CLADO.TIREOFORO,
    binomial: "Stegosaurus stenops",
    coste: 2,
    ataque: 1,
    defensa: 4,
    vida: 5,
    rasgo: RASGO.MURO_DE_PLACAS,
    rasgoNombre: "Muro de placas",
    rasgoTexto: "+1 de Defensa si tienes otro Stegosaurus en el campo.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Una v\xE9rtebra caudal de Allosaurus con una perforaci\xF3n compatible con una p\xFAa caudal de Stegosaurus es evidencia directa de uso defensivo del tagomizador."
  }),
  allosaurus: dino({
    id: "allosaurus",
    rareza: RAREZA.RARO,
    clado: CLADO.TEROPODO,
    binomial: "Allosaurus fragilis",
    coste: 3,
    ataque: 5,
    defensa: 2,
    vida: 3,
    rasgo: RASGO.DEPREDADOR_DOMINANTE,
    rasgoNombre: "Depredador dominante",
    rasgoTexto: "Si mata a su rival, el da\xF1o sobrante pasa al h\xE1bitat enemigo.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Tax\xF3n de ter\xF3podo m\xE1s abundante de la Morrison. Marcas de mordida atribuidas a Allosaurus aparecen en huesos de saur\xF3podos y de Stegosaurus."
  }),
  camarasaurus: dino({
    id: "camarasaurus",
    rareza: RAREZA.RARO,
    clado: CLADO.SAUROPODO,
    binomial: "Camarasaurus grandis",
    coste: 3,
    ataque: 2,
    defensa: 3,
    vida: 4,
    rasgo: RASGO.BUSCA_EVENTO,
    rasgoNombre: "Migrador",
    rasgoTexto: "Al jugarla, busca un evento en tu mazo y ll\xE9vatelo a la mano.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "An\xE1lisis isot\xF3picos de esmalte dental sugieren desplazamientos estacionales hacia tierras altas durante la estaci\xF3n seca, a diferencia de otros saur\xF3podos de la misma formaci\xF3n. El rasgo Migrador refleja ese resultado."
  }),
  diplodocus: dino({
    id: "diplodocus",
    rareza: RAREZA.EPICO,
    clado: CLADO.SAUROPODO,
    binomial: "Diplodocus carnegii",
    coste: 2,
    ataque: 3,
    defensa: 3,
    vida: 10,
    rasgo: RASGO.RAMONEO_BAJO,
    rasgoNombre: "Ramoneo bajo",
    rasgoTexto: "Recupera +1 de vida al final de cada uno de tus turnos",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "El desgaste dental y la postura del cuello sustentan una partici\xF3n de nicho por ramoneo bajo respecto de otros saur\xF3podos coexistentes."
  }),
  apatosaurus: dino({
    id: "apatosaurus",
    rareza: RAREZA.EPICO,
    clado: CLADO.SAUROPODO,
    binomial: "Apatosaurus louisae",
    coste: 3,
    ataque: 2,
    defensa: 5,
    vida: 10,
    rasgo: RASGO.MANADA,
    rasgoNombre: "Manada",
    rasgoTexto: "+1 de Defensa si tienes otro saur\xF3podo en el campo.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "La talla adulta de los diplod\xF3cidos es en s\xED misma la principal defensa antipredatoria. Nota: la validez de Brontosaurus como g\xE9nero separado sigue en discusi\xF3n; el juego usa Apatosaurus."
  }),
  torvosaurus: dino({
    id: "torvosaurus",
    rareza: RAREZA.LEGENDARIO,
    clado: CLADO.TEROPODO,
    binomial: "Torvosaurus tanneri",
    coste: 4,
    ataque: 7,
    defensa: 1,
    vida: 5,
    rasgo: RASGO.BUSCA_CLIMA,
    rasgoNombre: "Rastreador",
    rasgoTexto: "Al jugarla, busca un clima en tu mazo y ll\xE9vatelo a la mano.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "El ter\xF3podo de mayor tama\xF1o de la formaci\xF3n, pero genuinamente raro en el registro. Su escasez en el mazo replica su escasez f\xF3sil."
  }),
  // --------------------------------- fuera de la Morrison (ver README, §fauna)
  nodosaurus: dino({
    id: "nodosaurus",
    rareza: RAREZA.RARO,
    clado: CLADO.TIREOFORO,
    binomial: "Nodosaurus textilis",
    coste: 2,
    ataque: 2,
    defensa: 3,
    vida: 5,
    rasgo: RASGO.BUSCA_GREGARISMO,
    rasgoNombre: "Llamada de manada",
    rasgoTexto: "Al jugarla, busca un Gregarismo en tu mazo y ll\xE9vatelo a la mano.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Formaci\xF3n Frontier, Wyoming, Cenomaniense (~100 Ma). Los osteodermos en bandas sobre el dorso est\xE1n documentados directamente. El tax\xF3n en s\xED es material fragmentario y varios autores lo tratan como nomen dubium: la coraza es firme, la especie lo es menos."
  }),
  riparovenator: dino({
    id: "riparovenator",
    rareza: RAREZA.EPICO,
    clado: CLADO.TEROPODO,
    binomial: "Riparovenator milnerae",
    coste: 2,
    ataque: 4,
    defensa: 1,
    vida: 4,
    rasgo: RASGO.RIBERENO,
    rasgoNombre: "Ribere\xF1o",
    rasgoTexto: "+2 de ataque mientras el Canal fluvial est\xE9 en el campo.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Formaci\xF3n Wessex, isla de Wight, Barremiense (~125 Ma), descrito en 2021. Espinos\xE1urido de hocico alargado y dientes c\xF3nicos, morfolog\xEDa asociada a capturar peces. En su pariente Baryonyx se conservaron escamas de pez en la cavidad abdominal; para este g\xE9nero es inferencia por morfolog\xEDa."
  }),
  lokiceratops: dino({
    id: "lokiceratops",
    rareza: RAREZA.EPICO,
    clado: CLADO.MARGINOCEFALO,
    binomial: "Lokiceratops rangiformis",
    coste: 3,
    ataque: 4,
    defensa: 1,
    vida: 7,
    rasgo: RASGO.GOLA,
    rasgoNombre: "Gola ornamentada",
    rasgoTexto: "+2 de Defensa si tienes otro Lokiceratops en el campo.",
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: "Formaci\xF3n Judith River, Montana, Campaniense (~78 Ma), descrito en 2024. La gola lleva las mayores hojas \xF3seas conocidas en un cerat\xF3psido, asim\xE9tricas entre lados. Si serv\xEDan para defensa, para exhibici\xF3n o para reconocerse entre especies es justamente lo que se discute."
  }),
  brachylophosaurus: dino({
    id: "brachylophosaurus",
    rareza: RAREZA.RARO,
    clado: CLADO.ORNITOPODO,
    binomial: "Brachylophosaurus canadensis",
    coste: 2,
    ataque: 2,
    defensa: 1,
    vida: 6,
    rasgo: RASGO.GREGARIO,
    rasgoNombre: "Gregario",
    rasgoTexto: "+1 Poder por cada copia suya que tengas en el campo.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Formaciones Judith River y Oldman, Montana y Alberta, Campaniense (~78 Ma). Los lechos de huesos monoespec\xEDficos de hadrosaurios son la mejor evidencia de vida en manada de todo el registro. De este tax\xF3n se conocen adem\xE1s ejemplares con tejido blando conservado."
  }),
  tyrannotitan: dino({
    id: "tyrannotitan",
    rareza: RAREZA.LEGENDARIO,
    clado: CLADO.TEROPODO,
    binomial: "Tyrannotitan chubutensis",
    coste: 4,
    ataque: 10,
    defensa: 1,
    vida: 5,
    rasgo: RASGO.DESGARRO,
    rasgoNombre: "Desgarro",
    rasgoTexto: "A quien hiere no se le cura ninguna herida ese turno.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Formaci\xF3n Cerro Barcino, Chubut, Argentina, Aptiense (~113 Ma). Carcarodontos\xE1urido de unos 12 metros con dientes comprimidos y aserrados, de filo cortante en vez de aplastante. Que eso implique cortar carne y provocar hemorragias se infiere de la forma del diente, no de una herida f\xF3sil."
  }),
  huaxiadraco: dino({
    id: "huaxiadraco",
    rareza: RAREZA.RARO,
    clado: CLADO.PTEROSAURIO,
    binomial: "Huaxiadraco corollatus",
    coste: 2,
    ataque: 2,
    defensa: 2,
    vida: 2,
    rasgo: RASGO.VUELO,
    rasgoNombre: "Vuelo",
    rasgoTexto: "Sobrevuela la ranura: golpea siempre al h\xE1bitat rival, pero quien tenga enfrente le alcanza igual.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Formaci\xF3n Jiufotang, Liaoning, China, Aptiense (~120 Ma). No es un dinosaurio: es un pterosaurio tapej\xE1rido, sin dientes y con cresta craneal. Los tapej\xE1ridos conservan picnofibras, filamentos tegumentarios reales \u2014 la raz\xF3n por la que este juego no pone plumas a los dinosaurios es que ellos no las tienen, no una regla est\xE9tica."
  }),
  // ---------------------------------------------- eventos: mejoran a los tuyos
  gregarismo: evento({
    id: "gregarismo",
    rareza: RAREZA.RARO,
    binomial: "Gregarismo",
    coste: 1,
    objetivo: OBJETIVO.PROPIO,
    rasgo: RASGO.GREGARISMO,
    rasgoNombre: "Gregarismo",
    rasgoTexto: "+1 de Ataque a todos tus dinosaurios de la misma especie que el objetivo.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Acumulaciones monoespec\xEDficas en la Morrison sugieren agregaci\xF3n en varios taxones. La interpretaci\xF3n de estos yacimientos es discutida (\xBFmanada viva o concentraci\xF3n tafon\xF3mica?)."
  }),
  gastrolitos: evento({
    id: "gastrolitos",
    rareza: RAREZA.EPICO,
    binomial: "Gastrolitos",
    coste: 1,
    objetivo: OBJETIVO.PROPIO,
    rasgo: RASGO.GASTROLITOS,
    rasgoNombre: "Gastrolitos",
    rasgoTexto: "Cura +1 de vida a un dinosaurio al final del turno",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Piedras de molleja asociadas a esqueletos de saur\xF3podos jur\xE1sicos. Su funci\xF3n exacta en la digesti\xF3n sigue en debate."
  }),
  crecimiento_acelerado: evento({
    id: "crecimiento_acelerado",
    rareza: RAREZA.LEGENDARIO,
    binomial: "Crecimiento acelerado",
    coste: 1,
    objetivo: OBJETIVO.PROPIO,
    rasgo: RASGO.CRECIMIENTO_ACELERADO,
    rasgoNombre: "Crecimiento acelerado",
    rasgoTexto: "+2 Poder y +2 Vida permanentes a un dinosaurio que elijas.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "La osteohistolog\xEDa muestra tasas de crecimiento altas y sostenidas en saur\xF3podos y en Allosaurus, alcanzando talla adulta en pocas d\xE9cadas o menos."
  }),
  neumaticidad: evento({
    id: "neumaticidad",
    rareza: RAREZA.EPICO,
    binomial: "Neumaticidad \xF3sea",
    coste: 2,
    objetivo: OBJETIVO.PROPIO,
    rasgo: RASGO.NEUMATICIDAD,
    rasgoNombre: "Neumaticidad \xF3sea",
    rasgoTexto: "+2 de Ataque permanentes. S\xF3lo sobre ter\xF3podos y saur\xF3podos.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Los saurisquios de la Morrison presentan neumatizaci\xF3n postcraneal: v\xE9rtebras invadidas por divert\xEDculos de sacos a\xE9reos. Aligera el esqueleto sin perder resistencia. No aparece en tire\xF3foros ni en ornit\xF3podos."
  }),
  // ------------------------------------- eventos: presiones sobre el rival
  fractura: evento({
    id: "fractura",
    rareza: RAREZA.EPICO,
    binomial: "Fractura consolidada",
    coste: 2,
    objetivo: OBJETIVO.RIVAL,
    rasgo: RASGO.FRACTURA,
    rasgoNombre: "Fractura consolidada",
    rasgoTexto: "\u22122 Poder permanente a un dinosaurio rival.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "El registro patol\xF3gico de la Morrison es abundante: costillas fracturadas y consolidadas, infecciones \xF3seas y lesiones por estr\xE9s, especialmente documentadas en ejemplares de Allosaurus. Un animal cojo caza peor, pero sigue vivo."
  }),
  competencia: evento({
    id: "competencia",
    rareza: RAREZA.EPICO,
    binomial: "Competencia tr\xF3fica",
    coste: 3,
    objetivo: OBJETIVO.RIVALES,
    rasgo: RASGO.COMPETENCIA,
    rasgoNombre: "Competencia tr\xF3fica",
    rasgoTexto: "\u22122 de Defensa a dos dinosaurios rivales que elijas.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "La coexistencia de varios saur\xF3podos y de varios ter\xF3podos grandes en la misma formaci\xF3n implica reparto de recursos. La partici\xF3n de nicho est\xE1 sustentada por el desgaste dental; su intensidad como presi\xF3n competitiva es una inferencia."
  }),
  trampa: evento({
    id: "trampa",
    rareza: RAREZA.RARO,
    binomial: "Trampa de depredadores",
    coste: 1,
    objetivo: OBJETIVO.NINGUNO,
    rasgo: RASGO.TRAMPA,
    rasgoNombre: "Trampa de depredadores",
    rasgoTexto: "El rival pierde 5 cartas de su mazo. T\xFA pierdes 3: el fango no distingue.",
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: "La cantera Cleveland-Lloyd, en la Morrison de Utah, acumula decenas de individuos de Allosaurus en una proporci\xF3n de depredadores frente a presas que no se da en un ecosistema vivo. La trampa de depredadores es una de las explicaciones; tambi\xE9n se ha propuesto sequ\xEDa o agua envenenada. El yacimiento es un hecho, su mecanismo no."
  }),
  mortandad: evento({
    id: "mortandad",
    rareza: RAREZA.LEGENDARIO,
    binomial: "Mortandad estacional",
    coste: 1,
    objetivo: OBJETIVO.NINGUNO,
    rasgo: RASGO.MORTANDAD,
    rasgoNombre: "Mortandad estacional",
    rasgoTexto: "3 de da\xF1o a TODOS los dinosaurios del campo, incluidos los tuyos.",
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: "Algunas acumulaciones \xF3seas de la Morrison se han interpretado como mortandades masivas asociadas a sequ\xEDa o a eventos de crecida. La causa concreta de cada yacimiento sigue discuti\xE9ndose."
  }),
  // ------------------------------------------------------------- recursos
  rebrote: recurso({
    id: "rebrote",
    rareza: RAREZA.RARO,
    binomial: "Rebrote tras incendio",
    rasgo: RASGO.REBROTE,
    rasgoNombre: "Rebrote tras incendio",
    rasgoTexto: "+2 Biomasa ahora mismo. Todos tus dinosaurios reciben 1 herida.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Los sedimentos de la Morrison contienen fusa\xEDta \u2014carb\xF3n vegetal f\xF3sil\u2014, prueba directa de incendios recurrentes. El rebrote nutritivo posterior se infiere por analog\xEDa con sabanas actuales, no est\xE1 medido en el registro."
  }),
  carrona: recurso({
    id: "carrona",
    rareza: RAREZA.LEGENDARIO,
    binomial: "Carro\xF1a abundante",
    rasgo: RASGO.CARRONA,
    rasgoNombre: "Carro\xF1a abundante",
    rasgoTexto: "+3 Biomasa ahora mismo. El rival gana 1 Biomasa.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Marcas de mordida y dientes desprendidos de ter\xF3podo asociados a esqueletos de saur\xF3podo indican consumo de carro\xF1a. Un cad\xE1ver grande alimenta a m\xE1s de un carro\xF1ero, y no s\xF3lo al que lleg\xF3 primero."
  }),
  lago: recurso({
    id: "lago",
    rareza: RAREZA.EPICO,
    binomial: "Lago ef\xEDmero",
    rasgo: RASGO.LAGO,
    rasgoNombre: "Lago ef\xEDmero",
    rasgoTexto: "+2 Biomasa ahora mismo. Tu h\xE1bitat pierde 2 puntos.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "La Morrison conserva dep\xF3sitos de lagos alcalinos ef\xEDmeros de gran extensi\xF3n, como el llamado lago T\u2019oo\u2019dichi\u2019. Concentran recursos mientras duran; al secarse dejan salinas que el paisaje tarda en recuperar."
  }),
  // --------------------------------------------------------------- clima
  llanura: clima({
    id: "llanura",
    coste: 1,
    rareza: RAREZA.EPICO,
    binomial: "Llanura de inundaci\xF3n",
    rasgo: RASGO.CAMPO_LLANURA,
    rasgoNombre: "Llanura de inundaci\xF3n",
    rasgoTexto: "+1 Biomasa para ambos jugadores",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Las llanuras de inundaci\xF3n de la Morrison concentran la mayor productividad vegetal estacional de la formaci\xF3n."
  }),
  canal: clima({
    id: "canal",
    coste: 1,
    rareza: RAREZA.LEGENDARIO,
    binomial: "Canal fluvial trenzado",
    rasgo: RASGO.CAMPO_CANAL,
    rasgoNombre: "Canal fluvial trenzado",
    rasgoTexto: "Agua permanente en el campo: los ribere\xF1os pelean a gusto.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Los sistemas fluviales trenzados de la formaci\xF3n mantienen agua durante la estaci\xF3n seca, con vegetaci\xF3n ribere\xF1a estrecha a ambos lados."
  }),
  bosque: clima({
    id: "bosque",
    coste: 1,
    rareza: RAREZA.LEGENDARIO,
    binomial: "Bosque de con\xEDferas ribere\xF1o",
    rasgo: RASGO.CAMPO_BOSQUE,
    rasgoNombre: "Bosque de con\xEDferas ribere\xF1o",
    rasgoTexto: "Los saur\xF3podos curan 1 herida al final de cada turno.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Los bosques de con\xEDferas ribere\xF1os ofrecen ramoneo alto sostenido, el estrato del que dependen los saur\xF3podos de cuello elevado."
  }),
  aridez: clima({
    id: "aridez",
    coste: 1,
    rareza: RAREZA.LEGENDARIO,
    binomial: "Deriva \xE1rida",
    rasgo: RASGO.CAMPO_ARIDEZ,
    rasgoNombre: "Deriva \xE1rida",
    rasgoTexto: "Ambos jugadores pierden 5 cartas del mazo",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Los paleosuelos calc\xE1reos, las evaporitas y los dep\xF3sitos e\xF3licos de la Morrison documentan un clima semi\xE1rido y muy estacional que se acent\xFAa hacia el techo de la formaci\xF3n. Que esa deriva mermara las poblaciones es una inferencia razonable, no una medida."
  }),
  sabana: clima({
    id: "sabana",
    coste: 1,
    rareza: RAREZA.COMUN,
    binomial: "Sabana de helechos",
    rasgo: RASGO.CAMPO_SABANA,
    rasgoNombre: "Sabana de helechos",
    rasgoTexto: "Terreno abierto, sin cobertura: +1 al da\xF1o contra los biomas.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Extensiones abiertas de helechos sobre suelos semi\xE1ridos, sin dosel que rompa la l\xEDnea de visi\xF3n ni frene un avance."
  }),
  // --------------------------------------------------- fauna por estrenar
  //
  // Treinta y seis taxones que entran con ilustración y sin nada más: 1/1/1,
  // coste 1, común y sin rasgo. Están aquí para poder repartirles cifras y
  // habilidades desde RECOSTE.xlsx, que es donde se decide. El clado sí va
  // puesto y sale de la posición filogenética real, no del parecido.
  plesiopleurodon: dino({
    id: "plesiopleurodon",
    rareza: RAREZA.EPICO,
    clado: CLADO.MARINO,
    binomial: "Plesiopleurodon wellesi",
    coste: 3,
    ataque: 9,
    defensa: 2,
    vida: 4,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Plesiosaurio plios\xE1urido del Cret\xE1cico Superior de Wyoming. No es un dinosaurio: es un reptil marino de cuello corto y cr\xE1neo enorme."
  }),
  ojoraptorsaurus: dino({
    id: "ojoraptorsaurus",
    rareza: RAREZA.RARO,
    clado: CLADO.TEROPODO,
    binomial: "Ojoraptorsaurus boerei",
    coste: 2,
    ataque: 4,
    defensa: 1,
    vida: 4,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Oviraptorosaurio caenagn\xE1tido de la Formaci\xF3n Ojo Alamo, Nuevo M\xE9xico, Maastrichtiense. Se conoce por poco material p\xE9lvico."
  }),
  dromaeosaurus: dino({
    id: "dromaeosaurus",
    rareza: RAREZA.COMUN,
    clado: CLADO.TEROPODO,
    binomial: "Dromaeosaurus albertensis",
    coste: 2,
    ataque: 5,
    defensa: 1,
    vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Dromeos\xE1urido de la Formaci\xF3n Dinosaur Park, Alberta, Campaniense. Es el g\xE9nero que da nombre a toda la familia."
  }),
  athenar: dino({
    id: "athenar",
    rareza: RAREZA.COMUN,
    clado: CLADO.SAUROPODO,
    binomial: "Athenar bermani",
    coste: 2,
    ataque: 2,
    defensa: 2,
    vida: 5,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Formaci\xF3n Morrison, cantera Carnegie del Dinosaur National Monument, Utah, Titoniense inferior (~149\u2013145 Ma). Descrito en 2025 sobre un neurocr\xE1neo y techo craneal (CM 26552) que llevaba d\xE9cadas archivado como Diplodocus. Es un dicreos\xE1urido: saur\xF3podos de cuello corto y talla modesta para el grupo, no un ter\xF3podo."
  }),
  sanjuansaurus: dino({
    id: "sanjuansaurus",
    rareza: RAREZA.RARO,
    clado: CLADO.TEROPODO,
    binomial: "Sanjuansaurus gordilloi",
    coste: 2,
    ataque: 5,
    defensa: 1,
    vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Herreras\xE1urido de la Formaci\xF3n Ischigualasto, Argentina, Carniense (~231 Ma). Los herreras\xE1uridos son saurisquios muy basales; su colocaci\xF3n entre los ter\xF3podos se discute."
  }),
  suchomimus: dino({
    id: "suchomimus",
    rareza: RAREZA.EPICO,
    clado: CLADO.TEROPODO,
    binomial: "Suchomimus tenerensis",
    coste: 3,
    ataque: 8,
    defensa: 2,
    vida: 5,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Espinos\xE1urido de la Formaci\xF3n Elrhaz, N\xEDger, Aptiense. Hocico largo y c\xF3nico, adaptado a la pesca."
  }),
  eosinopteryx: dino({
    id: "eosinopteryx",
    rareza: RAREZA.COMUN,
    clado: CLADO.TEROPODO,
    binomial: "Eosinopteryx brevipenna",
    coste: 1,
    ataque: 2,
    defensa: 0,
    vida: 2,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Paraviano diminuto de la Formaci\xF3n Tiaojishan, China, Jur\xE1sico Superior. Conserva impresiones de plumas."
  }),
  troodon: dino({
    id: "troodon",
    rareza: RAREZA.COMUN,
    clado: CLADO.TEROPODO,
    binomial: "Troodon formosus",
    coste: 2,
    ataque: 4,
    defensa: 1,
    vida: 4,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Ter\xF3podo maniraptor del Cret\xE1cico Superior de Norteam\xE9rica. El nombre se basa en dientes aislados y su validez est\xE1 discutida."
  }),
  carnotaurus: dino({
    id: "carnotaurus",
    rareza: RAREZA.EPICO,
    clado: CLADO.TEROPODO,
    binomial: "Carnotaurus sastrei",
    coste: 3,
    ataque: 9,
    defensa: 1,
    vida: 5,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Abelis\xE1urido de la Formaci\xF3n La Colonia, Argentina, Maastrichtiense. Cuernos frontales y brazos reducidos al extremo."
  }),
  spinosaurus: dino({
    id: "spinosaurus",
    rareza: RAREZA.LEGENDARIO,
    clado: CLADO.TEROPODO,
    binomial: "Spinosaurus aegyptiacus",
    coste: 4,
    ataque: 11,
    defensa: 2,
    vida: 9,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Espinos\xE1urido de los Kem Kem, Marruecos, Cenomaniense. Vela dorsal y un estilo de vida acu\xE1tico que sigue debati\xE9ndose."
  }),
  mosasaurus: dino({
    id: "mosasaurus",
    rareza: RAREZA.LEGENDARIO,
    clado: CLADO.MARINO,
    binomial: "Mosasaurus hoffmannii",
    coste: 4,
    ataque: 12,
    defensa: 2,
    vida: 8,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Mosasaurio del Maastrichtiense. No es un dinosaurio: es un escamoso marino, pariente de varanos y serpientes."
  }),
  halszkaraptor: dino({
    id: "halszkaraptor",
    rareza: RAREZA.COMUN,
    clado: CLADO.TEROPODO,
    binomial: "Halszkaraptor escuilliei",
    coste: 1,
    ataque: 2,
    defensa: 0,
    vida: 2,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Dromeos\xE1urido halszkaraptorino de Mongolia, Campaniense. Cuello largo y hocico con muchos dientes peque\xF1os; se ha propuesto un modo de vida semiacu\xE1tico."
  }),
  tongtianlong: dino({
    id: "tongtianlong",
    rareza: RAREZA.COMUN,
    clado: CLADO.TEROPODO,
    binomial: "Tongtianlong limosus",
    coste: 1,
    ataque: 1,
    defensa: 1,
    vida: 2,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Oviraptorosaurio de la Formaci\xF3n Nanxiong, China, Maastrichtiense. El holotipo se conserv\xF3 en postura de haber quedado atrapado en el barro."
  }),
  scanisaurus: dino({
    id: "scanisaurus",
    rareza: RAREZA.RARO,
    clado: CLADO.MARINO,
    binomial: "Scanisaurus nazarowi",
    coste: 2,
    ataque: 4,
    defensa: 1,
    vida: 4,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Plesiosaurio elasmos\xE1urido del Cret\xE1cico Superior del B\xE1ltico. No es un dinosaurio, y su validez como g\xE9nero est\xE1 discutida."
  }),
  monolophosaurus: dino({
    id: "monolophosaurus",
    rareza: RAREZA.RARO,
    clado: CLADO.TEROPODO,
    binomial: "Monolophosaurus jiangi",
    coste: 2,
    ataque: 5,
    defensa: 1,
    vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Ter\xF3podo tetanuro de la Formaci\xF3n Shishugou, China, Jur\xE1sico Medio. Una sola cresta \xF3sea recorre el cr\xE1neo."
  }),
  invictarx: dino({
    id: "invictarx",
    rareza: RAREZA.RARO,
    clado: CLADO.TIREOFORO,
    binomial: "Invictarx zephyri",
    coste: 2,
    ataque: 2,
    defensa: 5,
    vida: 2,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Anquilosaurio nodos\xE1urido de la Formaci\xF3n Menefee, Nuevo M\xE9xico, Campaniense."
  }),
  medusaceratops: dino({
    id: "medusaceratops",
    rareza: RAREZA.EPICO,
    clado: CLADO.MARGINOCEFALO,
    binomial: "Medusaceratops lokii",
    coste: 3,
    ataque: 5,
    defensa: 4,
    vida: 6,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Cerat\xF3psido casmosaurino de la Formaci\xF3n Judith River, Montana, Campaniense."
  }),
  platyceratops: dino({
    id: "platyceratops",
    rareza: RAREZA.COMUN,
    clado: CLADO.MARGINOCEFALO,
    binomial: "Platyceratops tatarinovi",
    coste: 1,
    ataque: 1,
    defensa: 2,
    vida: 1,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Ceratopsio bagacerat\xF3psido de Mongolia, Campaniense. Peque\xF1o y sin cuernos."
  }),
  loricatosaurus: dino({
    id: "loricatosaurus",
    rareza: RAREZA.EPICO,
    clado: CLADO.TIREOFORO,
    binomial: "Loricatosaurus priscus",
    coste: 3,
    ataque: 4,
    defensa: 6,
    vida: 5,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Estegos\xE1urido del Calloviense de Inglaterra y Francia. Se separ\xF3 del material antes atribuido a Lexovisaurus."
  }),
  therizinosaurus: dino({
    id: "therizinosaurus",
    rareza: RAREZA.EPICO,
    clado: CLADO.TEROPODO,
    binomial: "Therizinosaurus cheloniformis",
    coste: 3,
    ataque: 6,
    defensa: 3,
    vida: 6,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Terizinosaurio de la Formaci\xF3n Nemegt, Mongolia, Maastrichtiense. Ter\xF3podo herb\xEDvoro con las garras manuales m\xE1s largas que se conocen."
  }),
  alaskacephale: dino({
    id: "alaskacephale",
    rareza: RAREZA.RARO,
    clado: CLADO.MARGINOCEFALO,
    binomial: "Alaskacephale gangloffi",
    coste: 2,
    ataque: 3,
    defensa: 3,
    vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Paquicefalosaurio de la Formaci\xF3n Prince Creek, Alaska, Campaniense."
  }),
  titanoceratops: dino({
    id: "titanoceratops",
    rareza: RAREZA.EPICO,
    clado: CLADO.MARGINOCEFALO,
    binomial: "Titanoceratops ouranos",
    coste: 3,
    ataque: 6,
    defensa: 5,
    vida: 4,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Cerat\xF3psido casmosaurino de Nuevo M\xE9xico, Campaniense. Se propuso separ\xE1ndolo de material asignado a Pentaceratops, y no todos lo aceptan."
  }),
  atlasaurus: dino({
    id: "atlasaurus",
    rareza: RAREZA.EPICO,
    clado: CLADO.SAUROPODO,
    binomial: "Atlasaurus imelakei",
    coste: 3,
    ataque: 3,
    defensa: 4,
    vida: 8,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Saur\xF3podo del Jur\xE1sico Medio de Marruecos. Extremidades desproporcionadamente largas para un saur\xF3podo."
  }),
  stegoceras: dino({
    id: "stegoceras",
    rareza: RAREZA.COMUN,
    clado: CLADO.MARGINOCEFALO,
    binomial: "Stegoceras validum",
    coste: 2,
    ataque: 3,
    defensa: 3,
    vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Paquicefalosaurio de la Formaci\xF3n Dinosaur Park, Alberta, Campaniense. Domo craneal grueso."
  }),
  maiasaura: dino({
    id: "maiasaura",
    rareza: RAREZA.EPICO,
    clado: CLADO.ORNITOPODO,
    binomial: "Maiasaura peeblesorum",
    coste: 3,
    ataque: 4,
    defensa: 2,
    vida: 9,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Hadros\xE1urido de la Formaci\xF3n Two Medicine, Montana, Campaniense. Sus nidadas documentan cuidado parental."
  }),
  edmontosaurus: dino({
    id: "edmontosaurus",
    rareza: RAREZA.LEGENDARIO,
    clado: CLADO.ORNITOPODO,
    binomial: "Edmontosaurus annectens",
    coste: 4,
    ataque: 5,
    defensa: 3,
    vida: 14,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Hadros\xE1urido del Maastrichtiense de Norteam\xE9rica. Uno de los dinosaurios con m\xE1s ejemplares conocidos."
  }),
  plateosauravus: dino({
    id: "plateosauravus",
    rareza: RAREZA.COMUN,
    clado: CLADO.SAUROPODO,
    binomial: "Plateosauravus cullingworthi",
    coste: 2,
    ataque: 2,
    defensa: 2,
    vida: 5,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Sauropodomorfo basal de la Formaci\xF3n Elliot, Sud\xE1frica, Tri\xE1sico Superior. No es un saur\xF3podo verdadero; se agrupa aqu\xED por plan corporal. Su posici\xF3n es incierta incluso dentro de los plateosaurios, y parte del material asignado se considera indeterminado."
  }),
  gargoyleosaurus: dino({
    id: "gargoyleosaurus",
    rareza: RAREZA.RARO,
    clado: CLADO.TIREOFORO,
    binomial: "Gargoyleosaurus parkpinorum",
    coste: 2,
    ataque: 2,
    defensa: 4,
    vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Anquilosaurio de la Formaci\xF3n Morrison, Jur\xE1sico Superior. Uno de los anquilosaurios m\xE1s antiguos que se conocen bien."
  }),
  wendiceratops: dino({
    id: "wendiceratops",
    rareza: RAREZA.EPICO,
    clado: CLADO.MARGINOCEFALO,
    binomial: "Wendiceratops pinhornensis",
    coste: 3,
    ataque: 5,
    defensa: 4,
    vida: 6,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Cerat\xF3psido centrosaurino de la Formaci\xF3n Oldman, Alberta, Campaniense."
  }),
  antarctosaurus: dino({
    id: "antarctosaurus",
    rareza: RAREZA.LEGENDARIO,
    clado: CLADO.SAUROPODO,
    binomial: "Antarctosaurus wichmannianus",
    coste: 4,
    ataque: 4,
    defensa: 5,
    vida: 13,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Titanosaurio del Cret\xE1cico Superior de Argentina. El material asignado al g\xE9nero es heterog\xE9neo y su validez se discute."
  }),
  liaoceratops: dino({
    id: "liaoceratops",
    rareza: RAREZA.COMUN,
    clado: CLADO.MARGINOCEFALO,
    binomial: "Liaoceratops yanzigouensis",
    coste: 1,
    ataque: 1,
    defensa: 1,
    vida: 2,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Neoceratopsio basal de la Formaci\xF3n Yixian, China, Barremiense. Peque\xF1o y sin gola desarrollada."
  }),
  rhinorex: dino({
    id: "rhinorex",
    rareza: RAREZA.EPICO,
    clado: CLADO.ORNITOPODO,
    binomial: "Rhinorex condrupus",
    coste: 3,
    ataque: 4,
    defensa: 2,
    vida: 9,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Hadros\xE1urido saurolofino de la Formaci\xF3n Neslen, Utah, Campaniense. Destaca por el gran arco nasal."
  }),
  bienosaurus: dino({
    id: "bienosaurus",
    rareza: RAREZA.COMUN,
    clado: CLADO.TIREOFORO,
    binomial: "Bienosaurus lufengensis",
    coste: 1,
    ataque: 1,
    defensa: 2,
    vida: 1,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Tire\xF3foro basal de la Formaci\xF3n Lufeng, China, Jur\xE1sico Inferior. Se conoce por una mand\xEDbula, y su validez est\xE1 discutida."
  }),
  shuangmiaosaurus: dino({
    id: "shuangmiaosaurus",
    rareza: RAREZA.COMUN,
    clado: CLADO.ORNITOPODO,
    binomial: "Shuangmiaosaurus gilmorei",
    coste: 2,
    ataque: 3,
    defensa: 1,
    vida: 5,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Hadrosauroideo basal de la Formaci\xF3n Sunjiawan, China, Cret\xE1cico Superior."
  }),
  chasmosaurus: dino({
    id: "chasmosaurus",
    rareza: RAREZA.COMUN,
    clado: CLADO.MARGINOCEFALO,
    binomial: "Chasmosaurus belli",
    coste: 2,
    ataque: 2,
    defensa: 4,
    vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sin rasgo",
    rasgoTexto: "Todav\xEDa no hace nada especial.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Cerat\xF3psido casmosaurino de la Formaci\xF3n Dinosaur Park, Alberta, Campaniense. Gola muy grande con dos aberturas amplias."
  })
});
var CARTAS_ECONOMIA = Object.freeze({
  biomasa_vegetal: Object.freeze({
    id: "biomasa_vegetal",
    tipo: TIPO.BIOMASA,
    dieta: "HERBIVORO",
    coste: 0,
    binomial: "Ramoneo",
    rareza: RAREZA.COMUN,
    rasgo: RASGO.NINGUNO
  }),
  biomasa_animal: Object.freeze({
    id: "biomasa_animal",
    tipo: TIPO.BIOMASA,
    dieta: "CARNIVORO",
    coste: 0,
    binomial: "Presa abatida",
    rareza: RAREZA.COMUN,
    rasgo: RASGO.NINGUNO
  })
});
var CARTAS_DE_JEFE = Object.freeze({
  jefe_saurophaganax: Object.freeze({
    id: "jefe_saurophaganax",
    tipo: TIPO.DINOSAURIO,
    clado: CLADO.TEROPODO,
    rareza: RAREZA.LEGENDARIO,
    binomial: "Saurophaganax maximus",
    coste: 4,
    ataque: 7,
    defensa: 2,
    vida: 6,
    rasgo: RASGO.DEPREDADOR_DOMINANTE,
    evidencia: "DEBATIDO",
    nota: "El mayor ter\xF3podo conocido de la Formaci\xF3n Morrison, y tambi\xE9n el m\xE1s discutido: parte de los autores lo consideran un Allosaurus de gran talla y no un g\xE9nero propio. La carta lo declara porque la duda es el dato.",
    formacion: "Formaci\xF3n Morrison",
    edad: "Kimmeridgiense\u2013Titoniense (~155\u2013150 Ma)"
  }),
  jefe_barosaurus: Object.freeze({
    id: "jefe_barosaurus",
    tipo: TIPO.DINOSAURIO,
    clado: CLADO.SAUROPODO,
    rareza: RAREZA.LEGENDARIO,
    binomial: "Barosaurus lentus",
    coste: 4,
    ataque: 3,
    defensa: 4,
    vida: 9,
    rasgo: RASGO.MANADA,
    evidencia: "ESTABLECIDO",
    nota: "Diplod\xF3cido de cuello desmesurado incluso para su familia: v\xE9rtebras cervicales alargadas que lo hac\xEDan capaz de ramonear donde ning\xFAn otro saur\xF3podo de la Morrison llegaba.",
    formacion: "Formaci\xF3n Morrison",
    edad: "Kimmeridgiense\u2013Titoniense (~155\u2013150 Ma)"
  })
});
var existeCarta = (cardId) => Boolean(
  CARTAS[cardId] ?? CARTAS_DE_JEFE[cardId] ?? CARTAS_ECONOMIA[cardId]
);
function carta(cardId) {
  const c = CARTAS[cardId] ?? CARTAS_DE_JEFE[cardId] ?? CARTAS_ECONOMIA[cardId];
  if (!c) throw new Error(`Carta desconocida: ${cardId}`);
  return c;
}

// src/data/balance.js
var BALANCE = Object.freeze({
  // ------------------------------------------------------------- victorias
  trofeosParaGanar: 10,
  // registro fósil
  vidaHabitat: 70,
  // colapso del habitat
  // la tercera, extinción, no tiene número: es quedarse sin cartas al robar
  // ---------------------------------------------------------------- campo
  ranuras: 5,
  // -------------------------------------------------------------- recursos
  // La renta NO depende de dominar el campo. Es la corrección central de la v2:
  // en la v1, atarla al control hacía que el 87,6 % de las partidas las ganase
  // quien iba por delante en el turno 6.
  // La renta es +1 por turno y se acumula: lo que no gastas sigue ahí al turno
  // siguiente. Antes la Biomasa se ponía al número de turno y se perdía el
  // resto, así que gastar 2 en el turno 2 te dejaba con 3 en el turno 3 —el
  // jugador leía «+3» y tenía razón—. Ahora un turno sin gastar es un turno
  // ahorrado, que es lo que hace que guardar sea una decisión.
  // El turno 1 se abre con tres, para que la primera jugada exista: con una
  // sola Biomasa casi nada era pagable y el turno se iba en pulsar Listo.
  biomasaInicial: 3,
  rentaPorTurno: 2,
  // a partir de ahí, se suma a lo que ya tenías
  rentaTope: 12,
  // tope de lo ahorrado, no de la renta
  rentaAcumula: true,
  // --------------------------------------------------- variantes de economía
  // Tres economías medibles. La de siempre es FIJA y es la que juega el juego
  // publicado; las otras dos existen para decidir con datos, no discutiendo.
  //
  //  FIJA    lo de hoy: renta igual para los dos, garantizada, sin tipo.
  //  TIPADA  renta igual y garantizada, pero CON tipo: declaras qué produces
  //          un turno por adelantado y sólo paga a quien come eso. Cero
  //          varianza, compromiso de mazo real.
  //  CARTAS  la Biomasa es carta de recurso, al modo de las tierras de Magic:
  //          una por turno, gratis, y el tipo lo trae la carta.
  //
  // El riesgo de CARTAS está medido antes de escribirla: con mano 6 y robo de
  // 1, 18 recursos en 50 cartas dejan al jugador sin lo mínimo en el turno 4 el
  // 29 % de las partidas, y sin NINGUNO de un tipo concreto el 13,9 %. Magic
  // aguanta eso porque tiene mulligan con scry, cantrips y duales; aquí sólo se
  // ven 9 cartas en el turno 4.
  economia: Object.freeze({
    // El modo se fija por entorno y sólo desde Node: el juego publicado corre
    // SIEMPRE en FIJA. Es una variable y no una constante editable a mano para
    // que medir las tres no obligue a tocar este fichero entre corridas —y para
    // que nadie publique sin querer una variante a medio medir.
    //   DINOWAR_ECONOMIA=TIPADA node sim/run.js
    modo: typeof process !== "undefined" && process.env && process.env.DINOWAR_ECONOMIA || "FIJA",
    // La pirámide trófica, hecha regla: la eficiencia ecológica entre niveles
    // ronda el 10 %, así que sostener carne cuesta mucha más planta. El ratio
    // no es un capricho de diseño, es de dónde sale la comida.
    tipada: Object.freeze({
      vegetal: 2,
      // si declaras vegetal, cobras 2
      animal: 1,
      // si declaras animal, cobras 1
      declaraConAntelacion: true
      // lo eliges un turno antes, a ciegas
    }),
    cartas: Object.freeze({
      porMazo: 18,
      // cuántas de las 50 son recurso
      fraccionAnimal: 0.45,
      // de esas, cuántas de tipo animal
      porTurno: 1,
      // cuántas puedes bajar por turno
      valor: 1
      // Biomasa que da cada una
    })
  }),
  manoInicial: 6,
  manoMaxima: 7,
  robo: Object.freeze({ normal: 1 }),
  // Sin rebarajado, el mazo es finito y agotarlo es un reloj real, como en
  // Pokémon. Con robo de 2 y mazo de 30, se acaba justo en la franja de turnos
  // objetivo: la extinción muerde en las partidas que se alargan.
  rebarajarDescarte: false,
  // Con despliegue simultáneo no hay ventaja de iniciativa que compensar.
  compensacionSegundoJugador: Object.freeze({ cartas: 0 }),
  // Reloj de partida al modo del ajedrez: un presupuesto para toda la partida,
  // no por turno. Sólo corre mientras te toca decidir a ti, así que las
  // animaciones y el turno de la IA no te cuestan tiempo. En segundos.
  relojPorJugador: 15 * 60,
  relojAviso: 60,
  // por debajo de esto, el marcador apremia
  // Como en Pokémon: en el primer turno no se ataca. Con 1 sola Biomasa era
  // normal que sólo un bando llegase a desplegar, y ese golpeaba un habitat
  // vacío gratis. La apertura pasa a ser de montar, no de arañar daño.
  turnoPrimerCombate: 2,
  limiteTurnos: 40,
  // ------------------------------------------------------------ red trófica
  // No es piedra-papel-tijera: cada relación está respaldada por la misma
  // evidencia que cita la carta correspondiente.
  // La reducción de daño ya NO vive aquí: cada dinosaurio lleva su propia
  // Defensa. Un clado no necesita regla especial si sus números ya lo dicen.
  clados: Object.freeze({
    bonusDepredacion: 2,
    // terópodo sobre presa pequeña y cursorial
    presaDe: Object.freeze({ [CLADO.TEROPODO]: CLADO.ORNITOPODO }),
    espinasTireoforo: 2
    // daño devuelto a quien ataca a un tireóforo
  }),
  // Suelo del daño en combate. La Defensa resta daño plano a CADA golpe, así
  // que sin suelo una carta con más Defensa que el Ataque del rival no recibe
  // nada: es inmune, no resistente. Medido, un punto de Defensa llegó a valer
  // 4,8 puntos de Ataque y las cartas ofensivas quedaban muertas. Con el suelo
  // baja a 3,3 y la Vida deja de ser un adorno. Nada es invulnerable.
  danoMinimo: 1,
  // ------------------------------------------------------------------ rasgos
  rasgos: Object.freeze({
    gregarioAtaquePorCompanero: 1,
    riberenoAtaque: 2,
    oportunistaVidaPorMuerte: 1,
    ramoneoBajoCura: 1,
    gregarismoAtaque: 1,
    gastrolitosCura: 1,
    crecimientoAtaque: 2,
    crecimientoVida: 2,
    neumaticidadAtaque: 2,
    fracturaAtaque: 2,
    competenciaDefensa: 2,
    competenciaObjetivos: 2,
    mortandadDano: 3,
    corazaDefensa: 2,
    // Bonificaciones que piden compañía. La de Ceratosaurus pide tres en el
    // campo, que con cinco ranuras y tres copias por mazo es el techo: cuando
    // sale, sale entera.
    cazaEnGrupoAtaque: 2,
    cazaEnGrupoMinimo: 3,
    muroDePlacasDefensa: 1,
    golaDefensa: 2,
    manadaDefensa: 1,
    trampaMazoRival: 5,
    trampaMazoPropio: 3
  }),
  // Cartas de recurso: Biomasa inmediata con inconveniente. Atacan el atasco de mano,
  // que venía de robar 2 por turno con una renta de 1 acumulativo.
  recursos: Object.freeze({
    rebroteBiomasa: 2,
    rebroteHeridas: 1,
    carronaBiomasa: 3,
    carronaBiomasaRival: 1,
    lagoBiomasa: 2,
    lagoHabitat: 2
  }),
  efectosCampo: Object.freeze({
    aridezMazo: 5,
    llanuraBiomasa: 1,
    bosqueCura: 1,
    // El canal y la sabana ya no tocan sólo a los tuyos: como todo clima,
    // valen para los dos bandos por igual.
    canalVida: 1,
    sabanaDefensa: 1
  }),
  // ------------------------------------------------------------------- mazo
  tamanoMazo: 50,
  // Copias que caben de una misma carta. Es a la vez el límite de construcción
  // del jugador y la escala de rareza: son la misma regla mirada desde dos
  // sitios. La épica se queda en 2 y no en 3 porque con 3 el mazo se llenaría
  // de repetidas y quedaría sitio para muy pocas cartas distintas.
  copiasPorRareza: Object.freeze({
    [RAREZA.COMUN]: 3,
    [RAREZA.RARO]: 3,
    [RAREZA.EPICO]: 2,
    [RAREZA.LEGENDARIO]: 1
  }),
  // ------------------------------------------------------------- el cuerpo
  //
  //  ATAQUE_DEFENSA_VIDA  lo de hoy: la Defensa resta a cada golpe.
  //  ATAQUE_VIDA          la Defensa no existe y se suma a la Vida.
  //
  // Existe porque la Defensa es la estadística que peor se lee: es una resta
  // invisible contra un número de la OTRA carta, con dos reglas encima que no
  // se deducen de lo que hay en pantalla —el suelo de daño y el bonus de
  // depredación—. Y porque medida en victorias es la que menos aporta: +1 de
  // Ataque a todas tus criaturas gana el 70,8 % de las partidas, +1 de Vida el
  // 63,1 % y +1 de Defensa el 59,6 %, sobre un control de 46,8 %.
  //
  // Medido antes de escribir esto: plegada a Vida 1:1, el juego no se entera
  // —12,5 turnos contra 12,6, y el reparto entre las tres vías de victoria se
  // mueve dentro del ruido—.
  //
  // Diferencia conocida de la variante: la Defensa que dan los rasgos depende de
  // tener compañía, así que al morir el compañero la Vida MÁXIMA baja y puede
  // matar a la unidad en el acto. Con la Defensa como resta eso no pasaba: sólo
  // encajabas más daño a partir de entonces. Es una de las cosas que la medición
  // tiene que enseñar, no un descuido.
  cuerpo: Object.freeze({
    // Igual que la economía: por entorno y sólo desde Node. El juego publicado
    // corre SIEMPRE en ATAQUE_DEFENSA_VIDA hasta que se decida otra cosa.
    //   DINOWAR_CUERPO=ATAQUE_VIDA node sim/run.js
    modo: typeof process !== "undefined" && process.env && process.env.DINOWAR_CUERPO || "ATAQUE_DEFENSA_VIDA",
    // Cuánta Vida vale un punto de Defensa al plegarla. 1 es lo medido; se deja
    // como número para poder probar 2 y 3 sin tocar el motor.
    defensaAVida: 1
  }),
  // --------------------------------------------------------------------- IA
  ia: Object.freeze({
    // Turnos que se espera que una unidad siga en pie aportando. Sin esto la IA
    // sólo mira el asalto siguiente y descarta a los muros: un 3/10 no mata a
    // nadie hoy, pero bloquea cinco turnos.
    horizonte: 3,
    pesoTrofeo: 3.2,
    // valor de una baja rival
    pesoHabitat: 1.1,
    // valor de 1 de daño al habitat rival
    pesoPerdida: 2.6,
    // coste de perder una unidad propia
    pesoDano: 0.35,
    // valor de dejar herido sin matar
    pesoCoste: 0.5,
    umbralJugar: 0.15
  })
});
var MAZO = Object.freeze([
  // dinosaurios — 30
  ["dryosaurus", 3],
  ["ornitholestes", 3],
  ["ceratosaurus", 3],
  ["nodosaurus", 3],
  ["stegosaurus", 2],
  ["allosaurus", 2],
  ["camarasaurus", 2],
  // Lokiceratops pasó a legendaria y sólo admite una copia. La plaza que deja
  // va a Brachylophosaurus, que con la rareza nueva admite tres y es el otro
  // gregario del mazo: la lista sigue siendo la misma clase de mazo.
  ["riparovenator", 2],
  ["lokiceratops", 1],
  ["brachylophosaurus", 3],
  ["huaxiadraco", 2],
  ["diplodocus", 1],
  ["apatosaurus", 1],
  ["torvosaurus", 1],
  ["tyrannotitan", 1],
  // soporte — 20
  //
  // Los climas van a UNA copia. Sólo puede haber un paleoambiente activo, así
  // que la segunda copia en la mano no tiene dónde ir: llevar tres Sabanas no
  // hacía peor a la carta, hacía peor al mazo, y el índice lo cobraba a la
  // carta (0,50 con tres copias, 0,68 con una).
  //
  // Las cuatro plazas que eso libera van a Rebrote y a las dos cartas que el
  // mazo de referencia nunca había medido. Salen calibradas a la primera:
  // neumaticidad 0,98 y competencia 1,05.
  ["gregarismo", 3],
  ["trampa", 3],
  ["rebrote", 3],
  ["gastrolitos", 2],
  ["fractura", 2],
  ["sabana", 1],
  ["aridez", 1],
  ["canal", 1],
  ["mortandad", 1],
  ["crecimiento_acelerado", 1],
  ["neumaticidad", 1],
  ["competencia", 1]
].map((e) => Object.freeze(e)));
var TOTAL_MAZO = MAZO.reduce((n, [, copias]) => n + copias, 0);
for (const [cardId, copias] of MAZO) {
  const c = CARTAS[cardId];
  if (!c) throw new Error(`MAZO: la carta "${cardId}" no existe`);
  const tope = BALANCE.copiasPorRareza[c.rareza];
  if (copias > tope) throw new Error(`MAZO: ${cardId} lleva ${copias} copias y su rareza permite ${tope}`);
}
if (TOTAL_MAZO !== BALANCE.tamanoMazo) {
  throw new Error(`MAZO suma ${TOTAL_MAZO} cartas y deber\xEDan ser ${BALANCE.tamanoMazo}`);
}

// src/engine/rng.js
function siguiente(rng) {
  let t = rng + 1831565813 >>> 0;
  let x = Math.imul(t ^ t >>> 15, 1 | t);
  x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x;
  return { rng: t, valor: ((x ^ x >>> 14) >>> 0) / 4294967296 };
}
function entero(rng, n) {
  const s = siguiente(rng);
  return { rng: s.rng, valor: Math.floor(s.valor * n) };
}
function elegir(rng, lista) {
  const e = entero(rng, lista.length);
  return { rng: e.rng, valor: lista[e.valor] };
}
function barajar(lista, rng) {
  const salida = lista.slice();
  let r = rng;
  for (let i = salida.length - 1; i > 0; i--) {
    const e = entero(r, i + 1);
    r = e.rng;
    const j = e.valor;
    const tmp = salida[i];
    salida[i] = salida[j];
    salida[j] = tmp;
  }
  return { rng: r, lista: salida };
}
function semilla(n) {
  const s = n >>> 0 || 2654435769;
  return s;
}

// src/engine/state.js
var FASE = Object.freeze({
  RENTA: "RENTA",
  ROBO: "ROBO",
  DESPLIEGUE: "DESPLIEGUE",
  REVELACION: "REVELACION",
  COMBATE: "COMBATE",
  DESCARTE: "DESCARTE",
  CHEQUEO: "CHEQUEO",
  FIN: "FIN"
});
var FASES_INTERACTIVAS = Object.freeze([FASE.DESPLIEGUE, FASE.DESCARTE]);
var MOTIVO_FIN = Object.freeze({
  TROFEOS: "TROFEOS",
  HABITAT: "HABITAT",
  EXTINCION: "EXTINCION",
  LIMITE_TURNOS: "LIMITE_TURNOS"
});
var CAUSA = Object.freeze({
  COMBATE: "COMBATE",
  ESPINAS: "ESPINAS",
  MORTANDAD: "MORTANDAD"
});
var rival = (j) => j === 0 ? 1 : 0;
function nuevaInstancia(iid, cardId, dueno) {
  return {
    iid,
    cardId,
    dueno,
    ranura: null,
    heridas: 0,
    modAtaque: 0,
    modDefensa: 0,
    modVida: 0,
    // Qué le ha cambiado las cifras y quién se lo hizo. modAtaque y modVida son
    // dos números sin memoria: dicen «−2» pero no de dónde salió, y en la mesa
    // eso deja al jugador mirando una carta mermada sin saber qué le cayó
    // encima. Cada apunte es { cardId, ataque, vida }.
    marcas: [],
    adherencias: [],
    adheridoA: null,
    desplegadoEnTurno: null
  };
}
function crearPartida(seedEntrada = 1, mazos = null) {
  let rng = semilla(seedEntrada);
  const instancias = {};
  let siguienteInstId = 1;
  const jugadores = [];
  for (let j = 0; j < 2; j++) {
    const mazo = [];
    for (const [cardId, copias] of mazos?.[j] ?? MAZO) {
      for (let k = 0; k < copias; k++) {
        const iid = siguienteInstId++;
        instancias[iid] = nuevaInstancia(iid, cardId, j);
        mazo.push(iid);
      }
    }
    const b = barajar(mazo, rng);
    rng = b.rng;
    jugadores.push({
      id: j,
      biomasa: 0,
      // Parte del total que es Biomasa animal. En la economía FIJA no se mira:
      // la Biomasa no tiene tipo y todo se paga con todo.
      animal: 0,
      // Qué tipo produces el turno que viene. Se declara a ciegas, un turno
      // antes, igual que se despliega: comprometer la economía sin ver la
      // jugada del rival es la misma tensión que ya tiene el tablero.
      produccion: null,
      biomasaJugadaEsteTurno: 0,
      habitat: BALANCE.vidaHabitat,
      trofeos: 0,
      mazo: b.lista,
      mano: [],
      descarte: [],
      pendientes: [],
      listo: false,
      sinCartas: false,
      mulligans: 0
    });
  }
  for (const jug of jugadores) {
    const extra = jug.id === 1 ? BALANCE.compensacionSegundoJugador.cartas : 0;
    for (let k = 0; k < BALANCE.manoInicial + extra; k++) jug.mano.push(jug.mazo.shift());
  }
  return {
    seed: semilla(seedEntrada),
    rng,
    turno: 1,
    fase: FASE.RENTA,
    campo: null,
    siguienteInstId,
    instancias,
    ranuras: [
      Array.from({ length: BALANCE.ranuras }, () => null),
      Array.from({ length: BALANCE.ranuras }, () => null)
    ],
    jugadores,
    eventos: [],
    ganador: null,
    motivoFin: null
  };
}
var ranuraValida = (r) => Number.isInteger(r) && r >= 0 && r < BALANCE.ranuras;
function unidadEn(state, bando, ranura) {
  const iid = state.ranuras[bando][ranura];
  return iid === null ? null : state.instancias[iid];
}
function unidadesDe(state, bando) {
  return state.ranuras[bando].filter((x) => x !== null).map((iid) => state.instancias[iid]);
}
function todasLasUnidades(state) {
  return [...unidadesDe(state, 0), ...unidadesDe(state, 1)];
}
var campoEs = (state, rasgo) => state.campo !== null && carta(state.campo).rasgo === rasgo;
function adherenciasCon(state, inst, rasgo) {
  let n = 0;
  for (const aid of inst.adherencias) {
    const a = state.instancias[aid];
    if (a && carta(a.cardId).rasgo === rasgo) n += 1;
  }
  return n;
}
function ataqueEfectivo(state, iid) {
  const inst = state.instancias[iid];
  const c = carta(inst.cardId);
  if (c.tipo !== TIPO.DINOSAURIO) return 0;
  let poder = c.ataque + inst.modAtaque;
  if (c.rasgo === RASGO.GREGARIO) {
    const companeros = unidadesDe(state, inst.dueno).filter((o) => o.iid !== inst.iid && o.cardId === inst.cardId).length;
    poder += companeros * BALANCE.rasgos.gregarioAtaquePorCompanero;
  }
  if (c.rasgo === RASGO.RIBERENO && campoEs(state, RASGO.CAMPO_CANAL)) {
    poder += BALANCE.rasgos.riberenoAtaque;
  }
  if (c.rasgo === RASGO.CAZA_EN_GRUPO && conCompa\u00F1\u00EDa(state, inst, BALANCE.rasgos.cazaEnGrupoMinimo - 1)) {
    poder += BALANCE.rasgos.cazaEnGrupoAtaque;
  }
  for (const otro of unidadesDe(state, inst.dueno)) {
    if (otro.cardId !== inst.cardId) continue;
    poder += adherenciasCon(state, otro, RASGO.GREGARISMO) * BALANCE.rasgos.gregarismoAtaque;
  }
  return Math.max(0, poder);
}
function vidaMaxima(state, iid) {
  const inst = state.instancias[iid];
  const extra = campoEs(state, RASGO.CAMPO_CANAL) ? BALANCE.efectosCampo.canalVida : 0;
  const plegada = SIN_DEFENSA ? defensaBruta(state, iid) * BALANCE.cuerpo.defensaAVida : 0;
  return carta(inst.cardId).vida + inst.modVida + extra + plegada;
}
var vidaActual = (state, iid) => vidaMaxima(state, iid) - state.instancias[iid].heridas;
var SIN_DEFENSA = BALANCE.cuerpo.modo === "ATAQUE_VIDA";
function defensaBruta(state, iid) {
  const inst = state.instancias[iid];
  const c = carta(inst.cardId);
  let d = (c.defensa ?? 0) + inst.modDefensa;
  if (c.rasgo === RASGO.CORAZA) d += BALANCE.rasgos.corazaDefensa;
  if (c.rasgo === RASGO.MURO_DE_PLACAS && conCompa\u00F1\u00EDa(state, inst, 1)) {
    d += BALANCE.rasgos.muroDePlacasDefensa;
  }
  if (c.rasgo === RASGO.GOLA && conCompa\u00F1\u00EDa(state, inst, 1)) {
    d += BALANCE.rasgos.golaDefensa;
  }
  if (c.rasgo === RASGO.MANADA && delClado(state, inst, c.clado, 1)) {
    d += BALANCE.rasgos.manadaDefensa;
  }
  if (campoEs(state, RASGO.CAMPO_SABANA)) d += BALANCE.efectosCampo.sabanaDefensa;
  return Math.max(0, d);
}
function conCompa\u00F1\u00EDa(state, inst, min) {
  const n = unidadesDe(state, inst.dueno).filter((o) => o.iid !== inst.iid && o.cardId === inst.cardId).length;
  return n >= min;
}
function delClado(state, inst, clado, min) {
  const n = unidadesDe(state, inst.dueno).filter((o) => o.iid !== inst.iid && carta(o.cardId).clado === clado).length;
  return n >= min;
}
function espinasDe(state, iid) {
  const c = carta(state.instancias[iid].cardId);
  let e = c.clado === CLADO.TIREOFORO ? BALANCE.clados.espinasTireoforo : 0;
  return e;
}
function reduccionDe(state, iid) {
  return SIN_DEFENSA ? 0 : defensaBruta(state, iid);
}
function danoEntre(state, atacanteIid, defensorIid) {
  const a = carta(state.instancias[atacanteIid].cardId);
  const d = carta(state.instancias[defensorIid].cardId);
  let dano = ataqueEfectivo(state, atacanteIid);
  if (BALANCE.clados.presaDe[a.clado] === d.clado) dano += BALANCE.clados.bonusDepredacion;
  return Math.max(BALANCE.danoMinimo, dano - reduccionDe(state, defensorIid));
}
function danoAlHabitat(state, iid) {
  return ataqueEfectivo(state, iid);
}
var vuela = (state, iid) => carta(state.instancias[iid].cardId).rasgo === RASGO.VUELO;
var hayAridez = (state) => campoEs(state, RASGO.CAMPO_ARIDEZ);
function rentaDe(state) {
  const extra = campoEs(state, RASGO.CAMPO_LLANURA) ? BALANCE.efectosCampo.llanuraBiomasa : 0;
  return BALANCE.rentaPorTurno + extra;
}
function curacionDe(state, iid) {
  const inst = state.instancias[iid];
  const c = carta(inst.cardId);
  let cura = 0;
  if (c.rasgo === RASGO.RAMONEO_BAJO) cura += BALANCE.rasgos.ramoneoBajoCura;
  cura += adherenciasCon(state, inst, RASGO.GASTROLITOS) * BALANCE.rasgos.gastrolitosCura;
  if (campoEs(state, RASGO.CAMPO_BOSQUE) && c.clado === CLADO.SAUROPODO) {
    cura += BALANCE.efectosCampo.bosqueCura;
  }
  return cura;
}
function buscablesDe(state, jugador, cardId) {
  const filtro = FILTRO_BUSQUEDA[carta(cardId).rasgo];
  if (!filtro) return [];
  return state.jugadores[jugador].mazo.filter((iid) => filtro(carta(state.instancias[iid].cardId)));
}
var buscaEnElMazo = (cardId) => FILTRO_BUSQUEDA[carta(cardId).rasgo] !== void 0;
var FILTRO_BUSQUEDA = Object.freeze({
  [RASGO.BUSCA_EVENTO]: (c) => c.tipo === TIPO.EVENTO,
  [RASGO.BUSCA_CLIMA]: (c) => c.tipo === TIPO.CLIMA,
  [RASGO.BUSCA_GREGARISMO]: (c) => c.rasgo === RASGO.GREGARISMO
});
var ranurasLibres = (state, bando) => state.ranuras[bando].map((x, i) => x === null ? i : -1).filter((i) => i >= 0);
function vistaDe(state, j) {
  const v = structuredClone(state);
  const r = v.jugadores[rival(j)];
  r.manoOculta = r.mano.length;
  r.mano = [];
  r.pendientesOcultos = r.pendientes.length;
  r.pendientes = [];
  r.mazo = r.mazo.length;
  const descarteRival = new Set(r.descarte);
  for (const iid of Object.keys(v.instancias)) {
    const inst = v.instancias[iid];
    if (inst.dueno === j) continue;
    const publica = inst.ranura !== null || inst.adheridoA !== null || inst.iid === v.campoIid || descarteRival.has(inst.iid);
    if (!publica) delete v.instancias[iid];
  }
  v.perspectiva = j;
  return v;
}

// src/data/dietas.js
var DIETA = Object.freeze({
  CARNIVORO: "CARNIVORO",
  HERBIVORO: "HERBIVORO",
  OMNIVORO: "OMNIVORO"
});
var DIETA_NOMBRE = Object.freeze({
  CARNIVORO: "Carn\xEDvoro",
  HERBIVORO: "Herb\xEDvoro",
  OMNIVORO: "Omn\xEDvoro"
});
var { CARNIVORO, HERBIVORO, OMNIVORO } = DIETA;
var EXCEPCIONES = Object.freeze({
  // Terópodos que NO son carnívoros. Aquí está el valor de todo el eje.
  therizinosaurus: HERBIVORO,
  // dentición, vientre ancho y garras de ramoneo
  ojoraptorsaurus: OMNIVORO,
  // oviraptorosaurio: sin dientes, dieta discutida
  tongtianlong: OMNIVORO,
  // oviraptorosaurio, mismo caso
  troodon: OMNIVORO,
  // dentición con dentículos grandes, discutido
  // Pterosaurio: los tapejáridos se leen como frugívoros, no como pescadores.
  huaxiadraco: HERBIVORO
});
var POR_CLADO = Object.freeze({
  [CLADO.TEROPODO]: CARNIVORO,
  [CLADO.SAUROPODO]: HERBIVORO,
  [CLADO.TIREOFORO]: HERBIVORO,
  [CLADO.ORNITOPODO]: HERBIVORO,
  [CLADO.MARGINOCEFALO]: HERBIVORO,
  [CLADO.PTEROSAURIO]: CARNIVORO,
  [CLADO.MARINO]: CARNIVORO
});
function dietaDe(cardId) {
  const c = CARTAS[cardId];
  if (!c || c.tipo !== TIPO.DINOSAURIO) return null;
  return EXCEPCIONES[cardId] ?? POR_CLADO[c.clado] ?? CARNIVORO;
}

// src/engine/economia.js
var MODO = Object.freeze({ FIJA: "FIJA", TIPADA: "TIPADA", CARTAS: "CARTAS" });
var modoActual = () => BALANCE.economia.modo;
var esTipada = (modo = modoActual()) => modo !== MODO.FIJA;
function dietaDeCarta(cardId) {
  const c = carta(cardId);
  if (c.tipo === TIPO.BIOMASA) return null;
  return c.dieta ?? dietaDe(cardId);
}
var vegetalDe = (jug) => jug.biomasa - (jug.animal ?? 0);
var animalDe = (jug) => jug.animal ?? 0;
function puedePagar(jug, cardId, modo = modoActual()) {
  const coste = carta(cardId).coste;
  if (!esTipada(modo)) return jug.biomasa >= coste;
  switch (dietaDeCarta(cardId)) {
    case DIETA.CARNIVORO:
      return animalDe(jug) >= coste;
    case DIETA.HERBIVORO:
      return vegetalDe(jug) >= coste;
    default:
      return jug.biomasa >= coste;
  }
}
function pagar(jug, cardId, modo = modoActual()) {
  const coste = carta(cardId).coste;
  if (!esTipada(modo)) {
    jug.biomasa -= coste;
    return;
  }
  const vegetal = vegetalDe(jug);
  const dieta = dietaDeCarta(cardId);
  const delAnimal = dieta === DIETA.CARNIVORO ? coste : dieta === DIETA.HERBIVORO ? 0 : Math.max(0, coste - vegetal);
  jug.biomasa -= coste;
  jug.animal -= delAnimal;
}
function devolver(jug, cardId, modo = modoActual()) {
  const coste = carta(cardId).coste;
  jug.biomasa += coste;
  if (!esTipada(modo)) return;
  if (dietaDeCarta(cardId) === DIETA.CARNIVORO) jug.animal += coste;
}
function ingresar(jug, cantidad, tipo, modo = modoActual()) {
  const antes = jug.biomasa;
  jug.biomasa = Math.min(jug.biomasa + cantidad, BALANCE.rentaTope);
  const entro = jug.biomasa - antes;
  if (esTipada(modo) && tipo === DIETA.CARNIVORO) jug.animal = (jug.animal ?? 0) + entro;
  return entro;
}
function rentaTipada(produccion) {
  const t = BALANCE.economia.tipada;
  return produccion === DIETA.CARNIVORO ? { cantidad: t.animal, tipo: DIETA.CARNIVORO } : { cantidad: t.vegetal, tipo: DIETA.HERBIVORO };
}
var esCartaDeBiomasa = (cardId) => carta(cardId).tipo === TIPO.BIOMASA;

// src/engine/resolve.js
function ev(s, tipo, datos = {}) {
  s.eventos.push({ turno: s.turno, tipo, ...datos });
}
function herir(s, iid, cantidad, causa, porBando) {
  if (cantidad <= 0) return;
  const inst = s.instancias[iid];
  inst.heridas += cantidad;
  ev(s, "DANO", { iid, cardId: inst.cardId, dueno: inst.dueno, cantidad, causa, porBando });
}
function recogerBajas(s, causa) {
  let muertes = 0;
  for (const bando of [0, 1]) {
    s.ranuras[bando] = s.ranuras[bando].map((iid) => {
      if (iid === null || vidaActual(s, iid) > 0) return iid;
      const inst = s.instancias[iid];
      for (const aid of inst.adherencias) {
        const a = s.instancias[aid];
        a.adheridoA = null;
        s.jugadores[a.dueno].descarte.push(aid);
      }
      inst.adherencias = [];
      inst.ranura = null;
      inst.heridas = 0;
      inst.modAtaque = 0;
      inst.modDefensa = 0;
      inst.modVida = 0;
      inst.marcas = [];
      inst.desplegadoEnTurno = null;
      s.jugadores[inst.dueno].descarte.push(iid);
      s.jugadores[rival(bando)].trofeos += 1;
      muertes += 1;
      ev(s, "MUERTE", { iid, cardId: inst.cardId, dueno: bando, causa });
      return null;
    });
  }
  if (muertes > 0) {
    const ganancia = muertes * BALANCE.rasgos.oportunistaVidaPorMuerte;
    for (const inst of todasLasUnidades(s)) {
      if (carta(inst.cardId).rasgo !== RASGO.OPORTUNISTA) continue;
      inst.modVida += ganancia;
      marcar(inst, inst.cardId, 0, ganancia);
      ev(s, "OPORTUNISTA", { iid: inst.iid, dueno: inst.dueno, vida: ganancia });
    }
  }
  return muertes;
}
function marcar(inst, cardId, ataque, vida, defensa = 0) {
  const previo = inst.marcas.find((m) => m.cardId === cardId);
  if (previo) {
    previo.ataque += ataque;
    previo.vida += vida;
    previo.defensa += defensa;
    previo.veces += 1;
    return;
  }
  inst.marcas.push({ cardId, ataque, vida, defensa, veces: 1 });
}
function golpearHabitat(s, bando, cantidad) {
  if (cantidad <= 0) return;
  s.jugadores[bando].habitat -= cantidad;
  ev(s, "HABITAT", { bando, cantidad, restante: s.jugadores[bando].habitat });
}
function perderDelMazo(s, j, n) {
  const jug = s.jugadores[j];
  const perdidas = Math.min(n, jug.mazo.length);
  for (let k = 0; k < perdidas; k++) jug.descarte.push(jug.mazo.shift());
  if (perdidas > 0) {
    ev(s, "MAZO_PERDIDO", { jugador: j, cartas: perdidas, restante: jug.mazo.length });
  }
}
function robar(s, j, n) {
  const jug = s.jugadores[j];
  for (let k = 0; k < n; k++) {
    if (jug.mazo.length === 0) {
      if (!BALANCE.rebarajarDescarte || jug.descarte.length === 0) {
        jug.sinCartas = true;
        ev(s, "SIN_CARTAS", { jugador: j });
        return;
      }
      const b = barajar(jug.descarte, s.rng);
      s.rng = b.rng;
      jug.mazo = b.lista;
      jug.descarte = [];
      ev(s, "REBARAJADO", { jugador: j, cartas: jug.mazo.length });
    }
    jug.mano.push(jug.mazo.shift());
  }
}
function faseRenta(s) {
  for (const jug of s.jugadores) jug.biomasaJugadaEsteTurno = 0;
  if (modoActual() === MODO.CARTAS) {
    if (s.turno === 1) {
      for (const jug of s.jugadores) {
        jug.biomasa = 0;
        jug.animal = 0;
      }
    }
    ev(s, "RENTA", { biomasa: 0, modo: MODO.CARTAS });
    s.fase = FASE.ROBO;
    return;
  }
  const renta = s.turno === 1 ? BALANCE.biomasaInicial : rentaDe(s);
  if (modoActual() === MODO.TIPADA) {
    for (const jug of s.jugadores) {
      const { cantidad, tipo } = rentaTipada(jug.produccion);
      const escala = s.turno === 1 ? BALANCE.biomasaInicial / BALANCE.rentaPorTurno : 1;
      if (!BALANCE.rentaAcumula || s.turno === 1) {
        jug.biomasa = 0;
        jug.animal = 0;
      }
      ingresar(jug, Math.round(cantidad * escala), tipo);
    }
    ev(s, "RENTA", { biomasa: renta, modo: MODO.TIPADA });
    s.fase = FASE.ROBO;
    return;
  }
  for (const jug of s.jugadores) {
    jug.biomasa = BALANCE.rentaAcumula && s.turno > 1 ? Math.min(jug.biomasa + renta, BALANCE.rentaTope) : Math.min(renta, BALANCE.rentaTope);
  }
  ev(s, "RENTA", { biomasa: renta });
  s.fase = FASE.ROBO;
}
function faseRobo(s) {
  if (hayAridez(s)) {
    for (let j = 0; j < 2; j++) perderDelMazo(s, j, BALANCE.efectosCampo.aridezMazo);
  }
  for (let j = 0; j < 2; j++) robar(s, j, BALANCE.robo.normal);
  if (s.jugadores.some((j) => j.sinCartas)) {
    finalizar(s, MOTIVO_FIN.EXTINCION);
    return;
  }
  s.fase = FASE.DESPLIEGUE;
}
function faseRevelacion(s) {
  const orden = { DESPLIEGUE: 0, MOVIMIENTO: 1, CAMPO: 2, ADAPTACION: 3, PRESION: 4 };
  const pendientes = [];
  for (let j = 0; j < 2; j++) {
    for (const p of s.jugadores[j].pendientes) pendientes.push({ ...p, jugador: j });
    s.jugadores[j].pendientes = [];
  }
  pendientes.sort((a, b) => orden[a.tipo] - orden[b.tipo] || a.iid - b.iid);
  for (const p of pendientes) {
    const inst = s.instancias[p.iid];
    if (p.tipo === "DESPLIEGUE") {
      if (s.ranuras[p.jugador][p.ranura] !== null) {
        s.jugadores[p.jugador].descarte.push(p.iid);
        continue;
      }
      inst.ranura = p.ranura;
      inst.desplegadoEnTurno = s.turno;
      s.ranuras[p.jugador][p.ranura] = p.iid;
      ev(s, "REVELADA", { jugador: p.jugador, iid: p.iid, cardId: inst.cardId, ranura: p.ranura });
    } else if (p.tipo === "MOVIMIENTO") {
      if (inst.ranura === null || s.ranuras[p.jugador][p.ranura] !== null) continue;
      s.ranuras[p.jugador][inst.ranura] = null;
      s.ranuras[p.jugador][p.ranura] = p.iid;
      ev(s, "MOVIDA", { jugador: p.jugador, iid: p.iid, cardId: inst.cardId, desde: inst.ranura, hasta: p.ranura });
      inst.ranura = p.ranura;
    } else if (p.tipo === "CAMPO") {
      if (s.campo !== null) s.jugadores[s.campoDe].descarte.push(s.campoIid);
      s.campo = inst.cardId;
      s.campoIid = p.iid;
      s.campoDe = p.jugador;
      ev(s, "CAMPO", { jugador: p.jugador, cardId: inst.cardId });
    } else if (p.tipo === "ADAPTACION") {
      const objetivo = s.instancias[p.objetivo];
      if (!objetivo || objetivo.ranura === null) {
        s.jugadores[p.jugador].descarte.push(p.iid);
        ev(s, "ADAPTACION_PERDIDA", { jugador: p.jugador, iid: p.iid });
        continue;
      }
      inst.adheridoA = objetivo.iid;
      objetivo.adherencias.push(p.iid);
      const r = carta(inst.cardId).rasgo;
      if (r === RASGO.CRECIMIENTO_ACELERADO) {
        objetivo.modAtaque += BALANCE.rasgos.crecimientoAtaque;
        objetivo.modVida += BALANCE.rasgos.crecimientoVida;
        marcar(objetivo, inst.cardId, BALANCE.rasgos.crecimientoAtaque, BALANCE.rasgos.crecimientoVida);
      }
      if (r === RASGO.NEUMATICIDAD) {
        objetivo.modAtaque += BALANCE.rasgos.neumaticidadAtaque;
        marcar(objetivo, inst.cardId, BALANCE.rasgos.neumaticidadAtaque, 0);
      }
      ev(s, "ADAPTACION", {
        jugador: p.jugador,
        iid: p.iid,
        cardId: inst.cardId,
        objetivo: objetivo.iid,
        objetivoCardId: objetivo.cardId
      });
    } else if (p.tipo === "PRESION") {
      aplicarPresion(s, p);
      s.jugadores[p.jugador].descarte.push(p.iid);
    }
  }
  recogerBajas(s, CAUSA.MORTANDAD);
  s.fase = FASE.COMBATE;
}
function aplicarPresion(s, p) {
  const cardId = s.instancias[p.iid].cardId;
  const r = carta(cardId).rasgo;
  const contrario = rival(p.jugador);
  if (r === RASGO.FRACTURA) {
    const objetivo = s.instancias[p.objetivo];
    if (!objetivo || objetivo.ranura === null) return;
    objetivo.modAtaque -= BALANCE.rasgos.fracturaAtaque;
    marcar(objetivo, cardId, -BALANCE.rasgos.fracturaAtaque, 0);
    ev(s, "PRESION", { jugador: p.jugador, cardId, objetivo: objetivo.iid, objetivoCardId: objetivo.cardId });
  } else if (r === RASGO.COMPETENCIA) {
    let n = 0;
    for (const oid of p.objetivos ?? []) {
      const inst = s.instancias[oid];
      if (!inst || inst.ranura === null || inst.dueno !== contrario) continue;
      inst.modDefensa -= BALANCE.rasgos.competenciaDefensa;
      marcar(inst, cardId, 0, 0, -BALANCE.rasgos.competenciaDefensa);
      n += 1;
    }
    ev(s, "PRESION", { jugador: p.jugador, cardId, objetivos: p.objetivos ?? [], afectados: n });
  } else if (r === RASGO.TRAMPA) {
    perderDelMazo(s, contrario, BALANCE.rasgos.trampaMazoRival);
    perderDelMazo(s, p.jugador, BALANCE.rasgos.trampaMazoPropio);
    ev(s, "PRESION", { jugador: p.jugador, cardId });
  } else if (r === RASGO.MORTANDAD) {
    for (const inst of todasLasUnidades(s)) {
      herir(s, inst.iid, BALANCE.rasgos.mortandadDano, CAUSA.MORTANDAD, p.jugador);
    }
    ev(s, "PRESION", { jugador: p.jugador, cardId });
  }
}
function faseCombate(s) {
  if (s.turno < BALANCE.turnoPrimerCombate) {
    ev(s, "SIN_COMBATE", { turno: s.turno });
    s.fase = s.jugadores.some((j) => j.mano.length > BALANCE.manoMaxima) ? FASE.DESCARTE : FASE.CHEQUEO;
    return;
  }
  const golpes = [];
  const alHabitat = [0, 0];
  for (let r = 0; r < BALANCE.ranuras; r++) {
    const a = unidadEn(s, 0, r);
    const b = unidadEn(s, 1, r);
    const volA = a && vuela(s, a.iid);
    const volB = b && vuela(s, b.iid);
    if (volA || volB) {
      for (const [uno, bando, vuela1] of [[a, 0, volA], [b, 1, volB]]) {
        if (!uno) continue;
        const d = danoAlHabitat(s, uno.iid);
        alHabitat[rival(bando)] += d;
        ev(s, vuela1 ? "SOBREVUELO" : "AVANCE", { ranura: r, iid: uno.iid, bando, dano: d });
      }
      if (a && b) {
        if (!volA) golpes.push({ iid: b.iid, cantidad: danoEntre(s, a.iid, b.iid), causa: CAUSA.COMBATE, por: 0 });
        if (!volB) golpes.push({ iid: a.iid, cantidad: danoEntre(s, b.iid, a.iid), causa: CAUSA.COMBATE, por: 1 });
      }
      continue;
    }
    if (a && b) {
      const dA = danoEntre(s, a.iid, b.iid);
      const dB = danoEntre(s, b.iid, a.iid);
      golpes.push({ iid: b.iid, cantidad: dA, causa: CAUSA.COMBATE, por: 0 });
      golpes.push({ iid: a.iid, cantidad: dB, causa: CAUSA.COMBATE, por: 1 });
      golpes.push({ iid: a.iid, cantidad: espinasDe(s, b.iid), causa: CAUSA.ESPINAS, por: 1 });
      golpes.push({ iid: b.iid, cantidad: espinasDe(s, a.iid), causa: CAUSA.ESPINAS, por: 0 });
      if (dA > 0 && carta(a.cardId).rasgo === RASGO.DESGARRO) s.instancias[b.iid].sinCuracion = true;
      if (dB > 0 && carta(b.cardId).rasgo === RASGO.DESGARRO) s.instancias[a.iid].sinCuracion = true;
      if (carta(a.cardId).rasgo === RASGO.DEPREDADOR_DOMINANTE) {
        alHabitat[1] += Math.max(0, dA - vidaActual(s, b.iid));
      }
      if (carta(b.cardId).rasgo === RASGO.DEPREDADOR_DOMINANTE) {
        alHabitat[0] += Math.max(0, dB - vidaActual(s, a.iid));
      }
      ev(s, "CHOQUE", { ranura: r, a: a.iid, b: b.iid, danoA: dA, danoB: dB });
    } else if (a) {
      const d = danoAlHabitat(s, a.iid);
      alHabitat[1] += d;
      ev(s, "AVANCE", { ranura: r, iid: a.iid, bando: 0, dano: d });
    } else if (b) {
      const d = danoAlHabitat(s, b.iid);
      alHabitat[0] += d;
      ev(s, "AVANCE", { ranura: r, iid: b.iid, bando: 1, dano: d });
    }
  }
  for (const g of golpes) herir(s, g.iid, g.cantidad, g.causa, g.por);
  recogerBajas(s, CAUSA.COMBATE);
  golpearHabitat(s, 0, alHabitat[0]);
  golpearHabitat(s, 1, alHabitat[1]);
  for (const inst of todasLasUnidades(s)) {
    if (inst.sinCuracion) {
      inst.sinCuracion = false;
      continue;
    }
    const cura = curacionDe(s, inst.iid);
    if (cura > 0 && inst.heridas > 0) {
      inst.heridas = Math.max(0, inst.heridas - cura);
      ev(s, "CURACION", { iid: inst.iid, dueno: inst.dueno, cura });
    }
  }
  s.fase = s.jugadores.some((j) => j.mano.length > BALANCE.manoMaxima) ? FASE.DESCARTE : FASE.CHEQUEO;
}
function descartarDeMano(s, j, iid) {
  const jug = s.jugadores[j];
  jug.mano = jug.mano.filter((x) => x !== iid);
  jug.descarte.push(iid);
  ev(s, "DESCARTE", { jugador: j, iid, cardId: s.instancias[iid].cardId });
}
function faseChequeo(s) {
  const [a, b] = s.jugadores;
  if (a.mazo.length === 0 || b.mazo.length === 0) {
    if (a.mazo.length === 0) a.sinCartas = true;
    if (b.mazo.length === 0) b.sinCartas = true;
    finalizar(s, MOTIVO_FIN.EXTINCION);
    return;
  }
  if (a.trofeos >= BALANCE.trofeosParaGanar || b.trofeos >= BALANCE.trofeosParaGanar) {
    finalizar(s, MOTIVO_FIN.TROFEOS);
    return;
  }
  if (a.habitat <= 0 || b.habitat <= 0) {
    finalizar(s, MOTIVO_FIN.HABITAT);
    return;
  }
  if (s.turno >= BALANCE.limiteTurnos) {
    finalizar(s, MOTIVO_FIN.LIMITE_TURNOS);
    return;
  }
  s.turno += 1;
  s.eventos = [];
  for (const jug of s.jugadores) {
    jug.listo = false;
    jug.pendientes = [];
  }
  s.fase = FASE.RENTA;
}
function finalizar(s, motivo) {
  const [a, b] = s.jugadores;
  let ganador;
  if (motivo === MOTIVO_FIN.EXTINCION && a.sinCartas !== b.sinCartas) {
    ganador = a.sinCartas ? 1 : 0;
  } else if (motivo === MOTIVO_FIN.TROFEOS && a.trofeos !== b.trofeos) {
    ganador = a.trofeos > b.trofeos ? 0 : 1;
  } else if (motivo === MOTIVO_FIN.HABITAT && a.habitat !== b.habitat) {
    ganador = a.habitat > b.habitat ? 0 : 1;
  } else if (a.trofeos !== b.trofeos) {
    ganador = a.trofeos > b.trofeos ? 0 : 1;
  } else if (a.habitat !== b.habitat) {
    ganador = a.habitat > b.habitat ? 0 : 1;
  } else {
    ganador = 0;
  }
  s.ganador = ganador;
  s.motivoFin = motivo;
  s.fase = FASE.FIN;
  ev(s, "FIN", { ganador, motivo, trofeos: [a.trofeos, b.trofeos], habitat: [a.habitat, b.habitat] });
}

// src/engine/actions.js
var ACCION = Object.freeze({
  DESPLEGAR: "DESPLEGAR",
  MOVER: "MOVER",
  EVENTO: "EVENTO",
  CLIMA: "CLIMA",
  RECURSO: "RECURSO",
  RETIRAR: "RETIRAR",
  MULLIGAN: "MULLIGAN",
  PASAR: "PASAR",
  DESCARTAR: "DESCARTAR",
  AVANZAR: "AVANZAR",
  // Sólo en las variantes de economía (BALANCE.economia.modo distinto de FIJA).
  BIOMASA: "BIOMASA",
  // bajar una carta de recurso (modo CARTAS)
  PRODUCIR: "PRODUCIR"
  // declarar qué produces el turno que viene (TIPADA)
});
var CLADOS = Object.values(CLADO);
function cartasTrasMulligan(jug) {
  return BALANCE.manoInicial + BALANCE.robo.normal - jug.mulligans;
}
function ranuraProyectada(s, jugador, iid) {
  const inst = s.instancias[iid];
  if (inst.ranura !== null) return inst.ranura;
  const p = s.jugadores[jugador].pendientes.find((x) => x.iid === iid && x.tipo === "DESPLIEGUE");
  return p ? p.ranura : null;
}
var ranuraReservada = (s, jugador, ranura) => s.jugadores[jugador].pendientes.some((p) => p.ranura === ranura && (p.tipo === "DESPLIEGUE" || p.tipo === "MOVIMIENTO"));
function validar(s, a) {
  if (s.fase === FASE.FIN) return "partida terminada";
  if (a.tipo === ACCION.AVANZAR) {
    return FASES_INTERACTIVAS.includes(s.fase) ? "la fase espera una acci\xF3n de jugador" : null;
  }
  const jug = s.jugadores[a.jugador];
  if (!jug) return "jugador inexistente";
  if (a.tipo === ACCION.DESCARTAR) {
    if (s.fase !== FASE.DESCARTE) return "no toca descartar";
    if (jug.mano.length <= BALANCE.manoMaxima) return "tu mano no excede el l\xEDmite";
    if (!jug.mano.includes(a.iid)) return "la carta no est\xE1 en tu mano";
    return null;
  }
  if (s.fase !== FASE.DESPLIEGUE) return "fuera de la fase de despliegue";
  if (jug.listo) return "ya has pasado";
  if (a.tipo === ACCION.PASAR) return null;
  if (a.tipo === ACCION.PRODUCIR) {
    if (modoActual() !== MODO.TIPADA) return "aqu\xED la Biomasa no tiene tipo";
    if (a.produccion !== DIETA.CARNIVORO && a.produccion !== DIETA.HERBIVORO) {
      return "s\xF3lo se produce vegetal o animal";
    }
    return null;
  }
  if (a.tipo === ACCION.MULLIGAN) {
    if (s.turno !== 1) return "la mano s\xF3lo se cambia en el primer turno";
    if (jug.pendientes.length > 0) return "ya has comprometido una carta este turno";
    if (cartasTrasMulligan(jug) <= 0) return "no quedan cambios de mano";
    return null;
  }
  const inst = s.instancias[a.iid];
  if (!inst) return "carta inexistente";
  if (a.tipo === ACCION.RETIRAR) {
    const p = jug.pendientes.find((x) => x.iid === a.iid);
    if (!p) return "esa carta no est\xE1 comprometida este turno";
    if (p.tipo === "DESPLIEGUE" && jug.pendientes.some((x) => x.tipo === "ADAPTACION" && x.objetivo === a.iid)) {
      return "retira antes el evento que le has puesto encima";
    }
    return null;
  }
  if (a.tipo === ACCION.MOVER) {
    if (inst.dueno !== a.jugador) return "esa unidad no es tuya";
    if (inst.ranura === null) return "esa unidad no est\xE1 en el campo";
    if (carta(inst.cardId).rasgo !== RASGO.MIGRADOR) return "esa unidad no puede moverse";
    if (!ranuraValida(a.ranura)) return "ranura inexistente";
    if (s.ranuras[a.jugador][a.ranura] !== null) return "esa ranura est\xE1 ocupada";
    if (ranuraReservada(s, a.jugador, a.ranura)) return "ya has comprometido esa ranura";
    if (jug.pendientes.some((p) => p.iid === a.iid)) return "esa unidad ya se mueve este turno";
    return null;
  }
  if (!jug.mano.includes(a.iid)) return "la carta no est\xE1 en tu mano";
  const c = carta(inst.cardId);
  if (a.tipo === ACCION.BIOMASA) {
    if (modoActual() !== MODO.CARTAS) return "aqu\xED la Biomasa no se juega, se cobra";
    if (!esCartaDeBiomasa(inst.cardId)) return "esa carta no da Biomasa";
    if (jug.biomasaJugadaEsteTurno >= BALANCE.economia.cartas.porTurno) {
      return "ya has bajado tu recurso de este turno";
    }
    return null;
  }
  if (esCartaDeBiomasa(inst.cardId)) return "esa carta s\xF3lo se baja como recurso";
  if (!puedePagar(jug, inst.cardId)) return "Biomasa insuficiente";
  switch (a.tipo) {
    case ACCION.DESPLEGAR: {
      if (c.tipo !== TIPO.DINOSAURIO) return "esa carta no se despliega en una ranura";
      if (!ranuraValida(a.ranura)) return "ranura inexistente";
      if (s.ranuras[a.jugador][a.ranura] !== null) return "esa ranura est\xE1 ocupada";
      if (ranuraReservada(s, a.jugador, a.ranura)) return "ya has comprometido esa ranura";
      if (a.busca !== void 0 && a.busca !== null) {
        if (!buscaEnElMazo(a.cardId ?? inst.cardId)) return "esa carta no busca nada en el mazo";
        if (!buscablesDe(s, a.jugador, inst.cardId).includes(a.busca)) {
          return "esa carta no est\xE1 en tu mazo o no es de las que puede buscar";
        }
      }
      return null;
    }
    case ACCION.RECURSO:
      if (c.tipo !== TIPO.RECURSO) return "esa carta no es de recurso";
      return null;
    case ACCION.CLIMA:
      if (c.tipo !== TIPO.CLIMA) return "esa carta no es de clima";
      if (jug.pendientes.some((p) => p.tipo === "CAMPO")) return "ya has comprometido un clima este turno";
      return null;
    // Un solo caso para los eventos: lo que cambia entre ellos es su objetivo,
    // no su familia.
    case ACCION.EVENTO: {
      if (c.tipo !== TIPO.EVENTO) return "esa carta no es un evento";
      if (c.objetivo === OBJETIVO.PROPIO) {
        const objetivo = s.instancias[a.objetivo];
        if (!objetivo || objetivo.dueno !== a.jugador) return "el objetivo no es tuyo";
        if (carta(objetivo.cardId).tipo !== TIPO.DINOSAURIO) return "el objetivo no es un dinosaurio";
        if (ranuraProyectada(s, a.jugador, a.objetivo) === null) return "el objetivo no est\xE1 en el campo";
        if (c.rasgo === RASGO.NEUMATICIDAD) {
          const clado = carta(objetivo.cardId).clado;
          if (clado !== CLADO.TEROPODO && clado !== CLADO.SAUROPODO) {
            return "la neumaticidad s\xF3lo se da en ter\xF3podos y saur\xF3podos";
          }
        }
      } else if (c.objetivo === OBJETIVO.RIVAL) {
        const objetivo = s.instancias[a.objetivo];
        if (!objetivo || objetivo.dueno !== rival(a.jugador)) return "el objetivo no es del rival";
        if (objetivo.ranura === null) return "el objetivo no est\xE1 en el campo";
      } else if (c.objetivo === OBJETIVO.CLADO) {
        if (!CLADOS.includes(a.clado)) return "clado inexistente";
      } else if (c.objetivo === OBJETIVO.RIVALES) {
        const tope = BALANCE.rasgos.competenciaObjetivos;
        const os = a.objetivos ?? [];
        if (!Array.isArray(os) || os.length === 0) return "elige al menos un dinosaurio rival";
        if (os.length > tope) return `esta carta alcanza a ${tope} como mucho`;
        if (new Set(os).size !== os.length) return "no se puede se\xF1alar dos veces al mismo";
        for (const oid of os) {
          const o = s.instancias[oid];
          if (!o || o.dueno !== rival(a.jugador)) return "el objetivo no es del rival";
          if (o.ranura === null) return "el objetivo no est\xE1 en el campo";
        }
      }
      return null;
    }
    default:
      return "acci\xF3n desconocida";
  }
}
function aplicarRecurso(s, j, iid) {
  const jug = s.jugadores[j];
  const cardId = s.instancias[iid].cardId;
  const r = carta(cardId).rasgo;
  const P = BALANCE.recursos;
  jug.mano = jug.mano.filter((x) => x !== iid);
  jug.descarte.push(iid);
  if (r === RASGO.REBROTE) {
    jug.biomasa += P.rebroteBiomasa;
    for (const u of unidadesDe(s, j)) u.heridas += P.rebroteHeridas;
  } else if (r === RASGO.CARRONA) {
    jug.biomasa += P.carronaBiomasa;
    s.jugadores[rival(j)].biomasa += P.carronaBiomasaRival;
  } else if (r === RASGO.LAGO) {
    jug.biomasa += P.lagoBiomasa;
    jug.habitat -= P.lagoHabitat;
  }
  ev(s, "RECURSO", { jugador: j, cardId, biomasa: jug.biomasa });
}
function aplicarFaseAutomatica(s) {
  switch (s.fase) {
    case FASE.RENTA:
      return faseRenta(s);
    case FASE.ROBO:
      return faseRobo(s);
    case FASE.REVELACION:
      return faseRevelacion(s);
    case FASE.COMBATE:
      return faseCombate(s);
    case FASE.CHEQUEO:
      return faseChequeo(s);
    default:
      return void 0;
  }
}
function reduce(state, action) {
  const s = structuredClone(state);
  const motivo = validar(s, action);
  if (motivo) {
    ev(s, "RECHAZADA", { accion: action.tipo, jugador: action.jugador ?? null, motivo });
    return s;
  }
  const jug = s.jugadores[action.jugador];
  switch (action.tipo) {
    case ACCION.AVANZAR:
      aplicarFaseAutomatica(s);
      break;
    // Bajar un recurso (modo CARTAS). Boca arriba y al instante, como las
    // cartas de recurso del set: la Biomasa que da se gasta este mismo turno.
    case ACCION.BIOMASA: {
      const cardId = s.instancias[action.iid].cardId;
      const t = BALANCE.economia.cartas;
      jug.mano = jug.mano.filter((x) => x !== action.iid);
      jug.descarte.push(action.iid);
      jug.biomasaJugadaEsteTurno += 1;
      ingresar(jug, t.valor, dietaDeCarta(cardId) ?? DIETA.HERBIVORO);
      ev(s, "BIOMASA", { jugador: action.jugador, cardId, biomasa: jug.biomasa });
      break;
    }
    // Declarar qué se produce el turno que viene (modo TIPADA). No cuesta nada
    // y no se ve: es la parte de la economía que también se juega a ciegas.
    case ACCION.PRODUCIR:
      jug.produccion = action.produccion === DIETA.CARNIVORO ? DIETA.CARNIVORO : DIETA.HERBIVORO;
      ev(s, "PRODUCCION", { jugador: action.jugador, produccion: jug.produccion });
      break;
    case ACCION.DESPLEGAR:
      pagar(jug, s.instancias[action.iid].cardId);
      jug.mano = jug.mano.filter((x) => x !== action.iid);
      jug.pendientes.push({ tipo: "DESPLIEGUE", iid: action.iid, ranura: action.ranura });
      if (action.busca !== void 0 && action.busca !== null) {
        jug.mazo = jug.mazo.filter((x) => x !== action.busca);
        jug.mano.push(action.busca);
        ev(s, "BUSQUEDA", {
          jugador: action.jugador,
          porCardId: s.instancias[action.iid].cardId,
          cardId: s.instancias[action.busca].cardId
        });
      }
      break;
    case ACCION.MOVER:
      jug.pendientes.push({ tipo: "MOVIMIENTO", iid: action.iid, ranura: action.ranura });
      break;
    case ACCION.RECURSO:
      aplicarRecurso(s, action.jugador, action.iid);
      break;
    case ACCION.CLIMA:
      pagar(jug, s.instancias[action.iid].cardId);
      jug.mano = jug.mano.filter((x) => x !== action.iid);
      jug.pendientes.push({ tipo: "CAMPO", iid: action.iid });
      break;
    case ACCION.EVENTO: {
      const c = carta(s.instancias[action.iid].cardId);
      pagar(jug, s.instancias[action.iid].cardId);
      jug.mano = jug.mano.filter((x) => x !== action.iid);
      jug.pendientes.push({
        tipo: c.objetivo === OBJETIVO.PROPIO ? "ADAPTACION" : "PRESION",
        iid: action.iid,
        objetivo: action.objetivo ?? null,
        clado: action.clado ?? null,
        objetivos: action.objetivos ?? null
      });
      break;
    }
    case ACCION.RETIRAR: {
      const p = jug.pendientes.find((x) => x.iid === action.iid);
      jug.pendientes = jug.pendientes.filter((x) => x !== p);
      if (p.tipo !== "MOVIMIENTO") {
        devolver(jug, s.instancias[action.iid].cardId);
        jug.mano.push(action.iid);
      }
      ev(s, "RETIRADA", { jugador: action.jugador, iid: action.iid, tipo: p.tipo });
      break;
    }
    case ACCION.MULLIGAN: {
      const cuantas = cartasTrasMulligan(jug);
      const b = barajar([...jug.mazo, ...jug.mano], s.rng);
      s.rng = b.rng;
      jug.mazo = b.lista;
      jug.mano = [];
      jug.mulligans += 1;
      for (let k = 0; k < cuantas && jug.mazo.length > 0; k++) jug.mano.push(jug.mazo.shift());
      ev(s, "MULLIGAN", { jugador: action.jugador, cartas: jug.mano.length, numero: jug.mulligans });
      break;
    }
    case ACCION.PASAR:
      jug.listo = true;
      if (s.jugadores.every((j) => j.listo)) s.fase = FASE.REVELACION;
      break;
    case ACCION.DESCARTAR:
      descartarDeMano(s, action.jugador, action.iid);
      if (!s.jugadores.some((j) => j.mano.length > BALANCE.manoMaxima)) s.fase = FASE.CHEQUEO;
      break;
    default:
      break;
  }
  return s;
}
function mejorBusqueda(s, j, cardId) {
  const opciones = buscablesDe(s, j, cardId);
  if (opciones.length === 0) return null;
  let mejor = opciones[0];
  for (const iid of opciones) {
    if (carta(s.instancias[iid].cardId).coste > carta(s.instancias[mejor].cardId).coste) mejor = iid;
  }
  return mejor;
}
function legales(state, j) {
  const s = state;
  const jug = s.jugadores[j];
  const salida = [];
  if (s.fase === FASE.DESCARTE && jug.mano.length > BALANCE.manoMaxima) {
    for (const iid of jug.mano) salida.push({ tipo: ACCION.DESCARTAR, jugador: j, iid });
    return salida;
  }
  if (s.fase !== FASE.DESPLIEGUE || jug.listo) return salida;
  salida.push({ tipo: ACCION.PASAR, jugador: j });
  const cambiar = { tipo: ACCION.MULLIGAN, jugador: j };
  if (!validar(s, cambiar)) salida.push(cambiar);
  if (modoActual() === MODO.TIPADA) {
    for (const produccion of [DIETA.HERBIVORO, DIETA.CARNIVORO]) {
      if (jug.produccion !== produccion) salida.push({ tipo: ACCION.PRODUCIR, jugador: j, produccion });
    }
  }
  const libres = ranurasLibres(s, j).filter((r) => !ranuraReservada(s, j, r));
  const propias = [
    ...unidadesDe(s, j).map((u) => u.iid),
    ...jug.pendientes.filter((p) => p.tipo === "DESPLIEGUE").map((p) => p.iid)
  ];
  const ajenas = unidadesDe(s, rival(j)).map((u) => u.iid);
  for (const iid of jug.mano) {
    const c = carta(s.instancias[iid].cardId);
    if (c.tipo === TIPO.BIOMASA) {
      const a = { tipo: ACCION.BIOMASA, jugador: j, iid };
      if (!validar(s, a)) salida.push(a);
      continue;
    }
    if (!puedePagar(jug, s.instancias[iid].cardId)) continue;
    if (c.tipo === TIPO.DINOSAURIO) {
      const busca = mejorBusqueda(s, j, s.instancias[iid].cardId);
      for (const r of libres) salida.push({ tipo: ACCION.DESPLEGAR, jugador: j, iid, ranura: r, busca });
    } else if (c.tipo === TIPO.RECURSO) {
      salida.push({ tipo: ACCION.RECURSO, jugador: j, iid });
    } else if (c.tipo === TIPO.CLIMA) {
      const a = { tipo: ACCION.CLIMA, jugador: j, iid };
      if (!validar(s, a)) salida.push(a);
    } else if (c.tipo === TIPO.EVENTO) {
      if (c.objetivo === OBJETIVO.PROPIO) {
        for (const objetivo of propias) {
          const a = { tipo: ACCION.EVENTO, jugador: j, iid, objetivo };
          if (!validar(s, a)) salida.push(a);
        }
      } else if (c.objetivo === OBJETIVO.RIVAL) {
        for (const objetivo of ajenas) salida.push({ tipo: ACCION.EVENTO, jugador: j, iid, objetivo });
      } else if (c.objetivo === OBJETIVO.CLADO) {
        for (const clado of CLADOS) salida.push({ tipo: ACCION.EVENTO, jugador: j, iid, clado });
      } else if (c.objetivo === OBJETIVO.RIVALES) {
        const duros = [...ajenas].sort((x, y) => ataqueEfectivo(s, y) - ataqueEfectivo(s, x)).slice(0, BALANCE.rasgos.competenciaObjetivos);
        if (duros.length) salida.push({ tipo: ACCION.EVENTO, jugador: j, iid, objetivos: duros });
      } else {
        salida.push({ tipo: ACCION.EVENTO, jugador: j, iid });
      }
    }
  }
  for (const u of unidadesDe(s, j)) {
    if (carta(u.cardId).rasgo !== RASGO.MIGRADOR) continue;
    for (const r of libres) {
      const a = { tipo: ACCION.MOVER, jugador: j, iid: u.iid, ranura: r };
      if (!validar(s, a)) salida.push(a);
    }
  }
  return salida;
}

// src/engine/ai.js
var PERFIL = Object.freeze({
  ALEATORIA: "aleatoria",
  HEURISTICA: "heuristica"
});
var IA = BALANCE.ia;
function ataqueHipotetico(vista, j, cardId) {
  const c = carta(cardId);
  let poder = c.ataque;
  if (c.rasgo === RASGO.GREGARIO) {
    poder += unidadesDe(vista, j).filter((u) => u.cardId === cardId).length * BALANCE.rasgos.gregarioAtaquePorCompanero;
  }
  if (c.rasgo === RASGO.RIBERENO && campoEs(vista, RASGO.CAMPO_CANAL)) {
    poder += BALANCE.rasgos.riberenoAtaque;
  }
  return poder;
}
function reduccionHipotetica(cardId) {
  const c = carta(cardId);
  let d = c.defensa ?? 0;
  return d;
}
function espinasHipoteticas(cardId) {
  const c = carta(cardId);
  let e = c.clado === CLADO.TIREOFORO ? BALANCE.clados.espinasTireoforo : 0;
  return e;
}
var bonusTrofico = (cladoA, cladoB) => BALANCE.clados.presaDe[cladoA] === cladoB ? BALANCE.clados.bonusDepredacion : 0;
function mazoDe(vista, j) {
  const m = vista.jugadores[j].mazo;
  return typeof m === "number" ? m : m.length;
}
function valorEnRanura(vista, j, ranura, mio) {
  const b = unidadEn(vista, rival(j), ranura);
  const extraSabana = campoEs(vista, RASGO.CAMPO_SABANA) ? BALANCE.efectosCampo.sabanaDanoHabitat : 0;
  if (!b) {
    const turnos2 = 1 + (IA.horizonte - 1) * 0.5;
    return (mio.poder + extraSabana) * IA.pesoHabitat * turnos2;
  }
  if (mio.vuela) {
    const turnos2 = 1 + (IA.horizonte - 1) * 0.5;
    return (mio.poder + extraSabana) * IA.pesoHabitat * turnos2;
  }
  if (vuela(vista, b.iid)) {
    const turnos2 = 1 + (IA.horizonte - 1) * 0.5;
    return (mio.poder + extraSabana) * IA.pesoHabitat * turnos2;
  }
  const evitado = danoAlHabitat(vista, b.iid) * IA.pesoHabitat;
  const dA = Math.max(0, mio.poder + bonusTrofico(mio.clado, carta(b.cardId).clado) - reduccionDe(vista, b.iid));
  const dB = Math.max(0, ataqueEfectivo(vista, b.iid) + bonusTrofico(carta(b.cardId).clado, mio.clado) - mio.reduccion) + mio.espinasRecibidas;
  const mata = dA + mio.espinasPropias >= vidaActual(vista, b.iid);
  const muere = dB >= mio.vida;
  const turnos = muere ? 1 : Math.min(IA.horizonte, Math.ceil(mio.vida / Math.max(1, dB)));
  const ofensiva = mata ? IA.pesoTrofeo : dA * IA.pesoDano * turnos;
  const defensiva = evitado * turnos;
  const perdida = muere ? IA.pesoPerdida : 0;
  return ofensiva + defensiva - perdida;
}
function statsDeCarta(vista, j, cardId, rivalIid) {
  const c = carta(cardId);
  return {
    poder: ataqueHipotetico(vista, j, cardId),
    vida: c.vida,
    clado: c.clado,
    vuela: c.rasgo === RASGO.VUELO,
    reduccion: reduccionHipotetica(cardId),
    espinasPropias: espinasHipoteticas(cardId),
    espinasRecibidas: rivalIid === null ? 0 : espinasDe(vista, rivalIid)
  };
}
function valorDeAccion(vista, j, a) {
  const contrario = rival(j);
  switch (a.tipo) {
    // Bajar el recurso del turno es como jugar la tierra en Magic: casi nunca
    // hay nada mejor que hacer con esa acción, porque no compite con jugar
    // cartas — compite con no poder jugarlas el turno que viene.
    case ACCION.BIOMASA:
      return 100;
    // Declarar producción no cuesta nada, así que la pregunta no es «¿vale la
    // pena?» sino «¿de cuál me falta?». Se mira la mano: qué tipo desbloquea
    // más Biomasa de cartas que ahora mismo no puedo pagar. A igualdad, vegetal,
    // que renta el doble.
    case ACCION.PRODUCIR: {
      const jug = vista.jugadores[j];
      let bloqueadoCarne = 0;
      let bloqueadoPlanta = 0;
      for (const iid of jug.mano) {
        const cardId = vista.instancias[iid].cardId;
        if (puedePagar(jug, cardId)) continue;
        const d = dietaDeCarta(cardId);
        if (d === DIETA.CARNIVORO) bloqueadoCarne += carta(cardId).coste;
        else bloqueadoPlanta += carta(cardId).coste;
      }
      const quiere = bloqueadoCarne > bloqueadoPlanta ? DIETA.CARNIVORO : DIETA.HERBIVORO;
      return a.produccion === quiere ? 1 : -1;
    }
    case ACCION.DESPLEGAR: {
      const cardId = vista.instancias[a.iid].cardId;
      const b = unidadEn(vista, contrario, a.ranura);
      const mio = statsDeCarta(vista, j, cardId, b ? b.iid : null);
      return valorEnRanura(vista, j, a.ranura, mio) - carta(cardId).coste * IA.pesoCoste;
    }
    case ACCION.MOVER: {
      const inst = vista.instancias[a.iid];
      const cardId = inst.cardId;
      const bDestino = unidadEn(vista, contrario, a.ranura);
      const bOrigen = unidadEn(vista, contrario, inst.ranura);
      const mio = statsDeCarta(vista, j, cardId, bDestino ? bDestino.iid : null);
      const mioOrigen = statsDeCarta(vista, j, cardId, bOrigen ? bOrigen.iid : null);
      return valorEnRanura(vista, j, a.ranura, mio) - valorEnRanura(vista, j, inst.ranura, mioOrigen);
    }
    case ACCION.EVENTO: {
      const cardId = vista.instancias[a.iid].cardId;
      const c = carta(cardId);
      const r = c.rasgo;
      let delta = 0;
      if (c.objetivo === OBJETIVO.PROPIO) {
        const objetivo = vista.instancias[a.objetivo];
        if (r === RASGO.CRECIMIENTO_ACELERADO) delta = BALANCE.rasgos.crecimientoAtaque + BALANCE.rasgos.crecimientoVida;
        else if (r === RASGO.NEUMATICIDAD) delta = BALANCE.rasgos.neumaticidadAtaque;
        else if (r === RASGO.GASTROLITOS) delta = BALANCE.rasgos.gastrolitosCura * 2;
        else if (r === RASGO.GREGARISMO) {
          delta = unidadesDe(vista, j).filter((u) => u.cardId === objetivo?.cardId).length * BALANCE.rasgos.gregarismoAtaque;
        }
      } else if (r === RASGO.FRACTURA) {
        delta = BALANCE.rasgos.fracturaAtaque;
      } else if (r === RASGO.COMPETENCIA) {
        delta = (a.objetivos ?? []).length * BALANCE.rasgos.competenciaDefensa;
      } else if (r === RASGO.TRAMPA) {
        const restante = mazoDe(vista, contrario);
        const acerca = BALANCE.rasgos.trampaMazoRival / Math.max(1, restante);
        const arriesga = BALANCE.rasgos.trampaMazoPropio / Math.max(1, mazoDe(vista, j));
        delta = (acerca - arriesga) * IA.pesoTrofeo / IA.pesoDano * 3;
      } else if (r === RASGO.MORTANDAD) {
        const mueren = (bando) => unidadesDe(vista, bando).filter((u) => vidaActual(vista, u.iid) <= BALANCE.rasgos.mortandadDano).length;
        delta = (mueren(contrario) - mueren(j)) * IA.pesoTrofeo / IA.pesoDano;
      }
      return delta * IA.pesoDano * 2 - c.coste * IA.pesoCoste;
    }
    case ACCION.RECURSO: {
      const cardId = vista.instancias[a.iid].cardId;
      const r = carta(cardId).rasgo;
      const P = BALANCE.recursos;
      let gana = 0;
      let cuesta = 0;
      if (r === RASGO.REBROTE) {
        gana = P.rebroteBiomasa;
        cuesta = unidadesDe(vista, j).length * P.rebroteHeridas * IA.pesoDano;
      }
      if (r === RASGO.CARRONA) {
        gana = P.carronaBiomasa;
        cuesta = P.carronaBiomasaRival * 0.6;
      }
      if (r === RASGO.LAGO) {
        gana = P.lagoBiomasa;
        cuesta = P.lagoHabitat * IA.pesoHabitat;
      }
      const biomasa = vista.jugadores[j].biomasa;
      const desbloquea = vista.jugadores[j].mano.filter((iid) => {
        const c = carta(vista.instancias[iid].cardId);
        return c.coste > biomasa && c.coste <= biomasa + gana;
      }).length;
      return desbloquea * 1.4 + gana * 0.25 - cuesta;
    }
    case ACCION.CLIMA: {
      const cardId = vista.instancias[a.iid].cardId;
      if (vista.campo === cardId) return -Infinity;
      const r = carta(cardId).rasgo;
      let valor = 0;
      if (r === RASGO.CAMPO_LLANURA) valor = BALANCE.efectosCampo.llanuraBiomasa * 1.2;
      if (r === RASGO.CAMPO_SABANA) {
        valor = (unidadesDe(vista, j).length - unidadesDe(vista, contrario).length) * IA.pesoHabitat;
      }
      if (r === RASGO.CAMPO_BOSQUE) {
        valor = unidadesDe(vista, j).filter((u) => carta(u.cardId).clado === CLADO.SAUROPODO).length * 0.8;
      }
      if (r === RASGO.CAMPO_ARIDEZ) {
        valor = (mazoDe(vista, contrario) - mazoDe(vista, j)) * 0.4;
      }
      if (r === RASGO.CAMPO_CANAL) {
        valor = unidadesDe(vista, j).filter((u) => carta(u.cardId).rasgo === RASGO.RIBERENO).length * BALANCE.rasgos.riberenoAtaque * IA.pesoDano;
      }
      return valor * IA.horizonte - carta(cardId).coste * IA.pesoCoste;
    }
    default:
      return 0;
  }
}
function peorCartaDeMano(vista, j) {
  const mano = vista.jugadores[j].mano;
  const opciones = legales(vista, j);
  let peor = mano[0];
  let peorValor = Infinity;
  for (const iid of mano) {
    const suyas = opciones.filter((a) => a.iid === iid && a.tipo !== ACCION.PASAR && a.tipo !== ACCION.DESCARTAR);
    const c = carta(vista.instancias[iid].cardId);
    const valor = suyas.length > 0 ? Math.max(...suyas.map((a) => valorDeAccion(vista, j, a))) : (c.tipo === TIPO.DINOSAURIO ? c.ataque + c.vida : 2) - c.coste;
    if (valor < peorValor) {
      peorValor = valor;
      peor = iid;
    }
  }
  return peor;
}
function manoImpagable(vista, j) {
  return !vista.jugadores[j].mano.some((iid) => carta(vista.instancias[iid].cardId).coste <= 2);
}
function decidir(vista, j, rng, perfil = PERFIL.HEURISTICA) {
  const opciones = legales(vista, j);
  if (opciones.length === 0) return { rng, accion: null };
  if (perfil === PERFIL.ALEATORIA) {
    const e = elegir(rng, opciones);
    return { rng: e.rng, accion: e.valor };
  }
  if (vista.fase === FASE.DESCARTE) {
    return { rng, accion: { tipo: ACCION.DESCARTAR, jugador: j, iid: peorCartaDeMano(vista, j) } };
  }
  const cambiar = opciones.find((a) => a.tipo === ACCION.MULLIGAN);
  if (cambiar && manoImpagable(vista, j)) return { rng, accion: cambiar };
  let mejor = null;
  let mejorValor = IA.umbralJugar;
  for (const a of opciones) {
    if (a.tipo === ACCION.PASAR) continue;
    const valor = valorDeAccion(vista, j, a);
    if (valor > mejorValor) {
      mejorValor = valor;
      mejor = a;
    }
  }
  return { rng, accion: mejor ?? { tipo: ACCION.PASAR, jugador: j } };
}

// src/data/tribu.js
var CUENCA = Object.freeze({
  // ------------------------------------------------------------- yacimiento
  // Producción por hora del yacimiento a nivel 1, y cuánto sube por nivel.
  // El depósito es la pieza de diseño, no el ritmo: sin tope, quien entra una
  // vez por semana rinde igual que quien entra a diario y el bucle largo no
  // existe; con un tope de dos horas, el juego pide estar encima.
  //
  // 14 horas de depósito pide pasar una vez al día y no castiga dormir.
  fosilesPorHora: 12,
  fosilesPorHoraPorNivel: 6,
  horasDeDeposito: 14,
  // Subir el yacimiento se paga con los mismos fósiles que se aportan a la
  // tribu. Ésa es toda la tensión del recurso: ayudar hoy o producir más
  // mañana. Si la mejora se pagara con monedas no habría decisión ninguna.
  costeMejora: (nivel2) => 300 * nivel2 * nivel2,
  nivelMaximo: 8,
  // ------------------------------------------------------------------ tribu
  miembrosMaximo: 8,
  // ------------------------------------------------------------------ jefes
  // Un asalto cuesta del almacén COMÚN: la tribu decide cuántos se puede
  // permitir, y ésa es su única decisión colectiva de verdad.
  costeAsalto: 150,
  // Tope por persona y día. Es lo que impide que uno solo haga el trabajo de
  // ocho y los demás miren.
  asaltosPorDia: 5,
  // Aportación mínima para que un jefe caído te dé su carta. Baja a propósito:
  // el premio es por participar, no por rematar. Si fuera para quien da el
  // último golpe, la tribu serían ocho personas esperando a rematar.
  danoParaRecompensa: 1
});
var HORA = 36e5;
var DIA = 24 * HORA;
function danoDeAsalto({ danoAlHabitat: danoAlHabitat2 = 0, trofeos = 0, ganada = false }) {
  const base = Math.max(0, Math.round(danoAlHabitat2)) + Math.max(0, trofeos) * 8;
  return ganada ? Math.round(base * 1.5) : base;
}
var habitatDeAsalto = () => BALANCE.vidaHabitat * 3;

// src/data/eventos.js
var TIPO_EVENTO = Object.freeze({
  JEFE: "JEFE",
  // aparece un jefe durante unos días
  CLIMA: "CLIMA"
  // una regla cambia para toda la cuenca
});
var JEFES = Object.freeze({
  saurophaganax: Object.freeze({
    id: "saurophaganax",
    nombre: "Saurophaganax maximus",
    titulo: "El due\xF1o de la llanura",
    vidaMaxima: 6e3,
    recompensa: "jefe_saurophaganax",
    // El mazo que lleva en la partida de asalto. Temático: la Morrison entera
    // defendiendo a su depredador tope.
    mazo: Object.freeze([
      ["allosaurus", 2],
      ["torvosaurus", 1],
      ["ceratosaurus", 3],
      ["ornitholestes", 3],
      ["tyrannotitan", 1],
      ["riparovenator", 2],
      ["carnotaurus", 2],
      ["dromaeosaurus", 3],
      ["stegosaurus", 2],
      ["nodosaurus", 3],
      ["camarasaurus", 2],
      ["diplodocus", 1],
      ["apatosaurus", 1],
      ["dryosaurus", 3],
      ["brachylophosaurus", 3],
      ["gregarismo", 3],
      ["trampa", 3],
      ["rebrote", 3],
      ["gastrolitos", 2],
      ["fractura", 2],
      ["mortandad", 1],
      ["aridez", 1],
      ["crecimiento_acelerado", 1],
      ["competencia", 1],
      ["neumaticidad", 1]
    ]),
    nota: "Cazarlo no es ganarle una partida: es desgastarlo entre todos."
  }),
  barosaurus: Object.freeze({
    id: "barosaurus",
    nombre: "Barosaurus lentus",
    titulo: "La manada que no se acaba",
    vidaMaxima: 5e3,
    recompensa: "jefe_barosaurus",
    mazo: Object.freeze([
      ["camarasaurus", 2],
      ["diplodocus", 1],
      ["apatosaurus", 1],
      ["athenar", 3],
      ["atlasaurus", 2],
      ["antarctosaurus", 1],
      ["plateosauravus", 3],
      ["stegosaurus", 2],
      ["nodosaurus", 3],
      ["loricatosaurus", 2],
      ["invictarx", 3],
      ["dryosaurus", 3],
      ["maiasaura", 2],
      ["edmontosaurus", 1],
      ["brachylophosaurus", 3],
      ["gregarismo", 3],
      ["rebrote", 3],
      ["gastrolitos", 2],
      ["fractura", 2],
      ["canal", 1],
      ["sabana", 1],
      ["bosque", 1],
      ["neumaticidad", 1],
      ["competencia", 1],
      ["crecimiento_acelerado", 1],
      ["shuangmiaosaurus", 2]
    ]),
    nota: "No pega fuerte. Aguanta, que es peor."
  })
});
var CALENDARIO = Object.freeze([
  Object.freeze({
    id: "caza_saurophaganax",
    tipo: TIPO_EVENTO.JEFE,
    jefe: "saurophaganax",
    dia: 0,
    dura: 5,
    titulo: "La caza del Saurophaganax",
    texto: "Cinco d\xEDas para desgastar al mayor ter\xF3podo de la Morrison. Todo el que le haga da\xF1o se lleva su carta, d\xE9 o no el \xFAltimo golpe."
  }),
  Object.freeze({
    id: "sequia_cuenca",
    tipo: TIPO_EVENTO.CLIMA,
    clima: "aridez",
    dia: 5,
    dura: 2,
    titulo: "La cuenca se seca",
    texto: "Dos d\xEDas de aridez sobre toda la cuenca: los mazos se muelen m\xE1s deprisa y las partidas se acortan."
  }),
  Object.freeze({
    id: "manada_barosaurus",
    tipo: TIPO_EVENTO.JEFE,
    jefe: "barosaurus",
    dia: 7,
    dura: 5,
    titulo: "La manada de Barosaurus",
    texto: "No pega fuerte: aguanta. Cinco d\xEDas contra la paciencia hecha saur\xF3podo."
  }),
  Object.freeze({
    id: "crecida_cuenca",
    tipo: TIPO_EVENTO.CLIMA,
    clima: "canal",
    dia: 12,
    dura: 2,
    titulo: "Crecida del canal",
    texto: "El r\xEDo se desborda: mientras dure, todo el mundo pelea en la llanura de inundaci\xF3n."
  })
]);
var CICLO = CALENDARIO.reduce((n, e) => Math.max(n, e.dia + e.dura), 0);

// supabase/functions/_compartido/validarPartida.js
var LIMITES = Object.freeze({
  acciones: 4e3,
  // una partida normal no pasa de unos cientos
  pasosPorFase: 200
  // el mismo tope que usa el simulador
});
var PartidaInvalida = class extends Error {
  constructor(motivo, detalle = null) {
    super(motivo);
    this.name = "PartidaInvalida";
    this.detalle = detalle;
  }
};
function validarMazoLegal(mazo) {
  if (!Array.isArray(mazo) || mazo.length === 0) throw new PartidaInvalida("mazo ausente");
  let total = 0;
  for (const entrada of mazo) {
    if (!Array.isArray(entrada) || entrada.length !== 2) throw new PartidaInvalida("mazo mal formado");
    const [cardId, copias] = entrada;
    if (typeof cardId !== "string" || !existeCarta(cardId)) {
      throw new PartidaInvalida("carta desconocida", cardId);
    }
    if (!Number.isInteger(copias) || copias <= 0) throw new PartidaInvalida("copias inv\xE1lidas", cardId);
    const tope = BALANCE.copiasPorRareza[carta(cardId).rareza];
    if (copias > tope) throw new PartidaInvalida("copias por encima de la rareza", cardId);
    total += copias;
  }
  if (total !== BALANCE.tamanoMazo) {
    throw new PartidaInvalida("el mazo no suma las cartas exactas", total);
  }
  return true;
}
function perfilValido(nombre, porDefecto = PERFIL.HEURISTICA) {
  if (nombre === void 0 || nombre === null) return porDefecto;
  const conocidos = Object.values(PERFIL);
  if (!conocidos.includes(nombre)) throw new PartidaInvalida("perfil de IA desconocido", nombre);
  return nombre;
}
function validarPartida(envio, opciones = {}) {
  if (!envio || typeof envio !== "object") throw new PartidaInvalida("env\xEDo vac\xEDo");
  const { semilla: seed, mazo, acciones } = envio;
  const { mazoRival = null, habitatRival = null, perfil = PERFIL.HEURISTICA } = opciones;
  if (!Number.isInteger(seed)) throw new PartidaInvalida("semilla inv\xE1lida");
  if (!Array.isArray(acciones)) throw new PartidaInvalida("faltan las jugadas");
  if (acciones.length > LIMITES.acciones) {
    throw new PartidaInvalida("demasiadas jugadas", acciones.length);
  }
  validarMazoLegal(mazo);
  let s = crearPartida(seed, [mazo, mazoRival]);
  const habitatInicial = habitatRival ?? s.jugadores[1].habitat;
  s.jugadores[1].habitat = habitatInicial;
  let rngIA = semilla(seed ^ 1542469173);
  const pendientes = acciones.slice();
  const siguienteDelJugador = (estado) => {
    if (pendientes.length) return pendientes.shift();
    if (estado.fase === FASE.DESCARTE) {
      throw new PartidaInvalida("faltan jugadas: la partida no llega al final");
    }
    return { tipo: ACCION.PASAR, jugador: 0 };
  };
  while (s.fase !== FASE.FIN) {
    if (s.fase === FASE.DESPLIEGUE || s.fase === FASE.DESCARTE) {
      const faseInicial = s.fase;
      let pasos = 0;
      while (s.fase === faseInicial) {
        let actuo = false;
        let tuyas = 0;
        while (s.fase === faseInicial && legales(s, 0).length > 0) {
          const a = { ...siguienteDelJugador(s), jugador: 0 };
          const motivo = validar(s, a);
          if (motivo) throw new PartidaInvalida("jugada ilegal", { accion: a.tipo, motivo });
          s = reduce(s, a);
          actuo = true;
          if (a.tipo === ACCION.PASAR || a.tipo === ACCION.DESCARTAR) break;
          if (++tuyas > LIMITES.pasosPorFase) throw new PartidaInvalida("la fase no converge");
        }
        let suyas = 0;
        while (s.fase === faseInicial && legales(s, 1).length > 0) {
          const d = decidir(vistaDe(s, 1), 1, rngIA, perfil);
          rngIA = d.rng;
          if (!d.accion) break;
          s = reduce(s, d.accion);
          actuo = true;
          if (d.accion.tipo === ACCION.PASAR || d.accion.tipo === ACCION.DESCARTAR) break;
          if (++suyas > LIMITES.pasosPorFase) throw new PartidaInvalida("la fase no converge");
        }
        if (!actuo) break;
        if (++pasos > LIMITES.pasosPorFase) throw new PartidaInvalida("la fase no converge");
      }
      if (s.fase === faseInicial) throw new PartidaInvalida("la fase se qued\xF3 bloqueada");
      continue;
    }
    s = reduce(s, { tipo: ACCION.AVANZAR });
  }
  return {
    ganada: s.ganador === 0,
    danoAlHabitat: habitatInicial - Math.max(0, s.jugadores[1].habitat),
    trofeos: s.jugadores[0].trofeos,
    turnos: s.turno,
    motivoFin: s.motivoFin
  };
}

// supabase/functions/_compartido/validarAsalto.js
var AsaltoInvalido = PartidaInvalida;
function jefeDelEvento(eventoId) {
  const evento2 = CALENDARIO.find((e) => e.id === eventoId && e.tipo === TIPO_EVENTO.JEFE);
  if (!evento2) throw new AsaltoInvalido("ese evento no es una caza", eventoId);
  const jefe = JEFES[evento2.jefe];
  if (!jefe) throw new AsaltoInvalido("jefe inexistente", evento2.jefe);
  return { evento: evento2, jefe };
}
function validarAsalto(envio) {
  if (!envio || typeof envio !== "object") throw new AsaltoInvalido("env\xEDo vac\xEDo");
  const { jefe } = jefeDelEvento(envio.jefeEvento);
  const r = validarPartida(envio, {
    mazoRival: jefe.mazo.map((e) => [...e]),
    habitatRival: habitatDeAsalto(),
    perfil: PERFIL.HEURISTICA
  });
  return { ...r, dano: danoDeAsalto(r) };
}

// src/data/coleccion.js
var TAM_MAZO = BALANCE.tamanoMazo;
var limiteDe = (cardId) => BALANCE.copiasPorRareza[carta(cardId).rareza];
var ECONOMIA = Object.freeze({
  // Un sobre son cinco cartas. El precio está por encima de lo que devuelve
  // fundirlo entero (unas 77 monedas, que lo comprueba un test), porque si no
  // el bucle se alimenta solo y abrir sobres deja de ser una decisión.
  precioSobre: 100,
  cartasPorSobre: 5,
  // Las monedas salen de GANAR, no de jugar y tampoco de fundir. Fundir sólo
  // recicla lo que ya no te cabe en ningún mazo.
  //
  // Perder no paga: dos victorias son un sobre y una derrota no es medio paso
  // hacia él. El precio de eso es que quien no gana nunca se queda con los dos
  // sobres de salida y su colección inicial, que es un mazo legal y completo
  // —jugar nunca se bloquea—, pero la colección deja de crecer sola.
  monedasInicio: 240,
  monedasVictoria: 50,
  monedasDerrota: 0,
  // Tope de victorias PAGADAS al día. No es una regla de juego —jugar no se
  // limita— sino una cota al abuso: el servidor re-juega cada partida que cobra
  // y eso cuesta CPU, así que un cliente hostil no puede pedir mil.
  victoriasPorDia: 50,
  fusion: Object.freeze({
    [RAREZA.COMUN]: 4,
    [RAREZA.RARO]: 12,
    [RAREZA.EPICO]: 35,
    [RAREZA.LEGENDARIO]: 100
  })
});
var GARANTIA = RAREZA.RARO;
var ESCALA = Object.freeze([RAREZA.COMUN, RAREZA.RARO, RAREZA.EPICO, RAREZA.LEGENDARIO]);
var nivel = (rareza) => ESCALA.indexOf(rareza);
var POR_RAREZA = Object.freeze(Object.fromEntries(
  ESCALA.map((r) => [r, Object.freeze(Object.values(CARTAS).filter((c) => c.rareza === r).map((c) => c.id))])
));
var CUOTA = Object.freeze(Object.fromEntries(
  ESCALA.map((r) => [r, POR_RAREZA[r].length * BALANCE.copiasPorRareza[r]])
));
var COLECCION_COMPLETA = ESCALA.reduce((n, r) => n + CUOTA[r], 0);
var PESO = Object.freeze({
  [RAREZA.COMUN]: 8,
  [RAREZA.RARO]: 4,
  [RAREZA.EPICO]: 2,
  [RAREZA.LEGENDARIO]: 1
});
var PROBABILIDAD = Object.freeze((() => {
  const bruto = ESCALA.map((r) => POR_RAREZA[r].length * PESO[r]);
  const total = bruto.reduce((a, b) => a + b, 0);
  return Object.fromEntries(ESCALA.map((r, i) => [r, bruto[i] / total]));
})());
function rarezaAlAzar(azar, minima = RAREZA.COMUN) {
  const desde = nivel(minima);
  const candidatas = ESCALA.slice(desde);
  const total = candidatas.reduce((n, r) => n + PROBABILIDAD[r], 0);
  let t = azar() * total;
  for (const r of candidatas) {
    t -= PROBABILIDAD[r];
    if (t < 0) return r;
  }
  return candidatas[candidatas.length - 1];
}
function abrirSobre(azar, tengo = null) {
  const salida = [];
  const cuenta = tengo ? { ...tengo } : null;
  for (let i = 0; i < ECONOMIA.cartasPorSobre; i++) {
    const ultima = i === ECONOMIA.cartasPorSobre - 1;
    const cumplida = salida.some((id2) => nivel(carta(id2).rareza) >= nivel(GARANTIA));
    const r = rarezaAlAzar(azar, ultima && !cumplida ? GARANTIA : RAREZA.COMUN);
    let pool = POR_RAREZA[r];
    if (cuenta) {
      const faltan = pool.filter((id2) => (cuenta[id2] ?? 0) < limiteDe(id2));
      if (faltan.length) pool = faltan;
      else {
        const sinRepetir = pool.filter((id2) => !salida.includes(id2));
        if (sinRepetir.length) pool = sinRepetir;
      }
    }
    const id = pool[Math.min(pool.length - 1, Math.floor(azar() * pool.length))];
    if (cuenta) cuenta[id] = (cuenta[id] ?? 0) + 1;
    salida.push(id);
  }
  return salida;
}

// supabase/functions/_compartido/validarSolitario.js
function validarSolitario(envio) {
  const r = validarPartida(envio, {
    // null es el mazo de referencia. Es lo que hace `crearPartida` en el
    // navegador cuando la partida no es un asalto, así que reproducirlo es
    // literalmente no pasarle nada.
    mazoRival: null,
    habitatRival: null,
    perfil: perfilValido(envio.perfil)
  });
  return {
    ...r,
    premio: r.ganada ? ECONOMIA.monedasVictoria : ECONOMIA.monedasDerrota
  };
}

// supabase/functions/asalto/index.ts
var cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
var json = (cuerpo, status = 200) => new Response(
  JSON.stringify(cuerpo),
  { status, headers: { ...cors, "Content-Type": "application/json" } }
);
var aObjeto = (mazo) => Object.fromEntries(
  Array.isArray(mazo) ? mazo : []
);
async function enUnDia(servicio, tabla, jugador, columna) {
  const desde = new Date(Date.now() - 24 * 36e5).toISOString();
  const { count } = await servicio.from(tabla).select("id", { count: "exact", head: true }).eq("jugador_id", jugador).gte(columna, desde);
  return count ?? 0;
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "s\xF3lo POST" }, 405);
  const auth = req.headers.get("Authorization");
  if (!auth) return json({ error: "sin sesi\xF3n" }, 401);
  const comoUsuario = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_ANON_KEY"),
    { global: { headers: { Authorization: auth } } }
  );
  const { data: { user }, error: errAuth } = await comoUsuario.auth.getUser();
  if (errAuth || !user) return json({ error: "sesi\xF3n inv\xE1lida" }, 401);
  let envio;
  try {
    envio = await req.json();
  } catch {
    return json({ error: "cuerpo ilegible" }, 400);
  }
  const servicio = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );
  const tipo = envio.tipo ?? "asalto";
  try {
    if (tipo === "asalto") return await hacerAsalto(servicio, user.id, envio);
    if (tipo === "victoria") return await hacerVictoria(servicio, user.id, envio);
    if (tipo === "sobre") return await hacerSobre(servicio, user.id);
    return json({ error: `no s\xE9 hacer \xAB${tipo}\xBB` }, 400);
  } catch (e) {
    if (e instanceof AsaltoInvalido) {
      return json({ error: e.message, detalle: e.detalle }, 422);
    }
    throw e;
  }
});
async function hacerAsalto(servicio, jugadorId, envio) {
  const resultado = validarAsalto(envio);
  const { evento: evento2 } = jefeDelEvento(envio.jefeEvento);
  const { data: jugador } = await servicio.from("jugadores").select("tribu_id").eq("id", jugadorId).single();
  if (!jugador?.tribu_id) return json({ error: "no est\xE1s en ninguna tribu" }, 409);
  const { error: errMazo } = await servicio.rpc("validar_mazo_de", {
    p_jugador: jugadorId,
    p_cartas: aObjeto(envio.mazo)
  });
  if (errMazo) return json({ error: errMazo.message }, 422);
  if (await enUnDia(servicio, "asaltos", jugadorId, "jugado_en") >= CUENCA.asaltosPorDia) {
    return json({ error: "ya has hecho tus asaltos de hoy" }, 429);
  }
  const { data, error } = await servicio.rpc("aplicar_asalto", {
    p_tribu: jugador.tribu_id,
    p_evento: evento2.id,
    p_jugador: jugadorId,
    p_semilla: envio.semilla,
    p_dano: resultado.dano,
    p_turnos: resultado.turnos,
    p_ganada: resultado.ganada,
    p_coste: CUENCA.costeAsalto
  });
  if (error) {
    const yaCobrada = error.code === "23505";
    return json(
      { error: yaCobrada ? "ese asalto ya se cobr\xF3" : error.message },
      yaCobrada ? 409 : 400
    );
  }
  const fila = Array.isArray(data) ? data[0] : data;
  return json({
    dano: resultado.dano,
    turnos: resultado.turnos,
    ganada: resultado.ganada,
    vida: fila?.vida ?? null,
    cayo: fila?.cayo ?? false,
    almacen: fila?.almacen ?? null
  });
}
async function hacerVictoria(servicio, jugadorId, envio) {
  const resultado = validarSolitario(envio);
  const { error: errMazo } = await servicio.rpc("validar_mazo_de", {
    p_jugador: jugadorId,
    p_cartas: aObjeto(envio.mazo)
  });
  if (errMazo) return json({ error: errMazo.message }, 422);
  if (await enUnDia(servicio, "partidas", jugadorId, "jugado_en") >= ECONOMIA.victoriasPorDia) {
    return json({ error: "ya has cobrado tus partidas de hoy" }, 429);
  }
  const { data, error } = await servicio.rpc("aplicar_partida", {
    p_jugador: jugadorId,
    p_semilla: envio.semilla,
    p_turnos: resultado.turnos,
    p_ganada: resultado.ganada,
    p_monedas: resultado.premio
  });
  if (error) {
    const yaCobrada = error.code === "23505";
    return json(
      { error: yaCobrada ? "esa partida ya se cobr\xF3" : error.message },
      yaCobrada ? 409 : 400
    );
  }
  return json({
    ganada: resultado.ganada,
    turnos: resultado.turnos,
    premio: data?.premio ?? 0,
    monedas: data?.monedas ?? null
  });
}
async function hacerSobre(servicio, jugadorId) {
  const { data: filas, error: errCol } = await servicio.from("coleccion").select("card_id, copias").eq("jugador_id", jugadorId);
  if (errCol) return json({ error: errCol.message }, 400);
  const tengo = Object.fromEntries((filas ?? []).map((f) => [f.card_id, f.copias]));
  const azar = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
  const cartas = abrirSobre(azar, tengo);
  const { data, error } = await servicio.rpc("aplicar_sobre", {
    p_jugador: jugadorId,
    p_cartas: cartas
  });
  if (error) return json({ error: error.message }, 409);
  return json({ cartas, monedas: data?.monedas ?? null, precio: ECONOMIA.precioSobre });
}
