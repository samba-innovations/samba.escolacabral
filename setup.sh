#!/bin/bash
set -e

echo "=== samba system setup ==="

git submodule update --init --recursive

if [ ! -f .env ]; then
  cp .env.example .env
  echo "ATENÇÃO: .env criado — edite os valores e rode novamente."
  exit 1
fi

docker compose up -d --build
echo "=== Sistema iniciado ==="
docker compose ps
