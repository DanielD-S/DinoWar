// DinoWar — la puerta. Nadie ve el juego sin haber entrado.
//
// Antes se abría una sesión anónima al arrancar y jugar sin cuenta era una
// forma legítima de jugar. Ya no: entrar es obligatorio y no hay perfil local.
// Es una decisión del autor, y tiene una factura que conviene tener presente
// —sin conexión no se juega, donde antes el juego arrancaba siempre—.
//
// Esta pantalla es lo primero que se pinta, antes que el menú, y no se sale de
// ella hasta que hay sesión de una cuenta con correo. Las sesiones anónimas que
// quedaran de la versión anterior no valen: `estaDentro()` las trata como no
// haber entrado.

import { registrar, entrarConCorreo, esAnonimo, haySesion } from './supabase.js';

const id = (s) => document.getElementById(s);

let dom = null;
let alEntrar = () => {};
let vista = 'entrar';       // 'entrar' | 'crear' — se llega más veces de las que se crea
let aviso = null;
/**
 * Lo que el jugador lleva escrito. Se guarda aparte porque cada repintado
 * rehace el `innerHTML` entero y se llevaba por delante los tres campos: fallar
 * por un nombre cogido te obligaba a teclear otra vez el correo y la
 * contraseña, que en un móvil es motivo suficiente para cerrar el juego.
 */
const borrador = { nombre: '', correo: '', clave: '' };

/** Guarda lo escrito antes de que el repintado se lo lleve. */
function recogerBorrador() {
  for (const [k, campo] of [['nombre', 'ent-nombre'], ['correo', 'ent-correo'], ['clave', 'ent-clave']]) {
    const n = id(campo);
    if (n) borrador[k] = n.value;
  }
}

export function montarEntrada(cuandoEntre) {
  alEntrar = cuandoEntre;
  dom = { cuerpo: id('entrada-cuerpo'), pie: id('entrada-pie') };
  // Una vez sobre el contenedor, no por botón: el cuerpo se repinta entero al
  // cambiar de pestaña y un listener puesto en el botón se iría con él.
  conectarOjos(dom.cuerpo);
}

export function abrirEntrada(motivo = null) {
  // Una sesión que existía pero era anónima —o que caducó— merece una
  // explicación: quedarse en la pantalla de entrada sin decir por qué parece
  // que el juego se ha roto.
  aviso = motivo
    ? { texto: motivo, mal: true }
    : (haySesion() && esAnonimo()
      ? { texto: 'Ahora hace falta una cuenta para jugar. Crea una y tu progreso queda guardado.', mal: false }
      : null);
  pintarEntrada();
  return id('entrada');
}

const escapar = (s) => String(s).replace(/[<>&"]/g, (c) => (
  { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

/**
 * Campo de contraseña con el ojito. El botón va DENTRO de la etiqueta y con
 * `type="button"`: dentro de un formulario, un botón sin tipo es un submit y
 * enviaría el formulario en vez de enseñar la contraseña.
 */
export function campoClave(idCampo, autocompletar) {
  return `<label class="cu-campo">Contraseña
    <span class="cu-clave">
      <input id="${idCampo}" type="password" autocomplete="${autocompletar}"
             placeholder="al menos 6 caracteres">
      <button type="button" class="cu-ojo" data-ojo="${idCampo}"
              aria-label="Mostrar la contraseña" aria-pressed="false">${OJO_ABIERTO}</button>
    </span></label>`;
}

// Dos siluetas, no una letra ni un emoji: tienen que verse igual en cualquier
// sistema y a 16 px.
const OJO_ABIERTO = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M12 5C6.5 5 2.7 9.2 1.5 12c1.2 2.8 5 7 10.5 7s9.3-4.2 10.5-7C21.3 9.2 17.5 5 12 5Z"
        fill="none" stroke="currentColor" stroke-width="1.7"/>
  <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`;
const OJO_TACHADO = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M12 5C6.5 5 2.7 9.2 1.5 12c1.2 2.8 5 7 10.5 7s9.3-4.2 10.5-7C21.3 9.2 17.5 5 12 5Z"
        fill="none" stroke="currentColor" stroke-width="1.7"/>
  <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.7"/>
  <path d="M4 20 20 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;

/** Conecta los ojitos de un contenedor. Lo usan esta pantalla y la de cuenta. */
export function conectarOjos(raiz) {
  if (!raiz) return;
  raiz.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ojo]');
    if (!b) return;
    e.preventDefault();
    const campo = id(b.dataset.ojo);
    if (!campo) return;
    const oculta = campo.type === 'password';
    campo.type = oculta ? 'text' : 'password';
    b.innerHTML = oculta ? OJO_TACHADO : OJO_ABIERTO;
    b.setAttribute('aria-pressed', String(oculta));
    b.setAttribute('aria-label', oculta ? 'Ocultar la contraseña' : 'Mostrar la contraseña');
    // El foco vuelve al campo y el cursor al final: si no, tocar el ojito en el
    // móvil cierra el teclado y hay que volver a pinchar para seguir.
    campo.focus();
    const n = campo.value.length;
    try { campo.setSelectionRange(n, n); } catch { /* type=text no siempre deja */ }
  });
}

function pintarEntrada() {
  if (!dom) return;
  const crear = vista === 'crear';

  dom.cuerpo.innerHTML = `
    <div class="ent-marca">
      <p class="menu-epigrafe"><span class="filete"></span>Jurásico Superior · 155–146 Ma</p>
      <h1>Dino<span>War</span></h1>
      <p class="menu-lema">Formación Morrison. Dos poblaciones, un campo, tres formas de ganar.</p>
    </div>

    <div class="cu-pestanas ent-pestanas">
      <button class="chip ${!crear ? 'on' : ''}" data-vista="entrar">Entrar</button>
      <button class="chip ${crear ? 'on' : ''}" data-vista="crear">Crear cuenta</button>
    </div>

    <div class="cu-bloque">
      ${crear ? `<label class="cu-campo">Nombre de jugador
        <input id="ent-nombre" maxlength="24" autocomplete="nickname"
               placeholder="con el que te verán los demás"></label>
        <p class="cu-nota">Sólo podrás cambiarlo <b>una vez</b> más adelante, así que
          elígelo con calma.</p>` : ''}
      <label class="cu-campo">Correo
        <input id="ent-correo" type="email" autocomplete="email" inputmode="email"
               placeholder="tu@correo.com"></label>
      ${campoClave('ent-clave', crear ? 'new-password' : 'current-password')}
    </div>`;

  const mensaje = aviso ? `<p class="cu-nota ${aviso.mal ? 'mal' : ''}">${escapar(aviso.texto)}</p>` : '';
  dom.pie.innerHTML = `${mensaje}
    <button class="boton-grande" data-accion="${crear ? 'crear' : 'entrar'}">
      ${crear ? 'Crear cuenta' : 'Entrar'} <span aria-hidden="true">→</span></button>`;

  // Lo que hubiera escrito, de vuelta en su sitio.
  if (id('ent-nombre')) id('ent-nombre').value = borrador.nombre;
  id('ent-correo').value = borrador.correo;
  id('ent-clave').value = borrador.clave;

  dom.cuerpo.onclick = (e) => {
    const v = e.target.closest('[data-vista]');
    if (!v) return;
    recogerBorrador();
    vista = v.dataset.vista;
    aviso = null;
    pintarEntrada();
  };

  // Enter envía: en el móvil el teclado enseña «ir» y no pulsarlo con el pulgar
  // en un botón que queda debajo del teclado es media pantalla de diferencia.
  for (const campo of dom.cuerpo.querySelectorAll('input')) {
    campo.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      dom.pie.querySelector('[data-accion]')?.click();
    });
  }

  dom.pie.onclick = (e) => {
    const b = e.target.closest('[data-accion]');
    if (b && !b.disabled) hacer(b, b.dataset.accion);
  };
}

async function hacer(boton, accion) {
  recogerBorrador();
  const nombre = borrador.nombre.trim();
  const correo = borrador.correo.trim();
  const clave = borrador.clave;

  // Lo mínimo para no gastar un viaje. Lo que vale de verdad lo dice el
  // servidor —el nombre es único y eso sólo lo sabe él— y su mensaje es el que
  // se enseña.
  if (accion === 'crear' && nombre.length < 3) {
    aviso = { texto: 'El nombre de jugador necesita al menos 3 letras.', mal: true };
    return pintarEntrada();
  }
  if (!correo.includes('@')) {
    aviso = { texto: 'Ese correo no lo parece.', mal: true };
    return pintarEntrada();
  }
  if (clave.length < 6) {
    aviso = { texto: 'La contraseña son al menos 6 caracteres.', mal: true };
    return pintarEntrada();
  }

  boton.disabled = true;
  boton.textContent = 'Un momento…';
  try {
    if (accion === 'crear') {
      try {
        await registrar(correo, clave);
      } catch (e) {
        // El alta son DOS pasos —crear el usuario y crear su fila de jugador— y
        // si el segundo falla el primero ya está hecho. Reintentar daba «User
        // already registered» y no había forma de salir: la cuenta existía, sin
        // nombre y sin colección, y entrar por la otra pestaña te asignaba un
        // nombre automático. Pasó de verdad.
        //
        // Así que un correo ya registrado no es el final: se entra con él. La
        // contraseña la sigue comprobando el servidor, o sea que esto no abre
        // ninguna puerta que no estuviera abierta.
        if (!/already registered|already been registered/i.test(e.message)) throw e;
        await entrarConCorreo(correo, clave);
      }
      // El nombre se pone al CREAR la fila del jugador, dentro de `entrar()`, y
      // por eso no gasta el único cambio que se permite después.
      await alEntrar(nombre);
    } else {
      await entrarConCorreo(correo, clave);
      await alEntrar(null);
    }
    // Dentro: el borrador se va con la pantalla. Dejar la contraseña en una
    // variable del módulo después de entrar no hace falta para nada.
    borrador.nombre = ''; borrador.correo = ''; borrador.clave = '';
    return;
  } catch (e) {
    aviso = { texto: e.message, mal: true };
  }
  pintarEntrada();
}
