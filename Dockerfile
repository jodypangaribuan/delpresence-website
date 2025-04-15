FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json* .npmrc ./

# Install dependencies
RUN npm ci --quiet

# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 3000

# Start the development server
CMD ["npm", "run", "dev"] 