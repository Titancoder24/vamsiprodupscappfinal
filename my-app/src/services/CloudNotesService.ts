import { supabase } from '../lib/supabase';
import { LocalNote } from '../features/Notes/services/localNotesStorage';

export const CloudNotesService = {

    async getAllNotes(): Promise<LocalNote[]> {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching cloud notes:', error);
            return [];
        }

        // Map cloud fields to local format if needed
        return data.map((n: any) => ({
            id: n.id,
            title: n.title,
            content: n.content,
            tags: n.tags || [],
            blocks: n.blocks || [],
            sourceType: n.source_type,
            sourceUrl: n.source_url,
            summary: n.summary,
            isPinned: n.is_pinned,
            isArchived: n.is_archived,
            createdAt: n.created_at,
            updatedAt: n.updated_at,
            notebookId: n.notebook_id
        }));
    },

    async createNote(note: Partial<LocalNote>): Promise<LocalNote | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('notes')
            .insert({
                user_id: user.id,
                title: note.title || 'Untitled',
                content: note.content || '',
                tags: note.tags || [],
                blocks: note.blocks || [],
                source_type: note.sourceType,
                source_url: note.sourceUrl,
                summary: note.summary,
                is_pinned: note.isPinned,
                is_archived: note.isArchived,
                notebook_id: note.notebookId
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating cloud note:', error);
            return null;
        }

        return {
            ...data,
            sourceType: data.source_type,
            sourceUrl: data.source_url,
            isPinned: data.is_pinned,
            isArchived: data.is_archived,
            updatedAt: data.updated_at,
            createdAt: data.created_at,
            notebookId: data.notebook_id,
            tags: data.tags || [], // Ensure array
            blocks: data.blocks || []
        };
    },

    async updateNote(id: number, updates: Partial<LocalNote>): Promise<LocalNote | null> {
        // Map local camelCase to snake_case for DB
        const dbUpdates: any = {
            updated_at: new Date().toISOString()
        };
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.content !== undefined) dbUpdates.content = updates.content;
        if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
        if (updates.blocks !== undefined) dbUpdates.blocks = updates.blocks;
        if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
        if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived;
        if (updates.summary !== undefined) dbUpdates.summary = updates.summary;

        const { data, error } = await supabase
            .from('notes')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating cloud note:', error);
            return null;
        }

        return {
            ...data,
            sourceType: data.source_type,
            sourceUrl: data.source_url,
            isPinned: data.is_pinned,
            isArchived: data.is_archived,
            updatedAt: data.updated_at,
            createdAt: data.created_at,
            notebookId: data.notebook_id,
            tags: data.tags || [],
            blocks: data.blocks || []
        };
    },

    async deleteNote(id: number): Promise<boolean> {
        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting cloud note:', error);
            return false;
        }
        return true;
    }
};
