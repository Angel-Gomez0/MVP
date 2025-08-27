FROM node:18

WORKDIR /app
RUN npm install
RUN npm install express
RUN npm install sqlite3
RUN npm install socket.io
COPY package*.json ./

# copiar todo el proyecto (incluyendo public)
COPY . .


EXPOSE 3000
CMD ["node", "server.js"]

