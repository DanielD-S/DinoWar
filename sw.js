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
const VERSION = 'dinowar-v23';
const ESENCIALES = [
  './', './index.html', './style.css', './manifest.json', './src/main.js',
  './assets/fuentes/inter-latin.woff2',
];

// El índice va aparte: es la lista de lo que hay, no una de las cosas que hay.
const esIndice = (url) => url.pathname.endsWith('/assets/dinos/indice.json');
const esIlustracion = (url) => url.pathname.includes('/assets/dinos/') && !esIndice(url);

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

  if (esIlustracion(url)) {
    e.respondWith(caches.match(request).then((hit) => hit ?? guardar(request)));
    return;
  }

  e.respondWith(
    guardar(request).catch(() => caches.match(request)
      .then((hit) => hit ?? caches.match('./index.html'))),
  );
});

/** Pide a la red y se queda una copia. Sólo guarda respuestas completas. */
async function guardar(request) {
  const respuesta = await fetch(request);
  if (respuesta.ok && respuesta.type === 'basic') {
    const copia = respuesta.clone();
    const cache = await caches.open(VERSION);
    await cache.put(request, copia);
  }
  return respuesta;
}
