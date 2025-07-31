# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or pnpm-lock.yaml if you're using pnpm)
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the entire project
COPY . .

# Build the Vite project
RUN npm run build

# Expose the port the app will run on
EXPOSE 3000

# Command to run the app
CMD ["npm", "run", "serve"]
