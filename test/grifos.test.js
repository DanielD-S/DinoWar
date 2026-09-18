// Los GRIFOS de monedas: cuántos sobres al día puede dar el juego.
//
// La economía se endureció el 18-09-2026 con una intención concreta del autor:
// comprar sobres jugando tiene que ser posible y costar. Eso no es una
// constante, es la suma de cuatro cosas —el precio del sobre, lo que paga una
// victoria, cuántas se cobran al día y lo que pagan las misiones— y cualquiera
// de las cuatro puede deshacerlo sola sin que falle ningún otro test.
//
// Lo que se midió antes de tocarlo, y por lo que este guardián existe: a 100
// monedas el sobre y 50 victorias pagadas al día el techo eran 26 sobres
// diarios y la colección entera se juntaba en seis días.

import test from 'node:test';
import assert from 'node:assert/strict';

import { ECONOMIA, limiteDe } from '../src/data/coleccion.js';
import { CARTAS } from '../src/data/cards.js';
import { CATALOGO as MISIONES, MISIONES as REGLAS } from '../src/data/misiones.js';
import { pagoDeRejugar } from '../src/data/rejugar.js';
import { REJUGAR } from '../src/data/rejugar.js';
import { EXPEDICIONES, VISITANTES } from '../src/data/expediciones.js';

const TODOS = [...EXPEDICIONES.flatMap((e) => e.rivales), ...VISITANTES];

/** El día más caro posible: las misiones más ricas y el tope de victorias
 *  jugado todo contra el nodo que mejor paga por rejugarlo. */
function techoDelDia() {
  const misiones = MISIONES.map((m) => m.premio).sort((a, b) => b - a)
    .slice(0, REGLAS.porDia).reduce((a, b) => a + b, 0);
  const mejor = Math.max(...TODOS.map((r) => pagoDeRejugar(r.premio)));
  const rejugadas = Math.min(REJUGAR.porDia, ECONOMIA.victoriasPorDia);
  const resto = Math.max(0, ECONOMIA.victoriasPorDia - rejugadas);
  return misiones + rejugadas * mejor + resto * ECONOMIA.monedasVictoria;
}

test('El techo del día no pasa de dos sobres', () => {
  const sobres = techoDelDia() / ECONOMIA.precioSobre;
  assert.ok(sobres <= 2, `el día más caro posible da ${sobres.toFixed(2)} sobres`);
  // Y tampoco puede quedarse en nada: jugar mucho un día tiene que dar uno.
  assert.ok(sobres >= 1, `el día más caro posible da ${sobres.toFixed(2)} sobres`);
});

test('Una victoria suelta vale menos de un sexto de sobre', () => {
  // Diez victorias por sobre es lo que hace que comprar jugando CUESTE. Con
  // dos, que era lo de antes, la colección se juntaba en menos de una semana.
  assert.ok(ECONOMIA.monedasVictoria * 6 <= ECONOMIA.precioSobre,
    `${ECONOMIA.precioSobre / ECONOMIA.monedasVictoria} victorias por sobre`);
});

test('Las monedas de inicio son exactamente un sobre', () => {
  // Menos es una cuenta nueva que no puede abrir ninguno, que es peor primera
  // impresión que regalar uno.
  assert.equal(ECONOMIA.monedasInicio, ECONOMIA.precioSobre);
});

test('La colección entera no baja de dos meses de juego normal', () => {
  const copias = Object.keys(CARTAS).reduce((n, id) => n + limiteDe(id), 0);
  // 135 sobres de media con el sesgo de 0,7, medido con 300 cuentas simuladas.
  const sobres = 135;
  assert.ok(sobres * ECONOMIA.cartasPorSobre > copias, 'el reparto no cuadra con el set');
  // Un día normal: seis victorias y las misiones baratas.
  const normal = 6 * ECONOMIA.monedasVictoria
    + MISIONES.map((m) => m.premio).sort((a, b) => a - b).slice(0, REGLAS.porDia).reduce((a, b) => a + b, 0);
  const dias = (sobres * ECONOMIA.precioSobre) / normal;
  assert.ok(dias >= 60, `la colección entera cae en ${dias.toFixed(0)} días de juego normal`);
});
