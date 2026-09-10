-- DinoWar — catálogo de cartas. GENERADO por
-- `node tools/generar-cartas.mjs` desde src/data/cards.js,
-- src/data/balance.js y src/data/coleccion.js. **No editar a mano.**
--
-- El servidor necesita esto para tres cosas que no puede preguntarle al
-- cliente: si un mazo respeta las rarezas, si las cartas que lleva son
-- tuyas de verdad, y con qué colección empieza una cuenta nueva. Un test
-- comprueba que este fichero es el que saldría hoy del código.

create table if not exists public.catalogo_cartas (
  card_id      text primary key,
  tipo         text not null,
  rareza       text not null,
  -- Copias que caben en un mazo. Es a la vez el límite de construcción y
  -- la escala de rareza: la misma regla mirada desde dos sitios.
  copias_max   int  not null check (copias_max > 0),
  valor_fusion int  not null check (valor_fusion >= 0),
  -- Las de jefe se ganan cooperando, no salen en sobres y no se funden.
  es_jefe      boolean not null default false
);

-- Con qué colección empieza una cuenta. Es justo el mazo de referencia:
-- lo necesario para jugar desde el primer minuto y ni una carta más.
create table if not exists public.catalogo_inicial (
  card_id  text primary key references public.catalogo_cartas (card_id),
  copias   int not null check (copias > 0)
);

-- Los precios, en una fila. Que sean una tabla y no constantes en el SQL
-- permite tocarlos sin volver a desplegar nada.
create table if not exists public.catalogo_economia (
  id                int primary key default 1 check (id = 1),
  precio_sobre      int not null,
  cartas_por_sobre  int not null,
  monedas_inicio    int not null,
  monedas_victoria  int not null,
  monedas_derrota   int not null,
  tamano_mazo       int not null,
  mazos_maximo      int not null
);

insert into public.catalogo_cartas (card_id, tipo, rareza, copias_max, valor_fusion, es_jefe) values
  ('dryosaurus', 'DINOSAURIO', 'COMUN', 3, 4, false),
  ('ornitholestes', 'DINOSAURIO', 'COMUN', 3, 4, false),
  ('ceratosaurus', 'DINOSAURIO', 'COMUN', 3, 4, false),
  ('stegosaurus', 'DINOSAURIO', 'COMUN', 3, 4, false),
  ('allosaurus', 'DINOSAURIO', 'RARO', 3, 12, false),
  ('camarasaurus', 'DINOSAURIO', 'RARO', 3, 12, false),
  ('diplodocus', 'DINOSAURIO', 'RARO', 3, 12, false),
  ('apatosaurus', 'DINOSAURIO', 'RARO', 3, 12, false),
  ('torvosaurus', 'DINOSAURIO', 'EPICO', 2, 35, false),
  ('nodosaurus', 'DINOSAURIO', 'EPICO', 2, 35, false),
  ('riparovenator', 'DINOSAURIO', 'EPICO', 2, 35, false),
  ('lokiceratops', 'DINOSAURIO', 'EPICO', 2, 35, false),
  ('brachylophosaurus', 'DINOSAURIO', 'RARO', 3, 12, false),
  ('tyrannotitan', 'DINOSAURIO', 'LEGENDARIO', 1, 100, false),
  ('huaxiadraco', 'DINOSAURIO', 'RARO', 3, 12, false),
  ('gregarismo', 'EVENTO', 'RARO', 3, 12, false),
  ('gastrolitos', 'EVENTO', 'EPICO', 2, 35, false),
  ('crecimiento_acelerado', 'EVENTO', 'LEGENDARIO', 1, 100, false),
  ('neumaticidad', 'EVENTO', 'EPICO', 2, 35, false),
  ('fractura', 'EVENTO', 'EPICO', 2, 35, false),
  ('competencia', 'EVENTO', 'EPICO', 2, 35, false),
  ('trampa', 'EVENTO', 'RARO', 3, 12, false),
  ('mortandad', 'EVENTO', 'LEGENDARIO', 1, 100, false),
  ('rebrote', 'RECURSO', 'RARO', 3, 12, false),
  ('carrona', 'RECURSO', 'LEGENDARIO', 1, 100, false),
  ('lago', 'RECURSO', 'EPICO', 2, 35, false),
  ('llanura', 'CLIMA', 'EPICO', 2, 35, false),
  ('canal', 'CLIMA', 'LEGENDARIO', 1, 100, false),
  ('bosque', 'CLIMA', 'LEGENDARIO', 1, 100, false),
  ('aridez', 'CLIMA', 'LEGENDARIO', 1, 100, false),
  ('sabana', 'CLIMA', 'COMUN', 3, 4, false),
  ('plesiopleurodon', 'DINOSAURIO', 'EPICO', 2, 35, false),
  ('ojoraptorsaurus', 'DINOSAURIO', 'RARO', 3, 12, false),
  ('dromaeosaurus', 'DINOSAURIO', 'COMUN', 3, 4, false),
  ('athenar', 'DINOSAURIO', 'COMUN', 3, 4, false),
  ('sanjuansaurus', 'DINOSAURIO', 'RARO', 3, 12, false),
  ('suchomimus', 'DINOSAURIO', 'EPICO', 2, 35, false),
  ('eosinopteryx', 'DINOSAURIO', 'COMUN', 3, 4, false),
  ('troodon', 'DINOSAURIO', 'COMUN', 3, 4, false),
  ('carnotaurus', 'DINOSAURIO', 'EPICO', 2, 35, false),
  ('spinosaurus', 'DINOSAURIO', 'LEGENDARIO', 1, 100, false),
  ('mosasaurus', 'DINOSAURIO', 'LEGENDARIO', 1, 100, false),
  ('halszkaraptor', 'DINOSAURIO', 'RARO', 3, 12, false),
  ('tongtianlong', 'DINOSAURIO', 'COMUN', 3, 4, false),
  ('scanisaurus', 'DINOSAURIO', 'RARO', 3, 12, false),
  ('monolophosaurus', 'DINOSAURIO', 'RARO', 3, 12, false),
  ('invictarx', 'DINOSAURIO', 'RARO', 3, 12, false),
  ('medusaceratops', 'DINOSAURIO', 'EPICO', 2, 35, false),
  ('platyceratops', 'DINOSAURIO', 'COMUN', 3, 4, false),
  ('loricatosaurus', 'DINOSAURIO', 'COMUN', 3, 4, false),
  ('therizinosaurus', 'DINOSAURIO', 'COMUN', 3, 4, false),
  ('alaskacephale', 'DINOSAURIO', 'RARO', 3, 12, false),
  ('titanoceratops', 'DINOSAURIO', 'EPICO', 2, 35, false),
  ('atlasaurus', 'DINOSAURIO', 'EPICO', 2, 35, false),
  ('stegoceras', 'DINOSAURIO', 'COMUN', 3, 4, false),
  ('maiasaura', 'DINOSAURIO', 'LEGENDARIO', 1, 100, false),
  ('edmontosaurus', 'DINOSAURIO', 'LEGENDARIO', 1, 100, false),
  ('plateosauravus', 'DINOSAURIO', 'COMUN', 3, 4, false),
  ('gargoyleosaurus', 'DINOSAURIO', 'RARO', 3, 12, false),
  ('wendiceratops', 'DINOSAURIO', 'EPICO', 2, 35, false),
  ('antarctosaurus', 'DINOSAURIO', 'LEGENDARIO', 1, 100, false),
  ('liaoceratops', 'DINOSAURIO', 'COMUN', 3, 4, false),
  ('rhinorex', 'DINOSAURIO', 'EPICO', 2, 35, false),
  ('bienosaurus', 'DINOSAURIO', 'COMUN', 3, 4, false),
  ('shuangmiaosaurus', 'DINOSAURIO', 'COMUN', 3, 4, false),
  ('chasmosaurus', 'DINOSAURIO', 'COMUN', 3, 4, false),
  ('jefe_saurophaganax', 'DINOSAURIO', 'LEGENDARIO', 1, 100, true),
  ('jefe_barosaurus', 'DINOSAURIO', 'LEGENDARIO', 1, 100, true)
on conflict (card_id) do update set
  tipo = excluded.tipo, rareza = excluded.rareza,
  copias_max = excluded.copias_max, valor_fusion = excluded.valor_fusion,
  es_jefe = excluded.es_jefe;

insert into public.catalogo_inicial (card_id, copias) values
  ('dryosaurus', 3),
  ('ornitholestes', 3),
  ('ceratosaurus', 3),
  ('nodosaurus', 2),
  ('stegosaurus', 3),
  ('allosaurus', 2),
  ('camarasaurus', 2),
  ('riparovenator', 2),
  ('lokiceratops', 1),
  ('brachylophosaurus', 3),
  ('huaxiadraco', 2),
  ('diplodocus', 1),
  ('apatosaurus', 1),
  ('torvosaurus', 1),
  ('tyrannotitan', 1),
  ('gregarismo', 3),
  ('trampa', 3),
  ('rebrote', 3),
  ('gastrolitos', 2),
  ('fractura', 2),
  ('sabana', 1),
  ('aridez', 1),
  ('canal', 1),
  ('mortandad', 1),
  ('crecimiento_acelerado', 1),
  ('neumaticidad', 1),
  ('competencia', 1)
on conflict (card_id) do update set copias = excluded.copias;

delete from public.catalogo_inicial where card_id not in (
  'dryosaurus',
  'ornitholestes',
  'ceratosaurus',
  'nodosaurus',
  'stegosaurus',
  'allosaurus',
  'camarasaurus',
  'riparovenator',
  'lokiceratops',
  'brachylophosaurus',
  'huaxiadraco',
  'diplodocus',
  'apatosaurus',
  'torvosaurus',
  'tyrannotitan',
  'gregarismo',
  'trampa',
  'rebrote',
  'gastrolitos',
  'fractura',
  'sabana',
  'aridez',
  'canal',
  'mortandad',
  'crecimiento_acelerado',
  'neumaticidad',
  'competencia'
);

delete from public.catalogo_cartas where card_id not in (
  'dryosaurus',
  'ornitholestes',
  'ceratosaurus',
  'stegosaurus',
  'allosaurus',
  'camarasaurus',
  'diplodocus',
  'apatosaurus',
  'torvosaurus',
  'nodosaurus',
  'riparovenator',
  'lokiceratops',
  'brachylophosaurus',
  'tyrannotitan',
  'huaxiadraco',
  'gregarismo',
  'gastrolitos',
  'crecimiento_acelerado',
  'neumaticidad',
  'fractura',
  'competencia',
  'trampa',
  'mortandad',
  'rebrote',
  'carrona',
  'lago',
  'llanura',
  'canal',
  'bosque',
  'aridez',
  'sabana',
  'plesiopleurodon',
  'ojoraptorsaurus',
  'dromaeosaurus',
  'athenar',
  'sanjuansaurus',
  'suchomimus',
  'eosinopteryx',
  'troodon',
  'carnotaurus',
  'spinosaurus',
  'mosasaurus',
  'halszkaraptor',
  'tongtianlong',
  'scanisaurus',
  'monolophosaurus',
  'invictarx',
  'medusaceratops',
  'platyceratops',
  'loricatosaurus',
  'therizinosaurus',
  'alaskacephale',
  'titanoceratops',
  'atlasaurus',
  'stegoceras',
  'maiasaura',
  'edmontosaurus',
  'plateosauravus',
  'gargoyleosaurus',
  'wendiceratops',
  'antarctosaurus',
  'liaoceratops',
  'rhinorex',
  'bienosaurus',
  'shuangmiaosaurus',
  'chasmosaurus',
  'jefe_saurophaganax',
  'jefe_barosaurus'
);

insert into public.catalogo_economia
  (id, precio_sobre, cartas_por_sobre, monedas_inicio, monedas_victoria,
   monedas_derrota, tamano_mazo, mazos_maximo)
values (1, 100, 5, 240, 50, 0, 50, 12)
on conflict (id) do update set
  precio_sobre = excluded.precio_sobre,
  cartas_por_sobre = excluded.cartas_por_sobre,
  monedas_inicio = excluded.monedas_inicio,
  monedas_victoria = excluded.monedas_victoria,
  monedas_derrota = excluded.monedas_derrota,
  tamano_mazo = excluded.tamano_mazo,
  mazos_maximo = excluded.mazos_maximo;

-- El catálogo lo lee cualquiera que haya entrado: son las reglas del
-- juego, no datos de nadie. Escribirlo, sólo las migraciones.
alter table public.catalogo_cartas enable row level security;
drop policy if exists "el catálogo es público" on public.catalogo_cartas;
create policy "el catálogo es público" on public.catalogo_cartas
  for select to authenticated using (true);
revoke insert, update, delete on public.catalogo_cartas from anon, authenticated;
revoke select on public.catalogo_cartas from anon;

alter table public.catalogo_inicial enable row level security;
drop policy if exists "el catálogo es público" on public.catalogo_inicial;
create policy "el catálogo es público" on public.catalogo_inicial
  for select to authenticated using (true);
revoke insert, update, delete on public.catalogo_inicial from anon, authenticated;
revoke select on public.catalogo_inicial from anon;

alter table public.catalogo_economia enable row level security;
drop policy if exists "el catálogo es público" on public.catalogo_economia;
create policy "el catálogo es público" on public.catalogo_economia
  for select to authenticated using (true);
revoke insert, update, delete on public.catalogo_economia from anon, authenticated;
revoke select on public.catalogo_economia from anon;
