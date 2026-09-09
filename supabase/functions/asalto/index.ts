// DinoWar — Edge Function del asalto. La autoridad del juego vive aquí.
//
// Recibe la semilla, el mazo y TUS jugadas; re-juega la partida con el mismo
// motor que corrió en tu navegador y calcula el daño por su cuenta. Lo que el
// cliente diga sobre el resultado no se lee en ningún sitio.
//
// El motor se importa tal cual desde src/. Es JavaScript puro con módulos ES,
// sin DOM ni dependencias, así que Deno lo corre sin adaptarlo — que es
// exactamente lo que `test/pureza.test.js` lleva vigilando desde el principio.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  validarAsalto, jefeDelEvento, AsaltoInvalido,
} from '../_compartido/validarAsalto.js';
import { CUENCA } from '../../../src/data/tribu.js';

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

  // Quién eres lo dice el JWT, nunca el cuerpo de la petición. Un jugador_id
  // que viniera en el JSON sería un "soy quien yo diga".
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
  try {
    envio = await req.json();
  } catch {
    return json({ error: 'cuerpo ilegible' }, 400);
  }

  // 1. Re-jugar. Si la partida no cuadra, aquí se cae y no se escribe nada.
  let resultado;
  try {
    resultado = validarAsalto(envio);
  } catch (e) {
    if (e instanceof AsaltoInvalido) {
      return json({ error: e.message, detalle: e.detalle }, 422);
    }
    throw e;
  }

  const { evento } = jefeDelEvento(envio.jefeEvento as string);

  // 2. Escribir. Con la clave de servicio porque las tablas están cerradas a
  //    escritura para todo el mundo: el estado de juego sólo lo mueve el
  //    servidor, y sólo después de haber visto la partida entera.
  const comoServicio = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: jugador } = await comoServicio
    .from('jugadores').select('tribu_id').eq('id', user.id).single();
  if (!jugador?.tribu_id) return json({ error: 'no estás en ninguna tribu' }, 409);

  // 3. El tope diario se cuenta en el servidor. En el cliente sería un adorno.
  const desde = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { count } = await comoServicio
    .from('asaltos').select('id', { count: 'exact', head: true })
    .eq('jugador_id', user.id).gte('jugado_en', desde);
  if ((count ?? 0) >= CUENCA.asaltosPorDia) {
    return json({ error: 'ya has hecho tus asaltos de hoy' }, 429);
  }

  // 4. Una transacción: restar vida, cobrar el almacén y anotar el aporte no
  //    pueden quedarse a medias ni pisarse entre dos asaltos simultáneos.
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
    // Semilla repetida: la partida es válida, pero cobrarla dos veces no.
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
