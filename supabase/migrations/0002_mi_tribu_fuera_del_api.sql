-- mi_tribu() estaba en `public`, y todo lo que vive en `public` es un endpoint
-- REST. No filtraba nada —devuelve TU propia tribu, vía auth.uid()— pero una
-- función SECURITY DEFINER publicada sin necesidad es superficie regalada.
-- Lo detectó el advisor de seguridad de Supabase al aplicar la 0001.
--
-- No se arregla revocando el EXECUTE: las políticas la llaman con los permisos
-- de quien consulta, así que revocarla las rompería. Se saca del esquema
-- expuesto: en `private` sigue siendo llamable desde las políticas y deja de
-- ser un endpoint.

create schema if not exists private;
revoke all on schema private from anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.mi_tribu()
returns uuid language sql stable security definer set search_path = public as $$
  select tribu_id from public.jugadores where id = auth.uid()
$$;

revoke all on function private.mi_tribu() from public, anon;
grant execute on function private.mi_tribu() to authenticated;

drop policy if exists "ves a los de tu tribu" on public.jugadores;
create policy "ves a los de tu tribu" on public.jugadores
  for select to authenticated
  using (id = (select auth.uid()) or (tribu_id is not null and tribu_id = private.mi_tribu()));

drop policy if exists "ves tu tribu" on public.tribus;
create policy "ves tu tribu" on public.tribus
  for select to authenticated using (id = private.mi_tribu());

drop policy if exists "ves los jefes de tu tribu" on public.jefes;
create policy "ves los jefes de tu tribu" on public.jefes
  for select to authenticated using (tribu_id = private.mi_tribu());

drop policy if exists "ves los aportes de tu tribu" on public.aportes;
create policy "ves los aportes de tu tribu" on public.aportes
  for select to authenticated using (tribu_id = private.mi_tribu());

drop policy if exists "ves los asaltos de tu tribu" on public.asaltos;
create policy "ves los asaltos de tu tribu" on public.asaltos
  for select to authenticated using (tribu_id = private.mi_tribu());

drop function if exists public.mi_tribu();
