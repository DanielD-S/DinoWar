// DinoWar — cómo se cobra y cómo se paga la Biomasa.
//
// Todo lo que distingue las tres economías vive aquí. El resto del motor
// pregunta «¿puede pagar esto?» y «cóbraselo», y no sabe en qué variante está.
// Esa es la razón de que este fichero exista: sin él, el modo se colaría en
// seis sitios de actions.js y no habría forma de volver atrás.
//
// Puro y sin DOM, como todo src/engine/.

import { BALANCE } from '../data/balance.js';
import { carta, TIPO } from '../data/cards.js';
import { DIETA, dietaDe } from '../data/dietas.js';

export const MODO = Object.freeze({ FIJA: 'FIJA', TIPADA: 'TIPADA', CARTAS: 'CARTAS' });

export const modoActual = () => BALANCE.economia.modo;
export const esTipada = (modo = modoActual()) => modo !== MODO.FIJA;

/**
 * Con qué Biomasa se paga una carta. Sólo las criaturas comen: un evento, un
 * clima o un recurso no tienen dieta y los paga cualquier Biomasa, que es lo
 * que los mantiene jugables en cualquier mazo.
 */
export function dietaDeCarta(cardId) {
  const c = carta(cardId);
  if (c.tipo === TIPO.BIOMASA) return null;
  return c.dieta ?? dietaDe(cardId);
}

/** Biomasa vegetal disponible: lo que hay menos lo que es animal. */
export const vegetalDe = (jug) => jug.biomasa - (jug.animal ?? 0);
export const animalDe = (jug) => jug.animal ?? 0;

/**
 * ¿Le llega para esta carta? En FIJA es la comparación de siempre. En las
 * tipadas, un carnívoro no puede comerse un helecho por mucha Biomasa que
 * tenga ahorrada: es exactamente el compromiso que la variante viene a crear.
 */
export function puedePagar(jug, cardId, modo = modoActual()) {
  const coste = carta(cardId).coste;
  if (!esTipada(modo)) return jug.biomasa >= coste;
  switch (dietaDeCarta(cardId)) {
    case DIETA.CARNIVORO: return animalDe(jug) >= coste;
    case DIETA.HERBIVORO: return vegetalDe(jug) >= coste;
    default: return jug.biomasa >= coste;   // omnívoros y cartas sin dieta
  }
}

/**
 * Cobra el coste. Los omnívoros pagan con vegetal primero: la animal es la
 * escasa —la pirámide trófica dice por qué— y gastarla en quien no la necesita
 * es tirarla.
 */
export function pagar(jug, cardId, modo = modoActual()) {
  const coste = carta(cardId).coste;
  if (!esTipada(modo)) { jug.biomasa -= coste; return; }

  // El vegetal disponible hay que mirarlo ANTES de tocar el total: es un saldo
  // derivado (total menos animal), y restar primero lo falsea.
  const vegetal = vegetalDe(jug);
  const dieta = dietaDeCarta(cardId);
  const delAnimal = dieta === DIETA.CARNIVORO ? coste
    : dieta === DIETA.HERBIVORO ? 0
      : Math.max(0, coste - vegetal);   // omnívoro: vegetal primero, animal si falta

  jug.biomasa -= coste;
  jug.animal -= delAnimal;
}

/** Devuelve el coste a su bolsa. Lo usa retirar una unidad recién desplegada. */
export function devolver(jug, cardId, modo = modoActual()) {
  const coste = carta(cardId).coste;
  jug.biomasa += coste;
  if (!esTipada(modo)) return;
  if (dietaDeCarta(cardId) === DIETA.CARNIVORO) jug.animal += coste;
}

/**
 * Ingresa Biomasa de un tipo, respetando el tope de ahorro. Devuelve cuánto
 * entró de verdad, que con el tope no siempre es lo que se cobró.
 */
export function ingresar(jug, cantidad, tipo, modo = modoActual()) {
  const antes = jug.biomasa;
  jug.biomasa = Math.min(jug.biomasa + cantidad, BALANCE.rentaTope);
  const entro = jug.biomasa - antes;
  if (esTipada(modo) && tipo === DIETA.CARNIVORO) jug.animal = (jug.animal ?? 0) + entro;
  return entro;
}

/**
 * La renta del turno en la economía TIPADA: lo que dé el tipo que el jugador
 * declaró. Producir animal renta la mitad que producir vegetal, y ésa es la
 * regla entera: la carne es cara porque la carne es cara.
 */
export function rentaTipada(produccion) {
  const t = BALANCE.economia.tipada;
  return produccion === DIETA.CARNIVORO
    ? { cantidad: t.animal, tipo: DIETA.CARNIVORO }
    : { cantidad: t.vegetal, tipo: DIETA.HERBIVORO };
}

/** ¿Esta carta es una de las de recurso de la variante CARTAS? */
export const esCartaDeBiomasa = (cardId) => carta(cardId).tipo === TIPO.BIOMASA;
