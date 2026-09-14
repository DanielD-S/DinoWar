"""El icono de la app: del PNG del generador a los cuatro que piden los sistemas.

    python tools/icono.py            # dice qué haría y mide el margen del dibujo
    python tools/icono.py escribir   # escribe los PNG en assets/

Un solo original, `src/piel/icono/icono.png`: cuadrado, OPACO y con el fondo
a sangre. De él salen cuatro, porque cada sistema quiere una cosa distinta:

  icono-192.png, icono-512.png   «any»: el escritorio los pinta tal cual, así
                                 que llevan las esquinas redondeadas.
  icono-maskable-512.png         Android recorta en círculo o en squircle:
                                 va a sangre, sin redondear. Sólo es seguro
                                 el círculo del 80 % central.
  icono-apple-180.png            iPhone redondea el suyo y rellena de negro
                                 cualquier transparencia: opaco y a sangre.

Sustituye a `tools/iconos.mjs`, que rasterizaba con Playwright la silueta de
terópodo de las cartas: aquel era un icono de relleno y volver a correrlo
pisaría este.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / 'src' / 'piel' / 'icono' / 'icono.png'
DESTINO = RAIZ / 'assets'

# fichero -> (lado, esquinas redondeadas)
SALIDAS = {
    'icono-192.png': (192, True),
    'icono-512.png': (512, True),
    'icono-maskable-512.png': (512, False),
    'icono-apple-180.png': (180, False),
}

# El radio de las esquinas de los «any», en fracción del lado. Es el que ya
# usaba el icono de relleno.
RADIO = 0.22


def redondear(im):
    lado = im.size[0]
    escala = 4  # la máscara se dibuja a 4x y se reduce: sin esto el canto sale dentado
    mascara = Image.new('L', (lado * escala, lado * escala), 0)
    ImageDraw.Draw(mascara).rounded_rectangle(
        (0, 0, lado * escala - 1, lado * escala - 1), radius=round(lado * escala * RADIO), fill=255)
    salida = im.convert('RGBA')
    salida.putalpha(mascara.resize((lado, lado), Image.LANCZOS))
    return salida


def margen_del_dibujo(im):
    """Lo lejos que llega el dibujo del centro, en fracción del lado.

    El dibujo es lo muy brillante —el latón—, y de eso se quitan las líneas
    finas con una apertura (erosionar y dilatar): la roca trae vetas doradas y
    un resplandor que llegan a las esquinas, y contadas como dibujo la primera
    medición decía 66 % para un cráneo que no pasa del 36 %."""
    from PIL import ImageFilter
    a = np.asarray(im.convert('RGB')).astype(float)
    luz = a.mean(axis=2)
    brillante = Image.fromarray(((luz > 115) * 255).astype(np.uint8))
    lado = max(5, (im.size[0] // 120) | 1)  # impar, proporcional al tamaño
    macizo = brillante.filter(ImageFilter.MinFilter(lado)).filter(ImageFilter.MaxFilter(lado))
    ys, xs = np.where(np.asarray(macizo) > 0)
    if len(xs) == 0:
        return None
    h, w = luz.shape
    dx = np.abs(xs - w / 2) / w
    dy = np.abs(ys - h / 2) / h
    return float(np.sqrt(dx ** 2 + dy ** 2).max())


def main(escribir):
    if not ORIGEN.exists():
        print(f'{ORIGEN.relative_to(RAIZ)}: no está')
        return 1
    im = Image.open(ORIGEN)
    if im.size[0] != im.size[1]:
        print(f'el icono tiene que ser cuadrado y mide {im.size[0]}×{im.size[1]}')
        return 1
    if im.mode in ('RGBA', 'LA') and np.asarray(im.getchannel('A')).min() < 255:
        print('el icono trae transparencia: tiene que ser opaco y a sangre')
        return 1
    m = margen_del_dibujo(im)
    print(f'{ORIGEN.name} {im.size[0]}×{im.size[1]} opaco')
    if m is not None:
        # El icono adaptable sólo garantiza el círculo de radio 40 % del lado.
        veredicto = 'cabe en la zona segura' if m <= 0.40 else 'SE SALE de la zona segura: Android lo recortará'
        print(f'  el dibujo llega al {m * 100:.1f} % del centro ({veredicto})')

    base = im.convert('RGB')
    for fichero, (lado, redondo) in SALIDAS.items():
        salida = base.resize((lado, lado), Image.LANCZOS)
        if redondo:
            salida = redondear(salida)
        print(f'  -> assets/{fichero} {lado}×{lado}{" redondeado" if redondo else " a sangre"}')
        if escribir:
            salida.save(DESTINO / fichero, 'PNG', optimize=True)
    return 0


if __name__ == '__main__':
    sys.exit(main('escribir' in sys.argv[1:]))
