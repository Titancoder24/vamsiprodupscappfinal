import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
    try {
        const supabase = createServerClient();

        const { data: sets, error } = await supabase
            .from('question_sets')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Get question sets error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Transform snake_case to camelCase for frontend
        const transformedSets = sets?.map(set => ({
            id: set.id,
            title: set.title,
            description: set.description,
            year: set.year,
            isPublished: set.is_published,
            createdAt: set.created_at,
            updatedAt: set.updated_at,
        })) || [];

        return NextResponse.json(transformedSets);
    } catch (error: any) {
        console.error('Get question sets error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, description, year } = body;

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const supabase = createServerClient();

        const { data: newSet, error } = await supabase
            .from('question_sets')
            .insert({
                title,
                description: description || null,
                year: year ? parseInt(year) : new Date().getFullYear(),
                is_published: false,
            })
            .select()
            .single();

        if (error) {
            console.error('Create question set error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Transform for frontend
        const transformedSet = {
            id: newSet.id,
            title: newSet.title,
            description: newSet.description,
            year: newSet.year,
            isPublished: newSet.is_published,
            createdAt: newSet.created_at,
            updatedAt: newSet.updated_at,
        };

        return NextResponse.json(transformedSet);
    } catch (error: any) {
        console.error('Create question set error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
