# Plantillas notariales

59 modelos en 11 categorías (`js/templates-data.js`). Son **modelos de referencia**: el notario debe revisarlos y adaptarlos a cada caso antes de usarlos.

## Cómo funcionan
- **Campos automáticos `{ASÍ}`**: se llenan con «Mis datos» y la fecha. Incluyen número de escritura en letras y cifras, ciudad, hora y fecha en letras, nombre, título, domicilio, cédula y carné del notario, quinquenio y protocolo. Los datos del notario solo se llenan si el perfil dice «es notario: sí».
- **Campos manuales `[ASÍ]`**: quedan resaltados en amarillo, solo en pantalla. Un clic los selecciona y se escribe encima.
- Un párrafo que empieza con `^` va centrado. Solo se permiten `<b>`, `<i>` y `<u>`.
- Partes compartidas en el mismo archivo: introducción, fe de identificación y capacidad, conclusión (`INSTR`, `FIN1`, `FIN2`), renuncias (`REN`), datos de vehículo (`VEHICULO`) y comparecencia de tres partes (`TRES`).

## Catálogo
- **Poderes (8):** generalísimo, general de administración, especial, general judicial, verbal (laboral y de menor cuantía), especial para trámites administrativos, revocación, sustitución.
- **Inmuebles (14):** compraventa, promesa de venta, donación, permuta, desmembración y compraventa de lote, constitución y cancelación de hipoteca, cesión de crédito hipotecario, usufructo, servidumbre de paso, arrendamiento, nuda propiedad con reserva de usufructo, cesación de comunidad, cesión de derechos posesorios.
- **Muebles y vehículos (4):** compraventa de vehículo, carta de venta con firmas autenticadas, compraventa de bien mueble, declaración jurada y venta de arma de fuego.
- **Obligaciones (5):** mutuo, mutuo con garantía mobiliaria (prenda) y fianza solidaria, reconocimiento de deuda, fianza, carta de pago y finiquito.
- **Familia (5):** declaración y disolución de unión de hecho estable, autorización de salida del país de menor, capitulaciones matrimoniales, reconocimiento de hijo.
- **Sociedades (3):** constitución de sociedad anónima y estatutos, acta de junta general extraordinaria, certificación notarial de acta.
- **Declaraciones y actas (8):** declaración notarial, declaración jurada, acta de notoriedad, identificación notarial con prueba testifical (cambio de nombre), corrección de error en partida de nacimiento, acta de presencia, razón de cotejo de fotocopia, autenticación de firma.
- **Sucesiones (4):** testamento abierto, testamento cerrado, aceptación de herencia, cesión de derechos hereditarios.
- **Protocolo (2):** acta de apertura y acta de cierre de protocolo.
- **Testimonio (1):** cierre «Pasó ante mí».
- **Cláusulas comunes (5):** comparecencia en representación de sociedad, comparecencia por apoderado, firma a ruego, intervención de intérprete, advertencias y cierre.

## Fuentes y revisión
1. **Primera versión (44 modelos):** redactada con los textos oficiales de la Ley del Notariado (Arts. 15, 16, 18, 21–31, 38, 41 y 70), la Ley 139 (Arto. 6: testigos instrumentales solo en el testamento), la Ley 1113 de 2022 (advertencia de inscripción registral y beneficiario final), el Código Civil (4ª edición oficial, 2019) y el Código de Familia (Ley 870, Arts. 83, 84 y 106).
2. **Revisión con el *Manual del Notario nicaragüense* (octubre de 2026):** cuatro revisores, uno por grupo de categorías, compararon cada modelo con el manual. Un verificador por grupo rechazó todo lo que contradecía la ley vigente o el manual. Resultado: **25 modelos corregidos y 15 nuevos**. Entre los cambios:
   - La conclusión de todas las escrituras dice ahora «…y de las que en concreto se han hecho», como en los modelos 4 y 22 del manual.
   - Las facultades especiales del poder generalísimo, del de administración y del judicial van en lista, según los modelos 18, 20 y 21.
   - La revocación de poder cita el protocolo del notario autorizante y deja el poder «sin ningún valor ni efecto legal».
   - El cierre de testimonio pone las firmas de la matriz antes de «PASÓ ANTE MÍ», según el modelo 5.
   - Las compraventas y servidumbres dicen quién habla en cada cláusula y tienen cláusula de aceptación. En vehículos se usa «evicción y saneamiento en los casos de ley», y los datos piden combustible, uso, servicio y cilindros.
   - En el mutuo y el reconocimiento de deuda se agregó el interés moratorio, las renuncias son opcionales y el acreedor acepta. En la fianza se corrigió «lo que el Deudor no pague».
   - En el testamento abierto se quitó la doble lectura y firma el notario. La autorización de salida de menor tiene comparecencia de ambos padres.
   - Se conservaron las advertencias de la Ley 1113 y las referencias al Código de Familia.
3. **Pruebas:** `test/templates.test.js` comprueba que cada modelo se arma sin `{…}` sueltos, con ids únicos y solo con etiquetas permitidas.

## Sin verificar
- La base legal exacta de la frase del quinquenio, que sigue la práctica habitual.
- Los requisitos actuales de Migración para la salida de menores; la plantilla pide confirmarlos.
- No se encontró una «Ley 1145».
- Los nombres de registros y catastro quedan como campos a llenar, y no se incluyen detalles fiscales.
