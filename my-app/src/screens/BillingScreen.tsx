/**
 * BILLING SCREEN - Modern Flat Design
 * 
 * Clean, minimal design without gradients or glassmorphism
 * Direct DodoPayments checkout integration
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../features/Reference/theme/ThemeContext';
import { useWebStyles } from '../components/WebContainer';
import { useAuth } from '../context/AuthContext';
import {
    getSubscriptionPlans,
    getCreditPackages,
    getUserCredits,
    getTransactionHistory,
    formatPrice,
    SubscriptionPlan,
    CreditPackage,
    CreditBalance,
    CREDIT_COSTS,
} from '../services/billingService';

// ============== LIVE CHECKOUT URLs ==============
const CHECKOUT_URLS = {
    BASIC_PLAN: 'https://checkout.dodopayments.com/buy/pdt_0NWfLOSWmnFywSwZldAHa',
    PRO_PLAN: 'https://checkout.dodopayments.com/buy/pdt_0NWfLU5OfjnVhmPz86wWZ',
    CREDITS_50: 'https://checkout.dodopayments.com/buy/pdt_0NWfLXQfz6P34vDNgGT6J',
    CREDITS_120: 'https://checkout.dodopayments.com/buy/pdt_0NWfLZHVYcwnA37B60iio',
    CREDITS_300: 'https://checkout.dodopayments.com/buy/pdt_0NWfLbT49dqQm9bNqVVjS',
};

export default function BillingScreen() {
    const { theme, isDark } = useTheme();
    const { horizontalPadding } = useWebStyles();
    const navigation = useNavigation<any>();
    const { user } = useAuth() as { user: { email?: string; name?: string } | null };

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [credits, setCredits] = useState<CreditBalance | null>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'plans' | 'credits' | 'history'>('plans');

    const userEmail = user?.email || '';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [creditsData, transactionsData] = await Promise.all([
                getUserCredits(),
                getTransactionHistory(10),
            ]);
            setCredits(creditsData);
            setTransactions(transactionsData);
        } catch (error) {
            console.error('[Billing] Load error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const openCheckout = async (url: string, productName: string) => {
        if (!userEmail) {
            Alert.alert('Login Required', 'Please login to make a purchase.');
            return;
        }

        const fullUrl = `${url}?email=${encodeURIComponent(userEmail)}`;
        console.log('[Billing] Opening checkout:', fullUrl);

        try {
            if (Platform.OS === 'web') {
                window.open(fullUrl, '_blank');
            } else {
                const canOpen = await Linking.canOpenURL(fullUrl);
                if (canOpen) {
                    await Linking.openURL(fullUrl);
                } else {
                    Alert.alert('Error', 'Cannot open payment page.');
                }
            }
        } catch (err) {
            console.error('[Billing] Error:', err);
            Alert.alert('Error', 'Failed to open checkout.');
        }
    };

    // ============== CREDITS CARD ==============
    const renderCreditsCard = () => (
        <View style={[styles.creditsCard, { backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF', borderColor: isDark ? '#2A2A4E' : '#E8E8E8' }]}>
            <View style={styles.creditsCardContent}>
                <View>
                    <Text style={[styles.creditsLabel, { color: isDark ? '#888' : '#666' }]}>Available Credits</Text>
                    <Text style={[styles.creditsNumber, { color: isDark ? '#FFF' : '#1A1A1A' }]}>
                        {credits?.credits || 0}
                    </Text>
                </View>
                <View style={[styles.planBadge, { backgroundColor: credits?.plan_type === 'pro' ? '#6366F1' : credits?.plan_type === 'basic' ? '#10B981' : '#6B7280' }]}>
                    <Ionicons name="flash" size={14} color="#FFF" />
                    <Text style={styles.planBadgeText}>
                        {credits?.plan_type === 'pro' ? 'PRO' : credits?.plan_type === 'basic' ? 'BASIC' : 'FREE'}
                    </Text>
                </View>
            </View>
            {credits?.monthly_credits ? (
                <Text style={[styles.creditsSubtext, { color: isDark ? '#666' : '#888' }]}>
                    {credits.monthly_credits} credits/month • Renews {credits.expires_at ? new Date(credits.expires_at).toLocaleDateString() : 'N/A'}
                </Text>
            ) : (
                <Text style={[styles.creditsSubtext, { color: isDark ? '#666' : '#888' }]}>
                    Subscribe for monthly credits
                </Text>
            )}
        </View>
    );

    // ============== TABS ==============
    const renderTabs = () => (
        <View style={[styles.tabsContainer, { backgroundColor: isDark ? '#1A1A2E' : '#F5F5F5', borderColor: isDark ? '#2A2A4E' : '#E8E8E8' }]}>
            {[
                { id: 'plans', label: 'Plans', icon: 'layers-outline' },
                { id: 'credits', label: 'Credits', icon: 'flash-outline' },
                { id: 'history', label: 'History', icon: 'time-outline' },
            ].map((tab) => (
                <TouchableOpacity
                    key={tab.id}
                    style={[
                        styles.tab,
                        activeTab === tab.id && { backgroundColor: isDark ? '#2A2A4E' : '#FFFFFF' }
                    ]}
                    onPress={() => setActiveTab(tab.id as any)}
                >
                    <Ionicons
                        name={tab.icon as any}
                        size={18}
                        color={activeTab === tab.id ? (isDark ? '#6366F1' : '#4F46E5') : (isDark ? '#666' : '#999')}
                    />
                    <Text style={[
                        styles.tabText,
                        { color: activeTab === tab.id ? (isDark ? '#FFF' : '#1A1A1A') : (isDark ? '#666' : '#999') }
                    ]}>
                        {tab.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    // ============== SUBSCRIPTION PLANS ==============
    const renderPlans = () => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#1A1A1A' }]}>
                Choose Your Plan
            </Text>
            <Text style={[styles.sectionSubtitle, { color: isDark ? '#666' : '#888' }]}>
                Get monthly credits for all AI features
            </Text>

            {/* Basic Plan */}
            <TouchableOpacity
                style={[styles.planCard, { backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF', borderColor: isDark ? '#2A2A4E' : '#E8E8E8' }]}
                onPress={() => openCheckout(CHECKOUT_URLS.BASIC_PLAN, 'Basic Plan')}
            >
                <View style={styles.planHeader}>
                    <View>
                        <View style={styles.planTitleRow}>
                            <View style={[styles.planIcon, { backgroundColor: '#10B981' }]}>
                                <Ionicons name="person" size={16} color="#FFF" />
                            </View>
                            <Text style={[styles.planName, { color: isDark ? '#FFF' : '#1A1A1A' }]}>Basic</Text>
                        </View>
                        <View style={styles.priceRow}>
                            <Text style={[styles.planPrice, { color: isDark ? '#FFF' : '#1A1A1A' }]}>₹399</Text>
                            <Text style={[styles.planPeriod, { color: isDark ? '#666' : '#888' }]}>/month</Text>
                        </View>
                    </View>
                    <View style={[styles.creditsBadge, { backgroundColor: isDark ? '#1E3A2F' : '#D1FAE5' }]}>
                        <Text style={[styles.creditsBadgeNumber, { color: '#10B981' }]}>200</Text>
                        <Text style={[styles.creditsBadgeText, { color: '#10B981' }]}>credits</Text>
                    </View>
                </View>
                <View style={styles.planFeatures}>
                    <View style={styles.featureRow}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={[styles.featureText, { color: isDark ? '#AAA' : '#666' }]}>200 AI credits per month</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={[styles.featureText, { color: isDark ? '#AAA' : '#666' }]}>All AI features included</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={[styles.featureText, { color: isDark ? '#AAA' : '#666' }]}>Cancel anytime</Text>
                    </View>
                </View>
                <View style={[styles.subscribeButton, { backgroundColor: '#10B981' }]}>
                    <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFF" />
                </View>
            </TouchableOpacity>

            {/* Pro Plan */}
            <TouchableOpacity
                style={[styles.planCard, styles.proPlanCard, { backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF', borderColor: '#6366F1' }]}
                onPress={() => openCheckout(CHECKOUT_URLS.PRO_PLAN, 'Pro Plan')}
            >
                <View style={styles.popularTag}>
                    <Text style={styles.popularTagText}>MOST POPULAR</Text>
                </View>
                <View style={styles.planHeader}>
                    <View>
                        <View style={styles.planTitleRow}>
                            <View style={[styles.planIcon, { backgroundColor: '#6366F1' }]}>
                                <Ionicons name="diamond" size={16} color="#FFF" />
                            </View>
                            <Text style={[styles.planName, { color: isDark ? '#FFF' : '#1A1A1A' }]}>Pro</Text>
                        </View>
                        <View style={styles.priceRow}>
                            <Text style={[styles.planPrice, { color: isDark ? '#FFF' : '#1A1A1A' }]}>₹699</Text>
                            <Text style={[styles.planPeriod, { color: isDark ? '#666' : '#888' }]}>/month</Text>
                        </View>
                    </View>
                    <View style={[styles.creditsBadge, { backgroundColor: isDark ? '#2A2355' : '#EDE9FE' }]}>
                        <Text style={[styles.creditsBadgeNumber, { color: '#6366F1' }]}>400</Text>
                        <Text style={[styles.creditsBadgeText, { color: '#6366F1' }]}>credits</Text>
                    </View>
                </View>
                <View style={styles.planFeatures}>
                    <View style={styles.featureRow}>
                        <Ionicons name="checkmark-circle" size={16} color="#6366F1" />
                        <Text style={[styles.featureText, { color: isDark ? '#AAA' : '#666' }]}>400 AI credits per month</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <Ionicons name="checkmark-circle" size={16} color="#6366F1" />
                        <Text style={[styles.featureText, { color: isDark ? '#AAA' : '#666' }]}>Priority processing</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <Ionicons name="checkmark-circle" size={16} color="#6366F1" />
                        <Text style={[styles.featureText, { color: isDark ? '#AAA' : '#666' }]}>Premium support</Text>
                    </View>
                </View>
                <View style={[styles.subscribeButton, { backgroundColor: '#6366F1' }]}>
                    <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFF" />
                </View>
            </TouchableOpacity>
        </View>
    );

    // ============== CREDIT PACKAGES ==============
    const renderCreditsPackages = () => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#1A1A1A' }]}>
                Buy Extra Credits
            </Text>
            <Text style={[styles.sectionSubtitle, { color: isDark ? '#666' : '#888' }]}>
                One-time purchase • Credits never expire
            </Text>

            <View style={styles.packagesRow}>
                {/* 50 Credits */}
                <TouchableOpacity
                    style={[styles.packageCard, { backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF', borderColor: isDark ? '#2A2A4E' : '#E8E8E8' }]}
                    onPress={() => openCheckout(CHECKOUT_URLS.CREDITS_50, '50 Credits')}
                >
                    <Text style={[styles.packageCredits, { color: isDark ? '#FFF' : '#1A1A1A' }]}>50</Text>
                    <Text style={[styles.packageCreditsLabel, { color: isDark ? '#666' : '#888' }]}>credits</Text>
                    <Text style={[styles.packagePrice, { color: '#10B981' }]}>₹99</Text>
                    <Text style={[styles.packagePerCredit, { color: isDark ? '#555' : '#AAA' }]}>₹1.98/credit</Text>
                </TouchableOpacity>

                {/* 120 Credits */}
                <TouchableOpacity
                    style={[styles.packageCard, styles.packageCardPopular, { backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF', borderColor: '#6366F1' }]}
                    onPress={() => openCheckout(CHECKOUT_URLS.CREDITS_120, '120 Credits')}
                >
                    <View style={styles.saveBadge}>
                        <Text style={styles.saveBadgeText}>BEST VALUE</Text>
                    </View>
                    <Text style={[styles.packageCredits, { color: isDark ? '#FFF' : '#1A1A1A' }]}>120</Text>
                    <Text style={[styles.packageCreditsLabel, { color: isDark ? '#666' : '#888' }]}>credits</Text>
                    <Text style={[styles.packagePrice, { color: '#6366F1' }]}>₹199</Text>
                    <Text style={[styles.packagePerCredit, { color: isDark ? '#555' : '#AAA' }]}>₹1.66/credit</Text>
                </TouchableOpacity>

                {/* 300 Credits */}
                <TouchableOpacity
                    style={[styles.packageCard, { backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF', borderColor: isDark ? '#2A2A4E' : '#E8E8E8' }]}
                    onPress={() => openCheckout(CHECKOUT_URLS.CREDITS_300, '300 Credits')}
                >
                    <Text style={[styles.packageCredits, { color: isDark ? '#FFF' : '#1A1A1A' }]}>300</Text>
                    <Text style={[styles.packageCreditsLabel, { color: isDark ? '#666' : '#888' }]}>credits</Text>
                    <Text style={[styles.packagePrice, { color: '#F59E0B' }]}>₹399</Text>
                    <Text style={[styles.packagePerCredit, { color: isDark ? '#555' : '#AAA' }]}>₹1.33/credit</Text>
                </TouchableOpacity>
            </View>

            {/* Credit Usage Guide */}
            <View style={[styles.usageGuide, { backgroundColor: isDark ? '#1A1A2E' : '#F9FAFB', borderColor: isDark ? '#2A2A4E' : '#E5E7EB' }]}>
                <Text style={[styles.usageTitle, { color: isDark ? '#FFF' : '#1A1A1A' }]}>
                    <Ionicons name="information-circle" size={16} /> Credit Usage
                </Text>
                <View style={styles.usageGrid}>
                    {Object.entries(CREDIT_COSTS).map(([feature, cost]) => (
                        <View key={feature} style={styles.usageItem}>
                            <Text style={[styles.usageFeature, { color: isDark ? '#AAA' : '#666' }]}>
                                {feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Text>
                            <Text style={[styles.usageCost, { color: isDark ? '#6366F1' : '#4F46E5' }]}>
                                {cost} credit{cost > 1 ? 's' : ''}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );

    // ============== TRANSACTION HISTORY ==============
    const renderHistory = () => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#1A1A1A' }]}>
                Transaction History
            </Text>

            {transactions.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: isDark ? '#1A1A2E' : '#F9FAFB', borderColor: isDark ? '#2A2A4E' : '#E8E8E8' }]}>
                    <Ionicons name="receipt-outline" size={48} color={isDark ? '#444' : '#CCC'} />
                    <Text style={[styles.emptyText, { color: isDark ? '#666' : '#888' }]}>No transactions yet</Text>
                </View>
            ) : (
                transactions.map((tx) => (
                    <View
                        key={tx.id}
                        style={[styles.transactionRow, { backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF', borderColor: isDark ? '#2A2A4E' : '#E8E8E8' }]}
                    >
                        <View style={[styles.txIcon, { backgroundColor: tx.credits > 0 ? '#D1FAE5' : '#FEE2E2' }]}>
                            <Ionicons
                                name={tx.credits > 0 ? 'add' : 'remove'}
                                size={16}
                                color={tx.credits > 0 ? '#059669' : '#DC2626'}
                            />
                        </View>
                        <View style={styles.txDetails}>
                            <Text style={[styles.txDescription, { color: isDark ? '#FFF' : '#1A1A1A' }]}>
                                {tx.description || tx.feature_used || tx.transaction_type}
                            </Text>
                            <Text style={[styles.txDate, { color: isDark ? '#666' : '#888' }]}>
                                {new Date(tx.created_at).toLocaleDateString()}
                            </Text>
                        </View>
                        <Text style={[styles.txCredits, { color: tx.credits > 0 ? '#059669' : '#DC2626' }]}>
                            {tx.credits > 0 ? '+' : ''}{tx.credits}
                        </Text>
                    </View>
                ))
            )}
        </View>
    );

    // ============== LOADING STATE ==============
    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0F0F1A' : '#F9FAFB' }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text style={[styles.loadingText, { color: isDark ? '#666' : '#888' }]}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // ============== MAIN RENDER ==============
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0F0F1A' : '#F9FAFB' }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding || 20 }]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF' }]}>
                        <Ionicons name="arrow-back" size={20} color={isDark ? '#FFF' : '#1A1A1A'} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#1A1A1A' }]}>Billing & Credits</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Credits Card */}
                {renderCreditsCard()}

                {/* Tabs */}
                {renderTabs()}

                {/* Content */}
                {activeTab === 'plans' && renderPlans()}
                {activeTab === 'credits' && renderCreditsPackages()}
                {activeTab === 'history' && renderHistory()}

                {/* Payment Info */}
                <View style={[styles.paymentInfo, { borderColor: isDark ? '#2A2A4E' : '#E8E8E8' }]}>
                    <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                    <Text style={[styles.paymentInfoText, { color: isDark ? '#666' : '#888' }]}>
                        Secure payments via DodoPayments • UPI & Cards accepted
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// ============== STYLES ==============
const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { marginTop: 12, fontSize: 14 },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    backButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '700' },

    // Credits Card
    creditsCard: { borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1 },
    creditsCardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    creditsLabel: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
    creditsNumber: { fontSize: 40, fontWeight: '800' },
    planBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4 },
    planBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
    creditsSubtext: { fontSize: 12, marginTop: 12 },

    // Tabs
    tabsContainer: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 24, borderWidth: 1 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 8 },
    tabText: { fontSize: 13, fontWeight: '600' },

    // Section
    section: { marginBottom: 28 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
    sectionSubtitle: { fontSize: 13, marginBottom: 16 },

    // Plan Cards
    planCard: { borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, position: 'relative' },
    proPlanCard: { borderWidth: 2 },
    popularTag: { position: 'absolute', top: -1, right: 16, backgroundColor: '#6366F1', paddingHorizontal: 12, paddingVertical: 4, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
    popularTagText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
    planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    planIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    planName: { fontSize: 20, fontWeight: '700' },
    priceRow: { flexDirection: 'row', alignItems: 'baseline' },
    planPrice: { fontSize: 32, fontWeight: '800' },
    planPeriod: { fontSize: 14, marginLeft: 4 },
    creditsBadge: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    creditsBadgeNumber: { fontSize: 24, fontWeight: '800' },
    creditsBadgeText: { fontSize: 11, fontWeight: '600' },
    planFeatures: { marginBottom: 16 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    featureText: { fontSize: 14, flex: 1 },
    subscribeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
    subscribeButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

    // Credit Packages
    packagesRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    packageCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, position: 'relative' },
    packageCardPopular: { borderWidth: 2 },
    saveBadge: { position: 'absolute', top: -8, backgroundColor: '#6366F1', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    saveBadgeText: { color: '#FFF', fontSize: 8, fontWeight: '700' },
    packageCredits: { fontSize: 28, fontWeight: '800', marginTop: 8 },
    packageCreditsLabel: { fontSize: 11, marginBottom: 8 },
    packagePrice: { fontSize: 20, fontWeight: '700' },
    packagePerCredit: { fontSize: 10, marginTop: 4 },

    // Usage Guide
    usageGuide: { borderRadius: 12, padding: 16, borderWidth: 1 },
    usageTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    usageGrid: { gap: 8 },
    usageItem: { flexDirection: 'row', justifyContent: 'space-between' },
    usageFeature: { fontSize: 13 },
    usageCost: { fontSize: 13, fontWeight: '600' },

    // Empty State
    emptyState: { padding: 40, alignItems: 'center', borderRadius: 16, borderWidth: 1 },
    emptyText: { marginTop: 12, fontSize: 14 },

    // Transaction Row
    transactionRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1 },
    txIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    txDetails: { flex: 1 },
    txDescription: { fontSize: 14, fontWeight: '500' },
    txDate: { fontSize: 12, marginTop: 2 },
    txCredits: { fontSize: 16, fontWeight: '700' },

    // Payment Info
    paymentInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderTopWidth: 1, marginTop: 20 },
    paymentInfoText: { fontSize: 12 },
});
