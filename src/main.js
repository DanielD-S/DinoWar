// DinoWar — arranque, máquina de estados y pegamento entre motor e interfaz.
// La interfaz sólo LEE el estado; toda mutación pasa por reduce().

import { BALANCE } from './data/balance.js';
import { TIPO, OBJETIVO, CLADO, CLADO_NOMBRE, carta } from './data/cards.js';
import { crearPartida, vistaDe, FASE, MOTIVO_FIN, unidadesDe } from './engine/state.js';
import { reduce, ACCION, legales, validar } from './engine/actions.js';
import { decidir, PERFIL } from './engine/ai.js';
import { semilla } from './engine/rng.js';
import {
  montar, render, mensaje, el, JUGADOR, RIVAL,
  fichaHTML, fichaEstacionHTML, ayudaHTML, abrirFicha, cerrarHojas,
} from './ui/render.js';
import { tomarEntrada, soltarEntrada } from './ui/input.js';
import { animarCombate, cancelarAnimaciones, esperar, lineasDeLog } from './ui/animate.js';
import { desbloquear, alternarMute, estaSilenciado, sonido, cerrarAudio } from './ui/audio.js';

const APP = Object.freeze({
  BOOT: 'BOOT', MENU: 'MENU', PLAYING: 'PLAYING', RESOLVING: 'RESOLVING', GAME_OVER: 'GAME_OVER',
});

const params = new URLSearchParams(location.search);
const DEBUG = params.get('debug') === '1';
const PERFIL_IA = params.get('ia') ?? PERFIL.HEURISTICA;

let app = APP.BOOT;
let estado = null;
let rngIA = 0;
let registro = [];
let rafDebug = 0;

const CLAVE_RECORD = 'dinowar.record';

// ------------------------------------------------------------- persistencia

function leerRecord() {
  try { const c = localStorage.getItem(CLAVE_RECORD); return c ? JSON.parse(c) : null; } catch { return null; }
}
function guardarRecord(r) {
  try { localStorage.setItem(CLAVE_RECORD, JSON.stringify(r)); } catch { /* sin persistencia */ }
}
function pintarRecord() {
  const r = leerRecord();
  if (!r) { el.record.textContent = ''; return; }
  const partes = [`${r.victorias} de ${r.partidas} partidas ganadas`];
  if (r.mejorTurnos) partes.push(`mejor victoria en ${r.mejorTurnos} turnos`);
  el.record.textContent = partes.join(' · ');
}
function anotarResultado(gane, turnos) {
  const r = leerRecord() ?? { partidas: 0, victorias: 0, mejorTurnos: null };
  r.partidas += 1;
  if (gane) {
    r.victorias += 1;
    if (!r.mejorTurnos || turnos < r.mejorTurnos) r.mejorTurnos = turnos;
  }
  guardarRecord(r);
}

// ------------------------------------------------------------------ máquina

function irA(nuevo) {
  app = nuevo;
  el.menu.classList.toggle('oculta', nuevo !== APP.MENU);
  el.partida.classList.toggle('oculta', nuevo !== APP.PLAYING && nuevo !== APP.RESOLVING);
  el.fin.classList.toggle('oculta', nuevo !== APP.GAME_OVER);
}

const interactivo = () => app === APP.PLAYING && estado?.fase === FASE.DESPLIEGUE;

function aplicar(accion) {
  const motivo = validar(estado, accion);
  if (motivo) { mensaje(motivo, true); sonido('error'); return false; }
  estado = reduce(estado, accion);
  render(estado);
  sonido('carta');
  return true;
}

// ------------------------------------------------------- arrastrar y soltar

/** ¿Esta carta admite este destino? Sólo para resaltar mientras se arrastra. */
function admite(cardId, destino) {
  if (!destino) return false;
  const c = carta(cardId);

  if (c.tipo === TIPO.DINOSAURIO) {
    return destino.tipo === 'ranura' && destino.bando === JUGADOR && destino.libre;
  }
  if (c.tipo === TIPO.CLIMA) return destino.tipo === 'franja';
  if (c.tipo === TIPO.RECURSO) return true;   // se sueltan en cualquier parte del campo
  if (c.objetivo === OBJETIVO.PROPIO) return destino.tipo === 'unidad' && destino.propia;
  if (c.objetivo === OBJETIVO.RIVAL) return destino.tipo === 'unidad' && !destino.propia;
  return true;   // los que afectan al campo entero
}

function soltar(iid, cardId, destino) {
  const c = carta(cardId);

  if (!admite(cardId, destino)) {
    const pista = c.tipo === TIPO.DINOSAURIO ? 'Suelta los dinosaurios en una de tus ranuras libres.'
      : c.tipo === TIPO.CLIMA ? 'Las cartas de clima van a la franja del centro.'
        : c.tipo === TIPO.RECURSO ? 'Las cartas de recurso se sueltan en cualquier parte del campo.'
          : c.objetivo === OBJETIVO.PROPIO ? 'Este evento se suelta sobre un dinosaurio tuyo.'
            : c.objetivo === OBJETIVO.RIVAL ? 'Este evento se suelta sobre un dinosaurio del rival.'
              : 'Suéltala sobre el campo.';
    mensaje(pista, true);
    sonido('error');
    return;
  }

  if (c.tipo === TIPO.DINOSAURIO) {
    if (aplicar({ tipo: ACCION.DESPLEGAR, jugador: JUGADOR, iid, ranura: destino.ranura })) {
      mensaje(`${c.binomial} queda boca abajo en la ranura ${destino.ranura + 1}.`);
    }
    return;
  }
  if (c.tipo === TIPO.RECURSO) {
    const antes = estado.jugadores[JUGADOR].biomasa;
    if (aplicar({ tipo: ACCION.RECURSO, jugador: JUGADOR, iid })) {
      mensaje(`${c.binomial}: Biomasa de ${antes} a ${estado.jugadores[JUGADOR].biomasa}. El rival lo ha visto.`);
    }
    return;
  }
  if (c.tipo === TIPO.CLIMA) {
    if (aplicar({ tipo: ACCION.CLIMA, jugador: JUGADOR, iid })) mensaje(`${c.binomial} preparada.`);
    return;
  }
  if (c.objetivo === OBJETIVO.CLADO) { pedirClado(iid, c); return; }

  const objetivo = c.objetivo === OBJETIVO.CAMPO ? undefined : destino.iid;
  if (aplicar({ tipo: ACCION.EVENTO, jugador: JUGADOR, iid, objetivo })) {
    mensaje(`${c.rasgoNombre} preparado.`);
  }
}

function pedirClado(iid, c) {
  el.eleccionTitulo.textContent = c.binomial;
  el.eleccionTexto.textContent = 'Elige a qué clado rival le aprieta la competencia.';
  el.eleccionCuerpo.innerHTML = Object.values(CLADO).map((clado) => {
    const n = unidadesDe(estado, RIVAL).filter((u) => carta(u.cardId).clado === clado).length;
    return `<button class="opcion" data-clado="${clado}">${CLADO_NOMBRE[clado]}
      <small>${n} en el campo rival</small></button>`;
  }).join('');
  el.eleccion.classList.remove('oculta');

  el.eleccionCuerpo.onclick = (e) => {
    const b = e.target.closest('[data-clado]');
    if (!b) return;
    el.eleccion.classList.add('oculta');
    el.eleccionCuerpo.onclick = null;
    if (aplicar({ tipo: ACCION.EVENTO, jugador: JUGADOR, iid, clado: b.dataset.clado })) {
      mensaje(`Competencia sobre los ${CLADO_NOMBRE[b.dataset.clado].toLowerCase()}s.`);
    }
  };
}

// -------------------------------------------------------------- turno y bucle

function turnoDelJugador() {
  irA(APP.PLAYING);
  render(estado);
  el.btnListo.disabled = false;
  const puede = legales(estado, JUGADOR).some((a) => a.tipo !== ACCION.PASAR);
  mensaje(puede
    ? 'Arrastra cartas al campo. Mantén pulsada una para ver su ficha.'
    : `Sin Biomasa suficiente (${estado.jugadores[JUGADOR].biomasa}). Pulsa Listo.`);
}

function jugarIA() {
  let guardia = 0;
  while (!estado.jugadores[RIVAL].listo && guardia++ < 80) {
    const d = decidir(vistaDe(estado, RIVAL), RIVAL, rngIA, PERFIL_IA);
    rngIA = d.rng;
    if (!d.accion) break;
    estado = reduce(estado, d.accion);
  }
  if (!estado.jugadores[RIVAL].listo) estado = reduce(estado, { tipo: ACCION.PASAR, jugador: RIVAL });
}

async function alPulsarListo() {
  if (!interactivo()) return;
  desbloquear();
  el.btnListo.disabled = true;
  cerrarHojas();
  estado = reduce(estado, { tipo: ACCION.PASAR, jugador: JUGADOR });
  jugarIA();
  await bucle();
}

async function bucle() {
  let guardia = 0;
  while (guardia++ < 400) {
    if (estado.fase === FASE.FIN) return finPartida();
    if (estado.fase === FASE.DESPLIEGUE) return turnoDelJugador();

    if (estado.fase === FASE.DESCARTE) {
      if (estado.jugadores[RIVAL].mano.length > BALANCE.manoMaxima) {
        const d = decidir(vistaDe(estado, RIVAL), RIVAL, rngIA, PERFIL_IA);
        rngIA = d.rng;
        estado = reduce(estado, d.accion);
        continue;
      }
      render(estado);
      return pedirDescarte();
    }

    if (estado.fase === FASE.REVELACION) {
      irA(APP.RESOLVING);
      estado = reduce(estado, { tipo: ACCION.AVANZAR });
      render(estado);
      mensaje('Revelación simultánea…');
      sonido('revelar');
      await esperar(700);
      continue;
    }

    if (estado.fase === FASE.COMBATE) {
      irA(APP.RESOLVING);
      const previo = estado;
      const desde = estado.eventos.length;
      estado = reduce(estado, { tipo: ACCION.AVANZAR });
      const nuevos = estado.eventos.slice(desde);
      mensaje('Combate…');
      if (nuevos.some((e) => e.tipo === 'MUERTE')) sonido('muerte');
      await new Promise((r) => animarCombate(previo, estado, nuevos, r));
      continue;
    }

    if (estado.fase === FASE.CHEQUEO) archivarLog();

    estado = reduce(estado, { tipo: ACCION.AVANZAR });
    render(estado);
  }
  throw new Error('el bucle de partida no converge');
}

function archivarLog() {
  const lineas = lineasDeLog(estado.eventos);
  if (lineas.length) registro.push({ turno: estado.turno, lineas });
  if (registro.length > 12) registro.shift();
}

function pedirDescarte() {
  const jug = estado.jugadores[JUGADOR];
  el.eleccionTitulo.textContent = 'Límite de mano';
  el.eleccionTexto.textContent = `Tienes ${jug.mano.length} cartas y el máximo es ${BALANCE.manoMaxima}. Descarta una.`;
  el.eleccionCuerpo.innerHTML = jug.mano.map((iid) => {
    const c = carta(estado.instancias[iid].cardId);
    const dino = c.tipo === TIPO.DINOSAURIO;
    return `<button class="opcion" data-iid="${iid}">${dino ? `<i>${c.binomial}</i>` : c.binomial}
      <small>coste ${c.coste}${dino ? ` · ${c.poder} de Poder · ${c.vida} de Vida` : ''}</small></button>`;
  }).join('');
  el.eleccion.classList.remove('oculta');

  el.eleccionCuerpo.onclick = async (e) => {
    const b = e.target.closest('[data-iid]');
    if (!b) return;
    el.eleccion.classList.add('oculta');
    el.eleccionCuerpo.onclick = null;
    estado = reduce(estado, { tipo: ACCION.DESCARTAR, jugador: JUGADOR, iid: Number(b.dataset.iid) });
    render(estado);
    await bucle();
  };
}

function abrirLog() {
  archivarLog();
  const bloques = registro.slice().reverse();
  el.logCuerpo.innerHTML = bloques.length === 0
    ? '<p class="ficha-nota">Todavía no ha pasado nada.</p>'
    : bloques.map((b) => `<div class="log-turno">Turno ${b.turno}</div>`
      + b.lineas.map((l) => `<div class="log-linea ${l.clase}">${l.texto}</div>`).join('')).join('');
  el.log.classList.remove('oculta');
}

// --------------------------------------------------------------------- fin

function finPartida() {
  irA(APP.GAME_OVER);
  soltarEntrada();
  cancelarAnimaciones();

  const gane = estado.ganador === JUGADOR;
  const [p, r] = estado.jugadores;
  el.finTitulo.textContent = gane ? 'Tu población domina' : 'Tu población se extingue';
  el.finTitulo.style.color = gane ? 'var(--propio)' : 'var(--rival)';

  const motivo = {
    [MOTIVO_FIN.TROFEOS]: 'por registro fósil',
    [MOTIVO_FIN.HABITAT]: 'por colapso del habitat',
    [MOTIVO_FIN.EXTINCION]: 'por extinción: alguien se quedó sin cartas',
    [MOTIVO_FIN.LIMITE_TURNOS]: 'por límite de turnos',
  }[estado.motivoFin] ?? '';

  el.finDetalle.innerHTML = `${motivo}<br>Trofeos <b>${p.trofeos}</b> – <b>${r.trofeos}</b>`
    + ` · Hábitat <b>${Math.max(0, p.habitat)}</b> – <b>${Math.max(0, r.habitat)}</b><br>${estado.turno} turnos`;

  anotarResultado(gane, estado.turno);
  sonido(gane ? 'gana' : 'pierde');
}

// ------------------------------------------------------------------ arranque

function nuevaPartida() {
  cancelarAnimaciones();
  soltarEntrada();
  registro = [];

  const s = Number(params.get('seed')) || (Date.now() & 0x7fffffff);
  estado = crearPartida(s);
  rngIA = semilla(s ^ 0x5bf03635);

  irA(APP.PLAYING);
  render(estado);
  tomarEntrada({
    interactivo,
    admite,
    soltar,
    ficha: (cardId) => abrirFicha(fichaHTML(cardId)),
  });
  bucle();
}

function pintarDebug() {
  if (!DEBUG || !estado) return;
  el.debug.textContent = [
    `app   ${app}`,
    `fase  ${estado.fase}  turno ${estado.turno}`,
    `IA    ${PERFIL_IA} · mano ${estado.jugadores[RIVAL].mano.length}`,
    `trof  tú ${estado.jugadores[0].trofeos} · rival ${estado.jugadores[1].trofeos}`,
    `habitat tú ${estado.jugadores[0].habitat} · rival ${estado.jugadores[1].habitat}`,
    `seed  ${estado.seed}`,
  ].join('\n');
}

function bucleDebug() {
  pintarDebug();
  rafDebug = requestAnimationFrame(bucleDebug);
}

function iniciar() {
  montar();
  pintarRecord();
  irA(APP.MENU);

  el.btnJugar.addEventListener('click', () => { desbloquear(); nuevaPartida(); });
  el.btnOtra.addEventListener('click', () => { pintarRecord(); nuevaPartida(); });
  el.btnListo.addEventListener('click', alPulsarListo);
  el.btnLog.addEventListener('click', abrirLog);
  el.logCerrar.addEventListener('click', cerrarHojas);
  el.fichaCerrar.addEventListener('click', cerrarHojas);
  el.ayudaCerrar.addEventListener('click', cerrarHojas);
  el.eleccionCerrar.addEventListener('click', () => {
    // Cancelar sólo es legal cuando la elección no bloquea el turno.
    if (estado?.fase !== FASE.DESCARTE) { el.eleccion.classList.add('oculta'); el.eleccionCuerpo.onclick = null; }
  });

  const abrirAyuda = () => { el.ayudaCuerpo.innerHTML = ayudaHTML(); el.ayuda.classList.remove('oculta'); };
  el.btnAyuda.addEventListener('click', abrirAyuda);
  el.btnAyudaMenu.addEventListener('click', abrirAyuda);

  el.estacion.addEventListener('click', () => {
    if (estado?.estacion.actual) abrirFicha(fichaEstacionHTML(estado.estacion.actual));
  });

  el.btnMute.classList.toggle('off', estaSilenciado());
  el.btnMute.addEventListener('click', () => {
    desbloquear();
    el.btnMute.classList.toggle('off', alternarMute());
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelarAnimaciones();
      if (estado && app === APP.RESOLVING) render(estado);
    }
  });

  if (DEBUG) { el.debug.classList.remove('oculta'); bucleDebug(); }
}

window.addEventListener('pagehide', () => {
  cancelarAnimaciones();
  cancelAnimationFrame(rafDebug);
  cerrarAudio();
});

iniciar();
