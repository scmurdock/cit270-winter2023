# this builds a Linux server with Node version 18 installed
FROM node:18

# This is telling it to cd to the below directory
WORKDIR /usr/src/app

# Copy the package.json file before we install libraries
COPY package*.json ./

# Install libraries
RUN npm install

# Copy the code into the server under /usr/src/app
COPY . .

# Allow container to listen on port 443
EXPOSE 443

CMD ["node","server.js"]