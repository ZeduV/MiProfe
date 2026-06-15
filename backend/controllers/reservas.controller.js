const { sql, getPool } = require('../config/db');

// POST /api/reservas - Create a reservation
async function create(req, res) {
  try {
    const { perfilID, materiaID, disponibilidadID, horasTotales } = req.body;
    const estudianteID = req.user.usuarioID;

    if (!perfilID || !materiaID || !disponibilidadID || !horasTotales) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    const pool = await getPool();

    // Verify availability is still open
    const disp = await pool.request()
      .input('disponibilidadID', sql.Int, disponibilidadID)
      .query('SELECT * FROM Disponibilidad WHERE DisponibilidadID = @disponibilidadID AND Estado = \'Disponible\'');

    if (disp.recordset.length === 0) {
      return res.status(400).json({ error: 'El horario ya no está disponible.' });
    }

    // Get teacher's price per hour
    const perfil = await pool.request()
      .input('perfilID', sql.Int, perfilID)
      .query('SELECT PrecioPorHora FROM PerfilesDocentes WHERE PerfilID = @perfilID');

    if (perfil.recordset.length === 0) {
      return res.status(404).json({ error: 'Docente no encontrado.' });
    }

    const precioTotal = parseFloat(perfil.recordset[0].PrecioPorHora) * horasTotales;

    // Create reservation
    const result = await pool.request()
      .input('estudianteID', sql.Int, estudianteID)
      .input('perfilID', sql.Int, perfilID)
      .input('materiaID', sql.Int, materiaID)
      .input('disponibilidadID', sql.Int, disponibilidadID)
      .input('horasTotales', sql.Int, horasTotales)
      .input('precioTotal', sql.Decimal(10, 2), precioTotal)
      .query(`
        INSERT INTO Reservas (EstudianteID, PerfilID, MateriaID, DisponibilidadID, HorasTotales, PrecioTotal)
        OUTPUT INSERTED.*
        VALUES (@estudianteID, @perfilID, @materiaID, @disponibilidadID, @horasTotales, @precioTotal)
      `);

    // Mark availability as occupied
    await pool.request()
      .input('disponibilidadID', sql.Int, disponibilidadID)
      .query("UPDATE Disponibilidad SET Estado = 'Ocupado' WHERE DisponibilidadID = @disponibilidadID");

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Error al crear reserva:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

// GET /api/reservas/mis-reservas
async function getMisReservas(req, res) {
  try {
    const pool = await getPool();
    const usuarioID = req.user.usuarioID;
    const rol = req.user.rol;

    let query;
    if (rol === 'Estudiante') {
      query = `
        SELECT r.*, m.NombreMateria, u.NombreCompleto AS DocenteNombre,
               d.FechaHoraInicio, d.FechaHoraFin,
               CASE WHEN EXISTS (SELECT 1 FROM Calificaciones c WHERE c.ReservaID = r.ReservaID) THEN 1 ELSE 0 END AS YaCalificado
        FROM Reservas r
        JOIN Materias m ON r.MateriaID = m.MateriaID
        JOIN PerfilesDocentes p ON r.PerfilID = p.PerfilID
        JOIN Usuarios u ON p.UsuarioID = u.UsuarioID
        JOIN Disponibilidad d ON r.DisponibilidadID = d.DisponibilidadID
        WHERE r.EstudianteID = @usuarioID
        ORDER BY r.FechaReserva DESC
      `;
    } else {
      query = `
        SELECT r.*, m.NombreMateria, u.NombreCompleto AS EstudianteNombre,
               d.FechaHoraInicio, d.FechaHoraFin
        FROM Reservas r
        JOIN Materias m ON r.MateriaID = m.MateriaID
        JOIN Usuarios u ON r.EstudianteID = u.UsuarioID
        JOIN PerfilesDocentes p ON r.PerfilID = p.PerfilID
        JOIN Disponibilidad d ON r.DisponibilidadID = d.DisponibilidadID
        WHERE p.UsuarioID = @usuarioID
        ORDER BY r.FechaReserva DESC
      `;
    }

    const result = await pool.request()
      .input('usuarioID', sql.Int, usuarioID)
      .query(query);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener reservas:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

// PUT /api/reservas/:id/confirmar
async function confirmar(req, res) {
  try {
    const pool = await getPool();

    // Verify the teacher owns this reservation
    const perfil = await pool.request()
      .input('usuarioID', sql.Int, req.user.usuarioID)
      .query('SELECT PerfilID FROM PerfilesDocentes WHERE UsuarioID = @usuarioID');

    if (perfil.recordset.length === 0) {
      return res.status(403).json({ error: 'No autorizado.' });
    }

    const result = await pool.request()
      .input('reservaID', sql.Int, req.params.id)
      .input('perfilID', sql.Int, perfil.recordset[0].PerfilID)
      .query(`
        UPDATE Reservas SET EstadoReserva = 'Confirmada'
        WHERE ReservaID = @reservaID AND PerfilID = @perfilID AND EstadoReserva = 'Pendiente'
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada o ya procesada.' });
    }

    res.json({ message: 'Reserva confirmada exitosamente.' });
  } catch (err) {
    console.error('Error al confirmar reserva:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

// PUT /api/reservas/:id/cancelar
async function cancelar(req, res) {
  try {
    const pool = await getPool();
    const reservaID = req.params.id;

    // Get reservation details to free up availability
    const reserva = await pool.request()
      .input('reservaID', sql.Int, reservaID)
      .query('SELECT * FROM Reservas WHERE ReservaID = @reservaID');

    if (reserva.recordset.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada.' });
    }

    const r = reserva.recordset[0];

    // Verify user is either the student or the teacher
    let authorized = false;
    if (r.EstudianteID === req.user.usuarioID) authorized = true;
    if (!authorized) {
      const perfil = await pool.request()
        .input('usuarioID', sql.Int, req.user.usuarioID)
        .query('SELECT PerfilID FROM PerfilesDocentes WHERE UsuarioID = @usuarioID');
      if (perfil.recordset.length > 0 && perfil.recordset[0].PerfilID === r.PerfilID) {
        authorized = true;
      }
    }

    if (!authorized) {
      return res.status(403).json({ error: 'No autorizado.' });
    }

    // Cancel reservation
    await pool.request()
      .input('reservaID', sql.Int, reservaID)
      .query("UPDATE Reservas SET EstadoReserva = 'Cancelada' WHERE ReservaID = @reservaID");

    // Free up availability
    await pool.request()
      .input('disponibilidadID', sql.Int, r.DisponibilidadID)
      .query("UPDATE Disponibilidad SET Estado = 'Disponible' WHERE DisponibilidadID = @disponibilidadID");

    res.json({ message: 'Reserva cancelada exitosamente.' });
  } catch (err) {
    console.error('Error al cancelar reserva:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

// PUT /api/reservas/:id/completar
async function completar(req, res) {
  try {
    const pool = await getPool();

    const perfil = await pool.request()
      .input('usuarioID', sql.Int, req.user.usuarioID)
      .query('SELECT PerfilID FROM PerfilesDocentes WHERE UsuarioID = @usuarioID');

    if (perfil.recordset.length === 0) {
      return res.status(403).json({ error: 'No autorizado.' });
    }

    const result = await pool.request()
      .input('reservaID', sql.Int, req.params.id)
      .input('perfilID', sql.Int, perfil.recordset[0].PerfilID)
      .query(`
        UPDATE Reservas SET EstadoReserva = 'Completada'
        WHERE ReservaID = @reservaID AND PerfilID = @perfilID AND EstadoReserva = 'Confirmada'
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada o no confirmada.' });
    }

    res.json({ message: 'Reserva completada exitosamente.' });
  } catch (err) {
    console.error('Error al completar reserva:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

module.exports = { create, getMisReservas, confirmar, cancelar, completar };
