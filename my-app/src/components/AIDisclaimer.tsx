import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AIDisclaimerProps {
    variant?: 'inline' | 'banner' | 'compact';
    style?: any;
}

/**
 * AI Disclaimer Component
 * Displays a professional disclaimer about AI-generated content
 */
export const AIDisclaimer: React.FC<AIDisclaimerProps> = ({
    variant = 'inline',
    style
}) => {
    const aiText = "This content is generated using artificial intelligence. While we strive for accuracy, AI may occasionally produce incorrect or incomplete information. Please verify critical details from authoritative sources.";

    if (variant === 'compact') {
        return (
            <View style={[styles.compactContainer, style]}>
                <Ionicons name="information-circle-outline" size={14} color="#64748B" />
                <Text style={styles.compactText}>{aiText}</Text>
            </View>
        );
    }

    if (variant === 'banner') {
        return (
            <View style={[styles.bannerContainer, style]}>
                <View style={styles.bannerIconContainer}>
                    <Ionicons name="sparkles" size={20} color="#D97706" />
                </View>
                <View style={styles.bannerContent}>
                    <Text style={styles.bannerTitle}>AI-Powered Content</Text>
                    <Text style={styles.bannerText}>{aiText}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.inlineContainer, style]}>
            <View style={styles.inlineHeader}>
                <Ionicons name="alert-circle-outline" size={18} color="#D97706" />
                <Text style={styles.inlineTitle}>AI Disclaimer</Text>
            </View>
            <Text style={styles.inlineText}>{aiText}</Text>
        </View>
    );
};

/**
 * Storage Notice Component
 * Specifically for data persistence warnings
 */
export const StorageNotice: React.FC<{ style?: any; variant?: 'inline' | 'compact' }> = ({
    style,
    variant = 'inline'
}) => {
    const storageWarning = "Your notes are stored locally on this device. Clearing browser data or cache will permanently delete all notes. Consider exporting important summaries regularly.";

    if (variant === 'compact') {
        return (
            <View style={[styles.storageNoticeCompact, style]}>
                <Ionicons name="save-outline" size={14} color="#B45309" />
                <Text style={styles.storageWarningTextCompact}>{storageWarning}</Text>
            </View>
        );
    }

    return (
        <View style={[styles.storageNoticeInline, style]}>
            <View style={styles.inlineHeader}>
                <Ionicons name="warning-outline" size={18} color="#D97706" />
                <Text style={styles.inlineTitle}>Local Storage Notice</Text>
            </View>
            <Text style={styles.storageWarningTextInline}>{storageWarning}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    // Compact variant
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    compactText: {
        fontSize: 11,
        color: '#64748B',
        lineHeight: 16,
    },

    // Banner variant (also used as default premium look)
    bannerContainer: {
        flexDirection: 'row',
        backgroundColor: '#ffffffff',
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 10,
        marginVertical: 2,
        borderWidth: 1,
        borderColor: '#bdbabaff',
    },
    bannerIconContainer: {
        marginRight: 12,
        marginTop: 2,
    },
    bannerContent: {
        flex: 1,
    },
    bannerTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#D97706',
        marginBottom: 2,
    },
    bannerText: {
        fontSize: 12,
        color: '#475569',
        lineHeight: 18,
    },

    // Inline variant (AI Disclaimer)
    inlineContainer: {
        backgroundColor: '#ffffffff',
        borderRadius: 10,
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginVertical: 2,
        borderWidth: 1,
        borderColor: '#bdbabaff',
    },
    inlineHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
    },
    inlineTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#D97706',
    },
    inlineText: {
        fontSize: 12,
        color: '#475569',
        lineHeight: 18,
    },

    // Storage Notice Specific Styles
    storageNoticeCompact: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#FFFBEB',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    storageWarningTextCompact: {
        flex: 1,
        fontSize: 11,
        color: '#92400E',
        fontWeight: '500',
        lineHeight: 16,
    },
    storageNoticeInline: {
        backgroundColor: '#FFFBEB',
        borderRadius: 10,
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginVertical: 2,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    storageWarningTextInline: {
        fontSize: 12,
        fontWeight: '500',
        color: '#92400E',
        lineHeight: 20,
    },
});

export default AIDisclaimer;
