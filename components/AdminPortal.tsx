'use client';

import React, { useState } from 'react';
import { Subject, StudentResult, DeclarationSession } from '../types/result';
import { computeGrade } from '../data/initialData';

interface AdminPortalProps {
  subjects: Subject[];
  sessions: DeclarationSession[];
  results: StudentResult[];
  onUpdateSession: (updated: DeclarationSession) => void;
  onAddResult: (newRes: StudentResult) => void;
  onUpdateResult: (updated: StudentResult) => void;
  onDeleteResult: (id: string) => void;
  onOpenSubjectModal: () => void;
}

export default function AdminPortal({
  subjects,
  sessions,
  results,
  onUpdateSession,
  onAddResult,
  onUpdateResult,
  onDeleteResult,
  onOpenSubjectModal,
}: AdminPortalProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    subjects[0]?.id || ''
  );

  // New Student Input Form State
  const [newRollNo, setNewRollNo] = useState('');
  const [newName, setNewName] = useState('');
  const [newInternal, setNewInternal] = useState<number>(0);
  const [newExternal, setNewExternal] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState('');

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);
  const currentSession = sessions.find((s) => s.subjectId === selectedSubjectId) || {
    subjectId: selectedSubjectId,
    examName: 'AISSEE & JNVST Mock Test',
    examDate: new Date().toISOString().split('T')[0],
    classLevel: currentSubject?.classLevel || 'Class 6 Entrance',
    academicYear: '2026-2027',
    examSession: 'Winter 2026',
    isDeclared: false,
    declarationDate: null,
    evaluatorName: 'Chief Instructor',
    announcementNote: '',
  };

  const subjectResults = results.filter((r) => r.subjectId === selectedSubjectId);

  // Analytics calculation
  const totalStudents = subjectResults.length;
  const qualifiedStudents = subjectResults.filter((r) => r.status === 'QUALIFIED').length;
  const needsImprovementStudents = totalStudents - qualifiedStudents;
  const passRate = totalStudents > 0 ? ((qualifiedStudents / totalStudents) * 100).toFixed(1) : '0';
  const classAvg =
    totalStudents > 0
      ? (subjectResults.reduce((acc, curr) => acc + curr.totalMarks, 0) / totalStudents).toFixed(1)
      : '0';
  const highestMark = totalStudents > 0 ? Math.max(...subjectResults.map((r) => r.totalMarks)) : 0;
  const maxPossible = (currentSubject?.maxInternal || 20) + (currentSubject?.maxExternal || 80);

  const handleToggleDeclaration = () => {
    if (!currentSession.isDeclared) {
      if (subjectResults.length === 0) {
        alert('Cannot declare results with zero student records. Add marks first.');
        return;
      }
      const confirmDeclare = window.confirm(
        `Are you sure you want to DECLARE results for ${currentSession.examName} (${currentSubject?.name}) on ${currentSession.examDate}? Cadets will immediately be able to view their scores.`
      );
      if (!confirmDeclare) return;

      onUpdateSession({
        ...currentSession,
        isDeclared: true,
        declarationDate: new Date().toISOString(),
      });
    } else {
      const confirmRevert = window.confirm(
        'Reverting this result to DRAFT will hide it from the Cadet/Student portal. Do you want to proceed?'
      );
      if (!confirmRevert) return;

      onUpdateSession({
        ...currentSession,
        isDeclared: false,
      });
    }
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newRollNo.trim() || !newName.trim()) {
      setErrorMsg('Please enter Cadet Roll Number and Student Name.');
      return;
    }

    // Check duplicate roll number for same subject
    if (subjectResults.some((r) => r.rollNo.toLowerCase() === newRollNo.trim().toLowerCase())) {
      setErrorMsg(`Roll number ${newRollNo.trim()} already exists in this subject sheet.`);
      return;
    }

    if (!currentSubject) return;

    if (newInternal > currentSubject.maxInternal) {
      setErrorMsg(`Section A marks cannot exceed max (${currentSubject.maxInternal}).`);
      return;
    }
    if (newExternal > currentSubject.maxExternal) {
      setErrorMsg(`Section B / Main marks cannot exceed max (${currentSubject.maxExternal}).`);
      return;
    }

    const total = Number(newInternal) + Number(newExternal);
    const maxTotal = currentSubject.maxInternal + currentSubject.maxExternal;
    const percentage = Math.round((total / maxTotal) * 100);
    const gradeInfo = computeGrade(percentage, currentSubject.passPercentage);

    const record: StudentResult = {
      id: `res-${Date.now()}`,
      rollNo: newRollNo.trim().toUpperCase(),
      name: newName.trim(),
      subjectId: selectedSubjectId,
      internalMarks: Number(newInternal),
      externalMarks: Number(newExternal),
      totalMarks: total,
      percentage,
      grade: gradeInfo.grade,
      gradePoint: gradeInfo.gradePoint,
      status: gradeInfo.status,
    };

    onAddResult(record);
    setNewRollNo('');
    setNewName('');
    setNewInternal(0);
    setNewExternal(0);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Exam & Declaration Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md border border-amber-300">
                Academy Evaluator Panel
              </span>
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                  currentSession.isDeclared
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {currentSession.isDeclared ? '● Declared & Published' : '○ Draft Mode (Unpublished)'}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mt-2">
              Declare Exam & Subject Results
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Set the Exam Name, Exam Date, enter Cadet marks, and officially publish results to the Navodaya & Sainik School portal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenSubjectModal}
              className="px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add New Subject
            </button>

            <button
              onClick={handleToggleDeclaration}
              className={`px-5 py-2.5 text-sm font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 ${
                currentSession.isDeclared
                  ? 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-emerald-200 shadow-md'
              }`}
            >
              {currentSession.isDeclared ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Withdraw to Draft
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Declare Exam Result
                </>
              )}
            </button>
          </div>
        </div>

        {/* Exam Metadata Grid: Subject, Exam Name, Exam Date, Evaluator */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Target Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2.5 font-medium"
            >
              {subjects.map((sub) => {
                const sSession = sessions.find((s) => s.subjectId === sub.id);
                return (
                  <option key={sub.id} value={sub.id}>
                    [{sub.code}] {sub.name} — {sSession?.isDeclared ? '✓ Declared' : 'Draft'}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Exam Name *
            </label>
            <input
              type="text"
              value={currentSession.examName || ''}
              onChange={(e) =>
                onUpdateSession({ ...currentSession, examName: e.target.value })
              }
              placeholder="e.g. AISSEE Grand Mock Test - 1"
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2.5 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Exam Date *
            </label>
            <input
              type="date"
              value={currentSession.examDate || ''}
              onChange={(e) =>
                onUpdateSession({ ...currentSession, examDate: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2.5 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Chief Evaluator / Officer
            </label>
            <input
              type="text"
              value={currentSession.evaluatorName}
              onChange={(e) =>
                onUpdateSession({ ...currentSession, evaluatorName: e.target.value })
              }
              placeholder="e.g. Maj. (Retd.) Rathore"
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2.5"
            />
          </div>
        </div>

        {/* Declaration Notice */}
        <div className="mt-4">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Academy Notice / Instructions for Cadets
          </label>
          <input
            type="text"
            value={currentSession.announcementNote}
            onChange={(e) =>
              onUpdateSession({ ...currentSession, announcementNote: e.target.value })
            }
            placeholder="e.g. Cutoff marks for Sainik selection: 45%. Optical verification complete."
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2.5"
          />
        </div>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Enrolled Cadets</span>
          <div className="text-2xl font-bold text-slate-800 mt-1">{totalStudents}</div>
          <span className="text-xs text-slate-400">Total participants</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 uppercase">Qualified</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{qualifiedStudents}</div>
          <span className="text-xs text-emerald-700 font-medium">{passRate}% qualified</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-amber-600 uppercase">Needs Practice</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{needsImprovementStudents}</div>
          <span className="text-xs text-amber-700 font-medium">Extra coaching</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-indigo-500 uppercase">Batch Average</span>
          <div className="text-2xl font-bold text-indigo-700 mt-1">
            {classAvg} <span className="text-sm font-normal text-slate-400">/ {maxPossible}</span>
          </div>
          <span className="text-xs text-slate-400">Mean score</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 md:col-span-1">
          <span className="text-xs font-semibold text-amber-500 uppercase">Top Score</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {highestMark} <span className="text-sm font-normal text-slate-400">/ {maxPossible}</span>
          </div>
          <span className="text-xs text-amber-600 font-medium">Batch topper</span>
        </div>
      </div>

      {/* Enter Marks Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Enter Cadet Marks
          <span className="text-xs font-normal text-slate-500">
            (Internal Max: {currentSubject?.maxInternal}, External Max: {currentSubject?.maxExternal})
          </span>
        </h3>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Cadet Roll No *</label>
            <input
              type="text"
              value={newRollNo}
              onChange={(e) => setNewRollNo(e.target.value)}
              placeholder="e.g. NS-2026-006"
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Cadet / Student Name *</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Pranav Sharma"
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Section A / Internal ({currentSubject?.maxInternal})
            </label>
            <input
              type="number"
              min="0"
              max={currentSubject?.maxInternal}
              value={newInternal}
              onChange={(e) => setNewInternal(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Section B / Main ({currentSubject?.maxExternal})
            </label>
            <input
              type="number"
              min="0"
              max={currentSubject?.maxExternal}
              value={newExternal}
              onChange={(e) => setNewExternal(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg p-2.5"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-2.5 px-4 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Save Marks
            </button>
          </div>
        </form>
      </div>

      {/* Marks Sheet Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="font-semibold text-slate-800 flex items-center gap-2">
            <span>Result Ledger: {currentSession.examName} ({currentSubject?.name})</span>
            <span className="text-xs font-normal text-slate-500">
              ({subjectResults.length} Cadets)
            </span>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Exam Date: {currentSession.examDate}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 tracking-wider border-b border-slate-200">
              <tr>
                <th scope="col" className="px-5 py-3">Roll No</th>
                <th scope="col" className="px-5 py-3">Student Name</th>
                <th scope="col" className="px-4 py-3 text-center">Sec A ({currentSubject?.maxInternal})</th>
                <th scope="col" className="px-4 py-3 text-center">Sec B ({currentSubject?.maxExternal})</th>
                <th scope="col" className="px-4 py-3 text-center">Total ({maxPossible})</th>
                <th scope="col" className="px-4 py-3 text-center">% Score</th>
                <th scope="col" className="px-4 py-3 text-center">Grade</th>
                <th scope="col" className="px-4 py-3 text-center">Result</th>
                <th scope="col" className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjectResults.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-slate-400">
                    No results recorded yet for this exam session. Use the form above to add scores.
                  </td>
                </tr>
              ) : (
                subjectResults.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold font-mono text-slate-800">{res.rollNo}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{res.name}</td>
                    <td className="px-4 py-3.5 text-center">{res.internalMarks}</td>
                    <td className="px-4 py-3.5 text-center">{res.externalMarks}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-800">{res.totalMarks}</td>
                    <td className="px-4 py-3.5 text-center font-semibold">{res.percentage}%</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-block px-2 py-0.5 font-bold rounded text-xs bg-slate-100 text-slate-800">
                        {res.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          res.status === 'QUALIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {res.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete result for ${res.name} (${res.rollNo})?`)) {
                            onDeleteResult(res.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 transition-colors text-xs font-medium p-1"
                        title="Delete record"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
