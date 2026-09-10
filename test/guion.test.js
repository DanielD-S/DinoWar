// Todo evento del motor está DECIDIDO: o tiene compás, o está en la lista de
// los que no se ven y con su motivo escrito.
//
// Es el guardián del problema que motivó el guión. El motor emitía treinta y un
// tipos de evento y se animaban cuatro; los otros veintisiete cambiaban el
// tablero de golpe y salían como un renglón de texto. Lo que más se notaba eran
// justo las cartas nuevas: se diseñaban, se implementaban, y nacían invisibles.
//
// Sin este test eso vuelve solo. Alguien añade `ev(s, 'LO_QUE_SEA', …)` en el
// motor, el juego funciona, los tests pasan, y la habilidad no se ve. Aquí hay
// que elegir: le pones compás en `guion.js` o dices por qué no lo lleva.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

import { GUION } from '../src/ui/guion.js';
import { BALANCE } from '../src/data/balance.js';

/**
 * Los que NO se animan, con el motivo. Una lista de excepciones sin motivos se
 * llena sola y deja de significar nada.
 */
const CALLADOS = {
  // Contabilidad del turno: no son sucesos, son el marcador moviéndose. El
  // tablero ya los enseña con sus cifras.
  RENTA: 'la Biomasa del turno; se ve en el marcador',
  PRODUCCION: 'declarar producción es secreto, por diseño',
  REBARAJADO: 'no cambia nada que el jugador pueda decidir',

  // Ya tienen su propia animación, que es más que un compás.
  CHOQUE: 'lo lleva animarCombate, ranura a ranura',
  AVANCE: 'lo lleva animarCombate',
  HABITAT: 'lo lleva animarCombate',
  MUERTE: 'lo lleva animarCombate',
  DANO: 'el golpe ya se ve en el choque que lo produce',
  REVELADA: 'lo lleva animarRevelacion, con su volteo escalonado',
  SOBREVUELO: 'lo lleva animarCombate',

  // Lo que el jugador acaba de hacer con la mano: ya lo ha visto hacerlo.
  MOVIDA: 'la carta se mueve sola en el tablero',
  RETIRADA: 'la carta vuelve a la mano a la vista',
  MULLIGAN: 'la mano entera se repinta',
  DESCARTE: 'sale de su propia hoja de descarte',
  RECHAZADA: 'es un aviso de la interfaz, no un suceso del juego',

  // Fin de partida: tiene su propia pantalla.
  FIN: 'la pantalla de resultado dice bastante más',
  SIN_COMBATE: 'el primer turno no pelea y el mensaje ya lo dice',
  ADAPTACION_PERDIDA: 'el objetivo ya no está; no hay a quién señalar',

  // Sólo existe en la variante de economía por CARTAS, que no se publica: el
  // juego corre siempre en FIJA. Si algún día se publica, necesita compás.
  BIOMASA: 'sólo en la economía por cartas, que no se juega',
};

/** Los tipos que el motor emite de verdad, leídos del código. */
function tiposDelMotor() {
  const tipos = new Set();
  for (const f of readdirSync('src/engine')) {
    if (!f.endsWith('.js')) continue;
    const src = readFileSync(`src/engine/${f}`, 'utf8');
    for (const m of src.matchAll(/\bev\(s, '([A-Z_]+)'/g)) tipos.add(m[1]);
  }
  return [...tipos].sort();
}

test('Todo evento del motor tiene compás o motivo para no tenerlo', () => {
  const sinDecidir = tiposDelMotor().filter((t) => !GUION[t] && !CALLADOS[t]);
  assert.deepEqual(sinDecidir, [],
    `\nEstos eventos no se ven y nadie ha dicho por qué:\n  ${sinDecidir.join('\n  ')}\n`
    + 'Ponles compás en src/ui/guion.js o añádelos a CALLADOS con su motivo.');
});

test('No sobra ningún compás: todos son de eventos que existen', () => {
  // Un compás para un evento que el motor ya no emite es código muerto que
  // parece vivo, y engaña al siguiente que lea la tabla buscando un ejemplo.
  const reales = new Set(tiposDelMotor());
  const huerfanos = Object.keys(GUION).filter((t) => !reales.has(t));
  assert.deepEqual(huerfanos, [], `sobran compases: ${huerfanos.join(', ')}`);
});

test('Ningún compás alarga el turno más de la cuenta', () => {
  // Un turno con el campo lleno puede disparar diez habilidades. A medio
  // segundo cada una son cinco segundos mirando, y eso no es un juego con
  // ritmo: es una espera. Ninguna sola puede pasar de 600 ms.
  for (const [tipo, c] of Object.entries(GUION)) {
    const dura = typeof c.dura === 'function' ? c.dura({ tipo, efecto: 'fulmina' }) : c.dura;
    assert.ok(dura > 0 && dura <= 600, `${tipo} dura ${dura} ms`);
  }
});

test('El guión sabe de las ranuras que hay', () => {
  // Cordura: si el tablero cambia de tamaño, el guión sigue sin números
  // propios. No tiene ninguno, y este test está para que siga sin tenerlos.
  const src = readFileSync('src/ui/guion.js', 'utf8');
  assert.ok(BALANCE.ranuras > 0);
  assert.doesNotMatch(src, /BALANCE\.ranuras/, 'el guión no debe saber de geometría');
});
