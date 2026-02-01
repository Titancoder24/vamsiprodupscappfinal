import { supabase } from '../lib/supabase';
import { getAllNotes } from '../features/Notes/services/localNotesStorage';

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

export interface InsightUpdate {
    noteId: string;
    noteTitle: string;
    articleId: string;
    articleTitle: string;
    reason: string;
}

export interface InsightStatus {
    status: 'ok' | 'updates_available';
    message: string;
    updates: InsightUpdate[];
}

export class InsightAgent {
    static async checkNoteStatus(): Promise<InsightStatus> {
        try {
            // 1. Fetch user's local notes - Increase limit to 50 for more comprehensive scanning
            const notes = await getAllNotes();
            const recentNotes = notes.slice(0, 50);

            if (!recentNotes || recentNotes.length === 0) {
                return {
                    status: 'ok',
                    message: "You haven't taken any notes yet. Start writing to get AI insights!",
                    updates: []
                };
            }

            // 2. Fetch more recent articles (last 20)
            const { data: articles, error } = await supabase
                .from('articles')
                .select('id, title, summary, content_text')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error || !articles || articles.length === 0) {
                return {
                    status: 'ok',
                    message: "Everything is fine. Your notes are up to date with the latest information.",
                    updates: []
                };
            }

            // 3. AI Analysis via OpenRouter
            if (!OPENROUTER_API_KEY) {
                console.warn('[InsightAgent] OpenRouter API key missing');
                return {
                    status: 'ok',
                    message: "Everything is fine. Keep studying!",
                    updates: []
                };
            }

            const systemPrompt = `You are a UPSC AI Assistant. Compare the student's notes with recent news articles.
Your goal is to be extremely proactive. If a news article mentions a topic related to a student's note (even if not a direct conflict), suggest it as an update if it provides newer data, a new perspective, or a recent development.

If anything provides an update OR conflicts with an older fact in the notes, identify the match.
If everything is consistent, say everything is fine.

CRITICAL: The "message" field in your JSON output must be exactly 1 or 2 sentences ONLY. No more.

Output ONLY a JSON object:
{
  "status": "ok" | "updates_available",
  "message": "A strictly 1-2 sentence overview message about why these updates matter for UPSC",
  "updates": [{"noteId": "...", "noteTitle": "...", "articleId": "...", "articleTitle": "...", "reason": "..."}]
}`;

            const userPrompt = `Student Notes (Last 50): ${JSON.stringify(recentNotes.map(n => ({ id: n.id, title: n.title, content: n.content.substring(0, 400) })))}
Recent News (Last 20): ${JSON.stringify(articles.map(a => ({ id: a.id, title: a.title, summary: a.summary })))}`;

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://prepassist.in',
                    'X-Title': 'PrepAssist UPSC',
                },
                body: JSON.stringify({
                    model: 'google/gemini-2.0-flash-001',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt },
                    ],
                    response_format: { type: 'json_object' }
                }),
            });

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;

            if (!content) throw new Error('Empty AI response');

            const result = JSON.parse(content.replace(/```json\n?|```/g, '').trim());
            return result;

        } catch (error) {
            console.error('[InsightAgent] Error:', error);
            return {
                status: 'ok',
                message: "Everything is fine. Your notes look solid.",
                updates: []
            };
        }
    }
}
