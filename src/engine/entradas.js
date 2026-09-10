// DinoWar — habilidades AL ENTRAR EN JUEGO.
//
// Un efecto que se dispara una vez, cuando la criatura llega al campo, y se
// acabó. Nada de estado que llevar en la cabeza.
//
// Por qué esta forma y no un rasgo pasivo. Los pasivos —«+1 de Vida si tienes
// otro Stegosaurus»— tienen dos problemas, y los dos están medidos:
//
//   1. No se leen. Es la misma clase de regla invisible que la Defensa, que se
//      quitó justo por eso: había que hacer aritmética contra un número de la
//      OTRA carta.
//   2. Falsean la medición. La IA valora una unidad multiplicando por los
//      turnos que espera que aguante (`IA.horizonte`), así que todo lo pasivo se
//      infla. De ahí salió el «la Defensa vale 4 veces el Ataque», que era un
//      artefacto. Un disparo al entrar es valor inmediato y discreto: se tasa
//      directo, sin multiplicador.
//
// El set tiene las dos familias porque el autor las quiso: hay auras y
// contadores, que viven en `state.js`, y hay once cartas que disparan al llegar,
// que son éstas.
//
// Se disparan en la FASE DE REVELACIÓN, que ya es simultánea y con un orden
// determinista (por tipo y luego por iid). Eso importa más de lo que parece: el
// servidor re-juega cada partida para validarla, y sin un orden fijo dos
// máquinas llegarían a resultados distintos con las mismas jugadas. Por lo mismo
// ninguna de éstas pregunta nada: el objetivo de Tijera sale de una regla fija
// —el de más Ataque entre los que caben— y no de una elección del jugador, que
// en una fase simultánea habría que resolver a ciegas.

import { BALANCE } from '../data/balance.js';
import { carta } from '../data/cards.js';
import { mecanicaDe } from './state.js';
import { entero } from './rng.js';

/** ¿Están encendidas? Se apagan por entorno para poder medir con y sin. */
export const HAY_ENTRADAS = !(typeof process !== 'undefined' && process.env
  && process.env.DINOWAR_ENTRADAS === '0');

/**
 * Los efectos que puede llevar una `entrada`. La lista es la llave de todo lo
 * demás: `valorDeEntrada` recorre esto para tasar y `alEntrar` para aplicar, así
 * que un efecto nuevo sin su peso en `BALANCE.valorEntrada` lo caza un test en
 * vez de morir en silencio dentro de la IA.
 */
export const EFECTOS = Object.freeze([
  'roba', 'muelePropio', 'mueleRival', 'manoRival', 'curaHabitat', 'emboscada', 'fulmina',
]);

export const entradaDe = (cardId) => mecanicaDe(cardId)?.entrada ?? null;

export const esEntrada = (cardId) => entradaDe(cardId) !== null;

/**
 * Cuánto vale, a ojo, dispararla. NO decide nada del juego: sólo sirve para que
 * la IA no ignore estas cartas, que es lo que le pasó a la Llanura hasta que se
 * le puso número —cero usos en 300 partidas—.
 *
 * Es una estimación deliberadamente burda: cada punto de efecto por su peso.
 * Afinarla es tarea del recoste, no de aquí.
 */
export function valorDeEntrada(cardId) {
  if (!HAY_ENTRADAS) return 0;
  const e = entradaDe(cardId);
  if (!e) return 0;
  const V = BALANCE.valorEntrada;
  let valor = 0;
  for (const efecto of EFECTOS) {
    const n = e[efecto] ?? 0;
    if (n === 0) continue;
    const peso = efecto === 'curaHabitat' ? V.curaHabitat * BALANCE.ia.pesoHabitat : V[efecto];
    valor += n * peso;
  }
  return valor;
}

/**
 * Dispara la habilidad de entrada de `inst`, si tiene. Muta el estado, como el
 * resto de la fase de revelación.
 *
 * @param {object} s        estado en curso
 * @param {object} inst     la instancia que acaba de entrar
 * @param {object} ayudas   lo que hace falta del resto del motor
 */
export function alEntrar(s, inst, ayudas) {
  if (!HAY_ENTRADAS) return;
  const e = entradaDe(inst.cardId);
  if (!e) return;

  const { ev, herir, rival, unidadEn, unidadesDe, CAUSA, vidaActual } = ayudas;
  const j = inst.dueno;
  const contrario = rival(j);
  const jug = s.jugadores[j];
  const otro = s.jugadores[contrario];

  // El evento se emite SIEMPRE, con `n` a cero si el efecto no encontró nada
  // que hacer. Callarlo dejaba la habilidad sin rastro en el registro: el
  // jugador veía entrar la carta y nada más, sin poder distinguir un fallo de
  // un rasgo que no existe.
  const contar = (efecto, n) => ev(s, 'ENTRADA', {
    iid: inst.iid, cardId: inst.cardId, dueno: j, efecto, n,
  });

  /** Del mazo al descarte, sin pasar por la mano. Es el reloj de la extinción. */
  const moler = (quien, cuantas) => {
    let molidas = 0;
    for (let k = 0; k < cuantas && quien.mazo.length > 0; k++) {
      quien.descarte.push(quien.mazo.shift());
      molidas += 1;
    }
    return molidas;
  };

  if (e.roba) {
    let robadas = 0;
    for (let k = 0; k < e.roba && jug.mazo.length > 0; k++) {
      jug.mano.push(jug.mazo.shift());
      robadas += 1;
    }
    contar('roba', robadas);
  }

  if (e.mueleRival) contar('muele', moler(otro, e.mueleRival));
  if (e.muelePropio) contar('muelePropio', moler(jug, e.muelePropio));

  // Al AZAR de la mano rival, así que sale del rng del estado y no de
  // Math.random: la partida tiene que poder re-jugarse igual en el servidor.
  if (e.manoRival) {
    let quitadas = 0;
    for (let k = 0; k < e.manoRival && otro.mano.length > 0; k++) {
      const d = entero(s.rng, otro.mano.length);
      s.rng = d.rng;
      otro.descarte.push(otro.mano.splice(d.valor, 1)[0]);
      quitadas += 1;
    }
    contar('manoRival', quitadas);
  }

  // El hábitat no pasa de su tope: curar por encima sería una reserva invisible.
  if (e.curaHabitat) {
    const antes = jug.habitat;
    jug.habitat = Math.min(BALANCE.vidaHabitat, jug.habitat + e.curaHabitat);
    contar('curaHabitat', jug.habitat - antes);
  }

  // Cae encima del que tiene enfrente antes de que empiece el combate.
  if (e.emboscada) {
    const enfrente = unidadEn(s, contrario, inst.ranura);
    if (enfrente) herir(s, enfrente.iid, e.emboscada, CAUSA.ENTRADA, j);
    contar('emboscada', enfrente ? e.emboscada : 0);
  }

  // Se lleva por delante a uno que ya no aguanta. Entre los que caben elige el
  // de más Ataque —desempate por iid— y no lo pregunta: ver arriba.
  if (e.fulmina) {
    const candidatos = unidadesDe(s, contrario)
      .filter((u) => vidaActual(s, u.iid) <= e.fulmina)
      .sort((a, b) => ataqueDe(s, b) - ataqueDe(s, a) || a.iid - b.iid);
    const victima = candidatos[0] ?? null;
    if (victima) {
      s.ranuras[contrario][victima.ranura] = null;
      victima.ranura = null;
      otro.descarte.push(victima.iid);
    }
    ev(s, 'ENTRADA', {
      iid: inst.iid, cardId: inst.cardId, dueno: j, efecto: 'fulmina',
      n: victima ? 1 : 0,
      objetivo: victima ? victima.iid : null,
      objetivoCardId: victima ? victima.cardId : null,
    });
  }
}

/** El Ataque impreso basta para desempatar a quién fulminar, y no arrastra ciclos. */
const ataqueDe = (s, inst) => carta(inst.cardId).ataque + inst.modAtaque;
