const jwt = require('jsonwebtoken');

function setupChatSocket(io) {
  // Authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Autenticación requerida'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Usuario conectado: ${socket.user.nombreCompleto} (ID: ${socket.user.usuarioID})`);

    // Join a room for a specific reservation
    socket.on('join-reserva', (reservaId) => {
      socket.join(`reserva-${reservaId}`);
      console.log(`📌 ${socket.user.nombreCompleto} se unió a reserva-${reservaId}`);
    });

    // Leave reservation room
    socket.on('leave-reserva', (reservaId) => {
      socket.leave(`reserva-${reservaId}`);
    });

    // Handle new message - broadcast to room
    socket.on('nuevo-mensaje', (data) => {
      // Broadcast to the reservation room (excluding sender)
      socket.to(`reserva-${data.reservaID}`).emit('mensaje-recibido', {
        ...data,
        RemitenteNombre: socket.user.nombreCompleto
      });
    });

    // Handle typing indicator
    socket.on('escribiendo', (data) => {
      socket.to(`reserva-${data.reservaID}`).emit('usuario-escribiendo', {
        usuarioID: socket.user.usuarioID,
        nombreCompleto: socket.user.nombreCompleto
      });
    });

    socket.on('disconnect', () => {
      console.log(`❌ Usuario desconectado: ${socket.user.nombreCompleto}`);
    });
  });
}

module.exports = setupChatSocket;
