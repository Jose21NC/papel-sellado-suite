# Guía para agentes (Claude Code, Codex, Gemini, Cursor, etc.)

Lexia (antes «Papel Sellado Suite»): web estática para abogados y notarios de Nicaragua. Suben el papel sellado digital de la DGI (PDF), escriben sobre sus renglones e imprimen con o sin el papel de fondo. Publicada en https://lexia-suite.cloud (Hostinger, desplegada por Git desde `main`; ver `PUBLICAR.md`). Los identificadores internos conservan el nombre anterior (`papel-sellado-suite`: base IndexedDB, bloqueo de pestaña, `app` del respaldo) para no perder datos ni respaldos.

## Reglas del proyecto
- HTML, CSS y JavaScript sin compilación, sin frameworks y sin dependencias. pdf.js 3.11 está incluido en `vendor/` y corre en el hilo principal para que `index.html` funcione también con doble clic (file://). Scripts clásicos, no módulos.
- Interfaz, comentarios y mensajes de commit en español. Comentarios cortos, solo para el porqué.
- El cambio más pequeño que resuelva todo. No agregar opciones ni código "para después".
- **La geometría de impresión es sagrada.** Las páginas miden 612×1008 pt (legal) y el texto debe caer sobre los 30 renglones de la DGI. No tocar sin necesidad: `.page`, `.area`, `.seal`, `.ed` (y sus `p`), `.dash`, `.rule`, `p.firma`, `.f2`, `@page` ni el bloque `@media print` de `css/app.css`.
- HTML de un trabajo: `p` (alineación, `firma`), `b`, `i`, `u`, `br`, `span.f2`, `span.campo`. Todo HTML que se guarde en un trabajo debe estar permitido en `normalize()` (editor), en `sanitize()` si debe sobrevivir al pegar, y en `cleanStored()` (importar respaldo, `js/app.js`).
- Los datos viven en IndexedDB (una base por cuenta) y, si `js/firebase-config.js` está lleno, también en Firebase (`js/cloud.js`, ver `FIREBASE.md`): todo cambio pasa por `DB.put/putMany/del`, que lo anota en la cola `outbox`; escrituras que vienen de la nube usan `local = true`. Sin configuración Lexia funciona sin cuenta. Nunca subir al repo PDFs ni protocolos .docx reales: traen datos personales (`*.pdf`, `*.docx` y `local/` están en `.gitignore`; las pruebas usan documentos sintéticos).

## Mapa del código
| Archivo | Qué hace |
|---|---|
| `index.html` | Vistas (`#view-works`, `#view-papers`, `#view-perfil` con Mis datos y respaldo, `#view-editor`), barra del editor y todos los `<dialog>` |
| `css/app.css` | Estilos con variables en `:root` (claro/oscuro; paleta de Lexia: `--navy` #1B365D y `--sky` #4BB3DB), estética minimalista; reglas de papel e impresión |
| `img/logo.svg` | Logo (favicon); en la página va como `<symbol id="logo">` dentro de `index.html`, con los colores de la paleta |
| `js/parse.js` | Lee del texto del PDF: valor, serie, número, cara y renglones (ajuste por mínimos cuadrados). Puro, con pruebas |
| `js/db.js` | IndexedDB por cuenta (`DB.use(uid)`): `files`, `papers`, `works`, `settings` (`app`, `profile`, `welcome`) y `outbox` (cambios por subir); `DB.onChange` avisa a la nube |
| `js/cloud.js` / `js/firebase-config.js` | Cuenta (correo y contraseña) y Firestore de Firebase por REST, sin SDK ni Storage: los PDF van en trozos (`chunks`) de 750 KB; cola de subida (cada 20 s como máximo, por la cuota gratuita), `pull` al entrar, PDF bajo demanda. Reglas en `firebase/`. Probado con un Firebase falso que intercepta las llamadas REST |
| `js/pdf.js` | Carga y dibuja páginas del PDF (pantalla 2×, impresión 300 ppp); `write()` arma el PDF descargable (una imagen JPEG por página) |
| `js/editor.js` | Un `contenteditable` por cara; el texto fluye entre páginas (`paginate`, `splitOverflow`, `joinSplit`; párrafos partidos con `data-split`/`data-cont`); cursor con marcadores `.mk-s`/`.mk-e`; deshacer por instantáneas; guiones de cierre; firmas; `insertHtml`; `pdfPages` dibuja cada cara en un lienzo para «Descargar PDF»; «Ocultar lo impreso» marca los primeros `work.printedChars` caracteres con `CSS.highlights` (`::highlight(impreso)`) y sus guiones con `.dash.impreso` |
| `js/app.js` | Pantalla de entrada (`login`, `openAccount`), rutas por hash, inventario, trabajos (menú «⋯» `#work-menu` con popover, etiquetas de color), autoguardado, asignación de papel, impresión (`recordPrint` anota `printLog` y `printedChars`; copias sin anotar), protocolo del año (`w.protocolo = año`, `addToProtocol`, importar .docx), respaldo, bloqueo de una sola pestaña |
| `js/words.js` | Números, fechas y horas en letras (pruebas en `test/words.test.js`) |
| `js/profile.js` | «Mis datos» del notario e introducción de primera vez |
| `js/templates-data.js` / `js/templates.js` | 59 plantillas notariales; catálogo, fuentes y revisión en `PLANTILLAS.md`. Un clic en un campo `[ASÍ]` abre `#dlg-campo`: `fieldKind`/`fieldText` (con pruebas) deciden cómo se escribe el dato |
| `js/firmas.js` | Diálogo de bloques de firma |
| `js/docx.js` | Lee un .docx sin dependencias (ZIP con `DecompressionStream`) y pasa sus párrafos al HTML de Lexia (pruebas con `test/fixtures/protocolo-prueba.docx`, sintético) |

## Comandos
```bash
npm test                         # pruebas (node --test)
npm run serve                    # http://localhost:8000
```
No hay paso de compilación: publicar es `git push` a `main` (Hostinger lo despliega si está activada la implementación automática; ver `PUBLICAR.md`). `.htaccess` fuerza HTTPS, evita copias viejas en caché y oculta `.git`.

## Cómo verificar cambios
1. `npm test`.
2. Abrir la app (`npm run serve`) y probar el flujo tocado. Subir un PDF de papel sellado real (pide uno al usuario; no lo copies al repo).
3. Si tocaste el editor o CSS: imprimir a PDF desde Chrome (Tamaño Legal, Márgenes Ninguno, Escala 100 %) en «con papel» y «solo texto» y comprobar que el texto cae sobre los renglones. Sin interfaz: Chrome headless por CDP (`Page.printToPDF` tras `document.body.dataset.print='texto'` y `await Editor.preparePrint('texto')`).
4. La app permite una sola pestaña a la vez (`navigator.locks`): usa un perfil de navegador por prueba.

## Estado y pendientes conocidos
- Sin probar en Safari ni Firefox.
- Firebase: probado contra un Firebase simulado y contra el proyecto real lexia-suite (plan Spark, sin Storage), con una cuenta de prueba que se borra al terminar. Un documento de Firestore admite 1 MB (≈ 300 caras): un protocolo más grande no se sube.
- En el celular la barra del editor se desplaza de lado (a propósito: no cabe en una fila).
- Plantillas: son modelos; la base legal de la frase del quinquenio y los requisitos actuales de Migración para menores no se verificaron.
