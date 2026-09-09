-- DinoWar — catálogo de la cuenca. GENERADO por
-- `node tools/generar-catalogo.mjs` desde src/data/tribu.js y
-- src/data/eventos.js. **No editar a mano.**
--
-- Está aquí porque el servidor no puede fiarse del cliente para saber
-- cuánta vida tiene un jefe ni cuándo se abre su ventana: si eso llegara
-- en la petición, cualquiera abriría un jefe de 1 de vida. Un test
-- comprueba que este fichero es el que saldría hoy del código.

create table if not exists public.catalogo_eventos (
  evento_id   text primary key,
  tipo        text not null check (tipo in ('JEFE','CLIMA')),
  dia         int  not null check (dia >= 0),
  dura        int  not null check (dura > 0),
  jefe_id     text,
  vida_maxima bigint check (vida_maxima > 0),
  recompensa  text,
  titulo      text not null
);

-- Los números de la cuenca, en una sola fila. Que sea una tabla y no
-- constantes incrustadas permite cambiarlos sin volver a desplegar nada.
create table if not exists public.catalogo_cuenca (
  id                 int primary key default 1 check (id = 1),
  ciclo_dias         int not null,
  coste_asalto       int not null,
  asaltos_por_dia    int not null,
  nivel_maximo       int not null,
  miembros_maximo    int not null
);

-- Ritmo y depósito por nivel: se tabulan en vez de calcularse en SQL
-- para que la fórmula viva en un solo sitio, que es el JavaScript.
create table if not exists public.catalogo_yacimiento (
  nivel          int primary key,
  fosiles_hora   int not null,
  deposito       int not null,
  coste_mejora   bigint
);

truncate public.catalogo_eventos;
insert into public.catalogo_eventos (evento_id, tipo, dia, dura, jefe_id, vida_maxima, recompensa, titulo) values
  ('caza_saurophaganax', 'JEFE', 0, 5, 'saurophaganax', 6000, 'jefe_saurophaganax', 'La caza del Saurophaganax'),
  ('sequia_cuenca', 'CLIMA', 5, 2, null, null, null, 'La cuenca se seca'),
  ('manada_barosaurus', 'JEFE', 7, 5, 'barosaurus', 5000, 'jefe_barosaurus', 'La manada de Barosaurus'),
  ('crecida_cuenca', 'CLIMA', 12, 2, null, null, null, 'Crecida del canal');

truncate public.catalogo_cuenca;
insert into public.catalogo_cuenca (id, ciclo_dias, coste_asalto, asaltos_por_dia, nivel_maximo, miembros_maximo)
values (1, 14, 150, 5, 8, 8);

truncate public.catalogo_yacimiento;
insert into public.catalogo_yacimiento (nivel, fosiles_hora, deposito, coste_mejora) values
  (1, 12, 168, 300),
  (2, 18, 252, 1200),
  (3, 24, 336, 2700),
  (4, 30, 420, 4800),
  (5, 36, 504, 7500),
  (6, 42, 588, 10800),
  (7, 48, 672, 14700),
  (8, 54, 756, null);

-- El catálogo lo lee cualquiera que haya entrado: son las reglas del
-- juego, no datos de nadie. Escribirlo, sólo las migraciones.
alter table public.catalogo_eventos    enable row level security;
alter table public.catalogo_cuenca     enable row level security;
alter table public.catalogo_yacimiento enable row level security;

drop policy if exists "el catálogo es público" on public.catalogo_eventos;
create policy "el catálogo es público" on public.catalogo_eventos
  for select to authenticated using (true);
revoke insert, update, delete on public.catalogo_eventos from anon, authenticated;
revoke select on public.catalogo_eventos from anon;

drop policy if exists "el catálogo es público" on public.catalogo_cuenca;
create policy "el catálogo es público" on public.catalogo_cuenca
  for select to authenticated using (true);
revoke insert, update, delete on public.catalogo_cuenca from anon, authenticated;
revoke select on public.catalogo_cuenca from anon;

drop policy if exists "el catálogo es público" on public.catalogo_yacimiento;
create policy "el catálogo es público" on public.catalogo_yacimiento
  for select to authenticated using (true);
revoke insert, update, delete on public.catalogo_yacimiento from anon, authenticated;
revoke select on public.catalogo_yacimiento from anon;
