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
  hayServidor, rpc, funcion, sesionValida, usuarioActual, olvidarSesion, ErrorDeRed,
} from './supabase.js';
import { CONFIG } from '../data/config.js';
import { CUENCA } from '../data/tribu.js';
import { JEFES, CALENDARIO, TIPO_EVENTO } from '../data/eventos.js';
import { ROL, ACCESO } from '../data/mando.js';
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
  motivoLocal = e?.message ?? 'no hay conexión con la tribu';
  console.warn('[cuenca] sin servidor, se juega en local:', motivoLocal);
}

/**
 * Entra en la cuenca. Idempotente: se llama en cada arranque sin pensarlo.
 *
 * Desde que el juego exige cuenta, esto NO se traga su error. Es el paso que
 * crea la fila del jugador y le siembra la colección, así que fallar aquí no es
 * «jugarás sin tribu»: es que no hay jugador. Quien llama decide, y hoy lo que
 * hace es devolverte a la pantalla de entrada con el motivo.
 *
 * @param {string|null} apodo sólo se usa al CREAR la fila; después se ignora.
 */
export async function entrar(apodo = null) {
  if (modo !== MODO.REMOTO) return null;
  await sesionValida();
  await rpc('entrar', { p_apodo: apodo });
  return usuarioActual();
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
    // Los miembros llegan con ROL y antigüedad: la pantalla necesita saber
    // quién manda para enseñar sus botones, y `mando.js` para decir por qué no.
    miembros: (d.miembros ?? []).map((m) => ({
      id: m.id, apodo: m.apodo, rol: m.rol ?? ROL.MIEMBRO,
      desde: m.desde ? new Date(m.desde).getTime() : 0,
      // La última vez que entró en el juego. Es lo que permite relevar a un
      // capataz que no aparece, y lo pone `entrar()` en cada arranque.
      visto: m.visto ? new Date(m.visto).getTime() : 0,
      // Lo que ha puesto de su yacimiento en el común, que hasta ahora no se
      // guardaba en ningún sitio.
      fosiles: Number(m.fosiles ?? 0),
      yo: m.id === (d.yo ?? yoMismo),
    })),
    puedeReclamar: Boolean(jefe && jefe.vida <= 0 && mioDano > 0 && !mioReclamado),
    // Cartas de jefe sin reclamar, de TODOS los jefes caídos y no sólo del de
    // esta ventana: un jefe que cae no vuelve a levantarse para esa tribu, así
    // que una carta sin reclamar se queda esperando para siempre. Sale de lo
    // que ya llega —`jefes` y `aportes` vienen enteros—, sin pedir nada más.
    cartasPendientes: (d.jefes ?? [])
      .filter((x) => Number(x.vida) <= 0)
      .map((x) => {
        const ev = CALENDARIO.find((e) => e.id === x.evento_id);
        const mio = (d.aportes ?? []).find(
          (a) => a.evento_id === x.evento_id && a.jugador_id === yoMismo,
        );
        if (!ev || !mio || Number(mio.dano) <= 0 || mio.reclamado) return null;
        return { evento: ev.id, titulo: ev.titulo, jefe: JEFES[ev.jefe] ?? null };
      })
      .filter(Boolean),
    tribu: tribu ? {
      id: tribu.id, nombre: tribu.nombre, codigo: tribu.codigo,
      acceso: tribu.acceso ?? ACCESO.LIBRE, emblema: tribu.emblema ?? 'clado_teropodo',
    } : null,
    // Sólo llegan al capataz: al resto no le toca contestarlas.
    solicitudes: (d.solicitudes ?? []).map((x) => ({ id: x.id, apodo: x.apodo })),
    // Los últimos asaltos de la tribu, tal como los apuntó el servidor.
    historial: (d.historial ?? []).map((x) => ({
      jugadorId: x.jugador_id,
      apodo: x.apodo,
      dano: Number(x.dano),
      turnos: Number(x.turnos),
      ganada: Boolean(x.ganada),
      cuando: x.jugado_en ? new Date(x.jugado_en).getTime() : 0,
      yo: x.jugador_id === (d.yo ?? yoMismo),
    })),
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
 * Salir, echar y ceder el mando. No existen en local: allí los compañeros son
 * simulados y echar a uno sería echar a nadie. La pantalla no ofrece los
 * botones en local, y esto es el segundo cerrojo.
 */
const soloEnLaTribuDeVerdad = (qué) => {
  throw new Error(`${qué} necesita una tribu compartida, y estás en local`);
};

export async function salirDeTribu() {
  if (modo === MODO.LOCAL) return soloEnLaTribuDeVerdad('salir de la tribu');
  return rpc('salir_de_tribu');
}

/**
 * Deshacer la cuenca. Es su propia llamada y no «salir» con otro nombre: si
 * alguien ha entrado mientras mirabas la pantalla, esto falla diciéndolo en vez
 * de sacarte a ti y dejarle la cuenca a esa persona.
 */
export async function deshacerTribu() {
  if (modo === MODO.LOCAL) return soloEnLaTribuDeVerdad('deshacer la tribu');
  return rpc('deshacer_tribu');
}

export async function expulsar(jugadorId) {
  if (modo === MODO.LOCAL) return soloEnLaTribuDeVerdad('echar a alguien');
  return rpc('expulsar', { p_jugador: jugadorId });
}

/**
 * Las cuencas con sitio. En local no hay ninguna que enseñar: los compañeros
 * son simulados y no hay más tribus que la tuya.
 */
export async function tribusAbiertas() {
  if (modo === MODO.LOCAL) return [];
  const r = await rpc('tribus_abiertas');
  return (Array.isArray(r) ? r : []).map((t) => ({
    id: t.id, nombre: t.nombre, emblema: t.emblema, acceso: t.acceso,
    miembros: Number(t.miembros), tope: Number(t.tope), pedida: Boolean(t.pedida),
  }));
}

export async function unirseATribu(tribuId) {
  if (modo === MODO.LOCAL) return soloEnLaTribuDeVerdad('entrar en otra tribu');
  return rpc('unirse_a_tribu', { p_tribu: tribuId });
}

export async function solicitarEntrada(tribuId) {
  if (modo === MODO.LOCAL) return soloEnLaTribuDeVerdad('pedir entrada');
  return rpc('solicitar_entrada', { p_tribu: tribuId });
}

export async function retirarSolicitud(tribuId) {
  if (modo === MODO.LOCAL) return soloEnLaTribuDeVerdad('retirar una solicitud');
  return rpc('retirar_solicitud', { p_tribu: tribuId });
}

export async function responderSolicitud(jugadorId, si) {
  if (modo === MODO.LOCAL) return soloEnLaTribuDeVerdad('contestar una solicitud');
  return rpc('responder_solicitud', { p_jugador: jugadorId, p_si: si });
}

export async function ajustarTribu({ acceso = null, emblema = null } = {}) {
  if (modo === MODO.LOCAL) return soloEnLaTribuDeVerdad('cambiar los ajustes');
  return rpc('ajustar_tribu', { p_acceso: acceso, p_emblema: emblema });
}

export async function cederMando(jugadorId) {
  if (modo === MODO.LOCAL) return soloEnLaTribuDeVerdad('ceder el mando');
  return rpc('ceder_mando', { p_jugador: jugadorId });
}

/**
 * Coger el mando de una tribu cuyo capataz lleva sin aparecer más del plazo.
 * El navegador ya lo ha comprobado con `puedeReclamarMando` para enseñar el
 * botón; esto lo vuelve a comprobar con la hora del servidor, que es la única
 * que no se cambia desde los ajustes del móvil.
 */
export async function reclamarMando() {
  if (modo === MODO.LOCAL) return soloEnLaTribuDeVerdad('reclamar el mando');
  return rpc('reclamar_mando');
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

/**
 * Reclamar la carta de un jefe caído. Sin evento, el de la ventana de ahora
 * —que es el botón de siempre—; con evento, cualquiera que se quedara sin
 * reclamar, que es lo que enseña el bloque de cartas pendientes.
 */
export async function reclamar(evento = null, ahora = Date.now()) {
  if (modo === MODO.LOCAL) return local.reclamar(ahora);
  let id = evento;
  if (!id) {
    const estado = await estadoDeTribu();
    id = estado.eventoJefe?.id ?? null;
  }
  if (!id) return null;
  return rpc('reclamar_jefe', { p_evento: id });
}

/**
 * Lo que te está esperando: quién pide entrar —si mandas tú— y cuántas cartas
 * de jefe tienes sin reclamar. Es una llamada aparte y diminuta porque la pide
 * el MENÚ, que no abre la cuenca entera para pintar un punto.
 */
export async function avisosDeCuenca() {
  if (modo === MODO.LOCAL) {
    const c = local.estadoDeTribu();
    return { solicitudes: 0, cartas: c.puedeReclamar ? 1 : 0 };
  }
  try {
    const r = await rpc('avisos_cuenca');
    return { solicitudes: Number(r?.solicitudes ?? 0), cartas: Number(r?.cartas ?? 0) };
  } catch {
    // Un aviso que no llega no es un error que enseñar: es no tener nada que
    // decir todavía.
    return { solicitudes: 0, cartas: 0 };
  }
}

export function borrarCuenca() {
  local.borrarCuenca();
  olvidarSesion();
}

export { CUENCA };
