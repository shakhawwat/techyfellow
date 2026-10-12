FROM node:22.22.3-bookworm-slim AS base
ARG NEXT_PUBLIC_API_BASE_URL=/api/v1
ARG NEXT_PUBLIC_MEDIA_HOST=
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_MEDIA_HOST=$NEXT_PUBLIC_MEDIA_HOST
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN chown node:node /app

FROM base AS dependencies
COPY --chown=node:node package.json package-lock.json ./
USER node
RUN npm ci --no-audit --no-fund

FROM dependencies AS development
COPY --chown=node:node . .
ENV NODE_ENV=development PORT=3000 HOSTNAME=0.0.0.0
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]

FROM dependencies AS build
COPY --chown=node:node . .
RUN npm run build

FROM base AS production
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
