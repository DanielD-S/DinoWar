// El ARMAZÓN de habilidades al entrar en juego, sin cartas que lo usen.
//
// Las 52 criaturas son coste, Ataque y Vida y nada más: el autor va a diseñar
// las habilidades a mano sobre la hoja de recoste. Hasta entonces esto no puede
// probarse jugando —no hay carta que desplegar— así que se comprueba que la
// fontanería sigue enhebrada.
//
// Suena a test de poco valor y no lo es: la forma de romper esto sin enterarse
// es que alguien quite la llamada de `resolve.js` en un refactor, y entonces la
// primera habilidad que se escriba no se dispararía y nadie sabría por qué.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { BALANCE } from '../src/data/balance.js';
import { CARTAS, CARTAS_DE_JEFE, RASGO, TIPO } from '../src/data/cards.js';
import { ES_ENTRADA, esEntrada, valorDeEntrada, HAY_ENTRADAS } from '../src/engine/entradas.js';
import { CON_ENTRADA } from '../sim/entradas.js';

test('Hoy ninguna criatura tiene habilidad, y son todas planas', () => {
  const todas = { ...CARTAS, ...CARTAS_DE_JEFE };
  for (const c of Object.values(todas)) {
    if (c.tipo !== TIPO.DINOSAURIO) continue;
    assert.equal(c.rasgo, RASGO.NINGUNO, `${c.id} conserva un rasgo`);
    assert.equal(c.rasgoNombre, undefined, `${c.id} conserva un nombre de rasgo`);
    assert.equal(c.rasgoTexto, undefined, `${c.id} conserva un texto de rasgo`);
  }
  assert.deepEqual(CON_ENTRADA, [],
    'el medidor descubre las cartas del set: si esto no está vacío, alguna la tiene');
});

test('El soporte SÍ conserva su mecánica: sin ella no sería una carta', () => {
  // Un evento o un clima ES su rasgo. Aplanarlos habría sido borrar 16 cartas.
  const soporte = Object.values(CARTAS).filter((c) => c.tipo !== TIPO.DINOSAURIO);
  assert.equal(soporte.length, 16);
  for (const c of soporte) {
    assert.notEqual(c.rasgo, RASGO.NINGUNO, `${c.id} se quedó sin mecánica`);
    assert.ok(c.rasgoNombre && c.rasgoTexto, `${c.id} no tiene nombre o texto`);
  }
});

test('El armazón sigue montado y con sus números', () => {
  // Seis formas de habilidad, cada una con su constante. Poner una carta nueva
  // es una entrada en cards.js y un caso en el switch de entradas.js.
  assert.equal(Object.keys(ES_ENTRADA).length, 6);
  assert.equal(HAY_ENTRADAS, true);
  for (const rasgo of Object.keys(ES_ENTRADA)) {
    assert.ok(RASGO[rasgo], `${rasgo} no está en RASGO`);
  }
  for (const [clave, valor] of Object.entries(BALANCE.entradas)) {
    assert.ok(Number.isFinite(valor) && valor > 0, `entradas.${clave} no es un número usable`);
  }
});

test('La fase de revelación sigue llamando a la habilidad de entrada', () => {
  // La forma de romper esto en silencio es quitar esta llamada en un refactor.
  const resolve = readFileSync('src/engine/resolve.js', 'utf8');
  assert.match(resolve, /import \{ alEntrar \} from '\.\/entradas\.js'/);
  assert.match(resolve, /alEntrar\(s, inst, \{/);
});

test('Una carta plana no vale nada extra para la IA', () => {
  // El día que haya habilidades, cada una necesita su número en
  // `valorDeEntrada()`. Sin él la IA la ignora y la carta no se juega jamás: le
  // pasó a la Llanura, cero usos en 300 partidas hasta que se le puso valor.
  assert.equal(valorDeEntrada('stegosaurus'), 0);
  assert.equal(esEntrada('stegosaurus'), false);
});
