/**
 * Modern In-App Notification Popup
 * Beautiful animated popup that appears when notifications arrive
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export interface NotificationData {
    id: string;
    title: string;
    body: string;
    icon?: string;
    type?: 'info' | 'success' | 'warning' | 'alert';
    action_url?: string;
    timestamp?: Date;
}

interface Props {
    notification: NotificationData | null;
    onDismiss: () => void;
    onPress?: (notification: NotificationData) => void;
    duration?: number;
}

const { width } = Dimensions.get('window');

const NotificationPopup: React.FC<Props> = ({
    notification,
    onDismiss,
    onPress,
    duration = 5000,
}) => {
    const slideAnim = useRef(new Animated.Value(-150)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const progressAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (notification) {
            // Animate in
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 80,
                    friction: 10,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();

            // Progress bar animation
            progressAnim.setValue(1);
            Animated.timing(progressAnim, {
                toValue: 0,
                duration: duration,
                useNativeDriver: false,
            }).start();

            // Auto dismiss
            const timer = setTimeout(() => {
                dismissNotification();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [notification]);

    const dismissNotification = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: -150,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onDismiss();
        });
    };

    const handlePress = () => {
        if (notification && onPress) {
            onPress(notification);
        }
        dismissNotification();
    };

    const getIconAndColor = (type?: string) => {
        switch (type) {
            case 'success':
                return { icon: 'checkmark-circle', colors: ['#10B981', '#059669'] };
            case 'warning':
                return { icon: 'warning', colors: ['#F59E0B', '#D97706'] };
            case 'alert':
                return { icon: 'alert-circle', colors: ['#EF4444', '#DC2626'] };
            default:
                return { icon: 'notifications', colors: ['#3B82F6', '#2563EB'] };
        }
    };

    if (!notification || Platform.OS !== 'web') return null;

    const { icon, colors } = getIconAndColor(notification.type);

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [
                        { translateY: slideAnim },
                        { scale: scaleAnim },
                    ],
                    opacity: fadeAnim,
                },
            ]}
        >
            <TouchableOpacity
                activeOpacity={0.95}
                onPress={handlePress}
                style={styles.touchable}
            >
                <View style={styles.card}>
                    {/* Gradient accent bar */}
                    <LinearGradient
                        colors={colors as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.accentBar}
                    />

                    <View style={styles.content}>
                        {/* Icon */}
                        <LinearGradient
                            colors={colors as [string, string]}
                            style={styles.iconContainer}
                        >
                            <Ionicons name={icon as any} size={24} color="#FFF" />
                        </LinearGradient>

                        {/* Text content */}
                        <View style={styles.textContainer}>
                            <Text style={styles.title} numberOfLines={1}>
                                {notification.title}
                            </Text>
                            <Text style={styles.body} numberOfLines={2}>
                                {notification.body}
                            </Text>
                        </View>

                        {/* Close button */}
                        <TouchableOpacity
                            onPress={dismissNotification}
                            style={styles.closeButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    {/* Progress bar */}
                    <Animated.View
                        style={[
                            styles.progressBar,
                            {
                                width: progressAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%'],
                                }),
                                backgroundColor: colors[0],
                            },
                        ]}
                    />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'web' ? 20 : 60,
        left: 0,
        right: 0,
        zIndex: 9999,
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    touchable: {
        width: '100%',
        maxWidth: 420,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 8,
    },
    accentBar: {
        height: 4,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 14,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    body: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
    },
    closeButton: {
        padding: 4,
    },
    progressBar: {
        height: 3,
        position: 'absolute',
        bottom: 0,
        left: 0,
        borderRadius: 2,
    },
});

export default NotificationPopup;
