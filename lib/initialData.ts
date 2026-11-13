import { StudentResult } from './types';

export const DEFAULT_RESULTS: StudentResult[] = [];

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
