// El paquete de la Edge Function es una SEGUNDA COPIA del motor. Tener dos
// copias del mismo código sólo es aceptable si es imposible que una se quede
// atrás sin que nadie se entere. Esto es lo que lo hace imposible.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  SALIDA, huellaDeFuentes, huellaDelPaquete, fuentesDelPaquete,
} from '../tools/huellaAsalto.mjs';

test('El paquete desplegable no se ha quedado atrás del código', () => {
  const fuentes = fuentesDelPaquete();
  assert.ok(fuentes.length > 0, `${SALIDA} no dice qué ficheros lleva dentro`);
  assert.equal(
    huellaDeFuentes(fuentes),
    huellaDelPaquete(),
    'El paquete de la Edge Function es viejo. Corre `node tools/empaquetar-asalto.mjs`.',
  );
});

test('El paquete lleva el motor dentro, no una referencia a él', () => {
  const txt = readFileSync(SALIDA, 'utf8');
  // Si quedara una ruta relativa al repositorio, el editor del panel no podría
  // resolverla y la función fallaría en producción, no aquí.
  assert.doesNotMatch(txt, /from ['"]\.\.?\//, 'quedó un import relativo sin resolver');
  assert.match(txt, /Deno\.serve/, 'el paquete no arranca ningún servidor');
  // Lo único que puede quedar sin empaquetar es lo que Deno resuelve por URL.
  for (const [, origen] of txt.matchAll(/from ["']([^"']+)["']/g)) {
    assert.match(origen, /^(jsr:|npm:|https:)/, `import sin empaquetar: ${origen}`);
  }
});

test('Las fuentes que declara llevar existen y son del repositorio', () => {
  for (const f of fuentesDelPaquete()) {
    assert.doesNotMatch(f, /^(jsr:|npm:|https:)/, `${f} no es un fichero del repositorio`);
    assert.doesNotThrow(() => readFileSync(f), `${f} no existe`);
  }
});
