FROM node:18-alpine

RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock* ./
RUN yarn --frozen-lockfile --production

COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000

RUN yarn run db-generate
RUN yarn run build-next
RUN yarn run build-server

EXPOSE 3000
CMD ["yarn", "run", "start"]
