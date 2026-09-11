// El índice tiene que decir la verdad sobre lo que se sirve.
//
// `src/dinos/` está en .gitignore —los originales pesan 29 MB y no viajan—, así
// que en un clon recién hecho está vacío. Cuando `tools/imagenes.py` construía
// la lista con lo que acababa de convertir, añadir UNA ilustración borraba del
// índice las otras cincuenta y dos, que seguían en disco intactas. El juego
// dibujaba siluetas donde había dibujo y no se quejaba: el índice es la única
// fuente que consulta `detectarFotos()`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(RAIZ, 'assets', 'dinos');
const indice = JSON.parse(readFileSync(join(DIR, 'indice.json'), 'utf8'));
const enDisco = readdirSync(DIR)
  .filter((n) => n.endsWith('.jpg'))
  .map((n) => n.slice(0, -4))
  .sort();

test('el índice lista exactamente los JPEG servidos', () => {
  assert.deepEqual(indice.cartas.slice().sort(), enDisco);
});

test('el índice de cartas enteras lista exactamente los JPEG servidos', () => {
  // Mismo trato que las ilustraciones y por el mismo motivo: `src/cartas/` está
  // en .gitignore, así que en un clon recién hecho está vacío y una pasada de
  // la herramienta no puede decidir la lista por su cuenta.
  const DIR_C = join(RAIZ, 'assets', 'cartas');
  if (!existsSync(DIR_C)) return;                 // no tener ninguna es normal
  const idx = JSON.parse(readFileSync(join(DIR_C, 'indice.json'), 'utf8'));
  const enDiscoC = readdirSync(DIR_C)
    .filter((n) => n.endsWith('.jpg'))
    .map((n) => n.slice(0, -4))
    .sort();
  assert.deepEqual(idx.cartas.slice().sort(), enDiscoC);
});

test('toda carta entera es una carta del set', () => {
  const DIR_C = join(RAIZ, 'assets', 'cartas');
  if (!existsSync(DIR_C)) return;
  const fuente = readFileSync(join(RAIZ, 'src', 'data', 'cards.js'), 'utf8');
  const ids = new Set([...fuente.matchAll(/^\s*id: '([a-z_]+)'/gm)].map((m) => m[1]));
  const idx = JSON.parse(readFileSync(join(DIR_C, 'indice.json'), 'utf8'));
  for (const id of idx.cartas) {
    assert.ok(ids.has(id), `carta entera sin carta detrás: ${id}`);
  }
});

test('ningún punto focal apunta a una ilustración que ya no está', () => {
  for (const id of Object.keys(indice.foco ?? {})) {
    assert.ok(enDisco.includes(id), `foco huérfano: ${id}`);
  }
});
