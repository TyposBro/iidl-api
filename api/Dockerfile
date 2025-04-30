# {PATH_TO_THE_PROJECT}/api/Dockerfile
# This Dockerfile is designed for a Node.js application with MongoDB.

# --- Stage 1: Build ---
# Use a specific Node.js version as the base image. Using LTS versions is often a good idea.
# 'alpine' variants are smaller but sometimes lack dependencies, 'slim' is a good middle ground.
FROM node:23-slim AS builder

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock) first
# This leverages Docker layer caching - dependencies are only re-installed if these files change.
COPY package*.json ./
# If you use yarn:
# COPY yarn.lock ./

# Install dependencies - use --only=production if you have separate devDependencies
# Or install all, and prune later if needed.
RUN npm install --legacy-peer-deps
# If you use yarn:
# RUN yarn install --frozen-lockfile

# Copy the rest of your application source code
COPY . .

# If your application needs a build step (e.g., TypeScript compilation, frontend build)
# Add that step here. Example for TypeScript:
# RUN npm run build

# --- Stage 2: Production ---
# Use a minimal Node.js image for the final production stage
FROM node:23-slim

# Set the working directory
WORKDIR /usr/src/app

# Copy only necessary files from the builder stage
# Copy node_modules
COPY --from=builder /usr/src/app/node_modules ./node_modules
# Copy package files (needed for npm/node to run correctly)
COPY --from=builder /usr/src/app/package*.json ./
# Copy application code (or compiled code if you had a build step)
COPY --from=builder /usr/src/app/ .
# If you had a build step copying compiled output (e.g., a 'dist' folder):
# COPY --from=builder /usr/src/app/dist ./dist

# Define environment variable for the Node environment (optional but good practice)
ENV NODE_ENV=production

# Define environment variable for the MongoDB connection string (will be overridden by Kubernetes)
# Provide a default that might work for local testing if NOT using K8s secrets locally
ENV MONGO_URI="mongodb://localhost:27017/defaultDbName"

# Expose the port the application listens on (must match your Node.js app)
EXPOSE 8000

# Define the command to run your application
# Replace 'server.js' with your actual entry point file
# If using compiled output, it might be 'dist/server.js'
CMD [ "node", "src/server.js" ]