-- Shivam Academy Result Portal - PostgreSQL Schema

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) DEFAULT 'Administrator',
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Student Results
CREATE TABLE IF NOT EXISTS student_results (
    id VARCHAR(64) PRIMARY KEY,
    roll_no VARCHAR(50) NOT NULL,
    student_name VARCHAR(150) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    marks_obtained NUMERIC(6, 2) NOT NULL,
    total_marks NUMERIC(6, 2) NOT NULL DEFAULT 100.00,
    passing_marks NUMERIC(6, 2) NOT NULL DEFAULT 40.00,
    percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'PASS',
    grade VARCHAR(10) NOT NULL DEFAULT 'A',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Helpful Indexes for high-performance searching and filtering
CREATE INDEX IF NOT EXISTS idx_student_results_roll_no ON student_results(roll_no);
CREATE INDEX IF NOT EXISTS idx_student_results_student_name ON student_results(student_name);
CREATE INDEX IF NOT EXISTS idx_student_results_subject ON student_results(subject);
CREATE INDEX IF NOT EXISTS idx_student_results_percentage ON student_results(percentage DESC);
