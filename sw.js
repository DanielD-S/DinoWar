// DinoWar — service worker.
//
// El juego no tiene servidor: todo lo que necesita son ficheros estáticos y el
// localStorage del navegador. Con esto se puede instalar en el móvil y jugar
// sin conexión, que es lo que ya prometía «sin instalación, sin cuenta, sin
// backend» y no cumplía del todo.
//
// Estrategia deliberada: **red primero** para el código y la hoja de estilos.
// El sitio se publica empujando a main, sin nombres con hash, así que servir
// primero la caché dejaría a la gente jugando una versión vieja sin manera de
// saberlo. La caché es la red de seguridad para cuando no hay red, no un
// acelerador. Las ilustraciones sí van de caché primero: pesan, no cambian y no
// arreglan nada al recargarlas. Su ÍNDICE no: `indice.json` dice qué cartas
// tienen ilustración, así que servirlo de caché congela el juego en el set que
// hubiera cuando se guardó. Pasó: se añadieron treinta y seis ilustraciones y
// los navegadores que ya habían entrado siguieron dibujando siluetas.
//
// Al cambiar cualquier fichero servido hay que subir VERSION: activa la limpieza
// de las cachés anteriores.
const VERSION = 'dinowar-v46';
const ESENCIALES = [
  './', './index.html', './style.css', './piel.css', './carta.css', './manifest.json', './src/main.js',
  './assets/fuentes/inter-latin.woff2',
  './assets/fuentes/cinzel-latin.woff2', './assets/fuentes/libre-baskerville-400-latin.woff2',
  './assets/fuentes/terralis.woff2',
];

// Los índices van aparte: son la lista de lo que hay, no una de las cosas que
// hay. Si se cachearan como imagen, una ilustración nueva no aparecería nunca.
const esIndice = (url) => url.pathname.endsWith('/indice.json');
// Tres carpetas, misma regla de caché: las ilustraciones de `dinos/`, las
// cartas enteras de `cartas/` y las piezas del tablero de `piel/` pesan y no
// cambian, así que van de caché primero.
const esImagenDeCarta = (url) => (url.pathname.includes('/assets/dinos/')
  || url.pathname.includes('/assets/cartas/')
  || url.pathname.includes('/assets/piel/')
  || url.pathname.includes('/assets/marcos/')) && !esIndice(url);

self.addEventListener('install', (e) => {
  // Que falte un fichero del precacheado no debe dejar el service worker sin
  // instalar: lo que no esté se cacheará en la primera petición.
  e.waitUntil(caches.open(VERSION)
    .then((c) => Promise.allSettled(ESENCIALES.map((u) => c.add(u))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((claves) => Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (esImagenDeCarta(url)) {
    e.respondWith(caches.match(request).then((hit) => hit ?? guardar(request)));
    return;
  }

  // El código y los datos se revalidan siempre; las ilustraciones no pasan por
  // aquí porque van de caché primero, que para eso no cambian.
  e.respondWith(
    guardar(request, true).catch(() => caches.match(request)
      .then((hit) => hit ?? caches.match('./index.html'))),
  );
});

/** Pide a la red y se queda una copia. Sólo guarda respuestas completas. */
async function guardar(request, revalidar = false) {
  // `cache: 'no-cache'` NO es «no guardes»: es «pregunta al servidor si ha
  // cambiado». Sin esto, «red primero» era mentira — fetch() pasa por la caché
  // HTTP del navegador, y GitHub Pages sirve con max-age, así que durante
  // minutos la «red» devolvía la versión vieja. Pasó: se arregló un fallo, se
  // publicó, se recargó y el juego siguió ejecutando el código de antes.
  //
  // El coste es una petición condicional que casi siempre contesta 304 sin
  // cuerpo. Barato, y es lo único que hace que publicar signifique algo.
  const respuesta = await fetch(request, revalidar ? { cache: 'no-cache' } : undefined);
  if (respuesta.ok && respuesta.type === 'basic') {
    const copia = respuesta.clone();
    const cache = await caches.open(VERSION);
    await cache.put(request, copia);
  }
  return respuesta;
}
