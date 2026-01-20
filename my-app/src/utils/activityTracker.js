// Activity Tracking Service
// Records every question, answer, and activity to Supabase

import { supabase } from '../lib/supabase';

/**
 * Record a single question attempt
 */
export const recordQuestionAttempt = async ({
    userEmail,
    questionText,
    questionTopic,
    selectedAnswer,
    correctAnswer,
    isCorrect,
    timeTakenSeconds = 0,
    testSessionId = null,
}) => {
    if (!userEmail) return { success: false, error: 'No user email' };

    try {
        const { data, error } = await supabase
            .from('question_attempts')
            .insert({
                user_email: userEmail.toLowerCase(),
                question_text: questionText?.substring(0, 500), // Limit text length
                question_topic: questionTopic,
                selected_answer: selectedAnswer,
                correct_answer: correctAnswer,
                is_correct: isCorrect,
                time_taken_seconds: timeTakenSeconds,
                test_session_id: testSessionId,
            })
            .select();

        if (error) {
            console.error('[ActivityTracker] Question attempt error:', error.message);
            return { success: false, error: error.message };
        }

        // Also update daily activity
        await updateDailyActivity(userEmail, {
            questionsAttempted: 1,
            questionsCorrect: isCorrect ? 1 : 0,
            timeSpent: timeTakenSeconds,
        });

        return { success: true, data };
    } catch (error) {
        console.error('[ActivityTracker] Exception:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Record multiple question attempts (batch)
 */
export const recordQuestionAttemptsBatch = async (userEmail, attempts, testSessionId) => {
    if (!userEmail || !attempts?.length) return { success: false };

    try {
        const records = attempts.map(attempt => ({
            user_email: userEmail.toLowerCase(),
            question_text: attempt.questionText?.substring(0, 500),
            question_topic: attempt.questionTopic,
            selected_answer: attempt.selectedAnswer,
            correct_answer: attempt.correctAnswer,
            is_correct: attempt.isCorrect,
            time_taken_seconds: attempt.timeTakenSeconds || 0,
            test_session_id: testSessionId,
        }));

        const { data, error } = await supabase
            .from('question_attempts')
            .insert(records)
            .select();

        if (error) {
            console.error('[ActivityTracker] Batch insert error:', error.message);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Record a complete test session
 */
export const recordTestSession = async ({
    userEmail,
    sessionId,
    topic,
    totalQuestions,
    correctAnswers,
    scorePrecent,
    timeTakenSeconds,
}) => {
    if (!userEmail) return { success: false, error: 'No user email' };

    try {
        const { data, error } = await supabase
            .from('test_sessions')
            .insert({
                user_email: userEmail.toLowerCase(),
                session_id: sessionId || `session_${Date.now()}`,
                topic: topic,
                total_questions: totalQuestions,
                correct_answers: correctAnswers,
                score_percent: scorePrecent,
                time_taken_seconds: timeTakenSeconds,
            })
            .select();

        if (error) {
            console.error('[ActivityTracker] Test session error:', error.message);
            return { success: false, error: error.message };
        }

        // Update daily activity
        await updateDailyActivity(userEmail, {
            testsCompleted: 1,
            questionsAttempted: totalQuestions,
            questionsCorrect: correctAnswers,
            timeSpent: timeTakenSeconds,
            avgScore: scorePrecent,
        });

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Update daily activity (upsert)
 */
export const updateDailyActivity = async (userEmail, updates) => {
    if (!userEmail) return { success: false };

    const today = new Date().toISOString().split('T')[0];

    try {
        // First try to get existing record
        const { data: existing } = await supabase
            .from('daily_activity')
            .select('*')
            .eq('user_email', userEmail.toLowerCase())
            .eq('activity_date', today)
            .single();

        if (existing) {
            // Update existing
            const { error } = await supabase
                .from('daily_activity')
                .update({
                    questions_attempted: (existing.questions_attempted || 0) + (updates.questionsAttempted || 0),
                    questions_correct: (existing.questions_correct || 0) + (updates.questionsCorrect || 0),
                    time_spent_seconds: (existing.time_spent_seconds || 0) + (updates.timeSpent || 0),
                    tests_completed: (existing.tests_completed || 0) + (updates.testsCompleted || 0),
                    avg_score: updates.avgScore || existing.avg_score,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id);

            if (error) console.error('[ActivityTracker] Update error:', error);
        } else {
            // Insert new
            const { error } = await supabase
                .from('daily_activity')
                .insert({
                    user_email: userEmail.toLowerCase(),
                    activity_date: today,
                    questions_attempted: updates.questionsAttempted || 0,
                    questions_correct: updates.questionsCorrect || 0,
                    time_spent_seconds: updates.timeSpent || 0,
                    tests_completed: updates.testsCompleted || 0,
                    avg_score: updates.avgScore || 0,
                });

            if (error) console.error('[ActivityTracker] Insert error:', error);
        }

        return { success: true };
    } catch (error) {
        console.error('[ActivityTracker] Daily activity error:', error);
        return { success: false };
    }
};

/**
 * Get user's complete history from cloud
 */
export const getUserHistory = async (userEmail, days = 30) => {
    if (!userEmail) return { success: false, data: null };

    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get daily activity
        const { data: dailyData } = await supabase
            .from('daily_activity')
            .select('*')
            .eq('user_email', userEmail.toLowerCase())
            .gte('activity_date', startDate.toISOString().split('T')[0])
            .order('activity_date', { ascending: false });

        // Get test sessions
        const { data: sessions } = await supabase
            .from('test_sessions')
            .select('*')
            .eq('user_email', userEmail.toLowerCase())
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: false })
            .limit(50);

        // Get total stats
        const { data: totalStats } = await supabase
            .from('question_attempts')
            .select('is_correct')
            .eq('user_email', userEmail.toLowerCase());

        const totalQuestions = totalStats?.length || 0;
        const totalCorrect = totalStats?.filter(q => q.is_correct).length || 0;

        return {
            success: true,
            data: {
                dailyActivity: dailyData || [],
                testSessions: sessions || [],
                allTimeStats: {
                    totalQuestions,
                    totalCorrect,
                    accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
                },
            },
        };
    } catch (error) {
        console.error('[ActivityTracker] Get history error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get streak data from cloud
 */
export const getStreakFromCloud = async (userEmail) => {
    if (!userEmail) return { currentStreak: 0, longestStreak: 0 };

    try {
        const { data } = await supabase
            .from('daily_activity')
            .select('activity_date')
            .eq('user_email', userEmail.toLowerCase())
            .gte('questions_attempted', 1)
            .order('activity_date', { ascending: false });

        if (!data?.length) return { currentStreak: 0, longestStreak: 0, activeDays: [] };

        // Calculate streaks
        const dates = data.map(d => new Date(d.activity_date));
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        let lastDate = null;

        for (const date of dates) {
            date.setHours(0, 0, 0, 0);

            if (!lastDate) {
                // Check if most recent activity was today or yesterday
                const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
                if (diffDays <= 1) {
                    tempStreak = 1;
                    currentStreak = 1;
                }
            } else {
                const diff = Math.floor((lastDate - date) / (1000 * 60 * 60 * 24));
                if (diff === 1) {
                    tempStreak++;
                    if (currentStreak > 0) currentStreak++;
                } else {
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 1;
                    if (currentStreak > 0) currentStreak = 0;
                }
            }
            lastDate = date;
        }

        longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

        return {
            currentStreak,
            longestStreak,
            activeDays: data.map(d => d.activity_date),
        };
    } catch (error) {
        console.error('[ActivityTracker] Streak error:', error);
        return { currentStreak: 0, longestStreak: 0, activeDays: [] };
    }
};
