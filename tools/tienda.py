"""Las piezas de la tienda: del PNG del generador al WebP servido.

    python tools/tienda.py            # dice qué haría
    python tools/tienda.py escribir   # escribe los WebP

Dos clases de pieza, y cada una llega distinta:

  placa_tienda     la sexta placa del menú. Llega en MAGENTA #FF00FF y se keyea
                   con la función de tools/marcos.py, como las piezas de mazos.
                   Se sirve en assets/piel/placa_tienda.webp, junto a las otras
                   cinco, porque test/marcado.test.js las busca ahí.
  dorso_*          un dorso de carta. Llega A SANGRE, sin magenta: es el
                   reverso entero de la carta y se pinta a 100 % 100 % en cada
                   sitio que enseña un dorso. Se recorta a la proporción de la
                   carta (82:112) y se sirve en assets/piel/tienda/.

Los nombres son los de `PIEZAS` en src/ui/tienda.js, y test/tienda.test.js
falla si las dos listas se separan o si están todas y ARTE_LISTO sigue en false.
"""
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from marcos import keyear  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / 'src' / 'piel' / 'tienda'

# original -> (destino relativo a la raíz, ancho servido)
PIEZAS = {
    'placa_tienda': ('assets/piel/placa_tienda.webp', 256),
    'dorso_ambar': ('assets/piel/tienda/dorso_ambar.webp', 512),
    'dorso_obsidiana': ('assets/piel/tienda/dorso_obsidiana.webp', 512),
}

PROPORCION_CARTA = 82 / 112


def recortar_alfa(im, margen_rel=0.01):
    caja = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    if not caja:
        return im
    m = round(margen_rel * max(im.size))
    return im.crop((max(0, caja[0] - m), max(0, caja[1] - m),
                    min(im.size[0], caja[2] + m), min(im.size[1], caja[3] + m)))


def a_proporcion_de_carta(im):
    """Recorta al centro a 82:112 sin deformar."""
    w, h = im.size
    if w / h > PROPORCION_CARTA:
        nw = round(h * PROPORCION_CARTA)
        x = (w - nw) // 2
        return im.crop((x, 0, x + nw, h))
    nh = round(w / PROPORCION_CARTA)
    y = (h - nh) // 2
    return im.crop((0, y, w, y + nh))


def main(escribir):
    faltan = 0
    for stem, (destino, ancho) in PIEZAS.items():
        p = ORIGEN / f'{stem}.png'
        if not p.exists():
            print(f'{stem}.png: no está en {ORIGEN.relative_to(RAIZ)}')
            faltan += 1
            continue
        original = Image.open(p)
        if stem.startswith('placa_'):
            pieza = recortar_alfa(keyear(original))
            calidad = 88
        else:
            pieza = a_proporcion_de_carta(original.convert('RGB'))
            calidad = 86
        alto = round(ancho * pieza.size[1] / pieza.size[0])
        print(f'{p.name} {original.size[0]}×{original.size[1]} -> {destino} {ancho}×{alto}')
        if escribir:
            salida = RAIZ / destino
            salida.parent.mkdir(parents=True, exist_ok=True)
            pieza.resize((ancho, alto), Image.LANCZOS).save(salida, 'WEBP', quality=calidad)

    if faltan:
        print(f'\nFaltan {faltan}. Mientras falte alguna, ARTE_LISTO sigue en false.')
    elif escribir:
        print('\nEstán todas: pon ARTE_LISTO = true en src/ui/tienda.js, declara --placa en '
              '.placa-tienda (style.css) quitando su dibujo de CSS, y sube VERSION en sw.js.')


if __name__ == '__main__':
    main('escribir' in sys.argv[1:])
