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
    KeyboardAvoidingView,
    Animated,
    Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../features/Reference/theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
    getAllTags,
    getAllNotes,
    createNote,
    createTag,
    updateNote,
    deleteNote,
    LocalTag,
    LocalNote,
} from '../services/localNotesStorage';
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
    AINotebook,
} from '../services/aiNotesService';
import { fetchCurrentAffairs, Article } from '../services/currentAffairsService';
import { summarizeNoteContent } from '../services/aiSummarizer';
import { OPENROUTER_API_KEY } from '../../../utils/secureKey';
import { checkNewsMatches, MatchedArticle } from '../../../services/NewsMatchService';
import { FlatList, RefreshControl } from 'react-native';
import InsightSupportModal from '../../../components/InsightSupportModal';
import { InsightAgent } from '../../../services/InsightAgent';
import useCredits from '../../../hooks/useCredits'; // Corrected path
import PayWallPopup from '../../../components/PayWallPopup';
import { LowCreditBanner } from '../../../hooks/useAIFeature';
import { AIDisclaimer, StorageNotice } from '../../../components/AIDisclaimer';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Source type configuration
const SOURCE_TYPES = {
    manual: { label: 'My Notes', color: '#3B82F6', icon: 'create-outline', description: 'Your personal study notes' },
    institute: { label: 'Institute Notes', color: '#8B5CF6', icon: 'school-outline', description: 'Vision IAS, IASBaba, etc.' },
    current_affairs: { label: 'Current Affairs', color: '#10B981', icon: 'newspaper-outline', description: 'Daily/Monthly CA' },
};

type SourceType = keyof typeof SOURCE_TYPES;

export const AINotesMakerScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme, isDark } = useTheme();
    const { credits, useCredits: deductCredits, loading: parsingCredits } = useCredits();
    const [showPaywall, setShowPaywall] = useState(false);

    // ========== ONBOARDING STATE ==========
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState(0);
    const onboardingFade = useState(new Animated.Value(0))[0];
    const onboardingTranslate = useState(new Animated.Value(20))[0];

    const onboardingSteps = [
        {
            title: "Welcome Aspirant! 👋",
            text: "Let me show you how to build your UPSC Knowledge Graph in 3 simple steps.",
            tab: "topics" as const,
            buttonText: "Let's Start"
        },
        {
            title: "Step 1: Create Tags 🏷️",
            text: "First, create hashtags for different UPSC subjects like #Polity or #IR to organize your learning.",
            tab: "topics" as const,
            buttonText: "Got it, Next"
        },
        {
            title: "Step 2: Add Your Notes 📝",
            text: "Now, enter or paste your notes here. Tag them with the hashtags you created for easy retrieval.",
            tab: "notes" as const,
            buttonText: "I'll add notes"
        },
        {
            title: "Step 3: AI Summarize ⚡",
            text: "Finally, hit the AI Summarize button to combine all notes for a tag into a professional UPSC brief!",
            tab: "summaries" as const,
            buttonText: "Complete Tour"
        }
    ];

    useEffect(() => {
        // Show onboarding every time the user comes to this feature
        setTimeout(() => {
            setShowOnboarding(true);
            setOnboardingStep(0);
            setActiveTab(onboardingSteps[0].tab);
            startOnboardingAnimation();
        }, 800);
    }, []);

    const skipOnboarding = () => {
        Animated.timing(onboardingFade, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setShowOnboarding(false);
        });
    };

    const startOnboardingAnimation = () => {
        onboardingFade.setValue(0);
        onboardingTranslate.setValue(10);
        Animated.parallel([
            Animated.timing(onboardingFade, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(onboardingTranslate, {
                toValue: 0,
                duration: 500,
                easing: Easing.out(Easing.back(1)),
                useNativeDriver: true,
            })
        ]).start();
    };

    const nextOnboardingStep = async () => {
        if (onboardingStep < onboardingSteps.length - 1) {
            const nextStep = onboardingStep + 1;
            setOnboardingStep(nextStep);
            setActiveTab(onboardingSteps[nextStep].tab);
            startOnboardingAnimation();
        } else {
            // End onboarding
            Animated.timing(onboardingFade, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setShowOnboarding(false);
            });
        }
    };

    // Credit Check Helper
    const checkCreditBalance = () => {
        if (credits <= 0) {
            setShowPaywall(true);
            return false;
        }
        return true;
    };

    // ========== STATE ==========
    // View State
    const [activeTab, setActiveTab] = useState<'notes' | 'topics' | 'summaries'>('topics');

    // Tags/Topics State
    const [tags, setTags] = useState<LocalTag[]>([]);
    const [notes, setNotes] = useState<LocalNote[]>([]);
    const [summaries, setSummaries] = useState<AISummary[]>([]);
    const [alerts, setAlerts] = useState<{ tag: LocalTag; count: number }[]>([]);

    // Tag Management
    const [showCreateTag, setShowCreateTag] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#3B82F6');

    // Note Creation/Edit
    const [showNoteEditor, setShowNoteEditor] = useState(false);
    const [editingNote, setEditingNote] = useState<LocalNote | null>(null);
    const [noteTitle, setNoteTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [noteSourceType, setNoteSourceType] = useState<SourceType>('manual');
    const [noteSourceUrl, setNoteSourceUrl] = useState('');
    const [noteSummary, setNoteSummary] = useState('');
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

    // Summary Generation
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [summaryStep, setSummaryStep] = useState<'select-notes' | 'configure'>('select-notes');
    const [summaryTagIds, setSummaryTagIds] = useState<number[]>([]);
    const [summarySourceTypes, setSummarySourceTypes] = useState<SourceType[]>(['manual', 'institute', 'current_affairs']);
    const [selectedNoteIds, setSelectedNoteIds] = useState<number[]>([]);
    const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([]);
    const [currentAffairs, setCurrentAffairs] = useState<Article[]>([]);
    const [loadingArticles, setLoadingArticles] = useState(false);
    const [customPrompt, setCustomPrompt] = useState('');
    const [generating, setGenerating] = useState(false);
    const [generatingStatus, setGeneratingStatus] = useState('');

    // Summary Detail
    const [showSummaryDetail, setShowSummaryDetail] = useState<AISummary | null>(null);

    // Loading
    const [loading, setLoading] = useState(true);
    const [newsMatches, setNewsMatches] = useState<MatchedArticle[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [aiInsightStatus, setAiInsightStatus] = useState<'none' | 'updates'>('none');

    // Filter states for summaries
    const [filterTagId, setFilterTagId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // ========== DATA LOADING ==========
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        setLoading(true);
        try {
            const [loadedTags, loadedNotes, loadedSummaries] = await Promise.all([
                getAllTags(),
                getAllNotes(),
                getAllSummaries(),
            ]);

            setTags(loadedTags);
            setNotes(loadedNotes);
            setSummaries(loadedSummaries);

            // Calculate alerts (tags with recent current affairs)
            const alertsData = await getTagBasedAlerts();
            setAlerts(alertsData.map(a => ({ tag: a.tag, count: a.newArticles.length })));

            // Check for news matches (NEW: Knowledge Radar)
            try {
                const matches = await checkNewsMatches();
                setNewsMatches(matches);
            } catch (err) {
                console.error("Failed to check news matches", err);
            }

            // AI Insight background check (Silent)
            InsightAgent.checkNoteStatus().then(res => {
                if (res.status === 'updates_available') {
                    setAiInsightStatus('updates');
                } else {
                    setAiInsightStatus('none');
                }
            }).catch(e => console.log('[AINotes] Background check failed', e));

        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Live Heartbeat: Auto-scan for news every 5 mins
    useEffect(() => {
        const interval = setInterval(() => {
            console.log('[AINotes-Heartbeat] Proactive scan cycle...');
            checkNewsMatches().then(matches => setNewsMatches(matches));
            InsightAgent.checkNoteStatus().then(res => {
                if (res.status === 'updates_available') setAiInsightStatus('updates');
            });
        }, 60 * 1000); // 60 SECONDS (1 Minute Cycle)
        return () => clearInterval(interval);
    }, []);

    const [showInsightSupport, setShowInsightSupport] = useState(false);

    // ========== TAG MANAGEMENT ==========
    const handleCreateTag = async () => {
        if (!newTagName.trim()) {
            Alert.alert('Error', 'Please enter a tag name');
            return;
        }

        const tagName = newTagName.trim();

        try {
            await createTag(
                tagName.toLowerCase().replace(/\s+/g, '').replace(/^#+/, ''),
                newTagColor
            );
            setNewTagName('');
            setShowCreateTag(false);
            await loadData();
            Alert.alert('Success', `Tag "${tagName}" created!`);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create tag');
        }
    };

    const toggleTagSelection = (tagId: number) => {
        setSelectedTagIds(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

    // ========== NOTE MANAGEMENT ==========
    const openNoteEditor = (note?: LocalNote) => {
        if (note) {
            setEditingNote(note);
            setNoteTitle(note.title);
            setNoteContent(note.content);
            setNoteSourceType((note.sourceType as SourceType) || 'manual');
            setNoteSourceUrl(note.sourceUrl || '');
            setNoteSummary(note.summary || '');
            setSelectedTagIds(note.tags.map(t => t.id));
        } else {
            setEditingNote(null);
            setNoteTitle('');
            setNoteContent('');
            setNoteSourceType('manual');
            setNoteSourceUrl('');
            setNoteSummary('');
            setSelectedTagIds([]);
        }
        setShowNoteEditor(true);
    };

    const handleSaveNote = async () => {
        console.log('[AINotes] handleSaveNote called');
        console.log('[AINotes] noteTitle:', noteTitle);
        console.log('[AINotes] noteContent length:', noteContent.length);
        console.log('[AINotes] selectedTagIds:', selectedTagIds);

        if (!noteTitle.trim()) {
            Alert.alert('Missing Title', 'Please enter a title for your note');
            return;
        }

        if (!noteContent.trim()) {
            Alert.alert('Missing Content', 'Please enter some content for your note');
            return;
        }

        if (selectedTagIds.length === 0) {
            Alert.alert('No Tags Selected', 'Please select at least one hashtag to organize your note');
            return;
        }

        try {
            const noteTags = tags.filter(t => selectedTagIds.includes(t.id));
            console.log('[AINotes] noteTags:', noteTags.map(t => t.name));

            const notePayload = {
                title: noteTitle.trim(),
                content: noteContent.trim(),
                sourceType: noteSourceType,
                sourceUrl: noteSourceUrl?.trim() || undefined,
                summary: noteSummary?.trim() || undefined,
                tags: noteTags,
                blocks: [{ id: '1', type: 'paragraph' as const, content: noteContent.trim() }],
            };

            console.log('[AINotes] Saving note with payload:', JSON.stringify(notePayload, null, 2));

            if (editingNote) {
                const result = await updateNote(editingNote.id, notePayload);
                console.log('[AINotes] Note updated:', result);
                Alert.alert('Success', 'Note updated successfully!');
            } else {
                const result = await createNote(notePayload);
                console.log('[AINotes] Note created:', result);
                Alert.alert('Success', 'Note saved successfully!');
            }

            setShowNoteEditor(false);
            setNoteTitle('');
            setNoteContent('');
            setNoteSourceUrl('');
            setNoteSummary('');
            setSelectedTagIds([]);
            setEditingNote(null);

            await loadData();
            console.log('[AINotes] Data reloaded after save');
        } catch (error: any) {
            console.error('[AINotes] Error saving note:', error);
            Alert.alert('Save Error', error.message || 'Failed to save note. Please try again.');
        }
    };

    const handleGenerateNoteSummary = async () => {
        if (!noteContent.trim()) {
            Alert.alert('No Content', 'Please paste or type some content first to summarize.');
            return;
        }

        // Feature Gate: Credits
        if (!checkCreditBalance()) return;

        setGenerating(true);
        setGeneratingStatus('Summarizing...');

        try {
            // Deduct Credit (optional but consistent)
            const deducted = await deductCredits('summary');
            if (!deducted) {
                setGenerating(false);
                return;
            }

            const response = await summarizeNoteContent(noteContent);
            if (response.error) {
                throw new Error(response.error);
            }

            setNoteSummary(response.summary);
            Alert.alert('Success', 'Summary generated successfully!');
        } catch (error: any) {
            console.error('[AINotes] Error generating individual summary:', error);
            Alert.alert('Error', error.message || 'Failed to generate summary');
        } finally {
            setGenerating(false);
            setGeneratingStatus('');
        }
    };

    const handleDeleteNote = async (noteId: number) => {
        Alert.alert(
            'Delete Note',
            'Are you sure you want to delete this note?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteNote(noteId);
                            await loadData();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete note');
                        }
                    },
                },
            ]
        );
    };

    // ========== SUMMARY GENERATION ==========
    const openSummaryGenerator = async () => {
        console.log('[AINotes] Opening summary generator...');
        setSummaryStep('select-notes');
        setSummaryTagIds([]);
        setSummarySourceTypes(['manual', 'institute', 'current_affairs']);
        setCustomPrompt('');
        setShowSummaryModal(true);

        // Auto-select all notes by default
        const allNoteIds = notes.map(n => n.id);
        setSelectedNoteIds(allNoteIds);
        console.log('[AINotes] Auto-selected', allNoteIds.length, 'notes');

        // Reset article selection
        setSelectedArticleIds([]);

        // Fetch Current Affairs
        setLoadingArticles(true);
        try {
            const articles = await fetchCurrentAffairs(30);
            setCurrentAffairs(articles);
            console.log('[AINotes] Loaded', articles.length, 'current affairs articles');
        } catch (error) {
            console.error('[AINotes] Error loading articles:', error);
            setCurrentAffairs([]);
        } finally {
            setLoadingArticles(false);
        }
    };

    const toggleSummaryTag = (tagId: number) => {
        setSummaryTagIds(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

    const toggleSummarySource = (source: SourceType) => {
        setSummarySourceTypes(prev =>
            prev.includes(source)
                ? prev.filter(s => s !== source)
                : [...prev, source]
        );
    };

    const toggleNoteSelection = (noteId: number) => {
        setSelectedNoteIds(prev =>
            prev.includes(noteId)
                ? prev.filter(id => id !== noteId)
                : [...prev, noteId]
        );
    };

    const toggleArticleSelection = (articleId: string) => {
        setSelectedArticleIds(prev =>
            prev.includes(articleId)
                ? prev.filter(id => id !== articleId)
                : [...prev, articleId]
        );
    };

    const selectAllNotes = () => {
        const allIds = notes.map(n => n.id);
        setSelectedNoteIds(allIds);
    };

    const selectAllArticles = () => {
        const allIds = currentAffairs.map(a => a.id);
        setSelectedArticleIds(allIds);
    };

    const handleGenerateSummary = async () => {
        console.log('[AINotes] Starting summary generation...');
        console.log('[AINotes] API Key present:', !!OPENROUTER_API_KEY);
        console.log('[AINotes] Selected note IDs:', selectedNoteIds);
        console.log('[AINotes] Selected article IDs:', selectedArticleIds);

        // Check API key first
        if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.length < 10) {
            Alert.alert('Error', 'API key not configured. Please check setup.');
            return;
        }

        // Feature Gate: Credits
        if (!checkCreditBalance()) return;

        // Deduct Credit
        const deducted = await deductCredits('summary');
        if (!deducted) return;

        // Get notes to summarize
        let notesToSummarize = notes;
        if (selectedNoteIds.length > 0) {
            notesToSummarize = notes.filter(n => selectedNoteIds.includes(n.id));
        }

        // Get articles to summarize
        const articlesToSummarize = currentAffairs.filter(a => selectedArticleIds.includes(a.id));

        console.log('[AINotes] Notes to summarize:', notesToSummarize.length);
        console.log('[AINotes] Articles to summarize:', articlesToSummarize.length);

        if (notesToSummarize.length === 0 && articlesToSummarize.length === 0) {
            Alert.alert('No Content', 'Please select notes or current affairs articles to summarize.');
            return;
        }

        setGenerating(true);
        setGeneratingStatus('Preparing content...');

        try {
            // BUILD MERGED CONTENT FROM NOTES + ARTICLES
            let allContent = '';

            // Add notes content
            if (notesToSummarize.length > 0) {
                allContent += '\n=== YOUR NOTES ===\n';
                notesToSummarize.forEach((note, i) => {
                    allContent += `\n[Note ${i + 1}] ${note.title}\n${note.content}\n`;
                });
            }

            // Add current affairs articles content
            if (articlesToSummarize.length > 0) {
                allContent += '\n=== CURRENT AFFAIRS ARTICLES ===\n';
                articlesToSummarize.forEach((article, i) => {
                    allContent += `\n[Article ${i + 1}] ${article.title}\n${article.content}\n`;
                });
            }

            console.log('[AINotes] Total content length:', allContent.length);
            setGeneratingStatus('Calling AI...');

            // Build prompt - NO MARKDOWN, NO EMOJIS
            const prompt = `You are a UPSC exam expert. Create a comprehensive summary combining all the provided notes and current affairs articles.

STRICT RULES:
- DO NOT use any markdown (no #, ##, **, __, etc.)
- DO NOT use any emojis or special symbols
- Use simple bullet points with - or • 
- Use PLAIN TEXT ONLY
- Use clear section headers in UPPERCASE
- Combine information from all sources into one cohesive summary

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

TOPIC OVERVIEW
- Brief introduction about the topic
- Context and background

KEY POINTS
- Important point 1
- Important point 2
- Important point 3
(continue as needed)

IMPORTANT FACTS AND FIGURES
- Key dates to remember
- Important numbers and statistics
- Names and places

EXAM RELEVANCE
- How this can be asked in Prelims
- Mains answer writing points
- Essay connection points

QUICK REVISION
- Main takeaway 1
- Main takeaway 2
- Main takeaway 3

CONTENT TO SUMMARIZE:
${allContent}

${customPrompt ? `ADDITIONAL INSTRUCTIONS: ${customPrompt}` : ''}

Generate a professional, exam-oriented summary. NO emojis, NO markdown.`;

            console.log('[AINotes] Sending request to OpenRouter...');

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://prepassist.in',
                    'X-Title': 'PrepAssist AI Notes',
                },
                body: JSON.stringify({
                    model: 'google/gemini-2.0-flash-001',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 4000,
                }),
            });

            console.log('[AINotes] Response status:', response.status);

            if (!response.ok) {
                const errText = await response.text();
                console.error('[AINotes] API Error:', errText);
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            console.log('[AINotes] Response received');

            const summaryText = data.choices?.[0]?.message?.content;
            if (!summaryText) {
                throw new Error('No content in response');
            }

            console.log('[AINotes] Summary length:', summaryText.length);
            setGeneratingStatus('Saving...');

            // Create title
            const summaryTitle = notesToSummarize.length > 0
                ? `${notesToSummarize[0].title} Summary`
                : 'Current Affairs Summary';

            // Save to localStorage
            const { getItem, setItem } = await import('../services/storage');

            const existingSummaries = JSON.parse(await getItem('@upsc_ai_summaries') || '[]');
            const counter = parseInt(await getItem('@upsc_summary_counter') || '0') + 1;
            await setItem('@upsc_summary_counter', String(counter));

            const newSummary: AISummary = {
                id: counter,
                title: summaryTitle,
                summary: summaryText,
                sources: [
                    ...notesToSummarize.map(n => ({ noteId: n.id, noteTitle: n.title, sourceType: n.sourceType || 'manual' })),
                    ...articlesToSummarize.map(a => ({ noteId: 0, noteTitle: a.title, sourceType: 'current_affairs' })),
                ],
                tags: notesToSummarize.flatMap(n => n.tags).filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i),
                tagIds: [...new Set(notesToSummarize.flatMap(n => n.tags.map(t => t.id)))],
                wordCount: summaryText.split(/\s+/).length,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            existingSummaries.unshift(newSummary);
            await setItem('@upsc_ai_summaries', JSON.stringify(existingSummaries));

            // ALSO save as a regular note so it's persistent and visible in UPSC Note Maker
            try {
                // Determine source type and tags
                const summaryTags = newSummary.tags && newSummary.tags.length > 0
                    ? newSummary.tags
                    : tags.filter(t => summaryTagIds.includes(t.id));

                const summaryAsNote = {
                    title: `[AI] ${summaryTitle}`,
                    content: summaryText,
                    sourceType: 'current_affairs' as const,
                    tags: summaryTags,
                    blocks: [{ id: `ai-sum-${Date.now()}`, type: 'paragraph' as const, content: summaryText }],
                    isPinned: true // Auto-pin AI summaries for visibility
                };

                const savedNote = await createNote(summaryAsNote);
                console.log('[AINotes] Also saved summary as a regular study note:', savedNote.id);
            } catch (noteErr) {
                console.error('[AINotes] Failed to save summary as regular note:', noteErr);
            }

            console.log('[AINotes] Summary saved!');

            setShowSummaryModal(false);
            await loadData();

            Alert.alert(
                '✅ Summary Ready!',
                `Created from ${notesToSummarize.length} notes${articlesToSummarize.length > 0 ? ` and ${articlesToSummarize.length} articles` : ''}.`,
                [
                    { text: 'View Now', onPress: () => setShowSummaryDetail(newSummary) },
                    { text: 'OK' }
                ]
            );

        } catch (error: any) {
            console.error('[AINotes] Error:', error);
            Alert.alert('Generation Failed', error.message || 'Something went wrong. Try again.');
        } finally {
            setGenerating(false);
            setGeneratingStatus('');
        }
    };

    // ========== EXPORT - BULLETPROOF VERSION ==========

    /**
     * Force download a file in browser
     */
    const forceDownload = (filename: string, content: string, mimeType: string): boolean => {
        try {
            console.log('[Export] Starting download:', filename);

            // Create blob
            const blob = new Blob([content], { type: mimeType });

            // Create download URL
            const downloadUrl = URL.createObjectURL(blob);

            // Create hidden link
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            link.style.display = 'none';
            link.style.visibility = 'hidden';

            // Add to DOM
            document.body.appendChild(link);

            // Force click
            link.click();

            // Cleanup after short delay
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(downloadUrl);
                console.log('[Export] Download complete:', filename);
            }, 100);

            return true;
        } catch (error) {
            console.error('[Export] Download error:', error);
            return false;
        }
    };

    /**
     * Export summary in chosen format
     */
    const handleExportSummary = async (summary: AISummary, format: 'txt' | 'doc' | 'pdf') => {
        console.log('[Export] Starting export:', format);

        // Create safe filename
        const safeTitle = summary.title
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 40) || 'Summary';

        const dateStr = new Date(summary.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        // Clean content - remove any emojis
        const cleanContent = summary.summary
            .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
            .trim();

        // ===== TEXT FORMAT =====
        if (format === 'txt') {
            const textContent = [
                summary.title.toUpperCase(),
                '='.repeat(50),
                '',
                `Generated: ${dateStr}`,
                '',
                '='.repeat(50),
                '',
                cleanContent,
                '',
                '='.repeat(50),
                'Generated by PrepAssist AI Notes Maker',
                'https://prepassist.in'
            ].join('\n');

            if (isWeb) {
                const success = forceDownload(`${safeTitle}.txt`, textContent, 'text/plain;charset=utf-8');
                if (success) {
                    Alert.alert('Success', 'Text file downloaded!');
                } else {
                    Alert.alert('Error', 'Download failed. Try again.');
                }
            } else {
                await Share.share({ title: summary.title, message: textContent });
            }
        }

        // ===== WORD FORMAT =====
        else if (format === 'doc') {
            const wordHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="utf-8">
<title>${summary.title}</title>
<style>
body { font-family: Calibri, Arial, sans-serif; font-size: 12pt; line-height: 1.6; margin: 40px; color: #333; }
h1 { font-size: 18pt; color: #1a365d; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 16px; }
.date { color: #666; font-size: 10pt; margin-bottom: 20px; }
.content { white-space: pre-wrap; }
.footer { margin-top: 40px; text-align: center; color: #999; font-size: 9pt; border-top: 1px solid #ccc; padding-top: 10px; }
</style>
</head>
<body>
<h1>${summary.title}</h1>
<p class="date">Generated: ${dateStr}</p>
<div class="content">${cleanContent.replace(/\n/g, '<br>')}</div>
<p class="footer">Generated by PrepAssist AI Notes Maker | prepassist.in</p>
</body>
</html>`;

            if (isWeb) {
                const success = forceDownload(`${safeTitle}.doc`, wordHtml, 'application/msword');
                if (success) {
                    Alert.alert('Success', 'Word document downloaded! Open with MS Word or Google Docs.');
                } else {
                    Alert.alert('Error', 'Download failed. Try again.');
                }
            } else {
                await Share.share({ title: summary.title, message: cleanContent });
            }
        }

        // ===== PDF FORMAT (via Print) =====
        else if (format === 'pdf') {
            const pdfHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${summary.title}</title>
<style>
@page { size: A4; margin: 20mm; }
@media print { 
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { 
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif; 
    font-size: 11pt; 
    line-height: 1.7; 
    color: #222; 
    padding: 40px;
    max-width: 800px;
    margin: 0 auto;
}
h1 { 
    font-size: 20pt; 
    color: #1a365d; 
    border-bottom: 3px solid #3b82f6; 
    padding-bottom: 12px; 
    margin-bottom: 16px; 
}
.date { 
    color: #555; 
    font-size: 10pt; 
    margin-bottom: 24px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
}
.content { 
    white-space: pre-wrap; 
    font-size: 11pt;
    line-height: 1.8;
}
.footer { 
    margin-top: 50px; 
    text-align: center; 
    color: #888; 
    font-size: 9pt; 
    padding-top: 16px; 
    border-top: 1px solid #ddd; 
}
.print-btn {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #3b82f6;
    color: white;
    border: none;
    padding: 12px 24px;
    font-size: 14px;
    border-radius: 8px;
    cursor: pointer;
}
.print-btn:hover { background: #2563eb; }
</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">Save as PDF</button>
<h1>${summary.title}</h1>
<p class="date">Generated: ${dateStr}</p>
<div class="content">${cleanContent}</div>
<p class="footer">Generated by PrepAssist AI Notes Maker | prepassist.in</p>
<script>
// Auto print after 1 second
setTimeout(function() {
    window.print();
}, 1000);
</script>
</body>
</html>`;

            if (isWeb) {
                // Open in new window
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(pdfHtml);
                    printWindow.document.close();
                    console.log('[Export] PDF print window opened');
                } else {
                    // Popup blocked - show instructions
                    Alert.alert(
                        'Popup Blocked',
                        'Your browser blocked the print window. Please allow popups for this site, or download as Text/Word format instead.'
                    );
                }
            } else {
                await Share.share({ title: summary.title, message: cleanContent });
            }
        }
    };

    /**
     * Show export format options
     */
    const showExportOptions = (summary: AISummary) => {
        Alert.alert(
            'Download Summary',
            'Choose your preferred format:',
            [
                {
                    text: 'Text File (.txt)',
                    onPress: () => handleExportSummary(summary, 'txt')
                },
                {
                    text: 'Word Document (.doc)',
                    onPress: () => handleExportSummary(summary, 'doc')
                },
                {
                    text: 'PDF (Print Dialog)',
                    onPress: () => handleExportSummary(summary, 'pdf')
                },
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
            ]
        );
    };

    const handleShareSummary = async (summary: AISummary) => {
        try {
            await Share.share({
                title: summary.title,
                message: `${summary.title}\n\nTags: ${summary.tags.map(t => t.name).join(' ')}\n\n${summary.summary}`,
            });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    const handleDeleteSummary = async (summaryId: number) => {
        Alert.alert('Delete Summary', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await deleteSummary(summaryId);
                    await loadData();
                },
            },
        ]);
    };

    // ========== RENDER FUNCTIONS ==========

    // Render Topics/Tags Tab
    const renderTopicsTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {/* Alerts Section */}
            {alerts.length > 0 && (
                <View style={styles.alertsSection}>
                    <View style={styles.alertsHeader}>
                        <Ionicons name="notifications" size={20} color="#F59E0B" />
                        <Text style={styles.alertsTitle}>New Updates for Your Topics!</Text>
                    </View>
                    <Text style={styles.alertsSubtext}>
                        Current affairs matching your hashtags have been found.
                    </Text>
                </View>
            )}


            {/* Create Tag Button */}
            <TouchableOpacity style={styles.createTagBtn} onPress={() => setShowCreateTag(true)}>
                <Ionicons name="add-circle" size={24} color="#3B82F6" />
                <Text style={styles.createTagBtnText}>Create New Hashtag</Text>
            </TouchableOpacity>

            {/* Tags Grid */}
            <View style={styles.tagsGrid}>
                {tags.map(tag => {
                    const tagNotes = notes.filter(n => n.tags.some(t => t.id === tag.id));
                    const alert = alerts.find(a => a.tag.id === tag.id);

                    return (
                        <TouchableOpacity
                            key={tag.id}
                            style={[
                                styles.tagCard,
                                {
                                    backgroundColor: tag.color + '12', // More saturated background tint
                                    borderColor: tag.color + '60',     // Bolder, more colorful border
                                }
                            ]}
                            onPress={() => {
                                setSummaryTagIds([tag.id]);
                                setActiveTab('notes');
                            }}
                            activeOpacity={0.8}
                        >
                            {/* Artistic Background Mirror Icon - Increased Visibility */}
                            <View style={styles.mirrorIcon}>
                                <Ionicons name="pricetag" size={84} color={tag.color} style={{ opacity: 0.12 }} />
                            </View>

                            <View style={[styles.tagCardAccent, { backgroundColor: tag.color }]} />

                            <View style={styles.tagCardContent}>
                                <View style={styles.tagCardHeader}>
                                    <View style={[styles.tagIconWrapper, { backgroundColor: tag.color + '25' }]}>
                                        <Ionicons name="pricetag" size={16} color={tag.color} />
                                    </View>
                                    {alert && alert.count > 0 && (
                                        <View style={styles.alertBadge}>
                                            <Text style={styles.alertBadgeText}>{alert.count}</Text>
                                        </View>
                                    )}
                                </View>

                                <Text style={[styles.tagName, { color: '#1E293B' }]} numberOfLines={1}>
                                    {tag.name.replace(/^#+/, '')}
                                </Text>

                                <View style={[styles.tagNoteCountContainer, { backgroundColor: tag.color + '25' }]}>
                                    <Text style={[styles.tagNoteCount, { color: tag.color }]}>{tagNotes.length} notes</Text>
                                </View>

                                {/* Source breakdown */}
                                <View style={styles.sourceBreakdown}>
                                    {Object.entries(SOURCE_TYPES).map(([key, config]) => {
                                        const count = tagNotes.filter(n => n.sourceType === key).length;
                                        if (count === 0) return null;
                                        return (
                                            <View key={key} style={[styles.sourceBadge, { backgroundColor: config.color + '15' }]}>
                                                <Ionicons name={config.icon as any} size={10} color={config.color} />
                                                <Text style={[styles.sourceBadgeText, { color: config.color }]}>{count}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {tags.length === 0 && (
                <View style={styles.emptyState}>
                    <Ionicons name="pricetag-outline" size={48} color="#CBD5E1" />
                    <Text style={styles.emptyStateTitle}>No Hashtags Yet</Text>
                    <Text style={styles.emptyStateText}>
                        Create hashtags like #MughalHistory, #ArtAndCulture to organize your notes
                    </Text>
                </View>
            )}
        </ScrollView>
    );

    // Render Notes Tab
    const renderNotesTab = () => {
        // Filter notes by selected tags if any
        const filteredNotes = summaryTagIds.length > 0
            ? notes.filter(n => n.tags.some(t => summaryTagIds.includes(t.id)))
            : notes;

        return (
            <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
                {/* Filter by Tags */}
                {summaryTagIds.length > 0 && (
                    <View style={styles.activeFilter}>
                        <Text style={styles.activeFilterLabel}>Filtering by:</Text>
                        {tags.filter(t => summaryTagIds.includes(t.id)).map(tag => (
                            <TouchableOpacity
                                key={tag.id}
                                style={[styles.filterTag, { backgroundColor: tag.color + '20' }]}
                                onPress={() => setSummaryTagIds(prev => prev.filter(id => id !== tag.id))}
                            >
                                <Text style={[styles.filterTagText, { color: tag.color }]}>{tag.name}</Text>
                                <Ionicons name="close" size={14} color={tag.color} />
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity onPress={() => setSummaryTagIds([])}>
                            <Text style={styles.clearFilterText}>Clear All</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Add Note Button */}
                <TouchableOpacity style={styles.addNoteBtn} onPress={() => openNoteEditor()}>
                    <Ionicons name="add" size={24} color="#FFF" />
                    <Text style={styles.addNoteBtnText}>Add New Note</Text>
                </TouchableOpacity>

                {/* Source Type Filter */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sourceFilter}>
                    {Object.entries(SOURCE_TYPES).map(([key, config]) => (
                        <TouchableOpacity
                            key={key}
                            style={[
                                styles.sourceFilterBtn,
                                summarySourceTypes.includes(key as SourceType) && { backgroundColor: config.color + '20', borderColor: config.color }
                            ]}
                            onPress={() => toggleSummarySource(key as SourceType)}
                        >
                            <Ionicons name={config.icon as any} size={16} color={config.color} />
                            <Text style={[styles.sourceFilterText, { color: config.color }]}>{config.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Notes List */}
                {filteredNotes.map(note => {
                    const sourceConfig = SOURCE_TYPES[note.sourceType as SourceType] || SOURCE_TYPES.manual;

                    return (
                        <TouchableOpacity
                            key={note.id}
                            style={styles.premiumNoteCard}
                            onPress={() => openNoteEditor(note)}
                        >
                            <View style={styles.noteCardTopRow}>
                                <View style={[styles.sourceBadgeTiny, { backgroundColor: sourceConfig.color + '15' }]}>
                                    <Ionicons name={sourceConfig.icon as any} size={12} color={sourceConfig.color} />
                                    <Text style={[styles.sourceBadgeTinyText, { color: sourceConfig.color }]}>
                                        {sourceConfig.label.toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={styles.noteCardDate}>{new Date(note.updatedAt).toLocaleDateString()}</Text>
                            </View>

                            <View style={styles.noteCardMainContent}>
                                <View style={styles.noteCardHeaderFixed}>
                                    <Text style={styles.premiumNoteTitle} numberOfLines={1}>{note.title}</Text>
                                    <TouchableOpacity
                                        style={styles.deleteNoteBtnSmall}
                                        onPress={() => handleDeleteNote(note.id)}
                                    >
                                        <Ionicons name="trash-outline" size={16} color="#94A3B8" />
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.premiumNotePreview} numberOfLines={2}>{note.content}</Text>

                                {note.summary && (
                                    <View style={styles.premiumSummaryPreview}>
                                        <Ionicons name="sparkles" size={14} color="#8B5CF6" />
                                        <Text style={styles.premiumSummaryText} numberOfLines={2}>
                                            {note.summary}
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.noteCardFooter}>
                                    <View style={styles.noteCardTagsList}>
                                        {note.tags.slice(0, 3).map(tag => (
                                            <View key={tag.id} style={[styles.tinyTag, { backgroundColor: tag.color + '15' }]}>
                                                <Text style={[styles.tinyTagText, { color: tag.color }]}>{tag.name.replace(/^#+/, '')}</Text>
                                            </View>
                                        ))}
                                        {note.tags.length > 3 && (
                                            <Text style={styles.moreTagsTextSmall}>+{note.tags.length - 3}</Text>
                                        )}
                                    </View>
                                    {note.sourceUrl && (
                                        <Ionicons name="link" size={12} color="#94A3B8" />
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}

                {filteredNotes.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
                        <Text style={styles.emptyStateTitle}>No Notes Yet</Text>
                        <Text style={styles.emptyStateText}>
                            Add notes from your studies, institute materials, or current affairs
                        </Text>
                    </View>
                )}
            </ScrollView>
        );
    };

    // Render Summaries Tab
    const renderSummariesTab = () => {
        // Filter summaries based on selected tag and search
        const filteredSummaries = summaries.filter(s => {
            const matchesTag = !filterTagId || s.tags.some(t => t.id === filterTagId);
            const matchesSearch = !searchQuery ||
                s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.summary.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTag && matchesSearch;
        });

        // Get all unique tags from summaries
        const allTags = Array.from(new Set(summaries.flatMap(s => s.tags.map(t => JSON.stringify(t)))))
            .map(t => JSON.parse(t));

        return (
            <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
                {/* Generate Summary Button */}
                <TouchableOpacity style={styles.generateBtn} onPress={openSummaryGenerator}>
                    <Ionicons name="sparkles" size={24} color="#FFF" />
                    <View>
                        <Text style={styles.generateBtnText}>Generate AI Summary</Text>
                        <Text style={styles.generateBtnSubtext}>Combine notes by hashtags</Text>
                    </View>
                </TouchableOpacity>

                {/* Search Bar */}
                <View style={{ backgroundColor: '#F1F5F9', borderRadius: 12, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="search" size={20} color="#64748B" />
                    <TextInput
                        style={{ flex: 1, marginLeft: 10, fontSize: 15, color: '#0F172A' }}
                        placeholder="Search summaries..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    ) : null}
                </View>

                {/* Tag Filter Chips */}
                {allTags.length > 0 && (
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 8 }}>Filter by Tag:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <TouchableOpacity
                                onPress={() => setFilterTagId(null)}
                                style={{
                                    paddingHorizontal: 14,
                                    paddingVertical: 8,
                                    borderRadius: 20,
                                    backgroundColor: filterTagId === null ? '#3B82F6' : '#E2E8F0',
                                    marginRight: 8,
                                }}
                            >
                                <Text style={{ color: filterTagId === null ? '#FFF' : '#475569', fontWeight: '600', fontSize: 13 }}>
                                    All
                                </Text>
                            </TouchableOpacity>
                            {allTags.map((tag: any) => (
                                <TouchableOpacity
                                    key={tag.id}
                                    onPress={() => setFilterTagId(filterTagId === tag.id ? null : tag.id)}
                                    style={{
                                        paddingHorizontal: 14,
                                        paddingVertical: 8,
                                        borderRadius: 20,
                                        backgroundColor: filterTagId === tag.id ? tag.color : '#E2E8F0',
                                        marginRight: 8,
                                    }}
                                >
                                    <Text style={{
                                        color: filterTagId === tag.id ? '#FFF' : tag.color,
                                        fontWeight: '600',
                                        fontSize: 13
                                    }}>
                                        {tag.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Summaries List */}
                <Text style={styles.sectionTitle}>
                    {filterTagId || searchQuery
                        ? `Filtered Summaries (${filteredSummaries.length})`
                        : `Your Summaries (${summaries.length})`}
                </Text>

                {filteredSummaries.map(summary => (
                    <View key={summary.id} style={styles.summaryCard}>
                        <View style={styles.summaryCardHeader}>
                            <Text style={styles.summaryTitle}>{summary.title}</Text>
                            <Text style={styles.summaryDate}>
                                {new Date(summary.createdAt).toLocaleDateString()}
                            </Text>
                        </View>

                        <View style={styles.summaryTags}>
                            {summary.tags.map(tag => (
                                <Text key={tag.id} style={[styles.summaryTag, { color: tag.color }]}>{tag.name}</Text>
                            ))}
                        </View>

                        <Text style={styles.summaryPreview} numberOfLines={3}>{summary.summary}</Text>

                        <View style={styles.summaryActions}>
                            <TouchableOpacity style={styles.summaryAction} onPress={() => setShowSummaryDetail(summary)}>
                                <Ionicons name="eye-outline" size={18} color="#3B82F6" />
                                <Text style={styles.summaryActionText}>View</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.summaryAction} onPress={() => {
                                // Direct download without dialog
                                const safeTitle = summary.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30) || 'Summary';
                                const dateStr = new Date(summary.createdAt).toLocaleDateString('en-IN');
                                const content = `${summary.title}\n\nGenerated: ${dateStr}\n\n${'='.repeat(50)}\n\n${summary.summary}\n\n${'='.repeat(50)}\n\nGenerated by PrepAssist AI Notes`;

                                try {
                                    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${safeTitle}.txt`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                } catch (e) {
                                    console.error('Download error:', e);
                                }
                            }}>
                                <Ionicons name="document-text-outline" size={18} color="#10B981" />
                                <Text style={[styles.summaryActionText, { color: '#10B981' }]}>TXT</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.summaryAction} onPress={() => {
                                // Direct PDF via print
                                const s = summary;
                                const dateStr = new Date(s.createdAt).toLocaleDateString('en-IN');
                                const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${s.title}</title><style>
body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:0 auto;line-height:1.8;color:#222;}
h1{color:#1a365d;border-bottom:3px solid #3b82f6;padding-bottom:12px;}
.date{color:#666;font-size:12px;margin-bottom:20px;}
.content{white-space:pre-wrap;}
.footer{margin-top:40px;text-align:center;color:#999;font-size:10px;border-top:1px solid #ddd;padding-top:15px;}
@media print{body{padding:20px;}}
</style></head><body>
<h1>${s.title}</h1>
<p class="date">Generated: ${dateStr}</p>
<div class="content">${s.summary}</div>
<p class="footer">Generated by PrepAssist AI Notes Maker</p>
</body></html>`;
                                const w = window.open('', '_blank');
                                if (w) {
                                    w.document.write(html);
                                    w.document.close();
                                    setTimeout(() => w.print(), 500);
                                }
                            }}>
                                <Ionicons name="print-outline" size={18} color="#F59E0B" />
                                <Text style={[styles.summaryActionText, { color: '#F59E0B' }]}>PDF</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.summaryAction} onPress={() => handleShareSummary(summary)}>
                                <Ionicons name="share-outline" size={18} color="#8B5CF6" />
                                <Text style={[styles.summaryActionText, { color: '#8B5CF6' }]}>Share</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.summaryAction} onPress={() => handleDeleteSummary(summary.id)}>
                                <Ionicons name="trash-outline" size={18} color="#D97706" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                {filteredSummaries.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="sparkles-outline" size={48} color="#CBD5E1" />
                        <Text style={styles.emptyStateTitle}>
                            {searchQuery || filterTagId ? 'No Matching Summaries' : 'No Summaries Yet'}
                        </Text>
                        <Text style={styles.emptyStateText}>
                            {searchQuery || filterTagId
                                ? 'Try a different search or filter'
                                : 'Generate AI summaries by combining notes with matching hashtags'}
                        </Text>
                    </View>
                )}
            </ScrollView>
        );
    };

    // ========== MODALS ==========

    // Create Tag Modal
    const renderCreateTagModal = () => (
        <Modal visible={showCreateTag} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Create Hashtag</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="#MughalHistory"
                        value={newTagName}
                        onChangeText={setNewTagName}
                        autoCapitalize="none"
                    />

                    <Text style={styles.inputLabel}>Color</Text>
                    <View style={styles.colorPicker}>
                        {['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'].map(color => (
                            <TouchableOpacity
                                key={color}
                                style={[
                                    styles.colorOption,
                                    { backgroundColor: color },
                                    newTagColor === color && styles.colorOptionSelected
                                ]}
                                onPress={() => setNewTagColor(color)}
                            />
                        ))}
                    </View>

                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowCreateTag(false)}>
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleCreateTag}>
                            <Text style={styles.modalConfirmText}>Create</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    // Note Editor Modal
    const renderNoteEditorModal = () => (
        <Modal visible={showNoteEditor} animationType="slide">
            <SafeAreaView style={styles.editorContainer}>
                <View style={styles.editorHeader}>
                    <TouchableOpacity onPress={() => setShowNoteEditor(false)}>
                        <Ionicons name="close" size={24} color="#64748B" />
                    </TouchableOpacity>
                    <Text style={styles.editorTitle}>{editingNote ? 'Edit Note' : 'Add Note'}</Text>
                    <TouchableOpacity onPress={handleSaveNote}>
                        <Text style={styles.saveBtn}>Save</Text>
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        style={styles.editorBody}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Section 1: Title View */}
                        <View style={styles.editorSectionCard}>
                            <View style={styles.sectionHeader}>

                                <Text style={styles.sectionLabel}>NOTE TITLE</Text>
                            </View>
                            <TextInput
                                style={styles.premiumTitleInput}
                                placeholder="What's this note about?"
                                placeholderTextColor="#94A3B8"
                                value={noteTitle}
                                onChangeText={setNoteTitle}
                            />
                        </View>

                        {/* Section 2: Remaining Content View */}
                        <View style={styles.editorSectionCard}>
                            {/* Source Type Section */}
                            <View style={styles.sectionSubGroup}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="link-outline" size={18} color="#64748B" />
                                    <Text style={styles.sectionLabel}>SOURCE TYPE</Text>
                                </View>
                                <View style={styles.sourceTypeSelector}>
                                    {Object.entries(SOURCE_TYPES).map(([key, config]) => (
                                        <TouchableOpacity
                                            key={key}
                                            style={[
                                                styles.sourceTypeBtn,
                                                noteSourceType === key && { backgroundColor: config.color, borderColor: config.color }
                                            ]}
                                            onPress={() => setNoteSourceType(key as SourceType)}
                                        >
                                            <Ionicons
                                                name={config.icon as any}
                                                size={16}
                                                color={noteSourceType === key ? '#FFF' : config.color}
                                            />
                                            <Text style={[
                                                styles.sourceTypeBtnText,
                                                noteSourceType === key && { color: '#FFF' }
                                            ]}>{config.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {noteSourceType !== 'manual' && (
                                    <TextInput
                                        style={styles.sourceUrlInput}
                                        placeholder="Paste source URL here (optional)"
                                        placeholderTextColor="#94A3B8"
                                        value={noteSourceUrl}
                                        onChangeText={setNoteSourceUrl}
                                        autoCapitalize="none"
                                        keyboardType="url"
                                    />
                                )}
                            </View>

                            <View style={styles.divider} />

                            {/* Tags Section */}
                            <View style={styles.sectionSubGroup}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="pricetag-outline" size={18} color="#64748B" />
                                    <Text style={styles.sectionLabel}>HASHTAGS *</Text>
                                </View>
                                <View style={styles.tagSelector}>
                                    {tags.map(tag => (
                                        <TouchableOpacity
                                            key={tag.id}
                                            style={[
                                                styles.tagSelectorItem,
                                                selectedTagIds.includes(tag.id) && { backgroundColor: tag.color + '20', borderColor: tag.color }
                                            ]}
                                            onPress={() => toggleTagSelection(tag.id)}
                                        >
                                            <Text style={[styles.tagSelectorText, { color: tag.color }]}>
                                                {tag.name.replace(/^#+/, '')}
                                            </Text>
                                            {selectedTagIds.includes(tag.id) && (
                                                <Ionicons name="checkmark-circle" size={14} color={tag.color} />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                    <TouchableOpacity
                                        style={styles.addTagSmallBtn}
                                        onPress={() => setShowCreateTag(true)}
                                    >
                                        <Ionicons name="add" size={16} color="#3B82F6" />
                                        <Text style={styles.addTagSmallText}>New Tag</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            {/* Note Content Section */}
                            <View style={styles.sectionSubGroup}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="create-outline" size={18} color="#64748B" />
                                    <Text style={styles.sectionLabel}>NOTE CONTENT</Text>
                                </View>
                                <TextInput
                                    style={styles.premiumContentInput}
                                    placeholder="Paste or type your notes here... 
You can copy content from Vision IAS, IASBaba, PDFs, or your own materials."
                                    placeholderTextColor="#94A3B8"
                                    value={noteContent}
                                    onChangeText={setNoteContent}
                                    multiline
                                    numberOfLines={12}
                                    textAlignVertical="top"
                                    selectTextOnFocus={true}
                                    blurOnSubmit={false}
                                />
                            </View>

                            {/* AI Summarization Feature (Inside the second card) */}
                            <View style={styles.aiSummarizationGroup}>
                                <View style={styles.aiSummarizationHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Ionicons name="sparkles" size={18} color="#8B5CF6" />
                                        <Text style={styles.aiSummarizationTitle}>AI Summarization</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[
                                            styles.summarizeBtn,
                                            (!noteContent.trim() || generating) && { opacity: 0.5 }
                                        ]}
                                        onPress={handleGenerateNoteSummary}
                                        disabled={!noteContent.trim() || generating}
                                    >
                                        {generating && generatingStatus === 'Summarizing...' ? (
                                            <ActivityIndicator size="small" color="#FFF" />
                                        ) : (
                                            <>
                                                <Ionicons name="flash" size={16} color="#FFF" />
                                                <Text style={styles.summarizeBtnText}>Summarize</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>

                                {noteSummary ? (
                                    <View style={styles.summaryResultBox}>
                                        <Text style={styles.summaryResultTitle}>Summary:</Text>
                                        <Text style={styles.summaryResultText}>{noteSummary}</Text>
                                        <TouchableOpacity
                                            style={styles.clearSummaryBtn}
                                            onPress={() => setNoteSummary('')}
                                        >
                                            <Text style={styles.clearSummaryBtnText}>Clear Summary</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.summaryPlaceholder}>
                                        <Text style={styles.summaryPlaceholderText}>
                                            Click summarize to generate AI bullet points based on your content.
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        <AIDisclaimer style={{ paddingHorizontal: 16, marginTop: 2, marginVertical: 2 }} />
                        <StorageNotice style={{ paddingHorizontal: 16, marginTop: 8, marginVertical: 2 }} />
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );

    // Summary Generator Modal with Note Selection
    const renderSummaryModal = () => (
        <Modal visible={showSummaryModal} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { maxHeight: '90%', width: isWeb ? Math.min(width * 0.9, 700) : '95%' }]}>
                    <Text style={styles.modalTitle}>
                        {summaryStep === 'select-notes' ? ' Select Content to Summarize' : '⚡ Configure Summary'}
                    </Text>

                    {summaryStep === 'select-notes' ? (
                        <ScrollView style={{ maxHeight: 500 }}>
                            {/* My Notes Section */}
                            <View style={{ marginBottom: 20 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <Text style={[styles.inputLabel, { marginBottom: 0 }]}> Your Notes ({notes.length})</Text>
                                    <TouchableOpacity onPress={selectAllNotes} style={{ padding: 5 }}>
                                        <Text style={{ color: '#3B82F6', fontSize: 12 }}>Select All</Text>
                                    </TouchableOpacity>
                                </View>

                                {notes.length === 0 ? (
                                    <View style={{ padding: 20, backgroundColor: '#F8FAFC', borderRadius: 10, alignItems: 'center' }}>
                                        <Ionicons name="document-outline" size={32} color="#94A3B8" />
                                        <Text style={{ color: '#64748B', marginTop: 10 }}>No notes yet. Add notes first!</Text>
                                    </View>
                                ) : (
                                    notes.map(note => (
                                        <TouchableOpacity
                                            key={note.id}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                padding: 12,
                                                backgroundColor: selectedNoteIds.includes(note.id) ? '#EFF6FF' : '#F8FAFC',
                                                borderRadius: 10,
                                                marginBottom: 8,
                                                borderWidth: selectedNoteIds.includes(note.id) ? 2 : 1,
                                                borderColor: selectedNoteIds.includes(note.id) ? '#3B82F6' : '#E2E8F0',
                                            }}
                                            onPress={() => toggleNoteSelection(note.id)}
                                        >
                                            <View style={{
                                                width: 24, height: 24, borderRadius: 6,
                                                backgroundColor: selectedNoteIds.includes(note.id) ? '#3B82F6' : '#E2E8F0',
                                                justifyContent: 'center', alignItems: 'center', marginRight: 12
                                            }}>
                                                {selectedNoteIds.includes(note.id) && <Ionicons name="checkmark" size={16} color="#FFF" />}
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontWeight: '600', color: '#0F172A', marginBottom: 2 }} numberOfLines={1}>
                                                    {note.title}
                                                </Text>
                                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                                                    <Text style={{
                                                        fontSize: 10, color: SOURCE_TYPES[note.sourceType as SourceType]?.color || '#64748B',
                                                        backgroundColor: (SOURCE_TYPES[note.sourceType as SourceType]?.color || '#64748B') + '20',
                                                        paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4
                                                    }}>
                                                        {SOURCE_TYPES[note.sourceType as SourceType]?.label || 'Note'}
                                                    </Text>
                                                    {note.tags.slice(0, 2).map(t => (
                                                        <Text key={t.id} style={{
                                                            fontSize: 10, color: t.color,
                                                            backgroundColor: t.color + '20',
                                                            paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4
                                                        }}>{t.name.replace(/^#+/, '')}</Text>
                                                    ))}
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </View>

                            {/* Current Affairs Section */}
                            <View style={{ marginBottom: 20 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <Text style={[styles.inputLabel, { marginBottom: 0 }]}> Current Affairs ({currentAffairs.length})</Text>
                                    <TouchableOpacity onPress={selectAllArticles} style={{ padding: 5 }}>
                                        <Text style={{ color: '#10B981', fontSize: 12 }}>Select All</Text>
                                    </TouchableOpacity>
                                </View>

                                {loadingArticles ? (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <ActivityIndicator color="#10B981" />
                                        <Text style={{ color: '#64748B', marginTop: 10 }}>Loading Current Affairs...</Text>
                                    </View>
                                ) : currentAffairs.length === 0 ? (
                                    <View style={{ padding: 20, backgroundColor: '#F8FAFC', borderRadius: 10, alignItems: 'center' }}>
                                        <Ionicons name="newspaper-outline" size={32} color="#94A3B8" />
                                        <Text style={{ color: '#64748B', marginTop: 10 }}>No current affairs available</Text>
                                    </View>
                                ) : (
                                    currentAffairs.map(article => (
                                        <TouchableOpacity
                                            key={article.id}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                padding: 12,
                                                backgroundColor: selectedArticleIds.includes(article.id) ? '#ECFDF5' : '#F8FAFC',
                                                borderRadius: 10,
                                                marginBottom: 8,
                                                borderWidth: selectedArticleIds.includes(article.id) ? 2 : 1,
                                                borderColor: selectedArticleIds.includes(article.id) ? '#10B981' : '#E2E8F0',
                                            }}
                                            onPress={() => toggleArticleSelection(article.id)}
                                        >
                                            <View style={{
                                                width: 24, height: 24, borderRadius: 6,
                                                backgroundColor: selectedArticleIds.includes(article.id) ? '#10B981' : '#E2E8F0',
                                                justifyContent: 'center', alignItems: 'center', marginRight: 12
                                            }}>
                                                {selectedArticleIds.includes(article.id) && <Ionicons name="checkmark" size={16} color="#FFF" />}
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontWeight: '600', color: '#0F172A', marginBottom: 2 }} numberOfLines={2}>
                                                    {article.title}
                                                </Text>
                                                <Text style={{ fontSize: 11, color: '#64748B' }}>
                                                    {article.source} • {new Date(article.date).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </View>

                            {/* Selection Summary */}
                            <View style={{
                                backgroundColor: '#F0FDF4', padding: 15, borderRadius: 10, marginBottom: 10,
                                borderWidth: 1, borderColor: '#BBF7D0'
                            }}>
                                <Text style={{ fontWeight: '600', color: '#166534', marginBottom: 5 }}> Selected Content</Text>
                                <Text style={{ color: '#15803D' }}>
                                    {selectedNoteIds.length} notes + {selectedArticleIds.length} current affairs articles
                                </Text>
                            </View>

                            {/* Custom Prompt */}
                            <Text style={styles.inputLabel}>Custom Instructions (optional)</Text>
                            <TextInput
                                style={[styles.input, { height: 60 }]}
                                placeholder="E.g., Focus on UPSC Prelims relevant points, include dates and facts"
                                value={customPrompt}
                                onChangeText={setCustomPrompt}
                                multiline
                            />
                        </ScrollView>
                    ) : null}

                    {generating && (
                        <View style={{ padding: 30, alignItems: 'center' }}>
                            <ActivityIndicator color="#3B82F6" size="large" />
                            <Text style={{ color: '#3B82F6', marginTop: 15, fontWeight: '600' }}>{generatingStatus}</Text>
                            <Text style={{ color: '#64748B', marginTop: 5, fontSize: 12 }}>This may take a minute...</Text>
                        </View>
                    )}

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={styles.modalCancelBtn}
                            onPress={() => setShowSummaryModal(false)}
                            disabled={generating}
                        >
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.modalConfirmBtn,
                                (generating || (selectedNoteIds.length === 0 && selectedArticleIds.length === 0)) && { opacity: 0.5 }
                            ]}
                            onPress={handleGenerateSummary}
                            disabled={generating || (selectedNoteIds.length === 0 && selectedArticleIds.length === 0)}
                        >
                            {generating ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="sparkles" size={18} color="#FFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.modalConfirmText}>Generate AI Summary</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    // Summary Detail Modal
    const renderSummaryDetailModal = () => {
        if (!showSummaryDetail) return null;

        return (
            <Modal visible={true} animationType="slide">
                <SafeAreaView style={styles.detailContainer}>
                    <View style={styles.detailHeader}>
                        <TouchableOpacity onPress={() => setShowSummaryDetail(null)}>
                            <Ionicons name="arrow-back" size={24} color="#0F172A" />
                        </TouchableOpacity>
                        <Text style={styles.detailTitle} numberOfLines={1}>{showSummaryDetail.title}</Text>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity onPress={() => {
                                const s = showSummaryDetail;
                                const safeTitle = s.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30) || 'Summary';
                                const dateStr = new Date(s.createdAt).toLocaleDateString('en-IN');
                                const content = `${s.title}\n\nGenerated: ${dateStr}\n\n${'='.repeat(50)}\n\n${s.summary}\n\n${'='.repeat(50)}\n\nGenerated by PrepAssist AI Notes`;
                                try {
                                    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${safeTitle}.txt`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                } catch (e) { console.error(e); }
                            }}>
                                <Ionicons name="document-text-outline" size={24} color="#10B981" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => {
                                const s = showSummaryDetail;
                                const dateStr = new Date(s.createdAt).toLocaleDateString('en-IN');
                                const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${s.title}</title><style>
body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:0 auto;line-height:1.8;color:#222;}
h1{color:#1a365d;border-bottom:3px solid #3b82f6;padding-bottom:12px;}
.date{color:#666;font-size:12px;margin-bottom:20px;}
.content{white-space:pre-wrap;}
.footer{margin-top:40px;text-align:center;color:#999;font-size:10px;border-top:1px solid #ddd;padding-top:15px;}
@media print{body{padding:20px;}}
</style></head><body>
<h1>${s.title}</h1>
<p class="date">Generated: ${dateStr}</p>
<div class="content">${s.summary}</div>
<p class="footer">Generated by PrepAssist AI Notes Maker</p>
</body></html>`;
                                const w = window.open('', '_blank');
                                if (w) {
                                    w.document.write(html);
                                    w.document.close();
                                    setTimeout(() => w.print(), 500);
                                }
                            }}>
                                <Ionicons name="print-outline" size={24} color="#F59E0B" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView style={styles.detailBody}>
                        <View style={styles.detailTags}>
                            {showSummaryDetail.tags.map(tag => (
                                <Text key={tag.id} style={[styles.detailTag, { color: tag.color }]}>{tag.name}</Text>
                            ))}
                        </View>

                        <Text style={styles.detailDate}>
                            Generated on {new Date(showSummaryDetail.createdAt).toLocaleString()}
                        </Text>

                        <Text style={styles.detailContent}>{showSummaryDetail.summary}</Text>

                        {showSummaryDetail.sources && showSummaryDetail.sources.length > 0 && (
                            <View style={styles.detailSources}>
                                <Text style={styles.detailSourcesTitle}>Sources Used:</Text>
                                {showSummaryDetail.sources.map((source, i) => (
                                    <Text key={i} style={styles.detailSource}>• {source.noteTitle}</Text>
                                ))}
                            </View>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        );
    };

    // ========== MAIN RENDER ==========
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>AI Notes Maker</Text>
                    <Text style={styles.headerSubtitle}>Organize & Summarize by Hashtags</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                        onPress={() => setShowNotifications(true)}
                        style={{ marginRight: 15, position: 'relative' }}
                    >
                        <Ionicons
                            name={newsMatches.length > 0 ? "notifications" : "notifications-outline"}
                            size={24}
                            color={newsMatches.length > 0 ? "#F59E0B" : "#64748B"}
                        />
                        {newsMatches.length > 0 && (
                            <View style={{
                                position: 'absolute',
                                top: -5,
                                right: -5,
                                backgroundColor: '#EF4444',
                                borderRadius: 10,
                                minWidth: 16,
                                height: 16,
                                justifyContent: 'center',
                                alignItems: 'center',
                                paddingHorizontal: 3,
                                borderWidth: 1.5,
                                borderColor: '#FFF'
                            }}>
                                <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '700' }}>
                                    {newsMatches.length}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={loadData} style={styles.refreshBtn}>
                        <Ionicons name="refresh" size={22} color="#64748B" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* DAP Onboarding Overlay */}
            {showOnboarding && (
                <View style={styles.onboardingOverlay} pointerEvents="box-none">
                    <Animated.View style={[
                        styles.onboardingCard,
                        {
                            opacity: onboardingFade,
                            transform: [{ translateY: onboardingTranslate }],
                            backgroundColor: theme.colors.surface || '#FFF'
                        }
                    ]}>
                        <LinearGradient
                            colors={['#3B82F6', '#2563EB']}
                            style={styles.onboardingHeaderStrip}
                        />
                        <View style={styles.onboardingContent}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                <Text style={[styles.onboardingTitle, { color: theme.colors.text || '#0F172A', flex: 1 }]}>
                                    {onboardingSteps[onboardingStep].title}
                                </Text>
                                <TouchableOpacity onPress={skipOnboarding} style={{ padding: 4 }}>
                                    <Ionicons name="close" size={24} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.onboardingText, { color: theme.colors.textSecondary || '#64748B' }]}>
                                {onboardingSteps[onboardingStep].text}
                            </Text>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <TouchableOpacity
                                    style={styles.onboardingButton}
                                    onPress={nextOnboardingStep}
                                >
                                    <Text style={styles.onboardingButtonText}>
                                        {onboardingSteps[onboardingStep].buttonText}
                                    </Text>
                                    <Ionicons name="arrow-forward" size={16} color="#FFF" />
                                </TouchableOpacity>

                                <Text style={{ fontSize: 13, color: '#94A3B8', fontWeight: '700' }}>
                                    {onboardingStep + 1} / {onboardingSteps.length}
                                </Text>
                            </View>
                        </View>

                        {/* Pulse indicator */}
                        <View style={styles.pulseContainer}>
                            <View style={styles.pulseDot} />
                            <View style={styles.pulseRing} />
                        </View>
                    </Animated.View>
                </View>
            )}

            {/* AI Disclaimers & Storage Notice */}
            <View style={{ paddingHorizontal: 16, marginTop: 2 }}>
                <AIDisclaimer style={{ marginVertical: 3 }} />
                <StorageNotice style={{ marginTop: 3, marginVertical: 3 }} />
            </View>

            {/* Notifications Modal */}
            <Modal
                visible={showNotifications}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowNotifications(false)}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'flex-end',
                }}>
                    <View style={{
                        backgroundColor: '#FFFFFF',
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        padding: 20,
                        maxHeight: '80%',
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 8,
                        }}>
                            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F2937' }}>
                                {newsMatches.length > 0 ? `News Matches (${newsMatches.length})` : 'News Notifications'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowNotifications(false)}>
                                <Ionicons name="close" size={24} color="#1F2937" />
                            </TouchableOpacity>
                        </View>
                        <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
                            Current affairs related to your saved hashtags
                        </Text>

                        {newsMatches.length > 0 ? (
                            <FlatList
                                data={newsMatches}
                                keyExtractor={(item) => item.articleId.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: '#F9FAFB',
                                            padding: 12,
                                            borderRadius: 12,
                                            marginBottom: 12,
                                            borderWidth: 1,
                                            borderColor: '#F3F4F6',
                                        }}
                                        onPress={() => {
                                            setShowNotifications(false);
                                            navigation.navigate('ArticleDetailScreen', { articleId: item.articleId });
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 }}>
                                            <Ionicons name="newspaper-outline" size={16} color="#3B82F6" />
                                            <Text style={{ fontSize: 12, color: '#3B82F6', fontWeight: '600' }}>
                                                {item.matchReason}
                                            </Text>
                                        </View>
                                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 6 }} numberOfLines={2}>
                                            {item.articleTitle}
                                        </Text>
                                        <Text style={{ fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>
                                            <Ionicons name="pricetag-outline" size={12} color="#6B7280" /> Matched Tag: {item.matchedTag}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                contentContainerStyle={{ paddingBottom: 20 }}
                            />
                        ) : (
                            <View style={{ alignItems: 'center', padding: 40 }}>
                                <Ionicons name="checkmark-circle-outline" size={64} color="#10B981" />
                                <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937', marginTop: 12 }}>All Caught Up!</Text>
                                <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8 }}>
                                    No new matches found between your hashtags and recent news articles.
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Premium Dashboard Card (Visible if low credits < 50) */}
            <LowCreditBanner isDark={isDark} />

            {/* Stats Bar */}
            <View style={styles.statsBar}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{tags.length}</Text>
                    <Text style={styles.statLabel}>Tags</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{notes.length}</Text>
                    <Text style={styles.statLabel}>Notes</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{summaries.length}</Text>
                    <Text style={styles.statLabel}>Summaries</Text>
                </View>
            </View>

            {/* Tab Bar */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'topics' && styles.activeTab]}
                    onPress={() => setActiveTab('topics')}
                >
                    <Ionicons name="pricetags" size={20} color={activeTab === 'topics' ? '#3B82F6' : '#64748B'} />
                    <Text style={[styles.tabText, activeTab === 'topics' && styles.activeTabText]}>Topics</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'notes' && styles.activeTab]}
                    onPress={() => setActiveTab('notes')}
                >
                    <Ionicons name="documents" size={20} color={activeTab === 'notes' ? '#3B82F6' : '#64748B'} />
                    <Text style={[styles.tabText, activeTab === 'notes' && styles.activeTabText]}>Notes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'summaries' && styles.activeTab]}
                    onPress={() => setActiveTab('summaries')}
                >
                    <Ionicons name="sparkles" size={20} color={activeTab === 'summaries' ? '#3B82F6' : '#64748B'} />
                    <Text style={[styles.tabText, activeTab === 'summaries' && styles.activeTabText]}>Summaries</Text>
                </TouchableOpacity>
            </View>

            {/* Tab Content */}
            {activeTab === 'topics' && renderTopicsTab()}
            {activeTab === 'notes' && renderNotesTab()}
            {activeTab === 'summaries' && renderSummariesTab()}

            {/* Modals */}
            {renderCreateTagModal()}
            {renderNoteEditorModal()}
            {renderSummaryModal()}
            {renderSummaryDetailModal()}
            {/* AI Insight Support Modal */}
            <InsightSupportModal
                visible={showInsightSupport}
                onClose={() => setShowInsightSupport(false)}
                onCheckCredits={checkCreditBalance}
            />

            {/* Paywall Popup */}
            <PayWallPopup
                visible={showPaywall}
                onClose={() => setShowPaywall(false)}
            />

            {/* Floating AI Support Button */}
            <TouchableOpacity
                style={[styles.floatingAiButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setShowInsightSupport(true)}
            >
                <LinearGradient
                    colors={[theme.colors.primary, theme.colors.primary + 'CC']}
                    style={styles.floatingAiGradient}
                >
                    <Ionicons name="sparkles" size={24} color="#FFF" />
                    {(aiInsightStatus === 'updates' || newsMatches.length > 0) && <View style={styles.aiBadge} />}
                </LinearGradient>
            </TouchableOpacity>

        </SafeAreaView >
    );
};

// ========== STYLES ==========
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#64748B',
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0F172A',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    refreshBtn: {
        padding: 8,
    },

    // Stats Bar
    statsBar: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
    },
    statLabel: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },

    // Tab Bar
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 6,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#3B82F6',
    },
    tabText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#3B82F6',
        fontWeight: '600',
    },

    // Tab Content
    tabContent: {
        flex: 1,
        padding: 16,
    },

    // Alerts
    alertsSection: {
        backgroundColor: '#FEF3C7',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    alertsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    alertsTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#92400E',
    },
    alertsSubtext: {
        fontSize: 13,
        color: '#A16207',
        marginTop: 4,
    },


    // Create Tag Button
    createTagBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#EFF6FF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#BFDBFE',
        borderStyle: 'dashed',
    },
    createTagBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#3B82F6',
    },

    // Tags Grid
    tagsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10,
    },
    tagCard: {
        width: '48.5%',
        borderRadius: 24, // Pill-shaped geometry
        borderWidth: 2,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
        overflow: 'hidden',
        flexDirection: 'row',
        position: 'relative',
    },
    mirrorIcon: {
        position: 'absolute',
        right: -20,
        bottom: -20,
        transform: [{ rotate: '-15deg' }],
    },
    tagCardAccent: {
        width: 4,
        height: '100%',
    },
    tagCardContent: {
        flex: 1,
        padding: 12,
    },
    tagIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tagCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    alertBadge: {
        backgroundColor: '#EF4444',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 3,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },
    alertBadgeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '800',
    },
    tagName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
        marginTop: 4,
    },
    tagNoteCountContainer: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginTop: 6,
    },
    tagNoteCount: {
        fontSize: 11,
        fontWeight: '700',
    },
    sourceBreakdown: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.05)',
    },
    sourceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
    },
    sourceBadgeText: {
        fontSize: 10,
        fontWeight: '600',
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 16,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 32,
    },

    // Active Filter
    activeFilter: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
    },
    activeFilterLabel: {
        fontSize: 13,
        color: '#64748B',
    },
    filterTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 16,
    },
    filterTagText: {
        fontSize: 13,
        fontWeight: '500',
    },
    clearFilterText: {
        fontSize: 13,
        color: '#D97706',
        fontWeight: '500',
    },

    // Add Note Button
    addNoteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#3B82F6',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    addNoteBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },

    // Source Filter
    sourceFilter: {
        marginBottom: 16,
    },
    sourceFilterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginRight: 8,
        backgroundColor: '#FFF',
    },
    sourceFilterText: {
        fontSize: 13,
        fontWeight: '500',
    },

    // Note Card
    // Premium Note Card Styles
    premiumNoteCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
        // Desktop glass effect
        ...(Platform.OS === 'web' ? {
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
        } : {}),
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    noteCardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    sourceBadgeTiny: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    sourceBadgeTinyText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    noteCardDate: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
    },
    noteCardMainContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    noteCardHeaderFixed: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    premiumNoteTitle: {
        flex: 1,
        fontSize: 17,
        fontWeight: '700',
        color: '#1E293B',
        letterSpacing: -0.3,
    },
    deleteNoteBtnSmall: {
        padding: 4,
        marginLeft: 8,
    },
    premiumNotePreview: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 22,
        marginBottom: 12,
    },
    premiumSummaryPreview: {
        flexDirection: 'row',
        gap: 10,
        backgroundColor: '#F5F3FF',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EDE9FE',
        marginBottom: 12,
    },
    premiumSummaryText: {
        flex: 1,
        fontSize: 13,
        color: '#6D28D9',
        lineHeight: 18,
        fontWeight: '500',
    },
    noteCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    noteCardTagsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 6,
    },
    tinyTag: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    tinyTagText: {
        fontSize: 11,
        fontWeight: '600',
    },
    moreTagsTextSmall: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
    },

    // Generate Button
    generateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#8B5CF6',
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
    },
    generateBtnText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    generateBtnSubtext: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
    },

    // Section Title
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 14,
        letterSpacing: 0.2,
    },

    // Summary Card
    summaryCard: {
        backgroundColor: '#FFFFFF',
        padding: 0,
        borderRadius: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.06)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        overflow: 'hidden',
    },
    summaryCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 14,
        paddingBottom: 8,
        borderBottomWidth: 0,
        backgroundColor: 'rgba(59, 130, 246, 0.03)',
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        flex: 1,
        letterSpacing: 0.2,
    },
    summaryDate: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    summaryTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingHorizontal: 14,
        paddingBottom: 10,
    },
    summaryTag: {
        fontSize: 12,
        fontWeight: '600',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    summaryPreview: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 20,
        paddingHorizontal: 14,
        paddingBottom: 14,
    },
    summaryActions: {
        flexDirection: 'row',
        gap: 0,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.05)',
        paddingTop: 0,
    },
    summaryAction: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRightWidth: 1,
        borderRightColor: 'rgba(0, 0, 0, 0.05)',
    },
    summaryActionText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#3B82F6',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 20,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 20,
    },
    modalCancelBtn: {
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    modalCancelText: {
        fontSize: 15,
        color: '#64748B',
        fontWeight: '500',
    },
    modalConfirmBtn: {
        backgroundColor: '#3B82F6',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    modalConfirmText: {
        fontSize: 15,
        color: '#FFF',
        fontWeight: '600',
    },

    // Input
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#F1F5F9',
        borderRadius: 10,
        padding: 14,
        fontSize: 15,
        color: '#0F172A',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },

    // Color Picker
    colorPicker: {
        flexDirection: 'row',
        gap: 12,
    },
    colorOption: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    colorOptionSelected: {
        borderWidth: 3,
        borderColor: '#0F172A',
    },

    // Editor
    editorContainer: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    editorHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    editorTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0F172A',
    },
    saveBtn: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3B82F6',
    },
    editorBody: {
        flex: 1,
        padding: 16,
    },

    // Source Type Selector
    sourceTypeSelector: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    sourceTypeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFF',
    },
    sourceTypeBtnText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
    },

    // Tag Selector
    tagSelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tagSelectorItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFF',
    },
    tagSelectorText: {
        fontSize: 14,
        fontWeight: '500',
    },

    // Content Input
    contentInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: '#0F172A',
        minHeight: 250,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        lineHeight: 22,
    },

    // AI Summarization Styles
    aiSummarizationSection: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#F3E8FF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D8B4FE',
    },
    aiSummarizationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    aiSummarizationTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#7C3AED',
    },
    summarizeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#8B5CF6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    summarizeBtnText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
    },
    summaryPlaceholder: {
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 8,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#D8B4FE',
    },
    summaryPlaceholderText: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    summaryResultBox: {
        padding: 12,
        backgroundColor: '#FFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E9D5FF',
    },
    summaryResultTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#5B21B6',
        marginBottom: 6,
    },
    summaryResultText: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
    clearSummaryBtn: {
        marginTop: 10,
        alignSelf: 'flex-end',
    },
    clearSummaryBtnText: {
        fontSize: 12,
        color: '#D97706',
        fontWeight: '600',
    },

    // Premium Editor Styles
    editorSectionCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    sectionSubGroup: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        letterSpacing: 1,
    },
    premiumTitleInput: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    sourceUrlInput: {
        marginTop: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#334155',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginBottom: 20,
    },
    addTagSmallBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#3B82F6',
        backgroundColor: '#F0F7FF',
    },
    addTagSmallText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#3B82F6',
    },
    premiumContentInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: '#0F172A',
        minHeight: 300,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        lineHeight: 24,
        // Web fix for paste and selection
        ...(Platform.OS === 'web' ? {
            outlineStyle: 'none',
            userSelect: 'text',
            cursor: 'text',
            WebkitUserSelect: 'text',
            MozUserSelect: 'text',
            msUserSelect: 'text',
        } : {}) as any,
    },
    aiSummarizationGroup: {
        marginTop: 10,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },

    // Detail View
    detailContainer: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    detailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    detailTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#0F172A',
        marginHorizontal: 16,
    },
    detailBody: {
        flex: 1,
        padding: 20,
    },
    detailTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 12,
    },
    detailTag: {
        fontSize: 15,
        fontWeight: '600',
    },
    detailDate: {
        fontSize: 13,
        color: '#94A3B8',
        marginBottom: 20,
    },
    detailContent: {
        fontSize: 16,
        lineHeight: 26,
        color: '#334155',
    },
    detailSources: {
        marginTop: 32,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    detailSourcesTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 12,
    },
    detailSource: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 4,
    },
    floatingAiButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    floatingAiGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    aiBadge: {
        position: 'absolute',
        top: 14,
        right: 14,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#F59E0B',
        borderWidth: 1.5,
        borderColor: '#FFF',
    },

    // ONBOARDING STYLES
    onboardingOverlay: {
        position: 'absolute',
        bottom: 120,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 99999,
    },
    onboardingCard: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    onboardingHeaderStrip: {
        height: 6,
        width: '100%',
    },
    onboardingContent: {
        padding: 24,
    },
    onboardingTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 10,
        letterSpacing: -0.5,
    },
    onboardingText: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 20,
    },
    onboardingButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        alignSelf: 'flex-start',
    },
    onboardingButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 15,
    },
    pulseContainer: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 12,
        height: 12,
    },
    pulseDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#EF4444',
        position: 'absolute',
        zIndex: 2,
    },
    pulseRing: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#EF4444',
        position: 'absolute',
        zIndex: 1,
        transform: [{ scale: 2 }],
        opacity: 0.3,
    },
});

export default AINotesMakerScreen;
