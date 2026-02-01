/**
 * Local Notes Storage Service -> NOW SWITCHED TO CLOUD (SUPABASE)
 * 
 * This file now acts as a wrapper/adapter between the existing app code
 * and the new CloudNotesService.
 */

import { CloudNotesService } from '../../../services/CloudNotesService';
import { getItem, setItem } from './storage';

// Storage Keys (Still used for TAGS and settings, but NOTES are now Cloud)
const STORAGE_KEYS = {
    TAGS: '@upsc_note_tags',
    LINKS: '@upsc_scraped_links',
    TAG_COUNTER: '@upsc_tag_counter',
};

// ==================== Types ====================
// These types must remain identical to preserve app compatibility

export interface LocalTag {
    id: number;
    name: string;
    color: string;
    category?: 'subject' | 'source' | 'topic' | 'custom';
    usageCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface ScrapedLink {
    id: number;
    url: string;
    title: string;
    content: string;
    summary?: string;
    scrapedAt: string;
    noteId?: number;
}

export interface LocalNote {
    id: number;
    notebookId?: string; // Link to AI Notebook
    title: string;
    content: string; // Plain text / markdown content
    blocks: NoteBlock[]; // Notion-like blocks
    tags: LocalTag[];
    sourceType?: 'manual' | 'institute' | 'scraped' | 'ncert' | 'book' | 'current_affairs' | 'report';
    sourceUrl?: string;
    summary?: string;
    isPinned: boolean;
    isArchived: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface NoteBlock {
    id: string;
    type: 'paragraph' | 'h1' | 'h2' | 'h3' | 'bullet' | 'numbered' | 'quote' | 'divider' | 'link' | 'callout' | 'code' | 'toggle' | 'image';
    content: string;
    metadata?: {
        url?: string;
        color?: string;
        language?: string;
        children?: NoteBlock[];
    };
}

// Default UPSC Tags (Keep local for now or migrate later)
export const DEFAULT_UPSC_TAGS: Omit<LocalTag, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>[] = [
    { name: 'GS1', color: '#EF4444', category: 'subject' },
    { name: 'GS2', color: '#F97316', category: 'subject' },
    { name: 'GS3', color: '#EAB308', category: 'subject' },
    { name: 'GS4', color: '#22C55E', category: 'subject' },
    { name: 'Polity', color: '#3B82F6', category: 'subject' },
    { name: 'Geography', color: '#10B981', category: 'subject' },
    { name: 'History', color: '#8B5CF6', category: 'subject' },
    { name: 'Economy', color: '#F59E0B', category: 'subject' },
    { name: 'Environment', color: '#06B6D4', category: 'subject' },
    { name: 'Science & Tech', color: '#EC4899', category: 'subject' },
    { name: 'Ethics', color: '#6366F1', category: 'subject' },
    { name: 'International Relations', color: '#14B8A6', category: 'subject' },
];

const getTimestamp = (): string => new Date().toISOString();
const generateId = async (key: string) => Date.now(); // Simplified

// ==================== CLOUD NOTES CRUD ====================

export const getAllNotes = async (): Promise<LocalNote[]> => {
    return CloudNotesService.getAllNotes();
};

export const getNoteById = async (noteId: number): Promise<LocalNote | null> => {
    const notes = await getAllNotes();
    return notes.find(n => n.id === noteId) || null;
};

export const createNote = async (noteData: Partial<LocalNote>): Promise<LocalNote> => {
    const res = await CloudNotesService.createNote(noteData);
    if (!res) throw new Error("Failed to create cloud note");
    return res;
};

export const updateNote = async (noteId: number, updates: Partial<LocalNote>): Promise<LocalNote | null> => {
    return CloudNotesService.updateNote(noteId, updates);
};

export const deleteNote = async (noteId: number): Promise<boolean> => {
    return CloudNotesService.deleteNote(noteId);
};

export const searchNotes = async (query: string, tagIds?: number[]): Promise<LocalNote[]> => {
    const notes = await getAllNotes();
    const lowerQuery = query.toLowerCase();

    return notes.filter(note => {
        const matchesQuery = !query ||
            note.title.toLowerCase().includes(lowerQuery) ||
            note.content.toLowerCase().includes(lowerQuery);

        // Filter by tags (locally for now since tags are JSONB)
        const matchesTags = !tagIds || tagIds.length === 0 ||
            tagIds.some(tagId => note.tags.some(tag => tag.id === tagId));

        return matchesQuery && matchesTags && !note.isArchived;
    });
};

export const getNotesByNotebook = async (notebookId: string): Promise<LocalNote[]> => {
    const notes = await getAllNotes();
    return notes.filter(note => note.notebookId === notebookId && !note.isArchived);
};

export const getNotesByTag = async (tagId: number): Promise<LocalNote[]> => {
    const notes = await getAllNotes();
    return notes.filter(note => note.tags.some(tag => tag.id === tagId) && !note.isArchived);
};

export const getNotesBySource = async (sourceType: LocalNote['sourceType']): Promise<LocalNote[]> => {
    const notes = await getAllNotes();
    return notes.filter(note => note.sourceType === sourceType && !note.isArchived);
};

// ==================== Tags CRUD (Kept Local for simplicity in this step) ====================

export const getAllTags = async (): Promise<LocalTag[]> => {
    try {
        const tagsJson = await getItem(STORAGE_KEYS.TAGS);
        const tags: LocalTag[] = tagsJson ? JSON.parse(tagsJson) : [];
        if (tags.length === 0) return initializeDefaultTags();
        return tags.sort((a, b) => b.usageCount - a.usageCount);
    } catch { return []; }
};

export const initializeDefaultTags = async (): Promise<LocalTag[]> => {
    const tags: LocalTag[] = [];
    const timestamp = getTimestamp();
    for (const defaultTag of DEFAULT_UPSC_TAGS) {
        tags.push({
            id: Math.floor(Math.random() * 100000), // Random ID simple logic
            ...defaultTag,
            usageCount: 0,
            createdAt: timestamp,
            updatedAt: timestamp,
        });
    }
    await setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
    return tags;
};

export const createTag = async (name: string, color?: string): Promise<LocalTag> => {
    const tags = await getAllTags();
    const existing = tags.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;

    const newTag: LocalTag = {
        id: Date.now(),
        name: name.trim(),
        color: color || '#6B7280',
        category: 'custom',
        usageCount: 0,
        createdAt: getTimestamp(),
        updatedAt: getTimestamp()
    };
    tags.push(newTag);
    await setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
    return newTag;
};

export const deleteTag = async (tagId: number): Promise<boolean> => {
    let tags = await getAllTags();
    tags = tags.filter(t => t.id !== tagId);
    await setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
    return true;
};

// ==================== Scraped Links (Kept Local) ====================

export const saveScrapedLink = async (linkData: any): Promise<any> => {
    // Basic implementation to satisfy interface
    return { id: Date.now(), ...linkData, scrapedAt: getTimestamp() };
};

export const getScrapedLinks = async (): Promise<any[]> => {
    return [];
};

export const clearAllNotesData = async (): Promise<void> => {
    // Warning: This only clears local items now
    await setItem(STORAGE_KEYS.TAGS, '[]');
};

export const getNotesStats = async (): Promise<any> => {
    const notes = await getAllNotes();
    const tags = await getAllTags();
    return {
        totalNotes: notes.length,
        pinnedNotes: notes.filter(n => n.isPinned).length,
        archivedNotes: notes.filter(n => n.isArchived).length,
        scrapedNotes: 0,
        tagCount: tags.length
    };
};

export default {
    getAllNotes,
    getNoteById,
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
    getNotesByTag,
    getNotesByNotebook,
    getNotesBySource,
    getAllTags,
    createTag,
    deleteTag,
    saveScrapedLink,
    getScrapedLinks,
    clearAllNotesData,
    getNotesStats,
};
