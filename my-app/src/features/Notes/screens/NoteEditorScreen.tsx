import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ScrollView,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    getNoteById,
    updateNote,
    getAllTags,
    LocalNote,
    LocalTag,
} from '../services/localNotesStorage';

interface NoteEditorScreenProps {
    navigation: any;
    route: {
        params?: {
            noteId?: number;
        };
    };
}

const TAG_COLORS = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

export const NoteEditorScreen: React.FC<NoteEditorScreenProps> = ({
    navigation,
    route,
}) => {
    const noteId = route.params?.noteId;

    // State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedTags, setSelectedTags] = useState<LocalTag[]>([]);
    const [allTags, setAllTags] = useState<LocalTag[]>([]);
    const [isPinned, setIsPinned] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [showTagPicker, setShowTagPicker] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const contentInputRef = useRef<TextInput>(null);

    // Load note and tags
    useEffect(() => {
        loadData();
    }, [noteId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const tags = await getAllTags();
            setAllTags(tags);

            if (noteId) {
                const note = await getNoteById(noteId);
                if (note) {
                    setTitle(note.title);
                    setContent(note.content);
                    setSelectedTags(note.tags);
                    setIsPinned(note.isPinned);
                }
            }
        } catch (error) {
            console.error('[NoteEditor] Error loading:', error);
        }
        setIsLoading(false);
    };

    // Auto-save on changes
    useEffect(() => {
        if (!hasChanges || !noteId) return;

        const timer = setTimeout(() => {
            handleSave(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, [title, content, selectedTags, isPinned, hasChanges]);

    const handleSave = async (showAlert: boolean = true) => {
        if (!title.trim() && showAlert) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }

        setIsSaving(true);
        try {
            if (noteId) {
                await updateNote(noteId, {
                    title: title.trim() || 'Untitled',
                    content,
                    tags: selectedTags,
                    isPinned,
                });
                setLastSaved(new Date());
                setHasChanges(false);
            }
        } catch (error) {
            console.error('[NoteEditor] Save error:', error);
            if (showAlert) {
                Alert.alert('Error', 'Failed to save note');
            }
        }
        setIsSaving(false);
    };

    const handleTitleChange = (text: string) => {
        setTitle(text);
        setHasChanges(true);
    };

    const handleContentChange = (text: string) => {
        setContent(text);
        setHasChanges(true);
    };

    const toggleTag = (tag: LocalTag) => {
        setSelectedTags(prev => {
            const exists = prev.some(t => t.id === tag.id);
            const newTags = exists
                ? prev.filter(t => t.id !== tag.id)
                : [...prev, tag];
            setHasChanges(true);
            return newTags;
        });
    };

    const togglePin = () => {
        setIsPinned(prev => !prev);
        setHasChanges(true);
    };

    const formatLastSaved = () => {
        if (!lastSaved) return '';
        const now = new Date();
        const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
        if (diff < 5) return 'Saved';
        if (diff < 60) return `Saved ${diff}s ago`;
        return `Saved at ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.headerButton}
                    >
                        <Ionicons name="chevron-back" size={24} color="#111827" />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        {isSaving && (
                            <Text style={styles.savingText}>Saving...</Text>
                        )}
                        {lastSaved && !isSaving && (
                            <Text style={styles.savedText}>{formatLastSaved()}</Text>
                        )}
                    </View>

                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={togglePin} style={styles.headerIconButton}>
                            <Ionicons
                                name={isPinned ? 'pin' : 'pin-outline'}
                                size={20}
                                color={isPinned ? '#3B82F6' : '#6B7280'}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleSave(true)}
                            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                            disabled={isSaving}
                        >
                            <Text style={styles.saveButtonText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Title Input */}
                <View style={styles.titleContainer}>
                    <TextInput
                        style={styles.titleInput}
                        placeholder="Note title..."
                        placeholderTextColor="#9CA3AF"
                        value={title}
                        onChangeText={handleTitleChange}
                        autoFocus={!noteId}
                    />
                </View>

                {/* Tags Section */}
                <View style={styles.tagsSection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tagsScroll}
                    >
                        {selectedTags.map(tag => (
                            <View
                                key={tag.id}
                                style={[styles.selectedTag, { backgroundColor: tag.color + '20' }]}
                            >
                                <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                                <Text style={[styles.selectedTagText, { color: tag.color }]}>
                                    {tag.name}
                                </Text>
                                <TouchableOpacity onPress={() => toggleTag(tag)}>
                                    <Ionicons name="close" size={14} color={tag.color} />
                                </TouchableOpacity>
                            </View>
                        ))}
                        <TouchableOpacity
                            style={styles.addTagButton}
                            onPress={() => setShowTagPicker(true)}
                        >
                            <Ionicons name="add" size={18} color="#6B7280" />
                            <Text style={styles.addTagText}>Add Tag</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Content Editor */}
                <ScrollView
                    style={styles.editorScroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <TextInput
                        ref={contentInputRef}
                        style={styles.contentInput}
                        placeholder="Start typing your note..."
                        placeholderTextColor="#9CA3AF"
                        value={content}
                        onChangeText={handleContentChange}
                        multiline
                        textAlignVertical="top"
                    />
                </ScrollView>

                {/* Formatting Toolbar */}
                <View style={styles.toolbar}>
                    <TouchableOpacity
                        style={styles.toolbarButton}
                        onPress={() => handleContentChange(content + '\n# ')}
                    >
                        <Text style={styles.toolbarButtonText}>H1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.toolbarButton}
                        onPress={() => handleContentChange(content + '\n## ')}
                    >
                        <Text style={styles.toolbarButtonText}>H2</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.toolbarButton}
                        onPress={() => handleContentChange(content + '\n- ')}
                    >
                        <Ionicons name="list" size={18} color="#374151" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.toolbarButton}
                        onPress={() => handleContentChange(content + '\n> ')}
                    >
                        <Ionicons name="chatbox-outline" size={18} color="#374151" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.toolbarButton}
                        onPress={() => handleContentChange(content + '\n---\n')}
                    >
                        <Ionicons name="remove" size={18} color="#374151" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Tag Picker Modal */}
            <Modal
                visible={showTagPicker}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowTagPicker(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Tags</Text>
                        <TouchableOpacity onPress={() => setShowTagPicker(false)}>
                            <Text style={styles.modalDone}>Done</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.tagPickerList}>
                        {['subject', 'source', 'topic', 'custom'].map(category => {
                            const categoryTags = allTags.filter(t => t.category === category);
                            if (categoryTags.length === 0) return null;

                            return (
                                <View key={category}>
                                    <Text style={styles.tagCategoryTitle}>
                                        {category.charAt(0).toUpperCase() + category.slice(1)}
                                    </Text>
                                    <View style={styles.tagGrid}>
                                        {categoryTags.map(tag => {
                                            const isSelected = selectedTags.some(t => t.id === tag.id);
                                            return (
                                                <TouchableOpacity
                                                    key={tag.id}
                                                    style={[
                                                        styles.tagPickerItem,
                                                        isSelected && { backgroundColor: tag.color, borderColor: tag.color },
                                                    ]}
                                                    onPress={() => toggleTag(tag)}
                                                >
                                                    <View
                                                        style={[
                                                            styles.tagDot,
                                                            { backgroundColor: isSelected ? '#fff' : tag.color },
                                                        ]}
                                                    />
                                                    <Text
                                                        style={[
                                                            styles.tagPickerItemText,
                                                            isSelected && { color: '#fff' },
                                                        ]}
                                                    >
                                                        {tag.name}
                                                    </Text>
                                                    {isSelected && (
                                                        <Ionicons name="checkmark" size={14} color="#fff" />
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardAvoid: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerButton: {
        padding: 8,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerIconButton: {
        padding: 8,
    },
    savingText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    savedText: {
        fontSize: 12,
        color: '#10B981',
    },
    saveButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    saveButtonDisabled: {
        backgroundColor: '#93C5FD',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    titleContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    titleInput: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
        ...(Platform.OS === 'web' && { outlineStyle: 'none' as any }),
    },
    tagsSection: {
        paddingHorizontal: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    tagsScroll: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    selectedTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 16,
        gap: 6,
    },
    tagDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    selectedTagText: {
        fontSize: 13,
        fontWeight: '500',
    },
    addTagButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        gap: 4,
    },
    addTagText: {
        fontSize: 13,
        color: '#6B7280',
    },
    editorScroll: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    contentInput: {
        fontSize: 16,
        lineHeight: 24,
        color: '#111827',
        minHeight: 300,
        ...(Platform.OS === 'web' && { outlineStyle: 'none' as any }),
    },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        gap: 8,
    },
    toolbarButton: {
        width: 40,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    toolbarButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#374151',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    modalDone: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3B82F6',
    },
    tagPickerList: {
        flex: 1,
        padding: 20,
    },
    tagCategoryTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
        marginTop: 8,
    },
    tagGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    tagPickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
        gap: 6,
    },
    tagPickerItemText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
});

export default NoteEditorScreen;
