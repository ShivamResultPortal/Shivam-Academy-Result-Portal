'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { StudentResult } from '../../lib/types';
import { DEFAULT_RESULTS, STORAGE_KEY, getNextRollNo } from '../../lib/initialData';
import {
  getStudentResults,
  loginAdminApi,
  createStudentResultApi,
  updateStudentResultApi,
  deleteStudentResultApi,
  getStoredToken,
  clearStoredToken,
} from '../../lib/api';
import TopScorers from '../../components/TopScorers';

export default function AdminPage() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Results Data State
  const [results, setResults] = useState<StudentResult[]>(DEFAULT_RESULTS);
  const [mounted, setMounted] = useState(false);

  // Table horizontal scrolling state
  const adminTableContainerRef = useRef<HTMLDivElement>(null);
  const [adminScrollProgress, setAdminScrollProgress] = useState(0);
  const [adminIsScrollable, setAdminIsScrollable] = useState(false);

  // New Student Input State (auto-appended roll no)
  const [newRollNo, setNewRollNo] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newSubject, setNewSubject] = useState('Mathematics');
  const [newMarksObtained, setNewMarksObtained] = useState<number | ''>('');
  const [newTotalMarks, setNewTotalMarks] = useState<number>(100);
  const [newPassingMarks, setNewPassingMarks] = useState<number>(40);
  const [formError, setFormError] = useState('');

  // Editing State
  const [editingItem, setEditingItem] = useState<StudentResult | null>(null);

  // Load results from backend
  const loadResults = async () => {
    try {
      const res = await getStudentResults();
      setResults(res.data);
      setIsCloudConnected(res.fromBackend);
      setNewRollNo(getNextRollNo(res.data));
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
      }
    } catch (e) {
      console.error('Failed to load results', e);
    }
  };

  // Check login session & load data on mount
  useEffect(() => {
    setMounted(true);
    const sessionAuth = sessionStorage.getItem('nsa_admin_auth');
    const token = getStoredToken();
    if (sessionAuth === 'true' || token) {
      setIsAuthenticated(true);
    }
    loadResults();
  }, []);

  // Update scroll status for admin table
  const updateAdminScrollStatus = () => {
    if (adminTableContainerRef.current) {
      const { scrollWidth, clientWidth, scrollLeft } = adminTableContainerRef.current;
      const canScroll = scrollWidth > clientWidth + 2;
      setAdminIsScrollable(canScroll);
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
        setAdminScrollProgress((scrollLeft / maxScroll) * 100);
      } else {
        setAdminScrollProgress(0);
      }
    }
  };

  useEffect(() => {
    updateAdminScrollStatus();
    window.addEventListener('resize', updateAdminScrollStatus);
    return () => window.removeEventListener('resize', updateAdminScrollStatus);
  }, [results, mounted, isAuthenticated]);

  const handleAdminScroll = () => {
    if (!adminTableContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = adminTableContainerRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      setAdminScrollProgress((scrollLeft / maxScroll) * 100);
    }
  };

  const scrollAdminTable = (amount: number) => {
    if (adminTableContainerRef.current) {
      adminTableContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Save to state and storage
  const updateResults = (newResults: StudentResult[]) => {
    setResults(newResults);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newResults));
    }
    setNewRollNo(getNextRollNo(newResults));
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);

    try {
      const res = await loginAdminApi(username, password);
      if (res.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('nsa_admin_auth', 'true');
        loadResults();
      } else {
        setLoginError(res.message || 'Invalid username or password.');
      }
    } catch {
      setLoginError('Authentication server unreachable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('nsa_admin_auth');
    clearStoredToken();
    setUsername('');
    setPassword('');
  };

  // Add Record Handler
  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newStudentName.trim()) {
      setFormError('Please enter Student Name.');
      return;
    }
    if (newMarksObtained === '' || isNaN(Number(newMarksObtained))) {
      setFormError('Please enter Marks Obtained.');
      return;
    }

    const marksNum = Number(newMarksObtained);
    if (marksNum < 0 || marksNum > newTotalMarks) {
      setFormError(`Marks obtained must be between 0 and ${newTotalMarks}.`);
      return;
    }

    const newRecord: StudentResult = {
      id: `nsa-${Date.now()}`,
      rollNo: newRollNo.trim() || getNextRollNo(results),
      studentName: newStudentName.trim(),
      subject: newSubject.trim() || 'Mathematics',
      marksObtained: marksNum,
      totalMarks: Number(newTotalMarks) || 100,
      passingMarks: Number(newPassingMarks) || 40,
    };

    setIsSubmitting(true);
    try {
      // Persist to Cloud Backend API
      await createStudentResultApi(newRecord);
    } catch (e) {
      console.warn('API save failed, cached locally', e);
    } finally {
      setIsSubmitting(false);
    }

    const updated = [...results, newRecord];
    updateResults(updated);

    // Reset Form Fields & auto-increment roll no
    setNewStudentName('');
    setNewMarksObtained('');
  };

  // Delete Record Handler
  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the result record for ${name}?`)) {
      try {
        await deleteStudentResultApi(id);
      } catch (e) {
        console.warn('API delete failed, removing locally', e);
      }
      const updated = results.filter((r) => r.id !== id);
      updateResults(updated);
    }
  };

  // Save Edit Handler
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editingItem.studentName.trim()) {
      alert('Student Name cannot be empty.');
      return;
    }
    if (editingItem.marksObtained < 0 || editingItem.marksObtained > editingItem.totalMarks) {
      alert(`Marks obtained must be between 0 and ${editingItem.totalMarks}.`);
      return;
    }

    try {
      await updateStudentResultApi(editingItem.id, editingItem);
    } catch (e) {
      console.warn('API update failed, updating locally', e);
    }

    const updated = results.map((r) => (r.id === editingItem.id ? editingItem : r));
    updateResults(updated);
    setEditingItem(null);
  };

  // If not logged in, render the clean login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center items-center px-4 font-sans relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -top-20 -left-20 pointer-events-none" />
        <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -bottom-20 -right-20 pointer-events-none" />

        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-500/30 overflow-hidden relative z-10">
          {/* Login Card Header */}
          <div className="bg-slate-950 text-white p-7 text-center relative border-b border-amber-500/30">
            <img
              src="/logo.jpg"
              alt="Shivam Academy Logo"
              className="w-16 h-16 rounded-full object-cover mx-auto mb-3.5 shadow-lg ring-3 ring-amber-400 bg-amber-400"
            />
            <h2 className="text-lg font-black tracking-tight text-white">
              Shivam Academy for Navoday &amp; Sainik School
            </h2>
            <p className="text-xs text-amber-300 mt-1 font-semibold">
              Administrator Access &amp; Examination Portal
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="p-7 space-y-4">
            {loginError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Admin Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm rounded-xl transition-all shadow-md shadow-amber-500/25 mt-2 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Sign In to Admin Panel</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>

            <div className="pt-3 border-t border-slate-100 text-center text-xs">
              <Link href="/" className="text-amber-600 hover:text-amber-700 hover:underline font-bold inline-flex items-center gap-1">
                ← Back to Student View
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Admin Dashboard (Authenticated)
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-slate-50 to-slate-100/90 text-slate-900 flex flex-col font-sans">
      {/* Admin Navbar */}
      <header className="bg-slate-950 text-white border-b border-amber-500/30 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 min-h-[4.5rem] py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <img
              src="/logo.jpg"
              alt="Shivam Academy Logo"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-amber-400 shadow-md shadow-amber-400/20 bg-amber-400 flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-white text-sm sm:text-base md:text-lg tracking-tight leading-tight truncate sm:whitespace-normal">
                  Shivam Academy for Navoday &amp; Sainik School
                </h1>
                <span className="hidden sm:inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-xs flex-shrink-0">
                  Admin Control
                </span>
                {isCloudConnected ? (
                  <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    PostgreSQL Live
                  </span>
                ) : (
                  <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Local Cache
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-amber-300 font-medium truncate sm:whitespace-normal">
                Examination &amp; Results Management Panel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link
              href="/"
              className="text-xs text-amber-300 hover:text-white font-bold px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1"
            >
              <span className="hidden sm:inline">Student Portal</span>
              <span className="inline sm:hidden">Portal</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 sm:px-3.5 bg-rose-500/20 hover:bg-rose-600 text-rose-200 hover:text-white text-xs font-black rounded-lg transition-colors border border-rose-500/40"
            >
              Logout
            </button>
          </div>
        </div>
        {/* Gold accent line */}
        <div className="h-0.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Top Scorers Cards / Chart */}
        {mounted && <TopScorers results={results} />}

        {/* Add Student Record Form (Clean & Clutter-free with Auto-appending Roll No) */}
        <div className="bg-white rounded-2xl shadow-md shadow-slate-200/60 border border-slate-200/90 p-6 relative overflow-hidden">
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-emerald-500 to-indigo-600" />

          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Add Cadet Result</h2>
              <p className="text-xs text-slate-500 font-medium">
                Roll number auto-appends for the next cadet. Enter marks to save.
              </p>
            </div>
            <span className="text-xs font-mono font-black bg-amber-100 text-amber-900 px-3 py-1 rounded-lg border border-amber-300 shadow-xs">
              Next Roll: {newRollNo}
            </span>
          </div>

          {formError && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              {formError}
            </div>
          )}

          <form onSubmit={handleAddRecord} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
            {/* Auto Appending Roll No */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Roll No *
              </label>
              <input
                type="text"
                value={newRollNo}
                onChange={(e) => setNewRollNo(e.target.value)}
                placeholder="e.g. NS-108"
                className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Student Name */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Student Name *
              </label>
              <input
                type="text"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="e.g. Tanvi Joshi"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Subject / Exam (Text Input) */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Subject / Exam *
              </label>
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="e.g. Mathematics, AISSEE Mock 1..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Marks Obtained */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Marks Obtained *
              </label>
              <input
                type="number"
                min="0"
                max={newTotalMarks}
                value={newMarksObtained}
                onChange={(e) => setNewMarksObtained(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 85"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                Add Result
              </button>
            </div>
          </form>

          {/* Quick config for Total & Passing Marks */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-500">
            <span className="font-bold text-slate-700">Limits Config:</span>
            <div className="flex items-center gap-1.5">
              <span>Total Marks:</span>
              <input
                type="number"
                value={newTotalMarks}
                onChange={(e) => setNewTotalMarks(Number(e.target.value))}
                className="w-16 px-2 py-0.5 border border-slate-300 rounded-lg text-center font-bold text-slate-900 bg-slate-50 text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span>Passing Marks:</span>
              <input
                type="number"
                value={newPassingMarks}
                onChange={(e) => setNewPassingMarks(Number(e.target.value))}
                className="w-16 px-2 py-0.5 border border-slate-300 rounded-lg text-center font-bold text-slate-900 bg-slate-50 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Admin Results Table */}
        <div className="bg-white rounded-2xl shadow-md shadow-slate-200/50 border border-slate-200/90 overflow-hidden w-full">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-amber-500/30">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm tracking-wide">
                Cadet Examination Records
              </span>
              <span className="text-[11px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full">
                {results.length} Total
              </span>
            </div>
            <span className="text-xs text-slate-300 font-medium hidden sm:inline">
              Synchronized with Student Results View
            </span>
          </div>

          <div
            ref={adminTableContainerRef}
            onScroll={handleAdminScroll}
            className="w-full overflow-x-auto table-scroll-container"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <table className="w-full text-left text-sm text-slate-600 border-collapse select-none sm:select-auto" style={{ minWidth: '780px' }}>
              <thead className="bg-slate-100 text-xs uppercase font-extrabold text-slate-700 tracking-wider border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-5 py-3.5 whitespace-nowrap">Roll No</th>
                  <th scope="col" className="px-5 py-3.5 whitespace-nowrap">Student Name</th>
                  <th scope="col" className="px-5 py-3.5 whitespace-nowrap">Subject / Exam</th>
                  <th scope="col" className="px-4 py-3.5 text-center whitespace-nowrap">Marks Obtained</th>
                  <th scope="col" className="px-4 py-3.5 text-center whitespace-nowrap">Total Marks</th>
                  <th scope="col" className="px-4 py-3.5 text-center whitespace-nowrap">Passing Marks</th>
                  <th scope="col" className="px-4 py-3.5 text-center whitespace-nowrap">Status</th>
                  <th scope="col" className="px-5 py-3.5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      <p className="font-bold text-slate-600 text-sm">No results found</p>
                    </td>
                  </tr>
                ) : (
                  results.map((row) => {
                    const isPass = row.marksObtained >= row.passingMarks;

                    return (
                      <tr key={row.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-indigo-900 whitespace-nowrap">
                          <span className="bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                            {row.rollNo}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                          {row.studentName}
                        </td>
                        <td className="px-5 py-3.5 text-slate-800 font-semibold whitespace-nowrap">
                          {row.subject}
                        </td>
                        <td className="px-4 py-3.5 text-center font-black text-slate-900 text-base whitespace-nowrap">
                          {row.marksObtained}
                        </td>
                        <td className="px-4 py-3.5 text-center text-slate-500 font-bold whitespace-nowrap">
                          {row.totalMarks}
                        </td>
                        <td className="px-4 py-3.5 text-center text-slate-400 font-semibold whitespace-nowrap">
                          {row.passingMarks}
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-black tracking-wide ${
                              isPass
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-400 shadow-xs'
                                : 'bg-rose-100 text-rose-800 border border-rose-400 shadow-xs'
                            }`}
                          >
                            {isPass ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => setEditingItem({ ...row })}
                            className="text-xs font-black text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg transition-colors mr-1.5"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(row.id, row.studentName)}
                            className="text-xs font-black text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Guaranteed Visible Horizontal Scrollbar Bar (Always visible on mobile & tablet when scrollable) */}
          {adminIsScrollable && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 select-none">
              <button
                type="button"
                onClick={() => scrollAdminTable(-220)}
                aria-label="Scroll table left"
                className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 active:bg-amber-100 flex items-center justify-center shadow-xs transition-colors cursor-pointer flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div
                className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden cursor-pointer relative shadow-inner p-0.5"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  if (adminTableContainerRef.current) {
                    const maxScroll = adminTableContainerRef.current.scrollWidth - adminTableContainerRef.current.clientWidth;
                    adminTableContainerRef.current.scrollTo({ left: clickRatio * maxScroll, behavior: 'smooth' });
                  }
                }}
              >
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full shadow-sm transition-all duration-75"
                  style={{
                    width: '35%',
                    marginLeft: `${adminScrollProgress * 0.65}%`,
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => scrollAdminTable(220)}
                aria-label="Scroll table right"
                className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 active:bg-amber-100 flex items-center justify-center shadow-xs transition-colors cursor-pointer flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <h3 className="text-sm font-bold">Edit Student Result</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Roll No
                </label>
                <input
                  type="text"
                  value={editingItem.rollNo}
                  onChange={(e) => setEditingItem({ ...editingItem, rollNo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-100 text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Student Name
                </label>
                <input
                  type="text"
                  value={editingItem.studentName}
                  onChange={(e) => setEditingItem({ ...editingItem, studentName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Subject / Exam
                </label>
                <input
                  type="text"
                  value={editingItem.subject}
                  onChange={(e) => setEditingItem({ ...editingItem, subject: e.target.value })}
                  placeholder="e.g. Mathematics, JNVST Test..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Marks
                  </label>
                  <input
                    type="number"
                    value={editingItem.marksObtained}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, marksObtained: Number(e.target.value) })
                    }
                    className="w-full px-2 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Total
                  </label>
                  <input
                    type="number"
                    value={editingItem.totalMarks}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, totalMarks: Number(e.target.value) })
                    }
                    className="w-full px-2 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Passing
                  </label>
                  <input
                    type="number"
                    value={editingItem.passingMarks}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, passingMarks: Number(e.target.value) })
                    }
                    className="w-full px-2 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-center"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Elegant Footer */}
      <footer className="bg-white border-t border-slate-200 py-5 text-center text-xs text-slate-500 font-medium">
        © 2026 Shivam Academy for Navoday &amp; Sainik School • Admin Control Center
      </footer>
    </div>
  );
}
