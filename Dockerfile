FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install sqlite3
RUN npm install socket.io


# copiar todo el proyecto (incluyendo public)
COPY . .


EXPOSE 3000
CMD ["node", "server.js"]

