import fs from 'fs';
import path from 'path';
import { pool } from '../config/db';

export async function runMigrations() {
  console.log('🔄 Running database migrations...');
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(sql);
    console.log('✅ Migrations executed successfully! Tables (admin_users, student_results) created/verified.');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

// Allow running directly from CLI via: npm run migrate
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Database schema is up to date.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
