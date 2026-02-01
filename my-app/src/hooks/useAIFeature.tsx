/**
 * AI FEATURE ACCESS CONTROL
 * 
 * Higher-order component and hook for gating AI features behind credits
 * - Checks if user has enough credits
 * - Deducts credits on feature use
 * - Shows buy credits prompt if insufficient
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import useCredits, { CREDIT_COSTS, FeatureType } from '../hooks/useCredits';

interface UseAIFeatureReturn {
    canUse: boolean;
    credits: number;
    cost: number;
    isChecking: boolean;
    executeWithCredits: (callback: () => Promise<void>) => Promise<boolean>;
    showInsufficientCreditsAlert: () => void;
}

/**
 * Hook for AI feature screens to manage credit checking and deduction
 */
export function useAIFeature(feature: FeatureType): UseAIFeatureReturn {
    const navigation = useNavigation<any>();
    const { credits, loading, hasEnoughCredits, useCredits: deductCredits } = useCredits();
    const [isChecking, setIsChecking] = useState(false);

    const cost = CREDIT_COSTS[feature];
    const canUse = hasEnoughCredits(feature);

    const showInsufficientCreditsAlert = () => {
        Alert.alert(
            '💳 Credits Required',
            `This feature costs ${cost} credits.\n\nYou have ${credits} credits available.\n\nPurchase credits to continue using AI features.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Buy Credits',
                    onPress: () => navigation.navigate('Billing')
                },
            ]
        );
    };

    /**
     * Execute a callback only if user has enough credits
     * Deducts credits before execution
     */
    const executeWithCredits = async (callback: () => Promise<void>): Promise<boolean> => {
        if (!canUse) {
            showInsufficientCreditsAlert();
            return false;
        }

        setIsChecking(true);

        try {
            // Deduct credits first
            const success = await deductCredits(feature);

            if (!success) {
                setIsChecking(false);
                return false;
            }

            // Execute the feature callback
            await callback();
            setIsChecking(false);
            return true;
        } catch (error) {
            console.error(`[AIFeature] Error executing ${feature}:`, error);
            setIsChecking(false);
            return false;
        }
    };

    return {
        canUse,
        credits,
        cost,
        isChecking: loading || isChecking,
        executeWithCredits,
        showInsufficientCreditsAlert,
    };
}

/**
 * Credit info banner for AI feature screens
 */
interface CreditInfoBannerProps {
    feature: FeatureType;
    isDark?: boolean;
}

export function CreditInfoBanner({ feature, isDark = false }: CreditInfoBannerProps) {
    const navigation = useNavigation<any>();
    const { credits, planType } = useCredits();
    const cost = CREDIT_COSTS[feature];
    const hasEnough = credits >= cost;

    return (
        <View style={[
            styles.banner,
            {
                backgroundColor: isDark
                    ? (hasEnough ? '#1E3A2F' : '#3A1E1E')
                    : (hasEnough ? '#D1FAE5' : '#FEE2E2'),
                borderColor: isDark
                    ? (hasEnough ? '#10B981' : '#EF4444')
                    : (hasEnough ? '#10B981' : '#EF4444'),
            }
        ]}>
            <View style={styles.bannerLeft}>
                <Ionicons
                    name={hasEnough ? 'flash' : 'flash-off'}
                    size={18}
                    color={hasEnough ? '#10B981' : '#EF4444'}
                />
                <View>
                    <Text style={[styles.bannerText, { color: isDark ? '#FFF' : '#1A1A1A' }]}>
                        {credits} credits available
                    </Text>
                    <Text style={[styles.bannerSubtext, { color: isDark ? '#AAA' : '#666' }]}>
                        This feature costs {cost} credit{cost > 1 ? 's' : ''}
                    </Text>
                </View>
            </View>

            {!hasEnough && (
                <TouchableOpacity
                    style={styles.buyButton}
                    onPress={() => navigation.navigate('Billing')}
                >
                    <Text style={styles.buyButtonText}>Buy Credits</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

/**
 * Running Low on Credits Banner
 * Visible when user has < 50 credits
 */
export function LowCreditBanner({ isDark = false }: { isDark?: boolean }) {
    const navigation = useNavigation<any>();
    const { credits, loading } = useCredits();

    console.log('[LowCreditBanner] Credits:', credits, 'Loading:', loading);

    // Explicitly show if credits < 50
    if (loading || credits >= 50) return null;

    return (
        <View style={{
            marginHorizontal: 16,
            marginTop: 16,
            marginBottom: 8,
            padding: 16,
            backgroundColor: isDark ? '#1A2942' : '#EFF6FF',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: isDark ? '#2563EB' : '#BFDBFE',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        }}>
            <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#FFF' : '#1E40AF', marginBottom: 4 }}>
                    Running Low on AI Credits?
                </Text>
                <Text style={{ fontSize: 13, color: isDark ? '#BFDBFE' : '#3B82F6' }}>
                    You have {credits} credits left. Top up to keep using all AI features.
                </Text>
            </View>
            <TouchableOpacity
                onPress={() => navigation.navigate('Billing')}
                style={{ backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
            >
                <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 13 }}>Get Credits</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
    },
    bannerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    bannerText: {
        fontSize: 14,
        fontWeight: '600',
    },
    bannerSubtext: {
        fontSize: 12,
        marginTop: 2,
    },
    buyButton: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
    },
    buyButtonText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
});

export { CREDIT_COSTS };
