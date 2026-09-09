-- Defensa en profundidad. Hoy nadie puede escribir porque no hay ninguna
-- política de INSERT/UPDATE/DELETE, y sin política RLS lo niega todo. Pero eso
-- descansa en una AUSENCIA: el día que alguien añada una política permisiva sin
-- pensarlo, el permiso ya estaba concedido y la puerta se abre sola.
--
-- Quitando el GRANT hacen falta DOS errores para abrir esa puerta en vez de uno.
-- El estado de juego lo escribe la Edge Function con la clave de servicio, que
-- se salta RLS y no necesita estos permisos.
revoke insert, update, delete on
  public.jugadores, public.tribus, public.yacimientos,
  public.jefes, public.aportes, public.asaltos
from anon, authenticated;

-- anon tampoco lee: no hay nada público en la cuenca.
revoke select on
  public.jugadores, public.tribus, public.yacimientos,
  public.jefes, public.aportes, public.asaltos
from anon;

revoke usage, select on all sequences in schema public from anon, authenticated;
