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

export const INITIAL_STUDENTS = [
  {
    id: 'nsa-101',
    rollNo: 'NS-101',
    studentName: 'Aarav Patel',
    subject: 'Mathematics',
    marksObtained: 96,
    totalMarks: 100,
    passingMarks: 40,
    remarks: 'Outstanding performance. Merit Rank 1.',
  },
  {
    id: 'nsa-102',
    rollNo: 'NS-102',
    studentName: 'Diya Menon',
    subject: 'Mental Ability (MAT)',
    marksObtained: 93,
    totalMarks: 100,
    passingMarks: 40,
    remarks: 'Exceptional speed in spatial reasoning.',
  },
  {
    id: 'nsa-103',
    rollNo: 'NS-103',
    studentName: 'Rohan Gupta',
    subject: 'Mathematics',
    marksObtained: 89,
    totalMarks: 100,
    passingMarks: 40,
    remarks: 'Great problem solving skills.',
  },
  {
    id: 'nsa-104',
    rollNo: 'NS-104',
    studentName: 'Sneha Rao',
    subject: 'English',
    marksObtained: 84,
    totalMarks: 100,
    passingMarks: 40,
    remarks: 'Excellent comprehension and grammar.',
  },
  {
    id: 'nsa-105',
    rollNo: 'NS-105',
    studentName: 'Aditya Roy',
    subject: 'General Science',
    marksObtained: 76,
    totalMarks: 100,
    passingMarks: 40,
    remarks: 'Good grasp of general science concepts.',
  },
  {
    id: 'nsa-106',
    rollNo: 'NS-106',
    studentName: 'Kavya Sharma',
    subject: 'Mental Ability (MAT)',
    marksObtained: 68,
    totalMarks: 100,
    passingMarks: 40,
    remarks: 'Steady improvement in pattern recognition.',
  },
  {
    id: 'nsa-107',
    rollNo: 'NS-107',
    studentName: 'Manish Verma',
    subject: 'Mathematics',
    marksObtained: 35,
    totalMarks: 100,
    passingMarks: 40,
    remarks: 'Needs improvement in fractions and geometry.',
  },
  {
    id: 'nsa-108',
    rollNo: 'NS-108',
    studentName: 'Ananya Deshmukh',
    subject: 'Mental Ability (MAT)',
    marksObtained: 88,
    totalMarks: 100,
    passingMarks: 40,
    remarks: 'High accuracy in coding-decoding questions.',
  },
  {
    id: 'nsa-109',
    rollNo: 'NS-109',
    studentName: 'Vikramaditya Rathore',
    subject: 'General Science',
    marksObtained: 91,
    totalMarks: 100,
    passingMarks: 40,
    remarks: 'Top scorer in Sainik School General Science test.',
  },
  {
    id: 'nsa-110',
    rollNo: 'NS-110',
    studentName: 'Pooja Kulkarni',
    subject: 'Mathematics',
    marksObtained: 82,
    totalMarks: 100,
    passingMarks: 40,
    remarks: 'Consistent score across all chapters.',
  },
];

export async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  // Ensure tables exist first
  await runMigrations();

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Seed Admin User
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
      // Update password hash to match current environment configuration
      await client.query(
        `UPDATE admin_users SET password_hash = $1, full_name = $2 WHERE username = $3`,
        [passwordHash, 'Academy Administrator', adminUser]
      );
      console.log(`👤 Admin user [${adminUser}] updated.`);
    }

    // 2. Seed Student Results
    let insertedCount = 0;
    for (const student of INITIAL_STUDENTS) {
      const percentage = Number(((student.marksObtained / student.totalMarks) * 100).toFixed(2));
      const status = student.marksObtained >= student.passingMarks ? 'PASS' : 'FAIL';
      const grade = calculateGrade(percentage);

      await client.query(
        `INSERT INTO student_results (
            id, roll_no, student_name, subject, marks_obtained, 
            total_marks, passing_marks, percentage, status, grade, remarks
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET
            roll_no = EXCLUDED.roll_no,
            student_name = EXCLUDED.student_name,
            subject = EXCLUDED.subject,
            marks_obtained = EXCLUDED.marks_obtained,
            total_marks = EXCLUDED.total_marks,
            passing_marks = EXCLUDED.passing_marks,
            percentage = EXCLUDED.percentage,
            status = EXCLUDED.status,
            grade = EXCLUDED.grade,
            remarks = EXCLUDED.remarks,
            updated_at = CURRENT_TIMESTAMP`,
        [
          student.id,
          student.rollNo,
          student.studentName,
          student.subject,
          student.marksObtained,
          student.totalMarks,
          student.passingMarks,
          percentage,
          status,
          grade,
          student.remarks,
        ]
      );
      insertedCount++;
    }

    await client.query('COMMIT');
    console.log(`🎉 Seeding complete! Inserted/Updated ${insertedCount} student result records.`);
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed, rolled back transaction:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Allow running directly from CLI via: npm run seed
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeder finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
