// DinoWar — legibilidad del combate y registro del turno.
// Todos los temporizadores se registran para poder cancelarlos en el reinicio:
// tras GAME_OVER no debe quedar ninguno vivo.

import { BALANCE } from '../data/balance.js';
import { CLADO_NOMBRE, carta } from '../data/cards.js';
import { CAUSA } from '../engine/state.js';
import { el, JUGADOR, render } from './render.js';

const temporizadores = new Set();
let generacion = 0;

export function cancelarAnimaciones() {
  generacion += 1;
  for (const t of temporizadores) clearTimeout(t);
  temporizadores.clear();
  for (const n of document.querySelectorAll('.dano-flotante')) n.remove();
  for (const n of document.querySelectorAll('.golpeada, .destino')) n.classList.remove('golpeada', 'destino');
  for (const n of document.querySelectorAll('.habitat.golpe')) n.classList.remove('golpe');
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
      const c = cartaNodo(avance.iid);
      c?.classList.add('golpeada');
      // Con el Ataque a 0 —una presión rival encima— la unidad avanza y no hace
      // nada. Sacudir la barra del hábitat entonces mentía: parecía que pegaba
      // y el número no se movía. Se dice que no hace daño y no se toca la barra.
      if (avance.dano > 0) {
        const habitat = avance.bando === JUGADOR ? el.campo.querySelector('.habitat.rival') : el.campo.querySelector('.habitat.propio');
        habitat?.classList.add('golpe');
      }
      if (avance.dano > 0) flotante(ranuraNodo(avance.bando, r), `−${avance.dano}`);
      else flotante(ranuraNodo(avance.bando, r), 'sin daño', 'nulo');
    }
    await pausa(430);
  }

  if (mia !== generacion) return;
  for (const n of document.querySelectorAll('.golpeada')) n.classList.remove('golpeada');

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
  [CAUSA.SEQUIA]: 'de sed',
  [CAUSA.MORTANDAD]: 'en la mortandad',
};

export function lineasDeLog(eventos) {
  const salida = [];
  const push = (texto, j = null) => salida.push({ texto, clase: j === null ? '' : clase(j) });

  for (const e of eventos) {
    switch (e.tipo) {
      case 'ESTACION':
        push(`<b>Estación:</b> ${e.estacion === 'SEQUIA' ? 'Sequía estacional' : 'Crecida monzónica'}`);
        break;
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
          + (e.clado ? ` a los ${CLADO_NOMBRE[e.clado].toLowerCase()}s rivales` : ''), e.jugador);
        break;
      case 'CHOQUE':
        push(`Ranura ${e.ranura + 1}: chocan y se hacen <b>${e.danoA}</b> y <b>${e.danoB}</b> de daño`);
        break;
      case 'AVANCE':
        push(`Ranura ${e.ranura + 1} sin defensa: <b>${e.dano}</b> al hábitat`, e.bando);
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
