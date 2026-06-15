const { sql, getPool } = require('../config/db');

// GET /api/chat/conversaciones - List active conversations for the user
async function getConversaciones(req, res) {
  try {
    const pool = await getPool();
    const usuarioID = req.user.usuarioID;

    const result = await pool.request()
      .input('usuarioID', sql.Int, usuarioID)
      .query(`
        SELECT DISTINCT r.ReservaID, r.EstadoReserva,
               m.NombreMateria,
               CASE
                 WHEN r.EstudianteID = @usuarioID THEN uDoc.NombreCompleto
                 ELSE uEst.NombreCompleto
               END AS OtroNombre,
               CASE
                 WHEN r.EstudianteID = @usuarioID THEN uDoc.UsuarioID
                 ELSE uEst.UsuarioID
               END AS OtroUsuarioID,
               (SELECT TOP 1 cm.Contenido FROM ChatMensajes cm WHERE cm.ReservaID = r.ReservaID ORDER BY cm.FechaEnvio DESC) AS UltimoMensaje,
               (SELECT TOP 1 cm.FechaEnvio FROM ChatMensajes cm WHERE cm.ReservaID = r.ReservaID ORDER BY cm.FechaEnvio DESC) AS UltimaFecha
        FROM Reservas r
        JOIN Usuarios uEst ON r.EstudianteID = uEst.UsuarioID
        JOIN PerfilesDocentes p ON r.PerfilID = p.PerfilID
        JOIN Usuarios uDoc ON p.UsuarioID = uDoc.UsuarioID
        JOIN Materias m ON r.MateriaID = m.MateriaID
        WHERE (r.EstudianteID = @usuarioID OR p.UsuarioID = @usuarioID)
          AND r.EstadoReserva IN ('Confirmada', 'Completada')
        ORDER BY UltimaFecha DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener conversaciones:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

// GET /api/chat/:reservaId - Get message history for a reservation
async function getMessages(req, res) {
  try {
    const pool = await getPool();
    const reservaID = req.params.reservaId;
    const usuarioID = req.user.usuarioID;

    // Verify the user is part of this reservation
    const reserva = await pool.request()
      .input('reservaID', sql.Int, reservaID)
      .input('usuarioID', sql.Int, usuarioID)
      .query(`
        SELECT r.ReservaID
        FROM Reservas r
        JOIN PerfilesDocentes p ON r.PerfilID = p.PerfilID
        WHERE r.ReservaID = @reservaID
          AND (r.EstudianteID = @usuarioID OR p.UsuarioID = @usuarioID)
      `);

    if (reserva.recordset.length === 0) {
      return res.status(403).json({ error: 'No tienes acceso a esta conversación.' });
    }

    const result = await pool.request()
      .input('reservaID', sql.Int, reservaID)
      .query(`
        SELECT cm.MensajeID, cm.ReservaID, cm.RemitenteID, cm.ReceptorID, cm.Contenido, cm.FechaEnvio,
               u.NombreCompleto AS RemitenteNombre
        FROM ChatMensajes cm
        JOIN Usuarios u ON cm.RemitenteID = u.UsuarioID
        WHERE cm.ReservaID = @reservaID
        ORDER BY cm.FechaEnvio ASC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener mensajes:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

// POST /api/chat/:reservaId - Send a message
async function sendMessage(req, res) {
  try {
    const { contenido } = req.body;
    const reservaID = req.params.reservaId;
    const remitenteID = req.user.usuarioID;

    if (!contenido || !contenido.trim()) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
    }

    const pool = await getPool();

    // Get the other party's ID
    const reserva = await pool.request()
      .input('reservaID', sql.Int, reservaID)
      .input('usuarioID', sql.Int, remitenteID)
      .query(`
        SELECT r.EstudianteID, p.UsuarioID AS DocenteUsuarioID
        FROM Reservas r
        JOIN PerfilesDocentes p ON r.PerfilID = p.PerfilID
        WHERE r.ReservaID = @reservaID
          AND (r.EstudianteID = @usuarioID OR p.UsuarioID = @usuarioID)
          AND r.EstadoReserva IN ('Confirmada', 'Completada')
      `);

    if (reserva.recordset.length === 0) {
      return res.status(403).json({ error: 'No puedes enviar mensajes en esta reserva.' });
    }

    const r = reserva.recordset[0];
    const receptorID = r.EstudianteID === remitenteID ? r.DocenteUsuarioID : r.EstudianteID;

    const result = await pool.request()
      .input('reservaID', sql.Int, reservaID)
      .input('remitenteID', sql.Int, remitenteID)
      .input('receptorID', sql.Int, receptorID)
      .input('contenido', sql.VarChar, contenido.trim())
      .query(`
        INSERT INTO ChatMensajes (ReservaID, RemitenteID, ReceptorID, Contenido)
        OUTPUT INSERTED.*
        VALUES (@reservaID, @remitenteID, @receptorID, @contenido)
      `);

    const message = result.recordset[0];
    message.RemitenteNombre = req.user.nombreCompleto;

    res.status(201).json(message);
  } catch (err) {
    console.error('Error al enviar mensaje:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

module.exports = { getConversaciones, getMessages, sendMessage };
