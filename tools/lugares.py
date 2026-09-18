"""Las texturas de los LUGARES: del PNG original al WebP que se ve en la ranura.

    python tools/lugares.py            # mide y dice qué haría
    python tools/lugares.py escribir   # escribe en assets/piel/lugares/

Cada lugar del tablero —el Río, la Ciénaga, el Cauce seco— puede llevar una
textura de suelo que se pinta DENTRO de la ranura vacía de su columna, sobre
la piedra de siempre y por dentro del marco de latón. Los originales van a
`src/piel/lugares/<id>.png`, con el `id` exacto de `src/data/lugares.js`, y
esta herramienta:

1. MIDE la ventana de la ranura —el hueco por dentro del marco de
   `assets/piel/ranura_vacia.webp`— y la imprime en porcentaje: esos son los
   números de `.ranura[data-lugar-arte]` en piel.css, como los huecos de los
   marcos de carta. No se estiman.
2. Recorta cada original a la proporción de esa ventana, centrado, lo apaga
   un poco —el rótulo del lugar va encima y tiene que leerse— y lo escala a
   `ANCHO` píxeles, que es tres veces la ranura de un móvil.
3. Escribe `indice.json` con los ids que tienen textura. El juego lee el
   índice y sólo pide los ficheros que existen: una textura que no está no
   es un 404 en la consola, es una ranura con la piedra de siempre.

Una textura mal nombrada no falla: no sale nunca. Por eso se avisa de todo
fichero de `src/piel/lugares/` que no sea el id de un lugar.
"""

import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / 'src' / 'piel' / 'lugares'
DESTINO = RAIZ / 'assets' / 'piel' / 'lugares'
RANURA = RAIZ / 'assets' / 'piel' / 'ranura_vacia.webp'
LUGARES_JS = RAIZ / 'src' / 'data' / 'lugares.js'

ANCHO = 240          # tres veces los 83 px de la ranura a 360 de ancho
CALIDAD = 80
APAGADO = 0.78       # la textura se pinta a este brillo: el rótulo va encima
LUM_MARCO = 70       # por encima de esto es latón; por debajo, piedra


def ids_de_lugares():
    """Los ids del set, leídos del propio fichero de datos."""
    src = LUGARES_JS.read_text(encoding='utf-8')
    return [m.group(1) for m in re.finditer(r"^\s{2}([a-z_]+): lugar\(\{", src, re.M)]


def medir_ventana():
    """El hueco por dentro del marco de la ranura, en píxeles y en porcentaje.

    Desde el centro hacia fuera, la primera columna o fila que sea mayormente
    latón (clara) es el marco; lo de dentro es la ventana.
    """
    im = Image.open(RANURA).convert('RGBA')
    w, h = im.size
    lum = np.asarray(im).astype(int)[..., :3].mean(axis=2)
    claro = lum > LUM_MARCO
    cx, cy = w // 2, h // 2
    banda_y = slice(cy - h // 8, cy + h // 8)
    banda_x = slice(cx - w // 8, cx + w // 8)
    x0 = next(x for x in range(cx, -1, -1) if claro[banda_y, x].mean() > 0.5)
    x1 = next(x for x in range(cx, w) if claro[banda_y, x].mean() > 0.5)
    y0 = next(y for y in range(cy, -1, -1) if claro[y, banda_x].mean() > 0.5)
    y1 = next(y for y in range(cy, h) if claro[y, banda_x].mean() > 0.5)
    ancho, alto = x1 - x0, y1 - y0
    # Tamaño y posición del fondo en CSS: `background-size` es el tamaño de
    # la ventana en porcentaje, y `background-position` p% coloca el punto p%
    # de la imagen en el punto p% de la caja, así que p = borde / (100 − tamaño).
    tam_x, tam_y = 100 * ancho / w, 100 * alto / h
    pos_x = 100 * (100 * x0 / w) / (100 - tam_x) if tam_x < 100 else 50
    pos_y = 100 * (100 * y0 / h) / (100 - tam_y) if tam_y < 100 else 50
    return {
        'px': (x0, x1, y0, y1, w, h),
        'ratio': ancho / alto,
        'size': (round(tam_x, 1), round(tam_y, 1)),
        'position': (round(pos_x, 1), round(pos_y, 1)),
    }


def original(id_):
    for ext in ('png', 'PNG', 'jpg', 'jpeg', 'webp'):
        p = ORIGEN / f'{id_}.{ext}'
        if p.exists():
            return p
    return None


def recortar_a(im, ratio):
    """Recorta al centro hasta la proporción pedida, sin estirar."""
    w, h = im.size
    if w / h > ratio:
        nw = round(h * ratio)
        x0 = (w - nw) // 2
        return im.crop((x0, 0, x0 + nw, h))
    nh = round(w / ratio)
    y0 = (h - nh) // 2
    return im.crop((0, y0, w, y0 + nh))


def apagar(im, factor):
    a = np.asarray(im.convert('RGB')).astype(np.float64) * factor
    return Image.fromarray(a.clip(0, 255).round().astype(np.uint8), 'RGB')


def main(escribir):
    ventana = medir_ventana()
    x0, x1, y0, y1, w, h = ventana['px']
    print(f'ranura {w}×{h}: ventana x {x0}..{x1}, y {y0}..{y1} '
          f'({ventana["ratio"]:.3f} de proporción)')
    print(f'  piel.css → background-size: {ventana["size"][0]}% {ventana["size"][1]}%; '
          f'background-position: {ventana["position"][0]}% {ventana["position"][1]}%')

    ids = ids_de_lugares()
    servidas = []
    for id_ in ids:
        p = original(id_)
        if not p:
            continue
        im = Image.open(p)
        rec = recortar_a(im.convert('RGB'), ventana['ratio'])
        alto = round(ANCHO / ventana['ratio'])
        print(f'{p.name} {im.size[0]}×{im.size[1]} → {id_}.webp @{ANCHO}×{alto}')
        if escribir:
            DESTINO.mkdir(parents=True, exist_ok=True)
            apagar(rec, APAGADO).resize((ANCHO, alto), Image.LANCZOS) \
                .save(DESTINO / f'{id_}.webp', 'WEBP', quality=CALIDAD)
        servidas.append(id_)

    if ORIGEN.exists():
        sueltos = sorted(p.name for p in ORIGEN.iterdir()
                         if p.is_file() and p.stem not in ids)
        for nombre in sueltos:
            print(f'  AVISO: {nombre} no es el id de ningún lugar y no saldrá nunca')

    faltan = [i for i in ids if i not in servidas]
    print(f'{len(servidas)} de {len(ids)} lugares con textura'
          + (f'; sin ella: {", ".join(faltan)}' if faltan else ''))
    if escribir:
        DESTINO.mkdir(parents=True, exist_ok=True)
        (DESTINO / 'indice.json').write_text(
            json.dumps({'piezas': servidas}, indent=2) + '\n', encoding='utf-8')
        print(f'indice.json: {len(servidas)} piezas')


if __name__ == '__main__':
    main('escribir' in sys.argv[1:])
