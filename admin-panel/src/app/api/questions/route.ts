import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { question, optionA, optionB, optionC, optionD, correctAnswer, explanation, questionSetId } = body;

        // Validation
        if (!question || !optionA || !optionB || !optionC || !optionD || !correctAnswer || !explanation) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        if (!questionSetId) {
            return NextResponse.json({ error: 'Question Set ID is required' }, { status: 400 });
        }

        const supabase = createServerClient();

        // Insert into database
        const { data: result, error } = await supabase
            .from('practice_questions')
            .insert({
                question_set_id: parseInt(questionSetId),
                question,
                option_a: optionA,
                option_b: optionB,
                option_c: optionC,
                option_d: optionD,
                correct_answer: correctAnswer,
                explanation,
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding question:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Transform for frontend
        const transformedResult = {
            id: result.id,
            questionSetId: result.question_set_id,
            question: result.question,
            optionA: result.option_a,
            optionB: result.option_b,
            optionC: result.option_c,
            optionD: result.option_d,
            correctAnswer: result.correct_answer,
            explanation: result.explanation,
            createdAt: result.created_at,
        };

        return NextResponse.json({ success: true, data: transformedResult });

    } catch (error: any) {
        console.error('Error adding question:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
