# Subject Result Declaration Portal (Next.js)

A full-featured academic **Result Declaration Portal** built with **Next.js 14 (App Router)**, **TypeScript**, and **Tailwind CSS**.

---

## 🌟 Key Features

### 1. 🎓 Faculty / Evaluator Portal
- **Subject-Wise Evaluation**: Easily select or switch between subjects (e.g. *Database Management Systems*, *Computer Networks*, etc.).
- **One-Click Official Declaration**: Toggle status between **`Draft (Unpublished)`** and **`Declared & Published`**. When results are declared, they instantly become accessible to students.
- **Dynamic Grading & Validation**:
  - Automatically calculates **Total Marks**, **Percentage**, **Letter Grade** (O, A+, A, B+, B, C, F), and **Pass/Fail status** based on customizable pass percentages.
  - Enforces internal and external mark limits.
- **Class Analytics**:
  - Total Enrolled Students
  - Pass Percentage
  - Failed / Backlog count
  - Class Average Score
  - Class Highest Score
- **Course & Subject Manager**: Add new subjects with custom codes, semester, credit weightages, and internal/external mark splits.

### 2. 🔍 Student Result Verification Portal
- **Roll Number Lookup**: Students search by their University Roll / Registration Number (e.g., `CS2026-001`).
- **Real-Time Moderation Status**:
  - Shows officially **Declared subjects** with full breakdown.
  - Transparently highlights subjects currently **Awaiting Declaration** in moderation.
- **Official Provisional Marksheet / Grade Card**:
  - University header with seal styling.
  - Subject-by-subject credits, marks, letter grades, and grade points.
  - Automatic **SGPA** (Semester Grade Point Average) and **Division status** (e.g., *First Class with Distinction*, *Pass*, etc.).
  - **Print / Save as PDF** button formatted for standard A4 printing.

### 3. 💾 Client-Side Persistence
- Uses browser `localStorage` to synchronize marks, subjects, and declaration status in real time without needing an external database setup. Pre-loaded with realistic sample data.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js (version 18 or newer) installed. If you do not have Node.js installed yet on Windows, you can install it via PowerShell:
```powershell
winget install OpenJS.NodeJS.LTS
```
*(After installing, restart your terminal).*

### Running the App
1. Open PowerShell and navigate to the project directory:
   ```powershell
   cd C:\Users\vadar\.gemini\antigravity\scratch\result-declaration-portal
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Start the Next.js development server:
   ```powershell
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
