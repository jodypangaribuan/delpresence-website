FROM node:20-alpine AS dependencies

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy dependencies
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Install any missing dependencies needed for build
RUN npm install --no-save critters

# Build application
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy build output
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Create cache directory and set permissions
RUN mkdir -p .next/cache/images .next/cache/fetch
RUN chown -R nextjs:nodejs /app

# Set proper permissions
USER nextjs

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
