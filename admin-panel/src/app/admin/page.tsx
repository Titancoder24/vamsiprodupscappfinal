'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, AlertCircle, CheckCircle, Check } from 'lucide-react';

export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotSuccess, setForgotSuccess] = useState('');
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('sb-access-token');
        if (token) {
            router.push('/dashboard');
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Invalid email or password');
            }

            localStorage.setItem('sb-access-token', data.token);
            localStorage.setItem('sb-refresh-token', data.refreshToken);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError('Please enter your email address first');
            return;
        }

        setForgotLoading(true);
        setError('');
        setForgotSuccess('');

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to send reset email');
            }

            setForgotSuccess('Password reset email sent! Check your inbox.');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Dark */}
            <div className="hidden md:flex md:w-1/2 bg-[#1a1f2e] flex-col justify-between p-12 text-white">
                <div>
                    <img
                        src="/prepassist-logo.png"
                        alt="PrepAssist"
                        className="h-14 w-auto mb-16"
                        style={{ filter: 'brightness(0) invert(1)' }}
                    />
                    <h1 className="text-4xl font-bold mb-6">Admin Dashboard</h1>
                    <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                        Manage articles, users, and content for your UPSC preparation platform.
                    </p>
                </div>

                <div className="space-y-5">
                    <div className="flex items-center gap-4">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-gray-300">Scrape & publish articles</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-gray-300">Generate AI-powered MCQs</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-gray-300">Track user progress</span>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-700">
                    <p className="text-gray-500 text-sm">© 2026 PrepAssist. All rights reserved.</p>
                    <a
                        href="https://www.prepassist.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block"
                    >
                        Visit prepassist.in →
                    </a>
                </div>
            </div>

            {/* Right Panel - White */}
            <div className="w-full md:w-1/2 flex flex-col justify-center p-8 md:p-16 bg-white">
                <div className="max-w-md mx-auto w-full">
                    <div className="md:hidden flex justify-center mb-8">
                        <img
                            src="/prepassist-logo.png"
                            alt="PrepAssist"
                            className="h-12 w-auto"
                        />
                    </div>

                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
                    <p className="text-gray-500 mb-8">Sign in to access the admin dashboard</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        {forgotSuccess && (
                            <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">
                                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <span>{forgotSuccess}</span>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                    placeholder="vamsi@prepassist.in"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end">
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                disabled={forgotLoading}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors disabled:opacity-50"
                            >
                                {forgotLoading ? 'Sending...' : 'Forgot password?'}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#1a1f2e] text-white py-4 rounded-xl font-medium hover:bg-[#252b3d] transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign in
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>

                        <p className="text-center text-gray-500 text-sm pt-4">
                            Need help? <a href="mailto:support@prepassist.in" className="text-blue-600 hover:underline">Contact your system administrator</a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
