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

// Vibrant accent colors
const ACCENT_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

const getAccent = (id: number) => ACCENT_COLORS[id % ACCENT_COLORS.length];

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

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedTags, setSelectedTags] = useState<LocalTag[]>([]);
    const [allTags, setAllTags] = useState<LocalTag[]>([]);
    const [isPinned, setIsPinned] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showTagPicker, setShowTagPicker] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [wordCount, setWordCount] = useState(0);
    const [accentColor, setAccentColor] = useState('#4ECDC4');

    const contentRef = useRef<TextInput>(null);
    const titleRef = useRef<TextInput>(null);
    const saveAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadData();
    }, [noteId]);

    useEffect(() => {
        const words = content.trim().split(/\s+/).filter(w => w.length > 0).length;
        setWordCount(words);
    }, [content]);

    useEffect(() => {
        if (!isLoading) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [isLoading]);

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
                    setAccentColor(getAccent(note.id));
                }
            }
        } catch (error) {
            console.error('[NoteEditor] Error:', error);
        }
        setIsLoading(false);

        if (isNew) {
            setTimeout(() => titleRef.current?.focus(), 100);
        }
    };

    useEffect(() => {
        if (!hasChanges || !noteId) return;
        const timer = setTimeout(() => handleSave(false), 1500);
        return () => clearTimeout(timer);
    }, [title, content, selectedTags, isPinned, hasChanges]);

    const showSaveAnimation = () => {
        Animated.sequence([
            Animated.timing(saveAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.delay(1500),
            Animated.timing(saveAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();
    };

    const handleSave = async (showAlert = true) => {
        if (!noteId) return;
        setIsSaving(true);
        try {
            await updateNote(noteId, {
                title: title.trim() || 'Untitled',
                content,
                tags: selectedTags,
                isPinned,
            });
            setHasChanges(false);
            showSaveAnimation();
        } catch (error) {
            if (showAlert) Alert.alert('Error', 'Failed to save');
        }
        setIsSaving(false);
    };

    const handleDelete = () => {
        Alert.alert('Delete Note', 'This cannot be undone.', [
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
        ]);
    };

    const toggleTag = (tag: LocalTag) => {
        setSelectedTags(prev => {
            const exists = prev.some(t => t.id === tag.id);
            setHasChanges(true);
            return exists ? prev.filter(t => t.id !== tag.id) : [...prev, tag];
        });
    };

    const insertFormat = (prefix: string) => {
        setContent(prev => prev + (prev ? '\n' : '') + prefix);
        setHasChanges(true);
        contentRef.current?.focus();
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loading}>
                    <Ionicons name="sparkles" size={32} color="#4ECDC4" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color="#1E293B" />
                    </TouchableOpacity>

                    <Animated.View style={[styles.saveIndicator, { opacity: saveAnim }]}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.saveText}>Saved</Text>
                    </Animated.View>

                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            onPress={() => setIsPinned(!isPinned)}
                            style={styles.headerBtn}
                        >
                            <Ionicons
                                name={isPinned ? 'star' : 'star-outline'}
                                size={22}
                                color={isPinned ? '#FFD700' : '#94A3B8'}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.headerBtn}>
                            <Ionicons name="ellipsis-horizontal" size={22} color="#64748B" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Accent Bar */}
                <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

                {/* Editor */}
                <Animated.ScrollView
                    style={[styles.editor, { opacity: fadeAnim }]}
                    contentContainerStyle={styles.editorContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Title */}
                    <TextInput
                        ref={titleRef}
                        style={styles.titleInput}
                        placeholder="Give your note a title..."
                        placeholderTextColor="#94A3B8"
                        value={title}
                        onChangeText={t => { setTitle(t); setHasChanges(true); }}
                        multiline={false}
                        returnKeyType="next"
                        onSubmitEditing={() => contentRef.current?.focus()}
                    />

                    {/* Tags */}
                    <View style={styles.tagsSection}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.tagsScroll}
                        >
                            {selectedTags.map(tag => (
                                <TouchableOpacity
                                    key={tag.id}
                                    style={[styles.tag, { backgroundColor: tag.color + '20' }]}
                                    onPress={() => toggleTag(tag)}
                                >
                                    <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                                    <Text style={[styles.tagText, { color: tag.color }]}>{tag.name}</Text>
                                    <Ionicons name="close" size={12} color={tag.color} />
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                style={styles.addTagBtn}
                                onPress={() => setShowTagPicker(true)}
                            >
                                <Ionicons name="add" size={16} color="#94A3B8" />
                                <Text style={styles.addTagText}>Add tag</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>

                    {/* Content */}
                    <TextInput
                        ref={contentRef}
                        style={styles.contentInput}
                        placeholder="Start writing your thoughts..."
                        placeholderTextColor="#94A3B8"
                        value={content}
                        onChangeText={c => { setContent(c); setHasChanges(true); }}
                        multiline
                        textAlignVertical="top"
                        scrollEnabled={false}
                    />
                </Animated.ScrollView>

                {/* Toolbar */}
                <View style={styles.toolbar}>
                    <View style={styles.toolbarLeft}>
                        <TouchableOpacity style={styles.toolBtn} onPress={() => insertFormat('# ')}>
                            <Text style={styles.toolBtnText}>H1</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.toolBtn} onPress={() => insertFormat('## ')}>
                            <Text style={styles.toolBtnText}>H2</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.toolBtn} onPress={() => insertFormat('- ')}>
                            <Ionicons name="list" size={18} color="#64748B" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.toolBtn} onPress={() => insertFormat('> ')}>
                            <Ionicons name="chatbox-outline" size={18} color="#64748B" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.toolBtn} onPress={() => insertFormat('[ ] ')}>
                            <Ionicons name="checkbox-outline" size={18} color="#64748B" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.wordCount}>{wordCount} words</Text>
                </View>
            </KeyboardAvoidingView>

            {/* Menu */}
            <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
                <TouchableOpacity
                    style={styles.menuOverlay}
                    activeOpacity={1}
                    onPress={() => setShowMenu(false)}
                >
                    <View style={styles.menu}>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                setShowMenu(false);
                                setShowTagPicker(true);
                            }}
                        >
                            <Ionicons name="pricetags-outline" size={20} color="#1E293B" />
                            <Text style={styles.menuText}>Manage tags</Text>
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                setShowMenu(false);
                                handleDelete();
                            }}
                        >
                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            <Text style={[styles.menuText, { color: '#EF4444' }]}>Delete note</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Tag Picker */}
            <Modal
                visible={showTagPicker}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowTagPicker(false)}
            >
                <SafeAreaView style={styles.tagModal}>
                    <View style={styles.tagModalHeader}>
                        <Text style={styles.tagModalTitle}>Select Tags</Text>
                        <TouchableOpacity onPress={() => setShowTagPicker(false)}>
                            <Text style={styles.doneBtn}>Done</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.tagList}>
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
        backgroundColor: '#F8FAFC',
    },
    keyboardView: {
        flex: 1,
    },
    loading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    saveText: {
        fontSize: 14,
        color: '#10B981',
        fontWeight: '600',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    headerBtn: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    accentBar: {
        height: 4,
    },
    editor: {
        flex: 1,
    },
    editorContent: {
        padding: 24,
        paddingBottom: 100,
    },
    titleInput: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 20,
        letterSpacing: -0.5,
        ...(Platform.OS === 'web' && { outlineStyle: 'none' as any }),
    },
    tagsSection: {
        marginBottom: 24,
    },
    tagsScroll: {
        gap: 10,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    tagDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    tagText: {
        fontSize: 14,
        fontWeight: '600',
    },
    addTagBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        gap: 6,
    },
    addTagText: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '500',
    },
    contentInput: {
        fontSize: 18,
        lineHeight: 28,
        color: '#334155',
        minHeight: 400,
        ...(Platform.OS === 'web' && { outlineStyle: 'none' as any }),
    },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    toolbarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    toolBtn: {
        width: 44,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    toolBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
    },
    wordCount: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '500',
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 70,
        paddingRight: 20,
    },
    menu: {
        backgroundColor: '#fff',
        borderRadius: 20,
        minWidth: 200,
        overflow: 'hidden',
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        gap: 14,
    },
    menuText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#E2E8F0',
    },
    tagModal: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    tagModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    tagModalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
    },
    doneBtn: {
        fontSize: 17,
        fontWeight: '600',
        color: '#4ECDC4',
    },
    tagList: {
        flex: 1,
        padding: 24,
    },
    tagCategory: {
        marginBottom: 28,
    },
    tagCategoryTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 16,
    },
    tagGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    tagOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        backgroundColor: '#fff',
        gap: 10,
    },
    tagOptionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
});

export default NoteEditorScreen;
