import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    FlatList,
    TextInput,
    Dimensions,
    Platform,
    Modal,
    ScrollView,
    Alert,
    ActivityIndicator,
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

// Premium color palette
const COLORS = {
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceHover: '#F5F5F5',
    border: '#EBEBEB',
    borderLight: '#F5F5F5',
    text: '#1A1A1A',
    textSecondary: '#717171',
    textTertiary: '#A3A3A3',
    primary: '#2563EB',
    primaryLight: '#EFF6FF',
    accent: '#0EA5E9',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
};

// Tag colors for custom tags
const TAG_COLORS = [
    '#2563EB', '#7C3AED', '#EC4899', '#EF4444', '#F97316',
    '#EAB308', '#22C55E', '#14B8A6', '#06B6D4', '#6366F1',
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
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    // Animation values
    const fadeAnim = useState(new Animated.Value(0))[0];

    // Load data on focus
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    // Animate on load
    useEffect(() => {
        if (!loading) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [loading]);

    // Filter notes when search or tags change
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
        const newNote = await createNote({
            title: '',
            content: '',
        });
        navigation.navigate('NoteEditor', { noteId: newNote.id, isNew: true });
    };

    const handleDeleteNote = (noteId: number, noteTitle: string) => {
        Alert.alert(
            'Delete Note',
            `Are you sure you want to delete "${noteTitle || 'Untitled'}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteNote(noteId);
                        loadNotes();
                    },
                },
            ]
        );
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
        Alert.alert(
            'Delete Tag',
            'This will remove the tag from all notes.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteTag(tagId);
                        setSelectedTagIds(ids => ids.filter(id => id !== tagId));
                        loadTags();
                    },
                },
            ]
        );
    };

    const toggleTagFilter = (tagId: number) => {
        setSelectedTagIds(ids =>
            ids.includes(tagId)
                ? ids.filter(id => id !== tagId)
                : [...ids, tagId]
        );
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedTagIds([]);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor(diff / (1000 * 60));

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getPreviewText = (content: string) => {
        const cleaned = content
            .replace(/^#{1,6}\s/gm, '')
            .replace(/^[-*]\s/gm, '')
            .replace(/^>\s/gm, '')
            .replace(/\n+/g, ' ')
            .trim();
        return cleaned || 'No content yet...';
    };

    const pinnedNotes = notes.filter(n => n.isPinned);
    const unpinnedNotes = notes.filter(n => !n.isPinned);

    const renderNoteCard = ({ item, isPinned = false }: { item: LocalNote; isPinned?: boolean }) => (
        <TouchableOpacity
            style={[
                styles.noteCard,
                isPinned && styles.noteCardPinned,
                viewMode === 'grid' && styles.noteCardGrid,
            ]}
            onPress={() => navigation.navigate('NoteEditor', { noteId: item.id })}
            onLongPress={() => handleDeleteNote(item.id, item.title)}
            activeOpacity={0.7}
        >
            {/* Header Row */}
            <View style={styles.noteCardHeader}>
                <View style={styles.noteCardMeta}>
                    <Text style={styles.noteDate}>{formatDate(item.updatedAt)}</Text>
                    {item.isPinned && (
                        <View style={styles.pinnedIndicator}>
                            <Ionicons name="pin" size={10} color={COLORS.primary} />
                        </View>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.moreButton}
                    onPress={() => handleTogglePin(item)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name={item.isPinned ? "pin" : "pin-outline"}
                        size={16}
                        color={item.isPinned ? COLORS.primary : COLORS.textTertiary}
                    />
                </TouchableOpacity>
            </View>

            {/* Title */}
            <Text style={styles.noteTitle} numberOfLines={1}>
                {item.title || 'Untitled'}
            </Text>

            {/* Preview */}
            <Text style={styles.notePreview} numberOfLines={2}>
                {getPreviewText(item.content)}
            </Text>

            {/* Tags */}
            {item.tags.length > 0 && (
                <View style={styles.noteTags}>
                    {item.tags.slice(0, 3).map(tag => (
                        <View
                            key={tag.id}
                            style={[styles.noteTagChip, { backgroundColor: tag.color + '15' }]}
                        >
                            <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                            <Text style={[styles.noteTagText, { color: tag.color }]}>
                                {tag.name}
                            </Text>
                        </View>
                    ))}
                    {item.tags.length > 3 && (
                        <Text style={styles.moreTagsText}>+{item.tags.length - 3}</Text>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );

    const renderTagChip = (tag: LocalTag) => {
        const isSelected = selectedTagIds.includes(tag.id);
        return (
            <TouchableOpacity
                key={tag.id}
                style={[
                    styles.filterTagChip,
                    isSelected && { backgroundColor: tag.color, borderColor: tag.color },
                ]}
                onPress={() => toggleTagFilter(tag.id)}
            >
                <View style={[styles.tagDot, { backgroundColor: isSelected ? '#fff' : tag.color }]} />
                <Text style={[styles.filterTagText, isSelected && { color: '#fff' }]}>
                    {tag.name}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notes</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={() => setShowTagModal(true)}
                        style={styles.headerIconButton}
                    >
                        <Ionicons name="pricetags-outline" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                        style={styles.headerIconButton}
                    >
                        <Ionicons
                            name={viewMode === 'list' ? 'grid-outline' : 'list-outline'}
                            size={20}
                            color={COLORS.textSecondary}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={18} color={COLORS.textTertiary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search notes..."
                        placeholderTextColor={COLORS.textTertiary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity
                    style={[styles.filterButton, showFilters && styles.filterButtonActive]}
                    onPress={() => setShowFilters(!showFilters)}
                >
                    <Ionicons
                        name="filter"
                        size={18}
                        color={showFilters ? '#fff' : COLORS.textSecondary}
                    />
                    {selectedTagIds.length > 0 && !showFilters && (
                        <View style={styles.filterBadge}>
                            <Text style={styles.filterBadgeText}>{selectedTagIds.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Tag Filters */}
            {showFilters && (
                <View style={styles.filterSection}>
                    <View style={styles.filterHeader}>
                        <Text style={styles.filterTitle}>Filter by tags</Text>
                        {selectedTagIds.length > 0 && (
                            <TouchableOpacity onPress={clearFilters}>
                                <Text style={styles.clearFiltersText}>Clear all</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterTagsScroll}
                    >
                        {tags.map(tag => renderTagChip(tag))}
                    </ScrollView>
                </View>
            )}

            {/* Notes List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading notes...</Text>
                </View>
            ) : notes.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconWrapper}>
                        <Ionicons name="document-text-outline" size={40} color={COLORS.textTertiary} />
                    </View>
                    <Text style={styles.emptyTitle}>
                        {searchQuery || selectedTagIds.length > 0 ? 'No results found' : 'No notes yet'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {searchQuery || selectedTagIds.length > 0
                            ? 'Try adjusting your search or filters'
                            : 'Create your first note to start organizing your study material'}
                    </Text>
                    {!searchQuery && selectedTagIds.length === 0 && (
                        <TouchableOpacity style={styles.emptyButton} onPress={handleCreateNote}>
                            <Ionicons name="add" size={20} color="#fff" />
                            <Text style={styles.emptyButtonText}>New Note</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Pinned Section */}
                        {pinnedNotes.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Pinned</Text>
                                <View style={[styles.notesContainer, viewMode === 'grid' && styles.notesGrid]}>
                                    {pinnedNotes.map(note => (
                                        <View key={note.id} style={viewMode === 'grid' && styles.gridItem}>
                                            {renderNoteCard({ item: note, isPinned: true })}
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* All Notes Section */}
                        {unpinnedNotes.length > 0 && (
                            <View style={styles.section}>
                                {pinnedNotes.length > 0 && (
                                    <Text style={styles.sectionTitle}>All Notes</Text>
                                )}
                                <View style={[styles.notesContainer, viewMode === 'grid' && styles.notesGrid]}>
                                    {unpinnedNotes.map(note => (
                                        <View key={note.id} style={viewMode === 'grid' && styles.gridItem}>
                                            {renderNoteCard({ item: note })}
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </Animated.View>
            )}

            {/* Floating Action Button */}
            <TouchableOpacity style={styles.fab} onPress={handleCreateNote} activeOpacity={0.85}>
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>

            {/* Tag Management Modal */}
            <Modal
                visible={showTagModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowTagModal(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Manage Tags</Text>
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setShowTagModal(false)}
                        >
                            <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.createTagButton}
                        onPress={() => setShowCreateTagModal(true)}
                    >
                        <View style={styles.createTagIcon}>
                            <Ionicons name="add" size={20} color={COLORS.primary} />
                        </View>
                        <Text style={styles.createTagButtonText}>Create new tag</Text>
                    </TouchableOpacity>

                    <ScrollView style={styles.tagsList}>
                        {/* Custom Tags */}
                        {tags.filter(t => t.category === 'custom').length > 0 && (
                            <>
                                <Text style={styles.tagSectionTitle}>Your Tags</Text>
                                {tags.filter(t => t.category === 'custom').map(tag => (
                                    <View key={tag.id} style={styles.tagListItem}>
                                        <View style={styles.tagListItemLeft}>
                                            <View style={[styles.tagColorCircle, { backgroundColor: tag.color }]} />
                                            <View>
                                                <Text style={styles.tagListItemText}>{tag.name}</Text>
                                                <Text style={styles.tagUsageText}>{tag.usageCount} notes</Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.deleteTagButton}
                                            onPress={() => handleDeleteTag(tag.id)}
                                        >
                                            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </>
                        )}

                        {/* Default Tags */}
                        <Text style={[styles.tagSectionTitle, { marginTop: 24 }]}>Default Tags</Text>
                        {tags.filter(t => t.category !== 'custom').map(tag => (
                            <View key={tag.id} style={styles.tagListItem}>
                                <View style={styles.tagListItemLeft}>
                                    <View style={[styles.tagColorCircle, { backgroundColor: tag.color }]} />
                                    <View>
                                        <Text style={styles.tagListItemText}>{tag.name}</Text>
                                        <Text style={styles.tagUsageText}>{tag.usageCount} notes</Text>
                                    </View>
                                </View>
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
                <View style={styles.createTagOverlay}>
                    <View style={styles.createTagModal}>
                        <Text style={styles.createTagTitle}>New Tag</Text>

                        <TextInput
                            style={styles.createTagInput}
                            placeholder="Tag name"
                            placeholderTextColor={COLORS.textTertiary}
                            value={newTagName}
                            onChangeText={setNewTagName}
                            autoFocus
                        />

                        <Text style={styles.colorPickerLabel}>Color</Text>
                        <View style={styles.colorPicker}>
                            {TAG_COLORS.map(color => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorOption,
                                        { backgroundColor: color },
                                        newTagColor === color && styles.colorOptionSelected,
                                    ]}
                                    onPress={() => setNewTagColor(color)}
                                >
                                    {newTagColor === color && (
                                        <Ionicons name="checkmark" size={16} color="#fff" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.createTagActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowCreateTagModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, !newTagName.trim() && styles.confirmButtonDisabled]}
                                onPress={handleCreateTag}
                                disabled={!newTagName.trim()}
                            >
                                <Text style={styles.confirmButtonText}>Create</Text>
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
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.text,
        letterSpacing: -0.3,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    headerIconButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchSection: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.surface,
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: COLORS.text,
        ...(Platform.OS === 'web' && { outlineStyle: 'none' as any }),
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterButtonActive: {
        backgroundColor: COLORS.primary,
    },
    filterBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    filterSection: {
        backgroundColor: COLORS.surface,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    filterTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    clearFiltersText: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: '500',
    },
    filterTagsScroll: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterTagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
        marginRight: 8,
        gap: 8,
    },
    tagDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    filterTagText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 48,
    },
    emptyIconWrapper: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    emptyButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
        paddingLeft: 4,
    },
    notesContainer: {
        gap: 10,
    },
    notesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    gridItem: {
        width: isWeb ? '32%' : '48%',
    },
    noteCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    noteCardPinned: {
        borderColor: COLORS.primary + '30',
        backgroundColor: COLORS.primaryLight,
    },
    noteCardGrid: {
        minHeight: 160,
    },
    noteCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    noteCardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    noteDate: {
        fontSize: 12,
        color: COLORS.textTertiary,
        fontWeight: '500',
    },
    pinnedIndicator: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: COLORS.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    moreButton: {
        padding: 4,
    },
    noteTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    notePreview: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
        marginBottom: 12,
    },
    noteTags: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
    },
    noteTagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        gap: 5,
    },
    noteTagText: {
        fontSize: 12,
        fontWeight: '500',
    },
    moreTagsText: {
        fontSize: 12,
        color: COLORS.textTertiary,
        fontWeight: '500',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    modalCloseButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createTagButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        margin: 16,
        padding: 16,
        backgroundColor: COLORS.surface,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
    },
    createTagIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createTagButtonText: {
        fontSize: 15,
        fontWeight: '500',
        color: COLORS.primary,
    },
    tagsList: {
        flex: 1,
        paddingHorizontal: 16,
    },
    tagSectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    tagListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        marginBottom: 8,
    },
    tagListItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    tagColorCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    tagListItemText: {
        fontSize: 15,
        fontWeight: '500',
        color: COLORS.text,
    },
    tagUsageText: {
        fontSize: 12,
        color: COLORS.textTertiary,
        marginTop: 2,
    },
    deleteTagButton: {
        padding: 8,
    },
    createTagOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    createTagModal: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 340,
    },
    createTagTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 24,
        textAlign: 'center',
    },
    createTagInput: {
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: COLORS.text,
        marginBottom: 24,
    },
    colorPickerLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textTertiary,
        marginBottom: 14,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    colorPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 28,
        justifyContent: 'center',
    },
    colorOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    colorOptionSelected: {
        borderWidth: 3,
        borderColor: COLORS.text,
    },
    createTagActions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: COLORS.background,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: COLORS.primary + '50',
    },
    confirmButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
});

export default NoteListScreen;
