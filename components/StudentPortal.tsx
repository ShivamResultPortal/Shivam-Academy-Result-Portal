'use client';

import React, { useState, useMemo } from 'react';
import { Subject, StudentResult, DeclarationSession } from '../types/result';

interface StudentPortalProps {
  subjects: Subject[];
  sessions: DeclarationSession[];
  results: StudentResult[];
}

export default function StudentPortal({ subjects, sessions, results }: StudentPortalProps) {
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExamFilter, setSelectedExamFilter] = useState('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState('ALL');
  const [viewingStudentRoll, setViewingStudentRoll] = useState<string | null>(null);

  // Set of declared subject IDs
  const declaredSessions = useMemo(() => {
    return sessions.filter((s) => s.isDeclared);
  }, [sessions]);

  const declaredSubjectIds = useMemo(() => {
    return new Set(declaredSessions.map((s) => s.subjectId));
  }, [declaredSessions]);

  // Unique declared Exam Names for filter
  const uniqueExams = useMemo(() => {
    const names = new Set<string>();
    declaredSessions.forEach((s) => {
      if (s.examName) names.add(s.examName);
    });
    return Array.from(names);
  }, [declaredSessions]);

  // Unique declared Exam Dates for filter
  const uniqueDates = useMemo(() => {
    const dates = new Set<string>();
    declaredSessions.forEach((s) => {
      if (s.examDate) dates.add(s.examDate);
    });
    return Array.from(dates).sort().reverse();
  }, [declaredSessions]);

  // Combine each declared result with its subject and exam session info
  const declaredRecords = useMemo(() => {
    return results
      .filter((r) => declaredSubjectIds.has(r.subjectId))
      .map((r) => {
        const sub = subjects.find((s) => s.id === r.subjectId);
        const session = sessions.find((s) => s.subjectId === r.subjectId);
        return {
          result: r,
          subject: sub,
          session,
          examName: session?.examName || 'Entrance Mock Test',
          examDate: session?.examDate || '2026-11-12',
        };
      });
  }, [results, declaredSubjectIds, subjects, sessions]);

  // Filtered tabular records based on:
  // 1. Student Name (or Roll No)
  // 2. Exam Filter
  // 3. Exam Date Filter
  const filteredRecords = useMemo(() => {
    return declaredRecords.filter(({ result, examName, examDate }) => {
      // Student Name or Roll Number search
      const matchesSearch =
        searchTerm.trim() === '' ||
        result.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        result.rollNo.toLowerCase().includes(searchTerm.toLowerCase().trim());

      // Filter by Exam Name
      const matchesExam =
        selectedExamFilter === 'ALL' || examName === selectedExamFilter;

      // Filter by Exam Date
      const matchesDate =
        selectedDateFilter === 'ALL' || examDate === selectedDateFilter;

      return matchesSearch && matchesExam && matchesDate;
    });
  }, [declaredRecords, searchTerm, selectedExamFilter, selectedDateFilter]);

  // Format date helper (e.g. 2026-11-12 -> 12 Nov 2026)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Student specific data for Scorecard Modal
  const selectedStudentInfo = useMemo(() => {
    if (!viewingStudentRoll) return null;
    const match = results.find((r) => r.rollNo === viewingStudentRoll);
    if (!match) return null;

    const studentRecords = declaredRecords.filter((d) => d.result.rollNo === viewingStudentRoll);
    const totalScored = studentRecords.reduce((acc, curr) => acc + curr.result.totalMarks, 0);
    const totalMax = studentRecords.reduce(
      (acc, curr) => acc + ((curr.subject?.maxInternal || 0) + (curr.subject?.maxExternal || 0)),
      0
    );
    const overallPercentage = totalMax > 0 ? Math.round((totalScored / totalMax) * 100) : 0;
    const isAllQualified = studentRecords.every((r) => r.result.status === 'QUALIFIED');

    return {
      rollNo: match.rollNo,
      name: match.name,
      records: studentRecords,
      totalScored,
      totalMax,
      overallPercentage,
      isAllQualified,
    };
  }, [viewingStudentRoll, results, declaredRecords]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md border border-amber-300">
                Navodaya & Sainik School Academy
              </span>
              <span className="text-xs font-semibold text-slate-500">
                JNVST & AISSEE Entrance Preparation
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mt-2">
              Cadet Examination Results Ledger
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Declared examination results for Navodaya (JNVST) & Sainik School (AISSEE) entrance tests.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <strong className="text-indigo-700">{uniqueExams.length}</strong> Declared Exams
            </span>
            <span className="text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <strong className="text-indigo-700">{declaredRecords.length}</strong> Published Scores
            </span>
          </div>
        </div>

        {/* Filter Toolbar: Student Name Search, Filter by Exam, Filter by Exam Date */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          {/* 1. Student Name Search */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Search by Student Name (or Cadet Roll No)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type student name (e.g. Aarav, Diya, Rohan, Sneha...)"
                className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 font-medium placeholder-slate-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 2. Filter by Exams */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Filter by Exams
            </label>
            <select
              value={selectedExamFilter}
              onChange={(e) => setSelectedExamFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
            >
              <option value="ALL">All Exams ({uniqueExams.length})</option>
              {uniqueExams.map((exam) => (
                <option key={exam} value={exam}>
                  {exam}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Filter by Exam Date */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Filter by Exam Date
            </label>
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
            >
              <option value="ALL">All Exam Dates ({uniqueDates.length})</option>
              {uniqueDates.map((d) => (
                <option key={d} value={d}>
                  {formatDate(d)} ({d})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Search Student Name Pills */}
        <div className="mt-3.5 flex items-center gap-2 text-xs text-slate-500 flex-wrap">
          <span className="font-semibold text-slate-600">Quick Student Search:</span>
          {['Aarav Patel', 'Diya Menon', 'Rohan Gupta', 'Sneha Rao', 'Aditya Roy'].map((name) => (
            <button
              key={name}
              onClick={() => setSearchTerm(name)}
              className={`px-2.5 py-0.5 rounded-full border transition-all ${
                searchTerm.toLowerCase() === name.toLowerCase()
                  ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              {name}
            </button>
          ))}
          {(searchTerm || selectedExamFilter !== 'ALL' || selectedDateFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedExamFilter('ALL');
                setSelectedDateFilter('ALL');
              }}
              className="text-xs text-rose-600 hover:underline font-semibold ml-1"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Tabular Results Ledger */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-base">Results Table</span>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold border border-indigo-200">
              {filteredRecords.length} Cadet Record{filteredRecords.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              {filteredRecords.filter((r) => r.result.status === 'QUALIFIED').length} Qualified
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              {filteredRecords.filter((r) => r.result.status === 'NEEDS IMPROVEMENT').length} Needs Improvement
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 tracking-wider border-b border-slate-200">
              <tr>
                <th scope="col" className="px-5 py-3.5">Student Name</th>
                <th scope="col" className="px-4 py-3.5">Roll No</th>
                <th scope="col" className="px-5 py-3.5">Exam Name</th>
                <th scope="col" className="px-4 py-3.5">Exam Date</th>
                <th scope="col" className="px-4 py-3.5">Subject</th>
                <th scope="col" className="px-3 py-3.5 text-center">Score</th>
                <th scope="col" className="px-3 py-3.5 text-center">% Score</th>
                <th scope="col" className="px-3 py-3.5 text-center">Grade / Rank</th>
                <th scope="col" className="px-4 py-3.5 text-center">Result</th>
                <th scope="col" className="px-5 py-3.5 text-right">Scorecard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                    <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-semibold text-slate-700">No Cadet Examination Records Found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      No results matched your selected Exam, Date, or Student Name filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map(({ result, subject, examName, examDate }) => {
                  const maxMarks = (subject?.maxInternal || 0) + (subject?.maxExternal || 0);
                  const isQualified = result.status === 'QUALIFIED';

                  return (
                    <tr
                      key={`${result.rollNo}-${result.subjectId}-${examDate}`}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      {/* Student Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs flex-shrink-0 border border-amber-200">
                            {result.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                              {result.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">
                              {subject?.classLevel || 'Class 6 Entrance'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Roll Number */}
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-700">
                        {result.rollNo}
                      </td>

                      {/* Exam Name */}
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-800 text-xs block">
                          {examName}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {subject?.targetExam || 'Entrance Series'}
                        </span>
                      </td>

                      {/* Exam Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(examDate)}
                        </span>
                      </td>

                      {/* Subject */}
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-slate-800 text-xs block">
                          {subject?.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {subject?.code}
                        </span>
                      </td>

                      {/* Score */}
                      <td className="px-3 py-3.5 text-center font-bold text-slate-900 text-sm">
                        {result.totalMarks}
                        <span className="text-[11px] text-slate-400 font-normal">/{maxMarks}</span>
                      </td>

                      {/* Percentage */}
                      <td className="px-3 py-3.5 text-center font-bold text-slate-800 text-xs">
                        {result.percentage}%
                      </td>

                      {/* Grade / Rank */}
                      <td className="px-3 py-3.5 text-center">
                        <span className="inline-block px-2 py-0.5 font-bold rounded text-xs bg-slate-100 text-slate-800">
                          {result.grade}
                        </span>
                      </td>

                      {/* Result Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                            isQualified
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {result.status}
                        </span>
                      </td>

                      {/* Scorecard Action */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setViewingStudentRoll(result.rollNo)}
                          className="px-2.5 py-1 text-xs font-bold text-indigo-700 hover:text-white bg-indigo-50 hover:bg-indigo-600 rounded-md transition-colors inline-flex items-center gap-1 border border-indigo-200"
                        >
                          <span>Scorecard</span>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Cadet Scorecard Modal */}
      {viewingStudentRoll && selectedStudentInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center font-serif text-lg font-bold text-amber-300">
                  NSA
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">NAVODAYA & SAINIK SCHOOL ACADEMY</h3>
                  <p className="text-[11px] text-amber-200/90 font-medium">
                    JNVST & AISSEE Cadet Evaluation Scorecard
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Scorecard
                </button>
                <button
                  onClick={() => setViewingStudentRoll(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Cadet Info Bar */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Cadet / Student Name</span>
                <p className="font-bold text-slate-900 text-base">{selectedStudentInfo.name}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Cadet Roll No</span>
                <p className="font-mono font-bold text-indigo-700 text-base">{selectedStudentInfo.rollNo}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Target Entrance</span>
                <p className="font-semibold text-slate-800">AISSEE & JNVST 2027</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Class Batch</span>
                <p className="font-semibold text-slate-800">Class 6 Entrance Batch</p>
              </div>
            </div>

            {/* Declared Exam Scores Table */}
            <div className="p-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Official Declared Exam Results
              </h4>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-100 text-xs font-bold uppercase text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Exam Name</th>
                      <th className="px-3 py-2.5">Exam Date</th>
                      <th className="px-4 py-2.5">Subject</th>
                      <th className="px-3 py-2.5 text-center">Marks Scored</th>
                      <th className="px-3 py-2.5 text-center">% Score</th>
                      <th className="px-3 py-2.5 text-center">Grade</th>
                      <th className="px-4 py-2.5 text-center">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedStudentInfo.records.map(({ subject, result, examName, examDate }) => {
                      const maxTotal = (subject?.maxInternal || 0) + (subject?.maxExternal || 0);
                      return (
                        <tr key={`${subject?.id}-${examDate}`} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-semibold text-slate-800 text-xs">{examName}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-600 font-mono">{formatDate(examDate)}</td>
                          <td className="px-4 py-2.5 font-medium text-slate-900 text-xs">{subject?.name}</td>
                          <td className="px-3 py-2.5 text-center font-bold text-slate-900">
                            {result.totalMarks} <span className="text-[11px] text-slate-400 font-normal">/{maxTotal}</span>
                          </td>
                          <td className="px-3 py-2.5 text-center font-bold text-slate-800">{result.percentage}%</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="px-2 py-0.5 rounded font-bold text-xs bg-slate-100 text-slate-800">
                              {result.grade}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                result.status === 'QUALIFIED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {result.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Total Aggregate Card */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 uppercase font-bold">Aggregate Score</span>
                    <p className="font-extrabold text-slate-900 text-lg">
                      {selectedStudentInfo.totalScored} / {selectedStudentInfo.totalMax}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase font-bold">Overall Percentage</span>
                    <p className="font-extrabold text-indigo-700 text-lg">
                      {selectedStudentInfo.overallPercentage}%
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase font-bold">Final Status</span>
                    <p className="font-bold text-emerald-700 text-base">
                      {selectedStudentInfo.isAllQualified ? 'QUALIFIED FOR SELECTION' : 'NEEDS PRACTICE'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setViewingStudentRoll(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
