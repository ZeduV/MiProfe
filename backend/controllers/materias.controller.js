const { sql, getPool } = require('../config/db');

// GET /api/materias
async function getAll(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT MateriaID, NombreMateria FROM Materias ORDER BY NombreMateria');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener materias:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

module.exports = { getAll };
