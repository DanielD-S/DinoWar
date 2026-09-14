"""Las piezas del final de la partida: del PNG en magenta al WebP servido.

    python tools/fin.py            # dice qué haría
    python tools/fin.py escribir   # escribe los WebP en assets/piel/fin/

Siete piezas y un fondo. Llegan en magenta `#FF00FF`, como los marcos y las
piezas de mazos, y se keyean con la misma función de `tools/marcos.py`: todo
el magenta se va, esté donde esté. El fondo no se keyea, sólo se escala.

Los nombres de lo servido son los de `PIEZAS` en `src/ui/fin.js`, y
`test/fin.test.js` falla si las dos listas se separan. Cuando estén todas,
el mismo test pide poner `ARTE_LISTO = true`: es lo que cambia el CSS de las
formas dibujadas a los WebP.
"""
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from marcos import keyear  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / 'src' / 'piel' / 'fin'
DESTINO = RAIZ / 'assets' / 'piel' / 'fin'

# original -> (servido, ancho). El estandarte mide 520 px como mucho en el
# rótulo; las cintas, unos 150 en el marcador; el rombo, 40; el medallón, 44;
# los sellos, 156 en el rótulo y 62 en el marcador. Todo a densidad 2-3x.
PIEZAS = {
    'estandarte': ('estandarte', 1040),
    'sello_victoria': ('sello_victoria', 384),
    'sello_derrota': ('sello_derrota', 384),
    'rombo': ('rombo', 128),
    'medallon_vs': ('medallon_vs', 160),
    'cinta_propia': ('cinta_propia', 480),
    'cinta_rival': ('cinta_rival', 480),
}

# Una escena a sangre detrás del marcador, oscurecida por CSS.
FONDOS = {'fondo_fin': ('fondo_fin', 1080)}


def recortar(im, margen_rel=0.01):
    caja = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    if not caja:
        return im
    m = round(margen_rel * max(im.size))
    return im.crop((max(0, caja[0] - m), max(0, caja[1] - m),
                    min(im.size[0], caja[2] + m), min(im.size[1], caja[3] + m)))


def guardar(im, nombre, ancho, calidad=86):
    alto = round(ancho * im.size[1] / im.size[0])
    DESTINO.mkdir(parents=True, exist_ok=True)
    im.resize((ancho, alto), Image.LANCZOS).save(DESTINO / f'{nombre}.webp', 'WEBP', quality=calidad)
    return alto


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
        # La proporción es lo que el CSS tiene que respetar: se imprime para
        # compararla con la caja que la pinta, no para estimarla.
        print(f'{p.name} {original.size[0]}×{original.size[1]} -> {nombre}.webp @{ancho} '
              f'({an}×{al} tras recortar, proporción {an / al:.2f})')
        if escribir:
            guardar(recortada, nombre, min(ancho, an))

    for stem, (nombre, ancho) in FONDOS.items():
        p = ORIGEN / f'{stem}.png'
        if not p.exists():
            print(f'{stem}.png: no está en {ORIGEN.relative_to(RAIZ)}')
            faltan += 1
            continue
        im = Image.open(p).convert('RGB')
        print(f'{p.name} {im.size[0]}×{im.size[1]}  fondo a sangre, sólo se escala -> {nombre}.webp @{ancho}')
        if escribir:
            guardar(im, nombre, min(ancho, im.size[0]), calidad=82)

    if faltan:
        print(f'\nFaltan {faltan}. Mientras falte alguna, ARTE_LISTO sigue en false.')
    elif escribir:
        print('\nEstán todas: pon ARTE_LISTO = true en src/ui/fin.js y sube VERSION en sw.js.')


if __name__ == '__main__':
    main('escribir' in sys.argv[1:])
