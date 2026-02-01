/**
 * News Match Service - Intelligent Topic Matching (HYBRID & DETERMINISTIC)
 * 
 * Strategy:
 * 1. Read FULL CONTENT of all user notes.
 * 2. Read TITLES of all recent news.
 * 3. Perform aggressive keyword matching locally (0ms latency).
 * 4. This ensures "10s" notification effectively.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllNotes, getAllTags } from '../features/Notes/services/localNotesStorage';
import { MOBILE_API_URL } from '../config/api';

const STORAGE_KEY = '@upsc_news_matches';

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
 * Intelligent Keyword Extraction from Note Text
 * - Removes stop words
 * - Finds unique significant terms
 */
const extractSignificantTerms = (text: string): string[] => {
    if (!text) return [];

    // 1. Clean text (remove special chars, lowercase)
    const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');

    // 2. Split
    const words = clean.split(/\s+/);

    // 3. Filter
    return words.filter(w => w.length > 3 && !isCommonWord(w));
};

const COMMON_WORDS = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'has', 'his', 'how',
    'its', 'may', 'new', 'now', 'old', 'see', 'way', 'who', 'boy', 'did', 'get', 'let', 'put', 'say', 'she', 'too', 'use', 'with',
    'from', 'have', 'this', 'will', 'your', 'that', 'they', 'been', 'note', 'notes', 'study', 'chapter', 'unit', 'page', 'book',
    'about', 'important', 'topic', 'lesson', 'class', 'exam', 'india', 'government', 'indian', 'state', 'what', 'when', 'where'
]);

const isCommonWord = (word: string): boolean => COMMON_WORDS.has(word.toLowerCase());

export const checkNewsMatches = async (): Promise<MatchedArticle[]> => {
    try {
        console.log('[Knowledge Radar] Starting Fast Deterministic Scan (Hybrid Mode)...');

        // 1. Get ALL User Notes (Full Content)
        const notes = await getAllNotes();
        const tags = await getAllTags();

        if (notes.length === 0 && tags.length === 0) return [];

        // 2. Fetch Latest News (Titles Only basically, but we get object)
        const response = await fetch(`${MOBILE_API_URL}/articles?page=1&limit=50`);
        if (!response.ok) throw new Error('API failure');
        const data = await response.json();
        const articles = data.articles || [];

        const matches: MatchedArticle[] = [];
        const processedArticleIds = new Set<number>();

        // 3. Comprehensive Synonym Map for UPSC
        const synonymMap: Record<string, string[]> = {
            'aadhar': ['aadhaar', 'uidai', 'biometric', 'uid'],
            'aadhaar': ['aadhar', 'uidai', 'biometric', 'uid'],
            'gst': ['goods and services tax', 'indirect tax'],
            'isro': ['space', 'satellite', 'launch', 'pslv', 'gslv', 'chandrayaan', 'gaganyaan'],
            'rbi': ['reserve bank', 'monetary policy', 'repo rate'],
            'polity': ['constitution', 'parliament', 'article', 'supreme court'],
            'economy': ['gdp', 'inflation', 'budget', 'fiscal'],
            'farm': ['agriculture', 'msp', 'kisan'],
            'election': ['eci', 'poll', 'voter', 'evm'],
        };

        // 4. THE MATCHING ENGINE (Note Content vs News Title)

        for (const note of notes) {
            // Extract keywords from this specific note (Title + Content)
            const noteKeywords = new Set([
                ...extractSignificantTerms(note.title),
                ...extractSignificantTerms(note.content)
            ]);

            for (const article of articles) {
                if (processedArticleIds.has(article.id)) continue;

                const newsTitle = article.title.toLowerCase();

                // DOES NEWS TITLE CONTAIN ANY KEYWORD FROM THIS NOTE?
                let matchedKeyword = '';

                // Check direct keywords
                for (const kw of noteKeywords) {
                    // Direct match
                    if (newsTitle.includes(kw)) {
                        matchedKeyword = kw;
                        break;
                    }
                    // Synonym match
                    if (synonymMap[kw]) {
                        if (synonymMap[kw].some(syn => newsTitle.includes(syn))) {
                            matchedKeyword = kw;
                            break;
                        }
                    }
                }

                if (matchedKeyword) {
                    console.log(`[Knowledge Radar] MATCH: Note "${note.title}" mentions "${matchedKeyword}" -> Found in News "${article.title}"`);

                    matches.push({
                        noteId: note.id,
                        noteTitle: note.title,
                        articleId: article.id,
                        articleTitle: article.title,
                        articleSummary: article.summary || '',
                        articleSource: article.source,
                        matchReason: `Your note mentions "${matchedKeyword}", which appears in this news title.`,
                        matchedTag: matchedKeyword,
                        tagColor: '#3B82F6',
                        matchedAt: new Date().toISOString(),
                        isRead: false,
                    });
                    processedArticleIds.add(article.id);
                }
            }
        }

        // Also check Tags
        for (const tag of tags) {
            const tagKw = tag.name.toLowerCase();
            for (const article of articles) {
                if (processedArticleIds.has(article.id)) continue;
                const newsTitle = article.title.toLowerCase();
                if (newsTitle.includes(tagKw) || (synonymMap[tagKw] && synonymMap[tagKw].some(s => newsTitle.includes(s)))) {
                    matches.push({
                        noteId: -1,
                        noteTitle: `Tag: ${tag.name}`,
                        articleId: article.id,
                        articleTitle: article.title,
                        articleSummary: article.summary || '',
                        articleSource: article.source,
                        matchReason: `New article matches your tag "${tag.name}"`,
                        matchedTag: tag.name,
                        tagColor: tag.color,
                        matchedAt: new Date().toISOString(),
                        isRead: false,
                    });
                    processedArticleIds.add(article.id);
                }
            }
        }

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
        return matches;
    } catch (error) {
        console.error('[Knowledge Radar] Error:', error);
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
