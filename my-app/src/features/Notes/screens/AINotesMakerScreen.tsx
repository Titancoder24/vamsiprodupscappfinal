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
    createNote,
    createTag,
    getNotesByNotebook,
    updateNote,
    LocalTag,
    LocalNote,
} from '../services/localNotesStorage';
import { smartScrape, contentBlocksToNoteBlocks } from '../services/webScraper';
import {
    generateAISummary,
    getAllSummaries,
    deleteSummary,
    exportSummaryAsText,
    getTagBasedAlerts,
    createNotebook,
    getAllNotebooks,
    deleteNotebook,
    AISummary,
    SummaryRequest,
    AINotebook,
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
    // View Mode State
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
    const [currentNotebook, setCurrentNotebook] = useState<AINotebook | null>(null);
    const [notebooks, setNotebooks] = useState<AINotebook[]>([]);
    const [newNotebookTitle, setNewNotebookTitle] = useState('');
    const [showCreateNotebook, setShowCreateNotebook] = useState(false);

    // Notebook Detail State
    const [notebookManualNote, setNotebookManualNote] = useState<LocalNote | null>(null);
    const [notebookManualContent, setNotebookManualContent] = useState('');
    const [notebookSources, setNotebookSources] = useState<LocalNote[]>([]);
    const [selectedArticle, setSelectedArticle] = useState<LocalNote | null>(null);

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

    // Web Scraping State
    const [articleUrl, setArticleUrl] = useState('');
    const [scraping, setScraping] = useState(false);
    const [showAddLink, setShowAddLink] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [currentNotebook])
    );

    const loadData = async () => {
        setLoading(true);
        try {
            const [allTags, allNotes, allSummaries, tagAlerts, allNotebooks] = await Promise.all([
                getAllTags(),
                getAllNotes(),
                getAllSummaries(),
                getTagBasedAlerts(),
                getAllNotebooks(),
            ]);
            setTags(allTags);
            setNotes(allNotes);

            if (currentNotebook) {
                setSummaries(allSummaries.filter(s => s.notebookId === currentNotebook.id));

                // Load Notebook Contents
                try {
                    const nbNotes = await getNotesByNotebook(currentNotebook.id);

                    const manual = nbNotes.find(n => n.sourceType === 'manual');
                    if (manual) {
                        setNotebookManualNote(manual);
                        setNotebookManualContent(manual.content);
                    } else {
                        setNotebookManualNote(null);
                        setNotebookManualContent('');
                    }

                    const sources = nbNotes.filter(n => n.sourceType === 'scraped');
                    setNotebookSources(sources);
                    if (sources.length > 0) {
                        setSelectedArticle(prev => {
                            if (prev && sources.find(s => s.id === prev.id)) return prev;
                            return sources[0];
                        });
                    } else {
                        setSelectedArticle(null);
                    }
                } catch (e) {
                    console.error('Error loading notebook notes:', e);
                }
            } else {
                setSummaries(allSummaries);
            }

            setAlerts(tagAlerts);
            setNotebooks(allNotebooks);
        } catch (error) {
            console.error('[AINotesMaker] Load error:', error);
        }
        setLoading(false);
    };

    const handleCreateNotebook = async () => {
        if (!newNotebookTitle.trim()) return;
        try {
            const nb = await createNotebook(newNotebookTitle.trim());
            setNotebooks([nb, ...notebooks]);
            setNewNotebookTitle('');
            setShowCreateNotebook(false);
            // Auto enter
            setCurrentNotebook(nb);
            setViewMode('detail');
        } catch (error) {
            Alert.alert('Error', 'Failed to create notebook');
        }
    };

    const deleteNotebookHandler = async (id: string) => {
        Alert.alert('Delete Notebook', 'Are you sure? This will hide linked summaries.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await deleteNotebook(id);
                    setNotebooks(prev => prev.filter(n => n.id !== id));
                }
            }
        ]);
    };

    const toggleTag = (tagId: number) => {
        setSelectedTagIds(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

    const handleScrapeArticle = async () => {
        const url = articleUrl.trim();

        if (!url) {
            Alert.alert('Missing URL', 'Please paste a website URL to scrape.');
            return;
        }

        // Basic URL validation
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            Alert.alert('Invalid URL', 'Please enter a valid URL starting with http:// or https://');
            return;
        }

        setScraping(true);
        try {
            console.log('[AINotes] Starting scrape for:', url);
            const article = await smartScrape(url);

            // Check for errors
            if (article.error) {
                throw new Error(article.error);
            }

            // Validate content was extracted
            if (!article.content || article.content.length < 50) {
                throw new Error('Could not extract meaningful content from this page. Try a different article.');
            }

            // Get selected tags to associate
            const tagsToUse = tags.filter(t => selectedTagIds.includes(t.id));

            // Convert blocks
            const blocks = contentBlocksToNoteBlocks(article.contentBlocks);

            // Create note
            const savedNote = await createNote({
                notebookId: currentNotebook ? currentNotebook.id : undefined,
                title: article.title || 'Scraped Article',
                content: article.content,
                blocks: blocks,
                sourceType: 'scraped',
                sourceUrl: url,
                tags: tagsToUse
            });

            console.log('[AINotes] Article saved:', savedNote?.id);

            Alert.alert(
                '✓ Article Saved!',
                `"${article.title}" has been added to your sources.\n\nContent: ${article.content.length} characters extracted.`
            );

            setArticleUrl('');
            setShowAddLink(false);
            await loadData(); // Refresh notes list

        } catch (error: any) {
            console.error('[AINotes] Scraping error:', error);

            let errorMsg = error.message || 'Failed to scrape article';

            // Provide helpful suggestions
            if (errorMsg.includes('proxy') || errorMsg.includes('blocked')) {
                errorMsg += '\n\nTip: Some websites block automated access. Try copying the text manually instead.';
            }

            Alert.alert('Scraping Failed', errorMsg);
        } finally {
            setScraping(false);
        }
    };

    const saveManualNote = async () => {
        if (!currentNotebook) return;

        try {
            if (notebookManualNote) {
                await updateNote(notebookManualNote.id, {
                    content: notebookManualContent,
                    updatedAt: new Date().toISOString()
                });
            } else if (notebookManualContent.trim()) {
                const newNote = await createNote({
                    notebookId: currentNotebook.id,
                    title: 'My Notes',
                    content: notebookManualContent,
                    sourceType: 'manual',
                    tags: []
                });
                setNotebookManualNote(newNote);
            }
        } catch (error) {
            console.error('Error saving note:', error);
        }
    };

    const handleGenerateSummary = async () => {
        if (!currentNotebook && selectedTagIds.length === 0) {
            Alert.alert('Select Tags', 'Please select at least one tag to generate a summary.');
            return;
        }

        setGenerating(true);
        setGeneratingStatus('Starting...');

        try {
            const request: SummaryRequest = {
                notebookId: currentNotebook ? currentNotebook.id : undefined,
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

    const [newTagName, setNewTagName] = useState('');
    const [creatingTag, setCreatingTag] = useState(false);

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;

        setCreatingTag(true);
        try {
            // Import dynamically to avoid circular dependency issues if any
            const { createTag } = require('../services/localNotesStorage');
            const newTag = await createTag(newTagName.trim(), '#3B82F6', 'custom');
            setTags(prev => [...prev, newTag]);
            setSelectedTagIds(prev => [...prev, newTag.id]);
            setNewTagName('');
            Alert.alert('Success', 'Tag created successfully!');
        } catch (error) {
            console.error('Error creating tag:', error);
            Alert.alert('Error', 'Failed to create tag');
        }
        setCreatingTag(false);
    };

    const handleExport = async (summary: AISummary) => {
        Alert.alert('Download Options', 'Choose format', [
            {
                text: 'Text File (.txt)',
                onPress: async () => {
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
                }
            },
            {
                text: 'PDF Document (.pdf)',
                onPress: async () => {
                    const { exportSummaryAsPDFHtml } = require('../services/aiNotesService');
                    const htmlContent = exportSummaryAsPDFHtml(summary);
                    const fileName = `UPSC_Notes_${summary.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;

                    if (Platform.OS === 'web') {
                        // For web, open in new window for printing
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                            printWindow.document.write(htmlContent);
                            printWindow.document.close();
                            printWindow.focus();
                            setTimeout(() => {
                                printWindow.print();
                                printWindow.close();
                            }, 250);
                        }
                    } else {
                        // Import Print dynamically
                        try {
                            const Print = require('expo-print');
                            await Print.printAsync({
                                html: htmlContent
                            });
                        } catch (error) {
                            Alert.alert('Error', 'PDF generation is not available');
                        }
                    }
                }
            },
            { text: 'Cancel', style: 'cancel' }
        ]);
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

    const renderNotebookList = () => (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.pageTitle}>AI Notebooks</Text>
                    <Text style={styles.pageSubtitle}>Organize your AI summaries</Text>
                </View>
                <TouchableOpacity
                    style={styles.refreshBtn}
                    onPress={() => setShowCreateNotebook(true)}
                >
                    <Ionicons name="add" size={24} color="#3B82F6" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Create Notebook Input */}
                {showCreateNotebook && (
                    <View style={styles.createNotebookContainer}>
                        <TextInput
                            style={styles.createNotebookInput}
                            placeholder="Notebook Title (e.g. Medieval History)"
                            value={newNotebookTitle}
                            onChangeText={setNewNotebookTitle}
                            autoFocus
                        />
                        <View style={styles.createActions}>
                            <TouchableOpacity onPress={() => setShowCreateNotebook(false)}>
                                <Text style={styles.cancelCreateText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleCreateNotebook}>
                                <Text style={styles.confirmCreateText}>Create</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <View style={styles.notebookGrid}>
                    {notebooks.map(nb => (
                        <TouchableOpacity
                            key={nb.id}
                            style={styles.notebookCard}
                            onPress={() => {
                                setCurrentNotebook(nb);
                                setViewMode('detail');
                            }}
                        >
                            <View style={styles.notebookIcon}>
                                <Ionicons name="folder-open" size={32} color="#3B82F6" />
                            </View>
                            <Text style={styles.notebookTitle}>{nb.title}</Text>
                            <Text style={styles.notebookMeta}>
                                {new Date(nb.createdAt).toLocaleDateString()}
                            </Text>
                            <TouchableOpacity
                                style={styles.deleteNotebookBtn}
                                onPress={() => deleteNotebookHandler(nb.id)}
                            >
                                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))}
                    {notebooks.length === 0 && !showCreateNotebook && (
                        <View style={styles.emptyState}>
                            <Ionicons name="albums-outline" size={48} color="#CBD5E1" />
                            <Text style={styles.emptyStateText}>No notebooks yet</Text>
                            <Text style={styles.emptyStateSubtext}>Create one to start generating AI notes</Text>
                            <TouchableOpacity
                                style={styles.createFirstBtn}
                                onPress={() => setShowCreateNotebook(true)}
                            >
                                <Text style={styles.createFirstBtnText}>Create Notebook</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );

    if (viewMode === 'list') {
        return renderNotebookList();
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => {
                    setViewMode('list');
                    setCurrentNotebook(null);
                }} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.pageTitle}>{currentNotebook?.title || 'AI Notes'}</Text>
                    {currentNotebook ? <Text style={{ fontSize: 12, color: '#64748B' }}>Notebook Mode</Text> : null}
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
                <ScrollView style={styles.content}>
                    {/* NOTEBOOK MODE UI */}
                    {currentNotebook ? (
                        <>
                            {/* Sources Section */}
                            <View style={styles.sourcesSection}>
                                <View style={styles.sectionHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={styles.sectionTitle}>Sources ({notebookSources.length})</Text>
                                        <View style={{ backgroundColor: '#E2E8F0', paddingHorizontal: 6, borderRadius: 4 }}>
                                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B' }}>WEB</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity onPress={() => setShowAddLink(!showAddLink)}>
                                        <Text style={{ color: '#3B82F6', fontWeight: '600', fontSize: 14 }}>+ Add Link</Text>
                                    </TouchableOpacity>
                                </View>

                                <ScrollView horizontal style={styles.sourcesScroll} showsHorizontalScrollIndicator={false}>
                                    {notebookSources.map((source) => (
                                        <TouchableOpacity
                                            key={source.id}
                                            style={[styles.sourceCard, selectedArticle?.id === source.id && { borderColor: '#3B82F6', borderWidth: 2 }]}
                                            onPress={() => setSelectedArticle(source)}
                                        >
                                            <Ionicons name="globe-outline" size={20} color="#64748B" />
                                            <Text style={styles.sourceCardTitle} numberOfLines={2}>{source.title}</Text>
                                            <View style={{ position: 'absolute', top: 8, right: 8 }}>
                                                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                    {notebookSources.length === 0 && (
                                        <View style={{ padding: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8 }}>
                                            <Text style={{ color: '#94A3B8', fontSize: 13, fontStyle: 'italic' }}>No articles added yet. Click "+ Add Link".</Text>
                                        </View>
                                    )}
                                </ScrollView>

                                {showAddLink && (
                                    <View style={styles.linkInputContainer}>
                                        <TextInput
                                            style={styles.linkInput}
                                            placeholder="Paste Vision IAS / Article URL..."
                                            value={articleUrl}
                                            onChangeText={setArticleUrl}
                                            autoCapitalize="none"
                                            selectTextOnFocus
                                        />
                                        <TouchableOpacity style={[styles.scrapeBtn, scraping && styles.scrapeBtnDisabled]} onPress={handleScrapeArticle} disabled={scraping}>
                                            {scraping ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.scrapeBtnText}>Add</Text>}
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            {/* Article Viewer */}
                            {selectedArticle && (
                                <View style={styles.articleViewer}>
                                    <View style={[styles.sectionHeader, { borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 8, marginBottom: 8 }]}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.sectionTitle} numberOfLines={1}>{selectedArticle.title}</Text>
                                            <Text style={{ fontSize: 10, color: '#94A3B8' }}>{selectedArticle.sourceUrl || 'Source'}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => setSelectedArticle(null)} style={{ padding: 4 }}>
                                            <Ionicons name="close-circle-outline" size={20} color="#64748B" />
                                        </TouchableOpacity>
                                    </View>
                                    <ScrollView style={styles.articleContentScroll} nestedScrollEnabled>
                                        <Text style={styles.articleText}>{selectedArticle.content}</Text>
                                    </ScrollView>
                                </View>
                            )}

                            {/* Editor */}
                            <View style={styles.editorContainer}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>My Notes (Editor)</Text>
                                    <TouchableOpacity onPress={saveManualNote} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Ionicons name="save-outline" size={16} color="#10B981" />
                                        <Text style={{ color: '#10B981', fontWeight: '600' }}>Save</Text>
                                    </TouchableOpacity>
                                </View>
                                <TextInput
                                    style={styles.editorInput}
                                    multiline
                                    placeholder="Start typing your notes here..."
                                    value={notebookManualContent}
                                    onChangeText={setNotebookManualContent}
                                    onEndEditing={saveManualNote}
                                    textAlignVertical="top"
                                />
                            </View>
                        </>
                    ) : (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: '#64748B' }}>Select a notebook to edit notes.</Text>
                        </View>
                    )}

                    {/* Generate Button */}
                    <TouchableOpacity
                        style={[styles.generateBtn, (generating || (!currentNotebook && selectedTagIds.length === 0)) && styles.generateBtnDisabled]}
                        onPress={handleGenerateSummary}
                        disabled={generating || (!currentNotebook && selectedTagIds.length === 0)}
                    >
                        {generating ? (
                            <>
                                <ActivityIndicator color="#FFF" />
                                <Text style={styles.generateBtnText}>{generatingStatus}</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="sparkles" size={20} color="#FFF" />
                                <Text style={styles.generateBtnText}>Generate AI Summary</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Summaries */}
                    {summaries.length > 0 && (
                        <View style={{ marginTop: 24 }}>
                            <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Generated Summaries</Text>
                            {summaries.map((summary) => (
                                <View key={summary.id} style={styles.summaryCard}>
                                    <View style={styles.summaryHeader}>
                                        <View>
                                            <Text style={styles.summaryTitle}>{summary.title}</Text>
                                            <Text style={styles.summaryDate}>{new Date(summary.createdAt).toLocaleDateString()}</Text>
                                        </View>
                                        <View style={styles.summaryActions}>
                                            <TouchableOpacity onPress={() => handleExport(summary)} style={styles.actionBtn}>
                                                <Ionicons name="download-outline" size={18} color="#64748B" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => handleDeleteSummary(summary.id)} style={styles.actionBtn}>
                                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <Text numberOfLines={3} style={styles.summaryPreview}>{summary.summary}</Text>
                                    <TouchableOpacity
                                        style={styles.readMoreBtn}
                                        onPress={() => setShowSummaryDetail(summary)}
                                    >
                                        <Text style={styles.readMoreText}>Read Full Summary</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
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

                    {/* Create Tag Section */}
                    <View style={styles.createTagSection}>
                        <TextInput
                            style={styles.createTagInput}
                            placeholder="Create new tag (e.g. #Mughals)"
                            value={newTagName}
                            onChangeText={setNewTagName}
                            placeholderTextColor="#94A3B8"
                        />
                        <TouchableOpacity
                            style={[styles.createTagBtn, !newTagName.trim() && styles.createTagBtnDisabled]}
                            onPress={handleCreateTag}
                            disabled={!newTagName.trim() || creatingTag}
                        >
                            {creatingTag ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Ionicons name="add" size={24} color="#FFF" />
                            )}
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
    addLinkToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    addLinkToggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
    },
    linkInputContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    linkInput: {
        flex: 1,
        height: 48,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 14,
        color: '#0F172A',
        backgroundColor: '#F8FAFC',
    },
    scrapeBtn: {
        width: 80,
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrapeBtnDisabled: {
        backgroundColor: '#94A3B8',
        opacity: 0.8,
    },
    scrapeBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        width: '100%',
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 16,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 8,
    },
    createNotebookContainer: {
        padding: 16,
        backgroundColor: '#F8FAFC',
        marginBottom: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    createNotebookInput: {
        height: 48,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    createActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 16,
    },
    cancelCreateText: {
        color: '#64748B',
        fontWeight: '600',
    },
    confirmCreateText: {
        color: '#3B82F6',
        fontWeight: '600',
    },
    notebookGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        padding: 8,
    },
    notebookCard: {
        width: (width - 64) / 2,
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: 8,
    },
    notebookIcon: {
        width: 64,
        height: 64,
        backgroundColor: '#EFF6FF',
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    notebookTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 4,
    },
    notebookMeta: {
        fontSize: 12,
        color: '#64748B',
    },
    deleteNotebookBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        padding: 8,
    },
    createFirstBtn: {
        marginTop: 16,
        backgroundColor: '#3B82F6',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 24,
    },
    createFirstBtnText: {
        color: '#FFF',
        fontWeight: '600',
    },
    addNotebookBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#3B82F6',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    summaryActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        padding: 4,
    },
    summaryDate: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
    summaryPreview: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 12,
        lineHeight: 20,
    },
    readMoreBtn: {
        alignSelf: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#3B82F6',
    },
    readMoreText: {
        color: '#3B82F6',
        fontSize: 13,
        fontWeight: '600',
    },
    articleViewer: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 16,
        marginBottom: 24,
        maxHeight: 300,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    articleContentScroll: {
        maxHeight: 250,
    },
    articleText: {
        fontSize: 15,
        lineHeight: 24,
        color: '#334155',
    },
    createTagSection: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    createTagInput: {
        flex: 1,
        height: 44,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 15,
        color: '#0F172A',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    createTagBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    createTagBtnDisabled: {
        backgroundColor: '#94A3B8',
        opacity: 0.7,
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
