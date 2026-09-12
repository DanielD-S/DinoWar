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
// pantalla cuando no hay tribu—.
//
// Y sin embargo la pantalla tiene un MÍNIMO de permanencia. Con el servidor
// rápido los tres hitos caían en un segundo y la carga era un parpadeo: el
// autor la pidió más larga. La forma honesta de dárselo no es inventar hitos,
// es RETRASAR el dibujo: cada hito tiene su momento «debido» dentro del
// mínimo, y el oro se desliza hasta él en vez de saltar. Lo dibujado nunca va
// por delante de lo hecho; sólo por detrás. Y si el servidor tarda de verdad,
// el mínimo no manda: el oro se mueve cuando llega el hito, como antes.

import { el } from './render.js';

const reducido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Cuánto se enseña la marca, cuánto tarda en irse, y cuánto se espera a que
 *  su imagen baje antes de empezar a contar. */
const MARCA = Object.freeze({ dura: 2600, salida: 400, reducida: 900, esperaImagen: 2500 });
/** A partir de aquí la carga dice que el servidor tarda. No es un error. */
const LENTO_MS = 6000;
/** La carga: cuánto se queda como poco, y lo que tarda el oro en un salto. */
const CARGA = Object.freeze({ minimo: 3600, reducida: 900, oro: 550 });

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Deja la marca en pantalla su tiempo y la desvanece. Resuelve cuando ya se
 * puede enseñar lo siguiente. Con `prefers-reduced-motion`, menos tiempo y
 * sin fundido: la marca se ve, pero no se hace esperar.
 *
 * `alIrse` se llama en el instante en que la marca EMPIEZA a desvanecerse,
 * no cuando ha terminado: es donde arranca la música del menú, para que
 * suba mientras el logo se disuelve y no después, sobre la carga ya puesta.
 * @param {() => void} [alIrse]
 */
export async function mostrarMarca(alIrse) {
  // El reloj arranca cuando la imagen SE VE, no cuando la página empieza a
  // pedirla. En la primera visita el logo baja por la red y, contando desde
  // el arranque, la mitad del tiempo se iba en pantalla vacía: «apenas dura».
  // Con tope, para que una imagen que no llega no deje la marca colgada.
  await imagenLista(el.marca.querySelector('img'), MARCA.esperaImagen);
  const dura = reducido() ? MARCA.reducida : MARCA.dura;
  await espera(dura);
  el.marca.classList.add('se-va');
  alIrse?.();
  await espera(reducido() ? 0 : MARCA.salida);
}

/** Resuelve cuando la imagen está descargada, o al pasar `tope` ms. */
function imagenLista(img, tope) {
  if (!img || img.complete) return Promise.resolve();
  return new Promise((listo) => {
    const t = setTimeout(listo, tope);
    const fin = () => { clearTimeout(t); listo(); };
    img.addEventListener('load', fin, { once: true });
    img.addEventListener('error', fin, { once: true });
  });
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
  const minimo = reducido() ? CARGA.reducida : CARGA.minimo;
  let hechos = 0;
  // El reloj del mínimo arranca cuando la pantalla SE VE, no cuando empieza
  // el trabajo. El trabajo empieza durante la marca, y contando desde ahí el
  // mínimo se comía la marca entera: la carga duraba 2,4 s de 3,6. Hasta que
  // `enPantalla()` lo ponga en marcha, no se pinta nada — una transición en
  // una sección oculta no corre, y el oro aparecería ya avanzado, de golpe.
  let t0 = null;

  /** Pinta el progreso `p`, y que el oro tarde `ms` en llegar. */
  const pintar = (p, ms = 0) => {
    el.cargaRelleno.style.transitionDuration = `${reducido() ? 0 : ms}ms`;
    el.cargaBarra.style.setProperty('--p', String(p));
    el.cargaBarra.setAttribute('aria-valuenow', String(Math.round(p * 100)));
  };
  /** Cuánto falta para el momento debido de la fracción `p` del mínimo. */
  const hastaDebido = (p) => Math.max(CARGA.oro, t0 + minimo * p - Date.now());

  el.cargaNota.textContent = '';
  pintar(0);
  const lento = setTimeout(() => {
    el.cargaNota.textContent = 'El servidor tarda en contestar…';
  }, LENTO_MS);

  return {
    /**
     * La pantalla acaba de enseñarse: arranca el reloj y pone en camino el
     * oro hacia lo que ya se hubiera hecho a oscuras. El reflujo forzado entre
     * el cero y el destino es lo que separa las dos escrituras; sin él el
     * navegador ve sólo la última y no hay nada que deslizar.
     */
    enPantalla() {
      t0 = Date.now();
      pintar(0, 0);
      void el.cargaRelleno.offsetWidth;
      if (hechos) {
        const p = hechos / pasos;
        pintar(p, hastaDebido(p));
      }
    },
    avanzar() {
      hechos = Math.min(pasos, hechos + 1);
      if (t0 === null) return;
      const p = hechos / pasos;
      pintar(p, hastaDebido(p));
    },
    async terminar() {
      clearTimeout(lento);
      el.cargaNota.textContent = '';
      if (t0 === null) this.enPantalla();
      const ms = hastaDebido(1);
      pintar(1, ms);
      // Se espera a que el oro LLEGUE, no a que se le mande: cortarlo a medio
      // camino es lo que hacía que la pantalla pareciera un parpadeo.
      await espera(reducido() ? 40 : ms);
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
