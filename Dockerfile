# ---------- Build stage ----------
FROM node:22-alpine AS builder
WORKDIR /app

# Bun (fast installs) is optional; npm works fine. Use npm for max compatibility.
COPY package.json bun.lock* package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

# Build-time public env (baked into the client bundle)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID

RUN npm run build

# ---------- Runtime stage ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# TanStack Start (Nitro) production output
COPY --from=builder /app/.output ./.output

EXPOSE 3000

# Server env is read at runtime (never baked into the image):
#   SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY, LOVABLE_API_KEY
CMD ["node", ".output/server/index.mjs"]
