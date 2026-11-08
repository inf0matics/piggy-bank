# syntax = docker/dockerfile:1

ARG NODE_VERSION=26.13.0

FROM node:${NODE_VERSION}-slim AS base

ARG PORT=3000

ENV NODE_ENV=production

WORKDIR /app

# Build
FROM base AS build

# Install Git if package.json or package-lock.json contains dependencies that require it (e.g., dependencies with 'git+' URLs)
RUN apt-get update && apt-get install -y git

COPY --link package.json package-lock.json ./

# Install exactly the lockfile's tree (the one the checks ran against). The
# lockfile carries every platform's native bindings, so npm/cli#4828 no longer
# bites. --include=dev: NODE_ENV=production would otherwise skip the build tools.
RUN npm ci --include=dev

COPY --link . .

RUN npm run build
RUN npm prune

# Run
FROM base

ENV PORT=$PORT
#ENV HOST 0.0.0.0

COPY --from=build /app/.output /app/.output
COPY package.json /app
# Optional, only needed if you rely on unbundled dependencies
# COPY --from=build /app/node_modules /app/node_modules

CMD [ "node", ".output/server/index.mjs" ]
