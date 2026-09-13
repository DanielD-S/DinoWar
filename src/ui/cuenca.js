// DinoWar — la pantalla de la capa cooperativa.
//
// Sólo LEE de red.js y pinta. No sabe si el estado viene de este navegador o de
// un servidor, y ésa es la idea: cuando lo haya, este fichero no cambia.
//
// El marco es un EQUIPO DE EXCAVACIÓN trabajando una cuenca, y la pantalla lo
// cuenta con piezas: el jefe en una vitrina de museo con su cartela y su barra
// de Vida; el yacimiento en cuatro estados que crecen con el nivel, con la
// bandeja de fósiles destapándose según se llena; la tribu como ranking con
// medallones; y las cartas de jefe con su marco. Las piezas salen de
// `tools/cuenca.py`, que mide la ventana y la cartela de la vitrina.

import { CUENCA, depositoDe, ritmoPorHora, costeDeMejora, faltaParaLlenar,
  puedeAsaltar, saludDeJefe, tablaDeAportes, totalAportado } from '../data/tribu.js';
import { CARTAS_DE_JEFE, eventosActivos, ventanaDe, TIPO_EVENTO } from '../data/eventos.js';
import { carta } from '../data/cards.js';
import {
  estadoDeTribu, aportar, mejorarYacimiento, reclamar, crearTribu, entrarEnTribu,
  YO, modoActual, porQueLocal, MODO,
} from './red.js';
import { anotarRecompensa } from './perfil.js';
import { arte } from './art.js';
import { cartaHTML } from './render.js';
import { invocar } from './efectos.js';

const id = (s) => document.getElementById(s);
let dom = null;
let alAsaltar = null;      // lo pone main.js: arrancar la partida contra el jefe
let alVolver = null;

/** Duración legible. Sin segundos: nadie mira una cuenta atrás de catorce horas. */
function duracion(ms) {
  if (ms === null || ms <= 0) return 'ya';
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return min % 60 === 0 ? `${h} h` : `${h} h ${min % 60} min`;
  const d = Math.floor(h / 24);
  return h % 24 === 0 ? `${d} d` : `${d} d ${h % 24} h`;
}

const numero = (n) => Math.round(n).toLocaleString('es');
const escapar = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/** El yacimiento tiene ocho niveles y cuatro imágenes: una por cada dos. */
const estadoDelYacimiento = (nivel) => Math.min(4, Math.max(1, Math.ceil(nivel / 2)));

export function montarCuenca(volver, asaltar) {
  alVolver = volver;
  alAsaltar = asaltar;
  dom = { pantalla: id('cuenca'), cuerpo: id('cuenca-cuerpo'), pie: id('cuenca-pie') };

  dom.cuerpo.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-accion]');
    if (!b) return;
    // Compartir no toca el servidor: no hay que repintar ni apagar nada.
    if (b.dataset.accion === 'compartir') { compartirCodigo(b.dataset.codigo, b.dataset.nombre); return; }
    // Mientras el servidor contesta, el botón se apaga: pulsarlo dos veces
    // mandaría dos aportes, y el segundo no siempre es inofensivo.
    b.disabled = true;
    let fallo = null;
    let reclamada = null;
    try {
      if (b.dataset.accion === 'aportar') {
        const c = await estadoDeTribu();
        await aportar(Number(b.dataset.cuanto) || c.yacimiento.fosiles);
      } else if (b.dataset.accion === 'mejorar') {
        await mejorarYacimiento(Number(b.dataset.coste));
      } else if (b.dataset.accion === 'crear-tribu') {
        const nombre = id('cu-nombre')?.value ?? '';
        if (nombre.trim().length < 3) throw new Error('El nombre necesita al menos 3 letras.');
        await crearTribu(nombre);
      } else if (b.dataset.accion === 'entrar-tribu') {
        const codigo = (id('cu-codigo')?.value ?? '').trim();
        if (codigo.length < 4) throw new Error('El código son 6 caracteres.');
        await entrarEnTribu(codigo);
      } else if (b.dataset.accion === 'reclamar') {
        const cardId = await reclamar();
        if (cardId) {
          // A la colección de verdad, no sólo a la cuenca: una carta que no
          // puedes meter en un mazo no es una recompensa, es un cromo. Cuando
          // hay servidor ya la apuntó `reclamar_jefe`, y esto sólo refresca la
          // caché: era la última carta del juego que entraba en la colección
          // porque el navegador lo dijera.
          await anotarRecompensa(cardId);
          reclamada = cardId;
        }
      }
    } catch (err) {
      fallo = err;
    }
    // El aviso va DESPUÉS de repintar: al revés, el repintado se lo llevaba por
    // delante y el botón parecía no hacer nada.
    await pintarCuenca();
    if (fallo) avisar(fallo.message);
    // La carta de jefe se invoca como una legendaria en el tablero: es la
    // única recompensa del juego cooperativo y se gana entre ocho.
    if (reclamada) await ceremoniaDeCarta(reclamada);
  });

  dom.pie.addEventListener('click', (e) => {
    if (e.target.closest('[data-accion="asaltar"]') && alAsaltar) alAsaltar();
  });
}

export function abrirCuenca() {
  // Se pinta un armazón inmediato y el contenido llega cuando conteste el
  // servidor: una pantalla en blanco durante dos segundos se lee como rota.
  dom.cuerpo.innerHTML = '<p class="cu-cargando">Bajando a la cuenca…</p>';
  dom.pie.innerHTML = '';
  pintarCuenca();
  return dom.pantalla;
}

/** Un aviso que no interrumpe. Los errores del servidor vienen ya redactados. */
function avisar(texto) {
  const p = document.createElement('p');
  p.className = 'cu-aviso-error';
  p.setAttribute('role', 'status');
  p.textContent = texto;
  // Al principio del cuerpo y no en el pie: sin tribu el pie está vacío, y un
  // aviso en una franja que no existe no lo lee nadie.
  dom.cuerpo.prepend(p);
  p.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  setTimeout(() => p.remove(), 7000);
}

/**
 * El código de la tribu, por el compartir nativo del móvil si lo hay y al
 * portapapeles si no. Dictarlo en voz alta era la única forma hasta ahora.
 */
async function compartirCodigo(codigo, nombre) {
  const texto = `Entra en mi cuenca de DinoWar «${nombre}» con el código ${codigo}`;
  try {
    if (navigator.share) { await navigator.share({ text: texto }); return; }
    await navigator.clipboard.writeText(codigo);
    avisar(`Código ${codigo} copiado.`);
  } catch { /* cancelado o sin permiso: no pasa nada */ }
}

// ------------------------------------------------------------------ pintado

function bloqueYacimiento(c, ahora) {
  const { nivel, fosiles } = c.yacimiento;
  const tope = depositoDe(nivel);
  const pct = Math.min(100, (fosiles / tope) * 100);
  const coste = costeDeMejora(nivel);
  const falta = faltaParaLlenar(c.yacimiento, ahora);

  return `<section class="cu-bloque cu-yac">
    <div class="cu-yac-escena" style="--escena: url('assets/piel/cuenca/yacimiento_${estadoDelYacimiento(nivel)}.webp')">
      <span class="cu-yac-nivel">Yacimiento <b>nivel ${nivel}</b></span>
      <span class="cu-yac-ritmo"><b>${ritmoPorHora(nivel)}</b> fósiles / hora</span>
    </div>
    <div class="cu-bandeja" role="img" style="--pct:${pct.toFixed(1)}%"
         aria-label="Depósito: ${numero(fosiles)} de ${numero(tope)}">
      <i class="falta"></i>
      <b>${numero(fosiles)} <small>/ ${numero(tope)}</small></b>
    </div>
    <p class="cu-linea">${falta === null
      ? '<span class="cu-alerta">El depósito está lleno: lo que saque ahora se pierde.</span>'
      : `Se llena en <b>${duracion(falta)}</b>.`}
      ${c.ganadosDesdeLaUltima > 0 ? `Mientras no estabas se sacaron <b>${numero(c.ganadosDesdeLaUltima)}</b>.` : ''}</p>
    <div class="cu-botones">
      <button class="boton-secundario" data-accion="aportar" ${fosiles > 0 ? '' : 'disabled'}>
        Aportar todo · ${numero(fosiles)}</button>
      ${coste === null
        ? '<span class="cu-nota">Yacimiento al máximo.</span>'
        : `<button class="boton-secundario" data-accion="mejorar" data-coste="${coste}"
                   ${fosiles >= coste ? '' : 'disabled'}>Mejorar · ${numero(coste)}</button>`}
    </div>
    <p class="cu-nota">Los fósiles que aportas ya no suben tu yacimiento, y al revés.
      Ayudar hoy o producir más mañana: ésa es toda la decisión.</p>
  </section>`;
}

/**
 * Sin tribu no hay cuenca. Es la primera pantalla que ve alguien que entra al
 * servidor, así que dice las dos cosas que puede hacer y nada más: fundar una,
 * o entrar en la de alguien con su código.
 */
function bloqueSinTribu() {
  return `<section class="cu-bloque">
    <h3 class="cu-titulo">Todavía no estás en ninguna tribu</h3>
    <p class="cu-linea">Un jefe tiene miles de Vida y no cabe en una persona.
      Funda una cuenca y pasa el código, o entra en la de alguien.</p>
    <div class="cu-formulario">
      <label class="cu-campo">
        <span>Nombre de tu cuenca</span>
        <input id="cu-nombre" type="text" maxlength="32" placeholder="Cuenca del Morrison"
               autocomplete="off" enterkeyhint="done">
      </label>
      <button class="boton-grande" data-accion="crear-tribu">Fundar la cuenca</button>
    </div>
    <div class="cu-formulario">
      <label class="cu-campo">
        <span>O el código de una que ya exista</span>
        <input id="cu-codigo" type="text" maxlength="6" placeholder="ABC123"
               autocomplete="off" autocapitalize="characters" spellcheck="false"
               enterkeyhint="go" class="cu-codigo-campo">
      </label>
      <button class="boton-secundario" data-accion="entrar-tribu">Entrar con el código</button>
    </div>
  </section>`;
}

function bloqueTribu(c) {
  if (!c.tribu && modoActual() === MODO.REMOTO) return bloqueSinTribu();
  const cabecera = c.tribu ? `<section class="cu-bloque cu-tribu">
    <h3 class="cu-titulo">${escapar(c.tribu.nombre)}</h3>
    <p class="cu-linea">Código para entrar: <b class="cu-codigo">${escapar(c.tribu.codigo)}</b>
      <button class="cu-compartir" data-accion="compartir" data-codigo="${escapar(c.tribu.codigo)}"
              data-nombre="${escapar(c.tribu.nombre)}">Compartir</button></p>
    <p class="cu-nota">Hasta ${CUENCA.miembrosMaximo} en la cuenca.</p>
  </section>` : '';

  // Los miembros como medallones, no como una lista separada por puntos.
  return `${cabecera}<section class="cu-bloque">
    <h3 class="cu-titulo">Almacén de la tribu</h3>
    <p class="cu-cifra"><i class="cu-ico-fosil" aria-hidden="true"></i>${numero(c.almacen)} <small>fósiles</small></p>
    <p class="cu-linea">Cada asalto al jefe cuesta <b>${CUENCA.costeAsalto}</b> del común.
      Tú llevas <b>${numero(c.aportado)}</b> de daño hecho.</p>
    <ul class="cu-miembros" aria-label="Miembros">
      ${c.miembros.map((m) => `<li class="${m === YO ? 'yo' : ''}"><i class="cu-medallon" aria-hidden="true"></i>${escapar(m)}</li>`).join('')}
    </ul>
    <p class="cu-nota">${c.miembros.length} de ${CUENCA.miembrosMaximo}.</p>
  </section>`;
}

/** La vitrina: el marco del jefe con su ilustración en la ventana y el nombre en la cartela. */
function vitrina(j, vivo) {
  return `<div class="cu-vitrina ${vivo ? '' : 'caida'}">
    <div class="cu-vitrina-ventana">${arte(j.recompensa)}</div>
    <div class="cu-vitrina-cartela"><i>${j.nombre}</i></div>
    ${vivo ? '' : '<i class="cu-sello-caido" title="Ha caído"></i>'}
  </div>`;
}

function bloqueJefe(c, ahora) {
  if (!c.jefe) {
    return `<section class="cu-bloque">
      <h3 class="cu-titulo">Sin jefe en la cuenca</h3>
      <p class="cu-linea">Ahora mismo no hay nada que cazar. Vuelve cuando se abra la
        siguiente ventana.</p>
    </section>`;
  }
  const j = c.jefe;
  const vivo = j.vida > 0;
  const pct = saludDeJefe(j) * 100;
  const motivo = puedeAsaltar({ almacen: c.almacen, asaltosHoy: c.asaltosHoy }, ahora, j);
  const aportes = tablaDeAportes(j);
  const mayor = Math.max(1, ...aportes.map((a) => a.dano));

  return `<section class="cu-bloque cu-jefe ${vivo ? '' : 'caido'}">
    ${vitrina(j, vivo)}
    <p class="cu-subtitulo">${j.titulo}</p>
    ${vivo
      ? `<div class="cu-vida" role="img" aria-label="${numero(j.vida)} de ${numero(j.vidaMaxima)}">
           <i style="width:${pct.toFixed(1)}%"></i><b>${numero(j.vida)} <small>/ ${numero(j.vidaMaxima)}</small></b></div>
         <div class="cu-datos">
           <span><b>${duracion(j.hasta - ahora)}</b><small>de ventana</small></span>
           <span><b>${c.asaltosHoy}<em>/${CUENCA.asaltosPorDia}</em></b><small>asaltos hoy</small></span>
           <span><b>${numero(totalAportado(j))}</b><small>de daño${aportes.length ? ` entre ${aportes.length}` : ' hecho'}</small></span>
         </div>`
      : `<p class="cu-caido">Ha caído. ${numero(totalAportado(j))} de daño entre ${aportes.length}.</p>`}
    <p class="cu-nota">${j.nota}</p>
    ${aportes.length ? `<ol class="cu-ranking">
      ${aportes.map((a, i) => `<li class="${a.quien === YO ? 'yo' : ''}">
        <span class="cu-puesto">${i + 1}</span><i class="cu-medallon" aria-hidden="true"></i>
        <span class="cu-quien">${escapar(a.quien)}</span>
        <span class="cu-dano">${numero(a.dano)}</span>
        <span class="cu-cuota"><i style="width:${((a.dano / mayor) * 100).toFixed(1)}%"></i></span>
      </li>`).join('')}
    </ol>` : '<p class="cu-nota">Todavía nadie le ha tocado.</p>'}
    ${c.puedeReclamar
      ? `<button class="boton-grande" data-accion="reclamar">Reclamar <i>${carta(j.recompensa).binomial}</i></button>`
      : ''}
    ${!vivo && !c.puedeReclamar && (j.aportes[YO] ?? 0) === 0
      ? '<p class="cu-nota">No le hiciste daño, así que su carta no es tuya. La próxima.</p>' : ''}
    ${vivo && motivo ? `<p class="cu-nota mal">${motivo[0].toUpperCase()}${motivo.slice(1)}.</p>` : ''}
  </section>`;
}

function bloqueEventos(c, ahora) {
  const activos = eventosActivos(c.arranque, ahora);
  if (activos.length === 0) return '';
  return `<section class="cu-bloque">
    <h3 class="cu-titulo">En la cuenca ahora</h3>
    ${activos.map((e) => {
      const v = ventanaDe(e, c.arranque, ahora);
      // Un evento de clima lleva de fondo la textura que ese clima pone en
      // el tablero: la calima de la Sequía, el agua de la Crecida.
      const clase = e.tipo === TIPO_EVENTO.JEFE ? 'jefe' : `clima clima-${e.clima ?? ''}`;
      return `<div class="cu-evento ${clase}">
        <b>${e.titulo}</b>
        <p>${e.texto}</p>
        <small>Quedan ${duracion(v.hasta - ahora)}</small>
      </div>`;
    }).join('')}
  </section>`;
}

function bloqueCartas(c) {
  if (c.cartas.length === 0) return '';
  return `<section class="cu-bloque">
    <h3 class="cu-titulo">Cartas de jefe</h3>
    <p class="cu-nota">No salen en sobres. Sólo se consiguen tumbando a su jefe con la tribu.</p>
    <div class="cu-premios">
      ${c.cartas.map((cid) => `<div class="cu-premio">
        ${cartaHTML(cid, { variante: 'col' })}
        <span><i>${carta(cid).binomial}</i></span>
      </div>`).join('')}
    </div>
  </section>`;
}

export async function pintarCuenca() {
  const ahora = Date.now();
  const c = await estadoDeTribu(ahora);

  const sinTribu = !c.tribu && modoActual() === MODO.REMOTO;
  dom.cuerpo.innerHTML = [
    sinTribu ? '' : bloqueEventos(c, ahora),
    sinTribu ? '' : bloqueJefe(c, ahora),
    bloqueYacimiento(c, ahora),
    bloqueTribu(c),
    bloqueCartas(c),
    modoActual() === MODO.LOCAL
      ? `<p class="cu-aviso"><b>Estás jugando la cuenca en local</b> (${porQueLocal()}).
          Tus compañeros de tribu no son personas: los simula el propio juego con
          las mismas reglas y los mismos ritmos. Lo que hagas aquí no lo ve nadie más.</p>`
      : `<p class="cu-aviso">Cuenca compartida. El daño a los jefes lo calcula el
          servidor re-jugando tu partida, así que lo que aporta cada uno es lo que
          hizo de verdad.</p>`,
  ].join('');

  if (sinTribu) { dom.pie.innerHTML = ''; return; }
  const j = c.jefe;
  const motivo = j ? puedeAsaltar({ almacen: c.almacen, asaltosHoy: c.asaltosHoy }, ahora, j) : 'no hay jefe';
  dom.pie.innerHTML = `<button class="boton-grande" data-accion="asaltar" ${motivo ? 'disabled' : ''}>
    ${motivo ? 'No puedes asaltar' : `Asaltar · ${CUENCA.costeAsalto} fósiles`}</button>`;
  for (const m of document.querySelectorAll('#cuenca .fosil')) m.textContent = numero(c.almacen);
}

/**
 * La carta de jefe recién reclamada, invocada a lo grande sobre la propia
 * Cuenca, y después su ficha, para leerla con calma.
 */
async function ceremoniaDeCarta(cardId) {
  const c = CARTAS_DE_JEFE[cardId];
  if (!c) return;
  await invocar({
    raiz: dom.pantalla,
    html: cartaHTML(cardId, { variante: 'visor' }),
    titulo: 'Carta de jefe',
    subtitulo: c.binomial,
  });
  anunciarCarta(cardId);
}

/** Aviso de carta nueva. Reutiliza la ficha, que ya sabe enseñar una carta. */
function anunciarCarta(cardId) {
  const c = CARTAS_DE_JEFE[cardId];
  if (!c) return;
  const cuerpo = id('ficha-cuerpo');
  if (!cuerpo) return;
  cuerpo.innerHTML = `<div class="cu-anuncio">
    <p class="cu-anuncio-eyebrow">Carta de jefe</p>
    <div class="cu-anuncio-carta">${cartaHTML(cardId, { variante: 'visor' })}</div>
    <h2><i>${c.binomial}</i></h2>
    <p class="cu-anuncio-nota">${c.nota}</p>
    <p class="cu-nota">${c.formacion} · ${c.edad} · evidencia ${c.evidencia}</p>
  </div>`;
  id('ficha').classList.remove('oculta');
}
