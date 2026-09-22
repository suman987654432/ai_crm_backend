import fs from 'fs';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL);
const script = fs.readFileSync('./migrations/002_test_sessions.sql', 'utf8');
const statements = script.split(';').filter(s => s.trim().length > 0);

async function run() {
  try {
    for (let s of statements) {
      console.log('Running:', s);
      await sql.query(s);
    }
    console.log('Migration complete');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

run();
