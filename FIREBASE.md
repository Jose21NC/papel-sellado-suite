# Cuentas y nube con Firebase

Lexia usa el proyecto de Firebase **lexia-suite** (ya configurado en `js/firebase-config.js`). Con Firebase configurado, Lexia pide **entrar o crear una cuenta** la primera vez, y guarda en la cuenta los trabajos, el protocolo, «Mis datos», el inventario de papel sellado y sus PDF. Así se pueden abrir en cualquier computadora.

Sin configurar (`js/firebase-config.js` vacío), Lexia funciona como siempre: sin cuenta y solo en el navegador.

## Cómo funciona

- Lexia usa las APIs REST de Firebase directamente, sin el SDK ni otras dependencias:
  - Authentication: correo y contraseña.
  - Firestore: un documento por trabajo, hoja de papel y ajuste, en `users/{uid}/…`.
  - Los PDF también van en Firestore, en trozos de 750 KB (`users/{uid}/chunks/{archivo}-{n}`). No se usa Storage, que exige el plan de pago.
- El navegador guarda una copia por cuenta (IndexedDB), así que se puede trabajar sin internet.
  - Cada cambio entra en una cola y se sube en segundo plano: como máximo cada 20 segundos mientras se escribe, y al salir de la pestaña. Si no hay conexión, se reintenta solo.
  - En **Perfil › Cuenta** se ve si queda algo por subir.
- Al entrar, se sube lo pendiente y se trae lo de la cuenta. Si un mismo trabajo se edita en dos computadoras a la vez, queda la última versión guardada.
- Los PDF se bajan a cada computadora la primera vez que se usan.
- **Cerrar sesión** borra la copia de ese navegador; los datos siguen en la cuenta.
- La primera vez que se entra, si el navegador tenía datos guardados sin cuenta, Lexia ofrece pasarlos a la cuenta.
- Límites del plan gratuito (Spark), para todo el proyecto:
  - 1 GiB guardado, unos 2000 PDF de papel sellado de 500 KB más los trabajos.
  - 50 000 lecturas y 20 000 escrituras al día. Al entrar, cada trabajo y cada hoja cuentan como una lectura.
  - Si muchos abogados usan Lexia a diario, el plan Blaze cuesta centavos por encima de esas cuotas.
- Un documento de Firestore admite hasta 1 MB, unas 300 caras de texto. Un trabajo o protocolo más grande no se sube: queda pendiente y se avisa en Perfil.

## Crear el proyecto (una sola vez)

1. Entre a https://console.firebase.google.com y cree un proyecto. Google Analytics no hace falta.
2. **Authentication › Comenzar › Correo electrónico/contraseña:** actívelo.
3. **Firestore Database › Crear base de datos:** modo de producción, en la región más cercana (p. ej. `us-central1`). Luego, en **Reglas**, pegue `firebase/firestore.rules` y publique. **Cada vez que cambie ese archivo, vuelva a pegarlo y publicarlo.**
4. Storage no hace falta.
5. **Configuración del proyecto › Tus apps › Web (`</>`):** registre la app y copie `apiKey` y `projectId` en `js/firebase-config.js`. (Hecho para lexia-suite.)
6. **Authentication › Configuración › Dominios autorizados:** agregue `lexia-suite.cloud` y `www.lexia-suite.cloud` (y `localhost` para probar).

La `apiKey` de una app web no es secreta: quien protege los datos son las reglas. Para que nadie use la clave desde otros sitios, en Google Cloud › APIs y servicios › Credenciales se puede restringir a los referentes `https://lexia-suite.cloud/*`, `https://www.lexia-suite.cloud/*` y `http://localhost:8000/*`.

Si se abre `index.html` con doble clic (`file://`), el navegador puede bloquear las llamadas a Firebase. Para usar la cuenta, abra Lexia en línea o con `npm run serve`.

## Muro de pago

Cada cuenta nueva debe activar Lexia una sola vez, con uno de estos dos caminos:

- **Pago de C$ 800 en Poket.** El enlace está en `index.html` (`#pay-link`). El abogado paga, escribe el número de comprobante y entra de inmediato.
- **Cupón.** `BOREALABS` exenta del 100 %.

Las cuentas creadas antes del 23 de octubre de 2026 a las 01:00 UTC no pagan («cuenta fundadora», `MURO_DESDE` en `js/app.js`).

La activación crea el documento `licencias/{uid}` con `estado: "activa"`, `via` (`pago` o `cupon`), `comprobante` o `cupon`, `email` y `fecha`. Las reglas solo dejan **crearlo una vez**, con un cupón válido o con un comprobante de 4 a 40 letras, números o guiones. Nadie puede cambiarlo ni borrarlo, salvo usted desde la consola.

**Revisar los pagos:**

1. En **Firestore Database › Datos › licencias** verá una licencia por cuenta, con su correo y su comprobante.
2. Compare con los cobros en su panel de Poket.
3. Si un comprobante no aparece en Poket, cambie `estado` a `desactivada`. La próxima vez que esa cuenta abra Lexia verá un aviso y no podrá entrar.
4. Para reactivarla, vuelva a poner `estado` en `activa`.

**Dar acceso gratis a alguien:** cree a mano el documento `licencias/{uid}` con `estado: "activa"` y `via: "manual"`. El `uid` está en **Authentication › Usuarios**.

**Agregar o quitar cupones:** cámbielos en dos lugares, `CUPONES` en `js/app.js` y la lista `['BOREALABS']` en `firebase/firestore.rules`. Luego vuelva a publicar las reglas.

**Límite:** el muro lo hace cumplir la aplicación en el navegador y las reglas protegen la licencia. Pero una persona con conocimientos técnicos que modifique el código en su navegador podría saltarse la pantalla, como en cualquier web sin servidor propio. Para impedirlo del todo haría falta un servidor (p. ej. Cloud Functions, que exige el plan Blaze) que confirme el pago con Poket.
