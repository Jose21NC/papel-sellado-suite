# Cuentas y nube con Firebase

Lexia usa el proyecto de Firebase **lexia-suite** (ya configurado en `js/firebase-config.js`). Con Firebase configurado, Lexia pide **entrar o crear una cuenta** la primera vez, y guarda en la cuenta los trabajos, el protocolo, «Mis datos», el inventario de papel sellado y sus PDF. Así se pueden abrir en cualquier computadora.

Sin configurar (`js/firebase-config.js` vacío), Lexia funciona como siempre: sin cuenta y solo en el navegador.

## Cómo funciona

- Lexia usa las APIs REST de Firebase directamente, sin el SDK ni otras dependencias:
  - Authentication: correo y contraseña.
  - Firestore: un documento por trabajo, hoja de papel y ajuste, en `users/{uid}/…`.
  - Storage: los PDF, en `users/{uid}/files/{id}.pdf`.
- El navegador guarda una copia por cuenta (IndexedDB), así que se puede trabajar sin internet.
  - Cada cambio entra en una cola y se sube en segundo plano. Si no hay conexión, se reintenta solo.
  - En **Perfil › Cuenta** se ve si queda algo por subir.
- Al entrar, se sube lo pendiente y se trae lo de la cuenta. Si un mismo trabajo se edita en dos computadoras a la vez, queda la última versión guardada.
- Los PDF se bajan a cada computadora la primera vez que se usan.
- **Cerrar sesión** borra la copia de ese navegador; los datos siguen en la cuenta.
- La primera vez que se entra, si el navegador tenía datos guardados sin cuenta, Lexia ofrece pasarlos a la cuenta.
- Límite: un documento de Firestore admite hasta 1 MB, unas 300 caras de texto. Un trabajo o protocolo más grande no se sube; queda pendiente y se avisa en Perfil.

## Crear el proyecto (una sola vez)

1. Entre a https://console.firebase.google.com y cree un proyecto. Google Analytics no hace falta.
2. **Authentication › Comenzar › Correo electrónico/contraseña:** actívelo.
3. **Firestore Database › Crear base de datos:** modo de producción, en la región más cercana (p. ej. `us-central1`). Luego, en **Reglas**, pegue `firebase/firestore.rules` y publique.
4. **Storage › Comenzar.** Storage exige el plan **Blaze** (pago por uso). El uso de una notaría suele quedar dentro de la cuota gratuita, pero conviene poner una alerta de presupuesto en Google Cloud. En **Reglas**, pegue `firebase/storage.rules` y publique.
5. **Configuración del proyecto › Tus apps › Web (`</>`):** registre la app y copie `apiKey`, `projectId` y `storageBucket` en `js/firebase-config.js`. (Hecho para lexia-suite.)
6. **Authentication › Configuración › Dominios autorizados:** agregue `lexia-suite.cloud` y `www.lexia-suite.cloud` (y `localhost` para probar).

La `apiKey` de una app web no es secreta: quien protege los datos son las reglas. Para que nadie use la clave desde otros sitios, en Google Cloud › APIs y servicios › Credenciales se puede restringir a los referentes `https://lexia-suite.cloud/*`, `https://www.lexia-suite.cloud/*` y `http://localhost:8000/*`.

Si se abre `index.html` con doble clic (`file://`), el navegador puede bloquear las llamadas a Firebase. Para usar la cuenta, abra Lexia en línea o con `npm run serve`.
