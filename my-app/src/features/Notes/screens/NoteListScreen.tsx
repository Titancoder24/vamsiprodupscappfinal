import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    Dimensions,
    Platform,
    Modal,
    ScrollView,
    Alert,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
    getAllNotes,
    getAllTags,
    createNote,
    deleteNote,
    createTag,
    deleteTag,
    searchNotes,
    updateNote,
    LocalNote,
    LocalTag,
} from '../services/localNotesStorage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface NoteListScreenProps {
    navigation: any;
}

// Modern vibrant colors
const ACCENT_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

const getAccentColor = (id: number) => ACCENT_COLORS[id % ACCENT_COLORS.length];

// Tag colors
const TAG_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

export const NoteListScreen: React.FC<NoteListScreenProps> = ({ navigation }) => {
    const [notes, setNotes] = useState<LocalNote[]>([]);
    const [tags, setTags] = useState<LocalTag[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
    const [showTagModal, setShowTagModal] = useState(false);
    const [showCreateTagModal, setShowCreateTagModal] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    useEffect(() => {
        if (!loading) {
            Animated.parallel([
                Animated.spring(fadeAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [loading]);

    useEffect(() => {
        if (searchQuery || selectedTagIds.length > 0) {
            filterNotes();
        } else {
            loadNotes();
        }
    }, [searchQuery, selectedTagIds]);

    const loadData = async () => {
        setLoading(true);
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.9);
        await Promise.all([loadNotes(), loadTags()]);
        setLoading(false);
    };

    const loadNotes = async () => {
        const allNotes = await getAllNotes();
        setNotes(allNotes.filter(n => !n.isArchived));
    };

    const loadTags = async () => {
        const allTags = await getAllTags();
        setTags(allTags);
    };

    const filterNotes = async () => {
        const filtered = await searchNotes(searchQuery, selectedTagIds);
        setNotes(filtered);
    };

    const handleCreateNote = async () => {
        const newNote = await createNote({ title: '', content: '' });
        navigation.navigate('NoteEditor', { noteId: newNote.id, isNew: true });
    };

    const handleDeleteNote = (noteId: number, noteTitle: string) => {
        Alert.alert('Delete Note', `Delete "${noteTitle || 'Untitled'}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await deleteNote(noteId);
                    loadNotes();
                },
            },
        ]);
    };

    const handleTogglePin = async (note: LocalNote) => {
        await updateNote(note.id, { isPinned: !note.isPinned });
        loadNotes();
    };

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;
        await createTag(newTagName.trim(), newTagColor, 'custom');
        setNewTagName('');
        setShowCreateTagModal(false);
        loadTags();
    };

    const handleDeleteTag = async (tagId: number) => {
        Alert.alert('Delete Tag', 'Remove from all notes?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await deleteTag(tagId);
                    loadTags();
                },
            },
        ]);
    };

    const toggleTagFilter = (tagId: number) => {
        setSelectedTagIds(ids =>
            ids.includes(tagId) ? ids.filter(id => id !== tagId) : [...ids, tagId]
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getPreview = (content: string) => {
        return content.replace(/^[#\-*>\[\]]+\s*/gm, '').replace(/\n+/g, ' ').trim() || 'Empty note';
    };

    const pinnedNotes = notes.filter(n => n.isPinned);
    const unpinnedNotes = notes.filter(n => !n.isPinned);

    const renderNoteCard = (note: LocalNote, index: number, isPinned = false) => {
        const accent = getAccentColor(note.id);

        return (
            <Animated.View
                key={note.id}
                style={[
                    styles.cardContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                <TouchableOpacity
                    style={styles.noteCard}
                    onPress={() => navigation.navigate('NoteEditor', { noteId: note.id })}
                    onLongPress={() => handleDeleteNote(note.id, note.title)}
                    activeOpacity={0.9}
                >
                    {/* Accent bar */}
                    <View style={[styles.accentBar, { backgroundColor: accent }]} />

                    {/* Content */}
                    <View style={styles.cardContent}>
                        {/* Header */}
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconCircle, { backgroundColor: accent + '20' }]}>
                                <Ionicons name="document-text" size={16} color={accent} />
                            </View>
                            <TouchableOpacity
                                onPress={() => handleTogglePin(note)}
                                style={styles.pinBtn}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons
                                    name={note.isPinned ? 'star' : 'star-outline'}
                                    size={18}
                                    color={note.isPinned ? '#FFD700' : '#CBD5E1'}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Title */}
                        <Text style={styles.noteTitle} numberOfLines={2}>
                            {note.title || 'Untitled'}
                        </Text>

                        {/* Preview */}
                        <Text style={styles.notePreview} numberOfLines={2}>
                            {getPreview(note.content)}
                        </Text>

                        {/* Tags */}
                        {note.tags.length > 0 && (
                            <View style={styles.tagsRow}>
                                {note.tags.slice(0, 2).map(tag => (
                                    <View
                                        key={tag.id}
                                        style={[styles.miniTag, { backgroundColor: tag.color + '15' }]}
                                    >
                                        <Text style={[styles.miniTagText, { color: tag.color }]}>
                                            {tag.name}
                                        </Text>
                                    </View>
                                ))}
                                {note.tags.length > 2 && (
                                    <Text style={styles.moreCount}>+{note.tags.length - 2}</Text>
                                )}
                            </View>
                        )}

                        {/* Footer */}
                        <View style={styles.cardFooter}>
                            <Text style={styles.dateText}>{formatDate(note.updatedAt)}</Text>
                            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Hero Header */}
            <View style={styles.heroHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#1E293B" />
                </TouchableOpacity>

                <View style={styles.heroContent}>
                    <Text style={styles.heroTitle}>Your Notes</Text>
                    <Text style={styles.heroSubtitle}>
                        {notes.length} note{notes.length !== 1 ? 's' : ''} • {pinnedNotes.length} pinned
                    </Text>
                </View>

                <TouchableOpacity onPress={() => setShowTagModal(true)} style={styles.tagBtn}>
                    <Ionicons name="pricetags" size={20} color="#64748B" />
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchWrapper}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search your notes..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Filter Pills */}
            {tags.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterPills}
                >
                    <TouchableOpacity
                        style={[styles.pill, selectedTagIds.length === 0 && styles.pillActive]}
                        onPress={() => setSelectedTagIds([])}
                    >
                        <Text style={[styles.pillText, selectedTagIds.length === 0 && styles.pillTextActive]}>
                            All
                        </Text>
                    </TouchableOpacity>
                    {tags.slice(0, 5).map(tag => {
                        const isSelected = selectedTagIds.includes(tag.id);
                        return (
                            <TouchableOpacity
                                key={tag.id}
                                style={[styles.pill, isSelected && { backgroundColor: tag.color }]}
                                onPress={() => toggleTagFilter(tag.id)}
                            >
                                <View style={[styles.dot, { backgroundColor: isSelected ? '#fff' : tag.color }]} />
                                <Text style={[styles.pillText, isSelected && { color: '#fff' }]}>
                                    {tag.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}

            {/* Notes */}
            {loading ? (
                <View style={styles.loadingState}>
                    <View style={styles.loadingIcon}>
                        <Ionicons name="sparkles" size={32} color="#4ECDC4" />
                    </View>
                    <Text style={styles.loadingText}>Loading your notes...</Text>
                </View>
            ) : notes.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIllustration}>
                        <View style={[styles.emptyCircle, { backgroundColor: '#FF6B6B20' }]}>
                            <View style={[styles.emptyCircle, { backgroundColor: '#FF6B6B40', width: 80, height: 80 }]}>
                                <Ionicons name="create-outline" size={32} color="#FF6B6B" />
                            </View>
                        </View>
                    </View>
                    <Text style={styles.emptyTitle}>
                        {searchQuery ? 'No results found' : 'Start your journey'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {searchQuery
                            ? 'Try a different search term'
                            : 'Create your first note and capture your ideas'}
                    </Text>
                    {!searchQuery && (
                        <TouchableOpacity style={styles.emptyBtn} onPress={handleCreateNote}>
                            <Ionicons name="add" size={20} color="#fff" />
                            <Text style={styles.emptyBtnText}>Create Note</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Pinned */}
                    {pinnedNotes.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIcon}>
                                    <Ionicons name="star" size={12} color="#FFD700" />
                                </View>
                                <Text style={styles.sectionTitle}>Pinned</Text>
                            </View>
                            <View style={styles.notesGrid}>
                                {pinnedNotes.map((note, i) => renderNoteCard(note, i, true))}
                            </View>
                        </View>
                    )}

                    {/* All */}
                    {unpinnedNotes.length > 0 && (
                        <View style={styles.section}>
                            {pinnedNotes.length > 0 && (
                                <View style={styles.sectionHeader}>
                                    <View style={[styles.sectionIcon, { backgroundColor: '#E2E8F0' }]}>
                                        <Ionicons name="document-text" size={12} color="#64748B" />
                                    </View>
                                    <Text style={styles.sectionTitle}>Recent</Text>
                                </View>
                            )}
                            <View style={styles.notesGrid}>
                                {unpinnedNotes.map((note, i) => renderNoteCard(note, i))}
                            </View>
                        </View>
                    )}
                </ScrollView>
            )}

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={handleCreateNote} activeOpacity={0.9}>
                <View style={styles.fabInner}>
                    <Ionicons name="add" size={28} color="#fff" />
                </View>
            </TouchableOpacity>

            {/* Tag Modal */}
            <Modal
                visible={showTagModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowTagModal(false)}
            >
                <SafeAreaView style={styles.modalSafe}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Manage Tags</Text>
                        <TouchableOpacity onPress={() => setShowTagModal(false)}>
                            <Ionicons name="close" size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.addTagRow}
                        onPress={() => setShowCreateTagModal(true)}
                    >
                        <View style={styles.addTagIcon}>
                            <Ionicons name="add" size={20} color="#4ECDC4" />
                        </View>
                        <Text style={styles.addTagText}>Create new tag</Text>
                    </TouchableOpacity>

                    <ScrollView style={styles.tagList}>
                        {tags.map(tag => (
                            <View key={tag.id} style={styles.tagItem}>
                                <View style={styles.tagItemLeft}>
                                    <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                                    <View>
                                        <Text style={styles.tagItemName}>{tag.name}</Text>
                                        <Text style={styles.tagItemCount}>{tag.usageCount} notes</Text>
                                    </View>
                                </View>
                                {tag.category === 'custom' && (
                                    <TouchableOpacity onPress={() => handleDeleteTag(tag.id)}>
                                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* Create Tag Modal */}
            <Modal
                visible={showCreateTagModal}
                animationType="fade"
                transparent
                onRequestClose={() => setShowCreateTagModal(false)}
            >
                <View style={styles.overlay}>
                    <View style={styles.createModal}>
                        <Text style={styles.createTitle}>New Tag</Text>

                        <TextInput
                            style={styles.createInput}
                            placeholder="Enter tag name"
                            placeholderTextColor="#94A3B8"
                            value={newTagName}
                            onChangeText={setNewTagName}
                            autoFocus
                        />

                        <View style={styles.colorRow}>
                            {TAG_COLORS.map(color => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorCircle,
                                        { backgroundColor: color },
                                        newTagColor === color && styles.colorSelected,
                                    ]}
                                    onPress={() => setNewTagColor(color)}
                                >
                                    {newTagColor === color && (
                                        <Ionicons name="checkmark" size={14} color="#fff" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.createActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setShowCreateTagModal(false)}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.createBtn, !newTagName.trim() && styles.createBtnDisabled]}
                                onPress={handleCreateTag}
                                disabled={!newTagName.trim()}
                            >
                                <Text style={styles.createBtnText}>Create</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    heroHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
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
    heroContent: {
        flex: 1,
        marginLeft: 16,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    heroSubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 4,
    },
    tagBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchWrapper: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1E293B',
        ...(Platform.OS === 'web' && { outlineStyle: 'none' as any }),
    },
    filterPills: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: '#F1F5F9',
        marginRight: 10,
        gap: 8,
    },
    pillActive: {
        backgroundColor: '#1E293B',
    },
    pillText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    pillTextActive: {
        color: '#fff',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    loadingState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
    },
    loadingIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#4ECDC415',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#64748B',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 48,
    },
    emptyIllustration: {
        marginBottom: 32,
    },
    emptyCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    emptyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4ECDC4',
        paddingHorizontal: 28,
        paddingVertical: 16,
        borderRadius: 16,
        gap: 10,
    },
    emptyBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 120,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    sectionIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#FEF3C720',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    notesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
    },
    cardContainer: {
        width: isWeb ? '33.33%' : '50%',
        padding: 8,
    },
    noteCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 8,
    },
    accentBar: {
        height: 4,
    },
    cardContent: {
        padding: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pinBtn: {
        padding: 4,
    },
    noteTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
        lineHeight: 24,
    },
    notePreview: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
        marginBottom: 16,
    },
    tagsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 6,
    },
    miniTag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    miniTagText: {
        fontSize: 12,
        fontWeight: '600',
    },
    moreCount: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '500',
    },
    fab: {
        position: 'absolute',
        bottom: 32,
        right: 24,
    },
    fabInner: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#4ECDC4',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4ECDC4',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    modalSafe: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
    },
    addTagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        margin: 20,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
    },
    addTagIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#4ECDC415',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addTagText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4ECDC4',
    },
    tagList: {
        flex: 1,
        paddingHorizontal: 20,
    },
    tagItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 10,
    },
    tagItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    tagDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    tagItemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
    },
    tagItemCount: {
        fontSize: 13,
        color: '#94A3B8',
        marginTop: 2,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    createModal: {
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 28,
        width: '100%',
        maxWidth: 380,
    },
    createTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 24,
        textAlign: 'center',
    },
    createInput: {
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        fontSize: 17,
        color: '#1E293B',
        marginBottom: 24,
    },
    colorRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
        marginBottom: 32,
    },
    colorCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    colorSelected: {
        borderWidth: 3,
        borderColor: '#1E293B',
    },
    createActions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
    },
    createBtn: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: '#4ECDC4',
        alignItems: 'center',
    },
    createBtnDisabled: {
        opacity: 0.5,
    },
    createBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});

export default NoteListScreen;
