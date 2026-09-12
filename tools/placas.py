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
    # La pantalla de carga. El logo y los tres textos son imágenes a petición
    # del autor: llegaron dibujados con el mismo latón que el resto, y a 900 px
    # de ancho van nítidos a densidad 3x en una franja de 300.
    'carga_logo': ('carga_logo.webp', 1000),
    'carga_medallon': ('carga_medallon.webp', 512),
    'carga_epigrafe': ('carga_epigrafe.webp', 900),
    'carga_lema': ('carga_lema.webp', 900),
    'carga_cargando': ('carga_cargando.webp', 700),
}

# La BARRA de carga son tres dibujos sobre el mismo lienzo de 2172×724: el
# marco con su ranura vacía, el canal suelto y el relleno de oro. No se sirven
# tal cual: se componen en DOS y la geometría de la ranura se mide y se imprime
# para el CSS, que es la regla de los marcos de carta — los números no se
# estiman. Ver `componer_barra()`.
BARRA = {
    'marco': 'carga_marco', 'canal': 'carga_canal', 'relleno': 'carga_relleno',
    'salida_marco': 'carga_marco.webp', 'salida_relleno': 'carga_relleno.webp',
    'ancho': 1086,
}

# Un fondo a sangre no es una placa: no se keyea ni se recorta, sólo se escala.
# 1080 de ancho es lo que mide `portada.webp`, y por el mismo motivo — es el
# ancho de un móvil a densidad 3x.
FONDOS = {
    'fondo_jugar': ('fondo_jugar.webp', 1080),
    'fondo_carga': ('fondo_carga.webp', 1080),
    # La marca de la casa, que se enseña al arrancar. Es un cuadrado con el
    # fondo pintado —no es una placa— y se ve a unos 280 px: 800 sobra.
    'marca_chihui': ('marca_chihui.webp', 800),
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


def etiquetar(mascara):
    """Etiqueta las manchas conectadas de una máscara, a 4 vecinos.

    Devuelve (etiquetas, tamaños): un entero por píxel —0 es fondo— y el
    número de píxeles de cada etiqueta, en orden de aparición."""
    H, W = mascara.shape
    etiquetas = np.zeros((H, W), np.int32)
    tamanos = [0]
    for y0 in range(H):
        for x0 in range(W):
            if not mascara[y0, x0] or etiquetas[y0, x0]:
                continue
            k = len(tamanos)
            tamanos.append(0)
            cola = deque([(y0, x0)])
            etiquetas[y0, x0] = k
            while cola:
                y, x = cola.popleft()
                tamanos[k] += 1
                for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                    if 0 <= ny < H and 0 <= nx < W and mascara[ny, nx] and not etiquetas[ny, nx]:
                        etiquetas[ny, nx] = k
                        cola.append((ny, nx))
    return etiquetas, tamanos


def mancha_mayor(mascara):
    """La mancha conectada más grande. Para la ranura del marco, que es una."""
    etiquetas, tamanos = etiquetar(mascara)
    if len(tamanos) < 2:
        return None, 0
    k = int(np.argmax(tamanos[1:])) + 1
    return etiquetas == k, tamanos[k]


# Por debajo de esto una mancha sólida es una mota, no un dibujo. A 2000 px de
# lienzo, el punto de una «i» o los tres puntos de «Cargando…» pasan de mil
# píxeles; una mota del render son unas decenas.
MOTA = 64


def sin_motas(solido):
    """La máscara sin las manchas diminutas. Se queda con TODAS las demás.

    La primera versión se quedaba sólo con la mancha mayor, que para una placa
    es lo mismo y para un texto no: cada letra es una mancha, y del logo salió
    la «D» sola. Lo que separa el dibujo de la basura no es ser el mayor, es
    no ser diminuto."""
    etiquetas, tamanos = etiquetar(solido)
    buenas = np.array([n >= MOTA for n in tamanos])
    buenas[0] = False
    return buenas[etiquetas], int(sum(n for n in tamanos[1:] if n < MOTA))


def limpiar_canto(im):
    """Quita del alfa lo que no pertenece a la placa. Devuelve (imagen, motas)."""
    rgba = im.convert('RGBA')
    alfa = np.asarray(rgba.getchannel('A'))
    solido = alfa > 200
    placa, motas = sin_motas(solido)
    if not placa.any():
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


def caja(alfa, umbral):
    return Image.fromarray((alfa > umbral).astype(np.uint8) * 255).getbbox()


def componer_barra(escribir):
    """El marco con el canal dentro de la ranura, y el relleno alargado al 100 %.

    Lo que llegó: un marco con la ranura VACÍA (transparente), un canal suelto
    —la versión sin adornos, más ancha que la ranura— y el relleno de oro
    dibujado a la escala del canal, no de la ranura, y sólo hasta el 62 %.

    Lo que sale, en el mismo lienzo y recortado por la misma caja:
      carga_marco.webp    el marco, con la ranura ya rellena con la textura
                          oscura del canal. Opaco donde antes había hueco.
      carga_relleno.webp  el oro, a la escala de la ranura y alargado hasta
                          cubrirla entera, puesto en su sitio.

    El CSS coloca el relleno ENCIMA del marco, lo recorta a la ranura y lo
    desplaza a la izquierda según el progreso: así la punta redondeada del oro
    es siempre el borde que avanza, cosa que un `width` recortado no da.

    Por qué se alarga tejiendo y no estirando: el oro es una textura agrietada
    y un estirado de 1,7× se nota. Se corta por los casquetes, y el tramo del
    medio se repite en espejo hasta llegar, que no deja costura."""
    marco = Image.open(ORIGEN / f"{BARRA['marco']}.png").convert('RGBA')
    canal = Image.open(ORIGEN / f"{BARRA['canal']}.png").convert('RGBA')
    rell = Image.open(ORIGEN / f"{BARRA['relleno']}.png").convert('RGBA')
    if marco.size != canal.size or marco.size != rell.size:
        raise SystemExit('la barra de carga: las tres piezas tienen que venir en el mismo lienzo')

    # 1. La ranura: lo transparente que NO toca el borde. Es el único hueco
    #    encerrado que tiene el marco; las motas se van con la mancha mayor.
    am = np.asarray(marco.getchannel('A'))
    transparente = am < 30
    encerrado = transparente & ~inundar_desde_el_borde(transparente)
    ranura, _ = mancha_mayor(encerrado)
    ys, xs = np.where(ranura)
    rx0, rx1, ry0, ry1 = int(xs.min()), int(xs.max()) + 1, int(ys.min()), int(ys.max()) + 1
    print(f'  ranura del marco: x {rx0}..{rx1} y {ry0}..{ry1}  ({rx1 - rx0}×{ry1 - ry0})')

    # 2. La textura del canal, dentro de la ranura. Del canal se toma sólo el
    #    interior —sin su filete de latón, que la ranura ya trae el suyo— y se
    #    pega con la propia ranura de máscara, para respetar sus extremos.
    cb = caja(np.asarray(canal.getchannel('A')), 200)
    m = round((cb[3] - cb[1]) * 0.09)
    interior = canal.crop((cb[0] + 2 * m, cb[1] + m, cb[2] - 2 * m, cb[3] - m))
    textura = interior.resize((rx1 - rx0, ry1 - ry0), Image.LANCZOS)
    base = Image.new('RGBA', marco.size, (0, 0, 0, 0))
    mascara = Image.fromarray((ranura * 255).astype(np.uint8)).crop((rx0, ry0, rx1, ry1))
    base.paste(textura, (rx0, ry0), mascara)
    marco_lleno = Image.alpha_composite(base, marco)

    # 3. El relleno: a la escala de la ranura, alargado hasta cubrirla entera.
    ar = np.asarray(rell.getchannel('A'))
    rb = caja(ar, 200)                 # el oro sólido
    hb = caja(ar, 24)                  # el oro con su halo
    escala = (ry1 - ry0) / (rb[3] - rb[1])
    tira = rell.crop(hb)
    sx0, sx1 = rb[0] - hb[0], rb[2] - hb[0]
    radio = (rb[3] - rb[1]) // 2
    izq = tira.crop((0, 0, sx0 + radio, tira.height))
    der = tira.crop((sx1 - radio, 0, tira.width, tira.height))
    medio = tira.crop((sx0 + radio, 0, sx1 - radio, tira.height))
    falta = round((rx1 - rx0) / escala) - 2 * radio
    tejido = Image.new('RGBA', (max(falta, medio.width) + medio.width, tira.height), (0, 0, 0, 0))
    x, espejo = 0, False
    while x < falta:
        tejido.paste(medio.transpose(Image.FLIP_LEFT_RIGHT) if espejo else medio, (x, 0))
        x += medio.width
        espejo = not espejo
    tejido = tejido.crop((0, 0, falta, tira.height))
    largo = Image.new('RGBA', (izq.width + falta + der.width, tira.height), (0, 0, 0, 0))
    largo.paste(izq, (0, 0))
    largo.paste(tejido, (izq.width, 0))
    largo.paste(der, (izq.width + falta, 0))
    largo = sangrar_color(largo)
    chico = largo.resize((round(largo.width * escala), round(largo.height * escala)), Image.LANCZOS)
    lienzo = Image.new('RGBA', marco.size, (0, 0, 0, 0))
    lienzo.paste(chico, (rx0 - round(sx0 * escala), ry0 - round((rb[1] - hb[1]) * escala)), chico)
    print(f'  relleno: {rb[2] - rb[0]} px de oro a escala {escala:.3f}, tejido hasta {rx1 - rx0} px')

    # 4. Los dos por la MISMA caja: la del marco con su sombra. Y la geometría
    #    de la ranura, en porcentaje de esa caja, que es lo que va al CSS.
    cm = caja(am, 24)
    marco_lleno = marco_lleno.crop(cm)
    lienzo = lienzo.crop(cm)
    W, H = marco_lleno.size
    css = {
        'izq': (rx0 - cm[0]) / W, 'arriba': (ry0 - cm[1]) / H,
        'ancho': (rx1 - rx0) / W, 'alto': (ry1 - ry0) / H,
        'proporcion': f'{W} / {H}',
    }
    print('  para carta.css / style.css (medido, no estimado):')
    print(f"    aspect-ratio: {css['proporcion']};")
    print(f"    --ranura-izq: {css['izq'] * 100:.2f}%; --ranura-arriba: {css['arriba'] * 100:.2f}%;")
    print(f"    --ranura-ancho: {css['ancho'] * 100:.2f}%; --ranura-alto: {css['alto'] * 100:.2f}%;")
    if escribir:
        a1 = guardar(marco_lleno, BARRA['salida_marco'], BARRA['ancho'])
        a2 = guardar(lienzo, BARRA['salida_relleno'], BARRA['ancho'])
        print(f"  -> {BARRA['salida_marco']} y {BARRA['salida_relleno']} @{BARRA['ancho']}×{a1} (y {a2})")
    return css


# Calidad por fichero, cuando la de serie pesa de más. La escena submarina de
# la carga tiene ondas en cada píxel y a 82 salía en 270 KB; el medallón, a
# 512 px de una textura agrietada, en 124. Son lo primero que se descarga.
CALIDAD = {
    'fondo_carga.webp': 72,
    'carga_medallon.webp': 80,
    'carga_marco.webp': 82,
}


def guardar(im, nombre, ancho, calidad=88):
    calidad = CALIDAD.get(nombre, calidad)
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

    if all((ORIGEN / f'{BARRA[k]}.png').exists() for k in ('marco', 'canal', 'relleno')):
        print('barra de carga: marco + canal + relleno')
        componer_barra(escribir)
    else:
        print('barra de carga: faltan piezas en', ORIGEN.relative_to(RAIZ))

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
