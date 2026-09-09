// DinoWar — Edge Function del asalto, versión CORTA para pegar a mano.
//
// Hace exactamente lo mismo que index.ts. La diferencia es de dónde saca el
// motor: en vez de llevarlo empaquetado dentro, lo importa del repositorio
// por URL, anclado a un commit CONCRETO. Anclado y no a una rama: así el
// servidor no puede cambiar de código sin que alguien lo decida.
//
// Existe para poder desplegar sin subir 115 KB de paquete.
//
// SÓLO hace asaltos. La función completa despacha además `victoria` y `sobre`;
// ésta los rechaza diciéndolo, en vez de contestar algo razonable a una
// petición que no sabe atender. Lo que NO se recorta es la comprobación de que
// el mazo sea tuyo: una versión corta más permisiva que la larga es un agujero
// esperando a que alguien despliegue la de repuesto.
//
// Los importes son ESTÁTICOS y con la URL literal repetida, por feo que quede.
// Con `await import(`${REPO}/...`)` la ruta se calcula en tiempo de ejecución,
// el empaquetado del despliegue no puede verla y el módulo no viaja: la función
// arranca y muere con «Module not found» AUNQUE LA URL CONTESTE 200. Costó
// verlo porque todo lo demás —el commit, la URL, el contenido— estaba bien.
//
// Motor anclado en: fd0d31e9558c5bbfbccaf78da58804618b58ad4d

import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  validarAsalto, jefeDelEvento, AsaltoInvalido,
} from 'https://cdn.jsdelivr.net/gh/DanielD-S/DinoWar@fd0d31e9558c5bbfbccaf78da58804618b58ad4d/supabase/functions/_compartido/validarAsalto.js';
import { CUENCA } from 'https://cdn.jsdelivr.net/gh/DanielD-S/DinoWar@fd0d31e9558c5bbfbccaf78da58804618b58ad4d/src/data/tribu.js';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (cuerpo: unknown, status = 200) => new Response(
  JSON.stringify(cuerpo),
  { status, headers: { ...cors, 'Content-Type': 'application/json' } },
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'sólo POST' }, 405);

  // Quién eres lo dice el JWT, nunca el cuerpo de la petición.
  const auth = req.headers.get('Authorization');
  if (!auth) return json({ error: 'sin sesión' }, 401);

  const comoUsuario = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } } },
  );
  const { data: { user }, error: errAuth } = await comoUsuario.auth.getUser();
  if (errAuth || !user) return json({ error: 'sesión inválida' }, 401);

  let envio: Record<string, unknown>;
  try { envio = await req.json(); } catch { return json({ error: 'cuerpo ilegible' }, 400); }

  const tipo = (envio.tipo as string) ?? 'asalto';
  if (tipo !== 'asalto') {
    return json({ error: `esta versión sólo hace asaltos, no «${tipo}»` }, 501);
  }

  // Re-jugar la partida. El daño lo calcula el servidor; lo que diga el
  // cliente sobre el resultado no se lee.
  let resultado;
  try {
    resultado = validarAsalto(envio);
  } catch (e) {
    if (e instanceof AsaltoInvalido) return json({ error: e.message, detalle: e.detalle }, 422);
    throw e;
  }

  const { evento } = jefeDelEvento(envio.jefeEvento as string);

  const comoServicio = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: jugador } = await comoServicio
    .from('jugadores').select('tribu_id').eq('id', user.id).single();
  if (!jugador?.tribu_id) return json({ error: 'no estás en ninguna tribu' }, 409);

  // ¿Es TUYO ese mazo? `validarAsalto` sólo mira que sea legal; la propiedad se
  // comprueba contra tu colección, que vive en la base de datos.
  const { error: errMazo } = await comoServicio.rpc('validar_mazo_de', {
    p_jugador: user.id,
    p_cartas: Object.fromEntries((envio.mazo ?? []) as Array<[string, number]>),
  });
  if (errMazo) return json({ error: errMazo.message }, 422);

  const desde = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { count } = await comoServicio
    .from('asaltos').select('id', { count: 'exact', head: true })
    .eq('jugador_id', user.id).gte('jugado_en', desde);
  if ((count ?? 0) >= CUENCA.asaltosPorDia) {
    return json({ error: 'ya has hecho tus asaltos de hoy' }, 429);
  }

  const { data, error } = await comoServicio.rpc('aplicar_asalto', {
    p_tribu: jugador.tribu_id,
    p_evento: evento.id,
    p_jugador: user.id,
    p_semilla: envio.semilla,
    p_dano: resultado.dano,
    p_turnos: resultado.turnos,
    p_ganada: resultado.ganada,
    p_coste: CUENCA.costeAsalto,
  });

  if (error) {
    const yaCobrada = error.code === '23505';
    return json({ error: yaCobrada ? 'ese asalto ya se cobró' : error.message },
      yaCobrada ? 409 : 400);
  }

  const fila = Array.isArray(data) ? data[0] : data;
  return json({
    dano: resultado.dano,
    turnos: resultado.turnos,
    ganada: resultado.ganada,
    vida: fila?.vida ?? null,
    cayo: fila?.cayo ?? false,
    almacen: fila?.almacen ?? null,
  });
});
