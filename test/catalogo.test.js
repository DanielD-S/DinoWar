// El catálogo de la cuenca vive en dos sitios: en JavaScript, donde lo lee el
// juego, y en la base de datos, donde el servidor decide si un jefe está
// abierto y cuánta vida tiene. Tiene que estar en los dos —el servidor no puede
// fiarse del cliente para eso— así que lo único que queda es garantizar que no
// se contradigan.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { generar, SALIDA } from '../tools/generar-catalogo.mjs';
import { JEFES, CALENDARIO, TIPO_EVENTO } from '../src/data/eventos.js';

test('La migración del catálogo es la que saldría hoy del código', () => {
  assert.equal(
    readFileSync(SALIDA, 'utf8'),
    generar(),
    'El catálogo en SQL se quedó atrás. Corre `node tools/generar-catalogo.mjs`.',
  );
});

test('El SQL lleva la vida real de cada jefe, no una copiada a mano', () => {
  const sql = readFileSync(SALIDA, 'utf8');
  for (const e of CALENDARIO.filter((x) => x.tipo === TIPO_EVENTO.JEFE)) {
    const j = JEFES[e.jefe];
    // Si esta línea deja de aparecer, el servidor abriría el jefe con otra vida
    // que la que el juego enseña, y nadie se enteraría hasta que no cuadrasen.
    assert.match(sql, new RegExp(`'${e.id}'[^\\n]*${j.vidaMaxima}`),
      `${e.id} no lleva su vida (${j.vidaMaxima}) en el SQL`);
  }
});
