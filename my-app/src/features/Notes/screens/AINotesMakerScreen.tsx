import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Modal,
    Platform,
    ActivityIndicator,
    Alert,
    Share,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
    getAllTags,
    getAllNotes,
    LocalTag,
    LocalNote,
} from '../services/localNotesStorage';
import {
    generateAISummary,
    getAllSummaries,
    deleteSummary,
    exportSummaryAsText,
    getTagBasedAlerts,
    AISummary,
    SummaryRequest,
} from '../services/aiNotesService';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Source type labels
const SOURCE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
    manual: { label: 'Your Notes', color: '#3B82F6', icon: 'document-text' },
    current_affairs: { label: 'Current Affairs', color: '#10B981', icon: 'newspaper' },
    scraped: { label: 'Saved Articles', color: '#8B5CF6', icon: 'globe' },
    ncert: { label: 'NCERT', color: '#F59E0B', icon: 'book' },
    book: { label: 'Books', color: '#EC4899', icon: 'library' },
};

export const AINotesMakerScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [tags, setTags] = useState<LocalTag[]>([]);
    const [notes, setNotes] = useState<LocalNote[]>([]);
    const [summaries, setSummaries] = useState<AISummary[]>([]);
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
    const [alerts, setAlerts] = useState<{ tag: LocalTag; newArticles: LocalNote[] }[]>([]);

    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [generatingStatus, setGeneratingStatus] = useState('');
    const [showTagPicker, setShowTagPicker] = useState(false);
    const [showSummaryDetail, setShowSummaryDetail] = useState<AISummary | null>(null);
    const [customPrompt, setCustomPrompt] = useState('');
    const [includeCurrentAffairs, setIncludeCurrentAffairs] = useState(true);
    const [includeSavedArticles, setIncludeSavedArticles] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        setLoading(true);
        try {
            const [allTags, allNotes, allSummaries, tagAlerts] = await Promise.all([
                getAllTags(),
                getAllNotes(),
                getAllSummaries(),
                getTagBasedAlerts(),
            ]);
            setTags(allTags);
            setNotes(allNotes);
            setSummaries(allSummaries);
            setAlerts(tagAlerts);
        } catch (error) {
            console.error('[AINotesMaker] Load error:', error);
        }
        setLoading(false);
    };

    const toggleTag = (tagId: number) => {
        setSelectedTagIds(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

    const handleGenerateSummary = async () => {
        if (selectedTagIds.length === 0) {
            Alert.alert('Select Tags', 'Please select at least one tag to generate a summary.');
            return;
        }

        setGenerating(true);
        setGeneratingStatus('Starting...');

        try {
            const request: SummaryRequest = {
                tagIds: selectedTagIds,
                includeCurrentAffairs,
                includeSavedArticles,
                customPrompt: customPrompt.trim() || undefined,
            };

            const summary = await generateAISummary(request, setGeneratingStatus);

            if (summary) {
                setShowSummaryDetail(summary);
                setSummaries(prev => [summary, ...prev]);
                setSelectedTagIds([]);
                setCustomPrompt('');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to generate summary. Please try again.');
        }

        setGenerating(false);
        setGeneratingStatus('');
    };

    const handleDeleteSummary = async (id: number) => {
        Alert.alert('Delete Summary', 'Are you sure you want to delete this summary?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await deleteSummary(id);
                    setSummaries(prev => prev.filter(s => s.id !== id));
                    setShowSummaryDetail(null);
                },
            },
        ]);
    };

    const handleExport = async (summary: AISummary) => {
        const textContent = exportSummaryAsText(summary);
        const fileName = `UPSC_Notes_${summary.title.replace(/[^a-z0-9]/gi, '_')}.txt`;

        if (Platform.OS === 'web') {
            // Web download
            const blob = new Blob([textContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
        } else {
            // Mobile share - use Share API
            try {
                await Share.share({ message: textContent, title: summary.title });
            } catch (error) {
                console.error('Share error:', error);
            }
        }
    };

    const getNotesCountByTag = (tagId: number) => {
        return notes.filter(n => n.tags.some(t => t.id === tagId)).length;
    };

    const selectedTags = tags.filter(t => selectedTagIds.includes(t.id));

    // Group tags by category
    const customTags = tags.filter(t => t.category === 'custom');
    const subjectTags = tags.filter(t => t.category === 'subject');
    const topicTags = tags.filter(t => t.category === 'topic');
    const sourceTags = tags.filter(t => t.category === 'source');

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.pageTitle}>AI Notes Maker</Text>
                    <Text style={styles.pageSubtitle}>Summarize notes by topic tags</Text>
                </View>
                <TouchableOpacity onPress={loadData} style={styles.refreshBtn}>
                    <Ionicons name="refresh" size={20} color="#64748B" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            ) : (
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Alerts Section */}
                    {alerts.length > 0 && (
                        <View style={styles.alertsSection}>
                            <View style={styles.alertsHeader}>
                                <Ionicons name="notifications" size={20} color="#F59E0B" />
                                <Text style={styles.alertsTitle}>New Updates for Your Topics</Text>
                            </View>
                            {alerts.slice(0, 3).map((alert, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={styles.alertCard}
                                    onPress={() => {
                                        setSelectedTagIds([alert.tag.id]);
                                        setShowTagPicker(false);
                                    }}
                                >
                                    <View style={[styles.alertDot, { backgroundColor: alert.tag.color }]} />
                                    <View style={styles.alertContent}>
                                        <Text style={styles.alertTagName}>#{alert.tag.name}</Text>
                                        <Text style={styles.alertCount}>
                                            {alert.newArticles.length} new article{alert.newArticles.length > 1 ? 's' : ''}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Create Summary Section */}
                    <View style={styles.createSection}>
                        <Text style={styles.sectionTitle}>Create AI Summary</Text>
                        <Text style={styles.sectionSubtitle}>
                            Select tags to combine notes from all sources
                        </Text>

                        {/* Selected Tags */}
                        <View style={styles.selectedTagsContainer}>
                            {selectedTags.length === 0 ? (
                                <TouchableOpacity
                                    style={styles.addTagPrompt}
                                    onPress={() => setShowTagPicker(true)}
                                >
                                    <Ionicons name="add-circle-outline" size={24} color="#94A3B8" />
                                    <Text style={styles.addTagPromptText}>
                                        Tap to select topic tags
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.selectedTagsRow}>
                                    {selectedTags.map(tag => (
                                        <TouchableOpacity
                                            key={tag.id}
                                            style={[styles.selectedTag, { backgroundColor: tag.color + '20', borderColor: tag.color }]}
                                            onPress={() => toggleTag(tag.id)}
                                        >
                                            <Text style={[styles.selectedTagText, { color: tag.color }]}>
                                                #{tag.name}
                                            </Text>
                                            <Ionicons name="close" size={14} color={tag.color} />
                                        </TouchableOpacity>
                                    ))}
                                    <TouchableOpacity
                                        style={styles.addMoreBtn}
                                        onPress={() => setShowTagPicker(true)}
                                    >
                                        <Ionicons name="add" size={18} color="#3B82F6" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Source Options */}
                        <View style={styles.sourceOptions}>
                            <TouchableOpacity
                                style={[styles.sourceOption, includeCurrentAffairs && styles.sourceOptionActive]}
                                onPress={() => setIncludeCurrentAffairs(!includeCurrentAffairs)}
                            >
                                <Ionicons
                                    name={includeCurrentAffairs ? 'checkbox' : 'square-outline'}
                                    size={20}
                                    color={includeCurrentAffairs ? '#10B981' : '#94A3B8'}
                                />
                                <Text style={styles.sourceOptionText}>Current Affairs</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.sourceOption, includeSavedArticles && styles.sourceOptionActive]}
                                onPress={() => setIncludeSavedArticles(!includeSavedArticles)}
                            >
                                <Ionicons
                                    name={includeSavedArticles ? 'checkbox' : 'square-outline'}
                                    size={20}
                                    color={includeSavedArticles ? '#8B5CF6' : '#94A3B8'}
                                />
                                <Text style={styles.sourceOptionText}>Saved Articles</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Custom Prompt */}
                        <TextInput
                            style={styles.customPromptInput}
                            placeholder="Optional: Add specific focus (e.g., 'Focus on Mughal architecture')"
                            placeholderTextColor="#94A3B8"
                            value={customPrompt}
                            onChangeText={setCustomPrompt}
                            multiline
                        />

                        {/* Generate Button */}
                        <TouchableOpacity
                            style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
                            onPress={handleGenerateSummary}
                            disabled={generating || selectedTagIds.length === 0}
                        >
                            {generating ? (
                                <>
                                    <ActivityIndicator size="small" color="#FFF" />
                                    <Text style={styles.generateBtnText}>{generatingStatus}</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="sparkles" size={20} color="#FFF" />
                                    <Text style={styles.generateBtnText}>Generate AI Summary</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Previous Summaries */}
                    {summaries.length > 0 && (
                        <View style={styles.summariesSection}>
                            <Text style={styles.sectionTitle}>Previous Summaries</Text>
                            {summaries.map(summary => (
                                <TouchableOpacity
                                    key={summary.id}
                                    style={styles.summaryCard}
                                    onPress={() => setShowSummaryDetail(summary)}
                                >
                                    <View style={styles.summaryHeader}>
                                        <Text style={styles.summaryTitle} numberOfLines={1}>
                                            {summary.title}
                                        </Text>
                                        <Text style={styles.summaryDate}>
                                            {new Date(summary.createdAt).toLocaleDateString('en-IN', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </Text>
                                    </View>
                                    <View style={styles.summaryTags}>
                                        {summary.tags.slice(0, 3).map(tag => (
                                            <View
                                                key={tag.id}
                                                style={[styles.miniTag, { backgroundColor: tag.color + '20' }]}
                                            >
                                                <Text style={[styles.miniTagText, { color: tag.color }]}>
                                                    #{tag.name}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                    <View style={styles.summaryMeta}>
                                        <Text style={styles.summaryMetaText}>
                                            {summary.sources.length} sources • {summary.wordCount} words
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Stats */}
                    <View style={styles.statsSection}>
                        <View style={styles.statCard}>
                            <Ionicons name="document-text" size={24} color="#3B82F6" />
                            <Text style={styles.statNumber}>{notes.length}</Text>
                            <Text style={styles.statLabel}>Total Notes</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="pricetags" size={24} color="#10B981" />
                            <Text style={styles.statNumber}>{tags.length}</Text>
                            <Text style={styles.statLabel}>Tags</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="sparkles" size={24} color="#8B5CF6" />
                            <Text style={styles.statNumber}>{summaries.length}</Text>
                            <Text style={styles.statLabel}>Summaries</Text>
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>
            )}

            {/* Tag Picker Modal */}
            <Modal
                visible={showTagPicker}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowTagPicker(false)}
            >
                <SafeAreaView style={styles.modalSafe}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Topic Tags</Text>
                        <TouchableOpacity onPress={() => setShowTagPicker(false)}>
                            <Text style={styles.modalDone}>Done</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.tagPickerScroll}>
                        {/* Custom Tags */}
                        {customTags.length > 0 && (
                            <View style={styles.tagCategory}>
                                <Text style={styles.tagCategoryTitle}>Your Tags</Text>
                                <View style={styles.tagGrid}>
                                    {customTags.map(tag => (
                                        <TouchableOpacity
                                            key={tag.id}
                                            style={[
                                                styles.tagPickerItem,
                                                selectedTagIds.includes(tag.id) && { backgroundColor: tag.color, borderColor: tag.color },
                                            ]}
                                            onPress={() => toggleTag(tag.id)}
                                        >
                                            <Text
                                                style={[
                                                    styles.tagPickerText,
                                                    selectedTagIds.includes(tag.id) && { color: '#FFF' },
                                                ]}
                                            >
                                                #{tag.name}
                                            </Text>
                                            <Text style={[styles.tagCount, selectedTagIds.includes(tag.id) && { color: 'rgba(255,255,255,0.7)' }]}>
                                                {getNotesCountByTag(tag.id)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Subject Tags */}
                        {subjectTags.length > 0 && (
                            <View style={styles.tagCategory}>
                                <Text style={styles.tagCategoryTitle}>Subjects</Text>
                                <View style={styles.tagGrid}>
                                    {subjectTags.map(tag => (
                                        <TouchableOpacity
                                            key={tag.id}
                                            style={[
                                                styles.tagPickerItem,
                                                selectedTagIds.includes(tag.id) && { backgroundColor: tag.color, borderColor: tag.color },
                                            ]}
                                            onPress={() => toggleTag(tag.id)}
                                        >
                                            <Text
                                                style={[
                                                    styles.tagPickerText,
                                                    selectedTagIds.includes(tag.id) && { color: '#FFF' },
                                                ]}
                                            >
                                                #{tag.name}
                                            </Text>
                                            <Text style={[styles.tagCount, selectedTagIds.includes(tag.id) && { color: 'rgba(255,255,255,0.7)' }]}>
                                                {getNotesCountByTag(tag.id)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Topic Tags */}
                        {topicTags.length > 0 && (
                            <View style={styles.tagCategory}>
                                <Text style={styles.tagCategoryTitle}>Topics</Text>
                                <View style={styles.tagGrid}>
                                    {topicTags.map(tag => (
                                        <TouchableOpacity
                                            key={tag.id}
                                            style={[
                                                styles.tagPickerItem,
                                                selectedTagIds.includes(tag.id) && { backgroundColor: tag.color, borderColor: tag.color },
                                            ]}
                                            onPress={() => toggleTag(tag.id)}
                                        >
                                            <Text
                                                style={[
                                                    styles.tagPickerText,
                                                    selectedTagIds.includes(tag.id) && { color: '#FFF' },
                                                ]}
                                            >
                                                #{tag.name}
                                            </Text>
                                            <Text style={[styles.tagCount, selectedTagIds.includes(tag.id) && { color: 'rgba(255,255,255,0.7)' }]}>
                                                {getNotesCountByTag(tag.id)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* Summary Detail Modal */}
            <Modal
                visible={!!showSummaryDetail}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowSummaryDetail(null)}
            >
                <SafeAreaView style={styles.modalSafe}>
                    {showSummaryDetail && (
                        <>
                            <View style={styles.detailHeader}>
                                <TouchableOpacity onPress={() => setShowSummaryDetail(null)}>
                                    <Ionicons name="close" size={24} color="#64748B" />
                                </TouchableOpacity>
                                <View style={styles.detailActions}>
                                    <TouchableOpacity
                                        style={styles.detailActionBtn}
                                        onPress={() => handleExport(showSummaryDetail)}
                                    >
                                        <Ionicons name="download-outline" size={20} color="#3B82F6" />
                                        <Text style={styles.detailActionText}>Export</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.detailActionBtn}
                                        onPress={() => handleDeleteSummary(showSummaryDetail.id)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
                                <Text style={styles.detailTitle}>{showSummaryDetail.title}</Text>

                                <View style={styles.detailTags}>
                                    {showSummaryDetail.tags.map(tag => (
                                        <View
                                            key={tag.id}
                                            style={[styles.detailTag, { backgroundColor: tag.color + '20' }]}
                                        >
                                            <Text style={[styles.detailTagText, { color: tag.color }]}>
                                                #{tag.name}
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                <View style={styles.detailMeta}>
                                    <View style={styles.detailMetaItem}>
                                        <Ionicons name="document-text-outline" size={16} color="#64748B" />
                                        <Text style={styles.detailMetaText}>
                                            {showSummaryDetail.sources.length} sources
                                        </Text>
                                    </View>
                                    <View style={styles.detailMetaItem}>
                                        <Ionicons name="text-outline" size={16} color="#64748B" />
                                        <Text style={styles.detailMetaText}>
                                            {showSummaryDetail.wordCount} words
                                        </Text>
                                    </View>
                                    <View style={styles.detailMetaItem}>
                                        <Ionicons name="calendar-outline" size={16} color="#64748B" />
                                        <Text style={styles.detailMetaText}>
                                            {new Date(showSummaryDetail.createdAt).toLocaleDateString()}
                                        </Text>
                                    </View>
                                </View>

                                {/* Sources */}
                                <View style={styles.sourcesSection}>
                                    <Text style={styles.sourcesTitle}>Sources Used</Text>
                                    {showSummaryDetail.sources.map((source, i) => {
                                        const sourceInfo = SOURCE_LABELS[source.sourceType] || SOURCE_LABELS.manual;
                                        return (
                                            <View key={i} style={styles.sourceItem}>
                                                <Ionicons name={sourceInfo.icon as any} size={16} color={sourceInfo.color} />
                                                <Text style={styles.sourceItemText} numberOfLines={1}>
                                                    {source.noteTitle}
                                                </Text>
                                                <Text style={[styles.sourceType, { color: sourceInfo.color }]}>
                                                    {sourceInfo.label}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>

                                {/* Summary Content */}
                                <View style={styles.summaryContent}>
                                    <Text style={styles.summaryContentTitle}>Summary</Text>
                                    <Text style={styles.summaryText}>{showSummaryDetail.summary}</Text>
                                </View>

                                <View style={{ height: 50 }} />
                            </ScrollView>
                        </>
                    )}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        marginLeft: 12,
    },
    pageTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0F172A',
    },
    pageSubtitle: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    refreshBtn: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: '#64748B',
    },
    scrollView: {
        flex: 1,
    },
    alertsSection: {
        margin: 16,
        padding: 16,
        backgroundColor: '#FFFBEB',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    alertsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    alertsTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#92400E',
    },
    alertCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#FDE68A',
    },
    alertDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 12,
    },
    alertContent: {
        flex: 1,
    },
    alertTagName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
    },
    alertCount: {
        fontSize: 12,
        color: '#64748B',
    },
    createSection: {
        margin: 16,
        padding: 20,
        backgroundColor: '#FFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 20,
    },
    selectedTagsContainer: {
        minHeight: 60,
        marginBottom: 16,
    },
    addTagPrompt: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 20,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        borderRadius: 12,
    },
    addTagPromptText: {
        fontSize: 14,
        color: '#94A3B8',
    },
    selectedTagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    selectedTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    selectedTagText: {
        fontSize: 13,
        fontWeight: '600',
    },
    addMoreBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sourceOptions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    sourceOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sourceOptionActive: {
        borderColor: '#10B981',
        backgroundColor: '#F0FDF4',
    },
    sourceOptionText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#334155',
    },
    customPromptInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 14,
        color: '#0F172A',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
        minHeight: 60,
        textAlignVertical: 'top',
    },
    generateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#3B82F6',
        paddingVertical: 16,
        borderRadius: 14,
    },
    generateBtnDisabled: {
        backgroundColor: '#94A3B8',
    },
    generateBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    summariesSection: {
        margin: 16,
    },
    summaryCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
        flex: 1,
    },
    summaryDate: {
        fontSize: 12,
        color: '#94A3B8',
    },
    summaryTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 10,
    },
    miniTag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    miniTagText: {
        fontSize: 11,
        fontWeight: '600',
    },
    summaryMeta: {
        flexDirection: 'row',
    },
    summaryMetaText: {
        fontSize: 12,
        color: '#64748B',
    },
    statsSection: {
        flexDirection: 'row',
        margin: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    modalSafe: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    modalDone: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3B82F6',
    },
    tagPickerScroll: {
        flex: 1,
        padding: 20,
    },
    tagCategory: {
        marginBottom: 24,
    },
    tagCategoryTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    tagGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    tagPickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    tagPickerText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
    },
    tagCount: {
        fontSize: 11,
        color: '#94A3B8',
    },
    detailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    detailActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    detailActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
    },
    detailActionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
    },
    detailScroll: {
        flex: 1,
        padding: 20,
    },
    detailTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 16,
    },
    detailTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    detailTag: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
    },
    detailTagText: {
        fontSize: 13,
        fontWeight: '600',
    },
    detailMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    detailMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailMetaText: {
        fontSize: 13,
        color: '#64748B',
    },
    sourcesSection: {
        marginBottom: 24,
    },
    sourcesTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    sourceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    sourceItemText: {
        flex: 1,
        fontSize: 14,
        color: '#334155',
    },
    sourceType: {
        fontSize: 11,
        fontWeight: '600',
    },
    summaryContent: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    summaryContentTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 16,
    },
    summaryText: {
        fontSize: 15,
        lineHeight: 26,
        color: '#334155',
    },
});

export default AINotesMakerScreen;
