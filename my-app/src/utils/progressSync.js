// Lightweight Progress Sync Service
// Syncs local progress data to Supabase using user email

import { supabase } from '../lib/supabase';
import { getStats, getStreak, getTestHistory } from './storage';

// Debounce sync to avoid excessive API calls
let syncTimeout = null;
const SYNC_DEBOUNCE_MS = 5000;

/**
 * Sync progress to Supabase (called after test completion or periodically)
 */
export const syncProgressToCloud = async (userEmail) => {
    if (!userEmail) {
        console.log('[ProgressSync] No user email, skipping sync');
        return { success: false, error: 'No user email' };
    }

    try {
        // Get local progress data
        const [stats, streak, history] = await Promise.all([
            getStats(),
            getStreak(),
            getTestHistory(),
        ]);

        // Prepare lightweight progress payload
        const progressData = {
            user_email: userEmail.toLowerCase(),
            total_tests: stats?.totalTests || 0,
            total_questions: stats?.totalQuestions || 0,
            correct_answers: stats?.correctAnswers || 0,
            current_streak: streak?.currentStreak || 0,
            longest_streak: streak?.longestStreak || 0,
            active_days_count: streak?.activeDays?.length || 0,
            total_time_spent: stats?.totalTimeSpent || 0,
            topic_stats: stats?.topicStats || {},
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        // Upsert to Supabase (insert or update based on user_email)
        const { data, error } = await supabase
            .from('user_progress')
            .upsert(progressData, {
                onConflict: 'user_email',
                ignoreDuplicates: false,
            })
            .select();

        if (error) {
            console.error('[ProgressSync] Sync error:', error.message);
            return { success: false, error: error.message };
        }

        console.log('[ProgressSync] Synced successfully');
        return { success: true, data };
    } catch (error) {
        console.error('[ProgressSync] Exception:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Debounced sync - call this frequently, it will batch
 */
export const debouncedSync = (userEmail) => {
    if (syncTimeout) {
        clearTimeout(syncTimeout);
    }
    syncTimeout = setTimeout(() => {
        syncProgressToCloud(userEmail);
    }, SYNC_DEBOUNCE_MS);
};

/**
 * Fetch progress from cloud (for initial load or cross-device sync)
 */
export const fetchProgressFromCloud = async (userEmail) => {
    if (!userEmail) {
        return { success: false, error: 'No user email' };
    }

    try {
        const { data, error } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_email', userEmail.toLowerCase())
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('[ProgressSync] Fetch error:', error.message);
            return { success: false, error: error.message };
        }

        return { success: true, data: data || null };
    } catch (error) {
        console.error('[ProgressSync] Fetch exception:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get leaderboard (top performers)
 */
export const getLeaderboard = async (limit = 10) => {
    try {
        const { data, error } = await supabase
            .from('user_progress')
            .select('user_email, total_tests, correct_answers, total_questions, current_streak')
            .order('correct_answers', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[ProgressSync] Leaderboard error:', error.message);
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error) {
        return { success: false, error: error.message };
    }
};
