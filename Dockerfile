# Use the official Node.js image as a base image
FROM node:22

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json (if available) into the container
COPY package*.json ./

# Install dependencies inside the container
RUN npm install

# Copy the rest of the application code into the container
COPY . .

# Expose the port that the app will run on
EXPOSE 3000

# Run the Node.js application
CMD ["node", "server.js"]
