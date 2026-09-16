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
// huella: 2635715c01ba5177
//
// Lleva dentro estos 24 ficheros del repositorio. La lista la da
// esbuild, no una suposición mía: si mañana la función importa un módulo más,
// aparece aquí solo. Un test recalcula la huella sobre esta misma lista y falla
// si el paquete se ha quedado atrás del código.
// fuente: src/data/mecanicas.js
// fuente: src/data/cards.js
// fuente: src/data/balance.js
// fuente: src/engine/rng.js
// fuente: src/engine/state.js
// fuente: src/engine/entradas.js
// fuente: src/data/dietas.js
// fuente: src/engine/economia.js
// fuente: src/engine/resolve.js
// fuente: src/engine/actions.js
// fuente: src/engine/ai.js
// fuente: src/data/tribu.js
// fuente: src/data/eventos.js
// fuente: src/data/coleccion.js
// fuente: src/data/misiones.js
// fuente: supabase/functions/_compartido/validarPartida.js
// fuente: supabase/functions/_compartido/validarAsalto.js
// fuente: src/data/expediciones.js
// fuente: supabase/functions/_compartido/validarSolitario.js
// fuente: src/data/duelo.js
// fuente: supabase/functions/_compartido/duelo.js
// fuente: src/data/ligas.js
// fuente: src/data/logros.js
// fuente: supabase/functions/asalto/index.ts

// supabase/functions/asalto/index.ts
import { createClient } from "jsr:@supabase/supabase-js@2";

// src/data/mecanicas.js
var QUE = Object.freeze({
  /** Otras copias de la MISMA carta. */
  MISMA: "MISMA",
  /** Cualquier carta del mismo clado. */
  CLADO: "CLADO",
  EVENTO: "EVENTO",
  CLIMA: "CLIMA",
  // Las tres ZONAS. Cuentan cartas de un montón y no unidades en el campo, así
  // que no miran `ambos`: la mano del rival es su propio valor, no «las dos
  // manos», y un contador que sumara los dos descartes no querría decir nada.
  // `test/entradas.test.js` exige que una zona no declare `ambos`, que sería
  // un campo puesto y no leído — el fallo silencioso de siempre.
  //
  // Y piden `cada` o `tope` casi siempre: una mano son ocho cartas y un
  // descarte pasa de veinte, así que +1 por carta a pelo no es una carta, es
  // un botón de ganar.
  MANO: "MANO",
  MANO_RIVAL: "MANO_RIVAL",
  DESCARTE: "DESCARTE"
});
var ZONAS = Object.freeze([QUE.MANO, QUE.MANO_RIVAL, QUE.DESCARTE]);
var esZona = (que) => ZONAS.includes(que);
var CUANDO = Object.freeze({
  /** Hay una carta de clima en el campo, la haya puesto quien la haya puesto. */
  CLIMA: "CLIMA",
  /** Tienes en juego alguna criatura con más de `umbral` de Vida. */
  ALIADO_CON_VIDA: "ALIADO_CON_VIDA",
  /**
   * Tu hábitat está por debajo del de tu rival. Es la única condición del set
   * que premia ir perdiendo, y está aquí a propósito: la bola de nieve —quien
   * va por delante en el turno 5 gana el 70 % de las veces— es el problema de
   * balance abierto más viejo del proyecto.
   */
  HABITAT_DETRAS: "HABITAT_DETRAS"
});
var INMUNE = Object.freeze({
  CLIMA: "CLIMA",
  EVENTO: "EVENTO"
});
var TODOS = "TODOS";

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
  // Las búsquedas en el mazo y los disparos al entrar en juego ESTUVIERON aquí,
  // como nueve etiquetas más de este enum. Se fueron a `mecanica` —el campo de
  // datos de cada criatura, descrito en mecanicas.js— porque el mismo efecto
  // sale con números distintos en cada carta y una etiqueta no lleva número:
  // hacían falta nueve constantes de balance para seis cartas.
  //
  // Lo que queda aquí es lo de las 16 cartas de SOPORTE, que son dieciséis
  // reglas distintas y ninguna se repite. Ésas sí son un enum.
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
  // Los cinco biomas que fueron clima, ya como eventos, y un nido.
  SABANA_HELECHOS: "SABANA_HELECHOS",
  INUNDACION: "INUNDACION",
  CANAL_TRENZADO: "CANAL_TRENZADO",
  BOSQUE_RIBERENO: "BOSQUE_RIBERENO",
  DERIVA_ARIDA: "DERIVA_ARIDA",
  NIDO: "NIDO",
  // La ronda del control: cinco que no tocan una cifra del campo, sólo manos,
  // descartes y mazos.
  TORMENTA_POLVO: "TORMENTA_POLVO",
  AVENIDA_LODO: "AVENIDA_LODO",
  ENTERRAMIENTO: "ENTERRAMIENTO",
  CAUCE_ABANDONADO: "CAUCE_ABANDONADO",
  BARRERA_TRONCOS: "BARRERA_TRONCOS",
  // pulsos
  REBROTE: "REBROTE",
  CARRONA: "CARRONA",
  LAGO: "LAGO",
  INSECTOS: "INSECTOS",
  MANADA_PASO: "MANADA_PASO",
  FRUTOS: "FRUTOS",
  // biomasa
  BIOMASA: "BIOMASA",
  // campo
  CAMPO_LLANURA: "CAMPO_LLANURA",
  CAMPO_CANAL: "CAMPO_CANAL",
  CAMPO_BOSQUE: "CAMPO_BOSQUE",
  CAMPO_SABANA: "CAMPO_SABANA",
  CAMPO_ARIDEZ: "CAMPO_ARIDEZ"
});
var dino = (o) => Object.freeze({ tipo: TIPO.DINOSAURIO, ...o });
var evento = (o) => Object.freeze({ tipo: TIPO.EVENTO, ataque: 0, vida: 0, ...o });
var clima = (o) => Object.freeze({ tipo: TIPO.CLIMA, ataque: 0, vida: 0, coste: 2, ...o });
var recurso = (o) => Object.freeze({ tipo: TIPO.RECURSO, objetivo: OBJETIVO.NINGUNO, ataque: 0, vida: 0, coste: 0, ...o });
var biomasa = (o) => Object.freeze({ tipo: TIPO.BIOMASA, dieta: "HERBIVORO", objetivo: OBJETIVO.NINGUNO, ataque: 0, vida: 0, coste: 0, rasgo: RASGO.BIOMASA, ...o });
var CARTAS = Object.freeze({
  // ------------------------------------------------------------ dinosaurios
  dryosaurus: dino({
    id: "dryosaurus",
    rareza: RAREZA.COMUN,
    clado: CLADO.ORNITOPODO,
    binomial: "Dryosaurus altus",
    coste: 0,
    ataque: 1,
    vida: 2,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Bandada nerviosa",
    rasgoTexto: "Gana +1 de Ataque por cada Dryosaurus en juego, sea de quien sea y este incluido.",
    mecanica: Object.freeze({ cuenta: { que: QUE.MISMA, ambos: true, ataque: 1 } }),
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
    vida: 2,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Salto de entrada",
    rasgoTexto: "Cuando entra en juego hiere en 2 al dinosaurio de enfrente.",
    mecanica: Object.freeze({ entrada: { emboscada: 2 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Ter\xF3podo peque\xF1o (~2 m). El comportamiento carro\xF1ero es una inferencia a partir de talla y analog\xEDa ecol\xF3gica, no de evidencia directa."
  }),
  ceratosaurus: dino({
    id: "ceratosaurus",
    rareza: RAREZA.COMUN,
    clado: CLADO.TEROPODO,
    binomial: "Ceratosaurus nasicornis",
    coste: 2,
    ataque: 4,
    vida: 2,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Ayuno del cazador",
    rasgoTexto: "Cuando entra en juego descarta 2 cartas de tu mazo.",
    mecanica: Object.freeze({ entrada: { muelePropio: 2 } }),
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
    vida: 5,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Muro de placas",
    rasgoTexto: "Gana +1 de Ataque por cada Stegosaurus que tengas en juego, este incluido.",
    mecanica: Object.freeze({ cuenta: { que: QUE.MISMA, ambos: false, ataque: 1 } }),
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
    vida: 5,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Zarpazo por sorpresa",
    rasgoTexto: "Cuando entra en juego descarta 1 carta al azar de la mano de tu rival.",
    mecanica: Object.freeze({ entrada: { manoRival: 1 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Tax\xF3n de ter\xF3podo m\xE1s abundante de la Morrison. Marcas de mordida atribuidas a Allosaurus aparecen en huesos de saur\xF3podos y de Stegosaurus."
  }),
  camarasaurus: dino({
    id: "camarasaurus",
    rareza: RAREZA.RARO,
    clado: CLADO.SAUROPODO,
    binomial: "Camarasaurus grandis",
    coste: 3,
    ataque: 1,
    vida: 8,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Rumia",
    rasgoTexto: "Al final de tu turno recupera 1 de Vida.",
    mecanica: Object.freeze({ regenera: { propia: 1 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "An\xE1lisis isot\xF3picos de esmalte dental sugieren desplazamientos estacionales hacia tierras altas durante la estaci\xF3n seca, a diferencia de otros saur\xF3podos de la misma formaci\xF3n. El rasgo Migrador refleja ese resultado."
  }),
  diplodocus: dino({
    id: "diplodocus",
    rareza: RAREZA.RARO,
    clado: CLADO.SAUROPODO,
    binomial: "Diplodocus carnegii",
    coste: 2,
    ataque: 3,
    vida: 8,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Pisa y abona",
    rasgoTexto: "Cuando entra en juego tu h\xE1bitat recupera 1 punto.",
    mecanica: Object.freeze({ entrada: { curaHabitat: 1 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "El desgaste dental y la postura del cuello sustentan una partici\xF3n de nicho por ramoneo bajo respecto de otros saur\xF3podos coexistentes."
  }),
  apatosaurus: dino({
    id: "apatosaurus",
    rareza: RAREZA.RARO,
    clado: CLADO.SAUROPODO,
    binomial: "Apatosaurus louisae",
    coste: 3,
    ataque: 2,
    vida: 10,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Pisa y abona",
    rasgoTexto: "Cuando entra en juego tu h\xE1bitat recupera 1 punto.",
    mecanica: Object.freeze({ entrada: { curaHabitat: 1 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "La talla adulta de los diplod\xF3cidos es en s\xED misma la principal defensa antipredatoria. Nota: la validez de Brontosaurus como g\xE9nero separado sigue en discusi\xF3n; el juego usa Apatosaurus."
  }),
  torvosaurus: dino({
    id: "torvosaurus",
    rareza: RAREZA.EPICO,
    clado: CLADO.TEROPODO,
    binomial: "Torvosaurus tanneri",
    coste: 4,
    ataque: 8,
    vida: 5,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Indiferente al cielo",
    rasgoTexto: "No le afectan los efectos del clima.",
    mecanica: Object.freeze({ inmune: INMUNE.CLIMA }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "El ter\xF3podo de mayor tama\xF1o de la formaci\xF3n, pero genuinamente raro en el registro. Su escasez en el mazo replica su escasez f\xF3sil."
  }),
  // --------------------------------- fuera de la Morrison (ver README, §fauna)
  nodosaurus: dino({
    id: "nodosaurus",
    rareza: RAREZA.EPICO,
    clado: CLADO.TIREOFORO,
    binomial: "Nodosaurus textilis",
    coste: 3,
    ataque: 3,
    vida: 8,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Indiferente al cielo",
    rasgoTexto: "No le afectan los efectos del clima.",
    mecanica: Object.freeze({ inmune: INMUNE.CLIMA }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Formaci\xF3n Frontier, Wyoming, Cenomaniense (~100 Ma). Los osteodermos en bandas sobre el dorso est\xE1n documentados directamente. El tax\xF3n en s\xED es material fragmentario y varios autores lo tratan como nomen dubium: la coraza es firme, la especie lo es menos."
  }),
  riparovenator: dino({
    id: "riparovenator",
    rareza: RAREZA.EPICO,
    clado: CLADO.TEROPODO,
    binomial: "Riparovenator milnerae",
    coste: 3,
    ataque: 3,
    vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Fuera del alcance",
    rasgoTexto: "No le afectan las cartas de evento de tu rival.",
    mecanica: Object.freeze({ inmune: INMUNE.EVENTO }),
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
    vida: 7,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Fuera del alcance",
    rasgoTexto: "No le afectan las cartas de evento de tu rival.",
    mecanica: Object.freeze({ inmune: INMUNE.EVENTO }),
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: "Formaci\xF3n Judith River, Montana, Campaniense (~78 Ma), descrito en 2024. La gola lleva las mayores hojas \xF3seas conocidas en un cerat\xF3psido, asim\xE9tricas entre lados. Si serv\xEDan para defensa, para exhibici\xF3n o para reconocerse entre especies es justamente lo que se discute."
  }),
  brachylophosaurus: dino({
    id: "brachylophosaurus",
    rareza: RAREZA.RARO,
    clado: CLADO.ORNITOPODO,
    binomial: "Brachylophosaurus canadensis",
    coste: 2,
    ataque: 0,
    vida: 10,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Reba\xF1o de tres",
    rasgoTexto: "Si llegas a tener 3 Brachylophosaurus en juego, \xE9ste gana +6 de Ataque para siempre.",
    mecanica: Object.freeze({ trio: { copias: 3, ataque: 6 } }),
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
    vida: 7,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Tijera",
    rasgoTexto: "Cuando entra en juego manda al descarte 1 dinosaurio rival de hasta 4 de Vida.",
    mecanica: Object.freeze({ entrada: { fulmina: 4 } }),
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
    vida: 4,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Vuelo de reconocimiento",
    rasgoTexto: "Cuando entra en juego robas 1 carta.",
    mecanica: Object.freeze({ entrada: { roba: 1 } }),
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
    rasgoTexto: "\u22122 de Vida a dos dinosaurios rivales que elijas.",
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
  // ------------------------- eventos: los biomas que fueron clima, y un nido
  sabana_helechos: evento({
    id: "sabana_helechos",
    rareza: RAREZA.COMUN,
    binomial: "Sabana de helechos",
    coste: 0,
    objetivo: OBJETIVO.NINGUNO,
    rasgo: RASGO.SABANA_HELECHOS,
    rasgoNombre: "Sabana de helechos",
    rasgoTexto: "Robas 2 cartas. Luego descartas 1 carta de tu mano al azar.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Las llanuras abiertas de la Morrison estaban dominadas por helechos y no por hierba, que no exist\xEDa. Una pradera de helecho es pasto abundante y de poca calidad: se come mucho y aprovecha poco."
  }),
  inundacion: evento({
    id: "inundacion",
    rareza: RAREZA.RARO,
    binomial: "Llanura de inundaci\xF3n",
    coste: 2,
    objetivo: OBJETIVO.NINGUNO,
    rasgo: RASGO.INUNDACION,
    rasgoNombre: "Llanura de inundaci\xF3n",
    rasgoTexto: "Ambos jugadores pierden 3 cartas del mazo. T\xFA robas 1.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Las llanuras de inundaci\xF3n de la Morrison se construyeron crecida a crecida: limo de desbordamiento sobre paleosuelos. Una crecida arrasa a los dos lados del r\xEDo, pero deja el suelo nuevo a quien vuelve primero."
  }),
  canal_trenzado: evento({
    id: "canal_trenzado",
    rareza: RAREZA.RARO,
    binomial: "Canal fluvial trenzado",
    coste: 1,
    objetivo: OBJETIVO.NINGUNO,
    rasgo: RASGO.CANAL_TRENZADO,
    rasgoNombre: "Canal fluvial trenzado",
    rasgoTexto: "Todos tus dinosaurios recuperan 2 de Vida.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Los r\xEDos de la Morrison eran trenzados: canales someros y cambiantes entre barras de arena, con agua todo el a\xF1o en los tramos principales. Donde hay agua permanente hay descanso, bebida y sombra."
  }),
  bosque_ribereno: evento({
    id: "bosque_ribereno",
    rareza: RAREZA.EPICO,
    binomial: "Bosque de con\xEDferas ribere\xF1o",
    coste: 2,
    objetivo: OBJETIVO.NINGUNO,
    rasgo: RASGO.BOSQUE_RIBERENO,
    rasgoNombre: "Bosque de con\xEDferas ribere\xF1o",
    rasgoTexto: "Tu rival descarta 2 cartas de su mano al azar.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Los bosques de galer\xEDa pegados a los r\xEDos son el \xFAnico sitio de la Morrison donde la vegetaci\xF3n cierra la vista. Una manada que se mete en ellos deja de ver venir y pierde el rastro de lo que persegu\xEDa: se infiere de la etolog\xEDa de los grandes herb\xEDvoros actuales."
  }),
  deriva_arida: evento({
    id: "deriva_arida",
    rareza: RAREZA.EPICO,
    binomial: "Deriva \xE1rida",
    coste: 2,
    objetivo: OBJETIVO.NINGUNO,
    rasgo: RASGO.DERIVA_ARIDA,
    rasgoNombre: "Deriva \xE1rida",
    rasgoTexto: "Ambos jugadores descartan la mano entera y roban otras tantas cartas.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "El clima de la Morrison se fue secando a lo largo del Kimmeridgiense y el Titoniense: paleosuelos con caliche, dunas al norte de la cuenca. Cuando el paisaje cambia, lo que cada uno ten\xEDa planeado deja de valer y hay que volver a empezar."
  }),
  nido: evento({
    id: "nido",
    rareza: RAREZA.COMUN,
    binomial: "Nido con huevos",
    coste: 1,
    objetivo: OBJETIVO.NINGUNO,
    rasgo: RASGO.NIDO,
    rasgoNombre: "Nido con huevos",
    rasgoTexto: "Robas 2 cartas.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "La Morrison conserva nidos y huevos de saur\xF3podo y de ter\xF3podo peque\xF1o, y c\xE1scaras dispersas en muchos yacimientos. Un nido es la promesa de lo que viene despu\xE9s."
  }),
  // La ronda del CONTROL. Cinco eventos que no tocan una sola cifra del campo:
  // mueven manos, descartes y mazos. Ninguno señala a nadie, así que todos caen
  // sobre la mesa entera y se anuncian como la Trampa.
  tormenta_polvo: evento({
    id: "tormenta_polvo",
    rareza: RAREZA.RARO,
    binomial: "Tormenta de polvo",
    coste: 2,
    objetivo: OBJETIVO.NINGUNO,
    rasgo: RASGO.TORMENTA_POLVO,
    rasgoNombre: "Tormenta de polvo",
    rasgoTexto: "Los dos jugadores barajan su mano dentro de su mazo y roban 5 cartas.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Los paleosuelos de la Morrison alternan horizontes de caliche con niveles de arena e\xF3lica, y al norte de la cuenca hay campos de dunas: episodios secos con transporte de polvo, repetidos durante millones de a\xF1os."
  }),
  avenida_lodo: evento({
    id: "avenida_lodo",
    rareza: RAREZA.EPICO,
    binomial: "Avenida de lodo",
    coste: 2,
    objetivo: OBJETIVO.NINGUNO,
    rasgo: RASGO.AVENIDA_LODO,
    rasgoNombre: "Avenida de lodo",
    rasgoTexto: "Tu rival descarta cartas al azar hasta quedarse con 3 en la mano.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Los flujos de derrubios dejan dep\xF3sitos masivos, sin clasificar y con bloques flotando en la matriz. Varias de las grandes acumulaciones de huesos del Jur\xE1sico se han interpretado como cad\xE1veres arrastrados y amontonados por una de estas avenidas."
  }),
  enterramiento: evento({
    id: "enterramiento",
    rareza: RAREZA.RARO,
    binomial: "Enterramiento r\xE1pido",
    coste: 2,
    objetivo: OBJETIVO.NINGUNO,
    rasgo: RASGO.ENTERRAMIENTO,
    rasgoNombre: "Enterramiento r\xE1pido",
    rasgoTexto: "Recupera 2 cartas al azar de tu descarte y ll\xE9vatelas a la mano.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Todo yacimiento de conservaci\xF3n excepcional tiene lo mismo detr\xE1s: el cad\xE1ver qued\xF3 cubierto antes de que los carro\xF1eros y las bacterias hicieran su trabajo. Lo que se recupera del registro f\xF3sil es, casi siempre, lo que se enterr\xF3 deprisa."
  }),
  cauce_abandonado: evento({
    id: "cauce_abandonado",
    rareza: RAREZA.COMUN,
    binomial: "Cauce abandonado",
    coste: 1,
    objetivo: OBJETIVO.NINGUNO,
    rasgo: RASGO.CAUCE_ABANDONADO,
    rasgoNombre: "Cauce abandonado",
    rasgoTexto: "Descarta 2 cartas al azar de tu mano y roba 3.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Cuando un meandro se corta por el cuello, el brazo que queda se llena de finos y se convierte en una charca alargada. Los cauces abandonados de la Morrison son de los pocos sitios donde se conservan restos de plantas y de peces."
  }),
  barrera_troncos: evento({
    id: "barrera_troncos",
    rareza: RAREZA.COMUN,
    binomial: "Barrera de troncos",
    coste: 1,
    objetivo: OBJETIVO.NINGUNO,
    rasgo: RASGO.BARRERA_TRONCOS,
    rasgoNombre: "Barrera de troncos",
    rasgoTexto: "Tu rival pierde 4 cartas de su mazo, y 4 m\xE1s si tiene m\xE1s cartas en la mano que t\xFA.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Los atascos de troncos son estructuras corrientes en r\xEDos con orillas arboladas: represan el cauce, lo desv\xEDan y concentran lo que baja con la corriente. En el Jur\xE1sico se infieren de las acumulaciones de le\xF1a f\xF3sil orientadas en los rellenos de canal."
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
  insectos: recurso({
    id: "insectos",
    rareza: RAREZA.COMUN,
    binomial: "Nube de insectos",
    rasgo: RASGO.INSECTOS,
    rasgoNombre: "Nube de insectos",
    rasgoTexto: "+1 Biomasa ahora mismo. Robas 1 carta.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Los humedales de la Morrison sosten\xEDan nubes de insectos: hay coprolitos y \xE1mbar con restos, y los peque\xF1os ter\xF3podos y pterosaurios viv\xEDan de ellos. Comida f\xE1cil, y donde hay insectos hay m\xE1s cosas que encontrar."
  }),
  manada_paso: recurso({
    id: "manada_paso",
    rareza: RAREZA.RARO,
    binomial: "Manada de paso",
    rasgo: RASGO.MANADA_PASO,
    rasgoNombre: "Manada de paso",
    rasgoTexto: "+2 Biomasa ahora mismo. Pierdes 3 cartas de tu mazo.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Los rastros de la Morrison muestran grupos de saur\xF3podos movi\xE9ndose juntos en la misma direcci\xF3n. Una manada que cruza tu territorio deja mucho detr\xE1s, y se lleva por delante lo que hab\xEDa."
  }),
  frutos: recurso({
    id: "frutos",
    rareza: RAREZA.RARO,
    binomial: "Frutos de c\xEDcada",
    rasgo: RASGO.FRUTOS,
    rasgoNombre: "Frutos de c\xEDcada",
    rasgoTexto: "+3 Biomasa ahora mismo. Tu rival roba 1 carta.",
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Las c\xEDcadas y bennettitales producen semillas carnosas y arom\xE1ticas que atraen a quien las dispersa. Una cosecha as\xED no se guarda: la huele todo el mundo."
  }),
  // --------------------------------------------------------------- clima
  llanura: clima({
    id: "llanura",
    coste: 1,
    rareza: RAREZA.EPICO,
    binomial: "Crecida estacional",
    rasgo: RASGO.CAMPO_LLANURA,
    rasgoNombre: "Crecida estacional",
    rasgoTexto: "Mientras est\xE9 en el campo, cada jugador puede cambiar una carta de su mano por otra del mazo, una vez por turno.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "La riada estacional desborda el cauce y revuelve el paisaje: lo que hab\xEDa en un sitio aparece en otro."
  }),
  canal: clima({
    id: "canal",
    coste: 1,
    rareza: RAREZA.LEGENDARIO,
    binomial: "Bruma de valle",
    rasgo: RASGO.CAMPO_CANAL,
    rasgoNombre: "Bruma de valle",
    rasgoTexto: "+1 de Vida a todos los dinosaurios del campo, mientras siga en el campo.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Niebla de radiaci\xF3n en los fondos de valle al amanecer. Baja el estr\xE9s t\xE9rmico de todo lo que respira, y en un clima estacionalmente seco eso es aguante."
  }),
  bosque: clima({
    id: "bosque",
    coste: 1,
    rareza: RAREZA.LEGENDARIO,
    binomial: "Estaci\xF3n de lluvias",
    rasgo: RASGO.CAMPO_BOSQUE,
    rasgoNombre: "Estaci\xF3n de lluvias",
    rasgoTexto: "Los saur\xF3podos curan 1 herida al final de cada turno.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "La estaci\xF3n h\xFAmeda rebrota el dosel de con\xEDferas de ribera, al que s\xF3lo llegan los cuellos largos: es comida que los dem\xE1s no alcanzan."
  }),
  aridez: clima({
    id: "aridez",
    coste: 1,
    rareza: RAREZA.LEGENDARIO,
    binomial: "Sequ\xEDa prolongada",
    rasgo: RASGO.CAMPO_ARIDEZ,
    rasgoNombre: "Sequ\xEDa prolongada",
    rasgoTexto: "Durante 3 turnos, ambos jugadores pierden 1 carta del mazo al robar.",
    // Único clima que caduca: `duracion` son los turnos que se queda puesto,
    // contados en la fase de robo de los turnos siguientes.
    duracion: 3,
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Las secas del Kimmeridgiense dejaron paleosuelos con n\xF3dulos de caliche y acumulaciones de huesos en las charcas que se iban quedando sin agua."
  }),
  sabana: clima({
    id: "sabana",
    coste: 1,
    rareza: RAREZA.COMUN,
    binomial: "Monz\xF3n de verano",
    rasgo: RASGO.CAMPO_SABANA,
    rasgoNombre: "Monz\xF3n de verano",
    rasgoTexto: "+1 de Biomasa cada turno para los dos jugadores, mientras siga en el campo.",
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "La Morrison estaba bajo circulaci\xF3n monz\xF3nica: lluvias de verano concentradas que disparaban la productividad vegetal y dejaban el resto del a\xF1o seco."
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
    ataque: 8,
    vida: 4,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sigue a los grandes",
    rasgoTexto: "Gana +2 de Ataque si tienes en juego alg\xFAn dinosaurio con m\xE1s de 6 de Vida.",
    mecanica: Object.freeze({ si: { cuando: CUANDO.ALIADO_CON_VIDA, umbral: 6, ataque: 2 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Plesiosaurio plios\xE1urido del Cret\xE1cico Superior de Wyoming. No es un dinosaurio: es un reptil marino de cuello corto y cr\xE1neo enorme."
  }),
  ojoraptorsaurus: dino({
    id: "ojoraptorsaurus",
    rareza: RAREZA.RARO,
    clado: CLADO.TEROPODO,
    binomial: "Ojoraptorsaurus boerei",
    coste: 2,
    ataque: 2,
    vida: 4,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Salto de entrada",
    rasgoTexto: "Cuando entra en juego hiere en 2 al dinosaurio de enfrente.",
    mecanica: Object.freeze({ entrada: { emboscada: 2 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Oviraptorosaurio caenagn\xE1tido de la Formaci\xF3n Ojo Alamo, Nuevo M\xE9xico, Maastrichtiense. Se conoce por poco material p\xE9lvico."
  }),
  dromaeosaurus: dino({
    id: "dromaeosaurus",
    rareza: RAREZA.COMUN,
    clado: CLADO.TEROPODO,
    binomial: "Dromaeosaurus albertensis",
    coste: 2,
    ataque: 3,
    vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Jaur\xEDa",
    rasgoTexto: "Gana +1 de Ataque por cada Dromaeosaurus en juego, sea de quien sea y este incluido.",
    mecanica: Object.freeze({ cuenta: { que: QUE.MISMA, ambos: true, ataque: 1 } }),
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
    vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Olfato de tormenta",
    rasgoTexto: "Al jugarlo, puedes llevarte a la mano una carta de evento de tu mazo.",
    mecanica: Object.freeze({ busca: QUE.EVENTO }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Formaci\xF3n Morrison, cantera Carnegie del Dinosaur National Monument, Utah, Titoniense inferior (~149\u2013145 Ma). Descrito en 2025 sobre un neurocr\xE1neo y techo craneal (CM 26552) que llevaba d\xE9cadas archivado como Diplodocus. Es un dicreos\xE1urido: saur\xF3podos de cuello corto y talla modesta para el grupo, no un ter\xF3podo."
  }),
  sanjuansaurus: dino({
    id: "sanjuansaurus",
    rareza: RAREZA.RARO,
    clado: CLADO.TEROPODO,
    binomial: "Sanjuansaurus gordilloi",
    coste: 2,
    ataque: 3,
    vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Olfato de tormenta",
    rasgoTexto: "Al jugarlo, puedes llevarte a la mano una carta de clima de tu mazo.",
    mecanica: Object.freeze({ busca: QUE.CLIMA }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Herreras\xE1urido de la Formaci\xF3n Ischigualasto, Argentina, Carniense (~231 Ma). Los herreras\xE1uridos son saurisquios muy basales; su colocaci\xF3n entre los ter\xF3podos se discute."
  }),
  suchomimus: dino({
    id: "suchomimus",
    rareza: RAREZA.EPICO,
    clado: CLADO.TEROPODO,
    binomial: "Suchomimus tenerensis",
    coste: 3,
    ataque: 7,
    vida: 7,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Rastreo de orilla",
    rasgoTexto: "Cuando entra en juego descarta 1 carta del mazo de tu rival.",
    mecanica: Object.freeze({ entrada: { mueleRival: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Espinos\xE1urido de la Formaci\xF3n Elrhaz, N\xEDger, Aptiense. Hocico largo y c\xF3nico, adaptado a la pesca."
  }),
  eosinopteryx: dino({
    id: "eosinopteryx",
    rareza: RAREZA.COMUN,
    clado: CLADO.TEROPODO,
    binomial: "Eosinopteryx brevipenna",
    coste: 0,
    ataque: 1,
    vida: 1,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Percha compartida",
    rasgoTexto: "Gana +1 de Vida por cada Eosinopteryx que tengas en juego, este incluido.",
    mecanica: Object.freeze({ cuenta: { que: QUE.MISMA, ambos: false, vida: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Paraviano diminuto de la Formaci\xF3n Tiaojishan, China, Jur\xE1sico Superior. Conserva impresiones de plumas."
  }),
  troodon: dino({
    id: "troodon",
    rareza: RAREZA.COMUN,
    clado: CLADO.TEROPODO,
    binomial: "Troodon formosus",
    coste: 1,
    ataque: 1,
    vida: 2,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Caza coordinada",
    rasgoTexto: "Gana +1 de Ataque por cada Troodon que tengas en juego, este incluido.",
    mecanica: Object.freeze({ cuenta: { que: QUE.MISMA, ambos: false, ataque: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Ter\xF3podo maniraptor del Cret\xE1cico Superior de Norteam\xE9rica. El nombre se basa en dientes aislados y su validez est\xE1 discutida."
  }),
  carnotaurus: dino({
    id: "carnotaurus",
    rareza: RAREZA.EPICO,
    clado: CLADO.TEROPODO,
    binomial: "Carnotaurus sastrei",
    coste: 3,
    ataque: 7,
    vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Territorio exclusivo",
    rasgoTexto: "Para jugarlo tienes que descartar 2 cartas de tu mano.",
    mecanica: Object.freeze({ costeExtra: { descartar: 2 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Abelis\xE1urido de la Formaci\xF3n La Colonia, Argentina, Maastrichtiense. Cuernos frontales y brazos reducidos al extremo."
  }),
  spinosaurus: dino({
    id: "spinosaurus",
    rareza: RAREZA.LEGENDARIO,
    clado: CLADO.TEROPODO,
    binomial: "Spinosaurus aegyptiacus",
    coste: 4,
    ataque: 10,
    vida: 8,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Draga el r\xEDo",
    rasgoTexto: "Cuando entra en juego descarta 5 cartas del mazo de tu rival y 2 del tuyo.",
    mecanica: Object.freeze({ entrada: { mueleRival: 5, muelePropio: 2 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Espinos\xE1urido de los Kem Kem, Marruecos, Cenomaniense. Vela dorsal y un estilo de vida acu\xE1tico que sigue debati\xE9ndose."
  }),
  mosasaurus: dino({
    id: "mosasaurus",
    rareza: RAREZA.LEGENDARIO,
    clado: CLADO.MARINO,
    binomial: "Mosasaurus hoffmannii",
    coste: 4,
    ataque: 8,
    vida: 10,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Draga el r\xEDo",
    rasgoTexto: "Cuando entra en juego descarta 5 cartas del mazo de tu rival y 2 del tuyo.",
    mecanica: Object.freeze({ entrada: { mueleRival: 5, muelePropio: 2 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Mosasaurio del Maastrichtiense. No es un dinosaurio: es un escamoso marino, pariente de varanos y serpientes."
  }),
  halszkaraptor: dino({
    id: "halszkaraptor",
    rareza: RAREZA.RARO,
    clado: CLADO.TEROPODO,
    binomial: "Halszkaraptor escuilliei",
    coste: 1,
    ataque: 2,
    vida: 2,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Nadador de temporal",
    rasgoTexto: "Gana +2 de Vida mientras haya un clima en el campo.",
    mecanica: Object.freeze({ si: { cuando: CUANDO.CLIMA, vida: 2 } }),
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
    vida: 1,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Nadador de temporal",
    rasgoTexto: "Gana +2 de Ataque mientras haya un clima en el campo.",
    mecanica: Object.freeze({ si: { cuando: CUANDO.CLIMA, ataque: 2 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Oviraptorosaurio de la Formaci\xF3n Nanxiong, China, Maastrichtiense. El holotipo se conserv\xF3 en postura de haber quedado atrapado en el barro."
  }),
  scanisaurus: dino({
    id: "scanisaurus",
    rareza: RAREZA.RARO,
    clado: CLADO.MARINO,
    binomial: "Scanisaurus nazarowi",
    coste: 4,
    ataque: 3,
    vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Banco de caza",
    rasgoTexto: "Mientras est\xE9 en juego, tus reptiles marinos ganan +1 de Ataque.",
    mecanica: Object.freeze({ aura: { clado: CLADO.MARINO, ataque: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Plesiosaurio elasmos\xE1urido del Cret\xE1cico Superior del B\xE1ltico. No es un dinosaurio, y su validez como g\xE9nero est\xE1 discutida."
  }),
  monolophosaurus: dino({
    id: "monolophosaurus",
    rareza: RAREZA.RARO,
    clado: CLADO.TEROPODO,
    binomial: "Monolophosaurus jiangi",
    coste: 4,
    ataque: 3,
    vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Cresta de mando",
    rasgoTexto: "Mientras est\xE9 en juego, tus ter\xF3podos ganan +1 de Vida.",
    mecanica: Object.freeze({ aura: { clado: CLADO.TEROPODO, vida: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Ter\xF3podo tetanuro de la Formaci\xF3n Shishugou, China, Jur\xE1sico Medio. Una sola cresta \xF3sea recorre el cr\xE1neo."
  }),
  invictarx: dino({
    id: "invictarx",
    rareza: RAREZA.RARO,
    clado: CLADO.TIREOFORO,
    binomial: "Invictarx zephyri",
    coste: 3,
    ataque: 1,
    vida: 1,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Formaci\xF3n cerrada",
    rasgoTexto: "Mientras est\xE9 en juego, tus tire\xF3foros ganan +1 de Vida.",
    mecanica: Object.freeze({ aura: { clado: CLADO.TIREOFORO, vida: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Anquilosaurio nodos\xE1urido de la Formaci\xF3n Menefee, Nuevo M\xE9xico, Campaniense."
  }),
  medusaceratops: dino({
    id: "medusaceratops",
    rareza: RAREZA.EPICO,
    clado: CLADO.MARGINOCEFALO,
    binomial: "Medusaceratops lokii",
    coste: 3,
    ataque: 2,
    vida: 10,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Muralla de golas",
    rasgoTexto: "Mientras est\xE9 en juego, tus marginoc\xE9falos ganan +1 de Ataque y +1 de Vida.",
    mecanica: Object.freeze({ aura: { clado: CLADO.MARGINOCEFALO, ataque: 1, vida: 1 } }),
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
    vida: 2,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Llamada de manada",
    rasgoTexto: "Al jugarlo, puedes llevarte a la mano otro Platyceratops de tu mazo.",
    mecanica: Object.freeze({ busca: QUE.MISMA }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Ceratopsio bagacerat\xF3psido de Mongolia, Campaniense. Peque\xF1o y sin cuernos."
  }),
  loricatosaurus: dino({
    id: "loricatosaurus",
    rareza: RAREZA.COMUN,
    clado: CLADO.TIREOFORO,
    binomial: "Loricatosaurus priscus",
    coste: 3,
    ataque: 0,
    vida: 8,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Terrapl\xE9n",
    rasgoTexto: "Cuando entra en juego tu h\xE1bitat recupera 2 puntos.",
    mecanica: Object.freeze({ entrada: { curaHabitat: 2 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Estegos\xE1urido del Calloviense de Inglaterra y Francia. Se separ\xF3 del material antes atribuido a Lexovisaurus."
  }),
  therizinosaurus: dino({
    id: "therizinosaurus",
    rareza: RAREZA.COMUN,
    clado: CLADO.TEROPODO,
    binomial: "Therizinosaurus cheloniformis",
    coste: 3,
    ataque: 1,
    vida: 6,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Garra de sequ\xEDa",
    rasgoTexto: "Gana +3 de Ataque mientras haya un clima en el campo.",
    mecanica: Object.freeze({ si: { cuando: CUANDO.CLIMA, ataque: 3 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Terizinosaurio de la Formaci\xF3n Nemegt, Mongolia, Maastrichtiense. Ter\xF3podo herb\xEDvoro con las garras manuales m\xE1s largas que se conocen."
  }),
  alaskacephale: dino({
    id: "alaskacephale",
    rareza: RAREZA.RARO,
    clado: CLADO.MARGINOCEFALO,
    binomial: "Alaskacephale gangloffi",
    coste: 2,
    ataque: 2,
    vida: 4,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Testarazo",
    rasgoTexto: "Cuando entra en juego hiere en 2 al dinosaurio de enfrente.",
    mecanica: Object.freeze({ entrada: { emboscada: 2 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Paquicefalosaurio de la Formaci\xF3n Prince Creek, Alaska, Campaniense."
  }),
  titanoceratops: dino({
    id: "titanoceratops",
    rareza: RAREZA.EPICO,
    clado: CLADO.MARGINOCEFALO,
    binomial: "Titanoceratops ouranos",
    coste: 3,
    ataque: 5,
    vida: 7,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Cuerno mayor",
    rasgoTexto: "Gana +1 de Ataque por cada marginoc\xE9falo que tengas en juego, este incluido.",
    mecanica: Object.freeze({ cuenta: { que: QUE.CLADO, ambos: false, ataque: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Cerat\xF3psido casmosaurino de Nuevo M\xE9xico, Campaniense. Se propuso separ\xE1ndolo de material asignado a Pentaceratops, y no todos lo aceptan."
  }),
  atlasaurus: dino({
    id: "atlasaurus",
    rareza: RAREZA.EPICO,
    clado: CLADO.SAUROPODO,
    binomial: "Atlasaurus imelakei",
    coste: 3,
    ataque: 2,
    vida: 10,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sombra del cuello",
    rasgoTexto: "Mientras est\xE9 en juego, tus saur\xF3podos ganan +1 de Vida.",
    mecanica: Object.freeze({ aura: { clado: CLADO.SAUROPODO, vida: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Saur\xF3podo del Jur\xE1sico Medio de Marruecos. Extremidades desproporcionadamente largas para un saur\xF3podo."
  }),
  stegoceras: dino({
    id: "stegoceras",
    rareza: RAREZA.COMUN,
    clado: CLADO.MARGINOCEFALO,
    binomial: "Stegoceras validum",
    coste: 2,
    ataque: 1,
    vida: 8,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Cabezazo de vuelta",
    rasgoTexto: "Devuelve 2 de da\xF1o a quien lo hiera en combate.",
    mecanica: Object.freeze({ espinas: 2 }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Paquicefalosaurio de la Formaci\xF3n Dinosaur Park, Alberta, Campaniense. Domo craneal grueso."
  }),
  maiasaura: dino({
    id: "maiasaura",
    rareza: RAREZA.LEGENDARIO,
    clado: CLADO.ORNITOPODO,
    binomial: "Maiasaura peeblesorum",
    coste: 3,
    ataque: 3,
    vida: 10,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Buena madre",
    rasgoTexto: "Al final de tu turno, todos tus dinosaurios recuperan 1 de Vida.",
    mecanica: Object.freeze({ regenera: { aliados: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Hadros\xE1urido de la Formaci\xF3n Two Medicine, Montana, Campaniense. Sus nidadas documentan cuidado parental."
  }),
  edmontosaurus: dino({
    id: "edmontosaurus",
    rareza: RAREZA.LEGENDARIO,
    clado: CLADO.ORNITOPODO,
    binomial: "Edmontosaurus annectens",
    coste: 4,
    ataque: 2,
    vida: 10,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Migraci\xF3n en masa",
    rasgoTexto: "Mientras est\xE9 en juego, tus ornit\xF3podos ganan +1 de Ataque y +1 de Vida.",
    mecanica: Object.freeze({ aura: { clado: CLADO.ORNITOPODO, ataque: 1, vida: 1 } }),
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
    vida: 2,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Colonia de ribera",
    rasgoTexto: "Gana +1 de Ataque y +1 de Vida por cada Plateosauravus que tengas en juego, este incluido.",
    mecanica: Object.freeze({ cuenta: { que: QUE.MISMA, ambos: false, ataque: 1, vida: 1 } }),
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
    vida: 4,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Osteodermos",
    rasgoTexto: "Devuelve 3 de da\xF1o a quien lo hiera en combate.",
    mecanica: Object.freeze({ espinas: 3 }),
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
    vida: 8,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Embestida",
    rasgoTexto: "Cuando entra en juego manda al descarte 1 dinosaurio rival de hasta 2 de Vida.",
    mecanica: Object.freeze({ entrada: { fulmina: 2 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Cerat\xF3psido centrosaurino de la Formaci\xF3n Oldman, Alberta, Campaniense."
  }),
  antarctosaurus: dino({
    id: "antarctosaurus",
    rareza: RAREZA.LEGENDARIO,
    clado: CLADO.SAUROPODO,
    binomial: "Antarctosaurus wichmannianus",
    coste: 4,
    ataque: 2,
    vida: 12,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Refugio polar",
    rasgoTexto: "Mientras est\xE9 en juego, a ninguno de tus dinosaurios le afectan los efectos del clima.",
    mecanica: Object.freeze({ aura: { clado: TODOS, inmune: INMUNE.CLIMA } }),
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
    vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Grito de aviso",
    rasgoTexto: "Al jugarlo, puedes llevarte a la mano un marginoc\xE9falo de tu mazo.",
    mecanica: Object.freeze({ busca: CLADO.MARGINOCEFALO }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Neoceratopsio basal de la Formaci\xF3n Yixian, China, Barremiense. Peque\xF1o y sin gola desarrollada."
  }),
  rhinorex: dino({
    id: "rhinorex",
    rareza: RAREZA.EPICO,
    clado: CLADO.ORNITOPODO,
    binomial: "Rhinorex condrupus",
    coste: 3,
    ataque: 3,
    vida: 8,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "\xDAltima llanura",
    rasgoTexto: "Gana +2 de Ataque mientras tu h\xE1bitat est\xE9 por debajo del de tu rival.",
    mecanica: Object.freeze({ si: { cuando: CUANDO.HABITAT_DETRAS, ataque: 2 } }),
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
    vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Cr\xEDa acorazada",
    rasgoTexto: "Gana +1 de Vida por cada tire\xF3foro que tengas en juego, este incluido.",
    mecanica: Object.freeze({ cuenta: { que: QUE.CLADO, ambos: false, vida: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Tire\xF3foro basal de la Formaci\xF3n Lufeng, China, Jur\xE1sico Inferior. Se conoce por una mand\xEDbula, y su validez est\xE1 discutida."
  }),
  shuangmiaosaurus: dino({
    id: "shuangmiaosaurus",
    rareza: RAREZA.COMUN,
    clado: CLADO.ORNITOPODO,
    binomial: "Shuangmiaosaurus gilmorei",
    coste: 2,
    ataque: 2,
    vida: 4,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Ramoneo de orilla",
    rasgoTexto: "Cuando entra en juego tu h\xE1bitat recupera 1 punto.",
    mecanica: Object.freeze({ entrada: { curaHabitat: 1 } }),
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
    vida: 4,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Vig\xEDa de la gola",
    rasgoTexto: "Cuando entra en juego robas 1 carta.",
    mecanica: Object.freeze({ entrada: { roba: 1 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Cerat\xF3psido casmosaurino de la Formaci\xF3n Dinosaur Park, Alberta, Campaniense. Gola muy grande con dos aberturas amplias."
  }),
  // ------------------------------------------ la ronda de las cien cartas
  tyrannosaurus: dino({
    id: "tyrannosaurus",
    rareza: RAREZA.LEGENDARIO,
    clado: CLADO.TEROPODO,
    binomial: "Tyrannosaurus rex",
    coste: 4,
    ataque: 11,
    vida: 9,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Rugido",
    rasgoTexto: "Cuando entra en juego tu rival descarta 2 cartas de su mano al azar.",
    mecanica: Object.freeze({ entrada: { manoRival: 2 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Tiranos\xE1urido de la Formaci\xF3n Hell Creek, Maastrichtiense. El o\xEDdo interno y la caja craneal sugieren sensibilidad a frecuencias bajas; el rugido es una licencia, los animales actuales de ese tama\xF1o no rugen."
  }),
  velociraptor: dino({
    id: "velociraptor",
    rareza: RAREZA.COMUN,
    clado: CLADO.TEROPODO,
    binomial: "Velociraptor mongoliensis",
    coste: 0,
    ataque: 3,
    vida: 2,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Garra impaciente",
    rasgoTexto: "Para jugarlo tienes que descartar 1 carta de tu mano.",
    mecanica: Object.freeze({ costeExtra: { descartar: 1 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Dromeos\xE1urido de la Formaci\xF3n Djadokhta, Mongolia, Campaniense. Del tama\xF1o de un pavo y con plumas: los c\xFAbitos llevan las inserciones de las r\xE9miges."
  }),
  brachiosaurus: dino({
    id: "brachiosaurus",
    rareza: RAREZA.LEGENDARIO,
    clado: CLADO.SAUROPODO,
    binomial: "Brachiosaurus altithorax",
    coste: 4,
    ataque: 3,
    vida: 13,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sombra del gigante",
    rasgoTexto: "Mientras est\xE9 en juego, todos tus dinosaurios ganan +1 de Vida.",
    mecanica: Object.freeze({ aura: { clado: TODOS, vida: 1 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Saur\xF3podo de la Morrison, raro en el registro. Patas delanteras m\xE1s largas que las traseras y cuello alzado: com\xEDa donde ning\xFAn otro llegaba."
  }),
  argentinosaurus: dino({
    id: "argentinosaurus",
    rareza: RAREZA.EPICO,
    clado: CLADO.SAUROPODO,
    binomial: "Argentinosaurus huinculensis",
    coste: 4,
    ataque: 4,
    vida: 14,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Peso muerto",
    rasgoTexto: "Para jugarlo tienes que descartar 2 cartas de tu mano.",
    mecanica: Object.freeze({ costeExtra: { descartar: 2 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Titanosaurio de la Formaci\xF3n Huincul, Argentina, Cenomaniense. Se conoce por unas pocas v\xE9rtebras y una tibia; la masa estimada, de 65 a 75 toneladas, es de las mayores de cualquier animal terrestre."
  }),
  mamenchisaurus: dino({
    id: "mamenchisaurus",
    rareza: RAREZA.RARO,
    clado: CLADO.SAUROPODO,
    binomial: "Mamenchisaurus hochuanensis",
    coste: 4,
    ataque: 1,
    vida: 11,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Cuello sin fin",
    rasgoTexto: "Al final de tu turno recupera 1 de Vida.",
    mecanica: Object.freeze({ regenera: { propia: 1 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Saur\xF3podo de la Formaci\xF3n Shaximiao, China, Jur\xE1sico Superior. Diecinueve v\xE9rtebras cervicales: el cuello m\xE1s largo en proporci\xF3n al cuerpo de cualquier saur\xF3podo conocido."
  }),
  amargasaurus: dino({
    id: "amargasaurus",
    rareza: RAREZA.RARO,
    clado: CLADO.SAUROPODO,
    binomial: "Amargasaurus cazadorensis",
    coste: 2,
    ataque: 2,
    vida: 5,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Reba\xF1o de cuellos",
    rasgoTexto: "Gana +1 de Vida por cada saur\xF3podo que tengas en juego, este incluido.",
    mecanica: Object.freeze({ cuenta: { que: QUE.CLADO, ambos: false, vida: 1 } }),
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: "Dicreos\xE1urido de la Formaci\xF3n La Amarga, Argentina, Barremiense. Las espinas neurales b\xEDfidas del cuello se han interpretado como vela, como defensa y como estructura de exhibici\xF3n; no hay consenso."
  }),
  ankylosaurus: dino({
    id: "ankylosaurus",
    rareza: RAREZA.LEGENDARIO,
    clado: CLADO.TIREOFORO,
    binomial: "Ankylosaurus magniventris",
    coste: 4,
    ataque: 2,
    vida: 12,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Maza de cola",
    rasgoTexto: "Devuelve 4 de da\xF1o a quien lo hiera en combate.",
    mecanica: Object.freeze({ espinas: 4 }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Anquilos\xE1urido de Hell Creek, Maastrichtiense. La maza caudal est\xE1 formada por osteodermos fusionados sobre v\xE9rtebras r\xEDgidas; los modelos biomec\xE1nicos le dan fuerza para romper hueso."
  }),
  kentrosaurus: dino({
    id: "kentrosaurus",
    rareza: RAREZA.COMUN,
    clado: CLADO.TIREOFORO,
    binomial: "Kentrosaurus aethiopicus",
    coste: 1,
    ataque: 1,
    vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "P\xFAas de hombro",
    rasgoTexto: "Devuelve 1 de da\xF1o a quien lo hiera en combate.",
    mecanica: Object.freeze({ espinas: 1 }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Estegos\xE1urido de la Formaci\xF3n Tendaguru, Tanzania, Kimmeridgiense: contempor\xE1neo de la Morrison al otro lado del mundo. P\xFAas largas en la cola y una par en los hombros o la cadera."
  }),
  euoplocephalus: dino({
    id: "euoplocephalus",
    rareza: RAREZA.RARO,
    clado: CLADO.TIREOFORO,
    binomial: "Euoplocephalus tutus",
    coste: 3,
    ataque: 2,
    vida: 8,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "P\xE1rpados de hueso",
    rasgoTexto: "No le afectan las cartas de evento de tu rival.",
    mecanica: Object.freeze({ inmune: INMUNE.EVENTO }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Anquilos\xE1urido de la Formaci\xF3n Dinosaur Park, Alberta, Campaniense. Ten\xEDa p\xE1rpados \xF3seos: un osteodermo articulado que cerraba sobre el ojo."
  }),
  triceratops: dino({
    id: "triceratops",
    rareza: RAREZA.EPICO,
    clado: CLADO.MARGINOCEFALO,
    binomial: "Triceratops horridus",
    coste: 4,
    ataque: 5,
    vida: 8,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Tres cuernos",
    rasgoTexto: "Cuando entra en juego manda al descarte 1 dinosaurio rival de hasta 3 de Vida.",
    mecanica: Object.freeze({ entrada: { fulmina: 3 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Cerat\xF3psido de Hell Creek y Lance, Maastrichtiense. Las lesiones cicatrizadas en golas y cuernos de otros Triceratops indican combates entre ellos con los cuernos."
  }),
  pachycephalosaurus: dino({
    id: "pachycephalosaurus",
    rareza: RAREZA.RARO,
    clado: CLADO.MARGINOCEFALO,
    binomial: "Pachycephalosaurus wyomingensis",
    coste: 2,
    ataque: 3,
    vida: 4,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Cabezazo",
    rasgoTexto: "Cuando entra en juego hiere en 3 al dinosaurio de enfrente.",
    mecanica: Object.freeze({ entrada: { emboscada: 3 } }),
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: "Paquicefalos\xE1urido de Hell Creek y Lance, Maastrichtiense. La c\xFApula de 25 cm de hueso macizo se ha interpretado como arma de topetazo; las lesiones en c\xFApulas de varios ejemplares lo apoyan, la estructura interna lo discute."
  }),
  iguanodon: dino({
    id: "iguanodon",
    rareza: RAREZA.RARO,
    clado: CLADO.ORNITOPODO,
    binomial: "Iguanodon bernissartensis",
    coste: 2,
    ataque: 3,
    vida: 5,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Manada de Bernissart",
    rasgoTexto: "Gana +1 de Ataque por cada Iguanodon en juego, sea de quien sea y este incluido.",
    mecanica: Object.freeze({ cuenta: { que: QUE.MISMA, ambos: true, ataque: 1 } }),
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: "Ornit\xF3podo del Barremiense de B\xE9lgica. Los m\xE1s de treinta esqueletos de la mina de Bernissart se interpretaron como una manada muerta a la vez; hoy se cree que se acumularon en varios episodios."
  }),
  parasaurolophus: dino({
    id: "parasaurolophus",
    rareza: RAREZA.RARO,
    clado: CLADO.ORNITOPODO,
    binomial: "Parasaurolophus walkeri",
    coste: 3,
    ataque: 2,
    vida: 8,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Llamada resonante",
    rasgoTexto: "Cuando entra en juego robas 1 carta y tu h\xE1bitat recupera 1 punto.",
    mecanica: Object.freeze({ entrada: { roba: 1, curaHabitat: 1 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Hadros\xE1urido de la Formaci\xF3n Dinosaur Park, Alberta, Campaniense. La cresta tubular es un resonador: los modelos ac\xFAsticos le dan una nota grave, en torno a los 30 Hz."
  }),
  pteranodon: dino({
    id: "pteranodon",
    rareza: RAREZA.COMUN,
    clado: CLADO.PTEROSAURIO,
    binomial: "Pteranodon longiceps",
    coste: 0,
    ataque: 2,
    vida: 2,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Planeo",
    rasgoTexto: "Cuando entra en juego pierdes 1 carta de tu mazo y robas 1.",
    mecanica: Object.freeze({ entrada: { muelePropio: 1, roba: 1 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Pterosaurio de la Niobrara, Kansas, Santoniense, con m\xE1s de mil ejemplares conocidos. Envergadura de hasta seis metros y sin dientes: pescaba en un mar interior."
  }),
  quetzalcoatlus: dino({
    id: "quetzalcoatlus",
    rareza: RAREZA.EPICO,
    clado: CLADO.PTEROSAURIO,
    binomial: "Quetzalcoatlus northropi",
    coste: 3,
    ataque: 5,
    vida: 4,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sombra en la llanura",
    rasgoTexto: "Cuando entra en juego tu rival pierde 3 cartas del mazo.",
    mecanica: Object.freeze({ entrada: { mueleRival: 3 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Azd\xE1rquido de la Formaci\xF3n Javelina, Texas, Maastrichtiense. Envergadura de diez metros y patas largas: se le reconstruye cazando a pie por la llanura, como una cig\xFCe\xF1a gigante."
  }),
  elasmosaurus: dino({
    id: "elasmosaurus",
    rareza: RAREZA.RARO,
    clado: CLADO.MARINO,
    binomial: "Elasmosaurus platyurus",
    coste: 3,
    ataque: 2,
    vida: 9,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Cuello de vig\xEDa",
    rasgoTexto: "Resta 1 a cada golpe que llegue a tu h\xE1bitat.",
    mecanica: Object.freeze({ guardia: { habitat: 1 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Plesiosaurio de la Niobrara, Kansas, Campaniense. Setenta y dos v\xE9rtebras cervicales, m\xE1s que ning\xFAn otro animal conocido; el cuello era poco flexible y probablemente serv\xEDa para acercarse a los bancos de peces desde abajo."
  }),
  // ---------------------------------------------- la ronda del CONTROL
  //
  // Diez criaturas y cinco eventos (16-09-2026) para la mitad del juego que
  // faltaba. El set sabía pelear por el campo y no sabía pelear por la MANO:
  // el rival robaba dos por turno, jugaba lo que quería y la vía de la
  // extinción llevaba desde la v2 en el 0 %. Estas diez no se miden por lo que
  // pegan —casi ninguna pega— sino por lo que le quitan a la partida de
  // enfrente, o por lo que sacan de la propia.
  //
  // Son seis terópodos de diez, y no es descuido: los ornitomimosaurios y los
  // oviraptorosaurios SON terópodos, y el arquetipo que pedía el autor —el que
  // rebusca, esconde y roba— cae de su lado por anatomía, no por diseño.
  gallimimus: dino({
    id: "gallimimus",
    rareza: RAREZA.RARO,
    clado: CLADO.TEROPODO,
    binomial: "Gallimimus bullatus",
    coste: 2,
    ataque: 2,
    vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Estampida de la manada",
    rasgoTexto: "Cuando entra en juego, baraja tu mano dentro de tu mazo y roba 5 cartas.",
    mecanica: Object.freeze({ entrada: { manoNueva: 5 } }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Ornitomimosaurio de la Formaci\xF3n Nemegt, Mongolia, Maastrichtiense, conocido por ejemplares casi completos. En el pico se han descrito surcos verticales que se han interpretado como l\xE1minas de filtraci\xF3n, lo que apuntar\xEDa a una dieta de peque\xF1os organismos del agua; la interpretaci\xF3n no es un\xE1nime."
  }),
  thescelosaurus: dino({
    id: "thescelosaurus",
    rareza: RAREZA.COMUN,
    clado: CLADO.ORNITOPODO,
    binomial: "Thescelosaurus neglectus",
    coste: 1,
    ataque: 1,
    vida: 4,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Cavar y esperar",
    rasgoTexto: "Cuando entra en juego descarta 3 cartas de tu mazo y roba 2.",
    mecanica: Object.freeze({ entrada: { muelePropio: 3, roba: 2 } }),
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: "Ornit\xF3podo peque\xF1o de Hell Creek, uno de los \xFAltimos dinosaurios no avianos del registro. Se le ha atribuido h\xE1bito excavador por la robustez de las extremidades anteriores y por comparaci\xF3n con Oryctodromeus, que s\xED se encontr\xF3 en su madriguera; en Thescelosaurus es una hip\xF3tesis discutida."
  }),
  deinocheirus: dino({
    id: "deinocheirus",
    rareza: RAREZA.EPICO,
    clado: CLADO.TEROPODO,
    binomial: "Deinocheirus mirificus",
    // Midió el 63,7 % con 3/9 y tope 5: llegaba a 8/9 por 4 de Biomasa.
    coste: 4,
    ataque: 3,
    vida: 8,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Brazos de dos metros y medio",
    rasgoTexto: "Gana +1 de Ataque por cada carta que tengas en la mano, hasta +4.",
    mecanica: Object.freeze({ cuenta: { que: QUE.MANO, ataque: 1, tope: 4 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Sus manos, de 2,4 m con las garras, se describieron en 1970 y durante cuarenta y cuatro a\xF1os fueron casi lo \xFAnico que se conoc\xEDa del animal. Los ejemplares de 2014 lo completaron: un ornitomimosaurio de once metros con gastrolitos y restos de pez en la cavidad abdominal."
  }),
  anzu: dino({
    id: "anzu",
    rareza: RAREZA.RARO,
    clado: CLADO.TEROPODO,
    binomial: "Anzu wyliei",
    coste: 2,
    ataque: 3,
    vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Saqueo del nido",
    rasgoTexto: "Cuando entra en juego, tu rival descarta cartas al azar hasta quedarse con 4 en la mano.",
    mecanica: Object.freeze({ entrada: { topeManoRival: 4 } }),
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: "Cenagn\xE1tido de Hell Creek descrito en 2014 a partir de tres esqueletos parciales que, entre los tres, dan casi el animal completo. El saqueo de nidos ajenos es analog\xEDa con aves actuales de pico parecido, no evidencia: de su dieta s\xF3lo se sabe que era omn\xEDvora."
  }),
  nigersaurus: dino({
    id: "nigersaurus",
    rareza: RAREZA.EPICO,
    clado: CLADO.SAUROPODO,
    binomial: "Nigersaurus taqueti",
    coste: 3,
    ataque: 2,
    vida: 9,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Siega a ras de suelo",
    // Muele a los dos y NO a partes iguales, y no es un capricho de balance: un
    // 3 y 3 se tasa en exactamente cero y la IA no la jugaría nunca. Lo caza
    // `test/entradas.test.js`, que exige que toda entrada valga algo.
    rasgoTexto: "Cuando entra en juego, tu rival descarta 4 cartas de su mazo y t\xFA 2.",
    mecanica: Object.freeze({ entrada: { mueleRival: 4, muelePropio: 2 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Rebaquis\xE1urido del Aptiense-Albiense de N\xEDger. El hocico es m\xE1s ancho que el resto del cr\xE1neo y lleva una bater\xEDa de m\xE1s de quinientos dientes que se reemplazaban cada pocas semanas; la orientaci\xF3n del o\xEDdo interno indica que la cabeza iba habitualmente mirando al suelo."
  }),
  shuvuuia: dino({
    id: "shuvuuia",
    rareza: RAREZA.COMUN,
    clado: CLADO.TEROPODO,
    binomial: "Shuvuuia deserti",
    // Midió el 46,7 % con 1/2: el cuerpo no pagaba ni el turno que ocupa.
    coste: 1,
    ataque: 1,
    vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "O\xEDdo de lechuza",
    rasgoTexto: "Al jugarla, ll\xE9vate a la mano un dinosaurio de tu mazo de 2 o menos de Ataque.",
    mecanica: Object.freeze({ busca: { ataqueMax: 2 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Alvarezs\xE1urido diminuto de la Formaci\xF3n Djadochta, Mongolia. La lagena de su o\xEDdo interno y el anillo escler\xF3tico son proporcionalmente comparables a los de la lechuza com\xFAn, lo que apunta a caza nocturna: es de las pocas inferencias de comportamiento que descansan en anatom\xEDa medible."
  }),
  saurolophus: dino({
    id: "saurolophus",
    rareza: RAREZA.EPICO,
    clado: CLADO.ORNITOPODO,
    binomial: "Saurolophus angustirostris",
    // Midió el 66,0 % con 3/9: el 3/9 ya era una carta, y encima buscaba.
    coste: 3,
    ataque: 2,
    vida: 7,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Reclamo de la cresta",
    rasgoTexto: "Al jugarla, ll\xE9vate a la mano un dinosaurio de tu mazo de 8 o m\xE1s de Ataque.",
    mecanica: Object.freeze({ busca: { ataqueMin: 8 } }),
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: "Hadrosaurio de Nemegt con una cresta \xF3sea MACIZA, no hueca como la de Parasaurolophus: no pudo funcionar como tubo de resonancia. Se ha propuesto que sostuviera un saco nasal de piel inflable, y de ah\xED saldr\xEDa la llamada; es una hip\xF3tesis sin evidencia directa."
  }),
  tarbosaurus: dino({
    id: "tarbosaurus",
    rareza: RAREZA.EPICO,
    clado: CLADO.TEROPODO,
    binomial: "Tarbosaurus bataar",
    // Midió el 68,7 % con 8/7: era un Torvosaurus mejor Y con premio encima.
    coste: 4,
    ataque: 7,
    vida: 6,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Carro\xF1eo del tirano",
    rasgoTexto: "Cuando entra en juego recupera 2 cartas al azar de tu descarte.",
    mecanica: Object.freeze({ entrada: { rescata: 2 } }),
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: "Tiranos\xE1urido de Nemegt, el gran depredador de la Mongolia del Maastrichtiense. Si los tiranos\xE1uridos cazaban, carro\xF1eaban o ambas cosas es uno de los debates m\xE1s viejos y menos resueltos del oficio; lo probable, por analog\xEDa con todo carn\xEDvoro grande actual, es que hicieran las dos."
  }),
  psittacosaurus: dino({
    id: "psittacosaurus",
    rareza: RAREZA.COMUN,
    clado: CLADO.MARGINOCEFALO,
    binomial: "Psittacosaurus mongoliensis",
    coste: 1,
    ataque: 1,
    vida: 3,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Molleja de gastrolitos",
    rasgoTexto: "Gana +1 de Vida por cada 4 cartas de tu descarte, hasta +4.",
    mecanica: Object.freeze({ cuenta: { que: QUE.DESCARTE, cada: 4, vida: 1, tope: 4 } }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Ceratopsio basal del Cret\xE1cico Inferior de Asia, uno de los dinosaurios con m\xE1s ejemplares conocidos. Varios conservan masas de gastrolitos en la regi\xF3n g\xE1strica, y un ejemplar de Liaoning conserva adem\xE1s la piel y unas cerdas tubulares en la cola."
  }),
  dakotaraptor: dino({
    id: "dakotaraptor",
    rareza: RAREZA.EPICO,
    clado: CLADO.TEROPODO,
    binomial: "Dakotaraptor steini",
    // Midió el 59,3 % con 5/5 y tope 4: llegaba a 9/5 por 3.
    coste: 3,
    ataque: 4,
    vida: 5,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Acecho al rezagado",
    rasgoTexto: "Gana +1 de Ataque por cada carta de la mano de tu rival, hasta +3.",
    mecanica: Object.freeze({ cuenta: { que: QUE.MANO_RIVAL, ataque: 1, tope: 3 } }),
    nivel_evidencia: EVIDENCIA.DEBATIDO,
    nota_cientifica: "Dromeos\xE1urido grande de Hell Creek descrito en 2015. Parte del material asignado al holotipo result\xF3 despu\xE9s ser de una tortuga, as\xED que qu\xE9 huesos son suyos \u2014y por tanto su tama\xF1o\u2014 sigue discutido; la garra en hoz del segundo dedo s\xED es suya."
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
    id: "biomasa",
    rareza: RAREZA.COMUN,
    binomial: "Pradera de helechos",
    rasgoNombre: "Pradera de helechos",
    rasgoTexto: "+1 Biomasa al bajarla. Pierdes 1 carta de tu mazo. Una por turno.",
    biomasa: Object.freeze({ da: 1, muele: 1 }),
    // El tope de copias NO sale de su rareza: es la única carta del set con uno
    // propio. Siete en un mazo de 55 es lo que se midió; con cinco el efecto se
    // queda a una décima de cumplir el objetivo del jugador inicial. Las seis
    // comunes gemelas van a 3 por rareza, como todo: el 7 se queda aquí porque
    // es lo que da la colección de salida y lo que los ocho jugadores ya tienen.
    copiasMax: 7,
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Los helechos dominan el registro pol\xEDnico de la Morrison y son la base de la productividad vegetal que sosten\xEDa a los saur\xF3podos. La pradera de helecho se infiere de esa abundancia junto a la escasez de troncos en las llanuras aluviales."
  }),
  araucarias: biomasa({
    id: "araucarias",
    rareza: RAREZA.COMUN,
    binomial: "Bosque de araucarias",
    rasgoNombre: "Bosque de araucarias",
    rasgoTexto: "+1 Biomasa al bajarla. Pierdes 1 carta de tu mazo. Una por turno.",
    biomasa: Object.freeze({ da: 1, muele: 1 }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "La madera f\xF3sil de tipo araucari\xE1ceo y el follaje de Brachyphyllum son de lo m\xE1s abundante del registro vegetal de la Morrison: las con\xEDferas formaban el dosel donde hab\xEDa agua bastante para sostener \xE1rboles."
  }),
  ginkgos: biomasa({
    id: "ginkgos",
    rareza: RAREZA.COMUN,
    binomial: "Arboleda de ginkgos",
    rasgoNombre: "Arboleda de ginkgos",
    rasgoTexto: "+1 Biomasa al bajarla. Pierdes 1 carta de tu mazo. Una por turno.",
    biomasa: Object.freeze({ da: 1, muele: 1 }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Hojas en abanico de tipo Ginkgoites aparecen en la flora de la Morrison, aunque son mucho m\xE1s raras que las con\xEDferas. Que formasen arboledas y no \xE1rboles sueltos se infiere de floras jur\xE1sicas contempor\xE1neas mejor conservadas."
  }),
  cicadas: biomasa({
    id: "cicadas",
    rareza: RAREZA.COMUN,
    binomial: "Matorral de c\xEDcadas",
    rasgoNombre: "Matorral de c\xEDcadas",
    rasgoTexto: "+1 Biomasa al bajarla. Pierdes 1 carta de tu mazo. Una por turno.",
    biomasa: Object.freeze({ da: 1, muele: 1 }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "C\xEDcadas y bennettitales, como Zamites, est\xE1n bien representadas en la Morrison. Son plantas de porte bajo, tronco grueso y hoja r\xEDgida, propias de terreno seco y abierto."
  }),
  equisetos: biomasa({
    id: "equisetos",
    rareza: RAREZA.COMUN,
    binomial: "Juncal de equisetos",
    rasgoNombre: "Juncal de equisetos",
    rasgoTexto: "+1 Biomasa al bajarla. Pierdes 1 carta de tu mazo. Una por turno.",
    biomasa: Object.freeze({ da: 1, muele: 1 }),
    nivel_evidencia: EVIDENCIA.ESTABLECIDO,
    nota_cientifica: "Los equisetos \u2014colas de caballo\u2014 se conservan en la Morrison en posici\xF3n de vida, en los dep\xF3sitos de orilla. Crecen densos y rebrotan r\xE1pido, y se les supone un papel importante en la dieta de los saur\xF3podos."
  }),
  galeria: biomasa({
    id: "galeria",
    rareza: RAREZA.COMUN,
    binomial: "Bosque de galer\xEDa",
    rasgoNombre: "Bosque de galer\xEDa",
    rasgoTexto: "+1 Biomasa al bajarla. Pierdes 1 carta de tu mazo. Una por turno.",
    biomasa: Object.freeze({ da: 1, muele: 1 }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "En una cuenca semi\xE1rida los \xE1rboles se concentran donde hay agua permanente: las franjas de con\xEDferas y helechos arborescentes pegadas a los canales se infieren de la distribuci\xF3n de la madera f\xF3sil y de la sedimentolog\xEDa de los r\xEDos de la Morrison."
  }),
  helechal: biomasa({
    id: "helechal",
    rareza: RAREZA.COMUN,
    binomial: "Helechal arborescente",
    rasgoNombre: "Helechal arborescente",
    rasgoTexto: "+1 Biomasa al bajarla. Pierdes 1 carta de tu mazo. Una por turno.",
    biomasa: Object.freeze({ da: 1, muele: 1 }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Frondas de helecho de tipo Coniopteris y de otras formas afines a los helechos arborescentes actuales aparecen en la Morrison. Que formasen sotobosques cerrados y h\xFAmedos se infiere de sus parientes vivos, que no toleran el sol directo ni la sequ\xEDa."
  }),
  vega: biomasa({
    id: "vega",
    rareza: RAREZA.EPICO,
    binomial: "Vega de aluvi\xF3n",
    rasgoNombre: "Vega de aluvi\xF3n",
    rasgoTexto: "+2 Biomasa al bajarla. Pierdes 2 cartas de tu mazo. Una por turno.",
    biomasa: Object.freeze({ da: 2, muele: 2 }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "Las llanuras de inundaci\xF3n de la Morrison est\xE1n hechas de limo de crecida, y los paleosuelos que conservan muestran ra\xEDces y bioturbaci\xF3n. Un suelo reci\xE9n cubierto por una crecida es lo m\xE1s f\xE9rtil que ofrece la cuenca, y lo primero que rebrota son los helechos."
  }),
  humedal: biomasa({
    id: "humedal",
    rareza: RAREZA.EPICO,
    binomial: "Humedal de tierras bajas",
    rasgoNombre: "Humedal de tierras bajas",
    rasgoTexto: "+2 Biomasa al bajarla. Pierdes 2 cartas de tu mazo. Una por turno.",
    biomasa: Object.freeze({ da: 2, muele: 2 }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "El miembro Brushy Basin conserva dep\xF3sitos de charcas y marismas con carofitas, ostr\xE1codos y restos de plantas acu\xE1ticas. Un humedal en una cuenca seca concentra la vida vegetal y la animal que va detr\xE1s; el yacimiento de Mygatt-Moore se interpreta como uno de ellos."
  }),
  manantial: biomasa({
    id: "manantial",
    rareza: RAREZA.LEGENDARIO,
    binomial: "Manantial perenne",
    rasgoNombre: "Manantial perenne",
    rasgoTexto: "+3 Biomasa al bajarla. Pierdes 3 cartas de tu mazo. Una por turno.",
    biomasa: Object.freeze({ da: 3, muele: 3 }),
    nivel_evidencia: EVIDENCIA.INFERIDO,
    nota_cientifica: "El clima de la Morrison era estacional y semi\xE1rido, con largas secas. Un manantial que no se seca es el sitio m\xE1s raro y m\xE1s rico de una cuenca as\xED: alrededor crece lo que no crece en ninguna otra parte, y hacia \xE9l convergen los animales en la estaci\xF3n seca. Se infiere de los paleosuelos y de las concentraciones de fauna; ninguno est\xE1 identificado como tal."
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
    vida: 8,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Due\xF1o de la llanura",
    rasgoTexto: "Mientras est\xE9 en juego, tus ter\xF3podos ganan +1 de Ataque.",
    mecanica: Object.freeze({ aura: { clado: CLADO.TEROPODO, ataque: 1 } }),
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
    vida: 13,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Cortina de cuellos",
    rasgoTexto: "Mientras est\xE9 en juego, tu h\xE1bitat recibe 1 punto menos de da\xF1o de cada dinosaurio rival.",
    mecanica: Object.freeze({ guardia: { habitat: 1 } }),
    evidencia: "ESTABLECIDO",
    nota: "Diplod\xF3cido de cuello desmesurado incluso para su familia: v\xE9rtebras cervicales alargadas que lo hac\xEDan capaz de ramonear donde ning\xFAn otro saur\xF3podo de la Morrison llegaba.",
    formacion: "Formaci\xF3n Morrison",
    edad: "Kimmeridgiense\u2013Titoniense (~155\u2013150 Ma)"
  }),
  // Los tres de la segunda hornada (15-09-2026), también de la Morrison y
  // ninguno en el set. Verificados en PBDB y GBIF como géneros aceptados.
  jefe_supersaurus: Object.freeze({
    id: "jefe_supersaurus",
    tipo: TIPO.DINOSAURIO,
    clado: CLADO.SAUROPODO,
    rareza: RAREZA.LEGENDARIO,
    binomial: "Supersaurus vivianae",
    coste: 4,
    ataque: 3,
    vida: 14,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sombra del gigante",
    rasgoTexto: "Mientras est\xE9 en juego, tus saur\xF3podos ganan +2 de Vida.",
    mecanica: Object.freeze({ aura: { clado: CLADO.SAUROPODO, vida: 2 } }),
    evidencia: "ESTABLECIDO",
    nota: "Diplod\xF3cido de la Morrison que compite por el t\xEDtulo de dinosaurio m\xE1s largo: m\xE1s de treinta metros estimados a partir de unas v\xE9rtebras y una esc\xE1pula enormes.",
    formacion: "Formaci\xF3n Morrison",
    edad: "Kimmeridgiense\u2013Titoniense (~155\u2013145 Ma)"
  }),
  jefe_hesperosaurus: Object.freeze({
    id: "jefe_hesperosaurus",
    tipo: TIPO.DINOSAURIO,
    clado: CLADO.TIREOFORO,
    rareza: RAREZA.LEGENDARIO,
    binomial: "Hesperosaurus mjosi",
    coste: 4,
    ataque: 3,
    vida: 10,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Muralla viva",
    rasgoTexto: "Devuelve 2 de da\xF1o a quien lo hiera en combate, y mientras est\xE9 en juego tus tire\xF3foros ganan +1 de Vida.",
    mecanica: Object.freeze({ espinas: 2, aura: { clado: CLADO.TIREOFORO, vida: 1 } }),
    evidencia: "ESTABLECIDO",
    nota: "Estegosaurio de Wyoming, algo m\xE1s antiguo que Stegosaurus, con placas m\xE1s bajas y anchas y un cr\xE1neo corto y alto.",
    formacion: "Formaci\xF3n Morrison",
    edad: "Kimmeridgiense (~157\u2013152 Ma)"
  }),
  jefe_harpactognathus: Object.freeze({
    id: "jefe_harpactognathus",
    tipo: TIPO.DINOSAURIO,
    clado: CLADO.PTEROSAURIO,
    rareza: RAREZA.LEGENDARIO,
    binomial: "Harpactognathus gentryii",
    coste: 3,
    ataque: 5,
    vida: 5,
    rasgo: RASGO.NINGUNO,
    rasgoNombre: "Sombra del r\xEDo",
    rasgoTexto: "Cuando entra en juego tu rival pierde 2 cartas del mazo y robas 1.",
    mecanica: Object.freeze({ entrada: { mueleRival: 2, roba: 1 } }),
    evidencia: "INFERIDO",
    nota: "Uno de los mayores pterosaurios de la Morrison, y se conoce s\xF3lo por parte del hocico, con una cresta baja y dientes largos. Todo lo dem\xE1s es reconstrucci\xF3n.",
    formacion: "Formaci\xF3n Morrison",
    edad: "Kimmeridgiense\u2013Titoniense (~152\u2013145 Ma)"
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
  // CUATRO carriles. Eran cinco hasta que se midió el cambio sobre 2.000
  // partidas por variante: los dos cumplen 6 de los 7 objetivos, pero con
  // cuatro la ventaja del que empieza sube de 46,1 a 47,8 —el objetivo que
  // falla, y se acerca—, el reparto de vías se equilibra (trofeos 35,7 → 46,4,
  // hábitat 44,3 → 31,8) y la biomasa ahorrada casi se dobla, de 8,4 a 14,4:
  // con un carril menos guardar es una decisión mucho más frecuente.
  //
  // Se puede medir otro número sin tocar el fichero, igual que la economía y el
  // daño sobrante:
  //   DINOWAR_RANURAS=5 node sim/run.js --out BALANCE_5.md
  //
  // CUIDADO: el navegador no tiene `process`, así que ahí siempre sale el valor
  // de reserva. Poner esta variable en el entorno del SERVIDOR haría que la
  // Edge Function re-jugase con otro campo y rechazara todas las partidas. Es
  // para medir en local y nada más.
  ranuras: Number(
    typeof process !== "undefined" && process.env && process.env.DINOWAR_RANURAS || 4
  ),
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
  // Las cartas de Biomasa. Lo que da cada una y lo que muele van EN LA CARTA
  // (`biomasa: { da, muele }` en cards.js), porque desde que son diez ya no es
  // un número, y `test/textos.test.js` los compara con el texto impreso como
  // hace con las mecánicas de las criaturas. Aquí sólo queda la regla común.
  //
  // Medido sobre 4.000 partidas y dos semillas: con 7 Praderas en un mazo de
  // 55 los trofeos bajan del 60 al 36 % de las victorias y el jugador inicial
  // sube a 48,3 %, que entra en banda por primera vez desde que existe la v2.
  // Con 5 copias se queda en 47,9 % y no entra. Subir la renta en vez de poner
  // la carta NO sirve: da los mismos números y dispara la bola de nieve al
  // 71 %, porque regalar Biomasa acelera a quien va ganando y una carta que
  // ocupa sitio en tu mazo y te cuesta otra, no.
  biomasa: Object.freeze({
    porTurno: 1
    // cuántas puedes bajar en un turno, sean las que sean
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
  // Los clados ya no tienen reglas. Eran dos —+2 del terópodo contra
  // ornitópodos y 2 de púas del tireóforo— y medidas valían unos dos puntos de
  // reparto entre las tres vías de victoria: apagarlas movía 36/43/21 a
  // 38/43/19. El clado sigue en la ficha como CLASIFICACIÓN, que es lo que hace
  // que un Diplodocus y un Barosaurus no sean la misma carta con otra foto, pero
  // no mueve ningún número.
  // Suelo del daño en combate. La Defensa resta daño plano a CADA golpe, así
  // que sin suelo una carta con más Defensa que el Ataque del rival no recibe
  // nada: es inmune, no resistente. Medido, un punto de Defensa llegó a valer
  // 4,8 puntos de Ataque y las cartas ofensivas quedaban muertas. Con el suelo
  // baja a 3,3 y la Vida deja de ser un adorno. Nada es invulnerable.
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
    competenciaVida: 2,
    competenciaObjetivos: 2,
    mortandadDano: 3,
    corazaVida: 2,
    // Bonificaciones que piden compañía. La de Ceratosaurus pide tres en el
    // campo, que con cinco ranuras y tres copias por mazo es el techo: cuando
    // sale, sale entera.
    cazaEnGrupoAtaque: 2,
    cazaEnGrupoMinimo: 3,
    muroDePlacasVida: 1,
    golaVida: 2,
    manadaVida: 1,
    trampaMazoRival: 5,
    trampaMazoPropio: 3,
    // La ronda de las cien cartas: los cinco biomas que fueron clima, como
    // eventos, y un nido. Ninguno señala a nadie: caen sobre la mesa entera.
    sabanaHelechosRoba: 2,
    sabanaHelechosDescarta: 1,
    inundacionMazo: 3,
    // cartas que pierden LOS DOS
    inundacionRoba: 1,
    canalTrenzadoCura: 2,
    bosqueRiberenoMano: 2,
    // cartas que el rival descarta de la mano
    nidoRoba: 2,
    // La ronda del CONTROL. Cinco eventos que no tocan una sola cifra del
    // campo: mueven manos, descartes y mazos. La vía de la extinción llevaba
    // desde la v2 en el 0 % porque casi nada mordía el mazo de enfrente, y la
    // mano no tenía a quién pelearla — el rival robaba dos por turno y jugaba
    // lo que quería. Son la otra mitad del juego, no una ampliación temática.
    tormentaPolvoRoba: 5,
    // los DOS barajan su mano y roban esto
    avenidaLodoTope: 3,
    // cartas que le quedan al rival en la mano
    enterramientoRescata: 2,
    // cartas que vuelven de tu descarte a la mano
    cauceDescarta: 2,
    // de tu MANO, elegidas al azar
    cauceRoba: 3,
    barreraMazo: 4
    // cartas de mazo que pierde el rival, y otras
    // tantas si además tiene más mano que tú
  }),
  // Cartas de recurso: Biomasa inmediata con inconveniente. Atacan el atasco de mano,
  // que venía de robar 2 por turno con una renta de 1 acumulativo.
  recursos: Object.freeze({
    rebroteBiomasa: 2,
    rebroteHeridas: 1,
    carronaBiomasa: 3,
    carronaBiomasaRival: 1,
    lagoBiomasa: 2,
    lagoHabitat: 2,
    insectosBiomasa: 1,
    insectosRoba: 1,
    manadaPasoBiomasa: 2,
    manadaPasoMazo: 3,
    frutosBiomasa: 3,
    frutosRobaRival: 1
  }),
  efectosCampo: Object.freeze({
    // La Sequía dura TRES turnos y muele UNA carta a cada jugador por turno.
    // Con 5 por turno y sin caducar, `sim/climas.js` la medía como un botón
    // de ganar: 100 % de extinciones a 6,4 turnos, cero trofeos, cero
    // hábitat. Bajar la cifra sola no bastaba —a 2 seguía siendo el 78 %—
    // porque lo que rompía era que durase para siempre.
    aridezMazo: 1,
    aridezTurnos: 3,
    // La llanura anegada deja CAMBIAR una carta: la que sueltas va al fondo del
    // mazo y robas la de arriba. Una por turno, cada jugador elige la suya.
    //
    // Sin el robo era una pérdida seca y no la usaba nadie: `sim/climas.js` midió
    // cero devoluciones en 300 partidas y la carta salía IDÉNTICA al control en
    // las seis columnas.
    //
    // Daba +1 de Biomasa a los dos, que es exactamente lo que ahora hace la
    // sabana, y dos cartas idénticas con nombre distinto no son dos cartas.
    // Reciclar es lo único que ningún otro clima hace —los cinco suman o restan
    // números— y apunta a lo que está flojo: la extinción se quedó en el 19 %,
    // cerca del suelo del 15, y devolver cartas alarga los mazos.
    llanuraReciclaPorTurno: 1,
    bosqueCura: 1,
    // El canal y la sabana ya no tocan sólo a los tuyos: como todo clima,
    // valen para los dos bandos por igual.
    canalVida: 1,
    // La sabana da Biomasa a los dos, cada turno, mientras siga en el campo.
    // Fue «+1 al daño contra los biomas» —una constante que se borró y a la que
    // la IA siguió llamando durante un día entero, calculando NaN— y luego +1 de
    // Defensa, que dejó de existir con la Defensa.
    sabanaBiomasa: 1
  }),
  // ------------------------------------------------------------------- mazo
  tamanoMazo: 55,
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
  // Criaturas legendarias que caben en un mazo, CONTADAS ENTRE TODAS. El tope
  // por carta ya es 1, así que sin esto un mazo con la colección entera se
  // lleva las nueve legendarias del set más las de jefe: catorce bombas por
  // 55 cartas, y quien las tenga juega otro juego. Es un tope de FAMILIA y no
  // de rareza —las legendarias de soporte no entran— porque lo que se acumula
  // es el cuerpo: las nueve criaturas suman 57 de Ataque y 63 de Vida.
  //
  // Decisión del autor (16-09-2026). Las de jefe cuentan: son legendarias de
  // criatura como las demás, y ganarlas cooperando no las hace otra cosa.
  legendariasDinoPorMazo: 3,
  // ------------------------------------------------------------- el cuerpo
  //
  // Una carta son DOS cifras: Ataque y Vida. La Defensa existió y se quitó.
  //
  // Era la estadística que peor se leía —una resta plana e invisible contra un
  // número de la OTRA carta— y medida en victorias era la que menos aportaba:
  // +1 de Ataque a todas tus criaturas gana el 70,8 % de las partidas, +1 de
  // Vida el 63,1 % y +1 de Defensa el 59,6 %, sobre un control de 46,8 %.
  // Plegada a Vida 1:1, el juego no se enteró: 12,5 turnos contra 12,6.
  //
  // Con ella se fueron dos reglas que tampoco se deducían de la pantalla: el
  // suelo de daño —que existía sólo para que una Defensa alta no hiciera
  // inmune— y la mitad del misterio de «¿por qué ha hecho 1 y no 5?».
  cuerpo: Object.freeze({
    // El daño que sobra al matar sigue hacia el hábitat rival: si pegas 5 a algo
    // que tenía 3 de Vida, los 2 que sobran pasan. Antes era privilegio del
    // rasgo Depredador dominante.
    //
    // Es lo que cierra el último agujero de legibilidad: ningún número
    // desaparece. Y medido, no cuesta nada — al contrario, deja el reparto entre
    // las tres vías de victoria MÁS parejo que antes (39/32/29 frente a
    // 46/24/31) y acorta las partidas tres décimas de turno.
    //   DINOWAR_SOBRANTE=0 node sim/run.js   para medir sin ello
    sobranteAlHabitat: typeof process !== "undefined" && process.env && process.env.DINOWAR_SOBRANTE === "0" ? false : true
  }),
  // ------------------------------------------- habilidades al entrar en juego
  //
  // CUÁNTO hace cada una lo dice la carta —está en su `mecanica`, en cards.js—
  // porque el mismo efecto sale con números distintos: Suchomimus muele 1 y
  // Spinosaurus 5. Lo que hay aquí es lo OTRO: cuánto vale un punto de cada
  // efecto para la IA que decide si baja la carta.
  //
  // Sin este número la carta no se juega jamás. No es una advertencia teórica:
  // le pasó a la Llanura de inundación, cero usos en 300 partidas hasta que se
  // le puso valor. Toda entrada nueva necesita su peso aquí.
  //
  // Se apagan con DINOWAR_ENTRADAS=0 para poder medir con y sin.
  valorEntrada: Object.freeze({
    roba: 1.4,
    // una carta en la mano vale más que su punto
    emboscada: 1,
    // un punto de daño es un punto
    manoRival: 1.2,
    // quitarle una carta al otro, algo más
    curaHabitat: 1,
    // se multiplica por ia.pesoHabitat al tasarla
    mueleRival: 0.4,
    // acerca la extinción, pero lento
    muelePropio: -0.4,
    // es un COSTE: te la acercas a ti
    fulmina: 3,
    // matar algo del campo sin pelearlo
    // Los cuatro del control de mano. `manoNueva` no vale lo que una carta
    // robada por cada punto: lo que sueltas vuelve al mazo, así que lo que
    // ganas de verdad es la DIFERENCIA con la mano que tenías, y eso la IA no
    // lo sabe al tasar la carta en abstracto. Se le pone poco menos que `roba`
    // y se mide; el peso está para que la carta se juegue, no para afinarla.
    manoNueva: 0.9,
    manosNuevas: 0.5,
    // le das otras tantas al rival: la mitad del valor
    topeManoRival: 1.2,
    // se tasa como manoRival, que es lo que hace
    rescata: 1.3
    // una carta a la mano, y elegida entre lo ya perdido
  }),
  // --------------------------------------------------------------------- IA
  ia: Object.freeze({
    // Con menos mazo que esto, la IA deja de bajar Biomasa. No es afinar su
    // juego: es que la carta muerde tu propio mazo, y sin freno la IA se
    // molería hasta perder por extinción a cambio de un punto de Biomasa. Las
    // partidas medidas acaban con treinta y pico cartas, así que este tope no
    // se toca nunca en juego normal; está para el caso raro.
    mazoDeReserva: 6,
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
    umbralJugar: 0.15,
    // A partir de cuántas cartas de mazo empieza a valer la pena devolver una
    // con la Llanura. Por encima de eso, reciclar es perder el turno.
    // Con el robo, cambiar una carta ya no es perder una, así que la IA lo hace
    // siempre que tenga algo impagable en la mano. El umbral de mazo se queda
    // alto para que no sea gratis del todo cerca del final.
    reciclaDesdeMazo: 45
  })
});
var MAZO = Object.freeze([
  // ------------------------------------------------- la ronda de las cien
  // Rehecho el 13-09-2026 con el set en 101 cartas: el de antes medía un juego
  // de 28 cartas cuando ya había 101. Entran once de la ronda nueva y salen
  // las tres que la IA no jugaba —Sequía 0,53, Bruma 0,00, Competencia 0,00—.
  //
  // Medido sobre 1.000 partidas por candidato, ocho candidatos. Lo que se
  // aprendió: los cuerpos baratos y agresivos (Velociraptor a 0, Kentrosaurus,
  // Pachycephalosaurus) no hunden al jugador inicial más que los grandes, y
  // meter Inundación o Manada de paso para buscar la extinción no la mueve del
  // 0–2 % y deja las dos cartas descalibradas. La Biomasa a 9 copias (5+2+2)
  // frente a 7 no sube al jugador inicial esta vez: 45,2 % con 9 y 46,9 % con
  // 7 en el mazo viejo, que a 1.000 partidas es ruido (±1,6). Cero cartas
  // descalibradas y las vías a 53/47, que el mazo viejo tenía en 36/64.
  //
  // dinosaurios — 28
  ["dryosaurus", 3],
  ["ornitholestes", 2],
  ["ceratosaurus", 2],
  ["stegosaurus", 1],
  ["kentrosaurus", 2],
  ["velociraptor", 2],
  ["allosaurus", 2],
  ["camarasaurus", 1],
  ["amargasaurus", 2],
  ["iguanodon", 2],
  ["pachycephalosaurus", 2],
  ["riparovenator", 1],
  ["lokiceratops", 1],
  ["huaxiadraco", 1],
  ["brachylophosaurus", 1],
  ["diplodocus", 1],
  ["apatosaurus", 1],
  ["tyrannotitan", 1],
  // soporte — 18
  //
  // Un clima solo, el Monzón: sólo cabe uno en el campo. Crecimiento acelerado
  // se queda por ser la legendaria de soporte de la colección de salida: sin
  // ella, una cuenta nueva empezaría con una sola legendaria. Mortandad salió
  // en la última vuelta: con 2.000 partidas medía 0,70 de índice, justo en el
  // borde, y su plaza fue a la segunda Sabana de helechos.
  ["gregarismo", 2],
  ["trampa", 2],
  ["rebrote", 2],
  ["nido", 2],
  ["sabana_helechos", 2],
  ["insectos", 2],
  ["fractura", 2],
  ["gastrolitos", 1],
  ["crecimiento_acelerado", 1],
  ["sabana", 1],
  ["canal_trenzado", 1],
  // biomasa — 9
  //
  // Tres cartas distintas y no siete Praderas: la colección de salida es este
  // mazo, y así una cuenta nueva ve que la Biomasa es una familia.
  ["biomasa", 5],
  ["araucarias", 2],
  ["cicadas", 2]
].map((e) => Object.freeze(e)));
var TOTAL_MAZO = MAZO.reduce((n, [, copias]) => n + copias, 0);
for (const [cardId, copias] of MAZO) {
  const c = CARTAS[cardId];
  if (!c) throw new Error(`MAZO: la carta "${cardId}" no existe`);
  const tope = c.copiasMax ?? BALANCE.copiasPorRareza[c.rareza];
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
  MORTANDAD: "MORTANDAD",
  // Daño de una habilidad al entrar en juego.
  ENTRADA: "ENTRADA"
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
      // Cartas devueltas al mazo este turno; lo permite la Llanura de inundación.
      recicladasEsteTurno: 0,
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
    // Turnos que le quedan al clima puesto; null si no caduca.
    campoTurnos: null,
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
var mecanicaDe = (cardId) => carta(cardId).mecanica ?? null;
function cuantasCuentan(state, inst, cuenta) {
  const c = carta(inst.cardId);
  let n = 0;
  if (esZona(cuenta.que)) {
    const jug = state.jugadores[inst.dueno];
    if (cuenta.que === QUE.MANO) n = jug.mano.length;
    else if (cuenta.que === QUE.MANO_RIVAL) n = state.jugadores[rival(inst.dueno)].mano.length;
    else n = jug.descarte.length;
  } else {
    const bandos = cuenta.ambos ? [0, 1] : [inst.dueno];
    for (const b of bandos) {
      for (const o of unidadesDe(state, b)) {
        const oc = carta(o.cardId);
        if (cuenta.que === QUE.CLADO ? oc.clado === c.clado : o.cardId === inst.cardId) n += 1;
      }
    }
  }
  if (cuenta.cada) n = Math.floor(n / cuenta.cada);
  if (cuenta.tope !== void 0) n = Math.min(n, cuenta.tope);
  return n;
}
function seCumple(state, inst, si) {
  if (si.cuando === CUANDO.CLIMA) return state.campo !== null;
  if (si.cuando === CUANDO.HABITAT_DETRAS) {
    return state.jugadores[inst.dueno].habitat < state.jugadores[rival(inst.dueno)].habitat;
  }
  if (si.cuando === CUANDO.ALIADO_CON_VIDA) {
    return unidadesDe(state, inst.dueno).some((o) => o.iid !== inst.iid && carta(o.cardId).vida > si.umbral);
  }
  return false;
}
function aurasSobre(state, inst) {
  const c = carta(inst.cardId);
  let ataque = 0;
  let vida = 0;
  for (const o of unidadesDe(state, inst.dueno)) {
    const a = mecanicaDe(o.cardId)?.aura;
    if (!a || a.clado !== TODOS && a.clado !== c.clado) continue;
    ataque += a.ataque ?? 0;
    vida += a.vida ?? 0;
  }
  return { ataque, vida };
}
function inmuneA(state, iid, que) {
  const inst = state.instancias[iid];
  if (mecanicaDe(inst.cardId)?.inmune === que) return true;
  return unidadesDe(state, inst.dueno).some((o) => mecanicaDe(o.cardId)?.aura?.inmune === que);
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
  const m = mecanicaDe(inst.cardId);
  if (m?.cuenta?.ataque) poder += m.cuenta.ataque * cuantasCuentan(state, inst, m.cuenta);
  if (m?.si?.ataque && seCumple(state, inst, m.si)) poder += m.si.ataque;
  poder += aurasSobre(state, inst).ataque;
  return Math.max(0, poder);
}
function vidaMaxima(state, iid) {
  const inst = state.instancias[iid];
  const c = carta(inst.cardId);
  let v = c.vida + inst.modVida;
  if (campoEs(state, RASGO.CAMPO_CANAL) && !inmuneA(state, iid, INMUNE.CLIMA)) {
    v += BALANCE.efectosCampo.canalVida;
  }
  if (c.rasgo === RASGO.CORAZA) v += BALANCE.rasgos.corazaVida;
  if (c.rasgo === RASGO.MURO_DE_PLACAS && conCompa\u00F1\u00EDa(state, inst, 1)) {
    v += BALANCE.rasgos.muroDePlacasVida;
  }
  if (c.rasgo === RASGO.GOLA && conCompa\u00F1\u00EDa(state, inst, 1)) v += BALANCE.rasgos.golaVida;
  if (c.rasgo === RASGO.MANADA && delClado(state, inst, c.clado, 1)) {
    v += BALANCE.rasgos.manadaVida;
  }
  const m = mecanicaDe(inst.cardId);
  if (m?.cuenta?.vida) v += m.cuenta.vida * cuantasCuentan(state, inst, m.cuenta);
  if (m?.si?.vida && seCumple(state, inst, m.si)) v += m.si.vida;
  v += aurasSobre(state, inst).vida;
  return Math.max(0, v);
}
var vidaActual = (state, iid) => vidaMaxima(state, iid) - state.instancias[iid].heridas;
function conCompa\u00F1\u00EDa(state, inst, min) {
  const n = unidadesDe(state, inst.dueno).filter((o) => o.iid !== inst.iid && o.cardId === inst.cardId).length;
  return n >= min;
}
function delClado(state, inst, clado, min) {
  const n = unidadesDe(state, inst.dueno).filter((o) => o.iid !== inst.iid && carta(o.cardId).clado === clado).length;
  return n >= min;
}
function espinasDe(state, iid) {
  return mecanicaDe(state.instancias[iid].cardId)?.espinas ?? 0;
}
function danoEntre(state, atacanteIid) {
  return Math.max(0, ataqueEfectivo(state, atacanteIid));
}
function puedeReciclar(state, j) {
  if (!campoEs(state, RASGO.CAMPO_LLANURA)) return false;
  const jug = state.jugadores[j];
  return jug.recicladasEsteTurno < BALANCE.efectosCampo.llanuraReciclaPorTurno;
}
function guardiaDe(state, bando) {
  let n = 0;
  for (const u of unidadesDe(state, bando)) n += mecanicaDe(u.cardId)?.guardia?.habitat ?? 0;
  return n;
}
function danoAlHabitat(state, iid, defensor = null) {
  const bruto = ataqueEfectivo(state, iid);
  if (defensor === null) return bruto;
  return Math.max(0, bruto - guardiaDe(state, defensor));
}
var vuela = (state, iid) => carta(state.instancias[iid].cardId).rasgo === RASGO.VUELO;
var hayAridez = (state) => campoEs(state, RASGO.CAMPO_ARIDEZ);
function rentaDe(state) {
  const extra = campoEs(state, RASGO.CAMPO_SABANA) ? BALANCE.efectosCampo.sabanaBiomasa : 0;
  return BALANCE.rentaPorTurno + extra;
}
function curacionDe(state, iid) {
  const inst = state.instancias[iid];
  const c = carta(inst.cardId);
  let cura = 0;
  if (c.rasgo === RASGO.RAMONEO_BAJO) cura += BALANCE.rasgos.ramoneoBajoCura;
  cura += adherenciasCon(state, inst, RASGO.GASTROLITOS) * BALANCE.rasgos.gastrolitosCura;
  if (campoEs(state, RASGO.CAMPO_BOSQUE) && c.clado === CLADO.SAUROPODO && !inmuneA(state, iid, INMUNE.CLIMA)) {
    cura += BALANCE.efectosCampo.bosqueCura;
  }
  cura += mecanicaDe(inst.cardId)?.regenera?.propia ?? 0;
  for (const o of unidadesDe(state, inst.dueno)) {
    cura += mecanicaDe(o.cardId)?.regenera?.aliados ?? 0;
  }
  return cura;
}
var NOTA_CUENTA = Object.freeze({
  [QUE.CLADO]: (n) => `${n} de su clado en el campo`,
  [QUE.MISMA]: (n) => `${n} en el campo`,
  [QUE.MANO]: (n, cuenta) => cuenta.cada ? `${n} tramos de ${cuenta.cada} en tu mano` : `${n} en tu mano`,
  [QUE.MANO_RIVAL]: (n, cuenta) => cuenta.cada ? `${n} tramos de ${cuenta.cada} en la mano rival` : `${n} en la mano rival`,
  [QUE.DESCARTE]: (n, cuenta) => cuenta.cada ? `${n} tramos de ${cuenta.cada} en tu descarte` : `${n} en tu descarte`
});
var NOTA_SI = Object.freeze({
  [CUANDO.CLIMA]: "hay un clima en el campo",
  [CUANDO.ALIADO_CON_VIDA]: "tiene al lado a uno grande",
  [CUANDO.HABITAT_DETRAS]: "tu h\xE1bitat va por detr\xE1s"
});
function buscablesDe(state, jugador, cardId) {
  const filtro = filtroDeBusqueda(cardId);
  if (!filtro) return [];
  return state.jugadores[jugador].mazo.filter((iid) => filtro(carta(state.instancias[iid].cardId)));
}
var buscaEnElMazo = (cardId) => filtroDeBusqueda(cardId) !== null;
function filtroDeBusqueda(cardId) {
  const busca = mecanicaDe(cardId)?.busca;
  if (!busca) return null;
  if (typeof busca === "object") {
    return (c) => c.tipo === TIPO.DINOSAURIO && (busca.ataqueMin === void 0 || c.ataque >= busca.ataqueMin) && (busca.ataqueMax === void 0 || c.ataque <= busca.ataqueMax);
  }
  if (busca === QUE.EVENTO) return (c) => c.tipo === TIPO.EVENTO;
  if (busca === QUE.CLIMA) return (c) => c.tipo === TIPO.CLIMA;
  if (busca === QUE.MISMA) return (c) => c.id === cardId;
  return (c) => c.tipo === TIPO.DINOSAURIO && c.clado === busca;
}
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

// src/engine/entradas.js
var HAY_ENTRADAS = !(typeof process !== "undefined" && process.env && process.env.DINOWAR_ENTRADAS === "0");
var EFECTOS = Object.freeze([
  "roba",
  "muelePropio",
  "mueleRival",
  "manoRival",
  "curaHabitat",
  "emboscada",
  "fulmina",
  // Los cuatro del control de mano. Los tres primeros mueven manos enteras y
  // el cuarto va al descarte a por lo que ya se perdió, que es lo que hace que
  // molerte a ti mismo deje de ser sólo un coste.
  "manoNueva",
  "manosNuevas",
  "topeManoRival",
  "rescata"
]);
var entradaDe = (cardId) => mecanicaDe(cardId)?.entrada ?? null;
function valorDeEntrada(cardId) {
  if (!HAY_ENTRADAS) return 0;
  const e = entradaDe(cardId);
  if (!e) return 0;
  const V = BALANCE.valorEntrada;
  let valor = 0;
  for (const efecto of EFECTOS) {
    if (efecto === "topeManoRival") {
      const tope = e.topeManoRival;
      if (tope === void 0) continue;
      valor += Math.max(0, BALANCE.manoInicial - tope) * V.topeManoRival;
      continue;
    }
    const n = e[efecto] ?? 0;
    if (n === 0) continue;
    const peso = efecto === "curaHabitat" ? V.curaHabitat * BALANCE.ia.pesoHabitat : V[efecto];
    valor += n * peso;
  }
  return valor;
}
function alEntrar(s, inst, ayudas) {
  if (!HAY_ENTRADAS) return;
  const e = entradaDe(inst.cardId);
  if (!e) return;
  const { ev: ev2, herir: herir2, rival: rival3, unidadEn: unidadEn2, unidadesDe: unidadesDe2, CAUSA: CAUSA2, vidaActual: vidaActual2 } = ayudas;
  const j = inst.dueno;
  const contrario = rival3(j);
  const jug = s.jugadores[j];
  const otro = s.jugadores[contrario];
  const contar = (efecto, n) => ev2(s, "ENTRADA", {
    iid: inst.iid,
    cardId: inst.cardId,
    dueno: j,
    efecto,
    n
  });
  const moler = (quien, cuantas) => {
    let molidas = 0;
    for (let k = 0; k < cuantas && quien.mazo.length > 0; k++) {
      quien.descarte.push(quien.mazo.shift());
      molidas += 1;
    }
    return molidas;
  };
  const manoNuevaDe = (quien, cuantas) => {
    quien.mazo.push(...quien.mano);
    quien.mano = [];
    const b = barajar(quien.mazo, s.rng);
    s.rng = b.rng;
    quien.mazo = b.lista;
    let robadas = 0;
    for (let k = 0; k < cuantas && quien.mazo.length > 0; k++) {
      quien.mano.push(quien.mazo.shift());
      robadas += 1;
    }
    return robadas;
  };
  const recortarMano = (quien, tope) => {
    let quitadas = 0;
    while (quien.mano.length > tope) {
      const d = entero(s.rng, quien.mano.length);
      s.rng = d.rng;
      quien.descarte.push(quien.mano.splice(d.valor, 1)[0]);
      quitadas += 1;
    }
    return quitadas;
  };
  const rescatar = (quien, cuantas) => {
    let sacadas = 0;
    for (let k = 0; k < cuantas && quien.descarte.length > 0; k++) {
      const d = entero(s.rng, quien.descarte.length);
      s.rng = d.rng;
      quien.mano.push(quien.descarte.splice(d.valor, 1)[0]);
      sacadas += 1;
    }
    return sacadas;
  };
  if (e.roba) {
    let robadas = 0;
    for (let k = 0; k < e.roba && jug.mazo.length > 0; k++) {
      jug.mano.push(jug.mazo.shift());
      robadas += 1;
    }
    contar("roba", robadas);
  }
  if (e.mueleRival) contar("muele", moler(otro, e.mueleRival));
  if (e.muelePropio) contar("muelePropio", moler(jug, e.muelePropio));
  if (e.manosNuevas) {
    contar("manosNuevas", manoNuevaDe(otro, e.manosNuevas));
    contar("manoNueva", manoNuevaDe(jug, e.manosNuevas));
  }
  if (e.manoNueva) contar("manoNueva", manoNuevaDe(jug, e.manoNueva));
  if (e.topeManoRival !== void 0) {
    contar("topeManoRival", recortarMano(otro, e.topeManoRival));
  }
  if (e.rescata) contar("rescata", rescatar(jug, e.rescata));
  if (e.manoRival) {
    let quitadas = 0;
    for (let k = 0; k < e.manoRival && otro.mano.length > 0; k++) {
      const d = entero(s.rng, otro.mano.length);
      s.rng = d.rng;
      otro.descarte.push(otro.mano.splice(d.valor, 1)[0]);
      quitadas += 1;
    }
    contar("manoRival", quitadas);
  }
  if (e.curaHabitat) {
    const antes = jug.habitat;
    jug.habitat = Math.min(BALANCE.vidaHabitat, jug.habitat + e.curaHabitat);
    contar("curaHabitat", jug.habitat - antes);
  }
  if (e.emboscada) {
    const enfrente = unidadEn2(s, contrario, inst.ranura);
    if (enfrente) herir2(s, enfrente.iid, e.emboscada, CAUSA2.ENTRADA, j);
    contar("emboscada", enfrente ? e.emboscada : 0);
  }
  if (e.fulmina) {
    const candidatos = unidadesDe2(s, contrario).filter((u) => vidaActual2(s, u.iid) <= e.fulmina).sort((a, b) => ataqueDe(s, b) - ataqueDe(s, a) || a.iid - b.iid);
    const victima = candidatos[0] ?? null;
    if (victima) {
      s.ranuras[contrario][victima.ranura] = null;
      victima.ranura = null;
      otro.descarte.push(victima.iid);
    }
    ev2(s, "ENTRADA", {
      iid: inst.iid,
      cardId: inst.cardId,
      dueno: j,
      efecto: "fulmina",
      n: victima ? 1 : 0,
      objetivo: victima ? victima.iid : null,
      objetivoCardId: victima ? victima.cardId : null
    });
  }
}
var ataqueDe = (s, inst) => carta(inst.cardId).ataque + inst.modAtaque;

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
  anzu: OMNIVORO,
  // cenagnátido: mismo caso que los otros dos
  // Los dos ornitomimosaurios. El pico sin dientes de Gallimimus lleva surcos
  // que se leen como láminas de filtración, y a Deinocheirus se le encontraron
  // gastrolitos Y restos de pez en la misma cavidad abdominal: los dos comían
  // de los dos lados, y es lo mejor documentado de todo este eje.
  gallimimus: OMNIVORO,
  deinocheirus: OMNIVORO,
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
function marcar(inst, cardId, ataque, vida) {
  const previo = inst.marcas.find((m) => m.cardId === cardId);
  if (previo) {
    previo.ataque += ataque;
    previo.vida += vida;
    previo.veces += 1;
    return;
  }
  inst.marcas.push({ cardId, ataque, vida, veces: 1 });
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
  for (const jug of s.jugadores) {
    jug.biomasaJugadaEsteTurno = 0;
    jug.recicladasEsteTurno = 0;
  }
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
  if (s.campo !== null && s.campoTurnos !== null) {
    s.campoTurnos -= 1;
    if (s.campoTurnos <= 0) {
      const cardId = s.campo;
      s.jugadores[s.campoDe].descarte.push(s.campoIid);
      ev(s, "CAMPO_FIN", { jugador: s.campoDe, cardId });
      s.campo = null;
      s.campoIid = null;
      s.campoDe = null;
      s.campoTurnos = null;
    }
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
      alEntrar(s, inst, { ev, herir, rival, unidadEn, unidadesDe, CAUSA, vidaActual });
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
      s.campoTurnos = carta(inst.cardId).duracion ?? null;
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
  aplicarUmbrales(s);
  recogerBajas(s, CAUSA.MORTANDAD);
  s.fase = FASE.COMBATE;
}
function aplicarUmbrales(s) {
  for (const inst of todasLasUnidades(s)) {
    const trio = mecanicaDe(inst.cardId)?.trio;
    if (!trio) continue;
    if (inst.marcas.some((m) => m.cardId === inst.cardId)) continue;
    const suyos = unidadesDe(s, inst.dueno).filter((o) => o.cardId === inst.cardId).length;
    if (suyos < trio.copias) continue;
    inst.modAtaque += trio.ataque ?? 0;
    inst.modVida += trio.vida ?? 0;
    marcar(inst, inst.cardId, trio.ataque ?? 0, trio.vida ?? 0);
    ev(s, "UMBRAL", {
      iid: inst.iid,
      dueno: inst.dueno,
      cardId: inst.cardId,
      ataque: trio.ataque ?? 0,
      vida: trio.vida ?? 0
    });
  }
}
function aplicarPresion(s, p) {
  const cardId = s.instancias[p.iid].cardId;
  const r = carta(cardId).rasgo;
  const contrario = rival(p.jugador);
  const alcanzable = (iid) => {
    const o = s.instancias[iid];
    return o && o.ranura !== null && !inmuneA(s, iid, "EVENTO");
  };
  if (r === RASGO.FRACTURA) {
    const objetivo = s.instancias[p.objetivo];
    if (!objetivo || !alcanzable(p.objetivo)) return;
    objetivo.modAtaque -= BALANCE.rasgos.fracturaAtaque;
    marcar(objetivo, cardId, -BALANCE.rasgos.fracturaAtaque, 0);
    ev(s, "PRESION", { jugador: p.jugador, cardId, objetivo: objetivo.iid, objetivoCardId: objetivo.cardId });
  } else if (r === RASGO.COMPETENCIA) {
    let n = 0;
    for (const oid of p.objetivos ?? []) {
      const inst = s.instancias[oid];
      if (!inst || !alcanzable(oid) || inst.dueno !== contrario) continue;
      inst.modVida -= BALANCE.rasgos.competenciaVida;
      marcar(inst, cardId, 0, -BALANCE.rasgos.competenciaVida);
      n += 1;
    }
    ev(s, "PRESION", { jugador: p.jugador, cardId, objetivos: p.objetivos ?? [], afectados: n });
  } else if (r === RASGO.TRAMPA) {
    perderDelMazo(s, contrario, BALANCE.rasgos.trampaMazoRival);
    perderDelMazo(s, p.jugador, BALANCE.rasgos.trampaMazoPropio);
    ev(s, "PRESION", { jugador: p.jugador, cardId });
  } else if (r === RASGO.MORTANDAD) {
    for (const inst of todasLasUnidades(s)) {
      if (inst.dueno === contrario && !alcanzable(inst.iid)) continue;
      herir(s, inst.iid, BALANCE.rasgos.mortandadDano, CAUSA.MORTANDAD, p.jugador);
    }
    ev(s, "PRESION", { jugador: p.jugador, cardId });
  } else if (r === RASGO.SABANA_HELECHOS) {
    robar(s, p.jugador, BALANCE.rasgos.sabanaHelechosRoba);
    descartarAlAzar(s, p.jugador, BALANCE.rasgos.sabanaHelechosDescarta);
    ev(s, "PRESION", { jugador: p.jugador, cardId });
  } else if (r === RASGO.INUNDACION) {
    perderDelMazo(s, contrario, BALANCE.rasgos.inundacionMazo);
    perderDelMazo(s, p.jugador, BALANCE.rasgos.inundacionMazo);
    robar(s, p.jugador, BALANCE.rasgos.inundacionRoba);
    ev(s, "PRESION", { jugador: p.jugador, cardId });
  } else if (r === RASGO.CANAL_TRENZADO) {
    for (const inst of unidadesDe(s, p.jugador)) {
      inst.heridas = Math.max(0, inst.heridas - BALANCE.rasgos.canalTrenzadoCura);
    }
    ev(s, "PRESION", { jugador: p.jugador, cardId });
  } else if (r === RASGO.BOSQUE_RIBERENO) {
    descartarAlAzar(s, contrario, BALANCE.rasgos.bosqueRiberenoMano);
    ev(s, "PRESION", { jugador: p.jugador, cardId });
  } else if (r === RASGO.DERIVA_ARIDA) {
    for (const j of [contrario, p.jugador]) {
      const jug = s.jugadores[j];
      const n = jug.mano.length;
      jug.descarte.push(...jug.mano);
      jug.mano = [];
      robar(s, j, n);
    }
    ev(s, "PRESION", { jugador: p.jugador, cardId });
  } else if (r === RASGO.NIDO) {
    robar(s, p.jugador, BALANCE.rasgos.nidoRoba);
    ev(s, "PRESION", { jugador: p.jugador, cardId });
  } else if (r === RASGO.TORMENTA_POLVO) {
    for (const j of [contrario, p.jugador]) manoNueva(s, j, BALANCE.rasgos.tormentaPolvoRoba);
    ev(s, "PRESION", { jugador: p.jugador, cardId });
  } else if (r === RASGO.AVENIDA_LODO) {
    const tope = BALANCE.rasgos.avenidaLodoTope;
    descartarAlAzar(s, contrario, Math.max(0, s.jugadores[contrario].mano.length - tope));
    ev(s, "PRESION", { jugador: p.jugador, cardId });
  } else if (r === RASGO.ENTERRAMIENTO) {
    rescatarDelDescarte(s, p.jugador, BALANCE.rasgos.enterramientoRescata);
    ev(s, "PRESION", { jugador: p.jugador, cardId });
  } else if (r === RASGO.CAUCE_ABANDONADO) {
    descartarAlAzar(s, p.jugador, BALANCE.rasgos.cauceDescarta);
    robar(s, p.jugador, BALANCE.rasgos.cauceRoba);
    ev(s, "PRESION", { jugador: p.jugador, cardId });
  } else if (r === RASGO.BARRERA_TRONCOS) {
    const mia = s.jugadores[p.jugador].mano.filter((iid) => iid !== p.iid).length;
    const doble = s.jugadores[contrario].mano.length > mia;
    perderDelMazo(s, contrario, BALANCE.rasgos.barreraMazo * (doble ? 2 : 1));
    ev(s, "PRESION", { jugador: p.jugador, cardId, doble });
  }
}
function manoNueva(s, j, cuantas) {
  const jug = s.jugadores[j];
  const antes = jug.mano.length;
  jug.mazo.push(...jug.mano);
  jug.mano = [];
  const b = barajar(jug.mazo, s.rng);
  s.rng = b.rng;
  jug.mazo = b.lista;
  for (let k = 0; k < cuantas && jug.mazo.length > 0; k++) jug.mano.push(jug.mazo.shift());
  ev(s, "MANO_NUEVA", { jugador: j, antes, ahora: jug.mano.length });
}
function rescatarDelDescarte(s, j, cuantas) {
  const jug = s.jugadores[j];
  let sacadas = 0;
  for (let k = 0; k < cuantas && jug.descarte.length > 0; k++) {
    const d = entero(s.rng, jug.descarte.length);
    s.rng = d.rng;
    jug.mano.push(jug.descarte.splice(d.valor, 1)[0]);
    sacadas += 1;
  }
  ev(s, "RESCATE", { jugador: j, cartas: sacadas, descarte: jug.descarte.length });
}
function descartarAlAzar(s, j, n) {
  const jug = s.jugadores[j];
  let quitadas = 0;
  for (let k = 0; k < n && jug.mano.length > 0; k++) {
    const d = entero(s.rng, jug.mano.length);
    s.rng = d.rng;
    jug.descarte.push(jug.mano.splice(d.valor, 1)[0]);
    quitadas += 1;
  }
  return quitadas;
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
        const d = danoAlHabitat(s, uno.iid, rival(bando));
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
      const dobla = (uno) => carta(uno.cardId).rasgo === RASGO.DEPREDADOR_DOMINANTE ? 2 : 1;
      const sobraA = Math.max(0, dA - vidaActual(s, b.iid));
      const sobraB = Math.max(0, dB - vidaActual(s, a.iid));
      if (BALANCE.cuerpo.sobranteAlHabitat) {
        alHabitat[1] += Math.max(0, sobraA * dobla(a) - guardiaDe(s, 1));
        alHabitat[0] += Math.max(0, sobraB * dobla(b) - guardiaDe(s, 0));
      }
      ev(s, "CHOQUE", { ranura: r, a: a.iid, b: b.iid, danoA: dA, danoB: dB });
    } else if (a) {
      const d = danoAlHabitat(s, a.iid, 1);
      alHabitat[1] += d;
      ev(s, "AVANCE", { ranura: r, iid: a.iid, bando: 0, dano: d });
    } else if (b) {
      const d = danoAlHabitat(s, b.iid, 0);
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
var topeDeBiomasa = () => modoActual() === MODO.CARTAS ? BALANCE.economia.cartas.porTurno : BALANCE.biomasa.porTurno;
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
  // Devolver una carta de la mano al fondo del mazo. Sólo con la Llanura de
  // inundación en el campo, una vez por turno y por jugador.
  RECICLAR: "RECICLAR",
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
  if (a.tipo === ACCION.RECICLAR) {
    if (!puedeReciclar(s, a.jugador)) {
      return campoEs(s, RASGO.CAMPO_LLANURA) ? "ya has devuelto tu carta de este turno" : "hace falta la Llanura de inundaci\xF3n en el campo";
    }
    return null;
  }
  if (a.tipo === ACCION.BIOMASA) {
    if (!esCartaDeBiomasa(inst.cardId)) return "esa carta no da Biomasa";
    if (jug.biomasaJugadaEsteTurno >= topeDeBiomasa()) {
      return "ya has bajado tu Biomasa de este turno";
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
      const extra = mecanicaDe(inst.cardId)?.costeExtra;
      if (extra?.descartar) {
        const dan = a.descartes ?? [];
        if (!Array.isArray(dan) || dan.length !== extra.descartar) {
          return `esta carta pide descartar ${extra.descartar} cartas de tu mano`;
        }
        if (new Set(dan).size !== dan.length) return "no puedes descartar dos veces la misma";
        for (const did of dan) {
          if (did === a.iid) return "no puedes pagarla con ella misma";
          if (!jug.mano.includes(did)) return "esa carta no est\xE1 en tu mano";
        }
      }
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
        if (inmuneA(s, a.objetivo, INMUNE.EVENTO)) return "a \xE9se no le afectan tus eventos";
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
          if (inmuneA(s, oid, INMUNE.EVENTO)) return "a \xE9se no le afectan tus eventos";
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
  } else if (r === RASGO.INSECTOS) {
    jug.biomasa += P.insectosBiomasa;
    robar(s, j, P.insectosRoba);
  } else if (r === RASGO.MANADA_PASO) {
    jug.biomasa += P.manadaPasoBiomasa;
    perderDelMazo(s, j, P.manadaPasoMazo);
  } else if (r === RASGO.FRUTOS) {
    jug.biomasa += P.frutosBiomasa;
    robar(s, rival(j), P.frutosRobaRival);
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
      const enCartas = modoActual() === MODO.CARTAS;
      const da = enCartas ? BALANCE.economia.cartas.valor : carta(cardId).biomasa.da;
      const muele = enCartas ? 0 : carta(cardId).biomasa.muele;
      jug.mano = jug.mano.filter((x) => x !== action.iid);
      jug.descarte.push(action.iid);
      jug.biomasaJugadaEsteTurno += 1;
      ingresar(jug, da, dietaDeCarta(cardId) ?? DIETA.HERBIVORO);
      ev(s, "BIOMASA", { jugador: action.jugador, cardId, biomasa: jug.biomasa, muele });
      if (muele > 0) perderDelMazo(s, action.jugador, muele);
      break;
    }
    // Declarar qué se produce el turno que viene (modo TIPADA). No cuesta nada
    // y no se ve: es la parte de la economía que también se juega a ciegas.
    case ACCION.PRODUCIR:
      jug.produccion = action.produccion === DIETA.CARNIVORO ? DIETA.CARNIVORO : DIETA.HERBIVORO;
      ev(s, "PRODUCCION", { jugador: action.jugador, produccion: jug.produccion });
      break;
    case ACCION.DESPLEGAR: {
      pagar(jug, s.instancias[action.iid].cardId);
      jug.mano = jug.mano.filter((x) => x !== action.iid);
      jug.pendientes.push({ tipo: "DESPLIEGUE", iid: action.iid, ranura: action.ranura });
      const extra = mecanicaDe(s.instancias[action.iid].cardId)?.costeExtra;
      if (extra?.descartar) {
        for (const did of action.descartes ?? []) descartarDeMano(s, action.jugador, did);
        ev(s, "COSTE_EXTRA", {
          jugador: action.jugador,
          cardId: s.instancias[action.iid].cardId,
          cartas: extra.descartar
        });
      }
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
    }
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
    // Devuelve una y ROBA una. Sin el robo era una pérdida seca —la carta salía
    // de la mano, iba al fondo de veinte y no volvía— y medido no la usaba
    // nadie: cero devoluciones en 300 partidas. Con el robo deja de ser
    // «pierdes una carta» y pasa a ser «cambias la que no puedes pagar».
    //
    // Al FONDO, no arriba: arriba te devolvería la misma que acabas de soltar.
    // Y el robo va DESPUÉS de meterla, para que en un mazo de una carta te
    // lleves la tuya y no se quede el mazo vacío.
    case ACCION.RECICLAR: {
      const cardId = s.instancias[action.iid].cardId;
      jug.mano = jug.mano.filter((x) => x !== action.iid);
      jug.mazo.push(action.iid);
      jug.recicladasEsteTurno += 1;
      const robada = jug.mazo.shift() ?? null;
      if (robada !== null) jug.mano.push(robada);
      ev(s, "RECICLA", { jugador: action.jugador, iid: action.iid, cardId, robada });
      break;
    }
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
function pagoExtra(s, j, cardId, iid) {
  const extra = mecanicaDe(cardId)?.costeExtra;
  if (!extra?.descartar) return void 0;
  const resto = s.jugadores[j].mano.filter((x) => x !== iid);
  if (resto.length < extra.descartar) return null;
  return resto.sort((a, b) => carta(s.instancias[a].cardId).coste - carta(s.instancias[b].cardId).coste || a - b).slice(0, extra.descartar);
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
  if (puedeReciclar(s, j)) {
    for (const iid of jug.mano) salida.push({ tipo: ACCION.RECICLAR, jugador: j, iid });
  }
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
  const ajenas = unidadesDe(s, rival(j)).filter((u) => !inmuneA(s, u.iid, INMUNE.EVENTO)).map((u) => u.iid);
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
      const descartes = pagoExtra(s, j, s.instancias[iid].cardId, iid);
      if (descartes === null) continue;
      for (const r of libres) {
        salida.push({ tipo: ACCION.DESPLEGAR, jugador: j, iid, ranura: r, busca, descartes });
      }
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
  return poder + pasivoHipotetico(vista, j, cardId).ataque;
}
function pasivoHipotetico(vista, j, cardId) {
  const c = carta(cardId);
  const m = mecanicaDe(cardId);
  let ataque = 0;
  let vida = 0;
  if (!m) return { ataque, vida };
  if (m.cuenta) {
    const bandos = m.cuenta.ambos ? [0, 1] : [j];
    let n = 1;
    for (const b of bandos) {
      for (const u of unidadesDe(vista, b)) {
        const uc = carta(u.cardId);
        if (m.cuenta.que === QUE.CLADO ? uc.clado === c.clado : u.cardId === cardId) n += 1;
      }
    }
    ataque += n * (m.cuenta.ataque ?? 0);
    vida += n * (m.cuenta.vida ?? 0);
  }
  if (m.si) {
    const jug = vista.jugadores[j];
    const otro = vista.jugadores[rival(j)];
    const vale = m.si.cuando === CUANDO.CLIMA ? vista.campo !== null : m.si.cuando === CUANDO.HABITAT_DETRAS ? jug.habitat < otro.habitat : unidadesDe(vista, j).some((u) => carta(u.cardId).vida > m.si.umbral);
    if (vale) {
      ataque += m.si.ataque ?? 0;
      vida += m.si.vida ?? 0;
    }
  }
  if (m.aura && (m.aura.clado === TODOS || m.aura.clado === c.clado)) {
    ataque += m.aura.ataque ?? 0;
    vida += m.aura.vida ?? 0;
  }
  for (const u of unidadesDe(vista, j)) {
    const a = mecanicaDe(u.cardId)?.aura;
    if (!a || a.clado !== TODOS && a.clado !== c.clado) continue;
    ataque += a.ataque ?? 0;
    vida += a.vida ?? 0;
  }
  return { ataque, vida };
}
var espinasHipoteticas = (cardId) => mecanicaDe(cardId)?.espinas ?? 0;
var bonusTrofico = () => 0;
function mazoDe(vista, j) {
  const m = vista.jugadores[j].mazo;
  return typeof m === "number" ? m : m.length;
}
function valorEnRanura(vista, j, ranura, mio) {
  const b = unidadEn(vista, rival(j), ranura);
  if (!b) {
    const turnos2 = 1 + (IA.horizonte - 1) * 0.5;
    return mio.poder * IA.pesoHabitat * turnos2;
  }
  if (mio.vuela) {
    const turnos2 = 1 + (IA.horizonte - 1) * 0.5;
    return mio.poder * IA.pesoHabitat * turnos2;
  }
  if (vuela(vista, b.iid)) {
    const turnos2 = 1 + (IA.horizonte - 1) * 0.5;
    return mio.poder * IA.pesoHabitat * turnos2;
  }
  const evitado = danoAlHabitat(vista, b.iid, j) * IA.pesoHabitat;
  const dA = Math.max(0, mio.poder + bonusTrofico(mio.clado, carta(b.cardId).clado));
  const dB = Math.max(0, ataqueEfectivo(vista, b.iid) + bonusTrofico(carta(b.cardId).clado, mio.clado)) + mio.espinasRecibidas;
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
    vida: c.vida + pasivoHipotetico(vista, j, cardId).vida,
    clado: c.clado,
    vuela: c.rasgo === RASGO.VUELO,
    espinasPropias: espinasHipoteticas(cardId),
    espinasRecibidas: rivalIid === null ? 0 : espinasDe(vista, rivalIid)
  };
}
function valorDeGuardia(vista, j, cardId) {
  const g = mecanicaDe(cardId)?.guardia?.habitat ?? 0;
  if (!g) return 0;
  const amenazas = Math.max(1, unidadesDe(vista, rival(j)).length);
  return g * amenazas * IA.pesoHabitat * IA.horizonte;
}
function valorDeAccion(vista, j, a) {
  const contrario = rival(j);
  switch (a.tipo) {
    // Bajar la Biomasa del turno es como jugar la tierra en Magic: casi nunca
    // hay nada mejor que hacer con esa acción, porque no compite con jugar
    // cartas — compite con no poder jugarlas el turno que viene.
    //
    // Con el mazo en las últimas deja de compensar, y por un margen enorme: la
    // Pradera muerde tu propio mazo, así que la última copia se cambia por un
    // punto de Biomasa y la derrota por extinción.
    //
    // Con varias en la mano, primero la que más da: sólo una se baja por turno
    // y las otras esperan igual. Y la que muele tres pide tres de reserva.
    case ACCION.BIOMASA: {
      const { da, muele: cuesta } = carta(vista.instancias[a.iid].cardId).biomasa;
      const muele = modoActual() === MODO.CARTAS ? 0 : cuesta;
      if (muele > 0 && vista.jugadores[j].mazo.length <= IA.mazoDeReserva + muele - 1) return -Infinity;
      return 100 + da;
    }
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
      return valorEnRanura(vista, j, a.ranura, mio) + valorDeEntrada(cardId) + valorDeGuardia(vista, j, cardId) - carta(cardId).coste * IA.pesoCoste;
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
        const restante2 = mazoDe(vista, contrario);
        const acerca = BALANCE.rasgos.trampaMazoRival / Math.max(1, restante2);
        const arriesga = BALANCE.rasgos.trampaMazoPropio / Math.max(1, mazoDe(vista, j));
        delta = (acerca - arriesga) * IA.pesoTrofeo / IA.pesoDano * 3;
      } else if (r === RASGO.MORTANDAD) {
        const mueren = (bando) => unidadesDe(vista, bando).filter((u) => vidaActual(vista, u.iid) <= BALANCE.rasgos.mortandadDano).length;
        delta = (mueren(contrario) - mueren(j)) * IA.pesoTrofeo / IA.pesoDano;
      } else if (r === RASGO.SABANA_HELECHOS) {
        delta = BALANCE.rasgos.sabanaHelechosRoba * 0.7 - BALANCE.rasgos.sabanaHelechosDescarta * 0.5;
      } else if (r === RASGO.NIDO) {
        delta = BALANCE.rasgos.nidoRoba * 0.7;
      } else if (r === RASGO.INUNDACION) {
        const acerca = BALANCE.rasgos.inundacionMazo / Math.max(1, mazoDe(vista, contrario));
        const arriesga = BALANCE.rasgos.inundacionMazo / Math.max(1, mazoDe(vista, j));
        delta = (acerca - arriesga) * IA.pesoTrofeo / IA.pesoDano * 3 + BALANCE.rasgos.inundacionRoba * 0.7;
      } else if (r === RASGO.CANAL_TRENZADO) {
        delta = unidadesDe(vista, j).reduce((n, u) => n + Math.min(u.heridas, BALANCE.rasgos.canalTrenzadoCura), 0) * 0.5;
      } else if (r === RASGO.BOSQUE_RIBERENO) {
        delta = Math.min(BALANCE.rasgos.bosqueRiberenoMano, vista.jugadores[contrario].mano.length) * 0.6;
      } else if (r === RASGO.TORMENTA_POLVO) {
        const n = BALANCE.rasgos.tormentaPolvoRoba;
        const mia = vista.jugadores[j].mano.filter((iid) => iid !== a.iid).length;
        delta = (Math.min(n, mazoDe(vista, j) + mia) - mia) * 0.7 - Math.max(0, n - vista.jugadores[contrario].mano.length) * 0.5;
      } else if (r === RASGO.AVENIDA_LODO) {
        delta = Math.max(0, vista.jugadores[contrario].mano.length - BALANCE.rasgos.avenidaLodoTope) * 0.7;
      } else if (r === RASGO.ENTERRAMIENTO) {
        delta = Math.min(
          BALANCE.rasgos.enterramientoRescata,
          vista.jugadores[j].descarte.length
        ) * 0.8;
      } else if (r === RASGO.CAUCE_ABANDONADO) {
        delta = BALANCE.rasgos.cauceRoba * 0.7 - BALANCE.rasgos.cauceDescarta * 0.5;
      } else if (r === RASGO.BARRERA_TRONCOS) {
        const mia = vista.jugadores[j].mano.filter((iid) => iid !== a.iid).length;
        const doble = vista.jugadores[contrario].mano.length > mia;
        const cartas = BALANCE.rasgos.barreraMazo * (doble ? 2 : 1);
        delta = cartas / Math.max(1, mazoDe(vista, contrario)) * IA.pesoTrofeo / IA.pesoDano * 3;
      } else if (r === RASGO.DERIVA_ARIDA) {
        const mia = vista.jugadores[j].mano.filter((iid) => iid !== a.iid);
        const impagables = mia.filter((iid) => carta(vista.instancias[iid].cardId).coste > vista.jugadores[j].biomasa + 2).length;
        delta = (vista.jugadores[contrario].mano.length - mia.length) * 0.4 + impagables * 0.4;
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
      if (r === RASGO.INSECTOS) {
        gana = P.insectosBiomasa;
        cuesta = -P.insectosRoba * 0.7;
      }
      if (r === RASGO.MANADA_PASO) {
        gana = P.manadaPasoBiomasa;
        cuesta = P.manadaPasoMazo * 0.15;
      }
      if (r === RASGO.FRUTOS) {
        gana = P.frutosBiomasa;
        cuesta = P.frutosRobaRival * 0.8;
      }
      const biomasa2 = vista.jugadores[j].biomasa;
      const desbloquea = vista.jugadores[j].mano.filter((iid) => {
        const c = carta(vista.instancias[iid].cardId);
        return c.coste > biomasa2 && c.coste <= biomasa2 + gana;
      }).length;
      return desbloquea * 1.4 + gana * 0.25 - cuesta;
    }
    case ACCION.CLIMA: {
      const cardId = vista.instancias[a.iid].cardId;
      if (vista.campo === cardId) return -Infinity;
      const r = carta(cardId).rasgo;
      let valor = 0;
      if (r === RASGO.CAMPO_LLANURA) valor = BALANCE.efectosCampo.llanuraBiomasa * 1.2;
      if (r === RASGO.CAMPO_SABANA) valor = BALANCE.efectosCampo.sabanaBiomasa * 1.2;
      if (r === RASGO.CAMPO_BOSQUE) {
        valor = unidadesDe(vista, j).filter((u) => carta(u.cardId).clado === CLADO.SAUROPODO).length * 0.8;
      }
      if (r === RASGO.CAMPO_ARIDEZ) {
        const { aridezMazo, aridezTurnos } = BALANCE.efectosCampo;
        const rivalMazo = mazoDe(vista, contrario);
        const remata = rivalMazo <= aridezTurnos * (aridezMazo + BALANCE.robo.normal) && rivalMazo < mazoDe(vista, j);
        valor = remata ? 4 : Math.max(0, rivalMazo - mazoDe(vista, j)) * 0.15;
      }
      if (r === RASGO.CAMPO_CANAL) {
        valor = unidadesDe(vista, j).filter((u) => carta(u.cardId).rasgo === RASGO.RIBERENO).length * BALANCE.rasgos.riberenoAtaque * IA.pesoDano;
      }
      const turnos = Math.min(IA.horizonte, carta(cardId).duracion ?? IA.horizonte);
      return valor * turnos - carta(cardId).coste * IA.pesoCoste;
    }
    // Devolver una carta al mazo (Llanura de inundación). No es una jugada
    // ofensiva: es alargar el mazo. Vale algo sólo cuando el mazo escasea, y
    // sólo si lo que se devuelve no se iba a poder jugar.
    //
    // Se puntúa por debajo del umbral cuando queda mazo de sobra, para que la
    // IA no se dedique a reciclar en el turno 2 teniendo cosas que desplegar.
    case ACCION.RECICLAR: {
      const mazo = vista.jugadores[j].mazo.length;
      if (mazo > IA.reciclaDesdeMazo) return 0;
      const c = carta(vista.instancias[a.iid].cardId);
      const alcanzable = c.coste <= vista.jugadores[j].biomasa + IA.horizonte;
      if (alcanzable) return 0;
      return (IA.reciclaDesdeMazo - mazo) / IA.reciclaDesdeMazo;
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
      ["stegosaurus", 3],
      ["nodosaurus", 2],
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
      ["neumaticidad", 1],
      ["biomasa", 5]
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
      ["nodosaurus", 2],
      ["loricatosaurus", 3],
      ["invictarx", 3],
      ["dryosaurus", 3],
      ["maiasaura", 1],
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
      ["shuangmiaosaurus", 3],
      ["biomasa", 5]
    ]),
    nota: "No pega fuerte. Aguanta, que es peor."
  }),
  // La segunda hornada (15-09-2026). Cada uno con su mazo temático de la
  // Morrison y su forma de pelear: un muro de Vida, uno que devuelve daño y
  // uno que muele el mazo desde el aire.
  supersaurus: Object.freeze({
    id: "supersaurus",
    nombre: "Supersaurus vivianae",
    titulo: "El gigante del horizonte",
    vidaMaxima: 7e3,
    recompensa: "jefe_supersaurus",
    mazo: Object.freeze([
      ["camarasaurus", 3],
      ["diplodocus", 3],
      ["apatosaurus", 3],
      ["athenar", 3],
      ["atlasaurus", 2],
      ["argentinosaurus", 2],
      ["mamenchisaurus", 3],
      ["amargasaurus", 3],
      ["plateosauravus", 3],
      ["antarctosaurus", 1],
      ["brachiosaurus", 1],
      ["dryosaurus", 3],
      ["gregarismo", 3],
      ["rebrote", 3],
      ["gastrolitos", 2],
      ["neumaticidad", 2],
      ["crecimiento_acelerado", 1],
      ["bosque", 1],
      ["sabana", 1],
      ["competencia", 2],
      ["frutos", 2],
      ["biomasa", 5],
      ["araucarias", 3]
    ]),
    nota: "Es la Vida m\xE1s alta de la cuenca. No hay atajo: hay que tirarlo entre todos."
  }),
  hesperosaurus: Object.freeze({
    id: "hesperosaurus",
    nombre: "Hesperosaurus mjosi",
    titulo: "La muralla de placas",
    vidaMaxima: 5500,
    recompensa: "jefe_hesperosaurus",
    mazo: Object.freeze([
      ["stegosaurus", 3],
      ["kentrosaurus", 3],
      ["loricatosaurus", 3],
      ["invictarx", 3],
      ["gargoyleosaurus", 3],
      ["nodosaurus", 2],
      ["euoplocephalus", 3],
      ["bienosaurus", 3],
      ["ankylosaurus", 1],
      ["dryosaurus", 3],
      ["camarasaurus", 2],
      ["gregarismo", 3],
      ["trampa", 3],
      ["fractura", 2],
      ["gastrolitos", 2],
      ["rebrote", 3],
      ["competencia", 2],
      ["mortandad", 1],
      ["aridez", 1],
      ["nido", 2],
      ["biomasa", 5],
      ["cicadas", 2]
    ]),
    nota: "Cada golpe que le das te lo devuelve. Pega con criaturas que aguanten."
  }),
  harpactognathus: Object.freeze({
    id: "harpactognathus",
    nombre: "Harpactognathus gentryii",
    titulo: "La sombra del r\xEDo",
    vidaMaxima: 4500,
    recompensa: "jefe_harpactognathus",
    mazo: Object.freeze([
      ["pteranodon", 3],
      ["huaxiadraco", 3],
      ["quetzalcoatlus", 2],
      ["eosinopteryx", 3],
      ["troodon", 3],
      ["ornitholestes", 3],
      ["dromaeosaurus", 3],
      ["ceratosaurus", 3],
      ["allosaurus", 2],
      ["suchomimus", 1],
      ["riparovenator", 2],
      ["trampa", 3],
      ["carrona", 1],
      ["lago", 2],
      ["insectos", 3],
      ["canal", 1],
      ["inundacion", 2],
      ["gregarismo", 3],
      ["fractura", 2],
      ["neumaticidad", 2],
      ["biomasa", 5],
      ["equisetos", 3]
    ]),
    nota: "Poca Vida y muy r\xE1pido: te vac\xEDa el mazo antes de que lo alcances."
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
  }),
  // La segunda vuelta del calendario, con los tres jefes nuevos. Las fechas de
  // arriba no se tocan: las tribus que ya existen siguen en los mismos días.
  Object.freeze({
    id: "caza_supersaurus",
    tipo: TIPO_EVENTO.JEFE,
    jefe: "supersaurus",
    dia: 14,
    dura: 5,
    titulo: "El gigante del horizonte",
    texto: "Cinco d\xEDas contra el saur\xF3podo m\xE1s largo de la Morrison. No pega mucho, pero su Vida no se acaba nunca."
  }),
  Object.freeze({
    id: "lluvias_cuenca",
    tipo: TIPO_EVENTO.CLIMA,
    clima: "bosque",
    dia: 19,
    dura: 2,
    titulo: "Llegan las lluvias",
    texto: "Dos d\xEDas de estaci\xF3n de lluvias: los saur\xF3podos curan una herida al final de cada turno."
  }),
  Object.freeze({
    id: "muralla_hesperosaurus",
    tipo: TIPO_EVENTO.JEFE,
    jefe: "hesperosaurus",
    dia: 21,
    dura: 5,
    titulo: "La muralla de placas",
    texto: "Cinco d\xEDas contra un estegosaurio que devuelve cada golpe. Hay que pegarle con criaturas que aguanten."
  }),
  Object.freeze({
    id: "monzon_cuenca",
    tipo: TIPO_EVENTO.CLIMA,
    clima: "sabana",
    dia: 26,
    dura: 2,
    titulo: "El monz\xF3n de verano",
    texto: "Dos d\xEDas de monz\xF3n: los dos jugadores ganan 1 de Biomasa m\xE1s cada turno."
  }),
  Object.freeze({
    id: "sombra_harpactognathus",
    tipo: TIPO_EVENTO.JEFE,
    jefe: "harpactognathus",
    dia: 28,
    dura: 5,
    titulo: "La sombra del r\xEDo",
    texto: "Cinco d\xEDas contra un pterosaurio que vac\xEDa tu mazo desde el aire. Poca Vida y mucha prisa."
  }),
  Object.freeze({
    id: "crecida_verano",
    tipo: TIPO_EVENTO.CLIMA,
    clima: "llanura",
    dia: 33,
    dura: 2,
    titulo: "La crecida de verano",
    texto: "Dos d\xEDas de crecida: cada jugador puede cambiar una carta de su mano por otra del mazo, una vez por turno."
  })
]);
var CICLO = CALENDARIO.reduce((n, e) => Math.max(n, e.dia + e.dura), 0);

// src/data/coleccion.js
var TAM_MAZO = BALANCE.tamanoMazo;
var limiteDe = (cardId) => {
  const c = carta(cardId);
  return c.copiasMax ?? BALANCE.copiasPorRareza[c.rareza];
};
var LEGENDARIAS_DINO_MAX = BALANCE.legendariasDinoPorMazo;
var esLegendariaDino = (cardId) => {
  const c = carta(cardId);
  return c.tipo === TIPO.DINOSAURIO && c.rareza === RAREZA.LEGENDARIO;
};
var legendariasDinoEn = (mazo) => {
  const pares = Array.isArray(mazo) ? mazo : Object.entries(mazo);
  let n = 0;
  for (const [cardId, copias] of pares) {
    if (existeCarta(cardId) && copias > 0 && esLegendariaDino(cardId)) n += copias;
  }
  return n;
};
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
  ESCALA.map((r) => [r, POR_RAREZA[r].reduce((n, id) => n + limiteDe(id), 0)])
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

// src/data/misiones.js
var MISIONES = Object.freeze({
  porDia: 3,
  // Una victoria por debajo de esto es una partida que fue a por el rival desde
  // el principio. La media ronda los 15 turnos (`BALANCE.md`), así que 11 pide
  // intención sin pedir suerte.
  turnosRelampago: 11
});
var porClado = (clado) => `clado:${clado}`;
var VOCABULARIO = Object.freeze([
  "partidas",
  // jugadas, se ganen o no
  "victorias",
  "relampago",
  // victorias en MISIONES.turnosRelampago turnos o menos
  "bajas",
  // criaturas rivales derribadas
  "desplegados",
  // tus criaturas que llegaron al campo
  "climas",
  // climas tuyos que se impusieron
  "danoHabitat",
  // daño que le hiciste al hábitat rival
  "trofeos",
  ...Object.values(CLADO).map(porClado),
  // Los que no salen de re-jugar: los apunta el servidor al cerrar un asalto
  // (sabe el daño y si el jefe cayó) o un duelo (sabe quién ganó). Un parte de
  // partida contra la IA los deja a cero.
  "asaltos",
  // asaltos al jefe jugados
  "danoJefe",
  // daño hecho al jefe
  "jefesVencidos",
  // asaltos que dejaron al jefe a cero: el golpe final
  "duelos",
  // duelos jugados, se ganen o no
  "duelosGanados",
  "expediciones",
  // partidas contra un rival de expedición, se ganen o no
  "expedicionNuevos",
  // rivales de expedición vencidos por primera vez
  // Los de las cartas de jefe. Ni el parte ni la Edge Function: los apunta
  // `reclamar_jefe` en SQL (0028) cuando la carta entra por primera vez.
  "jefe:saurophaganax",
  "jefe:barosaurus",
  "jefe:supersaurus",
  "jefe:hesperosaurus",
  "jefe:harpactognathus",
  "cartasJefe"
  // cartas de jefe DISTINTAS que tienes
]);
var ES_VOCABULARIO = new Set(VOCABULARIO);
function parteVacio() {
  const p = {};
  for (const clave of VOCABULARIO) p[clave] = 0;
  return p;
}
function anotarEventos(parte, eventos, bando = 0) {
  const rival3 = bando === 0 ? 1 : 0;
  for (const e of eventos) {
    switch (e.tipo) {
      // Una criatura rival que se cae es una baja tuya. `dueno` es de quién ERA,
      // no quién la mató: matarte una propia con tu Mortandad no cuenta.
      case "MUERTE":
        if (e.dueno === rival3) parte.bajas += 1;
        break;
      // El daño al hábitat se cuenta por el bando que lo RECIBE.
      case "HABITAT":
        if (e.bando === rival3) parte.danoHabitat += e.cantidad ?? 0;
        break;
      // REVELADA y no la acción de desplegar: lo que cuenta es la criatura que
      // LLEGÓ al campo. Una carta comprometida y luego rechazada se pagó igual,
      // pero no se desplegó, y una misión que la contara mentiría.
      case "REVELADA": {
        if (e.jugador !== bando || !existeCarta(e.cardId)) break;
        const c = carta(e.cardId);
        if (c.tipo !== TIPO.DINOSAURIO) break;
        parte.desplegados += 1;
        const clave = porClado(c.clado);
        if (clave in parte) parte[clave] += 1;
        break;
      }
      // El clima es del campo, no de un bando, pero lo pone alguien: cuenta
      // para quien lo jugó.
      case "CAMPO":
        if (e.jugador === bando && existeCarta(e.cardId) && carta(e.cardId).tipo === TIPO.CLIMA) parte.climas += 1;
        break;
      default:
        break;
    }
  }
  return parte;
}
function nuevosEventos(estado, desde) {
  return estado.eventos.length >= desde ? estado.eventos.slice(desde) : estado.eventos.slice(0);
}
function cerrarParte(parte, { ganada, turnos, trofeos }) {
  parte.partidas += 1;
  parte.trofeos += trofeos ?? 0;
  if (ganada) {
    parte.victorias += 1;
    if (turnos <= MISIONES.turnosRelampago) parte.relampago += 1;
  }
  return parte;
}
var M = (id, nombre, texto, mide, meta, premio) => Object.freeze({
  id,
  nombre,
  texto,
  mide,
  meta,
  premio
});
var CATALOGO = Object.freeze([
  // Las de jugar: se cumplen solas si juegas, y están para que un día malo
  // pague algo. Son las baratas a propósito.
  M("jugar_tres", "Trabajo de campo", "Juega 3 partidas", "partidas", 3, 25),
  M("ganar_una", "Una buena jornada", "Gana 1 partida", "victorias", 1, 25),
  M("ganar_dos", "Racha", "Gana 2 partidas", "victorias", 2, 45),
  // Las de jugar de una MANERA: piden armar el mazo pensando en ellas, que es
  // lo que las hace valer la pena. Los números salen de una partida normal de
  // 15 turnos, donde se despliegan entre 8 y 12 criaturas.
  M("bajas_seis", "Depredaci\xF3n", "Derriba 6 criaturas rivales", "bajas", 6, 40),
  M("habitat_diez", "Asedio", "Hazle 10 de da\xF1o al h\xE1bitat rival", "danoHabitat", 10, 40),
  M("trofeos_seis", "Registro f\xF3sil", "Consigue 6 trofeos", "trofeos", 6, 40),
  M("desplegar_doce", "Ecosistema", "Despliega 12 criaturas", "desplegados", 12, 35),
  M("climas_tres", "Meteorolog\xEDa", "Imp\xF3n 3 climas", "climas", 3, 35),
  // Las de clado: una por familia. Empujan a probar cartas que no están en el
  // mazo de siempre, que es el otro problema del set —39 de 66 cartas fuera del
  // mazo de referencia—. Los pterosaurios y los marinos piden menos: hay muchas
  // menos cartas suyas y no caben cinco en cualquier mazo.
  M("teropodos", "Caza mayor", "Despliega 5 ter\xF3podos", porClado(CLADO.TEROPODO), 5, 40),
  M("sauropodos", "Manada", "Despliega 5 saur\xF3podos", porClado(CLADO.SAUROPODO), 5, 40),
  M("tireoforos", "Coraza", "Despliega 4 tire\xF3foros", porClado(CLADO.TIREOFORO), 4, 40),
  M("ornitopodos", "Ramoneo", "Despliega 5 ornit\xF3podos", porClado(CLADO.ORNITOPODO), 5, 40),
  M("marginocefalos", "Testarazo", "Despliega 4 marginoc\xE9falos", porClado(CLADO.MARGINOCEFALO), 4, 40),
  M("pterosaurios", "Sombra en el cielo", "Despliega 3 pterosaurios", porClado(CLADO.PTEROSAURIO), 3, 45),
  M("marinos", "Mar de Sundance", "Despliega 3 reptiles marinos", porClado(CLADO.MARINO), 3, 45),
  // Las del jefe y las de duelo. No salen de una partida contra la IA: hay que
  // bajar a la cuenca o buscar rival, y un día sin jefe abierto o sin nadie
  // conectado es un día en que ésa de las tres no se cumple. Se aceptó así:
  // es lo que las hace pedir algo. Pagan por debajo de la relámpago para que
  // el peor día posible siga cabiendo en el techo.
  M("asalto_uno", "Bajar a la cuenca", "Asalta al jefe 1 vez", "asaltos", 1, 40),
  M("dano_jefe", "Al hueso", "Hazle 40 de da\xF1o al jefe", "danoJefe", 40, 45),
  M("duelo_uno", "Cara a cara", "Juega 1 duelo", "duelos", 1, 40),
  M("duelo_ganar", "Mano a mano", "Gana 1 duelo", "duelosGanados", 1, 45),
  // La de expedición mide partidas JUGADAS y no primeras victorias: los nodos
  // se acaban, y quien ha recorrido los dos mapas sólo estrena rival una vez
  // por semana. Una misión que la mitad del año no se puede cumplir no pide
  // algo, sobra. Por eso `expedicionNuevos` se queda para los logros.
  M("expedicion_dos", "Prospecci\xF3n", "Juega 2 partidas de expedici\xF3n", "expediciones", 2, 40),
  // La difícil del día. Una sola, y paga como tal.
  // El texto dice «1 partida» y no «una» a propósito: el guardián de
  // `misiones.test.js` pide que el texto cite la meta, igual que el de las
  // cartas pide que cite su número, y con la letra no lo encuentra.
  M(
    "relampago",
    "Golpe seco",
    `Gana 1 partida en ${MISIONES.turnosRelampago} turnos o menos`,
    "relampago",
    1,
    60
  )
]);
var POR_ID = Object.freeze(Object.fromEntries(CATALOGO.map((m) => [m.id, m])));
function semillaDelDia(dia) {
  let h = 2166136261;
  for (let i = 0; i < dia.length; i++) {
    h ^= dia.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h || 1;
}
function siguiente2(r) {
  let t = r + 1831565813 >>> 0;
  let x = Math.imul(t ^ t >>> 15, 1 | t);
  x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x;
  return { r: t, valor: ((x ^ x >>> 14) >>> 0) / 4294967296 };
}
function misionesDelDia(dia) {
  const lista = CATALOGO.slice();
  let r = semillaDelDia(String(dia));
  const cuantas = Math.min(MISIONES.porDia, lista.length);
  for (let i = 0; i < cuantas; i++) {
    const s = siguiente2(r);
    r = s.r;
    const j = i + Math.floor(s.valor * (lista.length - i));
    const tmp = lista[i];
    lista[i] = lista[j];
    lista[j] = tmp;
  }
  return Object.freeze(lista.slice(0, cuantas));
}
var diaUTC = (ahora = /* @__PURE__ */ new Date()) => ahora.toISOString().slice(0, 10);
function avancesDelParte(dia, parte) {
  return misionesDelDia(dia).map((m) => ({ id: m.id, avance: parte[m.mide] ?? 0 })).filter((a) => a.avance > 0);
}

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
    const tope = limiteDe(cardId);
    if (copias > tope) throw new PartidaInvalida("copias por encima del tope de la carta", cardId);
    total += copias;
  }
  const legendarias = legendariasDinoEn(mazo);
  if (legendarias > LEGENDARIAS_DINO_MAX) {
    throw new PartidaInvalida("demasiadas criaturas legendarias", legendarias);
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
  const parte = parteVacio();
  const aplicar = (estado, accion) => {
    const desde = estado.eventos.length;
    const siguiente3 = reduce(estado, accion);
    anotarEventos(parte, nuevosEventos(siguiente3, desde));
    return siguiente3;
  };
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
          s = aplicar(s, a);
          actuo = true;
          if (a.tipo === ACCION.PASAR || a.tipo === ACCION.DESCARTAR) break;
          if (++tuyas > LIMITES.pasosPorFase) throw new PartidaInvalida("la fase no converge");
        }
        let suyas = 0;
        while (s.fase === faseInicial && legales(s, 1).length > 0) {
          const d = decidir(vistaDe(s, 1), 1, rngIA, perfil);
          rngIA = d.rng;
          if (!d.accion) break;
          s = aplicar(s, d.accion);
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
    s = aplicar(s, { tipo: ACCION.AVANZAR });
  }
  cerrarParte(parte, {
    ganada: s.ganador === 0,
    turnos: s.turno,
    trofeos: s.jugadores[0].trofeos
  });
  return {
    parte,
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

// src/data/expediciones.js
var RELLENO = ["biomasa", "araucarias", "cicadas", "ginkgos", "equisetos", "galeria", "helechal"];
var topeDe = (id) => carta(id).copiasMax ?? BALANCE.copiasPorRareza[carta(id).rareza];
function completar(lista) {
  const cuenta = new Map(lista.map(([id, n]) => [id, n]));
  let total = [...cuenta.values()].reduce((a, b) => a + b, 0);
  for (const id of RELLENO) {
    while (total < BALANCE.tamanoMazo && (cuenta.get(id) ?? 0) < topeDe(id)) {
      cuenta.set(id, (cuenta.get(id) ?? 0) + 1);
      total += 1;
    }
  }
  return Object.freeze([...cuenta.entries()].map((e) => Object.freeze(e)));
}
var rival2 = (o) => Object.freeze({ ...o, mazo: completar(o.mazo) });
var EXPEDICIONES = Object.freeze([
  Object.freeze({
    id: "morrison",
    nombre: "Formaci\xF3n Morrison",
    era: "Jur\xE1sico Superior \xB7 155\u2013148 Ma",
    mapa: "mapa_morrison",
    rivales: Object.freeze([
      // El ORDEN sale de medirlos (`node sim/expediciones.mjs`), no de cómo
      // suenan: el rebaño de saurópodos parecía un cuarto nodo y resultó más
      // duro que el clan de Ceratosaurus. Jugar con cabeza apenas endurece un
      // mazo flojo —el muro pasa del 99 % al 95 %—: la dificultad la da el mazo.
      rival2({
        id: "cria_dryosaurus",
        nombre: "La cr\xEDa de Dryosaurus",
        lema: "Muchos, peque\xF1os y nerviosos. Corren m\xE1s de lo que pegan.",
        retrato: "dryosaurus",
        perfil: "aleatoria",
        premio: 30,
        mazo: [
          ["dryosaurus", 3],
          ["eosinopteryx", 3],
          ["bienosaurus", 3],
          ["troodon", 3],
          ["platyceratops", 3],
          ["liaoceratops", 3],
          ["shuangmiaosaurus", 3],
          ["athenar", 3],
          ["nido", 3],
          ["insectos", 3],
          ["sabana_helechos", 3],
          ["gregarismo", 3]
        ]
      }),
      rival2({
        id: "muro_de_placas",
        nombre: "El muro de placas",
        lema: "Tire\xF3foros que no avanzan: esperan a que te rompas contra ellos.",
        retrato: "stegosaurus",
        perfil: "heuristica",
        premio: 40,
        mazo: [
          ["stegosaurus", 3],
          ["kentrosaurus", 3],
          ["bienosaurus", 3],
          ["loricatosaurus", 3],
          ["gargoyleosaurus", 3],
          ["invictarx", 3],
          ["nodosaurus", 2],
          ["euoplocephalus", 3],
          ["gastrolitos", 2],
          ["fractura", 2],
          ["canal_trenzado", 3],
          ["rebrote", 3]
        ]
      }),
      rival2({
        id: "cazadores_de_orilla",
        nombre: "Cazadores de orilla",
        lema: "Ter\xF3podos peque\xF1os en jaur\xEDa. Si los dejas crecer, muerden.",
        retrato: "ornitholestes",
        perfil: "heuristica",
        premio: 50,
        mazo: [
          ["ornitholestes", 3],
          ["ceratosaurus", 3],
          ["dromaeosaurus", 3],
          ["troodon", 3],
          ["velociraptor", 3],
          ["ojoraptorsaurus", 3],
          ["halszkaraptor", 3],
          ["tongtianlong", 3],
          ["allosaurus", 2],
          ["riparovenator", 2],
          ["trampa", 3],
          ["fractura", 2],
          ["gregarismo", 3],
          ["crecimiento_acelerado", 1]
        ]
      }),
      rival2({
        id: "clan_ceratosaurus",
        nombre: "El clan de Ceratosaurus",
        lema: "Todo dientes y ninguna paciencia. Si sobrevives al turno 5, es tuyo.",
        retrato: "ceratosaurus",
        perfil: "heuristica",
        premio: 60,
        mazo: [
          ["ceratosaurus", 3],
          ["ornitholestes", 3],
          ["allosaurus", 3],
          ["torvosaurus", 2],
          ["riparovenator", 2],
          ["dromaeosaurus", 3],
          ["velociraptor", 3],
          ["monolophosaurus", 3],
          ["carnotaurus", 2],
          ["fractura", 2],
          ["competencia", 2],
          ["gregarismo", 3],
          ["trampa", 2]
        ]
      }),
      rival2({
        id: "lago_toodichi",
        nombre: "El lago T\u2019oo\u2019dichi\u2019",
        lema: "Lo que vuela y lo que nada. Llegan por donde no miras.",
        retrato: "huaxiadraco",
        perfil: "heuristica",
        premio: 80,
        mazo: [
          ["plesiopleurodon", 2],
          ["scanisaurus", 3],
          ["elasmosaurus", 3],
          ["huaxiadraco", 3],
          ["pteranodon", 3],
          ["quetzalcoatlus", 2],
          ["halszkaraptor", 3],
          ["suchomimus", 2],
          ["lago", 2],
          ["humedal", 2],
          ["inundacion", 3],
          ["canal_trenzado", 2]
        ]
      }),
      rival2({
        id: "rebano_de_cuellos",
        nombre: "El reba\xF1o de cuellos largos",
        lema: "Saur\xF3podos que se curan y no se caen. Hay que ganarles por f\xF3siles.",
        retrato: "diplodocus",
        perfil: "heuristica",
        premio: 100,
        mazo: [
          ["diplodocus", 3],
          ["apatosaurus", 3],
          ["camarasaurus", 3],
          ["amargasaurus", 3],
          ["plateosauravus", 3],
          ["athenar", 2],
          ["atlasaurus", 2],
          ["mamenchisaurus", 3],
          ["brachiosaurus", 1],
          ["gastrolitos", 2],
          ["canal_trenzado", 3],
          ["sabana", 1],
          ["rebrote", 3]
        ]
      }),
      rival2({
        id: "cantera_cleveland",
        nombre: "La cantera Cleveland-Lloyd",
        lema: "El barro se lo traga todo. Cuida tu mazo: aqu\xED se pierde por extinci\xF3n.",
        retrato: "allosaurus",
        perfil: "heuristica",
        premio: 120,
        mazo: [
          ["trampa", 3],
          ["mortandad", 1],
          ["deriva_arida", 2],
          ["inundacion", 3],
          ["aridez", 1],
          ["suchomimus", 2],
          ["quetzalcoatlus", 2],
          ["spinosaurus", 1],
          ["allosaurus", 3],
          ["ceratosaurus", 3],
          ["stegoceras", 3],
          ["gargoyleosaurus", 3],
          ["manada_paso", 3],
          ["dryosaurus", 3],
          ["huaxiadraco", 3]
        ]
      }),
      rival2({
        id: "big_al",
        nombre: "Big Al",
        lema: "El Allosaurus m\xE1s famoso de la Morrison: diecinueve heridas y ninguna le par\xF3.",
        retrato: "allosaurus",
        perfil: "heuristica",
        premio: 200,
        mazo: [
          ["allosaurus", 3],
          ["torvosaurus", 2],
          ["tyrannotitan", 1],
          ["ceratosaurus", 3],
          ["ornitholestes", 3],
          ["stegosaurus", 3],
          ["nodosaurus", 2],
          ["diplodocus", 3],
          ["apatosaurus", 3],
          ["camarasaurus", 2],
          ["lokiceratops", 1],
          ["crecimiento_acelerado", 1],
          ["neumaticidad", 2],
          ["fractura", 2],
          ["gregarismo", 3],
          ["trampa", 3],
          ["gastrolitos", 2],
          ["sabana", 1]
        ]
      })
    ])
  }),
  // --------------------------------------------------------- Hell Creek
  //
  // La segunda, y la primera que se ABRE con otra: `requiere` encadena mapas,
  // y `requisitoDe()` hace que el primer nodo de aquí pida a Big Al. No es
  // sólo pintura: el servidor usa el mismo requisito para no pagar la primera
  // victoria de un Hell Creek empezado por la puerta de atrás.
  //
  // Es de las tres formaciones con mapa la única que el set sostiene: hay 26
  // cartas del Cretácico norteamericano y 22 no aparecen hoy en ninguna
  // partida. Las otras dos pedirían cartas nuevas, no mapas — Kem Kem repetiría
  // el mazo del visitante que ya existe y Tendaguru sería la Morrison otra vez.
  //
  // El mapa termina en el impacto, así que el camino va de los bosques del
  // interior hacia la costa y el último rival cae encima del cráter.
  Object.freeze({
    id: "hell_creek",
    nombre: "Formaci\xF3n Hell Creek",
    era: "Cret\xE1cico Superior \xB7 68\u201366 Ma",
    mapa: "mapa_hell_creek",
    requiere: "morrison",
    rivales: Object.freeze([
      // El orden NO es el que se escribió: salió de medirlo. El clan de los
      // cuernos se pensó cuarto y ganaba el 85 % —dos auras de clado apiladas
      // sobre marginocéfalos baratos es lo más fuerte que hay en el set—, y
      // el invierno del impacto, pensado como penúltimo golpe, perdía el 82 %
      // porque un mazo que sólo muele no gana: la extinción está en el 0 %.
      //
      // El camino sigue el dibujo del mapa, que va de los bosques del interior
      // a la costa y termina en el cráter.
      rival2({
        id: "sotobosque_hell_creek",
        nombre: "Los peque\xF1os del sotobosque",
        lema: "Lo que corretea entre los helechos. Ninguno te mata; todos juntos, s\xED.",
        retrato: "platyceratops",
        perfil: "heuristica",
        premio: 60,
        mazo: [
          ["platyceratops", 3],
          ["liaoceratops", 3],
          ["troodon", 3],
          ["tongtianlong", 3],
          ["halszkaraptor", 3],
          ["pteranodon", 3],
          ["shuangmiaosaurus", 3],
          ["stegoceras", 3],
          ["alaskacephale", 3],
          ["chasmosaurus", 3],
          ["medusaceratops", 1],
          ["nido", 3],
          ["insectos", 3],
          ["gregarismo", 3]
        ]
      }),
      rival2({
        id: "los_blindados",
        nombre: "Los blindados",
        lema: "Osteodermos y mazas. Lo que les pega se lleva la mitad de vuelta.",
        retrato: "ankylosaurus",
        perfil: "heuristica",
        premio: 80,
        mazo: [
          ["ankylosaurus", 1],
          ["euoplocephalus", 3],
          ["nodosaurus", 2],
          ["gargoyleosaurus", 3],
          ["invictarx", 3],
          ["stegoceras", 3],
          ["loricatosaurus", 3],
          ["bienosaurus", 3],
          // Sin molienda: se probó con la Sequía y la Trampa y el muro pasó
          // del 74 % al 80 %, o sea que empeoró. Un mazo que sólo muele no
          // gana —la extinción está en el 0 %— y encima gasta las ranuras.
          ["mortandad", 1],
          ["competencia", 2],
          ["canal_trenzado", 3],
          ["rebrote", 3],
          ["gregarismo", 3]
        ]
      }),
      rival2({
        id: "cabezas_de_hueso",
        nombre: "Las cabezas de hueso",
        lema: "Cr\xE1neos de veinte cent\xEDmetros de grosor. Golpean al llegar y siguen andando.",
        retrato: "pachycephalosaurus",
        perfil: "heuristica",
        premio: 100,
        mazo: [
          ["pachycephalosaurus", 3],
          ["stegoceras", 3],
          ["alaskacephale", 3],
          ["liaoceratops", 3],
          ["platyceratops", 3],
          ["chasmosaurus", 3],
          ["wendiceratops", 1],
          ["therizinosaurus", 3],
          ["troodon", 3],
          ["gregarismo", 3],
          ["fractura", 2],
          ["competencia", 2],
          ["nido", 3]
        ]
      }),
      rival2({
        id: "marisma_edmontosaurus",
        nombre: "La marisma de Edmontosaurus",
        lema: "Hadrosaurios a cientos. No pegan: te cansan y se curan.",
        retrato: "edmontosaurus",
        perfil: "heuristica",
        premio: 120,
        mazo: [
          ["edmontosaurus", 1],
          ["parasaurolophus", 3],
          ["brachylophosaurus", 3],
          ["rhinorex", 2],
          ["maiasaura", 1],
          ["shuangmiaosaurus", 3],
          ["iguanodon", 3],
          ["canal_trenzado", 3],
          ["nido", 3],
          ["gregarismo", 3],
          ["rebrote", 3],
          ["gastrolitos", 2],
          ["crecimiento_acelerado", 1],
          ["competencia", 2],
          ["fractura", 2]
        ]
      }),
      rival2({
        id: "mar_interior",
        nombre: "El mar interior",
        lema: "La v\xEDa mar\xEDtima parte el continente en dos. Llega por agua y por aire.",
        retrato: "mosasaurus",
        perfil: "heuristica",
        premio: 150,
        mazo: [
          ["mosasaurus", 1],
          ["elasmosaurus", 3],
          ["plesiopleurodon", 2],
          ["scanisaurus", 3],
          ["quetzalcoatlus", 2],
          ["pteranodon", 3],
          ["huaxiadraco", 3],
          ["suchomimus", 2],
          ["inundacion", 3],
          ["competencia", 2],
          ["fractura", 2],
          ["canal_trenzado", 3],
          ["nido", 3],
          ["gregarismo", 3]
        ]
      }),
      rival2({
        id: "clan_de_los_cuernos",
        nombre: "El clan de los cuernos",
        lema: "Golas que se cubren unas a otras. Cuanto m\xE1s entran, m\xE1s pega cada una.",
        retrato: "triceratops",
        perfil: "heuristica",
        premio: 180,
        mazo: [
          // Sin Medusaceratops y sin Crecimiento acelerado: con los dos ganaba
          // el 85 %. Dos auras de clado apiladas sobre marginocéfalos baratos
          // es lo más fuerte que tiene el set, y aquí no toca todavía.
          ["triceratops", 2],
          ["titanoceratops", 1],
          ["wendiceratops", 1],
          ["lokiceratops", 2],
          ["chasmosaurus", 3],
          ["liaoceratops", 3],
          ["platyceratops", 3],
          ["alaskacephale", 3],
          ["stegoceras", 3],
          ["gregarismo", 3],
          ["nido", 3],
          ["canal_trenzado", 3]
        ]
      }),
      rival2({
        id: "invierno_del_impacto",
        nombre: "El invierno del impacto",
        lema: "Ceniza en el cielo y nada que comer. Aqu\xED no se gana: se dura m\xE1s.",
        retrato: "quetzalcoatlus",
        perfil: "heuristica",
        premio: 220,
        mazo: [
          // La Mortandad es asimétrica a propósito: 3 de daño a todo el campo
          // barre una mano de criaturas baratas y a éstas no las despeina.
          ["aridez", 1],
          ["mortandad", 1],
          ["carrona", 1],
          ["competencia", 2],
          ["fractura", 2],
          ["neumaticidad", 2],
          ["crecimiento_acelerado", 1],
          ["medusaceratops", 2],
          ["therizinosaurus", 3],
          ["euoplocephalus", 3],
          ["elasmosaurus", 3],
          ["quetzalcoatlus", 2],
          ["carnotaurus", 2],
          ["mosasaurus", 1],
          ["titanoceratops", 2],
          ["triceratops", 2],
          ["wendiceratops", 2],
          ["dromaeosaurus", 3]
        ]
      }),
      rival2({
        id: "el_ultimo_rey",
        nombre: "El \xFAltimo rey",
        lema: "Ocho toneladas de tiranosaurio en el \xFAltimo mill\xF3n de a\xF1os del Mesozoico.",
        retrato: "tyrannosaurus",
        perfil: "heuristica",
        premio: 350,
        mazo: [
          ["tyrannosaurus", 1],
          ["triceratops", 2],
          ["wendiceratops", 2],
          ["titanoceratops", 2],
          ["medusaceratops", 2],
          ["ankylosaurus", 1],
          ["edmontosaurus", 1],
          ["carnotaurus", 2],
          ["quetzalcoatlus", 2],
          ["pachycephalosaurus", 3],
          ["dromaeosaurus", 3],
          ["troodon", 3],
          ["velociraptor", 3],
          // Llevaba un Mosasaurus, y con él eran CUATRO criaturas legendarias:
          // un mazo que desde el tope de tres (16-09-2026) ningún jugador puede
          // construir, y un rival de expedición no juega con cartas prohibidas.
          // Se va el que menos pinta en Hell Creek —el único marino— y entra un
          // marginocéfalo más, que las dos auras de la lista ya están puestas.
          // Medido con `node sim/expediciones.mjs`, 400 partidas: se le ganaba
          // el 21,8 % y se le gana el 24,5 %. Sigue siendo con diferencia el
          // nodo más duro del juego, que es lo que tiene que ser.
          ["alaskacephale", 1],
          ["carrona", 1],
          ["mortandad", 1],
          ["competencia", 2],
          ["crecimiento_acelerado", 1],
          ["neumaticidad", 2],
          ["fractura", 2],
          ["gregarismo", 3],
          ["trampa", 3]
        ]
      })
    ])
  })
]);
var VISITANTES = Object.freeze([
  rival2({
    id: "visitante_spinosaurus",
    nombre: "El se\xF1or del Kem Kem",
    lema: "Del r\xEDo no sale nada vivo. Tampoco tus cartas.",
    retrato: "spinosaurus",
    perfil: "heuristica",
    premio: 150,
    mazo: [
      ["spinosaurus", 1],
      ["suchomimus", 2],
      ["carnotaurus", 2],
      ["sanjuansaurus", 3],
      // Con Allosaurus en vez de Scanisaurus y los eventos de presión se le gana
      // el 52 %; como estaba al principio, el 73 %, la semana regalada.
      ["elasmosaurus", 3],
      ["allosaurus", 3],
      ["plesiopleurodon", 2],
      ["torvosaurus", 2],
      ["fractura", 2],
      ["competencia", 1],
      ["crecimiento_acelerado", 1],
      ["trampa", 3],
      ["inundacion", 3],
      ["lago", 2],
      ["humedal", 2],
      ["vega", 2]
    ]
  }),
  rival2({
    id: "visitante_mosasaurus",
    nombre: "Lo que sube del mar",
    lema: "Un mar interior entero detr\xE1s. Aguanta la marea o te arrastra.",
    retrato: "mosasaurus",
    perfil: "heuristica",
    premio: 150,
    mazo: [
      ["mosasaurus", 1],
      ["elasmosaurus", 3],
      ["plesiopleurodon", 2],
      ["scanisaurus", 3],
      ["quetzalcoatlus", 2],
      ["pteranodon", 3],
      ["huaxiadraco", 3],
      ["argentinosaurus", 2],
      ["amargasaurus", 3],
      ["canal_trenzado", 3],
      ["gastrolitos", 2],
      ["manada_paso", 3],
      ["manantial", 1]
    ]
  }),
  rival2({
    id: "visitante_gobi",
    nombre: "El desierto de Gobi",
    lema: "Arena, viento y garras. Lo que sobrevive aqu\xED no necesita beber.",
    retrato: "therizinosaurus",
    perfil: "heuristica",
    premio: 150,
    mazo: [
      // La Sequía no está de adorno: el Therizinosaurus cobra +3 de Ataque
      // mientras haya un clima en el campo, y su carta se llama Garra de sequía.
      ["aridez", 1],
      ["therizinosaurus", 3],
      ["velociraptor", 3],
      ["troodon", 3],
      ["halszkaraptor", 3],
      ["ojoraptorsaurus", 3],
      ["monolophosaurus", 3],
      ["shuangmiaosaurus", 3],
      ["liaoceratops", 3],
      ["platyceratops", 3],
      ["alaskacephale", 3],
      ["huaxiadraco", 3],
      ["medusaceratops", 2],
      ["quetzalcoatlus", 2],
      ["suchomimus", 2],
      ["neumaticidad", 2],
      ["crecimiento_acelerado", 1],
      ["competencia", 2],
      ["gregarismo", 3],
      ["fractura", 2]
    ]
  }),
  rival2({
    id: "visitante_patagonia",
    nombre: "Los gigantes del sur",
    lema: "Gondwana cri\xF3 los cuerpos m\xE1s grandes que ha habido. Y lo que los cazaba.",
    retrato: "argentinosaurus",
    perfil: "heuristica",
    premio: 150,
    mazo: [
      // Tenía diecisiete criaturas y treinta de soporte, y se ganaba el 59 %:
      // medio mazo mirando mientras la otra mitad esperaba a la cuarta
      // Biomasa. Ahora son veinticuatro, con ceratosáurido, azhdárquido y
      // pliosaurio, que de Gondwana también son.
      ["argentinosaurus", 2],
      ["antarctosaurus", 1],
      ["tyrannotitan", 1],
      ["carnotaurus", 2],
      ["amargasaurus", 3],
      ["sanjuansaurus", 3],
      ["atlasaurus", 2],
      ["ceratosaurus", 3],
      ["elasmosaurus", 3],
      ["quetzalcoatlus", 1],
      // Todo lo grande cuesta 4: sin rampa, la mano se queda quieta.
      ["carrona", 1],
      ["humedal", 2],
      ["vega", 2],
      ["manantial", 1],
      ["sabana", 3],
      ["neumaticidad", 2],
      ["crecimiento_acelerado", 1],
      ["mortandad", 1],
      ["competencia", 2],
      ["fractura", 2],
      ["nido", 3],
      ["gregarismo", 3]
    ]
  }),
  rival2({
    id: "visitante_tendaguru",
    nombre: "La colina de Tendaguru",
    lema: "La Morrison tuvo una hermana en \xC1frica, y all\xED los cuellos eran m\xE1s largos.",
    retrato: "brachiosaurus",
    perfil: "heuristica",
    premio: 150,
    mazo: [
      ["brachiosaurus", 1],
      ["atlasaurus", 2],
      ["mamenchisaurus", 3],
      ["amargasaurus", 3],
      ["kentrosaurus", 3],
      ["stegosaurus", 3],
      ["dryosaurus", 3],
      ["ceratosaurus", 3],
      ["ornitholestes", 3],
      ["allosaurus", 3],
      ["torvosaurus", 2],
      ["manantial", 1],
      ["lago", 2],
      ["bosque", 1],
      ["gastrolitos", 2],
      ["neumaticidad", 2],
      ["crecimiento_acelerado", 1],
      ["competencia", 2],
      ["canal_trenzado", 3],
      ["rebrote", 3],
      ["gregarismo", 3],
      ["fractura", 2]
    ]
  })
]);
function semanaDe(dia) {
  const ms = Date.parse(`${dia}T00:00:00Z`);
  if (!Number.isFinite(ms)) throw new Error(`d\xEDa inv\xE1lido: ${dia}`);
  return Math.floor((ms / 864e5 + 3) / 7);
}
var TODOS2 = new Map([
  ...EXPEDICIONES.flatMap((e) => e.rivales.map((r, i) => [r.id, { rival: r, expedicion: e, indice: i }])),
  ...VISITANTES.map((r) => [r.id, { rival: r, expedicion: null, indice: -1 }])
]);
var rivalPorId = (id) => TODOS2.get(id) ?? null;
function requisitoDe(id) {
  const r = rivalPorId(id);
  if (!r || r.indice < 0) return null;
  if (r.indice > 0) return r.expedicion.rivales[r.indice - 1].id;
  const previa = EXPEDICIONES.find((e) => e.id === r.expedicion.requiere);
  return previa ? previa.rivales[previa.rivales.length - 1].id : null;
}
function claveDeVictoria(id, dia) {
  const r = rivalPorId(id);
  if (!r) return null;
  return r.expedicion ? id : `${id}@${semanaDe(dia)}`;
}
for (const [id, { rival: r }] of TODOS2) {
  const total = r.mazo.reduce((a, [, n]) => a + n, 0);
  if (total !== BALANCE.tamanoMazo) throw new Error(`EXPEDICIONES: ${id} suma ${total} cartas`);
  for (const [cardId, n] of r.mazo) {
    if (n > topeDe(cardId)) throw new Error(`EXPEDICIONES: ${id} lleva ${n} ${cardId} y admite ${topeDe(cardId)}`);
  }
  carta(r.retrato);
}

// supabase/functions/_compartido/validarSolitario.js
function validarSolitario(envio) {
  const expedicion = envio?.rival ? rivalPorId(String(envio.rival)) : null;
  if (envio?.rival && !expedicion) throw new PartidaInvalida("rival de expedici\xF3n desconocido", envio.rival);
  const r = validarPartida(envio, expedicion ? {
    mazoRival: expedicion.rival.mazo.map((e) => [...e]),
    habitatRival: null,
    perfil: perfilValido(expedicion.rival.perfil)
  } : {
    // null es el mazo de referencia. Es lo que hace `crearPartida` en el
    // navegador cuando la partida no es un asalto, así que reproducirlo es
    // literalmente no pasarle nada.
    mazoRival: null,
    habitatRival: null,
    perfil: perfilValido(envio.perfil)
  });
  return {
    ...r,
    premio: r.ganada ? ECONOMIA.monedasVictoria : ECONOMIA.monedasDerrota,
    rival: expedicion ? expedicion.rival.id : null
  };
}

// src/data/duelo.js
var DUELO = Object.freeze({
  // El reloj de la partida en solitario, en milisegundos. Es el mismo número
  // que `BALANCE.relojPorJugador`; vive aquí en ms porque el servidor cuenta
  // en ms y porque el Duelo tiene que poder cambiarlo sin tocar el balance.
  relojMs: 15 * 60 * 1e3,
  // Tope por decisión. Sin esto, quien se va a comer se lleva los quince
  // minutos del otro en espera; con esto, a los tres minutos sin contestar la
  // partida se da por perdida.
  turnoMaxMs: 3 * 60 * 1e3,
  // Cada cuánto pregunta el cliente si el rival ya jugó.
  sondeoMs: 2500,
  // Cuánto se queda uno en la cola antes de rendirse a que no hay nadie.
  esperaMaxMs: 3 * 60 * 1e3,
  // Pasos de fases automáticas que el servidor guarda para que el cliente los
  // anime: un turno son unos cinco, y un cliente que recarga no necesita más
  // de dos turnos atrás.
  pasosGuardados: 12
});
var FIN_DUELO = Object.freeze({
  TIEMPO: "TIEMPO",
  ABANDONO: "ABANDONO"
});

// supabase/functions/_compartido/duelo.js
function crearDuelo(semilla2, mazoA, mazoB, ahora) {
  if (!Number.isInteger(semilla2)) throw new PartidaInvalida("semilla inv\xE1lida");
  validarMazoLegal(mazoA);
  validarMazoLegal(mazoB);
  const estado = crearPartida(semilla2, [mazoA, mazoB]);
  const d = {
    semilla: semilla2,
    estado,
    // Lo que le queda a cada uno, y desde cuándo está decidiendo (null si no
    // le toca). El reloj sólo corre mientras te toca a ti, como en el ajedrez.
    tiempos: [DUELO.relojMs, DUELO.relojMs],
    desde: [null, null],
    // Los pasos de fases automáticas, numerados: el cliente pide «desde n».
    pasos: [],
    n: 0,
    fin: null
    // { ganador, motivo } cuando lo decide el reloj o una rendición
  };
  resolverAutomaticas(d);
  d.pasos = [];
  d.n = 0;
  abrirDecision(d, ahora);
  return d;
}
function deciden(d) {
  const s = d.estado;
  if (s.fase === FASE.DESPLIEGUE) return [0, 1].filter((j) => !s.jugadores[j].listo);
  if (s.fase === FASE.DESCARTE) {
    return [0, 1].filter((j) => s.jugadores[j].mano.length > BALANCE.manoMaxima);
  }
  return [];
}
function abrirDecision(d, ahora) {
  const quienes = deciden(d);
  for (const j of [0, 1]) d.desde[j] = quienes.includes(j) ? ahora : null;
}
function cerrarDecision(d, j, ahora) {
  if (d.desde[j] === null) return;
  d.tiempos[j] -= Math.max(0, ahora - d.desde[j]);
  d.desde[j] = null;
}
function restante(d, j, ahora) {
  const corriendo = d.desde[j] === null ? 0 : Math.max(0, ahora - d.desde[j]);
  return Math.max(0, d.tiempos[j] - corriendo);
}
var terminado = (d) => d.estado.fase === FASE.FIN || d.fin !== null;
function comprobarTiempo(d, ahora) {
  if (terminado(d)) return false;
  for (const j of deciden(d)) {
    const lleva = d.desde[j] === null ? 0 : ahora - d.desde[j];
    if (restante(d, j, ahora) <= 0 || lleva > DUELO.turnoMaxMs) {
      cerrar(d, 1 - j, FIN_DUELO.TIEMPO);
      return true;
    }
  }
  return false;
}
function rendirse(d, j) {
  if (terminado(d)) return;
  cerrar(d, 1 - j, FIN_DUELO.ABANDONO);
}
function cerrar(d, ganador, motivo) {
  d.fin = { ganador, motivo };
  d.desde = [null, null];
}
function resultado(d) {
  if (d.fin) return { ganador: d.fin.ganador, motivo: d.fin.motivo };
  if (d.estado.fase === FASE.FIN) return { ganador: d.estado.ganador, motivo: d.estado.motivoFin };
  return null;
}
function aplicarAccion(d, j, accion, ahora) {
  if (terminado(d)) throw new PartidaInvalida("el duelo ha terminado");
  if (!accion || typeof accion !== "object") throw new PartidaInvalida("jugada vac\xEDa");
  if (accion.tipo === ACCION.AVANZAR) throw new PartidaInvalida("las fases las avanza el servidor");
  if (!deciden(d).includes(j)) throw new PartidaInvalida("no te toca");
  const a = { ...accion, jugador: j };
  const motivo = validar(d.estado, a);
  if (motivo) throw new PartidaInvalida("jugada ilegal", { accion: a.tipo, motivo });
  d.estado = reduce(d.estado, a);
  if (!deciden(d).includes(j)) cerrarDecision(d, j, ahora);
  if (!FASES_INTERACTIVAS.includes(d.estado.fase) && d.estado.fase !== FASE.FIN) {
    resolverAutomaticas(d);
    abrirDecision(d, ahora);
  }
  return d;
}
function resolverAutomaticas(d) {
  let guardia = 0;
  while (!FASES_INTERACTIVAS.includes(d.estado.fase) && d.estado.fase !== FASE.FIN) {
    const fase = d.estado.fase;
    const desde = d.estado.eventos.length;
    d.estado = reduce(d.estado, { tipo: ACCION.AVANZAR });
    d.n += 1;
    d.pasos.push({ n: d.n, fase, eventosDesde: desde, estado: structuredClone(d.estado) });
    if (++guardia > 64) throw new PartidaInvalida("las fases no convergen");
  }
  while (d.pasos.length > DUELO.pasosGuardados) d.pasos.shift();
}
function vistaDuelo(d, j, desde = 0, ahora = 0) {
  const limpiar = (estado) => {
    const v = vistaDe(estado, j);
    v.jugadores[j].mazo = [...v.jugadores[j].mazo].sort((x, y) => x - y);
    delete v.rng;
    return desdeMiLado(v, j);
  };
  const r = resultado(d);
  const mio = (b) => b === null || b === void 0 ? b : j === 0 ? b : 1 - b;
  return {
    n: d.n,
    estado: limpiar(d.estado),
    pasos: d.pasos.filter((p) => p.n > desde).map((p) => ({
      n: p.n,
      fase: p.fase,
      eventosDesde: p.eventosDesde,
      estado: limpiar(p.estado)
    })),
    deciden: terminado(d) ? [] : deciden(d).map(mio).sort(),
    tiempos: j === 0 ? [restante(d, 0, ahora), restante(d, 1, ahora)] : [restante(d, 1, ahora), restante(d, 0, ahora)],
    fin: r ? { ganador: mio(r.ganador), motivo: r.motivo } : null
  };
}
var CLAVES_DE_BANDO = /* @__PURE__ */ new Set(["jugador", "dueno", "bando", "porBando", "ganador", "campoDe", "perspectiva"]);
function desdeMiLado(v, j) {
  if (j === 0) return v;
  const flip = (b) => b === 0 ? 1 : b === 1 ? 0 : b;
  const andar = (x, clave = null) => {
    if (Array.isArray(x)) return x.map((e) => andar(e));
    if (x && typeof x === "object") {
      const o = {};
      for (const [k, val] of Object.entries(x)) {
        if (CLAVES_DE_BANDO.has(k) && (val === 0 || val === 1)) o[k] = flip(val);
        else o[k] = andar(val, k);
      }
      if (o.tipo === "CHOQUE" && "a" in o && "b" in o) {
        [o.a, o.b] = [o.b, o.a];
        [o.danoA, o.danoB] = [o.danoB, o.danoA];
      }
      return o;
    }
    return x;
  };
  const w = andar(v);
  w.jugadores = [w.jugadores[1], w.jugadores[0]];
  w.ranuras = [w.ranuras[1], w.ranuras[0]];
  for (const jug of w.jugadores) jug.id = flip(jug.id);
  return w;
}

// src/data/ligas.js
var LIGAS = Object.freeze([
  // `desde` es el ELO donde empieza la liga; la última no tiene techo.
  Object.freeze({ id: "triasico", nombre: "Tri\xE1sico", desde: 0, metal: "cobre", divisiones: 3 }),
  Object.freeze({ id: "jurasico", nombre: "Jur\xE1sico", desde: 1150, metal: "lat\xF3n", divisiones: 3 }),
  Object.freeze({ id: "cretacico", nombre: "Cret\xE1cico", desde: 1450, metal: "oro", divisiones: 3 }),
  Object.freeze({ id: "extincion", nombre: "Extinci\xF3n", desde: 1750, metal: "oro roto", divisiones: 1 })
]);
var ELO = Object.freeze({
  inicial: 1200,
  // Cuánto mueve una partida. 32 es el clásico; alto al principio para que una
  // cuenta nueva encuentre su sitio en diez duelos y no en cuarenta.
  k: 32,
  kNuevo: 64,
  duelosDeNovato: 10,
  // Suelo: de Triásico III no se baja, y la fórmula tampoco puede bajar de aquí.
  suelo: 800
});
function eloTras(eloA, eloB, resultadoA, duelosA = 99, duelosB = 99) {
  const esperadoA = 1 / (1 + 10 ** ((eloB - eloA) / 400));
  const esperadoB = 1 - esperadoA;
  const kA = duelosA < ELO.duelosDeNovato ? ELO.kNuevo : ELO.k;
  const kB = duelosB < ELO.duelosDeNovato ? ELO.kNuevo : ELO.k;
  const a = Math.round(eloA + kA * (resultadoA - esperadoA));
  const b = Math.round(eloB + kB * (1 - resultadoA - esperadoB));
  return { a: Math.max(ELO.suelo, a), b: Math.max(ELO.suelo, b) };
}

// src/data/logros.js
var RECOMPENSA = Object.freeze({
  TITULO: "titulo",
  COSMETICO: "cosmetico",
  MAZO: "mazo",
  SOBRES: "sobres"
});
var L = (id, nombre, texto, mide, meta, recompensa) => Object.freeze({
  id,
  nombre,
  texto,
  mide,
  meta,
  recompensa: Object.freeze(recompensa)
});
var LOGROS = Object.freeze([
  // Los de entrar en cada modo: baratos, para que quien no ha probado el duelo
  // o la cuenca tenga un motivo pequeño para asomarse.
  L("duelista", "Duelista", "Juega 1 duelo", "duelos", 1, { tipo: RECOMPENSA.TITULO, id: "titulo_duelista" }),
  L("asaltante", "Asaltante", "Asalta al jefe 5 veces", "asaltos", 5, { tipo: RECOMPENSA.TITULO, id: "titulo_asaltante" }),
  // El golpe de gracia: el asalto que deja al jefe a cero. Se lo lleva quien
  // lo da, que es lo único que el servidor puede saber sin repartir méritos.
  L("cazador", "Cazador de jefes", "Da el golpe final a 1 jefe", "jefesVencidos", 1, { tipo: RECOMPENSA.TITULO, id: "titulo_cazador" }),
  // Los de las cartas de jefe: se cumplen al RECLAMAR la carta, o sea, al
  // haberle hecho daño a una cacería que la tribu terminó. Es la forma de que
  // el retrato del jefe sea de quien lo cazó con los suyos y no sólo de quien
  // dio el último golpe. Los avanza `reclamar_jefe` (0028).
  L(
    "trofeo_saurophaganax",
    "El due\xF1o de la llanura",
    "Reclama 1 carta del Saurophaganax",
    "jefe:saurophaganax",
    1,
    { tipo: RECOMPENSA.COSMETICO, id: "retrato_saurophaganax" }
  ),
  L(
    "trofeo_barosaurus",
    "El gigante del r\xEDo",
    "Reclama 1 carta del Barosaurus",
    "jefe:barosaurus",
    1,
    { tipo: RECOMPENSA.COSMETICO, id: "retrato_barosaurus" }
  ),
  L(
    "trofeo_supersaurus",
    "El horizonte que camina",
    "Reclama 1 carta del Supersaurus",
    "jefe:supersaurus",
    1,
    { tipo: RECOMPENSA.COSMETICO, id: "retrato_supersaurus" }
  ),
  L(
    "trofeo_hesperosaurus",
    "Detr\xE1s de la muralla",
    "Reclama 1 carta del Hesperosaurus",
    "jefe:hesperosaurus",
    1,
    { tipo: RECOMPENSA.COSMETICO, id: "retrato_hesperosaurus" }
  ),
  L(
    "trofeo_harpactognathus",
    "La sombra del r\xEDo",
    "Reclama 1 carta del Harpactognathus",
    "jefe:harpactognathus",
    1,
    { tipo: RECOMPENSA.COSMETICO, id: "retrato_harpactognathus" }
  ),
  // Con cinco jefes el dorso pide las cinco: una vuelta entera del calendario.
  L(
    "cazador_mayor",
    "Cazador mayor",
    "Reclama las 5 cartas de jefe",
    "cartasJefe",
    5,
    { tipo: RECOMPENSA.COSMETICO, id: "dorso_cazador" }
  ),
  // Los de constancia.
  L("campeon", "Campe\xF3n", "Gana 10 duelos", "duelosGanados", 10, { tipo: RECOMPENSA.TITULO, id: "titulo_campeon" }),
  L("explorador", "Explorador", "Gana 10 partidas", "victorias", 10, { tipo: RECOMPENSA.SOBRES, n: 3 }),
  L("demoledor", "Demoledor", "Hazle 300 de da\xF1o a los jefes", "danoJefe", 300, { tipo: RECOMPENSA.SOBRES, n: 5 }),
  // Los grandes: un mazo inicial más. Eran los otros dos que no elegiste al
  // empezar y sólo se podían completar a base de sobres.
  L("morrison", "La Morrison entera", "Vence por primera vez a los 8 rivales de la Morrison", "expedicionNuevos", 8, { tipo: RECOMPENSA.MAZO }),
  L("veterano", "Veterano", "Gana 25 duelos", "duelosGanados", 25, { tipo: RECOMPENSA.MAZO }),
  // Y el más grande: el estandarte azul con su cinta.
  L(
    "leyenda",
    "Leyenda del duelo",
    "Gana 50 duelos",
    "duelosGanados",
    50,
    { tipo: RECOMPENSA.COSMETICO, id: "estandarte_campeon" }
  )
]);
var LOGRO_POR_ID = Object.freeze(Object.fromEntries(LOGROS.map((l) => [l.id, l])));
var ES_VOCABULARIO2 = new Set(VOCABULARIO);
function avancesDeLogros(parte) {
  return LOGROS.map((l) => ({ id: l.id, avance: parte[l.mide] ?? 0, meta: l.meta, recompensa: l.recompensa })).filter((a) => a.avance > 0);
}

// supabase/functions/asalto/index.ts
function avancesConPremio(dia, parte) {
  return avancesDelParte(dia, parte).map((a) => {
    const m = POR_ID[a.id];
    return { id: a.id, avance: a.avance, meta: m.meta, premio: m.premio };
  });
}
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
    if (tipo === "duelo") return await hacerDuelo(servicio, user.id, envio);
    return json({ error: `no s\xE9 hacer \xAB${tipo}\xBB` }, 400);
  } catch (e) {
    if (e instanceof AsaltoInvalido) {
      return json({ error: e.message, detalle: e.detalle }, 422);
    }
    throw e;
  }
});
async function hacerAsalto(servicio, jugadorId, envio) {
  const resultado2 = validarAsalto(envio);
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
    p_dano: resultado2.dano,
    p_turnos: resultado2.turnos,
    p_ganada: resultado2.ganada,
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
  const dia = diaUTC();
  const parte = {
    asaltos: 1,
    danoJefe: Math.max(0, Math.round(Number(resultado2.dano) || 0)),
    jefesVencidos: fila?.cayo ? 1 : 0
  };
  const { data: av, error: errAv } = await servicio.rpc("aplicar_avances", {
    p_jugador: jugadorId,
    p_dia: dia,
    p_avances: avancesConPremio(dia, parte),
    p_logros: avancesDeLogros(parte)
  });
  if (errAv) console.error("aplicar_avances", errAv.message);
  return json({
    dano: resultado2.dano,
    turnos: resultado2.turnos,
    ganada: resultado2.ganada,
    vida: fila?.vida ?? null,
    cayo: fila?.cayo ?? false,
    almacen: fila?.almacen ?? null,
    monedas: av?.monedas ?? null,
    misiones: av?.misiones ?? 0,
    cumplidas: av?.cumplidas ?? [],
    logros: av?.logros ?? []
  });
}
async function hacerVictoria(servicio, jugadorId, envio) {
  const resultado2 = validarSolitario(envio);
  const { error: errMazo } = await servicio.rpc("validar_mazo_de", {
    p_jugador: jugadorId,
    p_cartas: aObjeto(envio.mazo)
  });
  if (errMazo) return json({ error: errMazo.message }, 422);
  if (await enUnDia(servicio, "partidas", jugadorId, "jugado_en") >= ECONOMIA.victoriasPorDia) {
    return json({ error: "ya has cobrado tus partidas de hoy" }, 429);
  }
  const dia = diaUTC();
  let expedicion = null;
  if (resultado2.ganada && resultado2.rival) {
    const { rival: r } = rivalPorId(resultado2.rival);
    const { data: exp, error: errExp } = await servicio.rpc("aplicar_expedicion", {
      p_jugador: jugadorId,
      p_clave: claveDeVictoria(r.id, dia),
      p_rival: r.id,
      p_requisito: requisitoDe(r.id),
      p_premio: r.premio
    });
    if (errExp) console.error("aplicar_expedicion", errExp.message);
    else expedicion = exp;
  }
  const parte = {
    ...resultado2.parte,
    expediciones: resultado2.rival ? 1 : 0,
    expedicionNuevos: expedicion?.primera ? 1 : 0
  };
  const { data, error } = await servicio.rpc("aplicar_partida", {
    p_jugador: jugadorId,
    p_semilla: envio.semilla,
    p_turnos: resultado2.turnos,
    p_ganada: resultado2.ganada,
    p_monedas: resultado2.premio,
    p_dia: dia,
    p_avances: avancesConPremio(dia, parte),
    p_logros: avancesDeLogros(parte)
  });
  if (error) {
    const yaCobrada = error.code === "23505";
    return json(
      { error: yaCobrada ? "esa partida ya se cobr\xF3" : error.message },
      yaCobrada ? 409 : 400
    );
  }
  return json({
    ganada: resultado2.ganada,
    turnos: resultado2.turnos,
    premio: data?.premio ?? 0,
    // Lo que pagó la expedición, aparte del premio de la victoria: la pantalla
    // de fin lo dice por separado, que son dos cosas.
    expedicion: expedicion ?? null,
    monedas: data?.monedas ?? null,
    // Lo que las misiones aportaron, para que la pantalla de fin lo diga en vez
    // de que aparezcan monedas de la nada.
    misiones: data?.misiones ?? 0,
    cumplidas: data?.cumplidas ?? [],
    logros: data?.logros ?? [],
    dia: data?.dia ?? dia
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
async function hacerDuelo(servicio, jugadorId, envio) {
  const op = envio.op;
  const ahora = Date.now();
  if (op === "buscar" || op === "retar") {
    const mazo = envio.mazo;
    validarMazoLegal(mazo);
    const { error: errMazo } = await servicio.rpc("validar_mazo_de", {
      p_jugador: jugadorId,
      p_cartas: aObjeto(mazo)
    });
    if (errMazo) return json({ error: errMazo.message }, 422);
    const semilla2 = crypto.getRandomValues(new Uint32Array(1))[0] & 2147483647;
    const { data, error } = await servicio.rpc(op === "buscar" ? "duelo_buscar" : "duelo_retar", {
      p_jugador: jugadorId,
      p_mazo: mazo,
      p_semilla: semilla2
    });
    if (error) return json({ error: error.message }, 409);
    return await responderDuelo(servicio, jugadorId, await asegurarDatos(servicio, data, ahora), 0, ahora);
  }
  if (op === "aceptar") {
    const mazo = envio.mazo;
    validarMazoLegal(mazo);
    const { error: errMazo } = await servicio.rpc("validar_mazo_de", {
      p_jugador: jugadorId,
      p_cartas: aObjeto(mazo)
    });
    if (errMazo) return json({ error: errMazo.message }, 422);
    const { data, error } = await servicio.rpc("duelo_aceptar", {
      p_jugador: jugadorId,
      p_codigo: String(envio.codigo ?? ""),
      p_mazo: mazo
    });
    if (error) return json({ error: error.message }, 409);
    return await responderDuelo(servicio, jugadorId, await asegurarDatos(servicio, data, ahora), 0, ahora);
  }
  if (op === "cancelar") {
    const { error } = await servicio.rpc("duelo_cancelar", { p_jugador: jugadorId });
    if (error) return json({ error: error.message }, 409);
    return json({ ok: true });
  }
  if (op === "estado" || op === "accion" || op === "rendirse") {
    const id = String(envio.id ?? "");
    let { data: fila, error } = await servicio.from("duelos").select("*").eq("id", id).single();
    if (error || !fila) return json({ error: "ese duelo no existe" }, 404);
    if (fila.jugador_a !== jugadorId && fila.jugador_b !== jugadorId) {
      return json({ error: "ese duelo no es tuyo" }, 403);
    }
    const bando = fila.jugador_a === jugadorId ? 0 : 1;
    const desde = Number(envio.desde ?? 0) || 0;
    if (fila.estado === "esperando") {
      if (op !== "estado") return json({ error: "todav\xEDa no hay rival" }, 409);
      return await responderDuelo(servicio, jugadorId, fila, desde, ahora);
    }
    fila = await asegurarDatos(servicio, fila, ahora);
    if (!fila.datos) return json({ id: fila.id, estado: "preparando" });
    let d = null;
    for (let intento = 0; intento < 4; intento++) {
      d = structuredClone(fila.datos);
      let cambio = comprobarTiempo(d, ahora);
      if (fila.estado !== "terminado") {
        if (op === "accion") {
          aplicarAccion(d, bando, envio.accion, ahora);
          cambio = true;
        }
        if (op === "rendirse") {
          rendirse(d, bando);
          cambio = true;
        }
      }
      if (!cambio) break;
      const { data: escrito, error: errEscritura } = await servicio.from("duelos").update({ datos: d, version: fila.version + 1, actualizado_en: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id).eq("version", fila.version).select("version");
      if (errEscritura) return json({ error: errEscritura.message }, 500);
      if (escrito && escrito.length) {
        fila.datos = d;
        fila.version += 1;
        break;
      }
      const releida = await servicio.from("duelos").select("*").eq("id", id).single();
      if (releida.error || !releida.data) return json({ error: "el duelo se perdi\xF3" }, 500);
      fila = releida.data;
      if (intento === 3) return json({ error: "el duelo est\xE1 muy solicitado, prueba otra vez" }, 409);
    }
    if (terminado(fila.datos) && fila.estado !== "terminado") {
      fila = await cerrarDuelo(servicio, fila);
    }
    return await responderDuelo(servicio, jugadorId, fila, desde, ahora);
  }
  return json({ error: "op de duelo desconocida", detalle: op }, 400);
}
async function asegurarDatos(servicio, fila, ahora) {
  if (!fila || fila.estado !== "jugando" || fila.datos) return fila;
  const d = crearDuelo(Number(fila.semilla), fila.mazo_a, fila.mazo_b, ahora);
  const { data } = await servicio.from("duelos").update({ datos: d, version: fila.version + 1, actualizado_en: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", fila.id).eq("version", fila.version).is("datos", null).select("*").maybeSingle();
  if (data) return data;
  const { data: releida } = await servicio.from("duelos").select("*").eq("id", fila.id).single();
  return releida ?? fila;
}
async function cerrarDuelo(servicio, fila) {
  const r = resultado(fila.datos);
  const { data: js } = await servicio.from("jugadores").select("id, duelos").in("id", [fila.jugador_a, fila.jugador_b]);
  const duelosDe = (id) => (js ?? []).find((x) => x.id === id)?.duelos ?? 0;
  const nuevos = eloTras(
    fila.elo_a,
    fila.elo_b,
    r.ganador === 0 ? 1 : 0,
    duelosDe(fila.jugador_a),
    duelosDe(fila.jugador_b)
  );
  const dia = diaUTC();
  const parteDe = (gano) => ({
    partidas: 1,
    victorias: gano ? 1 : 0,
    duelos: 1,
    duelosGanados: gano ? 1 : 0
  });
  const pa = parteDe(r.ganador === 0);
  const pb = parteDe(r.ganador === 1);
  const { error } = await servicio.rpc("duelo_cerrar", {
    p_id: fila.id,
    p_ganador: r.ganador,
    p_motivo: r.motivo,
    p_turnos: fila.datos.estado.turno,
    p_elo_a: nuevos.a,
    p_elo_b: nuevos.b,
    p_monedas_victoria: ECONOMIA.monedasVictoria,
    p_dia: dia,
    p_avances_a: avancesConPremio(dia, pa),
    p_avances_b: avancesConPremio(dia, pb),
    p_logros_a: avancesDeLogros(pa),
    p_logros_b: avancesDeLogros(pb)
  });
  if (error) console.error("duelo_cerrar", error.message);
  const { data } = await servicio.from("duelos").select("*").eq("id", fila.id).single();
  return data ?? fila;
}
async function responderDuelo(servicio, jugadorId, fila, desde, ahora) {
  const bando = fila.jugador_a === jugadorId ? 0 : 1;
  const rivalId = bando === 0 ? fila.jugador_b : fila.jugador_a;
  const { data: js } = await servicio.from("jugadores").select("id, apodo, elo, duelos").in("id", [jugadorId, rivalId].filter(Boolean));
  const de = (id) => (js ?? []).find((x) => x.id === id) ?? null;
  const yo = de(jugadorId);
  const rival3 = de(rivalId);
  const base = {
    id: fila.id,
    estado: fila.estado,
    codigo: fila.codigo,
    bando,
    yo: yo ? { apodo: yo.apodo, elo: yo.elo, duelos: yo.duelos } : null,
    rival: rival3 ? { apodo: rival3.apodo, elo: rival3.elo, duelos: rival3.duelos } : null,
    eloInicial: bando === 0 ? fila.elo_a : fila.elo_b
  };
  if (fila.estado === "esperando" || !fila.datos) return json(base);
  return json({ ...base, ...vistaDuelo(fila.datos, bando, desde, ahora) });
}
