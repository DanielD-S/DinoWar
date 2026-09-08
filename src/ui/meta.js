// DinoWar — pantallas de colección, sobres y mazos.
//
// Es la capa de "fuera de la partida": nada de aquí toca el motor de reglas.
// Lee y escribe el perfil con almacen.js y aplica las reglas puras de
// src/data/coleccion.js. La partida sólo recibe, al final, una lista de pares
// [cardId, copias].

import {
  CARTAS, RAREZA, RAREZA_NOMBRE, TIPO, TIPO_NOMBRE, CLADO_NOMBRE, carta,
} from '../data/cards.js';
import {
  ECONOMIA, PROBABILIDAD, GARANTIA, TAM_MAZO,
  abrirSobre, excedente, valorFusion, limiteDe, validarMazo, mazoPorDefecto,
} from '../data/coleccion.js';
import {
  cargarPerfil, actualizarPerfil, anadirCartas, perfilInicial,
} from './almacen.js';
import { arte } from './art.js';
import { fichaHTML, abrirFicha } from './render.js';

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
function catalogo() {
  return Object.values(CARTAS)
    .slice()
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
    return `<div class="col-carta ${esDino(c) ? 'dino' : ''}" role="button" tabindex="0" data-card="${c.id}">
      <div class="col-arte">${arte(c.id)}</div>
      <span class="col-copias${extra ? ' sobra' : ''}">${n}/${limiteDe(c.id)}</span>
      <div class="col-pie">
        <div class="col-nombre">${nombreHTML(c)}</div>
        <div class="col-meta"><span class="col-rar rar-${c.rareza}">${RAREZA_NOMBRE[c.rareza]}</span> · ${familia(c)}</div>
        ${esDino(c) ? `<div class="c-stats fila">
          <span class="st st-a"><i>A</i><b>${c.ataque}</b></span>
          <span class="st st-d"><i>D</i><b>${c.defensa}</b></span>
          <span class="st st-v"><i>V</i><b>${c.vida}</b></span>
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

function pintarSobres(tirada = null, nuevas = new Set()) {
  const p = cargarPerfil();
  pintarMonedas();

  dom.odds.innerHTML = `<tr><th>Rareza</th><td>por carta</td><td>cartas</td></tr>`
    + ORDEN.map((r) => `<tr><th class="col-rar rar-${r}">${RAREZA_NOMBRE[r]}</th>
        <td>${(PROBABILIDAD[r] * 100).toFixed(0)} %</td>
        <td>${Object.values(CARTAS).filter((c) => c.rareza === r).length}</td></tr>`).join('');

  if (!tirada) {
    dom.tirada.className = 'sobre-tirada cerrado';
    dom.tirada.innerHTML = `<div class="sobre-paquete" id="sobre-paquete">
        <div class="sobre-solapa"></div>
        <div class="sobre-sello">◆</div>
      </div>
      <p class="sobre-vacio">Cinco cartas al azar.<br>
        Al menos una ${RAREZA_NOMBRE[GARANTIA].toLowerCase()} o mejor, garantizada.</p>`;
  } else {
    // Cada carta cae boca abajo y se voltea por turnos. El retardo va en una
    // variable CSS para que la animación de reparto y la de volteo compartan
    // el mismo reloj sin encadenar temporizadores en JS.
    dom.tirada.className = 'sobre-tirada abierto';
    dom.tirada.innerHTML = tirada.map((cid, i) => {
      const c = carta(cid);
      const nueva = nuevas.has(cid);
      return `<div class="sobre-carta rareza-${c.rareza} ${nueva ? 'nueva' : ''}"
                   data-card="${cid}" style="--retardo:${i * 220}ms">
        <div class="sobre-giro">
          <div class="sobre-dorso"></div>
          <div class="sobre-frente">
            <div class="col-arte">${arte(cid)}</div>
            <div class="col-pie">
              <div class="col-nombre">${nombreHTML(c)}</div>
              <div class="col-rar rar-${c.rareza}">${RAREZA_NOMBRE[c.rareza]}</div>
              ${nueva ? '<div class="sobre-nueva">NUEVA</div>' : ''}
            </div>
          </div>
        </div>
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
      ? `${abiertos}. Las monedas se ganan jugando: ${ECONOMIA.monedasVictoria} por victoria, ${ECONOMIA.monedasDerrota} por derrota.`
      : `Te faltan ${ECONOMIA.precioSobre - p.monedas} monedas. Se ganan jugando, o fundiendo copias sobrantes en la colección.`;
}

function comprarSobre() {
  const p = cargarPerfil();
  if (!PRUEBAS && p.monedas < ECONOMIA.precioSobre) return;

  const tirada = abrirSobre(Math.random);
  const nuevas = new Set(tirada.filter((cid) => (p.cartas[cid] ?? 0) === 0));

  actualizarPerfil({
    monedas: PRUEBAS ? p.monedas : p.monedas - ECONOMIA.precioSobre,
    sobresAbiertos: p.sobresAbiertos + 1,
  });
  anadirCartas(tirada);
  pintarSobres(tirada, nuevas);
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

function pintarEditor() {
  const p = cargarPerfil();
  const v = validarMazo(editando.cartas, p.cartas);
  dom.mazosTitulo.textContent = 'Editar mazo';

  // Sólo se listan las cartas que tienes: un editor que enseña lo que no
  // puedes poner es un catálogo, y para eso está la colección.
  const tuyas = catalogo().filter((c) => (p.cartas[c.id] ?? 0) > 0);

  dom.mazosCuerpo.innerHTML = `
    <input class="mazo-nombre" id="mazo-nombre" maxlength="24" value="${editando.nombre.replace(/"/g, '&quot;')}">
    <div class="mazo-total">
      <span>Cartas en el mazo</span>
      <b class="${v.total === TAM_MAZO ? 'bien' : 'mal'}">${v.total} / ${TAM_MAZO}</b>
    </div>
    ${tuyas.map((c) => {
    const tope = Math.min(limiteDe(c.id), p.cartas[c.id] ?? 0);
    const n = editando.cartas[c.id] ?? 0;
    return `<div class="mazo-fila">
        <span class="mini" data-card="${c.id}">${arte(c.id)}</span>
        <span class="nom ${esDino(c) ? 'dino' : ''}">${c.binomial}
          <span class="sub col-rar rar-${c.rareza}">${RAREZA_NOMBRE[c.rareza]} · ${familia(c)} · tienes ${p.cartas[c.id]}</span></span>
        <span class="mazo-paso">
          <button data-menos="${c.id}" ${n === 0 ? 'disabled' : ''}>−</button>
          <b class="${n === tope ? 'lleno' : ''}">${n}/${tope}</b>
          <button data-mas="${c.id}" ${n >= tope ? 'disabled' : ''}>+</button>
        </span>
      </div>`;
  }).join('')}`;

  dom.mazosPie.innerHTML = `
    ${v.problemas.length ? `<p class="meta-nota mal">${v.problemas[0]}</p>` : '<p class="meta-nota">Listo para jugar.</p>'}
    <div class="fila">
      <button class="boton-secundario" data-rellenar>Autocompletar</button>
      <button class="boton-secundario" data-cancelar>Cancelar</button>
      <button class="boton-grande" data-guardar ${v.valido ? '' : 'disabled'}>Guardar</button>
    </div>`;

  const nombre = id('mazo-nombre');
  nombre.oninput = () => { editando.nombre = nombre.value; };

  dom.mazosCuerpo.onclick = (e) => {
    const mas = e.target.closest('[data-mas]');
    const menos = e.target.closest('[data-menos]');
    const mini = e.target.closest('.mini[data-card]');
    if (mas) { const c = mas.dataset.mas; editando.cartas[c] = (editando.cartas[c] ?? 0) + 1; pintarEditor(); }
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
    const g = e.target.closest('[data-guardar]');
    if (!g || g.disabled) return;
    const perfil = cargarPerfil();
    const mazos = perfil.mazos.slice();
    const entrada = { nombre: editando.nombre.trim() || 'Sin nombre', cartas: editando.cartas };
    if (editando.indice < 0) mazos.push(entrada); else mazos[editando.indice] = entrada;
    actualizarPerfil({ mazos });
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

/** Monedas por terminar una partida. Se gana algo también perdiendo. */
export function recompensar(gano) {
  const p = cargarPerfil();
  const premio = gano ? ECONOMIA.monedasVictoria : ECONOMIA.monedasDerrota;
  actualizarPerfil({ monedas: p.monedas + premio });
  pintarMenu();
  return premio;
}

export { perfilInicial, mazoPorDefecto };
