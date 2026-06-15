require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { getPool } = require('./config/db');
const setupChatSocket = require('./socket/chat.socket');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/materias', require('./routes/materias.routes'));
app.use('/api/docentes', require('./routes/docentes.routes'));
app.use('/api/reservas', require('./routes/reservas.routes'));
app.use('/api/calificaciones', require('./routes/calificaciones.routes'));
app.use('/api/chat', require('./routes/chat.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'MiProfe API funcionando correctamente 🚀' });
});

// Setup Socket.io
setupChatSocket(io);

// Make io accessible in controllers if needed
app.set('io', io);

// Start server
const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await getPool();
    server.listen(PORT, () => {
      console.log(`🚀 Servidor MiProfe corriendo en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Error al iniciar el servidor:', err);
    process.exit(1);
  }
}

start();
