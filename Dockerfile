# deps
FROM node:16-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock* ./
RUN yarn --frozen-lockfile --production


# build
FROM node:16-alpine
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000

RUN yarn run db-generate
RUN yarn run build-next
RUN yarn run build-server

EXPOSE 3000
CMD ["yarn", "run", "start"]
