import { pool } from './db';

async function main() {
  const [rows] = await pool.query('SELECT VERSION() AS version');
  console.log('Conexión exitosa. Versión de MySQL:', (rows as any)[0].version);
  await pool.end();
}

main().catch(err => {
  console.error('Error de conexión:', err);
  process.exit(1);
});
