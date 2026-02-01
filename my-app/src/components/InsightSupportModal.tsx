import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Animated,
    Dimensions,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../features/Reference/theme/ThemeContext';
import { InsightAgent, InsightStatus } from '../services/InsightAgent';
const InsightSupportModal: React.FC<Props> = ({ visible, onClose }) => {
    const { theme, isDark } = useTheme();
    const [status, setStatus] = useState<InsightStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const [internalVisible, setInternalVisible] = useState(visible);

    useEffect(() => {
        if (visible) {
            setInternalVisible(true);
            Animated.spring(slideAnim, {
                toValue: 0, // Animate to natural position (0 offset)
                tension: 40,
                friction: 8,
                useNativeDriver: true,
            }).start();
            checkStatus();
        } else {
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                useNativeDriver: true,
            }).start(() => setInternalVisible(false));
            setMessages([]); // Reset chat
        }
    }, [visible]);

    const checkStatus = async () => {
        setLoading(true);
        try {
            const [aiResult, radarMatches] = await Promise.all([
                InsightAgent.checkNoteStatus(),
                checkNewsMatches()
            ]);
            setStatus(aiResult);
            setNewsMatches(radarMatches);

            // Initial AI Greeting based on Intelligence
            if (aiResult.status === 'updates_available' || radarMatches.length > 0) {
                setMessages([{
                    role: 'assistant',
                    content: `I found ${aiResult.updates.length + radarMatches.length} potential updates for your notes based on the latest news. Would you like me to explain them?`
                }]);
            } else {
                setMessages([{
                    role: 'assistant',
                    content: "Your notes look up-to-date! But I'm here if you have any questions about recent events."
                }]);
            }

        } catch (error) {
            console.error('[InsightModal] Failed to fetch intelligence:', error);
            setMessages([{ role: 'assistant', content: "I'm having trouble connecting to the Knowledge Radar. Please try again." }]);
        }
        setLoading(false);
    };

    const handleManualScan = () => {
        setMessages([{ role: 'user', content: "Scan my notes against the latest news." }]);
        checkStatus();
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMsg = inputText.trim();
        setInputText('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsTyping(true);

        try {
            // Context Aggregation
            const context = {
                updates: status?.updates || [],
                matches: newsMatches,
                summary: status?.message
            };

            const response = await InsightAgent.chatWithAgent(
                userMsg,
                messages.map(m => ({ role: m.role, content: m.content })),
                context
            );

            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I lost connection. Please try again." }]);
        } finally {
            setIsTyping(false);
        }
    };

    if (!internalVisible) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                enabled={Platform.OS !== 'web'}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={onClose}
                    style={styles.overlay}
                />
                <Animated.View
                    style={[
                        styles.modalContainer,
                        {
                            backgroundColor: theme.colors.background,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                        <View style={styles.headerInfo}>
                            <View style={[styles.agentAvatar, { backgroundColor: theme.colors.primary }]}>
                                <Ionicons name="chatbubbles" size={20} color="#FFF" />
                            </View>
                            <View>
                                <Text style={[styles.agentName, { color: theme.colors.text }]}>PrepAssist AI Chat</Text>
                                <Text style={[styles.agentStatus, { color: theme.colors.textSecondary }]}>
                                    {isTyping ? 'Typing...' : 'Online'}
                                </Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <TouchableOpacity
                                onPress={handleManualScan}
                                style={{
                                    backgroundColor: theme.colors.primary + '20',
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 20,
                                    flexDirection: 'row',
                                    gap: 6,
                                    alignItems: 'center'
                                }}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color={theme.colors.primary} />
                                ) : (
                                    <>
                                        <Ionicons name="scan-outline" size={16} color={theme.colors.primary} />
                                        <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.primary }}>Scan News</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Chat Content */}
                    <ScrollView
                        ref={scrollViewRef}
                        style={{ flex: 1 }}
                        contentContainerStyle={styles.scrollContent}
                        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                        showsVerticalScrollIndicator={false}
                    >
                        {loading && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={theme.colors.primary} />
                                <Text style={{ color: theme.colors.textSecondary }}>Scanning Knowledge Base...</Text>
                            </View>
                        )}

                        {/* Initial Status Cards (Only show once) */}
                        {!loading && messages.length <= 1 && status?.status === 'updates_available' && (
                            <View style={styles.updateList}>
                                {status.updates.map((update, idx) => (
                                    <View key={`ai-${idx}`} style={[styles.updateCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                                        <View style={styles.updateCardHeader}>
                                            <Ionicons name="bulb" size={16} color="#F59E0B" />
                                            <Text style={[styles.noteTitle, { color: theme.colors.text }]}>{update.noteTitle}</Text>
                                        </View>
                                        <Text style={[styles.updateReason, { color: theme.colors.textSecondary }]}>{update.reason}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {!loading && messages.map((msg, idx) => (
                            <View key={idx} style={{ marginBottom: 12 }}>
                                <View style={{ marginBottom: 4 }}>
                                    <Text style={{ fontSize: 10, color: theme.colors.textSecondary, alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                        {msg.role === 'user' ? 'You' : 'PrepAssist AI'}
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.bubble,
                                        msg.role === 'user'
                                            ? [styles.userBubble, { backgroundColor: theme.colors.primary }]
                                            : [styles.aiBubble, { backgroundColor: isDark ? '#2D2D30' : '#F0F0F5' }]
                                    ]}
                                >
                                    {msg.role === 'user' ? (
                                        <Text style={styles.userText}>{msg.content}</Text>
                                    ) : (
                                        <Text style={{ color: theme.colors.text, fontSize: 15, lineHeight: 22 }}>
                                            {msg.content}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        ))}

                        {isTyping && (
                            <View style={[styles.bubble, styles.aiBubble, { backgroundColor: isDark ? '#2D2D30' : '#F0F0F5', width: 60 }]}>
                                <ActivityIndicator size="small" color={theme.colors.textSecondary} />
                            </View>
                        )}

                    </ScrollView>

                    {/* Chat Input */}
                    <View style={[styles.footer, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
                        <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>
                            <TextInput
                                style={[styles.input, { color: theme.colors.text }]}
                                placeholder="Ask about news or your notes..."
                                placeholderTextColor={theme.colors.textSecondary}
                                value={inputText}
                                onChangeText={setInputText}
                                onSubmitEditing={handleSend}
                            />
                            <TouchableOpacity onPress={handleSend} disabled={!inputText.trim()}>
                                <Ionicons
                                    name="send"
                                    size={20}
                                    color={inputText.trim() ? theme.colors.primary : theme.colors.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
        flex: 1,
        marginTop: Platform.OS === 'web' ? SCREEN_HEIGHT * 0.15 : SCREEN_HEIGHT * 0.1,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        elevation: 20,
        // Web Specific Centering
        ...(Platform.OS === 'web' ? {
            width: '100%',
            maxWidth: 600,
            alignSelf: 'center',
            height: '85%',
            position: 'absolute',
            bottom: 0,
        } : {})
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    agentAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    agentName: {
        fontSize: 16,
        fontWeight: '700',
    },
    agentStatus: {
        fontSize: 12,
    },
    closeBtn: {
        padding: 4,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
        gap: 10,
    },
    bubble: {
        padding: 12,
        borderRadius: 16,
        maxWidth: '85%',
        marginBottom: 12,
    },
    userBubble: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        alignSelf: 'flex-start',
        borderTopLeftRadius: 4,
    },
    userText: {
        color: '#FFF',
        fontSize: 15,
    },
    updateList: {
        gap: 12,
        marginBottom: 24,
    },
    updateCard: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 6,
    },
    updateCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    noteTitle: {
        fontSize: 13,
        fontWeight: '600',
    },
    updateReason: {
        fontSize: 13,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        gap: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        maxHeight: 100,
    },
});

export default InsightSupportModal;
