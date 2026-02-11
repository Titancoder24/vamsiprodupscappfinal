'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoNotificationsOutline,
    IoSendOutline,
    IoTimeOutline,
    IoNewspaperOutline,
    IoFileTrayFullOutline,
    IoCheckmarkCircle,
    IoAlertCircle,
    IoCalendarOutline,
    IoInformationCircleOutline,
    IoPeopleOutline,
    IoRocketOutline,
    IoArrowForward
} from 'react-icons/io5';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Article {
    id: number;
    title: string;
    published_date: string;
}

interface QuestionSet {
    id: number;
    title: string;
    year: number;
    created_at: string;
}

interface Notification {
    id: string;
    title: string;
    body: string;
    type: string;
    is_read: boolean;
    created_at: string;
    recipient_count?: number;
    status?: string;
}

export default function PushNotificationsPage() {
    const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');
    const [contentType, setContentType] = useState<'article' | 'question_set'>('article');

    // Content counts for the selected date
    const [itemsCount, setItemsCount] = useState(0);
    const [isLoadingCount, setIsLoadingCount] = useState(false);

    // Form State
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [customTitle, setCustomTitle] = useState('');
    const [customBody, setCustomBody] = useState('');

    // History State
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        checkContentAvailability();
        loadHistory();
    }, [selectedDate, contentType]);

    const checkContentAvailability = async () => {
        if (!selectedDate) {
            setItemsCount(0);
            return;
        }

        setIsLoadingCount(true);
        try {
            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(selectedDate);
            endOfDay.setHours(23, 59, 59, 999);

            if (contentType === 'article') {
                const { count } = await supabase
                    .from('articles')
                    .select('*', { count: 'exact', head: true })
                    .eq('is_published', true)
                    .gte('published_date', startOfDay.toISOString())
                    .lte('published_date', endOfDay.toISOString());
                setItemsCount(count || 0);

                // Update default text
                if (count && count > 0) {
                    setCustomTitle('New Articles Published! 📚');
                    setCustomBody(`Daily analysis for ${selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })} is now live. Check out the latest updates!`);
                } else {
                    setCustomTitle('');
                    setCustomBody('');
                }
            } else {
                const { count } = await supabase
                    .from('question_sets')
                    .select('*', { count: 'exact', head: true })
                    .eq('is_published', true)
                    .gte('published_date', startOfDay.toISOString())
                    .lte('published_date', endOfDay.toISOString());
                setItemsCount(count || 0);

                // Update default text
                if (count && count > 0) {
                    setCustomTitle('New Question Bank Available! 📝');
                    setCustomBody(`Fresh MCQs for ${selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })} have been added. Start practicing now!`);
                } else {
                    setCustomTitle('');
                    setCustomBody('');
                }
            }
        } catch (error) {
            console.error('Check availability error:', error);
        } finally {
            setIsLoadingCount(false);
        }
    };

    const loadHistory = async () => {
        const { data: notifData } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
        setNotifications(notifData || []);
    };

    const sendNotification = async () => {
        if (!selectedDate) {
            setMessage({ type: 'error', text: 'Please select a date' });
            return;
        }

        const title = customTitle || (contentType === 'article' ? 'Daily Articles' : 'Daily MCQs');
        const body = customBody || 'Check out the latest content on PrepAssist.';

        // Dynamic Deep Links based on content type
        const contentUrl = contentType === 'article'
            ? 'https://app.prepassist.in/Articles?type=articles&featureName=News%20Feed'
            : 'https://app.prepassist.in/questions?type=questionpaper&featureName=Question%20Bank';

        setSending(true);
        setMessage(null);

        try {
            const response = await fetch('/api/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    body,
                    contentType,
                    contentId: selectedDate.toISOString(), // Use date as identifier for bulk update
                    contentUrl,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Daily broadcast sent successfully!' });
                setCustomTitle('');
                setCustomBody('');
                loadHistory();
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to send notification' });
            }
        } catch (error: any) {
            console.error('Send error:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to send notification' });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-12 font-['Inter']">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                                <IoNotificationsOutline className="text-white text-xl" />
                            </div>
                            Push Engine
                        </h1>
                        <p className="text-gray-500 text-sm mt-1 font-medium italic">Targeted broadcasts for daily UPSC updates.</p>
                    </div>

                    <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                        <button
                            onClick={() => setActiveTab('send')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'send'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Broadcast
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'history'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            History Logs
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 mt-8">
                {activeTab === 'send' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Configuration Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Analytics Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${itemsCount > 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        {contentType === 'article' ? <IoNewspaperOutline size={28} /> : <IoFileTrayFullOutline size={28} />}
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Items Found for Selected Date</div>
                                        <div className="flex items-center gap-2">
                                            {isLoadingCount ? (
                                                <div className="h-8 w-16 bg-gray-100 animate-pulse rounded-lg"></div>
                                            ) : (
                                                <span className="text-3xl font-black text-gray-900">{itemsCount} {contentType === 'article' ? 'Articles' : 'Question Sets'}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter ${itemsCount > 0 ? 'bg-green-100 text-green-700' : 'bg- amber-50 text-amber-600'}`}>
                                    {itemsCount > 0 ? 'Ready to Broadcast' : 'No Data Detected'}
                                </div>
                            </motion.div>

                            {/* Main Form */}
                            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8">
                                {/* Type Selector */}
                                <div>
                                    <label className="block text-sm font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">
                                        1. Content Category
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setContentType('article')}
                                            className={`flex items-center gap-4 p-6 rounded-3xl border-2 transition-all group ${contentType === 'article'
                                                ? 'border-blue-600 bg-blue-50/50'
                                                : 'border-gray-50 bg-gray-50/50 hover:bg-white hover:border-gray-200'
                                                }`}
                                        >
                                            <div className={`p-3.5 rounded-2xl transition-all ${contentType === 'article' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-gray-400 group-hover:text-blue-500 shadow-sm'}`}>
                                                <IoNewspaperOutline size={24} />
                                            </div>
                                            <div className="text-left">
                                                <div className={`font-black text-lg ${contentType === 'article' ? 'text-blue-900' : 'text-gray-600'}`}>Daily Feed</div>
                                                <div className="text-xs text-blue-500/60 font-bold">Deep Link: News Feed</div>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setContentType('question_set')}
                                            className={`flex items-center gap-4 p-6 rounded-3xl border-2 transition-all group ${contentType === 'question_set'
                                                ? 'border-blue-600 bg-blue-50/50'
                                                : 'border-gray-50 bg-gray-50/50 hover:bg-white hover:border-gray-200'
                                                }`}
                                        >
                                            <div className={`p-3.5 rounded-2xl transition-all ${contentType === 'question_set' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-gray-400 group-hover:text-blue-500 shadow-sm'}`}>
                                                <IoFileTrayFullOutline size={24} />
                                            </div>
                                            <div className="text-left">
                                                <div className={`font-black text-lg ${contentType === 'question_set' ? 'text-blue-900' : 'text-gray-600'}`}>Practice Set</div>
                                                <div className="text-xs text-blue-500/60 font-bold">Deep Link: Question Bank</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Date Filter */}
                                <div>
                                    <label className="block text-sm font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">
                                        2. Broadcast Date
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10 text-blue-600">
                                            <IoCalendarOutline size={24} />
                                        </div>
                                        <DatePicker
                                            selected={selectedDate}
                                            onChange={(date: Date | null) => setSelectedDate(date)}
                                            className="w-full pl-16 pr-6 py-5 bg-gray-50 border-none rounded-[2rem] font-bold text-gray-800 text-lg hover:bg-blue-50/50 focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer shadow-inner"
                                            dateFormat="EEEE, MMMM d, yyyy"
                                        />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-hover:text-blue-400 transition-colors">
                                            <IoArrowForward size={20} />
                                        </div>
                                    </div>
                                    <p className="mt-3 text-[10px] text-gray-400 font-bold uppercase tracking-widest px-2">
                                        This will alert students about all content published on this specific calendar day.
                                    </p>
                                </div>

                                {/* Custom Message */}
                                <div className="space-y-6 pt-6 border-t-2 border-dashed border-gray-100">
                                    <label className="block text-sm font-black text-gray-400 uppercase tracking-[0.2em]">
                                        3. Push Creative Content
                                    </label>
                                    <div className="space-y-5">
                                        <div>
                                            <div className="text-[10px] font-black text-blue-500 mb-2 uppercase ml-3">Notification Title</div>
                                            <input
                                                type="text"
                                                placeholder="Enter a punchy title..."
                                                value={customTitle}
                                                onChange={(e) => setCustomTitle(e.target.value)}
                                                className="w-full p-5 bg-gray-100 border-none rounded-3xl font-black text-gray-800 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                            />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-blue-500 mb-2 uppercase ml-3">Notification Body</div>
                                            <textarea
                                                placeholder="Describe what's new for today..."
                                                value={customBody}
                                                onChange={(e) => setCustomBody(e.target.value)}
                                                rows={3}
                                                className="w-full p-5 bg-gray-100 border-none rounded-3xl font-bold text-gray-700 focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none"
                                            />
                                            <p className="mt-4 text-[11px] text-slate-400 font-medium italic px-3 leading-relaxed">
                                                Native push notifications for iOS and Android can be implemented via Engagespot once the application has been officially published to the Play Store and App Store.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Preview Column */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-2">Mobile Snapshot</h3>

                            {/* Device Preview */}
                            <div className="bg-[#0f172a] p-8 rounded-[3.5rem] border-[12px] border-slate-800 shadow-2xl aspect-[9/18.5] relative overflow-hidden group">
                                {/* Notch */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-9 bg-slate-800 rounded-b-3xl z-20"></div>

                                {/* Lock Screen Items */}
                                <div className="mt-14 space-y-4 text-white/90 text-center">
                                    <div className="text-6xl font-thin tracking-tighter mt-10">09:41</div>
                                    <div className="text-xs font-medium opacity-80 uppercase tracking-[0.3em]">Tuesday, 24 February</div>
                                </div>

                                {/* Notification Card */}
                                <div className="mt-20 px-1 relative z-10 transition-transform group-hover:scale-105 duration-500">
                                    <AnimatePresence mode="wait">
                                        {itemsCount > 0 ? (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                className="bg-white/80 backdrop-blur-3xl rounded-[2rem] p-5 shadow-2xl border border-white/20"
                                            >
                                                <div className="flex items-center justify-between mb-3 border-b border-gray-100/50 pb-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-[10px] text-white font-black shadow-lg shadow-blue-500/20">PA</div>
                                                        <div className="text-left">
                                                            <span className="text-[10px] font-black text-gray-900 block leading-none">PREPASSIST</span>
                                                            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Automatic Broadcast</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-[9px] font-bold text-blue-600">NOW</span>
                                                </div>
                                                <h4 className="text-sm font-black text-gray-900 mb-1 leading-tight">{customTitle || 'New Content Available!'}</h4>
                                                <p className="text-[11px] text-gray-500 font-bold leading-relaxed line-clamp-3">
                                                    {customBody || `Articles for ${selectedDate?.toLocaleDateString()} have been published. Check out yours now!`}
                                                </p>
                                                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                                    <span className="text-[9px] font-black text-blue-500 underline uppercase tracking-widest">Click to View {contentType === 'article' ? 'Feed' : 'Bank'}</span>
                                                    <IoArrowForward size={12} className="text-blue-500" />
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-40 opacity-30 text-white text-center px-4">
                                                <IoInformationCircleOutline size={48} className="mb-3 text-blue-400" />
                                                <p className="text-xs font-black uppercase tracking-widest">Awaiting Date Selection</p>
                                                <p className="text-[10px] mt-1 font-medium italic">No content detected for selected date</p>
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Mock wallpaper effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e1b4b] -z-10"></div>

                                {/* Home Bar */}
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/20 rounded-full"></div>
                            </div>

                            {/* Status and Action */}
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                                {message && (
                                    <div className={`p-4 rounded-2xl flex items-start gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                        {message.type === 'success' ? <IoCheckmarkCircle className="text-xl shrink-0" /> : <IoAlertCircle className="text-xl shrink-0" />}
                                        <span className="text-xs font-black uppercase tracking-tight">{message.text}</span>
                                    </div>
                                )}

                                <button
                                    onClick={sendNotification}
                                    disabled={sending || itemsCount === 0}
                                    className="w-full group bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 text-white p-6 rounded-[2rem] font-black text-xl transition-all shadow-xl shadow-blue-500/20 disabled:shadow-none flex items-center justify-center gap-3 active:scale-95"
                                >
                                    {sending ? (
                                        <>
                                            <div className="w-7 h-7 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                            Broadcasting...
                                        </>
                                    ) : (
                                        <>
                                            <IoRocketOutline className="text-2xl group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            Send Dashboard Signal
                                        </>
                                    )}
                                </button>
                                <div className="bg-blue-50 p-4 rounded-2xl">
                                    <div className="flex items-center gap-3 text-blue-600 mb-2">
                                        <div className="p-1 px-2 bg-blue-100 rounded text-[9px] font-black uppercase">Deep Link</div>
                                        <div className="text-[10px] font-bold truncate max-w-[150px]">
                                            {contentType === 'article' ? '/Articles?type=articles...' : '/questions?type=questionpaper...'}
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-blue-400 font-bold leading-tight">
                                        Universal redirection is enabled. Clicking this notification will direct all users to the {contentType === 'article' ? 'News Feed' : 'Question Bank'} screen.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm"
                    >
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <h2 className="font-black text-gray-900 uppercase tracking-[0.2em] text-xs">Broadcast Logs</h2>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase">
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-lg shadow-blue-500/30"></div>
                                    Daily Feed
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase">
                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/30"></div>
                                    Practice Set
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left border-b border-gray-50">
                                        <th className="p-8 font-black text-gray-400 uppercase tracking-widest text-[10px]">Transmission Payload</th>
                                        <th className="p-8 font-black text-gray-400 uppercase tracking-widest text-[10px]">Net Reach</th>
                                        <th className="p-8 font-black text-gray-400 uppercase tracking-widest text-[10px]">Timestamp</th>
                                        <th className="p-8 font-black text-gray-400 uppercase tracking-widest text-[10px]">Verification</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {notifications.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-24 text-center">
                                                <div className="flex flex-col items-center opacity-10">
                                                    <IoTimeOutline size={80} className="mb-6" />
                                                    <p className="text-2xl font-black italic uppercase tracking-widest">No Transmissions Recorded</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        notifications.map((notif) => (
                                            <tr key={notif.id} className="hover:bg-blue-50/30 transition-colors group">
                                                <td className="p-8">
                                                    <div className="flex items-center gap-6">
                                                        <div className={`p-4 rounded-2xl shadow-sm transition-transform group-hover:scale-110 ${notif.type === 'article' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                            {notif.type === 'article' ? <IoNewspaperOutline size={24} /> : <IoFileTrayFullOutline size={24} />}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-gray-900 text-base mb-0.5">{notif.title}</div>
                                                            <div className="text-xs text-gray-400 font-bold truncate max-w-sm">{notif.body}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                                            <IoPeopleOutline size={18} />
                                                        </div>
                                                        <div>
                                                            <span className="font-black text-gray-900 text-lg block leading-none">{notif.recipient_count || 0}</span>
                                                            <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">Endpoints</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <div className="text-sm font-black text-gray-800 mb-0.5">
                                                        {new Date(notif.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </div>
                                                    <div className="text-[10px] text-blue-500 font-black uppercase tracking-widest">
                                                        {new Date(notif.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest border border-green-100 shadow-sm shadow-green-500/10">
                                                        <IoCheckmarkCircle className="text-base" />
                                                        Broadcast Confirmed
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
