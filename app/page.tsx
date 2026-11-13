'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { StudentResult } from '../lib/types';
import { DEFAULT_RESULTS, STORAGE_KEY } from '../lib/initialData';
import { getStudentResults } from '../lib/api';
import TopScorers from '../components/TopScorers';

export default function StudentHomePage() {
  const [results, setResults] = useState<StudentResult[]>(DEFAULT_RESULTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Table horizontal scrolling state
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);

  // Load from backend database (or fallback to localStorage / DEFAULT_RESULTS)
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getStudentResults();
      setResults(res.data);
      setIsCloudConnected(res.fromBackend);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
      }
    } catch (err) {
      console.error('Error fetching student results', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  // Filter ONLY by Student Name or Roll Number
  const filteredResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return results;
    return results.filter(
      (r) =>
        r.studentName.toLowerCase().includes(q) ||
        r.rollNo.toLowerCase().includes(q)
    );
  }, [results, searchQuery]);

  // Check if horizontal scrollbar is needed
  const updateScrollStatus = () => {
    if (tableContainerRef.current) {
      const { scrollWidth, clientWidth, scrollLeft } = tableContainerRef.current;
      const canScroll = scrollWidth > clientWidth + 2;
      setIsScrollable(canScroll);
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
        setScrollProgress((scrollLeft / maxScroll) * 100);
      } else {
        setScrollProgress(0);
      }
    }
  };

  useEffect(() => {
    updateScrollStatus();
    window.addEventListener('resize', updateScrollStatus);
    return () => window.removeEventListener('resize', updateScrollStatus);
  }, [filteredResults, mounted]);

  const handleScroll = () => {
    if (!tableContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tableContainerRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      setScrollProgress((scrollLeft / maxScroll) * 100);
    }
  };

  const scrollByAmount = (amount: number) => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-slate-50 to-slate-100/90 text-slate-900 flex flex-col font-sans">
      {/* Top Header with Vibrant Royal Navy & Gold Trim */}
      <header className="bg-slate-950 text-white border-b border-amber-500/30 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 min-h-[4.5rem] py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <img
              src="/logo.jpg"
              alt="Shivam Academy Logo"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-amber-400 shadow-md shadow-amber-400/20 bg-amber-400 flex-shrink-0"
            />
            <div className="min-w-0">
              <h1 className="font-extrabold text-white text-sm sm:text-base md:text-lg tracking-tight leading-tight truncate sm:whitespace-normal">
                Shivam Academy for Navoday &amp; Sainik School
              </h1>
              <p className="text-[11px] sm:text-xs text-amber-300 font-medium truncate sm:whitespace-normal">
                Student Examination Results &amp; Scorecard Portal
              </p>
            </div>
          </div>

          <Link
            href="/admin"
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black rounded-lg transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="hidden sm:inline">Admin Login</span>
            <span className="inline sm:hidden">Admin</span>
          </Link>
        </div>
        {/* Decorative Gold Accent Bar */}
        <div className="h-0.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3.5 sm:px-6 py-6 sm:py-8 space-y-6 min-w-0">
        {/* Top Scorers Cards / Chart */}
        {mounted && <TopScorers results={results} />}

        {/* Search Bar - ONLY by Student Name or Roll No */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-200 transition-all">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
            Search Cadet Results
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Student Name or Roll Number (e.g. Aarav, NS-101)..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl focus:outline-none focus:bg-white placeholder-slate-400 font-semibold transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs font-black"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Results Table Card */}
        <div className="bg-white rounded-2xl shadow-md shadow-slate-200/50 border border-slate-200/90 overflow-hidden w-full">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-amber-500/30">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm tracking-wide">
                Examination Result Ledger
              </span>
              {isCloudConnected ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Cloud DB
                </span>
              ) : (
                <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full">
                  Live
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadData}
                disabled={loading}
                title="Refresh Results"
                className="text-xs text-amber-300 hover:text-amber-200 transition-colors p-1"
              >
                <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <div className="text-xs text-slate-300 font-semibold">
                Showing {filteredResults.length} record{filteredResults.length === 1 ? '' : 's'}
              </div>
            </div>
          </div>

          {/* Horizontally scrollable container */}
          <div
            ref={tableContainerRef}
            onScroll={handleScroll}
            className="w-full overflow-x-auto table-scroll-container"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <table className="w-full text-left text-sm text-slate-600 border-collapse select-none sm:select-auto" style={{ minWidth: '750px' }}>
              <thead className="bg-slate-100 text-xs uppercase font-extrabold text-slate-700 tracking-wider border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-4 py-3.5 whitespace-nowrap">Roll No</th>
                  <th scope="col" className="px-4 py-3.5 whitespace-nowrap">Student Name</th>
                  <th scope="col" className="px-4 py-3.5 whitespace-nowrap">Subject / Exam</th>
                  <th scope="col" className="px-3 py-3.5 text-center whitespace-nowrap">Marks Obtained</th>
                  <th scope="col" className="px-3 py-3.5 text-center whitespace-nowrap">Total Marks</th>
                  <th scope="col" className="px-3 py-3.5 text-center whitespace-nowrap">Passing Marks</th>
                  <th scope="col" className="px-4 py-3.5 text-center whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <p className="font-bold text-slate-600 text-sm">No results found</p>
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((row) => {
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
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Guaranteed Visible Horizontal Scrollbar Bar (Always visible on mobile & tablet when scrollable) */}
          {isScrollable && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 select-none">
              <button
                type="button"
                onClick={() => scrollByAmount(-220)}
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
                  if (tableContainerRef.current) {
                    const maxScroll = tableContainerRef.current.scrollWidth - tableContainerRef.current.clientWidth;
                    tableContainerRef.current.scrollTo({ left: clickRatio * maxScroll, behavior: 'smooth' });
                  }
                }}
              >
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full shadow-sm transition-all duration-75"
                  style={{
                    width: '35%',
                    marginLeft: `${scrollProgress * 0.65}%`,
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => scrollByAmount(220)}
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

      {/* Elegant Footer */}
      <footer className="bg-white border-t border-slate-200 py-5 text-center text-xs text-slate-500 font-medium">
        © 2026 Shivam Academy for Navoday &amp; Sainik School • Official Results Portal
      </footer>
    </div>
  );
}
