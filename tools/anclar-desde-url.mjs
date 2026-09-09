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

export const SALIDA = 'supabase/functions/asalto/desde-url.ts';
export const MARCA = 'Motor anclado en: ';

/** Los ficheros que la función se trae por URL y que, por tanto, hay que vigilar. */
export const VIGILADOS = [
  'supabase/functions/_compartido/validarAsalto.js',
  // validarAsalto.js lo importa por ruta relativa, y una ruta relativa desde
  // una URL del CDN sigue siendo esa URL: viaja también, y por tanto también
  // hay que vigilar que no se quede atrás.
  'supabase/functions/_compartido/validarPartida.js',
  'src/data/tribu.js',
];

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
// nada y no se quejaba.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
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
