// DinoWar — pantallas de colección, sobres y mazos.
//
// Es la capa de "fuera de la partida": nada de aquí toca el motor de reglas.
// Lee y escribe el perfil con almacen.js y aplica las reglas puras de
// src/data/coleccion.js. La partida sólo recibe, al final, una lista de pares
// [cardId, copias].

import {
  CARTAS, CARTAS_DE_JEFE, RAREZA, RAREZA_NOMBRE, TIPO, TIPO_NOMBRE, CLADO_NOMBRE, carta,
} from '../data/cards.js';
import {
  ECONOMIA, PROBABILIDAD, GARANTIA, TAM_MAZO, POR_RAREZA,
  abrirSobre, excedente, valorFusion, limiteDe, validarMazo, mazoPorDefecto,
} from '../data/coleccion.js';
import {
  cargarPerfil, actualizarPerfil, anadirCartas, perfilInicial,
} from './almacen.js';
import { arte } from './art.js';
import { fichaHTML, abrirFicha, statHTML } from './render.js';

const id = (s) => document.getElementById(s);

/**
 * Modo de pruebas: ?pruebas=1 en la URL da monedas infinitas para poder abrir
 * sobres a discreción. No toca el perfil guardado — sólo deja de cobrar — así
 * que salir del modo devuelve el saldo que tuvieras.
 */
const PRUEBAS = new URLSearchParams(location.search).get('pruebas') === '1';
const MONEDAS = () => (PRUEBAS ? '∞' : cargarPerfil().monedas);
const ORDEN = [RAREZA.LEGENDARIO, RAREZA.EPICO, RAREZA.RARO, RAREZA.COMUN];

let dom = null;
let volverAlMenu = () => {};
let filtro = null;          // rareza mostrada en la colección, null = todas
let editando = null;        // { indice, nombre, cartas } mientras se edita

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
  };

  for (const b of document.querySelectorAll('[data-volver]')) {
    b.addEventListener('click', () => { editando = null; volverAlMenu(); });
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
    return `<div class="col-carta rareza-${c.rareza} ${esDino(c) ? 'dino' : ''}"
                 role="button" tabindex="0" data-card="${c.id}">
      <div class="col-arte">${arte(c.id)}</div>
      <span class="col-copias${extra ? ' sobra' : ''}">${n}/${limiteDe(c.id)}</span>
      <div class="col-pie">
        <div class="col-nombre">${nombreHTML(c)}</div>
        <div class="col-meta"><span class="col-rar rar-${c.rareza}">${RAREZA_NOMBRE[c.rareza]}</span> · ${familia(c)}</div>
        ${esDino(c) ? `<div class="c-stats">
          ${statHTML('a', 'Ataque', c.ataque)}
          ${statHTML('d', 'Defensa', c.defensa)}
          ${statHTML('v', 'Vida', c.vida)}
        </div>` : ''}
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
function fundirSobrantes() {
  const p = cargarPerfil();
  const sobra = excedente(p.cartas);
  const valor = valorFusion(p.cartas);
  if (valor === 0) return;

  const cartas = { ...p.cartas };
  for (const [cid, n] of Object.entries(sobra)) cartas[cid] -= n;
  actualizarPerfil({ cartas, monedas: p.monedas + valor });
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
            <div class="col-arte">${arte(cid)}</div>
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

function comprarSobre() {
  const p = cargarPerfil();
  if (!PRUEBAS && p.monedas < ECONOMIA.precioSobre) return;

  const tirada = abrirSobre(Math.random, p.cartas);
  const nuevas = new Set(tirada.filter((cid) => (p.cartas[cid] ?? 0) === 0));
  const antesDeAbrir = { ...p.cartas };

  actualizarPerfil({
    monedas: PRUEBAS ? p.monedas : p.monedas - ECONOMIA.precioSobre,
    sobresAbiertos: p.sobresAbiertos + 1,
  });
  anadirCartas(tirada);
  pintarSobres(tirada, nuevas, antesDeAbrir);
  pintarMenu();

  // El volteo se dispara en el fotograma siguiente al pintado, para que el
  // navegador tenga el estado inicial con el que interpolar.
  requestAnimationFrame(() => {
    for (const n of dom.tirada.querySelectorAll('.sobre-carta')) n.classList.add('gira');
  });
}

// ------------------------------------------------------------------ mazos

export function abrirMazos() {
  editando = null;
  pintarMazos();
  return dom.mazos;
}

function pintarMazos() {
  if (editando) return pintarEditor();

  const p = cargarPerfil();
  dom.mazosTitulo.textContent = 'Mazos';
  dom.mazosCuerpo.innerHTML = p.mazos.map((m, i) => {
    const v = validarMazo(m.cartas, p.cartas);
    return `<div class="mazo-ficha ${i === p.activo ? 'activo' : ''}">
      <span class="nom">${m.nombre}</span>
      <span class="n ${v.valido ? '' : 'mal'}">${v.total}/${TAM_MAZO}</span>
      <button class="accion" data-usar="${i}" ${v.valido ? '' : 'disabled'}>${i === p.activo ? 'en uso' : 'usar'}</button>
      <button class="accion" data-editar="${i}">editar</button>
    </div>`;
  }).join('');

  dom.mazosPie.innerHTML = `<p class="meta-nota">El mazo en uso es el que llevas a la partida.
    Son ${TAM_MAZO} cartas exactas, y de cada carta caben tantas copias como diga su rareza.</p>
    <button class="boton-grande" data-nuevo>Mazo nuevo</button>`;

  dom.mazosCuerpo.onclick = (e) => {
    const usar = e.target.closest('[data-usar]');
    const editar = e.target.closest('[data-editar]');
    if (usar && !usar.disabled) { actualizarPerfil({ activo: Number(usar.dataset.usar) }); pintarMazos(); pintarMenu(); }
    if (editar) {
      const i = Number(editar.dataset.editar);
      editando = { indice: i, nombre: p.mazos[i].nombre, cartas: { ...p.mazos[i].cartas } };
      pintarEditor();
    }
  };
  dom.mazosPie.onclick = (e) => {
    if (!e.target.closest('[data-nuevo]')) return;
    editando = { indice: -1, nombre: `Mazo ${p.mazos.length + 1}`, cartas: {} };
    pintarEditor();
  };
}

/** Reparto de costes del mazo, en cubos de 0 a 7+. */
function curvaDeCoste(mazo) {
  const cubos = Array.from({ length: 8 }, () => 0);
  for (const [cardId, copias] of Object.entries(mazo)) {
    if (!CARTAS[cardId] || copias <= 0) continue;
    cubos[Math.min(7, carta(cardId).coste)] += copias;
  }
  return cubos;
}

function curvaHTML(mazo) {
  const cubos = curvaDeCoste(mazo);
  const alto = Math.max(1, ...cubos);
  return `<div class="mazo-curva">${cubos.map((n, i) => {
    const pct = Math.round((100 * n) / alto);
    // El color sube con la barra: dice de un vistazo dónde se acumula el mazo.
    const nivel = n === 0 ? 0 : Math.min(3, Math.floor((4 * n) / (alto + 0.01)));
    return `<span class="cb" title="${n} cartas de coste ${i === 7 ? '7 o más' : i}">
      <i class="n${nivel}" style="height:${pct}%"></i>
      <em>${i === 7 ? '7+' : i}</em>
    </span>`;
  }).join('')}</div>`;
}

/**
 * Una fila del editor. `libres` = copias que aún caben. El apagado de las que
 * están al máximo sólo tiene sentido mirando la colección —ahí dice «de esta ya
 * no puedes meter más»—; en la lista del mazo apagaría casi todo.
 */
function filaEditor(c, n, tope, p, apagarLlenas) {
  const libres = tope - n;
  return `<div class="mazo-fila ${apagarLlenas && n >= tope ? 'lleno' : ''}">
    <span class="coste">${c.coste}</span>
    <span class="mini" data-card="${c.id}">${arte(c.id)}</span>
    <span class="nom ${esDino(c) ? 'dino' : ''}">${c.binomial}
      <span class="sub"><span class="col-rar rar-${c.rareza}">${RAREZA_NOMBRE[c.rareza]}</span> · ${familia(c)}
        · tienes ${p.cartas[c.id]}</span></span>
    <span class="mazo-chip ${n > 0 ? 'puestas' : ''}">${n > 0 ? `${n} en mazo` : `${libres} libre${libres === 1 ? '' : 's'}`}</span>
    <span class="mazo-paso">
      <button data-menos="${c.id}" ${n === 0 ? 'disabled' : ''} aria-label="Quitar una copia">−</button>
      <button data-mas="${c.id}" ${n >= tope ? 'disabled' : ''} aria-label="Añadir una copia">+</button>
    </span>
  </div>`;
}

function pintarEditor() {
  const p = cargarPerfil();
  const v = validarMazo(editando.cartas, p.cartas);
  dom.mazosTitulo.textContent = 'Editar mazo';
  const pestana = editando.pestana ?? 'mazo';

  // Sólo se listan las cartas que tienes: un editor que enseña lo que no
  // puedes poner es un catálogo, y para eso está la colección.
  const tuyas = catalogo().filter((c) => (p.cartas[c.id] ?? 0) > 0);
  const topeDe = (c) => Math.min(limiteDe(c.id), p.cartas[c.id] ?? 0);
  const enMazo = tuyas.filter((c) => (editando.cartas[c.id] ?? 0) > 0)
    .sort((a, b) => a.coste - b.coste || a.binomial.localeCompare(b.binomial));
  const lista = pestana === 'mazo' ? enMazo : tuyas;
  const distintas = enMazo.length;

  dom.mazosCuerpo.innerHTML = `
    <input class="mazo-nombre" id="mazo-nombre" maxlength="24" value="${editando.nombre.replace(/"/g, '&quot;')}">
    <div class="mazo-marcador">
      <b class="${v.total === TAM_MAZO ? 'bien' : 'mal'}">${v.total}</b><span>/${TAM_MAZO}</span>
      <span class="mazo-barra"><i style="width:${Math.min(100, (100 * v.total) / TAM_MAZO).toFixed(0)}%"
            class="${v.total === TAM_MAZO ? 'bien' : ''}"></i></span>
      <span class="mazo-distintas">${distintas} distintas</span>
    </div>
    ${curvaHTML(editando.cartas)}
    <div class="mazo-pestanas">
      <button class="chip ${pestana === 'mazo' ? 'on' : ''}" data-pestana="mazo">En el mazo · ${v.total}</button>
      <button class="chip ${pestana === 'anadir' ? 'on' : ''}" data-pestana="anadir">Tu colección · ${tuyas.length}</button>
    </div>
    ${lista.length === 0
    ? '<p class="desc-vacio">El mazo está vacío. Cambia a «Tu colección» para ir metiendo cartas.</p>'
    : lista.map((c) => filaEditor(c, editando.cartas[c.id] ?? 0, topeDe(c), p, pestana === 'anadir')).join('')}`;

  dom.mazosPie.innerHTML = `
    ${v.problemas.length ? `<p class="meta-nota mal">${v.problemas[0]}</p>` : '<p class="meta-nota">Listo para jugar.</p>'}
    <div class="fila">
      <button class="boton-secundario" data-rellenar>Autocompletar</button>
      <button class="boton-secundario" data-vaciar ${v.total === 0 ? 'disabled' : ''}>Vaciar</button>
      <button class="boton-secundario" data-cancelar>Cancelar</button>
    </div>
    <button class="boton-grande" data-guardar ${v.valido ? '' : 'disabled'}>Guardar y usar</button>`;

  const nombre = id('mazo-nombre');
  nombre.oninput = () => { editando.nombre = nombre.value; };

  dom.mazosCuerpo.onclick = (e) => {
    const tab = e.target.closest('[data-pestana]');
    const mas = e.target.closest('[data-mas]');
    const menos = e.target.closest('[data-menos]');
    const mini = e.target.closest('.mini[data-card]');
    if (tab) { editando.pestana = tab.dataset.pestana; pintarEditor(); }
    else if (mas) { const c = mas.dataset.mas; editando.cartas[c] = (editando.cartas[c] ?? 0) + 1; pintarEditor(); }
    else if (menos) {
      const c = menos.dataset.menos;
      editando.cartas[c] = Math.max(0, (editando.cartas[c] ?? 0) - 1);
      if (editando.cartas[c] === 0) delete editando.cartas[c];
      pintarEditor();
    } else if (mini) abrirFicha(fichaHTML(mini.dataset.card));
  };

  dom.mazosPie.onclick = (e) => {
    if (e.target.closest('[data-cancelar]')) { editando = null; pintarMazos(); return; }
    if (e.target.closest('[data-rellenar]')) { autocompletar(); return; }
    if (e.target.closest('[data-vaciar]')) { editando.cartas = {}; pintarEditor(); return; }
    const g = e.target.closest('[data-guardar]');
    if (!g || g.disabled) return;
    const perfil = cargarPerfil();
    const mazos = perfil.mazos.slice();
    const entrada = { nombre: editando.nombre.trim() || 'Sin nombre', cartas: editando.cartas };
    const indice = editando.indice < 0 ? mazos.length : editando.indice;
    if (editando.indice < 0) mazos.push(entrada); else mazos[indice] = entrada;
    // Guardar y USAR: guardarlo y dejarlo sin activar obligaba a un segundo
    // viaje a la lista para hacer lo único que se quería hacer.
    actualizarPerfil({ mazos, activo: indice });
    editando = null;
    pintarMazos();
    pintarMenu();
  };
}

/**
 * Completa el mazo hasta 50 con lo que haya, empezando por lo que menos tienes
 * repartido. No busca el mejor mazo: busca uno legal, para que nadie se quede
 * atascado a tres cartas del final contando copias a mano.
 */
function autocompletar() {
  const p = cargarPerfil();
  const disponible = catalogo()
    .map((c) => ({ id: c.id, tope: Math.min(limiteDe(c.id), p.cartas[c.id] ?? 0) }))
    .filter((c) => c.tope > 0);

  let total = totalDe(editando.cartas);
  let movio = true;
  while (total < TAM_MAZO && movio) {
    movio = false;
    for (const c of disponible) {
      if (total >= TAM_MAZO) break;
      const n = editando.cartas[c.id] ?? 0;
      if (n >= c.tope) continue;
      editando.cartas[c.id] = n + 1;
      total += 1;
      movio = true;
    }
  }
  pintarEditor();
}

// --------------------------------------------------------------- recompensa

/** Monedas por ganar la partida. Perder no paga: `monedasDerrota` es 0. */
export function recompensar(gano) {
  const p = cargarPerfil();
  const premio = gano ? ECONOMIA.monedasVictoria : ECONOMIA.monedasDerrota;
  actualizarPerfil({ monedas: p.monedas + premio });
  pintarMenu();
  return premio;
}

export { perfilInicial, mazoPorDefecto };
