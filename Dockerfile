# FALLBACK ONLY. Render deploys with its native Node runtime (render.yaml). Keep
# this file until the first native deploy is verified; if pnpm setup fails there,
# set `runtime: docker` in render.yaml. pnpm is installed with npm, not corepack
# (corepack's shim crashes with pnpm 11).
FROM node:22-slim

# pnpm 11.18.0 standalone, NOT via corepack — the version that wrote pnpm-lock.yaml.
RUN npm install -g pnpm@11.18.0

WORKDIR /app

# Manifests first for layer caching.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# App source + build.
COPY . .
RUN pnpm build

# The platform injects PORT at runtime; `start` runs migrate-on-start then serves.
EXPOSE 3000
CMD ["pnpm", "start"]
