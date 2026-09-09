// La versión corta de la Edge Function trae el motor por URL desde un commit
// anclado. Si ese anclaje se queda atrás, el despliegue PARECE correcto y no lo
// es: la función sigue trayendo el validador viejo y nadie se entera.
//
// Ya pasó una vez. Este test es lo que hace que no vuelva a pasar.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { shaAnclado, enElCommit, VIGILADOS, SALIDA } from '../tools/anclar-desde-url.mjs';

test('La versión corta apunta a un commit de verdad', () => {
  const sha = shaAnclado();
  assert.ok(sha, `${SALIDA} no declara ningún commit`);
  assert.match(sha, /^[0-9a-f]{40}$/, 'el anclaje tiene que ser un commit completo, no una rama');
});

test('El commit anclado lleva el mismo motor que el árbol de trabajo', () => {
  const sha = shaAnclado();
  for (const f of VIGILADOS) {
    const alli = enElCommit(sha, f);
    assert.ok(alli !== null, `el commit anclado (${sha.slice(0, 8)}) ni siquiera tiene ${f}`);
    assert.equal(
      alli,
      readFileSync(f, 'utf8'),
      `${f} cambió desde el commit anclado. La versión corta desplegaría código viejo.\n`
      + 'Corre `node tools/anclar-desde-url.mjs` y vuelve a desplegar.',
    );
  }
});
