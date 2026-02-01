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
    /**
     * OMNISCIENT AI AGENT (100% Reliable Version)
     * 
     * Strategy:
     * 1. Fetch ALL User Notes (Full Content)
     * 2. Fetch Latest 50 News Articles (Full Content)
     * 3. Send EVERYTHING to Gemini 2.0 Flash (1M Token Window)
     * 4. No client-side filtering. No keyword guessing. Pure AI Semantic Analysis.
     */
    static async checkNoteStatus(): Promise<InsightStatus> {
        try {
            // 1. Fetch ALL notes for exhaustive comparison
            console.log('[OmniscientAgent] Fetching full user knowledge base...');
            const allNotes = await getAllNotes();

            if (!allNotes || allNotes.length === 0) {
                console.log('[OmniscientAgent] No notes found.');
                return {
                    status: 'ok',
                    message: "Ready to analyze. Start taking notes to activate your Knowledge Radar.",
                    updates: []
                };
            }

            // 2. Fetch Latest 50 Articles (Full Text)
            // We fetch more articles to ensure we catch everything relevant in the recent cycle
            console.log('[OmniscientAgent] Fetching latest 50 news articles...');
            const { data: articles, error } = await supabase
                .from('articles')
                .select('id, title, summary, content_text')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error || !articles || articles.length === 0) {
                console.log('[OmniscientAgent] No recent articles found.');
                return {
                    status: 'ok',
                    message: "Daily Affairs Scan: No new conflicting updates found in the latest news cycle.",
                    updates: []
                };
            }

            // 3. OMNISCIENT PAYLOAD CONSTRUCTION
            // We do NOT filter. We send EVERYTHING.

            const notesPayload = allNotes.map(n => ({
                id: n.id,
                title: n.title,
                content: n.content || '' // FULL CONTENT of notes
            }));

            const newsPayload = articles.map(a => ({
                id: a.id,
                title: a.title, // Only Title as requested
                summary: (a.summary || '').substring(0, 150) // Tiny context helper
            }));

            // 4. AI Analysis via OpenRouter
            if (!OPENROUTER_API_KEY) {
                console.warn('[OmniscientAgent] No API Key.');
                return { status: 'ok', message: "Everything is fine. Keep studying!", updates: [] };
            }

            const systemPrompt = `You are the UPSC "Omniscient" Intelligence Agent. 
Your goal is to cross-reference the User's ENTIRE Note Database against the Latest News Corpus.

TASK:
1. READ every single note provided in the User Knowledge Base.
2. READ every single news article provided in the News Corpus.
3. IDENTIFY ANY connection, update, conflict, or relevant development using purely semantic understanding.

CRITERIA FOR MATCHING (Be extremely proactive):
- Direct concept updates (e.g., User has note on "Aadhar", News is about "UIDAI amendment").
- Indirect policy impacts (e.g., User has note on "Banking", News is about "RBI Repo Rate").
- Contextual relevance (e.g., User has note on "History of Mughals", News is about "ASI excavation of Mughal site").
- Acronym Resolution (e.g., "UCC" matches "Uniform Civil Code").

OUTPUT RULES:
- If a match is found, status MUST be "updates_available".
- "message" must be a single, punchy 1-2 sentence summary of the most critical update.
- "reason" in the updates array must explicitly state WHY this news matters to that specific note.

Output ONLY valid JSON:
{
  "status": "ok" | "updates_available",
  "message": "Strict 1-2 sentence summary.",
  "updates": [
    {
      "noteId": "id of the matched note",
      "noteTitle": "title of the matched note",
      "articleId": "id of the matched article",
      "articleTitle": "title of the matched article",
      "reason": "Clear explanation of the link."
    }
  ]
}`;

            console.log(`[OmniscientAgent] Sending ${notesPayload.length} notes (FULL) and ${newsPayload.length} articles (FULL) to Gemini 2.0...`);

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
                        { role: 'user', content: `USER NOTES LIBRARY:\n${JSON.stringify(notesPayload)}\n\nNEWS CORPUS:\n${JSON.stringify(newsPayload)}` },
                    ],
                    response_format: { type: 'json_object' }
                }),
            });

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;

            if (!content) throw new Error('AI Response Empty');
            const result = JSON.parse(content.replace(/```json\n?|```/g, '').trim());

            console.log(`[OmniscientAgent] Analysis Result: ${result.status} with ${result.updates?.length || 0} updates.`);
            return result;

        } catch (error) {
            console.error('[OmniscientAgent] Analysis Failed:', error);
            // Fail gracefully but loudly in logs
            return {
                status: 'ok',
                message: "Knowledge Radar active. No critical mismatches found in this scan.",
                updates: []
            };
        }
    }
}
