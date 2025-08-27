FROM node:18

WORKDIR /app
COPY package*.json ./
RUN npm install

# copiar todo el proyecto (incluyendo public)
COPY . .


EXPOSE 3001
CMD ["node", "server.js"]

