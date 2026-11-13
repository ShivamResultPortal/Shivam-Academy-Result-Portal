export interface Subject {
  id: string;
  code: string;
  name: string;
  targetExam: string;
  classLevel: string;
  credits: number;
  maxInternal: number;
  maxExternal: number;
  passPercentage: number;
}

export interface DeclarationSession {
  subjectId: string;
  examName: string;
  examDate: string;
  classLevel: string;
  academicYear: string;
  examSession: string;
  isDeclared: boolean;
  declarationDate: string | null;
  evaluatorName: string;
  announcementNote: string;
}

export interface StudentResult {
  id: string;
  rollNo: string;
  name: string;
  studentName?: string;
  subjectId: string;
  subject?: string;
  internalMarks: number;
  externalMarks: number;
  marksObtained?: number;
  totalMarks: number;
  passingMarks?: number;
  percentage?: number;
  grade?: string;
  gradePoint?: number;
  status?: string;
  remarks?: string;
}
