// Configuración de Firebase del proyecto lexia-suite (Consola de Firebase › Configuración del proyecto › Tus apps
// › App web; pasos en FIREBASE.md). Vacía, Lexia funciona sin cuenta y guarda todo solo en este navegador.
// La apiKey de una app web no es secreta: el acceso a los datos lo protegen las reglas de firebase/.
// Solo se usan estos dos datos: Lexia habla con Firebase por REST, sin el SDK, y no usa Storage (los PDF van
// en Firestore).
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCtXF2fA3q8d95My3Nf5JbH9n9kPMiSttU',
  projectId: 'lexia-suite',
};
