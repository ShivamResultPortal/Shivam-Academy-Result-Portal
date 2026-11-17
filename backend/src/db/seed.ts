import bcrypt from 'bcryptjs';
import { pool } from '../config/db';
import { runMigrations } from './migrate';

export function calculateGrade(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'E';
}

// Production clean seed: No dummy student records
export const INITIAL_STUDENTS: any[] = [];

export async function seedDatabase() {
  console.log('🌱 Starting database setup...');

  // Ensure tables exist first
  await runMigrations();

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Seed / Upsert Production Admin User
    const adminUser = process.env.DEFAULT_ADMIN_USERNAME || 'shivamacademy.result@gmail.com';
    const adminPass = process.env.DEFAULT_ADMIN_PASSWORD || '1N2s{J8hyfrJ18}@';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPass, salt);

    // Upsert primary admin user
    await client.query(
      `INSERT INTO admin_users (username, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO UPDATE SET
         password_hash = EXCLUDED.password_hash`,
      [adminUser, passwordHash, 'Academy Administrator', 'admin']
    );
    console.log(`👤 Admin user created/synced: [${adminUser}]`);

    // Also support 'admin' alias with the same password so both email and 'admin' work
    if (adminUser.toLowerCase() !== 'admin') {
      await client.query(
        `INSERT INTO admin_users (username, password_hash, full_name, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (username) DO UPDATE SET
           password_hash = EXCLUDED.password_hash`,
        ['admin', passwordHash, 'Academy Administrator', 'admin']
      );
      console.log(`👤 Alias admin user created/synced: [admin]`);
    }

    await client.query('COMMIT');
    console.log('✅ Database setup complete! Ready for production.');
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Database setup failed, rolled back:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Allow running directly from CLI via: npm run seed
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Setup finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
