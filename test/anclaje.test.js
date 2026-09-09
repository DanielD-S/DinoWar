// La versión corta de la Edge Function trae el motor por URL desde un commit
// anclado. Si ese anclaje se queda atrás, el despliegue PARECE correcto y no lo
// es: la función sigue trayendo el validador viejo y nadie se entera.
//
// Ya pasó una vez. Este test es lo que hace que no vuelva a pasar.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { readFileSync as leer } from 'node:fs';
import {
  shaAnclado, enElCommit, VIGILADOS, SALIDA, APARICIONES_MINIMAS,
} from '../tools/anclar-desde-url.mjs';

test('La versión corta apunta a un commit de verdad', () => {
  const sha = shaAnclado();
  assert.ok(sha, `${SALIDA} no declara ningún commit`);
  assert.match(sha, /^[0-9a-f]{40}$/, 'el anclaje tiene que ser un commit completo, no una rama');
});

test('Los importes son estáticos, o el módulo no viaja al servidor', () => {
  // Con un import dinámico de ruta calculada, el empaquetado del despliegue no
  // ve la dependencia y la función muere con «Module not found» aunque la URL
  // conteste 200. Pasó, y desde fuera parecía un problema de la URL.
  // Se miran sólo las líneas de código: el comentario de arriba del fichero
  // explica el fallo citando el patrón, y buscarlo en todo el texto encontraba
  // la advertencia en vez de la falta.
  const codigo = leer(SALIDA, 'utf8')
    .split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
  assert.doesNotMatch(codigo, /await import\(/, 'un import dinámico no se empaqueta');
  assert.equal(
    (leer(SALIDA, 'utf8').match(new RegExp(shaAnclado(), 'g')) ?? []).length >= APARICIONES_MINIMAS,
    true,
    'la URL literal se repite en cada import: todas tienen que llevar el mismo commit',
  );
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
