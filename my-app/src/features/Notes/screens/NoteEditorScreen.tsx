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

// Card colors matching NoteList
const CARD_COLORS = [
    { bg: '#FFF3E0', accent: '#FF9800', icon: '#E65100' },
    { bg: '#E3F2FD', accent: '#2196F3', icon: '#1565C0' },
    { bg: '#F3E5F5', accent: '#9C27B0', icon: '#6A1B9A' },
    { bg: '#E8F5E9', accent: '#4CAF50', icon: '#2E7D32' },
    { bg: '#FCE4EC', accent: '#E91E63', icon: '#AD1457' },
    { bg: '#E0F7FA', accent: '#00BCD4', icon: '#00838F' },
    { bg: '#FFF8E1', accent: '#FFC107', icon: '#FF8F00' },
    { bg: '#EDE7F6', accent: '#673AB7', icon: '#4527A0' },
];

const getColors = (id: number) => CARD_COLORS[id % CARD_COLORS.length];

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
    const [showTagPicker, setShowTagPicker] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [wordCount, setWordCount] = useState(0);
    const [colors, setColors] = useState(CARD_COLORS[0]);

    const contentRef = useRef<TextInput>(null);
    const titleRef = useRef<TextInput>(null);
    const saveAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadData();
    }, [noteId]);

    useEffect(() => {
        setWordCount(content.trim().split(/\s+/).filter(w => w.length > 0).length);
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
                    setColors(getColors(note.id));
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
        const timer = setTimeout(() => handleSave(), 1500);
        return () => clearTimeout(timer);
    }, [title, content, selectedTags, isPinned, hasChanges]);

    const showSaved = () => {
        Animated.sequence([
            Animated.timing(saveAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.delay(1500),
            Animated.timing(saveAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();
    };

    const handleSave = async () => {
        if (!noteId) return;
        try {
            await updateNote(noteId, {
                title: title.trim() || 'Untitled',
                content,
                tags: selectedTags,
                isPinned,
            });
            setHasChanges(false);
            showSaved();
        } catch (error) {
            console.error('[NoteEditor] Save error:', error);
        }
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
                    <Ionicons name="hourglass-outline" size={32} color="#9CA3AF" />
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
                        <Ionicons name="chevron-back" size={24} color="#111827" />
                    </TouchableOpacity>

                    <Animated.View style={[styles.savedBadge, { opacity: saveAnim }]}>
                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                        <Text style={styles.savedText}>Saved</Text>
                    </Animated.View>

                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            onPress={() => { setIsPinned(!isPinned); setHasChanges(true); }}
                            style={styles.headerBtn}
                        >
                            <Ionicons
                                name={isPinned ? 'bookmark' : 'bookmark-outline'}
                                size={22}
                                color={isPinned ? colors.icon : '#9CA3AF'}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.headerBtn}>
                            <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Color Accent */}
                <View style={[styles.colorBar, { backgroundColor: colors.accent }]} />

                {/* Content */}
                <ScrollView
                    style={styles.editor}
                    contentContainerStyle={styles.editorContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Title */}
                    <TextInput
                        ref={titleRef}
                        style={[styles.titleInput, { color: colors.icon }]}
                        placeholder="Note title..."
                        placeholderTextColor="#9CA3AF"
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
                                <Ionicons name="add" size={16} color="#9CA3AF" />
                                <Text style={styles.addTagText}>Tag</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>

                    {/* Content Input */}
                    <TextInput
                        ref={contentRef}
                        style={styles.contentInput}
                        placeholder="Start writing..."
                        placeholderTextColor="#9CA3AF"
                        value={content}
                        onChangeText={c => { setContent(c); setHasChanges(true); }}
                        multiline
                        textAlignVertical="top"
                        scrollEnabled={false}
                    />
                </ScrollView>

                {/* Toolbar */}
                <View style={styles.toolbar}>
                    <View style={styles.toolbarLeft}>
                        <TouchableOpacity style={styles.toolBtn} onPress={() => insertFormat('# ')}>
                            <Text style={styles.toolText}>H1</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.toolBtn} onPress={() => insertFormat('## ')}>
                            <Text style={styles.toolText}>H2</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.toolBtn} onPress={() => insertFormat('- ')}>
                            <Ionicons name="list" size={18} color="#6B7280" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.toolBtn} onPress={() => insertFormat('[ ] ')}>
                            <Ionicons name="checkbox-outline" size={18} color="#6B7280" />
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
                            <Ionicons name="pricetags-outline" size={18} color="#111827" />
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
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            <Text style={[styles.menuText, { color: '#EF4444' }]}>Delete</Text>
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
                        <Text style={styles.tagModalTitle}>Tags</Text>
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
                                    <Text style={styles.categoryTitle}>
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
                                                        style={[styles.tagDot, { backgroundColor: isSelected ? '#fff' : tag.color }]}
                                                    />
                                                    <Text style={[styles.tagOptionText, isSelected && { color: '#fff' }]}>
                                                        {tag.name}
                                                    </Text>
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
        backgroundColor: '#FAFAFA',
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
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#fff',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    savedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    savedText: {
        fontSize: 13,
        color: '#10B981',
        fontWeight: '600',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    colorBar: {
        height: 4,
    },
    editor: {
        flex: 1,
    },
    editorContent: {
        padding: 20,
        paddingBottom: 100,
    },
    titleInput: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 16,
        ...(Platform.OS === 'web' && { outlineStyle: 'none' as any }),
    },
    tagsSection: {
        marginBottom: 20,
    },
    tagsScroll: {
        gap: 8,
    },
    tag: {
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
    tagText: {
        fontSize: 13,
        fontWeight: '600',
    },
    addTagBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        gap: 4,
    },
    addTagText: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    contentInput: {
        fontSize: 16,
        lineHeight: 26,
        color: '#374151',
        minHeight: 400,
        ...(Platform.OS === 'web' && { outlineStyle: 'none' as any }),
    },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    toolbarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    toolBtn: {
        width: 42,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    toolText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
    },
    wordCount: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(17, 24, 39, 0.4)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 60,
        paddingRight: 16,
    },
    menu: {
        backgroundColor: '#fff',
        borderRadius: 16,
        minWidth: 180,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
    },
    menuText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
    },
    tagModal: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    tagModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 18,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    tagModalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    doneBtn: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6366F1',
    },
    tagList: {
        flex: 1,
        padding: 20,
    },
    tagCategory: {
        marginBottom: 24,
    },
    categoryTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
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
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
        gap: 8,
    },
    tagOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
});

export default NoteEditorScreen;
