FROM oven/bun:latest AS installer

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install

FROM node:24-alpine AS builder

WORKDIR /app

COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/package.json ./

COPY . .

RUN npx ng build --configuration production

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 4000

CMD ["node", "dist/anjir/server/server.mjs"]
