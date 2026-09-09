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

```bash
supabase functions deploy asalto --project-ref <ref>
```

Necesita `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`, que
Supabase inyecta solo.

## Lo que todavía NO cierra

- **La propiedad del mazo.** El servidor comprueba que tu mazo es legal —50
  cartas, copias por rareza— pero no que las tengas: la colección vive hoy en
  tu `localStorage`. Cerrarlo es mover la colección al servidor.
- **CAPTCHA en el alta anónima.** El límite es de 30 altas por hora y por IP;
  antes de abrirlo a desconocidos hay que activar Turnstile.
