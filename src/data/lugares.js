// DinoWar — los LUGARES: terreno por columna.
//
// El tablero son cuatro ranuras enfrentadas, y hasta hoy las cuatro eran
// iguales: la única diferencia entre ponerte en la 1 o en la 3 era qué tenía el
// rival enfrente. Lo único que cambiaba el campo era el clima, y lo cambiaba
// entero y para los dos.
//
// Ahora cada COLUMNA es un lugar distinto, sorteado al empezar la partida con
// la misma semilla que baraja los mazos y a la vista de los dos desde el turno
// 1. Es lo mismo que el clima, pero en pequeño: el clima es un lugar que ocupa
// todo el campo y dura unos turnos; el lugar es un clima de una columna que
// dura toda la partida. Y como el clima, vale para los DOS bandos: el lugar es
// la columna, no la ranura, y las dos ranuras enfrentadas lo comparten.
//
// Lo que compra: la ranura se vuelve una decisión. Hoy tu Allosaurus va donde
// el rival esté flojo; con lugares va a la llanura porque ahí su sobrante se
// dobla, o al río si es un mosasaurio. Y el rival lo sabe, así que pone su muro
// justo ahí. El despliegue a ciegas gana una capa de lectura que no tenía. Y
// las cartas cambian de valor según la partida sin tocarles un número: un
// Loricatosaurus de Ataque 0 vale poco en general, y en el bosque que cura es
// un muro que no cae nunca.
//
// Son DATOS, como las mecánicas de las criaturas: un lugar declara su efecto
// con un vocabulario corto de FORMAS y el motor aplica lo que encuentra. Poner
// un lugar nuevo es escribir un objeto aquí; sólo se toca el motor cuando hace
// falta una forma que no existe. Y ninguno pregunta nada, que es la regla del
// motor: el lugar está fijo, el efecto se aplica en la fase que toque, y el
// servidor lo re-juega igual porque sale de la semilla.
//
//   ataque       { n, clados? }   +n de Ataque a lo que esté aquí
//   vida         { n, clados? }   +n de Vida a lo que esté aquí
//   cura         n                cura n al final del turno
//   sinCuracion  true             aquí nadie cura
//   espinas      n                lo que está aquí devuelve n a quien lo hiere
//   sobrante     k                el daño que sobra al matar se multiplica
//   guardia      n                cada golpe al hábitat desde aquí pega n menos
//   golpeHabitat n                cada golpe al hábitat desde aquí pega n más
//   inmovil      true             nadie se mueve desde aquí ni hacia aquí
//   roba         n                al revelarse una criatura aquí, su dueño roba
//   muele        n                al final del turno, el dueño de lo que está
//                                 aquí pierde n cartas del mazo
//
// `test/lugares.test.js` vigila que ningún lugar use una forma que no esté en
// este vocabulario —`atque: { n: 2 }` no es un error de sintaxis, es un lugar
// que no hace nada— y que todo número del efecto salga en el texto.

import { CLADO } from './cards.js';

export const FORMAS = Object.freeze([
  'ataque', 'vida', 'cura', 'sinCuracion', 'espinas', 'sobrante', 'guardia',
  'golpeHabitat', 'inmovil', 'roba', 'muele',
]);

const lugar = (l) => Object.freeze({ ...l, efecto: Object.freeze(l.efecto) });

export const LUGARES = Object.freeze({
  ladera_volcanica: lugar({
    id: 'ladera_volcanica', nombre: 'Ladera volcánica',
    texto: 'Lo que está aquí pega +2. La ceniza fértil lo alimenta todo.',
    efecto: { ataque: { n: 2 } },
  }),
  rio: lugar({
    id: 'rio', nombre: 'Río',
    texto: 'Los reptiles marinos pegan +2 aquí.',
    efecto: { ataque: { n: 2, clados: [CLADO.MARINO] } },
  }),
  cazadero: lugar({
    id: 'cazadero', nombre: 'Cazadero',
    texto: 'Los terópodos pegan +1 aquí.',
    efecto: { ataque: { n: 1, clados: [CLADO.TEROPODO] } },
  }),
  acantilado: lugar({
    id: 'acantilado', nombre: 'Acantilado',
    texto: 'Los pterosaurios pegan +2 aquí.',
    efecto: { ataque: { n: 2, clados: [CLADO.PTEROSAURIO] } },
  }),
  pradera_alta: lugar({
    id: 'pradera_alta', nombre: 'Pradera alta',
    texto: 'Los ornitópodos y los marginocéfalos pegan +1 aquí.',
    efecto: { ataque: { n: 1, clados: [CLADO.ORNITOPODO, CLADO.MARGINOCEFALO] } },
  }),
  helechal: lugar({
    id: 'helechal', nombre: 'Helechal',
    texto: 'Los saurópodos y los ornitópodos tienen +2 de Vida aquí.',
    efecto: { vida: { n: 2, clados: [CLADO.SAUROPODO, CLADO.ORNITOPODO] } },
  }),
  roquedal: lugar({
    id: 'roquedal', nombre: 'Roquedal',
    texto: 'Los tireóforos tienen +2 de Vida aquí.',
    efecto: { vida: { n: 2, clados: [CLADO.TIREOFORO] } },
  }),
  laguna: lugar({
    id: 'laguna', nombre: 'Laguna',
    texto: 'Lo que está aquí tiene +1 de Vida.',
    efecto: { vida: { n: 1 } },
  }),
  bosque_coniferas: lugar({
    id: 'bosque_coniferas', nombre: 'Bosque de coníferas',
    texto: 'Lo que está aquí cura 1 al final del turno.',
    efecto: { cura: 1 },
  }),
  salinas: lugar({
    id: 'salinas', nombre: 'Salinas',
    texto: 'Aquí nadie cura.',
    efecto: { sinCuracion: true },
  }),
  pedregal: lugar({
    id: 'pedregal', nombre: 'Pedregal',
    texto: 'Lo que está aquí devuelve 1 de daño a quien lo hiere en combate.',
    efecto: { espinas: 1 },
  }),
  llanura_abierta: lugar({
    id: 'llanura_abierta', nombre: 'Llanura abierta',
    texto: 'El daño que sobra al matar aquí se multiplica por 2.',
    efecto: { sobrante: 2 },
  }),
  desfiladero: lugar({
    id: 'desfiladero', nombre: 'Desfiladero',
    texto: 'Cada golpe al hábitat desde aquí pega 1 menos.',
    efecto: { guardia: 1 },
  }),
  barranco: lugar({
    id: 'barranco', nombre: 'Barranco',
    texto: 'Cada golpe al hábitat desde aquí pega 1 más.',
    efecto: { golpeHabitat: 1 },
  }),
  // El barro frena. Lleva también `inmovil`, que hoy no muerde a nadie —no
  // queda ninguna carta con el rasgo Migrador— y está para el día que vuelva
  // una: sin el −1 sería un lugar que no hace nada, que es lo que el test de
  // abajo no deja escribir.
  cienaga: lugar({
    id: 'cienaga', nombre: 'Ciénaga',
    texto: 'El barro frena: lo que está aquí pega −1, y nadie puede moverse desde aquí ni hacia aquí.',
    efecto: { ataque: { n: -1 }, inmovil: true },
  }),
  nidada: lugar({
    id: 'nidada', nombre: 'Nidada',
    texto: 'Cuando una criatura se revela aquí, su dueño roba 1 carta.',
    efecto: { roba: 1 },
  }),
  cauce_seco: lugar({
    id: 'cauce_seco', nombre: 'Cauce seco',
    texto: 'Al final del turno, el dueño de lo que está aquí pierde 1 carta del mazo.',
    efecto: { muele: 1 },
  }),
});

export const LUGARES_IDS = Object.freeze(Object.keys(LUGARES));

/** El lugar por su id, o null si la columna no tiene ninguno (tablero plano). */
export const lugarPorId = (id) => (id ? LUGARES[id] ?? null : null);

const VACIO = Object.freeze({});

/** El efecto del lugar de una columna, o `{}` si no hay lugar. */
export function efectoDeLugar(state, ranura) {
  if (!state.lugares || ranura === null || ranura === undefined) return VACIO;
  return lugarPorId(state.lugares[ranura])?.efecto ?? VACIO;
}

/** ¿Le toca a este clado un `ataque` o `vida` de lugar? Sin filtro, a todos. */
export const alcanzaA = (forma, clado) => !!forma && (!forma.clados || forma.clados.includes(clado));

/**
 * Lo que le suma o le resta un lugar a una criatura de ese clado, puesta en
 * esa columna. Lo usan el motor —en `ataqueEfectivo` y `vidaMaxima`— y la IA
 * al tasar una carta ANTES de ponerla, para que los dos digan lo mismo.
 */
export function bonoDeLugar(state, ranura, clado) {
  const e = efectoDeLugar(state, ranura);
  return {
    ataque: alcanzaA(e.ataque, clado) ? e.ataque.n : 0,
    vida: alcanzaA(e.vida, clado) ? e.vida.n : 0,
  };
}
