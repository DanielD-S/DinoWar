// DinoWar — compara las tres economías sobre las mismas semillas.
//
//   node sim/economias.js              2.000 partidas por economía
//   node sim/economias.js --n 400
//
// Escribe ECONOMIAS.md. Cada economía corre en su propio proceso porque el modo
// se lee del entorno al importar BALANCE: así ninguna corrida puede contaminar
// a la siguiente, y la de siempre (FIJA) se mide con el mismo código que las
// otras dos en vez de con los números guardados de la última vez.

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { BALANCE, MAZO, mazoConBiomasa } from '../src/data/balance.js';
import { repartoPorDieta } from '../src/data/dietas.js';

const ECONOMIAS = [
  ['FIJA', 'La de hoy: renta igual para los dos, garantizada y sin tipo.'],
  ['TIPADA', 'Renta igual y garantizada, pero con tipo declarado un turno antes.'],
  ['CARTAS', 'La Biomasa es carta de recurso: 18 de las 50, una por turno.'],
];

// Los mismos objetivos que mide BALANCE.md (PLAN_V2.md §8).
const OBJETIVOS = {
  duracion: { min: 10, max: 14, etiqueta: 'Duración media (turnos)', fmt: (v) => v.toFixed(1) },
  inicial: { min: 48, max: 55, etiqueta: 'Victorias del jugador inicial', fmt: (v) => `${v.toFixed(1)} %` },
  bolaDeNieve: { min: 55, max: 70, etiqueta: 'Bola de nieve (ventaja en T5)', fmt: (v) => `${v.toFixed(1)} %` },
  sinDecision: { max: 2, etiqueta: 'Partidas sin decisión', fmt: (v) => `${v.toFixed(1)} %` },
  malCalibradas: { max: 0, etiqueta: 'Cartas mal calibradas', fmt: (v) => String(v) },
};

// `malCalibradas` viene como lista de cartas, no como cuenta: normalizar aquí y
// no en cada sitio que la mira evita que la tabla imprima [object Object].
const valorDe = (resumen, clave) => {
  const v = resumen[clave];
  return Array.isArray(v) ? v.length : v;
};

function args() {
  const a = process.argv.slice(2);
  const o = { n: 2000, seed: 1 };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--n') o.n = Number(a[++i]);
    else if (a[i] === '--seed') o.seed = Number(a[++i]);
  }
  return o;
}

function corre(modo, o) {
  const salida = execFileSync(
    process.execPath,
    ['sim/run.js', '--n', String(o.n), '--seed', String(o.seed), '--json'],
    { env: { ...process.env, DINOWAR_ECONOMIA: modo }, maxBuffer: 1 << 28, encoding: 'utf8' },
  );
  return JSON.parse(salida);
}

const cumple = (clave, v) => {
  const t = OBJETIVOS[clave];
  return (t.min === undefined || v >= t.min) && (t.max === undefined || v <= t.max);
};

function informe(datos, o) {
  const dieta = repartoPorDieta();
  const cartas = BALANCE.economia.cartas;
  const L = [];

  L.push('# ECONOMIAS.md — las tres economías, medidas');
  L.push('');
  L.push('> Generado por `node sim/economias.js`. **No editar a mano.**');
  L.push('>');
  L.push('> El juego publicado corre **siempre en FIJA**. Las otras dos existen para');
  L.push('> decidir con datos si alguna merece sustituirla. Se eligen por entorno:');
  L.push('> `DINOWAR_ECONOMIA=TIPADA node sim/run.js`.');
  L.push('');
  L.push(`- Partidas por economía: **${o.n}** · semilla base **${o.seed}** · heurística vs heurística`);
  L.push(`- Las tres corren sobre **las mismas semillas**, así que las diferencias son de la economía.`);
  L.push('');

  L.push('## Qué es cada una');
  L.push('');
  for (const [modo, desc] of ECONOMIAS) L.push(`- **${modo}** — ${desc}`);
  L.push('');
  L.push(`En las dos tipadas, un carnívoro sólo se paga con Biomasa **animal** y un`);
  L.push(`herbívoro sólo con **vegetal**; los omnívoros aceptan cualquiera y pagan con`);
  L.push(`vegetal primero, que es la abundante. Eventos, climas y recursos no comen: los`);
  L.push('paga cualquier Biomasa.');
  L.push('');
  L.push(`El set reparte **${dieta.CARNIVORO} carnívoros, ${dieta.HERBIVORO} herbívoros y ${dieta.OMNIVORO} omnívoros**.`);
  L.push('La dieta no es un alias del clado: *Therizinosaurus* es un terópodo herbívoro y');
  L.push('los oviraptorosaurios se leen como omnívoros. Ahí está el valor del eje.');
  L.push('');
  L.push(`En TIPADA, producir vegetal renta **${BALANCE.economia.tipada.vegetal}** y producir animal **${BALANCE.economia.tipada.animal}**:`);
  L.push('es la eficiencia ecológica entre niveles tróficos hecha regla.');
  L.push('');
  L.push(`En CARTAS, **${cartas.porMazo} de las 50** cartas del mazo son recurso, se baja **${cartas.porTurno} por turno** y cada una da **${cartas.valor}**.`);
  L.push(`Eso deja el mazo en ${MAZO.length} entradas de acción menos las recortadas: ${mazoConBiomasa().filter(([id]) => !id.startsWith('biomasa')).reduce((n, [, c]) => n + c, 0)} cartas jugables de 50.`);
  L.push('');

  L.push('## Los objetivos, lado a lado');
  L.push('');
  L.push(`| Métrica | Objetivo | ${ECONOMIAS.map(([m]) => m).join(' | ')} |`);
  L.push(`|---|---|${ECONOMIAS.map(() => '---').join('|')}|`);
  for (const [clave, t] of Object.entries(OBJETIVOS)) {
    const obj = t.min !== undefined ? `${t.min} – ${t.max}` : `≤ ${t.max}`;
    const celdas = ECONOMIAS.map(([modo]) => {
      const v = valorDe(datos[modo].resumen, clave);
      return `${t.fmt(v)} ${cumple(clave, v) ? '✅' : '❌'}`;
    });
    L.push(`| ${t.etiqueta} | ${obj} | ${celdas.join(' | ')} |`);
  }
  L.push('');

  L.push('## Cómo se gana en cada una');
  L.push('');
  L.push(`| Vía | ${ECONOMIAS.map(([m]) => m).join(' | ')} |`);
  L.push(`|---|${ECONOMIAS.map(() => '---').join('|')}|`);
  for (const [via, clave] of [['Registro fósil', 'trofeos'], ['Colapso del hábitat', 'habitat'], ['Extinción', 'extincion']]) {
    L.push(`| ${via} | ${ECONOMIAS.map(([m]) => `${datos[m].resumen[clave].toFixed(1)} %`).join(' | ')} |`);
  }
  L.push('');

  L.push('## Duración');
  L.push('');
  L.push(`| | ${ECONOMIAS.map(([m]) => m).join(' | ')} |`);
  L.push(`|---|${ECONOMIAS.map(() => '---').join('|')}|`);
  for (const [et, clave] of [['P10', 'p10'], ['Mediana', 'p50'], ['P90', 'p90'], ['Máximo', 'max']]) {
    L.push(`| ${et} | ${ECONOMIAS.map(([m]) => datos[m].resumen[clave]).join(' | ')} |`);
  }
  L.push('');

  L.push('## Veredicto');
  L.push('');
  for (const [modo] of ECONOMIAS) {
    const fallos = Object.keys(OBJETIVOS).filter((k) => !cumple(k, valorDe(datos[modo].resumen, k)));
    L.push(fallos.length === 0
      ? `- **${modo}**: cumple los ${Object.keys(OBJETIVOS).length} objetivos.`
      : `- **${modo}**: incumple ${fallos.length} — ${fallos.map((k) => OBJETIVOS[k].etiqueta.toLowerCase()).join(', ')}.`);
  }
  L.push('');
  L.push('La comparación que importa es la **bola de nieve**: es la razón de existir de');
  L.push('la v2. Una economía que la empeore no entra por muy bien que quede en lo demás.');
  L.push('');
  return `${L.join('\n')}\n`;
}

const o = args();
const datos = {};
for (const [modo] of ECONOMIAS) {
  process.stderr.write(`· ${modo} — ${o.n} partidas…\n`);
  datos[modo] = corre(modo, o);
}
writeFileSync('ECONOMIAS.md', informe(datos, o));
process.stderr.write('\n→ ECONOMIAS.md\n');
for (const [modo] of ECONOMIAS) {
  const r = datos[modo].resumen;
  process.stderr.write(`${modo.padEnd(7)} bola ${r.bolaDeNieve.toFixed(1).padStart(5)} %  ·  ${r.duracion.toFixed(1).padStart(5)} turnos  ·  inicial ${r.inicial.toFixed(1)} %\n`);
}
