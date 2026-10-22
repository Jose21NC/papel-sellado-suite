# Papel Sellado Suite

Suite para abogados y notarios de Nicaragua que trabajan con el **papel sellado digital de la DGI** (testimonio y protocolo).
Sube los PDF, escribe directamente sobre los renglones del papel e imprime con o sin el papel de fondo. Cada trabajo queda guardado con su historial.

## Qué hace

- **Inventario de papel sellado.** Arrastre uno o varios PDF. La suite lee de cada hoja el **tipo** (testimonio / protocolo), el **valor** (C$21, C$14, …), la **serie** y el **número**, y agrupa el inventario por valor. Detecta hojas repetidas. Puede marcar una hoja como **anulada** (inutilizada).
- **Editor sobre el papel.** El texto se escribe encima del papel, línea por línea sobre los 30 renglones de cada cara (frente y reverso). Al llenarse una cara, el texto pasa solo a la siguiente: frente → reverso → siguiente hoja. Junto al escudo del frente, los renglones 1 a 3 se respetan.
- **Formato.** Negrita, cursiva, subrayado, MAYÚSCULAS/minúsculas, alineación (justificado por defecto), tipo y tamaño de letra, sangría, espacio entre letras, márgenes y altura del texto sobre el renglón. Opción de **cerrar los renglones con guiones** para no dejar espacios en blanco.
- **Pegar desde Word.** Al pegar, se conservan la negrita, la cursiva, el subrayado y la alineación. Se quita lo que movería el texto fuera de los renglones (tamaños y fuentes mezclados).
- **Impresión.**
  - *Imprimir con papel:* imprime el papel sellado completo (a 300 ppp) con el texto encima, en papel legal en blanco.
  - *Imprimir solo texto:* imprime únicamente el texto, para papel sellado ya impreso. Si la impresora corre el texto, ajuste el desplazamiento (mm) una sola vez.
- **Trabajos e historial.** Cada trabajo guarda el título, el cliente o las partes, el tipo y el valor del papel, las notas, el estado (borrador / impreso / finalizado), las hojas asignadas, la fecha de creación, la última edición y cada impresión. Puede buscar por título, cliente o **texto**, y duplicar trabajos.
- **Borrador sin papel.** Puede redactar antes de tener el papel: la suite le dice cuántas hojas necesita. Luego use **Asignar papel disponible**.
- **Respaldo.** *Exportar respaldo* descarga un archivo `.json` con todos sus trabajos y PDF. *Importar respaldo* lo restaura en otra computadora.

## Privacidad

Todo se guarda **en su navegador** (IndexedDB). Los documentos no se envían a ningún servidor. Por eso conviene **exportar un respaldo** con frecuencia: si borra los datos del navegador, se pierden.

## Cómo usarla

1. Descargue el proyecto (botón **Code → Download ZIP**) y descomprímalo.
2. Abra `index.html` con **Google Chrome** o **Microsoft Edge** (doble clic). No necesita instalar nada ni tener internet.
3. En **Papel sellado**, suba sus PDF. En **Mis trabajos**, cree un trabajo y escriba o pegue el texto.
4. Para imprimir: en el diálogo de impresión deje **Tamaño: Legal (8.5 × 14 pulg.)**, **Márgenes: Ninguno** y **Escala: 100 %**.

> Use siempre el mismo navegador y la misma carpeta: los datos quedan guardados en ese navegador.

### Atajos

| Acción | Teclas |
|---|---|
| Negrita / Cursiva / Subrayado | Ctrl + B / I / U |
| Deshacer / Rehacer | Ctrl + Z / Ctrl + Shift + Z |
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

Valores del papel sellado vigentes desde el 1 de enero de 2026: **protocolo C$14** y **testimonio C$21** por hoja. Los valores anteriores (C$12 y C$19) también se reconocen. Si una hoja no se reconoce, puede corregir el tipo y el valor con **Editar**.
