// DinoWar — empaqueta la Edge Function del asalto en UN solo fichero.
//
// Por qué existe: la función importa el motor entero por rutas relativas
// (../../../src/engine/...). Eso está bien en el repositorio —es lo que impide
// que haya un segundo motor «de servidor» que un día calcule otra cosa— pero
// el editor del panel de Supabase es de un fichero, así que para desplegar
// desde el navegador hace falta un paquete plano.
//
// NO es un build step del juego: el juego se sigue sirviendo sin compilar nada.
// Esto es una herramienta de desarrollo y por eso vive en tools/.
//
//   node tools/empaquetar-asalto.mjs
//
// Escribe supabase/functions/asalto/paquete.ts, que se pega tal cual en el
// editor del panel. Un test comprueba que el paquete no se ha quedado atrás
// respecto al código, que es el único riesgo real de tener dos copias.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { huellaDeFuentes, SALIDA, MARCA } from './huellaAsalto.mjs';

const tmp = mkdtempSync(join(tmpdir(), 'dinowar-'));
const meta = join(tmp, 'meta.json');

// esbuild no da metafile si escribe a stdout, así que se le pide un fichero y
// se lee después. El temporal se va con la sesión.
const salidaTmp = join(tmp, 'asalto.js');
// En Windows esto no arrancaba de dos maneras seguidas: `npx` a secas no
// existe —el ejecutable es `npx.cmd`— y desde Node 20 un `.cmd` tampoco se
// puede lanzar sin `shell: true`, que da EINVAL. Con shell hay que entrecomillar
// los argumentos a mano, porque ya no los separa el sistema.
const enWindows = process.platform === 'win32';
const npx = enWindows ? 'npx.cmd' : 'npx';
const arg = (s) => (enWindows && /[\s"]/.test(s) ? `"${s.replace(/"/g, '\\"')}"` : s);
execFileSync(npx, [
  '--yes', 'esbuild@0.25.0',
  'supabase/functions/asalto/index.ts',
  '--bundle',
  '--format=esm',
  '--platform=neutral',
  '--target=es2022',
  `--outfile=${salidaTmp}`,
  `--metafile=${meta}`,
  // Lo que Deno resuelve por su cuenta se queda fuera del paquete: son URLs,
  // no ficheros del repositorio.
  '--external:jsr:*',
  '--external:npm:*',
  '--external:https://*',
].map(arg), { encoding: 'utf8', maxBuffer: 1 << 26, shell: enWindows });
const bundle = readFileSync(salidaTmp, 'utf8');

// Qué ficheros entraron de verdad, según esbuild. Se pregunta en vez de
// suponerlo: si mañana la función importa un módulo más, la huella lo incluye
// sola y nadie tiene que acordarse de nada.
const fuentes = Object.keys(JSON.parse(readFileSync(meta, 'utf8')).inputs)
  .filter((f) => !f.startsWith('jsr:') && !f.startsWith('npm:'));
const huella = huellaDeFuentes(fuentes);

const cabecera = `// DinoWar — Edge Function del asalto, EMPAQUETADA.
//
// GENERADO por \`node tools/empaquetar-asalto.mjs\`. **No editar a mano**: el
// original es supabase/functions/asalto/index.ts y lo que se toque aquí se
// pierde en el siguiente empaquetado.
//
// Existe sólo para poder desplegar desde el editor del panel de Supabase, que
// es de un fichero. Con la CLI no hace falta: \`supabase functions deploy asalto\`
// resuelve los imports él solo.
//
// Lleva dentro el motor de juego entero —el MISMO que corre en el navegador—
// porque el servidor re-juega la partida para calcular el daño en vez de
// creerse lo que le diga el cliente.
//
// ${MARCA}${huella}
//
// Lleva dentro estos ${fuentes.length} ficheros del repositorio. La lista la da
// esbuild, no una suposición mía: si mañana la función importa un módulo más,
// aparece aquí solo. Un test recalcula la huella sobre esta misma lista y falla
// si el paquete se ha quedado atrás del código.
${fuentes.map((f) => `// fuente: ${f}`).join('\n')}
`;

writeFileSync(SALIDA, `${cabecera}\n${bundle}`);
const lineas = bundle.split('\n').length;
const kb = (Buffer.byteLength(bundle) / 1024).toFixed(0);
process.stdout.write(`→ ${SALIDA} · ${lineas} líneas · ${kb} KB\n`);
