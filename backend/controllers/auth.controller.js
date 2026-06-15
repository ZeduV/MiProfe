const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql, getPool } = require('../config/db');

// POST /api/auth/register
async function register(req, res) {
  try {
    const { nombreCompleto, email, password, rol, biografia, precioPorHora, materias, disponibilidad } = req.body;

    if (!nombreCompleto || !email || !password || !rol) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    if (!['Estudiante', 'Docente', 'Auxiliar'].includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido.' });
    }

    const pool = await getPool();

    // Check if email already exists
    const existing = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT UsuarioID FROM Usuarios WHERE Email = @email');

    if (existing.recordset.length > 0) {
      return res.status(409).json({ error: 'El correo electrónico ya está registrado.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const userResult = await pool.request()
      .input('nombreCompleto', sql.VarChar, nombreCompleto)
      .input('email', sql.VarChar, email)
      .input('passwordHash', sql.VarChar, passwordHash)
      .input('rol', sql.VarChar, rol)
      .query(`
        INSERT INTO Usuarios (NombreCompleto, Email, PasswordHash, Rol)
        OUTPUT INSERTED.UsuarioID
        VALUES (@nombreCompleto, @email, @passwordHash, @rol)
      `);

    const usuarioID = userResult.recordset[0].UsuarioID;

    // If Docente or Auxiliar, create profile
    if (rol === 'Docente' || rol === 'Auxiliar') {
      const precio = precioPorHora || 0;
      const bio = biografia || '';

      const perfilResult = await pool.request()
        .input('usuarioID', sql.Int, usuarioID)
        .input('precioPorHora', sql.Decimal(10, 2), precio)
        .input('biografia', sql.VarChar, bio)
        .query(`
          INSERT INTO PerfilesDocentes (UsuarioID, PrecioPorHora, Biografia)
          OUTPUT INSERTED.PerfilID
          VALUES (@usuarioID, @precioPorHora, @biografia)
        `);

      const perfilID = perfilResult.recordset[0].PerfilID;

      // Associate subjects
      if (materias && materias.length > 0) {
        for (const materiaID of materias) {
          await pool.request()
            .input('perfilID', sql.Int, perfilID)
            .input('materiaID', sql.Int, materiaID)
            .query('INSERT INTO Docente_Materia (PerfilID, MateriaID) VALUES (@perfilID, @materiaID)');
        }
      }

      // Add availability slots
      if (disponibilidad && disponibilidad.length > 0) {
        for (const slot of disponibilidad) {
          await pool.request()
            .input('perfilID', sql.Int, perfilID)
            .input('inicio', sql.DateTime, new Date(slot.inicio))
            .input('fin', sql.DateTime, new Date(slot.fin))
            .query(`
              INSERT INTO Disponibilidad (PerfilID, FechaHoraInicio, FechaHoraFin)
              VALUES (@perfilID, @inicio, @fin)
            `);
        }
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { usuarioID, email, rol, nombreCompleto },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente.',
      token,
      user: { usuarioID, nombreCompleto, email, rol }
    });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Usuarios WHERE Email = @email');

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const user = result.recordset[0];
    const validPassword = await bcrypt.compare(password, user.PasswordHash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const token = jwt.sign(
      {
        usuarioID: user.UsuarioID,
        email: user.Email,
        rol: user.Rol,
        nombreCompleto: user.NombreCompleto
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Inicio de sesión exitoso.',
      token,
      user: {
        usuarioID: user.UsuarioID,
        nombreCompleto: user.NombreCompleto,
        email: user.Email,
        rol: user.Rol
      }
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

// GET /api/auth/me
async function getMe(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('usuarioID', sql.Int, req.user.usuarioID)
      .query('SELECT UsuarioID, NombreCompleto, Email, Rol, FechaRegistro FROM Usuarios WHERE UsuarioID = @usuarioID');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const user = result.recordset[0];

    // If Docente/Auxiliar, also fetch profile info
    if (user.Rol === 'Docente' || user.Rol === 'Auxiliar') {
      const perfil = await pool.request()
        .input('usuarioID', sql.Int, user.UsuarioID)
        .query(`
          SELECT p.PerfilID, p.PrecioPorHora, p.CalificacionPromedio, p.TotalResenas, p.Biografia
          FROM PerfilesDocentes p
          WHERE p.UsuarioID = @usuarioID
        `);

      if (perfil.recordset.length > 0) {
        user.perfil = perfil.recordset[0];

        // Fetch associated subjects
        const materias = await pool.request()
          .input('perfilID', sql.Int, user.perfil.PerfilID)
          .query(`
            SELECT m.MateriaID, m.NombreMateria
            FROM Docente_Materia dm
            JOIN Materias m ON dm.MateriaID = m.MateriaID
            WHERE dm.PerfilID = @perfilID
          `);
        user.perfil.materias = materias.recordset;
      }
    }

    res.json({ user });
  } catch (err) {
    console.error('Error en getMe:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

module.exports = { register, login, getMe };
