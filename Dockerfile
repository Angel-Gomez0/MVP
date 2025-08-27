FROM node:18

WORKDIR /app
RUN npm install

# copiar todo el proyecto (incluyendo public)
COPY . .


EXPOSE 3000
CMD ["node", "server.js"]

