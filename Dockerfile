FROM node:18-alpine

RUN apk add --no-cache tzdata
ENV TZ=Asia/Taipei
RUN cp /usr/share/zoneinfo/Asia/Taipei /etc/localtime

RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000

RUN pnpm run db-generate
RUN pnpm run build

EXPOSE 3000
CMD ["pnpm", "run", "start"]
