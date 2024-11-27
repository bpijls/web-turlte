# Use a base image with Node.js pre-installed
FROM node:14


# Set the working directory inside the container
WORKDIR /

# Copy package.json and package-lock.json (if exist) to the working directory
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port your application listens on
EXPOSE 8008

VOLUME ["/client"]

# Command to run your application
CMD ["node", "turlte-server.js"]
