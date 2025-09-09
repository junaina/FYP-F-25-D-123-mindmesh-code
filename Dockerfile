# ---- build the app ----
FROM node:20-alpine AS build
WORKDIR /app

# 1) Install deps (use your lockfile)
COPY package.json package-lock.json* ./
RUN npm ci

# 2) Copy source and build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- run the app ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# copy the standalone server + static assets + public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
