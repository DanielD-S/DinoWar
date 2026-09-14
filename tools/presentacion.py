"""Las piezas de la presentación de la partida: del PNG en magenta al WebP.

    python tools/presentacion.py            # dice qué haría
    python tools/presentacion.py escribir   # escribe los WebP en assets/piel/vs/

Dos estandartes verticales, uno por bando. Llegan en magenta `#FF00FF` y se
keyean con la función de `tools/marcos.py`, como las piezas del final. El VS
reutiliza el medallón del final (`assets/piel/fin/medallon_vs.webp`), así
que aquí no se pide.

Los nombres de lo servido son los de `PIEZAS` en `src/ui/presentacion.js`, y
`test/presentacion.test.js` falla si las dos listas se separan o si están
todas y `ARTE_LISTO` sigue en false.
"""
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from marcos import keyear  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / 'src' / 'piel' / 'vs'
DESTINO = RAIZ / 'assets' / 'piel' / 'vs'

# original -> (servido, ancho). Se ven a 120 px como mucho, a densidad 3x.
PIEZAS = {
    'estandarte_propio': ('estandarte_propio', 360),
    'estandarte_rival': ('estandarte_rival', 360),
}


def recortar(im, margen_rel=0.01):
    caja = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    if not caja:
        return im
    m = round(margen_rel * max(im.size))
    return im.crop((max(0, caja[0] - m), max(0, caja[1] - m),
                    min(im.size[0], caja[2] + m), min(im.size[1], caja[3] + m)))


def main(escribir):
    faltan = 0
    for stem, (nombre, ancho) in PIEZAS.items():
        p = ORIGEN / f'{stem}.png'
        if not p.exists():
            print(f'{stem}.png: no está en {ORIGEN.relative_to(RAIZ)}')
            faltan += 1
            continue
        original = Image.open(p)
        recortada = recortar(keyear(original))
        an, al = recortada.size
        # La proporción es la que tiene que llevar `.pres-estandarte` en
        # efectos.css: se mide, no se estima.
        print(f'{p.name} {original.size[0]}×{original.size[1]} -> {nombre}.webp @{ancho} '
              f'({an}×{al} tras recortar, aspect-ratio: {an} / {al})')
        if escribir:
            DESTINO.mkdir(parents=True, exist_ok=True)
            w = min(ancho, an)
            recortada.resize((w, round(w * al / an)), Image.LANCZOS).save(
                DESTINO / f'{nombre}.webp', 'WEBP', quality=86)

    if faltan:
        print(f'\nFaltan {faltan}. Mientras falte alguna, ARTE_LISTO sigue en false.')
    elif escribir:
        print('\nEstán las dos: pon ARTE_LISTO = true en src/ui/presentacion.js y sube VERSION en sw.js.')


if __name__ == '__main__':
    main('escribir' in sys.argv[1:])
