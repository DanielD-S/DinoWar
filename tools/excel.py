"""Puente entre RECOSTE.md y una hoja de cálculo, para revisar el set a mano.

    python tools/excel.py escribir   → RECOSTE.md  →  RECOSTE.xlsx
    python tools/excel.py leer       → RECOSTE.xlsx →  RECOSTE.md

La tabla vive en RECOSTE.md, que es lo que sabe aplicar `node tools/tabla.mjs`.
Esto sólo la saca a Excel para editarla por celdas y la devuelve. El id es la
llave: no se toca ni se reordenan las filas.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

from openpyxl import Workbook, load_workbook
from openpyxl.comments import Comment
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

RAIZ = Path(__file__).resolve().parent.parent
MD = RAIZ / 'RECOSTE.md'
XLSX = RAIZ / 'RECOSTE.xlsx'
MECANICAS = RAIZ / 'tools' / 'mecanicas.json'
BALANCE = RAIZ / 'BALANCE.md'

CABECERA = ['id', 'Carta', 'Familia', 'Rareza', 'Coste actual', 'Coste nuevo',
            'Δ', 'A', 'V', 'Rasgo', 'Texto del rasgo', 'Mecánica nueva']
EDITABLES = {'Rareza', 'Coste nuevo', 'A', 'V', 'Rasgo', 'Texto del rasgo',
             'Mecánica nueva'}
RAREZAS = ('Común', 'Rara', 'Épica', 'Legendaria')
ANCHOS = {'id': 20, 'Carta': 30, 'Familia': 16, 'Rareza': 11, 'Coste actual': 13,
          'Coste nuevo': 13, 'Δ': 5, 'A': 5, 'V': 5, 'Rasgo': 24,
          'Texto del rasgo': 62, 'Mecánica nueva': 52}

FUENTE = 'Arial'
TINTA = Font(name=FUENTE, size=10)
NEGRITA = Font(name=FUENTE, size=10, bold=True)
FIJO = Font(name=FUENTE, size=10, color='6B6B6B')
TITULO = Font(name=FUENTE, size=13, bold=True)
AMARILLO = PatternFill('solid', fgColor='FFF3C4')
GRIS = PatternFill('solid', fgColor='EFEFEF')
OSCURO = PatternFill('solid', fgColor='3A3A3A')
RAYA = Side(style='thin', color='D0D0D0')
MARCO = Border(left=RAYA, right=RAYA, top=RAYA, bottom=RAYA)

PRIMERA = 6  # fila 5 es la cabecera; los datos empiezan debajo


def trocear(linea):
    """Las celdas de una fila markdown, sin los vacíos de los extremos.

    La barra escapada (\\|) vive dentro de una celda y no la parte.
    """
    return [c.strip() for c in re.split(r'(?<!\\)\|', linea)[1:-1]]


def leer_md():
    """(prosa anterior a la tabla, filas de la tabla)."""
    lineas = MD.read_text(encoding='utf8').split('\n')
    corte = next(i for i, l in enumerate(lineas) if l.startswith('| id |'))
    prosa = '\n'.join(lineas[:corte])
    filas = [trocear(l) for l in lineas[corte + 2:] if l.startswith('|')]
    return prosa, [f for f in filas if len(f) >= 10]


def escribir():
    prosa, filas = leer_md()
    wb = Workbook()
    hoja = wb.active
    hoja.title = 'Cartas'

    hoja['A1'] = 'DinoWar — recoste del set'
    hoja['A1'].font = TITULO
    hoja['A2'] = ('Edita las columnas amarillas. La rareza se elige del desplegable; los '
                  'costes son enteros de 0 a 8 (ej. 2) y A y V van de 0 a 20 (ej. 6). '
                  'Las columnas grises son de referencia y se ignoran al aplicar.')
    hoja['A3'] = ('«Texto del rasgo» es lo que la carta DICE: sirve para redactar mejor una '
                  'regla que ya existe. Para pedir una regla DISTINTA, descríbela en '
                  '«Mecánica nueva» — eso hay que escribirlo en el motor, no lo aplica la '
                  'herramienta. No cambies el id ni reordenes filas: el id es la llave.')
    for f in ('A2', 'A3'):
        hoja[f].font = TINTA
        hoja[f].alignment = Alignment(wrap_text=True, vertical='top')
        hoja.merge_cells(f'{f}:K{f[1:]}')
        hoja.row_dimensions[int(f[1:])].height = 30

    for col, nombre in enumerate(CABECERA, start=1):
        c = hoja.cell(row=5, column=col, value=nombre)
        c.font = Font(name=FUENTE, size=10, bold=True, color='FFFFFF')
        c.fill = OSCURO
        c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        c.border = MARCO
        hoja.column_dimensions[get_column_letter(col)].width = ANCHOS[nombre]
    hoja.row_dimensions[5].height = 26

    for i, fila in enumerate(filas):
        r = PRIMERA + i
        # La fila markdown no trae la Δ: se calcula en la hoja.
        valores = fila[:6] + [None] + fila[6:11]
        for col, (nombre, valor) in enumerate(zip(CABECERA, valores), start=1):
            c = hoja.cell(row=r, column=col)
            if nombre == 'Δ':
                c.value = f'=IF(F{r}="","",F{r}-E{r})'
            elif nombre in ('Coste actual', 'Coste nuevo', 'A', 'V'):
                c.value = int(valor) if valor not in (None, '') else None
            else:
                c.value = (valor or '').replace('\\|', '|')

            editable = nombre in EDITABLES
            # Un evento o un clima no tiene estadísticas: su celda no se edita.
            hueco = nombre in ('A', 'V') and c.value is None
            c.font = TINTA if editable and not hueco else FIJO
            c.fill = AMARILLO if editable and not hueco else GRIS
            c.border = MARCO
            # Los textos van con formato de texto explícito: un rasgo que empieza
            # por «+1 Ataque…» o por «-2 Poder…» lo lee Excel como una fórmula
            # rota y se niega a aceptarlo.
            if nombre in ('Rasgo', 'Texto del rasgo', 'Mecánica nueva',
                          'id', 'Carta', 'Familia'):
                c.number_format = '@'
            if nombre in ('Texto del rasgo', 'Mecánica nueva'):
                c.alignment = Alignment(wrap_text=True, vertical='top')
            elif nombre in ('Coste actual', 'Coste nuevo', 'Δ', 'A', 'V'):
                c.alignment = Alignment(horizontal='center')
            else:
                c.alignment = Alignment(vertical='top')
        hoja.row_dimensions[r].height = 30

    ultima = PRIMERA + len(filas) - 1
    hoja['G5'].comment = Comment(
        'Cuánto sube o baja el coste respecto al actual. Se calcula sola.', 'DinoWar')

    costes = DataValidation(type='whole', operator='between', formula1=0, formula2=8,
                            allow_blank=True, showErrorMessage=True,
                            errorTitle='Coste fuera de rango',
                            error='El coste es un número entero de 0 a 8.')
    stats = DataValidation(type='whole', operator='between', formula1=0, formula2=20,
                           allow_blank=True, showErrorMessage=True,
                           errorTitle='Estadística fuera de rango',
                           error='Ataque y Vida van de 0 a 20.')
    rarezas = DataValidation(type='list', formula1=f'"{",".join(RAREZAS)}"',
                             allow_blank=False, showErrorMessage=True,
                             errorTitle='Rareza no válida',
                             error='Elige una de: ' + ', '.join(RAREZAS))
    hoja.add_data_validation(costes)
    hoja.add_data_validation(stats)
    hoja.add_data_validation(rarezas)
    costes.add(f'F{PRIMERA}:F{ultima}')
    stats.add(f'H{PRIMERA}:I{ultima}')
    rarezas.add(f'D{PRIMERA}:D{ultima}')

    hoja.freeze_panes = 'B6'
    hoja.auto_filter.ref = f'A5:K{ultima}'
    # Sin bloqueo de hoja: protegía el id, pero obligaba a ir a Revisar →
    # Desproteger para tocar cualquier otra celda y Excel avisaba de una
    # contraseña que no existía. El color ya dice qué se edita y qué no.

    hoja_de_estado(wb)
    hojas_de_mecanicas(wb)

    notas = wb.create_sheet('Notas')
    notas.column_dimensions['A'].width = 110
    notas['A1'] = 'Por qué se recostea, y qué mide la propuesta'
    notas['A1'].font = TITULO
    for i, linea in enumerate(prosa.split('\n'), start=3):
        c = notas.cell(row=i, column=1, value=linea)
        c.font = NEGRITA if linea.startswith('#') else TINTA
        c.alignment = Alignment(wrap_text=True, vertical='top')

    wb.save(XLSX)
    print(f'RECOSTE.xlsx escrito: {len(filas)} cartas')


def hoja_de_estado(wb):
    """Contra qué se está recosteando: los seis objetivos y qué falla hoy.

    Sale de BALANCE.md, que lo escribe `npm run sim`. Si esa hoja se copiara a
    mano envejecería en dos horas, que es el ritmo al que se han movido los
    números — y una hoja de estado obsoleta es peor que no tenerla, porque se
    recostea contra un juego que ya no existe.
    """
    if not BALANCE.exists():
        return
    texto = BALANCE.read_text(encoding='utf8')

    objetivos = []
    for linea in texto.split(chr(10)):
        if not linea.startswith('|') or linea.startswith('|---') or 'Métrica' in linea:
            continue
        celdas = [c.strip() for c in linea.split('|')[1:-1]]
        # Se lee por la DERECHA: el nombre de una métrica puede llevar barras
        # dentro —«P(ganar | ventaja en el turno 5)»— y partir por «|» la trocea
        # en cinco. La primera versión de esto se comía justo esa fila, que es la
        # bola de nieve, o sea la métrica que más ha costado meter en rango.
        if len(celdas) >= 4 and celdas[-1] in ('✅', '❌'):
            nombre = ' | '.join(celdas[:-3]).strip()
            objetivos.append([nombre, celdas[-3], celdas[-2],
                              'cumple' if celdas[-1] == '✅' else 'FALLA'])
        if len(objetivos) >= 6:
            break

    # Las descalibradas van en el diagnóstico, con guion y raya.
    descalibradas = []
    for linea in texto.split(chr(10)):
        l = linea.strip()
        if l.startswith('- ') and '—' in l and 'índice' in l:
            nombre, resto = l[2:].split('—', 1)
            descalibradas.append([nombre.strip(), resto.strip()])

    filas = ([['OBJETIVO', 'Resultado hoy', 'Objetivo', '']] if False else []) + objetivos
    if descalibradas:
        filas.append(['', '', '', ''])
        filas.append(['Cartas fuera de banda', '', '', 'índice 1,00 es la diana; fuera de 0,70–1,30 está mal'])
        for nombre, detalle in descalibradas:
            filas.append(['', nombre, detalle, ''])

    _tabla(
        wb.create_sheet('Estado', 0),
        'Contra qué estás recosteando',
        'Sale de BALANCE.md, que escribe `npm run sim` sobre 2.000 partidas. Vuelve a '
        'correrlo después de aplicar cambios: `python tools/excel.py leer`, '
        '`node tools/tabla.mjs aplicar`, `npm test` y `npm run sim`.',
        ['Métrica', 'Resultado', 'Objetivo', 'Estado'],
        filas,
        [34, 30, 26, 54],
    )


def datos_de_mecanicas():
    """Lo que hacen los rasgos y las reglas del tablero, sacado del código.

    Se regenera al vuelo: si alguien edita balance.js y abre el Excel sin correr
    la herramienta, la hoja mentiría, y una hoja que miente sobre las reglas es
    peor que no tenerla.
    """
    subprocess.run(['node', 'tools/mecanicas.mjs'], cwd=RAIZ, check=True,
                   capture_output=True)
    return json.loads(MECANICAS.read_text(encoding='utf8'))


def _tabla(hoja, titulo, subtitulo, cabecera, filas, anchos):
    hoja['A1'] = titulo
    hoja['A1'].font = TITULO
    hoja['A2'] = subtitulo
    hoja['A2'].font = TINTA
    hoja['A2'].alignment = Alignment(wrap_text=True, vertical='top')
    hoja.merge_cells(start_row=2, start_column=1, end_row=2, end_column=len(cabecera))
    hoja.row_dimensions[2].height = 32

    for col, nombre in enumerate(cabecera, start=1):
        c = hoja.cell(row=4, column=col, value=nombre)
        c.font = Font(name=FUENTE, size=10, bold=True, color='FFFFFF')
        c.fill = OSCURO
        c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        c.border = MARCO
        hoja.column_dimensions[get_column_letter(col)].width = anchos[col - 1]
    hoja.row_dimensions[4].height = 24

    for i, fila in enumerate(filas):
        for col, valor in enumerate(fila, start=1):
            c = hoja.cell(row=5 + i, column=col, value=valor)
            c.font = TINTA
            c.fill = GRIS
            c.border = MARCO
            c.alignment = Alignment(wrap_text=True, vertical='top')
    hoja.freeze_panes = 'A5'


def hojas_de_mecanicas(wb):
    """Tres hojas de sólo lectura: qué hace cada rasgo, las reglas y los clados.

    Son de referencia, no editables: cambiarlas aquí no cambia el juego, porque
    salen del código. Están para poder tasar una carta sabiendo contra qué.
    """
    d = datos_de_mecanicas()
    mazo = d['mazo']

    _tabla(
        wb.create_sheet('Mecánicas'),
        'Qué hace cada rasgo, y cuánto',
        'Sale del código: el número es la constante de balance.js que mueve ese rasgo. '
        'Editar esta hoja no cambia nada — para pedir una regla distinta, usa la columna '
        '«Mecánica nueva» de la hoja Cartas.',
        ['Rasgo', 'Cartas', 'Quiénes lo llevan', 'Lo que dice la carta', 'Número', 'Qué es ese número', 'Constante'],
        [[m['nombre'], m['cartas'], m['quienes'], m['texto'], m['valor'], m['sentido'], m['constante']]
         for m in d['mecanicas']],
        [26, 8, 40, 58, 9, 42, 38],
    )

    _tabla(
        wb.create_sheet('Formas'),
        'Las formas de habilidad que el motor ya sabe aplicar',
        'Para pedir una habilidad nueva en «Mecánica nueva», lo más barato es describirla con '
        'una de estas formas y otros números: eso es un dato, no código. Una forma que no esté '
        'aquí se puede hacer igual, pero hay que escribirla en el motor.',
        ['Campo', 'Forma', 'Cartas', 'Quiénes la llevan', 'Ejemplo de texto'],
        [[f['campo'], f['forma'], f['cartas'], f['quienes'], f['ejemplo']] for f in d['formas']],
        [14, 30, 8, 46, 62],
    )

    _tabla(
        wb.create_sheet('Reglas'),
        'Las reglas del tablero',
        'Contra esto se tasa una carta. Un coste no significa nada sin saber cuánta renta '
        'hay por turno ni cuánto aguanta un hábitat.',
        ['Bloque', 'Regla', 'Valor', 'Qué implica'],
        d['reglas'],
        [16, 34, 14, 62],
    )

    _tabla(
        wb.create_sheet('Clados'),
        'Los clados y la red trófica',
        'No es piedra-papel-tijera. Sólo tres clados tienen regla propia; los demás se '
        'distinguen únicamente por sus cifras medias.',
        ['Clado', 'Cartas', 'Ataque medio', 'Vida media', 'Regla propia'],
        [[c['clado'], c['cartas'], float(c['ataque']), float(c['vida']), c['regla']] for c in d['clados']],
        [18, 8, 14, 12, 56],
    )

    _tabla(
        wb.create_sheet('Mazo de referencia'),
        'El mazo que mide el simulador',
        'IMPORTANTE: `npm run sim` juega SÓLO este mazo. Una carta que no esté aquí no '
        'aparece en BALANCE.md por mucho que la cambies — para esas está `node '
        'sim/cobertura.mjs`, y para los climas `node sim/climas.js`.',
        ['id', 'Copias en el mazo'],
        [[k, v] for k, v in mazo.items()],
        [24, 18],
    )


def leer():
    prosa, previas = leer_md()
    wb = load_workbook(XLSX)
    hoja = wb['Cartas']
    indice = {c.value: i for i, c in enumerate(hoja[5]) if c.value in CABECERA}
    faltan = [n for n in CABECERA if n not in indice]
    if faltan:
        raise SystemExit(f'a la hoja le faltan columnas: {", ".join(faltan)}')

    orden = [f[0] for f in previas]
    porid = {}
    for fila in hoja.iter_rows(min_row=PRIMERA, values_only=True):
        cid = fila[indice['id']]
        if not cid:
            continue
        porid[str(cid).strip()] = fila

    perdidas = [i for i in orden if i not in porid]
    if perdidas:
        raise SystemExit(f'faltan filas en la hoja: {", ".join(perdidas)}')

    lineas = []
    for previa in previas:
        fila = porid[previa[0]]
        def celda(n, fila=fila):
            v = fila[indice[n]]
            return '' if v is None else str(v).strip()
        # id, nombre, familia y coste actual son de referencia y vienen del
        # markdown; el resto sale de la hoja, que es lo que se ha editado.
        campos = [previa[0], previa[1], previa[2], celda('Rareza') or previa[3], previa[4],
                  celda('Coste nuevo'), celda('A'), celda('V'),
                  celda('Rasgo'), celda('Texto del rasgo').replace('|', '\\|'),
                  celda('Mecánica nueva').replace('|', '\\|')]
        lineas.append('| ' + ' | '.join(campos) + ' |')

    tabla = ('| ' + ' | '.join(n for n in CABECERA if n != 'Δ') + ' |\n'
             + '|' + '---|' * (len(CABECERA) - 1) + '\n')
    MD.write_text(prosa + '\n' + tabla + '\n'.join(lineas) + '\n', encoding='utf8')
    print(f'RECOSTE.md actualizado desde el Excel: {len(lineas)} cartas')


if __name__ == '__main__':
    orden = sys.argv[1] if len(sys.argv) > 1 else ''
    if orden == 'escribir':
        escribir()
    elif orden == 'leer':
        leer()
    else:
        print('uso: python tools/excel.py escribir|leer')
