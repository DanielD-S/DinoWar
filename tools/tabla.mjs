// Genera y aplica RECOSTE.md, la tabla editable del set.
//
//   node tools/tabla.mjs escribir   → vuelca las 31 cartas a RECOSTE.md
//   node tools/tabla.mjs aplicar    → lee RECOSTE.md y lo mete en src/data/cards.js
//
// La tabla es la fuente para una revisión a mano: se edita ahí y se aplica de
// vuelta, en vez de tocar treinta y una cartas en el código una por una. Sólo
// se aplican las columnas numéricas y los textos; el id nunca cambia.
import { readFileSync, writeFileSync } from 'node:fs';
import { CARTAS, TIPO, TIPO_NOMBRE, CLADO_NOMBRE, RAREZA_NOMBRE } from '../src/data/cards.js';

const RUTA = new URL('../RECOSTE.md', import.meta.url);
const CARDS = new URL('../src/data/cards.js', import.meta.url);
const esc = (t) => String(t).replace(/\|/g, '\\|');

/** Propuesta de partida: la escala 0–8 comprimida a 0–3. */
const PROPUESTA = { 0: 0, 1: 0, 2: 1, 3: 1, 4: 2, 5: 2, 6: 2, 7: 3, 8: 3 };

function escribir() {
  const filas = Object.values(CARTAS).map((c) => {
    const dino = c.tipo === TIPO.DINOSAURIO;
    return [
      c.id,
      c.binomial,
      dino ? CLADO_NOMBRE[c.clado] : TIPO_NOMBRE[c.tipo],
      RAREZA_NOMBRE[c.rareza],
      c.coste,
      PROPUESTA[c.coste] ?? c.coste,
      dino ? c.ataque : '',
      dino ? c.defensa : '',
      dino ? c.vida : '',
      c.rasgoNombre,
      esc(c.rasgoTexto),
    ].map((x) => ` ${x} `).join('|').replace(/^/, '|').replace(/$/, '|');
  });

  const cabecera = `# RECOSTE.md — la tabla editable del set

> La genera y la aplica \`node tools/tabla.mjs\`. **Edita sólo las columnas
> «Coste nuevo», «A», «D», «V», «Rasgo» y «Texto del rasgo»**: el id es la
> llave y las demás columnas se ignoran al aplicar.
>
> - \`node tools/tabla.mjs escribir\` regenera esta tabla desde el código.
> - \`node tools/tabla.mjs aplicar\` mete lo editado en \`src/data/cards.js\`.
>
> Después de aplicar hay que correr \`npm test\` y \`npm run sim\`: los números
> del balance salen de aquí.

## Por qué se recostea

Con la renta actual —la Biomasa vale el número de turno y no se acumula— cada
bando gasta **47 de Biomasa en 14,7 cartas** por partida, a un coste medio de
3,22. Si la renta pasa a **+1 acumulativo**, el presupuesto de la partida entera
baja a **11**: cuatro veces menos. Por eso la columna «Coste nuevo» arranca con
la escala 0–8 comprimida a **0–3**, que es la única que cabe en ese presupuesto.

La propuesta de partida es mecánica (0-1→0, 2-3→1, 4-6→2, 7-8→3). Lo que hay que
revisar a mano es lo que una regla no sabe: qué carta merece costar más que otra
del mismo tramo.

## Qué mide la propuesta mecánica

Aplicada tal cual, con la renta acumulativa de +1, sobre 800 partidas:

| Métrica | Hoy | Recoste 0–3 + renta +1 | Objetivo |
|---|---|---|---|
| Duración | 11,0 turnos | **9,6** | 10 – 14 |
| Victorias del inicial | 52,9 % | 49,0 % | 48 – 55 % |
| Bola de nieve | 61,5 % | 66,7 % | 55 – 70 % |
| Reparto trofeos/hábitat/extinción | 36/40/24 | **4 / 74 / 22** | cada una 15 – 60 % |
| Cartas descalibradas | 1 de 25 | **14 de 25** | 0 |
| Cartas jugadas por bando | 14,7 | 10,8 | — |

Tres objetivos fuera, y la causa es la misma en los tres: con un presupuesto de
doce Biomasas el campo se queda más vacío (1,86 unidades vivas por bando frente
a 2,24), así que **el hábitat cae antes de que dé tiempo a reunir ocho trofeos**
y el registro fósil casi desaparece como vía.

Eso no se arregla sólo con los costes: hay que mover también **trofeos para
ganar** y **vida del hábitat**, que son los dos números que fijan cuánto dura la
partida. Esa calibración va después de esta revisión, con el simulador, y es
trabajo mío: aquí sólo hacen falta los costes que tú consideres justos.

| id | Carta | Familia | Rareza | Coste actual | Coste nuevo | A | D | V | Rasgo | Texto del rasgo |
|---|---|---|---|---|---|---|---|---|---|---|
`;
  writeFileSync(RUTA, cabecera + filas.join('\n') + '\n');
  console.log(`RECOSTE.md escrito: ${filas.length} cartas`);
}

function aplicar() {
  const texto = readFileSync(RUTA, 'utf8');
  const filas = texto.split('\n')
    .filter((l) => l.startsWith('|') && !l.startsWith('| id') && !l.startsWith('|---'))
    // La fila empieza y acaba en «|», así que el primer y el último trozo del
    // split están vacíos: fuera los dos antes de leer columnas.
    .map((l) => l.split('|').slice(1, -1).map((x) => x.trim()))
    .filter((cols) => cols.length >= 11 && CARTAS[cols[0]]);

  if (filas.length === 0) throw new Error('RECOSTE.md no tiene filas reconocibles');

  let src = readFileSync(CARDS, 'utf8');
  let tocadas = 0;

  for (const cols of filas) {
    const [id, , , , , costeNuevo, a, d, v, rasgoNombre, rasgoTexto] = cols;
    const c = CARTAS[id];
    const bloque = bloqueDe(src, id);
    let nuevo = bloque;

    const num = (x) => (x === '' || Number.isNaN(Number(x)) ? null : Number(x));
    const coste = num(costeNuevo);
    if (coste !== null && coste !== c.coste) nuevo = sustituirCampo(nuevo, 'coste', coste);
    if (c.tipo === TIPO.DINOSAURIO) {
      for (const [campo, valor] of [['ataque', num(a)], ['defensa', num(d)], ['vida', num(v)]]) {
        if (valor !== null && valor !== c[campo]) nuevo = sustituirCampo(nuevo, campo, valor);
      }
    }
    if (rasgoNombre && rasgoNombre !== c.rasgoNombre) nuevo = sustituirTexto(nuevo, 'rasgoNombre', rasgoNombre);
    const textoLimpio = rasgoTexto.replace(/\\\|/g, '|');
    if (textoLimpio && textoLimpio !== c.rasgoTexto) nuevo = sustituirTexto(nuevo, 'rasgoTexto', textoLimpio);

    if (nuevo !== bloque) { src = src.replace(bloque, nuevo); tocadas += 1; }
  }

  writeFileSync(CARDS, src);
  console.log(`cards.js actualizado: ${tocadas} carta(s) con cambios`);
}

/** El trozo de cards.js que define una carta, de su id hasta el cierre. */
function bloqueDe(src, id) {
  const i = src.indexOf(`    id: '${id}',`);
  if (i < 0) throw new Error(`no encuentro la carta ${id} en cards.js`);
  const j = src.indexOf('  }),', i);
  return src.slice(i, j);
}

/**
 * Cambia un número de la carta. Si el campo no está escrito —los climas y los
 * recursos heredan su coste de la fábrica— se añade detrás del id, que es la
 * única línea que toda carta tiene seguro.
 */
const sustituirCampo = (bloque, campo, valor) => {
  const re = new RegExp(`(\\b${campo}: )\\d+`);
  if (re.test(bloque)) return bloque.replace(re, `$1${valor}`);
  return bloque.replace(/(id: '[a-z_]+',)/, `$1 ${campo}: ${valor},`);
};

const sustituirTexto = (bloque, campo, valor) => {
  const re = new RegExp(`(\\b${campo}: ')(?:[^'\\\\]|\\\\.)*(')`);
  if (!re.test(bloque)) throw new Error(`el campo ${campo} no está escrito en la carta`);
  return bloque.replace(re, `$1${valor.replace(/'/g, "\\'")}$2`);
};

const orden = process.argv[2];
if (orden === 'escribir') escribir();
else if (orden === 'aplicar') aplicar();
else console.log('uso: node tools/tabla.mjs escribir|aplicar');
