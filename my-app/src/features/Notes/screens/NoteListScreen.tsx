import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

// Gradient colors for note cards
const NOTE_GRADIENTS = [
    ['#6366F1', '#8B5CF6'], // Indigo-Purple
    ['#3B82F6', '#06B6D4'], // Blue-Cyan
    ['#10B981', '#14B8A6'], // Green-Teal
    ['#F59E0B', '#F97316'], // Amber-Orange
    ['#EC4899', '#F43F5E'], // Pink-Rose
    ['#8B5CF6', '#A855F7'], // Purple
    ['#06B6D4', '#0EA5E9'], // Cyan-Sky
    ['#EF4444', '#F97316'], // Red-Orange
];

const getGradientForNote = (id: number) => {
    return NOTE_GRADIENTS[id % NOTE_GRADIENTS.length];
};

// Tag colors
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

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const cardAnims = useRef<Animated.Value[]>([]).current;

    // Load data on focus
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    // Animate on load
    useEffect(() => {
        if (!loading && notes.length > 0) {
            // Main content animation
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start();

            // Staggered card animations
            notes.forEach((_, index) => {
                if (!cardAnims[index]) {
                    cardAnims[index] = new Animated.Value(0);
                }
                Animated.timing(cardAnims[index], {
                    toValue: 1,
                    duration: 300,
                    delay: index * 50,
                    useNativeDriver: true,
                }).start();
            });
        }
    }, [loading, notes.length]);

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
        slideAnim.setValue(30);
        scaleAnim.setValue(0.95);
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
        Alert.alert(
            'Delete Note',
            `Delete "${noteTitle || 'Untitled'}"?`,
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
        Alert.alert('Delete Tag', 'Remove this tag from all notes?', [
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

        if (mins < 1) return 'Now';
        if (mins < 60) return `${mins}m`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getPreviewText = (content: string) => {
        return content
            .replace(/^#{1,6}\s/gm, '')
            .replace(/^[-*]\s/gm, '')
            .replace(/^>\s/gm, '')
            .replace(/\n+/g, ' ')
            .trim() || 'No content...';
    };

    const pinnedNotes = notes.filter(n => n.isPinned);
    const unpinnedNotes = notes.filter(n => !n.isPinned);

    const renderNoteCard = ({ item, index }: { item: LocalNote; index: number }) => {
        const gradient = getGradientForNote(item.id);
        const anim = cardAnims[index] || new Animated.Value(1);

        return (
            <Animated.View
                style={[
                    styles.cardWrapper,
                    {
                        opacity: anim,
                        transform: [
                            {
                                scale: anim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.9, 1],
                                })
                            },
                            {
                                translateY: anim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [20, 0],
                                })
                            },
                        ],
                    },
                ]}
            >
                <TouchableOpacity
                    style={styles.noteCard}
                    onPress={() => navigation.navigate('NoteEditor', { noteId: item.id })}
                    onLongPress={() => handleDeleteNote(item.id, item.title)}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cardGradient}
                    >
                        {/* Pin indicator */}
                        {item.isPinned && (
                            <View style={styles.pinnedBadge}>
                                <Ionicons name="pin" size={10} color="#fff" />
                            </View>
                        )}

                        {/* Card Header */}
                        <View style={styles.cardHeader}>
                            <View style={styles.cardIcon}>
                                <Ionicons name="document-text" size={18} color="#fff" />
                            </View>
                            <TouchableOpacity
                                style={styles.pinButton}
                                onPress={() => handleTogglePin(item)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons
                                    name={item.isPinned ? "bookmark" : "bookmark-outline"}
                                    size={16}
                                    color="rgba(255,255,255,0.8)"
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Content */}
                        <Text style={styles.noteTitle} numberOfLines={2}>
                            {item.title || 'Untitled'}
                        </Text>
                        <Text style={styles.notePreview} numberOfLines={2}>
                            {getPreviewText(item.content)}
                        </Text>

                        {/* Footer */}
                        <View style={styles.cardFooter}>
                            <Text style={styles.noteDate}>{formatDate(item.updatedAt)}</Text>
                            {item.tags.length > 0 && (
                                <View style={styles.tagBadge}>
                                    <Text style={styles.tagBadgeText}>
                                        {item.tags.length} tag{item.tags.length > 1 ? 's' : ''}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notes</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={() => setShowTagModal(true)}
                        style={styles.headerBtn}
                    >
                        <Ionicons name="pricetags-outline" size={20} color="#666" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={18} color="#999" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search notes..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity
                    style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
                    onPress={() => setShowFilters(!showFilters)}
                >
                    <Ionicons
                        name="options"
                        size={18}
                        color={showFilters ? '#fff' : '#666'}
                    />
                </TouchableOpacity>
            </View>

            {/* Tag Filters */}
            {showFilters && (
                <Animated.View style={styles.filterSection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterTags}
                    >
                        {tags.map(tag => {
                            const isSelected = selectedTagIds.includes(tag.id);
                            return (
                                <TouchableOpacity
                                    key={tag.id}
                                    style={[
                                        styles.filterTag,
                                        isSelected && { backgroundColor: tag.color },
                                    ]}
                                    onPress={() => toggleTagFilter(tag.id)}
                                >
                                    <View style={[styles.tagDot, { backgroundColor: isSelected ? '#fff' : tag.color }]} />
                                    <Text style={[styles.filterTagText, isSelected && { color: '#fff' }]}>
                                        {tag.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </Animated.View>
            )}

            {/* Notes Grid */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <Ionicons name="sync" size={32} color="#6366F1" />
                    <Text style={styles.loadingText}>Loading notes...</Text>
                </View>
            ) : notes.length === 0 ? (
                <View style={styles.emptyState}>
                    <LinearGradient
                        colors={['#6366F1', '#8B5CF6']}
                        style={styles.emptyIcon}
                    >
                        <Ionicons name="document-text-outline" size={36} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.emptyTitle}>
                        {searchQuery || selectedTagIds.length > 0 ? 'No results' : 'Start writing'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {searchQuery || selectedTagIds.length > 0
                            ? 'Try different search terms'
                            : 'Create your first note'}
                    </Text>
                    {!searchQuery && selectedTagIds.length === 0 && (
                        <TouchableOpacity style={styles.emptyBtn} onPress={handleCreateNote}>
                            <Ionicons name="add" size={20} color="#fff" />
                            <Text style={styles.emptyBtnText}>New Note</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <Animated.View
                    style={[
                        styles.scrollContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                        },
                    ]}
                >
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Pinned Section */}
                        {pinnedNotes.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="pin" size={14} color="#6366F1" />
                                    <Text style={styles.sectionTitle}>Pinned</Text>
                                </View>
                                <View style={styles.notesGrid}>
                                    {pinnedNotes.map((note, index) => (
                                        <View key={note.id} style={styles.gridItem}>
                                            {renderNoteCard({ item: note, index })}
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* All Notes */}
                        {unpinnedNotes.length > 0 && (
                            <View style={styles.section}>
                                {pinnedNotes.length > 0 && (
                                    <View style={styles.sectionHeader}>
                                        <Ionicons name="albums-outline" size={14} color="#666" />
                                        <Text style={styles.sectionTitle}>All Notes</Text>
                                    </View>
                                )}
                                <View style={styles.notesGrid}>
                                    {unpinnedNotes.map((note, index) => (
                                        <View key={note.id} style={styles.gridItem}>
                                            {renderNoteCard({ item: note, index: pinnedNotes.length + index })}
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </Animated.View>
            )}

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={handleCreateNote} activeOpacity={0.9}>
                <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    style={styles.fabGradient}
                >
                    <Ionicons name="add" size={28} color="#fff" />
                </LinearGradient>
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
                        <Text style={styles.modalTitle}>Tags</Text>
                        <TouchableOpacity onPress={() => setShowTagModal(false)}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.createTagBtn}
                        onPress={() => setShowCreateTagModal(true)}
                    >
                        <LinearGradient
                            colors={['#6366F1', '#8B5CF6']}
                            style={styles.createTagIcon}
                        >
                            <Ionicons name="add" size={18} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.createTagText}>Create Tag</Text>
                    </TouchableOpacity>

                    <ScrollView style={styles.tagsList}>
                        {tags.map(tag => (
                            <View key={tag.id} style={styles.tagRow}>
                                <View style={styles.tagRowLeft}>
                                    <View style={[styles.tagColor, { backgroundColor: tag.color }]} />
                                    <View>
                                        <Text style={styles.tagName}>{tag.name}</Text>
                                        <Text style={styles.tagCount}>{tag.usageCount} notes</Text>
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
                <View style={styles.createTagOverlay}>
                    <View style={styles.createTagModal}>
                        <Text style={styles.createTagTitle}>New Tag</Text>

                        <TextInput
                            style={styles.createTagInput}
                            placeholder="Tag name"
                            placeholderTextColor="#999"
                            value={newTagName}
                            onChangeText={setNewTagName}
                            autoFocus
                        />

                        <Text style={styles.colorLabel}>Color</Text>
                        <View style={styles.colorGrid}>
                            {TAG_COLORS.map(color => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorOption,
                                        { backgroundColor: color },
                                        newTagColor === color && styles.colorSelected,
                                    ]}
                                    onPress={() => setNewTagColor(color)}
                                >
                                    {newTagColor === color && (
                                        <Ionicons name="checkmark" size={16} color="#fff" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setShowCreateTagModal(false)}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, !newTagName.trim() && styles.confirmDisabled]}
                                onPress={handleCreateTag}
                                disabled={!newTagName.trim()}
                            >
                                <Text style={styles.confirmText}>Create</Text>
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
        backgroundColor: '#F5F5F7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    headerActions: {
        flexDirection: 'row',
    },
    headerBtn: {
        width: 40,
        height: 40,
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
        backgroundColor: '#F5F5F7',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1a1a1a',
        ...(Platform.OS === 'web' && { outlineStyle: 'none' as any }),
    },
    filterBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F5F5F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterBtnActive: {
        backgroundColor: '#6366F1',
    },
    filterSection: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#EBEBEB',
    },
    filterTags: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#E5E5E5',
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
        color: '#333',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 14,
        color: '#666',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 48,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    emptyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6366F1',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
        gap: 8,
    },
    emptyBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        paddingLeft: 4,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    notesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
    gridItem: {
        width: isWeb ? '33.33%' : '50%',
        padding: 6,
    },
    cardWrapper: {
        flex: 1,
    },
    noteCard: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    cardGradient: {
        padding: 20,
        minHeight: 180,
    },
    pinnedBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pinButton: {
        padding: 6,
    },
    noteTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
        lineHeight: 24,
    },
    notePreview: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 20,
        marginBottom: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
    },
    noteDate: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '500',
    },
    tagBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    tagBadgeText: {
        fontSize: 11,
        color: '#fff',
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        bottom: 28,
        right: 24,
        borderRadius: 32,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 10,
    },
    fabGradient: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EBEBEB',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    createTagBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        margin: 16,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E5E5E5',
        borderStyle: 'dashed',
    },
    createTagIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createTagText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6366F1',
    },
    tagsList: {
        flex: 1,
        paddingHorizontal: 16,
    },
    tagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderRadius: 14,
        marginBottom: 8,
    },
    tagRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    tagColor: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    tagName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    tagCount: {
        fontSize: 13,
        color: '#999',
        marginTop: 2,
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
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 360,
    },
    createTagTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 24,
        textAlign: 'center',
    },
    createTagInput: {
        borderWidth: 2,
        borderColor: '#E5E5E5',
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingVertical: 16,
        fontSize: 17,
        color: '#1a1a1a',
        marginBottom: 24,
    },
    colorLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#999',
        marginBottom: 14,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 28,
        justifyContent: 'center',
    },
    colorOption: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    colorSelected: {
        borderWidth: 3,
        borderColor: '#1a1a1a',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: '#F5F5F7',
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: '#6366F1',
        alignItems: 'center',
    },
    confirmDisabled: {
        opacity: 0.5,
    },
    confirmText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});

export default NoteListScreen;
