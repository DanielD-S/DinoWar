// DinoWar — el calendario de la cuenca. DATOS, no código.
//
// Un evento es una ventana con nombre y fechas. Añadir uno no toca el motor, y
// el día que haya servidor podrá mandar esta misma lista sin que cambie nada
// más. Por eso las fechas son relativas al arranque de la cuenca y no absolutas:
// un calendario con fechas de 2026 quemadas caduca solo.

import { CARTAS_DE_JEFE } from './cards.js';

export { CARTAS_DE_JEFE };

export const TIPO_EVENTO = Object.freeze({
  JEFE: 'JEFE',       // aparece un jefe durante unos días
  CLIMA: 'CLIMA',     // una regla cambia para toda la cuenca
});


/**
 * Los jefes. La Vida es de la TRIBU entera y por eso son miles: ninguna partida
 * la baja sola, que es exactamente el objetivo — un jefe es lo único de este
 * juego que no cabe en una persona.
 */
export const JEFES = Object.freeze({
  saurophaganax: Object.freeze({
    id: 'saurophaganax',
    nombre: 'Saurophaganax maximus',
    titulo: 'El dueño de la llanura',
    vidaMaxima: 6000,
    recompensa: 'jefe_saurophaganax',
    // El mazo que lleva en la partida de asalto. Temático: la Morrison entera
    // defendiendo a su depredador tope.
    mazo: Object.freeze([
      ['allosaurus', 2], ['torvosaurus', 1], ['ceratosaurus', 3], ['ornitholestes', 3],
      ['tyrannotitan', 1], ['riparovenator', 2], ['carnotaurus', 2], ['dromaeosaurus', 3],
      ['stegosaurus', 3], ['nodosaurus', 2], ['camarasaurus', 2], ['diplodocus', 1],
      ['apatosaurus', 1], ['dryosaurus', 3], ['brachylophosaurus', 3],
      ['gregarismo', 3], ['trampa', 3], ['rebrote', 3], ['gastrolitos', 2],
      ['fractura', 2], ['mortandad', 1], ['aridez', 1], ['crecimiento_acelerado', 1],
      ['competencia', 1], ['neumaticidad', 1], ['biomasa', 5],
    ]),
    nota: 'Cazarlo no es ganarle una partida: es desgastarlo entre todos.',
  }),
  barosaurus: Object.freeze({
    id: 'barosaurus',
    nombre: 'Barosaurus lentus',
    titulo: 'La manada que no se acaba',
    vidaMaxima: 5000,
    recompensa: 'jefe_barosaurus',
    mazo: Object.freeze([
      ['camarasaurus', 2], ['diplodocus', 1], ['apatosaurus', 1], ['athenar', 3],
      ['atlasaurus', 2], ['antarctosaurus', 1], ['plateosauravus', 3],
      ['stegosaurus', 2], ['nodosaurus', 2], ['loricatosaurus', 3], ['invictarx', 3],
      ['dryosaurus', 3], ['maiasaura', 1], ['edmontosaurus', 1], ['brachylophosaurus', 3],
      ['gregarismo', 3], ['rebrote', 3], ['gastrolitos', 2], ['fractura', 2],
      ['canal', 1], ['sabana', 1], ['bosque', 1], ['neumaticidad', 1], ['competencia', 1],
      ['crecimiento_acelerado', 1], ['shuangmiaosaurus', 3], ['biomasa', 5],
    ]),
    nota: 'No pega fuerte. Aguanta, que es peor.',
  }),
  // La segunda hornada (15-09-2026). Cada uno con su mazo temático de la
  // Morrison y su forma de pelear: un muro de Vida, uno que devuelve daño y
  // uno que muele el mazo desde el aire.
  supersaurus: Object.freeze({
    id: 'supersaurus',
    nombre: 'Supersaurus vivianae',
    titulo: 'El gigante del horizonte',
    vidaMaxima: 7000,
    recompensa: 'jefe_supersaurus',
    mazo: Object.freeze([
      ['camarasaurus', 3], ['diplodocus', 3], ['apatosaurus', 3], ['athenar', 3],
      ['atlasaurus', 2], ['argentinosaurus', 2], ['mamenchisaurus', 3], ['amargasaurus', 3],
      ['plateosauravus', 3], ['antarctosaurus', 1], ['brachiosaurus', 1], ['dryosaurus', 3],
      ['gregarismo', 3], ['rebrote', 3], ['gastrolitos', 2], ['neumaticidad', 2],
      ['crecimiento_acelerado', 1], ['bosque', 1], ['sabana', 1], ['competencia', 2], ['frutos', 2],
      ['biomasa', 5], ['araucarias', 3],
    ]),
    nota: 'Es la Vida más alta de la cuenca. No hay atajo: hay que tirarlo entre todos.',
  }),
  hesperosaurus: Object.freeze({
    id: 'hesperosaurus',
    nombre: 'Hesperosaurus mjosi',
    titulo: 'La muralla de placas',
    vidaMaxima: 5500,
    recompensa: 'jefe_hesperosaurus',
    mazo: Object.freeze([
      ['stegosaurus', 3], ['kentrosaurus', 3], ['loricatosaurus', 3], ['invictarx', 3],
      ['gargoyleosaurus', 3], ['nodosaurus', 2], ['euoplocephalus', 3], ['bienosaurus', 3],
      ['ankylosaurus', 1], ['dryosaurus', 3], ['camarasaurus', 2],
      ['gregarismo', 3], ['trampa', 3], ['fractura', 2], ['gastrolitos', 2], ['rebrote', 3],
      ['competencia', 2], ['mortandad', 1], ['aridez', 1], ['nido', 2],
      ['biomasa', 5], ['cicadas', 2],
    ]),
    nota: 'Cada golpe que le das te lo devuelve. Pega con criaturas que aguanten.',
  }),
  harpactognathus: Object.freeze({
    id: 'harpactognathus',
    nombre: 'Harpactognathus gentryii',
    titulo: 'La sombra del río',
    vidaMaxima: 4500,
    recompensa: 'jefe_harpactognathus',
    mazo: Object.freeze([
      ['pteranodon', 3], ['huaxiadraco', 3], ['quetzalcoatlus', 2], ['eosinopteryx', 3],
      ['troodon', 3], ['ornitholestes', 3], ['dromaeosaurus', 3], ['ceratosaurus', 3],
      ['allosaurus', 2], ['suchomimus', 1], ['riparovenator', 2],
      ['trampa', 3], ['carrona', 1], ['lago', 2], ['insectos', 3], ['canal', 1],
      ['inundacion', 2], ['gregarismo', 3], ['fractura', 2], ['neumaticidad', 2],
      ['biomasa', 5], ['equisetos', 3],
    ]),
    nota: 'Poca Vida y muy rápido: te vacía el mazo antes de que lo alcances.',
  }),
});

/**
 * El calendario. `dia` es el día de la cuenca en que empieza —día 0 es cuando
 * el jugador entra por primera vez—, y el ciclo se repite. Fechas relativas y
 * no absolutas: un calendario con 2026 quemado dentro caduca solo.
 */
export const CALENDARIO = Object.freeze([
  Object.freeze({
    id: 'caza_saurophaganax', tipo: TIPO_EVENTO.JEFE, jefe: 'saurophaganax',
    dia: 0, dura: 5,
    titulo: 'La caza del Saurophaganax',
    texto: 'Cinco días para desgastar al mayor terópodo de la Morrison. Todo el que '
      + 'le haga daño se lleva su carta, dé o no el último golpe.',
  }),
  Object.freeze({
    id: 'sequia_cuenca', tipo: TIPO_EVENTO.CLIMA, clima: 'aridez',
    dia: 5, dura: 2,
    titulo: 'La cuenca se seca',
    texto: 'Dos días de aridez sobre toda la cuenca: los mazos se muelen más deprisa '
      + 'y las partidas se acortan.',
  }),
  Object.freeze({
    id: 'manada_barosaurus', tipo: TIPO_EVENTO.JEFE, jefe: 'barosaurus',
    dia: 7, dura: 5,
    titulo: 'La manada de Barosaurus',
    texto: 'No pega fuerte: aguanta. Cinco días contra la paciencia hecha saurópodo.',
  }),
  Object.freeze({
    id: 'crecida_cuenca', tipo: TIPO_EVENTO.CLIMA, clima: 'canal',
    dia: 12, dura: 2,
    titulo: 'Crecida del canal',
    texto: 'El río se desborda: mientras dure, todo el mundo pelea en la llanura de '
      + 'inundación.',
  }),
  // La segunda vuelta del calendario, con los tres jefes nuevos. Las fechas de
  // arriba no se tocan: las tribus que ya existen siguen en los mismos días.
  Object.freeze({
    id: 'caza_supersaurus', tipo: TIPO_EVENTO.JEFE, jefe: 'supersaurus',
    dia: 14, dura: 5,
    titulo: 'El gigante del horizonte',
    texto: 'Cinco días contra el saurópodo más largo de la Morrison. No pega mucho, '
      + 'pero su Vida no se acaba nunca.',
  }),
  Object.freeze({
    id: 'lluvias_cuenca', tipo: TIPO_EVENTO.CLIMA, clima: 'bosque',
    dia: 19, dura: 2,
    titulo: 'Llegan las lluvias',
    texto: 'Dos días de estación de lluvias: los saurópodos curan una herida al final '
      + 'de cada turno.',
  }),
  Object.freeze({
    id: 'muralla_hesperosaurus', tipo: TIPO_EVENTO.JEFE, jefe: 'hesperosaurus',
    dia: 21, dura: 5,
    titulo: 'La muralla de placas',
    texto: 'Cinco días contra un estegosaurio que devuelve cada golpe. Hay que pegarle '
      + 'con criaturas que aguanten.',
  }),
  Object.freeze({
    id: 'monzon_cuenca', tipo: TIPO_EVENTO.CLIMA, clima: 'sabana',
    dia: 26, dura: 2,
    titulo: 'El monzón de verano',
    texto: 'Dos días de monzón: los dos jugadores ganan 1 de Biomasa más cada turno.',
  }),
  Object.freeze({
    id: 'sombra_harpactognathus', tipo: TIPO_EVENTO.JEFE, jefe: 'harpactognathus',
    dia: 28, dura: 5,
    titulo: 'La sombra del río',
    texto: 'Cinco días contra un pterosaurio que vacía tu mazo desde el aire. Poca Vida '
      + 'y mucha prisa.',
  }),
  Object.freeze({
    id: 'crecida_verano', tipo: TIPO_EVENTO.CLIMA, clima: 'llanura',
    dia: 33, dura: 2,
    titulo: 'La crecida de verano',
    texto: 'Dos días de crecida: cada jugador puede cambiar una carta de su mano por '
      + 'otra del mazo, una vez por turno.',
  }),
]);

/** Cuántos días dura una vuelta entera del calendario. */
export const CICLO = CALENDARIO.reduce((n, e) => Math.max(n, e.dia + e.dura), 0);

/**
 * Qué eventos están activos en un instante dado. `arranque` es cuándo empezó la
 * cuenca de este jugador; el instante entra por argumento, como en tribu.js.
 */
export function eventosActivos(arranque, ahora) {
  const dia = Math.floor((ahora - arranque) / 86400_000);
  const enCiclo = ((dia % CICLO) + CICLO) % CICLO;
  return CALENDARIO.filter((e) => enCiclo >= e.dia && enCiclo < e.dia + e.dura);
}

/** El jefe activo ahora mismo, o null. Sólo puede haber uno. */
export function jefeActivo(arranque, ahora) {
  const e = eventosActivos(arranque, ahora).find((x) => x.tipo === TIPO_EVENTO.JEFE);
  return e ? { evento: e, jefe: JEFES[e.jefe] } : null;
}

/** Cuándo empieza y acaba, en epoch, el evento activo. Para pintar la cuenta atrás. */
export function ventanaDe(evento, arranque, ahora) {
  const dia = Math.floor((ahora - arranque) / 86400_000);
  const vuelta = Math.floor(dia / CICLO);
  const inicio = arranque + (vuelta * CICLO + evento.dia) * 86400_000;
  return { desde: inicio, hasta: inicio + evento.dura * 86400_000 };
}
