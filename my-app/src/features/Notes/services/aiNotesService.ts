/**
 * AI Notes Service - Summarizes notes from multiple sources using AI
 * Uses OpenRouter API to generate intelligent summaries
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalNote, LocalTag, getAllNotes, getAllTags, getNotesByTag, getNotesByNotebook } from './localNotesStorage';

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

// Storage keys
const STORAGE_KEYS = {
    SUMMARIES: '@upsc_ai_summaries',
    NOTEBOOKS: '@upsc_ai_notebooks',
    SUMMARY_COUNTER: '@upsc_summary_counter',
};

// Types
export interface AINotebook {
    id: string;
    title: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    noteCount: number;
}

export interface AISummary {
    id: number;
    notebookId?: string; // Optional link to a specific notebook
    title: string;
    summary: string;
    sources: {
        noteId: number;
        noteTitle: string;
        sourceType: string;
    }[];
    tags: LocalTag[];
    tagIds: number[];
    wordCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface SummaryRequest {
    notebookId?: string;
    tagIds: number[];
    includeCurrentAffairs: boolean;
    includeSavedArticles: boolean;
    customPrompt?: string;
}

// Helper to generate unique ID
const generateId = async (): Promise<number> => {
    const current = await AsyncStorage.getItem(STORAGE_KEYS.SUMMARY_COUNTER);
    const next = (parseInt(current || '0') || 0) + 1;
    await AsyncStorage.setItem(STORAGE_KEYS.SUMMARY_COUNTER, String(next));
    return next;
};

/**
 * Create a new AI Notebook (Project)
 */
export const createNotebook = async (title: string, description?: string): Promise<AINotebook> => {
    try {
        const id = Math.random().toString(36).substr(2, 9);
        const newNotebook: AINotebook = {
            id,
            title,
            description,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            noteCount: 0
        };

        const notebooks = await getAllNotebooks();
        notebooks.unshift(newNotebook);
        await AsyncStorage.setItem(STORAGE_KEYS.NOTEBOOKS, JSON.stringify(notebooks));
        return newNotebook;
    } catch (error) {
        console.error('Error creating notebook:', error);
        throw error;
    }
};

/**
 * Get all AI Notebooks
 */
export const getAllNotebooks = async (): Promise<AINotebook[]> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.NOTEBOOKS);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        return [];
    }
};

/**
 * Delete a notebook
 */
export const deleteNotebook = async (id: string): Promise<void> => {
    const notebooks = await getAllNotebooks();
    const filtered = notebooks.filter(n => n.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.NOTEBOOKS, JSON.stringify(filtered));
};

/**
 * Get notes by multiple tags (intersection)
 */
export const getNotesByMultipleTags = async (tagIds: number[]): Promise<LocalNote[]> => {
    const allNotes = await getAllNotes();

    if (tagIds.length === 0) return allNotes;

    return allNotes.filter(note => {
        const noteTagIds = note.tags.map(t => t.id);
        return tagIds.every(tagId => noteTagIds.includes(tagId));
    });
};

/**
 * Extract hashtags from notes content
 */
export const extractHashtags = (content: string): string[] => {
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex) || [];
    return [...new Set(matches.map(tag => tag.toLowerCase()))];
};

/**
 * Find related notes by hashtags in content
 */
export const findRelatedNotesByHashtags = async (hashtags: string[]): Promise<LocalNote[]> => {
    const allNotes = await getAllNotes();

    return allNotes.filter(note => {
        const contentHashtags = extractHashtags(note.content);
        const titleHashtags = extractHashtags(note.title);
        const allHashtags = [...contentHashtags, ...titleHashtags];

        return hashtags.some(tag =>
            allHashtags.some(noteTag => noteTag.includes(tag.toLowerCase().replace('#', '')))
        );
    });
};

/**
 * Group notes by source type for summary
 */
export const groupNotesBySource = (notes: LocalNote[]): Record<string, LocalNote[]> => {
    return notes.reduce((groups, note) => {
        const sourceType = note.sourceType || 'manual';
        if (!groups[sourceType]) groups[sourceType] = [];
        groups[sourceType].push(note);
        return groups;
    }, {} as Record<string, LocalNote[]>);
};

/**
 * Build context for AI summarization
 */
const buildSummaryContext = (notes: LocalNote[], tags: LocalTag[]): string => {
    const tagNames = tags.map(t => `#${t.name}`).join(', ');
    const groupedNotes = groupNotesBySource(notes);

    let context = `Topic Tags: ${tagNames}\n\n`;

    // Add pre-existing manual notes
    if (groupedNotes.manual?.length) {
        context += "=== STUDENT'S PRE-EXISTING NOTES ===\n";
        groupedNotes.manual.forEach((note, i) => {
            context += `\n[Note ${i + 1}: ${note.title}]\n${note.content}\n`;
        });
    }

    // Add current affairs
    if (groupedNotes.current_affairs?.length) {
        context += "\n\n=== CURRENT AFFAIRS ===\n";
        groupedNotes.current_affairs.forEach((note, i) => {
            context += `\n[Article ${i + 1}: ${note.title}]\n${note.content}\n`;
        });
    }

    // Add scraped/saved articles
    if (groupedNotes.scraped?.length) {
        context += "\n\n=== SAVED ARTICLES (Institute Websites) ===\n";
        groupedNotes.scraped.forEach((note, i) => {
            context += `\n[Article ${i + 1}: ${note.title}]\nSource: ${note.sourceUrl || 'Web'}\n${note.content}\n`;
        });
    }

    // Add NCERT notes
    if (groupedNotes.ncert?.length) {
        context += "\n\n=== NCERT NOTES ===\n";
        groupedNotes.ncert.forEach((note, i) => {
            context += `\n[Note ${i + 1}: ${note.title}]\n${note.content}\n`;
        });
    }

    // Add book notes
    if (groupedNotes.book?.length) {
        context += "\n\n=== BOOK NOTES ===\n";
        groupedNotes.book.forEach((note, i) => {
            context += `\n[Note ${i + 1}: ${note.title}]\n${note.content}\n`;
        });
    }

    return context;
};

/**
 * Generate AI summary using OpenRouter
 */
export const generateAISummary = async (
    request: SummaryRequest,
    onProgress?: (status: string) => void
): Promise<AISummary | null> => {
    try {
        onProgress?.('Fetching notes...');

        // Get all tags for this summary
        const allTags = await getAllTags();
        const selectedTags = allTags.filter(t => request.tagIds.includes(t.id));

        // Get notes source
        let notes: LocalNote[] = [];
        if (request.notebookId) {
            notes = await getNotesByNotebook(request.notebookId);
        } else {
            notes = await getNotesByMultipleTags(request.tagIds);
        }

        if (notes.length === 0) {
            throw new Error('No notes found. Please add manual notes or web articles first.');
        }

        // Filter by source type if needed
        let filteredNotes = notes;
        if (!request.includeCurrentAffairs) {
            filteredNotes = filteredNotes.filter(n => n.sourceType !== 'current_affairs');
        }
        if (!request.includeSavedArticles) {
            filteredNotes = filteredNotes.filter(n => n.sourceType !== 'scraped');
        }

        onProgress?.('Building context...');

        // Build context for AI
        const context = buildSummaryContext(filteredNotes, selectedTags);
        const tagNames = selectedTags.map(t => t.name).join(', ');

        onProgress?.('Generating AI summary...');

        // AI prompt for summarization
        const systemPrompt = `You are an expert UPSC preparation assistant. Your task is to create comprehensive, exam-oriented notes by combining and summarizing content from multiple sources.

OUTPUT FORMAT:
1. Start with a clear TOPIC TITLE
2. Include relevant HASHTAGS at the beginning
3. Provide KEY POINTS as bullet points
4. Add EXAM-RELEVANT FACTS
5. Include INTERLINKING with related topics
6. End with REVISION TIPS

IMPORTANT:
- Focus on UPSC Prelims and Mains relevance
- Highlight facts, dates, and figures
- Connect historical events to current affairs
- Use clear, concise language
- Structure for easy revision`;

        const userPrompt = `Create a comprehensive UPSC-oriented summary for the topic: ${tagNames}

${context}

${request.customPrompt ? `\nAdditional focus: ${request.customPrompt}` : ''}

Generate a well-structured summary that:
1. Combines insights from all sources
2. Highlights key facts for exams
3. Includes relevant hashtags
4. Is suitable for quick revision`;

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
                temperature: 0.7,
                max_tokens: 4000,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`AI API error: ${error}`);
        }

        const data = await response.json();
        const summaryContent = data.choices?.[0]?.message?.content;

        if (!summaryContent) {
            throw new Error('No summary generated by AI');
        }

        onProgress?.('Saving summary...');

        // Create summary object
        const summaryId = await generateId();
        const summary: AISummary = {
            id: summaryId,
            notebookId: request.notebookId,
            title: `${tagNames} - Summary`,
            summary: summaryContent,
            sources: filteredNotes.map(n => ({
                noteId: n.id,
                noteTitle: n.title,
                sourceType: n.sourceType || 'manual',
            })),
            tags: selectedTags,
            tagIds: request.tagIds,
            wordCount: summaryContent.split(/\s+/).length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Save to storage
        const existing = await getAllSummaries();
        existing.unshift(summary);
        await AsyncStorage.setItem(STORAGE_KEYS.SUMMARIES, JSON.stringify(existing));

        onProgress?.('Done!');
        return summary;

    } catch (error) {
        console.error('[AINotes] Error generating summary:', error);
        throw error;
    }
};

/**
 * Get all saved summaries
 */
export const getAllSummaries = async (): Promise<AISummary[]> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.SUMMARIES);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('[AINotes] Error getting summaries:', error);
        return [];
    }
};

/**
 * Get summary by ID
 */
export const getSummaryById = async (id: number): Promise<AISummary | null> => {
    const summaries = await getAllSummaries();
    return summaries.find(s => s.id === id) || null;
};

/**
 * Delete summary
 */
export const deleteSummary = async (id: number): Promise<boolean> => {
    try {
        const summaries = await getAllSummaries();
        const filtered = summaries.filter(s => s.id !== id);
        await AsyncStorage.setItem(STORAGE_KEYS.SUMMARIES, JSON.stringify(filtered));
        return true;
    } catch (error) {
        console.error('[AINotes] Error deleting summary:', error);
        return false;
    }
};

/**
 * Export summary as text document format
 */
export const exportSummaryAsText = (summary: AISummary): string => {
    const hashtags = summary.tags.map(t => `#${t.name}`).join(' ');
    const sources = summary.sources.map(s => `- ${s.noteTitle} (${s.sourceType})`).join('\n');

    return `=====================================
UPSC AI NOTES - ${summary.title}
=====================================

Tags: ${hashtags}

Generated: ${new Date(summary.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })}

Word Count: ${summary.wordCount}

=====================================
SUMMARY
=====================================

${summary.summary}

=====================================
SOURCES
=====================================
${sources}

=====================================
Generated by PrepAssist AI Notes Maker
=====================================`;
};

/**
 * Export summary as PDF-ready HTML
 */
export const exportSummaryAsPDFHtml = (summary: AISummary): string => {
    const hashtags = summary.tags.map(t => `<span style="background:#EFF6FF;color:#3B82F6;padding:4px 12px;border-radius:20px;font-size:12px;margin-right:8px;">#${t.name}</span>`).join('');
    const sources = summary.sources.map(s => `<li style="padding:8px 0;border-bottom:1px solid #F1F5F9;">${s.noteTitle} <span style="color:#64748B;font-size:12px;">(${s.sourceType})</span></li>`).join('');

    // Convert markdown-style formatting to HTML
    const formattedSummary = summary.summary
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/#{1,3}\s*(.*?)(?:\n|$)/g, '<h3 style="color:#0F172A;margin:16px 0 8px;">$1</h3>')
        .replace(/•\s*(.*?)(?:\n|$)/g, '<li style="margin:4px 0;">$1</li>')
        .replace(/-\s*(.*?)(?:\n|$)/g, '<li style="margin:4px 0;">$1</li>')
        .replace(/\n\n/g, '</p><p style="margin:12px 0;line-height:1.8;">')
        .replace(/\n/g, '<br/>');

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>UPSC AI Notes - ${summary.title}</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #334155; line-height: 1.6; }
        h1 { color: #0F172A; font-size: 28px; margin-bottom: 8px; }
        h2 { color: #1E293B; font-size: 20px; margin-top: 32px; border-bottom: 2px solid #E2E8F0; padding-bottom: 8px; }
        h3 { color: #0F172A; font-size: 16px; margin: 16px 0 8px; }
        .header { background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 32px; border-radius: 16px; margin-bottom: 32px; }
        .header h1 { color: white; margin: 0; }
        .header .subtitle { opacity: 0.9; font-size: 14px; margin-top: 8px; }
        .tags { margin: 16px 0; }
        .meta { display: flex; gap: 24px; color: #64748B; font-size: 13px; margin: 24px 0; padding: 16px; background: #F8FAFC; border-radius: 12px; }
        .content { background: white; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; }
        .sources { background: #F8FAFC; padding: 16px 24px; border-radius: 12px; margin-top: 24px; }
        .sources ul { list-style: none; padding: 0; margin: 0; }
        .footer { text-align: center; color: #94A3B8; font-size: 12px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #E2E8F0; }
        ul { padding-left: 20px; }
        @media print { body { padding: 20px; } .header { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>📚 ${summary.title}</h1>
        <div class="subtitle">UPSC AI Notes - Generated by PrepAssist</div>
    </div>
    
    <div class="tags">${hashtags}</div>
    
    <div class="meta">
        <span>📅 ${new Date(summary.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        <span>📝 ${summary.wordCount} words</span>
        <span>📚 ${summary.sources.length} sources</span>
    </div>
    
    <div class="content">
        <p style="margin:12px 0;line-height:1.8;">${formattedSummary}</p>
    </div>
    
    <div class="sources">
        <h2>Sources Used</h2>
        <ul>${sources}</ul>
    </div>
    
    <div class="footer">
        <p>Generated by PrepAssist AI Notes Maker • www.prepassist.in</p>
    </div>
</body>
</html>`;
};

/**
 * Get current affairs alerts based on user's tags
 */
export const getTagBasedAlerts = async (): Promise<{
    tag: LocalTag;
    newArticles: LocalNote[];
}[]> => {
    try {
        const allTags = await getAllTags();
        const allNotes = await getAllNotes();

        // Get tags used in user's manual notes
        const userTags = new Set<number>();
        allNotes
            .filter(n => n.sourceType === 'manual' || !n.sourceType)
            .forEach(n => n.tags.forEach(t => userTags.add(t.id)));

        // Find current affairs with matching tags
        const alerts: { tag: LocalTag; newArticles: LocalNote[] }[] = [];

        userTags.forEach(tagId => {
            const tag = allTags.find(t => t.id === tagId);
            if (!tag) return;

            const newArticles = allNotes.filter(n =>
                (n.sourceType === 'current_affairs' || n.sourceType === 'scraped') &&
                n.tags.some(t => t.id === tagId) &&
                // Only show articles from last 7 days
                new Date(n.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            );

            if (newArticles.length > 0) {
                alerts.push({ tag, newArticles });
            }
        });

        return alerts;
    } catch (error) {
        console.error('[AINotes] Error getting alerts:', error);
        return [];
    }
};

export default {
    generateAISummary,
    getAllSummaries,
    getSummaryById,
    deleteSummary,
    exportSummaryAsText,
    exportSummaryAsPDFHtml,
    getNotesByMultipleTags,
    extractHashtags,
    findRelatedNotesByHashtags,
    groupNotesBySource,
    getTagBasedAlerts,
    createNotebook,
    getAllNotebooks,
    deleteNotebook,
};
