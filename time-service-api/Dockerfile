# Use an official Node.js image
FROM node:16

# Create and set the working directory inside the container
WORKDIR /app

# Copy the package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port your service is running on
EXPOSE 5005

# Run the application
CMD ["npm", "start"]