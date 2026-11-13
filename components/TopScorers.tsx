'use client';

import React, { useState } from 'react';
import { StudentResult } from '../lib/types';

interface TopScorersProps {
  results: StudentResult[];
}

export default function TopScorers({ results }: TopScorersProps) {
  const [limit, setLimit] = useState<3 | 5>(3);

  // Sort descending by percentage / marks obtained
  const sorted = [...results]
    .map((r) => ({
      ...r,
      percentage: r.totalMarks > 0 ? (r.marksObtained / r.totalMarks) * 100 : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const topStudents = sorted.slice(0, limit);

  if (topStudents.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-md shadow-slate-200/60 border border-slate-200/90 p-6 relative overflow-hidden">
      {/* Subtle top decorative accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-emerald-500 to-indigo-600" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-bold text-lg shadow-md shadow-amber-200">
            🏆
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Top Scorers & Merit Rankers
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                Hall of Fame
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Highest scoring cadets in Navoday & Sainik School evaluation
            </p>
          </div>
        </div>

        {/* Toggle Top 3 / Top 5 */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-xs self-start sm:self-auto">
          <button
            onClick={() => setLimit(3)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              limit === 3
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Top 3
          </button>
          <button
            onClick={() => setLimit(5)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              limit === 5
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Top 5
          </button>
        </div>
      </div>

      {/* Grid of Top Ranker Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {topStudents.map((student, idx) => {
          const rank = idx + 1;
          const style =
            rank === 1
              ? {
                  cardBg: 'bg-gradient-to-b from-amber-100/90 via-amber-50/60 to-yellow-50/40 border-amber-300 ring-2 ring-amber-400/50 shadow-md shadow-amber-200/50',
                  badge: '🥇 Rank 1',
                  badgeColor: 'bg-amber-400 text-slate-950 font-black shadow-xs',
                  barColor: 'bg-gradient-to-r from-amber-500 to-yellow-400',
                  accentText: 'text-amber-900',
                }
              : rank === 2
              ? {
                  cardBg: 'bg-gradient-to-b from-slate-100 via-white to-slate-50 border-slate-300 shadow-sm',
                  badge: '🥈 Rank 2',
                  badgeColor: 'bg-slate-300 text-slate-800 font-extrabold shadow-xs',
                  barColor: 'bg-gradient-to-r from-slate-600 to-slate-400',
                  accentText: 'text-slate-800',
                }
              : rank === 3
              ? {
                  cardBg: 'bg-gradient-to-b from-orange-100/80 via-orange-50/50 to-amber-50/30 border-orange-300 shadow-sm',
                  badge: '🥉 Rank 3',
                  badgeColor: 'bg-orange-300 text-orange-950 font-extrabold shadow-xs',
                  barColor: 'bg-gradient-to-r from-orange-500 to-amber-500',
                  accentText: 'text-orange-900',
                }
              : {
                  cardBg: 'bg-gradient-to-b from-indigo-50/70 via-white to-sky-50/40 border-indigo-200 shadow-sm',
                  badge: `⭐ Rank ${rank}`,
                  badgeColor: 'bg-indigo-100 text-indigo-900 font-bold border border-indigo-200',
                  barColor: 'bg-gradient-to-r from-indigo-600 to-sky-500',
                  accentText: 'text-indigo-900',
                };

          return (
            <div
              key={student.id}
              className={`p-4 rounded-xl border ${style.cardBg} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full ${style.badgeColor}`}>
                    {style.badge}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-500 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200/70">
                    {student.rollNo}
                  </span>
                </div>

                <div className="font-extrabold text-slate-900 text-sm mt-1 truncate">
                  {student.studentName}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 truncate font-medium">
                  {student.subject}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-black/5">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-slate-500">Marks Scored</span>
                  <div className="text-right">
                    <span className="text-base font-black text-slate-900">
                      {student.marksObtained}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">/{student.totalMarks}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-black/5 rounded-full h-2 mt-2 overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${style.barColor}`}
                    style={{ width: `${Math.min(student.percentage, 100)}%` }}
                  />
                </div>
                <div className={`text-right text-xs font-black mt-1.5 ${style.accentText}`}>
                  {student.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
