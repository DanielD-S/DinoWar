// DinoWar — LA COSTURA del perfil: colección, dinomonedas y mazos.
//
// Hermana de red.js y por la misma razón: el resto del juego pide «dame mi
// colección» sin enterarse de si contesta este navegador o un servidor.
//
//   REMOTO  contra Supabase. La colección es del servidor, y el mazo que llevas
//           a una partida se puede comprobar contra ella. Es lo que cierra el
//           agujero que el propio validador llevaba anotado: «NO comprueba que
//           sean tuyas».
//   LOCAL   todo en localStorage, como hasta ahora. Es lo que se usa si no hay
//           servidor configurado, si no hay conexión, o en modo pruebas.
//
// La caída a local NO es silenciosa: `modoPerfil()` dice en cuál estás.
//
// El almacén local sigue existiendo en los dos modos, pero cambia de papel: en
// REMOTO es una CACHÉ de lo que dijo el servidor, no la verdad. Existe porque
// las pantallas de meta.js se pintan de forma síncrona —leen el perfil y
// dibujan— y convertirlas todas en asíncronas para consultar el servidor en
// cada repintado habría sido reescribir la capa entera para nada. Así que:
// se lee de la caché, se escribe contra el servidor, y lo que el servidor
// conteste sustituye a la caché.

import {
  hayServidor, rpc, funcion, sesionAnonima, ErrorDeRed,
} from './supabase.js';
import { CONFIG } from '../data/config.js';
import {
  cargarPerfil, guardarPerfil, actualizarPerfil, perfilInicial,
} from './almacen.js';
import {
  ECONOMIA, abrirSobre, excedente, valorFusion,
} from '../data/coleccion.js';

export const MODO = Object.freeze({ REMOTO: 'REMOTO', LOCAL: 'LOCAL' });

/**
 * Modo de pruebas: ?pruebas=1 da dinomonedas infinitas. Sólo puede funcionar en
 * local, porque en remoto el saldo lo lleva el servidor y no hay forma de
 * pedirle que regale — que es exactamente el punto de haberlo movido allí. Así
 * que el modo pruebas fuerza el perfil a local y lo dice.
 */
export const PRUEBAS = new URLSearchParams(location.search).get('pruebas') === '1';

let modo = hayServidor() && !PRUEBAS ? MODO.REMOTO : MODO.LOCAL;
let motivoLocal = PRUEBAS ? 'modo pruebas' : (hayServidor() ? null : 'sin servidor configurado');

export const modoPerfil = () => modo;
export const porQuePerfilLocal = () => motivoLocal;

function caerALocal(e) {
  if (modo === MODO.LOCAL) return;
  modo = MODO.LOCAL;
  motivoLocal = e?.message ?? 'no hay conexión';
  console.warn('[perfil] sin servidor, se juega con el perfil local:', motivoLocal);
}

// ------------------------------------------------------------------ lectura

/**
 * Traduce el perfil del servidor a la forma que ya pintan las pantallas. El
 * servidor identifica los mazos por uuid y la pantalla por posición en la
 * lista; la traducción vive aquí para que meta.js no tenga que enterarse.
 */
function aFormaLocal(d) {
  const mazos = (d.mazos ?? []).map((m) => ({
    id: m.id, nombre: m.nombre, cartas: m.cartas ?? {},
  }));
  const activo = Math.max(0, mazos.findIndex((m) => m.id === d.activo));
  const base = perfilInicial();

  return {
    v: 1,
    monedas: Number(d.monedas ?? 0),
    cartas: d.cartas ?? {},
    mazos: mazos.length ? mazos : base.mazos,
    activo,
    sobresAbiertos: Number(d.sobres_abiertos ?? 0),
    elo: Number(d.elo ?? 1200),
    apodo: d.apodo ?? null,
    // La dificultad es una preferencia de ESTE navegador, no estado de juego:
    // el servidor no la lleva y no debe pisarla al sincronizar.
    dificultad: cargarPerfil().dificultad,
  };
}

/**
 * Trae el perfil del servidor y lo deja en la caché. Se llama al arrancar y
 * después de cada cambio: lo que se pinta es siempre lo último que dijo él.
 */
export async function sincronizar() {
  if (modo === MODO.LOCAL) return cargarPerfil();
  try {
    await sesionAnonima();
    const d = await rpc('mi_perfil');
    const p = aFormaLocal(d);
    guardarPerfil(p);
    return p;
  } catch (e) {
    caerALocal(e);
    return cargarPerfil();
  }
}

/** El perfil, de la caché. Síncrono a propósito: lo llaman los repintados. */
export const perfil = () => cargarPerfil();

/** El uuid del mazo en esa posición, o null si sólo existe aquí. */
const idDeMazo = (indice) => cargarPerfil().mazos[indice]?.id ?? null;

// ------------------------------------------------------------------- mazos

/**
 * Guarda un mazo y lo deja en uso. En remoto lo valida el SERVIDOR contra tu
 * colección real: si el mazo pide una carta que no tienes, esto lanza con el
 * motivo que dio Postgres y el mazo no se guarda. El navegador ya lo había
 * comprobado, pero esa comprobación es una cortesía para la pantalla; la que
 * manda es ésta.
 *
 * @returns {number} la posición del mazo guardado
 */
export async function guardarMazo(indice, nombre, cartas) {
  if (modo === MODO.LOCAL) {
    const p = cargarPerfil();
    const mazos = p.mazos.slice();
    const entrada = { id: null, nombre, cartas };
    const donde = indice < 0 ? mazos.length : indice;
    if (indice < 0) mazos.push(entrada); else mazos[donde] = { ...mazos[donde], ...entrada };
    actualizarPerfil({ mazos, activo: donde });
    return donde;
  }

  const id = indice < 0 ? null : idDeMazo(indice);
  const nuevo = await rpc('guardar_mazo', {
    p_id: id, p_nombre: nombre, p_cartas: cartas,
  });
  await rpc('activar_mazo', { p_id: nuevo });
  const p = await sincronizar();
  return Math.max(0, p.mazos.findIndex((m) => m.id === nuevo));
}

export async function usarMazo(indice) {
  if (modo === MODO.LOCAL) { actualizarPerfil({ activo: indice }); return; }
  const id = idDeMazo(indice);
  if (!id) return;
  await rpc('activar_mazo', { p_id: id });
  await sincronizar();
}

export async function borrarMazo(indice) {
  if (modo === MODO.LOCAL) {
    const p = cargarPerfil();
    const mazos = p.mazos.filter((_, i) => i !== indice);
    actualizarPerfil({ mazos, activo: Math.min(p.activo, Math.max(0, mazos.length - 1)) });
    return;
  }
  const id = idDeMazo(indice);
  if (!id) return;
  await rpc('borrar_mazo', { p_id: id });
  await sincronizar();
}

// ------------------------------------------------------- sobres y fusión

/**
 * Compra y abre un sobre. En remoto NO se sortea aquí: el servidor cobra las
 * dinomonedas y saca las cinco cartas él, con el mismo `abrirSobre()` que
 * corría en el navegador. Sortear en el cliente y decirle al servidor qué había
 * salido sería pedirle cinco legendarias y que dijese que sí.
 *
 * @returns {{cartas:string[], antes:Record<string,number>}}
 */
export async function comprarSobre() {
  const antes = { ...cargarPerfil().cartas };

  if (modo === MODO.LOCAL) {
    const p = cargarPerfil();
    if (!PRUEBAS && p.monedas < ECONOMIA.precioSobre) {
      throw new Error('no te llegan las dinomonedas');
    }
    const cartas = abrirSobre(Math.random, p.cartas);
    const nuevas = { ...p.cartas };
    for (const id of cartas) nuevas[id] = (nuevas[id] ?? 0) + 1;
    actualizarPerfil({
      cartas: nuevas,
      monedas: PRUEBAS ? p.monedas : p.monedas - ECONOMIA.precioSobre,
      sobresAbiertos: p.sobresAbiertos + 1,
    });
    return { cartas, antes };
  }

  const r = await funcion(CONFIG.supabase.funcionAsalto, { tipo: 'sobre' });
  if (!Array.isArray(r?.cartas) || r.cartas.length === 0) {
    throw new ErrorDeRed('el servidor no devolvió el sobre', 200, r);
  }
  await sincronizar();
  return { cartas: r.cartas, antes };
}

/** Funde el excedente: las copias que ya no caben en ningún mazo. */
export async function fundir() {
  if (modo === MODO.LOCAL) {
    const p = cargarPerfil();
    const valor = valorFusion(p.cartas);
    if (valor === 0) return 0;
    const cartas = { ...p.cartas };
    for (const [cid, n] of Object.entries(excedente(p.cartas))) cartas[cid] -= n;
    actualizarPerfil({ cartas, monedas: p.monedas + valor });
    return valor;
  }
  const r = await rpc('fundir_excedente');
  await sincronizar();
  return Number(r?.ganadas ?? 0);
}

// -------------------------------------------------------------- recompensa

/**
 * Cobra una partida contra la IA. En remoto se manda la PARTIDA —semilla, mazo
 * y tus jugadas— y el servidor la re-juega para decidir si la ganaste, igual
 * que hace con un asalto.
 *
 * Por qué, si sólo son 50 dinomonedas: porque las dinomonedas compran sobres y
 * los sobres dan cartas, así que una victoria que se afirma es una carta que se
 * regala. Mover la colección al servidor y dejar esto en el navegador habría
 * sido cerrar una puerta y dejar abierta la de al lado.
 *
 * @param {{semilla:number, mazo:Array, acciones:object[], perfil:string}} partida
 * @param {boolean} gane lo que cree el navegador, sólo para el modo local
 * @returns {Promise<number>} las dinomonedas cobradas
 */
export async function cobrarPartida(partida, gane) {
  const premio = gane ? ECONOMIA.monedasVictoria : ECONOMIA.monedasDerrota;

  if (modo === MODO.LOCAL) {
    if (premio !== 0) actualizarPerfil({ monedas: cargarPerfil().monedas + premio });
    return premio;
  }
  // Sin nada que cobrar no se molesta al servidor: una derrota vale 0 y no hay
  // por qué mandarle una partida entera para que lo confirme.
  if (premio === 0) return 0;
  // Y una victoria sin grabación no se paga: no es que no se pueda comprobar,
  // es que pagarla sería volver justo a lo que esto viene a cerrar. Pasa cuando
  // ganas por tiempo o por retirada del rival, que no son jugadas del motor.
  if (!partida) return 0;

  const r = await funcion(CONFIG.supabase.funcionAsalto, { tipo: 'victoria', ...partida });
  await sincronizar();
  return Number(r?.premio ?? 0);
}

/**
 * El nombre de jugador: lo único tuyo que ven los demás. Es único, así que esto
 * puede fallar porque alguien se te haya adelantado, y ése es un error que hay
 * que enseñar tal cual.
 *
 * @returns {Promise<string>} el nombre que quedó guardado, ya recortado a 24
 */
export async function cambiarApodo(nombre) {
  if (modo === MODO.LOCAL) {
    const apodo = String(nombre ?? '').trim().slice(0, 24);
    actualizarPerfil({ apodo });
    return apodo;
  }
  const guardado = await rpc('cambiar_apodo', { p_apodo: nombre });
  await sincronizar();
  return guardado;
}

/** Apunta una carta ganada a un jefe. En remoto ya la apuntó `reclamar_jefe`. */
export async function anotarRecompensa(cardId) {
  if (!cardId) return;
  if (modo === MODO.LOCAL) {
    const p = cargarPerfil();
    actualizarPerfil({ cartas: { ...p.cartas, [cardId]: (p.cartas[cardId] ?? 0) + 1 } });
    return;
  }
  await sincronizar();
}
