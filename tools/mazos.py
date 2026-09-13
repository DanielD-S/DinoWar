"""Las piezas de la pantalla de mazos: del PNG en magenta al WebP servido.

    python tools/mazos.py            # dice qué haría y mide la placa
    python tools/mazos.py escribir   # escribe los WebP en assets/piel/mazos/

Trece piezas y una regla: llegan en magenta `#FF00FF`, como los marcos de
carta, y se keyean con la misma función de `tools/marcos.py`. No hay
inundación desde el borde —la de `placas.py`— porque la placa de mazo trae un
hueco CERRADO de magenta, la ventana de la portada, que la inundación no
alcanzaría: aquí todo el magenta se va, esté donde esté.

La placa se sirve entera y se pinta a `100% 100%` sobre una caja con su misma
proporción, no en nueve tajadas: la ventana de la portada tiene que quedarse
donde está, y un `border-image` la estiraría con la banda. Por eso se MIDE
—dónde cae la ventana en porcentaje de la placa recortada— y esos números son
los que van al CSS. No se estiman.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from marcos import keyear, distancia_a_magenta  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / 'src' / 'piel' / 'mazos'
DESTINO = RAIZ / 'assets' / 'piel' / 'mazos'

# original -> (servido, ancho). Los medallones se ven a 22 px en los filtros y
# a 40 en la placa; 192 es el doble del mayor a densidad 2x y pesa 8 KB.
PIEZAS = {
    'placa_de_mazo': ('placa_mazo', 768),
    'sello_en_uso': ('sello_en_uso', 192),
    'clado_teropodo': ('clado_teropodo', 192),
    'clado_sauropodo': ('clado_sauropodo', 192),
    'clado_tireoforo': ('clado_tireoforo', 192),
    'clado_ornitopodo': ('clado_ornitopodo', 192),
    'clado_marginocefalo': ('clado_marginocefalo', 192),
    'clado_pterosaurio': ('clado_pterosaurio', 192),
    'clado_marino': ('clado_marino', 192),
    'tipo_clima': ('tipo_clima', 192),
    'tipo_evento': ('tipo_evento', 192),
    'tipo_recurso': ('tipo_recurso', 192),
}

# El fondo no se keyea: es una escena a sangre y sólo se escala. Llegó a 941
# de ancho, así que se sirve tal cual.
FONDOS = {'fondo_mazos': ('fondo_mazos', 941)}


def recortar(im, margen_rel=0.01):
    caja = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    if not caja:
        return im
    m = round(margen_rel * max(im.size))
    return im.crop((max(0, caja[0] - m), max(0, caja[1] - m),
                    min(im.size[0], caja[2] + m), min(im.size[1], caja[3] + m)))


def medir_ventana(original, recortada_caja):
    """La ventana de la portada: el magenta ENCERRADO, en % de la placa recortada."""
    d = distancia_a_magenta(np.asarray(original.convert('RGB')))
    mag = d < 60
    H, W = mag.shape
    # El magenta de fuera toca el borde; el de la ventana no. Se quita el
    # exterior inundando desde el borde y lo que queda es la ventana.
    from collections import deque
    fuera = np.zeros_like(mag)
    cola = deque()
    for x in range(W):
        for y in (0, H - 1):
            if mag[y, x] and not fuera[y, x]:
                fuera[y, x] = True
                cola.append((y, x))
    for y in range(H):
        for x in (0, W - 1):
            if mag[y, x] and not fuera[y, x]:
                fuera[y, x] = True
                cola.append((y, x))
    while cola:
        y, x = cola.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < H and 0 <= nx < W and mag[ny, nx] and not fuera[ny, nx]:
                fuera[ny, nx] = True
                cola.append((ny, nx))
    ventana = mag & ~fuera
    ys, xs = np.where(ventana)
    if len(ys) == 0:
        return None
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    cx0, cy0, cx1, cy1 = recortada_caja
    an, al = cx1 - cx0, cy1 - cy0
    return {
        'izq': (x0 - cx0) / an * 100, 'arriba': (y0 - cy0) / al * 100,
        'ancho': (x1 - x0) / an * 100, 'alto': (y1 - y0) / al * 100,
        'proporcion': (x1 - x0) / (y1 - y0), 'placa': f'{an} / {al}',
    }


def guardar(im, nombre, ancho, calidad=86):
    alto = round(ancho * im.size[1] / im.size[0])
    DESTINO.mkdir(parents=True, exist_ok=True)
    im.resize((ancho, alto), Image.LANCZOS).save(DESTINO / f'{nombre}.webp', 'WEBP', quality=calidad)
    return alto


def main(escribir):
    for stem, (nombre, ancho) in PIEZAS.items():
        p = ORIGEN / f'{stem}.png'
        if not p.exists():
            print(f'{stem}.png: no está en {ORIGEN.relative_to(RAIZ)}')
            continue
        original = Image.open(p)
        con_alfa = keyear(original)
        caja = con_alfa.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
        recortada = recortar(con_alfa)
        print(f'{p.name} {original.size[0]}×{original.size[1]} -> {nombre}.webp @{ancho} '
              f'({recortada.size[0]}×{recortada.size[1]} tras recortar)')
        if stem == 'placa_de_mazo':
            m = round(0.01 * max(original.size))
            caja_m = (max(0, caja[0] - m), max(0, caja[1] - m),
                      min(original.size[0], caja[2] + m), min(original.size[1], caja[3] + m))
            v = medir_ventana(original, caja_m)
            if v:
                print('  la ventana de la portada, para style.css (medido, no estimado):')
                print(f"    aspect-ratio de la placa: {v['placa']};")
                print(f"    --ventana-izq: {v['izq']:.2f}%; --ventana-arriba: {v['arriba']:.2f}%;")
                print(f"    --ventana-ancho: {v['ancho']:.2f}%; --ventana-alto: {v['alto']:.2f}%;")
                print(f"    proporción de la ventana: {v['proporcion']:.3f} (la carta es {82 / 112:.3f})")
        if escribir:
            guardar(recortada, nombre, ancho)

    for stem, (nombre, ancho) in FONDOS.items():
        p = ORIGEN / f'{stem}.png'
        if not p.exists():
            print(f'{stem}.png: no está en {ORIGEN.relative_to(RAIZ)}')
            continue
        im = Image.open(p).convert('RGB')
        print(f'{p.name} {im.size[0]}×{im.size[1]}  fondo a sangre, sólo se escala -> {nombre}.webp @{ancho}')
        if escribir:
            guardar(im, nombre, min(ancho, im.size[0]), calidad=82)


if __name__ == '__main__':
    main('escribir' in sys.argv[1:])
