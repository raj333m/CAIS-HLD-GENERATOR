'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FileText, Shield, User, CheckCircle, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // Human Verification State
  const [verifying, setVerifying] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [mathQuestion, setMathQuestion] = useState<{ n1: number; n2: number; op: '+' | '-'; expected: number } | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const generateNewQuestion = () => {
    const isAdd = Math.random() > 0.5;
    const n1 = Math.floor(Math.random() * 15) + 3;
    const n2 = Math.floor(Math.random() * 12) + 1;
    if (isAdd) {
      return { n1, n2, op: '+' as const, expected: n1 + n2 };
    } else {
      const big = Math.max(n1, n2);
      const small = Math.min(n1, n2);
      return { n1: big, n2: small, op: '-' as const, expected: big - small };
    }
  };

  const handleDemoLogin = async (role: 'BA' | 'REVIEWER' | 'ADMIN') => {
    setLoading(true);
    setError('');
    const ok = await login(undefined, undefined, role);
    setLoading(false);
    if (ok) {
      setSelectedRole(role);
      setMathQuestion(generateNewQuestion());
      setUserAnswer('');
      setVerifyError(null);
      setVerifying(true);
    } else {
      setError(`Failed to sign in as ${role}`);
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mathQuestion) return;

    const val = parseInt(userAnswer.trim(), 10);
    if (val === mathQuestion.expected) {
      const target = selectedRole === 'BA' ? '/document' : '/dashboard';
      router.push(target);
    } else {
      setVerifyError("That's not correct — try again");
      setUserAnswer('');
      setMathQuestion(generateNewQuestion());
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {verifying && mathQuestion ? (
          /* Human Verification Card */
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Human Verification Step
              </h2>
              <p className="text-xs text-slate-400">
                Logged in as <span className="font-bold text-blue-300">{selectedRole}</span>. Please answer this quick question to proceed to the {selectedRole === 'BA' ? 'Consolidated HLD' : 'Dashboard'}.
              </p>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-center">
                <label className="block text-xs font-semibold uppercase text-slate-400 tracking-wider">
                  Verification Question
                </label>
                <div className="text-2xl font-mono font-bold text-white tracking-wide">
                  What is {mathQuestion.n1} {mathQuestion.op} {mathQuestion.n2}?
                </div>
                <input
                  type="number"
                  required
                  autoFocus
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Enter your answer"
                  className="w-full text-center px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-base font-mono font-bold text-white focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              {verifyError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-400 text-center animate-shake">
                  {verifyError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setVerifying(false);
                    setSelectedRole(null);
                  }}
                  className="w-1/3 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Verify & Proceed</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* SSO Landing Page Card */
          <>
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20 mb-4">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                CAIS HLD Generator
              </h2>
              <p className="mt-2 text-xs text-slate-400">
                High-Level Design Document Engine for UK Credit Bureau Reporting (Experian, Equifax, TransUnion)
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 text-center">
                {error}
              </div>
            )}

            {/* One-Click Sign In Cards */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold uppercase text-slate-400 tracking-wider">
                ⚡ One-Click Sign In
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('BA')}
                  disabled={loading}
                  className="flex items-center justify-between p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 hover:bg-blue-900/40 text-left group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-blue-200">Business Analyst (BA)</div>
                      <div className="text-[11px] text-slate-400">Author • Intake Wizard & Doc Editor</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('REVIEWER')}
                  disabled={loading}
                  className="flex items-center justify-between p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 hover:bg-purple-900/40 text-left group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-600/20 text-purple-400">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-purple-200">Reviewer / Approver</div>
                      <div className="text-[11px] text-slate-400">Approver • Leave Comments & Sign-off</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-purple-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('ADMIN')}
                  disabled={loading}
                  className="flex items-center justify-between p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 hover:bg-amber-900/40 text-left group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-600/20 text-amber-400">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-200">System Administrator</div>
                      <div className="text-[11px] text-slate-400">Admin • Master Data & Catalog Manager</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
