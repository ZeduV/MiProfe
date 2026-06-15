const { sql, getPool } = require('../config/db');

// POST /api/calificaciones
async function create(req, res) {
  try {
    const { reservaID, puntuacion, comentario } = req.body;

    if (!reservaID || !puntuacion) {
      return res.status(400).json({ error: 'ReservaID y puntuación son obligatorios.' });
    }

    if (puntuacion < 1 || puntuacion > 10) {
      return res.status(400).json({ error: 'La puntuación debe ser entre 1 y 10.' });
    }

    const pool = await getPool();

    // Verify the student owns this reservation and it's completed
    const reserva = await pool.request()
      .input('reservaID', sql.Int, reservaID)
      .input('estudianteID', sql.Int, req.user.usuarioID)
      .query("SELECT * FROM Reservas WHERE ReservaID = @reservaID AND EstudianteID = @estudianteID AND EstadoReserva = 'Completada'");

    if (reserva.recordset.length === 0) {
      return res.status(400).json({ error: 'Reserva no encontrada, no completada o no te pertenece.' });
    }

    // Check if already rated
    const existing = await pool.request()
      .input('reservaID', sql.Int, reservaID)
      .query('SELECT CalificacionID FROM Calificaciones WHERE ReservaID = @reservaID');

    if (existing.recordset.length > 0) {
      return res.status(409).json({ error: 'Esta reserva ya fue calificada.' });
    }

    // Insert rating
    await pool.request()
      .input('reservaID', sql.Int, reservaID)
      .input('puntuacion', sql.Int, puntuacion)
      .input('comentario', sql.VarChar, comentario || '')
      .query(`
        INSERT INTO Calificaciones (ReservaID, Puntuacion, Comentario)
        VALUES (@reservaID, @puntuacion, @comentario)
      `);

    // Update average rating on teacher profile
    const perfilID = reserva.recordset[0].PerfilID;
    await pool.request()
      .input('perfilID', sql.Int, perfilID)
      .query(`
        UPDATE PerfilesDocentes
        SET CalificacionPromedio = (
          SELECT AVG(CAST(c.Puntuacion AS DECIMAL(4,2)))
          FROM Calificaciones c
          JOIN Reservas r ON c.ReservaID = r.ReservaID
          WHERE r.PerfilID = @perfilID
        ),
        TotalResenas = (
          SELECT COUNT(*)
          FROM Calificaciones c
          JOIN Reservas r ON c.ReservaID = r.ReservaID
          WHERE r.PerfilID = @perfilID
        )
        WHERE PerfilID = @perfilID
      `);

    res.status(201).json({ message: 'Calificación registrada exitosamente.' });
  } catch (err) {
    console.error('Error al crear calificación:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

// GET /api/calificaciones/docente/:perfilId
async function getByDocente(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('perfilID', sql.Int, req.params.perfilId)
      .query(`
        SELECT c.CalificacionID, c.Puntuacion, c.Comentario, c.FechaCalificacion,
               u.NombreCompleto AS EstudianteNombre
        FROM Calificaciones c
        JOIN Reservas r ON c.ReservaID = r.ReservaID
        JOIN Usuarios u ON r.EstudianteID = u.UsuarioID
        WHERE r.PerfilID = @perfilID
        ORDER BY c.FechaCalificacion DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener calificaciones:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

module.exports = { create, getByDocente };
