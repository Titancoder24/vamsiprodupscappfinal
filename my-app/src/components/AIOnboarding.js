import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Platform,
    ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Figma-style Cursor SVG Component
const FigmaCursor = ({ color }) => (
    <Svg width="24" height="36" viewBox="0 0 24 36" fill="none">
        {/* Mouse pointer shape */}
        <Path
            d="M5.65376 12.4563L0.161133 0.5L15.8391 12.4563H5.65376Z"
            fill={color}
            stroke="#FFFFFF"
            strokeWidth="1.5"
        />
        {/* Extended tail for Figma look */}
        <Path
            d="M5.65376 12.4563L8.5 24L11.5 12.4563H5.65376Z"
            fill={color}
        />
    </Svg>
);

// All onboarding steps with feature explanations
const ONBOARDING_STEPS = [
    // Welcome
    {
        id: 'welcome',
        agent: 'Arjun',
        color: '#2563EB',
        title: 'Welcome! 👋',
        message: "Hi! I'm Arjun, your study guide. Let me show you the amazing AI features in this app!",
        target: 'credits',
    },
    // Feature 1: News Feed
    {
        id: 'news',
        agent: 'Priya',
        color: '#8B5CF6',
        title: 'News Feed',
        message: '📰 Stay updated with daily current affairs auto-tagged for UPSC. Never miss important news!',
        target: 'feature-0',
        featureIndex: 0,
    },
    // Feature 2: MCQ Generator
    {
        id: 'mcq',
        agent: 'Arjun',
        color: '#007AFF',
        title: 'MCQ Generator',
        message: '✏️ Generate unlimited practice MCQs from any topic. AI creates exam-quality questions!',
        target: 'feature-1',
        featureIndex: 1,
    },
    // Feature 3: AI Mind Map
    {
        id: 'mindmap',
        agent: 'Priya',
        color: '#06B6D4',
        title: 'AI Mind Map',
        message: '🧠 Visualize complex topics with AI-generated mind maps. Perfect for revision!',
        target: 'feature-2',
        featureIndex: 2,
    },
    // Feature 4: PDF to MCQ
    {
        id: 'pdfmcq',
        agent: 'Arjun',
        color: '#FF2D55',
        title: 'PDF to MCQ',
        message: '📄 Upload any PDF (NCERT, notes) and instantly get MCQs. Study smarter!',
        target: 'feature-3',
        featureIndex: 3,
    },
    // Feature 5: Essay Writing
    {
        id: 'essay',
        agent: 'Priya',
        color: '#FF9500',
        title: 'Essay Evaluator',
        message: '📝 Write practice answers and get instant AI feedback - just like a real examiner!',
        target: 'feature-4',
        featureIndex: 4,
    },
    // Feature 6: Notes
    {
        id: 'notes',
        agent: 'Arjun',
        color: '#6366F1',
        title: 'Smart Notes',
        message: '📓 Create, organize, and summarize notes with AI assistance.',
        target: 'feature-5',
        featureIndex: 5,
    },
    // Feature 7: Question Paper
    {
        id: 'qp',
        agent: 'Priya',
        color: '#10B981',
        title: 'Question Papers',
        message: '📋 Access previous year papers with detailed solutions.',
        target: 'feature-6',
        featureIndex: 6,
    },
    // Credits/Pricing
    {
        id: 'credits',
        agent: 'Arjun',
        color: '#2563EB',
        title: 'Get Credits 💎',
        message: "To use these AI features, you need credits. I recommend the Pro plan at ₹599/month - 400 credits, best value!",
        target: 'credits',
    },
];

// Animated AI Cursor Component
const AICursor = ({ step, position, onNext, onSkip, isLast, stepNumber, totalSteps }) => {
    const cursorX = useRef(new Animated.Value(position.startX)).current;
    const cursorY = useRef(new Animated.Value(position.startY)).current;
    const bounce = useRef(new Animated.Value(0)).current;
    const clickScale = useRef(new Animated.Value(1)).current;
    const messageOpacity = useRef(new Animated.Value(0)).current;
    const rippleScale = useRef(new Animated.Value(0)).current;
    const rippleOpacity = useRef(new Animated.Value(0)).current;
    const [showMessage, setShowMessage] = useState(false);

    useEffect(() => {
        // Reset animations
        cursorX.setValue(position.startX);
        cursorY.setValue(position.startY);
        messageOpacity.setValue(0);
        setShowMessage(false);

        // Animate cursor to target
        Animated.sequence([
            Animated.parallel([
                Animated.spring(cursorX, {
                    toValue: position.endX,
                    friction: 7,
                    tension: 35,
                    useNativeDriver: true
                }),
                Animated.spring(cursorY, {
                    toValue: position.endY,
                    friction: 7,
                    tension: 35,
                    useNativeDriver: true
                }),
            ]),
            Animated.delay(150),
            // Click effect
            Animated.sequence([
                Animated.timing(clickScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
                Animated.timing(clickScale, { toValue: 1, duration: 80, useNativeDriver: true }),
            ]),
        ]).start(() => {
            // Ripple effect
            Animated.parallel([
                Animated.timing(rippleScale, { toValue: 1.5, duration: 350, useNativeDriver: true }),
                Animated.sequence([
                    Animated.timing(rippleOpacity, { toValue: 0.5, duration: 80, useNativeDriver: true }),
                    Animated.timing(rippleOpacity, { toValue: 0, duration: 270, useNativeDriver: true }),
                ]),
            ]).start();

            // Show message
            setShowMessage(true);
            Animated.timing(messageOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();

            // Floating animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(bounce, { toValue: -3, duration: 700, useNativeDriver: true }),
                    Animated.timing(bounce, { toValue: 0, duration: 700, useNativeDriver: true }),
                ])
            ).start();
        });
    }, [step.id]);

    return (
        <View style={styles.cursorOverlay} pointerEvents="box-none">
            {/* Click Ripple */}
            <Animated.View
                style={[
                    styles.ripple,
                    {
                        left: position.endX - 18,
                        top: position.endY - 18,
                        backgroundColor: step.color,
                        transform: [{ scale: rippleScale }],
                        opacity: rippleOpacity,
                    },
                ]}
            />

            {/* Spotlight */}
            {position.spotlight && (
                <View
                    style={[
                        styles.spotlight,
                        {
                            left: position.spotlight.x,
                            top: position.spotlight.y,
                            width: position.spotlight.width,
                            height: position.spotlight.height,
                        },
                    ]}
                />
            )}

            {/* Animated Cursor */}
            <Animated.View
                style={[
                    styles.cursor,
                    {
                        transform: [
                            { translateX: cursorX },
                            { translateY: cursorY },
                            { translateY: bounce },
                            { scale: clickScale },
                        ],
                    },
                ]}
            >
                <FigmaCursor color={step.color} />
                <View style={[styles.cursorTag, { backgroundColor: step.color }]}>
                    <Text style={styles.cursorName}>{step.agent}</Text>
                </View>
            </Animated.View>

            {/* Message Bubble */}
            {showMessage && (
                <Animated.View
                    style={[
                        styles.messageBubble,
                        {
                            opacity: messageOpacity,
                            left: Math.max(20, Math.min(position.endX - 80, width - 300)),
                            top: Math.min(position.endY + 55, height - 200),
                        },
                    ]}
                >
                    <View style={[styles.bubbleArrow, { borderBottomColor: '#FFF' }]} />

                    {/* Step counter */}
                    <View style={styles.stepCounter}>
                        <Text style={styles.stepCounterText}>{stepNumber}/{totalSteps}</Text>
                    </View>

                    <Text style={[styles.messageTitle, { color: step.color }]}>{step.title}</Text>
                    <Text style={styles.messageText}>{step.message}</Text>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
                            <Text style={styles.skipBtnText}>Skip Tour</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.nextBtn, { backgroundColor: step.color }]}
                            onPress={onNext}
                        >
                            <Text style={styles.nextBtnText}>{isLast ? "Done!" : "Next →"}</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}
        </View>
    );
};

// Main Onboarding Component
export default function AIOnboarding({ visible, onComplete, creditsPosition, featurePositions }) {
    const [currentStep, setCurrentStep] = useState(0);

    // Calculate positions for each step
    const getPosition = (step) => {
        const baseStart = { x: isWeb ? width * 0.3 : 50, y: isWeb ? 300 : 200 };

        if (step.target === 'credits') {
            return {
                startX: baseStart.x,
                startY: baseStart.y,
                endX: creditsPosition?.x || (isWeb ? width - 120 : width - 60),
                endY: creditsPosition?.y || 55,
                spotlight: {
                    x: (creditsPosition?.x || (isWeb ? width - 120 : width - 60)) - 45,
                    y: (creditsPosition?.y || 55) - 18,
                    width: 90,
                    height: 40,
                },
            };
        }

        if (step.featureIndex !== undefined) {
            // Calculate feature card position based on grid
            const cols = isWeb ? 4 : 2;
            const cardWidth = isWeb ? 160 : (width - 60) / 2;
            const cardHeight = isWeb ? 100 : 90;
            const row = Math.floor(step.featureIndex / cols);
            const col = step.featureIndex % cols;
            const startX = isWeb ? 80 : 25;
            const startY = isWeb ? 300 : 280;
            const gapX = isWeb ? 20 : 15;
            const gapY = isWeb ? 15 : 12;

            const x = startX + col * (cardWidth + gapX) + cardWidth / 2;
            const y = startY + row * (cardHeight + gapY) + cardHeight / 2;

            return {
                startX: step.featureIndex % 2 === 0 ? 0 : width,
                startY: y,
                endX: x,
                endY: y - 30,
                spotlight: {
                    x: x - cardWidth / 2 - 5,
                    y: y - cardHeight / 2 - 5,
                    width: cardWidth + 10,
                    height: cardHeight + 10,
                },
            };
        }

        return { startX: 0, startY: 0, endX: width / 2, endY: height / 2 };
    };

    const handleNext = () => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleSkip = async () => {
        handleComplete();
    };

    const handleComplete = async () => {
        try {
            await AsyncStorage.setItem('ai_onboarding_complete', 'true');
        } catch (e) { }
        onComplete();
    };

    if (!visible) return null;

    const step = ONBOARDING_STEPS[currentStep];
    const position = getPosition(step);

    return (
        <View style={styles.container}>
            <View style={styles.overlay} />

            <AICursor
                key={step.id}
                step={step}
                position={position}
                onNext={handleNext}
                onSkip={handleSkip}
                isLast={currentStep === ONBOARDING_STEPS.length - 1}
                stepNumber={currentStep + 1}
                totalSteps={ONBOARDING_STEPS.length}
            />
        </View>
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
            const completed = await AsyncStorage.getItem('ai_onboarding_complete');
            setShowOnboarding(completed !== 'true');
        } catch (e) {
            setShowOnboarding(true);
        }
        setLoading(false);
    };

    const resetOnboarding = async () => {
        try {
            await AsyncStorage.removeItem('ai_onboarding_complete');
            setShowOnboarding(true);
        } catch (e) { }
    };

    return { showOnboarding, setShowOnboarding, loading, resetOnboarding };
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    cursorOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    spotlight: {
        position: 'absolute',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.9)',
        backgroundColor: 'transparent',
        ...Platform.select({
            web: {
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 30px 8px rgba(255, 255, 255, 0.15)',
            },
        }),
    },
    ripple: {
        position: 'absolute',
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    cursor: {
        position: 'absolute',
        zIndex: 100,
    },
    cursorTag: {
        position: 'absolute',
        left: 18,
        top: 22,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        ...Platform.select({
            web: {
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 4,
            },
        }),
    },
    cursorName: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    messageBubble: {
        position: 'absolute',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 18,
        maxWidth: 280,
        minWidth: 240,
        ...Platform.select({
            web: {
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 12,
            },
        }),
    },
    bubbleArrow: {
        position: 'absolute',
        top: -10,
        left: 25,
        width: 0,
        height: 0,
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderBottomWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
    },
    stepCounter: {
        position: 'absolute',
        top: 12,
        right: 14,
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    stepCounterText: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '600',
    },
    messageTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 6,
    },
    messageText: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 22,
        marginBottom: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    skipBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    skipBtnText: {
        color: '#9CA3AF',
        fontSize: 13,
        fontWeight: '500',
    },
    nextBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 22,
    },
    nextBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
});
