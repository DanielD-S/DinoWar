"""Los marcos de carta: del PNG keyeado en magenta al WebP que se sirve, y la
medida de sus huecos para carta.css.

    python tools/marcos.py            # mide los huecos de cada marco
    python tools/marcos.py escribir   # además escribe los WebP en assets/marcos/

Los originales son PNG de 1024x1536 con los huecos —anillo del coste, banda del
nombre, ventana, caja y chapas— rellenos de magenta puro #FF00FF. Ese color no
aparece en ningún material del juego, así que basta con medir la distancia a él:
lo que está cerca se hace transparente, con un borde suave de 60 unidades para
que el canto no salga dentado.

La medida sale de las regiones magenta conexas, en porcentaje de la carta, y es
lo que se copia a las variables `--ven-*`, `--ban-*`, `--pla-*` y las de las
chapas. `lleno` es el área de la región partido por la de su caja: 1,0 es un
rectángulo, 0,78 un círculo y 0,64 un triángulo, que es como se distinguen las
dos chapas sin mirarlas.

La geometría la decide el PNG, no esta herramienta ni el CSS: si se regenera un
marco se vuelve a medir aquí y se copian los números. Las cinco de dinosaurio
tienen que coincidir entre sí dentro de medio punto, o las cartas dan un salto
al pasar de una rareza a otra."""
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
CARPETA = RAIZ / 'assets' / 'marcos'
ANCHO_WEBP = 512

# Original -> fichero servido. Las de soporte no llevan rareza: un material por
# familia, decidido al rehacer el juego de marcos.
SALIDA = {
    'marco_carta_comun': 'dino_comun',
    'marco_carta_rara': 'dino_rara',
    'marco_carta_epica': 'dino_epica',
    'marco_carta_legendaria': 'dino_legendaria',
    'marco_carta_jefe': 'dino_jefe',
    'marco_carta_clima': 'clima',
    'marco_carta_evento': 'evento',
    'marco_carta_recurso': 'recurso',
}

# Las piezas del sobre salen del mismo generador y con el mismo material, y
# viven con las del tablero en assets/piel/. El sobre va keyeado —el magenta
# es lo que le da forma de bolsa—; el dorso llena la carta entera y no lleva
# magenta que quitar.
PIEZAS_ORIGEN = RAIZ / 'assets' / 'piel' / 'tablero_componentes'
PIEZAS = {
    'sobre_cerrado': (RAIZ / 'assets' / 'piel' / 'sobre.webp', True),
    'dorso_carta': (RAIZ / 'assets' / 'piel' / 'dorso.webp', False),
}


def distancia_a_magenta(rgb):
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    return np.sqrt((r - 255) ** 2 + g ** 2 + (b - 255) ** 2)


def keyear(im):
    """RGBA con el magenta hecho transparente y un borde suave."""
    rgb = np.asarray(im.convert('RGB'))
    d = distancia_a_magenta(rgb)
    alfa = np.clip((d - 40) / 60, 0, 1) * 255
    return Image.fromarray(np.dstack([rgb, alfa]).astype(np.uint8), 'RGBA')


def regiones(mascara):
    """Componentes conexas de una máscara booleana, a 4 vecinos."""
    H, W = mascara.shape
    etiqueta = np.zeros((H, W), int)
    n = 0
    for y in range(H):
        for x in range(W):
            if not mascara[y, x] or etiqueta[y, x]:
                continue
            n += 1
            cola = deque([(y, x)])
            etiqueta[y, x] = n
            while cola:
                cy, cx = cola.popleft()
                for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                    if 0 <= ny < H and 0 <= nx < W and mascara[ny, nx] and not etiqueta[ny, nx]:
                        etiqueta[ny, nx] = n
                        cola.append((ny, nx))
    return etiqueta, n


def medir(im):
    """Los huecos del marco en porcentaje de la carta, de arriba abajo."""
    d = distancia_a_magenta(np.asarray(im.convert('RGB')))
    chica = Image.fromarray((d < 60).astype(np.uint8) * 255).resize((256, 384), Image.NEAREST)
    mascara = np.asarray(chica) > 0
    etiqueta, n = regiones(mascara)
    H, W = mascara.shape
    huecos = []
    for i in range(1, n + 1):
        ys, xs = np.where(etiqueta == i)
        if len(ys) < 40 or (xs.min() == 0 and ys.min() == 0):
            continue  # ruido, o el fondo de fuera del marco
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        huecos.append({
            'x0': x0 / W * 100, 'x1': x1 / W * 100, 'y0': y0 / H * 100, 'y1': y1 / H * 100,
            'an': (x1 - x0) / W * 100, 'al': (y1 - y0) / H * 100,
            'cx': (x0 + x1) / 2 / W * 100, 'cy': (y0 + y1) / 2 / H * 100,
            'lleno': len(ys) / ((x1 - x0) * (y1 - y0)),
        })
    return sorted(huecos, key=lambda h: (h['y0'], h['x0']))


def main(escribir):
    for original in sorted(CARPETA.glob('marco_carta_*.png')):
        nombre = SALIDA.get(original.stem)
        im = Image.open(original)
        print(f'{original.name} {im.size[0]}x{im.size[1]}' + (f' -> {nombre}.webp' if nombre else '  (sin destino)'))
        for h in medir(im):
            print(f"  x {h['x0']:5.1f}-{h['x1']:5.1f}  y {h['y0']:5.1f}-{h['y1']:5.1f}"
                  f"  an {h['an']:5.2f} al {h['al']:5.2f}  cx {h['cx']:5.2f} cy {h['cy']:5.2f}  lleno {h['lleno']:.2f}")
        if escribir and nombre:
            alto = round(ANCHO_WEBP * im.size[1] / im.size[0])
            keyear(im).resize((ANCHO_WEBP, alto), Image.LANCZOS).save(CARPETA / f'{nombre}.webp', 'WEBP', quality=88)

    for stem, (destino, con_key) in PIEZAS.items():
        original = PIEZAS_ORIGEN / f'{stem}.png'
        if not original.exists():
            continue
        im = Image.open(original)
        print(f'{original.name} {im.size[0]}x{im.size[1]} -> {destino.relative_to(RAIZ)}' + (' (keyeado)' if con_key else ''))
        if con_key:
            for h in medir(im):
                print(f"  silueta x {h['x0']:5.1f}-{h['x1']:5.1f}  y {h['y0']:5.1f}-{h['y1']:5.1f}")
        if escribir:
            alto = round(ANCHO_WEBP * im.size[1] / im.size[0])
            salida = keyear(im) if con_key else im.convert('RGB')
            salida.resize((ANCHO_WEBP, alto), Image.LANCZOS).save(destino, 'WEBP', quality=88)


if __name__ == '__main__':
    main('escribir' in sys.argv[1:])
