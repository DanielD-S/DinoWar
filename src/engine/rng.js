// PRNG determinista y puro. El estado del generador es un uint32 que viaja
// dentro del GameState, así que toda partida es reproducible desde su semilla.
// mulberry32: rápido, sin dependencias, distribución suficiente para simular.

/** @returns {{rng:number, valor:number}} valor en [0,1) */
export function siguiente(rng) {
  let t = (rng + 0x6d2b79f5) >>> 0;
  let x = Math.imul(t ^ (t >>> 15), 1 | t);
  x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
  return { rng: t, valor: ((x ^ (x >>> 14)) >>> 0) / 4294967296 };
}

/** Entero en [0, n). */
export function entero(rng, n) {
  const s = siguiente(rng);
  return { rng: s.rng, valor: Math.floor(s.valor * n) };
}

/** Elemento aleatorio de una lista no vacía. */
export function elegir(rng, lista) {
  const e = entero(rng, lista.length);
  return { rng: e.rng, valor: lista[e.valor] };
}

/** Fisher-Yates. Devuelve una lista nueva; no toca la original. */
export function barajar(lista, rng) {
  const salida = lista.slice();
  let r = rng;
  for (let i = salida.length - 1; i > 0; i--) {
    const e = entero(r, i + 1);
    r = e.rng;
    const j = e.valor;
    const tmp = salida[i];
    salida[i] = salida[j];
    salida[j] = tmp;
  }
  return { rng: r, lista: salida };
}

/** Normaliza una semilla arbitraria a un uint32 distinto de cero. */
export function semilla(n) {
  const s = (n >>> 0) || 0x9e3779b9;
  return s;
}
