// Renderizado. Lee el estado, nunca lo muta.
//
// Tablero tipo playmat: una zona a tamaño real, con una tira superior que hace
// de marcador de las cuatro. En vertical y a 360 px de ancho no caben ocho áreas
// con cartas legibles, así que se enfoca una y se navega entre ellas.

import { BALANCE } from '../data/balance.js';
import { CARTAS, TIPO, ESTACIONES, carta } from '../data/cards.js';
import { dominacion, poderDeZona, poderEfectivo, unidadesEnZona } from '../engine/state.js';
import { arte } from './art.js';

export const JUGADOR = 0;
export const RIVAL = 1;

export const el = {};
let zonaActiva = BALANCE.zonas[0].id;
let alCambiarZona = null;

export const zonaEnFoco = () => zonaActiva;

export function montar(onCambioZona = null) {
  alCambiarZona = onCambioZona;
  const id = (x) => document.getElementById(x);
  Object.assign(el, {
    menu: id('menu'), partida: id('partida'), fin: id('fin'),
    rTerr: id('r-terr'), rBio: id('r-bio'), rAgua: id('r-agua'), rMano: id('r-mano'),
    pTerr: id('p-terr'), pBio: id('p-bio'), pAgua: id('p-agua'), pMano: id('p-mano'),
    ayuda: id('ayuda'), ayudaCuerpo: id('ayuda-cuerpo'), ayudaCerrar: id('ayuda-cerrar'),
    btnAyuda: id('btn-ayuda'), btnAyudaMenu: id('btn-ayuda-menu'),
    turno: id('turno'), estacion: id('btn-estacion'),
    tira: id('tira'), playmat: id('playmat'), mano: id('mano'), mensaje: id('mensaje'),
    btnListo: id('btn-listo'), btnLog: id('btn-log'), btnMute: id('btn-mute'),
    btnJugar: id('btn-jugar'), btnOtra: id('btn-otra'),
    arrastre: id('arrastre'),
    ficha: id('ficha'), fichaCuerpo: id('ficha-cuerpo'), fichaCerrar: id('ficha-cerrar'),
    log: id('log'), logCuerpo: id('log-cuerpo'), logCerrar: id('log-cerrar'),
    eleccion: id('eleccion'), eleccionTitulo: id('eleccion-titulo'),
    eleccionTexto: id('eleccion-texto'), eleccionCuerpo: id('eleccion-cuerpo'),
    finTitulo: id('fin-titulo'), finDetalle: id('fin-detalle'),
    debug: id('debug'), record: id('menu-record'),
    matNombre: document.querySelector('.mat-nombre'),
    matProd: document.querySelector('.mat-prod'),
  });

  el.tira.innerHTML = BALANCE.zonas.map((z) => `
    <button class="zona-boton" data-zona="${z.id}" aria-label="${z.nombre}">
      <span class="zb-cab">
        <span class="zb-num">${z.id}</span>
        ${z.territorio ? `<span class="zb-terr">▲${z.territorio}</span>` : ''}
      </span>
      <span class="zb-fila rival"><span class="zb-puntos" data-puntos="1"></span><b data-p="1">0</b></span>
      <span class="zb-fila propio"><span class="zb-puntos" data-puntos="0"></span><b data-p="0">0</b></span>
      <span class="zb-dom"></span>
    </button>`).join('');

  el.botonesZona = [...el.tira.querySelectorAll('.zona-boton')];
  el.mat = [
    el.playmat.querySelector('[data-mat="0"]'),
    el.playmat.querySelector('[data-mat="1"]'),
  ];

  el.tira.addEventListener('click', (e) => {
    const b = e.target.closest('.zona-boton');
    if (b) mostrarZona(Number(b.dataset.zona));
  });

  mostrarZona(zonaActiva);
}

export function mostrarZona(zonaId) {
  zonaActiva = zonaId;
  el.playmat.dataset.zona = String(zonaId);
  for (const b of el.botonesZona) {
    b.classList.toggle('activa', Number(b.dataset.zona) === zonaId);
  }
  alCambiarZona?.(zonaId);
}

// ------------------------------------------------------------------- carta

function marcoCarta(cardId, poder, conAdaptacion) {
  const c = carta(cardId);
  const dino = c.tipo === TIPO.DINOSAURIO;
  return `
    <div class="c-top">
      <span class="c-coste">${c.coste}</span>
      ${dino && c.consumoHidrico ? `<span class="c-agua">${c.consumoHidrico}</span>` : ''}
      <span class="c-poder${poder !== null && poder !== c.poder ? ' mejorado' : ''}">${dino ? (poder ?? c.poder) : ''}</span>
    </div>
    <div class="c-arte">${arte(cardId)}</div>
    <div class="c-nombre">${c.binomial}</div>
    <div class="c-rasgo"><i class="ev ${c.nivel_evidencia}"></i>${c.rasgoNombre}</div>
    ${conAdaptacion ? '<span class="c-adap"></span>' : ''}`;
}

function nodoCarta(cardId, { variante, dueno = null, poder = null, adaptada = false, iid = null, clases = [] }) {
  const n = document.createElement('div');
  n.className = ['carta', `carta--${variante}`, ...clases].join(' ');
  if (carta(cardId).tipo === TIPO.ADAPTACION) n.classList.add('adaptacion');
  if (dueno !== null) n.classList.add(dueno === JUGADOR ? 'propio' : 'rival');
  if (iid !== null) n.dataset.iid = iid;
  n.dataset.card = cardId;
  n.innerHTML = marcoCarta(cardId, poder, adaptada);
  return n;
}

function nodoDorso(dueno) {
  const n = document.createElement('div');
  n.className = `carta carta--mat pendiente ${dueno === JUGADOR ? 'propio' : 'rival'}`;
  n.innerHTML = '<div class="carta-dorso">?</div>';
  return n;
}

// Proporción de una carta real (63×88 mm).
const RATIO_CARTA = 0.715;
const ALTO_MAXIMO_CARTA = 132;

/**
 * Dimensiona y reparte las cartas de una fila. Si no caben, se solapan como en
 * la mano: es lo que hace cualquier TCG cuando el banco se llena.
 */
function colocarEnFila(contenedor) {
  const nodos = [...contenedor.querySelectorAll('.carta')];
  const n = nodos.length;
  if (n === 0) return;

  const ancho = contenedor.clientWidth;
  const altoCarta = Math.max(60, Math.min(ALTO_MAXIMO_CARTA, contenedor.clientHeight - 4));
  const anchoCarta = Math.round(altoCarta * RATIO_CARTA);
  const paso = n > 1 ? Math.min(anchoCarta + 6, (ancho - anchoCarta - 6) / (n - 1)) : 0;
  const x0 = Math.max(3, (ancho - (anchoCarta + paso * (n - 1))) / 2);

  nodos.forEach((nodo, i) => {
    nodo.style.width = `${anchoCarta}px`;
    nodo.style.height = `${Math.round(altoCarta)}px`;
    nodo.style.left = `${(x0 + i * paso).toFixed(1)}px`;
    nodo.style.zIndex = String(10 + i);
  });
}

// ------------------------------------------------------------------ playmat

function pintarPlaymat(estado) {
  const zid = zonaActiva;
  const z = BALANCE.zonas[zid - 1];
  const dom = dominacion(estado)[zid - 1];

  el.matNombre.textContent = `${zid}. ${z.nombre}`;
  el.matProd.innerHTML = [
    z.biomasa ? `<span><i class="ico-bio"></i>${z.biomasa}</span>` : '',
    z.agua ? `<span><i class="ico-agua"></i>${z.agua}</span>` : '',
    z.territorio ? `<span class="t">▲${z.territorio}</span>` : '',
  ].join('');

  for (const bando of [JUGADOR, RIVAL]) {
    const cont = el.mat[bando];
    const jug = estado.jugadores[bando];

    const deseadas = unidadesEnZona(estado, zid, bando).map((u) => ({
      clave: `u${u.iid}`,
      iid: u.iid,
      cardId: u.cardId,
      poder: poderEfectivo(estado, u.iid),
      adaptada: u.adherencias.length > 0,
      pendiente: false,
    }));

    // Cartas comprometidas y aún sin revelar: las propias se ven (son tuyas),
    // las del rival sólo como dorsos. Ahí está la información oculta.
    const ocultas = jug.pendientes.filter((p) => p.zona === zid && p.tipo !== 'ADAPTACION');
    if (bando === JUGADOR) {
      for (const p of ocultas) {
        deseadas.push({
          clave: `p${p.iid}`, iid: p.iid, cardId: estado.instancias[p.iid].cardId,
          poder: null, adaptada: false, pendiente: true,
        });
      }
    } else {
      ocultas.forEach((_, k) => deseadas.push({ clave: `d${k}`, dorso: true }));
    }

    const quiero = new Map(deseadas.map((d) => [d.clave, d]));
    for (const nodo of [...cont.children]) {
      if (nodo.dataset.clave && !quiero.has(nodo.dataset.clave)) nodo.remove();
    }
    cont.querySelector('.mat-vacia')?.remove();

    for (const d of deseadas) {
      let nodo = cont.querySelector(`[data-clave="${d.clave}"]`);
      if (!nodo) {
        nodo = d.dorso
          ? nodoDorso(bando)
          : nodoCarta(d.cardId, {
            variante: 'mat', dueno: bando, poder: d.poder, adaptada: d.adaptada,
            iid: d.iid, clases: d.pendiente ? ['pendiente', 'entra'] : ['entra'],
          });
        nodo.dataset.clave = d.clave;
        // El volteo usa fill-mode `both`: si no se retira la clase, la carta se
        // queda con la transformación inicial cuando la animación no llega a
        // correr (pestaña en segundo plano, por ejemplo).
        nodo.addEventListener('animationend', () => nodo.classList.remove('entra'), { once: true });
        cont.appendChild(nodo);
      } else if (!d.dorso) {
        const p = nodo.querySelector('.c-poder');
        const valor = d.poder === null ? String(carta(d.cardId).poder) : String(d.poder);
        if (p.textContent !== valor) p.textContent = valor;
        p.classList.toggle('mejorado', d.poder !== null && d.poder !== carta(d.cardId).poder);
        const tiene = !!nodo.querySelector('.c-adap');
        if (d.adaptada && !tiene) nodo.insertAdjacentHTML('beforeend', '<span class="c-adap"></span>');
        if (!d.adaptada && tiene) nodo.querySelector('.c-adap').remove();
      }
    }

    if (deseadas.length === 0) {
      cont.innerHTML = '<span class="mat-vacia">sin presencia</span>';
    } else {
      colocarEnFila(cont);
    }

    el.playmat.querySelector(`[data-poder="${bando}"]`).textContent = poderDeZona(estado, zid, bando);
    el.playmat.querySelector(`[data-mazo="${bando}"]`).textContent = jug.mazo.length;
    el.playmat.querySelector(`[data-desc="${bando}"]`).textContent = jug.descarte.length;
    el.playmat.querySelector(`[data-ext="${bando}"]`).textContent = jug.extintos.length;
    // Quedarse sin mazo Y sin descarte es perder (D4): hay que poder verlo venir.
    el.playmat.querySelector(`[data-mazo="${bando}"]`).parentElement
      .classList.toggle('aviso', jug.mazo.length + jug.descarte.length <= 3);
  }

  el.playmat.dataset.dominio = dom.dominador === null ? 'neutral' : String(dom.dominador);
}

const MAX_PUNTOS = 5;

/**
 * La tira no es sólo un marcador: enseña cuántas unidades tiene cada bando en
 * cada zona. Con las cuatro zonas a la vista no hace falta ir cambiando de
 * pantalla para saber dónde está la partida.
 */
function pintarTira(estado) {
  const dom = dominacion(estado);
  for (const b of el.botonesZona) {
    const zid = Number(b.dataset.zona);
    const d = dom[zid - 1];

    for (const bando of [JUGADOR, RIVAL]) {
      b.querySelector(`[data-p="${bando}"]`).textContent = poderDeZona(estado, zid, bando);

      const visibles = unidadesEnZona(estado, zid, bando).length;
      const ocultas = estado.jugadores[bando].pendientes
        .filter((p) => p.zona === zid && p.tipo !== 'ADAPTACION').length;
      const total = visibles + ocultas;
      const puntos = b.querySelector(`[data-puntos="${bando}"]`);
      puntos.innerHTML = total === 0
        ? '<i class="vacio"></i>'
        : Array.from({ length: Math.min(total, MAX_PUNTOS) }, (_, k) =>
          `<i class="${k >= visibles ? 'oculto' : ''}"></i>`).join('')
          + (total > MAX_PUNTOS ? `<u>+${total - MAX_PUNTOS}</u>` : '');
    }

    const barra = b.querySelector('.zb-dom');
    barra.className = 'zb-dom' + (d.dominador === JUGADOR ? ' propio' : d.dominador === RIVAL ? ' rival' : '');
  }
}

// -------------------------------------------------------------------- mano

function pintarMano(estado) {
  const mano = estado.jugadores[JUGADOR].mano;
  const quiero = new Set(mano.map(String));

  for (const nodo of [...el.mano.children]) {
    if (!quiero.has(nodo.dataset.iid)) nodo.remove();
  }
  for (const iid of mano) {
    if (el.mano.querySelector(`[data-iid="${iid}"]`)) continue;
    const cardId = estado.instancias[iid].cardId;
    el.mano.appendChild(nodoCarta(cardId, { variante: 'mano', iid }));
  }

  const nodos = mano.map((iid) => el.mano.querySelector(`[data-iid="${iid}"]`));
  const n = nodos.length;
  const centro = (n - 1) / 2;
  // El presupuesto descuenta el ancho de carta y el ensanche del giro: con 8
  // cartas (6 de límite + 2 de robo) no debe salirse a 360 px.
  const ancho = el.mano.clientWidth || 360;
  const separacion = Math.min(52, (ancho - 110) / Math.max(1, n - 1 || 1));
  const paso = n > 1 ? Math.min(6.5, 30 / n) : 0;
  const biomasa = estado.jugadores[JUGADOR].biomasa;

  nodos.forEach((nodo, i) => {
    if (!nodo) return;
    const d = i - centro;
    nodo.style.transform =
      `translateX(${(d * separacion).toFixed(1)}px) translateY(${(Math.abs(d) ** 2 * 2.2).toFixed(1)}px) rotate(${(d * paso).toFixed(2)}deg)`;
    nodo.style.zIndex = String(10 + i);
    nodo.classList.toggle('impagable', carta(nodo.dataset.card).coste > biomasa);
  });
}

// ------------------------------------------------------------------ general

export function render(estado) {
  const [p, r] = estado.jugadores;

  el.pTerr.textContent = p.territorio;
  el.pBio.textContent = p.biomasa;
  el.pAgua.textContent = p.agua;
  el.rTerr.textContent = r.territorio;
  el.rBio.textContent = r.biomasa;
  el.rAgua.textContent = r.agua;
  el.rMano.textContent = r.mano.length;
  el.pMano.textContent = p.mano.length;
  el.turno.textContent = `Turno ${estado.turno}`;

  const est = estado.estacion.actual;
  el.estacion.hidden = !est;
  if (est) {
    el.estacion.textContent = est === 'SEQUIA' ? 'Sequía' : 'Crecida';
    el.estacion.className = `estacion ${est === 'SEQUIA' ? 'sequia' : 'crecida'}`;
  }

  pintarTira(estado);
  pintarPlaymat(estado);
  pintarMano(estado);
}

export function mensaje(texto, aviso = false) {
  el.mensaje.textContent = texto;
  el.mensaje.classList.toggle('aviso', aviso);
}

// -------------------------------------------------------------- ficha de carta

export function fichaHTML(cardId) {
  const c = carta(cardId);
  const dino = c.tipo === TIPO.DINOSAURIO;
  return `
    <div class="ficha-cab">
      <div class="ficha-arte">${arte(cardId)}</div>
      <div>
        <div class="ficha-binomial${dino ? '' : ' recto'}">${c.binomial}</div>
        <div class="ficha-cifras">
          ${dino ? `<span>Poder <b>${c.poder}</b></span>` : ''}
          <span>Coste <b>${c.coste}</b></span>
          ${dino ? `<span>Agua <b>${c.consumoHidrico}</b></span>` : ''}
        </div>
      </div>
    </div>
    <div class="ficha-rasgo">
      <h3>${c.rasgoNombre}</h3>
      <p>${c.rasgoTexto}</p>
      <span class="evidencia ${c.nivel_evidencia}">Evidencia del rasgo: ${c.nivel_evidencia}</span>
    </div>
    <p class="ficha-nota">${c.nota_cientifica}</p>`;
}

export function fichaEstacionHTML(id) {
  const e = ESTACIONES[id];
  return `
    <div class="ficha-cab"><div><div class="ficha-binomial recto">${e.nombre}</div></div></div>
    <div class="ficha-rasgo">
      <p>${e.texto}</p>
      <span class="evidencia ${e.nivel_evidencia}">Evidencia: ${e.nivel_evidencia}</span>
    </div>
    <p class="ficha-nota">${e.nota_cientifica}</p>`;
}

export function abrirFicha(html) {
  el.fichaCuerpo.innerHTML = html;
  el.ficha.classList.remove('oculta');
}

export function cerrarHojas() {
  el.ficha.classList.add('oculta');
  el.log.classList.add('oculta');
  el.eleccion.classList.add('oculta');
  el.ayuda.classList.add('oculta');
}

// -------------------------------------------------------------------- ayuda

/**
 * Hoja "Cómo se juega". Se genera desde balance.js y cards.js, así que no puede
 * quedarse desfasada respecto a las reglas que ejecuta el motor.
 */
export function ayudaHTML() {
  const zonaVictoria = BALANCE.zonas.filter((z) => z.territorio > 0);
  const ejemplo = 'allosaurus';
  const c = carta(ejemplo);

  const filasZona = BALANCE.zonas.map((z) => `
    <tr>
      <td>${z.id}. ${z.nombre}</td>
      <td class="num b">${z.biomasa || '·'}</td>
      <td class="num a">${z.agua || '·'}</td>
      <td class="num t">${z.territorio || '·'}</td>
    </tr>`).join('');

  return `
    <div class="ayuda-h">El objetivo</div>
    <p class="ayuda-p">
      Gana quien acumule <b>${BALANCE.objetivoTerritorio} de Territorio</b>.
      Solo ${zonaVictoria.map((z) => `la <b>${z.nombre}</b>`).join(' y ')} produce Territorio:
      <b>${zonaVictoria[0].territorio} por turno</b> para quien la domine. Las otras tres zonas no dan
      puntos, dan de comer — y sin comida no puedes sostener la Sabana. Ese es el juego.
    </p>
    <p class="ayuda-p">
      También se pierde de otra forma: si te toca robar y no te quedan cartas <b>ni en el mazo ni en
      el descarte</b>, tu población se ha extinguido y pierdes en el acto.
    </p>
    ${BALANCE.muertePermanente ? `<p class="ayuda-p">
      Y eso puede provocarlo el rival: <b>los dinosaurios que mueren salen del juego para siempre</b>,
      no vuelven a barajarse. Cada baja te acerca a la extinción, así que matar es la segunda forma
      de ganar. El contador de <b>extintos</b> del tablero lleva la cuenta.
    </p>` : ''}

    <div class="ayuda-h">Los tres recursos</div>
    <ul class="ayuda-lista">
      <li><span class="k bio">Biomasa</span><span class="v">Paga el despliegue de cartas. Se acumula.</span></li>
      <li><span class="k agua">Agua</span><span class="v">No se gasta en un turno normal. Solo la cobra la <i>Sequía estacional</i>, y el dinosaurio que no la pueda pagar muere.</span></li>
      <li><span class="k terr">Territorio</span><span class="v">Es el marcador. Nunca se gasta.</span></li>
    </ul>

    <div class="ayuda-h">Qué significa cada número de la carta</div>
    <div class="anatomia">
      <div class="anatomia-carta">
        ${tarjetaEjemplo(ejemplo)}
        <span class="llamada" style="left:-6px; top:-6px">1</span>
        <span class="llamada" style="left:26px; top:-6px">2</span>
        <span class="llamada" style="right:-6px; top:-6px">3</span>
        <span class="llamada" style="right:-6px; bottom:8px">4</span>
      </div>
      <div class="anatomia-notas">
        <div><span class="n">1</span><span><b>Coste</b> en Biomasa para desplegarla.</span></div>
        <div><span class="n">2</span><span><b>Consumo hídrico</b>. Solo se paga durante una Sequía.</span></div>
        <div><span class="n">3</span><span><b>Poder</b>. Es lo único que decide quién domina la zona.</span></div>
        <div><span class="n">4</span><span><b>Rasgo</b> y su <b>nivel de evidencia</b>.</span></div>
      </div>
    </div>
    <p class="ayuda-p">
      El punto de color dice cuánto respalda la ciencia a ese rasgo, no al animal:
    </p>
    <div class="leyenda-ev">
      <span><i class="ev ESTABLECIDO"></i> Establecido</span>
      <span><i class="ev INFERIDO"></i> Inferido</span>
      <span><i class="ev DEBATIDO"></i> Debatido</span>
    </div>
    <p class="ayuda-p" style="margin-top:8px">
      Mantén pulsada cualquier carta —en tu mano o en el tablero— para leer su ficha completa
      con la nota científica. Ejemplo: <i>${c.binomial}</i> tiene Poder ${c.poder}, cuesta ${c.coste}
      y bebe ${c.consumoHidrico}.
    </p>

    <div class="ayuda-h">Cómo va un turno</div>
    <ol class="ayuda-pasos">
      <li><b>Estación.</b> Desde el turno ${BALANCE.turnoPrimeraEstacion} se voltea una carta de clima. Nadie la controla.</li>
      <li><b>Producción.</b> Cobras lo que dan las zonas que dominas.</li>
      <li><b>Robo.</b> ${BALANCE.robo.normal} carta, o ${BALANCE.robo.sinZonas} si no dominas ninguna zona.</li>
      <li><b>Despliegue.</b> Sueltas cartas <b>boca abajo</b>, máximo ${BALANCE.maxDesplieguesPorZona} por zona. El rival no ve lo que pones, y tú no ves lo suyo.</li>
      <li><b>Revelación.</b> Se voltea todo a la vez y se resuelve zona por zona.</li>
    </ol>

    <div class="ayuda-h">Cómo se gana una zona</div>
    <p class="ayuda-p">
      Suma más <b>Poder</b> que el rival. El que pierda la zona pierde además su dinosaurio de menor
      Poder — <b>cada turno</b>, aunque nadie haya desplegado nada. Si empatáis, la zona queda neutral
      y no produce para nadie. Retirarte de una zona es legal: concedes el dominio, pero no pagas bajas.
    </p>

    <div class="ayuda-h">Las cuatro zonas</div>
    <table class="ayuda-tabla">
      <tr><th>Zona</th><th class="num">Bio</th><th class="num">Agua</th><th class="num">Terr</th></tr>
      ${filasZona}
    </table>

    <div class="ayuda-h">Sobre los dinosaurios</div>
    <p class="ayuda-p">
      Los ${Object.values(CARTAS).filter((x) => x.tipo === TIPO.DINOSAURIO).length} taxones existen, están
      descritos formalmente y proceden todos de la Formación Morrison, así que pudieron coincidir en el
      tiempo y en el espacio. No hay híbridos, ni especies inventadas, ni anacronismos. Ninguno lleva
      plumas porque ninguno tiene evidencia que las respalde.
    </p>`;
}

function tarjetaEjemplo(cardId) {
  const n = document.createElement('div');
  n.className = 'carta carta--mat';
  n.innerHTML = marcoCarta(cardId, null, false);
  return n.outerHTML;
}

export { CARTAS };
