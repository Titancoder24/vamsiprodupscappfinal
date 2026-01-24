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

// Updated Pricing plans - only 2 monthly plans
const PLANS = [
    {
        id: 'basic',
        name: 'Basic',
        description: 'Great for getting started with UPSC prep',
        price: 399,
        period: 'month',
        features: [
            { text: 'Unlimited MCQs Practice', included: true },
            { text: 'Current Affairs Updates', included: true },
            { text: 'Unlimited Notes & Tags', included: true },
            { text: 'AI MCQ Generator', included: true },
            { text: 'PDF MCQ Extraction', included: true },
            { text: 'Essay Practice Mode', included: true },
            { text: 'Basic Analytics', included: true },
            { text: 'Email Support', included: true },
            { text: 'Personalized Study Roadmap', included: false },
            { text: 'Mind Map Builder', included: false },
            { text: 'Visual Reference Library', included: false },
            { text: 'Priority Support 24/7', included: false },
        ],
        popular: false,
        buttonText: 'Get Basic Plan',
        buttonStyle: 'outline',
    },
    {
        id: 'premium',
        name: 'Premium',
        description: 'Complete UPSC preparation toolkit',
        price: 599,
        period: 'month',
        features: [
            { text: 'Everything in Basic', included: true },
            { text: 'Personalized Study Roadmap', included: true },
            { text: 'Mind Map Builder', included: true },
            { text: 'Visual Reference Library', included: true },
            { text: 'Offline Access', included: true },
            { text: 'Mock Test Series', included: true },
            { text: 'Advanced Analytics', included: true },
            { text: 'Priority Support 24/7', included: true },
            { text: 'Early Access to Features', included: true },
            { text: 'Personalized Guidance', included: true },
            { text: 'Interview Prep Material', included: true },
            { text: 'Weekly Study Reports', included: true },
        ],
        popular: true,
        buttonText: 'Get Premium Plan',
        buttonStyle: 'primary',
        badge: 'Recommended',
    },
];

const FAQ_DATA = [
    {
        question: 'Can I cancel my subscription anytime?',
        answer: 'Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period.',
    },
    {
        question: 'Is there a free trial?',
        answer: 'Yes! Both plans come with a 7-day free trial. No credit card required to start.',
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
            <View style={styles.badge}>
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
                plan.buttonStyle === 'outline' && styles.buttonOutline,
            ]}
            onPress={() => onPress(plan)}
            activeOpacity={0.8}
        >
            <Text style={[
                styles.buttonText,
                plan.buttonStyle === 'primary' && styles.buttonTextPrimary,
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

    const handleSelectPlan = (plan) => {
        navigation.navigate('Login', { selectedPlan: plan.id });
    };

    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('Landing');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleBack}
                    >
                        <Ionicons name="arrow-back" size={24} color="#0F172A" />
                    </TouchableOpacity>

                    <View style={styles.headerContent}>
                        <Text style={styles.headerBadge}>PRICING</Text>
                        <Text style={styles.headerTitle}>Simple, transparent pricing</Text>
                        <Text style={styles.headerSubtitle}>
                            Choose the plan that fits your UPSC preparation needs
                        </Text>
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
                        <Text style={styles.trustText}>7-Day Free Trial</Text>
                    </View>
                    <View style={styles.trustBadge}>
                        <Ionicons name="lock-closed" size={24} color="#8B5CF6" />
                        <Text style={styles.trustText}>Cancel Anytime</Text>
                    </View>
                </View>

                {/* Comparison Note */}
                <View style={styles.comparisonNote}>
                    <Ionicons name="information-circle" size={20} color="#3B82F6" />
                    <Text style={styles.comparisonText}>
                        Both plans include a 7-day free trial. Upgrade to Premium for complete access to all features.
                    </Text>
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
        paddingBottom: 40,
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
    cardsContainer: {
        flexDirection: isWeb && width > 800 ? 'row' : 'column',
        justifyContent: 'center',
        alignItems: isWeb && width > 800 ? 'stretch' : 'center',
        gap: 24,
        padding: 24,
        maxWidth: 900,
        alignSelf: 'center',
        width: '100%',
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 32,
        flex: isWeb && width > 800 ? 1 : undefined,
        width: isWeb && width > 800 ? undefined : '100%',
        maxWidth: 420,
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
        right: 24,
        backgroundColor: '#3B82F6',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    planName: {
        fontSize: 26,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
    },
    planDescription: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 24,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 24,
    },
    currency: {
        fontSize: 22,
        fontWeight: '600',
        color: '#0F172A',
    },
    price: {
        fontSize: 56,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -2,
    },
    period: {
        fontSize: 16,
        color: '#64748B',
        marginLeft: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginBottom: 24,
    },
    featuresList: {
        gap: 14,
        marginBottom: 32,
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
        paddingVertical: 18,
        borderRadius: 14,
    },
    buttonOutline: {
        backgroundColor: '#F1F5F9',
    },
    buttonPrimary: {
        backgroundColor: '#3B82F6',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    buttonTextPrimary: {
        color: '#FFF',
    },
    trustSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 32,
        paddingVertical: 40,
        paddingHorizontal: 24,
    },
    trustBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    trustText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#475569',
    },
    comparisonNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: '#EFF6FF',
        marginHorizontal: 24,
        padding: 20,
        borderRadius: 16,
        maxWidth: 700,
        alignSelf: 'center',
    },
    comparisonText: {
        fontSize: 14,
        color: '#1E40AF',
        flex: 1,
        lineHeight: 22,
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
