# Use Node 20 as the base image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package*.json ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies with pnpm
RUN pnpm install

# Copy the rest of the project files
COPY . .

# Build the project
RUN pnpm run build

# Expose port 3000
EXPOSE 3000

# Command to start the app
CMD ["pnpm", "run", "serve"]
