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
// Sobre las cuentas: crear una cuenta NO crea un usuario nuevo. Se le añade
// correo y contraseña al usuario ANÓNIMO que ya tenías, que conserva su uuid y
// con él su tribu, su yacimiento, sus aportes y su colección. Por eso `registrar`
// es un PUT sobre el usuario y no un signup: un signup habría dejado huérfano
// todo lo jugado antes de registrarse.

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

/**
 * Sesión anónima. Es lo que mantiene la promesa de «sin cuenta»: identidad
 * estable sin pedir un correo. Se guarda y se reutiliza; si caduca, se refresca
 * sola, y si el refresco falla se empieza una nueva en vez de dejar el juego
 * colgado — perder la tribu es malo, no poder jugar es peor.
 */
export async function sesionAnonima() {
  const s = cargar();
  if (s?.access_token && s.expires_at * 1000 > Date.now() + 60_000) return s;

  if (s?.refresh_token) {
    try {
      const nueva = await pedir('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: s.refresh_token }),
      }, false);
      guardar(nueva);
      return nueva;
    } catch { /* se cae abajo y se empieza de cero */ }
  }

  const nueva = await pedir('/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify({ data: {} }),
  }, false);
  guardar(nueva);
  return nueva;
}

/** Llama una función de la base de datos. */
export async function rpc(nombre, argumentos = {}) {
  await sesionAnonima();
  return pedir(`/rest/v1/rpc/${nombre}`, {
    method: 'POST',
    body: JSON.stringify(argumentos),
  });
}

/** Invoca una Edge Function. */
export async function funcion(nombre, cuerpo) {
  await sesionAnonima();
  return pedir(`/functions/v1/${nombre}`, {
    method: 'POST',
    body: JSON.stringify(cuerpo),
  });
}

/** Quién eres para el servidor. Null si aún no has entrado. */
export const usuarioActual = () => cargar()?.user ?? null;

/**
 * ¿Estás jugando sin cuenta? Un usuario anónimo es un usuario de pleno derecho
 * —tiene uuid, tribu y colección— pero vive sólo en este navegador: si se borran
 * los datos del sitio, no hay forma de volver a él.
 */
export function esAnonimo() {
  const u = usuarioActual();
  if (!u) return true;
  // Supabase marca `is_anonymous`, pero las sesiones guardadas por versiones
  // anteriores no lo traen. Sin correo tampoco hay forma de recuperar la
  // cuenta, así que a efectos del juego es lo mismo.
  return u.is_anonymous ?? !u.email;
}

export const correoActual = () => usuarioActual()?.email ?? null;

/**
 * Convierte tu sesión anónima en una cuenta. Mismo usuario, mismo uuid: lo
 * único que cambia es que a partir de ahora se puede volver a él desde otro
 * sitio. Todo lo jugado se queda donde estaba porque nunca se movió.
 */
export async function registrar(correo, clave) {
  await sesionAnonima();
  const u = await pedir('/auth/v1/user', {
    method: 'PUT',
    body: JSON.stringify({ email: correo, password: clave }),
  });
  // La respuesta es el usuario, no una sesión: el token que tienes sigue
  // valiendo y hay que quedarse con él, sólo que apuntando al usuario nuevo.
  const s = cargar();
  if (s) guardar({ ...s, user: u });
  return u;
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
 * Salir. La sesión se olvida y el siguiente arranque abre una anónima nueva:
 * el juego nunca se queda sin poder jugar por no tener cuenta.
 *
 * Se avisa al servidor antes de borrar nada, pero si eso falla se borra igual.
 * Una sesión que no se puede cerrar en este navegador porque el servidor no
 * contesta es peor que un token que caduca solo dentro de una hora.
 */
export async function salir() {
  try {
    await pedir('/auth/v1/logout', { method: 'POST' });
  } catch { /* el token caduca solo; lo que importa es soltarlo aquí */ }
  guardar(null);
}

/** Sólo para pruebas: olvida la sesión y empieza como alguien nuevo. */
export function olvidarSesion() {
  guardar(null);
}
