/**
 * News Match Service - Intelligent Topic Matching
 * 
 * Matches user's study topics (from Notes tags) with current affairs news.
 * Creates personalized "Knowledge Radar" notifications.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllNotes, getAllTags, LocalTag } from '../features/Notes/services/localNotesStorage';
import { MOBILE_API_URL } from '../config/api';

const STORAGE_KEY = '@upsc_news_matches';
const LAST_CHECK_KEY = '@upsc_last_news_check';
const CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

export interface MatchedArticle {
    noteId: number;
    noteTitle: string;
    articleId: number;
    articleTitle: string;
    articleSummary: string;
    articleSource?: string;
    matchReason: string;
    matchedTag: string;
    tagColor: string;
    matchedAt: string;
    isRead: boolean;
}

export interface UserStudyTopic {
    keyword: string;
    tagId?: number;
    tagColor: string;
    source: 'tag' | 'note_title' | 'note_content';
}

/**
 * Get all user's study topics from their notes and tags
 */
export const getUserStudyTopics = async (): Promise<UserStudyTopic[]> => {
    const topics: UserStudyTopic[] = [];
    const addedKeywords = new Set<string>();

    try {
        // 1. Get all tags (including user-created ones)
        const allTags = await getAllTags();
        for (const tag of allTags) {
            const keyword = tag.name.toLowerCase().trim();
            if (keyword.length > 2 && !addedKeywords.has(keyword)) {
                topics.push({
                    keyword,
                    tagId: tag.id,
                    tagColor: tag.color,
                    source: 'tag',
                });
                addedKeywords.add(keyword);
            }
        }

        // 2. Get topics from note titles
        const notes = await getAllNotes();
        for (const note of notes) {
            // Add note title words as topics
            if (note.title && note.title !== 'Untitled') {
                // Extract meaningful words (3+ chars)
                const words = note.title
                    .toLowerCase()
                    .split(/\s+/)
                    .filter(w => w.length > 3 && !isCommonWord(w));

                for (const word of words) {
                    if (!addedKeywords.has(word)) {
                        topics.push({
                            keyword: word,
                            tagColor: '#6B7280',
                            source: 'note_title',
                        });
                        addedKeywords.add(word);
                    }
                }

                // Also add full title as phrase
                const fullTitle = note.title.toLowerCase().trim();
                if (fullTitle.length > 4 && !addedKeywords.has(fullTitle)) {
                    topics.push({
                        keyword: fullTitle,
                        tagColor: '#6B7280',
                        source: 'note_title',
                    });
                    addedKeywords.add(fullTitle);
                }
            }

            // Add note tags
            for (const tag of note.tags) {
                const keyword = tag.name.toLowerCase().trim();
                if (!addedKeywords.has(keyword)) {
                    topics.push({
                        keyword,
                        tagId: tag.id,
                        tagColor: tag.color,
                        source: 'tag',
                    });
                    addedKeywords.add(keyword);
                }
            }
        }

        console.log(`[NewsMatch] Found ${topics.length} study topics`);
        return topics;
    } catch (error) {
        console.error('[NewsMatch] Error getting topics:', error);
        return [];
    }
};

/**
 * Common words to ignore
 */
const COMMON_WORDS = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can',
    'had', 'her', 'was', 'one', 'our', 'out', 'has', 'his', 'how',
    'its', 'may', 'new', 'now', 'old', 'see', 'way', 'who', 'boy',
    'did', 'get', 'let', 'put', 'say', 'she', 'too', 'use', 'with',
    'from', 'have', 'this', 'will', 'your', 'that', 'they', 'been',
    'note', 'notes', 'study', 'chapter', 'unit', 'page', 'book',
    'about', 'important', 'topic', 'lesson', 'class', 'exam',
]);

const isCommonWord = (word: string): boolean => {
    return COMMON_WORDS.has(word.toLowerCase());
};

/**
 * Check for news that match user's study topics
 */
export const checkNewsMatches = async (): Promise<MatchedArticle[]> => {
    try {
        // Check if we need to fetch (rate limiting)
        const lastCheck = await AsyncStorage.getItem(LAST_CHECK_KEY);
        const cachedMatches = await AsyncStorage.getItem(STORAGE_KEY);

        if (lastCheck && cachedMatches) {
            const elapsed = Date.now() - parseInt(lastCheck);
            if (elapsed < CHECK_INTERVAL_MS) {
                console.log('[NewsMatch] Using cached matches');
                const parsed = JSON.parse(cachedMatches);
                return parsed.filter((m: MatchedArticle) => !m.isRead);
            }
        }

        // 1. Get user's study topics
        const topics = await getUserStudyTopics();
        if (topics.length === 0) {
            console.log('[NewsMatch] No study topics found');
            return [];
        }

        // 2. Fetch latest news articles
        const response = await fetch(`${MOBILE_API_URL}/articles?page=1&limit=100`);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const articles = data.articles || [];

        // 3. Match logic - find articles that mention user's topics
        const matches: MatchedArticle[] = [];
        const processedArticleIds = new Set<number>();

        // Synonyms for common UPSC terms
        const synonyms: Record<string, string[]> = {
            'aadhar': ['aadhaar'],
            'aadhaar': ['aadhar'],
            'gst': ['goods and services tax'],
            'mgnrega': ['nrega'],
            'isro': ['indian space research organisation'],
            'rbi': ['reserve bank of india'],
            'sc': ['supreme court'],
            'hc': ['high court'],
        };

        for (const article of articles) {
            if (processedArticleIds.has(article.id)) continue;

            const articleText = `${article.title} ${article.summary || ''}`.toLowerCase();

            // Check each topic against this article
            for (const topic of topics) {
                const keyword = topic.keyword;
                const relatedKeywords = [keyword, ...(synonyms[keyword] || [])];

                const isMatch = relatedKeywords.some(revisedKeyword => articleText.includes(revisedKeyword));

                if (isMatch) {
                    matches.push({
                        noteId: 0,
                        noteTitle: topic.source === 'tag' ? `Tag: ${topic.keyword}` : topic.keyword,
                        articleId: article.id,
                        articleTitle: article.title,
                        articleSummary: article.summary || '',
                        articleSource: article.source,
                        matchReason: `Matched topic: "${topic.keyword}"`,
                        matchedTag: topic.keyword,
                        tagColor: topic.tagColor,
                        matchedAt: new Date().toISOString(),
                        isRead: false,
                    });
                    processedArticleIds.add(article.id);
                    break;
                }
            }
        }

        // 4. Cache results
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
        await AsyncStorage.setItem(LAST_CHECK_KEY, Date.now().toString());

        console.log(`[NewsMatch] Found ${matches.length} matching articles`);
        return matches;
    } catch (error) {
        console.error('[NewsMatch] Error checking matches:', error);
        // Return cached if available
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached) {
            return JSON.parse(cached).filter((m: MatchedArticle) => !m.isRead);
        }
        return [];
    }
};

/**
 * Mark a match as read
 */
export const markMatchAsRead = async (articleId: number): Promise<void> => {
    try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached) {
            const matches: MatchedArticle[] = JSON.parse(cached);
            const updated = matches.map(m =>
                m.articleId === articleId ? { ...m, isRead: true } : m
            );
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
    } catch (error) {
        console.error('[NewsMatch] Error marking as read:', error);
    }
};

/**
 * Get unread match count
 */
export const getUnreadMatchCount = async (): Promise<number> => {
    try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached) {
            const matches: MatchedArticle[] = JSON.parse(cached);
            return matches.filter(m => !m.isRead).length;
        }
        return 0;
    } catch (error) {
        return 0;
    }
};

/**
 * Clear all matches (for testing)
 */
export const clearAllMatches = async (): Promise<void> => {
    await AsyncStorage.multiRemove([STORAGE_KEY, LAST_CHECK_KEY]);
};

/**
 * Force refresh matches (bypass cache)
 */
export const forceRefreshMatches = async (): Promise<MatchedArticle[]> => {
    await AsyncStorage.removeItem(LAST_CHECK_KEY);
    return checkNewsMatches();
};
