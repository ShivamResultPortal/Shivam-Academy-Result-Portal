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

    // 1. Seed Production Admin User if not already present
    const adminUser = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const adminPass = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPass, salt);

    const userCheck = await client.query('SELECT id FROM admin_users WHERE username = $1', [adminUser]);
    if (userCheck.rows.length === 0) {
      await client.query(
        `INSERT INTO admin_users (username, password_hash, full_name, role)
         VALUES ($1, $2, $3, $4)`,
        [adminUser, passwordHash, 'Academy Administrator', 'admin']
      );
      console.log(`👤 Admin user created: [${adminUser}] with secure hashed password.`);
    } else {
      console.log(`👤 Admin user [${adminUser}] verified.`);
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
