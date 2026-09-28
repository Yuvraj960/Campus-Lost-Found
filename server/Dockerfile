FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set node environment
ENV NODE_ENV=production

# Install dependencies first (leverage docker layer caching)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source
COPY src/ ./src/

# Use non-root node user for security
USER node

# Expose server port
EXPOSE 5000

# Start Express server
CMD ["node", "src/server.js"]
