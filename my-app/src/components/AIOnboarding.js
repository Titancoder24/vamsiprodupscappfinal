import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Platform,
    Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// AI Cursor Component (Figma-style)
const AICursor = ({ color = '#2563EB', name, position, children }) => {
    const bounce = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(bounce, { toValue: -3, duration: 800, useNativeDriver: true }),
                Animated.timing(bounce, { toValue: 0, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.cursorContainer,
                position,
                { transform: [{ translateY: bounce }] },
            ]}
        >
            {/* Cursor Arrow */}
            <View style={[styles.cursorArrow, { borderBottomColor: color }]} />

            {/* Name Badge */}
            <View style={[styles.cursorBadge, { backgroundColor: color }]}>
                <Text style={styles.cursorName}>{name}</Text>
            </View>

            {/* Comment Bubble */}
            <View style={[styles.commentBubble, { borderColor: color }]}>
                <Text style={styles.commentText}>{children}</Text>
            </View>
        </Animated.View>
    );
};

// Onboarding Steps
const ONBOARDING_STEPS = [
    {
        id: 'welcome',
        agent: 'Arjun',
        color: '#2563EB',
        title: 'Welcome to UPSC Prep! 👋',
        message: "Hi! I'm Arjun, your AI study companion. Let me show you around the app and help you get started!",
        position: { top: '20%', left: isWeb ? '30%' : '10%' },
    },
    {
        id: 'features-intro',
        agent: 'Priya',
        color: '#8B5CF6',
        title: 'Powerful AI Features',
        message: "Hello! I'm Priya. This app has 7 amazing AI-powered features to help you crack UPSC. Let me explain each one!",
        position: { top: '15%', right: isWeb ? '25%' : '5%' },
    },
    {
        id: 'feature-1',
        agent: 'Priya',
        color: '#8B5CF6',
        title: '1. AI MCQ Generator',
        message: 'Generate unlimited practice MCQs from any topic. Our AI creates exam-quality questions tailored to UPSC patterns.',
        position: { top: '25%', left: isWeb ? '20%' : '5%' },
    },
    {
        id: 'feature-2',
        agent: 'Priya',
        color: '#8B5CF6',
        title: '2. PDF to MCQ Converter',
        message: 'Upload any PDF (NCERT, notes) and instantly get MCQs generated from the content. Study smarter, not harder!',
        position: { top: '30%', right: isWeb ? '20%' : '5%' },
    },
    {
        id: 'feature-3',
        agent: 'Priya',
        color: '#8B5CF6',
        title: '3. Mains Answer Evaluator',
        message: 'Write practice answers and get instant AI feedback on structure, content, and presentation - just like a real examiner!',
        position: { top: '35%', left: isWeb ? '25%' : '5%' },
    },
    {
        id: 'feature-4',
        agent: 'Priya',
        color: '#8B5CF6',
        title: '4. Mind Map Generator',
        message: 'Visualize complex topics with AI-generated mind maps. Perfect for revision and connecting concepts!',
        position: { top: '40%', right: isWeb ? '25%' : '5%' },
    },
    {
        id: 'feature-5',
        agent: 'Priya',
        color: '#8B5CF6',
        title: '5. Smart News Feed',
        message: 'Daily current affairs auto-tagged for UPSC relevance. Never miss an important news item again!',
        position: { top: '30%', left: isWeb ? '20%' : '5%' },
    },
    {
        id: 'feature-6',
        agent: 'Priya',
        color: '#8B5CF6',
        title: '6. Notes Summarizer',
        message: 'Turn lengthy notes into crisp summaries. AI extracts key points so you remember what matters most.',
        position: { top: '25%', right: isWeb ? '20%' : '5%' },
    },
    {
        id: 'feature-7',
        agent: 'Priya',
        color: '#8B5CF6',
        title: '7. Dynamic Study Roadmap',
        message: 'Get a personalized study plan that adapts to your progress. Your path to success, customized!',
        position: { top: '20%', left: isWeb ? '25%' : '5%' },
    },
    {
        id: 'pricing',
        agent: 'Arjun',
        color: '#2563EB',
        title: 'Choose Your Plan 💎',
        message: "To unlock all these AI features, you'll need credits. I recommend the Pro plan at ₹599/month - it gives you 400 credits and access to ALL features. Best value for serious aspirants!",
        position: { top: '20%', left: isWeb ? '30%' : '10%' },
    },
    {
        id: 'pricing-explain',
        agent: 'Arjun',
        color: '#2563EB',
        title: 'Why Pro at ₹599?',
        message: '✅ 400 AI Credits (enough for 100+ sessions)\n✅ Mains Answer Evaluator access\n✅ Mind Map Generator\n✅ Priority Support\n✅ Early feature access\n\nStarter at ₹399 is great too, but Pro gives you double the credits!',
        position: { top: '25%', right: isWeb ? '20%' : '5%' },
    },
    {
        id: 'done',
        agent: 'Arjun',
        color: '#2563EB',
        title: "You're All Set! 🚀",
        message: "That's it! Start exploring the app. I'll be here if you need any help. Good luck with your UPSC preparation!",
        position: { top: '20%', left: isWeb ? '30%' : '10%' },
    },
];

export default function AIOnboarding({ visible, onComplete, onNavigateToBilling }) {
    const [currentStep, setCurrentStep] = useState(0);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
            ]).start();
        }
    }, [visible, currentStep]);

    const handleNext = () => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            // Animate out
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: -50, duration: 200, useNativeDriver: true }),
            ]).start(() => {
                setCurrentStep(currentStep + 1);
                slideAnim.setValue(50);
                // Animate in
                Animated.parallel([
                    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
                ]).start();
            });
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = async () => {
        try {
            await AsyncStorage.setItem('onboarding_complete', 'true');
        } catch (e) { }
        onComplete();
    };

    const handleGoToPricing = () => {
        handleComplete();
        onNavigateToBilling?.();
    };

    if (!visible) return null;

    const step = ONBOARDING_STEPS[currentStep];
    const isPricingStep = step.id === 'pricing' || step.id === 'pricing-explain';

    return (
        <Modal transparent visible={visible} animationType="none">
            <View style={styles.overlay}>
                {/* Animated Content */}
                <Animated.View
                    style={[
                        styles.contentContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    {/* AI Cursor */}
                    <View style={styles.cursorWrapper}>
                        <AICursor
                            color={step.color}
                            name={step.agent}
                            position={{ alignSelf: 'flex-start' }}
                        >
                            {step.message}
                        </AICursor>
                    </View>

                    {/* Title */}
                    <Text style={styles.stepTitle}>{step.title}</Text>

                    {/* Progress */}
                    <View style={styles.progressContainer}>
                        {ONBOARDING_STEPS.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.progressDot,
                                    i === currentStep && styles.progressDotActive,
                                    i < currentStep && styles.progressDotDone,
                                ]}
                            />
                        ))}
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                            <Text style={styles.skipButtonText}>Skip Tour</Text>
                        </TouchableOpacity>

                        {isPricingStep && (
                            <TouchableOpacity style={styles.pricingButton} onPress={handleGoToPricing}>
                                <Text style={styles.pricingButtonText}>View Plans</Text>
                                <Ionicons name="arrow-forward" size={16} color="#FFF" />
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                            <Text style={styles.nextButtonText}>
                                {currentStep === ONBOARDING_STEPS.length - 1 ? "Let's Go!" : 'Next'}
                            </Text>
                            <Ionicons name="arrow-forward" size={16} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

// Hook to check if onboarding should be shown
export const useOnboarding = () => {
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkOnboardingStatus();
    }, []);

    const checkOnboardingStatus = async () => {
        try {
            const completed = await AsyncStorage.getItem('onboarding_complete');
            setShowOnboarding(completed !== 'true');
        } catch (e) {
            setShowOnboarding(true);
        }
        setLoading(false);
    };

    const resetOnboarding = async () => {
        try {
            await AsyncStorage.removeItem('onboarding_complete');
            setShowOnboarding(true);
        } catch (e) { }
    };

    return { showOnboarding, setShowOnboarding, loading, resetOnboarding };
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    contentContainer: {
        width: '100%',
        maxWidth: 500,
        alignItems: 'center',
    },
    cursorWrapper: {
        width: '100%',
        marginBottom: 24,
    },
    cursorContainer: {
        alignItems: 'flex-start',
    },
    cursorArrow: {
        width: 0,
        height: 0,
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderBottomWidth: 12,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        marginLeft: 8,
        marginBottom: -1,
    },
    cursorBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        marginBottom: 8,
    },
    cursorName: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    commentBubble: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        borderWidth: 2,
        padding: 16,
        maxWidth: isWeb ? 400 : '100%',
        ...Platform.select({
            web: {
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 8,
            },
        }),
    },
    commentText: {
        fontSize: 15,
        color: '#1F2937',
        lineHeight: 24,
    },
    stepTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 20,
    },
    progressContainer: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 24,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    progressDotActive: {
        backgroundColor: '#2563EB',
        width: 24,
    },
    progressDotDone: {
        backgroundColor: '#10B981',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    skipButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    skipButtonText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
        fontWeight: '600',
    },
    pricingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 50,
        backgroundColor: '#8B5CF6',
    },
    pricingButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 50,
        backgroundColor: '#2563EB',
    },
    nextButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
});
