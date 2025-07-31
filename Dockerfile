# Use Node 20 as the base image
FROM node:20-alpine

# Install git to avoid errors with git-based commands
RUN apk add --no-cache git

# Set the working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package*.json ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies with pnpm
RUN pnpm install

# Install tsdown if needed (based on your error)
RUN pnpm add tsdown --save-dev

# Copy the rest of the project files
COPY . .

# Build the project
RUN pnpm run build

# Expose port 3000
EXPOSE 3000

# Command to start the app
CMD ["pnpm", "run", "serve"]
