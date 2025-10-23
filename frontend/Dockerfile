## Dockerfile de produção para app React (Vite)
## - Multi-stage: build -> runtime
## - Compatível com docker-compose (porta 4173)
## - Evita conflito com bind mount de /app copiando o build para /srv/app

# Etapa de build
FROM node:20-alpine AS builder
WORKDIR /app

# Copia apenas manifests para aproveitar cache de dependências
COPY package*.json ./

# Instala dependências (usa npm ci se existir lock, senão npm install)
RUN if [ -f package-lock.json ]; then \
			npm ci --no-audit --no-fund; \
		else \
			npm install --no-audit --no-fund; \
		fi

# Copia o restante do código e gera o build
COPY . .
RUN npm run build

# Etapa de runtime (servidor estático leve)
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /srv/app

# Usa servidor estático para servir "dist" na porta 4173
RUN npm i -g serve@14.2.2

# Copia apenas os artefatos de build para um caminho fora de /app
COPY --from=builder /app/dist ./dist

# Porta de preview/produção definida no docker-compose
EXPOSE 4173

# Executa como usuário não-root
USER node

CMD ["serve", "-s", "dist", "-l", "4173"]

