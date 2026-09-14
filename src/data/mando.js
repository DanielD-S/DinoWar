// DinoWar — quién manda en una tribu.
//
// Una tribu tiene UN capataz y los demás son miembros. Se llama capataz y no
// «jefe» porque un jefe en este juego es el Saurophaganax: dos cosas con el
// mismo nombre en la misma pantalla no hay quien las lea.
//
// Vive APARTE de `tribu.js` a propósito, y no es manía de orden: `tribu.js`
// entra en el paquete de la Edge Function —lo importa el validador de asaltos—
// y tocarlo obliga a regenerar el paquete, re-anclar el motor y volver a
// desplegar. Esto no lo necesita nadie del lado del motor: el servidor que
// comprueba estas reglas es SQL, no la función.
//
// Y ésa es la otra mitad: lo de aquí es la cortesía que dice POR QUÉ antes de
// mandar la petición. Quien manda de verdad son `expulsar`, `ceder_mando` y
// `salir_de_tribu`, que lo vuelven a comprobar con `auth.uid()` —lo único que
// no se puede falsificar desde el navegador—.

export const ROL = Object.freeze({ CAPATAZ: 'capataz', MIEMBRO: 'miembro' });

export const esCapataz = (m) => m?.rol === ROL.CAPATAZ;

/** ¿Puede `quien` echar a `aQuien` de la tribu? Devuelve el motivo si no. */
export function puedeExpulsar(quien, aQuien) {
  if (!quien || !aQuien) return 'no hay a quién echar';
  if (!esCapataz(quien)) return 'sólo el capataz echa a alguien';
  if (quien.id === aQuien.id) return 'para irte tú está salir de la cuenca';
  return null;
}

/** ¿Puede `quien` pasarle el mando a `aQuien`? */
export function puedeCederMando(quien, aQuien) {
  if (!quien || !aQuien) return 'no hay a quién ceder el mando';
  if (!esCapataz(quien)) return 'no eres el capataz';
  if (quien.id === aQuien.id) return 'ya eres el capataz';
  return null;
}

/**
 * Quién hereda el mando cuando el capataz se va: el miembro que lleva más
 * tiempo en la cuenca. Una tribu sin capataz no podría aceptar ni echar a
 * nadie, así que el relevo no puede ser una decisión de nadie: tiene que pasar
 * solo. Devuelve el id, o null si no queda nadie — y entonces la tribu se
 * borra, que una guarida vacía con almacén dentro no es de nadie.
 *
 * El desempate es el id y no el orden en que vengan las filas: una fila vieja
 * puede no tener fecha de entrada, y el relevo tiene que salir igual en el
 * navegador y en el SQL.
 */
export function relevoDeMando(miembros, saliente) {
  const resto = (miembros ?? []).filter((m) => m.id !== saliente);
  if (!resto.length) return null;
  return resto.slice().sort((a, b) => (a.desde ?? 0) - (b.desde ?? 0)
    || (a.id < b.id ? -1 : 1))[0].id;
}

/**
 * Un capataz que no aparece congela la tribu entera: en «por solicitud» nadie
 * contesta a la puerta, nadie echa a nadie y nadie puede arreglarlo. Pasado el
 * plazo desde la última vez que se le vio, el mando lo coge quien lo pida.
 *
 * QUIEN LO PIDA, y no el más antiguo: si la tribu se apagó, el más antiguo es
 * probablemente otro ausente, y el relevo automático dejaría el mando en otro
 * sitio donde tampoco hay nadie. Quien lo pide es, por definición, quien está.
 *
 * El plazo está también en `0021_relevo_de_capataz.sql`, y el de allí es el que
 * manda: éste sirve para enseñar el botón y decir cuánto falta, pero la hora
 * buena es la del servidor y `visto_en` no lo escribe el navegador.
 */
export const AUSENCIA_DIAS = 7;
export const AUSENCIA = AUSENCIA_DIAS * 86400_000;

/** Cuánto lleva sin aparecer, en ms. `null` si no se sabe cuándo se le vio. */
export const ausenciaDe = (m, ahora) => (m?.visto ? Math.max(0, ahora - m.visto) : null);

/** ¿Puede `yo` reclamar el mando? Devuelve el motivo si no. */
export function puedeReclamarMando(yo, miembros, ahora) {
  if (!yo) return 'no estás en la tribu';
  if (esCapataz(yo)) return 'ya mandas tú';
  const capataz = (miembros ?? []).find(esCapataz);
  // Una tribu sin capataz —no debería pasar— la coge cualquiera sin esperar:
  // es la válvula, porque no tiene ninguna otra forma de volver a funcionar.
  if (!capataz) return null;
  if ((ausenciaDe(capataz, ahora) ?? 0) < AUSENCIA) return 'el capataz sigue apareciendo';
  return null;
}

/**
 * ¿Puede deshacer la cuenca? Sólo el capataz y sólo si no queda nadie más.
 * Una tribu no es del capataz: es de quien está dentro, y el almacén lo
 * llenaron entre todos. Borrar el progreso de otros siete no es una atribución
 * del mando; quedarse con una guarida vacía tampoco tiene sentido.
 */
export function puedeDeshacer(yo, miembros) {
  if (!esCapataz(yo)) return 'sólo el capataz deshace la cuenca';
  if ((miembros ?? []).length > 1) return 'todavía hay gente dentro';
  return null;
}

// ------------------------------------------------------------------ acceso
//
// Dos formas de entrar en una cuenca, y las dos siguen existiendo: el CÓDIGO,
// que es una invitación privada y entra sin pedir permiso, y la LISTA, que
// enseña las que tienen sitio. `libre` entra y ya; `solicitud` espera a que el
// capataz diga que sí.

export const ACCESO = Object.freeze({ LIBRE: 'libre', SOLICITUD: 'solicitud' });

export const NOMBRE_ACCESO = Object.freeze({
  [ACCESO.LIBRE]: 'Libre',
  [ACCESO.SOLICITUD]: 'Por solicitud',
});

/**
 * Qué se puede hacer con una cuenca de la lista. Uno de:
 *
 *   'entrar'        es libre y tiene sitio
 *   'pedir'         hay que solicitarlo
 *   'pedida'        ya lo pediste y no han contestado
 *   'llena'         no cabe nadie más
 *   'tienes-cuenca' estás en una: salir primero
 *
 * El servidor lo vuelve a comprobar en `unirse_a_tribu`, y no por
 * desconfianza: la lista se pinta una vez y la cuenca se llena mientras la
 * miras.
 */
export function estadoEnLista(tribu, tengoTribu) {
  if (tengoTribu) return 'tienes-cuenca';
  if (tribu.pedida) return 'pedida';
  if ((tribu.miembros ?? 0) >= (tribu.tope ?? Infinity)) return 'llena';
  return tribu.acceso === ACCESO.SOLICITUD ? 'pedir' : 'entrar';
}
