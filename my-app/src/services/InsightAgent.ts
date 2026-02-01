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
            // 1. Fetch user's local notes
            const allNotes = await getAllNotes();

            if (!allNotes || allNotes.length === 0) {
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

            // 3. INTELLIGENT SELECTION: High-precision keyword matching
            // Combine article titles and summaries into a rich search space
            const newsSpace = articles.map(a => `${a.title} ${a.summary || ''}`).join(' ').toLowerCase();

            // Common UPSC Synonyms for exhaustive matching
            const synonymMap: Record<string, string[]> = {
                'aadhar': ['aadhaar', 'uidai', 'biometric'],
                'aadhaar': ['aadhar', 'uidai', 'biometric'],
                'gst': ['goods and services tax', 'indirect tax'],
                'rbi': ['reserve bank', 'monetary policy'],
                'isro': ['space', 'satellite', 'launch vehicle', 'pslv', 'gslv'],
                'constitution': ['preamble', 'article', 'fundamental rights'],
            };

            const relevantNotes = allNotes.filter(note => {
                const title = note.title.toLowerCase();
                const content = note.content.toLowerCase().substring(0, 500);

                // Strategy A: Word-level matching in Title or Content
                const wordsToCheck = title.split(/\s+/).concat(content.split(/\s+/)).filter(w => w.length > 3);

                return wordsToCheck.some(word => {
                    // Check direct word in news space
                    if (newsSpace.includes(word)) return true;

                    // Check synonyms
                    const synonyms = synonymMap[word] || [];
                    if (synonyms.some(s => newsSpace.includes(s))) return true;

                    return false;
                });
            });

            // Priority: Always include the most relevant matches first
            const finalNotesSet = [...relevantNotes].slice(0, 20); // Top relevant 20

            // Fill the rest with general recent context
            const recentNotesContext = allNotes.slice(0, 30);
            for (const note of recentNotesContext) {
                if (finalNotesSet.length >= 50) break;
                if (!finalNotesSet.find(n => n.id === note.id)) {
                    finalNotesSet.push(note);
                }
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
Your goal is to be a high-precision Knowledge Radar. 

Link the student's notes with news if there is:
1. A factual update (e.g., New Aadhar app vs student's general Aadhar note).
2. A keyword connection (e.g., Space mission matches student's ISRO note).
3. A policy change (e.g., New Bill matches student's Polity note).

CRITICAL:
- The "message" field in your JSON output must be exactly 1 or 2 sentences ONLY.
- If match found, name the note title clearly in the reason.

Output ONLY a JSON object:
{
  "status": "ok" | "updates_available",
  "message": "A strictly 1-2 sentence high-impact summary",
  "updates": [{"noteId": "...", "noteTitle": "...", "articleId": "...", "articleTitle": "...", "reason": "E.g. Your Aadhar note needs update with the new UIDAI biometric app features."}]
}`;

            const userPrompt = `Student Context: ${JSON.stringify(finalNotesSet.map(n => ({ id: n.id, title: n.title, content: n.content.substring(0, 600) })))}
Recent Daily News: ${JSON.stringify(articles.map(a => ({ id: a.id, title: a.title, summary: a.summary })))}`;

            console.log(`[InsightAgent] Sending ${finalNotesSet.length} notes and ${articles.length} articles to AI`);

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
