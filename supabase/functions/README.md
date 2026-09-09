# Edge Functions de la Cuenca

`asalto/` es la única autoridad del juego. Todo lo que decide algo pasa por
aquí; el cliente no escribe estado de juego en ninguna tabla.

## Por qué el motor se importa tal cual

`_compartido/validarAsalto.js` importa `src/engine/` sin adaptarlo. Puede
hacerlo porque el motor es JavaScript puro con módulos ES: sin DOM, sin
dependencias y determinista con la semilla. Eso no es suerte —
`test/pureza.test.js` falla si `src/engine/`, `src/data/` o `sim/` mencionan el
DOM, si `reduce()` muta su argumento o si la misma semilla deja de dar la misma
partida.

Consecuencia práctica: **el mismo código valida en el servidor y juega en el
navegador**, así que no pueden divergir. Un segundo motor «de servidor» sería
la forma segura de que un día calculasen cosas distintas.

## Qué se prueba y dónde

La lógica de validación se prueba en Node, con `npm test`
(`test/asalto.test.js`), incluidos los intentos de trampa: mandar el daño
hecho, dormir al jefe, reenviar las jugadas de otra partida, mazos ilegales y
listas enormes para quemar CPU. No hace falta desplegar para ejecutarlos.

## Desplegar

Las Edge Functions **no son SQL** y no se despliegan desde el editor SQL: son
TypeScript sobre Deno y van por su propio camino. Hay dos.

### Con la CLI, desde un ordenador

```bash
supabase functions deploy asalto --project-ref <ref>
```

Resuelve los imports ella sola, así que despliega `index.ts` tal cual.

### Desde el panel, que también vale desde el móvil

Edge Functions → **Deploy a new function** → **Via Editor**. Pero el editor es
de UN fichero y esta función importa el motor entero, así que hay que pegar el
paquete:

```bash
node tools/empaquetar-asalto.mjs      # → asalto/paquete.ts
```

Se pega el contenido de `paquete.ts`, se llama la función `asalto` y se
despliega. Ojo a lo que avisa la documentación de Supabase: **el editor del
panel no tiene control de versiones ni vuelta atrás**, así que la fuente de
verdad sigue siendo el repositorio.

`paquete.ts` es una segunda copia del motor y eso sólo es aceptable si no puede
quedarse atrás en silencio: lleva dentro la huella de los ficheros que empaquetó
y `test/paquete.test.js` la recalcula y falla si no cuadra.

En los dos casos, `SUPABASE_URL`, `SUPABASE_ANON_KEY` y
`SUPABASE_SERVICE_ROLE_KEY` las inyecta Supabase sola: no hay que configurar
ningún secreto.

## Lo que todavía NO cierra

- **La propiedad del mazo.** El servidor comprueba que tu mazo es legal —50
  cartas, copias por rareza— pero no que las tengas: la colección vive hoy en
  tu `localStorage`. Cerrarlo es mover la colección al servidor.
- **CAPTCHA en el alta anónima.** El límite es de 30 altas por hora y por IP;
  antes de abrirlo a desconocidos hay que activar Turnstile.

## Desplegar desde aquí, sin tocar el panel

El servidor MCP de Supabase puede desplegar la función directamente. Es la vía
buena: el editor del panel viene con una plantilla «Hello World» ya escrita, y si
el pegado no la reemplaza entera se despliega la plantilla. Pasó cuatro veces
seguidas, y desde fuera parecía un fallo del código: la función arrancaba bien,
contestaba 200 y devolvía `{"message":"Hello undefined!"}`.

**Cómo saber qué hay desplegado de verdad**: `ezbr_sha256`, en la lista de
funciones. Cambia cuando cambia el código. Si repite entre dos despliegues, es
que subiste lo mismo.

## Importes por URL: estáticos, siempre

`desde-url.ts` trae el motor del repositorio por URL. Los importes tienen que ser
**estáticos y con la URL literal**, aunque haya que repetirla en cada línea. Con
un `await import(`${REPO}/...`)` la ruta se calcula en tiempo de ejecución, el
empaquetado del despliegue no ve la dependencia y no la incluye: la función
arranca y muere con `Module not found` **aunque la URL conteste 200**. Cuesta
diagnosticarlo porque todo lo demás está bien. Lo vigila `test/anclaje.test.js`.

## Cómo probar la función sin un navegador

Se puede invocar desde la propia base de datos, que sí la alcanza:

```sql
create extension if not exists http with schema extensions;

select status, content from extensions.http((
  'POST', 'https://<ref>.supabase.co/functions/v1/asalto',
  array[extensions.http_header('apikey','<clave publicable>'),
        extensions.http_header('Authorization','Bearer <clave publicable>')],
  'application/json', '{}')::extensions.http_request);

drop extension http;   -- no dejarlo puesto
```

Hacen falta LAS DOS cabeceras: sin `apikey`, la pasarela contesta
`INVALID_CREDENTIALS` antes de llegar a la función.

Con la clave publicable como sesión, la respuesta correcta es
`401 {"error":"sesión inválida"}` — eso significa que tu código está vivo y
rechazando a quien no se identifica. Si contesta otra cosa, no es tu código.
