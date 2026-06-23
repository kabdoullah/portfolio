# Railway build. We control the toolchain explicitly instead of relying on
# Nixpacks + corepack: corepack's shim crashes running pnpm 11.1.2
# (ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING), and the Nixpacks default pnpm is too
# old to read pnpm-workspace.yaml / the pnpm-11 lockfile. Installing pnpm 11.1.2
# directly with npm mirrors the local, tested toolchain.
FROM node:22-slim

# pnpm 11.1.2 standalone (NOT via corepack).
RUN npm install -g pnpm@11.1.2

WORKDIR /app

# Manifests first for layer caching.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Autoriser explicitement les scripts de build pour esbuild et le résolveur de Rolldown
RUN pnpm config set only-built-dependencies esbuild unrs-resolver

RUN pnpm install --frozen-lockfile

# App source + build.
COPY . .
RUN pnpm build

# Railway injects PORT at runtime; `start` runs migrate-on-start then serves.
EXPOSE 3000
CMD ["pnpm", "start"]
