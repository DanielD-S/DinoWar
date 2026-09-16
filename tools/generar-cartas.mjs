// DinoWar — genera la migración con el catálogo de CARTAS desde el código.
//
// Hermana de generar-catalogo.mjs y por el mismo motivo: el servidor tiene que
// poder decidir solo. Para saber si un mazo es legal necesita las rarezas; para
// saber si es TUYO necesita compararlo con tu colección; y para sembrar una
// cuenta nueva necesita saber con qué empieza un jugador. Nada de eso puede
// llegar en la petición, o el mazo se autoriza a sí mismo.
//
// Y si el mismo dato vive en los dos sitios, un día se contradicen. Por eso el
// SQL se GENERA del JavaScript y un test comprueba que el fichero versionado es
// el que saldría hoy. La fuente de verdad sigue siendo src/data/.
//
//   node tools/generar-cartas.mjs
//
// Escribe supabase/migrations/0006_catalogo_cartas.sql.

import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { CARTAS, CARTAS_DE_JEFE } from '../src/data/cards.js';
import { BALANCE } from '../src/data/balance.js';
import { ECONOMIA, coleccionInicial } from '../src/data/coleccion.js';
import { limiteDe } from '../src/data/coleccion.js';
import { MAZOS_INICIALES } from '../src/data/iniciales.js';
import { COSMETICOS } from '../src/data/cosmeticos.js';
import { CRAFTEO } from '../src/data/crafteo.js';

export const SALIDA = 'supabase/migrations/0006_catalogo_cartas.sql';

const sql = (s) => `'${String(s).replace(/'/g, "''")}'`;

/**
 * Las cartas que un jugador puede POSEER: el set más las de jefe. Las de
 * CARTAS_ECONOMIA quedan fuera a propósito —sólo existen dentro de la variante
 * por cartas, no se ganan ni se coleccionan— y por eso tampoco están aquí.
 */
export function coleccionables() {
  return [
    ...Object.values(CARTAS).map((c) => ({ ...c, jefe: false })),
    ...Object.values(CARTAS_DE_JEFE).map((c) => ({ ...c, jefe: true })),
  ];
}

/**
 * Mazos guardados por jugador. El número sale de aquí y no de balance.js porque
 * no es una regla del juego: es cuánto se le deja guardar a una cuenta. Coincide
 * con el tope que ya aplicaba el almacén local.
 */
export const MAZOS_MAXIMO = 12;

export function generar() {
  const L = [];
  L.push('-- DinoWar — catálogo de cartas. GENERADO por');
  L.push('-- `node tools/generar-cartas.mjs` desde src/data/cards.js,');
  L.push('-- src/data/balance.js y src/data/coleccion.js. **No editar a mano.**');
  L.push('--');
  L.push('-- El servidor necesita esto para tres cosas que no puede preguntarle al');
  L.push('-- cliente: si un mazo respeta las rarezas, si las cartas que lleva son');
  L.push('-- tuyas de verdad, y con qué colección empieza una cuenta nueva. Un test');
  L.push('-- comprueba que este fichero es el que saldría hoy del código.');
  L.push('');

  L.push('create table if not exists public.catalogo_cartas (');
  L.push('  card_id      text primary key,');
  L.push('  tipo         text not null,');
  L.push('  rareza       text not null,');
  L.push('  -- Copias que caben en un mazo. Es a la vez el límite de construcción y');
  L.push('  -- la escala de rareza: la misma regla mirada desde dos sitios.');
  L.push('  copias_max   int  not null check (copias_max > 0),');
  L.push('  valor_fusion int  not null check (valor_fusion >= 0),');
  L.push('  -- Las de jefe se ganan cooperando, no salen en sobres y no se funden.');
  L.push('  es_jefe      boolean not null default false');
  L.push(');');
  L.push('');
  L.push('-- Con qué colección empieza una cuenta. Es justo el mazo de referencia:');
  L.push('-- lo necesario para jugar desde el primer minuto y ni una carta más.');
  L.push('create table if not exists public.catalogo_inicial (');
  L.push('  card_id  text primary key references public.catalogo_cartas (card_id),');
  L.push('  copias   int not null check (copias > 0)');
  L.push(');');
  L.push('');
  L.push('-- Los mazos iniciales: uno se elige al crear la cuenta y es la colección');
  L.push('-- de salida entera. `private.sembrar_inicial` (0023) lee de aquí; el');
  L.push('-- cliente sólo manda el id del mazo. Sale de src/data/iniciales.js.');
  L.push('create table if not exists public.catalogo_iniciales (');
  L.push('  mazo     text not null,');
  L.push('  nombre   text not null,');
  L.push('  card_id  text not null references public.catalogo_cartas (card_id),');
  L.push('  copias   int not null check (copias > 0),');
  L.push('  primary key (mazo, card_id)');
  L.push(');');
  L.push('');
  L.push('-- La tienda: lo que se vende y cuánto cuesta. `comprar_cosmetico` (0024) cobra');
  L.push('-- el precio de AQUÍ; el cliente sólo manda el id. Sale de src/data/cosmeticos.js.');
  L.push('create table if not exists public.catalogo_cosmeticos (');
  L.push('  id           text primary key,');
  L.push('  tipo         text not null,');
  L.push('  precio       int  not null check (precio >= 0),');
  L.push('  por_defecto  boolean not null default false');
  L.push(');');
  L.push('-- Lo exclusivo cuesta 0 y NO se compra ni es de todos: lo otorga un logro.');
  L.push('-- La columna llegó después de la tabla (0027), de ahí el `add column`.');
  L.push('alter table public.catalogo_cosmeticos');
  L.push('  add column if not exists exclusivo boolean not null default false;');
  L.push('');
  L.push('-- Los precios, en una fila. Que sean una tabla y no constantes en el SQL');
  L.push('-- permite tocarlos sin volver a desplegar nada.');
  L.push('create table if not exists public.catalogo_economia (');
  L.push('  id                int primary key default 1 check (id = 1),');
  L.push('  precio_sobre      int not null,');
  L.push('  cartas_por_sobre  int not null,');
  L.push('  monedas_inicio    int not null,');
  L.push('  monedas_victoria  int not null,');
  L.push('  monedas_derrota   int not null,');
  L.push('  tamano_mazo       int not null,');
  L.push('  mazos_maximo      int not null');
  L.push(');');
  L.push('');
  L.push('-- Criaturas legendarias que caben en un mazo, entre todas. La columna');
  L.push('-- llegó después de la tabla, de ahí el `add column`: sin él una base ya');
  L.push('-- creada se queda sin ella y `validar_mazo` no puede leer el tope.');
  L.push('alter table public.catalogo_economia');
  L.push(`  add column if not exists legendarias_dino_max int not null default ${BALANCE.legendariasDinoPorMazo};`);
  L.push('');
  L.push('-- El crafteo: cuántas esquirlas da fundir una copia sobrante y cuántas cuesta');
  L.push('-- crear una, por rareza. `fundir_excedente` y `crear_carta` (0029) leen de');
  L.push('-- AQUÍ; el cliente sólo manda el id. Sale de src/data/crafteo.js.');
  L.push('create table if not exists public.catalogo_crafteo (');
  L.push('  rareza  text primary key,');
  L.push('  fundir  int not null check (fundir > 0),');
  L.push('  crear   int not null check (crear > 0)');
  L.push(');');
  L.push('');

  // NADA DE `truncate`. Aquí hubo un `truncate public.catalogo_cartas cascade`
  // y era una bomba: `coleccion` tiene una clave foránea contra esta tabla, así
  // que el cascade se habría llevado por delante las cartas de TODOS los
  // jugadores y habría dejado sus mazos guardados apuntando al vacío. Se
  // escribió con la base recién creada, cuando vaciarla no costaba nada, y
  // siguió ahí cuando ya había gente dentro.
  //
  // Lo que hay ahora se puede aplicar sobre una base viva y las veces que haga
  // falta: mete o actualiza cada fila, y borra sólo las que ya no están en el
  // set. El `delete` va con su propia red — si una carta que desaparece está en
  // la colección de alguien, la clave foránea lo para en vez de tragárselo.
  const cartas = coleccionables();
  L.push('insert into public.catalogo_cartas (card_id, tipo, rareza, copias_max, valor_fusion, es_jefe) values');
  L.push(`${cartas.map((c) => `  (${sql(c.id)}, ${sql(c.tipo)}, ${sql(c.rareza)}, `
    + `${limiteDe(c.id)}, ${ECONOMIA.fusion[c.rareza]}, ${c.jefe})`).join(',\n')}`);
  L.push('on conflict (card_id) do update set');
  L.push('  tipo = excluded.tipo, rareza = excluded.rareza,');
  L.push('  copias_max = excluded.copias_max, valor_fusion = excluded.valor_fusion,');
  L.push('  es_jefe = excluded.es_jefe;');
  L.push('');
  L.push('insert into public.catalogo_inicial (card_id, copias) values');
  const inicial = Object.entries(coleccionInicial());
  L.push(`${inicial.map(([id, n]) => `  (${sql(id)}, ${n})`).join(',\n')}`);
  L.push('on conflict (card_id) do update set copias = excluded.copias;');
  L.push('');
  L.push('delete from public.catalogo_inicial where card_id not in (');
  L.push(`${inicial.map(([id]) => `  ${sql(id)}`).join(',\n')}`);
  L.push(');');
  L.push('');

  // Los iniciales, con la misma regla: insertar o actualizar, y borrar sólo lo
  // que ya no está. Nunca `truncate`: un día un mazo inicial cambia y los
  // jugadores que ya lo eligieron no tienen nada que ver con esta tabla, pero
  // la costumbre de vaciar tablas es la que casi se lleva la colección entera.
  const filas = MAZOS_INICIALES.flatMap((m) => m.mazo.map(([id, n]) => ({ m, id, n })));
  L.push('insert into public.catalogo_iniciales (mazo, nombre, card_id, copias) values');
  L.push(`${filas.map(({ m, id, n }) => `  (${sql(m.id)}, ${sql(m.nombre)}, ${sql(id)}, ${n})`).join(',\n')}`);
  L.push('on conflict (mazo, card_id) do update set nombre = excluded.nombre, copias = excluded.copias;');
  L.push('');
  L.push('delete from public.catalogo_iniciales where (mazo, card_id) not in (values');
  L.push(`${filas.map(({ m, id }) => `  (${sql(m.id)}, ${sql(id)})`).join(',\n')}`);
  L.push(');');
  L.push('');

  // La tienda. Un artículo que desaparece del código se borra de aquí, y si
  // alguien lo compró la clave foránea de `jugador_cosmeticos` lo impide: no se
  // le quita a nadie lo que pagó por un cambio en el catálogo.
  L.push('insert into public.catalogo_cosmeticos (id, tipo, precio, por_defecto, exclusivo) values');
  L.push(`${COSMETICOS.map((c) => `  (${sql(c.id)}, ${sql(c.tipo)}, ${c.precio}, ${!!c.porDefecto}, ${!!c.exclusivo})`).join(',\n')}`);
  L.push('on conflict (id) do update set tipo = excluded.tipo, precio = excluded.precio,');
  L.push('  por_defecto = excluded.por_defecto, exclusivo = excluded.exclusivo;');
  L.push('');
  L.push('delete from public.catalogo_cosmeticos where id not in (');
  L.push(`${COSMETICOS.map((c) => `  ${sql(c.id)}`).join(',\n')}`);
  L.push(');');
  L.push('');

  L.push('insert into public.catalogo_crafteo (rareza, fundir, crear) values');
  L.push(`${Object.keys(CRAFTEO.crear).map((r) => `  (${sql(r)}, ${CRAFTEO.fundir[r]}, ${CRAFTEO.crear[r]})`).join(',\n')}`);
  L.push('on conflict (rareza) do update set fundir = excluded.fundir, crear = excluded.crear;');
  L.push('');

  // Las bajas de cartas van al final y en este orden: `catalogo_inicial` apunta
  // a `catalogo_cartas`, así que quitar del set una carta que todavía figura en
  // la colección de salida fallaría contra su propia clave foránea.
  L.push('delete from public.catalogo_cartas where card_id not in (');
  L.push(`${cartas.map((c) => `  ${sql(c.id)}`).join(',\n')}`);
  L.push(');');
  L.push('');


  L.push('insert into public.catalogo_economia');
  L.push('  (id, precio_sobre, cartas_por_sobre, monedas_inicio, monedas_victoria,');
  L.push('   monedas_derrota, tamano_mazo, mazos_maximo, legendarias_dino_max)');
  L.push(`values (1, ${ECONOMIA.precioSobre}, ${ECONOMIA.cartasPorSobre}, `
    + `${ECONOMIA.monedasInicio}, ${ECONOMIA.monedasVictoria}, `
    + `${ECONOMIA.monedasDerrota}, ${BALANCE.tamanoMazo}, ${MAZOS_MAXIMO}, `
    + `${BALANCE.legendariasDinoPorMazo})`);
  L.push('on conflict (id) do update set');
  L.push('  precio_sobre = excluded.precio_sobre,');
  L.push('  cartas_por_sobre = excluded.cartas_por_sobre,');
  L.push('  monedas_inicio = excluded.monedas_inicio,');
  L.push('  monedas_victoria = excluded.monedas_victoria,');
  L.push('  monedas_derrota = excluded.monedas_derrota,');
  L.push('  tamano_mazo = excluded.tamano_mazo,');
  L.push('  mazos_maximo = excluded.mazos_maximo,');
  L.push('  legendarias_dino_max = excluded.legendarias_dino_max;');
  L.push('');

  L.push('-- El catálogo lo lee cualquiera que haya entrado: son las reglas del');
  L.push('-- juego, no datos de nadie. Escribirlo, sólo las migraciones.');
  for (const t of ['catalogo_cartas', 'catalogo_inicial', 'catalogo_iniciales', 'catalogo_cosmeticos', 'catalogo_crafteo', 'catalogo_economia']) {
    L.push(`alter table public.${t} enable row level security;`);
    L.push(`drop policy if exists "el catálogo es público" on public.${t};`);
    L.push(`create policy "el catálogo es público" on public.${t}`);
    L.push('  for select to authenticated using (true);');
    L.push(`revoke insert, update, delete on public.${t} from anon, authenticated;`);
    L.push(`revoke select on public.${t} from anon;`);
    L.push('');
  }
  return `${L.join('\n')}`;
}

// Ejecutado directamente y no importado. Va con pathToFileURL porque en Windows
// `process.argv[1]` llega con barras invertidas y la comparación contra
// `file://` + la ruta no se cumplía nunca: la herramienta corría, no escribía
// nada y no se quejaba. Y con la guarda de que argv[1] exista, porque con
// `node -e` o al importarlo desde un test no hay ruta que convertir y
// pathToFileURL(undefined) lanza.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const sqlTexto = generar();
  writeFileSync(SALIDA, sqlTexto);
  process.stdout.write(`→ ${SALIDA} · ${sqlTexto.split('\n').length} líneas\n`);
}
