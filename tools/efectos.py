"""Los efectos del tablero: del PNG del generador al WebP servido.

    python tools/efectos.py            # dice qué haría y mide las hojas
    python tools/efectos.py escribir   # escribe los WebP en assets/piel/efectos/

Son tres familias y ninguna se keyea. Los efectos de LUZ —choque, garra,
pisotón, aura, destello, chispa, brasa y los climas que se mueven— llegan sobre
negro puro y el CSS los pinta con `mix-blend-mode: screen`, donde el negro
desaparece solo. Los que ENSUCIAN —grietas, polvo, calima— llegan sobre blanco
y van con `multiply`, donde desaparece el blanco. Aquí sólo se escala, y se
aprieta el fondo al negro o al blanco exactos: el generador deja ruido de 1 o
2 niveles que a `screen` no se ve pero al WebP le cuesta bits.

Las HOJAS son flipbooks de 4×4, dieciséis fotogramas del mismo tamaño que el
CSS recorre con `steps()`. Se pidió una sola —el choque— y el generador
entregó siete: mejor, porque una hoja se pasa igual que un fotograma. Lo que
sí hay que comprobar es que las celdas estén ALINEADAS: el centro de masa de
cada fotograma tiene que caer en el centro de su celda, o el efecto tiembla al
pasar de una a otra. Se mide y se imprime: por debajo del 8 % de la celda no
se ve a los 128 px a los que se pinta un choque; por encima, la hoja tiembla y
no se arregla a mano. La chispa pasa de ahí y da igual: es una partícula, y
viaja mientras cambia de fotograma.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / 'src' / 'piel' / 'efectos'
DESTINO = RAIZ / 'assets' / 'piel' / 'efectos'

NEGRO, BLANCO = 'negro', 'blanco'

# nombre servido -> (fondo, lado servido). Cuadradas; la celda es lado/4.
HOJAS = {
    'choque': (NEGRO, 1024),
    'garra': (NEGRO, 1024),
    'pisoton': (NEGRO, 1024),
    'aura': (NEGRO, 1024),
    'destello': (NEGRO, 512),
    'chispa': (NEGRO, 512),
    'brasa': (NEGRO, 512),
}

# nombre servido -> (fondo, ancho servido). Un solo fotograma.
SUELTAS = {
    'grietas': (BLANCO, 1024),
    'polvo': (BLANCO, 512),
    'rayos': (NEGRO, 1024),
    'calima': (BLANCO, 1024),
}

# Mosaicos sin costuras del clima: cuadrados y se repiten.
MOSAICOS = {
    'lluvia': (NEGRO, 512),
    'llovizna': (NEGRO, 512),
    'bruma': (NEGRO, 512),
    'agua': (NEGRO, 512),
}

# El original puede llamarse distinto: el choque llegó como «flipbook».
ALIAS = {'choque': ('choque', 'flipbook')}

# Un fotograma cuyo centro se desvía más que esto de su celda tiembla.
DERIVA_MAXIMA = 0.08


def original(nombre):
    for stem in ALIAS.get(nombre, (nombre,)):
        for ext in ('png', 'PNG', 'jpg', 'webp'):
            p = ORIGEN / f'{stem}.{ext}'
            if p.exists():
                return p
    return None


def apretar_fondo(im, fondo):
    """Lo que está a un pelo del fondo, al fondo exacto. Sin tocar el efecto."""
    a = np.asarray(im.convert('RGB')).astype(np.int16)
    if fondo == NEGRO:
        mascara = a.max(axis=2) < 6
        a[mascara] = 0
    else:
        mascara = a.min(axis=2) > 249
        a[mascara] = 255
    return Image.fromarray(a.astype(np.uint8), 'RGB'), float(mascara.mean())


def medir_hoja(im, fondo):
    """La deriva del centro de masa de cada celda, en fracción de la celda."""
    g = np.asarray(im.convert('L')).astype(float)
    if fondo == BLANCO:
        g = 255 - g
    n = g.shape[0]
    c = n / 4
    celdas = [g[int(f * c):int((f + 1) * c), int(k * c):int((k + 1) * c)] for f in range(4) for k in range(4)]
    # Los fotogramas del final son humo apagado: su centro de masa baila y
    # nadie lo ve. Sólo cuentan los que tienen al menos un décimo de la luz
    # del más brillante.
    masas = [cel.sum() for cel in celdas]
    umbral = max(masas) / 10
    derivas = []
    for cel, m in zip(celdas, masas):
        if m < umbral:
            derivas.append(0.0)
            continue
        ys, xs = np.indices(cel.shape)
        dx = (xs * cel).sum() / m - c / 2
        dy = (ys * cel).sum() / m - c / 2
        derivas.append(float(np.hypot(dx, dy) / c))
    return derivas


def guardar(im, nombre, ancho, calidad=85):
    alto = round(ancho * im.size[1] / im.size[0])
    DESTINO.mkdir(parents=True, exist_ok=True)
    im.resize((ancho, alto), Image.LANCZOS).save(DESTINO / f'{nombre}.webp', 'WEBP', quality=calidad)
    return alto


def main(escribir):
    faltan = []
    for nombre, (fondo, lado) in HOJAS.items():
        p = original(nombre)
        if not p:
            faltan.append(nombre)
            continue
        im = Image.open(p)
        if im.size[0] != im.size[1]:
            print(f'{p.name}: una hoja tiene que ser cuadrada y mide {im.size[0]}×{im.size[1]}')
            continue
        im, cuanto = apretar_fondo(im, fondo)
        derivas = medir_hoja(im, fondo)
        peor = max(derivas)
        aviso = '  <- TIEMBLA' if peor > DERIVA_MAXIMA else ''
        print(f'{p.name} {im.size[0]}×{im.size[1]}  hoja 4×4 sobre {fondo}  '
              f'fondo apretado {cuanto * 100:4.1f} %  deriva máx {peor * 100:.1f} % de celda{aviso}  -> {nombre}.webp @{lado}')
        if escribir:
            guardar(im, nombre, lado)

    for grupo in (SUELTAS, MOSAICOS):
        for nombre, (fondo, ancho) in grupo.items():
            p = original(nombre)
            if not p:
                faltan.append(nombre)
                continue
            im = Image.open(p)
            im, cuanto = apretar_fondo(im, fondo)
            que = 'mosaico' if grupo is MOSAICOS else 'suelta'
            print(f'{p.name} {im.size[0]}×{im.size[1]}  {que} sobre {fondo}  '
                  f'fondo apretado {cuanto * 100:4.1f} %  -> {nombre}.webp @{ancho}')
            if escribir:
                alto = guardar(im, nombre, ancho)
                print(f'   -> {ancho}×{alto}')

    if faltan:
        print(f'\nsin original en {ORIGEN.relative_to(RAIZ)}: {", ".join(faltan)}')


if __name__ == '__main__':
    main('escribir' in sys.argv[1:])
