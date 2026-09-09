// DinoWar — ancla la versión corta de la Edge Function a un commit concreto.
//
// La versión corta importa el motor por URL desde el repositorio, anclado a un
// commit y no a una rama: el código que decide si un jugador hizo trampa no
// puede cambiar solo porque alguien empuje a main.
//
// El problema de un anclaje escrito a mano es que se olvida. Ya pasó: se
// corrigió el validador, se volvió a desplegar, y la función siguió trayendo el
// validador viejo porque el anclaje seguía apuntando al commit de antes. El
// despliegue parecía correcto y no lo era.
//
// Así que el anclaje lo pone esta herramienta y lo vigila un test, que compara
// el validador del commit anclado con el del árbol de trabajo.
//
//   node tools/anclar-desde-url.mjs [sha]     (por defecto, HEAD)

import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import { fuentesDelPaquete } from './huellaAsalto.mjs';

export const SALIDA = 'supabase/functions/asalto/desde-url.ts';
export const MARCA = 'Motor anclado en: ';

/**
 * Los ficheros que la función se trae por URL y que, por tanto, hay que vigilar.
 *
 * NO es una lista a mano. Lo fue, con cinco entradas escogidas a ojo, y por eso
 * pasó lo siguiente: al quitar la Defensa cambiaron `cards.js`, `state.js` y
 * `balance.js` —ninguno estaba en la lista—, el anclaje se quedó apuntando al
 * motor de tres cifras y la función siguió re-jugando con él. Cuatro de cada
 * cuatro partidas se rechazaban con «jugada ilegal», ninguna victoria pagaba, y
 * `npm test` estaba en verde. El comentario de la lista incluso avisaba de que
 * no era el cierre transitivo.
 *
 * Ahora sale de lo que esbuild dice que entra de verdad en el paquete, que es
 * el mismo conjunto de módulos que la versión por URL arrastra. Añadir un import
 * a la función extiende la vigilancia sola, que es la única forma de que esto no
 * dependa de que alguien se acuerde.
 *
 * Encadena con `test/paquete.test.js`: si el paquete se ha quedado atrás, esa
 * lista no vale y ese test falla primero.
 */
export const VIGILADOS = fuentesDelPaquete();

export const shaAnclado = () => (readFileSync(SALIDA, 'utf8').match(/@([0-9a-f]{40})/) ?? [])[1] ?? null;

/**
 * Los importes llevan la URL literal repetida —no se puede componer con una
 * constante— así que el SHA aparece varias veces y hay que cambiarlas todas.
 */
export const APARICIONES_MINIMAS = 3;

/** Cómo era un fichero en un commit. Null si ese commit no lo tenía. */
export function enElCommit(sha, fichero) {
  try {
    return execFileSync('git', ['show', `${sha}:${fichero}`], { encoding: 'utf8', maxBuffer: 1 << 26 });
  } catch {
    return null;
  }
}

// Ejecutado directamente y no importado. Va con pathToFileURL porque en Windows
// `process.argv[1]` llega con barras invertidas y la comparación contra
// `file://` + la ruta no se cumplía nunca: la herramienta corría, no escribía
// nada y no se quejaba. Y con la guarda de que argv[1] exista, porque con
// `node -e` o al importarlo desde un test no hay ruta que convertir y
// pathToFileURL(undefined) lanza.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const sha = process.argv[2]
    ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const viejo = shaAnclado();
  const txt = readFileSync(SALIDA, 'utf8').replaceAll(viejo, sha);
  writeFileSync(SALIDA, txt);
  process.stdout.write(`anclado ${viejo?.slice(0, 8)} → ${sha.slice(0, 8)}\n`);
  for (const f of VIGILADOS) {
    const igual = enElCommit(sha, f) === readFileSync(f, 'utf8');
    process.stdout.write(`  ${igual ? 'ok  ' : 'MAL '} ${f}\n`);
  }
}
