export interface StudentResult {
  id: string;
  rollNo: string;
  studentName: string;
  subject: string;
  marksObtained: number;
  totalMarks: number;
  passingMarks: number;
  percentage?: number;
  status?: string;
  grade?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OverviewStats {
  totalStudents: number;
  passedCount: number;
  failedCount: number;
  averagePercentage: number;
  highestScore: number;
}
