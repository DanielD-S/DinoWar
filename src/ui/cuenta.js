// DinoWar — pantalla de cuenta. Aquí sólo se llega YA dentro.
//
// Crear cuenta y entrar viven en entrada.js, que es la puerta del juego. Esto
// es lo de después: quién eres, cuántas cartas tienes, y las dos únicas cosas
// que se pueden hacer con la cuenta desde dentro — cambiar el nombre y salir.
//
// El nombre se cambia UNA vez. No es un capricho: es lo que va a salir en una
// tabla de ELO, y un nombre que se cambia a voluntad no identifica a nadie. La
// pantalla lo avisa ANTES de gastarlo, no después.

import { correoActual, salir, usuarioActual } from './supabase.js';
import { sincronizar, perfil, cambiarApodo } from './perfil.js';
import { conectarOjos } from './entrada.js';

const id = (s) => document.getElementById(s);

let dom = null;
let volverAlMenu = () => {};
let cambio = () => {};      // repintar el menú cuando la cuenta cambia
let alSalir = () => {};     // volver a la puerta al cerrar sesión
let aviso = null;           // { texto, mal }

export function montarCuenta(alVolver, alCambiar, cuandoSalga) {
  volverAlMenu = alVolver;
  dom = { cuerpo: id('cuenta-cuerpo'), pie: id('cuenta-pie') };
  cambio = alCambiar ?? (() => {});
  alSalir = cuandoSalga ?? (() => {});
  // Los ojitos de las contraseñas se conectan una vez sobre el contenedor: el
  // cuerpo se repinta entero a cada clic y un listener por botón se perdería.
  conectarOjos(dom.cuerpo);
  for (const b of document.querySelectorAll('#cuenta [data-volver]')) {
    b.addEventListener('click', () => { aviso = null; volverAlMenu(); });
  }
}

export function abrirCuenta() {
  aviso = null;
  pintarCuenta();
  return id('cuenta');
}

const escapar = (s) => String(s).replace(/[<>&"]/g, (c) => (
  { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

export function pintarCuenta() {
  if (!dom) return;
  const p = perfil();
  const total = Object.values(p.cartas ?? {}).reduce((a, b) => a + b, 0);
  const restantes = p.apodoRestantes ?? 0;

  dom.cuerpo.innerHTML = `
    <div class="cu-bloque">
      <h3 class="cu-titulo">${escapar(p.apodo ?? 'Tu cuenta')}</h3>
      <p class="cu-subtitulo">${escapar(correoActual() ?? '')}</p>
      <p class="cu-linea">${total} cartas · ${p.monedas} dinomonedas ·
        ${p.mazos.length} mazo${p.mazos.length === 1 ? '' : 's'}</p>
      <p class="cu-linea">Puedes entrar con este correo desde cualquier navegador
        y encontrarlo todo donde lo dejaste.</p>
    </div>

    <div class="cu-bloque">
      <h3 class="cu-titulo">Nombre de jugador</h3>
      <p class="cu-linea">Es lo que ven los demás: sale en tu tribu y en el
        reparto de daño a un jefe. Tiene que ser único.</p>
      ${restantes > 0 ? `
        <label class="cu-campo">Nombre
          <input id="cuenta-nombre" maxlength="24" autocomplete="nickname"
                 value="${escapar(p.apodo ?? '')}"></label>
        <div class="cu-botones">
          <button class="boton-secundario" data-accion="renombrar">Cambiar nombre</button>
        </div>
        <p class="cu-nota"><b>Te queda un solo cambio.</b> El que elegiste al crear la
          cuenta no contó; éste sí, y después el nombre ya no se toca.</p>`
    : `<p class="cu-nota">Ya has usado tu cambio de nombre. <b>${escapar(p.apodo ?? '')}</b>
         es definitivo.</p>`}
    </div>`;

  const mensaje = aviso ? `<p class="cu-nota ${aviso.mal ? 'mal' : ''}">${escapar(aviso.texto)}</p>` : '';
  dom.pie.innerHTML = `${mensaje}<button class="boton-secundario" data-accion="salir">Cerrar sesión</button>`;

  dom.pie.onclick = (e) => {
    const b = e.target.closest('[data-accion]');
    if (b && !b.disabled) hacer(b, b.dataset.accion);
  };
  dom.cuerpo.onclick = (e) => {
    const b = e.target.closest('[data-accion]');
    if (b && !b.disabled) hacer(b, b.dataset.accion);
  };
}

async function hacer(boton, accion) {
  const nombre = (id('cuenta-nombre')?.value ?? '').trim();

  if (accion === 'renombrar') {
    if (nombre.length < 3) {
      aviso = { texto: 'El nombre de jugador necesita al menos 3 letras.', mal: true };
      return pintarCuenta();
    }
    if (nombre === perfil().apodo) {
      // Gastar el único cambio en poner el mismo nombre sería un regalo
      // envenenado: se para antes de llegar al servidor.
      aviso = { texto: 'Ése ya es tu nombre. No gastes el cambio en nada.', mal: true };
      return pintarCuenta();
    }
    // eslint-disable-next-line no-alert
    if (!confirm(`¿Cambiar tu nombre a «${nombre}»?

Es el único cambio que tienes.`)) return;
  }

  boton.disabled = true;
  const antes = boton.textContent;
  boton.textContent = 'Un momento…';
  try {
    if (accion === 'renombrar') {
      const puesto = await cambiarApodo(nombre);
      aviso = { texto: `Ahora te ven como ${puesto}. Era tu único cambio.`, mal: false };
    } else if (accion === 'salir') {
      await salir();
      // Salir devuelve a la puerta: sin sesión no hay juego que enseñar.
      alSalir();
      return;
    }
    cambio();
  } catch (e) {
    aviso = { texto: e.message, mal: true };
    boton.textContent = antes;
  }
  boton.disabled = false;
  pintarCuenta();
}

/** Una línea para el menú: quién eres, o que no eres nadie todavía. */
export function resumenDeCuenta() {
  // El nombre de jugador y no el correo: es la identidad que el juego enseña,
  // y el correo en la portada no se lo ha ganado nadie.
  return perfil().apodo ?? correoActual() ?? usuarioActual()?.id?.slice(0, 8) ?? 'con cuenta';
}
