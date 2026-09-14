// DinoWar — el Duelo, del lado del cliente: la placa, la cola y el reto.
//
// Aquí vive lo que pasa ANTES de que empiece la partida —buscar rival, retar
// con código, esperar— y la costura de red con la Edge Function. La partida
// en sí la lleva main.js con el mismo tablero de siempre: lo único que cambia
// es que las jugadas van al servidor en vez de a `reduce()`, y que al pulsar
// Listo se espera a una persona en vez de a la máquina.
//
// La espera es una pregunta cada dos segundos y medio (`DUELO.sondeoMs`), con
// el mismo `fetch` que usa todo lo demás. No hay tiempo real porque el juego no
// lo necesita: el despliegue es simultáneo y a ciegas, y lo único que hay que
// sincronizar es «los dos han pulsado Listo».

import { CONFIG } from '../data/config.js';
import { DUELO } from '../data/duelo.js';
import { rangoDe, nombreDeRango, LIGAS } from '../data/ligas.js';
import { funcion } from './supabase.js';
import { cargarPerfil, mazoActivo } from './almacen.js';
import { aListaDeMazo } from '../data/coleccion.js';
import { arte } from './art.js';

// ------------------------------------------------------------------- red

const llamar = (cuerpo) => funcion(CONFIG.supabase.funcionAsalto, { tipo: 'duelo', ...cuerpo });

export const buscarDuelo = (mazo) => llamar({ op: 'buscar', mazo });
export const retarDuelo = (mazo) => llamar({ op: 'retar', mazo });
export const aceptarDuelo = (codigo, mazo) => llamar({ op: 'aceptar', codigo, mazo });
export const cancelarDuelo = () => llamar({ op: 'cancelar' });
export const estadoDuelo = (id, desde = 0) => llamar({ op: 'estado', id, desde });
export const jugarEnDuelo = (id, accion, desde = 0) => llamar({ op: 'accion', id, accion, desde });
export const rendirseEnDuelo = (id) => llamar({ op: 'rendirse', id });

// ----------------------------------------------------------------- pantalla

const id = (s) => document.getElementById(s);
const escapar = (s) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

let dom = null;
let alEmparejar = () => {};
let abierto = false;
/** Lo que se está esperando: null, o { id, codigo, desde, temporizador }. */
let espera = null;
let aviso = null;

export function montarDuelo({ cuandoEmpareje }) {
  alEmparejar = cuandoEmpareje;
  dom = { caja: id('menu-duelo'), jugar: id('jugar') };
  dom.caja.addEventListener('click', alPulsar);
  dom.caja.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.id === 'duelo-codigo') { e.preventDefault(); aceptar(); }
  });
}

/** Despliega o pliega el panel. Plegarlo NO cancela una espera en curso. */
export function enseñarDuelo(si) {
  abierto = si;
  dom.jugar.classList.toggle('duelo-abierto', si);
  pintarDuelo();
}

/** Al salir de la pantalla de jugar: se deja de preguntar, y si se estaba en la cola, se sale. */
export function abandonarEspera() {
  if (!espera) return;
  clearInterval(espera.temporizador);
  espera = null;
  cancelarDuelo().catch(() => {});
}

/**
 * La liga del jugador, por su ELO. El ELO no se enseña nunca: la liga es el
 * ELO con nombre, y la barra son los puntos dentro de la división.
 */
function ligaHTML() {
  const elo = Number(cargarPerfil().elo ?? 1200);
  const r = rangoDe(elo);
  const arriba = r.liga.id === LIGAS[LIGAS.length - 1].id;
  const foto = arte(r.liga.emblema);
  return `<div class="duelo-liga">
    <span class="duelo-emblema ${r.liga.id}" style="${foto ? `background-image:url('${foto}')` : ''}"></span>
    <span class="duelo-liga-nombre">${escapar(nombreDeRango(elo))}</span>
    <span class="duelo-liga-nota">${arriba ? 'La cola de los que llegaron al final.' : `${r.puntos} de 100 para subir`}</span>
    ${arriba ? '' : `<span class="duelo-barra"><i style="width:${r.puntos}%"></i></span>`}
  </div>`;
}

export function pintarDuelo() {
  const caja = dom?.caja;
  if (!caja) return;
  if (!abierto) { caja.classList.add('oculta'); return; }
  caja.classList.remove('oculta');

  let cuerpo;
  if (espera) {
    const segundos = Math.floor((Date.now() - espera.desde) / 1000);
    const reloj = `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;
    cuerpo = espera.codigo
      ? `<p class="duelo-estado">Tu código de reto: <b class="duelo-codigo">${escapar(espera.codigo)}</b></p>
         <p class="duelo-nota">Pásaselo a quien quieras. La partida empieza en cuanto lo meta. ${reloj}</p>
         <button class="boton-fantasma" data-duelo="cancelar">Retirar el reto</button>`
      : `<p class="duelo-estado">Buscando rival… <span class="duelo-reloj">${reloj}</span></p>
         <p class="duelo-nota">Te toca el primero que esté buscando. Si tarda, reta a un amigo con un código.</p>
         <button class="boton-fantasma" data-duelo="cancelar">Dejar de buscar</button>`;
  } else {
    cuerpo = `<div class="duelo-acciones">
      <button class="boton-grande" data-duelo="buscar">Buscar rival</button>
      <button class="boton-fantasma" data-duelo="retar">Retar a un amigo</button>
      <label class="duelo-entrar">Tengo un código
        <span><input id="duelo-codigo" maxlength="6" autocomplete="off" autocapitalize="characters"
          spellcheck="false" placeholder="ABC123"><button class="chip" data-duelo="aceptar">Entrar</button></span>
      </label>
    </div>`;
  }
  const mensaje = aviso ? `<p class="cu-nota mal">${escapar(aviso)}</p>` : '';
  caja.innerHTML = `<p class="menu-misiones-titulo">Duelo</p>${ligaHTML()}${cuerpo}${mensaje}
    <p class="duelo-nota">Reloj de ${Math.round(DUELO.relojMs / 60000)} minutos por bando y ${Math.round(DUELO.turnoMaxMs / 60000)} por decisión. Ganar paga como contra la IA.</p>`;
}

function alPulsar(e) {
  const b = e.target.closest('[data-duelo]');
  if (!b) return;
  const que = b.dataset.duelo;
  if (que === 'buscar') empezar(() => buscarDuelo(miMazo()));
  if (que === 'retar') empezar(() => retarDuelo(miMazo()));
  if (que === 'aceptar') aceptar();
  if (que === 'cancelar') { abandonarEspera(); aviso = null; pintarDuelo(); }
}

const miMazo = () => aListaDeMazo(mazoActivo());

/** Entra en la cola o abre el reto, y se queda preguntando hasta que haya rival. */
async function empezar(pedir) {
  aviso = null;
  try {
    const r = await pedir();
    recibir(r);
  } catch (e) {
    aviso = e.message;
    pintarDuelo();
  }
}

async function aceptar() {
  const codigo = String(id('duelo-codigo')?.value ?? '').trim().toUpperCase();
  if (codigo.length < 4) { aviso = 'Escribe el código que te han pasado.'; pintarDuelo(); return; }
  await empezar(() => aceptarDuelo(codigo, miMazo()));
}

/** Lo que contesta el servidor: o ya hay partida, o se sigue esperando. */
function recibir(r) {
  if (r.estado === 'jugando' && r.n !== undefined) {
    if (espera) clearInterval(espera.temporizador);
    espera = null;
    abierto = false;
    pintarDuelo();
    alEmparejar(r);
    return;
  }
  if (!espera) {
    espera = { id: r.id, codigo: r.codigo ?? null, desde: Date.now(), temporizador: null };
    espera.temporizador = setInterval(sondear, DUELO.sondeoMs);
  }
  pintarDuelo();
}

async function sondear() {
  if (!espera) return;
  if (Date.now() - espera.desde > DUELO.esperaMaxMs && !espera.codigo) {
    abandonarEspera();
    aviso = 'Nadie ha aparecido en tres minutos. Prueba más tarde, o reta a un amigo.';
    pintarDuelo();
    return;
  }
  try {
    const r = await estadoDuelo(espera.id, 0);
    recibir(r);
  } catch (e) {
    // Un fallo de red en una pregunta no cancela la espera: la siguiente
    // pregunta llega en dos segundos y medio.
    aviso = e.message;
    pintarDuelo();
  }
}
