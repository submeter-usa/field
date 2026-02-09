import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
// src\db\drizzle.ts
if (!process.env.NEON_DB_URL) {
  throw new Error('❌ Missing NEON_DB_URL');
}

const client = postgres(process.env.NEON_DB_URL, {
  ssl: 'require',
});

const db = drizzle(client);

export default db;
