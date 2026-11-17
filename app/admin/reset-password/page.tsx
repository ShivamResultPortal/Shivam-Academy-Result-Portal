'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { resetPasswordApi } from '../../../lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!token) {
      setStatusMessage({
        text: 'Missing or invalid reset token. Please request a new password reset link.',
        isError: true,
      });
      return;
    }

    if (newPassword.length < 6) {
      setStatusMessage({
        text: 'Password must be at least 6 characters long.',
        isError: true,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage({
        text: 'Password and confirmation do not match.',
        isError: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPasswordApi(token, newPassword);
      if (res.success) {
        setIsSuccess(true);
        setStatusMessage({ text: res.message, isError: false });
        setTimeout(() => {
          router.push('/admin');
        }, 3000);
      } else {
        setStatusMessage({ text: res.message, isError: true });
      }
    } catch {
      setStatusMessage({ text: 'Unable to connect to authentication server.', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-500/30 overflow-hidden relative z-10">
      {/* Header */}
      <div className="bg-slate-950 text-white p-7 text-center relative border-b border-amber-500/30">
        <img
          src="/logo.png"
          alt="Shivam Academy Logo"
          className="w-20 h-20 object-contain mx-auto mb-3 drop-shadow-md"
        />
        <h2 className="text-lg font-black tracking-tight text-white">
          Shivam Academy for Navoday &amp; Sainik School
        </h2>
        <p className="text-xs text-amber-300 mt-1 font-semibold">
          Reset Administrator Password
        </p>
      </div>

      <div className="p-7">
        {!token ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <h3 className="font-extrabold text-slate-800 text-base">Invalid Reset Link</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              No reset token found in your link, or the link format is incomplete. Please request a new password reset link from the administrator login page.
            </p>
            <div className="pt-2">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all"
              >
                ← Return to Admin Login
              </Link>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <h3 className="font-extrabold text-slate-800 text-base">Password Reset Successfully!</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your new password is now active. You will be redirected to the admin sign-in page in a few seconds...
            </p>
            <div className="pt-2">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all"
              >
                Sign In Now
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {statusMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  statusMessage.isError
                    ? 'bg-rose-50 border border-rose-200 text-rose-700'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                }`}
              >
                <span>{statusMessage.isError ? '⚠️' : '✓'}</span>
                <span>{statusMessage.text}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                New Password (Min 6 Characters)
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm rounded-xl transition-all shadow-md shadow-amber-500/25 mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <span>{isSubmitting ? 'Updating Password...' : 'Save New Password'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </button>

            <div className="pt-3 border-t border-slate-100 text-center text-xs">
              <Link href="/admin" className="text-amber-600 hover:text-amber-700 hover:underline font-bold">
                ← Back to Admin Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center items-center px-4 font-sans relative overflow-hidden">
      <div className="absolute w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -top-20 -left-20 pointer-events-none" />
      <div className="absolute w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -bottom-20 -right-20 pointer-events-none" />

      <Suspense
        fallback={
          <div className="text-white text-sm font-bold flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            Loading reset portal...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>

      <div className="mt-6 text-center text-xs text-slate-500 font-medium relative z-10">
        <p>© 2026 Shivam Academy • विद्या मोक्षस्य कारणम्</p>
      </div>
    </div>
  );
}
