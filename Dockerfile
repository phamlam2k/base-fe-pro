# Web Next.js (base-fe-pro) — production standalone image.
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Chỉ NEXT_PUBLIC_API_URL được inline lúc build (mặc định "/api"). BACKEND_API_URL và
# COOKIE_SECURE là server-side, đọc lúc runtime nên KHÔNG cần ở bước build.
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# next.config output:"standalone" → server.js + node_modules tối thiểu (đã trace).
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
