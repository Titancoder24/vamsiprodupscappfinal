import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const gsPaper = searchParams.get('gsPaper') || '';
        const subject = searchParams.get('subject') || '';
        const status = searchParams.get('status') || '';
        const offset = (page - 1) * limit;

        console.log(`GET /api/articles: page=${page}, search=${search}, gsPaper=${gsPaper}, status=${status}`);

        const supabase = createServerClient();

        let query = supabase.from('articles').select('*', { count: 'exact' });

        if (search) {
            query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%`);
        }

        if (gsPaper && gsPaper !== 'all') {
            query = query.eq('gs_paper', gsPaper);
        }

        if (subject && subject !== 'all') {
            query = query.eq('subject', subject);
        }

        if (status === 'published') {
            query = query.eq('is_published', true);
        } else if (status === 'draft') {
            query = query.eq('is_published', false);
        }

        const { data: articles, count, error } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Get articles error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log(`Found ${articles?.length || 0} articles. Total count: ${count}`);

        // Transform snake_case to camelCase for frontend compatibility
        const transformedArticles = articles?.map(article => ({
            id: article.id,
            title: article.title,
            author: article.author,
            publishedDate: article.published_date,
            summary: article.summary,
            metaDescription: article.meta_description,
            content: article.content,
            images: article.images,
            sourceUrl: article.source_url,
            gsPaper: article.gs_paper,
            subject: article.subject,
            tags: article.tags,
            isPublished: article.is_published,
            scrapedAt: article.scraped_at,
            createdAt: article.created_at,
            updatedAt: article.updated_at,
        })) || [];

        return NextResponse.json({
            articles: transformedArticles,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error('Get articles error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, author, publishedDate, summary, metaDescription, content, images, sourceUrl, gsPaper, subject, tags, isPublished } = body;

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const supabase = createServerClient();

        const { data: newArticle, error } = await supabase
            .from('articles')
            .insert({
                title,
                author: author || null,
                published_date: publishedDate ? new Date(publishedDate).toISOString() : null,
                summary: summary || null,
                meta_description: metaDescription || null,
                content: content || [],
                images: images || [],
                source_url: sourceUrl || null,
                gs_paper: gsPaper || null,
                subject: subject || null,
                tags: tags || [],
                is_published: isPublished || false,
                scraped_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('Create article error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Log activity
        console.log(`Article "${newArticle.title}" was saved`);

        // Transform for frontend
        const transformedArticle = {
            id: newArticle.id,
            title: newArticle.title,
            author: newArticle.author,
            publishedDate: newArticle.published_date,
            summary: newArticle.summary,
            metaDescription: newArticle.meta_description,
            content: newArticle.content,
            images: newArticle.images,
            sourceUrl: newArticle.source_url,
            gsPaper: newArticle.gs_paper,
            subject: newArticle.subject,
            tags: newArticle.tags,
            isPublished: newArticle.is_published,
            scrapedAt: newArticle.scraped_at,
            createdAt: newArticle.created_at,
            updatedAt: newArticle.updated_at,
        };

        return NextResponse.json({ article: transformedArticle }, { status: 201 });
    } catch (error) {
        console.error('Create article error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
