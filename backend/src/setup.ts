import fs from 'fs';
import path from 'path';
import { pool } from './db';

async function main() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  // Saca las líneas de comentario antes de partir por ';', para que un ';' dentro
  // de un comentario no corte una sentencia a la mitad.
  const withoutComments = schema
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');
  const statements = withoutComments.split(';').map(s => s.trim()).filter(Boolean);
  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (err: any) {
      // ER_DUP_FIELDNAME: la columna ya existe. ER_DUP_KEYNAME: el índice ya existe.
      // Pasa en corridas repetidas del script.
      if (err.code !== 'ER_DUP_FIELDNAME' && err.code !== 'ER_DUP_KEYNAME') {
        throw err;
      }
    }
  }
  console.log('Base de datos creada/verificada: tablas, categorías y usuario admin.');
  await pool.end();
}

main().catch(err => {
  console.error('Error en el setup:', err);
  process.exit(1);
});
