# ==============================================================================
# 1. Dependencies Stage: Instala todas as dependências
# ==============================================================================
FROM node:22.19.0-alpine AS deps

RUN apk add --no-cache bash
WORKDIR /usr/src/app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# ==============================================================================
# 2. Builder Stage: Compila o código-fonte
# ==============================================================================
FROM node:22.19.0-alpine AS builder

WORKDIR /usr/src/app

COPY . .
COPY --from=deps /usr/src/app/node_modules ./node_modules

RUN yarn build

# ==============================================================================
# 3. Production Dependencies Stage: Instala todas as dependências (incluindo dev)
# ==============================================================================
FROM node:22.19.0-alpine AS prod-deps

WORKDIR /usr/src/app

COPY package.json yarn.lock ./
# Remove --production para incluir devDependencies necessárias para migrations
RUN yarn install --frozen-lockfile

# ==============================================================================
# 4. Production Stage: Cria a imagem final, leve e pronta para rodar
# ==============================================================================
FROM node:22.19.0-alpine AS production

# Instala netcat para verificação de conexão e bash
RUN apk add --no-cache bash netcat-openbsd curl

WORKDIR /usr/src/app

# Copia os artefatos dos estágios anteriores
# Usa node_modules do builder (que tem todas as dependências)
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./package.json

# Copia migrations e seeds (necessários para produção)
COPY --from=builder /usr/src/app/src/infra/database ./src/infra/database

# Cria o script de entrypoint otimizado
COPY <<'EOF' /usr/src/app/docker-entrypoint.sh
#!/bin/bash
set -e

echo "=========================================="
echo "🚀 Starting Application"
echo "Environment: ${NODE_ENV:-development}"
echo "=========================================="

# SSL do PostgreSQL apenas quando explicitamente habilitado.
#
# Por que condicional: quando DATABASE_SSL_ENABLED != 'true', o código passa
# `ssl: undefined` ao driver `pg` (ver data-source.ts e typeorm-config.service.ts),
# e nesse caso o `pg` cai no PGSSLMODE do ambiente. Com `require` fixo, a conexão
# e as migrations falham contra o Postgres local do compose, que não tem SSL.
# Em produção (Render) DATABASE_SSL_ENABLED=true, então o comportamento anterior
# é preservado.
if [ "${DATABASE_SSL_ENABLED}" = "true" ]; then
  export PGSSLMODE=require
  echo "🔒 SSL: PGSSLMODE=require"
else
  echo "🔓 SSL: desabilitado (DATABASE_SSL_ENABLED=${DATABASE_SSL_ENABLED:-unset})"
fi

# Função para aguardar o banco de dados
wait_for_database() {
  echo "🔍 Waiting for database..."
  echo "   Host: ${DATABASE_HOST}"
  echo "   Port: ${DATABASE_PORT}"
  
  local max_attempts=30
  local attempt=0
  
  until nc -z "${DATABASE_HOST}" "${DATABASE_PORT}" 2>/dev/null; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
      echo "❌ Failed to connect to database after ${max_attempts} attempts"
      echo "   DATABASE_HOST=${DATABASE_HOST}"
      echo "   DATABASE_PORT=${DATABASE_PORT}"
      exit 1
    fi
    echo "⏳ Attempt ${attempt}/${max_attempts}: Waiting for database..."
    sleep 2
  done
  
  echo "✅ Database connection established!"
}

# Aguarda banco de dados
wait_for_database

# Executa migrations
echo ""
echo "🔄 Running migrations..."

if node ./node_modules/typeorm/cli.js migration:run -d dist/infra/database/data-source.js; then
  echo "✅ Migrations completed!"
else
  echo "❌ Migrations failed!"
  exit 1
fi

echo ""
echo "=========================================="
echo "🚀 Starting server on port ${APP_PORT}..."
echo "=========================================="

exec node dist/main.js
EOF

# Garante que os scripts sejam executáveis
RUN chmod +x /usr/src/app/docker-entrypoint.sh && \
    sed -i 's/\r//g' /usr/src/app/docker-entrypoint.sh

# Cria usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/src/app

USER nodejs

# Expõe a porta configurada
EXPOSE 10000

# Healthcheck usando a porta correta e endpoint /health
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${APP_PORT:-10000}/health || exit 1

ENTRYPOINT ["/usr/src/app/docker-entrypoint.sh"]