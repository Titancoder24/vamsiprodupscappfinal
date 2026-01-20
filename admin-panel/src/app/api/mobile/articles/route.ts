import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle preflight requests
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Public endpoint - no auth required
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const source = searchParams.get('source'); // TH, ET, or PIB
        const gsPaper = searchParams.get('gsPaper'); // Keep for backward compatibility
        const subject = searchParams.get('subject');
        const dateParam = searchParams.get('date');
        const offset = (page - 1) * limit;

        const supabase = createServerClient();

        // Map source abbreviations to full names
        const sourceMap: { [key: string]: string } = {
            'TH': 'The Hindu',
            'ET': 'The Economic Times',
            'PIB': 'Press Information Bureau',
        };

        let query = supabase
            .from('articles')
            .select('id, title, author, summary, gs_paper, subject, tags, published_date, created_at', { count: 'exact' })
            .eq('is_published', true);

        // If source parameter is provided, use it; otherwise fall back to gsPaper for backward compatibility
        if (source && sourceMap[source]) {
            query = query.eq('gs_paper', sourceMap[source]);
        } else if (gsPaper) {
            query = query.eq('gs_paper', gsPaper);
        }

        if (subject) {
            query = query.eq('subject', subject);
        }

        if (dateParam) {
            // Filter by specific date (ignoring time)
            const startDate = new Date(dateParam);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(dateParam);
            endDate.setHours(23, 59, 59, 999);

            query = query.gte('published_date', startDate.toISOString());
            query = query.lte('published_date', endDate.toISOString());
        }

        const { data: publishedArticles, count: totalCount, error } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Handle Supabase range error gracefully - if offset is beyond data, return empty
        if (error) {
            const errorMessage = typeof error.message === 'string' ? error.message : JSON.stringify(error);
            console.error('Get articles error:', errorMessage);

            // Check if it's a range error (no rows) - return empty array instead of error
            if (error.code === 'PGRST103' || errorMessage?.includes('range') || publishedArticles === null) {
                return NextResponse.json({
                    articles: [],
                    pagination: {
                        page,
                        limit,
                        total: totalCount || 0,
                        totalPages: Math.ceil((totalCount || 0) / limit),
                    },
                }, { headers: corsHeaders });
            }
            return NextResponse.json({ error: errorMessage }, { status: 500, headers: corsHeaders });
        }

        // If offset is beyond available data, return empty array
        if (!publishedArticles || publishedArticles.length === 0) {
            return NextResponse.json({
                articles: [],
                pagination: {
                    page,
                    limit,
                    total: totalCount || 0,
                    totalPages: Math.ceil((totalCount || 0) / limit),
                },
            }, { headers: corsHeaders });
        }

        // Transform snake_case to camelCase for mobile app
        const transformedArticles = publishedArticles?.map(article => ({
            id: article.id,
            title: article.title,
            author: article.author,
            summary: article.summary,
            gsPaper: article.gs_paper,
            subject: article.subject,
            tags: article.tags,
            publishedDate: article.published_date,
            createdAt: article.created_at,
        })) || [];

        return NextResponse.json({
            articles: transformedArticles,
            pagination: {
                page,
                limit,
                total: totalCount || 0,
                totalPages: Math.ceil((totalCount || 0) / limit),
            },
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Get articles error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
    }
}
