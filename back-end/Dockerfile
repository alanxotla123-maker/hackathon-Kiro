FROM node:20-alpine

WORKDIR /app

# Install system dependencies needed for Prisma
RUN apk add --no-cache openssl

# Copy package lists
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy prisma directory first to generate Prisma Client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Build the TypeScript project
RUN npm run build

# Expose port
EXPOSE 3000

# Apply pending migrations, then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
