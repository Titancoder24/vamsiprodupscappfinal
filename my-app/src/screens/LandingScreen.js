import React, { useState, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Animated,
    Platform,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Phone Mockup Component
const PhoneMockup = () => {
    return (
        <View style={styles.phoneMockup}>
            <View style={styles.phoneScreen}>
                {/* Dynamic Island */}
                <View style={styles.dynamicIsland}>
                    <View style={styles.dynamicIslandPill} />
                </View>

                {/* Quiz UI */}
                <View style={styles.quizContent}>
                    <View style={styles.quizHeader}>
                        <Ionicons name="chevron-back" size={16} color="#94A3B8" />
                        <Text style={styles.quizSubject}>Modern History</Text>
                        <View style={styles.quizBadge}>
                            <Text style={styles.quizBadgeText}>12/20</Text>
                        </View>
                    </View>

                    <View style={styles.questionCard}>
                        <Text style={styles.questionLabel}>Question 13</Text>
                        <Text style={styles.questionText}>
                            Which act introduced the principle of communal representation in India?
                        </Text>
                    </View>

                    <View style={styles.optionsContainer}>
                        {[
                            { id: 'A', text: 'Indian Councils Act, 1892', correct: false },
                            { id: 'B', text: 'Indian Councils Act, 1909', correct: true },
                            { id: 'C', text: 'Government of India Act, 1919', correct: false },
                            { id: 'D', text: 'Government of India Act, 1935', correct: false },
                        ].map((opt, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.optionItem,
                                    opt.correct && styles.optionItemCorrect
                                ]}
                            >
                                <View style={[styles.optionBadge, opt.correct && styles.optionBadgeCorrect]}>
                                    {opt.correct ? (
                                        <Ionicons name="checkmark" size={10} color="#FFF" />
                                    ) : (
                                        <Text style={styles.optionBadgeText}>{opt.id}</Text>
                                    )}
                                </View>
                                <Text style={[styles.optionText, opt.correct && styles.optionTextCorrect]}>
                                    {opt.text}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        </View>
    );
};

// Feature Card Component
const FeatureCard = ({ icon, iconBg, title, description, large }) => {
    return (
        <View style={[styles.featureCard, large && styles.featureCardLarge]}>
            <View style={[styles.featureIcon, { backgroundColor: iconBg }]}>
                <Ionicons name={icon} size={24} color="#2563EB" />
            </View>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureDescription}>{description}</Text>
        </View>
    );
};

// Floating Badge Component
const FloatingBadge = ({ icon, iconBg, title, subtitle, style }) => {
    return (
        <Animated.View style={[styles.floatingBadge, style]}>
            <View style={[styles.floatingBadgeIcon, { backgroundColor: iconBg }]}>
                <Ionicons name={icon} size={14} color={iconBg === '#DCFCE7' ? '#16A34A' : '#2563EB'} />
            </View>
            <View>
                <Text style={styles.floatingBadgeTitle}>{title}</Text>
                <Text style={styles.floatingBadgeSubtitle}>{subtitle}</Text>
            </View>
        </Animated.View>
    );
};

export default function LandingScreen({ navigation }) {
    const scrollY = useRef(new Animated.Value(0)).current;

    const handleGetStarted = () => {
        navigation.navigate('Login');
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Navbar */}
                <View style={styles.navbar}>
                    <View style={styles.navbarInner}>
                        <View style={styles.logoContainer}>
                            <Ionicons name="book" size={20} color="#1A1A1A" />
                            <Text style={styles.logoText}>UPSC Prep</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.signInButton}
                            onPress={handleGetStarted}
                        >
                            <Text style={styles.signInButtonText}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                >
                    {/* Hero Section */}
                    <View style={styles.heroSection}>
                        {/* Grid Background */}
                        <View style={styles.gridBackground} />

                        <View style={styles.heroContent}>
                            {/* Badge */}
                            <View style={styles.heroBadge}>
                                <View style={styles.heroBadgeDot} />
                                <Text style={styles.heroBadgeText}>NEW: Mains AI Evaluator 2.0</Text>
                            </View>

                            {/* Title */}
                            <Text style={styles.heroTitle}>
                                Crack UPSC{'\n'}
                                <Text style={styles.heroTitleGradient}>Like a Machine.</Text>
                            </Text>

                            {/* Subtitle */}
                            <Text style={styles.heroSubtitle}>
                                The only AI-powered operating system for serious aspirants. Generate quizzes from news, get instant answer feedback, and visualize your progress.
                            </Text>

                            {/* CTA Buttons */}
                            <View style={styles.heroButtons}>
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={handleGetStarted}
                                >
                                    <Text style={styles.primaryButtonText}>Start Learning Free</Text>
                                    <Ionicons name="arrow-forward" size={16} color="#FFF" />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.secondaryButton}>
                                    <Ionicons name="play-circle-outline" size={18} color="#64748B" />
                                    <Text style={styles.secondaryButtonText}>Watch Demo</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Social Proof */}
                            <View style={styles.socialProof}>
                                <View style={styles.avatarStack}>
                                    {[1, 2, 3, 4].map((i) => (
                                        <View key={i} style={[styles.avatar, { marginLeft: i > 1 ? -8 : 0 }]}>
                                            <Text style={styles.avatarText}>{String.fromCharCode(64 + i)}</Text>
                                        </View>
                                    ))}
                                </View>
                                <View>
                                    <View style={styles.starsRow}>
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <Ionicons key={i} name="star" size={10} color="#FACC15" />
                                        ))}
                                    </View>
                                    <Text style={styles.socialProofText}>
                                        <Text style={styles.socialProofBold}>15,000+</Text> aspirants trusting us
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Phone Mockup */}
                        {isWeb && width > 900 && (
                            <View style={styles.mockupContainer}>
                                <PhoneMockup />

                                {/* Floating Badges */}
                                <FloatingBadge
                                    icon="checkmark-circle"
                                    iconBg="#DCFCE7"
                                    title="Streak Maintained!"
                                    subtitle="12 days in a row 🔥"
                                    style={styles.floatingBadgeTop}
                                />
                                <FloatingBadge
                                    icon="flash"
                                    iconBg="#DBEAFE"
                                    title="AI Analysis Ready"
                                    subtitle="Evaluation complete"
                                    style={styles.floatingBadgeBottom}
                                />
                            </View>
                        )}
                    </View>

                    {/* Features Section */}
                    <View style={styles.featuresSection}>
                        <View style={styles.featuresHeader}>
                            <Text style={styles.featuresTitle}>
                                A complete operating system{'\n'}
                                <Text style={styles.featuresTitleLight}>for your preparation.</Text>
                            </Text>
                            <Text style={styles.featuresSubtitle}>
                                We combined the best study tools into one cohesive platform. No more switching between apps.
                            </Text>
                        </View>

                        <View style={styles.featuresGrid}>
                            <FeatureCard
                                icon="hardware-chip-outline"
                                iconBg="#DBEAFE"
                                title="Adaptive Question Engine"
                                description="Our AI parses The Hindu, Indian Express, and NCERTs to generate exam-ready MCQs."
                                large
                            />
                            <FeatureCard
                                icon="create-outline"
                                iconBg="#E0F2FE"
                                title="Mains Evaluator"
                                description="Get feedback on structure, vocabulary, and relevance in seconds."
                            />
                            <FeatureCard
                                icon="flash-outline"
                                iconBg="#FEF3C7"
                                title="Smart News Feed"
                                description="Auto-tagged current affairs filtered for syllabus relevance."
                            />
                            <FeatureCard
                                icon="map-outline"
                                iconBg="#D1FAE5"
                                title="Dynamic Roadmap"
                                description="Missed a day? Our scheduler automatically adjusts your plan."
                            />
                        </View>
                    </View>

                    {/* CTA Section */}
                    <View style={styles.ctaSection}>
                        <View style={styles.ctaCard}>
                            <Text style={styles.ctaTitle}>Ready to streamline your prep?</Text>
                            <Text style={styles.ctaSubtitle}>
                                Join thousands of serious aspirants using AI to clear the toughest exam in the world.
                            </Text>

                            <View style={styles.ctaButtons}>
                                <TouchableOpacity
                                    style={styles.ctaPrimaryButton}
                                    onPress={handleGetStarted}
                                >
                                    <Text style={styles.ctaPrimaryButtonText}>Get Started Free</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.ctaNote}>No credit card required • 14-day free trial</Text>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <View style={styles.footerContent}>
                            <Text style={styles.footerLogo}>UPSC Prep</Text>
                            <View style={styles.footerLinks}>
                                <Text style={styles.footerLink}>Privacy Policy</Text>
                                <Text style={styles.footerLink}>Terms of Service</Text>
                            </View>
                            <Text style={styles.footerCopyright}>© 2025 UPSC Prep. All rights reserved.</Text>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    safeArea: {
        flex: 1,
    },

    // Navbar
    navbar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingTop: Platform.OS === 'ios' ? 50 : 10,
        paddingHorizontal: 20,
    },
    navbarInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        ...Platform.select({
            web: {
                backdropFilter: 'blur(10px)',
            },
        }),
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
        letterSpacing: -0.3,
    },
    signInButton: {
        backgroundColor: '#1A1A1A',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 50,
    },
    signInButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },

    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: Platform.OS === 'ios' ? 120 : 80,
    },

    // Grid Background
    gridBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: height * 0.6,
        backgroundColor: '#FAFAFA',
        opacity: 0.5,
    },

    // Hero Section
    heroSection: {
        flexDirection: isWeb && width > 900 ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 60,
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
    },
    heroContent: {
        flex: 1,
        maxWidth: 560,
        paddingRight: isWeb && width > 900 ? 40 : 0,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 50,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        marginBottom: 24,
    },
    heroBadgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#2563EB',
        marginRight: 8,
    },
    heroBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#1D4ED8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    heroTitle: {
        fontSize: isWeb ? 56 : 42,
        fontWeight: '800',
        color: '#0F172A',
        lineHeight: isWeb ? 64 : 50,
        letterSpacing: -1.5,
        marginBottom: 20,
    },
    heroTitleGradient: {
        color: '#2563EB',
    },
    heroSubtitle: {
        fontSize: 17,
        color: '#64748B',
        lineHeight: 28,
        marginBottom: 32,
    },
    heroButtons: {
        flexDirection: isWeb ? 'row' : 'column',
        gap: 12,
        marginBottom: 32,
    },
    primaryButton: {
        backgroundColor: '#0F172A',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        paddingHorizontal: 28,
        borderRadius: 50,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        paddingHorizontal: 28,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    secondaryButtonText: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '600',
    },
    socialProof: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatarStack: {
        flexDirection: 'row',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E2E8F0',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
    },
    starsRow: {
        flexDirection: 'row',
        gap: 2,
        marginBottom: 2,
    },
    socialProofText: {
        fontSize: 12,
        color: '#64748B',
    },
    socialProofBold: {
        fontWeight: '700',
        color: '#0F172A',
    },

    // Mockup
    mockupContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    phoneMockup: {
        width: 260,
        height: 520,
        backgroundColor: '#000',
        borderRadius: 42,
        padding: 8,
        ...Platform.select({
            web: {
                boxShadow: '0 50px 100px -20px rgba(50, 50, 93, 0.3)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 25 },
                shadowOpacity: 0.3,
                shadowRadius: 50,
                elevation: 20,
            },
        }),
    },
    phoneScreen: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 34,
        overflow: 'hidden',
    },
    dynamicIsland: {
        alignItems: 'center',
        paddingTop: 8,
    },
    dynamicIslandPill: {
        width: 90,
        height: 24,
        backgroundColor: '#000',
        borderRadius: 12,
    },
    quizContent: {
        flex: 1,
        paddingTop: 40,
    },
    quizHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    quizSubject: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0F172A',
    },
    quizBadge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    quizBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#2563EB',
    },
    questionCard: {
        backgroundColor: '#FFFFFF',
        margin: 16,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            web: {
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            },
        }),
    },
    questionLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    questionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0F172A',
        lineHeight: 18,
    },
    optionsContainer: {
        paddingHorizontal: 16,
        gap: 6,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 10,
    },
    optionItemCorrect: {
        backgroundColor: '#ECFDF5',
        borderColor: '#A7F3D0',
    },
    optionBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionBadgeCorrect: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    optionBadgeText: {
        fontSize: 8,
        fontWeight: '700',
        color: '#64748B',
    },
    optionText: {
        fontSize: 10,
        color: '#475569',
        flex: 1,
    },
    optionTextCorrect: {
        color: '#065F46',
        fontWeight: '600',
    },

    // Floating Badges
    floatingBadge: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            web: {
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            },
        }),
    },
    floatingBadgeTop: {
        top: 80,
        right: -60,
    },
    floatingBadgeBottom: {
        bottom: 100,
        left: -60,
    },
    floatingBadgeIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    floatingBadgeTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0F172A',
    },
    floatingBadgeSubtitle: {
        fontSize: 9,
        color: '#64748B',
    },

    // Features Section
    featuresSection: {
        paddingHorizontal: 24,
        paddingVertical: 80,
        backgroundColor: '#FFFFFF',
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
    },
    featuresHeader: {
        marginBottom: 48,
        maxWidth: 600,
    },
    featuresTitle: {
        fontSize: isWeb ? 40 : 32,
        fontWeight: '800',
        color: '#0F172A',
        lineHeight: isWeb ? 48 : 40,
        marginBottom: 16,
        letterSpacing: -1,
    },
    featuresTitleLight: {
        color: '#94A3B8',
    },
    featuresSubtitle: {
        fontSize: 16,
        color: '#64748B',
        lineHeight: 26,
    },
    featuresGrid: {
        flexDirection: isWeb && width > 700 ? 'row' : 'column',
        flexWrap: 'wrap',
        gap: 16,
    },
    featureCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 24,
        padding: 28,
        flex: isWeb && width > 700 ? 1 : undefined,
        minWidth: isWeb && width > 700 ? 280 : undefined,
    },
    featureCardLarge: {
        flex: isWeb && width > 700 ? 2 : undefined,
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    featureTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 8,
    },
    featureDescription: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 22,
    },

    // CTA Section
    ctaSection: {
        paddingHorizontal: 24,
        paddingVertical: 80,
    },
    ctaCard: {
        backgroundColor: '#0F172A',
        borderRadius: 40,
        padding: isWeb ? 60 : 40,
        alignItems: 'center',
        maxWidth: 900,
        alignSelf: 'center',
        width: '100%',
        overflow: 'hidden',
    },
    ctaTitle: {
        fontSize: isWeb ? 40 : 28,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: -1,
    },
    ctaSubtitle: {
        fontSize: 16,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 26,
        marginBottom: 32,
        maxWidth: 480,
    },
    ctaButtons: {
        flexDirection: isWeb ? 'row' : 'column',
        gap: 16,
        marginBottom: 24,
    },
    ctaPrimaryButton: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 50,
    },
    ctaPrimaryButtonText: {
        color: '#0F172A',
        fontSize: 14,
        fontWeight: '700',
    },
    ctaNote: {
        fontSize: 12,
        color: '#64748B',
    },

    // Footer
    footer: {
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: '#FAFAFA',
        paddingVertical: 40,
        paddingHorizontal: 24,
    },
    footerContent: {
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
        flexDirection: isWeb && width > 600 ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
    },
    footerLogo: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    footerLinks: {
        flexDirection: 'row',
        gap: 24,
    },
    footerLink: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    footerCopyright: {
        fontSize: 10,
        color: '#94A3B8',
    },
});
