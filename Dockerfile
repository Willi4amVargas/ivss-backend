# ─── Etapa 1: dependencias y compilación ────────────────────────────────────
FROM node:24-slim AS build

WORKDIR /app

# corepack trae pnpm con la versión del lockfile
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

# ─── Etapa 2: imagen de ejecución ───────────────────────────────────────────
FROM node:24-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable

# Solo dependencias de producción (bcrypt nativo ya compilado)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

# El build de Nest (webpack) empaqueta la app en dist/main.js y copia
# fonts/ y assets/ dentro de dist/ (ver nest-cli.json).
COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
