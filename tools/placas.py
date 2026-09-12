"""Las placas del menú: del PNG del generador al WebP con transparencia.

    python tools/placas.py            # dice qué haría
    python tools/placas.py escribir   # escribe los WebP en assets/piel/

Las cinco placas de los botones y la barra de «Empezar partida» llegan con el
fondo que le dio la gana al generador: un damero de blanco y gris, negro puro
o un marrón casi negro. Ninguno sirve tal cual, y a diferencia de los marcos
no se pidieron en magenta. Se keyean por INUNDACIÓN desde el borde: se toma
como fondo lo que se parece al color de las esquinas Y está conectado con el
borde de la imagen. Lo de dentro del marco de latón nunca se toca, aunque sea
tan oscuro como el fondo, porque el marco lo cierra.

Las placas se sirven a 256 px de ancho: en el menú miden 66 px y a densidad 3x
son 200. La barra, a 1086: mide 342 px en el menú."""
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / 'assets' / 'piel' / 'tablero_componentes'
DESTINO = RAIZ / 'assets' / 'piel'

# original -> (fichero servido, ancho)
PIEZAS = {
    'placa_coleccion': ('placa_coleccion.webp', 256),
    'placa_sobres': ('placa_sobres.webp', 256),
    'placa_mazos': ('placa_mazos.webp', 256),
    'placa_cuenca': ('placa_cuenca.webp', 256),
    'placa_cuenta': ('placa_cuenta.webp', 256),
    'boton_ancho': ('boton_ancho.webp', 1086),
}


def candidatos_a_fondo(rgb):
    """Píxeles que PODRÍAN ser fondo: se parecen al color de las esquinas.

    Con un damero las esquinas dan dos colores distintos; con un fondo liso,
    uno. Se acepta cualquiera de los cuatro con tolerancia, y además todo lo
    neutro y claro, que es el damero entero."""
    H, W, _ = rgb.shape
    esquinas = [rgb[2, 2], rgb[2, W - 3], rgb[H - 3, 2], rgb[H - 3, W - 3]]
    mascara = np.zeros((H, W), bool)
    for c in esquinas:
        d = np.sqrt(((rgb - c.astype(float)) ** 2).sum(axis=2))
        # Con fondo oscuro la tolerancia va corta: la roca de dentro y el hueco
        # entre los dos filetes de latón andan a 20 del fondo, y con 28 la
        # inundación se colaba por el filete y vaciaba el centro de la barra.
        mascara |= d < (10 if c.max() < 60 else 28)
    claro = rgb.min(axis=2) > 190
    neutro = (rgb.max(axis=2) - rgb.min(axis=2)) < 22
    mascara |= claro & neutro
    return mascara


def inundar_desde_el_borde(mascara):
    """Los candidatos conectados con el borde de la imagen, a 4 vecinos."""
    H, W = mascara.shape
    fondo = np.zeros((H, W), bool)
    cola = deque()
    for x in range(W):
        for y in (0, H - 1):
            if mascara[y, x] and not fondo[y, x]:
                fondo[y, x] = True
                cola.append((y, x))
    for y in range(H):
        for x in (0, W - 1):
            if mascara[y, x] and not fondo[y, x]:
                fondo[y, x] = True
                cola.append((y, x))
    while cola:
        y, x = cola.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < H and 0 <= nx < W and mascara[ny, nx] and not fondo[ny, nx]:
                fondo[ny, nx] = True
                cola.append((ny, nx))
    return fondo


def keyear(im):
    rgb = np.asarray(im.convert('RGB'))
    fondo = inundar_desde_el_borde(candidatos_a_fondo(rgb))
    alfa = Image.fromarray(((~fondo) * 255).astype(np.uint8))
    # Un píxel de suavizado en el canto: sin él el borde sale dentado.
    alfa = alfa.filter(ImageFilter.GaussianBlur(0.8))
    salida = im.convert('RGBA')
    salida.putalpha(alfa)
    return salida, fondo.mean()


def main(escribir):
    for stem, (nombre, ancho) in PIEZAS.items():
        original = ORIGEN / f'{stem}.png'
        if not original.exists():
            print(f'{stem}.png: no está en {ORIGEN.relative_to(RAIZ)}')
            continue
        im = Image.open(original)
        keyeada, cuanto = keyear(im)
        print(f'{original.name} {im.size[0]}x{im.size[1]}  fondo quitado: {cuanto * 100:4.1f} %  -> {nombre} @{ancho}')
        # Recortado a lo que queda: el generador deja aire alrededor —en la barra,
        # un tercio de la imagen— y ese aire sería altura muerta en el menú.
        caja = keyeada.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
        if caja:
            m = round(0.015 * max(im.size))
            keyeada = keyeada.crop((max(0, caja[0] - m), max(0, caja[1] - m),
                                    min(im.size[0], caja[2] + m), min(im.size[1], caja[3] + m)))
        if escribir:
            alto = round(ancho * keyeada.size[1] / keyeada.size[0])
            keyeada.resize((ancho, alto), Image.LANCZOS).save(DESTINO / nombre, 'WEBP', quality=88)
            print(f'   {keyeada.size[0]}x{keyeada.size[1]} recortado -> {ancho}x{alto}')


if __name__ == '__main__':
    main('escribir' in sys.argv[1:])
