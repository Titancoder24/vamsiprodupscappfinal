import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Animated,
    Platform,
    Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Sparkle Component
const Sparkle = ({ delay, left, top, size = 4 }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animate = () => {
            Animated.sequence([
                Animated.delay(delay),
                Animated.parallel([
                    Animated.timing(opacity, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.spring(scale, {
                        toValue: 1,
                        friction: 4,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.delay(800),
                Animated.parallel([
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scale, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]),
            ]).start(() => animate());
        };
        animate();
    }, []);

    return (
        <Animated.View
            style={[
                styles.sparkle,
                {
                    left: `${left}%`,
                    top: `${top}%`,
                    width: size,
                    height: size,
                    opacity,
                    transform: [{ scale }],
                },
            ]}
        />
    );
};

// Sparkles Container
const SparklesBackground = () => {
    const sparkles = [
        { delay: 0, left: 10, top: 20, size: 3 },
        { delay: 300, left: 85, top: 15, size: 4 },
        { delay: 600, left: 25, top: 60, size: 3 },
        { delay: 900, left: 70, top: 45, size: 5 },
        { delay: 1200, left: 45, top: 25, size: 3 },
        { delay: 1500, left: 90, top: 70, size: 4 },
        { delay: 1800, left: 15, top: 80, size: 3 },
        { delay: 2100, left: 60, top: 85, size: 4 },
        { delay: 2400, left: 35, top: 40, size: 3 },
        { delay: 2700, left: 80, top: 30, size: 5 },
    ];

    return (
        <View style={styles.sparklesContainer}>
            {sparkles.map((s, i) => (
                <Sparkle key={i} {...s} />
            ))}
        </View>
    );
};

// Animated Grid Background
const AnimatedGrid = () => {
    const pulse = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 0,
                    duration: 3000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const glowOpacity = pulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.03, 0.08],
    });

    return (
        <View style={styles.gridContainer}>
            {/* Grid Lines */}
            <View style={styles.gridLines}>
                {[...Array(12)].map((_, i) => (
                    <View key={`v${i}`} style={[styles.gridLineVertical, { left: `${(i + 1) * 8}%` }]} />
                ))}
                {[...Array(8)].map((_, i) => (
                    <View key={`h${i}`} style={[styles.gridLineHorizontal, { top: `${(i + 1) * 12}%` }]} />
                ))}
            </View>

            {/* Animated Glow Spots */}
            <Animated.View style={[styles.glowSpot, styles.glowSpot1, { opacity: glowOpacity }]} />
            <Animated.View style={[styles.glowSpot, styles.glowSpot2, { opacity: glowOpacity }]} />
        </View>
    );
};

// Animated Avatar Component
const AnimatedAvatar = ({ index, emoji, delay }) => {
    const bounce = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const startAnimation = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.parallel([
                        Animated.timing(bounce, {
                            toValue: -6,
                            duration: 600,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.timing(scale, {
                            toValue: 1.1,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.parallel([
                        Animated.timing(bounce, {
                            toValue: 0,
                            duration: 600,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.timing(scale, {
                            toValue: 1,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                    ]),
                ])
            ).start();
        };
        startAnimation();
    }, []);

    const bgColors = ['#DBEAFE', '#D1FAE5', '#FEF3C7', '#FCE7F3'];

    return (
        <Animated.View
            style={[
                styles.animatedAvatar,
                {
                    backgroundColor: bgColors[index % bgColors.length],
                    marginLeft: index > 0 ? -10 : 0,
                    zIndex: 4 - index,
                    transform: [{ translateY: bounce }, { scale }],
                },
            ]}
        >
            <Text style={styles.avatarEmoji}>{emoji}</Text>
        </Animated.View>
    );
};

// Phone Mockup Component - Compact
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
                        <Ionicons name="chevron-back" size={12} color="#94A3B8" />
                        <Text style={styles.quizSubject}>Modern History</Text>
                        <View style={styles.quizBadge}>
                            <Text style={styles.quizBadgeText}>12/20</Text>
                        </View>
                    </View>

                    <View style={styles.questionCard}>
                        <Text style={styles.questionLabel}>Q 13</Text>
                        <Text style={styles.questionText}>
                            Which act introduced communal representation?
                        </Text>
                    </View>

                    <View style={styles.optionsContainer}>
                        {[
                            { id: 'A', text: 'Indian Councils Act, 1892', correct: false },
                            { id: 'B', text: 'Indian Councils Act, 1909', correct: true },
                            { id: 'C', text: 'Govt. of India Act, 1919', correct: false },
                        ].map((opt, i) => (
                            <View
                                key={i}
                                style={[styles.optionItem, opt.correct && styles.optionItemCorrect]}
                            >
                                <View style={[styles.optionBadge, opt.correct && styles.optionBadgeCorrect]}>
                                    {opt.correct ? (
                                        <Ionicons name="checkmark" size={8} color="#FFF" />
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
const FeatureCard = ({ icon, iconBg, title, description }) => {
    return (
        <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: iconBg }]}>
                <Ionicons name={icon} size={22} color="#2563EB" />
            </View>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureDescription}>{description}</Text>
        </View>
    );
};

// Pricing Card Component
const PricingCard = ({ plan, price, period, features, popular, onPress }) => {
    return (
        <View style={[styles.pricingCard, popular && styles.pricingCardPopular]}>
            {popular && (
                <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
            )}

            <Text style={styles.pricingPlanName}>{plan}</Text>

            <View style={styles.pricingPriceRow}>
                <Text style={styles.pricingCurrency}>₹</Text>
                <Text style={styles.pricingPrice}>{price}</Text>
                <Text style={styles.pricingPeriod}>/{period}</Text>
            </View>

            <View style={styles.pricingFeatures}>
                {features.map((feature, i) => (
                    <View key={i} style={styles.pricingFeatureRow}>
                        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                        <Text style={styles.pricingFeatureText}>{feature}</Text>
                    </View>
                ))}
            </View>

            <TouchableOpacity
                style={[styles.pricingButton, popular && styles.pricingButtonPopular]}
                onPress={onPress}
            >
                <Text style={[styles.pricingButtonText, popular && styles.pricingButtonTextPopular]}>
                    Get Started
                </Text>
                <Ionicons name="arrow-forward" size={16} color={popular ? '#FFF' : '#0F172A'} />
            </TouchableOpacity>
        </View>
    );
};

export default function LandingScreen({ navigation }) {
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

                        <TouchableOpacity style={styles.signInButton} onPress={handleGetStarted}>
                            <Text style={styles.signInButtonText}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Hero Section */}
                    <View style={styles.heroSection}>
                        {/* Animated Grid Background */}
                        <AnimatedGrid />

                        {/* Sparkles */}
                        <SparklesBackground />

                        <View style={styles.heroRow}>
                            {/* Text Content */}
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
                                    The only AI-powered operating system for serious aspirants. Generate quizzes, get instant feedback, and track progress.
                                </Text>

                                {/* CTA Buttons */}
                                <View style={styles.heroButtons}>
                                    <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
                                        <Text style={styles.primaryButtonText}>Start Learning Free</Text>
                                        <Ionicons name="arrow-forward" size={16} color="#FFF" />
                                    </TouchableOpacity>
                                </View>

                                {/* Social Proof with Animated Avatars */}
                                <View style={styles.socialProof}>
                                    <View style={styles.avatarStack}>
                                        <AnimatedAvatar index={0} emoji="👨‍🎓" delay={0} />
                                        <AnimatedAvatar index={1} emoji="👩‍💼" delay={200} />
                                        <AnimatedAvatar index={2} emoji="🧑‍🏫" delay={400} />
                                        <AnimatedAvatar index={3} emoji="👨‍💻" delay={600} />
                                    </View>
                                    <View style={styles.socialProofTextContainer}>
                                        <View style={styles.starsRow}>
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <Ionicons key={i} name="star" size={12} color="#FACC15" />
                                            ))}
                                        </View>
                                        <Text style={styles.socialProofText}>
                                            <Text style={styles.socialProofBold}>15,000+</Text> aspirants trusting us
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Phone Mockup - Positioned closer */}
                            {isWeb && width > 768 && (
                                <View style={styles.mockupContainer}>
                                    <PhoneMockup />
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Features Section */}
                    <View style={styles.featuresSection}>
                        <View style={styles.featuresHeader}>
                            <Text style={styles.featuresTitle}>
                                Everything you need{'\n'}
                                <Text style={styles.featuresTitleLight}>to crack the exam.</Text>
                            </Text>
                        </View>

                        <View style={styles.featuresGrid}>
                            <FeatureCard
                                icon="hardware-chip-outline"
                                iconBg="#DBEAFE"
                                title="AI Question Engine"
                                description="Auto-generate MCQs from daily news and NCERTs."
                            />
                            <FeatureCard
                                icon="create-outline"
                                iconBg="#E0F2FE"
                                title="Mains Evaluator"
                                description="Get instant AI feedback on your answer writing."
                            />
                            <FeatureCard
                                icon="flash-outline"
                                iconBg="#FEF3C7"
                                title="Smart News Feed"
                                description="Current affairs auto-tagged for UPSC relevance."
                            />
                            <FeatureCard
                                icon="map-outline"
                                iconBg="#D1FAE5"
                                title="Dynamic Roadmap"
                                description="Personalized study plan that adapts to you."
                            />
                        </View>
                    </View>

                    {/* Pricing Section */}
                    <View style={styles.pricingSection}>
                        <View style={styles.pricingHeader}>
                            <Text style={styles.pricingHeaderTitle}>Simple, transparent pricing</Text>
                            <Text style={styles.pricingHeaderSubtitle}>
                                Choose the plan that works for you. Upgrade anytime.
                            </Text>
                        </View>

                        <View style={styles.pricingCards}>
                            <PricingCard
                                plan="Starter"
                                price="399"
                                period="month"
                                features={[
                                    '200 AI Credits / month',
                                    'AI MCQ Generator',
                                    'PDF to MCQ Converter',
                                    'Access to News Articles',
                                    'Basic Progress Tracking',
                                ]}
                                popular={false}
                                onPress={handleGetStarted}
                            />

                            <PricingCard
                                plan="Pro"
                                price="599"
                                period="month"
                                features={[
                                    '400 AI Credits / month',
                                    'Everything in Starter',
                                    'AI Mains Answer Evaluator',
                                    'AI Mind Map Generator',
                                    'Priority Support',
                                    'Early Access to Features',
                                ]}
                                popular={true}
                                onPress={handleGetStarted}
                            />
                        </View>

                        <Text style={styles.pricingNote}>
                            Free trial includes 10 AI credits • No credit card required
                        </Text>
                    </View>

                    {/* CTA Section */}
                    <View style={styles.ctaSection}>
                        <View style={styles.ctaCard}>
                            <Text style={styles.ctaTitle}>Start your UPSC journey today</Text>
                            <Text style={styles.ctaSubtitle}>
                                Join thousands of aspirants already using AI to prepare smarter.
                            </Text>

                            <TouchableOpacity style={styles.ctaPrimaryButton} onPress={handleGetStarted}>
                                <Text style={styles.ctaPrimaryButtonText}>Create Free Account</Text>
                                <Ionicons name="arrow-forward" size={16} color="#0F172A" />
                            </TouchableOpacity>
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

    // Sparkles
    sparklesContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
        pointerEvents: 'none',
    },
    sparkle: {
        position: 'absolute',
        backgroundColor: '#2563EB',
        borderRadius: 10,
        ...Platform.select({
            web: {
                boxShadow: '0 0 10px 2px rgba(37, 99, 235, 0.5)',
            },
        }),
    },

    // Animated Grid
    gridContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: height * 0.7,
        overflow: 'hidden',
        zIndex: 0,
    },
    gridLines: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    gridLineVertical: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: 'rgba(37, 99, 235, 0.05)',
    },
    gridLineHorizontal: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(37, 99, 235, 0.05)',
    },
    glowSpot: {
        position: 'absolute',
        borderRadius: 500,
        backgroundColor: '#2563EB',
    },
    glowSpot1: {
        width: 400,
        height: 400,
        top: -100,
        right: -100,
    },
    glowSpot2: {
        width: 300,
        height: 300,
        bottom: 50,
        left: -100,
    },

    // Animated Avatars
    animatedAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 3,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            web: {
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            },
        }),
    },
    avatarEmoji: {
        fontSize: 16,
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
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
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

    // Hero Section
    heroSection: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 60,
        maxWidth: 1100,
        alignSelf: 'center',
        width: '100%',
        position: 'relative',
        minHeight: isWeb ? 500 : 'auto',
    },
    heroRow: {
        flexDirection: isWeb && width > 768 ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 30,
        position: 'relative',
        zIndex: 10,
    },
    heroContent: {
        flex: 1,
        maxWidth: 480,
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
        marginBottom: 20,
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
        fontSize: isWeb ? 46 : 36,
        fontWeight: '800',
        color: '#0F172A',
        lineHeight: isWeb ? 54 : 44,
        letterSpacing: -1.5,
        marginBottom: 16,
    },
    heroTitleGradient: {
        color: '#2563EB',
    },
    heroSubtitle: {
        fontSize: 15,
        color: '#64748B',
        lineHeight: 24,
        marginBottom: 24,
    },
    heroButtons: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 28,
    },
    primaryButton: {
        backgroundColor: '#0F172A',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 50,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    socialProof: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    avatarStack: {
        flexDirection: 'row',
    },
    socialProofTextContainer: {
        marginLeft: 4,
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

    // Mockup Container
    mockupContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    phoneMockup: {
        width: 200,
        height: 400,
        backgroundColor: '#000',
        borderRadius: 32,
        padding: 5,
        ...Platform.select({
            web: {
                boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.35)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.3,
                shadowRadius: 40,
                elevation: 15,
            },
        }),
    },
    phoneScreen: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 27,
        overflow: 'hidden',
    },
    dynamicIsland: {
        alignItems: 'center',
        paddingTop: 5,
    },
    dynamicIslandPill: {
        width: 60,
        height: 18,
        backgroundColor: '#000',
        borderRadius: 9,
    },
    quizContent: {
        flex: 1,
        paddingTop: 25,
    },
    quizHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    quizSubject: {
        fontSize: 9,
        fontWeight: '700',
        color: '#0F172A',
    },
    quizBadge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 6,
    },
    quizBadgeText: {
        fontSize: 7,
        fontWeight: '700',
        color: '#2563EB',
    },
    questionCard: {
        backgroundColor: '#FFFFFF',
        margin: 10,
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    questionLabel: {
        fontSize: 7,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        marginBottom: 3,
    },
    questionText: {
        fontSize: 9,
        fontWeight: '600',
        color: '#0F172A',
        lineHeight: 13,
    },
    optionsContainer: {
        paddingHorizontal: 10,
        gap: 4,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 6,
    },
    optionItemCorrect: {
        backgroundColor: '#ECFDF5',
        borderColor: '#A7F3D0',
    },
    optionBadge: {
        width: 14,
        height: 14,
        borderRadius: 7,
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
        fontSize: 6,
        fontWeight: '700',
        color: '#64748B',
    },
    optionText: {
        fontSize: 8,
        color: '#475569',
        flex: 1,
    },
    optionTextCorrect: {
        color: '#065F46',
        fontWeight: '600',
    },

    // Features Section
    featuresSection: {
        paddingHorizontal: 24,
        paddingVertical: 60,
        backgroundColor: '#FFFFFF',
        maxWidth: 1100,
        alignSelf: 'center',
        width: '100%',
    },
    featuresHeader: {
        marginBottom: 40,
        maxWidth: 500,
    },
    featuresTitle: {
        fontSize: isWeb ? 36 : 28,
        fontWeight: '800',
        color: '#0F172A',
        lineHeight: isWeb ? 44 : 36,
        letterSpacing: -1,
    },
    featuresTitleLight: {
        color: '#94A3B8',
    },
    featuresGrid: {
        flexDirection: isWeb && width > 600 ? 'row' : 'column',
        flexWrap: 'wrap',
        gap: 16,
    },
    featureCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 20,
        padding: 24,
        flex: isWeb && width > 600 ? 1 : undefined,
        minWidth: isWeb && width > 600 ? 240 : undefined,
        maxWidth: isWeb && width > 600 ? '48%' : undefined,
    },
    featureIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    featureTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 6,
    },
    featureDescription: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 20,
    },

    // Pricing Section
    pricingSection: {
        paddingHorizontal: 24,
        paddingVertical: 80,
        backgroundColor: '#F8FAFC',
    },
    pricingHeader: {
        alignItems: 'center',
        marginBottom: 48,
        maxWidth: 500,
        alignSelf: 'center',
    },
    pricingHeaderTitle: {
        fontSize: isWeb ? 36 : 28,
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -1,
    },
    pricingHeaderSubtitle: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
    },
    pricingCards: {
        flexDirection: isWeb && width > 700 ? 'row' : 'column',
        justifyContent: 'center',
        alignItems: 'stretch',
        gap: 20,
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
    },
    pricingCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 32,
        flex: 1,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        maxWidth: isWeb && width > 700 ? 380 : undefined,
    },
    pricingCardPopular: {
        borderColor: '#2563EB',
        borderWidth: 2,
        ...Platform.select({
            web: {
                boxShadow: '0 20px 50px -10px rgba(37, 99, 235, 0.2)',
            },
        }),
    },
    popularBadge: {
        position: 'absolute',
        top: -12,
        right: 24,
        backgroundColor: '#2563EB',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    popularBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    pricingPlanName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 16,
    },
    pricingPriceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 24,
    },
    pricingCurrency: {
        fontSize: 20,
        fontWeight: '600',
        color: '#0F172A',
    },
    pricingPrice: {
        fontSize: 48,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -2,
    },
    pricingPeriod: {
        fontSize: 14,
        color: '#64748B',
        marginLeft: 4,
    },
    pricingFeatures: {
        gap: 14,
        marginBottom: 28,
    },
    pricingFeatureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    pricingFeatureText: {
        fontSize: 14,
        color: '#475569',
        flex: 1,
    },
    pricingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#F1F5F9',
        paddingVertical: 14,
        borderRadius: 12,
    },
    pricingButtonPopular: {
        backgroundColor: '#0F172A',
    },
    pricingButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    pricingButtonTextPopular: {
        color: '#FFFFFF',
    },
    pricingNote: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 32,
    },

    // CTA Section
    ctaSection: {
        paddingHorizontal: 24,
        paddingVertical: 60,
    },
    ctaCard: {
        backgroundColor: '#0F172A',
        borderRadius: 32,
        padding: isWeb ? 50 : 36,
        alignItems: 'center',
        maxWidth: 700,
        alignSelf: 'center',
        width: '100%',
    },
    ctaTitle: {
        fontSize: isWeb ? 32 : 24,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    ctaSubtitle: {
        fontSize: 15,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 28,
    },
    ctaPrimaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 50,
    },
    ctaPrimaryButtonText: {
        color: '#0F172A',
        fontSize: 14,
        fontWeight: '700',
    },

    // Footer
    footer: {
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: '#FAFAFA',
        paddingVertical: 32,
        paddingHorizontal: 24,
    },
    footerContent: {
        maxWidth: 1100,
        alignSelf: 'center',
        width: '100%',
        flexDirection: isWeb && width > 500 ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
    },
    footerLogo: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    footerLinks: {
        flexDirection: 'row',
        gap: 20,
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
