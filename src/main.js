// DinoWar — arranque, máquina de estados y pegamento entre motor e interfaz.
// La interfaz sólo LEE el estado; toda mutación pasa por reduce().

import { BALANCE } from './data/balance.js';
import { TIPO, OBJETIVO, CLADO, CLADO_NOMBRE, ESTACIONES, carta } from './data/cards.js';
import { crearPartida, vistaDe, FASE, MOTIVO_FIN, unidadesDe } from './engine/state.js';
import { reduce, ACCION, legales, validar } from './engine/actions.js';
import { decidir, PERFIL } from './engine/ai.js';
import { semilla } from './engine/rng.js';
import {
  montar, render, mensaje, el, JUGADOR, RIVAL,
  fichaHTML, fichaEstacionHTML, ayudaHTML, abrirFicha, abrirDescarte, cerrarHojas,
  abrirVisor, cambiarModoVisor, cerrarVisor, abrirComprometidas,
} from './ui/render.js';
import { tomarEntrada, soltarEntrada } from './ui/input.js';
import { detectarFotos, vigilarFotos, calentarFotos } from './ui/art.js';
import { montarMeta, abrirColeccion, abrirSobres, abrirMazos, pintarMenu, recompensar } from './ui/meta.js';
import { mazoActivo, cargarPerfil, actualizarPerfil } from './ui/almacen.js';
import { aListaDeMazo } from './data/coleccion.js';
import {
  animarCombate, animarRevelacion, animarEstacion, cancelarAnimaciones, esperar, lineasDeLog,
} from './ui/animate.js';
import { desbloquear, alternarMute, estaSilenciado, sonido, cerrarAudio } from './ui/audio.js';

const APP = Object.freeze({
  BOOT: 'BOOT', MENU: 'MENU', PLAYING: 'PLAYING', RESOLVING: 'RESOLVING', GAME_OVER: 'GAME_OVER',
  COLECCION: 'COLECCION', SOBRES: 'SOBRES', MAZOS: 'MAZOS',
});

const params = new URLSearchParams(location.search);
const DEBUG = params.get('debug') === '1';
// El parámetro de la URL sigue mandando —es lo que usan las pruebas— pero ya no
// es la única manera de bajar la dificultad: eso está en el menú.
const IA_FORZADA = params.get('ia');
const perfilIA = () => IA_FORZADA ?? (cargarPerfil().dificultad ?? PERFIL.HEURISTICA);

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
  el.coleccion.classList.toggle('oculta', nuevo !== APP.COLECCION);
  el.sobres.classList.toggle('oculta', nuevo !== APP.SOBRES);
  el.mazos.classList.toggle('oculta', nuevo !== APP.MAZOS);
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
  const bio = estado.jugadores[JUGADOR].biomasa;
  // La renta no es una hucha: cada turno la Biomasa se REEMPLAZA por el número
  // de turno. Verlo sólo como una cifra en el marcador se lee como un fallo de
  // contador, así que el turno se abre diciéndolo.
  mensaje(!puede ? `Sin Biomasa suficiente (${bio}). Pulsa Listo.`
    : estado.turno === 1 ? 'Arrastra cartas al campo. Mantén pulsada una para ver su ficha.'
      : `Cobras ${bio} de Biomasa este turno. No se acumula: lo que no gastes se pierde.`);
}

function jugarIA() {
  let guardia = 0;
  while (!estado.jugadores[RIVAL].listo && guardia++ < 80) {
    const d = decidir(vistaDe(estado, RIVAL), RIVAL, rngIA, perfilIA());
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

/** Qué ha hecho la estación, en una línea. */
function resumenEstacion(heridos, bajas) {
  if (heridos === 0) return 'Los dinosaurios curan 1 herida y los hábitats no reciben daño este turno.';
  const h = heridos === 1 ? '1 dinosaurio pasa sed' : `${heridos} dinosaurios pasan sed`;
  return bajas === 0 ? `${h}.` : `${h} y ${bajas === 1 ? 'cae 1' : `caen ${bajas}`}.`;
}

/**
 * Resumen de lo que el rival ha jugado SOBRE lo tuyo en esta revelación.
 * Devuelve null si no ha jugado nada de eso.
 */
function presionesRivales(nuevos) {
  const textos = nuevos
    .filter((e) => e.tipo === 'PRESION' && e.jugador === RIVAL)
    .map((e) => {
      const c = carta(e.cardId);
      if (e.objetivoCardId) return `${c.rasgoNombre} sobre tu ${carta(e.objetivoCardId).binomial}`;
      if (e.clado) return `${c.rasgoNombre} a tus ${CLADO_NOMBRE[e.clado].toLowerCase()}s`;
      return c.rasgoNombre;
    });
  return textos.length === 0 ? null : `El rival juega ${textos.join(' y ')}.`;
}

async function bucle() {
  let guardia = 0;
  while (guardia++ < 400) {
    if (estado.fase === FASE.FIN) return finPartida();
    if (estado.fase === FASE.DESPLIEGUE) return turnoDelJugador();

    if (estado.fase === FASE.DESCARTE) {
      if (estado.jugadores[RIVAL].mano.length > BALANCE.manoMaxima) {
        const d = decidir(vistaDe(estado, RIVAL), RIVAL, rngIA, perfilIA());
        rngIA = d.rng;
        estado = reduce(estado, d.accion);
        continue;
      }
      render(estado);
      return pedirDescarte();
    }

    if (estado.fase === FASE.REVELACION) {
      irA(APP.RESOLVING);
      const antes = estado;
      const desdeRev = estado.eventos.length;
      estado = reduce(estado, { tipo: ACCION.AVANZAR });
      render(estado);
      // Lo que el rival te ha jugado encima se resuelve aquí y hasta ahora sólo
      // quedaba escrito en el registro: en el tablero eran dos cifras que
      // cambiaban de color. Si te ha metido una presión, se dice.
      mensaje(presionesRivales(estado.eventos.slice(desdeRev)) ?? 'Revelación simultánea…');
      sonido('revelar');
      // Se espera a que terminen los volteos, no un tiempo fijo: con el campo
      // lleno son diez cartas y 700 ms las cortaba por la mitad.
      const volteadas = animarRevelacion(antes, estado);
      await esperar(volteadas > 0 ? 480 + volteadas * 90 : 500);
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

    // La estación se resolvía dentro del avance genérico, sin decir nada: todos
    // los dinosaurios amanecían heridos y el jugador no sabía por qué.
    if (estado.fase === FASE.ESTACION) {
      const desde = estado.eventos.length;
      estado = reduce(estado, { tipo: ACCION.AVANZAR });
      render(estado);
      const nuevos = estado.eventos.slice(desde);
      const cambio = nuevos.find((e) => e.tipo === 'ESTACION');
      if (cambio) {
        irA(APP.RESOLVING);
        const e = ESTACIONES[cambio.estacion];
        const bajas = nuevos.filter((x) => x.tipo === 'MUERTE').length;
        const heridos = nuevos.filter((x) => x.tipo === 'DANO').length;
        mensaje(`${e.nombre}. ${resumenEstacion(heridos, bajas)}`);
        sonido(heridos > 0 ? 'muerte' : 'revelar');
        await animarEstacion(nuevos);
      }
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

/**
 * Rendirse: la partida se abandona en la interfaz, no en el motor. Un estado
 * de partida rendida no existe en las reglas y no hacía falta inventarlo —
 * cuenta como derrota en el récord y paga lo que paga una derrota, que es lo
 * único que la rendición tiene que decidir.
 */
function rendirse() {
  cerrarHojas();
  irA(APP.GAME_OVER);
  soltarEntrada();
  cancelarAnimaciones();

  const [p, r] = estado.jugadores;
  el.finTitulo.textContent = 'Te has retirado';
  el.finTitulo.style.color = 'var(--rival)';
  el.finDetalle.innerHTML = 'abandonas el campo en el turno '
    + `<b>${estado.turno}</b><br>Trofeos <b>${p.trofeos}</b> – <b>${r.trofeos}</b>`
    + ` · Hábitat <b>${Math.max(0, p.habitat)}</b> – <b>${Math.max(0, r.habitat)}</b>`;

  anotarResultado(false, estado.turno);
  const premio = recompensar(false);
  el.finDetalle.innerHTML += `<br><span class="fin-premio">+${premio} dinomonedas</span>`;
  sonido('pierde');
}

function preguntarRendicion() {
  el.eleccionTitulo.textContent = '¿Abandonar la partida?';
  el.eleccionTexto.textContent = 'Cuenta como derrota en tu récord y cobra la recompensa de derrota.';
  el.eleccionCuerpo.innerHTML = `
    <button class="opcion" data-rendirse="si">Rendirse<small>La partida termina aquí.</small></button>
    <button class="opcion" data-rendirse="no">Seguir jugando<small>Vuelve al tablero.</small></button>`;
  el.eleccion.classList.remove('oculta');
  el.eleccionCuerpo.onclick = (e) => {
    const b = e.target.closest('[data-rendirse]');
    if (!b) return;
    el.eleccion.classList.add('oculta');
    el.eleccionCuerpo.onclick = null;
    if (b.dataset.rendirse === 'si') rendirse();
  };
}

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
    [MOTIVO_FIN.HABITAT]: 'por colapso del hábitat',
    [MOTIVO_FIN.EXTINCION]: 'por extinción: alguien se quedó sin cartas',
    [MOTIVO_FIN.LIMITE_TURNOS]: 'por límite de turnos',
  }[estado.motivoFin] ?? '';

  el.finDetalle.innerHTML = `${motivo}<br>Trofeos <b>${p.trofeos}</b> – <b>${r.trofeos}</b>`
    + ` · Hábitat <b>${Math.max(0, p.habitat)}</b> – <b>${Math.max(0, r.habitat)}</b><br>${estado.turno} turnos`;

  anotarResultado(gane, estado.turno);
  const premio = recompensar(gane);
  el.finDetalle.innerHTML += `<br><span class="fin-premio">+${premio} dinomonedas</span>`;
  sonido(gane ? 'gana' : 'pierde');
}

// ------------------------------------------------------------------ arranque

function nuevaPartida() {
  cancelarAnimaciones();
  soltarEntrada();
  registro = [];

  const s = Number(params.get('seed')) || (Date.now() & 0x7fffffff);
  // Tú llevas tu mazo; la IA lleva el de referencia, que es el que mide el
  // simulador. Así el balance publicado sigue significando algo.
  estado = crearPartida(s, [aListaDeMazo(mazoActivo()), null]);
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

/**
 * El rival blando existía desde V2-2 pero sólo se llegaba a él escribiendo
 * `?ia=aleatoria` en la barra de direcciones, que es tanto como no existir.
 * La IA heurística no se ha tocado: lo que cambia es cuál de las dos juega.
 */
function pintarDificultad() {
  const actual = perfilIA();
  el.dificultad.innerHTML = [
    [PERFIL.ALEATORIA, 'Fácil'],
    [PERFIL.HEURISTICA, 'Normal'],
  ].map(([id, n]) => `<button class="chip ${id === actual ? 'on' : ''}" data-ia="${id}">${n}</button>`).join('');
  el.dificultad.classList.toggle('fijada', !!IA_FORZADA);
}

function pintarDebug() {
  if (!DEBUG || !estado) return;
  el.debug.textContent = [
    `app   ${app}`,
    `fase  ${estado.fase}  turno ${estado.turno}`,
    `IA    ${perfilIA()} · mano ${estado.jugadores[RIVAL].mano.length}`,
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
  // Las ilustraciones son opcionales: si están servidas se repinta con ellas,
  // si no, se juega con las siluetas y nadie ve un hueco.
  vigilarFotos();
  detectarFotos(() => { if (estado) render(estado); }).then(calentarFotos);
  pintarRecord();
  irA(APP.MENU);

  montarMeta(() => irA(APP.MENU));

  el.btnJugar.addEventListener('click', () => { desbloquear(); nuevaPartida(); });
  el.btnColeccion.addEventListener('click', () => { abrirColeccion(); irA(APP.COLECCION); });
  el.btnSobres.addEventListener('click', () => { abrirSobres(); irA(APP.SOBRES); });
  el.btnMazos.addEventListener('click', () => { abrirMazos(); irA(APP.MAZOS); });
  el.btnOtra.addEventListener('click', () => { pintarRecord(); nuevaPartida(); });
  // Terminar una partida no obligaba a jugar otra, pero lo parecía: no había
  // más salida que «Otra partida».
  el.btnFinMenu.addEventListener('click', () => {
    estado = null;
    pintarRecord();
    pintarMenu();
    irA(APP.MENU);
  });
  el.btnRendirse.addEventListener('click', preguntarRendicion);

  pintarDificultad();
  el.dificultad.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ia]');
    if (!b) return;
    actualizarPerfil({ dificultad: b.dataset.ia });
    pintarDificultad();
  });

  // Marcha atrás del despliegue. Sin esto, soltar una carta en la ranura
  // equivocada costaba el turno entero y la Biomasa.
  el.franjaMias.addEventListener('click', () => { if (estado) abrirComprometidas(estado); });
  el.comprometidasCerrar.addEventListener('click', cerrarHojas);
  el.comprometidasCuerpo.addEventListener('click', (e) => {
    const b = e.target.closest('[data-retirar]');
    if (!b || !interactivo()) return;
    const iid = Number(b.dataset.retirar);
    const c = carta(estado.instancias[iid].cardId);
    if (aplicar({ tipo: ACCION.RETIRAR, jugador: JUGADOR, iid })) {
      mensaje(`${c.binomial} vuelve a tu mano.`);
      if (estado.jugadores[JUGADOR].pendientes.length === 0) cerrarHojas();
      else abrirComprometidas(estado);
    }
  });
  el.btnListo.addEventListener('click', alPulsarListo);
  el.btnLog.addEventListener('click', abrirLog);
  el.logCerrar.addEventListener('click', cerrarHojas);
  el.descarteCerrar.addEventListener('click', cerrarHojas);
  el.rDescBtn.addEventListener('click', () => { if (estado) abrirDescarte(estado, RIVAL); });
  el.pDescBtn.addEventListener('click', () => { if (estado) abrirDescarte(estado, JUGADOR); });
  el.descarteCuerpo.addEventListener('click', (e) => {
    const f = e.target.closest('[data-card]');
    if (f) abrirFicha(fichaHTML(f.dataset.card));
  });
  el.fichaCerrar.addEventListener('click', cerrarHojas);

  // Ampliar una carta: desde la ficha, y la ficha se abre desde el tablero, la
  // colección, el descarte y el editor de mazos, así que con un sitio basta.
  el.fichaCuerpo.addEventListener('click', (e) => {
    const b = e.target.closest('[data-zoom]');
    // La miniatura abre lo que enseña —la ilustración— y el botón la carta.
    if (b) abrirVisor(b.dataset.zoom, b.dataset.modo ?? 'carta');
  });
  el.visorModos.addEventListener('click', (e) => {
    const b = e.target.closest('[data-modo]');
    if (b) cambiarModoVisor(b.dataset.modo);
  });
  el.visorCerrar.addEventListener('click', cerrarVisor);
  // Tocar fuera cierra: el visor tapa la pantalla entera y no hay otra salida
  // evidente en un móvil. Fuera es todo menos la carta, la ilustración y el pie
  // —el lienzo ocupa el hueco entero, así que también cuenta como fondo.
  el.visor.addEventListener('click', (e) => {
    if (e.target === el.visor || e.target === el.visorLienzo
        || e.target.classList.contains('visor-marco')) cerrarVisor();
  });
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

/**
 * Instalable y jugable sin conexión. Falla en silencio a propósito: servido
 * desde file:// o en un navegador sin service workers, el juego funciona igual
 * —no hay nada del otro lado— y no tiene sentido molestar con un error.
 */
function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* se juega igual */ });
  });
}

registrarServiceWorker();

window.addEventListener('pagehide', () => {
  cancelarAnimaciones();
  cancelAnimationFrame(rafDebug);
  cerrarAudio();
});

iniciar();
