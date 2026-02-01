/**
 * CREDITS BADGE COMPONENT
 * 
 * Displays credits in the header with:
 * - Credit count
 * - Plan badge (FREE/BASIC/PRO)
 * - Tap to navigate to billing
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../features/Reference/theme/ThemeContext';
import useCredits from '../hooks/useCredits';

interface CreditsBadgeProps {
    compact?: boolean;
}

export default function CreditsBadge({ compact = false }: CreditsBadgeProps) {
    const { theme, isDark } = useTheme();
    const navigation = useNavigation<any>();
    const { credits, planType, loading } = useCredits();

    const handlePress = () => {
        navigation.navigate('Billing');
    };

    const getPlanColor = () => {
        switch (planType) {
            case 'pro': return '#6366F1';
            case 'basic': return '#10B981';
            default: return '#6B7280';
        }
    };

    const getPlanLabel = () => {
        switch (planType) {
            case 'pro': return 'PRO';
            case 'basic': return 'BASIC';
            default: return 'FREE';
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, compact && styles.containerCompact, { backgroundColor: isDark ? '#1A1A2E' : '#F5F5F5' }]}>
                <ActivityIndicator size="small" color={isDark ? '#6366F1' : '#4F46E5'} />
            </View>
        );
    }

    if (compact) {
        return (
            <TouchableOpacity
                style={[styles.containerCompact, { backgroundColor: isDark ? '#1A1A2E' : '#F5F5F5', borderColor: isDark ? '#2A2A4E' : '#E8E8E8' }]}
                onPress={handlePress}
            >
                <Ionicons name="flash" size={14} color="#F59E0B" />
                <Text style={[styles.creditsTextCompact, { color: isDark ? '#FFF' : '#1A1A1A' }]}>
                    {credits}
                </Text>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF', borderColor: isDark ? '#2A2A4E' : '#E8E8E8' }]}
            onPress={handlePress}
        >
            <View style={styles.creditsSection}>
                <Ionicons name="flash" size={16} color="#F59E0B" />
                <Text style={[styles.creditsNumber, { color: isDark ? '#FFF' : '#1A1A1A' }]}>
                    {credits}
                </Text>
                <Text style={[styles.creditsLabel, { color: isDark ? '#666' : '#888' }]}>
                    credits
                </Text>
            </View>

            {/* CTA Button for low credits or free plan */}
            {(credits < 10 || planType === 'free') && (
                <View style={[styles.planBadge, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.planText}>+ GET CREDITS</Text>
                </View>
            )}

            {!(credits < 10 || planType === 'free') && (
                <View style={[styles.planBadge, { backgroundColor: getPlanColor() }]}>
                    <Text style={styles.planText}>{getPlanLabel()}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        gap: 10,
    },
    containerCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        gap: 4,
    },
    creditsSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    creditsNumber: {
        fontSize: 16,
        fontWeight: '700',
    },
    creditsLabel: {
        fontSize: 12,
    },
    creditsTextCompact: {
        fontSize: 14,
        fontWeight: '700',
    },
    planBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    planText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
    },
});
