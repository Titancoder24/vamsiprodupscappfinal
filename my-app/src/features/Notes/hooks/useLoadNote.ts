import { useState, useCallback, useEffect } from 'react';
import { getNoteById, LocalNote } from '../services/localNotesStorage';

interface UseLoadNoteOptions {
    noteId?: number | null;
    autoLoad?: boolean;
    onLoadSuccess?: (note: LocalNote) => void;
    onLoadError?: (error: Error) => void;
}

interface LoadNoteState {
    note: LocalNote | null;
    isLoading: boolean;
    error: Error | null;
}

export function useLoadNote(options: UseLoadNoteOptions = {}) {
    const { noteId, autoLoad = true, onLoadSuccess, onLoadError } = options;

    const [state, setState] = useState<LoadNoteState>({
        note: null,
        isLoading: false,
        error: null,
    });

    const load = useCallback(async (id?: number): Promise<LocalNote | null> => {
        const targetId = id ?? noteId;

        if (!targetId) {
            console.log('[useLoadNote] No note ID to load');
            return null;
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const note = await getNoteById(targetId);

            if (!note) {
                throw new Error('Note not found');
            }

            setState({
                note,
                isLoading: false,
                error: null,
            });

            onLoadSuccess?.(note);
            return note;
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Failed to load note');
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: err,
            }));
            onLoadError?.(err);
            return null;
        }
    }, [noteId, onLoadSuccess, onLoadError]);

    const reset = useCallback(() => {
        setState({
            note: null,
            isLoading: false,
            error: null,
        });
    }, []);

    // Auto-load when noteId changes
    useEffect(() => {
        if (autoLoad && noteId) {
            load(noteId);
        } else if (!noteId) {
            reset();
        }
    }, [noteId, autoLoad, load, reset]);

    // Derive editor state
    const title = state.note?.title ?? '';
    const content = state.note?.content ?? '';
    const tags = state.note?.tags ?? [];
    const plainText = state.note?.content ?? '';

    return {
        ...state,
        load,
        reset,
        title,
        content,
        tags,
        plainText,
    };
}

export default useLoadNote;
