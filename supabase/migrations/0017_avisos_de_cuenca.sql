-- DinoWar — lo que te está esperando en la cuenca.
--
-- La capa cooperativa no avisaba de nada. Te aceptaban la solicitud, te
-- echaban, caía el jefe y tenías una carta esperando, alguien llamaba a tu
-- puerta — y sólo lo veías si entrabas a mirar. Con una tribu de una persona
-- daba igual; con gente de verdad, un capataz puede tener a alguien esperando
-- días sin enterarse.
--
-- Esto devuelve LO QUE REQUIERE UNA ACCIÓN TUYA y nada más: cuántos piden
-- entrar —si mandas tú— y cuántas cartas de jefe tienes sin reclamar. Ni «hay
-- un jefe abierto» ni «te quedan asaltos hoy»: eso no es un aviso, es una
-- pulla, y un punto rojo permanente deja de significar nada en dos días.
--
-- Las cartas se cuentan de TODOS los jefes caídos, no sólo del de esta
-- ventana: un jefe que cae no vuelve a levantarse para esa tribu —`abrir_jefe`
-- no toca la fila si ya existe— así que una carta sin reclamar se queda ahí
-- para siempre. Por eso la pantalla también tiene que poder reclamarlas: un
-- aviso de algo que no se puede hacer es un punto rojo que no se apaga.
--
-- Aplicada en producción el 14-09-2026.
create or replace function public.avisos_cuenca()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_tribu uuid := private.mi_tribu();
  v_mando boolean;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  if v_tribu is null then return jsonb_build_object('solicitudes', 0, 'cartas', 0); end if;

  select (j.rol = 'capataz') into v_mando from public.jugadores j where j.id = v_id;

  return jsonb_build_object(
    'solicitudes', case when v_mando
      then (select count(*) from public.solicitudes s where s.tribu_id = v_tribu)
      else 0 end,
    'cartas', (select count(*)
                 from public.aportes a
                 join public.jefes j2 on j2.tribu_id = a.tribu_id
                                     and j2.evento_id = a.evento_id
                where a.tribu_id = v_tribu and a.jugador_id = v_id
                  and a.dano > 0 and not a.reclamado and j2.vida <= 0));
end;
$$;

revoke all on function public.avisos_cuenca() from public, anon;
grant execute on function public.avisos_cuenca() to authenticated;
