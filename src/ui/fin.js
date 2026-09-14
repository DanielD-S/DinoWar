// DinoWar — el final de una partida: el rótulo sobre el tablero y el marcador.
//
// Dos piezas. `rotularFin()` pone VICTORIA o DERROTA encima del tablero
// congelado: el tablero es lo que acaba de pasar, y cambiar de pantalla en el
// acto se lo llevaba antes de que se leyera. `marcadorHTML()` pinta el cara a
// cara de la pantalla de fin: los dos bandos, sus cifras en rombos y el mazo
// del que perdió, rasgado.
//
// Lo que se cobra y se anota sigue en main.js y NO espera al rótulo: el
// servidor empieza a re-jugar la partida mientras se lee.
//
// El arte llega aparte —assets/PROMPTS.md, «El final de la partida»— y hasta
// que está todo se pinta con CSS. `ARTE_LISTO` es el interruptor, y no una
// precarga que mire qué ficheros contestan: eso dejaría ocho 404 en la consola
// de cada partida mientras el arte no exista. `test/fin.test.js` obliga a
// encenderlo cuando las piezas lleguen y a apagarlo si falta alguna, así que
// no hay que acordarse. Y es todo o nada: medio marcador de latón junto a un
// estandarte de CSS se vería peor que cualquiera de los dos enteros.

import { reducido } from './efectos.js';

/** Si las piezas de `assets/piel/fin/` están. Lo vigila test/fin.test.js. */
export const ARTE_LISTO = true;

/** Lo que salen de `tools/fin.py`, sin extensión. */
export const PIEZAS = Object.freeze([
  'estandarte', 'sello_victoria', 'sello_derrota', 'rombo',
  'medallon_vs', 'cinta_propia', 'cinta_rival', 'fondo_fin',
]);

/** Cuánto está el rótulo encima del tablero si nadie lo toca. */
export const ROTULO = 1900;

const escapar = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const arte = () => (ARTE_LISTO ? ' con-arte' : '');

/**
 * VICTORIA o DERROTA sobre el tablero. Resuelve al quitarse: por tiempo o
 * porque el jugador toca, que quien ya lo ha leído no tiene por qué esperar.
 * Con `prefers-reduced-motion` no se enseña, como la invocación.
 *
 * Si `limpiarEfectos()` lo quita antes —se empezó otra partida—, el
 * temporizador resuelve igual; quien espera tiene que comprobar que su final
 * sigue siendo el vigente.
 */
export function rotularFin({ gane, raiz }) {
  if (!raiz || reducido()) return Promise.resolve();
  const v = document.createElement('div');
  v.className = `fin-rotulo ${gane ? 'gana' : 'pierde'}${arte()}`;
  v.style.setProperty('--rotulo', `${ROTULO}ms`);
  v.setAttribute('role', 'status');
  v.innerHTML = '<div class="fin-rotulo-pieza"><i class="fin-rotulo-sello" aria-hidden="true"></i>'
    + `<div class="fin-rotulo-tela"><b>${gane ? 'Victoria' : 'Derrota'}</b></div></div>`;
  raiz.appendChild(v);
  return new Promise((ok) => {
    let t = 0;
    const quitar = () => { clearTimeout(t); v.remove(); ok(); };
    t = setTimeout(quitar, ROTULO);
    v.addEventListener('click', quitar, { once: true });
  });
}

/**
 * El cara a cara de la pantalla de fin. Puro: recibe cifras, devuelve HTML.
 *
 * @param {object} o
 * @param {boolean} o.gane
 * @param {number} o.turnos
 * @param {{nombre: string, emblema: string|null, trofeos: number, habitat: number}} o.yo
 * @param {{nombre: string, emblema: string|null, trofeos: number, habitat: number}} o.rival
 */
export function marcadorHTML({ gane, turnos, yo, rival }) {
  // El nombre del rival de un duelo lo escribió otra persona: se escapa.
  // El emblema es una clave de clase y sólo puede ser eso.
  const bando = (b, lado) => {
    const emb = /^[a-z_]+$/.test(b.emblema ?? '')
      ? `<i class="emblema emb-${b.emblema}" aria-hidden="true"></i>` : '';
    return `<div class="marcador-bando ${lado}">${emb}<b>${escapar(b.nombre)}</b></div>`;
  };
  const mazo = (lado, vence) => `<div class="marcador-mazo ${lado} ${vence ? 'vence' : 'cae'}">`
    + '<span class="marcador-dorso" aria-hidden="true"><i></i><i></i></span>'
    + `${vence ? '<i class="marcador-sello" aria-hidden="true"></i>' : ''}</div>`;
  const cifra = (n) => Math.max(0, Number(n) || 0);
  const fila = (etiqueta, a, b) => {
    const [x, y] = [cifra(a), cifra(b)];
    return `<span class="rombo${x > y ? ' mejor' : ''}">${x}</span>`
      + `<small>${etiqueta}</small>`
      + `<span class="rombo${y > x ? ' mejor' : ''}">${y}</span>`;
  };
  const n = cifra(turnos);
  return `<div class="marcador${arte()}">`
    + `<div class="marcador-cinta">${bando(yo, 'propio')}<span class="marcador-vs">VS</span>${bando(rival, 'rival')}</div>`
    + `<div class="marcador-cuerpo">${mazo('propio', gane)}`
    + `<div class="marcador-cifras">${fila('Trofeos', yo.trofeos, rival.trofeos)}${fila('Hábitat', yo.habitat, rival.habitat)}</div>`
    + `${mazo('rival', !gane)}</div>`
    + `<p class="marcador-turnos">${n} ${n === 1 ? 'turno' : 'turnos'}</p>`
    + '</div>';
}
