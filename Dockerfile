FROM node:18-alpine

RUN apk add --no-cache openssl1.1-compat
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000

RUN pnpm run db-generate
RUN pnpm run build-next
RUN pnpm run build-server

EXPOSE 3000
CMD ["yarn", "run", "start"]
