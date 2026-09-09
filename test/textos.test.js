// El texto de una carta tiene que decir lo que la carta hace.
//
// Suena obvio y ha fallado tres veces en dos días:
//
//   La Sabana decía «+1 al daño contra los biomas» mientras el motor le daba
//   Defensa, y la constante que su texto describía la había borrado alguien un
//   día antes — dejando a la IA calculando NaN.
//
//   El Canal decía «los ribereños pelean a gusto» y callaba que daba +1 de Vida
//   a TODOS los dinosaurios del campo, que es su efecto principal.
//
//   La Llanura decía «devolver una carta al fondo del mazo» después de que se
//   le añadiera el robo, así que prometía una pérdida y hacía un cambio.
//
// La comprobación es tonta a propósito: si el rasgo lleva un número, el texto
// tiene que citarlo. No prueba que el texto sea CIERTO —eso no lo puede probar
// una máquina— pero sí que no se quedó atrás cuando el número cambió.

import test from 'node:test';
import assert from 'node:assert/strict';

import { mecanicas } from '../tools/mecanicas.mjs';
import { CARTAS, CARTAS_DE_JEFE } from '../src/data/cards.js';

/**
 * Cartas cuyo texto no cita su número a propósito. Cada excepción va con su
 * motivo: una lista sin motivos se llena sola y el guardián deja de servir.
 */
const PERDONADAS = {
  // «una vez por turno» dice el 1 con letra, que se lee mejor que «1 vez».
  llanura: true,
};

test('Si un rasgo lleva número, el texto de la carta lo dice', () => {
  const todas = { ...CARTAS, ...CARTAS_DE_JEFE };
  const mal = [];

  for (const mec of mecanicas()) {
    if (typeof mec.valor !== 'number') continue;
    for (const c of Object.values(todas)) {
      if (c.rasgo !== mec.rasgo || !c.rasgoTexto || PERDONADAS[c.id]) continue;
      const cita = new RegExp(`(^|[^0-9])${mec.valor}([^0-9]|$)`);
      if (!cita.test(c.rasgoTexto)) {
        mal.push(`${c.id}: «${c.rasgoTexto}» — pero ${mec.constante} vale ${mec.valor}`);
      }
    }
  }

  assert.deepEqual(mal, [], `\n${mal.join('\n')}`);
});

test('Toda carta con rasgo tiene nombre y texto de rasgo', () => {
  // Las dos cartas de jefe llegaron sin ninguno de los dos y su ficha enseñaba
  // un rasgo en blanco — las dos únicas recompensas del juego cooperativo.
  const mal = [];
  for (const c of Object.values({ ...CARTAS, ...CARTAS_DE_JEFE })) {
    if (c.rasgo === 'NINGUNO') continue;
    if (!c.rasgoNombre) mal.push(`${c.id} no tiene rasgoNombre`);
    if (!c.rasgoTexto) mal.push(`${c.id} no tiene rasgoTexto`);
  }
  assert.deepEqual(mal, [], `\n${mal.join('\n')}`);
});
