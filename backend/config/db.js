const sql = require('mssql/msnodesqlv8');

const dbConfig = {
  connectionString: 'Driver={SQL Server Native Client 11.0};Server=.;Database=MiProfe;Trusted_Connection=yes;'
};

let pool;

async function getPool() {
  if (!pool) {
    try {
      // Try with SQL Server Native Client 11.0 first
      pool = await sql.connect(dbConfig);
      console.log('✅ Conectado a SQL Server - Base de datos MiProfe');
    } catch (err) {
      // Fallback: try ODBC Driver 17 or 18
      try {
        const fallbackConfig = {
          connectionString: 'Driver={ODBC Driver 18 for SQL Server};Server=.;Database=MiProfe;Trusted_Connection=yes;TrustServerCertificate=yes;'
        };
        pool = await sql.connect(fallbackConfig);
        console.log('✅ Conectado a SQL Server (ODBC Driver 18) - Base de datos MiProfe');
      } catch (err2) {
        const fallbackConfig2 = {
          connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=.;Database=MiProfe;Trusted_Connection=yes;'
        };
        pool = await sql.connect(fallbackConfig2);
        console.log('✅ Conectado a SQL Server (ODBC Driver 17) - Base de datos MiProfe');
      }
    }
  }
  return pool;
}

module.exports = { sql, getPool };
