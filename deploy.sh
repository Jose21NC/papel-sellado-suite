#!/usr/bin/env bash
# Publica Lexia en Hostinger por SSH: copia solo lo que usa la web (index.html, .htaccess, css, js, img, vendor)
# a la carpeta del dominio. Lo demás que haya en el servidor no se toca (p. ej. .well-known del certificado SSL).
# Uso: ./deploy.sh   — pide la contraseña SSH una sola vez (con una llave SSH no la pide).
set -euo pipefail

SERVIDOR="u681499827@191.101.79.148"
PUERTO=65002
DESTINO="domains/lexia-suite.cloud/public_html"

cd "$(dirname "$0")"
if command -v npm >/dev/null; then npm test --silent; fi

# Una sola conexión para la revisión y la copia: la contraseña se pide una vez.
mkdir -p ~/.ssh
SSH="ssh -p $PUERTO -o ControlMaster=auto -o ControlPath=$HOME/.ssh/lexia-%r@%h-%p -o ControlPersist=60"

if ! $SSH "$SERVIDOR" "test -d $DESTINO"; then
  echo "No existe $DESTINO en el servidor. Revise en hPanel la carpeta del sitio y cambie DESTINO en este archivo."
  exit 1
fi

# --delete solo alcanza a lo incluido: borra en el servidor archivos viejos de css/, js/, img/ y vendor/.
rsync -rlvz --delete -e "$SSH" \
  --include='/index.html' --include='/.htaccess' \
  --include='/css/' --include='/css/**' --include='/js/' --include='/js/**' \
  --include='/img/' --include='/img/**' --include='/vendor/' --include='/vendor/**' \
  --exclude='*' ./ "$SERVIDOR:$DESTINO/"

$SSH -O exit "$SERVIDOR" 2>/dev/null || true
echo "Listo: https://lexia-suite.cloud"
