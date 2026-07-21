#!/bin/bash
set -e

COMPOSE_FILE="docker-compose.prod-local.yaml"

echo "🚀 Iniciando simulação do deploy do Render..."

# 1. Limpar ambiente anterior e construir a imagem (como o Render faria)
echo "🏗️  Construindo a imagem Docker de produção..."
docker compose -f $COMPOSE_FILE down --remove-orphans
docker compose -f $COMPOSE_FILE build --no-cache api

# 2. Iniciar o banco de dados e aguardar ficar pronto
echo "📦 Iniciando serviços de dependência (Postgres)..."
docker compose -f $COMPOSE_FILE up -d postgres

# 3. Simular os Jobs de pré-deploy (executando os comandos dentro de um container temporário)
echo "🏃 Executando Job: run-migrations..."
docker compose -f $COMPOSE_FILE run --rm api yarn run migration:run

echo "🏃 Executando Job: run-seeds..."
docker compose -f $COMPOSE_FILE run --rm api sh -c 'if [ "$RUN_SEED" = "true" ]; then yarn run seed:run:relational; else echo "Skipping seeds: RUN_SEED is not true."; fi'

echo "✅ Jobs de pré-deploy concluídos com sucesso!"

# 4. Iniciar o serviço web principal
echo "🚀 Iniciando serviço web principal (API)..."
docker compose -f $COMPOSE_FILE up -d api

echo "🎉 Simulação concluída! A API está rodando em http://localhost:3000"
echo "   Para parar os serviços, rode: docker compose -f $COMPOSE_FILE down"