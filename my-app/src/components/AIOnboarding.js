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

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Animated AI Cursor that points at elements
const AICursor = ({ name, color, position, message, onComplete, isLast }) => {
    const cursorX = useRef(new Animated.Value(position.startX || 0)).current;
    const cursorY = useRef(new Animated.Value(position.startY || 0)).current;
    const bounce = useRef(new Animated.Value(0)).current;
    const clickScale = useRef(new Animated.Value(1)).current;
    const messageOpacity = useRef(new Animated.Value(0)).current;
    const [showClick, setShowClick] = useState(false);

    useEffect(() => {
        // Animate cursor moving to target
        Animated.sequence([
            // Move to target
            Animated.parallel([
                Animated.spring(cursorX, { toValue: position.endX, friction: 6, useNativeDriver: true }),
                Animated.spring(cursorY, { toValue: position.endY, friction: 6, useNativeDriver: true }),
            ]),
            // Wait a moment
            Animated.delay(300),
            // Show click animation
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(clickScale, { toValue: 0.8, duration: 100, useNativeDriver: true }),
                    Animated.timing(clickScale, { toValue: 1, duration: 100, useNativeDriver: true }),
                ]),
            ]),
        ]).start(() => {
            setShowClick(true);
            // Show message after click
            Animated.timing(messageOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();

            // Start bounce
            Animated.loop(
                Animated.sequence([
                    Animated.timing(bounce, { toValue: -5, duration: 600, useNativeDriver: true }),
                    Animated.timing(bounce, { toValue: 0, duration: 600, useNativeDriver: true }),
                ])
            ).start();
        });
    }, []);

    return (
        <View style={styles.cursorOverlay}>
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
                {/* Cursor Arrow SVG-like shape */}
                <View style={[styles.cursorArrow, { borderTopColor: color }]} />

                {/* Name Tag */}
                <View style={[styles.cursorTag, { backgroundColor: color }]}>
                    <Text style={styles.cursorName}>{name}</Text>
                </View>
            </Animated.View>

            {/* Click Ripple Effect */}
            {showClick && (
                <Animated.View
                    style={[
                        styles.clickRipple,
                        {
                            left: position.endX + 5,
                            top: position.endY + 5,
                            borderColor: color,
                        },
                    ]}
                />
            )}

            {/* Message Bubble */}
            <Animated.View
                style={[
                    styles.messageBubble,
                    {
                        opacity: messageOpacity,
                        left: Math.min(position.endX + 30, width - 280),
                        top: Math.max(position.endY + 40, 60),
                        borderColor: color,
                    },
                ]}
            >
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
                startX: isWeb ? width * 0.3 : 50,
                startY: isWeb ? 200 : 100,
                endX: creditsPosition?.x || (isWeb ? width - 150 : width - 80),
                endY: creditsPosition?.y || (isWeb ? 80 : 50),
            },
        },
        {
            name: 'Priya',
            color: '#8B5CF6',
            message: "💎 I recommend the Pro plan at ₹599/month - you get 400 credits, enough for 100+ AI sessions. Best value for serious aspirants!",
            position: {
                startX: isWeb ? width * 0.6 : width - 50,
                startY: isWeb ? 250 : 150,
                endX: creditsPosition?.x || (isWeb ? width - 150 : width - 80),
                endY: creditsPosition?.y || (isWeb ? 80 : 50),
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
                        left: (creditsPosition?.x || (isWeb ? width - 150 : width - 80)) - 30,
                        top: (creditsPosition?.y || (isWeb ? 80 : 50)) - 15,
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
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    spotlight: {
        position: 'absolute',
        width: 80,
        height: 45,
        backgroundColor: 'transparent',
        borderRadius: 25,
        borderWidth: 3,
        borderColor: '#FFF',
        ...Platform.select({
            web: {
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 20px 5px rgba(255, 255, 255, 0.3)',
            },
        }),
    },
    cursorOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    cursor: {
        position: 'absolute',
        zIndex: 100,
    },
    cursorArrow: {
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 20,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        transform: [{ rotate: '-45deg' }],
    },
    cursorTag: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        marginLeft: 12,
        marginTop: -5,
    },
    cursorName: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '700',
    },
    clickRipple: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        ...Platform.select({
            web: {
                animation: 'pulse 1s infinite',
            },
        }),
    },
    messageBubble: {
        position: 'absolute',
        backgroundColor: '#FFF',
        borderRadius: 16,
        borderWidth: 2,
        padding: 16,
        maxWidth: 260,
        ...Platform.select({
            web: {
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 10,
            },
        }),
    },
    messageText: {
        fontSize: 14,
        color: '#1F2937',
        lineHeight: 22,
        marginBottom: 14,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    skipBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    skipBtnText: {
        color: '#6B7280',
        fontSize: 13,
        fontWeight: '600',
    },
    gotItBtn: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    gotItBtnText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '700',
    },
});
