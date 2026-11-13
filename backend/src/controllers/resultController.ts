import { Request, Response } from 'express';
import { query } from '../config/db';
import { calculateGrade, INITIAL_STUDENTS } from '../db/seed';

// Map database row (snake_case) to Frontend StudentResult (camelCase)
export const formatResultRow = (row: any) => ({
  id: row.id,
  rollNo: row.roll_no,
  studentName: row.student_name,
  subject: row.subject,
  marksObtained: parseFloat(row.marks_obtained),
  totalMarks: parseFloat(row.total_marks),
  passingMarks: parseFloat(row.passing_marks),
  percentage: parseFloat(row.percentage),
  status: row.status,
  grade: row.grade,
  remarks: row.remarks || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Local in-memory fallback store when PostgreSQL server is not connected locally
let localMemoryResults: any[] = INITIAL_STUDENTS.map((s) => {
  const percentage = Number(((s.marksObtained / s.totalMarks) * 100).toFixed(2));
  return {
    id: s.id,
    rollNo: s.rollNo,
    studentName: s.studentName,
    subject: s.subject,
    marksObtained: s.marksObtained,
    totalMarks: s.totalMarks,
    passingMarks: s.passingMarks,
    percentage,
    status: s.marksObtained >= s.passingMarks ? 'PASS' : 'FAIL',
    grade: calculateGrade(percentage),
    remarks: s.remarks,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
});

// GET /api/results
export const getAllResults = async (req: Request, res: Response) => {
  try {
    const { search, subject, sortBy, order } = req.query;

    let queryText = 'SELECT * FROM student_results WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (search && typeof search === 'string' && search.trim() !== '') {
      queryText += ` AND (LOWER(student_name) LIKE LOWER($${paramIndex}) OR LOWER(roll_no) LIKE LOWER($${paramIndex}))`;
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (subject && typeof subject === 'string' && subject.trim() !== '' && subject !== 'All') {
      queryText += ` AND LOWER(subject) = LOWER($${paramIndex})`;
      params.push(subject.trim());
      paramIndex++;
    }

    const allowedSortFields: Record<string, string> = {
      rollNo: 'roll_no',
      studentName: 'student_name',
      percentage: 'percentage',
      marksObtained: 'marks_obtained',
      createdAt: 'created_at',
    };

    const sortColumn = sortBy && allowedSortFields[sortBy as string] ? allowedSortFields[sortBy as string] : 'created_at';
    const sortOrder = order && (order as string).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    queryText += ` ORDER BY ${sortColumn} ${sortOrder}`;

    const result = await query(queryText, params);
    const formatted = result.rows.map(formatResultRow);

    return res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error: any) {
    // Graceful fallback to memory store
    console.warn(`⚠️ DB query failed (${error.code || error.message}). Serving from memory fallback.`);
    const { search, subject } = req.query;
    let filtered = [...localMemoryResults];

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (r) => r.studentName.toLowerCase().includes(q) || r.rollNo.toLowerCase().includes(q)
      );
    }
    if (subject && typeof subject === 'string' && subject.trim() !== '' && subject !== 'All') {
      filtered = filtered.filter((r) => r.subject.toLowerCase() === (subject as string).toLowerCase());
    }

    return res.json({
      success: true,
      count: filtered.length,
      data: filtered,
      fallback: true,
    });
  }
};

// GET /api/results/:id
export const getResultById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM student_results WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Student result record with ID ${id} was not found.`,
      });
    }

    return res.json({
      success: true,
      data: formatResultRow(result.rows[0]),
    });
  } catch (error: any) {
    const found = localMemoryResults.find((r) => r.id === req.params.id);
    if (found) {
      return res.json({ success: true, data: found });
    }
    return res.status(404).json({
      success: false,
      message: `Student result record with ID ${req.params.id} was not found.`,
    });
  }
};

// POST /api/results
export const createResult = async (req: Request, res: Response) => {
  const {
    id,
    rollNo,
    studentName,
    subject,
    marksObtained,
    totalMarks = 100,
    passingMarks = 40,
    remarks = '',
  } = req.body;

  if (!rollNo || !studentName || marksObtained === undefined || marksObtained === null) {
    return res.status(400).json({
      success: false,
      message: 'rollNo, studentName, and marksObtained are required.',
    });
  }

  const marksNum = Number(marksObtained);
  const totalNum = Number(totalMarks) || 100;
  const passingNum = Number(passingMarks) || 40;

  if (marksNum < 0 || marksNum > totalNum) {
    return res.status(400).json({
      success: false,
      message: `marksObtained must be between 0 and totalMarks (${totalNum}).`,
    });
  }

  const percentage = Number(((marksNum / totalNum) * 100).toFixed(2));
  const status = marksNum >= passingNum ? 'PASS' : 'FAIL';
  const grade = calculateGrade(percentage);
  const recordId = id || `nsa-${Date.now()}`;

  try {
    const insertQuery = `
      INSERT INTO student_results (
        id, roll_no, student_name, subject, marks_obtained,
        total_marks, passing_marks, percentage, status, grade, remarks
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await query(insertQuery, [
      recordId,
      rollNo.trim(),
      studentName.trim(),
      (subject || 'Mathematics').trim(),
      marksNum,
      totalNum,
      passingNum,
      percentage,
      status,
      grade,
      remarks,
    ]);

    const formatted = formatResultRow(result.rows[0]);
    localMemoryResults.push(formatted);

    return res.status(201).json({
      success: true,
      message: 'Student result created successfully.',
      data: formatted,
    });
  } catch (error: any) {
    console.warn(`⚠️ DB insert failed (${error.code || error.message}). Saving to memory fallback.`);
    const newRecord = {
      id: recordId,
      rollNo: rollNo.trim(),
      studentName: studentName.trim(),
      subject: (subject || 'Mathematics').trim(),
      marksObtained: marksNum,
      totalMarks: totalNum,
      passingMarks: passingNum,
      percentage,
      status,
      grade,
      remarks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localMemoryResults.push(newRecord);

    return res.status(201).json({
      success: true,
      message: 'Student result created successfully (offline cache).',
      data: newRecord,
    });
  }
};

// PUT /api/results/:id
export const updateResult = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    rollNo,
    studentName,
    subject,
    marksObtained,
    totalMarks,
    passingMarks,
    remarks,
  } = req.body;

  try {
    const existingCheck = await query('SELECT * FROM student_results WHERE id = $1', [id]);
    if (existingCheck.rows.length === 0) {
      throw new Error('Not found in DB');
    }

    const current = existingCheck.rows[0];
    const newRollNo = rollNo !== undefined ? rollNo.trim() : current.roll_no;
    const newStudentName = studentName !== undefined ? studentName.trim() : current.student_name;
    const newSubject = subject !== undefined ? subject.trim() : current.subject;
    const newMarksObtained = marksObtained !== undefined ? Number(marksObtained) : parseFloat(current.marks_obtained);
    const newTotalMarks = totalMarks !== undefined ? Number(totalMarks) : parseFloat(current.total_marks);
    const newPassingMarks = passingMarks !== undefined ? Number(passingMarks) : parseFloat(current.passing_marks);
    const newRemarks = remarks !== undefined ? remarks : current.remarks;

    const percentage = Number(((newMarksObtained / newTotalMarks) * 100).toFixed(2));
    const status = newMarksObtained >= newPassingMarks ? 'PASS' : 'FAIL';
    const grade = calculateGrade(percentage);

    const updateQuery = `
      UPDATE student_results
      SET roll_no = $1, student_name = $2, subject = $3, marks_obtained = $4,
          total_marks = $5, passing_marks = $6, percentage = $7, status = $8,
          grade = $9, remarks = $10, updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `;

    const result = await query(updateQuery, [
      newRollNo,
      newStudentName,
      newSubject,
      newMarksObtained,
      newTotalMarks,
      newPassingMarks,
      percentage,
      status,
      grade,
      newRemarks,
      id,
    ]);

    return res.json({
      success: true,
      message: 'Student result updated successfully.',
      data: formatResultRow(result.rows[0]),
    });
  } catch (error: any) {
    const idx = localMemoryResults.findIndex((r) => r.id === id);
    if (idx !== -1) {
      const cur = localMemoryResults[idx];
      const newMarks = marksObtained !== undefined ? Number(marksObtained) : cur.marksObtained;
      const newTotal = totalMarks !== undefined ? Number(totalMarks) : cur.totalMarks;
      const newPass = passingMarks !== undefined ? Number(passingMarks) : cur.passingMarks;
      const pct = Number(((newMarks / newTotal) * 100).toFixed(2));

      localMemoryResults[idx] = {
        ...cur,
        rollNo: rollNo !== undefined ? rollNo.trim() : cur.rollNo,
        studentName: studentName !== undefined ? studentName.trim() : cur.studentName,
        subject: subject !== undefined ? subject.trim() : cur.subject,
        marksObtained: newMarks,
        totalMarks: newTotal,
        passingMarks: newPass,
        percentage: pct,
        status: newMarks >= newPass ? 'PASS' : 'FAIL',
        grade: calculateGrade(pct),
        remarks: remarks !== undefined ? remarks : cur.remarks,
        updatedAt: new Date().toISOString(),
      };

      return res.json({
        success: true,
        message: 'Student result updated successfully (memory fallback).',
        data: localMemoryResults[idx],
      });
    }

    return res.status(404).json({
      success: false,
      message: `Student result with ID ${id} not found.`,
    });
  }
};

// DELETE /api/results/:id
export const deleteResult = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM student_results WHERE id = $1 RETURNING id, student_name', [id]);
    if (result.rows.length === 0) {
      throw new Error('Not found in DB');
    }
    localMemoryResults = localMemoryResults.filter((r) => r.id !== id);
    return res.json({
      success: true,
      message: `Deleted result for ${result.rows[0].student_name}.`,
      id,
    });
  } catch (error: any) {
    const found = localMemoryResults.find((r) => r.id === id);
    if (found) {
      localMemoryResults = localMemoryResults.filter((r) => r.id !== id);
      return res.json({
        success: true,
        message: `Deleted result for ${found.studentName} (memory fallback).`,
        id,
      });
    }
    return res.status(404).json({
      success: false,
      message: `Student result with ID ${id} not found.`,
    });
  }
};

// GET /api/results/stats/overview
export const getOverviewStats = async (_req: Request, res: Response) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*)::int as total_students,
        COUNT(CASE WHEN status = 'PASS' THEN 1 END)::int as passed_count,
        COUNT(CASE WHEN status = 'FAIL' THEN 1 END)::int as failed_count,
        COALESCE(ROUND(AVG(percentage), 2), 0)::float as avg_percentage,
        COALESCE(MAX(marks_obtained), 0)::float as max_marks
      FROM student_results
    `;
    const statsResult = await query(statsQuery);
    const stats = statsResult.rows[0];

    const topScorersResult = await query(`
      SELECT * FROM student_results
      ORDER BY percentage DESC, marks_obtained DESC
      LIMIT 5
    `);
    const topScorers = topScorersResult.rows.map(formatResultRow);

    return res.json({
      success: true,
      stats: {
        totalStudents: stats.total_students,
        passedCount: stats.passed_count,
        failedCount: stats.failed_count,
        averagePercentage: stats.avg_percentage,
        highestScore: stats.max_marks,
      },
      topScorers,
    });
  } catch (error: any) {
    const total = localMemoryResults.length;
    const passed = localMemoryResults.filter((r) => r.status === 'PASS').length;
    const failed = total - passed;
    const avg = total > 0 ? Number((localMemoryResults.reduce((acc, r) => acc + r.percentage, 0) / total).toFixed(2)) : 0;
    const max = total > 0 ? Math.max(...localMemoryResults.map((r) => r.marksObtained)) : 0;

    const topScorers = [...localMemoryResults]
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    return res.json({
      success: true,
      stats: {
        totalStudents: total,
        passedCount: passed,
        failedCount: failed,
        averagePercentage: avg,
        highestScore: max,
      },
      topScorers,
    });
  }
};

// POST /api/results/bulk
export const bulkImportResults = async (req: Request, res: Response) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'items array must contain at least one result record.',
    });
  }

  const inserted: any[] = [];
  for (const item of items) {
    const marksNum = Number(item.marksObtained);
    const totalNum = Number(item.totalMarks) || 100;
    const passingNum = Number(item.passingMarks) || 40;
    const percentage = Number(((marksNum / totalNum) * 100).toFixed(2));
    const status = marksNum >= passingNum ? 'PASS' : 'FAIL';
    const grade = calculateGrade(percentage);
    const recordId = item.id || `nsa-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newRecord = {
      id: recordId,
      rollNo: item.rollNo,
      studentName: item.studentName,
      subject: item.subject || 'Mathematics',
      marksObtained: marksNum,
      totalMarks: totalNum,
      passingMarks: passingNum,
      percentage,
      status,
      grade,
      remarks: item.remarks || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inserted.push(newRecord);
  }

  localMemoryResults = [...localMemoryResults, ...inserted];

  return res.status(201).json({
    success: true,
    message: `Bulk imported ${inserted.length} results successfully.`,
    count: inserted.length,
    data: inserted,
  });
};
