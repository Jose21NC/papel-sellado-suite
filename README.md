# Papel Sellado Suite

Suite para abogados y notarios de Nicaragua que trabajan con el **papel sellado digital de la DGI** (testimonio y protocolo).
Sube los PDF, escribe directamente sobre los renglones del papel e imprime con o sin el papel de fondo. Cada trabajo queda guardado con su historial.

**Úsela en línea:** https://jose21nc.github.io/papel-sellado-suite/

## Qué hace

- **Inventario de papel sellado.** Arrastre uno o varios PDF. La suite lee de cada hoja el **tipo** (testimonio / protocolo), el **valor** (C$21, C$14, …), la **serie** y el **número**, y agrupa el inventario por valor. Detecta hojas repetidas. Puede marcar una hoja como **anulada** (inutilizada).
- **Editor sobre el papel.** El texto se escribe encima del papel, línea por línea sobre los 30 renglones de cada cara (frente y reverso). Al llenarse una cara, el texto pasa solo a la siguiente: frente → reverso → siguiente hoja. Junto al escudo y al código de barras del frente, los renglones 1 a 3 empiezan más a la derecha (en pantalla se ve esa zona rayada; no se imprime).
- **Formato.** Negrita, cursiva, subrayado, MAYÚSCULAS/minúsculas, alineación (justificado por defecto), tipo y tamaño de letra, sangría, espacio entre letras, márgenes y altura del texto sobre el renglón. Opción de **cerrar los renglones con guiones** para no dejar espacios en blanco.
- **Pegar desde Word.** Al pegar, se conservan la negrita, la cursiva, el subrayado y la alineación. Se quita lo que movería el texto fuera de los renglones (tamaños y fuentes mezclados).
- **Impresión.**
  - *Imprimir con papel:* imprime el papel sellado completo (a 300 ppp) con el texto encima, en papel legal en blanco.
  - *Imprimir solo texto:* imprime únicamente el texto, para papel sellado ya impreso. Si la impresora corre el texto, ajuste el desplazamiento (mm) una sola vez.
- **Trabajos e historial.** Cada trabajo guarda el título, el cliente o las partes, el tipo y el valor del papel, las notas, el estado (borrador / impreso / finalizado), las hojas asignadas, la fecha de creación, la última edición y cada impresión. Puede buscar por título, cliente o **texto**, y duplicar trabajos.
- **Mis datos.** Guarde una vez su nombre, título, cédula, carné de la CSJ, domicilio, vencimiento del quinquenio, protocolo y ciudad: se usan para llenar las plantillas. La primera vez, una breve introducción le ofrece guardarlos (puede verla de nuevo desde **Mis datos**).
- **Plantillas.** 59 modelos de escrituras, actas, protocolo, cláusulas y cierre de testimonio, revisados con el *Manual del Notario nicaragüense*, por categoría y con buscador (lista completa y fuentes en [PLANTILLAS.md](PLANTILLAS.md)). Se insertan con sus datos, el número de escritura y la hora y la fecha en letras; lo demás queda como campos resaltados en amarillo (`[NOMBRE DEL VENDEDOR]`) que se reemplazan con un clic. Son **modelos de referencia**: revíselos y adáptelos.
- **Firmas.** Inserta renglones en blanco para firmar (sin guiones), el nombre y la calidad, hasta dos firmas por renglón, y su propia firma de notario. El bloque no se parte entre páginas.
- **Borrador sin papel.** Puede redactar antes de tener el papel: la suite le dice cuántas hojas necesita. Luego use **Asignar papel disponible**.
- **Respaldo.** *Exportar respaldo* descarga un archivo `.json` con todos sus trabajos, PDF y «Mis datos». *Importar respaldo* lo restaura en otra computadora.

## Privacidad

Todo se guarda **en su navegador** (IndexedDB). Los documentos no se envían a ningún servidor. Por eso conviene **exportar un respaldo** con frecuencia: si borra los datos del navegador, se pierden.

## Cómo usarla

1. Entre a **https://jose21nc.github.io/papel-sellado-suite/** con **Google Chrome** o **Microsoft Edge**.
   Sin internet: descargue el proyecto (**Code → Download ZIP**), descomprímalo y abra `index.html` con doble clic. Los datos de la versión en línea y los de la descargada se guardan por separado.
2. En **Papel sellado**, suba sus PDF. En **Mis trabajos**, cree un trabajo y escriba o pegue el texto.
3. Para imprimir: en el diálogo de impresión deje **Tamaño: Legal (8.5 × 14 pulg.)**, **Márgenes: Ninguno** y **Escala: 100 %**.

> Use siempre el mismo navegador y la misma carpeta: los datos quedan guardados en ese navegador. Abra la suite en una sola pestaña a la vez.

Después de imprimir, la suite pregunta si el documento salió bien y solo entonces lo anota en el historial. Las hojas de un trabajo ya impreso se consideran gastadas: si las quita del trabajo, quedan **anuladas** en el inventario.

### Atajos

| Acción | Teclas |
|---|---|
| Negrita / Cursiva / Subrayado | Ctrl + B / I / U |
| Deshacer / Rehacer | Ctrl + Z / Ctrl + Shift + Z |
| Seleccionar todo el documento (para copiarlo a Word o a un correo) | Ctrl + A, luego Ctrl + C |
| Imprimir (con papel si hay papel asignado; si no, solo texto) | Ctrl + P |
| Acercar / alejar la vista | Ctrl + / Ctrl − (zoom del navegador) |

## Desarrollo

Es HTML, CSS y JavaScript sin compilación ni dependencias. pdf.js 3.11 viene incluido en `vendor/`.

```bash
node --test test/*.test.js
```

- `js/parse.js`: lee el valor, la serie, el número y los renglones del texto del PDF (con pruebas).
- `js/editor.js`: editor por cara, flujo del texto entre páginas, deshacer, pegado e impresión.
- `js/app.js`: inventario, trabajos, asignación de papel, respaldo.
- `js/db.js`: almacenamiento en IndexedDB.
- `js/words.js`: números, fechas y horas en letras (con pruebas).
- `js/profile.js`: Mis datos e introducción. `js/templates-data.js` y `js/templates.js`: plantillas (con pruebas). `js/firmas.js`: bloques de firmas.

Valores del papel sellado vigentes desde el 1 de enero de 2026: **protocolo C$14** y **testimonio C$21** por hoja. Los valores anteriores (C$12 y C$19) también se reconocen. Si una hoja no se reconoce, puede corregir el tipo y el valor con **Editar**.
