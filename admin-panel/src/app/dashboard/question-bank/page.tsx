'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, BookOpen, AlertCircle, ChevronRight, Calendar, ArrowRight, Trash2, CalendarDays } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface QuestionSet {
    id: number;
    title: string;
    description: string;
    year: number;
    publishedDate: string;
    isPublished: boolean;
    createdAt: string;
}

export default function QuestionSetsPage() {
    const [sets, setSets] = useState<QuestionSet[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newSet, setNewSet] = useState({
        title: '',
        description: '',
        year: new Date().getFullYear().toString(),
        publishedDate: new Date()
    });
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSets();
    }, []);

    const fetchSets = async () => {
        try {
            setError(null);
            const res = await fetch('/api/question-sets');
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setSets(data);
            } else {
                setError(data.error || 'Failed to load question banks');
            }
        } catch (err) {
            console.error('Failed to fetch sets:', err);
            setError('Connection error. Please check if the server is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch('/api/question-sets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newSet,
                    publishedDate: newSet.publishedDate.toISOString()
                })
            });
            if (res.ok) {
                setShowCreateModal(false);
                setNewSet({
                    title: '',
                    description: '',
                    year: new Date().getFullYear().toString(),
                    publishedDate: new Date()
                });
                fetchSets();
            }
        } catch (error) {
            console.error('Failed to create set:', error);
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm('Are you sure you want to delete this question bank? All questions inside will also be deleted.')) {
            return;
        }

        setDeletingId(id);
        try {
            const res = await fetch(`/api/question-sets/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setSets(sets.filter(s => s.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete set:', error);
        } finally {
            setDeletingId(null);
        }
    };

    const handleToggleVisibility = async (id: number, currentStatus: boolean, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const res = await fetch(`/api/question-sets/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPublished: !currentStatus })
            });
            if (res.ok) {
                setSets(sets.map(s => s.id === id ? { ...s, isPublished: !currentStatus } : s));
            }
        } catch (error) {
            console.error('Failed to toggle visibility:', error);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        Question Bank
                    </h1>
                    <p className="text-slate-500 mt-1">Manage question sets, publication dates, and specific practice filters.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Create Question Bank
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-24">
                    <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-100 rounded-3xl p-12 text-center">
                    <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-black text-red-900 mb-2">Error Loading Banks</h3>
                    <p className="text-red-600 max-w-sm mx-auto mb-8 font-medium">{error}</p>
                    <button
                        onClick={fetchSets}
                        className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition-all"
                    >
                        Retry Connection
                    </button>
                </div>
            ) : sets.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
                    <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">No Question Banks Yet</h3>
                    <p className="text-slate-400 max-w-sm mx-auto mb-8 font-medium">Start by creating a thematic or year-wise question bank to populate your app's practice section.</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
                    >
                        Initialize First Set
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sets.map((set) => (
                        <div key={set.id} className="relative group">
                            <Link
                                href={`/dashboard/question-bank/${set.id}`}
                                className="block h-full bg-white rounded-3xl border border-slate-100 p-6 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-300"
                            >
                                <div className="flex items-start justify-between mb-5">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300">
                                        <BookOpen className="w-7 h-7" />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                                            {set.year}
                                        </span>
                                        <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                            <CalendarDays className="w-3 h-3" />
                                            {new Date(set.publishedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                                    {set.title}
                                </h3>
                                <p className="text-slate-400 text-sm mb-8 font-medium line-clamp-2">
                                    {set.description || 'Practice set for UPSC aspirants curated for excellence.'}
                                </p>

                                <div className="pt-5 border-t border-slate-50 flex items-center justify-between">
                                    <button
                                        onClick={(e) => handleToggleVisibility(set.id, set.isPublished, e)}
                                        className="flex items-center gap-2"
                                    >
                                        <div className={`w-2 h-2 rounded-full ${set.isPublished ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${set.isPublished ? 'text-green-600' : 'text-slate-400'}`}>
                                            {set.isPublished ? 'Status: Live' : 'Status: Draft'}
                                        </span>
                                    </button>
                                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </Link>

                            {/* Delete Button */}
                            <button
                                onClick={(e) => handleDelete(set.id, e)}
                                disabled={deletingId === set.id}
                                className="absolute -top-2 -right-2 w-10 h-10 bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110 active:scale-95"
                                title="Delete Question Bank"
                            >
                                {deletingId === set.id ? (
                                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <Trash2 className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b border-slate-50">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest text-center">New Practice Bank</h3>
                        </div>
                        <form onSubmit={handleCreate} className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">Set Identity</label>
                                <input
                                    type="text"
                                    required
                                    value={newSet.title}
                                    onChange={(e) => setNewSet({ ...newSet, title: e.target.value })}
                                    placeholder="e.g. Daily Current Affairs MCQs"
                                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-4 focus:ring-blue-100/50 outline-none transition-all font-bold text-slate-700"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">Target Year</label>
                                    <input
                                        type="number"
                                        required
                                        value={newSet.year}
                                        onChange={(e) => setNewSet({ ...newSet, year: e.target.value })}
                                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-4 focus:ring-blue-100/50 outline-none transition-all font-bold text-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">Push Date</label>
                                    <DatePicker
                                        selected={newSet.publishedDate}
                                        onChange={(date: Date | null) => date && setNewSet({ ...newSet, publishedDate: date })}
                                        dateFormat="dd/MM/yyyy"
                                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-4 focus:ring-blue-100/50 outline-none transition-all font-bold text-slate-700"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">Context Description</label>
                                <textarea
                                    value={newSet.description}
                                    onChange={(e) => setNewSet({ ...newSet, description: e.target.value })}
                                    rows={3}
                                    placeholder="Describe the scope of this question set..."
                                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-4 focus:ring-blue-100/50 outline-none transition-all font-bold text-slate-700 resize-none"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-6 py-4 text-slate-400 hover:text-slate-600 font-black uppercase tracking-widest text-xs transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-[1.2rem] font-black uppercase tracking-[0.15em] text-xs transition-all shadow-xl shadow-blue-500/20 disabled:opacity-70 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {creating ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <IoRocketOutline className="w-4 h-4" />
                                            Initialize
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Mock icon for the button since it might not be imported from lucide
function IoRocketOutline({ className }: { className?: string }) {
    return <Plus className={className} />;
}
