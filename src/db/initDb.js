import pool from '../config/db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDb() {
  const client = await pool.connect();

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    console.log('Initializing database...');
    // Split schema into individual statements
    const statements = schema.split(';').filter(s => s.trim().length > 0);
    for (const statement of statements) {
      await client.query(statement);
    }
    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Error initializing database:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

initDb();
