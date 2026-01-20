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
    LocalNote,
    LocalTag,
} from '../services/localNotesStorage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface NoteListScreenProps {
    navigation: any;
}

// Tag colors for custom tags
const TAG_COLORS = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
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

    // Load data on focus
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

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
            title: 'Untitled Note',
            content: '',
        });
        navigation.navigate('NoteEditor', { noteId: newNote.id });
    };

    const handleDeleteNote = (noteId: number) => {
        Alert.alert(
            'Delete Note',
            'Are you sure you want to delete this note?',
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
            'This will remove the tag from all notes. Continue?',
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

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const renderNoteCard = ({ item }: { item: LocalNote }) => (
        <TouchableOpacity
            style={styles.noteCard}
            onPress={() => navigation.navigate('NoteEditor', { noteId: item.id })}
            onLongPress={() => handleDeleteNote(item.id)}
            activeOpacity={0.7}
        >
            <View style={styles.noteCardHeader}>
                {item.isPinned && (
                    <Ionicons name="pin" size={14} color="#6B7280" style={styles.pinIcon} />
                )}
                <Text style={styles.noteTitle} numberOfLines={1}>
                    {item.title || 'Untitled'}
                </Text>
            </View>

            <Text style={styles.notePreview} numberOfLines={2}>
                {item.content || 'No content'}
            </Text>

            <View style={styles.noteFooter}>
                <Text style={styles.noteDate}>{formatDate(item.updatedAt)}</Text>
                {item.tags.length > 0 && (
                    <View style={styles.noteTags}>
                        {item.tags.slice(0, 2).map(tag => (
                            <View
                                key={tag.id}
                                style={[styles.noteTagChip, { backgroundColor: tag.color + '20' }]}
                            >
                                <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                                <Text style={[styles.noteTagText, { color: tag.color }]}>
                                    {tag.name}
                                </Text>
                            </View>
                        ))}
                        {item.tags.length > 2 && (
                            <Text style={styles.moreTagsText}>+{item.tags.length - 2}</Text>
                        )}
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    const renderTagChip = (tag: LocalTag, isFilter: boolean = false) => {
        const isSelected = selectedTagIds.includes(tag.id);
        return (
            <TouchableOpacity
                key={tag.id}
                style={[
                    styles.tagChip,
                    isSelected && { backgroundColor: tag.color, borderColor: tag.color },
                ]}
                onPress={() => isFilter ? toggleTagFilter(tag.id) : null}
                onLongPress={() => tag.category === 'custom' && handleDeleteTag(tag.id)}
            >
                <View style={[styles.tagDot, { backgroundColor: isSelected ? '#fff' : tag.color }]} />
                <Text style={[styles.tagChipText, isSelected && { color: '#fff' }]}>
                    {tag.name}
                </Text>
                {isSelected && (
                    <Ionicons name="close" size={14} color="#fff" style={{ marginLeft: 4 }} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notes</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={() => setShowTagModal(true)}
                        style={styles.headerIconButton}
                    >
                        <Ionicons name="pricetag-outline" size={22} color="#374151" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleCreateNote} style={styles.addButton}>
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={18} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search notes..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity
                    style={[styles.filterButton, showFilters && styles.filterButtonActive]}
                    onPress={() => setShowFilters(!showFilters)}
                >
                    <Ionicons
                        name="options-outline"
                        size={20}
                        color={showFilters ? '#fff' : '#374151'}
                    />
                </TouchableOpacity>
            </View>

            {/* Tag Filters */}
            {showFilters && (
                <View style={styles.filterSection}>
                    <View style={styles.filterHeader}>
                        <Text style={styles.filterTitle}>Filter by Tags</Text>
                        {selectedTagIds.length > 0 && (
                            <TouchableOpacity onPress={clearFilters}>
                                <Text style={styles.clearFiltersText}>Clear All</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tagsScrollContent}
                    >
                        {tags.map(tag => renderTagChip(tag, true))}
                    </ScrollView>
                </View>
            )}

            {/* Notes List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            ) : notes.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                        <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
                    </View>
                    <Text style={styles.emptyTitle}>
                        {searchQuery || selectedTagIds.length > 0
                            ? 'No matching notes'
                            : 'No notes yet'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {searchQuery || selectedTagIds.length > 0
                            ? 'Try adjusting your filters'
                            : 'Create your first note to get started'}
                    </Text>
                    {!searchQuery && selectedTagIds.length === 0 && (
                        <TouchableOpacity style={styles.emptyButton} onPress={handleCreateNote}>
                            <Text style={styles.emptyButtonText}>Create Note</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <FlatList
                    data={notes}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderNoteCard}
                    contentContainerStyle={styles.notesList}
                    showsVerticalScrollIndicator={false}
                    numColumns={isWeb ? 3 : 1}
                    key={isWeb ? 'web' : 'mobile'}
                />
            )}

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
                        <TouchableOpacity onPress={() => setShowTagModal(false)}>
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.createTagButton}
                        onPress={() => setShowCreateTagModal(true)}
                    >
                        <Ionicons name="add-circle-outline" size={22} color="#3B82F6" />
                        <Text style={styles.createTagButtonText}>Create New Tag</Text>
                    </TouchableOpacity>

                    <ScrollView style={styles.tagsList}>
                        <Text style={styles.tagSectionTitle}>Your Tags</Text>
                        {tags.filter(t => t.category === 'custom').map(tag => (
                            <View key={tag.id} style={styles.tagListItem}>
                                <View style={styles.tagListItemLeft}>
                                    <View style={[styles.tagColorSquare, { backgroundColor: tag.color }]} />
                                    <Text style={styles.tagListItemText}>{tag.name}</Text>
                                </View>
                                <View style={styles.tagListItemRight}>
                                    <Text style={styles.tagUsageCount}>{tag.usageCount} notes</Text>
                                    <TouchableOpacity onPress={() => handleDeleteTag(tag.id)}>
                                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}

                        <Text style={[styles.tagSectionTitle, { marginTop: 24 }]}>Default Tags</Text>
                        {tags.filter(t => t.category !== 'custom').map(tag => (
                            <View key={tag.id} style={styles.tagListItem}>
                                <View style={styles.tagListItemLeft}>
                                    <View style={[styles.tagColorSquare, { backgroundColor: tag.color }]} />
                                    <Text style={styles.tagListItemText}>{tag.name}</Text>
                                </View>
                                <Text style={styles.tagUsageCount}>{tag.usageCount} notes</Text>
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
                        <Text style={styles.createTagTitle}>Create Tag</Text>

                        <TextInput
                            style={styles.createTagInput}
                            placeholder="Tag name"
                            placeholderTextColor="#9CA3AF"
                            value={newTagName}
                            onChangeText={setNewTagName}
                            autoFocus
                        />

                        <Text style={styles.colorPickerLabel}>Select Color</Text>
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
                                style={[styles.confirmButton, !newTagName.trim() && { opacity: 0.5 }]}
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
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerIconButton: {
        padding: 8,
    },
    addButton: {
        backgroundColor: '#3B82F6',
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchSection: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        gap: 10,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
        ...(Platform.OS === 'web' && { outlineStyle: 'none' as any }),
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterButtonActive: {
        backgroundColor: '#3B82F6',
    },
    filterSection: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    filterTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    clearFiltersText: {
        fontSize: 13,
        color: '#3B82F6',
        fontWeight: '500',
    },
    tagsScrollContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    tagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
        marginRight: 8,
    },
    tagDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    tagChipText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#374151',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    emptyButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
    },
    emptyButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    notesList: {
        padding: 16,
        ...(isWeb && {
            maxWidth: 1200,
            alignSelf: 'center',
            width: '100%',
        }),
    },
    noteCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        ...(isWeb && {
            flex: 1,
            margin: 6,
            maxWidth: '31%',
        }),
    },
    noteCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    pinIcon: {
        marginRight: 6,
    },
    noteTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        flex: 1,
    },
    notePreview: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 12,
    },
    noteFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    noteDate: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    noteTags: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    noteTagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    noteTagText: {
        fontSize: 11,
        fontWeight: '500',
    },
    moreTagsText: {
        fontSize: 11,
        color: '#9CA3AF',
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
    createTagButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        margin: 16,
        padding: 14,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    createTagButtonText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#3B82F6',
    },
    tagsList: {
        flex: 1,
        paddingHorizontal: 16,
    },
    tagSectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    tagListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 8,
    },
    tagListItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    tagColorSquare: {
        width: 16,
        height: 16,
        borderRadius: 4,
    },
    tagListItemText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#111827',
    },
    tagListItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    tagUsageCount: {
        fontSize: 13,
        color: '#9CA3AF',
    },
    createTagOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    createTagModal: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 360,
    },
    createTagTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 20,
    },
    createTagInput: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#111827',
        marginBottom: 20,
    },
    colorPickerLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 12,
    },
    colorPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 24,
    },
    colorOption: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    colorOptionSelected: {
        borderWidth: 3,
        borderColor: '#111827',
    },
    createTagActions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
});

export default NoteListScreen;
