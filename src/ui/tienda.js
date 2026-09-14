// DinoWar — la tienda: comprar y equipar cosméticos con dinomonedas.
//
// Lo que se vende está en src/data/cosmeticos.js y la regla que lo acota es la
// del autor: nada que dé ventaja. Aquí se pinta, se compra, se equipa y se
// aplica lo equipado al resto del juego.
//
// Tres cosas que conviene saber:
//
// - Comprar pide CONFIRMAR en la propia ficha, como borrar un mazo: 300
//   dinomonedas son tres sobres y un toque sin querer no debería gastarlas.
// - El precio que se cobra es el del servidor. El cliente sólo manda el id;
//   el número de la ficha es para decidir, no para pagar.
// - Lo equipado se aplica con variables CSS en la raíz del documento
//   (`--dorso`, `--dorso-filtro`). Las reglas que pintan el dorso las leen, y
//   las del RIVAL no: su dorso es el clásico hasta que viaje en el duelo.
//
// El arte llega aparte (assets/PROMPTS.md, «La tienda»). Hasta que está, los
// dorsos nuevos se enseñan como el clásico tintado con un filtro y la placa
// del menú lleva un dibujo de CSS. `ARTE_LISTO` es el interruptor, vigilado
// por test/tienda.test.js como el del final y la presentación.

import { COSMETICOS, TIPO_COSMETICO, loTiene, equipadoDe } from '../data/cosmeticos.js';
import { cargarPerfil } from './almacen.js';
import { comprarCosmetico, equiparCosmetico, PRUEBAS } from './perfil.js';

/** Si las piezas de la tienda están en el disco. Lo vigila test/tienda.test.js. */
export const ARTE_LISTO = true;

/** Lo que sale de `tools/tienda.py`, sin extensión. */
export const PIEZAS = Object.freeze(['placa_tienda', 'dorso_ambar', 'dorso_obsidiana']);

const SECCIONES = [
  {
    tipo: TIPO_COSMETICO.DORSO,
    titulo: 'Dorsos de carta',
    nota: 'El reverso de tus cartas: al abrir sobres, al robar y en tu mazo del marcador final.',
  },
];

let dom = null;
let alCambiar = () => {};
let confirmando = null;   // id del artículo con el «¿comprar?» abierto
let ocupado = false;

/** La imagen y el filtro con los que se ve un artículo hoy. */
function aspecto(c) {
  if (c.porDefecto || ARTE_LISTO || !c.provisional) return { imagen: c.arte, filtro: 'none' };
  return { imagen: COSMETICOS.find((x) => x.tipo === c.tipo && x.porDefecto).arte, filtro: c.provisional };
}

/**
 * Aplica lo equipado al documento. Se llama en cada repintado del menú, que
 * ocurre al sincronizar con el servidor y tras cada cambio.
 */
export function aplicarEquipado(perfil = cargarPerfil()) {
  if (typeof document === 'undefined') return;
  const raiz = document.documentElement.style;
  const dorso = equipadoDe(perfil, TIPO_COSMETICO.DORSO);
  if (dorso.porDefecto) {
    raiz.removeProperty('--dorso');
    raiz.removeProperty('--dorso-filtro');
    return;
  }
  const { imagen, filtro } = aspecto(dorso);
  raiz.setProperty('--dorso', `url('${imagen}')`);
  if (filtro === 'none') raiz.removeProperty('--dorso-filtro');
  else raiz.setProperty('--dorso-filtro', filtro);
}

export function montarTienda({ cuerpo, aviso, alCambiar: cambio }) {
  dom = { cuerpo, aviso };
  alCambiar = cambio ?? alCambiar;
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

function fichaHTML(c, p) {
  const tiene = loTiene(p, c.id);
  const puesto = equipadoDe(p, c.tipo).id === c.id;
  const { imagen, filtro } = aspecto(c);
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
    <div class="tienda-vista tienda-${c.tipo.toLowerCase()}"
      style="background-image:url('${imagen}');filter:${filtro}" aria-hidden="true"></div>
    <b class="tienda-nombre">${c.nombre}</b>
    <small class="tienda-lema">${c.lema}</small>
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
    </section>`).join('');
}

async function alTocar(e) {
  const b = e.target.closest('button');
  if (!b || b.disabled || ocupado) return;

  if (b.dataset.comprar) { confirmando = b.dataset.comprar; return pintar(); }
  if (b.dataset.comprarNo !== undefined) { confirmando = null; return pintar(); }

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
      avisar('Equipado. Se ve en tu próxima partida y al abrir sobres.');
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
