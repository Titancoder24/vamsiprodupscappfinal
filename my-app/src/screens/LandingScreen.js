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

// Enhanced Sparkle Component with Glow
const Sparkle = ({ delay, left, top, size = 4, color = '#2563EB' }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }),
        ]),
        Animated.delay(600),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0, duration: 300, useNativeDriver: true }),
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
          backgroundColor: color,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
};

// Sparkles Strip (appears below phone)
const SparklesStrip = () => {
  const sparkles = [];
  const colors = ['#2563EB', '#06B6D4', '#8B5CF6', '#EC4899'];

  for (let i = 0; i < 40; i++) {
    sparkles.push({
      delay: Math.random() * 3000,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 2 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  return (
    <View style={styles.sparklesStrip}>
      {/* Gradient Lines */}
      <View style={styles.gradientLineContainer}>
        <View style={[styles.gradientLine, styles.gradientLine1]} />
        <View style={[styles.gradientLine, styles.gradientLine2]} />
      </View>

      {/* Sparkles */}
      {sparkles.map((s, i) => (
        <Sparkle key={i} {...s} />
      ))}

      {/* Radial Fade */}
      <View style={styles.radialFade} />
    </View>
  );
};

// Animated Grid Background
const AnimatedGrid = () => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.02, 0.06] });

  return (
    <View style={styles.gridContainer}>
      <View style={styles.gridLines}>
        {[...Array(12)].map((_, i) => (
          <View key={`v${i}`} style={[styles.gridLineVertical, { left: `${(i + 1) * 8}%` }]} />
        ))}
        {[...Array(8)].map((_, i) => (
          <View key={`h${i}`} style={[styles.gridLineHorizontal, { top: `${(i + 1) * 12}%` }]} />
        ))}
      </View>
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
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(bounce, { toValue: -5, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.1, duration: 500, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(bounce, { toValue: 0, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  const bgColors = ['#DBEAFE', '#D1FAE5', '#FEF3C7', '#FCE7F3'];

  return (
    <Animated.View
      style={[
        styles.animatedAvatar,
        { backgroundColor: bgColors[index % bgColors.length], marginLeft: index > 0 ? -10 : 0, zIndex: 4 - index, transform: [{ translateY: bounce }, { scale }] },
      ]}
    >
      <Text style={styles.avatarEmoji}>{emoji}</Text>
    </Animated.View>
  );
};

// Phone Mockup Component
const PhoneMockup = () => {
  return (
    <View style={styles.phoneMockup}>
      <View style={styles.phoneScreen}>
        <View style={styles.dynamicIsland}>
          <View style={styles.dynamicIslandPill} />
        </View>
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
            <Text style={styles.questionText}>Which act introduced communal representation?</Text>
          </View>
          <View style={styles.optionsContainer}>
            {[
              { id: 'A', text: 'Indian Councils Act, 1892', correct: false },
              { id: 'B', text: 'Indian Councils Act, 1909', correct: true },
              { id: 'C', text: 'Govt. of India Act, 1919', correct: false },
            ].map((opt, i) => (
              <View key={i} style={[styles.optionItem, opt.correct && styles.optionItemCorrect]}>
                <View style={[styles.optionBadge, opt.correct && styles.optionBadgeCorrect]}>
                  {opt.correct ? <Ionicons name="checkmark" size={8} color="#FFF" /> : <Text style={styles.optionBadgeText}>{opt.id}</Text>}
                </View>
                <Text style={[styles.optionText, opt.correct && styles.optionTextCorrect]}>{opt.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

// Feature Card
const FeatureCard = ({ icon, iconBg, title, description }) => (
  <View style={styles.featureCard}>
    <View style={[styles.featureIcon, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={22} color="#2563EB" />
    </View>
    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={styles.featureDescription}>{description}</Text>
  </View>
);

// Pricing Card
const PricingCard = ({ plan, price, period, features, popular, onPress }) => (
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
    <TouchableOpacity style={[styles.pricingButton, popular && styles.pricingButtonPopular]} onPress={onPress}>
      <Text style={[styles.pricingButtonText, popular && styles.pricingButtonTextPopular]}>Get Started</Text>
      <Ionicons name="arrow-forward" size={16} color={popular ? '#FFF' : '#0F172A'} />
    </TouchableOpacity>
  </View>
);

export default function LandingScreen({ navigation }) {
  const scrollRef = useRef(null);
  const [pricingY, setPricingY] = useState(0);

  const handleGetStarted = () => navigation.navigate('Login');

  const scrollToPricing = () => {
    scrollRef.current?.scrollTo({ y: pricingY, animated: true });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Navbar with Links */}
        <View style={styles.navbar}>
          <View style={styles.navbarInner}>
            <View style={styles.logoContainer}>
              <Ionicons name="book" size={20} color="#1A1A1A" />
              <Text style={styles.logoText}>UPSC Prep</Text>
            </View>

            {/* Nav Links */}
            {isWeb && (
              <View style={styles.navLinks}>
                <TouchableOpacity onPress={() => navigation.navigate('Pricing')}>
                  <Text style={styles.navLink}>Pricing</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.navButtons}>
              <TouchableOpacity style={styles.signInLink} onPress={handleGetStarted}>
                <Text style={styles.signInLinkText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.signUpButton} onPress={handleGetStarted}>
                <Text style={styles.signUpButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <AnimatedGrid />

            <View style={styles.heroRow}>
              {/* Text Content */}
              <View style={styles.heroContent}>
                <View style={styles.heroBadge}>
                  <View style={styles.heroBadgeDot} />
                  <Text style={styles.heroBadgeText}>NEW: Mains AI Evaluator 2.0</Text>
                </View>

                <Text style={styles.heroTitle}>
                  Crack UPSC{'\n'}
                  <Text style={styles.heroTitleGradient}>Like a Machine.</Text>
                </Text>

                <Text style={styles.heroSubtitle}>
                  The only AI-powered operating system for serious aspirants.
                </Text>

                <View style={styles.heroButtons}>
                  <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
                    <Text style={styles.primaryButtonText}>Start Learning Free</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>

                {/* Social Proof */}
                <View style={styles.socialProof}>
                  <View style={styles.avatarStack}>
                    <AnimatedAvatar index={0} emoji="👨‍🎓" delay={0} />
                    <AnimatedAvatar index={1} emoji="👩‍💼" delay={200} />
                    <AnimatedAvatar index={2} emoji="🧑‍🏫" delay={400} />
                    <AnimatedAvatar index={3} emoji="👨‍💻" delay={600} />
                  </View>
                  <View>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Ionicons key={i} name="star" size={12} color="#FACC15" />
                      ))}
                    </View>
                    <Text style={styles.socialProofText}>
                      <Text style={styles.socialProofBold}>15,000+</Text> aspirants
                    </Text>
                  </View>
                </View>
              </View>

              {/* Phone + Sparkles */}
              {isWeb && width > 768 && (
                <View style={styles.mockupWrapper}>
                  <PhoneMockup />
                </View>
              )}
            </View>
          </View>

          {/* Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>
              Everything you need{'\n'}
              <Text style={styles.featuresTitleLight}>to crack the exam.</Text>
            </Text>
            <View style={styles.featuresGrid}>
              <FeatureCard icon="hardware-chip-outline" iconBg="#DBEAFE" title="AI Question Engine" description="Auto-generate MCQs from any topic or current affairs." />
              <FeatureCard icon="create-outline" iconBg="#E0F2FE" title="Mains Evaluator" description="Get AI-powered feedback on your answers instantly." />
              <FeatureCard icon="flash-outline" iconBg="#FEF3C7" title="Smart News Feed" description="Tagged current affairs with MCQ practice." />
              <FeatureCard icon="map-outline" iconBg="#D1FAE5" title="Dynamic Roadmap" description="Personalized study plan based on your progress." />
              <FeatureCard icon="document-text-outline" iconBg="#FCE7F3" title="PDF to MCQ" description="Extract MCQs from any PDF document using AI." />
              <FeatureCard icon="git-network-outline" iconBg="#E0E7FF" title="Mind Maps" description="Visual learning with interactive mind maps." />
            </View>
          </View>

          {/* Why Choose Us */}
          <View style={styles.whySection}>
            <Text style={styles.whyTitle}>Why aspirants love PrepAssist</Text>
            <View style={styles.whyGrid}>
              <View style={styles.whyStat}>
                <Text style={styles.whyNumber}>15K+</Text>
                <Text style={styles.whyLabel}>Active Users</Text>
              </View>
              <View style={styles.whyStat}>
                <Text style={styles.whyNumber}>50K+</Text>
                <Text style={styles.whyLabel}>MCQs Solved</Text>
              </View>
              <View style={styles.whyStat}>
                <Text style={styles.whyNumber}>4.9</Text>
                <Text style={styles.whyLabel}>App Rating</Text>
              </View>
              <View style={styles.whyStat}>
                <Text style={styles.whyNumber}>24/7</Text>
                <Text style={styles.whyLabel}>AI Support</Text>
              </View>
            </View>
          </View>

          {/* Pricing CTA */}
          <View style={styles.pricingCTA}>
            <Text style={styles.pricingCTATitle}>Ready to start your UPSC journey?</Text>
            <Text style={styles.pricingCTASubtitle}>Choose from our affordable plans starting at just ₹399/month</Text>
            <TouchableOpacity
              style={styles.pricingCTAButton}
              onPress={() => navigation.navigate('Pricing')}
            >
              <Text style={styles.pricingCTAButtonText}>View Pricing Plans</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* CTA */}
          <View style={styles.ctaSection}>
            <View style={styles.ctaCard}>
              <Text style={styles.ctaTitle}>Start your journey today</Text>
              <TouchableOpacity style={styles.ctaPrimaryButton} onPress={handleGetStarted}>
                <Text style={styles.ctaPrimaryButtonText}>Create Free Account</Text>
                <Ionicons name="arrow-forward" size={16} color="#0F172A" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerLogo}>UPSC Prep</Text>
            <Text style={styles.footerCopyright}>© 2025 UPSC Prep. All rights reserved.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  safeArea: { flex: 1 },

  // Sparkles Strip
  sparklesStrip: {
    width: '100%',
    height: 120,
    backgroundColor: '#0F172A',
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  sparkle: {
    position: 'absolute',
    borderRadius: 20,
    ...Platform.select({
      web: { boxShadow: '0 0 8px 2px currentColor' },
    }),
  },
  gradientLineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    alignItems: 'center',
  },
  gradientLine: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
  },
  gradientLine1: {
    width: '60%',
    backgroundColor: '#6366F1',
    opacity: 0.8,
  },
  gradientLine2: {
    width: '30%',
    backgroundColor: '#06B6D4',
    opacity: 0.6,
    top: 2,
  },
  radialFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#0F172A',
  },

  // Grid
  gridContainer: { position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.6, overflow: 'hidden', zIndex: 0 },
  gridLines: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  gridLineVertical: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(37, 99, 235, 0.04)' },
  gridLineHorizontal: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(37, 99, 235, 0.04)' },
  glowSpot: { position: 'absolute', borderRadius: 500, backgroundColor: '#2563EB' },
  glowSpot1: { width: 400, height: 400, top: -100, right: -100 },
  glowSpot2: { width: 300, height: 300, bottom: 50, left: -100 },

  // Avatars
  animatedAvatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 14 },

  // Navbar
  navbar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, paddingTop: Platform.OS === 'ios' ? 50 : 10, paddingHorizontal: 20 },
  navbarInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.95)', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 50, borderWidth: 1, borderColor: '#E5E7EB' },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoText: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  navLinks: { flexDirection: 'row', gap: 24 },
  navLink: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  navButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  signInLink: { paddingHorizontal: 12, paddingVertical: 8 },
  signInLinkText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  signUpButton: { backgroundColor: '#0F172A', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 50 },
  signUpButtonText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: Platform.OS === 'ios' ? 100 : 70 },

  // Hero
  heroSection: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40, maxWidth: 1100, alignSelf: 'center', width: '100%', position: 'relative' },
  heroRow: { flexDirection: isWeb && width > 768 ? 'row' : 'column', alignItems: 'center', gap: 30, zIndex: 10 },
  heroContent: { flex: 1, maxWidth: 460 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#BFDBFE', marginBottom: 16 },
  heroBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2563EB', marginRight: 6 },
  heroBadgeText: { fontSize: 9, fontWeight: '700', color: '#1D4ED8', textTransform: 'uppercase' },
  heroTitle: { fontSize: isWeb ? 44 : 34, fontWeight: '800', color: '#0F172A', lineHeight: isWeb ? 52 : 42, letterSpacing: -1.5, marginBottom: 12 },
  heroTitleGradient: { color: '#2563EB' },
  heroSubtitle: { fontSize: 14, color: '#64748B', lineHeight: 22, marginBottom: 20 },
  heroButtons: { flexDirection: 'row', marginBottom: 24 },
  primaryButton: { backgroundColor: '#0F172A', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 50 },
  primaryButtonText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  socialProof: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarStack: { flexDirection: 'row' },
  starsRow: { flexDirection: 'row', gap: 1, marginBottom: 2 },
  socialProofText: { fontSize: 11, color: '#64748B' },
  socialProofBold: { fontWeight: '700', color: '#0F172A' },

  // Mockup
  mockupWrapper: { alignItems: 'center' },
  phoneMockup: { width: 180, height: 360, backgroundColor: '#000', borderRadius: 28, padding: 5 },
  phoneScreen: { flex: 1, backgroundColor: '#FFF', borderRadius: 23, overflow: 'hidden' },
  dynamicIsland: { alignItems: 'center', paddingTop: 4 },
  dynamicIslandPill: { width: 50, height: 16, backgroundColor: '#000', borderRadius: 8 },
  quizContent: { flex: 1, paddingTop: 20 },
  quizHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  quizSubject: { fontSize: 8, fontWeight: '700', color: '#0F172A' },
  quizBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  quizBadgeText: { fontSize: 6, fontWeight: '700', color: '#2563EB' },
  questionCard: { margin: 8, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  questionLabel: { fontSize: 6, fontWeight: '700', color: '#94A3B8', marginBottom: 2 },
  questionText: { fontSize: 8, fontWeight: '600', color: '#0F172A', lineHeight: 11 },
  optionsContainer: { paddingHorizontal: 8, gap: 3 },
  optionItem: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, padding: 5 },
  optionItemCorrect: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  optionBadge: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  optionBadgeCorrect: { backgroundColor: '#10B981', borderColor: '#10B981' },
  optionBadgeText: { fontSize: 5, fontWeight: '700', color: '#64748B' },
  optionText: { fontSize: 7, color: '#475569', flex: 1 },
  optionTextCorrect: { color: '#065F46', fontWeight: '600' },

  // Features
  featuresSection: { paddingHorizontal: 24, paddingVertical: 50, maxWidth: 1100, alignSelf: 'center', width: '100%' },
  featuresTitle: { fontSize: isWeb ? 32 : 26, fontWeight: '800', color: '#0F172A', marginBottom: 32 },
  featuresTitleLight: { color: '#94A3B8' },
  featuresGrid: { flexDirection: isWeb && width > 600 ? 'row' : 'column', flexWrap: 'wrap', gap: 14 },
  featureCard: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 18, padding: 20, flex: isWeb && width > 600 ? 1 : undefined, minWidth: isWeb && width > 600 ? 220 : undefined, maxWidth: isWeb && width > 600 ? '31%' : undefined },
  featureIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  featureDescription: { fontSize: 12, color: '#64748B', lineHeight: 18 },

  // Why Section
  whySection: { paddingHorizontal: 24, paddingVertical: 60, backgroundColor: '#0F172A' },
  whyTitle: { fontSize: isWeb ? 32 : 26, fontWeight: '800', color: '#FFF', textAlign: 'center', marginBottom: 40 },
  whyGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 32 },
  whyStat: { alignItems: 'center', minWidth: 120 },
  whyNumber: { fontSize: isWeb ? 48 : 36, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  whyLabel: { fontSize: 14, color: '#94A3B8', fontWeight: '600' },

  // Pricing CTA
  pricingCTA: { paddingHorizontal: 24, paddingVertical: 60, backgroundColor: '#F8FAFC', alignItems: 'center' },
  pricingCTATitle: { fontSize: isWeb ? 32 : 26, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 12 },
  pricingCTASubtitle: { fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 32, maxWidth: 500 },
  pricingCTAButton: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#3B82F6', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 14 },
  pricingCTAButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  // CTA
  ctaSection: { paddingHorizontal: 24, paddingVertical: 50 },
  ctaCard: { backgroundColor: '#0F172A', borderRadius: 28, padding: 40, alignItems: 'center', maxWidth: 600, alignSelf: 'center', width: '100%' },
  ctaTitle: { fontSize: isWeb ? 28 : 22, fontWeight: '800', color: '#FFF', textAlign: 'center', marginBottom: 20 },
  ctaPrimaryButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 50 },
  ctaPrimaryButtonText: { color: '#0F172A', fontSize: 13, fontWeight: '700' },

  // Footer
  footer: { borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#FAFAFA', paddingVertical: 28, alignItems: 'center' },
  footerLogo: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  footerCopyright: { fontSize: 10, color: '#94A3B8' },
});
