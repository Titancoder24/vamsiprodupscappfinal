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
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../features/Reference/theme/ThemeContext';
import { InsightAgent, InsightStatus } from '../services/InsightAgent';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
    visible: boolean;
    onClose: () => void;
}

const TypingText: React.FC<{ text: string; style: any }> = ({ text, style }) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        setDisplayedText('');
        let index = 0;
        const interval = setInterval(() => {
            if (index < text.length) {
                setDisplayedText(prev => prev + text[index]);
                index++;
            } else {
                clearInterval(interval);
            }
        }, 15); // Fast typing
        return () => clearInterval(interval);
    }, [text]);

    return <Text style={style}>{displayedText}</Text>;
};

const InsightSupportModal: React.FC<Props> = ({ visible, onClose }) => {
    const { theme, isDark } = useTheme();
    const [status, setStatus] = useState<InsightStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const pulseOpacity = useRef(new Animated.Value(0.5)).current;

    const [internalVisible, setInternalVisible] = useState(visible);

    useEffect(() => {
        if (loading) {
            Animated.loop(
                Animated.parallel([
                    Animated.sequence([
                        Animated.timing(pulseAnim, { toValue: 2, duration: 1500, useNativeDriver: true }),
                        Animated.timing(pulseAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
                    ]),
                    Animated.sequence([
                        Animated.timing(pulseOpacity, { toValue: 0, duration: 1500, useNativeDriver: true }),
                        Animated.timing(pulseOpacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
                    ])
                ])
            ).start();
        }
    }, [loading]);

    useEffect(() => {
        if (visible) {
            setInternalVisible(true);
            Animated.spring(slideAnim, {
                toValue: SCREEN_HEIGHT * 0.1,
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
        }
    }, [visible]);

    const checkStatus = async () => {
        setLoading(true);
        const result = await InsightAgent.checkNoteStatus();
        setStatus(result);
        setLoading(false);
    };

    if (!internalVisible) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            onRequestClose={onClose}
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
                {/* Header - Modern Support Style */}
                <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                    <View style={styles.headerInfo}>
                        <View style={[styles.agentAvatar, { backgroundColor: theme.colors.primary }]}>
                            <Ionicons name="sparkles" size={20} color="#FFF" />
                        </View>
                        <View>
                            <Text style={[styles.agentName, { color: theme.colors.text }]}>PrepAssist AI</Text>
                            <Text style={[styles.agentStatus, { color: theme.colors.textSecondary }]}>
                                {loading ? 'Analyzing your notes...' : 'Online'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <View style={styles.radarContainer}>
                                <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }], opacity: pulseOpacity }]} />
                                <Ionicons name="scan" size={40} color={theme.colors.primary} />
                            </View>
                            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                                Knowledge Radar: Searching for news updates...
                            </Text>
                        </View>
                    ) : (
                        <View>
                            {/* Message Bubble Style */}
                            <View style={[styles.bubble, { backgroundColor: isDark ? '#2D2D30' : '#F0F0F5' }]}>
                                <TypingText
                                    text={status?.message || ''}
                                    style={[styles.bubbleText, { color: theme.colors.text }]}
                                />
                            </View>

                            {status?.status === 'updates_available' && (
                                <View style={styles.updateList}>
                                    <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                                        NEWS UPDATES FOR YOUR NOTES
                                    </Text>
                                    {status.updates.map((update, idx) => (
                                        <View
                                            key={idx}
                                            style={[styles.updateCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                                        >
                                            <View style={styles.updateCardHeader}>
                                                <Ionicons name="document-text" size={16} color={theme.colors.primary} />
                                                <Text style={[styles.noteTitle, { color: theme.colors.text }]} numberOfLines={1}>
                                                    Ref: {update.noteTitle}
                                                </Text>
                                            </View>
                                            <Text style={[styles.updateReason, { color: theme.colors.text }]}>
                                                {update.reason}
                                            </Text>
                                            <TouchableOpacity style={[styles.checkBtn, { backgroundColor: theme.colors.primary + '15' }]}>
                                                <Text style={[styles.checkBtnText, { color: theme.colors.primary }]}>Read New Update</Text>
                                                <Ionicons name="arrow-forward" size={14} color={theme.colors.primary} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {status?.status === 'ok' && (
                                <View style={styles.okContainer}>
                                    <View style={[styles.okCircle, { backgroundColor: '#10B98120' }]}>
                                        <Ionicons name="checkmark-circle" size={40} color="#10B981" />
                                    </View>
                                    <Text style={[styles.okText, { color: theme.colors.textSecondary }]}>
                                        Your notes are accurately aligned with current trends.
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>

                {/* Footer - Chat Input Style (Visual Only) */}
                <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
                    <View style={[styles.inputPlaceholder, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>
                        <Text style={{ color: theme.colors.textSecondary }}>Ask PrepAssist AI anything...</Text>
                        <Ionicons name="send" size={18} color={theme.colors.primary} />
                    </View>
                </View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: SCREEN_HEIGHT * 0.9,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 20,
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
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        textAlign: 'center',
        fontSize: 14,
    },
    bubble: {
        padding: 16,
        borderRadius: 16,
        borderTopLeftRadius: 4,
        maxWidth: '90%',
        marginBottom: 24,
    },
    bubbleText: {
        fontSize: 15,
        lineHeight: 22,
    },
    updateList: {
        gap: 16,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 8,
    },
    updateCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        gap: 10,
    },
    updateCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    noteTitle: {
        fontSize: 12,
        fontWeight: '600',
        flex: 1,
    },
    updateReason: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
    },
    checkBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    checkBtnText: {
        fontSize: 13,
        fontWeight: '600',
    },
    okContainer: {
        alignItems: 'center',
        padding: 40,
        gap: 16,
    },
    okCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    okText: {
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 20,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
    },
    inputPlaceholder: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
    },
    radarContainer: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    pulseCircle: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#3B82F6',
    },
});

export default InsightSupportModal;
