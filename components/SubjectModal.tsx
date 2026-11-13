'use client';

import React, { useState } from 'react';
import { Subject } from '../types/result';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSubject: (subject: Subject) => void;
}

export default function SubjectModal({ isOpen, onClose, onAddSubject }: SubjectModalProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [targetExam, setTargetExam] = useState('AISSEE & JNVST');
  const [classLevel, setClassLevel] = useState('Class 6 Entrance');
  const [credits, setCredits] = useState(4);
  const [maxInternal, setMaxInternal] = useState(20);
  const [maxExternal, setMaxExternal] = useState(80);
  const [passPercentage, setPassPercentage] = useState(40);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code.trim() || !name.trim()) {
      setError('Please provide both Subject Code and Subject Name.');
      return;
    }

    const newSub: Subject = {
      id: `sub-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      targetExam,
      classLevel,
      credits: Number(credits),
      maxInternal: Number(maxInternal),
      maxExternal: Number(maxExternal),
      passPercentage: Number(passPercentage),
    };

    onAddSubject(newSub);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Add Subject / Section</h3>
            <p className="text-xs text-slate-500">Navodaya (JNVST) & Sainik School (AISSEE) Curriculum</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Subject Code *</label>
              <input
                type="text"
                placeholder="e.g. SCI-105"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Target Entrance</label>
              <select
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800"
              >
                <option>AISSEE & JNVST</option>
                <option>AISSEE (Sainik School)</option>
                <option>JNVST (Navodaya)</option>
                <option>RMS (Rashtriya Military School)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Subject Title / Section Name *</label>
            <input
              type="text"
              placeholder="e.g. General Science & Environment"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Target Class Batch</label>
              <select
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800"
              >
                <option>Class 6 Entrance</option>
                <option>Class 9 Entrance</option>
                <option>Foundation Batch</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Cutoff / Pass %</label>
              <input
                type="number"
                min="1"
                max="100"
                value={passPercentage}
                onChange={(e) => setPassPercentage(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Section A / Internal Max</label>
              <input
                type="number"
                min="0"
                value={maxInternal}
                onChange={(e) => setMaxInternal(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Section B / Main Exam Max</label>
              <input
                type="number"
                min="0"
                value={maxExternal}
                onChange={(e) => setMaxExternal(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              Save Subject
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
