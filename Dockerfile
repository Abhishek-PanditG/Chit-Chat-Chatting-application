FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the app
COPY . .

# App port
EXPOSE 3000

# Start server
CMD ["node", "index.js"]
