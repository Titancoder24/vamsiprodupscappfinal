import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Public endpoint - no auth required
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const paper = searchParams.get('paper');

        const supabase = createServerClient();

        // Get topics
        let topicsQuery = supabase.from('roadmap_topics').select('*');

        if (paper && paper !== 'all') {
            topicsQuery = topicsQuery.eq('paper', paper);
        }

        const { data: topics, error: topicsError } = await topicsQuery.order('paper').order('name');

        if (topicsError) {
            console.error('Get roadmap topics error:', topicsError);
            return NextResponse.json({ error: topicsError.message }, { status: 500, headers: corsHeaders });
        }

        // Fetch subtopics and sources for each topic
        const topicsWithRelations = await Promise.all(
            (topics || []).map(async (topic) => {
                const { data: subtopics } = await supabase
                    .from('roadmap_subtopics')
                    .select('*')
                    .eq('topic_id', topic.id)
                    .order('order');

                const { data: sources } = await supabase
                    .from('roadmap_sources')
                    .select('*')
                    .eq('topic_id', topic.id)
                    .order('order');

                return {
                    id: topic.id,
                    name: topic.name,
                    description: topic.description,
                    paper: topic.paper,
                    icon: topic.icon,
                    color: topic.color,
                    estimatedHours: topic.estimated_hours,
                    subtopics: (subtopics || []).map(st => ({
                        id: st.subtopic_id || st.id,
                        name: st.name,
                        estimatedHours: st.estimated_hours,
                    })),
                    sources: (sources || []).map(src => ({
                        type: src.type,
                        name: src.name,
                        link: src.link,
                    })),
                };
            })
        );

        return NextResponse.json({ topics: topicsWithRelations }, { headers: corsHeaders });
    } catch (error: any) {
        console.error('Get roadmap error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500, headers: corsHeaders });
    }
}
