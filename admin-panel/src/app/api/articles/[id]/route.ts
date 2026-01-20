import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const articleId = parseInt(params.id);
        const supabase = createServerClient();

        const { data: article, error } = await supabase
            .from('articles')
            .select('*')
            .eq('id', articleId)
            .single();

        if (error || !article) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        // Transform snake_case to camelCase
        const transformedArticle = {
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
        };

        return NextResponse.json({ article: transformedArticle });
    } catch (error) {
        console.error('Get article error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const articleId = parseInt(params.id);
        const body = await request.json();
        const { title, author, publishedDate, summary, metaDescription, content, images, gsPaper, subject, tags, isPublished } = body;

        const supabase = createServerClient();

        const updateData: any = { updated_at: new Date().toISOString() };
        if (title !== undefined) updateData.title = title;
        if (author !== undefined) updateData.author = author;
        if (publishedDate !== undefined) updateData.published_date = publishedDate ? new Date(publishedDate).toISOString() : null;
        if (summary !== undefined) updateData.summary = summary;
        if (metaDescription !== undefined) updateData.meta_description = metaDescription;
        if (content !== undefined) updateData.content = content;
        if (images !== undefined) updateData.images = images;
        if (gsPaper !== undefined) updateData.gs_paper = gsPaper;
        if (subject !== undefined) updateData.subject = subject;
        if (tags !== undefined) updateData.tags = tags;
        if (isPublished !== undefined) updateData.is_published = isPublished;

        const { data: updatedArticle, error } = await supabase
            .from('articles')
            .update(updateData)
            .eq('id', articleId)
            .select()
            .single();

        if (error || !updatedArticle) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        // Transform for frontend
        const transformedArticle = {
            id: updatedArticle.id,
            title: updatedArticle.title,
            author: updatedArticle.author,
            publishedDate: updatedArticle.published_date,
            summary: updatedArticle.summary,
            metaDescription: updatedArticle.meta_description,
            content: updatedArticle.content,
            images: updatedArticle.images,
            sourceUrl: updatedArticle.source_url,
            gsPaper: updatedArticle.gs_paper,
            subject: updatedArticle.subject,
            tags: updatedArticle.tags,
            isPublished: updatedArticle.is_published,
            scrapedAt: updatedArticle.scraped_at,
            createdAt: updatedArticle.created_at,
            updatedAt: updatedArticle.updated_at,
        };

        console.log(`Article "${updatedArticle.title}" was updated`);

        return NextResponse.json({ article: transformedArticle });
    } catch (error) {
        console.error('Update article error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const articleId = parseInt(params.id);
        const supabase = createServerClient();

        // First get the article to log
        const { data: article } = await supabase
            .from('articles')
            .select('title')
            .eq('id', articleId)
            .single();

        if (!article) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        const { error } = await supabase
            .from('articles')
            .delete()
            .eq('id', articleId);

        if (error) {
            console.error('Delete article error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log(`Article "${article.title}" was deleted`);

        return NextResponse.json({ message: 'Article deleted successfully' });
    } catch (error) {
        console.error('Delete article error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
