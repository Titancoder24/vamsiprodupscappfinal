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
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    getNoteById,
    updateNote,
    deleteNote,
    getAllTags,
    LocalNote,
    LocalTag,
} from '../services/localNotesStorage';

// Premium color palette
const COLORS = {
    background: '#FFFFFF',
    surface: '#FAFAFA',
    border: '#EBEBEB',
    borderLight: '#F5F5F5',
    text: '#1A1A1A',
    textSecondary: '#717171',
    textTertiary: '#A3A3A3',
    primary: '#2563EB',
    primaryLight: '#EFF6FF',
    danger: '#EF4444',
    success: '#10B981',
};

interface NoteEditorScreenProps {
    navigation: any;
    route: {
        params?: {
            noteId?: number;
            isNew?: boolean;
        };
    };
}

export const NoteEditorScreen: React.FC<NoteEditorScreenProps> = ({
    navigation,
    route,
}) => {
    const noteId = route.params?.noteId;
    const isNew = route.params?.isNew;

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
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [wordCount, setWordCount] = useState(0);

    const contentInputRef = useRef<TextInput>(null);
    const titleInputRef = useRef<TextInput>(null);
    const saveIndicator = useRef(new Animated.Value(0)).current;

    // Load note and tags
    useEffect(() => {
        loadData();
    }, [noteId]);

    // Update word count
    useEffect(() => {
        const words = content.trim().split(/\s+/).filter(w => w.length > 0).length;
        setWordCount(words);
    }, [content]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const tags = await getAllTags();
            setAllTags(tags);

            if (noteId) {
                const note = await getNoteById(noteId);
                if (note) {
                    setTitle(note.title === 'Untitled Note' ? '' : note.title);
                    setContent(note.content);
                    setSelectedTags(note.tags);
                    setIsPinned(note.isPinned);
                }
            }
        } catch (error) {
            console.error('[NoteEditor] Error loading:', error);
        }
        setIsLoading(false);

        // Focus title for new notes
        if (isNew) {
            setTimeout(() => titleInputRef.current?.focus(), 100);
        }
    };

    // Auto-save on changes
    useEffect(() => {
        if (!hasChanges || !noteId) return;

        const timer = setTimeout(() => {
            handleSave(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, [title, content, selectedTags, isPinned, hasChanges]);

    // Show save indicator animation
    const showSaveIndicator = () => {
        Animated.sequence([
            Animated.timing(saveIndicator, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.delay(1500),
            Animated.timing(saveIndicator, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handleSave = async (showAlert: boolean = true) => {
        if (!noteId) return;

        setIsSaving(true);
        try {
            await updateNote(noteId, {
                title: title.trim() || 'Untitled',
                content,
                tags: selectedTags,
                isPinned,
            });
            setLastSaved(new Date());
            setHasChanges(false);
            showSaveIndicator();
        } catch (error) {
            console.error('[NoteEditor] Save error:', error);
            if (showAlert) {
                Alert.alert('Error', 'Failed to save note');
            }
        }
        setIsSaving(false);
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Note',
            'This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        if (noteId) {
                            await deleteNote(noteId);
                            navigation.goBack();
                        }
                    },
                },
            ]
        );
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

    const togglePin = async () => {
        const newPinned = !isPinned;
        setIsPinned(newPinned);
        setHasChanges(true);
        setShowMoreMenu(false);
    };

    const formatLastSaved = () => {
        if (!lastSaved) return '';
        const now = new Date();
        const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
        if (diff < 5) return 'Saved';
        if (diff < 60) return `Saved ${diff}s ago`;
        return `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    const insertFormatting = (prefix: string, suffix: string = '') => {
        const newContent = content + (content ? '\n' : '') + prefix;
        setContent(newContent);
        setHasChanges(true);
        contentInputRef.current?.focus();
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
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
                        <Ionicons name="chevron-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        <Animated.View style={{ opacity: saveIndicator }}>
                            <View style={styles.savedIndicator}>
                                <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                                <Text style={styles.savedText}>Saved</Text>
                            </View>
                        </Animated.View>
                    </View>

                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            onPress={() => setShowMoreMenu(true)}
                            style={styles.headerButton}
                        >
                            <Ionicons name="ellipsis-horizontal" size={22} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Title Input */}
                <View style={styles.titleContainer}>
                    <TextInput
                        ref={titleInputRef}
                        style={styles.titleInput}
                        placeholder="Title"
                        placeholderTextColor={COLORS.textTertiary}
                        value={title}
                        onChangeText={handleTitleChange}
                        multiline={false}
                        returnKeyType="next"
                        onSubmitEditing={() => contentInputRef.current?.focus()}
                    />
                </View>

                {/* Tags Row */}
                <View style={styles.tagsRow}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tagsScrollContent}
                    >
                        {selectedTags.map(tag => (
                            <TouchableOpacity
                                key={tag.id}
                                style={[styles.tagPill, { backgroundColor: tag.color + '15' }]}
                                onPress={() => toggleTag(tag)}
                            >
                                <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                                <Text style={[styles.tagPillText, { color: tag.color }]}>
                                    {tag.name}
                                </Text>
                                <Ionicons name="close" size={12} color={tag.color} />
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={styles.addTagPill}
                            onPress={() => setShowTagPicker(true)}
                        >
                            <Ionicons name="add" size={16} color={COLORS.textTertiary} />
                            <Text style={styles.addTagText}>Tag</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Content Editor */}
                <ScrollView
                    style={styles.editorScroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <TextInput
                        ref={contentInputRef}
                        style={styles.contentInput}
                        placeholder="Start writing..."
                        placeholderTextColor={COLORS.textTertiary}
                        value={content}
                        onChangeText={handleContentChange}
                        multiline
                        textAlignVertical="top"
                        scrollEnabled={false}
                    />
                </ScrollView>

                {/* Bottom Toolbar */}
                <View style={styles.toolbar}>
                    <View style={styles.toolbarLeft}>
                        <TouchableOpacity
                            style={styles.toolbarBtn}
                            onPress={() => insertFormatting('# ')}
                        >
                            <Text style={styles.toolbarBtnText}>H1</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.toolbarBtn}
                            onPress={() => insertFormatting('## ')}
                        >
                            <Text style={styles.toolbarBtnText}>H2</Text>
                        </TouchableOpacity>
                        <View style={styles.toolbarDivider} />
                        <TouchableOpacity
                            style={styles.toolbarBtn}
                            onPress={() => insertFormatting('- ')}
                        >
                            <Ionicons name="list" size={18} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.toolbarBtn}
                            onPress={() => insertFormatting('> ')}
                        >
                            <Ionicons name="chatbox-outline" size={18} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.toolbarBtn}
                            onPress={() => insertFormatting('[ ] ')}
                        >
                            <Ionicons name="checkbox-outline" size={18} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.wordCount}>{wordCount} words</Text>
                </View>
            </KeyboardAvoidingView>

            {/* More Menu Modal */}
            <Modal
                visible={showMoreMenu}
                animationType="fade"
                transparent
                onRequestClose={() => setShowMoreMenu(false)}
            >
                <TouchableOpacity
                    style={styles.menuOverlay}
                    activeOpacity={1}
                    onPress={() => setShowMoreMenu(false)}
                >
                    <View style={styles.menuContainer}>
                        <TouchableOpacity style={styles.menuItem} onPress={togglePin}>
                            <Ionicons
                                name={isPinned ? "pin" : "pin-outline"}
                                size={20}
                                color={isPinned ? COLORS.primary : COLORS.text}
                            />
                            <Text style={styles.menuItemText}>
                                {isPinned ? 'Unpin note' : 'Pin note'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                setShowMoreMenu(false);
                                setShowTagPicker(true);
                            }}
                        >
                            <Ionicons name="pricetags-outline" size={20} color={COLORS.text} />
                            <Text style={styles.menuItemText}>Manage tags</Text>
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                setShowMoreMenu(false);
                                handleDelete();
                            }}
                        >
                            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                            <Text style={[styles.menuItemText, { color: COLORS.danger }]}>
                                Delete note
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Tag Picker Modal */}
            <Modal
                visible={showTagPicker}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowTagPicker(false)}
            >
                <SafeAreaView style={styles.tagModalContainer}>
                    <View style={styles.tagModalHeader}>
                        <Text style={styles.tagModalTitle}>Tags</Text>
                        <TouchableOpacity
                            style={styles.tagModalDone}
                            onPress={() => setShowTagPicker(false)}
                        >
                            <Text style={styles.tagModalDoneText}>Done</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.tagPickerList}>
                        {['subject', 'source', 'topic', 'custom'].map(category => {
                            const categoryTags = allTags.filter(t => t.category === category);
                            if (categoryTags.length === 0) return null;

                            return (
                                <View key={category} style={styles.tagCategory}>
                                    <Text style={styles.tagCategoryTitle}>
                                        {category === 'custom' ? 'Your Tags' : category.charAt(0).toUpperCase() + category.slice(1)}
                                    </Text>
                                    <View style={styles.tagGrid}>
                                        {categoryTags.map(tag => {
                                            const isSelected = selectedTags.some(t => t.id === tag.id);
                                            return (
                                                <TouchableOpacity
                                                    key={tag.id}
                                                    style={[
                                                        styles.tagOption,
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
                                                            styles.tagOptionText,
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
        backgroundColor: COLORS.background,
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
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    headerButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    savedIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    savedText: {
        fontSize: 13,
        color: COLORS.success,
        fontWeight: '500',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    titleContainer: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 12,
    },
    titleInput: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.text,
        letterSpacing: -0.5,
        ...(Platform.OS === 'web' && { outlineStyle: 'none' as any }),
    },
    tagsRow: {
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    tagsScrollContent: {
        gap: 8,
    },
    tagPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    tagDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    tagPillText: {
        fontSize: 13,
        fontWeight: '500',
    },
    addTagPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        gap: 4,
    },
    addTagText: {
        fontSize: 13,
        color: COLORS.textTertiary,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.borderLight,
        marginHorizontal: 24,
    },
    editorScroll: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    contentInput: {
        fontSize: 16,
        lineHeight: 26,
        color: COLORS.text,
        minHeight: 400,
        ...(Platform.OS === 'web' && { outlineStyle: 'none' as any }),
    },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        backgroundColor: COLORS.surface,
    },
    toolbarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    toolbarBtn: {
        width: 40,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    toolbarBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.textSecondary,
    },
    toolbarDivider: {
        width: 1,
        height: 20,
        backgroundColor: COLORS.border,
        marginHorizontal: 8,
    },
    wordCount: {
        fontSize: 12,
        color: COLORS.textTertiary,
        fontWeight: '500',
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 60,
        paddingRight: 16,
    },
    menuContainer: {
        backgroundColor: COLORS.background,
        borderRadius: 14,
        minWidth: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
    },
    menuItemText: {
        fontSize: 15,
        color: COLORS.text,
        fontWeight: '500',
    },
    menuDivider: {
        height: 1,
        backgroundColor: COLORS.borderLight,
    },
    tagModalContainer: {
        flex: 1,
        backgroundColor: COLORS.surface,
    },
    tagModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    tagModalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    tagModalDone: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    tagModalDoneText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
    },
    tagPickerList: {
        flex: 1,
        padding: 20,
    },
    tagCategory: {
        marginBottom: 24,
    },
    tagCategoryTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 14,
    },
    tagGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    tagOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        backgroundColor: COLORS.background,
        gap: 8,
    },
    tagOptionText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
    },
});

export default NoteEditorScreen;
