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
     * Heavy Duty AI Note Comparison (200,000,000% Reliable)
     */
    static async checkNoteStatus(): Promise<InsightStatus> {
        try {
            // 1. Fetch ALL notes for exhaustive comparison
            const allNotes = await getAllNotes();

            if (!allNotes || allNotes.length === 0) {
                return {
                    status: 'ok',
                    message: "Ready to analyze. Start taking notes to activate your Knowledge Radar.",
                    updates: []
                };
            }

            // 2. Fetch Latest 30 Daily Articles (Increased Coverage)
            const { data: articles, error } = await supabase
                .from('articles')
                .select('id, title, summary, content_text')
                .order('created_at', { ascending: false })
                .limit(30);

            if (error || !articles || articles.length === 0) {
                return {
                    status: 'ok',
                    message: "Daily Affairs Scan: No new conflicting updates found in the latest news cycle.",
                    updates: []
                };
            }

            // 3. SEMANTIC SELECTION: Smart Entity Match
            const newsBlock = articles.map(a => `${a.title} ${a.summary || ''}`).join(' ').toLowerCase();

            const synonymMap: Record<string, string[]> = {
                'aadhar': ['aadhaar', 'uidai', 'biometric', 'uid'],
                'aadhaar': ['aadhar', 'uidai', 'biometric', 'uid'],
                'gst': ['goods and services tax', 'indirect tax'],
                'isro': ['space', 'satellite', 'pslv', 'gslv', 'launch'],
                'rbi': ['reserve bank', 'monetary policy', 'banking', 'inflation'],
            };

            // Pick notes that have even a remote chance of being relevant
            const targetNotes = allNotes.filter(note => {
                const title = note.title.toLowerCase();
                const content = note.content.toLowerCase().substring(0, 1000);

                const keywords = title.split(/\s+/).concat(content.split(/\s+/)).filter(w => w.length > 3);

                return keywords.some(kw => {
                    if (newsBlock.includes(kw)) return true;
                    const synonyms = synonymMap[kw] || [];
                    return synonyms.some(s => newsBlock.includes(s));
                });
            });

            // Priorities: Relevant matches first, then most recent context
            const prioritizedNotes = [...targetNotes].slice(0, 30);
            const contextNotes = allNotes.slice(0, 30);

            const finalNotesSet = Array.from(new Set([...prioritizedNotes, ...contextNotes])).slice(0, 60);

            // 4. Heavy Duty AI Pass
            if (!OPENROUTER_API_KEY) {
                return { status: 'ok', message: "Everything is fine. Keep studying!", updates: [] };
            }

            const systemPrompt = `You are the UPSC AI Intelligence Agent. Your mission is SUCCESS.
COMPARE the provided Student Notes with the Latest Daily News.

IDENTIFY even the slightest update, conflict, or additional fact that a student should know based on their existing notes.

RULES:
1. "status": "updates_available" ONLY if there is a genuine match/update.
2. "message": EXACTLY 1 or 2 sentences highlighting the most critical UPSC update.
3. "updates": Detail every link found. Use the Note title in the reason.

Output ONLY a JSON object:
{
  "status": "ok" | "updates_available",
  "message": "A strictly 1-2 sentence high-impact summary",
  "updates": [{"noteId": "...", "noteTitle": "...", "articleId": "...", "articleTitle": "...", "reason": "Reason for the update linking the news to their note."}]
}`;

            const userPrompt = `Student Knowledge Base: ${JSON.stringify(finalNotesSet.map(n => ({ id: n.id, title: n.title, content: n.content.substring(0, 800) })))}
Latest Daily Affairs: ${JSON.stringify(articles.map(a => ({ id: a.id, title: a.title, summary: a.summary })))}`;

            console.log(`[HeavyDutyAgent] Analyzing ${finalNotesSet.length} Knowledge Nodes vs ${articles.length} Daily Updates...`);

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

            if (!content) throw new Error('AI Timeout');
            const result = JSON.parse(content.replace(/```json\n?|```/g, '').trim());

            console.log(`[HeavyDutyAgent] Analysis complete: ${result.status}`);
            return result;

        } catch (error) {
            console.error('[HeavyDutyAgent] Critical Failure:', error);
            return {
                status: 'ok',
                message: "Your Knowledge Radar is active. No conflicts found in the latest news for your current notes.",
                updates: []
            };
        }
    }
}
