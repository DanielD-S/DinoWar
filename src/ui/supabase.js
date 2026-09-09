// DinoWar — cliente mínimo de Supabase, hablando HTTP a pelo.
//
// No se carga `supabase-js`. El README promete «sin frameworks, sin
// dependencias, sin CDNs» y eso no es una pose: es por qué el juego arranca en
// medio segundo. La API de Supabase es HTTP, y lo que este juego necesita de
// ella —una sesión anónima, llamar funciones, invocar la Edge Function— son
// estas ochenta líneas.
//
// Lo que NO hace, y por eso cabe: realtime, storage, consultas construidas,
// providers de OAuth. Si algún día hiciera falta realtime, esto se queda corto
// y habrá que replantearlo; hoy no hace falta.
//
// Sobre las cuentas: el juego EXIGE una. No hay sesión anónima ni perfil local
// —«nada de cuentas locales en memoria»— así que este fichero ya no abre una
// sesión por su cuenta al arrancar. `sesion()` devuelve la que haya o falla, y
// quien la llame sin tenerla acaba en la pantalla de entrada.
//
// El precio de esa decisión, dicho aquí para que no sorprenda: sin conexión no
// se juega. Antes el juego arrancaba siempre porque caía a un perfil local.

import { CONFIG } from '../data/config.js';

const CLAVE_SESION = 'dinowar.sesion.v1';

let sesion = null;      // { access_token, refresh_token, expires_at, user }

export const hayServidor = () => Boolean(CONFIG.supabase?.url && CONFIG.supabase?.clave);

function guardar(s) {
  sesion = s;
  try {
    if (s) localStorage.setItem(CLAVE_SESION, JSON.stringify(s));
    else localStorage.removeItem(CLAVE_SESION);
  } catch { /* en privado se juega igual, sin recordar la sesión */ }
}

function cargar() {
  if (sesion) return sesion;
  try { sesion = JSON.parse(localStorage.getItem(CLAVE_SESION)); } catch { sesion = null; }
  return sesion;
}

/** Errores del servidor con el mensaje que el servidor dio, no uno inventado. */
export class ErrorDeRed extends Error {
  constructor(mensaje, estado = 0, cuerpo = null) {
    super(mensaje);
    this.name = 'ErrorDeRed';
    this.estado = estado;
    this.cuerpo = cuerpo;
  }
}

async function pedir(ruta, opciones = {}, conSesion = true) {
  const { url, clave } = CONFIG.supabase;
  const cabeceras = {
    apikey: clave,
    'Content-Type': 'application/json',
    ...(opciones.headers ?? {}),
  };
  // El token del usuario manda sobre la clave publicable: es lo que hace que el
  // servidor sepa quién eres y no sólo de qué proyecto vienes.
  const s = conSesion ? cargar() : null;
  cabeceras.Authorization = `Bearer ${s?.access_token ?? clave}`;

  let r;
  try {
    r = await fetch(`${url}${ruta}`, { ...opciones, headers: cabeceras });
  } catch (e) {
    throw new ErrorDeRed('no hay conexión con la cuenca', 0, e?.message ?? null);
  }

  const texto = await r.text();
  let cuerpo = null;
  try { cuerpo = texto ? JSON.parse(texto) : null; } catch { cuerpo = texto; }

  if (!r.ok) {
    // Postgres, PostgREST y las Edge Functions ponen el motivo en sitios
    // distintos. Se buscan los tres antes de rendirse a un genérico.
    const motivo = cuerpo?.message ?? cuerpo?.error ?? cuerpo?.error_description
      ?? cuerpo?.msg ?? `error ${r.status}`;
    throw new ErrorDeRed(motivo, r.status, cuerpo);
  }
  return cuerpo;
}

/** Hay sesión guardada, aunque haya que refrescarla. No garantiza que valga. */
export const haySesion = () => Boolean(cargar()?.access_token);

/**
 * La sesión, refrescándola si toca. Ya NO abre una anónima cuando no hay: eso
 * era lo que sostenía el «se juega sin cuenta», y ahora entrar es obligatorio.
 * Si no hay sesión o el refresco falla, lanza y el arranque manda al jugador a
 * la pantalla de entrada.
 */
export async function sesionValida() {
  const s = cargar();
  if (!s?.refresh_token) throw new ErrorDeRed('no has entrado', 401);
  if (s.access_token && s.expires_at * 1000 > Date.now() + 60_000) return s;

  try {
    const nueva = await pedir('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: s.refresh_token }),
    }, false);
    guardar(nueva);
    return nueva;
  } catch (e) {
    // Un refresco que falla es una sesión muerta: se suelta en vez de dejarla
    // ahí para que falle otra vez en la siguiente llamada.
    guardar(null);
    throw e;
  }
}

/** Llama una función de la base de datos. */
export async function rpc(nombre, argumentos = {}) {
  await sesionValida();
  return pedir(`/rest/v1/rpc/${nombre}`, {
    method: 'POST',
    body: JSON.stringify(argumentos),
  });
}

/** Invoca una Edge Function. */
export async function funcion(nombre, cuerpo) {
  await sesionValida();
  return pedir(`/functions/v1/${nombre}`, {
    method: 'POST',
    body: JSON.stringify(cuerpo),
  });
}

/** Quién eres para el servidor. Null si aún no has entrado. */
export const usuarioActual = () => cargar()?.user ?? null;

/**
 * ¿Es una cuenta de verdad? Quedan por ahí sesiones ANÓNIMAS de cuando el juego
 * las abría solo. No valen para entrar: se tratan como no haber entrado, y el
 * jugador acaba en la pantalla de entrada como todo el mundo.
 */
export function esAnonimo() {
  const u = usuarioActual();
  if (!u) return true;
  return u.is_anonymous ?? !u.email;
}

/** Puedes jugar: hay sesión y es de una cuenta con correo. */
export const estaDentro = () => haySesion() && !esAnonimo();

export const correoActual = () => usuarioActual()?.email ?? null;

/**
 * Crear una cuenta. Es un signup normal, no la conversión de un anónimo: ya no
 * hay anónimo que convertir. La respuesta trae la sesión, así que quedas dentro
 * sin tener que entrar otra vez.
 *
 * Si el proyecto tuviera la confirmación por correo activada, la respuesta
 * vendría SIN sesión y habría que avisar de que hay que mirar el buzón. Está
 * desactivada, y este `if` es lo que impide que un día se active y el juego se
 * quede en blanco sin decir por qué.
 */
export async function registrar(correo, clave) {
  const r = await pedir('/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify({ email: correo, password: clave }),
  }, false);
  if (!r?.access_token) {
    throw new ErrorDeRed('cuenta creada, pero hay que confirmar el correo antes de entrar', 200, r);
  }
  guardar(r);
  return r;
}

/** Entrar con una cuenta ya creada. Reemplaza la sesión que hubiera. */
export async function entrarConCorreo(correo, clave) {
  const s = await pedir('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email: correo, password: clave }),
  }, false);
  guardar(s);
  return s;
}

/**
 * Salir. La sesión se olvida y el siguiente arranque te deja en la pantalla de
 * entrada.
 *
 * Se avisa al servidor antes de borrar nada, pero si eso falla se borra igual.
 * Una sesión que no se puede cerrar en este navegador porque el servidor no
 * contesta es peor que un token que caduca solo dentro de una hora.
 */
export async function salir() {
  try {
    if (haySesion()) await pedir('/auth/v1/logout', { method: 'POST' });
  } catch { /* el token caduca solo; lo que importa es soltarlo aquí */ }
  guardar(null);
}

/** Sólo para pruebas: olvida la sesión y empieza como alguien nuevo. */
export function olvidarSesion() {
  guardar(null);
}
