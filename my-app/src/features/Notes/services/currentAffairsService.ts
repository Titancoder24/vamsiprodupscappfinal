/**
 * Current Affairs Service
 * Fetches articles from the admin panel API for use in AI Notes
 */

import { API_BASE_URL } from '../../../config/api';

export interface Article {
    id: string;
    title: string;
    content: string;
    source: string;
    date: string;
    category?: string;
    tags?: string[];
    imageUrl?: string;
}

/**
 * Fetch current affairs articles from the API
 */
export const fetchCurrentAffairs = async (limit: number = 50): Promise<Article[]> => {
    try {
        console.log('[CurrentAffairs] Fetching articles...');

        // Try to fetch from the articles API
        const response = await fetch(`${API_BASE_URL}/articles?limit=${limit}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.warn('[CurrentAffairs] API returned:', response.status);
            return [];
        }

        const data = await response.json();
        console.log('[CurrentAffairs] Fetched', data.articles?.length || 0, 'articles');

        return (data.articles || []).map((article: any) => ({
            id: article.id || article._id,
            title: article.title || 'Untitled',
            content: article.content || article.summary || '',
            source: article.source || 'Current Affairs',
            date: article.date || article.createdAt || new Date().toISOString(),
            category: article.category,
            tags: article.tags || [],
            imageUrl: article.imageUrl,
        }));
    } catch (error) {
        console.error('[CurrentAffairs] Error fetching articles:', error);
        return [];
    }
};

/**
 * Search articles by keyword
 */
export const searchArticles = async (query: string): Promise<Article[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/articles?search=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        return (data.articles || []).map((article: any) => ({
            id: article.id || article._id,
            title: article.title || 'Untitled',
            content: article.content || article.summary || '',
            source: article.source || 'Current Affairs',
            date: article.date || article.createdAt || new Date().toISOString(),
            category: article.category,
            tags: article.tags || [],
        }));
    } catch (error) {
        console.error('[CurrentAffairs] Search error:', error);
        return [];
    }
};

export default {
    fetchCurrentAffairs,
    searchArticles,
};
