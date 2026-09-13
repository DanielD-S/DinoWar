// DinoWar — a qué servidor habla la capa cooperativa.
//
// La clave publicable NO es un secreto: va en el navegador por diseño y su
// seguridad la dan las políticas de la base de datos, no el ocultarla. Por eso
// está aquí y no en una variable de entorno que este juego, sin build step, no
// tendría cómo leer.
//
// Sin estos datos el juego arranca igual: la Cuenca cae a su modo local, con
// compañeros simulados, y todo lo demás funciona como siempre.

export const CONFIG = Object.freeze({
  supabase: Object.freeze({
    url: 'https://wufgtujktbcnwrvngsiy.supabase.co',
    clave: 'sb_publishable_AxyMdlgjg3JqZBSqW0N8SA_wA9CdHWN',
    // El nombre de la Edge Function que valida los asaltos.
    funcionAsalto: 'asalto',
  }),

  // El CAPTCHA de la puerta (ver src/ui/captcha.js). La clave de sitio es
  // pública, como la de Supabase: identifica el widget, no lo protege. La
  // secreta NO está en ningún fichero: vive sólo en el panel de Supabase, que
  // es quien verifica el token. Sin clave de sitio no se pinta widget alguno.
  turnstile: Object.freeze({
    siteKey: '0x4AAAAAAEzGYnx8JmT4C1Z1',
  }),
});
