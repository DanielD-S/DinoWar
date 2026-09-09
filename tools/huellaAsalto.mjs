// Huella de las fuentes que van dentro del paquete de la Edge Function.
//
// Lo comparten el empaquetador y el test: uno la escribe y el otro la
// recalcula. Es la única defensa contra el problema de tener dos copias del
// mismo código — que una se quede atrás sin que nadie se entere.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const SALIDA = 'supabase/functions/asalto/paquete.ts';
export const MARCA = 'huella: ';

/** Los ficheros ordenados, para que la huella no dependa del orden de lectura. */
export function huellaDeFuentes(ficheros) {
  const h = createHash('sha256');
  for (const f of [...ficheros].sort()) {
    h.update(f);
    h.update('\0');
    h.update(readFileSync(f));
    h.update('\0');
  }
  return h.digest('hex').slice(0, 16);
}

/** La huella que el paquete dice llevar, o null si no la trae. */
export function huellaDelPaquete() {
  const m = readFileSync(SALIDA, 'utf8').match(new RegExp(`${MARCA}([0-9a-f]{16})`));
  return m ? m[1] : null;
}

/**
 * Los ficheros que el paquete DICE llevar dentro. Se lee la lista que escribió
 * el empaquetador —la que le dio esbuild— y no se rascan los comentarios del
 * bundle: si el test dedujera la lista por su cuenta, estaría comprobando su
 * propia deducción y no el paquete.
 */
export function fuentesDelPaquete() {
  const txt = readFileSync(SALIDA, 'utf8');
  return [...txt.matchAll(/^\/\/ fuente: (.+)$/gm)].map((m) => m[1].trim());
}
