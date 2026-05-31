FROM node:22-alpine

# Wajib untuk Prisma di Alpine
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
RUN npm run build

EXPOSE 3000

# Migrate schema + seed + jalankan app
CMD ["sh", "-c", "npx prisma db push && npx prisma db seed && npm start"]