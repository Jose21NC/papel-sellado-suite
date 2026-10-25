# Publicar Lexia en lexia-suite.cloud (Hostinger)

Lexia es una web estática: se publican los archivos tal cual, sin compilar. El dominio está en una cuenta de Hostinger y el hosting en otra. En hPanel, los nombres de los menús pueden variar un poco.

## 1. Hosting (cuenta donde está el plan de hosting)

1. **Sitios web › Agregar sitio web:** elija usar un dominio que ya tiene y escriba `lexia-suite.cloud`.
2. Anote lo que hPanel pide para apuntar el dominio. Por lo general son los nameservers de Hostinger (`ns1.dns-parking.com` y `ns2.dns-parking.com`) o la IP del hosting.

## 2. Dominio (cuenta donde se compró lexia-suite.cloud)

Use una de las dos formas:

- **Nameservers (recomendado):** en **Dominios › lexia-suite.cloud › DNS / Nameservers › Cambiar nameservers**, ponga los del paso 1. Así el DNS se administra desde la cuenta del hosting.
- **Registros DNS:** deje los nameservers y cree un registro `A` para `@` con la IP del hosting, y un `CNAME` para `www` que apunte a `lexia-suite.cloud`.

El cambio puede tardar unas horas en verse (hasta 24 h).

## 3. Certificado SSL

Cuando el dominio ya apunte al hosting, active el certificado SSL gratuito en **Seguridad › SSL** (cuenta del hosting). El archivo `.htaccess` del proyecto ya manda todas las visitas a `https://`.

## 4. Subir la app

**Por SSH desde su computadora (recomendado):** en la carpeta del proyecto, en la Terminal:

```bash
./deploy.sh
```

1. El script corre las pruebas.
2. Pide la contraseña SSH de Hostinger una sola vez.
3. Copia a `domains/lexia-suite.cloud/public_html` solo lo que usa la web: `index.html`, `.htaccess`, `css/`, `js/`, `img/` y `vendor/`.

No toca nada más del servidor, como el certificado SSL o el `default.php` de Hostinger. Para publicar un cambio, vuelva a correrlo.

- Los datos de conexión (servidor y puerto) están arriba de `deploy.sh`. La contraseña nunca va en el proyecto.
- Para no escribirla cada vez, agregue su llave SSH en hPanel › Avanzado › Acceso SSH (`ssh-keygen -t ed25519` y copie el contenido de `~/.ssh/id_ed25519.pub`).
- Si `deploy.sh` dice que no existe la carpeta, revise en hPanel cuál es la carpeta del sitio y cambie `DESTINO`.

**Con Git (cada `git push` a `main` se publica solo):**

1. En **Sitios web › lexia-suite.cloud › Avanzado › Git**, ponga el repositorio `https://github.com/Jose21NC/papel-sellado-suite.git`, la rama `main` y el directorio vacío (`public_html`). La carpeta debe estar vacía: borre el `index` de ejemplo que pone Hostinger.
2. Si el repositorio es privado: en esa misma pantalla genere la clave SSH, agréguela en GitHub (**Settings › Deploy keys**, solo lectura) y use `git@github.com:Jose21NC/papel-sellado-suite.git`.
3. Active **Implementación automática**, copie la URL del webhook y agréguela en GitHub (**Settings › Webhooks**, tipo `application/json`, evento *push*).

Con Git llegan al servidor también la documentación y las pruebas. `.htaccess` no las sirve (responde 404).

## 5. Firebase

Siga [FIREBASE.md](FIREBASE.md). Para el dominio:

- En **Authentication › Configuración › Dominios autorizados**, agregue `lexia-suite.cloud` y `www.lexia-suite.cloud`.
- Restrinja la clave a esos sitios.

## 6. Probar

Abra https://lexia-suite.cloud, cree una cuenta, suba un PDF de papel sellado y escriba algo. Luego entre con la misma cuenta desde otra computadora o navegador: debe ver lo mismo.
