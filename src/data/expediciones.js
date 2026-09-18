// DinoWar — las Expediciones: el solitario como un camino de rivales.
//
// Antes el solitario era un solo rival —el mazo de referencia— con dos
// cabezas: «Fácil» jugaba al azar y «Normal» con la heurística. Se sentía
// plano porque lo era. Ahora cada formación geológica es un mapa con rivales
// en fila, cada uno con SU mazo y su manera de jugar, y ganar a uno abre el
// siguiente. La dificultad la da el camino, no un botón.
//
// Es un fichero de DATOS, como las misiones y las ligas, y lo usan los dos
// lados: el navegador para pintar el mapa y el servidor para re-jugar. Por
// eso el mazo del rival NUNCA viaja en la petición: el navegador manda el id
// del nodo y el servidor busca aquí el mazo. Si lo mandara el cliente,
// cualquiera jugaría contra cincuenta y cinco cartas elegidas para perder.
//
// Los perfiles van como texto y no importando `PERFIL` de la IA: `src/data/`
// no depende del motor. `test/expediciones.test.js` comprueba que existen.

import { carta } from './cards.js';
import { BALANCE } from './balance.js';

/** La familia de Biomasa con la que se completa un mazo, en este orden. */
const RELLENO = ['biomasa', 'araucarias', 'cicadas', 'ginkgos', 'equisetos', 'galeria', 'helechal'];

/** Tope de copias, con el propio de la Pradera. */
const topeDe = (id) => carta(id).copiasMax ?? BALANCE.copiasPorRareza[carta(id).rareza];

/**
 * Completa un mazo temático hasta las cartas exactas con Biomasa común. Un
 * rival se escribe por lo que lo hace distinto, no por su relleno: así cada
 * mazo cabe en tres líneas y se lee de qué va.
 */
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

const rival = (o) => Object.freeze({ ...o, mazo: completar(o.mazo) });

// ------------------------------------------------------------ la Morrison

export const EXPEDICIONES = Object.freeze([
  Object.freeze({
    id: 'morrison',
    nombre: 'Formación Morrison',
    era: 'Jurásico Superior · 155–148 Ma',
    mapa: 'mapa_morrison',
    rivales: Object.freeze([
      // El ORDEN sale de medirlos (`node sim/expediciones.mjs`), no de cómo
      // suenan: el rebaño de saurópodos parecía un cuarto nodo y resultó más
      // duro que el clan de Ceratosaurus. Jugar con cabeza apenas endurece un
      // mazo flojo —el muro pasa del 99 % al 95 %—: la dificultad la da el mazo.
      rival({
        id: 'cria_dryosaurus',
        nombre: 'La cría de Dryosaurus',
        lema: 'Muchos, pequeños y nerviosos. Corren más de lo que pegan.',
        retrato: 'dryosaurus',
        perfil: 'aleatoria',
        premio: 20,
        mazo: [
          ['dryosaurus', 3], ['eosinopteryx', 3], ['bienosaurus', 3], ['troodon', 3],
          ['platyceratops', 3], ['liaoceratops', 3], ['shuangmiaosaurus', 3], ['athenar', 3],
          ['nido', 3], ['insectos', 3], ['sabana_helechos', 3], ['gregarismo', 3],
        ],
      }),
      rival({
        id: 'muro_de_placas',
        nombre: 'El muro de placas',
        lema: 'Tireóforos que no avanzan: esperan a que te rompas contra ellos.',
        retrato: 'stegosaurus',
        perfil: 'heuristica',
        premio: 25,
        mazo: [
          ['stegosaurus', 3], ['kentrosaurus', 3], ['bienosaurus', 3], ['loricatosaurus', 3],
          ['gargoyleosaurus', 3], ['invictarx', 3], ['nodosaurus', 2], ['euoplocephalus', 3],
          ['gastrolitos', 2], ['fractura', 2], ['canal_trenzado', 3], ['rebrote', 3],
        ],
      }),
      rival({
        id: 'cazadores_de_orilla',
        nombre: 'Cazadores de orilla',
        lema: 'Terópodos pequeños en jauría. Si los dejas crecer, muerden.',
        retrato: 'ornitholestes',
        perfil: 'heuristica',
        premio: 30,
        mazo: [
          ['ornitholestes', 3], ['ceratosaurus', 3], ['dromaeosaurus', 3], ['troodon', 3],
          ['velociraptor', 3], ['ojoraptorsaurus', 3], ['halszkaraptor', 3], ['tongtianlong', 3],
          ['allosaurus', 2], ['riparovenator', 2], ['trampa', 3], ['fractura', 2],
          ['gregarismo', 3], ['crecimiento_acelerado', 1],
        ],
      }),
      rival({
        id: 'clan_ceratosaurus',
        nombre: 'El clan de Ceratosaurus',
        lema: 'Todo dientes y ninguna paciencia. Si sobrevives al turno 5, es tuyo.',
        retrato: 'ceratosaurus',
        perfil: 'heuristica',
        premio: 35,
        mazo: [
          ['ceratosaurus', 3], ['ornitholestes', 3], ['allosaurus', 3], ['torvosaurus', 2],
          ['riparovenator', 2], ['dromaeosaurus', 3], ['velociraptor', 3], ['monolophosaurus', 3],
          ['carnotaurus', 2], ['fractura', 2], ['competencia', 2], ['gregarismo', 3],
          ['trampa', 2],
        ],
      }),
      rival({
        id: 'lago_toodichi',
        nombre: 'El lago T’oo’dichi’',
        lema: 'Lo que vuela y lo que nada. Llegan por donde no miras.',
        retrato: 'huaxiadraco',
        perfil: 'heuristica',
        premio: 50,
        mazo: [
          ['plesiopleurodon', 2], ['scanisaurus', 3], ['elasmosaurus', 3], ['huaxiadraco', 3],
          ['pteranodon', 3], ['quetzalcoatlus', 2], ['halszkaraptor', 3], ['suchomimus', 2],
          ['lago', 2], ['humedal', 2], ['inundacion', 3], ['canal_trenzado', 2],
        ],
      }),
      rival({
        id: 'rebano_de_cuellos',
        nombre: 'El rebaño de cuellos largos',
        lema: 'Saurópodos que se curan y no se caen. Hay que ganarles por fósiles.',
        retrato: 'diplodocus',
        perfil: 'heuristica',
        premio: 60,
        mazo: [
          ['diplodocus', 3], ['apatosaurus', 3], ['camarasaurus', 3], ['amargasaurus', 3],
          ['plateosauravus', 3], ['athenar', 2], ['atlasaurus', 2], ['mamenchisaurus', 3],
          ['brachiosaurus', 1], ['gastrolitos', 2], ['canal_trenzado', 3], ['sabana', 1],
          ['rebrote', 3],
        ],
      }),
      rival({
        id: 'cantera_cleveland',
        nombre: 'La cantera Cleveland-Lloyd',
        lema: 'El barro se lo traga todo. Cuida tu mazo: aquí se pierde por extinción.',
        retrato: 'allosaurus',
        perfil: 'heuristica',
        premio: 70,
        mazo: [
          ['trampa', 3], ['mortandad', 1], ['deriva_arida', 2], ['inundacion', 3],
          ['aridez', 1], ['suchomimus', 2], ['quetzalcoatlus', 2], ['spinosaurus', 1],
          ['allosaurus', 3], ['ceratosaurus', 3], ['stegoceras', 3], ['gargoyleosaurus', 3],
          ['manada_paso', 3], ['dryosaurus', 3], ['huaxiadraco', 3],
        ],
      }),
      rival({
        id: 'big_al',
        nombre: 'Big Al',
        lema: 'El Allosaurus más famoso de la Morrison: diecinueve heridas y ninguna le paró.',
        retrato: 'allosaurus',
        perfil: 'heuristica',
        premio: 120,
        mazo: [
          ['allosaurus', 3], ['torvosaurus', 2], ['tyrannotitan', 1], ['ceratosaurus', 3],
          ['ornitholestes', 3], ['stegosaurus', 3], ['nodosaurus', 2], ['diplodocus', 3],
          ['apatosaurus', 3], ['camarasaurus', 2], ['lokiceratops', 1],
          ['crecimiento_acelerado', 1], ['neumaticidad', 2], ['fractura', 2], ['gregarismo', 3],
          ['trampa', 3], ['gastrolitos', 2], ['sabana', 1],
        ],
      }),
    ]),
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
    id: 'hell_creek',
    nombre: 'Formación Hell Creek',
    era: 'Cretácico Superior · 68–66 Ma',
    mapa: 'mapa_hell_creek',
    requiere: 'morrison',
    rivales: Object.freeze([
      // El orden NO es el que se escribió: salió de medirlo. El clan de los
      // cuernos se pensó cuarto y ganaba el 85 % —dos auras de clado apiladas
      // sobre marginocéfalos baratos es lo más fuerte que hay en el set—, y
      // el invierno del impacto, pensado como penúltimo golpe, perdía el 82 %
      // porque un mazo que sólo muele no gana: la extinción está en el 0 %.
      //
      // El camino sigue el dibujo del mapa, que va de los bosques del interior
      // a la costa y termina en el cráter.
      rival({
        id: 'sotobosque_hell_creek',
        nombre: 'Los pequeños del sotobosque',
        lema: 'Lo que corretea entre los helechos. Ninguno te mata; todos juntos, sí.',
        retrato: 'platyceratops',
        perfil: 'heuristica',
        premio: 35,
        mazo: [
          ['platyceratops', 3], ['liaoceratops', 3], ['troodon', 3], ['tongtianlong', 3],
          ['halszkaraptor', 3], ['pteranodon', 3], ['shuangmiaosaurus', 3], ['stegoceras', 3],
          ['alaskacephale', 3], ['chasmosaurus', 3], ['medusaceratops', 1], ['nido', 3], ['insectos', 3], ['gregarismo', 3],
        ],
      }),
      rival({
        id: 'los_blindados',
        nombre: 'Los blindados',
        lema: 'Osteodermos y mazas. Lo que les pega se lleva la mitad de vuelta.',
        retrato: 'ankylosaurus',
        perfil: 'heuristica',
        premio: 50,
        mazo: [
          ['ankylosaurus', 1], ['euoplocephalus', 3], ['nodosaurus', 2], ['gargoyleosaurus', 3],
          ['invictarx', 3], ['stegoceras', 3], ['loricatosaurus', 3], ['bienosaurus', 3],
          // Sin molienda: se probó con la Sequía y la Trampa y el muro pasó
          // del 74 % al 80 %, o sea que empeoró. Un mazo que sólo muele no
          // gana —la extinción está en el 0 %— y encima gasta las ranuras.
          ['mortandad', 1], ['competencia', 2],
          ['canal_trenzado', 3], ['rebrote', 3], ['gregarismo', 3],
        ],
      }),
      rival({
        id: 'cabezas_de_hueso',
        nombre: 'Las cabezas de hueso',
        lema: 'Cráneos de veinte centímetros de grosor. Golpean al llegar y siguen andando.',
        retrato: 'pachycephalosaurus',
        perfil: 'heuristica',
        premio: 60,
        mazo: [
          ['pachycephalosaurus', 3], ['stegoceras', 3], ['alaskacephale', 3], ['liaoceratops', 3],
          ['platyceratops', 3], ['chasmosaurus', 3], ['wendiceratops', 1], ['therizinosaurus', 3],
          ['troodon', 3], ['gregarismo', 3], ['fractura', 2], ['competencia', 2], ['nido', 3],
        ],
      }),
      rival({
        id: 'marisma_edmontosaurus',
        nombre: 'La marisma de Edmontosaurus',
        lema: 'Hadrosaurios a cientos. No pegan: te cansan y se curan.',
        retrato: 'edmontosaurus',
        perfil: 'heuristica',
        premio: 70,
        mazo: [
          ['edmontosaurus', 1], ['parasaurolophus', 3], ['brachylophosaurus', 3], ['rhinorex', 2],
          ['maiasaura', 1], ['shuangmiaosaurus', 3], ['iguanodon', 3], ['canal_trenzado', 3],
          ['nido', 3], ['gregarismo', 3], ['rebrote', 3], ['gastrolitos', 2],
          ['crecimiento_acelerado', 1], ['competencia', 2], ['fractura', 2],
        ],
      }),
      rival({
        id: 'mar_interior',
        nombre: 'El mar interior',
        lema: 'La vía marítima parte el continente en dos. Llega por agua y por aire.',
        retrato: 'mosasaurus',
        perfil: 'heuristica',
        premio: 90,
        mazo: [
          ['mosasaurus', 1], ['elasmosaurus', 3], ['plesiopleurodon', 2], ['scanisaurus', 3],
          ['quetzalcoatlus', 2], ['pteranodon', 3], ['huaxiadraco', 3], ['suchomimus', 2],
          ['inundacion', 3], ['competencia', 2], ['fractura', 2],
          ['canal_trenzado', 3], ['nido', 3], ['gregarismo', 3],
        ],
      }),
      rival({
        id: 'clan_de_los_cuernos',
        nombre: 'El clan de los cuernos',
        lema: 'Golas que se cubren unas a otras. Cuanto más entran, más pega cada una.',
        retrato: 'triceratops',
        perfil: 'heuristica',
        premio: 110,
        mazo: [
          // Sin Medusaceratops y sin Crecimiento acelerado: con los dos ganaba
          // el 85 %. Dos auras de clado apiladas sobre marginocéfalos baratos
          // es lo más fuerte que tiene el set, y aquí no toca todavía.
          ['triceratops', 2], ['titanoceratops', 1], ['wendiceratops', 1],
          ['lokiceratops', 2], ['chasmosaurus', 3], ['liaoceratops', 3], ['platyceratops', 3],
          ['alaskacephale', 3], ['stegoceras', 3], ['gregarismo', 3], ['nido', 3],
          ['canal_trenzado', 3],
        ],
      }),
      rival({
        id: 'invierno_del_impacto',
        nombre: 'El invierno del impacto',
        lema: 'Ceniza en el cielo y nada que comer. Aquí no se gana: se dura más.',
        retrato: 'quetzalcoatlus',
        perfil: 'heuristica',
        premio: 130,
        mazo: [
          // La Mortandad es asimétrica a propósito: 3 de daño a todo el campo
          // barre una mano de criaturas baratas y a éstas no las despeina.
          ['aridez', 1], ['mortandad', 1], ['carrona', 1], ['competencia', 2], ['fractura', 2],
          ['neumaticidad', 2], ['crecimiento_acelerado', 1], ['medusaceratops', 2],
          ['therizinosaurus', 3], ['euoplocephalus', 3], ['elasmosaurus', 3], ['quetzalcoatlus', 2],
          ['carnotaurus', 2], ['mosasaurus', 1], ['titanoceratops', 2], ['triceratops', 2],
          ['wendiceratops', 2], ['dromaeosaurus', 3],
        ],
      }),
      rival({
        id: 'el_ultimo_rey',
        nombre: 'El último rey',
        lema: 'Ocho toneladas de tiranosaurio en el último millón de años del Mesozoico.',
        retrato: 'tyrannosaurus',
        perfil: 'heuristica',
        premio: 210,
        mazo: [
          ['tyrannosaurus', 1], ['triceratops', 2], ['wendiceratops', 2], ['titanoceratops', 2],
          ['medusaceratops', 2],
          ['ankylosaurus', 1], ['edmontosaurus', 1], ['carnotaurus', 2], ['quetzalcoatlus', 2],
          ['pachycephalosaurus', 3], ['dromaeosaurus', 3], ['troodon', 3], ['velociraptor', 3],
          // Llevaba un Mosasaurus, y con él eran CUATRO criaturas legendarias:
          // un mazo que desde el tope de tres (16-09-2026) ningún jugador puede
          // construir, y un rival de expedición no juega con cartas prohibidas.
          // Se va el que menos pinta en Hell Creek —el único marino— y entra un
          // marginocéfalo más, que las dos auras de la lista ya están puestas.
          // Medido con `node sim/expediciones.mjs`, 400 partidas: se le ganaba
          // el 21,8 % y se le gana el 24,5 %. Sigue siendo con diferencia el
          // nodo más duro del juego, que es lo que tiene que ser.
          ['alaskacephale', 1], ['carrona', 1],
          ['mortandad', 1], ['competencia', 2], ['crecimiento_acelerado', 1], ['neumaticidad', 2],
          ['fractura', 2], ['gregarismo', 3], ['trampa', 3],
        ],
      }),
    ]),
  }),
  // ---------------------------------------------------------- Tendaguru
  //
  // La hermana africana de la Morrison: mismo Jurásico Superior, otra orilla
  // del Tetis. Hasta el 16-09-2026 era imposible sin repetir la Morrison; con
  // Giraffatitan, Rugops, Nigersaurus y Deltadromeus —africanos los cuatro—
  // y los tireóforos y eventos de las tres rondas, ya tiene cuerpo propio.
  // El mapa va de la meseta seca de arriba a la costa del mar cálido de abajo.
  Object.freeze({
    id: 'tendaguru',
    nombre: 'Formación Tendaguru',
    era: 'Jurásico Superior · 155–145 Ma',
    mapa: 'mapa_tendaguru',
    requiere: 'hell_creek',
    rivales: Object.freeze([
      rival({
        id: 'corredores_de_la_meseta',
        nombre: 'Los corredores de la meseta',
        lema: 'Ornitópodos enanos a cientos. No paran quietos y no valen nada por separado.',
        retrato: 'dryosaurus',
        perfil: 'aleatoria',
        premio: 50,
        mazo: [
          ['dryosaurus', 3], ['eosinopteryx', 3], ['tongtianlong', 3], ['troodon', 3],
          ['shuangmiaosaurus', 3], ['thescelosaurus', 3], ['psittacosaurus', 3], ['kentrosaurus', 3],
          ['migracion', 2], ['gregarismo', 3], ['oleada', 3], ['nido', 3],
        ],
      }),
      rival({
        id: 'llanura_de_marea',
        nombre: 'La llanura de marea',
        lema: 'Sube el agua y con ella lo que vive dentro. Baja, y se lleva lo que dejaste.',
        retrato: 'elasmosaurus',
        perfil: 'heuristica',
        premio: 60,
        mazo: [
          ['elasmosaurus', 3], ['scanisaurus', 3], ['plesiopleurodon', 2], ['huaxiadraco', 3],
          ['pteranodon', 3], ['tupandactylus', 2], ['halszkaraptor', 3],
          ['crecida_delta', 3], ['lago', 2], ['sedimento', 2], ['humedal', 2], ['nido', 3],
        ],
      }),
      rival({
        id: 'espinas_de_kentrosaurus',
        nombre: 'Las espinas de Kentrosaurus',
        lema: 'Púas en la cola, púas en los hombros. Todo lo que lo toca se pincha.',
        retrato: 'kentrosaurus',
        perfil: 'heuristica',
        premio: 70,
        mazo: [
          // Con Invictarx —el aura de los tireóforos— y sin la Barrera: medía 91 % y un muro sin aura es un muro bajo.
          ['kentrosaurus', 3], ['stegosaurus', 3], ['loricatosaurus', 3], ['bienosaurus', 3],
          ['sauropelta', 3], ['zuul', 3], ['gargoyleosaurus', 3], ['euoplocephalus', 3],
          ['invictarx', 3], ['nodosaurus', 2],
          ['rebrote', 3], ['canal_trenzado', 3], ['fractura', 2],
        ],
      }),
      rival({
        id: 'cazadores_de_la_meseta',
        nombre: 'Los cazadores de la meseta',
        lema: 'Abelisaurios y alosaurios en la misma tierra. Aquí nadie caza solo.',
        retrato: 'rugops',
        perfil: 'heuristica',
        premio: 90,
        mazo: [
          // Medía 89 % con jauría pequeña y Carroñeros. Entran Monolophosaurus (aura) y Torvosaurus; sale lo que no pega.
          ['ceratosaurus', 3], ['allosaurus', 3], ['ojoraptorsaurus', 3], ['dromaeosaurus', 3],
          ['rugops', 3], ['deltadromeus', 2], ['monolophosaurus', 3], ['torvosaurus', 2],
          ['competencia', 2], ['trampa', 3], ['gregarismo', 3], ['fractura', 2], ['neumaticidad', 2],
        ],
      }),
      rival({
        id: 'cuellos_de_dicraeosaurus',
        nombre: 'Los cuellos de Dicraeosaurus',
        lema: 'Cuellos cortos y espinados, y detrás los largos. Comen a todas las alturas.',
        retrato: 'amargasaurus',
        perfil: 'heuristica',
        premio: 110,
        mazo: [
          ['amargasaurus', 3], ['diplodocus', 3], ['apatosaurus', 3], ['camarasaurus', 3],
          ['mamenchisaurus', 3], ['atlasaurus', 2], ['nigersaurus', 2],
          ['gastrolitos', 2], ['canal_trenzado', 3], ['migracion', 2], ['rebrote', 3], ['sabana', 1],
        ],
      }),
      rival({
        id: 'vientos_de_gondwana',
        nombre: 'Los vientos de Gondwana',
        lema: 'Polvo, ceniza y lodo. Lo que no aguanta enterrado, no aguanta.',
        retrato: 'brachylophosaurus',
        perfil: 'heuristica',
        premio: 130,
        mazo: [
          // Dos veces medido y dos veces blando: con eventos de molienda 97 %, como muro de tireóforos con dos auras 95 %. Un muro que no pega no le gana a la referencia, que se lleva el hábitat. Ahora es el sur de Gondwana que pega: titanes con golpe al hábitat y abelisaurios.
          ['argentinosaurus', 2], ['dreadnoughtus', 2], ['patagotitan', 1], ['tyrannotitan', 1],
          ['carnotaurus', 2], ['amargasaurus', 3], ['atlasaurus', 2], ['sanjuansaurus', 3],
          ['ceratosaurus', 3],
          ['tormenta_polvo', 2], ['oleada', 2], ['mortandad', 1],
          ['neumaticidad', 2], ['crecimiento_acelerado', 1], ['competencia', 2], ['fractura', 2],
          ['gregarismo', 3],
        ],
      }),
      rival({
        id: 'grandes_carnivoros',
        nombre: 'Los grandes carnívoros',
        lema: 'Un carcarodontosáurido, un megalosáurido y un abelisáurido. Elige por cuál morir.',
        retrato: 'torvosaurus',
        perfil: 'heuristica',
        premio: 170,
        mazo: [
          // Tendaguru tuvo su espinosáurido (Ostafrikasaurus): entran Spinosaurus y Suchomimus, que a 72 % era un séptimo nodo blando.
          ['allosaurus', 3], ['torvosaurus', 2], ['tyrannotitan', 1], ['spinosaurus', 1],
          ['suchomimus', 2], ['ceratosaurus', 3], ['carnotaurus', 2], ['rugops', 3],
          ['monolophosaurus', 3], ['ojoraptorsaurus', 3],
          ['competencia', 2], ['fractura', 2], ['gregarismo', 3], ['trampa', 3],
          ['crecimiento_acelerado', 1], ['neumaticidad', 2],
        ],
      }),
      rival({
        id: 'coloso_de_tendaguru',
        nombre: 'El coloso de Tendaguru',
        lema: 'Doce metros hasta la cabeza. No corre, no se esconde y no hace falta.',
        retrato: 'giraffatitan',
        perfil: 'heuristica',
        premio: 240,
        mazo: [
          // Tres legendarias justas, que es el tope de un mazo de jugador.
          ['giraffatitan', 1], ['brachiosaurus', 1], ['antarctosaurus', 1],
          ['atlasaurus', 2], ['argentinosaurus', 2], ['dreadnoughtus', 2], ['mamenchisaurus', 3],
          ['amargasaurus', 3], ['camarasaurus', 3], ['apatosaurus', 3], ['kentrosaurus', 3],
          ['allosaurus', 3],
          ['gastrolitos', 2], ['neumaticidad', 2], ['crecimiento_acelerado', 1],
          ['canal_trenzado', 3], ['rebrote', 3], ['manantial', 1], ['humedal', 2], ['vega', 2],
          ['gregarismo', 3],
        ],
      }),
    ]),
  }),

  // ------------------------------------------------------------ Kem Kem
  //
  // El Sáhara del Cretácico medio: un sistema de ríos enorme con más
  // depredadores que presas, que es el enigma de la formación. El camino baja
  // por el río desde las dunas hasta el estuario, y el último rival es el
  // carcarodontosáurido que le da nombre al diente del dorso de la tienda.
  Object.freeze({
    id: 'kem_kem',
    nombre: 'Formación Kem Kem',
    era: 'Cretácico medio · 100–95 Ma',
    mapa: 'mapa_kem_kem',
    requiere: 'tendaguru',
    rivales: Object.freeze([
      rival({
        id: 'pescadores_del_delta',
        nombre: 'Los pescadores del delta',
        lema: 'Hocicos largos metidos en el agua. Lo que muerden no vuelve a la orilla.',
        retrato: 'suchomimus',
        perfil: 'aleatoria',
        premio: 60,
        mazo: [
          ['suchomimus', 2], ['sanjuansaurus', 3], ['halszkaraptor', 3], ['pteranodon', 3],
          ['huaxiadraco', 3], ['elasmosaurus', 3], ['scanisaurus', 3],
          ['crecida_delta', 3], ['lago', 2], ['inundacion', 3], ['nido', 3],
        ],
      }),
      rival({
        id: 'abelisaurios_del_echkar',
        nombre: 'Los abelisaurios del Echkar',
        lema: 'Cráneos rugosos y brazos de adorno. Todo lo que tienen lo llevan en la boca.',
        retrato: 'rugops',
        perfil: 'heuristica',
        premio: 80,
        mazo: [
          // Medía 98,8 % —cinco tipos de terópodo pequeño y ningún cuerpo—. Entran el aura y dos Suchomimus.
          ['rugops', 3], ['carnotaurus', 2], ['ceratosaurus', 3], ['sanjuansaurus', 3],
          ['ojoraptorsaurus', 3], ['monolophosaurus', 3], ['suchomimus', 2], ['velociraptor', 3],
          ['gregarismo', 3], ['trampa', 3], ['competencia', 2], ['neumaticidad', 2],
          ['crecimiento_acelerado', 1],
        ],
      }),
      rival({
        id: 'vela_de_ouranosaurus',
        nombre: 'La vela de Ouranosaurus',
        lema: 'Ornitópodos con vela por las llanuras del Elrhaz. Se van antes de que llegues.',
        retrato: 'ouranosaurus',
        perfil: 'heuristica',
        premio: 95,
        mazo: [
          ['ouranosaurus', 3], ['iguanodon', 3], ['parasaurolophus', 3], ['brachylophosaurus', 3],
          ['saurolophus', 2], ['thescelosaurus', 3], ['rhinorex', 2],
          ['nido', 3], ['gregarismo', 3], ['rebrote', 3], ['oleada', 3], ['canal_trenzado', 3],
        ],
      }),
      rival({
        id: 'segadora_del_elrhaz',
        nombre: 'La segadora del Elrhaz',
        lema: 'Quinientos dientes a ras de suelo. Detrás de Nigersaurus no queda helecho.',
        retrato: 'nigersaurus',
        perfil: 'heuristica',
        premio: 120,
        mazo: [
          ['nigersaurus', 2], ['amargasaurus', 3], ['diplodocus', 3], ['athenar', 3],
          ['plateosauravus', 3], ['atlasaurus', 2], ['dreadnoughtus', 1],
          ['gastrolitos', 2], ['canal_trenzado', 3], ['rebrote', 3], ['migracion', 2],
          ['cauce_abandonado', 3], ['sabana', 1],
        ],
      }),
      rival({
        id: 'alas_del_sahara',
        nombre: 'Las alas del Sáhara',
        lema: 'Sombras de diez metros sobre las dunas. Llegan con la tormenta.',
        retrato: 'tupandactylus',
        perfil: 'heuristica',
        premio: 145,
        mazo: [
          // Sólo pterosaurios medía 96 %: vuelan y no aguantan. Ahora es el mazo del golpe al hábitat con cuerpos debajo.
          ['hatzegopteryx', 3], ['tupandactylus', 2], ['quetzalcoatlus', 2], ['huaxiadraco', 3],
          ['dreadnoughtus', 2], ['nigersaurus', 2], ['atlasaurus', 2], ['camarasaurus', 3],
          ['brachylophosaurus', 3],
          ['tormenta_polvo', 2], ['oleada', 2], ['neumaticidad', 2], ['crecimiento_acelerado', 1],
          ['fractura', 2], ['competencia', 2], ['gregarismo', 3],
        ],
      }),
      rival({
        id: 'rio_de_spinosaurus',
        nombre: 'El río de Spinosaurus',
        lema: 'El río es suyo. Lo que entra en el agua ya no es tuyo.',
        retrato: 'spinosaurus',
        perfil: 'heuristica',
        premio: 175,
        mazo: [
          // Medía 72 % como séptimo nodo: demasiada molienda y ningún aura. Entran Scanisaurus, Nigersaurus y Atlasaurus.
          ['spinosaurus', 1], ['mosasaurus', 1], ['suchomimus', 2], ['plesiopleurodon', 2],
          ['elasmosaurus', 3], ['scanisaurus', 3], ['carnotaurus', 2], ['deltadromeus', 2],
          ['nigersaurus', 2], ['atlasaurus', 2],
          ['inundacion', 2], ['lago', 2], ['humedal', 2], ['vega', 2],
          ['competencia', 2], ['fractura', 2], ['neumaticidad', 2], ['crecimiento_acelerado', 1],
          ['gregarismo', 3],
        ],
      }),
      rival({
        id: 'corredor_del_delta',
        nombre: 'El corredor del delta',
        lema: 'Deltadromeus abre camino y la jauría entra detrás. Nadie se queda a mirar.',
        retrato: 'deltadromeus',
        perfil: 'heuristica',
        premio: 205,
        mazo: [
          // A 84 % era un sexto nodo blando: entran Deinocheirus, Monolophosaurus y Suchomimus.
          ['deltadromeus', 2], ['gallimimus', 3], ['anzu', 3], ['dakotaraptor', 2],
          ['deinocheirus', 2], ['monolophosaurus', 3], ['suchomimus', 2], ['velociraptor', 3],
          ['dromaeosaurus', 3], ['ojoraptorsaurus', 3],
          ['estampida', 2], ['gregarismo', 3], ['fractura', 2], ['trampa', 3], ['competencia', 2],
          ['neumaticidad', 2], ['crecimiento_acelerado', 1],
        ],
      }),
      rival({
        id: 'diente_de_sierra',
        nombre: 'El diente de sierra',
        lema: 'Carcharodontosaurus. El nombre lo dice: dientes de tiburón, y del tamaño de un T. rex.',
        retrato: 'carcharodontosaurus',
        perfil: 'heuristica',
        premio: 270,
        mazo: [
          // A 40 % no era un jefe final: fuera Ouranosaurus, dentro el aura de los terópodos y la emboscada.
          ['carcharodontosaurus', 1], ['tyrannotitan', 1], ['spinosaurus', 1],
          ['deltadromeus', 2], ['rugops', 3], ['carnotaurus', 2], ['suchomimus', 2], ['torvosaurus', 2],
          ['allosaurus', 3], ['nigersaurus', 2], ['monolophosaurus', 3], ['ojoraptorsaurus', 3],
          ['competencia', 2], ['fractura', 2], ['gregarismo', 3], ['trampa', 3],
          ['neumaticidad', 2], ['crecimiento_acelerado', 1], ['mortandad', 1],
        ],
      }),
    ]),
  }),
]);

// ------------------------------------------------------- los de la semana

/**
 * Visitantes de otras eras. Uno por semana, fuera del camino: no abre nada ni
 * lo cierra nada, y paga su premio una vez por semana. La semana la cuenta el
 * servidor desde el día UTC, como las misiones: con la fecha del navegador,
 * adelantar el reloj traería al de la semana que viene.
 */
export const VISITANTES = Object.freeze([
  rival({
    id: 'visitante_judith',
    nombre: 'El río Judith',
    lema: 'Corazas, mazas y golas por las llanuras de Montana. Nada aquí es blando.',
    retrato: 'zuul',
    perfil: 'heuristica',
    premio: 90,
    mazo: [
      // El del Kem Kem se fue con su mapa (16-09-2026): un visitante de la
      // misma formación que una expedición es la expedición repetida.
      ['zuul', 3], ['sauropelta', 3], ['borealopelta', 2], ['euoplocephalus', 3],
      ['lokiceratops', 2], ['medusaceratops', 2], ['wendiceratops', 2], ['chasmosaurus', 3],
      ['brachylophosaurus', 3], ['parasaurolophus', 3],
      ['gregarismo', 3], ['rebrote', 3], ['canal_trenzado', 3], ['competencia', 2], ['ceniza', 2],
    ],
  }),
  rival({
    id: 'visitante_mosasaurus',
    nombre: 'Lo que sube del mar',
    lema: 'Un mar interior entero detrás. Aguanta la marea o te arrastra.',
    retrato: 'mosasaurus',
    perfil: 'heuristica',
    premio: 90,
    mazo: [
      // Tenía 22 criaturas y NUEVE cartas de soporte, así que el relleno le
      // metía 24 Biomasa: casi la mitad del mazo era tierra. Está medido desde
      // hace meses que catorce ya gana el 39,8 %. Se probó dejarlo en DOCE y se
      // pasó de frenada —el jugador bajaba al 31 %—, así que quedan 21: los
      // Hatzegopteryx que le faltaban, que le dan lo que no tenía —golpes al
      // hábitat que no pasan por el campo— y nada más.
      ['mosasaurus', 1], ['elasmosaurus', 3], ['plesiopleurodon', 2], ['scanisaurus', 3],
      ['quetzalcoatlus', 2], ['pteranodon', 3], ['huaxiadraco', 3], ['hatzegopteryx', 3],
      ['argentinosaurus', 2], ['amargasaurus', 3],
      ['canal_trenzado', 3], ['gastrolitos', 2], ['manada_paso', 3], ['manantial', 1],
    ],
  }),
  rival({
    id: 'visitante_gobi',
    nombre: 'El desierto de Gobi',
    lema: 'Arena, viento y garras. Lo que sobrevive aquí no necesita beber.',
    retrato: 'therizinosaurus',
    perfil: 'heuristica',
    premio: 90,
    mazo: [
      // La Sequía no está de adorno: el Therizinosaurus cobra +3 de Ataque
      // mientras haya un clima en el campo, y su carta se llama Garra de sequía.
      ['aridez', 1], ['therizinosaurus', 3], ['velociraptor', 3], ['troodon', 3],
      ['halszkaraptor', 3], ['ojoraptorsaurus', 3], ['monolophosaurus', 3],
      ['shuangmiaosaurus', 3], ['liaoceratops', 3], ['platyceratops', 3],
      ['alaskacephale', 3], ['huaxiadraco', 3], ['medusaceratops', 2],
      ['quetzalcoatlus', 2], ['suchomimus', 2],
      ['neumaticidad', 2], ['crecimiento_acelerado', 1], ['competencia', 2],
      ['gregarismo', 3], ['fractura', 2],
    ],
  }),
  rival({
    id: 'visitante_patagonia',
    nombre: 'Los gigantes del sur',
    lema: 'Gondwana crió los cuerpos más grandes que ha habido. Y lo que los cazaba.',
    retrato: 'argentinosaurus',
    perfil: 'heuristica',
    premio: 90,
    mazo: [
      // Tenía diecisiete criaturas y treinta de soporte, y se ganaba el 59 %:
      // medio mazo mirando mientras la otra mitad esperaba a la cuarta
      // Biomasa. Ahora son veinticuatro, con ceratosáurido, azhdárquido y
      // pliosaurio, que de Gondwana también son.
      ['argentinosaurus', 2], ['antarctosaurus', 1], ['tyrannotitan', 1], ['carnotaurus', 2],
      ['amargasaurus', 3], ['sanjuansaurus', 3], ['atlasaurus', 2], ['ceratosaurus', 3],
      ['elasmosaurus', 3], ['quetzalcoatlus', 1],
      // Todo lo grande cuesta 4: sin rampa, la mano se queda quieta.
      ['carrona', 1], ['humedal', 2], ['vega', 2], ['manantial', 1], ['sabana', 3],
      ['neumaticidad', 2], ['crecimiento_acelerado', 1], ['mortandad', 1],
      ['competencia', 2], ['fractura', 2], ['nido', 3], ['gregarismo', 3],
    ],
  }),
  rival({
    id: 'visitante_nemegt',
    nombre: 'Las dunas del Nemegt',
    lema: 'Tarbosaurus manda en el desierto de Mongolia. Lo que no corre, se entierra.',
    retrato: 'tarbosaurus',
    perfil: 'heuristica',
    premio: 90,
    mazo: [
      // El de Tendaguru se fue con su mapa (16-09-2026). Éste es el Cretácico
      // de Mongolia con las cartas de la ronda del control. Medía 77 % con
      // Shuvuuia, Psittacosaurus y Saurolophus, y 75 % sólo con el aura: lo
      // que lo baja es cambiar los cuerpos flojos por emboscada y contadores.
      //
      // Y el 18-09-2026, otra vuelta: era el más suelto de los cinco contra lo
      // que de verdad tiene una cuenta nueva —se le ganaba el 63 %— y hubo que
      // ir por los tres lados a la vez, porque quitarle relleno solo no bastó
      // (63 → 58,5 → 56,5). Se fue el Velociraptor, que además es del
      // Djadochta y no del Nemegt, y entró Anzu: el mismo hueco de la curva
      // con cuerpo de verdad y sin pagar una carta de descarte. Y dos
      // Mamenchisaurus, el único saurópodo asiático del set, que aquí hace de
      // Nemegtosaurus: un muro de 1/11 que obliga a gastar turnos. Queda en el
      // 53 %.
      ['tarbosaurus', 2], ['deinocheirus', 2], ['dakotaraptor', 2], ['monolophosaurus', 3],
      ['therizinosaurus', 3], ['anzu', 3], ['halszkaraptor', 3], ['dromaeosaurus', 3],
      ['ojoraptorsaurus', 3], ['mamenchisaurus', 2],
      // La Sequía no es de adorno: Therizinosaurus cobra +3 con un clima puesto.
      // Y ahí estaba el fallo: con UN clima en 55 cartas, seis cuerpos
      // condicionales —tres Therizinosaurus a 1/6 y tres Halszkaraptor a 2/2—
      // jugaban casi siempre apagados. Con cinco climas más se encienden, y de
      // paso el relleno de Biomasa baja de 13 a 4. El Nemegt era húmedo, con
      // ríos y lagos: la Crecida y el Monzón le pegan tanto como la Sequía.
      ['aridez', 1], ['sabana', 3], ['llanura', 2],
      ['tormenta_polvo', 3], ['osario', 3], ['gregarismo', 3], ['competencia', 2],
      ['fractura', 2], ['neumaticidad', 2], ['crecimiento_acelerado', 1], ['trampa', 3],
    ],
  }),
]);

/** Número de semana desde el 1 de enero de 1970 (UTC), a partir de 'AAAA-MM-DD'. */
export function semanaDe(dia) {
  const ms = Date.parse(`${dia}T00:00:00Z`);
  if (!Number.isFinite(ms)) throw new Error(`día inválido: ${dia}`);
  // El 1 de enero de 1970 fue jueves: se desplaza para que la semana empiece en lunes.
  return Math.floor((ms / 86400000 + 3) / 7);
}

/** El visitante de la semana a la que pertenece `dia`. */
export const visitanteDe = (dia) => VISITANTES[semanaDe(dia) % VISITANTES.length];

// ----------------------------------------------------------------- consultas

const TODOS = new Map([
  ...EXPEDICIONES.flatMap((e) => e.rivales.map((r, i) => [r.id, { rival: r, expedicion: e, indice: i }])),
  ...VISITANTES.map((r) => [r.id, { rival: r, expedicion: null, indice: -1 }]),
]);

/** Un rival por su id, con la expedición a la que pertenece y su puesto; null si no existe. */
export const rivalPorId = (id) => TODOS.get(id) ?? null;

/**
 * El rival que hay que haber vencido antes, o null si no lo pide nada. El
 * servidor lo usa para no pagar la primera victoria de un nodo que aún estaba
 * cerrado: jugarlo se puede, cobrarlo no.
 *
 * Dentro de un mapa es el nodo anterior. En el PRIMERO de un mapa encadenado
 * —`requiere`— es el ÚLTIMO del mapa que lo abre, así que el encadenado no
 * necesita ninguna regla nueva ni en el navegador ni en SQL: es el mismo
 * requisito de siempre apuntando a otro sitio.
 */
export function requisitoDe(id) {
  const r = rivalPorId(id);
  if (!r || r.indice < 0) return null;
  if (r.indice > 0) return r.expedicion.rivales[r.indice - 1].id;
  const previa = EXPEDICIONES.find((e) => e.id === r.expedicion.requiere);
  return previa ? previa.rivales[previa.rivales.length - 1].id : null;
}

/**
 * La clave con la que se apunta una primera victoria. Los del camino, una vez
 * para siempre; el visitante, una vez por semana.
 */
export function claveDeVictoria(id, dia) {
  const r = rivalPorId(id);
  if (!r) return null;
  return r.expedicion ? id : `${id}@${semanaDe(dia)}`;
}

// Un mazo mal escrito no debe llegar a una partida: falla al importar, que es
// el único momento en que el error todavía es barato. Lo mismo que MAZO.
for (const [id, { rival: r }] of TODOS) {
  const total = r.mazo.reduce((a, [, n]) => a + n, 0);
  if (total !== BALANCE.tamanoMazo) throw new Error(`EXPEDICIONES: ${id} suma ${total} cartas`);
  for (const [cardId, n] of r.mazo) {
    if (n > topeDe(cardId)) throw new Error(`EXPEDICIONES: ${id} lleva ${n} ${cardId} y admite ${topeDe(cardId)}`);
  }
  carta(r.retrato);
}
