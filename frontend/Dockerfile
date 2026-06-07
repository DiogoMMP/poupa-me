FROM node:22-alpine

WORKDIR /usr/src/app

# Install Angular CLI globally inside the container
RUN npm install -g @angular/cli@21

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4200

# Run the proxy-configured script for Docker
CMD ["npm", "run", "start:docker"]