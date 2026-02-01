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
const CHECK_INTERVAL_MS = 60 * 1000; // REDUCED TO 1 MINUTE

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
        // 1. Get all tags
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

        // 2. Get topics from note titles & content
        const notes = await getAllNotes();
        for (const note of notes) {
            if (note.title && note.title !== 'Untitled') {
                const title = note.title.toLowerCase().trim();
                if (title && !addedKeywords.has(title)) {
                    topics.push({
                        keyword: title,
                        tagColor: '#6B7280',
                        source: 'note_title',
                    });
                    addedKeywords.add(title);
                }

                // Add title words
                const words = title.split(/\s+/).filter(w => w.length > 3 && !isCommonWord(w));
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
            }
        }

        return topics;
    } catch (error) {
        console.error('[NewsMatch] Error getting topics:', error);
        return [];
    }
};

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
        console.log('[NewsMatch] Starting refresh...');

        // 1. Get user's study topics
        const topics = await getUserStudyTopics();
        if (topics.length === 0) {
            console.log('[NewsMatch] No study topics found');
            return [];
        }

        // 2. Fetch latest news articles
        const response = await fetch(`${MOBILE_API_URL}/articles?page=1&limit=50`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();
        const articles = data.articles || [];

        // 3. Match logic
        const matches: MatchedArticle[] = [];
        const processedArticleIds = new Set<number>();

        const synonymMap: Record<string, string[]> = {
            'aadhar': ['aadhaar', 'uidai', 'biometric'],
            'aadhaar': ['aadhar', 'uidai', 'biometric'],
            'gst': ['goods and services tax'],
            'isro': ['space', 'satellite', 'pslv'],
        };

        for (const article of articles) {
            const articleText = `${article.title} ${article.summary || ''} ${article.content_text || ''}`.toLowerCase();

            for (const topic of topics) {
                const keyword = topic.keyword;
                const variants = [keyword, ...(synonymMap[keyword] || [])];

                const isMatch = variants.some(v => articleText.includes(v));

                if (isMatch) {
                    matches.push({
                        noteId: 1,
                        noteTitle: topic.keyword,
                        articleId: article.id,
                        articleTitle: article.title,
                        articleSummary: article.summary || '',
                        articleSource: article.source,
                        matchReason: `Knowledge Match: "${topic.keyword}"`,
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

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
        console.log(`[NewsMatch] Found ${matches.length} matches`);
        return matches;

    } catch (error) {
        console.error('[NewsMatch] Error:', error);
        return [];
    }
};

export const markMatchAsRead = async (articleId: number): Promise<void> => {
    try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached) {
            const matches: MatchedArticle[] = JSON.parse(cached);
            const updated = matches.map(m => m.articleId === articleId ? { ...m, isRead: true } : m);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
    } catch (e) { }
};

export const getUnreadMatchCount = async (): Promise<number> => {
    try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached) {
            const matches: MatchedArticle[] = JSON.parse(cached);
            return matches.filter(m => !m.isRead).length;
        }
        return 0;
    } catch (e) { return 0; }
};

export const clearAllMatches = async (): Promise<void> => {
    await AsyncStorage.removeItem(STORAGE_KEY);
};

export const forceRefreshMatches = async (): Promise<MatchedArticle[]> => {
    return checkNewsMatches();
};
