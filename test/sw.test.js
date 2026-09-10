// El service worker promete «red primero» para el código: publicar tiene que
// significar que la próxima recarga trae lo nuevo. No lo cumplía —fetch() pasa
// por la caché HTTP del navegador, y las páginas se sirven con max-age— así que
// durante minutos la «red» devolvía la versión vieja.
//
// Pasó de verdad: se corrigió un fallo, se publicó, se recargó, y el juego
// siguió ejecutando el código de antes. Se tardó en verlo porque en local no se
// reproduce: el servidor de pruebas no manda Cache-Control.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sw = readFileSync('sw.js', 'utf8');

test('El código se pide revalidando, o «red primero» es mentira', () => {
  assert.match(sw, /cache: 'no-cache'/,
    'sin revalidar, fetch() sirve lo que tenga la caché HTTP del navegador');
  assert.match(sw, /guardar\(request, true\)/,
    'la rama del código tiene que pedir la revalidación');
});

test('Las ilustraciones NO revalidan: pesan y no cambian', () => {
  // Revalidarlas sería una petición condicional por imagen y por carga, a
  // cambio de nada: una ilustración nueva trae nombre nuevo.
  assert.match(sw, /esImagenDeCarta\(url\)\)\s*\{\s*\n\s*e\.respondWith\(caches\.match/,
    'las imágenes de carta deben seguir siendo caché primero');
});

test('Las dos carpetas de imagen van por la misma rama', () => {
  // `assets/cartas/` llegó después que `assets/dinos/`. Quedarse fuera de la
  // rama de caché no daría error: pediría la carta entera por red en cada
  // apertura del visor, y sin conexión no la enseñaría.
  for (const carpeta of ['/assets/dinos/', '/assets/cartas/']) {
    assert.ok(sw.includes(carpeta), `el service worker no conoce ${carpeta}`);
  }
});

test('Los índices quedan fuera de la caché primero', () => {
  // Un índice cacheado sin revalidar congela la lista: la ilustración nueva
  // está servida y el juego sigue dibujando su silueta.
  assert.match(sw, /esIndice\s*=\s*\(url\)\s*=>\s*url\.pathname\.endsWith\('\/indice\.json'\)/,
    'los dos índices tienen que reconocerse como índice');
});

test('La versión de la caché sube cuando cambia lo servido', () => {
  const m = sw.match(/const VERSION = 'dinowar-v(\d+)'/);
  assert.ok(m, 'sw.js no declara versión');
  assert.ok(Number(m[1]) >= 24, 'la versión no subió con el último cambio servido');
});
