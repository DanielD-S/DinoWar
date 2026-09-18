// DinoWar — la lista de mazos y el editor.
//
// Salió de meta.js cuando dejó de ser dos listas de texto. Igual que allí: LEE
// de la caché local de forma síncrona —se repinta entero a cada toque— y
// ESCRIBE contra perfil.js, que es quien sabe si el mazo vive aquí o en el
// servidor. La comprobación que manda es la del servidor; validarMazo() es la
// cortesía que dice POR QUÉ antes de mandarlo.
//
// Tres decisiones que conviene conocer:
//
// - La PORTADA de un mazo se calcula, no se elige: la criatura de más rareza
//   que lleve, y a igual rareza la más cara. Elegirla a mano pediría guardar
//   un id más por mazo, y `guardar_mazo` sólo acepta el mapa de cartas: el
//   servidor lo valida clave a clave y una clave que no sea carta lo rechaza.
//   El día que se quiera, es una columna en `mazos`, no un truco en el jsonb.
// - El EMBLEMA es el clado dominante, contado sobre las criaturas; un mazo
//   sin criaturas lleva el tipo de soporte que más repite.
// - El editor es una REJILLA de cartas con su marco, la misma de la colección,
//   y no filas: un mazo se arma mirando las cartas. Tocar la ilustración mete
//   una copia; el nombre abre la ficha. La curva de coste FILTRA al tocarla.

import {
  CARTAS, CARTAS_DE_JEFE, RAREZA, RAREZA_NOMBRE, TIPO, TIPO_NOMBRE, CLADO_NOMBRE, carta,
} from '../data/cards.js';
import {
  TAM_MAZO, LEGENDARIAS_DINO_MAX, limiteDe, validarMazo,
  esLegendariaDino, legendariasDinoEn,
} from '../data/coleccion.js';
import { cartaLegal, copiasMaxEn, textoDeRegla, validarMazoEnTorneo } from '../data/torneos.js';
import { cargarPerfil } from './almacen.js';
import { guardarMazo, usarMazo, borrarMazo } from './perfil.js';
import { fichaHTML, abrirFicha, cartaHTML } from './render.js';
import { arte } from './art.js';

const ORDEN = [RAREZA.LEGENDARIO, RAREZA.EPICO, RAREZA.RARO, RAREZA.COMUN];

/** Los diez grupos por los que se filtra: siete clados y tres familias. */
const GRUPOS = [
  ...['TEROPODO', 'SAUROPODO', 'TIREOFORO', 'ORNITOPODO', 'MARGINOCEFALO', 'PTEROSAURIO', 'MARINO']
    .map((c) => ({ clave: `clado_${c.toLowerCase()}`, nombre: CLADO_NOMBRE[c], filtra: (x) => x.clado === c })),
  ...['CLIMA', 'EVENTO', 'RECURSO']
    .map((t) => ({ clave: `tipo_${t.toLowerCase()}`, nombre: TIPO_NOMBRE[t], filtra: (x) => x.tipo === t })),
];

/**
 * La pulsación larga sobre una carta abre su ficha, con el mismo gesto y los
 * mismos números que el tablero (`input.js`). Aquí hace falta por lo mismo que
 * allí: la carta del editor va a tamaño de rejilla y en la caja del marco sólo
 * cabe el NOMBRE de la habilidad —«Tijera»—, no lo que hace. Y el toque corto
 * ya está cogido: mete una copia.
 */
const LARGA = 400;   // ms de pulsación larga
const UMBRAL = 8;    // px de movimiento: a partir de ahí es un desplazamiento, no una pulsación
/** Los ms tras abrir la ficha en los que un click sobre la rejilla no cuenta. */
const SORDO = 500;

let dom = null;
let pintarMenu = () => {};
let largo = null;    // { t, x, y } mientras el dedo sigue abajo
let abrioLarga = 0;  // cuándo abrió la ficha la última pulsación larga
let editando = null;        // { indice, nombre, cartas, pestana, filtro, torneo } mientras se edita
let confirmando = null;     // índice del mazo con el «¿borrar?» abierto

const esDino = (c) => c.tipo === TIPO.DINOSAURIO;
const nombreHTML = (c) => (esDino(c) ? `<i>${c.binomial}</i>` : c.binomial);
const escapar = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const totalDe = (mazo) => Object.values(mazo).reduce((a, b) => a + b, 0);
const emblemaHTML = (clave) => `<i class="emblema emb-${clave}" aria-hidden="true"></i>`;

export function montarMazos({ titulo, cuerpo, pie, alPintarMenu }) {
  dom = { titulo, cuerpo, pie };
  pintarMenu = alPintarMenu;
}

/**
 * Con qué torneo se está armando, o null. Es un modo del EDITOR y no un estado
 * de la pantalla: se entra desde el panel del torneo y se sale al guardar, y
 * mientras dura, la colección se filtra a lo que entra y el validador es el
 * del torneo. Lo pone `abrirMazos({ torneo, alElegir })`.
 *
 * `alElegir` es lo que se hace con el mazo escogido: en un torneo, entrar con
 * él. No se «usa» —el mazo activo es el de fuera del torneo y cambiarlo sería
 * un efecto secundario que nadie pidió—: el mazo de una racha lo guarda el
 * servidor al entrar y no vuelve a leerse de aquí.
 */
let torneo = null;
let alElegir = null;

export function abrirMazos(opciones = {}) {
  editando = null;
  confirmando = null;
  torneo = opciones.torneo ?? null;
  alElegir = opciones.alElegir ?? null;
  pintarMazos();
}

/** Valida con la regla del torneo si se está armando para uno. */
const validar = (mazo, cartas) =>
  (torneo ? validarMazoEnTorneo(mazo, cartas, torneo) : validarMazo(mazo, cartas));

/** El set, más las cartas de jefe que ya tengas: como en la colección. */
function catalogo(p) {
  const deJefe = Object.values(CARTAS_DE_JEFE).filter((c) => (p.cartas[c.id] ?? 0) > 0);
  return [...Object.values(CARTAS), ...deJefe]
    .sort((a, b) => ORDEN.indexOf(a.rareza) - ORDEN.indexOf(b.rareza)
      || a.coste - b.coste || a.binomial.localeCompare(b.binomial));
}

/** Las cartas del mazo, resueltas, con sus copias. */
const cartasDe = (mazo) => Object.entries(mazo)
  .filter(([id, n]) => n > 0 && (CARTAS[id] || CARTAS_DE_JEFE[id]))
  .map(([id, n]) => ({ c: carta(id), n }));

/**
 * La criatura de más rareza; a igual rareza la más cara. Null si no hay nada.
 * La usa también la presentación de la partida, como retrato de cada bando.
 */
export function portadaDe(mazo) {
  const lista = cartasDe(mazo);
  const dinos = lista.filter((x) => esDino(x.c));
  const de = dinos.length ? dinos : lista;
  if (!de.length) return null;
  return de.sort((a, b) => ORDEN.indexOf(a.c.rareza) - ORDEN.indexOf(b.c.rareza) || b.c.coste - a.c.coste)[0].c.id;
}

/**
 * El grupo que más pesa en el mazo, o null si está vacío. Lo usa también el
 * marcador del final, para poner a cada bando su emblema.
 */
export function emblemaDe(mazo) {
  const lista = cartasDe(mazo);
  const cuenta = new Map();
  for (const { c, n } of lista) {
    const g = GRUPOS.find((x) => x.filtra(c));
    if (g) cuenta.set(g, (cuenta.get(g) ?? 0) + n);
  }
  // Las criaturas mandan: un mazo con 30 saurópodos y 20 eventos es de saurópodos.
  const orden = [...cuenta.entries()].sort((a, b) => {
    const da = a[0].clave.startsWith('clado_') ? 1 : 0;
    const db = b[0].clave.startsWith('clado_') ? 1 : 0;
    return db - da || b[1] - a[1];
  });
  return orden[0]?.[0] ?? null;
}

function resumenDe(mazo) {
  const lista = cartasDe(mazo);
  const suma = (f) => lista.filter(f).reduce((a, x) => a + x.n, 0);
  return {
    criaturas: suma((x) => esDino(x.c)),
    soporte: suma((x) => !esDino(x.c)),
    legendarias: suma((x) => x.c.rareza === RAREZA.LEGENDARIO),
    distintas: lista.length,
  };
}

// ------------------------------------------------------------------ lista

function pintarMazos() {
  if (editando) return pintarEditor();
  // Volver del editor deja sus manejadores de puntero puestos sobre el mismo
  // nodo: en la lista no hay cartas que pulsar, así que se sueltan.
  soltarLargo();
  dom.cuerpo.onpointerdown = null;
  dom.cuerpo.onpointermove = null;
  dom.cuerpo.onpointerup = null;
  dom.cuerpo.onpointercancel = null;
  const p = cargarPerfil();
  dom.titulo.textContent = 'Mazos';

  dom.cuerpo.innerHTML = p.mazos.map((m, i) => {
    const v = validar(m.cartas, p.cartas);
    const activo = i === p.activo;
    const portada = portadaDe(m.cartas);
    const emb = emblemaDe(m.cartas);
    const r = resumenDe(m.cartas);
    const acciones = confirmando === i
      ? `<span class="mazo-pregunta">¿Borrar «${escapar(m.nombre)}»?</span>
         <button class="accion mal" data-borrar-si="${i}">Sí, borrar</button>
         <button class="accion" data-borrar-no>No</button>`
      : `<button class="accion" data-usar="${i}" ${(alElegir ? !v.valido : activo || !v.valido) ? 'disabled' : ''}>${alElegir ? 'Entrar con éste' : (activo ? 'En uso' : 'Usar')}</button>
         <button class="accion" data-editar="${i}">Editar</button>
         <button class="accion" data-duplicar="${i}">Duplicar</button>
         <button class="accion" data-borrar="${i}" ${p.mazos.length <= 1 ? 'disabled' : ''}>Borrar</button>`;
    return `<article class="mazo ${activo ? 'activo' : ''}">
      <div class="mazo-placa">
        <div class="mazo-ventana">${portada ? arte(portada) : '<span class="mazo-vacia">◆</span>'}</div>
        <div class="mazo-banda">
          <span class="mazo-nom">${escapar(m.nombre)}</span>
          <span class="mazo-sub">${emb ? `${emblemaHTML(emb.clave)}${emb.nombre}` : 'Vacío'}
            <span class="sep">·</span> <b class="${v.valido ? '' : 'mal'}">${v.total}/${TAM_MAZO}</b>
            ${r.legendarias ? `<span class="sep">·</span> ${r.legendarias} legendaria${r.legendarias === 1 ? '' : 's'}` : ''}
          </span>
        </div>
        ${activo ? '<i class="mazo-sello" title="En uso"></i>' : ''}
      </div>
      <div class="mazo-acciones">${acciones}</div>
    </article>`;
  }).join('');

  dom.pie.innerHTML = torneo
    ? `<p class="meta-nota">Armando para «${escapar(torneo.nombre)}». ${escapar(textoDeRegla(torneo))}
       Un mazo que no cumpla la regla no entra, aunque sea legal fuera del torneo.</p>
       <button class="boton-grande" data-nuevo>Mazo nuevo</button>`
    : `<p class="meta-nota">El mazo en uso es el que llevas a la partida.
    Son ${TAM_MAZO} cartas exactas, y de cada carta caben tantas copias como diga su rareza.</p>
    <button class="boton-grande" data-nuevo>Mazo nuevo</button>`;

  dom.cuerpo.onclick = (e) => {
    const b = (k) => e.target.closest(`[data-${k}]`);
    const usar = b('usar');
    const editar = b('editar');
    const duplicar = b('duplicar');
    const borrar = b('borrar');
    const si = b('borrar-si');
    if (usar && !usar.disabled && alElegir) {
      usar.disabled = true;
      alElegir(p.mazos[Number(usar.dataset.usar)].cartas);
    } else if (usar && !usar.disabled) {
      usar.disabled = true;
      usarMazo(Number(usar.dataset.usar))
        .catch((err) => { dom.pie.innerHTML += `<p class="meta-nota mal">${escapar(err.message)}</p>`; })
        .finally(() => { pintarMazos(); pintarMenu(); });
    } else if (editar) {
      const i = Number(editar.dataset.editar);
      editando = { indice: i, nombre: p.mazos[i].nombre, cartas: { ...p.mazos[i].cartas } };
      pintarEditor();
    } else if (duplicar) {
      const i = Number(duplicar.dataset.duplicar);
      // Un mazo nuevo con las mismas cartas: se edita y se guarda como otro.
      editando = { indice: -1, nombre: `${p.mazos[i].nombre} (copia)`.slice(0, 24), cartas: { ...p.mazos[i].cartas } };
      pintarEditor();
    } else if (borrar && !borrar.disabled) {
      confirmando = Number(borrar.dataset.borrar);
      pintarMazos();
    } else if (b('borrar-no')) {
      confirmando = null;
      pintarMazos();
    } else if (si) {
      const i = Number(si.dataset.borrarSi);
      si.disabled = true;
      borrarMazo(i)
        .catch((err) => { dom.pie.innerHTML += `<p class="meta-nota mal">${escapar(err.message)}</p>`; })
        .finally(() => { confirmando = null; pintarMazos(); pintarMenu(); });
    }
  };
  dom.pie.onclick = (e) => {
    if (!e.target.closest('[data-nuevo]')) return;
    editando = { indice: -1, nombre: `Mazo ${p.mazos.length + 1}`, cartas: {} };
    pintarEditor();
  };
}

// ----------------------------------------------------------------- editor

/** Reparto de costes del mazo, en cubos de 0 a 7+. */
function curvaDeCoste(mazo) {
  const cubos = Array.from({ length: 8 }, () => 0);
  for (const { c, n } of cartasDe(mazo)) cubos[Math.min(7, c.coste)] += n;
  return cubos;
}

/** La curva, y cada barra es un filtro: tocar el 3 enseña las cartas de coste 3. */
function curvaHTML(mazo, filtroCoste) {
  const cubos = curvaDeCoste(mazo);
  const alto = Math.max(1, ...cubos);
  return `<div class="mazo-curva" role="group" aria-label="Curva de coste">${cubos.map((n, i) => {
    const pct = Math.round((100 * n) / alto);
    const nivel = n === 0 ? 0 : Math.min(3, Math.floor((4 * n) / (alto + 0.01)));
    return `<button class="cb ${filtroCoste === i ? 'on' : ''}" data-coste="${i}"
      title="${n} cartas de coste ${i === 7 ? '7 o más' : i}">
      <i class="n${nivel}" style="height:${pct}%"></i><em>${i === 7 ? '7+' : i}</em><small>${n || ''}</small>
    </button>`;
  }).join('')}</div>`;
}

const filtroVacio = () => ({ grupo: null, rareza: null, coste: null, texto: '' });

function pasaFiltro(c, f) {
  if (f.grupo && !GRUPOS.find((g) => g.clave === f.grupo).filtra(c)) return false;
  if (f.rareza && c.rareza !== f.rareza) return false;
  if (f.coste !== null && Math.min(7, c.coste) !== f.coste) return false;
  if (f.texto) {
    const t = f.texto.toLowerCase();
    if (!c.binomial.toLowerCase().includes(t) && !(c.rasgoNombre ?? '').toLowerCase().includes(t)) return false;
  }
  return true;
}

/**
 * La ficha de una carta CON el recorrido de lo que hay pintado: desde ella se
 * pasa a la de al lado sin cerrarla, que armando un mazo se leen muchas. La
 * lista sale del DOM y no del catálogo: lo que se ve es lo que hay, con la
 * pestaña y los filtros puestos.
 */
function abrirFichaDe(id) {
  const ids = [...dom.cuerpo.querySelectorAll('.mazo-celda[data-card]')].map((x) => x.dataset.card);
  abrirFicha(fichaHTML(id), { ids, i: ids.indexOf(id) });
}

/** Cancela la pulsación larga en curso, si la hay. */
function soltarLargo() {
  if (largo) clearTimeout(largo.t);
  largo = null;
}

/**
 * Copias de esta carta que caben AHORA MISMO en el mazo que se edita: su tope
 * por rareza, lo que tienes, y —si es criatura legendaria— lo que queda del
 * tope de familia. El presupuesto se suma a lo que la carta YA lleva puesto,
 * que si no una legendaria metida cuando quedaba sitio se leería «1/0» en
 * cuanto el mazo se llenara de legendarias.
 */
function topeDe(cardId, mazo, p) {
  // En un torneo manda el tope del torneo, que puede ser MENOR que el de
  // rareza —el singleton deja una copia de una común que admite siete—.
  const suyo = torneo ? copiasMaxEn(torneo, cardId) : limiteDe(cardId);
  const tope = Math.min(suyo, p.cartas[cardId] ?? 0);
  if (!esLegendariaDino(cardId)) return tope;
  const n = mazo[cardId] ?? 0;
  const queda = Math.max(0, LEGENDARIAS_DINO_MAX - legendariasDinoEn(mazo));
  return Math.min(tope, n + queda);
}

/**
 * Una celda del editor: la carta con su marco, el contador y el paso. `mal`
 * es una copia de más —por rareza, por el tope de legendarias o porque no la
 * tienes— y se ve en la propia carta, no sólo en el aviso de abajo.
 */
function celda(c, n, p) {
  const tope = topeDe(c.id, editando.cartas, p);
  const mal = n > tope;
  const llena = n >= tope && !mal;
  return `<div class="col-carta mazo-celda rareza-${c.rareza} ${n > 0 ? 'puesta' : ''} ${mal ? 'mal' : ''} ${llena ? 'llena' : ''}"
               data-card="${c.id}">
    <div class="mazo-arte" data-mas="${c.id}" role="button" aria-label="Meter una copia">
      ${cartaHTML(c.id, { variante: 'col' })}
      ${n > 0 ? `<span class="mazo-n">${n}</span>` : ''}
    </div>
    <div class="mazo-paso">
      <button data-menos="${c.id}" ${n === 0 ? 'disabled' : ''} aria-label="Quitar una copia">−</button>
      <span class="mazo-cuenta ${mal ? 'mal' : ''}">${n}/${tope}</span>
      <button data-mas="${c.id}" ${n >= tope ? 'disabled' : ''} aria-label="Meter una copia">+</button>
    </div>
    <div class="col-nombre" data-ficha="${c.id}" role="button"
         aria-label="Ver la ficha de ${escapar(c.binomial)}">${nombreHTML(c)}<i class="col-info" aria-hidden="true">i</i></div>
  </div>`;
}

function pintarEditor() {
  const p = cargarPerfil();
  const v = validar(editando.cartas, p.cartas);
  editando.filtro ??= filtroVacio();
  const f = editando.filtro;
  const pestana = editando.pestana ?? (v.total === 0 ? 'anadir' : 'mazo');
  dom.titulo.textContent = torneo ? torneo.nombre : (editando.indice < 0 ? 'Mazo nuevo' : 'Editar mazo');

  // Sólo lo que tienes: un editor que enseña lo que no puedes poner es un
  // catálogo, y para eso está la colección.
  // Y, en un torneo, sólo lo que entra: enseñar lo que la regla veta sería
  // ofrecer un botón que no se puede pulsar en cada carta de la colección.
  const tuyas = catalogo(p)
    .filter((c) => (p.cartas[c.id] ?? 0) > 0)
    .filter((c) => !torneo || cartaLegal(torneo, c.id));
  const enMazo = tuyas.filter((c) => (editando.cartas[c.id] ?? 0) > 0);
  const base = pestana === 'mazo' ? enMazo : tuyas;
  const lista = base.filter((c) => pasaFiltro(c, f));
  const r = resumenDe(editando.cartas);
  const leg = legendariasDinoEn(editando.cartas);
  const portada = portadaDe(editando.cartas);
  const emb = emblemaDe(editando.cartas);
  const filtrando = f.grupo || f.rareza || f.coste !== null || f.texto;

  dom.cuerpo.innerHTML = `
    <div class="mazo-cabecera">
      <div class="mazo-ventana grande">${portada ? arte(portada) : '<span class="mazo-vacia">◆</span>'}</div>
      <div class="mazo-cabecera-datos">
        <input class="mazo-nombre" id="mazo-nombre" maxlength="24" value="${escapar(editando.nombre)}" aria-label="Nombre del mazo">
        <div class="mazo-marcador">
          <b class="${v.total === TAM_MAZO ? 'bien' : 'mal'}">${v.total}</b><span>/${TAM_MAZO}</span>
          <span class="mazo-barra"><i style="width:${Math.min(100, (100 * v.total) / TAM_MAZO).toFixed(0)}%"
                class="${v.total === TAM_MAZO ? 'bien' : ''}"></i></span>
        </div>
        <div class="mazo-resumen">${emb ? `${emblemaHTML(emb.clave)}${emb.nombre}<span class="sep">·</span>` : ''}
          ${r.criaturas} criaturas<span class="sep">·</span>${r.soporte} soporte<span class="sep">·</span>${r.distintas} distintas
          <span class="sep">·</span><span class="${leg > LEGENDARIAS_DINO_MAX ? 'mal' : ''}"
            title="Criaturas legendarias que caben en un mazo">◆ ${leg}/${LEGENDARIAS_DINO_MAX}</span>
        </div>
      </div>
    </div>
    ${curvaHTML(editando.cartas, f.coste)}
    <div class="mazo-pestanas">
      <button class="chip ${pestana === 'mazo' ? 'on' : ''}" data-pestana="mazo">En el mazo · ${v.total}</button>
      <button class="chip ${pestana === 'anadir' ? 'on' : ''}" data-pestana="anadir">Tu colección · ${tuyas.length}</button>
    </div>
    <div class="mazo-filtros">
      <input type="search" class="mazo-busca" id="mazo-busca" placeholder="Buscar" value="${escapar(f.texto)}" aria-label="Buscar carta">
      <div class="mazo-emblemas">${GRUPOS.map((g) => `<button class="${f.grupo === g.clave ? 'on' : ''}" data-grupo="${g.clave}"
          title="${g.nombre}" aria-label="${g.nombre}" aria-pressed="${f.grupo === g.clave}">${emblemaHTML(g.clave)}</button>`).join('')}</div>
    </div>
    <div class="mazo-rarezas">${ORDEN.map((x) => `<button class="chip ${f.rareza === x ? 'on' : ''}" data-rareza="${x}">${RAREZA_NOMBRE[x]}</button>`).join('')}
      ${filtrando ? '<button class="chip quitar" data-limpiar>× filtros</button>' : ''}</div>
    ${lista.length === 0
    ? `<p class="desc-vacio">${base.length === 0
      ? 'El mazo está vacío. Toca una carta de «Tu colección» para meterla.'
      : 'Ninguna carta pasa el filtro.'}</p>`
    : `<div class="col-rejilla mazo-rejilla">${lista.map((c) => celda(c, editando.cartas[c.id] ?? 0, p)).join('')}</div>`}`;

  dom.pie.innerHTML = `
    ${torneo ? `<p class="meta-nota">${escapar(textoDeRegla(torneo))}</p>` : ''}
    ${v.problemas.length ? `<p class="meta-nota mal">${escapar(v.problemas[0])}</p>` : '<p class="meta-nota">Listo para jugar.</p>'}
    <div class="fila">
      <button class="boton-secundario" data-rellenar ${v.total >= TAM_MAZO ? 'disabled' : ''}>Autocompletar</button>
      <button class="boton-secundario" data-vaciar ${v.total === 0 ? 'disabled' : ''}>Vaciar</button>
      <button class="boton-secundario" data-cancelar>Cancelar</button>
    </div>
    <button class="boton-grande" data-guardar ${v.valido ? '' : 'disabled'}>Guardar y usar</button>`;

  const nombre = document.getElementById('mazo-nombre');
  nombre.oninput = () => { editando.nombre = nombre.value; };
  const busca = document.getElementById('mazo-busca');
  // Se repinta al escribir, y el foco se devuelve al campo con el cursor al
  // final: sin esto cada letra cerraba el teclado del móvil.
  busca.oninput = () => {
    f.texto = busca.value;
    pintarEditor();
    const b = document.getElementById('mazo-busca');
    b.focus();
    b.setSelectionRange(b.value.length, b.value.length);
  };

  // Pulsación larga sobre la carta: abre la ficha. No se hace `preventDefault`
  // en `pointerdown` —la rejilla tiene que poder desplazarse— así que el
  // desplazamiento se detecta por distancia y cancela el temporizador.
  dom.cuerpo.onpointerdown = (e) => {
    const arte = e.target.closest('.mazo-arte');
    if (!arte) return;
    soltarLargo();
    const id = arte.closest('[data-card]').dataset.card;
    largo = {
      x: e.clientX,
      y: e.clientY,
      t: setTimeout(() => {
        largo = null;
        abrioLarga = Date.now();
        try { navigator.vibrate?.(12); } catch { /* sin vibración: no pasa nada */ }
        abrirFichaDe(id);
      }, LARGA),
    };
  };
  dom.cuerpo.onpointermove = (e) => {
    if (largo && Math.hypot(e.clientX - largo.x, e.clientY - largo.y) > UMBRAL) soltarLargo();
  };
  dom.cuerpo.onpointerup = soltarLargo;
  dom.cuerpo.onpointercancel = soltarLargo;

  dom.cuerpo.onclick = (e) => {
    // El click que sigue a una pulsación larga no mete copia. Va por reloj y
    // no por bandera: al abrir la ficha el dedo se levanta ENCIMA de la hoja,
    // así que ese click puede no llegar aquí nunca y una bandera se quedaría
    // puesta, comiéndose el siguiente toque de verdad.
    if (Date.now() - abrioLarga < SORDO) return;
    const b = (k) => e.target.closest(`[data-${k}]`);
    const tab = b('pestana');
    const grupo = b('grupo');
    const rareza = b('rareza');
    const coste = b('coste');
    const mas = b('mas');
    const menos = b('menos');
    const ficha = b('ficha');
    if (tab) { editando.pestana = tab.dataset.pestana; pintarEditor(); return; }
    if (grupo) { f.grupo = f.grupo === grupo.dataset.grupo ? null : grupo.dataset.grupo; pintarEditor(); return; }
    if (rareza) { f.rareza = f.rareza === rareza.dataset.rareza ? null : rareza.dataset.rareza; pintarEditor(); return; }
    if (coste) { const n = Number(coste.dataset.coste); f.coste = f.coste === n ? null : n; pintarEditor(); return; }
    if (b('limpiar')) { editando.filtro = filtroVacio(); pintarEditor(); return; }
    if (ficha) { abrirFichaDe(ficha.dataset.ficha); return; }
    if (menos && !menos.disabled) {
      const c = menos.dataset.menos;
      editando.cartas[c] = Math.max(0, (editando.cartas[c] ?? 0) - 1);
      if (editando.cartas[c] === 0) delete editando.cartas[c];
      pintarEditor();
      return;
    }
    if (mas) {
      const c = mas.dataset.mas;
      const tope = topeDe(c, editando.cartas, p);
      if ((editando.cartas[c] ?? 0) >= tope) return;
      editando.cartas[c] = (editando.cartas[c] ?? 0) + 1;
      pintarEditor();
    }
  };

  dom.pie.onclick = (e) => {
    if (e.target.closest('[data-cancelar]')) { editando = null; pintarMazos(); return; }
    if (e.target.closest('[data-rellenar]')) { autocompletar(p); return; }
    if (e.target.closest('[data-vaciar]')) { editando.cartas = {}; pintarEditor(); return; }
    const g = e.target.closest('[data-guardar]');
    if (!g || g.disabled) return;
    // Guardar y USAR: guardarlo y dejarlo sin activar obligaba a un segundo
    // viaje a la lista para hacer lo único que se quería hacer.
    g.disabled = true;
    g.textContent = 'Guardando…';
    guardarMazo(editando.indice, editando.nombre.trim() || 'Sin nombre', editando.cartas)
      .then(() => { editando = null; pintarMazos(); pintarMenu(); })
      .catch((err) => {
        // El servidor comprueba que el mazo sea TUYO, no sólo que sea legal.
        // Si dice que no, se enseña su motivo tal cual: es el único que ha
        // mirado la colección de verdad.
        pintarEditor();
        dom.pie.innerHTML += `<p class="meta-nota mal">No se pudo guardar: ${escapar(err.message)}</p>`;
      });
  };
}

/**
 * Completa el mazo hasta 50 con lo que haya. No busca el mejor mazo: busca uno
 * legal y COHERENTE: primero las criaturas del clado que ya domina, luego el
 * resto de criaturas, luego el soporte, y dentro de cada tramo de más barato
 * a más caro, que es lo que una curva sana pide. Nadie se queda a tres cartas
 * del final contando copias a mano.
 */
function autocompletar(p) {
  const emb = emblemaDe(editando.cartas);
  const tramo = (c) => (emb && emb.filtra(c) && esDino(c) ? 0 : esDino(c) ? 1 : 2);
  const disponible = catalogo(p)
    .filter((c) => !torneo || cartaLegal(torneo, c.id))
    .map((c) => ({ id: c.id, c, tope: topeDe(c.id, editando.cartas, p) }))
    .filter((x) => x.tope > 0)
    .sort((a, b) => tramo(a.c) - tramo(b.c) || a.c.coste - b.c.coste);

  let total = totalDe(editando.cartas);
  let movio = true;
  while (total < TAM_MAZO && movio) {
    movio = false;
    for (const x of disponible) {
      if (total >= TAM_MAZO) break;
      const n = editando.cartas[x.id] ?? 0;
      // El tope se vuelve a mirar en cada vuelta y no una vez al principio: el
      // de las criaturas legendarias es de familia y se va gastando según se
      // rellena, así que un tope calculado antes del bucle mete cuatro.
      if (n >= topeDe(x.id, editando.cartas, p)) continue;
      editando.cartas[x.id] = n + 1;
      total += 1;
      movio = true;
    }
  }
  editando.pestana = 'mazo';
  pintarEditor();
}
