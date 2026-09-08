// Legibilidad de la revelación (H5) y registro del turno.
// Todos los temporizadores se registran para poder cancelarlos en el reinicio:
// tras GAME_OVER no debe quedar ninguno vivo (criterio de aceptación 4).

import { BALANCE } from '../data/balance.js';
import { carta } from '../data/cards.js';
import { CAUSA_MUERTE } from '../engine/state.js';
import { el, JUGADOR, render, mostrarZona, zonaEnFoco } from './render.js';

const temporizadores = new Set();
let generacion = 0;

export function cancelarAnimaciones() {
  generacion += 1;
  for (const t of temporizadores) clearTimeout(t);
  temporizadores.clear();
  el.playmat?.classList.remove('resolviendo', 'gana-propio', 'gana-rival', 'destino');
  for (const b of el.botonesZona ?? []) b.classList.remove('destino');
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

const nombreZona = (id) => BALANCE.zonas[id - 1].nombre;

const CAUSA_TEXTO = {
  [CAUSA_MUERTE.COMBATE]: 'baja de combate',
  [CAUSA_MUERTE.DEPREDADOR_DOMINANTE]: 'Depredador dominante',
  [CAUSA_MUERTE.TAGOMIZADOR]: 'Tagomizador',
  [CAUSA_MUERTE.SEQUIA]: 'sequía',
};

const enMat = (iid) => el.playmat.querySelector(`[data-clave="u${iid}"]`);

/**
 * Pasea la cámara por las zonas disputadas, una a una, sobre el tablero PREVIO
 * a la resolución: se ve la posición, se subrayan los Poderes, se marca quién
 * gana y caen las bajas. Termina repintando el estado posterior.
 */
export async function animarResolucion(estadoPrevio, estadoPosterior, eventos, alTerminar) {
  const mia = generacion;
  const zonaOriginal = zonaEnFoco();
  // Una zona en la que no hay nadie no tiene nada que enseñar.
  const resueltas = eventos.filter((e) => e.tipo === 'ZONA_RESUELTA' && (e.poder[0] > 0 || e.poder[1] > 0));

  for (const ev of resueltas) {
    if (mia !== generacion) return;

    mostrarZona(ev.zona);
    render(estadoPrevio);
    await pausa(340);
    if (mia !== generacion) return;

    const poderes = [...el.playmat.querySelectorAll('.mat-poder')];
    for (const p of poderes) p.classList.add('sube');
    await pausa(280);
    if (mia !== generacion) return;
    for (const p of poderes) p.classList.remove('sube');

    if (ev.dominador === JUGADOR) el.playmat.classList.add('gana-propio');
    else if (ev.dominador !== null) el.playmat.classList.add('gana-rival');

    for (const s of eventos.filter((e) => e.tipo === 'MASA_COLOSAL' && e.zona === ev.zona)) {
      enMat(s.iid)?.classList.add('salvada');
    }

    const muertes = eventos.filter((e) => e.tipo === 'MUERTE' && e.zona === ev.zona);
    await pausa(muertes.length > 0 ? 220 : 260);
    if (mia !== generacion) return;

    if (muertes.length > 0) {
      for (const m of muertes) enMat(m.iid)?.classList.add('muere');
      await pausa(380);
      if (mia !== generacion) return;
    }

    el.playmat.classList.remove('gana-propio', 'gana-rival');
  }

  if (mia !== generacion) return;
  mostrarZona(zonaOriginal);
  render(estadoPosterior);
  await pausa(260);
  if (mia !== generacion) return;
  alTerminar?.();
}

export async function esperar(ms) {
  await pausa(ms);
}

// -------------------------------------------------------------------- log

// Tercera persona para los dos bandos: así el verbo concuerda sin ramificar.
const bando = (j) => (j === JUGADOR ? 'Tu bando' : 'El rival');
const clase = (j) => (j === JUGADOR ? 'propio' : 'rival');

/** Convierte los eventos del turno en líneas legibles. */
export function lineasDeLog(eventos) {
  const salida = [];
  const push = (texto, j = null) => salida.push({ texto, clase: j === null ? '' : clase(j) });

  for (const e of eventos) {
    switch (e.tipo) {
      case 'ESTACION':
        push(`<b>Estación:</b> ${e.estacion === 'SEQUIA' ? 'Sequía estacional' : 'Crecida monzónica'}`);
        break;
      case 'SEQUIA_PAGADA':
        push(`<b>${bando(e.jugador)}</b> paga ${e.agua} de Agua por la sequía` +
          (e.sacrificios ? ` y sacrifica ${e.sacrificios} unidad${e.sacrificios === 1 ? '' : 'es'}` : ''), e.jugador);
        break;
      case 'PRODUCCION': {
        const partes = [];
        if (e.biomasa) partes.push(`${e.biomasa} Biomasa`);
        if (e.agua) partes.push(`${e.agua} Agua`);
        if (e.territorio) partes.push(`${e.territorio} Territorio`);
        push(`<b>${bando(e.jugador)}</b> produce ${partes.join(', ') || 'nada'}` +
          (e.suelo ? ' <i>(suelo de ingreso)</i>' : ''), e.jugador);
        break;
      }
      case 'REVELADA':
        push(`<b>${bando(e.jugador)}</b> despliega <i>${carta(e.cardId).binomial}</i> en ${nombreZona(e.zona)}`, e.jugador);
        break;
      case 'REUBICADA':
        push(`<b>${bando(e.jugador)}</b> migra <i>${carta(e.cardId).binomial}</i> de ${nombreZona(e.desde)} a ${nombreZona(e.hasta)}`, e.jugador);
        break;
      case 'ADAPTACION':
        push(`<b>${bando(e.jugador)}</b> juega <b>${carta(e.cardId).rasgoNombre}</b> sobre <i>${carta(e.objetivoCardId).binomial}</i>`, e.jugador);
        break;
      case 'ZONA_RESUELTA': {
        const [p0, p1] = e.poder;
        const veredicto = e.dominador === null ? 'empate, zona neutral'
          : e.dominador === JUGADOR ? 'la dominas tú' : 'la domina el rival';
        push(`<b>${nombreZona(e.zona)}</b> — tú ${p0} · rival ${p1} → ${veredicto}`);
        break;
      }
      case 'MASA_COLOSAL':
        push(`<i>${carta(e.cardId).binomial}</i> aguanta la baja (Masa colosal)`, e.dueno);
        break;
      case 'MUERTE':
        push(`${e.extinta ? 'Se extingue' : 'Muere'} <i>${carta(e.cardId).binomial}</i> de `
          + `<b>${e.dueno === JUGADOR ? 'los tuyos' : 'el rival'}</b> — ${CAUSA_TEXTO[e.causa] ?? e.causa}`
          + (e.extinta ? ' · fuera del juego' : ''), e.dueno);
        break;
      case 'OPORTUNISTA':
        push(`<i>Ornitholestes</i> carroñea: +${e.biomasa} Biomasa`, e.jugador);
        break;
      case 'CRECIMIENTO':
        push(`<i>${carta(e.cardId).binomial}</i> sobrevive y gana +2 de Poder permanente`, e.dueno);
        break;
      case 'REBARAJADO':
        push(`<b>${bando(e.jugador)}</b> baraja el descarte: ${e.cartas} cartas`, e.jugador);
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
