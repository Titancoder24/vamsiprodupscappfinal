import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Platform,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Pricing plans data
const PLANS = [
    {
        id: 'free',
        name: 'Free',
        description: 'Perfect for getting started',
        price: 0,
        period: 'forever',
        features: [
            { text: 'Access to 50+ MCQs daily', included: true },
            { text: 'Basic Current Affairs', included: true },
            { text: 'Limited Notes (10 notes)', included: true },
            { text: 'Community Support', included: true },
            { text: 'AI MCQ Generator', included: false },
            { text: 'PDF MCQ Extraction', included: false },
            { text: 'Advanced Analytics', included: false },
            { text: 'Priority Support', included: false },
        ],
        popular: false,
        buttonText: 'Get Started Free',
        buttonStyle: 'outline',
    },
    {
        id: 'pro',
        name: 'Pro',
        description: 'Most popular for serious aspirants',
        price: 299,
        originalPrice: 499,
        period: 'month',
        features: [
            { text: 'Unlimited MCQs', included: true },
            { text: 'Full Current Affairs Access', included: true },
            { text: 'Unlimited Notes & Tags', included: true },
            { text: 'AI MCQ Generator', included: true },
            { text: 'PDF MCQ Extraction', included: true },
            { text: 'Essay Practice Mode', included: true },
            { text: 'Detailed Analytics', included: true },
            { text: 'Email Support', included: true },
        ],
        popular: true,
        buttonText: 'Start Pro Trial',
        buttonStyle: 'primary',
        badge: 'Most Popular',
    },
    {
        id: 'premium',
        name: 'Premium',
        description: 'For dedicated UPSC preparation',
        price: 1999,
        originalPrice: 3999,
        period: 'year',
        features: [
            { text: 'Everything in Pro', included: true },
            { text: 'Personalized Study Roadmap', included: true },
            { text: 'Mind Map Builder', included: true },
            { text: 'Visual Reference Library', included: true },
            { text: 'Offline Access', included: true },
            { text: 'Mock Test Series', included: true },
            { text: 'Priority Support 24/7', included: true },
            { text: 'Early Access to Features', included: true },
        ],
        popular: false,
        buttonText: 'Go Premium',
        buttonStyle: 'dark',
        badge: 'Best Value',
        savings: 'Save ₹1,589/year',
    },
];

const FAQ_DATA = [
    {
        question: 'Can I cancel my subscription anytime?',
        answer: 'Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period.',
    },
    {
        question: 'Is there a free trial?',
        answer: 'Yes! Pro plan comes with a 7-day free trial. No credit card required to start.',
    },
    {
        question: 'Can I switch between plans?',
        answer: 'Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.',
    },
    {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit/debit cards, UPI, net banking, and popular wallets like PayTM and PhonePe.',
    },
    {
        question: 'Is my data secure?',
        answer: 'Yes, we use industry-standard encryption and security practices. Your data is stored locally on your device and synced securely.',
    },
];

const PricingCard = ({ plan, onPress }) => (
    <View style={[styles.card, plan.popular && styles.cardPopular]}>
        {plan.badge && (
            <View style={[styles.badge, plan.id === 'premium' ? styles.badgePremium : styles.badgePopular]}>
                <Text style={styles.badgeText}>{plan.badge}</Text>
            </View>
        )}

        <Text style={styles.planName}>{plan.name}</Text>
        <Text style={styles.planDescription}>{plan.description}</Text>

        <View style={styles.priceRow}>
            <Text style={styles.currency}>₹</Text>
            <Text style={styles.price}>{plan.price}</Text>
            <Text style={styles.period}>/{plan.period}</Text>
        </View>

        {plan.originalPrice && (
            <View style={styles.savingsRow}>
                <Text style={styles.originalPrice}>₹{plan.originalPrice}</Text>
                {plan.savings && <Text style={styles.savingsText}>{plan.savings}</Text>}
            </View>
        )}

        <View style={styles.divider} />

        <View style={styles.featuresList}>
            {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                    <Ionicons
                        name={feature.included ? 'checkmark-circle' : 'close-circle'}
                        size={18}
                        color={feature.included ? '#10B981' : '#CBD5E1'}
                    />
                    <Text style={[styles.featureText, !feature.included && styles.featureDisabled]}>
                        {feature.text}
                    </Text>
                </View>
            ))}
        </View>

        <TouchableOpacity
            style={[
                styles.button,
                plan.buttonStyle === 'primary' && styles.buttonPrimary,
                plan.buttonStyle === 'dark' && styles.buttonDark,
                plan.buttonStyle === 'outline' && styles.buttonOutline,
            ]}
            onPress={() => onPress(plan)}
            activeOpacity={0.8}
        >
            <Text style={[
                styles.buttonText,
                plan.buttonStyle === 'primary' && styles.buttonTextPrimary,
                plan.buttonStyle === 'dark' && styles.buttonTextDark,
            ]}>
                {plan.buttonText}
            </Text>
            <Ionicons
                name="arrow-forward"
                size={16}
                color={plan.buttonStyle === 'outline' ? '#0F172A' : '#FFF'}
            />
        </TouchableOpacity>
    </View>
);

const FAQItem = ({ item, isOpen, onToggle }) => (
    <TouchableOpacity style={styles.faqItem} onPress={onToggle} activeOpacity={0.7}>
        <View style={styles.faqHeader}>
            <Text style={styles.faqQuestion}>{item.question}</Text>
            <Ionicons
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#64748B"
            />
        </View>
        {isOpen && <Text style={styles.faqAnswer}>{item.answer}</Text>}
    </TouchableOpacity>
);

export default function PricingScreen({ navigation }) {
    const [openFAQ, setOpenFAQ] = useState(null);
    const [billingPeriod, setBillingPeriod] = useState('monthly');

    const handleSelectPlan = (plan) => {
        // Navigate to payment or registration
        navigation.navigate('Login', { selectedPlan: plan.id });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#0F172A" />
                    </TouchableOpacity>

                    <View style={styles.headerContent}>
                        <Text style={styles.headerBadge}>PRICING</Text>
                        <Text style={styles.headerTitle}>Choose your plan</Text>
                        <Text style={styles.headerSubtitle}>
                            Start free and upgrade when you're ready for more power
                        </Text>
                    </View>

                    {/* Billing Toggle */}
                    <View style={styles.billingToggle}>
                        <TouchableOpacity
                            style={[styles.toggleOption, billingPeriod === 'monthly' && styles.toggleActive]}
                            onPress={() => setBillingPeriod('monthly')}
                        >
                            <Text style={[styles.toggleText, billingPeriod === 'monthly' && styles.toggleTextActive]}>
                                Monthly
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleOption, billingPeriod === 'yearly' && styles.toggleActive]}
                            onPress={() => setBillingPeriod('yearly')}
                        >
                            <Text style={[styles.toggleText, billingPeriod === 'yearly' && styles.toggleTextActive]}>
                                Yearly
                            </Text>
                            <View style={styles.saveTag}>
                                <Text style={styles.saveTagText}>-40%</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Pricing Cards */}
                <View style={styles.cardsContainer}>
                    {PLANS.map((plan) => (
                        <PricingCard
                            key={plan.id}
                            plan={plan}
                            onPress={handleSelectPlan}
                        />
                    ))}
                </View>

                {/* Trust Badges */}
                <View style={styles.trustSection}>
                    <View style={styles.trustBadge}>
                        <Ionicons name="shield-checkmark" size={24} color="#10B981" />
                        <Text style={styles.trustText}>Secure Payment</Text>
                    </View>
                    <View style={styles.trustBadge}>
                        <Ionicons name="refresh" size={24} color="#3B82F6" />
                        <Text style={styles.trustText}>7-Day Refund</Text>
                    </View>
                    <View style={styles.trustBadge}>
                        <Ionicons name="lock-closed" size={24} color="#8B5CF6" />
                        <Text style={styles.trustText}>Cancel Anytime</Text>
                    </View>
                </View>

                {/* FAQ Section */}
                <View style={styles.faqSection}>
                    <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
                    {FAQ_DATA.map((item, index) => (
                        <FAQItem
                            key={index}
                            item={item}
                            isOpen={openFAQ === index}
                            onToggle={() => setOpenFAQ(openFAQ === index ? null : index)}
                        />
                    ))}
                </View>

                {/* CTA Section */}
                <View style={styles.ctaSection}>
                    <Text style={styles.ctaTitle}>Still have questions?</Text>
                    <Text style={styles.ctaSubtitle}>
                        Our team is here to help you choose the right plan
                    </Text>
                    <TouchableOpacity style={styles.ctaButton}>
                        <Ionicons name="chatbubbles-outline" size={20} color="#FFF" />
                        <Text style={styles.ctaButtonText}>Contact Support</Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        © 2024 PrepAssist. All rights reserved.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 32,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    headerContent: {
        alignItems: 'center',
    },
    headerBadge: {
        fontSize: 12,
        fontWeight: '700',
        color: '#3B82F6',
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: isWeb ? 40 : 32,
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -1,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        maxWidth: 400,
        lineHeight: 24,
    },
    billingToggle: {
        flexDirection: 'row',
        alignSelf: 'center',
        marginTop: 32,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 4,
    },
    toggleOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        gap: 8,
    },
    toggleActive: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    toggleTextActive: {
        color: '#0F172A',
    },
    saveTag: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    saveTagText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#16A34A',
    },
    cardsContainer: {
        flexDirection: isWeb && width > 900 ? 'row' : 'column',
        justifyContent: 'center',
        alignItems: isWeb && width > 900 ? 'stretch' : 'center',
        gap: 20,
        padding: 24,
        maxWidth: 1100,
        alignSelf: 'center',
        width: '100%',
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 28,
        flex: isWeb && width > 900 ? 1 : undefined,
        width: isWeb && width > 900 ? undefined : '100%',
        maxWidth: 360,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cardPopular: {
        borderColor: '#3B82F6',
        borderWidth: 2,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 8,
    },
    badge: {
        position: 'absolute',
        top: -12,
        right: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgePopular: {
        backgroundColor: '#3B82F6',
    },
    badgePremium: {
        backgroundColor: '#8B5CF6',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    planName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
    },
    planDescription: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 20,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    currency: {
        fontSize: 20,
        fontWeight: '600',
        color: '#0F172A',
    },
    price: {
        fontSize: 48,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -2,
    },
    period: {
        fontSize: 14,
        color: '#64748B',
        marginLeft: 4,
    },
    savingsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    originalPrice: {
        fontSize: 14,
        color: '#94A3B8',
        textDecorationLine: 'line-through',
    },
    savingsText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#16A34A',
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 24,
    },
    featuresList: {
        gap: 14,
        marginBottom: 28,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    featureText: {
        fontSize: 14,
        color: '#334155',
        flex: 1,
    },
    featureDisabled: {
        color: '#94A3B8',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 14,
    },
    buttonOutline: {
        backgroundColor: '#F1F5F9',
    },
    buttonPrimary: {
        backgroundColor: '#3B82F6',
    },
    buttonDark: {
        backgroundColor: '#0F172A',
    },
    buttonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
    },
    buttonTextPrimary: {
        color: '#FFF',
    },
    buttonTextDark: {
        color: '#FFF',
    },
    trustSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 24,
        paddingVertical: 32,
        paddingHorizontal: 24,
    },
    trustBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    trustText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },
    faqSection: {
        paddingHorizontal: 24,
        paddingVertical: 48,
        maxWidth: 700,
        alignSelf: 'center',
        width: '100%',
    },
    faqTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 32,
    },
    faqItem: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestion: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0F172A',
        flex: 1,
        paddingRight: 16,
    },
    faqAnswer: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 12,
        lineHeight: 22,
    },
    ctaSection: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 48,
        backgroundColor: '#0F172A',
        marginHorizontal: 24,
        borderRadius: 24,
        marginBottom: 32,
    },
    ctaTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 8,
    },
    ctaSubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 24,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    ctaButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFF',
    },
    footer: {
        paddingVertical: 24,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 13,
        color: '#94A3B8',
    },
});
