// DinoWar — LA COSTURA de la capa cooperativa.
//
// Es el único fichero que sabe DÓNDE vive el estado de la tribu. Todo lo demás
// del juego le pide lo mismo sin enterarse de si contesta este navegador o un
// servidor a dos mil kilómetros.
//
// Dos implementaciones detrás de la misma puerta:
//
//   REMOTA  contra Supabase. El estado es de verdad compartido y el daño a los
//           jefes lo valida el servidor re-jugando la partida.
//   LOCAL   todo aquí, con compañeros simulados. Es lo que se usa si no hay
//           servidor configurado o si no hay conexión.
//
// La caída a local NO es silenciosa: `modoActual()` dice en cuál estás y la
// pantalla lo enseña. Un juego que dice «tu tribu» cuando en realidad está
// hablando solo es peor que uno que admite que está sin conexión.

import {
  hayServidor, rpc, funcion, sesionAnonima, usuarioActual, olvidarSesion, ErrorDeRed,
} from './supabase.js';
import { CONFIG } from '../data/config.js';
import { CUENCA } from '../data/tribu.js';
import { JEFES, CALENDARIO, TIPO_EVENTO } from '../data/eventos.js';
import * as local from './red-local.js';

export const MODO = Object.freeze({ REMOTO: 'REMOTO', LOCAL: 'LOCAL' });
export const YO = local.YO;

let modo = hayServidor() ? MODO.REMOTO : MODO.LOCAL;
let motivoLocal = hayServidor() ? null : 'sin servidor configurado';

export const modoActual = () => modo;
export const porQueLocal = () => motivoLocal;

/** Se cae a local y deja dicho por qué. Volver a intentarlo es cosa del arranque. */
function caerALocal(e) {
  if (modo === MODO.LOCAL) return;
  modo = MODO.LOCAL;
  motivoLocal = e?.message ?? 'no hay conexión con la cuenca';
  console.warn('[cuenca] sin servidor, se juega en local:', motivoLocal);
}

/** Entra en la cuenca. Idempotente: se llama en cada arranque sin pensarlo. */
export async function entrar(apodo = null) {
  if (modo !== MODO.REMOTO) return null;
  try {
    await sesionAnonima();
    await rpc('entrar', { p_apodo: apodo });
    return usuarioActual();
  } catch (e) {
    caerALocal(e);
    return null;
  }
}

// ------------------------------------------------------------------ lectura

/**
 * Traduce lo que devuelve el servidor a la forma que ya pinta la pantalla. La
 * traducción vive aquí y no en la pantalla a propósito: así el día que el
 * servidor cambie de forma, el que se entera es este fichero.
 */
function aFormaDePantalla(d) {
  const ahora = Number(d.ahora);
  const tribu = d.tribu ?? null;
  const arranque = tribu ? new Date(tribu.creada_en).getTime() : ahora;

  // Qué evento toca hoy: el servidor manda el día de la cuenca ya calculado,
  // así que el calendario local sólo lo traduce a texto. Si divergieran, manda
  // el servidor — es quien decide si un jefe está abierto.
  const dia = d.dia ?? 0;
  const eventoJefe = CALENDARIO.find(
    (e) => e.tipo === TIPO_EVENTO.JEFE && dia >= e.dia && dia < e.dia + e.dura,
  );

  const fila = eventoJefe ? (d.jefes ?? []).find((j) => j.evento_id === eventoJefe.id) : null;
  const mios = (d.aportes ?? []).filter((a) => a.evento_id === eventoJefe?.id);
  const aportes = {};
  for (const a of mios) aportes[a.apodo] = Number(a.dano);

  const yoMismo = usuarioActual()?.id;
  const mioReclamado = mios.find((a) => a.jugador_id === yoMismo)?.reclamado ?? false;
  const mioDano = mios.find((a) => a.jugador_id === yoMismo)?.dano ?? 0;

  const jefe = eventoJefe && fila ? {
    ...JEFES[eventoJefe.jefe],
    vida: Number(fila.vida),
    vidaMaxima: Number(fila.vida_maxima),
    aportes,
    caidoEn: fila.caido_en ? new Date(fila.caido_en).getTime() : null,
    desde: arranque + eventoJefe.dia * 86400_000,
    hasta: arranque + (eventoJefe.dia + eventoJefe.dura) * 86400_000,
    evento: eventoJefe,
  } : null;

  return {
    arranque,
    yacimiento: {
      nivel: d.yacimiento?.nivel ?? 1,
      fosiles: d.yacimiento?.fosiles ?? 0,
      desde: ahora,
    },
    ganadosDesdeLaUltima: 0,   // el servidor no lleva esa cuenta, y no hace falta
    almacen: Number(tribu?.almacen ?? 0),
    aportado: mioDano,
    asaltosHoy: Number(d.asaltos_hoy ?? 0),
    jefe,
    cartas: [],
    miembros: (d.miembros ?? []).map((m) => m.apodo),
    puedeReclamar: Boolean(jefe && jefe.vida <= 0 && mioDano > 0 && !mioReclamado),
    tribu: tribu ? { nombre: tribu.nombre, codigo: tribu.codigo } : null,
    eventoJefe,
  };
}

export async function estadoDeTribu(ahora = Date.now()) {
  if (modo === MODO.LOCAL) return local.estadoDeTribu(ahora);
  try {
    const d = await rpc('estado_cuenca');
    // Abrir el jefe que toque es idempotente y barato, y evita que la primera
    // persona que entra se encuentre la cuenca vacía sin saber por qué.
    const forma = aFormaDePantalla(d);
    if (forma.tribu && forma.eventoJefe && !forma.jefe) {
      await rpc('abrir_jefe', { p_evento: forma.eventoJefe.id });
      return aFormaDePantalla(await rpc('estado_cuenca'));
    }
    return forma;
  } catch (e) {
    caerALocal(e);
    return local.estadoDeTribu(ahora);
  }
}

// ---------------------------------------------------------------- escritura

export async function aportar(fosiles, ahora = Date.now()) {
  if (modo === MODO.LOCAL) return local.aportar(fosiles, ahora);
  const r = await rpc('aportar', { p_cantidad: Math.max(0, Math.floor(fosiles)) });
  return Array.isArray(r) ? r[0] : r;
}

export async function mejorarYacimiento(_coste, ahora = Date.now()) {
  if (modo === MODO.LOCAL) return local.mejorarYacimiento(_coste, ahora);
  await rpc('mejorar_yacimiento');
  return true;
}

export async function crearTribu(nombre) {
  if (modo === MODO.LOCAL) return null;
  return rpc('crear_tribu', { p_nombre: nombre });
}

export async function entrarEnTribu(codigo) {
  if (modo === MODO.LOCAL) return null;
  return rpc('entrar_en_tribu', { p_codigo: codigo });
}

/**
 * El asalto. En remoto NO se manda el daño: se manda la partida —semilla, mazo
 * y tus jugadas— y el servidor la re-juega para calcularlo él. Es toda la
 * diferencia entre un juego cooperativo y una hoja de cálculo compartida.
 */
export async function asaltar(partida, ahora = Date.now()) {
  if (modo === MODO.LOCAL) {
    // En local sí vale un número: no hay nadie a quien engañar, y el daño lo
    // calculó ya el navegador al cerrar la partida.
    const dano = typeof partida === 'number' ? partida : partida?.dano;
    if (!Number.isFinite(dano)) throw new Error('el asalto no trae daño que apuntar');
    return { ...local.asaltar(dano, ahora), dano };
  }

  const r = await funcion(CONFIG.supabase.funcionAsalto, {
    jefeEvento: partida.jefeEvento,
    semilla: partida.semilla,
    mazo: partida.mazo,
    acciones: partida.acciones,
  });

  return { vida: Number(r?.vida), cayo: Boolean(r?.cayo), dano: danoDeRespuesta(r) };
}

/**
 * El daño que dice el servidor, o un error que enseña lo que contestó de verdad.
 *
 * Existe aparte y exportada para poder probarla: la primera vez que un asalto
 * llegó al servidor, la respuesta no traía daño y la pantalla pintó «NaN de
 * daño a Saurophaganax maximus» como si nada hubiera fallado. Un número roto
 * enseñado con naturalidad es peor que un error: parece que funcionó.
 */
export function danoDeRespuesta(r) {
  // `Number(null)` es 0, no NaN: sin este descarte, un servidor que contesta
  // «dano: null» —o sea, que no lo sabe— pasaría por un asalto de cero daño,
  // que es una respuesta legítima y muy distinta.
  const crudo = r?.dano;
  const dano = crudo === null || crudo === undefined || crudo === '' ? NaN : Number(crudo);
  if (Number.isFinite(dano)) return dano;
  throw new ErrorDeRed(
    `el servidor no devolvió el daño (contestó: ${String(JSON.stringify(r)).slice(0, 200)})`,
    200, r,
  );
}

export async function reclamar(ahora = Date.now()) {
  if (modo === MODO.LOCAL) return local.reclamar(ahora);
  const estado = await estadoDeTribu();
  if (!estado.eventoJefe) return null;
  return rpc('reclamar_jefe', { p_evento: estado.eventoJefe.id });
}

export function borrarCuenca() {
  local.borrarCuenca();
  olvidarSesion();
}

export { CUENCA };
