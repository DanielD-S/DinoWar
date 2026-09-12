// DinoWar — la marca al arrancar y la pantalla de carga.
//
// Dos pantallas antes del juego, y cada una tapa un hueco distinto:
//
//   MARCA   la casa que hace el juego. Nace visible desde el HTML —es la única
//           sección que no empieza en `oculta`— porque tiene que pintarse antes
//           de que llegue el JavaScript. Aquí sólo se decide cuándo se va.
//   CARGA   mientras el servidor contesta. Antes, con la sesión guardada, el
//           arranque no enseñaba NADA: todas las pantallas nacen ocultas y el
//           menú aparecía cuando terminaban las dos llamadas. En móvil eran
//           uno o dos segundos de negro.
//
// La barra avanza por HITOS, no con un temporizador. Son tres y son reales:
// las piezas del menú descargadas, la cuenta presentada, el perfil traído. Una
// barra que sube sola mientras nada pasa es exactamente la clase de mentira
// que el resto del juego evita —el mismo motivo por el que la Cuenca dice en
// pantalla cuando no hay tribu—. Lo único que no es un hito es el medio
// segundo final: el oro tarda eso en llegar al extremo, y se espera a que
// llegue en vez de cortarlo.

import { el } from './render.js';

const reducido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Cuánto se enseña la marca, y cuánto tarda en irse. */
const MARCA = Object.freeze({ dura: 1500, salida: 350, reducida: 700 });
/** A partir de aquí la carga dice que el servidor tarda. No es un error. */
const LENTO_MS = 6000;
/** Lo que tarda el oro en recorrer la ranura (la transición del CSS). */
const ORO_MS = 650;

/**
 * Deja la marca en pantalla su tiempo y la desvanece. Resuelve cuando ya se
 * puede enseñar lo siguiente. Con `prefers-reduced-motion`, menos tiempo y
 * sin fundido: la marca se ve, pero no se hace esperar.
 */
export function mostrarMarca() {
  const dura = reducido() ? MARCA.reducida : MARCA.dura;
  return new Promise((listo) => setTimeout(() => {
    el.marca.classList.add('se-va');
    setTimeout(listo, reducido() ? 0 : MARCA.salida);
  }, dura));
}

/**
 * Arranca una carga de `pasos` hitos. Devuelve el mando: `avanzar()` por cada
 * hito cumplido, `terminar()` cuando estén todos —espera a que el oro llegue
 * al final— y `cancelar()` si algo falló y la pantalla se va sin terminar.
 *
 * La nota de «el servidor tarda» sale sola a los seis segundos y se quita al
 * terminar o cancelar: es información, no un error, y no bloquea nada.
 */
export function empezarCarga(pasos) {
  let hechos = 0;
  const pintar = (p) => {
    el.cargaBarra.style.setProperty('--p', String(p));
    el.cargaBarra.setAttribute('aria-valuenow', String(Math.round(p * 100)));
  };
  el.cargaNota.textContent = '';
  pintar(0);
  const lento = setTimeout(() => {
    el.cargaNota.textContent = 'El servidor tarda en contestar…';
  }, LENTO_MS);

  return {
    avanzar() {
      hechos = Math.min(pasos, hechos + 1);
      pintar(hechos / pasos);
    },
    async terminar() {
      clearTimeout(lento);
      el.cargaNota.textContent = '';
      pintar(1);
      await new Promise((r) => setTimeout(r, reducido() ? 40 : ORO_MS));
    },
    cancelar() {
      clearTimeout(lento);
      el.cargaNota.textContent = '';
    },
  };
}

/**
 * Descarga las piezas del menú y espera a las fuentes. Es el primer hito y es
 * de verdad: sin esto la portada y las cinco placas aparecían una a una al
 * llegar al menú, que a estas alturas ya tiene todo lo demás. Un fichero que
 * falle no para la carga —se resuelve igual— porque el menú se pinta sin él.
 */
export function precargarPiezas(rutas) {
  const imagenes = rutas.map((ruta) => new Promise((listo) => {
    const i = new Image();
    i.onload = listo;
    i.onerror = listo;
    i.src = ruta;
  }));
  const fuentes = document.fonts?.ready ?? Promise.resolve();
  return Promise.all([fuentes, ...imagenes]);
}
