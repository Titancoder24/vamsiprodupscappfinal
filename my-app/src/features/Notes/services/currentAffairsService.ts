/**
 * Current Affairs Service
 * Fetches articles from Supabase for use in AI Notes (same data as ArticleDetail screen)
 */

import { supabase } from '../../../lib/supabase';

export interface Article {
    id: string;
    title: string;
    content: string;
    source: string;
    date: string;
    category?: string;
    tags?: string[];
    imageUrl?: string;
    summary?: string;
}

/**
 * Extract plain text from article content (which can be JSON blocks or string)
 */
const extractContentText = (content: any): string => {
    if (!content) return '';

    // If it's a string, try to parse as JSON
    if (typeof content === 'string') {
        try {
            content = JSON.parse(content);
        } catch {
            // It's plain text, return as is
            return content;
        }
    }

    // If it's an array of content blocks (like ArticleDetailScreen expects)
    if (Array.isArray(content)) {
        return content.map(block => {
            if (typeof block === 'string') return block;
            if (block.content) return block.content;
            if (block.items && Array.isArray(block.items)) {
                return block.items.join('\n');
            }
            return '';
        }).filter(Boolean).join('\n\n');
    }

    // If it's an object with content property
    if (typeof content === 'object' && content.content) {
        return content.content;
    }

    return String(content);
};

/**
 * Fetch current affairs articles from Supabase (same as ArticlesScreen/ArticleDetailScreen)
 */
export const fetchCurrentAffairs = async (limit: number = 50): Promise<Article[]> => {
    try {
        console.log('[CurrentAffairs] Fetching articles from Supabase...');

        const { data, error } = await supabase
            .from('articles')
            .select('*')
            .eq('is_published', true)
            .order('published_date', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[CurrentAffairs] Supabase error:', error);
            return [];
        }

        console.log('[CurrentAffairs] Fetched', data?.length || 0, 'articles from Supabase');

        return (data || []).map((article: any) => {
            // Extract content text (handle JSON blocks like ArticleDetail does)
            const contentText = extractContentText(article.content);

            // Combine summary and content for AI
            const fullContent = [
                article.summary || '',
                contentText
            ].filter(Boolean).join('\n\n');

            return {
                id: String(article.id),
                title: article.title || 'Untitled',
                content: fullContent || article.summary || 'No content available',
                source: article.gs_paper || article.source || 'News',
                date: article.published_date || article.created_at || new Date().toISOString(),
                category: article.subject,
                tags: typeof article.tags === 'string' ? JSON.parse(article.tags || '[]') : (article.tags || []),
                imageUrl: article.image_url,
                summary: article.summary,
            };
        });
    } catch (error) {
        console.error('[CurrentAffairs] Error:', error);
        return [];
    }
};

/**
 * Search articles in Supabase
 */
export const searchArticles = async (query: string): Promise<Article[]> => {
    try {
        const { data, error } = await supabase
            .from('articles')
            .select('*')
            .eq('is_published', true)
            .or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
            .order('published_date', { ascending: false })
            .limit(20);

        if (error) {
            console.error('[CurrentAffairs] Search error:', error);
            return [];
        }

        return (data || []).map((article: any) => {
            const contentText = extractContentText(article.content);
            const fullContent = [article.summary || '', contentText].filter(Boolean).join('\n\n');

            return {
                id: String(article.id),
                title: article.title || 'Untitled',
                content: fullContent || 'No content',
                source: article.gs_paper || 'News',
                date: article.published_date || article.created_at || new Date().toISOString(),
                category: article.subject,
                tags: typeof article.tags === 'string' ? JSON.parse(article.tags || '[]') : (article.tags || []),
            };
        });
    } catch (error) {
        console.error('[CurrentAffairs] Search error:', error);
        return [];
    }
};

export default {
    fetchCurrentAffairs,
    searchArticles,
};
