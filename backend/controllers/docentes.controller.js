const { sql, getPool } = require('../config/db');

// GET /api/docentes - List all teachers, optionally filtered by subject
async function getAll(req, res) {
  try {
    const { materiaId, buscar } = req.query;
    const pool = await getPool();
    let query = `
      SELECT DISTINCT
        u.UsuarioID, u.NombreCompleto, u.Email, u.Rol,
        p.PerfilID, p.PrecioPorHora, p.CalificacionPromedio, p.TotalResenas, p.Biografia
      FROM Usuarios u
      JOIN PerfilesDocentes p ON u.UsuarioID = p.UsuarioID
    `;

    const request = pool.request();

    if (materiaId) {
      query += ' JOIN Docente_Materia dm ON p.PerfilID = dm.PerfilID';
      query += ' WHERE dm.MateriaID = @materiaId';
      request.input('materiaId', sql.Int, materiaId);
      if (buscar) {
        query += ' AND u.NombreCompleto LIKE @buscar';
        request.input('buscar', sql.VarChar, `%${buscar}%`);
      }
    } else if (buscar) {
      query += ' WHERE u.NombreCompleto LIKE @buscar';
      request.input('buscar', sql.VarChar, `%${buscar}%`);
    }

    query += ' ORDER BY p.CalificacionPromedio DESC';

    const result = await request.query(query);

    // For each teacher, fetch their subjects
    const docentes = [];
    for (const doc of result.recordset) {
      const materias = await pool.request()
        .input('perfilID', sql.Int, doc.PerfilID)
        .query(`
          SELECT m.MateriaID, m.NombreMateria
          FROM Docente_Materia dm
          JOIN Materias m ON dm.MateriaID = m.MateriaID
          WHERE dm.PerfilID = @perfilID
        `);
      docentes.push({ ...doc, materias: materias.recordset });
    }

    res.json(docentes);
  } catch (err) {
    console.error('Error al obtener docentes:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

// GET /api/docentes/:id - Get a single teacher's public profile
async function getById(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('perfilID', sql.Int, req.params.id)
      .query(`
        SELECT
          u.UsuarioID, u.NombreCompleto, u.Email, u.Rol,
          p.PerfilID, p.PrecioPorHora, p.CalificacionPromedio, p.TotalResenas, p.Biografia
        FROM Usuarios u
        JOIN PerfilesDocentes p ON u.UsuarioID = p.UsuarioID
        WHERE p.PerfilID = @perfilID
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Docente no encontrado.' });
    }

    const docente = result.recordset[0];

    // Fetch subjects
    const materias = await pool.request()
      .input('perfilID', sql.Int, docente.PerfilID)
      .query(`
        SELECT m.MateriaID, m.NombreMateria
        FROM Docente_Materia dm
        JOIN Materias m ON dm.MateriaID = m.MateriaID
        WHERE dm.PerfilID = @perfilID
      `);
    docente.materias = materias.recordset;

    // Fetch reviews
    const resenas = await pool.request()
      .input('perfilID', sql.Int, docente.PerfilID)
      .query(`
        SELECT c.CalificacionID, c.Puntuacion, c.Comentario, c.FechaCalificacion,
               u.NombreCompleto AS EstudianteNombre
        FROM Calificaciones c
        JOIN Reservas r ON c.ReservaID = r.ReservaID
        JOIN Usuarios u ON r.EstudianteID = u.UsuarioID
        WHERE r.PerfilID = @perfilID
        ORDER BY c.FechaCalificacion DESC
      `);
    docente.resenas = resenas.recordset;

    res.json(docente);
  } catch (err) {
    console.error('Error al obtener docente:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

// GET /api/docentes/:id/disponibilidad
async function getDisponibilidad(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('perfilID', sql.Int, req.params.id)
      .query(`
        SELECT DisponibilidadID, FechaHoraInicio, FechaHoraFin, Estado
        FROM Disponibilidad
        WHERE PerfilID = @perfilID
        ORDER BY FechaHoraInicio
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener disponibilidad:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

// POST /api/docentes/disponibilidad - Add availability slot
async function addDisponibilidad(req, res) {
  try {
    const { inicio, fin } = req.body;

    if (!inicio || !fin) {
      return res.status(400).json({ error: 'Inicio y fin son obligatorios.' });
    }

    const pool = await getPool();

    // Get profile ID for the authenticated user
    const perfil = await pool.request()
      .input('usuarioID', sql.Int, req.user.usuarioID)
      .query('SELECT PerfilID FROM PerfilesDocentes WHERE UsuarioID = @usuarioID');

    if (perfil.recordset.length === 0) {
      return res.status(404).json({ error: 'Perfil docente no encontrado.' });
    }

    const perfilID = perfil.recordset[0].PerfilID;

    const result = await pool.request()
      .input('perfilID', sql.Int, perfilID)
      .input('inicio', sql.DateTime, new Date(inicio))
      .input('fin', sql.DateTime, new Date(fin))
      .query(`
        INSERT INTO Disponibilidad (PerfilID, FechaHoraInicio, FechaHoraFin)
        OUTPUT INSERTED.*
        VALUES (@perfilID, @inicio, @fin)
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Error al agregar disponibilidad:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

// PUT /api/docentes/perfil - Update profile
async function updatePerfil(req, res) {
  try {
    const { biografia, precioPorHora } = req.body;
    const pool = await getPool();

    const perfil = await pool.request()
      .input('usuarioID', sql.Int, req.user.usuarioID)
      .query('SELECT PerfilID FROM PerfilesDocentes WHERE UsuarioID = @usuarioID');

    if (perfil.recordset.length === 0) {
      return res.status(404).json({ error: 'Perfil docente no encontrado.' });
    }

    const perfilID = perfil.recordset[0].PerfilID;

    await pool.request()
      .input('perfilID', sql.Int, perfilID)
      .input('biografia', sql.VarChar, biografia || '')
      .input('precioPorHora', sql.Decimal(10, 2), precioPorHora || 0)
      .query(`
        UPDATE PerfilesDocentes
        SET Biografia = @biografia, PrecioPorHora = @precioPorHora
        WHERE PerfilID = @perfilID
      `);

    res.json({ message: 'Perfil actualizado exitosamente.' });
  } catch (err) {
    console.error('Error al actualizar perfil:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

// DELETE /api/docentes/disponibilidad/:id
async function deleteDisponibilidad(req, res) {
  try {
    const pool = await getPool();

    // Verify the slot belongs to the authenticated user
    const perfil = await pool.request()
      .input('usuarioID', sql.Int, req.user.usuarioID)
      .query('SELECT PerfilID FROM PerfilesDocentes WHERE UsuarioID = @usuarioID');

    if (perfil.recordset.length === 0) {
      return res.status(404).json({ error: 'Perfil docente no encontrado.' });
    }

    const result = await pool.request()
      .input('disponibilidadID', sql.Int, req.params.id)
      .input('perfilID', sql.Int, perfil.recordset[0].PerfilID)
      .query('DELETE FROM Disponibilidad WHERE DisponibilidadID = @disponibilidadID AND PerfilID = @perfilID');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Horario no encontrado o no autorizado.' });
    }

    res.json({ message: 'Horario eliminado exitosamente.' });
  } catch (err) {
    console.error('Error al eliminar disponibilidad:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

module.exports = { getAll, getById, getDisponibilidad, addDisponibilidad, updatePerfil, deleteDisponibilidad };
