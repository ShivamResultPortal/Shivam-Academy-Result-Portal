import { StudentResult } from './types';

export const DEFAULT_RESULTS: StudentResult[] = [
  {
    id: '1',
    rollNo: 'NS-101',
    studentName: 'Aarav Patel',
    subject: 'Mathematics',
    marksObtained: 96,
    totalMarks: 100,
    passingMarks: 40,
  },
  {
    id: '2',
    rollNo: 'NS-102',
    studentName: 'Diya Menon',
    subject: 'Mental Ability (MAT)',
    marksObtained: 93,
    totalMarks: 100,
    passingMarks: 40,
  },
  {
    id: '3',
    rollNo: 'NS-103',
    studentName: 'Rohan Gupta',
    subject: 'Mathematics',
    marksObtained: 89,
    totalMarks: 100,
    passingMarks: 40,
  },
  {
    id: '4',
    rollNo: 'NS-104',
    studentName: 'Sneha Rao',
    subject: 'English',
    marksObtained: 84,
    totalMarks: 100,
    passingMarks: 40,
  },
  {
    id: '5',
    rollNo: 'NS-105',
    studentName: 'Aditya Roy',
    subject: 'General Science',
    marksObtained: 76,
    totalMarks: 100,
    passingMarks: 40,
  },
  {
    id: '6',
    rollNo: 'NS-106',
    studentName: 'Kavya Sharma',
    subject: 'Mental Ability (MAT)',
    marksObtained: 68,
    totalMarks: 100,
    passingMarks: 40,
  },
  {
    id: '7',
    rollNo: 'NS-107',
    studentName: 'Manish Verma',
    subject: 'Mathematics',
    marksObtained: 35,
    totalMarks: 100,
    passingMarks: 40,
  },
];

export const STORAGE_KEY = 'nsa_student_results_v1';

export function getNextRollNo(results: StudentResult[]): string {
  if (!results || results.length === 0) return 'NS-101';
  let maxNum = 100;
  results.forEach((r) => {
    const match = r.rollNo.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  return `NS-${maxNum + 1}`;
}
