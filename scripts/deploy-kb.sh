#!/usr/bin/env bash
set -euo pipefail

HOST="${WPFY_DOCS_HOST:-150.136.45.72}"
USER="${WPFY_DOCS_USER:-ubuntu}"
STACK_DIR="${WPFY_DOCS_STACK_DIR:-/opt/stacks/docs}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[1/5] Building KB (npm run docs:build)"
cd "$REPO_ROOT"
npm run docs:build

echo "[2/5] Ensuring stack dir exists on $HOST"
ssh "$USER@$HOST" "sudo mkdir -p $STACK_DIR/dist && sudo chown -R \$USER:\$USER $STACK_DIR"

if ! ssh "$USER@$HOST" "test -f $STACK_DIR/docker-compose.yml"; then
  echo "[3/5] Writing docker-compose.yml (first deploy)"
  ssh "$USER@$HOST" "cat > $STACK_DIR/docker-compose.yml" <<'YAML'
services:
  docs-wpfy:
    image: nginx:alpine
    container_name: docs-wpfy
    restart: unless-stopped
    volumes:
      - ./dist:/usr/share/nginx/html:ro
    networks:
      - proxy
networks:
  proxy:
    external: true
YAML
else
  echo "[3/5] docker-compose.yml already present"
fi

echo "[4/5] rsync dist/ -> $HOST:$STACK_DIR/dist/"
rsync -a --delete "$REPO_ROOT/kb/.vitepress/dist/" "$USER@$HOST:$STACK_DIR/dist/"

echo "[5/5] (Re)starting docs-wpfy container"
ssh "$USER@$HOST" "cd $STACK_DIR && docker compose up -d --force-recreate"

echo "Done. Ensure a Caddy block for docs.wpfy.org reverse_proxies docs-wpfy:80."
echo "Verify: curl -sI https://docs.wpfy.org/  (once DNS + Caddy are set)"
