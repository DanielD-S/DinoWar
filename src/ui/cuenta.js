// DinoWar — pantalla de cuenta.
//
// El juego sigue prometiendo que se puede jugar SIN cuenta, y lo cumple: al
// arrancar se abre una sesión anónima y con ella ya tienes uuid, colección,
// tribu y yacimiento. Lo que no tienes es forma de volver a todo eso desde otro
// sitio: si se borran los datos del navegador, ese jugador se acabó.
//
// Crear la cuenta no empieza de cero. Le añade correo y contraseña al usuario
// anónimo que ya eras, así que el uuid no cambia y no se migra nada — ni la
// colección, ni la tribu, ni los aportes a un jefe. Es la diferencia entre
// «regístrate para guardar la partida» y «regístrate y pierde lo jugado».
//
// Entrar con una cuenta EN OTRO navegador sí deja atrás lo anónimo de ese
// navegador, y la pantalla lo avisa antes en vez de descubrirlo después.

import {
  esAnonimo, correoActual, registrar, entrarConCorreo, salir, usuarioActual,
} from './supabase.js';
import {
  sincronizar, modoPerfil, porQuePerfilLocal, perfil, cambiarApodo, MODO,
} from './perfil.js';
import { entrar as entrarEnLaCuenca } from './red.js';

const id = (s) => document.getElementById(s);

let dom = null;
let volverAlMenu = () => {};
let vista = 'crear';        // 'crear' | 'entrar'
let cambio = () => {};      // repintar el menú cuando la cuenta cambia
let aviso = null;           // { texto, mal }

export function montarCuenta(alVolver, alCambiar) {
  volverAlMenu = alVolver;
  dom = { cuerpo: id('cuenta-cuerpo'), pie: id('cuenta-pie') };
  cambio = alCambiar ?? (() => {});
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
  const sinServidor = modoPerfil() === MODO.LOCAL;

  if (sinServidor) {
    // Sin servidor no hay cuenta que crear, y ofrecer un formulario que no
    // puede funcionar es peor que no ofrecer nada.
    dom.cuerpo.innerHTML = `
      <div class="cu-bloque">
        <h3 class="cu-titulo">Sin conexión con la cuenca</h3>
        <p class="cu-linea">${escapar(porQuePerfilLocal() ?? 'no hay servidor')}.
          Se juega igual, pero la colección y los mazos viven sólo en este
          navegador y no hay cuenta a la que asociarlos.</p>
      </div>`;
    dom.pie.innerHTML = '';
    return;
  }

  const anonimo = esAnonimo();
  const p = perfil();

  const cabecera = anonimo
    ? `<div class="cu-bloque">
         <h3 class="cu-titulo">Estás jugando sin cuenta</h3>
         <p class="cu-linea">Tu colección, tus mazos y tu tribu ya existen y son
           tuyos, pero viven atados a este navegador. Si borras los datos del
           sitio o cambias de móvil, no hay forma de volver a ellos.</p>
         <p class="cu-linea">Crear una cuenta <b>no empieza de cero</b>: le pone
           correo y contraseña a lo que ya tienes.</p>
       </div>`
    : `<div class="cu-bloque">
         <h3 class="cu-titulo">${escapar(p.apodo ?? 'Tu cuenta')}</h3>
         <p class="cu-subtitulo">${escapar(correoActual() ?? '')}</p>
         <p class="cu-linea">${p.cartas ? Object.values(p.cartas).reduce((a, b) => a + b, 0) : 0}
           cartas · ${p.monedas} dinomonedas · ${p.mazos.length} mazo${p.mazos.length === 1 ? '' : 's'}</p>
         <p class="cu-linea">Puedes entrar con este correo desde cualquier
           navegador y encontrarlo todo donde lo dejaste.</p>
       </div>
       <div class="cu-bloque">
         <h3 class="cu-titulo">Nombre de jugador</h3>
         <p class="cu-linea">Es lo que ven los demás: sale en tu tribu y en el
           reparto de daño a un jefe. Tiene que ser único.</p>
         <label class="cu-campo">Nombre
           <input id="cuenta-nombre" maxlength="24" autocomplete="nickname"
                  value="${escapar(p.apodo ?? '')}"></label>
         <div class="cu-botones">
           <button class="boton-secundario" data-accion="renombrar">Cambiar nombre</button>
         </div>
       </div>`;

  const formulario = `
    <div class="cu-pestanas">
      <button class="chip ${vista === 'crear' ? 'on' : ''}" data-vista="crear">Crear cuenta</button>
      <button class="chip ${vista === 'entrar' ? 'on' : ''}" data-vista="entrar">Ya tengo una</button>
    </div>
    <div class="cu-bloque">
      ${vista === 'crear'
    ? `<label class="cu-campo">Nombre de jugador
         <input id="cuenta-nombre" maxlength="24" autocomplete="nickname"
                placeholder="con el que te verán los demás"></label>`
    : ''}
      <label class="cu-campo">Correo
        <input id="cuenta-correo" type="email" autocomplete="email" inputmode="email"
               placeholder="tu@correo.com"></label>
      <label class="cu-campo">Contraseña
        <input id="cuenta-clave" type="password"
               autocomplete="${vista === 'crear' ? 'new-password' : 'current-password'}"
               placeholder="al menos 6 caracteres"></label>
      ${vista === 'entrar' && anonimo
    ? `<p class="cu-nota mal">Ojo: entrar con otra cuenta deja atrás lo que has
         jugado en este navegador sin registrar. Si quieres conservarlo, usa
         «Crear cuenta».</p>`
    : ''}
    </div>`;

  dom.cuerpo.innerHTML = cabecera + (anonimo ? formulario : '');

  const mensaje = aviso ? `<p class="cu-nota ${aviso.mal ? 'mal' : ''}">${escapar(aviso.texto)}</p>` : '';
  dom.pie.innerHTML = anonimo
    ? `${mensaje}<button class="boton-grande" data-accion="${vista}">
         ${vista === 'crear' ? 'Crear cuenta' : 'Entrar'}</button>`
    : `${mensaje}<button class="boton-secundario" data-accion="salir">Cerrar sesión</button>`;

  dom.cuerpo.onclick = (e) => {
    const v = e.target.closest('[data-vista]');
    if (!v) return;
    vista = v.dataset.vista;
    aviso = null;
    pintarCuenta();
  };

  dom.pie.onclick = (e) => {
    const b = e.target.closest('[data-accion]');
    if (!b || b.disabled) return;
    hacer(b, b.dataset.accion);
  };
}

async function hacer(boton, accion) {
  const correo = (id('cuenta-correo')?.value ?? '').trim();
  const clave = id('cuenta-clave')?.value ?? '';

  const nombre = (id('cuenta-nombre')?.value ?? '').trim();

  // Se comprueba aquí lo mínimo para no gastar un viaje: lo que vale de verdad
  // lo dice el servidor —el nombre es único y eso sólo lo sabe él— y su mensaje
  // es el que se enseña.
  if (accion === 'crear' || accion === 'renombrar') {
    if (nombre.length < 3) {
      aviso = { texto: 'El nombre de jugador necesita al menos 3 letras.', mal: true };
      return pintarCuenta();
    }
  }
  if (accion === 'crear' || accion === 'entrar') {
    if (!correo.includes('@')) { aviso = { texto: 'Ese correo no lo parece.', mal: true }; return pintarCuenta(); }
    if (clave.length < 6) { aviso = { texto: 'La contraseña son al menos 6 caracteres.', mal: true }; return pintarCuenta(); }
  }

  boton.disabled = true;
  boton.textContent = 'Un momento…';
  try {
    if (accion === 'crear') {
      // El nombre PRIMERO. Si está cogido, es mejor descubrirlo antes de haber
      // atado el correo a la cuenta: rehacer el registro no se puede, pero
      // volver a intentarlo con otro nombre sí.
      const puesto = await cambiarApodo(nombre);
      await registrar(correo, clave);
      aviso = { texto: `Cuenta creada. Juegas como ${puesto}.`, mal: false };
    } else if (accion === 'renombrar') {
      const puesto = await cambiarApodo(nombre);
      aviso = { texto: `Ahora te ven como ${puesto}.`, mal: false };
    } else if (accion === 'entrar') {
      await entrarConCorreo(correo, clave);
      // La sesión es otra, así que hay que volver a presentarse a la cuenca y
      // traerse el perfil de ESE jugador. Sin esto la pantalla seguiría
      // enseñando la colección del anónimo que acaba de dejar de ser.
      await entrarEnLaCuenca();
      aviso = { texto: 'Dentro. Tu colección es la de esta cuenta.', mal: false };
    } else if (accion === 'salir') {
      await salir();
      await entrarEnLaCuenca();
      aviso = { texto: 'Sesión cerrada. Vuelves a jugar sin cuenta.', mal: false };
    }
    await sincronizar();
    cambio();
  } catch (e) {
    aviso = { texto: e.message, mal: true };
  }
  pintarCuenta();
}

/** Una línea para el menú: quién eres, o que no eres nadie todavía. */
export function resumenDeCuenta() {
  if (modoPerfil() === MODO.LOCAL) return 'sin conexión · perfil local';
  if (esAnonimo()) return 'sin cuenta · sólo en este navegador';
  // El nombre de jugador y no el correo: es la identidad que el juego enseña,
  // y el correo en la portada no se lo ha ganado nadie.
  return perfil().apodo ?? correoActual() ?? usuarioActual()?.id?.slice(0, 8) ?? 'con cuenta';
}
