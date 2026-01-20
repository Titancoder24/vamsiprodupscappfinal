import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Figma-style Cursor SVG Component
const FigmaCursor = ({ color }) => (
    <Svg width="24" height="36" viewBox="0 0 24 36" fill="none">
        <Defs>
            <LinearGradient id="cursorGrad" x1="0" y1="0" x2="24" y2="36">
                <Stop offset="0%" stopColor={color} stopOpacity="1" />
                <Stop offset="100%" stopColor={color} stopOpacity="0.8" />
            </LinearGradient>
        </Defs>
        {/* Mouse pointer shape */}
        <Path
            d="M5.65376 12.4563L0.161133 0.5L15.8391 12.4563H5.65376Z"
            fill={color}
            stroke="#FFFFFF"
            strokeWidth="1"
        />
        {/* Extended tail for Figma look */}
        <Path
            d="M5.65376 12.4563L8.5 24L11.5 12.4563H5.65376Z"
            fill={color}
        />
    </Svg>
);

// Animated AI Cursor that points at elements
const AICursor = ({ name, color, position, message, onComplete, isLast }) => {
    const cursorX = useRef(new Animated.Value(position.startX || 0)).current;
    const cursorY = useRef(new Animated.Value(position.startY || 0)).current;
    const bounce = useRef(new Animated.Value(0)).current;
    const clickScale = useRef(new Animated.Value(1)).current;
    const messageOpacity = useRef(new Animated.Value(0)).current;
    const clickRippleScale = useRef(new Animated.Value(0)).current;
    const clickRippleOpacity = useRef(new Animated.Value(0)).current;
    const [showMessage, setShowMessage] = useState(false);

    useEffect(() => {
        // Animate cursor moving to target
        Animated.sequence([
            // Move to target with smooth spring
            Animated.parallel([
                Animated.spring(cursorX, {
                    toValue: position.endX,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true
                }),
                Animated.spring(cursorY, {
                    toValue: position.endY,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true
                }),
            ]),
            // Pause briefly
            Animated.delay(200),
            // Click animation - scale down and up
            Animated.sequence([
                Animated.timing(clickScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
                Animated.timing(clickScale, { toValue: 1, duration: 80, useNativeDriver: true }),
            ]),
        ]).start(() => {
            // Show ripple effect
            Animated.parallel([
                Animated.timing(clickRippleScale, { toValue: 1.5, duration: 400, useNativeDriver: true }),
                Animated.sequence([
                    Animated.timing(clickRippleOpacity, { toValue: 0.6, duration: 100, useNativeDriver: true }),
                    Animated.timing(clickRippleOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
                ]),
            ]).start();

            setShowMessage(true);
            // Show message after click
            Animated.timing(messageOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();

            // Gentle floating animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(bounce, { toValue: -4, duration: 800, useNativeDriver: true }),
                    Animated.timing(bounce, { toValue: 0, duration: 800, useNativeDriver: true }),
                ])
            ).start();
        });
    }, []);

    return (
        <View style={styles.cursorOverlay}>
            {/* Click Ripple Effect */}
            <Animated.View
                style={[
                    styles.clickRipple,
                    {
                        left: position.endX - 20,
                        top: position.endY - 20,
                        backgroundColor: color,
                        transform: [{ scale: clickRippleScale }],
                        opacity: clickRippleOpacity,
                    },
                ]}
            />

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
                {/* Figma-style Cursor */}
                <View style={styles.cursorPointer}>
                    <FigmaCursor color={color} />
                </View>

                {/* Name Tag - positioned like Figma */}
                <View style={[styles.cursorTag, { backgroundColor: color }]}>
                    <Text style={styles.cursorName}>{name}</Text>
                </View>
            </Animated.View>

            {/* Message Bubble */}
            {showMessage && (
                <Animated.View
                    style={[
                        styles.messageBubble,
                        {
                            opacity: messageOpacity,
                            left: Math.min(Math.max(position.endX - 100, 20), width - 300),
                            top: position.endY + 60,
                        },
                    ]}
                >
                    {/* Speech bubble arrow */}
                    <View style={[styles.bubbleArrow, { borderBottomColor: '#FFF' }]} />

                    <Text style={styles.messageText}>{message}</Text>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.skipBtn} onPress={onComplete}>
                            <Text style={styles.skipBtnText}>Skip</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.gotItBtn, { backgroundColor: color }]}
                            onPress={onComplete}
                        >
                            <Text style={styles.gotItBtnText}>{isLast ? "Got it!" : "Next"}</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}
        </View>
    );
};

// Main Onboarding Component
export default function AIOnboarding({ visible, onComplete, onNavigateToBilling, creditsPosition }) {
    const [currentStep, setCurrentStep] = useState(0);

    // Define where the cursor should point (relative to screen)
    const steps = [
        {
            name: 'Arjun',
            color: '#2563EB',
            message: "👋 Hey! I'm Arjun. See this credits badge? Tap it to buy AI credits and unlock all premium features!",
            position: {
                startX: isWeb ? width * 0.2 : 30,
                startY: isWeb ? 300 : 200,
                endX: creditsPosition?.x || (isWeb ? width - 150 : width - 70),
                endY: creditsPosition?.y || (isWeb ? 60 : 45),
            },
        },
        {
            name: 'Priya',
            color: '#8B5CF6',
            message: "💎 I recommend the Pro plan at ₹599/month - you get 400 credits, enough for 100+ AI sessions. Best value for serious aspirants!",
            position: {
                startX: isWeb ? width * 0.7 : width - 30,
                startY: isWeb ? 350 : 250,
                endX: creditsPosition?.x || (isWeb ? width - 150 : width - 70),
                endY: creditsPosition?.y || (isWeb ? 60 : 45),
            },
        },
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        try {
            await AsyncStorage.setItem('ai_onboarding_complete', 'true');
        } catch (e) { }
        onComplete();
    };

    if (!visible) return null;

    const step = steps[currentStep];

    return (
        <View style={styles.container}>
            {/* Semi-transparent overlay */}
            <View style={styles.overlay} />

            {/* Spotlight on credits area */}
            <View
                style={[
                    styles.spotlight,
                    {
                        left: (creditsPosition?.x || (isWeb ? width - 150 : width - 70)) - 40,
                        top: (creditsPosition?.y || (isWeb ? 60 : 45)) - 20,
                    },
                ]}
            />

            {/* AI Cursor */}
            <AICursor
                key={currentStep}
                name={step.name}
                color={step.color}
                position={step.position}
                message={step.message}
                onComplete={handleNext}
                isLast={currentStep === steps.length - 1}
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
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
    },
    spotlight: {
        position: 'absolute',
        width: 100,
        height: 50,
        backgroundColor: 'transparent',
        borderRadius: 25,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        ...Platform.select({
            web: {
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65), 0 0 30px 10px rgba(255, 255, 255, 0.15)',
            },
        }),
    },
    cursorOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'box-none',
    },
    cursor: {
        position: 'absolute',
        zIndex: 100,
    },
    cursorPointer: {
        // The SVG cursor
    },
    cursorTag: {
        position: 'absolute',
        left: 16,
        top: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        ...Platform.select({
            web: {
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
            },
        }),
    },
    cursorName: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    clickRipple: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
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
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
                elevation: 12,
            },
        }),
    },
    bubbleArrow: {
        position: 'absolute',
        top: -10,
        left: 30,
        width: 0,
        height: 0,
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderBottomWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
    },
    messageText: {
        fontSize: 15,
        color: '#1F2937',
        lineHeight: 24,
        marginBottom: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    skipBtn: {
        paddingVertical: 10,
        paddingHorizontal: 18,
    },
    skipBtnText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '600',
    },
    gotItBtn: {
        paddingVertical: 10,
        paddingHorizontal: 22,
        borderRadius: 22,
    },
    gotItBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
});
