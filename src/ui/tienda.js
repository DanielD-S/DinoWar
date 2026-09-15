// DinoWar — la tienda: comprar y equipar cosméticos con dinomonedas.
//
// Lo que se vende está en src/data/cosmeticos.js y la regla que lo acota es la
// del autor: nada que dé ventaja. Aquí se pinta, se compra, se equipa y se
// aplica lo equipado al resto del juego.
//
// Cuatro cosas que conviene saber:
//
// - Comprar pide CONFIRMAR en la propia ficha, como borrar un mazo: cientos de
//   dinomonedas son varios sobres y un toque sin querer no debería gastarlas.
// - El precio que se cobra es el del servidor. El cliente sólo manda el id;
//   el número de la ficha es para decidir, no para pagar.
// - Lo equipado se aplica con variables CSS en la raíz del documento. Tuyas:
//   `--dorso`, `--tapete`, `--tapete-medallon`, `--estandarte-propio`,
//   `--cinta-propia`. Del rival de un duelo: `--dorso-rival`,
//   `--estandarte-rival`, `--cinta-rival` (y `--cinta-rival-giro`, porque las
//   cintas se dibujan apuntando a la izquierda y la del rival va a la derecha).
//   Sin variable, cada regla usa lo de siempre. El retrato es la excepción:
//   `--retrato-propio` va siempre y `--retrato-rival` sólo en un duelo.
// - El TAPETE no viaja al rival: cada uno ve el suyo en su propio tablero.
//
// El arte llega aparte (assets/PROMPTS.md, «La tienda» y «Los tapetes») y
// `ARTE_LISTO` es el interruptor, vigilado por test/tienda.test.js.

import {
  COSMETICOS, TIPO_COSMETICO, PACKS, precioDePack, loTiene, equipadoDe, cosmeticoPorId, porDefecto,
} from '../data/cosmeticos.js';
import { cargarPerfil } from './almacen.js';
import { comprarCosmetico, equiparCosmetico, PRUEBAS } from './perfil.js';
import { rpc, hayServidor } from './supabase.js';

/** Si las piezas de la tienda están en el disco. Lo vigila test/tienda.test.js. */
export const ARTE_LISTO = true;

/** Lo que sale de `tools/tienda.py`, sin extensión. */
export const PIEZAS = Object.freeze([
  'placa_tienda', 'dorso_ambar', 'dorso_obsidiana',
  'tapete_ambar', 'tapete_obsidiana', 'tapete_morrison', 'tapete_volcan',
  'medallon_ambar', 'medallon_obsidiana', 'medallon_morrison', 'medallon_volcan',
  'estandarte_ambar', 'estandarte_obsidiana', 'estandarte_fosil', 'estandarte_volcan',
  'cinta_ambar', 'cinta_obsidiana',
  'dorso_morrison', 'dorso_hell_creek', 'dorso_kem_kem', 'dorso_volcan',
  'tapete_hell_creek', 'tapete_kem_kem', 'tapete_solnhofen', 'tapete_excavacion',
  'cinta_fosil', 'cinta_volcan',
  'retrato_paleontologa', 'retrato_buscador', 'retrato_amonite', 'retrato_huevo', 'retrato_placas',
  'marco_retrato', 'holografico',
  'retrato_cientifico', 'retrato_cientifica', 'retrato_cazador', 'retrato_trex',
  'estandarte_helecho', 'cinta_helecho',
  'medallon_hell_creek', 'medallon_kem_kem', 'medallon_solnhofen', 'medallon_excavacion',
]);

const T = TIPO_COSMETICO;

const SECCIONES = [
  {
    tipo: T.RETRATO,
    titulo: 'Retratos',
    nota: 'Tu cara en el menú, en la presentación antes de cada partida y en el marcador final. En los duelos lo ve también tu rival.',
  },
  {
    tipo: T.DORSO,
    titulo: 'Dorsos de carta',
    nota: 'El reverso de tus cartas: al abrir sobres, al robar y en tu mazo del marcador final. En los duelos lo ve también tu rival.',
  },
  {
    tipo: T.TAPETE,
    titulo: 'Tapetes',
    nota: 'El fondo de tu tablero durante la partida. Cada jugador ve el suyo.',
  },
  {
    tipo: T.ESTANDARTE,
    titulo: 'Estandartes',
    nota: 'Tu estandarte en la presentación antes de cada partida y tu cinta en el marcador final. En los duelos lo ve también tu rival.',
  },
];

let dom = null;
let alCambiar = () => {};
let alPack = () => {};
let confirmando = null;   // id del artículo con el «¿comprar?» abierto
let ocupado = false;

const url = (ruta) => `url('${ruta}')`;

function poner(raiz, nombre, valor) {
  if (valor) raiz.setProperty(nombre, valor);
  else raiz.removeProperty(nombre);
}

/** La imagen y el filtro con los que se ve un artículo hoy. */
function aspecto(c) {
  if (c.porDefecto || ARTE_LISTO || !c.provisional) return { imagen: c.arte, filtro: 'none' };
  return { imagen: COSMETICOS.find((x) => x.tipo === c.tipo && x.porDefecto).arte, filtro: c.provisional };
}

/**
 * Aplica lo que llevas puesto al documento. Se llama en cada repintado del
 * menú, que ocurre al sincronizar con el servidor y tras cada cambio.
 */
export function aplicarEquipado(perfil = cargarPerfil()) {
  if (typeof document === 'undefined') return;
  const raiz = document.documentElement.style;

  const dorso = equipadoDe(perfil, T.DORSO);
  const { imagen, filtro } = aspecto(dorso);
  poner(raiz, '--dorso', dorso.porDefecto ? null : url(imagen));
  poner(raiz, '--dorso-filtro', dorso.porDefecto || filtro === 'none' ? null : filtro);

  const tapete = equipadoDe(perfil, T.TAPETE);
  poner(raiz, '--tapete', tapete.porDefecto ? null : url(tapete.arte));
  poner(raiz, '--tapete-medallon', tapete.porDefecto ? null : url(tapete.medallon));

  const estandarte = equipadoDe(perfil, T.ESTANDARTE);
  poner(raiz, '--estandarte-propio', estandarte.porDefecto ? null : url(estandarte.arte));
  // Un estandarte sin cinta propia deja la de siempre en el marcador.
  poner(raiz, '--cinta-propia', estandarte.porDefecto || !estandarte.cinta ? null : url(estandarte.cinta));

  // El retrato va SIEMPRE, también el gratuito: antes de la tienda no había
  // retrato que conservar, así que sin variable no se pinta ninguno.
  poner(raiz, '--retrato-propio', url(equipadoDe(perfil, T.RETRATO).arte));
}

/**
 * Aplica lo que lleva puesto el rival de un duelo. `equipado` es el {tipo: id}
 * que devuelve el servidor; lo que no es un artículo conocido se ignora y cae
 * a lo de siempre. Con null, se quita todo: una partida contra la IA no tiene
 * cosméticos de rival.
 */
export function aplicarRival(equipado) {
  if (typeof document === 'undefined') return;
  const raiz = document.documentElement.style;
  const de = (tipo) => {
    const c = cosmeticoPorId(equipado?.[tipo]);
    return c && c.tipo === tipo && !c.porDefecto ? c : null;
  };
  // (`de` descarta el gratuito porque los otros tipos lo pintan sin variable.)
  const dorso = de(T.DORSO);
  const estandarte = de(T.ESTANDARTE);
  poner(raiz, '--dorso-rival', dorso ? url(aspecto(dorso).imagen) : null);
  poner(raiz, '--estandarte-rival', estandarte ? url(estandarte.arte) : null);
  poner(raiz, '--cinta-rival', estandarte?.cinta ? url(estandarte.cinta) : null);
  poner(raiz, '--cinta-rival-giro', estandarte?.cinta ? 'scaleX(-1)' : null);
  // Un rival de duelo siempre tiene retrato: el suyo o el gratuito. Contra la
  // IA (`equipado` null) no hay ninguno.
  const retrato = equipado ? (de(T.RETRATO) ?? porDefecto(T.RETRATO)) : null;
  poner(raiz, '--retrato-rival', retrato ? url(retrato.arte) : null);
}

export const limpiarRival = () => aplicarRival(null);

/**
 * Lo que lleva puesto tu rival en un duelo. Lo cuenta el servidor, y sólo a
 * quien está en ese duelo. Null sin servidor.
 */
export async function traerEquipadoRival(dueloId) {
  if (!dueloId || !hayServidor()) return null;
  const r = await rpc('equipado_en_duelo', { p_duelo: dueloId });
  return r?.rival ?? null;
}

export function montarTienda({ cuerpo, aviso, alCambiar: cambio, alPack: pack }) {
  dom = { cuerpo, aviso };
  alCambiar = cambio ?? alCambiar;
  alPack = pack ?? alPack;
  cuerpo.addEventListener('click', alTocar);
}

export function abrirTienda() {
  confirmando = null;
  avisar('Todo lo que se vende aquí es estético: nada cambia tus cartas ni tus partidas.');
  pintar();
}

function avisar(texto, mal = false) {
  if (!dom) return;
  dom.aviso.textContent = texto;
  dom.aviso.classList.toggle('mal', mal);
}

/** La vista previa: el dorso, el tapete con su medallón o el estandarte. */
function vistaHTML(c) {
  if (c.tipo === T.TAPETE) {
    return `<div class="tienda-vista tienda-tapete" aria-hidden="true"
      style="background-image:${url(c.medallon)},${url(c.arte)}"></div>`;
  }
  if (c.tipo === T.RETRATO) {
    return `<i class="tienda-vista tienda-retrato retrato-medallon" aria-hidden="true"
      style="--retrato:${url(c.arte)}"></i>`;
  }
  const { imagen, filtro } = aspecto(c);
  return `<div class="tienda-vista tienda-${c.tipo.toLowerCase()}" aria-hidden="true"
    style="background-image:${url(imagen)};filter:${filtro}"></div>`;
}

function fichaHTML(c, p) {
  const tiene = loTiene(p, c.id);
  const puesto = equipadoDe(p, c.tipo).id === c.id;
  let acciones;
  if (puesto) {
    acciones = '<span class="tienda-estado">Equipado</span>';
  } else if (tiene) {
    acciones = `<button class="tienda-boton" data-equipar="${c.id}" ${ocupado ? 'disabled' : ''}>Equipar</button>`;
  } else if (confirmando === c.id) {
    acciones = `<span class="tienda-pregunta">¿Por ${c.precio} ◈?</span>
      <button class="tienda-boton si" data-comprar-si="${c.id}" ${ocupado ? 'disabled' : ''}>Comprar</button>
      <button class="tienda-boton" data-comprar-no ${ocupado ? 'disabled' : ''}>No</button>`;
  } else {
    const llega = PRUEBAS || p.monedas >= c.precio;
    acciones = `<button class="tienda-boton precio" data-comprar="${c.id}" ${llega && !ocupado ? '' : 'disabled'}
      ${llega ? '' : `title="Te faltan ${c.precio - p.monedas} dinomonedas"`}>${c.precio} ◈</button>`;
  }
  return `<article class="tienda-ficha ${puesto ? 'puesto' : ''} ${tiene ? 'tuyo' : ''}">
    ${vistaHTML(c)}
    <b class="tienda-nombre">${c.nombre}</b>
    <small class="tienda-lema">${c.lema}</small>
    <div class="tienda-acciones">${acciones}</div>
  </article>`;
}

/**
 * Un pack de sobres. No es un cosmético —no está en el catálogo ni se
 * «tiene»—: es abrir n sobres seguidos, cada uno al precio de siempre. Lo que
 * se ve es el sobre con el número encima, y el mismo «¿Por N ◈?» que el resto.
 */
function packHTML(n, p) {
  const precio = precioDePack(n);
  const llega = PRUEBAS || p.monedas >= precio;
  const clave = `pack_${n}`;
  const acciones = confirmando === clave
    ? `<span class="tienda-pregunta">¿Por ${precio} ◈?</span>
      <button class="tienda-boton si" data-pack-si="${n}">Abrir</button>
      <button class="tienda-boton" data-comprar-no>No</button>`
    : `<button class="tienda-boton precio" data-pack="${n}" ${llega ? '' : 'disabled'}
      ${llega ? '' : `title="Te faltan ${precio - p.monedas} dinomonedas"`}>${precio} ◈</button>`;
  return `<article class="tienda-ficha">
    <div class="tienda-vista tienda-pack" aria-hidden="true"><b>×${n}</b></div>
    <b class="tienda-nombre">${n} sobres</b>
    <small class="tienda-lema">Uno tras otro, y al final todo lo que salió.</small>
    <div class="tienda-acciones">${acciones}</div>
  </article>`;
}

function pintar() {
  if (!dom) return;
  const p = cargarPerfil();
  dom.cuerpo.innerHTML = SECCIONES.map((s) => `
    <section class="tienda-seccion">
      <h3 class="tienda-titulo">${s.titulo}</h3>
      <p class="meta-nota">${s.nota}</p>
      <div class="tienda-rejilla">${COSMETICOS.filter((c) => c.tipo === s.tipo).map((c) => fichaHTML(c, p)).join('')}</div>
    </section>`).join('')
  + `<section class="tienda-seccion">
      <h3 class="tienda-titulo">Packs de sobres</h3>
      <p class="meta-nota">Varios sobres seguidos al precio de siempre, ${precioDePack(1)} ◈ cada uno: sin descuento, que abaratar las cartas sería dar ventaja.</p>
      <div class="tienda-rejilla">${PACKS.map((n) => packHTML(n, p)).join('')}</div>
    </section>`;
}

async function alTocar(e) {
  const b = e.target.closest('button');
  if (!b || b.disabled || ocupado) return;

  if (b.dataset.comprar) { confirmando = b.dataset.comprar; return pintar(); }
  if (b.dataset.pack) { confirmando = `pack_${b.dataset.pack}`; return pintar(); }
  if (b.dataset.comprarNo !== undefined) { confirmando = null; return pintar(); }
  if (b.dataset.packSi) {
    // Se cobra sobre a sobre en la pantalla de sobres; aquí no se paga nada.
    const n = Number(b.dataset.packSi);
    confirmando = null;
    pintar();
    if (PACKS.includes(n)) alPack(n);
    return;
  }

  const comprar = b.dataset.comprarSi;
  const equipar = b.dataset.equipar;
  if (!comprar && !equipar) return;

  ocupado = true;
  pintar();
  try {
    if (comprar) {
      await comprarCosmetico(comprar);
      avisar('Comprado. Ya puedes equiparlo.');
    } else {
      await equiparCosmetico(equipar);
      avisar('Equipado. Se ve en tu próxima partida.');
    }
    confirmando = null;
  } catch (err) {
    avisar(`No se pudo: ${err.message}`, true);
  } finally {
    ocupado = false;
    aplicarEquipado();
    alCambiar();
    pintar();
  }
}
