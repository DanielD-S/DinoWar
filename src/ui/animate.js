// DinoWar — legibilidad del combate y registro del turno.
// Todos los temporizadores se registran para poder cancelarlos en el reinicio:
// tras GAME_OVER no debe quedar ninguno vivo.

import { BALANCE } from '../data/balance.js';
import { CLADO_NOMBRE, carta } from '../data/cards.js';
import { CAUSA } from '../engine/state.js';
import { el, JUGADOR, RIVAL, render } from './render.js';
import { compasDe, seVe } from './guion.js';
import { sonido } from './audio.js';

const temporizadores = new Set();
let generacion = 0;

/** Todo lo que el guión puede dejar puesto. Si se olvida una, se queda pegada. */
const MARCAS = ['golpeada', 'destino', 'dispara', 'crece', 'merma', 'cura', 'embiste', 'muere'];

export function cancelarAnimaciones() {
  generacion += 1;
  for (const t of temporizadores) clearTimeout(t);
  temporizadores.clear();
  for (const n of document.querySelectorAll('.dano-flotante, .rotulo-rasgo, .anuncio')) n.remove();
  for (const n of document.querySelectorAll(`.${MARCAS.join(', .')}`)) n.classList.remove(...MARCAS);
  for (const n of document.querySelectorAll('.habitat.golpe, .pila.pulso')) {
    n.classList.remove('golpe', 'pulso');
  }
}

function pausa(ms) {
  const mia = generacion;
  return new Promise((resolve) => {
    const t = setTimeout(() => {
      temporizadores.delete(t);
      if (mia === generacion) resolve();
    }, ms);
    temporizadores.add(t);
  });
}

export const esperar = (ms) => pausa(ms);

/**
 * Escalona el volteo de las cartas que acaban de salir del despliegue oculto.
 * Ya se volteaban —render() les pone .entra— pero las diez a la vez, así que el
 * momento que el juego declara como su tensión central pasaba desapercibido.
 * Devuelve cuántas se van a abrir, para saber cuánto hay que esperar.
 */
export function animarRevelacion(previo, actual) {
  const yaEstaba = new Set();
  for (const fila of previo.ranuras) for (const iid of fila) if (iid !== null) yaEstaba.add(iid);

  let n = 0;
  for (const fila of actual.ranuras) {
    for (const iid of fila) {
      if (iid === null || yaEstaba.has(iid)) continue;
      const nodo = cartaNodo(iid);
      if (!nodo) continue;
      // La clase .entra ya la pone render(); aquí sólo se escalona.
      nodo.style.setProperty('--retardo', `${n * 90}ms`);
      n += 1;
    }
  }

  // La clase se quedaba puesta para siempre y el volteo se rearmaba solo más
  // tarde —basta con que el navegador reevalúe la animación— dejando cartas de
  // canto en mitad de otra cosa. Volteada una vez, se limpia.
  if (n > 0) {
    const mia = generacion;
    const t = setTimeout(() => {
      temporizadores.delete(t);
      if (mia !== generacion) return;
      for (const nodo of document.querySelectorAll('.carta--ranura.entra')) {
        nodo.classList.remove('entra');
        nodo.style.removeProperty('--retardo');
      }
    }, 400 + n * 90 + 60);
    temporizadores.add(t);
  }
  return n;
}

const ranuraNodo = (bando, r) => el.filas[bando]?.children[r] ?? null;
const cartaNodo = (iid) => document.querySelector(`.carta--ranura[data-iid="${iid}"]`);

function flotante(nodo, texto, clase = '') {
  if (!nodo) return;
  const n = document.createElement('span');
  n.className = `dano-flotante${clase ? ` ${clase}` : ''}`;
  n.textContent = texto;
  nodo.appendChild(n);
  const mia = generacion;
  const t = setTimeout(() => { temporizadores.delete(t); if (mia === generacion) n.remove(); }, 900);
  temporizadores.add(t);
}

function golpear(iid, cantidad) {
  const c = cartaNodo(iid);
  if (!c) return;
  c.classList.add('golpeada');
  flotante(c.closest('.ranura') ?? c, `−${cantidad}`);
  const mia = generacion;
  const t = setTimeout(() => { temporizadores.delete(t); if (mia === generacion) c.classList.remove('golpeada'); }, 400);
  temporizadores.add(t);
}

/**
 * Quita una clase pasado un rato, sin dejar temporizadores vivos tras reiniciar.
 */
function marcar(nodo, clase, ms) {
  if (!nodo) return;
  nodo.classList.add(clase);
  const mia = generacion;
  const t = setTimeout(() => {
    temporizadores.delete(t);
    if (mia === generacion) nodo.classList.remove(clase);
  }, ms);
  temporizadores.add(t);
}

/** El nombre del rasgo, encima de la carta que lo dispara. */
function rotulo(nodo, texto, clase = '') {
  if (!nodo || !texto) return;
  const n = document.createElement('span');
  n.className = `rotulo-rasgo${clase ? ` ${clase}` : ''}`;
  n.textContent = texto;
  (nodo.closest('.ranura') ?? nodo).appendChild(n);
  const mia = generacion;
  const t = setTimeout(() => { temporizadores.delete(t); if (mia === generacion) n.remove(); }, 1100);
  temporizadores.add(t);
}

/** Un cartel en mitad del tablero, para lo que no cuelga de ninguna carta. */
function anuncio(texto, clase = '') {
  const n = document.createElement('div');
  n.className = `anuncio${clase ? ` ${clase}` : ''}`;
  n.textContent = texto;
  el.campo.appendChild(n);
  const mia = generacion;
  const t = setTimeout(() => { temporizadores.delete(t); if (mia === generacion) n.remove(); }, 1200);
  temporizadores.add(t);
}

/** Un número flotando sobre un contador del marcador —mazo, mano, hábitat—. */
function sobreContador(nodo, texto, clase) {
  if (!nodo) return;
  marcar(nodo, 'pulso', 500);
  flotante(nodo, texto, clase);
}

const habitatNodo = (bando) => el.campo.querySelector(
  bando === JUGADOR ? '.habitat.propio' : '.habitat.rival',
);

/**
 * Lo que el guión puede tocar. Es deliberadamente corto: si para contar una
 * carta nueva hace falta algo que no está aquí, es que hace falta un gesto
 * nuevo, y un gesto nuevo se piensa una vez y lo reutilizan todas.
 */
const API = Object.freeze({
  carta: cartaNodo,
  ranura: ranuraNodo,
  contrario: (j) => (j === JUGADOR ? RIVAL : JUGADOR),
  marcar,
  rotulo,
  anuncio,
  flota: (nodo, texto, clase) => flotante(nodo?.closest('.ranura') ?? nodo, texto, clase),
  embiste: (iid) => marcar(cartaNodo(iid), 'embiste', 420),
  fulmina: (iid) => marcar(cartaNodo(iid), 'muere', 520),
  enMazo: (j, texto, clase) => sobreContador(j === JUGADOR ? el.pPila : el.rPila, texto, clase),
  enMano: (j, texto, clase) => sobreContador(j === JUGADOR ? el.pMano : el.rMano, texto, clase),
  enHabitat: (j, texto, clase) => sobreContador(habitatNodo(j), texto, clase),
});

/**
 * Toca los eventos en el orden en que los emitió el motor, cada uno con su
 * compás. Es el reemplazo del `if` por evento: `guion.js` dice qué se ve y esto
 * sólo lo lleva al ritmo.
 *
 * Los que no tienen compás se saltan SIN esperar. Importa: el motor emite
 * treinta y un tipos y la mayoría son contabilidad —RENTA, PRODUCCION,
 * RECHAZADA— que no debe costar ni un milisegundo de turno.
 */
export async function animarEventos(eventos) {
  const mia = generacion;
  for (const e of eventos) {
    if (mia !== generacion) return;
    if (!seVe(e)) continue;
    const c = compasDe(e);
    if (c.sonido) sonido(c.sonido);
    c.hacer?.(e, API);
    await pausa(c.dura);
  }
}

/**
 * Recorre el campo ranura a ranura sobre el tablero PREVIO al combate: se ve la
 * posición, se marcan los golpes, caen las bajas y baja la barra del habitat.
 */
export async function animarCombate(estadoPrevio, estadoPosterior, eventos, alTerminar) {
  const mia = generacion;
  render(estadoPrevio);
  await pausa(420);
  if (mia !== generacion) return;

  const choques = eventos.filter((e) => e.tipo === 'CHOQUE');
  const avances = eventos.filter((e) => e.tipo === 'AVANCE');
  const golpesBioma = eventos.filter((e) => e.tipo === 'HABITAT');

  for (let r = 0; r < BALANCE.ranuras; r++) {
    if (mia !== generacion) return;
    const choque = choques.find((e) => e.ranura === r);
    const avance = avances.find((e) => e.ranura === r);
    if (!choque && !avance) continue;

    if (choque) {
      golpear(choque.b, choque.danoA);
      golpear(choque.a, choque.danoB);
    } else {
      // Una ranura sin nadie enfrente: tu criatura AVANZA y le pega al hábitat
      // rival. Aquí `avance.iid` y `avance.bando` son los del ATACANTE, o sea
      // los tuyos, y durante un tiempo esta rama los trataba como si fueran los
      // de la víctima: marcaba tu propia carta como «golpeada» —la misma
      // sacudida que recibir un golpe— y le hacía flotar un «−N» encima. La
      // animación decía justo lo contrario de lo que pasaba, y quien la miraba
      // veía a su dinosaurio recibiendo el daño que estaba repartiendo.
      cartaNodo(avance.iid)?.classList.add('embiste');

      const habitat = avance.bando === JUGADOR
        ? el.campo.querySelector('.habitat.rival')
        : el.campo.querySelector('.habitat.propio');

      // Con el Ataque a 0 —una presión rival encima— la unidad avanza y no hace
      // nada. Sacudir la barra del hábitat entonces mentía: parecía que pegaba
      // y el número no se movía. Se dice que no hace daño y no se toca la barra.
      if (avance.dano > 0) {
        habitat?.classList.add('golpe');
        // El número, sobre la barra que de verdad baja.
        flotante(habitat, `−${avance.dano}`);
      } else {
        flotante(ranuraNodo(avance.bando, r), 'sin daño', 'nulo');
      }
    }
    await pausa(430);
  }

  if (mia !== generacion) return;
  for (const n of document.querySelectorAll('.golpeada')) n.classList.remove('golpeada');
  for (const n of document.querySelectorAll('.embiste')) n.classList.remove('embiste');

  const muertes = eventos.filter((e) => e.tipo === 'MUERTE');
  if (muertes.length > 0) {
    for (const m of muertes) cartaNodo(m.iid)?.classList.add('muere');
    await pausa(400);
    if (mia !== generacion) return;
  }

  render(estadoPosterior);
  for (const n of document.querySelectorAll('.habitat.golpe')) n.classList.remove('golpe');
  if (golpesBioma.length > 0) await pausa(320);
  if (mia !== generacion) return;
  alTerminar?.();
}

// -------------------------------------------------------------------- log

const bando = (j) => (j === JUGADOR ? 'Tu bando' : 'El rival');
const clase = (j) => (j === JUGADOR ? 'propio' : 'rival');

const CAUSA_TEXTO = {
  [CAUSA.COMBATE]: 'en combate',
  [CAUSA.ESPINAS]: 'por las púas caudales',
  [CAUSA.MORTANDAD]: 'en la mortandad',
};

export function lineasDeLog(eventos) {
  const salida = [];
  const push = (texto, j = null) => salida.push({ texto, clase: j === null ? '' : clase(j) });

  for (const e of eventos) {
    switch (e.tipo) {
      case 'RENTA':
        push(`Ambos cobráis <b>${e.biomasa}</b> de Biomasa`);
        break;
      case 'CAMPO':
        push(`<b>${bando(e.jugador)}</b> impone el clima <b>${carta(e.cardId).binomial}</b>`, e.jugador);
        break;
      case 'RECURSO':
        push(`<b>${bando(e.jugador)}</b> juega <b>${carta(e.cardId).binomial}</b> y sube a ${e.biomasa} de Biomasa`, e.jugador);
        break;
      case 'REVELADA':
        push(`<b>${bando(e.jugador)}</b> despliega <i>${carta(e.cardId).binomial}</i> en la ranura ${e.ranura + 1}`, e.jugador);
        break;
      case 'MOVIDA':
        push(`<b>${bando(e.jugador)}</b> mueve <i>${carta(e.cardId).binomial}</i> de la ranura ${e.desde + 1} a la ${e.hasta + 1}`, e.jugador);
        break;
      case 'ADAPTACION':
        push(`<b>${bando(e.jugador)}</b> aplica <b>${carta(e.cardId).rasgoNombre}</b> a <i>${carta(e.objetivoCardId).binomial}</i>`, e.jugador);
        break;
      case 'PRESION':
        push(`<b>${bando(e.jugador)}</b> aplica <b>${carta(e.cardId).rasgoNombre}</b>`
          + (e.objetivoCardId ? ` sobre <i>${carta(e.objetivoCardId).binomial}</i>` : '')
          + (e.clado ? ` a los ${CLADO_NOMBRE[e.clado].toLowerCase()}s rivales` : '')
          + (e.afectados && !e.objetivoCardId && !e.clado
            ? ` sobre ${e.afectados} rival${e.afectados === 1 ? '' : 'es'}` : ''), e.jugador);
        break;
      case 'CHOQUE':
        push(`Ranura ${e.ranura + 1}: chocan y se hacen <b>${e.danoA}</b> y <b>${e.danoB}</b> de daño`);
        break;
      case 'AVANCE':
        push(`Ranura ${e.ranura + 1} sin defensa: <b>${e.dano}</b> al hábitat`, e.bando);
        break;
      case 'ENTRADA': {
        // Un efecto sin renglón aquí sale como «hace su efecto», que es mentira
        // a medias: el jugador ve que pasó algo y no qué. Cada entrada nueva
        // necesita su frase.
        const q = {
          roba: `roba ${e.n} carta${e.n === 1 ? '' : 's'}`,
          emboscada: e.n > 0 ? `embosca: <b>${e.n}</b> de daño al de enfrente` : 'embosca, pero no hay nadie enfrente',
          muele: `el rival pierde <b>${e.n}</b> del mazo`,
          muelePropio: `tú pierdes <b>${e.n}</b> del mazo`,
          manoRival: e.n > 0 ? `al rival se le cae <b>${e.n}</b> de la mano` : 'le buscaría la mano, pero está vacía',
          curaHabitat: e.n > 0 ? `tu hábitat recupera <b>${e.n}</b>` : 'tu hábitat ya estaba entero',
          fulmina: e.objetivoCardId
            ? `se lleva por delante a <i>${carta(e.objetivoCardId).binomial}</i>`
            : 'busca a quién llevarse y no lo encuentra',
        }[e.efecto] ?? 'hace su efecto';
        push(`<i>${carta(e.cardId).binomial}</i> entra en juego: ${q}`, e.dueno);
        break;
      }
      case 'UMBRAL':
        push(`<i>${carta(e.cardId).binomial}</i> completa su grupo:`
          + ` <b>+${e.ataque}</b> de Ataque para siempre`, e.dueno);
        break;
      case 'COSTE_EXTRA':
        push(`<b>${bando(e.jugador)}</b> descarta ${e.cartas} cartas para jugar`
          + ` <i>${carta(e.cardId).binomial}</i>`, e.jugador);
        break;
      case 'MUERTE':
        push(`Muere <i>${carta(e.cardId).binomial}</i> de <b>${e.dueno === JUGADOR ? 'los tuyos' : 'el rival'}</b> ${CAUSA_TEXTO[e.causa] ?? ''}`, e.dueno);
        break;
      case 'OPORTUNISTA':
        push(`<i>Ornitholestes</i> carroñea: +${e.vida} de Vida`, e.dueno);
        break;
      case 'CURACION':
        push(`Se cura ${e.cura} de herida`, e.dueno);
        break;
      case 'HABITAT':
        push(`El hábitat ${e.bando === JUGADOR ? 'tuyo' : 'rival'} baja a <b>${Math.max(0, e.restante)}</b>`, e.bando);
        break;
      case 'SIN_CARTAS':
        push(`<b>${bando(e.jugador)}</b> se queda sin cartas`, e.jugador);
        break;
      case 'DESCARTE':
        push(`<b>${bando(e.jugador)}</b> descarta por límite de mano`, e.jugador);
        break;
      default:
        break;
    }
  }
  return salida;
}
