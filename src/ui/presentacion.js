// DinoWar — la presentación: quién se enfrenta a quién antes de la partida.
//
// El tablero salía de golpe con las cartas repartidas. Ahora, un momento
// antes, la pantalla se parte en diagonal: arriba el rival, abajo tú, cada
// uno con su estandarte, el emblema del clado de su mazo, la criatura que lo
// encabeza y su nombre. En la costura, el VS, el modo y a qué se juega.
//
// Lo que NO dice es quién empieza. El despliegue es simultáneo y la
// compensación del segundo jugador vale cero cartas: «Tú empiezas» sólo
// decidiría un empate absoluto, y enseñarlo como si importara sería mentir.
//
// Mientras está puesta, main.js no arranca ni el reloj ni la entrada: la
// partida empieza cuando se va. Un toque la salta. Con movimiento reducido no
// se crea, como la invocación y el rótulo del final.
//
// El arte llega aparte (assets/PROMPTS.md, «La presentación») con el mismo
// interruptor que el final: `ARTE_LISTO`, vigilado por test/presentacion.test.js.

import { reducido } from './efectos.js';

/** Si las piezas de `assets/piel/vs/` están. Lo vigila test/presentacion.test.js. */
export const ARTE_LISTO = true;

/** Lo que sale de `tools/presentacion.py`, sin extensión. */
export const PIEZAS = Object.freeze(['estandarte_propio', 'estandarte_rival']);

/** Cuánto dura si nadie la toca. */
export const PRESENTACION = 2600;
/**
 * En un duelo, menos: el reloj que manda es el del servidor y ya corre. Son
 * los dos a la vez y se come lo mismo a cada uno, pero no hay por qué alargarlo.
 */
export const PRESENTACION_DUELO = 1600;

const escapar = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * La presentación como HTML. Pura: `retrato` llega ya pintado por `arte()`,
 * que es marcado del propio juego; lo que escribe una persona —el nombre del
 * rival de un duelo— se escapa aquí.
 *
 * @param {object} o
 * @param {{nombre: string, subtitulo: string, retrato: string, emblema: string|null}} o.yo
 * @param {{nombre: string, subtitulo: string, retrato: string, emblema: string|null}} o.rival
 * @param {string} o.modo       «Solitario», «Expedición», «Asalto», «Duelo»
 * @param {string} o.objetivo   a qué se juega, en una línea
 */
export function presentacionHTML({ yo, rival, modo, objetivo }) {
  const mitad = (b, lado) => {
    const emb = /^[a-z_]+$/.test(b.emblema ?? '')
      ? `<i class="emblema emb-${b.emblema}" aria-hidden="true"></i>` : '';
    return `<div class="pres-mitad ${lado}">`
      + `<div class="pres-retrato" aria-hidden="true">${b.retrato ?? ''}</div>`
      + `<div class="pres-estandarte" aria-hidden="true">${emb}</div>`
      + `<div class="pres-nombre"><b>${escapar(b.nombre)}</b><span>${escapar(b.subtitulo)}</span></div>`
      + '</div>';
  };
  return `<div class="presentacion${ARTE_LISTO ? ' con-arte' : ''}" role="dialog" aria-label="${escapar(`${yo.nombre} contra ${rival.nombre}`)}">`
    + mitad(rival, 'rival')
    + mitad(yo, 'propio')
    + '<div class="pres-costura" aria-hidden="true"></div>'
    + `<div class="pres-centro"><span class="pres-vs">VS</span><b>${escapar(modo)}</b><small>${escapar(objetivo)}</small></div>`
    + '</div>';
}

/**
 * Pone la presentación sobre `raiz` y resuelve al quitarse: por tiempo o por
 * un toque. Si `limpiarEfectos()` la quita antes, el temporizador resuelve
 * igual: quien espera tiene que comprobar que su partida sigue siendo la vigente.
 */
export function presentarPartida({ raiz, dura = PRESENTACION, ...datos }) {
  if (!raiz || reducido()) return Promise.resolve();
  const plantilla = document.createElement('template');
  plantilla.innerHTML = presentacionHTML(datos);
  const v = plantilla.content.firstElementChild;
  v.style.setProperty('--dura', `${dura}ms`);
  raiz.appendChild(v);
  return new Promise((ok) => {
    let t = 0;
    const quitar = () => { clearTimeout(t); v.remove(); ok(); };
    t = setTimeout(quitar, dura);
    v.addEventListener('click', quitar, { once: true });
  });
}
