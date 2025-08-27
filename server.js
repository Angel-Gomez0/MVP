const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const gameRoutes = require('./routes/games');
const scoreRoutes = require('./routes/scores');

app.use(bodyParser.json());

const publicPath = path.resolve(__dirname, 'public');
app.use(express.static(publicPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/scores', scoreRoutes);

app.use((req, res) => res.status(404).send('Página no encontrada'));

// --- SOCKET.IO PARA PING PONG VS ---
const rooms = {}; // almacena las salas y jugadores

io.on('connection', socket => {
  console.log('Usuario conectado:', socket.id);

  socket.on('joinRoom', ({ roomId, userName }) => {
    if (!rooms[roomId]) rooms[roomId] = { players: [], state: {} };
    if (rooms[roomId].players.length >= 2) {
      socket.emit('roomFull');
      return;
    }

    rooms[roomId].players.push({ id: socket.id, name: userName });
    socket.join(roomId);

    if (rooms[roomId].players.length === 2) {
      io.to(roomId).emit('startGame', rooms[roomId].players);
      // Inicializar estado de la partida
      rooms[roomId].state = {
        ball: { x: 250, y: 200, dx: 3, dy: 3 },
        paddles: {
          [rooms[roomId].players[0].id]: 210,
          [rooms[roomId].players[1].id]: 210
        }
      };
    }
  });

  socket.on('paddleMove', ({ roomId, position }) => {
    if (!rooms[roomId]) return;
    rooms[roomId].state.paddles[socket.id] = position;
    socket.to(roomId).emit('updatePaddle', { playerId: socket.id, position });
  });

  socket.on('ballUpdate', ({ roomId, ball }) => {
    if (!rooms[roomId]) return;
    rooms[roomId].state.ball = ball;
    socket.to(roomId).emit('updateBall', ball);
  });

  socket.on('gameOver', ({ roomId, winnerId }) => {
    if (!rooms[roomId]) return;
    const winner = rooms[roomId].players.find(p => p.id === winnerId);
    io.to(roomId).emit('showWinner', winner.name);
    delete rooms[roomId];
  });

  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      rooms[roomId].players = rooms[roomId].players.filter(p => p.id !== socket.id);
      if (rooms[roomId].players.length === 0) delete rooms[roomId];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
