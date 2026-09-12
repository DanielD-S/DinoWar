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
son 200. La barra, a 1086: mide 342 px en el menú.

Hay tres grupos y cada uno necesita otra cosa:

  PIEZAS            llegan con fondo y hay que keyearlas por inundación.
  PIEZAS_CON_ALFA   llegan recortadas; sólo hay que quitarles las motas del canto.
  FONDOS            no son placas: se escalan y ya.
"""
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

# Las que YA LLEGAN CON ALFA. El generador las entregó recortadas, así que la
# inundación desde el borde no tiene nada que hacer aquí —y haría daño: sin
# fondo que morder, el primer píxel del borde ya es transparente y el flood no
# arranca—. Lo que sí traen es basura en el canto: unas motas rojas y amarillas
# sueltas del render, fuera de la placa y separadas de ella. Se van solas al
# quedarse con la mancha MÁS GRANDE, que es la placa.
#
# Son cuadradas, a diferencia de las cinco del menú, que son verticales: en la
# pantalla de jugar son tres y caben anchas.
PIEZAS_CON_ALFA = {
    'placa_solitario': ('placa_solitario.webp', 256),
    'placa_duelo': ('placa_duelo.webp', 256),
    'placa_misiones': ('placa_misiones.webp', 256),
}

# Un fondo a sangre no es una placa: no se keyea ni se recorta, sólo se escala.
# 1080 de ancho es lo que mide `portada.webp`, y por el mismo motivo — es el
# ancho de un móvil a densidad 3x.
FONDOS = {
    'fondo_jugar': ('fondo_jugar.webp', 1080),
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


def mancha_mayor(solido):
    """La mancha conectada más grande de una máscara. Etiquetado a 4 vecinos.

    Es lo que separa la placa de las motas del canto sin decidir un margen a
    ojo: un margen fijo o se come el borde bueno de una o deja la mota de otra,
    porque las tres traen la basura en sitios distintos."""
    H, W = solido.shape
    visto = np.zeros((H, W), bool)
    mejor, mejor_n = None, 0
    for y0 in range(H):
        for x0 in range(W):
            if not solido[y0, x0] or visto[y0, x0]:
                continue
            grupo = np.zeros((H, W), bool)
            cola = deque([(y0, x0)])
            visto[y0, x0] = grupo[y0, x0] = True
            n = 0
            while cola:
                y, x = cola.popleft()
                n += 1
                for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                    if 0 <= ny < H and 0 <= nx < W and solido[ny, nx] and not visto[ny, nx]:
                        visto[ny, nx] = grupo[ny, nx] = True
                        cola.append((ny, nx))
            if n > mejor_n:
                mejor, mejor_n = grupo, n
    return mejor, mejor_n


def limpiar_canto(im):
    """Quita del alfa lo que no pertenece a la placa. Devuelve (imagen, motas)."""
    rgba = im.convert('RGBA')
    alfa = np.asarray(rgba.getchannel('A'))
    solido = alfa > 200
    placa, n = mancha_mayor(solido)
    if placa is None:
        return rgba, 0
    # La mancha sólida se queda corta del borde real: el canto de la placa está
    # suavizado y ahí el alfa baja de 200. Se ensancha unos píxeles para
    # recuperarlo, y el alfa original manda dentro de esa zona.
    permitido = Image.fromarray((placa * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))
    nuevo = np.minimum(alfa, np.asarray(permitido))
    # Y a cero lo que quede por debajo de 8. Las tres traen un filete ROJO del
    # generador pegado al canto; la máscara lo deja en alfa 1 —invisible— pero
    # sobrevive al WebP, y un alfa de 1 vuelve a subir en cuanto algo reescala.
    # Un rojo puro asomando por el borde de una placa de latón se ve enseguida.
    nuevo = np.where(nuevo < 8, 0, nuevo)
    motas = int(solido.sum() - n)
    rgba.putalpha(Image.fromarray(nuevo.astype(np.uint8)))
    return rgba, motas


def recortar(im, margen_rel=0.015):
    """Quita el aire de alrededor. El generador deja mucho y sería hueco muerto."""
    caja = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    if not caja:
        return im
    m = round(margen_rel * max(im.size))
    return im.crop((max(0, caja[0] - m), max(0, caja[1] - m),
                    min(im.size[0], caja[2] + m), min(im.size[1], caja[3] + m)))


def sangrar_color(im, pasos=10):
    """Extiende el color del canto hacia fuera, por debajo de lo transparente.

    `Image.resize` mezcla los canales de color SIN mirar el alfa, así que el
    color de un píxel invisible entra igual en la media. Las tres placas traen
    un filete ROJO pegado al canto, y al escalarlas reaparecía en píxeles que
    antes no existían: rojo puro asomando por el borde de una placa de latón.

    Premultiplicar no sirve: al deshacerlo hay que dividir por el alfa, y en un
    píxel de alfa 1 eso devuelve el rojo entero y multiplicado. Se intentó y
    salió peor —199 píxeles rojos donde había 20—.

    Lo que sí sirve es que debajo de lo transparente no haya rojo, sino el
    mismo color que tiene la placa al lado. Entonces la mezcla da igual: lo que
    entra en la media es el color bueno. Es el «alpha bleeding» de toda la
    vida y aquí es la única de las tres vías que funciona.
    """
    a = np.asarray(im.convert('RGBA')).astype(np.float64)
    color, alfa = a[:, :, :3].copy(), a[:, :, 3]
    tiene = alfa > 32                      # de aquí sale el color bueno
    color[~tiene] = 0
    for _ in range(pasos):
        if tiene.all():
            break
        suma = np.zeros_like(color)
        cuenta = np.zeros(alfa.shape)
        for eje, giro in ((0, 1), (0, -1), (1, 1), (1, -1)):
            suma += np.roll(np.where(tiene[..., None], color, 0), giro, axis=eje)
            cuenta += np.roll(tiene, giro, axis=eje)
        nuevos = (~tiene) & (cuenta > 0)
        if not nuevos.any():
            break
        color[nuevos] = suma[nuevos] / cuenta[nuevos, None]
        tiene = tiene | nuevos
    return Image.fromarray(np.concatenate([color, alfa[..., None]], axis=2)
                           .round().clip(0, 255).astype(np.uint8), 'RGBA')


def guardar(im, nombre, ancho, calidad=88):
    alto = round(ancho * im.size[1] / im.size[0])
    if im.mode == 'RGBA':
        im = sangrar_color(im)
    im.resize((ancho, alto), Image.LANCZOS).save(DESTINO / nombre, 'WEBP', quality=calidad)
    return alto


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
            alto = guardar(keyeada, nombre, ancho)
            print(f'   {keyeada.size[0]}x{keyeada.size[1]} recortado -> {ancho}x{alto}')

    for stem, (nombre, ancho) in PIEZAS_CON_ALFA.items():
        original = ORIGEN / f'{stem}.png'
        if not original.exists():
            print(f'{stem}.png: no está en {ORIGEN.relative_to(RAIZ)}')
            continue
        im = Image.open(original)
        limpia, motas = limpiar_canto(im)
        limpia = recortar(limpia)
        print(f'{original.name} {im.size[0]}x{im.size[1]}  ya traía alfa, '
              f'motas quitadas del canto: {motas}  -> {nombre} @{ancho}')
        if escribir:
            alto = guardar(limpia, nombre, ancho)
            print(f'   {limpia.size[0]}x{limpia.size[1]} recortado -> {ancho}x{alto}')

    for stem, (nombre, ancho) in FONDOS.items():
        original = ORIGEN / f'{stem}.png'
        if not original.exists():
            print(f'{stem}.png: no está en {ORIGEN.relative_to(RAIZ)}')
            continue
        im = Image.open(original).convert('RGB')
        print(f'{original.name} {im.size[0]}x{im.size[1]}  fondo a sangre, sólo se escala -> {nombre} @{ancho}')
        if escribir:
            # 82 en vez de 88: es una foto de 1080 px y a 88 pesa medio mega.
            alto = guardar(im, nombre, ancho, calidad=82)
            print(f'   -> {ancho}x{alto}')


if __name__ == '__main__':
    main('escribir' in sys.argv[1:])
