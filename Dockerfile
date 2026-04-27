FROM node:22-alpine AS deps
WORKDIR /app

# 👇 copy EVERYTHING first (important fix)
COPY . .

RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app ./
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "run", "start"]
