// Genera y aplica RECOSTE.md, la tabla editable del set.
//
//   node tools/tabla.mjs escribir   → vuelca las 31 cartas a RECOSTE.md
//   node tools/tabla.mjs aplicar    → lee RECOSTE.md y lo mete en src/data/cards.js
//
// La tabla es la fuente para una revisión a mano: se edita ahí y se aplica de
// vuelta, en vez de tocar treinta y una cartas en el código una por una. Sólo
// se aplican las columnas numéricas y los textos; el id nunca cambia.
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CARTAS, TIPO, TIPO_NOMBRE, CLADO_NOMBRE, RAREZA, RAREZA_NOMBRE } from '../src/data/cards.js';
import { BALANCE } from '../src/data/balance.js';

/** Del nombre que se lee en la tabla a la constante del código. */
const RAREZA_DE = Object.fromEntries(
  Object.entries(RAREZA_NOMBRE).map(([clave, nombre]) => [nombre.toLowerCase(), clave]),
);

const RUTA = new URL('../RECOSTE.md', import.meta.url);
const CARDS = new URL('../src/data/cards.js', import.meta.url);
const esc = (t) => String(t).replace(/\|/g, '\\|');


function escribir() {
  const filas = Object.values(CARTAS).map((c) => {
    const dino = c.tipo === TIPO.DINOSAURIO;
    return [
      c.id,
      c.binomial,
      dino ? CLADO_NOMBRE[c.clado] : TIPO_NOMBRE[c.tipo],
      RAREZA_NOMBRE[c.rareza],
      c.coste,
      // «Coste nuevo» arranca igual que el actual: la tabla es un espejo del
      // set, no una propuesta. Cuando llevaba una regla de compresión, volver
      // a generarla después de aplicarla la aplicaba otra vez y los costes
      // bajaban solos en cada vuelta.
      c.coste,
      dino ? c.ataque : '',
      dino ? c.vida : '',
      c.rasgoNombre,
      esc(c.rasgoTexto),
      '',
    ].map((x) => ` ${x} `).join('|').replace(/^/, '|').replace(/$/, '|');
  });

  const cabecera = `# RECOSTE.md — la tabla editable del set

> La genera y la aplica \`node tools/tabla.mjs\`. **Edita «Rareza», «Coste
> nuevo», «A», «V», «Rasgo» y «Texto del rasgo»**: el id es la llave, y
> «Carta», «Familia» y «Coste actual» son de referencia y se ignoran.
>
> Cambiar la rareza mueve tres cosas a la vez: cuántas copias caben en un mazo,
> cada cuánto sale la carta en un sobre y lo que da al fundirla. Si el mazo de
> referencia deja de ser legal, \`aplicar\` lo dice y no escribe nada.
>
> - \`node tools/tabla.mjs escribir\` regenera esta tabla desde el código.
> - \`node tools/tabla.mjs aplicar\` mete lo editado en \`src/data/cards.js\`.
>
> Si prefieres editarla en una hoja de cálculo, \`python tools/excel.py escribir\`
> la saca a \`RECOSTE.xlsx\` y \`python tools/excel.py leer\` la trae de vuelta aquí.
>
> Después de aplicar hay que correr \`npm test\` y \`npm run sim\`: los números
> del balance salen de aquí.

## Qué es esta tabla

Es un espejo del set: lo que hay en \`src/data/cards.js\` ahora mismo. «Coste
nuevo» arranca igual que «Coste actual» y lo que escribas ahí es lo que se
aplica.

**«Texto del rasgo» es lo que la carta DICE, no lo que HACE.** Lo que hace sale
de una constante del código sobre la que el motor decide en sesenta sitios; el
texto sólo se pinta. Así que editarlo sirve para redactar mejor una regla que
ya existe, y si se le escribe una regla distinta la carta seguirá haciendo lo
de antes y el texto mentirá.

Para pedir una regla distinta está **«Mecánica nueva»**: se escribe ahí, en
lenguaje llano, qué debería hacer la carta. Esa columna no la aplica ninguna
herramienta —hay que escribirla en el motor y medirla—, pero \`aplicar\` la lee
y la lista al terminar para que no se quede olvidada.

La renta es de **${BALANCE.rentaPorTurno} de Biomasa por turno acumulativa**, con un
tope de ${BALANCE.rentaTope} de ahorro. En una partida de trece turnos eso son unas
${BALANCE.rentaPorTurno * 13} Biomasas para las once cartas que se llegan a desplegar, así que
**el coste medio de una carta debería rondar el 2**, no el 1.

Y la curva tiene que ser más que proporcional. Robas una carta por turno y ganas
${BALANCE.rentaPorTurno} de Biomasa, así que una carta de coste 4 te cuesta dos turnos de renta
**y** una de tus cinco ranuras, mientras que cuatro de coste 1 tapan cuatro
carriles. Para que valga la pena, el cuerpo (A+D+V) tiene que crecer más deprisa
que el coste; la escala medida que funciona es del orden de **4 / 9 / 15 / 22**
para costes de 1 a 4.

Esto no es teoría: con renta 1 el índice de calibración era casi una función del
coste —1,31 para el coste 0 y 0,10 para *Torvosaurus*, que costaba 4— y quince
cartas se salían de banda. Subir el robo en vez de la renta lo empeoraba, lo que
confirma que el problema era la proporción entre cartas y Biomasa, no que
faltaran recursos.

Cambiar la **rareza** mueve tres cosas a la vez: cuántas copias caben en un mazo
(3 común y rara, 2 épica, 1 legendaria), cada cuánto sale la carta en un sobre
—las probabilidades salen de la forma del set, así que mover una carta reajusta
la tabla entera— y lo que da al fundirla.

## Lo que hay que mirar después

Al aplicar, \`aplicar\` comprueba que el mazo de referencia siga siendo legal y
que no se quede ninguna rareza vacía; si algo falla no escribe nada. Después hay
que correr \`npm test\` y \`npm run sim\`: los seis objetivos del balance salen de
estos números, y el que hoy falla —cartas descalibradas— es justo el que esta
revisión viene a arreglar.

| id | Carta | Familia | Rareza | Coste actual | Coste nuevo | A | V | Rasgo | Texto del rasgo | Mecánica nueva |
|---|---|---|---|---|---|---|---|---|---|---|---|
`;
  writeFileSync(RUTA, cabecera + filas.join('\n') + '\n');
  console.log(`RECOSTE.md escrito: ${filas.length} cartas`);
}

function aplicar() {
  const texto = readFileSync(RUTA, 'utf8');
  const filas = texto.split('\n')
    .filter((l) => l.startsWith('|') && !l.startsWith('| id') && !l.startsWith('|---'))
    // La fila empieza y acaba en «|», así que el primer y el último trozo del
    // split están vacíos: fuera los dos antes de leer columnas. La barra
    // escapada («\\|») va dentro de una celda y no la parte.
    .map((l) => l.split(/(?<!\\)\|/).slice(1, -1).map((x) => x.trim()))
    .filter((cols) => cols.length >= 10 && CARTAS[cols[0]]);

  if (filas.length === 0) throw new Error('RECOSTE.md no tiene filas reconocibles');

  let src = readFileSync(CARDS, 'utf8');
  let tocadas = 0;
  // «Mecánica nueva» no se puede aplicar: describe algo que el motor todavía no
  // sabe hacer. Se recoge y se avisa, porque una carta con la mecánica escrita
  // y sin implementar es justo el desajuste que esta columna viene a evitar.
  const pedidos = [];

  for (const cols of filas) {
    const [id, , , rarezaTexto, , costeNuevo, a, v, rasgoNombre, rasgoTexto, mecanica] = cols;
    if (mecanica) pedidos.push(`${id}: ${mecanica}`);
    const c = CARTAS[id];
    const bloque = bloqueDe(src, id);
    let nuevo = bloque;

    const rareza = RAREZA_DE[rarezaTexto.trim().toLowerCase()];
    if (rarezaTexto && !rareza) {
      throw new Error(`«${rarezaTexto}» no es una rareza (${id}). Válidas: ${Object.values(RAREZA_NOMBRE).join(', ')}`);
    }
    if (rareza && rareza !== c.rareza) nuevo = sustituirConstante(nuevo, 'rareza', `RAREZA.${rareza}`);

    const num = (x) => (x === '' || Number.isNaN(Number(x)) ? null : Number(x));
    const coste = num(costeNuevo);
    if (coste !== null && coste !== c.coste) nuevo = sustituirCampo(nuevo, 'coste', coste);
    if (c.tipo === TIPO.DINOSAURIO) {
      for (const [campo, valor] of [['ataque', num(a)], ['vida', num(v)]]) {
        if (valor !== null && valor !== c[campo]) nuevo = sustituirCampo(nuevo, campo, valor);
      }
    }
    if (rasgoNombre && rasgoNombre !== c.rasgoNombre) nuevo = sustituirTexto(nuevo, 'rasgoNombre', rasgoNombre);
    const textoLimpio = rasgoTexto.replace(/\\\|/g, '|');
    if (textoLimpio && textoLimpio !== c.rasgoTexto) nuevo = sustituirTexto(nuevo, 'rasgoTexto', textoLimpio);

    if (nuevo !== bloque) { src = src.replace(bloque, nuevo); tocadas += 1; }
  }

  comprobar(src);
  writeFileSync(CARDS, src);
  console.log(`cards.js actualizado: ${tocadas} carta(s) con cambios`);

  if (pedidos.length) {
    console.log(`\n${pedidos.length} carta(s) piden mecánica nueva. Eso NO lo aplica esta`);
    console.log('herramienta: hay que escribirlo en el motor y medirlo.\n');
    for (const p of pedidos) console.log(`  · ${p}`);
    console.log('');
  }
}

/**
 * Carga el set resultante antes de escribirlo. balance.js valida el mazo de
 * referencia al importarse, así que si una rareza nueva deja el mazo con más
 * copias de las que admite, esto salta y cards.js se queda como estaba: mejor
 * negarse que dejar el repositorio sin arrancar.
 *
 * Va en un proceso aparte a propósito. Importar aquí con un sello de caché no
 * sirve: balance.js pide `./cards.js` sin sello y se le entrega el módulo ya
 * cargado, así que la comprobación miraba el set viejo y daba el visto bueno
 * a cualquier cosa. Un proceso nuevo empieza con el registro vacío.
 */
function comprobar(src) {
  const previo = readFileSync(CARDS, 'utf8');
  writeFileSync(CARDS, src);

  const guion = "const {CARTAS} = await import('../src/data/cards.js');"
    + "await import('../src/data/balance.js');"
    + "const {POR_RAREZA} = await import('../src/data/coleccion.js');"
    + "const v = Object.entries(POR_RAREZA).filter(([,i]) => i.length === 0).map(([r]) => r);"
    + "if (v.length) throw new Error('ninguna carta queda en: ' + v.join(', '));"
    + "console.log(Object.keys(CARTAS).length);";
  // fileURLToPath y no .pathname: en Windows el pathname de un file:// es
  // «/C:/…», con barra delante, que no es una ruta válida. spawnSync fallaba
  // sin llegar a lanzar nada, devolvía stderr vacío y el mensaje de error que
  // salía era el de leer ese vacío, no el del problema real.
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', guion],
    { cwd: fileURLToPath(new URL('.', import.meta.url)), encoding: 'utf8' });

  if (r.error) {
    writeFileSync(CARDS, previo);
    throw new Error(`no se pudo lanzar la comprobación: ${r.error.message}`);
  }
  if (r.status !== 0) {
    writeFileSync(CARDS, previo);
    // Del volcado del subproceso interesa la línea del error, no su pila.
    const motivo = (r.stderr || '').split('\n')
      .find((l) => /^\s*(?:[A-Za-z]*Error):/.test(l))?.replace(/^\s*[A-Za-z]*Error:\s*/, '');
    throw new Error(`la tabla deja el set incoherente y no se ha escrito nada.\n  ${motivo ?? r.stderr.trim()}`);
  }
  console.log(`comprobado: ${r.stdout.trim()} cartas, mazo de referencia legal`);
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

/** Cambia un campo cuyo valor es una constante del código, como RAREZA.EPICO. */
const sustituirConstante = (bloque, campo, valor) => {
  const re = new RegExp(`(\\b${campo}: )[A-Z_]+\\.[A-Z_]+`);
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
else if (orden === 'aplicar') {
  // Un error de la tabla es del usuario, no del programa: el mensaje basta.
  try { aplicar(); } catch (e) { console.error(`\n${e.message}\n`); process.exit(1); }
}
else console.log('uso: node tools/tabla.mjs escribir|aplicar');
