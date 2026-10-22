# Guía para agentes (Claude Code, Codex, Gemini, Cursor, etc.)

Papel Sellado Suite: web estática para abogados y notarios de Nicaragua. Suben el papel sellado digital de la DGI (PDF), escriben sobre sus renglones e imprimen con o sin el papel de fondo. Publicada en GitHub Pages desde `main`: https://jose21nc.github.io/papel-sellado-suite/

## Reglas del proyecto
- HTML, CSS y JavaScript sin compilación, sin frameworks y sin dependencias. pdf.js 3.11 está incluido en `vendor/` y corre en el hilo principal para que `index.html` funcione también con doble clic (file://). Scripts clásicos, no módulos.
- Interfaz, comentarios y mensajes de commit en español. Comentarios cortos, solo para el porqué.
- El cambio más pequeño que resuelva todo. No agregar opciones ni código "para después".
- **La geometría de impresión es sagrada.** Las páginas miden 612×1008 pt (legal) y el texto debe caer sobre los 30 renglones de la DGI. No tocar sin necesidad: `.page`, `.area`, `.seal`, `.ed` (y sus `p`), `.dash`, `.rule`, `p.firma`, `.f2`, `@page` ni el bloque `@media print` de `css/app.css`.
- Todo HTML que se guarde en un trabajo debe estar permitido en `normalize()` (editor), en `sanitize()` si debe sobrevivir al pegar, y en `cleanStored()` (importar respaldo, `js/app.js`).
- Los datos viven solo en el navegador (IndexedDB). Nunca subir al repo PDFs reales de papel sellado: traen datos personales (`*.pdf` y `local/` están en `.gitignore`).

## Mapa del código
| Archivo | Qué hace |
|---|---|
| `index.html` | Vistas (`#view-works`, `#view-papers`, `#view-editor`), barra del editor y todos los `<dialog>` |
| `css/app.css` | Estilos con variables en `:root` (claro/oscuro), estética minimalista tipo Apple; reglas de papel e impresión |
| `js/parse.js` | Lee del texto del PDF: valor, serie, número, cara y renglones (ajuste por mínimos cuadrados). Puro, con pruebas |
| `js/db.js` | IndexedDB: `files`, `papers`, `works`, `settings` (`app`, `profile`, `welcome`) |
| `js/pdf.js` | Carga y dibuja páginas del PDF (pantalla 2×, impresión 300 ppp) |
| `js/editor.js` | Un `contenteditable` por cara; el texto fluye entre páginas (`paginate`, `splitOverflow`, `joinSplit`; párrafos partidos con `data-split`/`data-cont`); cursor con marcadores `.mk-s`/`.mk-e`; deshacer por instantáneas; guiones de cierre; firmas; `insertHtml` |
| `js/app.js` | Rutas por hash, inventario, trabajos, autoguardado, asignación de papel, impresión, respaldo, bloqueo de una sola pestaña |
| `js/words.js` | Números, fechas y horas en letras (pruebas en `test/words.test.js`) |
| `js/profile.js` | «Mis datos» del notario e introducción de primera vez |
| `js/templates-data.js` / `js/templates.js` | 59 plantillas notariales; catálogo, fuentes y revisión en `PLANTILLAS.md` |
| `js/firmas.js` | Diálogo de bloques de firma |

## Comandos
```bash
npm test                         # pruebas (node --test)
npm run serve                    # http://localhost:8000
```
No hay paso de compilación: publicar es `git push` a `main` (GitHub Pages tarda unos minutos).

## Cómo verificar cambios
1. `npm test`.
2. Abrir la app (`npm run serve`) y probar el flujo tocado. Subir un PDF de papel sellado real (pide uno al usuario; no lo copies al repo).
3. Si tocaste el editor o CSS: imprimir a PDF desde Chrome (Tamaño Legal, Márgenes Ninguno, Escala 100 %) en «con papel» y «solo texto» y comprobar que el texto cae sobre los renglones. Sin interfaz: Chrome headless por CDP (`Page.printToPDF` tras `document.body.dataset.print='texto'` y `await Editor.preparePrint('texto')`).
4. La app permite una sola pestaña a la vez (`navigator.locks`): usa un perfil de navegador por prueba.

## Estado y pendientes conocidos
- Sin probar en Safari ni Firefox.
- En el celular la barra del editor se desplaza de lado (a propósito: no cabe en una fila).
- Plantillas: son modelos; la base legal de la frase del quinquenio y los requisitos actuales de Migración para menores no se verificaron.
