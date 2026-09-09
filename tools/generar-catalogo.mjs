// DinoWar — genera la migración con el catálogo de la cuenca desde el código.
//
// El servidor necesita saber cosas que hoy sólo sabe el JavaScript: cuánta vida
// tiene cada jefe, cuándo se abre su ventana y a qué ritmo produce un
// yacimiento. Podría mandarlo el cliente, pero entonces cualquiera abriría un
// jefe de 1 de vida — así que tiene que estar en la base de datos.
//
// Y si está en los dos sitios, se acaban contradiciendo. Por eso el SQL se
// GENERA del JavaScript y un test comprueba que el fichero versionado es el que
// saldría hoy. La fuente de verdad sigue siendo src/data/.
//
//   node tools/generar-catalogo.mjs
//
// Escribe supabase/migrations/0004_catalogo.sql.

import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { CUENCA, ritmoPorHora, depositoDe } from '../src/data/tribu.js';
import { CALENDARIO, JEFES, CICLO, TIPO_EVENTO } from '../src/data/eventos.js';

export const SALIDA = 'supabase/migrations/0004_catalogo.sql';

const sql = (s) => `'${String(s).replace(/'/g, "''")}'`;

export function generar() {
  const L = [];
  L.push('-- DinoWar — catálogo de la cuenca. GENERADO por');
  L.push('-- `node tools/generar-catalogo.mjs` desde src/data/tribu.js y');
  L.push('-- src/data/eventos.js. **No editar a mano.**');
  L.push('--');
  L.push('-- Está aquí porque el servidor no puede fiarse del cliente para saber');
  L.push('-- cuánta vida tiene un jefe ni cuándo se abre su ventana: si eso llegara');
  L.push('-- en la petición, cualquiera abriría un jefe de 1 de vida. Un test');
  L.push('-- comprueba que este fichero es el que saldría hoy del código.');
  L.push('');

  L.push('create table if not exists public.catalogo_eventos (');
  L.push('  evento_id   text primary key,');
  L.push('  tipo        text not null check (tipo in (\'JEFE\',\'CLIMA\')),');
  L.push('  dia         int  not null check (dia >= 0),');
  L.push('  dura        int  not null check (dura > 0),');
  L.push('  jefe_id     text,');
  L.push('  vida_maxima bigint check (vida_maxima > 0),');
  L.push('  recompensa  text,');
  L.push('  titulo      text not null');
  L.push(');');
  L.push('');
  L.push('-- Los números de la cuenca, en una sola fila. Que sea una tabla y no');
  L.push('-- constantes incrustadas permite cambiarlos sin volver a desplegar nada.');
  L.push('create table if not exists public.catalogo_cuenca (');
  L.push('  id                 int primary key default 1 check (id = 1),');
  L.push('  ciclo_dias         int not null,');
  L.push('  coste_asalto       int not null,');
  L.push('  asaltos_por_dia    int not null,');
  L.push('  nivel_maximo       int not null,');
  L.push('  miembros_maximo    int not null');
  L.push(');');
  L.push('');
  L.push('-- Ritmo y depósito por nivel: se tabulan en vez de calcularse en SQL');
  L.push('-- para que la fórmula viva en un solo sitio, que es el JavaScript.');
  L.push('create table if not exists public.catalogo_yacimiento (');
  L.push('  nivel          int primary key,');
  L.push('  fosiles_hora   int not null,');
  L.push('  deposito       int not null,');
  L.push('  coste_mejora   bigint');
  L.push(');');
  L.push('');

  L.push('truncate public.catalogo_eventos;');
  L.push('insert into public.catalogo_eventos (evento_id, tipo, dia, dura, jefe_id, vida_maxima, recompensa, titulo) values');
  const filas = CALENDARIO.map((e) => {
    const j = e.tipo === TIPO_EVENTO.JEFE ? JEFES[e.jefe] : null;
    return `  (${sql(e.id)}, ${sql(e.tipo)}, ${e.dia}, ${e.dura}, `
      + `${j ? sql(j.id) : 'null'}, ${j ? j.vidaMaxima : 'null'}, `
      + `${j ? sql(j.recompensa) : 'null'}, ${sql(e.titulo)})`;
  });
  L.push(`${filas.join(',\n')};`);
  L.push('');

  L.push('truncate public.catalogo_cuenca;');
  L.push('insert into public.catalogo_cuenca (id, ciclo_dias, coste_asalto, asaltos_por_dia, nivel_maximo, miembros_maximo)');
  L.push(`values (1, ${CICLO}, ${CUENCA.costeAsalto}, ${CUENCA.asaltosPorDia}, ${CUENCA.nivelMaximo}, ${CUENCA.miembrosMaximo});`);
  L.push('');

  L.push('truncate public.catalogo_yacimiento;');
  L.push('insert into public.catalogo_yacimiento (nivel, fosiles_hora, deposito, coste_mejora) values');
  const niveles = [];
  for (let n = 1; n <= CUENCA.nivelMaximo; n++) {
    const coste = n >= CUENCA.nivelMaximo ? 'null' : CUENCA.costeMejora(n);
    niveles.push(`  (${n}, ${ritmoPorHora(n)}, ${depositoDe(n)}, ${coste})`);
  }
  L.push(`${niveles.join(',\n')};`);
  L.push('');

  L.push('-- El catálogo lo lee cualquiera que haya entrado: son las reglas del');
  L.push('-- juego, no datos de nadie. Escribirlo, sólo las migraciones.');
  L.push('alter table public.catalogo_eventos    enable row level security;');
  L.push('alter table public.catalogo_cuenca     enable row level security;');
  L.push('alter table public.catalogo_yacimiento enable row level security;');
  L.push('');
  for (const t of ['catalogo_eventos', 'catalogo_cuenca', 'catalogo_yacimiento']) {
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
