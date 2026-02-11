import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        const supabase = createServerClient();

        // Get the set details
        const { data: set, error: setError } = await supabase
            .from('question_sets')
            .select('*')
            .eq('id', id)
            .single();

        if (setError || !set) {
            return NextResponse.json({ error: 'Question set not found' }, { status: 404 });
        }

        // Get questions for this set
        const { data: questions, error: questionsError } = await supabase
            .from('practice_questions')
            .select('*')
            .eq('question_set_id', id)
            .order('created_at', { ascending: false });

        if (questionsError) {
            return NextResponse.json({ error: questionsError.message }, { status: 500 });
        }

        // Transform for frontend
        return NextResponse.json({
            id: set.id,
            title: set.title,
            description: set.description,
            year: set.year,
            isPublished: set.is_published,
            publishedDate: set.published_date,
            createdAt: set.created_at,
            updatedAt: set.updated_at,
            questions: questions.map(q => ({
                id: q.id,
                questionSetId: q.question_set_id,
                question: q.question,
                optionA: q.option_a,
                optionB: q.option_b,
                optionC: q.option_c,
                optionD: q.option_d,
                correctAnswer: q.correct_answer,
                explanation: q.explanation,
                createdAt: q.created_at
            }))
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        const supabase = createServerClient();

        // Supabase with cascade delete on foreign keys will handle questions
        const { error } = await supabase
            .from('question_sets')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        const body = await req.json();
        const supabase = createServerClient();

        const { error } = await supabase
            .from('question_sets')
            .update({
                is_published: body.isPublished,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
