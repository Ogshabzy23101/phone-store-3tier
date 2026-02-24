# Use an official Node.js runtime as a parent image
FROM node:20-alpine
# Set the working directory in the container
WORKDIR /app
# Copy package.json to the working directory
COPY package*.json ./
# Install dependencies
RUN npm install
# Copy the rest of the application code to the working directory
COPY . .
# Expose the port the app runs on
EXPOSE 5000
# Define the command to run the application
CMD ["npm", "start"]