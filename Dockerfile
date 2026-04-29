# ---- Build Stage ----
FROM node:20-slim AS build

WORKDIR /src

# Install dependencies (separate from source for better caching)
COPY package.json package-lock.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# ---- Runner Stage ----
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy standalone server output from build stage
COPY --from=build /src/.next/standalone ./
# Copy static assets (client-side JS, CSS, etc.)
COPY --from=build /src/.next/static ./.next/static
# Copy public assets
COPY --from=build /src/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
