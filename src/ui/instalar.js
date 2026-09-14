// DinoWar — instalar el juego como app.
//
// El juego ya era instalable —manifest, iconos y service worker— pero la
// opción vivía escondida en el menú del navegador y nadie sabía que existía.
// Esto la saca al menú con un botón que sólo aparece cuando sirve:
//
// - Chrome y Edge (Android y PC) avisan con `beforeinstallprompt`. Se guarda
//   el aviso y el botón lo lanza: es la ventana de instalación del sistema.
// - Safari en iPhone y iPad no tiene ese aviso ni forma de lanzarlo. Ahí el
//   botón no instala: explica el gesto, que es lo único honesto que se puede
//   hacer. Un botón que no hace nada sería peor que ninguno.
// - Si el juego ya corre instalado (`display-mode: standalone`), no sale.

let aviso = null;

const instalada = () => (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches)
  || navigator.standalone === true;

const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** Engancha el botón y su nota. Llamar una vez, al montar el menú. */
export function montarInstalar({ boton, nota }) {
  if (!boton) return;
  const pintar = () => {
    boton.hidden = instalada() || !(aviso || esIOS());
    if (boton.hidden && nota) nota.hidden = true;
  };

  addEventListener('beforeinstallprompt', (e) => {
    // Sin esto Chrome enseña su propia barra en el peor momento —a mitad de
    // partida—; con esto la instalación la pide el jugador cuando quiere.
    e.preventDefault();
    aviso = e;
    pintar();
  });
  addEventListener('appinstalled', () => { aviso = null; pintar(); });

  boton.addEventListener('click', async () => {
    if (aviso) {
      // El aviso sólo se puede usar una vez; si se rechaza, el navegador
      // manda otro más adelante y el botón vuelve a salir.
      const a = aviso;
      aviso = null;
      a.prompt();
      await a.userChoice.catch(() => {});
      return pintar();
    }
    if (esIOS() && nota) {
      nota.textContent = 'En iPhone y iPad: toca Compartir y luego «Añadir a pantalla de inicio».';
      nota.hidden = !nota.hidden;
    }
  });

  pintar();
}
