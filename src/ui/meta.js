// DinoWar — pantallas de colección, sobres y mazos.
//
// Es la capa de "fuera de la partida": nada de aquí toca el motor de reglas.
// La partida sólo recibe, al final, una lista de pares [cardId, copias].
//
// LEE de la caché local, de forma síncrona, porque estas pantallas se repintan
// enteras a cada clic. ESCRIBE contra src/ui/perfil.js, que es quien sabe si la
// colección vive en este navegador o en el servidor. Por eso las funciones que
// cambian algo son asíncronas y las que sólo pintan no.
//
// Las reglas puras de src/data/coleccion.js siguen aplicándose aquí para poder
// decir POR QUÉ un mazo no vale antes de mandarlo, pero la comprobación que
// manda es la del servidor: ésta es una cortesía para la pantalla.

import {
  CARTAS, CARTAS_DE_JEFE, RAREZA, RAREZA_NOMBRE, TIPO, TIPO_NOMBRE, CLADO_NOMBRE, carta,
} from '../data/cards.js';
import {
  ECONOMIA, PROBABILIDAD, GARANTIA, TAM_MAZO, POR_RAREZA,
  excedente, valorFusion, limiteDe, validarMazo, mazoPorDefecto,
} from '../data/coleccion.js';
import { cargarPerfil, perfilInicial } from './almacen.js';
import {
  PRUEBAS, comprarSobre as pedirSobre, fundir, cobrarPartida,
  traerMisiones, misionesDeHoy,
} from './perfil.js';
import { misionesDelDia } from '../data/misiones.js';
import { fichaHTML, abrirFicha, cartaHTML } from './render.js';
import { ceremoniaDeSobre } from './apertura.js';
import { montarMazos } from './mazos.js';

const id = (s) => document.getElementById(s);

// El modo pruebas (?pruebas=1) da monedas infinitas y vive en perfil.js, que es
// quien puede garantizarlo: sólo funciona con el perfil local.
const MONEDAS = () => (PRUEBAS ? '∞' : cargarPerfil().monedas);
const ORDEN = [RAREZA.LEGENDARIO, RAREZA.EPICO, RAREZA.RARO, RAREZA.COMUN];

let dom = null;
let volverAlMenu = () => {};
let filtro = null;          // rareza mostrada en la colección, null = todas

export function montarMeta(alVolver) {
  volverAlMenu = alVolver;
  dom = {
    coleccion: id('coleccion'), sobres: id('sobres'), mazos: id('mazos'),
    filtros: id('col-filtros'), rejilla: id('col-rejilla'),
    resumen: id('col-resumen'), btnFundir: id('btn-fundir'),
    tirada: id('sobre-tirada'), aviso: id('sobre-aviso'), odds: id('sobre-odds'),
    btnAbrir: id('btn-abrir'),
    mazosTitulo: id('mazos-titulo'), mazosCuerpo: id('mazos-cuerpo'), mazosPie: id('mazos-pie'),
    menuMoneda: id('menu-moneda'), menuMazo: id('menu-mazo'),
    menuMisiones: id('menu-misiones'),
  };

  for (const b of document.querySelectorAll('[data-volver]')) {
    b.addEventListener('click', () => volverAlMenu());
  }

  dom.filtros.addEventListener('click', (e) => {
    const c = e.target.closest('[data-rareza]');
    if (!c) return;
    filtro = c.dataset.rareza || null;
    pintarColeccion();
  });

  dom.rejilla.addEventListener('click', (e) => {
    const c = e.target.closest('[data-card]');
    if (c) abrirFicha(fichaHTML(c.dataset.card));
  });

  dom.tirada.addEventListener('click', (e) => {
    const c = e.target.closest('[data-card]');
    if (c) abrirFicha(fichaHTML(c.dataset.card));
  });

  dom.btnFundir.addEventListener('click', fundirSobrantes);
  dom.btnAbrir.addEventListener('click', comprarSobre);
  montarMazos({ titulo: dom.mazosTitulo, cuerpo: dom.mazosCuerpo, pie: dom.mazosPie, alPintarMenu: pintarMenu });

  pintarMenu();
}

// ------------------------------------------------------------------ ayudas

const esDino = (c) => c.tipo === TIPO.DINOSAURIO;
const nombreHTML = (c) => (esDino(c) ? `<i>${c.binomial}</i>` : c.binomial);
const familia = (c) => (esDino(c) ? CLADO_NOMBRE[c.clado] : TIPO_NOMBRE[c.tipo]);
const totalDe = (mazo) => Object.values(mazo).reduce((a, b) => a + b, 0);

/** Todas las cartas del set en orden de rareza descendente. */
/**
 * El set, más las cartas de jefe QUE YA TENGAS. Las de jefe no se enseñan como
 * hueco: enseñar 'Sin ejemplares' en una carta que no se puede comprar sólo
 * sirve para frustrar. Aparecen cuando las ganas, y no antes.
 */
function catalogo() {
  const p = cargarPerfil();
  const deJefe = Object.values(CARTAS_DE_JEFE).filter((c) => (p.cartas[c.id] ?? 0) > 0);
  return [...Object.values(CARTAS), ...deJefe]
    .sort((a, b) => ORDEN.indexOf(a.rareza) - ORDEN.indexOf(b.rareza)
      || a.binomial.localeCompare(b.binomial));
}

function pintarMonedas() {
  for (const m of document.querySelectorAll('.moneda')) m.textContent = MONEDAS();
}

export function pintarMenu() {
  const p = cargarPerfil();
  const m = p.mazos[p.activo] ?? p.mazos[0];
  const v = validarMazo(m?.cartas ?? {}, p.cartas);
  dom.menuMoneda.textContent = MONEDAS();
  dom.menuMazo.textContent = v.valido ? m.nombre : `${m?.nombre ?? '—'} (no válido)`;
}

// -------------------------------------------------------------- misiones
//
// Tres renglones: nombre, lo que pide y cuánto llevas. El catálogo lo calcula
// el navegador a partir del DÍA que dijo el servidor —la misma función que usa
// la Edge Function para acreditar— así que los dos hablan de las mismas tres
// sin tener que guardarlas en ninguna parte.
//
// Viven en la pantalla de JUGAR, detrás de su placa. Estuvieron un rato en el
// menú, debajo de las dinomonedas, y lo dejaron amontonado: el menú ya iba
// justo a 360×640 y tres renglones más lo pasaron por 58 px.

// Si el panel está desplegado. Lo guarda este módulo porque `refrescar()`
// repinta cuando contesta el servidor y tiene que respetar lo que el jugador
// dejó abierto o cerrado, sin que quien llama tenga que acordarse.
let panelAbierto = false;

const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/**
 * Pinta el bloque de misiones con lo último que dijo el servidor. Si no ha
 * dicho nada —no hay servidor, o la llamada falló— el bloque se queda oculto:
 * un progreso inventado en el navegador es una promesa que nadie va a pagar.
 *
 * @param {boolean} [abierto] desplegar o plegar. Si no se dice, se respeta
 *   como estaba: es lo que llama `refrescar()` cuando contesta el servidor.
 */
export function pintarMisiones(abierto) {
  if (abierto !== undefined) panelAbierto = abierto;
  const caja = dom?.menuMisiones;
  if (!caja) return;
  const hoy = misionesDeHoy();
  if (!panelAbierto || !hoy?.dia) { caja.classList.add('oculta'); return; }

  const filas = misionesDelDia(hoy.dia).map((m) => {
    const estado = hoy.progreso[m.id] ?? { progreso: 0, cobrada: false };
    const llevo = Math.min(estado.progreso ?? 0, m.meta);
    const hecha = estado.cobrada || llevo >= m.meta;
    // El ancho va en un `style` en vez de una clase porque es un número
    // continuo: cuarenta clases de porcentaje no son una hoja de estilos.
    // El orden importa: la rejilla coloca por orden de aparición, así que el
    // nombre va con su cifra en la primera línea, el texto con su premio en la
    // segunda y la barra cruzando por debajo, como una base.
    return `<li class="mision ${hecha ? 'hecha' : ''}">
      <span class="mision-nombre">${escapar(m.nombre)}</span>
      <span class="mision-cifra">${hecha ? `${m.meta}/${m.meta} ✓` : `${llevo}/${m.meta}`}</span>
      <span class="mision-texto">${escapar(m.texto)}</span>
      <span class="mision-premio">${hecha ? 'cobrada' : `+${m.premio}`}</span>
      <span class="mision-barra"><i style="width:${Math.round((llevo / m.meta) * 100)}%"></i></span>
    </li>`;
  }).join('');

  caja.innerHTML = `<p class="menu-misiones-titulo">Misiones de hoy</p><ul>${filas}</ul>`;
  caja.classList.remove('oculta');
}

/**
 * Pide las misiones al servidor y repinta cuando lleguen. No bloquea la
 * pantalla: se abre con lo que hubiera y se corrige sola.
 */
export function refrescarMisiones() {
  return traerMisiones().then(() => pintarMisiones()).catch(() => {});
}

// -------------------------------------------------------------- colección

export function abrirColeccion() {
  pintarColeccion();
  return dom.coleccion;
}

function pintarColeccion() {
  const p = cargarPerfil();
  const sobra = excedente(p.cartas);

  dom.filtros.innerHTML = [['', 'Todas'], ...ORDEN.map((r) => [r, RAREZA_NOMBRE[r]])]
    .map(([r, n]) => `<button class="chip ${(filtro ?? '') === r ? 'on' : ''}" data-rareza="${r}">${n}</button>`)
    .join('');

  const cartas = catalogo().filter((c) => !filtro || c.rareza === filtro);
  dom.rejilla.className = 'meta-cuerpo col-rejilla';
  dom.rejilla.innerHTML = cartas.map((c) => {
    const n = p.cartas[c.id] ?? 0;
    const extra = sobra[c.id] ?? 0;
    // Sin ejemplares no se enseña la carta apagada: se enseña su hueco. Una
    // carta al 30 % de opacidad se lee como un fallo de pintado.
    if (n === 0) {
      return `<div class="col-carta ninguna" role="button" tabindex="0" data-card="${c.id}">
        <span class="col-hueco">◆</span>
        <div class="col-pie">
          <div class="col-nombre">${nombreHTML(c)}</div>
          <div class="col-meta">Sin ejemplares</div>
        </div>
      </div>`;
    }
    // La carta con su marco, y debajo lo que el marco abrevia: el binomial
    // entero —la banda lleva sólo el género—, la rareza y la familia. El
    // contador de copias va en el pie y no encima de la carta: arriba a la
    // derecha ahora acaba la banda del nombre.
    return `<div class="col-carta rareza-${c.rareza} ${esDino(c) ? 'dino' : ''}"
                 role="button" tabindex="0" data-card="${c.id}">
      ${cartaHTML(c.id, { variante: 'col' })}
      <div class="col-pie">
        <div class="col-nombre">${nombreHTML(c)}</div>
        <div class="col-meta"><span class="col-copias${extra ? ' sobra' : ''}">${n}/${limiteDe(c.id)}</span>
          <span class="col-rar rar-${c.rareza}">${RAREZA_NOMBRE[c.rareza]}</span> · ${familia(c)}</div>
      </div>
    </div>`;
  }).join('');

  const distintas = Object.values(CARTAS).filter((c) => (p.cartas[c.id] ?? 0) > 0).length;
  const copias = totalDe(p.cartas);
  const valor = valorFusion(p.cartas);
  const sobrantes = Object.values(sobra).reduce((a, b) => a + b, 0);
  dom.resumen.textContent = `${distintas} de ${Object.keys(CARTAS).length} cartas distintas · ${copias} copias`
    + (valor > 0 ? ` · ${sobrantes === 1 ? 'sobra 1 copia' : `sobran ${sobrantes} copias`}` : ' · nada que fundir');
  dom.btnFundir.disabled = valor === 0;
  dom.btnFundir.textContent = valor > 0 ? `Fundir sobrantes · +${valor} ◈` : 'Nada que fundir';
  pintarMonedas();
}

/**
 * Funde lo que ya no cabe en un mazo. No se pregunta antes porque no se pierde
 * nada jugable: una copia por encima del tope no se puede poner en ningún mazo
 * legal, así que fundirla no cambia lo que puedes construir.
 */
async function fundirSobrantes() {
  if (valorFusion(cargarPerfil().cartas) === 0) return;
  dom.btnFundir.disabled = true;
  try {
    await fundir();
  } catch (e) {
    // Fundir es irreversible, así que un fallo tiene que verse. Callarlo
    // dejaría la pantalla enseñando copias que el servidor ya no tiene, o al
    // revés.
    dom.resumen.innerHTML += `<p class="meta-nota mal">No se pudo fundir: ${e.message}</p>`;
  }
  dom.btnFundir.disabled = false;
  pintarColeccion();
  pintarMenu();
}

// ----------------------------------------------------------------- sobres

export function abrirSobres() {
  pintarSobres();
  return dom.sobres;
}

/**
 * Qué significa esta carta para tu colección. Es la línea que convierte cinco
 * cartas en una recompensa legible: sin ella, abrir un sobre y sacar la cuarta
 * copia de algo que ya no cabe se ve igual que sacar la primera.
 * @param {string} cardId
 * @param {number} antes copias que tenías ANTES de abrir
 * @param {number} enEsteSobre cuántas han salido en esta tirada
 */
function estadoDeCopia(cardId, antes, enEsteSobre) {
  const tope = limiteDe(cardId);
  const total = antes + enEsteSobre;
  if (antes === 0 && enEsteSobre === 1) return { texto: 'Primera copia', clase: 'nueva' };
  if (total > tope) return { texto: `Ya tenías ${antes} · sobrante`, clase: 'sobra' };
  return { texto: `Copia ${total} de ${tope}`, clase: '' };
}

/**
 * De dónde salen las monedas, dicho una sola vez. Perder no paga, así que la
 * frase no puede ser «se ganan jugando»: se ganan ganando, y enseñar un «0 por
 * derrota» sería contar una recompensa que no existe.
 */
const COMO_SE_GANAN = ECONOMIA.monedasDerrota > 0
  ? `Las monedas se ganan jugando: ${ECONOMIA.monedasVictoria} por victoria, ${ECONOMIA.monedasDerrota} por derrota.`
  : `Las monedas se ganan ganando: ${ECONOMIA.monedasVictoria} por victoria y nada por derrota.`;

/** La rareza más alta de la tirada: es la carta que se enseña en grande. */
function mejorDeLaTirada(tirada) {
  let mejor = 0;
  for (let i = 1; i < tirada.length; i++) {
    if (ORDEN.indexOf(carta(tirada[i]).rareza) < ORDEN.indexOf(carta(tirada[mejor]).rareza)) mejor = i;
  }
  return mejor;
}

function pintarSobres(tirada = null, nuevas = new Set(), antesDeAbrir = {}) {
  const p = cargarPerfil();
  pintarMonedas();

  // Dos columnas porque son dos preguntas distintas y antes se daban mezcladas:
  // «cuántas de las cinco» es la del grupo, y «cuándo me tocará la que me
  // falta» es la que de verdad le importa a quien abre el sobre. Con sólo la
  // primera, el 4 % de las legendarias parecía la respuesta a la segunda.
  //
  // La espera se calcula sobre las que le faltan al jugador, no sobre las ocho
  // legendarias del set, porque eso es lo que hace el sobre: si sólo te falta
  // una, cada legendaria que salga es ésa. Y por eso el número mejora según
  // completas la rareza, que es la parte que el jugador nota.
  const faltanDe = (r) => POR_RAREZA[r].filter((id) => (p.cartas[id] ?? 0) < limiteDe(id)).length;
  const espera = (r) => Math.max(1, Math.round(faltanDe(r) / (PROBABILIDAD[r] * ECONOMIA.cartasPorSobre)));

  dom.odds.innerHTML = '<tr><th>Rareza</th><td>del sobre</td><td>la que te falta</td><td>cartas</td></tr>'
    + ORDEN.map((r) => {
      const quedan = faltanDe(r);
      const cada = espera(r);
      const cuando = quedan === 0 ? 'ya la tienes toda'
        : cada === 1 ? 'casi en cada sobre'
        : `1 de cada ${cada} sobres`;
      return `<tr class="${quedan ? '' : 'completa'}">
        <th class="col-rar rar-${r}">${RAREZA_NOMBRE[r]}</th>
        <td>${(PROBABILIDAD[r] * 100).toFixed(0)} %</td>
        <td>${cuando}</td>
        <td>${quedan ? `faltan ${quedan}` : POR_RAREZA[r].length}</td></tr>`;
    }).join('');

  if (!tirada) {
    dom.tirada.className = 'sobre-tirada cerrado';
    dom.tirada.innerHTML = `<div class="sobre-paquete" id="sobre-paquete">
        <div class="sobre-solapa"></div>
        <div class="sobre-sello">◆</div>
      </div>
      <p class="sobre-vacio">Cinco cartas al azar.<br>
        Al menos una ${RAREZA_NOMBRE[GARANTIA].toLowerCase()} o mejor, garantizada.<br>
        <span class="sobre-nota">Mientras te falte alguna de esa rareza, no te dará
        una copia que ya no te cabe en el mazo.</span></p>`;
  } else {
    // Cada carta cae boca abajo y se voltea por turnos. El retardo va en una
    // variable CSS para que la animación de reparto y la de volteo compartan
    // el mismo reloj sin encadenar temporizadores en JS.
    dom.tirada.className = 'sobre-tirada abierto';
    // La mejor de la tirada entra la última y en grande: es la que hay que ver.
    const mejor = mejorDeLaTirada(tirada);
    const cuenta = {};
    dom.tirada.innerHTML = tirada.map((cid, i) => {
      const c = carta(cid);
      cuenta[cid] = (cuenta[cid] ?? 0) + 1;
      const est = estadoDeCopia(cid, antesDeAbrir[cid] ?? 0, cuenta[cid]);
      const retardo = (i === mejor ? tirada.length - 1 : i - (i > mejor ? 1 : 0)) * 220;
      return `<div class="sobre-carta rareza-${c.rareza} ${nuevas.has(cid) ? 'nueva' : ''} ${i === mejor ? 'mejor' : ''}"
                   data-card="${cid}" style="--retardo:${retardo}ms">
        <div class="sobre-giro">
          <div class="sobre-dorso"></div>
          <div class="sobre-frente">
            ${cartaHTML(cid, { variante: 'sobre' })}
            <div class="col-pie">
              <div class="col-nombre">${nombreHTML(c)}</div>
              <div class="col-rar rar-${c.rareza}">${RAREZA_NOMBRE[c.rareza]}</div>
            </div>
          </div>
        </div>
        <span class="sobre-estado ${est.clase}">${est.texto}</span>
      </div>`;
    }).join('');
  }

  const puede = PRUEBAS || p.monedas >= ECONOMIA.precioSobre;
  dom.btnAbrir.disabled = !puede;
  dom.btnAbrir.textContent = PRUEBAS
    ? 'Abrir sobre · modo pruebas'
    : `Abrir sobre · ${ECONOMIA.precioSobre} ◈`;
  dom.aviso.className = puede ? 'meta-nota' : 'meta-nota mal';
  const abiertos = p.sobresAbiertos === 1 ? 'Llevas 1 sobre abierto' : `Llevas ${p.sobresAbiertos} sobres abiertos`;
  dom.aviso.textContent = PRUEBAS
    ? `${abiertos}. Modo pruebas: los sobres no cuestan monedas. Quita ?pruebas=1 de la dirección para volver a lo normal.`
    : puede
      ? `${abiertos}. ${COMO_SE_GANAN}`
      : `Te faltan ${ECONOMIA.precioSobre - p.monedas} monedas. ${COMO_SE_GANAN} También las da fundir copias sobrantes en la colección.`;
}

async function comprarSobre() {
  if (!PRUEBAS && cargarPerfil().monedas < ECONOMIA.precioSobre) return;

  // El sorteo ya no se hace aquí cuando hay servidor: las cinco cartas las saca
  // él. Pedirle que apunte las que hubiera sorteado el navegador sería pedirle
  // cinco legendarias y que dijese que sí.
  dom.btnAbrir.disabled = true;
  let tirada;
  let antesDeAbrir;
  try {
    const r = await pedirSobre();
    tirada = r.cartas;
    antesDeAbrir = r.antes;
  } catch (e) {
    dom.btnAbrir.disabled = false;
    dom.aviso.textContent = `No se pudo abrir el sobre: ${e.message}`;
    return;
  }
  pintarMenu();

  const nuevas = new Set(tirada.filter((cid) => (antesDeAbrir[cid] ?? 0) === 0));

  // La ceremonia: rasgar el sobre y descubrir las cinco una a una. Las cartas
  // van a tamaño de visor, con el texto de la habilidad, porque es el momento
  // en que se leen. El botón sigue apagado hasta el final, que un segundo
  // sobre a media ceremonia pisaría al primero.
  const cuenta = {};
  const ceremonia = tirada.map((cid) => {
    const c = carta(cid);
    cuenta[cid] = (cuenta[cid] ?? 0) + 1;
    return {
      html: cartaHTML(cid, { variante: 'visor', datos: { texto: true } }),
      rareza: c.rareza, binomial: c.binomial, dino: esDino(c),
      estado: estadoDeCopia(cid, antesDeAbrir[cid] ?? 0, cuenta[cid]),
    };
  });
  dom.tirada.className = 'sobre-tirada ceremonia';
  await ceremoniaDeSobre(dom.tirada, ceremonia);
  dom.btnAbrir.disabled = false;

  // Y la rejilla de las cinco como resumen, que es lo que se queda en pantalla.
  pintarSobres(tirada, nuevas, antesDeAbrir);
  // El volteo se dispara en el fotograma siguiente al pintado, para que el
  // navegador tenga el estado inicial con el que interpolar.
  requestAnimationFrame(() => {
    for (const n of dom.tirada.querySelectorAll('.sobre-carta')) n.classList.add('gira');
  });
}

// ------------------------------------------------------------------ mazos

// Los mazos viven en mazos.js desde que la lista y el editor tienen piel y
// rejilla; aquí sólo se montan y se re-exportan.
export { abrirMazos } from './mazos.js';

// --------------------------------------------------------------- recompensa

/**
 * Dinomonedas por la partida. Perder no paga: `monedasDerrota` es 0.
 *
 * Ya no las suma este fichero. Cuando hay servidor, la partida entera —semilla,
 * mazo y jugadas— se le manda y él decide si la ganaste antes de pagar: una
 * victoria afirmada era una carta regalada, porque las monedas compran sobres.
 *
 * @param {object|null} partida lo que hay que mandarle al servidor
 * @param {boolean} gano lo que cree el navegador, para el modo local
 */
export async function recompensar(partida, gano) {
  const cobro = await cobrarPartida(partida, gano);
  // El progreso lo acaba de mover el servidor, así que se vuelve a pedir: sin
  // esto el menú enseñaría el de antes de la partida hasta la siguiente recarga.
  await refrescarMisiones();
  pintarMenu();
  return cobro;
}

export { perfilInicial, mazoPorDefecto };
