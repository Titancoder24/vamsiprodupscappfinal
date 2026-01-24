/**
 * Web Scraper Service - Enhanced Version
 * Handles scraping of article content from URLs
 * Uses multiple CORS proxies with intelligent fallback
 */

export interface ScrapedArticle {
    url: string;
    title: string;
    content: string;
    contentBlocks: ContentBlock[];
    author?: string;
    publishedDate?: string;
    metaDescription?: string;
    featuredImage?: string;
    error?: string;
}

export interface ContentBlock {
    type: 'heading' | 'paragraph' | 'bullet' | 'numbered' | 'quote';
    content: string;
    level?: number;
    items?: string[];
}

import { NoteBlock } from './localNotesStorage';

/**
 * Helper to convert scraped blocks to NoteBlocks
 */
export const contentBlocksToNoteBlocks = (blocks: ContentBlock[]): NoteBlock[] => {
    return blocks.map((block) => {
        let type: NoteBlock['type'] = 'paragraph';

        if (block.type === 'heading') {
            type = block.level === 1 ? 'h1' : block.level === 2 ? 'h2' : 'h3';
        } else if (block.type === 'numbered') {
            type = 'numbered';
        } else if (block.type === 'bullet') {
            type = 'bullet';
        } else if (block.type === 'quote') {
            type = 'quote';
        }

        return {
            id: Math.random().toString(36).substr(2, 9),
            type,
            content: block.items ? block.items.join('\n') : block.content,
        };
    });
};

/**
 * CORS Proxy configurations - multiple fallbacks
 */
const CORS_PROXIES = [
    {
        name: 'AllOrigins',
        getUrl: (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    },
    {
        name: 'CORSProxy.io',
        getUrl: (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    },
    {
        name: 'ThingProxy',
        getUrl: (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
    },
    {
        name: 'CORS Anywhere Demo',
        getUrl: (url: string) => `https://cors-anywhere.herokuapp.com/${url}`,
    },
];

/**
 * Fetch HTML with timeout and multiple proxy fallback
 */
async function fetchWithProxies(url: string): Promise<string> {
    const errors: string[] = [];

    for (const proxy of CORS_PROXIES) {
        try {
            console.log(`[WebScraper] Trying ${proxy.name}...`);
            const proxyUrl = proxy.getUrl(url);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

            const response = await fetch(proxyUrl, {
                signal: controller.signal,
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const html = await response.text();

            if (!html || html.length < 500) {
                throw new Error('Response too short');
            }

            // Check if we got an error page or CAPTCHA
            if (html.includes('captcha') || html.includes('blocked') || html.includes('Access Denied')) {
                throw new Error('Site blocked access');
            }

            console.log(`[WebScraper] ✓ ${proxy.name} succeeded, got ${html.length} chars`);
            return html;

        } catch (error: any) {
            const errorMsg = error.name === 'AbortError' ? 'Timeout' : error.message;
            errors.push(`${proxy.name}: ${errorMsg}`);
            console.warn(`[WebScraper] ${proxy.name} failed:`, errorMsg);
        }
    }

    throw new Error(`All proxies failed. Details: ${errors.join('; ')}`);
}

/**
 * Extract text content from HTML, stripping tags
 */
function stripHtml(html: string): string {
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Extract main content from HTML - Enhanced version
 */
function extractMainContent(html: string): string {
    // Priority 1: Look for article-specific containers
    const contentSelectors = [
        /<article[^>]*>([\s\S]*?)<\/article>/i,
        /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*article-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*content-area[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*id="content"[^>]*>([\s\S]*?)<\/div>/i,
        /<main[^>]*>([\s\S]*?)<\/main>/i,
    ];

    for (const regex of contentSelectors) {
        const match = html.match(regex);
        if (match && match[1] && match[1].length > 200) {
            console.log('[WebScraper] Found content container');
            return match[1];
        }
    }

    // Priority 2: Remove non-content elements and return the rest
    let content = html;

    // Remove header, footer, nav, aside, scripts, styles
    const removePatterns = [
        /<header\b[^>]*>[\s\S]*?<\/header>/gi,
        /<footer\b[^>]*>[\s\S]*?<\/footer>/gi,
        /<nav\b[^>]*>[\s\S]*?<\/nav>/gi,
        /<aside\b[^>]*>[\s\S]*?<\/aside>/gi,
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
        /<!--[\s\S]*?-->/g,
        /<div[^>]*class="[^"]*(?:sidebar|widget|ads?|advertisement|comment|social|share|related|menu|navigation)[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
    ];

    for (const pattern of removePatterns) {
        content = content.replace(pattern, '');
    }

    return content;
}

/**
 * Parse HTML into structured content blocks
 */
function parseHtmlToBlocks(html: string): ContentBlock[] {
    const blocks: ContentBlock[] = [];
    const cleanHtml = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Extract headings
    const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
    let match;
    while ((match = headingRegex.exec(cleanHtml)) !== null) {
        const level = parseInt(match[1]);
        const content = stripHtml(match[2]);
        if (content && content.length > 2) {
            blocks.push({ type: 'heading', level, content });
        }
    }

    // Extract paragraphs
    const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    while ((match = paragraphRegex.exec(cleanHtml)) !== null) {
        const content = stripHtml(match[1]);
        if (content && content.length > 30) { // Only meaningful paragraphs
            blocks.push({ type: 'paragraph', content });
        }
    }

    // Extract lists
    const listRegex = /<(ul|ol)[^>]*>([\s\S]*?)<\/\1>/gi;
    while ((match = listRegex.exec(cleanHtml)) !== null) {
        const listType = match[1];
        const listItemsMatch = match[2].match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
        const items = listItemsMatch
            .map(item => stripHtml(item))
            .filter(item => item && item.length > 5);

        if (items.length > 0) {
            blocks.push({
                type: listType === 'ol' ? 'numbered' : 'bullet',
                content: items.join(', '),
                items
            });
        }
    }

    // Extract blockquotes
    const blockquoteRegex = /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi;
    while ((match = blockquoteRegex.exec(cleanHtml)) !== null) {
        const content = stripHtml(match[1]);
        if (content && content.length > 10) {
            blocks.push({ type: 'quote', content });
        }
    }

    return blocks;
}

/**
 * Process HTML and extract article data
 */
function processHtml(html: string, url: string): ScrapedArticle {
    console.log('[WebScraper] Processing HTML, length:', html.length);

    // Extract metadata
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    let title = titleMatch ? stripHtml(titleMatch[1]) : '';

    // Try og:title (usually cleaner)
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    if (ogTitleMatch) title = ogTitleMatch[1];

    // Clean title (remove site name suffix)
    title = title.replace(/\s*[|\-–—:]\s*[^|]*$/g, '').trim();

    // Meta description
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const metaDescription = metaDescMatch ? metaDescMatch[1] : undefined;

    // Author
    const authorMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);
    const author = authorMatch ? authorMatch[1] : undefined;

    // Published date
    const dateMatch = html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i);
    const publishedDate = dateMatch ? dateMatch[1] : undefined;

    // Featured image
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    const featuredImage = ogImageMatch ? ogImageMatch[1] : undefined;

    // Extract and parse main content
    const mainContent = extractMainContent(html);
    const contentBlocks = parseHtmlToBlocks(mainContent);

    // Generate plain text content
    let plainContent = '';
    if (contentBlocks.length > 0) {
        plainContent = contentBlocks
            .map(b => {
                if (b.type === 'heading') return `\n## ${b.content}\n`;
                if (b.items) return b.items.map(i => `• ${i}`).join('\n');
                return b.content;
            })
            .join('\n\n');
    } else {
        // Fallback: Extract all paragraph-like text
        plainContent = stripHtml(mainContent);
        if (plainContent.length > 5000) {
            plainContent = plainContent.substring(0, 5000) + '...';
        }
    }

    // Validation
    if (!plainContent || plainContent.length < 100) {
        console.warn('[WebScraper] Content extraction yielded minimal content');
        // Try to get SOMETHING from the page
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
            plainContent = stripHtml(bodyMatch[1]).substring(0, 3000);
        }
    }

    console.log('[WebScraper] Extracted:', {
        title: title.substring(0, 50),
        contentLength: plainContent.length,
        blocksCount: contentBlocks.length
    });

    return {
        url,
        title: title || 'Untitled Article',
        content: plainContent || 'No content could be extracted from this page.',
        contentBlocks,
        author,
        publishedDate,
        metaDescription,
        featuredImage
    };
}

/**
 * Main scraping function
 */
export const smartScrape = async (url: string): Promise<ScrapedArticle> => {
    try {
        console.log('[WebScraper] Starting scrape for:', url);

        // Validate URL
        if (!isValidUrl(url)) {
            throw new Error('Invalid URL format');
        }

        // Fetch HTML via proxies
        const html = await fetchWithProxies(url);

        // Process and return
        return processHtml(html, url);

    } catch (error: any) {
        console.error('[WebScraper] Error:', error);
        return {
            url,
            title: 'Failed to Scrape Article',
            content: '',
            contentBlocks: [],
            error: error.message || 'Unknown error occurred. The website may be blocking automated access.'
        };
    }
};

/**
 * Check if URL is valid
 */
export const isValidUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

/**
 * Extract domain from URL
 */
export const extractDomain = (url: string): string => {
    try {
        const parsed = new URL(url);
        return parsed.hostname.replace('www.', '');
    } catch {
        return url;
    }
};

export default {
    smartScrape,
    isValidUrl,
    extractDomain,
    contentBlocksToNoteBlocks,
};
