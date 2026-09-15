"""Las piezas de la tienda: del PNG del generador al WebP servido.

    python tools/tienda.py            # dice qué haría y mide
    python tools/tienda.py escribir   # escribe los WebP

Cinco clases de pieza, y cada una llega distinta:

  placa_tienda     la sexta placa del menú. MAGENTA, se keyea con la función de
                   tools/marcos.py y se sirve en assets/piel/, junto a las otras
                   cinco, porque test/marcado.test.js las busca ahí.
  dorso_*          un dorso de carta, A SANGRE. NO se recorta: se reduce con su
                   proporción y el CSS lo estira a la carta (82:112), como al
                   dorso de siempre, que mide 2:3. Los primeros llegaron a 0,714
                   y recortarlos a 0,732 se comía el filo del marco.
  tapete_*         la losa que se repite en el tablero, A SANGRE. Se hace
                   cuadrada y se OSCURECE hasta la luminancia de la piedra de
                   siempre (35 de 255) si llega más clara: debajo van cartas.
  medallon_*       el emblema del centro del tablero. MAGENTA, se keyea.
  estandarte_*     el estandarte de la presentación. MAGENTA, se keyea.
  cinta_*          la banderola del marcador final. MAGENTA, se keyea. Apunta a
                   la izquierda; el CSS la refleja cuando la lleva el rival.
  retrato_*        el retrato del jugador, A SANGRE y cuadrado. No se recorta:
                   el círculo lo pone el CSS.
  marco_retrato    el aro de latón que va encima del retrato. MAGENTA, se keyea.
                   Imprime el diámetro del hueco, que es el `--retrato-hueco`
                   del CSS.
  holografico      la lámina que brilla sobre las legendarias y las de jefe.
                   A sangre; el CSS la mezcla con `color-dodge`.

Todo lo que no es la placa va a assets/piel/tienda/. Los nombres son los de
`PIEZAS` en src/ui/tienda.js, y test/tienda.test.js falla si las dos listas se
separan o si ARTE_LISTO miente sobre el disco.
"""
import sys
from pathlib import Path

import numpy as np
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
    'tapete_ambar': ('assets/piel/tienda/tapete_ambar.webp', 512),
    'tapete_obsidiana': ('assets/piel/tienda/tapete_obsidiana.webp', 512),
    'tapete_morrison': ('assets/piel/tienda/tapete_morrison.webp', 512),
    'tapete_volcan': ('assets/piel/tienda/tapete_volcan.webp', 512),
    'medallon_ambar': ('assets/piel/tienda/medallon_ambar.webp', 680),
    'medallon_obsidiana': ('assets/piel/tienda/medallon_obsidiana.webp', 680),
    'medallon_morrison': ('assets/piel/tienda/medallon_morrison.webp', 680),
    'medallon_volcan': ('assets/piel/tienda/medallon_volcan.webp', 680),
    'estandarte_ambar': ('assets/piel/tienda/estandarte_ambar.webp', 360),
    'estandarte_obsidiana': ('assets/piel/tienda/estandarte_obsidiana.webp', 360),
    'estandarte_fosil': ('assets/piel/tienda/estandarte_fosil.webp', 360),
    'estandarte_volcan': ('assets/piel/tienda/estandarte_volcan.webp', 360),
    'cinta_ambar': ('assets/piel/tienda/cinta_ambar.webp', 480),
    'cinta_obsidiana': ('assets/piel/tienda/cinta_obsidiana.webp', 480),
    'dorso_morrison': ('assets/piel/tienda/dorso_morrison.webp', 512),
    'dorso_hell_creek': ('assets/piel/tienda/dorso_hell_creek.webp', 512),
    'dorso_kem_kem': ('assets/piel/tienda/dorso_kem_kem.webp', 512),
    'dorso_volcan': ('assets/piel/tienda/dorso_volcan.webp', 512),
    'tapete_hell_creek': ('assets/piel/tienda/tapete_hell_creek.webp', 512),
    'tapete_kem_kem': ('assets/piel/tienda/tapete_kem_kem.webp', 512),
    'tapete_solnhofen': ('assets/piel/tienda/tapete_solnhofen.webp', 512),
    'tapete_excavacion': ('assets/piel/tienda/tapete_excavacion.webp', 512),
    'cinta_fosil': ('assets/piel/tienda/cinta_fosil.webp', 480),
    'cinta_volcan': ('assets/piel/tienda/cinta_volcan.webp', 480),
    'retrato_paleontologa': ('assets/piel/tienda/retrato_paleontologa.webp', 512),
    'retrato_buscador': ('assets/piel/tienda/retrato_buscador.webp', 512),
    'retrato_amonite': ('assets/piel/tienda/retrato_amonite.webp', 512),
    'retrato_huevo': ('assets/piel/tienda/retrato_huevo.webp', 512),
    'retrato_placas': ('assets/piel/tienda/retrato_placas.webp', 512),
    'marco_retrato': ('assets/piel/tienda/marco_retrato.webp', 256),
    'holografico': ('assets/piel/tienda/holografico.webp', 512),
}

KEYEADAS = ('placa_', 'medallon_', 'estandarte_', 'cinta_', 'marco_')

# La luminancia media de assets/piel/piedra.webp, medida: el techo de un tapete.
LUZ_PIEDRA = 35
# La proporción del estandarte de siempre recortado (787 / 1919): la de la caja
# que lo pinta en efectos.css.
PROPORCION_ESTANDARTE = 787 / 1919


def recortar_alfa(im, margen_rel=0.01):
    caja = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    if not caja:
        return im
    m = round(margen_rel * max(im.size))
    return im.crop((max(0, caja[0] - m), max(0, caja[1] - m),
                    min(im.size[0], caja[2] + m), min(im.size[1], caja[3] + m)))


def luz(im):
    a = np.asarray(im.convert('RGB')).astype(float)
    return float((a * [0.299, 0.587, 0.114]).sum(axis=2).mean())


def tapete(im):
    """Cuadrada por el centro y, si llega más clara que la piedra, oscurecida."""
    im = im.convert('RGB')
    w, h = im.size
    lado = min(w, h)
    im = im.crop(((w - lado) // 2, (h - lado) // 2, (w - lado) // 2 + lado, (h - lado) // 2 + lado))
    antes = luz(im)
    if antes > LUZ_PIEDRA:
        a = np.asarray(im).astype(float) * (LUZ_PIEDRA / antes)
        im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    return im, antes, luz(im)


def main(escribir):
    faltan = 0
    for stem, (destino, ancho) in PIEZAS.items():
        p = ORIGEN / f'{stem}.png'
        if not p.exists():
            print(f'{stem}.png: no está en {ORIGEN.relative_to(RAIZ)}')
            faltan += 1
            continue
        original = Image.open(p)
        nota = ''
        if stem.startswith(KEYEADAS):
            pieza = recortar_alfa(keyear(original))
            calidad = 88
            if stem.startswith('estandarte_'):
                prop = pieza.size[0] / pieza.size[1]
                nota = f' (proporción {prop:.3f}; la caja es {PROPORCION_ESTANDARTE:.3f}, estira ×{PROPORCION_ESTANDARTE / prop:.2f} a lo ancho)'
        elif stem.startswith('tapete_'):
            pieza, antes, despues = tapete(original)
            calidad = 86
            nota = f' (luz {antes:.0f} -> {despues:.0f}; la piedra es {LUZ_PIEDRA})'
        else:
            pieza = original.convert('RGB')
            calidad = 86
        alto = round(ancho * pieza.size[1] / pieza.size[0])
        print(f'{p.name} {original.size[0]}×{original.size[1]} -> {destino} {ancho}×{alto}{nota}')
        if escribir:
            salida = RAIZ / destino
            salida.parent.mkdir(parents=True, exist_ok=True)
            pieza.resize((ancho, alto), Image.LANCZOS).save(salida, 'WEBP', quality=calidad)

    if faltan:
        print(f'\nFaltan {faltan}. Mientras falte alguna, ARTE_LISTO tiene que estar en false.')


if __name__ == '__main__':
    main('escribir' in sys.argv[1:])
