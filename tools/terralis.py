#!/usr/bin/env python3
"""Convierte las tiras de Terralis generadas por IA en una fuente.

    python tools/terralis.py            # escribe assets/fuentes/terralis.woff2
    python tools/terralis.py --vista    # además deja una muestra PNG en tools/

Terralis es la letra del juego. No existe como fichero de fuente: existe como
seis imágenes en `assets/fuentes/terralis-*.png`, una fila de glifos cada una,
tal como salieron del generador —con su dorado, su bisel y sus grietas—. Este
script separa los glifos por luminosidad, cierra las grietas, vectoriza cada
silueta con potrace y monta una fuente OpenType.

Las métricas son las de Cinzel (mismo cuerpo de mayúscula, misma ascendente y
descendente): Terralis va la primera en la pila de carta.css y Cinzel detrás,
y con las mismas medidas cambiar una por otra no mueve la carta. La fuente
sólo tiene los glifos de las tiras; el `@font-face` la declara con un
`unicode-range` limitado a ellos, así que cualquier otro carácter —un
paréntesis, una coma— sigue saliendo de Cinzel.

Las acentuadas no se trazan: se COMPONEN. La tira de tildes sólo aporta los
acentos —el agudo de la Á y la á, la diéresis de la Ü y la ü—, que el script
recoloca sobre la vocal de la tira de letras. Así la Á y la A son la misma A,
cosa que dos generaciones distintas no garantizan.

Dependencias, de herramienta y no del juego:

    pip install Pillow numpy fonttools brotli potracer
"""

import sys
from pathlib import Path

try:
    import numpy as np
    import potrace
    from PIL import Image, ImageFilter
    from fontTools.fontBuilder import FontBuilder
    from fontTools.pens.t2CharStringPen import T2CharStringPen
except ImportError as e:
    sys.exit(f'Falta {e.name}. Instálalo con:  pip install Pillow numpy fonttools brotli potracer')

sys.stdout.reconfigure(encoding='utf-8')

RAIZ = Path(__file__).resolve().parent.parent
CARPETA = RAIZ / 'assets' / 'fuentes'
DESTINO = CARPETA / 'terralis.woff2'
VISTA = RAIZ / 'tools' / 'terralis-muestra.png'

# Las tiras y lo que trae cada una, en el orden en que se generaron. El orden
# de la lista importa: la altura de x de las minúsculas se mide en la primera
# tira de minúsculas y la segunda, que no tiene ascendentes, se escala con ella.
TIRAS = [
    ('terralis-cifras.png', '0123456789/'),
    ('terralis-mayusculas-1.png', 'ABCDEFGHIJKLM'),
    ('terralis-mayusculas-2.png', 'NÑOPQRSTUVWXYZ'),
    ('terralis-minusculas-1.png', 'abcdefghijklm'),
    ('terralis-minusculas-2.png', 'nñopqrstuvwxyz'),
    ('terralis-tildes.png', 'ÁÉÍÓÚÜáéíóúü'),
]

# De qué glifos se mide la línea de base y la altura de cada tira: los que
# apoyan plano y terminan plano. Los redondos sobresalen por arriba y por
# abajo, como en cualquier serif, y moverían la mediana.
PLANOS = {
    'cifras': '1234578',
    'mayusculas': 'BDEFHIKLMNPRTXZ',
    'minusculas': 'hiklmnrux',        # apoyan plano
}
ALTURA_X = 'acemnorsuvwxz'            # terminan en la altura de x
ASCENDENTES = 'bdhkl'
COMPUESTOS = {
    'Á': ('A', 'Á'), 'É': ('E', 'Á'), 'Í': ('I', 'Á'), 'Ó': ('O', 'Á'), 'Ú': ('U', 'Á'), 'Ü': ('U', 'Ü'),
    'á': ('a', 'á'), 'é': ('e', 'á'), 'í': ('i', 'á'), 'ó': ('o', 'á'), 'ú': ('u', 'á'), 'ü': ('u', 'ü'),
}

NOMBRES = {
    '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five',
    '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '/': 'slash',
    'Ñ': 'Ntilde', 'ñ': 'ntilde',
    'Á': 'Aacute', 'É': 'Eacute', 'Í': 'Iacute', 'Ó': 'Oacute', 'Ú': 'Uacute', 'Ü': 'Udieresis',
    'á': 'aacute', 'é': 'eacute', 'í': 'iacute', 'ó': 'oacute', 'ú': 'uacute', 'ü': 'udieresis',
}
for _c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz':
    NOMBRES[_c] = _c

# Métricas de Cinzel (assets/fuentes/cinzel-latin.woff2), medidas con fontTools.
UPM = 1000
ALTURA_MAYUSCULA = 700
ASCENDENTE = 976
DESCENDENTE = -372
# Las minúsculas de una capital romana suben un pelo por encima de la
# mayúscula. Cinzel no tiene minúsculas (trae versalitas), así que esto no se
# mide en ella: es la proporción habitual.
ALTURA_ASCENDENTE = 720
# Blanco a cada lado del glifo, en unidades. Cinzel deja unos 60 en las
# cifras. Las mayúsculas de Terralis son más anchas que las de Cinzel (0,74 em
# de avance medio con 50 de blanco, contra 0,68), y carta.css calcula el cuerpo
# de los nombres con ese 0,68-0,69: con 35 quedan en 0,71, que entra. Las
# cifras son tabulares —todas al mismo ancho, centradas— para que «12/13» no
# baile al herirse.
BLANCO = {'cifras': 60, 'mayusculas': 35, 'minusculas': 40}
ESPACIO = 260

# Umbral de luminosidad (0..255) por encima del cual un píxel es letra y no
# fondo. Bajo a propósito: el bisel oscurece un lado de cada glifo y con 80 se
# quedaba fuera. Lo que entra de más —motas de la piedra— lo tira `limpiar()`.
UMBRAL = 55
# Las grietas dibujadas cruzan los glifos con unos 10 px de ancho: un cierre
# morfológico (dilatar y erosionar) de esta ventana las tapa. Como la ventana
# es cuadrada deja escalones, y un desenfoque con corte por debajo del medio
# los suaviza y de paso rellena lo que el cierre no alcanzó. Probado con las
# cifras: 80/7 sin desenfoque queda mordido, 65/17 con escalones.
CIERRE = 13
DESENFOQUE = 4
CORTE = 110


def luminancia(im):
    a = np.asarray(im.convert('RGB')).astype(float)
    return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]


def tramos(perfil, minimo):
    """Tramos contiguos de `perfil` (bool) de al menos `minimo` de largo."""
    salida, inicio = [], None
    for i, v in enumerate(list(perfil) + [False]):
        if v and inicio is None:
            inicio = i
        elif not v and inicio is not None:
            if i - inicio >= minimo:
                salida.append((inicio, i - 1))
            inicio = None
    return salida


def componentes(mascara):
    """Componentes conexos (4-vecinos) sin scipy, de mayor a menor."""
    alto, ancho = mascara.shape
    visto = np.zeros_like(mascara, bool)
    piezas = []
    for y0 in range(alto):
        for x0 in range(ancho):
            if not mascara[y0, x0] or visto[y0, x0]:
                continue
            pila, pieza = [(y0, x0)], []
            visto[y0, x0] = True
            while pila:
                y, x = pila.pop()
                pieza.append((y, x))
                for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                    if 0 <= ny < alto and 0 <= nx < ancho and mascara[ny, nx] and not visto[ny, nx]:
                        visto[ny, nx] = True
                        pila.append((ny, nx))
            m = np.zeros_like(mascara, bool)
            ys, xs = zip(*pieza)
            m[list(ys), list(xs)] = True
            piezas.append(m)
    return sorted(piezas, key=lambda m: -m.sum())


def limpiar(celda):
    """Cierra las grietas, suaviza el borde y se queda con el glifo: las piezas
    que pesen al menos un 2 % de la mayor —el punto de la i pesa un 8 %—. Lo
    demás son motas de la piedra."""
    im = Image.fromarray((celda * 255).astype('uint8'))
    im = im.filter(ImageFilter.MaxFilter(CIERRE)).filter(ImageFilter.MinFilter(CIERRE))
    im = im.filter(ImageFilter.GaussianBlur(DESENFOQUE))
    cerrada = np.asarray(im) > CORTE
    piezas = componentes(cerrada)
    mayor = piezas[0].sum()
    return [p for p in piezas if p.sum() >= 0.02 * mayor]


def separar(lum, esperados):
    """Devuelve (fila_superior, fila_inferior, [(x0, x1)...]) de los glifos."""
    m = lum > UMBRAL
    # La banda de los glifos es la tira de filas con más tinta seguida; las
    # vetas de la piedra no llegan ni al 0,5 % del ancho.
    filas = tramos(m.sum(axis=1) > 0.005 * m.shape[1], 40)
    y0, y1 = max(filas, key=lambda t: t[1] - t[0])
    y0, y1 = max(0, y0 - 6), min(m.shape[0] - 1, y1 + 6)
    columnas = tramos(m[y0:y1 + 1].any(axis=0), 20)
    # Una veta clara de la piedra puede colar como columna. Si sobran, se van
    # las que menos tinta tienen: una veta es una raya, una letra es un bloque.
    if len(columnas) > esperados:
        tinta = {c: m[y0:y1 + 1, c[0]:c[1] + 1].sum() for c in columnas}
        fuera = sorted(columnas, key=lambda c: tinta[c])[:len(columnas) - esperados]
        columnas = [c for c in columnas if c not in fuera]
    if len(columnas) != esperados:
        sys.exit(f'Esperaba {esperados} glifos y separé {len(columnas)}: {columnas}')
    return y0, y1, columnas


def caja(mascara):
    filas = np.where(mascara.any(axis=1))[0]
    cols = np.where(mascara.any(axis=0))[0]
    return dict(arriba=filas.min(), abajo=filas.max(), izq=cols.min(), der=cols.max())


def trazar(mascara):
    """Silueta → lista de contornos, cada uno (inicio, [segmentos]) con
    segmentos ('L', punto) o ('C', (c1, c2, fin)). Coordenadas de imagen, y
    hacia abajo."""
    relleno = np.pad(mascara, 2)
    # potracer toma True como fondo: se le pasa invertida.
    ruta = potrace.Bitmap(~relleno).trace(turdsize=12, alphamax=1.0, opttolerance=0.2)
    contornos = []
    for curva in ruta.curves:
        segs, inicio = [], (curva.start_point.x - 2, curva.start_point.y - 2)
        for s in curva.segments:
            fin = (s.end_point.x - 2, s.end_point.y - 2)
            if s.is_corner:
                segs.append(('L', (s.c.x - 2, s.c.y - 2)))
                segs.append(('L', fin))
            else:
                segs.append(('C', ((s.c1.x - 2, s.c1.y - 2), (s.c2.x - 2, s.c2.y - 2), fin)))
        contornos.append((inicio, segs))
    return contornos


def leer_tiras():
    """Recorre las tiras y devuelve, por carácter, sus piezas limpias y la
    referencia de su tira: línea de base (fila) y escala (unidades por px)."""
    glifos, referencias = {}, {}
    altura_x = None
    for fichero, caracteres in TIRAS:
        ruta = CARPETA / fichero
        if not ruta.exists():
            sys.exit(f'No está {ruta.relative_to(RAIZ)}')
        familia = fichero.split('-')[1].split('.')[0].rstrip('12')
        lum = luminancia(Image.open(ruta))
        y0, y1, columnas = separar(lum, len(caracteres))
        piezas = {}
        for ch, (x0, x1) in zip(caracteres, columnas):
            celda = lum[y0:y1 + 1, x0 - 3:x1 + 4] > UMBRAL
            piezas[ch] = limpiar(celda)
            if familia == 'tildes':
                # El cierre que tapa las grietas también suelda la diéresis a
                # la u: quedan a 6 px. Se separan por FILA, cortando dos
                # píxeles por encima de donde empieza el cuerpo en la celda
                # sin cerrar, y quedan dos piezas: cuerpo y marca.
                corte = caja(componentes(celda)[0])['arriba'] - 2
                todo = np.zeros_like(celda)
                for p in piezas[ch]:
                    todo |= p
                cuerpo, marca = todo.copy(), todo.copy()
                cuerpo[:corte] = False
                marca[corte:] = False
                piezas[ch] = [cuerpo, marca]

        # El cuerpo de cada glifo es su pieza mayor: en la Á es la A, no la
        # tilde; en la i es el palo, no el punto.
        cuerpo = {ch: caja(p[0]) for ch, p in piezas.items()}
        planos = [c for c in PLANOS.get(familia, '') if c in cuerpo]
        if familia == 'tildes':
            planos = [c for c in 'ÉÍ' if c in cuerpo]
        base = float(np.median([cuerpo[c]['abajo'] for c in planos]))
        if familia == 'minusculas':
            asc = [c for c in ASCENDENTES if c in cuerpo]
            if asc:
                alto = float(np.median([base - cuerpo[c]['arriba'] for c in asc]))
                escala = ALTURA_ASCENDENTE / alto
                altura_x = float(np.median([(base - cuerpo[c]['arriba']) * escala
                                            for c in ALTURA_X if c in cuerpo]))
            else:
                alto = float(np.median([base - cuerpo[c]['arriba'] for c in ALTURA_X if c in cuerpo]))
                escala = altura_x / alto
        else:
            alto = float(np.median([base - cuerpo[c]['arriba'] for c in planos]))
            escala = ALTURA_MAYUSCULA / alto
        print(f'{fichero}: {len(columnas)} glifos, base en la fila {base:.0f}, escala {escala:.3f}')
        for ch in caracteres:
            glifos[ch] = piezas[ch]
            referencias[ch] = (base, escala, familia)
    print(f'altura de x: {altura_x:.0f}')
    return glifos, referencias


def dibujar(pen, piezas, px, py):
    for pieza in piezas:
        for inicio, segs in trazar(pieza):
            pen.moveTo((px(inicio[0]), py(inicio[1])))
            for tipo, dato in segs:
                if tipo == 'L':
                    pen.lineTo((px(dato[0]), py(dato[1])))
                else:
                    c1, c2, fin = dato
                    pen.curveTo((px(c1[0]), py(c1[1])), (px(c2[0]), py(c2[1])), (px(fin[0]), py(fin[1])))
            pen.closePath()


def main(vista=False):
    glifos, referencias = leer_tiras()

    # Ancho tabular de las cifras: la más ancha más el blanco.
    ancho_cifra = max((caja(glifos[c][0])['der'] - caja(glifos[c][0])['izq'] + 1) * referencias[c][1]
                      for c in '0123456789')
    avance_cifra = round(ancho_cifra + 2 * BLANCO['cifras'])

    orden = ['.notdef', 'space'] + [NOMBRES[c] for _, cs in TIRAS for c in cs]
    fb = FontBuilder(UPM, isTTF=False)
    fb.setupGlyphOrder(orden)
    fb.setupCharacterMap({0x20: 'space', **{ord(c): NOMBRES[c] for _, cs in TIRAS for c in cs}})

    trazos, metricas = {}, {}
    for nombre, avance in (('.notdef', 500), ('space', ESPACIO)):
        trazos[nombre] = T2CharStringPen(avance, None).getCharString()
        metricas[nombre] = (avance, 0)

    # Marcas de las tildes: todo lo que no es el cuerpo del glifo, con su hueco
    # sobre el cuerpo medido en su propia tira.
    marcas = {}
    for ch in 'ÁÜáü':
        cuerpo, resto = glifos[ch][0], glifos[ch][1:]
        base, escala, _ = referencias[ch]
        marca = np.zeros_like(cuerpo)
        for p in resto:
            marca |= p
        cc, cm = caja(cuerpo), caja(marca)
        marcas[ch] = dict(mascara=marca, escala=escala,
                          hueco=(cc['arriba'] - cm['abajo']) * escala,
                          centro=((cc['izq'] + cc['der']) / 2 - (cm['izq'] + cm['der']) / 2) * escala)

    def glifo_simple(ch):
        """Devuelve (avance, margen, dibujar_en(pen)) del glifo tal cual sale
        de su tira."""
        piezas = glifos[ch]
        base, escala, familia = referencias[ch]
        # Para la í hace falta la i sin punto: el cuerpo solo.
        return piezas, base, escala, familia

    for _, caracteres in TIRAS:
        for ch in caracteres:
            if ch in COMPUESTOS:
                base_ch, marca_ch = COMPUESTOS[ch]
                piezas, base, escala, familia = glifo_simple(base_ch)
                if base_ch == 'i':
                    piezas = piezas[:1]
            else:
                piezas, base, escala, familia = glifo_simple(ch)
            todo = np.zeros_like(piezas[0])
            for p in piezas:
                todo |= p
            cj = caja(todo)
            ancho = (cj['der'] - cj['izq'] + 1) * escala
            if familia == 'cifras' and ch != '/':
                avance = avance_cifra
            else:
                avance = round(ancho + 2 * BLANCO[familia if familia != 'tildes' else 'cifras'])
            margen = (avance - ancho) / 2
            px = lambda x, izq=cj['izq'], e=escala, m=margen: (x - izq) * e + m
            py = lambda y, b=base, e=escala: (b + 1 - y) * e
            pen = T2CharStringPen(avance, None)
            dibujar(pen, piezas, px, py)
            if ch in COMPUESTOS:
                mk = marcas[COMPUESTOS[ch][1]]
                cm = caja(mk['mascara'])
                e2 = mk['escala']
                # La marca va centrada sobre el cuerpo y a la altura a la que
                # la dibujó el generador sobre su propia vocal.
                cx = px((cj['izq'] + cj['der']) / 2) - mk['centro']
                cy = py(cj['arriba']) + mk['hueco']
                pxm = lambda x, e=e2, cx=cx, izq=cm['izq'], der=cm['der']: cx + (x - (izq + der + 1) / 2) * e
                pym = lambda y, e=e2, cy=cy, abajo=cm['abajo']: cy + (abajo + 1 - y) * e
                dibujar(pen, [mk['mascara']], pxm, pym)
            trazos[NOMBRES[ch]] = pen.getCharString()
            metricas[NOMBRES[ch]] = (avance, round(margen))

    fb.setupCFF('Terralis', {'FullName': 'Terralis', 'FamilyName': 'Terralis'}, trazos, {})
    fb.setupHorizontalMetrics(metricas)
    fb.setupHorizontalHeader(ascent=ASCENDENTE, descent=DESCENDENTE)
    fb.setupNameTable({'familyName': 'Terralis', 'styleName': 'Regular',
                       'psName': 'Terralis-Regular', 'fullName': 'Terralis'})
    fb.setupOS2(sTypoAscender=ASCENDENTE, sTypoDescender=DESCENDENTE, sTypoLineGap=0,
                usWinAscent=ASCENDENTE, usWinDescent=-DESCENDENTE,
                sCapHeight=ALTURA_MAYUSCULA, sxHeight=500, fsType=0)
    fb.setupPost()

    fuente = fb.font
    fuente.flavor = 'woff2'
    fuente.save(DESTINO)
    print(f'→ {DESTINO.relative_to(RAIZ)} ({DESTINO.stat().st_size} bytes)')

    # Anchura media por clase, en em: es el 0,68-0,69 que carta.css usa para
    # calcular el cuerpo con el que entra un nombre. Si se aleja de Cinzel,
    # hay que ajustar esos factores.
    media = lambda cs: sum(metricas[NOMBRES[c]][0] for c in cs) / len(cs) / UPM
    print(f'anchura media: mayúsculas {media("ABCDEFGHIJKLMNOPQRSTUVWXYZ"):.3f} em, '
          f'minúsculas {media("abcdefghijklmnopqrstuvwxyz"):.3f} em, cifras {avance_cifra / UPM:.3f} em')

    if vista:
        from PIL import ImageDraw, ImageFont
        otf = VISTA.with_suffix('.otf')
        fuente.flavor = None
        fuente.save(otf)
        lienzo = Image.new('RGB', (1100, 520), (14, 11, 8))
        dib = ImageDraw.Draw(lienzo)
        y = 10
        for cuerpo in (6, 7.8, 9.2, 14, 21, 40, 64):
            f = ImageFont.truetype(str(otf), round(cuerpo))
            dib.text((10, y), 'ALLOSAURUS FRAGILIS  Monzón de verano  Sequía  Ü ñ  12/13', font=f, fill=(247, 233, 200))
            y += round(cuerpo) + 12
        lienzo.save(VISTA)
        # Pillow deja el fichero abierto hasta que se suelta la fuente; en
        # Windows no se puede borrar antes.
        del f, dib
        try:
            otf.unlink()
        except PermissionError:
            pass
        print(f'→ {VISTA.relative_to(RAIZ)}')


if __name__ == '__main__':
    main(vista='--vista' in sys.argv)
