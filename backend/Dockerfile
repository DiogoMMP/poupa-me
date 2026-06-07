FROM node:22-alpine

WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port 3000 for the API
EXPOSE 3000

# Run development script
CMD ["npm", "run", "dev"]