import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const caPath = path.resolve(process.cwd(), process.env.DB_CA_PATH ?? './certs/aiven-ca.pem');

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  // El servidor MySQL guarda TIMESTAMP/DATETIME en UTC, pero mysql2 por defecto
  // los interpreta como si ya estuvieran en la zona horaria local del proceso
  // Node, duplicando el desfase horario. Con 'Z' los toma tal cual como UTC.
  timezone: 'Z',
  ssl: {
    ca: fs.readFileSync(caPath, 'utf8'),
  },
  waitForConnections: true,
  connectionLimit: 10,
});
