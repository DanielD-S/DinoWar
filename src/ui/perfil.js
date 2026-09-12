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
  hayServidor, rpc, funcion, sesionValida, ErrorDeRed,
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
    // Cuántas veces más puedes cambiarte el nombre. Lo dice el servidor, que es
    // quien lleva la cuenta: si lo llevara la pantalla, recargar la regalaría.
    apodoRestantes: Number(d.apodo_restantes ?? 0),
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
  // Ya no se cae a local si esto falla. Con la cuenta obligatoria, un perfil
  // local sería inventarse una colección: el menú enseñaría cartas y monedas
  // que el servidor no ha visto y el primer mazo que guardases sería rechazado.
  // Se propaga el error y el arranque devuelve al jugador a la puerta.
  await sesionValida();
  const d = await rpc('mi_perfil');
  const p = aFormaLocal(d);
  guardarPerfil(p);
  return p;
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
 * Desde las misiones diarias también se manda la partida PERDIDA. Antes no: una
 * derrota valía cero y mandarla era hacer trabajar al servidor para que lo
 * confirmara. Ahora una derrota puede avanzar «juega 3 partidas» o «despliega 12
 * criaturas», y no mandarla sería quitarle al jugador un progreso que se ganó —
 * que es justo la mitad del sentido de las misiones: que un día malo pague algo.
 * El tope diario ya cubría las dos, ganadas y perdidas.
 *
 * @param {{semilla:number, mazo:Array, acciones:object[], perfil:string}} partida
 * @param {boolean} gane lo que cree el navegador, sólo para el modo local
 * @returns {Promise<{premio:number, misiones:number, cumplidas:string[]}>}
 */
export async function cobrarPartida(partida, gane) {
  const premio = gane ? ECONOMIA.monedasVictoria : ECONOMIA.monedasDerrota;
  const nada = { premio: 0, misiones: 0, cumplidas: [] };

  if (modo === MODO.LOCAL) {
    // Sin servidor no hay misiones: el progreso lo lleva quien paga, y aquí no
    // paga nadie. Inventarlo en local sería enseñar un avance que mañana, con
    // servidor, no existe.
    if (premio !== 0) actualizarPerfil({ monedas: cargarPerfil().monedas + premio });
    return { ...nada, premio };
  }
  // Una partida sin grabación no se manda: no es que no se pueda comprobar, es
  // que pagarla sería volver justo a lo que esto viene a cerrar. Pasa cuando
  // ganas por tiempo o por retirada del rival, que no son jugadas del motor.
  if (!partida) return nada;

  const r = await funcion(CONFIG.supabase.funcionAsalto, { tipo: 'victoria', ...partida });
  misionesEnCache = null;   // el progreso que acaba de cambiar lo dice el servidor
  await sincronizar();
  return {
    premio: Number(r?.premio ?? 0),
    misiones: Number(r?.misiones ?? 0),
    cumplidas: Array.isArray(r?.cumplidas) ? r.cumplidas : [],
  };
}

// -------------------------------------------------------------- misiones

// Las misiones se leen del servidor y se guardan aquí, en memoria y no en
// `localStorage`. La diferencia importa: la colección se cachea en disco porque
// hay que pintarla sin conexión y sigue siendo verdad; el progreso de hoy sólo
// vale mientras dure la sesión, y un progreso viejo pintado como actual sería
// exactamente la clase de mentira que el resto de este fichero evita.
let misionesEnCache = null;

/** Lo último que dijo el servidor, o null si todavía no ha dicho nada. */
export const misionesDeHoy = () => misionesEnCache;

/**
 * Trae las misiones del día. El DÍA lo pone el servidor: con la fecha local del
 * navegador, alguien en Auckland vería las de mañana y le acreditarían las de
 * hoy.
 *
 * No lanza si falla. Un menú sin el bloque de misiones es un menú; un menú que
 * no se pinta porque las misiones no llegaron es un juego roto por un adorno.
 *
 * @returns {Promise<{dia:string, progreso:object}|null>}
 */
export async function traerMisiones() {
  if (modo === MODO.LOCAL) return null;
  try {
    const d = await rpc('mis_misiones');
    misionesEnCache = { dia: d?.dia ?? null, progreso: d?.progreso ?? {} };
    return misionesEnCache;
  } catch {
    return misionesEnCache;
  }
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
  const r = await rpc('cambiar_apodo', { p_apodo: nombre });
  await sincronizar();
  return r?.apodo ?? nombre;
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
