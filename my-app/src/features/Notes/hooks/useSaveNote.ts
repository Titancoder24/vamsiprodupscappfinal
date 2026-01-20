import { useState, useRef, useCallback, useEffect } from 'react';
import { createNote, updateNote, getAllTags, LocalNote, LocalTag } from '../services/localNotesStorage';

interface UseSaveNoteOptions {
    userId?: number;
    throttleMs?: number;
    onSaveSuccess?: (note: LocalNote) => void;
    onSaveError?: (error: Error) => void;
}

interface SaveNoteState {
    isSaving: boolean;
    lastSaved: Date | null;
    error: Error | null;
    isDirty: boolean;
}

export function useSaveNote(options: UseSaveNoteOptions = {}) {
    const { throttleMs = 500, onSaveSuccess, onSaveError } = options;

    const [state, setState] = useState<SaveNoteState>({
        isSaving: false,
        lastSaved: null,
        error: null,
        isDirty: false,
    });

    const noteIdRef = useRef<number | null>(null);
    const pendingSaveRef = useRef<{
        title: string;
        plainText: string;
        tagIds: number[];
    } | null>(null);

    // Core save function - uses local storage
    const doSave = useCallback(async (
        title: string,
        plainText: string,
        tagIds: number[] = []
    ): Promise<LocalNote | null> => {
        if (!title.trim()) {
            console.log('[useSaveNote] Skipping save - empty title');
            return null;
        }

        setState(prev => ({ ...prev, isSaving: true, error: null }));

        try {
            // Get full tag objects from IDs
            const allTags = await getAllTags();
            const selectedTags = allTags.filter(tag => tagIds.includes(tag.id));

            let savedNote: LocalNote;

            if (noteIdRef.current) {
                // Update existing note
                const result = await updateNote(noteIdRef.current, {
                    title,
                    content: plainText,
                    tags: selectedTags,
                });
                if (!result) {
                    throw new Error('Failed to update note');
                }
                savedNote = result;
            } else {
                // Create new note
                savedNote = await createNote({
                    title,
                    content: plainText,
                    tags: selectedTags,
                });
                noteIdRef.current = savedNote.id;
            }

            setState(prev => ({
                ...prev,
                isSaving: false,
                lastSaved: new Date(),
                isDirty: false,
            }));

            onSaveSuccess?.(savedNote);
            return savedNote;
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Save failed');
            setState(prev => ({
                ...prev,
                isSaving: false,
                error: err,
            }));
            onSaveError?.(err);
            return null;
        }
    }, [onSaveSuccess, onSaveError]);

    // Simple throttle implementation
    const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Autosave function (throttled)
    const save = useCallback((
        title: string,
        plainText: string,
        tagIds: number[] = []
    ) => {
        pendingSaveRef.current = { title, plainText, tagIds };
        setState(prev => ({ ...prev, isDirty: true }));

        if (throttleTimerRef.current) {
            clearTimeout(throttleTimerRef.current);
        }

        throttleTimerRef.current = setTimeout(() => {
            doSave(title, plainText, tagIds);
        }, throttleMs);
    }, [doSave, throttleMs]);

    // Immediate save (not throttled)
    const saveNow = useCallback(async (
        title: string,
        plainText: string,
        tagIds: number[] = []
    ): Promise<LocalNote | null> => {
        if (throttleTimerRef.current) {
            clearTimeout(throttleTimerRef.current);
        }
        pendingSaveRef.current = null;
        return doSave(title, plainText, tagIds);
    }, [doSave]);

    // Set note ID for existing notes
    const setNoteId = useCallback((id: number | null) => {
        noteIdRef.current = id;
    }, []);

    // Clear state (for new notes)
    const reset = useCallback(() => {
        noteIdRef.current = null;
        pendingSaveRef.current = null;
        if (throttleTimerRef.current) {
            clearTimeout(throttleTimerRef.current);
        }
        setState({
            isSaving: false,
            lastSaved: null,
            error: null,
            isDirty: false,
        });
    }, []);

    // Flush pending save on unmount
    useEffect(() => {
        return () => {
            if (throttleTimerRef.current) {
                clearTimeout(throttleTimerRef.current);
            }
            if (pendingSaveRef.current && state.isDirty) {
                const { title, plainText, tagIds } = pendingSaveRef.current;
                doSave(title, plainText, tagIds);
            }
        };
    }, [doSave, state.isDirty]);

    return {
        save,
        saveNow,
        setNoteId,
        reset,
        noteId: noteIdRef.current,
        ...state,
    };
}

export default useSaveNote;
