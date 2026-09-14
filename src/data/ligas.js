// DinoWar — las ligas: el ELO disfrazado de periodos geológicos.
//
// El número existe —`jugadores.elo`, 1200 al nacer— y lo mueve el servidor al
// cerrar cada duelo. Nadie lo ve. Lo que se ve es la liga, que es el ELO
// partido en tramos con nombre, y dentro de cada liga tres divisiones con una
// barra de 0 a 100. Es lo que hacen League of Legends y Pokémon TCG Live, y
// por la misma razón: un número que baja duele, una barra que sube engancha,
// y son la misma cosa.
//
// Los nombres son los tres periodos del Mesozoico, de más antiguo a más
// reciente: empiezas al principio del tiempo y subes hacia el final. El
// Jurásico queda en medio, donde va a vivir la mayoría, y es la casa del
// juego. La liga de arriba se llama Extinción porque es a lo que lleva el
// Cretácico: la cola de los que llegaron al final, con nombre y puesto.
//
// Es un fichero de DATOS, como las mecánicas y las misiones: cambiar los
// nombres, los tramos o el número de divisiones es tocar esto y nada más. Lo
// usan los dos lados —el cliente para pintar, el servidor para cerrar duelos—
// y por eso no importa nada del DOM.

export const LIGAS = Object.freeze([
  // `desde` es el ELO donde empieza la liga; la última no tiene techo.
  Object.freeze({ id: 'triasico', nombre: 'Triásico', desde: 0, emblema: 'plateosauravus', divisiones: 3 }),
  Object.freeze({ id: 'jurasico', nombre: 'Jurásico', desde: 1150, emblema: 'allosaurus', divisiones: 3 }),
  Object.freeze({ id: 'cretacico', nombre: 'Cretácico', desde: 1450, emblema: 'tyrannosaurus', divisiones: 3 }),
  Object.freeze({ id: 'extincion', nombre: 'Extinción', desde: 1750, emblema: 'extincion', divisiones: 1 }),
]);

export const ELO = Object.freeze({
  inicial: 1200,
  // Cuánto mueve una partida. 32 es el clásico; alto al principio para que una
  // cuenta nueva encuentre su sitio en diez duelos y no en cuarenta.
  k: 32,
  kNuevo: 64,
  duelosDeNovato: 10,
  // Suelo: de Triásico III no se baja, y la fórmula tampoco puede bajar de aquí.
  suelo: 800,
});

/** La liga que corresponde a un ELO. */
export function ligaDe(elo) {
  let liga = LIGAS[0];
  for (const l of LIGAS) if (elo >= l.desde) liga = l;
  return liga;
}

/**
 * Liga, división y puntos de un ELO. La división se cuenta de III a I —la I
 * es la de arriba, como en LoL— y los puntos van de 0 a 100 dentro de ella.
 * En la liga de arriba no hay divisiones: los puntos son el ELO por encima
 * del umbral, que ahí lo que se enseña es el puesto.
 *
 * @returns {{liga: object, division: number, puntos: number, romano: string}}
 */
export function rangoDe(elo) {
  const liga = ligaDe(elo);
  const i = LIGAS.indexOf(liga);
  const techo = LIGAS[i + 1]?.desde ?? null;
  if (techo === null) {
    return { liga, division: 1, puntos: Math.max(0, elo - liga.desde), romano: '' };
  }
  const ancho = (techo - liga.desde) / liga.divisiones;
  const dentro = Math.max(0, elo - liga.desde);
  // División 0 es la de abajo (III), la última la de arriba (I).
  const d = Math.min(liga.divisiones - 1, Math.floor(dentro / ancho));
  const puntos = Math.round(((dentro - d * ancho) / ancho) * 100);
  const division = liga.divisiones - d;
  return { liga, division, puntos: Math.min(100, puntos), romano: ROMANOS[division] ?? '' };
}

const ROMANOS = { 1: 'I', 2: 'II', 3: 'III' };

/** «Jurásico II», o «Extinción» a secas. */
export function nombreDeRango(elo) {
  const r = rangoDe(elo);
  return r.romano ? `${r.liga.nombre} ${r.romano}` : r.liga.nombre;
}

/**
 * ELO de los dos tras un duelo. `resultadoA` es 1 si ganó A, 0 si ganó B,
 * 0,5 en tablas. Cada uno lleva su K: el novato se mueve el doble.
 *
 * @returns {{a: number, b: number}} redondeados y por encima del suelo
 */
export function eloTras(eloA, eloB, resultadoA, duelosA = 99, duelosB = 99) {
  const esperadoA = 1 / (1 + 10 ** ((eloB - eloA) / 400));
  const esperadoB = 1 - esperadoA;
  const kA = duelosA < ELO.duelosDeNovato ? ELO.kNuevo : ELO.k;
  const kB = duelosB < ELO.duelosDeNovato ? ELO.kNuevo : ELO.k;
  const a = Math.round(eloA + kA * (resultadoA - esperadoA));
  const b = Math.round(eloB + kB * ((1 - resultadoA) - esperadoB));
  return { a: Math.max(ELO.suelo, a), b: Math.max(ELO.suelo, b) };
}
