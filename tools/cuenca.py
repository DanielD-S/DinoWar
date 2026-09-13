"""Las piezas de la Cuenca: del PNG en magenta al WebP servido.

    python tools/cuenca.py            # dice qué haría y mide el marco del jefe
    python tools/cuenca.py escribir   # escribe los WebP en assets/piel/cuenca/

Hermana de `tools/mazos.py`. Tres grupos:

  PIEZAS    llegan en magenta y se keyean con la función de los marcos: el
            marco del jefe, la bandeja, el medallón, el sello y el icono.
  ESCENAS   los cuatro estados del yacimiento: fotos a sangre, sólo se escalan.
  FONDO     la excavación, como los otros fondos: 1080 de ancho o lo que traiga.

El marco del jefe trae DOS huecos cerrados de magenta: la ventana de la
ilustración y la cartela del nombre. Se miden los dos en porcentaje del marco
recortado y esos números son los de `.cu-vitrina` en `style.css`. No se
estiman.
"""
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from marcos import keyear, distancia_a_magenta  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / 'src' / 'piel' / 'cuenca'
DESTINO = RAIZ / 'assets' / 'piel' / 'cuenca'

# original -> (servido, ancho)
PIEZAS = {
    'marco_jefe': ('marco_jefe', 768),
    'bandeja_de_fosiles': ('bandeja_fosiles', 768),
    'medallon_excavador': ('medallon_excavador', 192),
    'sello_jefe_caido': ('sello_caido', 192),
    'icono_fosil': ('ico_fosil', 96),
}
ESCENAS = {f'yacimiento_{n}': (f'yacimiento_{n}', 768) for n in (1, 2, 3, 4)}
FONDOS = {'fondo_yacimiento': ('fondo_cuenca', 1080)}


def recortar(im, margen_rel=0.01):
    caja = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    if not caja:
        return im, (0, 0) + im.size
    m = round(margen_rel * max(im.size))
    caja = (max(0, caja[0] - m), max(0, caja[1] - m),
            min(im.size[0], caja[2] + m), min(im.size[1], caja[3] + m))
    return im.crop(caja), caja


def huecos_cerrados(original, caja):
    """Las regiones de magenta que NO tocan el borde, en % del recorte."""
    d = distancia_a_magenta(np.asarray(original.convert('RGB')))
    mag = d < 60
    H, W = mag.shape
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
    dentro = mag & ~fuera
    # Componentes conexas de lo de dentro, a saltos de 4 px para no eternizarse.
    chica = dentro[::4, ::4]
    etiqueta = np.zeros(chica.shape, int)
    n = 0
    h, w = chica.shape
    for y0 in range(h):
        for x0 in range(w):
            if not chica[y0, x0] or etiqueta[y0, x0]:
                continue
            n += 1
            cola = deque([(y0, x0)])
            etiqueta[y0, x0] = n
            while cola:
                y, x = cola.popleft()
                for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                    if 0 <= ny < h and 0 <= nx < w and chica[ny, nx] and not etiqueta[ny, nx]:
                        etiqueta[ny, nx] = n
                        cola.append((ny, nx))
    cx0, cy0, cx1, cy1 = caja
    an, al = cx1 - cx0, cy1 - cy0
    salida = []
    for k in range(1, n + 1):
        ys, xs = np.where(etiqueta == k)
        if len(ys) < 50:
            continue
        x0, x1, y0, y1 = xs.min() * 4, (xs.max() + 1) * 4, ys.min() * 4, (ys.max() + 1) * 4
        salida.append({
            'izq': (x0 - cx0) / an * 100, 'arriba': (y0 - cy0) / al * 100,
            'ancho': (x1 - x0) / an * 100, 'alto': (y1 - y0) / al * 100,
            'area': len(ys),
        })
    return sorted(salida, key=lambda h: -h['area']), f'{an} / {al}'


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
        recortada, caja = recortar(con_alfa)
        print(f'{p.name} {original.size[0]}×{original.size[1]} -> {nombre}.webp @{ancho} '
              f'({recortada.size[0]}×{recortada.size[1]} tras recortar)')
        if stem == 'marco_jefe':
            huecos, prop = huecos_cerrados(original, caja)
            print(f'  aspect-ratio del marco: {prop};')
            for et, h in zip(('ventana', 'cartela'), huecos):
                print(f"  --{et}-izq: {h['izq']:.2f}%; --{et}-arriba: {h['arriba']:.2f}%; "
                      f"--{et}-ancho: {h['ancho']:.2f}%; --{et}-alto: {h['alto']:.2f}%;")
        if escribir:
            guardar(recortada, nombre, ancho)

    # El fondo a 82 pesaba 430 KB: es una escena con roca en cada píxel y se
    # ve oscurecida al 50 %, así que a 72 no se nota y pesa la mitad.
    for grupo, calidad in ((ESCENAS, 84), (FONDOS, 72)):
        for stem, (nombre, ancho) in grupo.items():
            p = ORIGEN / f'{stem}.png'
            if not p.exists():
                print(f'{stem}.png: no está en {ORIGEN.relative_to(RAIZ)}')
                continue
            im = Image.open(p).convert('RGB')
            print(f'{p.name} {im.size[0]}×{im.size[1]}  a sangre, sólo se escala -> {nombre}.webp @{min(ancho, im.size[0])}')
            if escribir:
                guardar(im, nombre, min(ancho, im.size[0]), calidad=calidad)


if __name__ == '__main__':
    main('escribir' in sys.argv[1:])
