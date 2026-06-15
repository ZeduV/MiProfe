const { sql, getPool } = require('../config/db');

const materias = [
  'Matemáticas',
  'Física',
  'Química',
  'Biología',
  'Programación',
  'Inglés',
  'Contabilidad',
  'Economía',
  'Derecho',
  'Estadística',
  'Cálculo',
  'Álgebra',
  'Historia',
  'Lenguaje y Literatura',
  'Filosofía',
  'Educación Cívica',
  'Geografía',
  'Informática',
  'Administración de Empresas',
  'Marketing'
];

async function seed() {
  try {
    const pool = await getPool();

    // Check if materias already exist
    const existing = await pool.request().query('SELECT COUNT(*) AS count FROM Materias');
    if (existing.recordset[0].count > 0) {
      console.log('ℹ️  Las materias ya están cargadas. Omitiendo seed.');
      process.exit(0);
    }

    for (const materia of materias) {
      await pool.request()
        .input('nombre', sql.VarChar, materia)
        .query('INSERT INTO Materias (NombreMateria) VALUES (@nombre)');
    }

    console.log(`✅ Se insertaron ${materias.length} materias exitosamente.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al hacer seed de materias:', err);
    process.exit(1);
  }
}

seed();
