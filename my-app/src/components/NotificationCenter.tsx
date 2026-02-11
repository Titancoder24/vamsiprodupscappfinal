/**
 * Notification Center Component
 * Shows bell icon with badge and notification panel
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import NotificationPopup, { NotificationData } from './NotificationPopup';
import {
    isBrowserNotificationSupported,
    getNotificationPermission,
    requestNotificationPermission,
    subscribeToNotifications,
    unsubscribeFromNotifications,
} from '../services/notificationService';

interface Props {
    iconColor?: string;
    size?: number;
}

const { width } = Dimensions.get('window');

const NotificationCenter: React.FC<Props> = ({ iconColor = '#1A1A1A', size = 24 }) => {
    const [supported, setSupported] = useState(false);
    const [permission, setPermission] = useState<string>('default');
    const [enabled, setEnabled] = useState(false);
    const [showPanel, setShowPanel] = useState(false);
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [currentPopup, setCurrentPopup] = useState<NotificationData | null>(null);

    const bellAnim = useRef(new Animated.Value(0)).current;
    const badgeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        checkStatus();
        loadHistory();
    }, []);

    const loadHistory = async () => {
        if (Platform.OS !== 'web') return;
        try {
            const { fetchNotifications } = require('../services/notificationService');
            const history = await fetchNotifications(20);

            const mappedHistory: NotificationData[] = history.map((n: any) => ({
                id: n.id,
                title: n.title,
                body: n.body,
                type: n.type,
                timestamp: new Date(n.created_at),
                url: n.content_url
            }));

            setNotifications(mappedHistory);
        } catch (error) {
            console.error('[NotificationCenter] History load failed:', error);
        }
    };

    useEffect(() => {
        // Animate bell when new notification arrives
        if (unreadCount > 0) {
            Animated.sequence([
                Animated.timing(bellAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
                Animated.timing(bellAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
                Animated.timing(bellAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
                Animated.timing(bellAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
            ]).start();

            Animated.spring(badgeAnim, {
                toValue: 1,
                tension: 200,
                friction: 5,
                useNativeDriver: true,
            }).start();
        } else {
            badgeAnim.setValue(0);
        }
    }, [unreadCount]);

    const checkStatus = () => {
        if (Platform.OS !== 'web') return;

        const isSupported = isBrowserNotificationSupported();
        setSupported(isSupported);

        if (isSupported) {
            const perm = getNotificationPermission();
            setPermission(perm as string);
            setEnabled(perm === 'granted');

            if (perm === 'granted') {
                subscribeToNotifications(handleNewNotification);
            }
        }
    };

    const handleNewNotification = (notification: any) => {
        console.log('[NotificationCenter] New notification payload:', notification);
        const newNotification: NotificationData = {
            id: notification.id || Date.now().toString(),
            title: notification.title || 'New Notification',
            body: notification.body || notification.message || '',
            type: notification.type || 'info',
            timestamp: new Date(),
            url: notification.content_url || notification.url,
        };

        // Add to list
        setNotifications(prev => [newNotification, ...prev].slice(0, 50));
        setUnreadCount(prev => prev + 1);

        // Show popup
        setCurrentPopup(newNotification);
    };

    const handleNotificationPress = (notif: NotificationData) => {
        console.log('[Notification] Pressed:', notif);
        if (notif.url && Platform.OS === 'web') {
            window.location.href = notif.url;
        }
        setShowPanel(false);
    };

    const handleEnableNotifications = async () => {
        const result = await requestNotificationPermission();
        setPermission(result as string);

        if (result === 'granted') {
            setEnabled(true);
            subscribeToNotifications(handleNewNotification);
        }
    };

    const markAllAsRead = () => {
        setUnreadCount(0);
    };

    const clearAll = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    const formatTime = (date?: Date) => {
        if (!date) return '';
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
        return date.toLocaleDateString();
    };

    const getTagInfo = (notif: NotificationData) => {
        const url = notif.url || '';
        if (url.includes('Articles')) return { label: 'Articles', color: '#3B82F6', icon: 'newspaper-outline' };
        if (url.includes('questions')) return { label: 'Question Bank', color: '#8B5CF6', icon: 'book-outline' };
        return { label: 'Update', color: '#64748B', icon: 'notifications-outline' };
    };

    const getTypeColor = (type?: string) => {
        switch (type) {
            case 'success': return '#10B981';
            case 'warning': return '#F59E0B';
            case 'alert': return '#EF4444';
            default: return '#3B82F6';
        }
    };

    // Don't show on non-web platforms
    if (Platform.OS !== 'web') return null;

    const bellRotation = bellAnim.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ['-15deg', '0deg', '15deg'],
    });

    return (
        <>
            {/* Bell Icon Button */}
            <TouchableOpacity
                onPress={() => {
                    setShowPanel(true);
                    markAllAsRead();
                }}
                style={styles.bellButton}
            >
                <Animated.View style={{ transform: [{ rotate: bellRotation }] }}>
                    <Ionicons
                        name={enabled ? 'notifications' : 'notifications-outline'}
                        size={size}
                        color={iconColor}
                    />
                </Animated.View>

                {/* Badge */}
                {unreadCount > 0 && (
                    <Animated.View
                        style={[
                            styles.badge,
                            {
                                transform: [{ scale: badgeAnim }],
                            },
                        ]}
                    >
                        <Text style={styles.badgeText}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Text>
                    </Animated.View>
                )}
            </TouchableOpacity>

            {/* Notification Popup */}
            <NotificationPopup
                notification={currentPopup ? {
                    ...currentPopup,
                    action_url: currentPopup.url
                } : null}
                onDismiss={() => setCurrentPopup(null)}
                onPress={(n) => handleNotificationPress(currentPopup!)}
            />

            {/* Notification Panel Modal */}
            <Modal
                visible={showPanel}
                transparent
                animationType="fade"
                onRequestClose={() => setShowPanel(false)}
            >
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={() => setShowPanel(false)}
                >
                    <View
                        style={styles.panel}
                        onStartShouldSetResponder={() => true}
                    >
                        {/* Header */}
                        <View style={styles.panelHeader}>
                            <Text style={styles.panelTitle}>Notifications</Text>
                            <View style={styles.headerActions}>
                                {notifications.length > 0 && (
                                    <TouchableOpacity onPress={clearAll} style={styles.headerBtn}>
                                        <Text style={styles.headerBtnText}>Clear all</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    onPress={() => setShowPanel(false)}
                                    style={styles.closeBtn}
                                >
                                    <Ionicons name="close" size={24} color="#64748B" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Content */}
                        {!supported ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="warning-outline" size={48} color="#94A3B8" />
                                <Text style={styles.emptyTitle}>Not Supported</Text>
                                <Text style={styles.emptyText}>
                                    Your browser doesn't support notifications.
                                </Text>
                            </View>
                        ) : !enabled ? (
                            <View style={styles.emptyState}>
                                <LinearGradient
                                    colors={['#3B82F6', '#2563EB']}
                                    style={styles.enableIcon}
                                >
                                    <Ionicons name="notifications" size={32} color="#FFF" />
                                </LinearGradient>
                                <Text style={styles.emptyTitle}>Enable Notifications</Text>
                                <Text style={styles.emptyText}>
                                    Stay updated with new articles, question papers, and more.
                                </Text>
                                <TouchableOpacity
                                    style={styles.enableBtn}
                                    onPress={handleEnableNotifications}
                                >
                                    <Text style={styles.enableBtnText}>Enable Now</Text>
                                </TouchableOpacity>
                            </View>
                        ) : notifications.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="notifications-off-outline" size={48} color="#94A3B8" />
                                <Text style={styles.emptyTitle}>No Notifications</Text>
                                <Text style={styles.emptyText}>
                                    You're all caught up! Check back later.
                                </Text>
                            </View>
                        ) : (
                            <ScrollView style={styles.notificationList}>
                                {notifications.map((notif) => (
                                    <TouchableOpacity
                                        key={notif.id}
                                        style={styles.notificationItem}
                                        activeOpacity={0.7}
                                        onPress={() => handleNotificationPress(notif)}
                                    >
                                        <View
                                            style={[
                                                styles.notifDot,
                                                { backgroundColor: getTypeColor(notif.type) }
                                            ]}
                                        />
                                        <View style={styles.notifContent}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                                <View style={{ flex: 1 }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                        <View style={[styles.typeTag, { backgroundColor: getTagInfo(notif).color + '20' }]}>
                                                            <Ionicons name={getTagInfo(notif).icon as any} size={10} color={getTagInfo(notif).color} />
                                                            <Text style={[styles.typeTagText, { color: getTagInfo(notif).color }]}>
                                                                {getTagInfo(notif).label}
                                                            </Text>
                                                        </View>
                                                        <Text style={styles.notifTime}>{formatTime(notif.timestamp)}</Text>
                                                    </View>
                                                    <Text style={styles.notifTitle}>{notif.title}</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.notifBody} numberOfLines={2}>
                                                {notif.body}
                                            </Text>
                                            {notif.url && (
                                                <View style={styles.viewAction}>
                                                    <Text style={styles.viewLinkText}>Open {getTagInfo(notif).label} →</Text>
                                                </View>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    bellButton: {
        padding: 8,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 2,
        right: 2,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFF',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 60,
        paddingRight: 16,
    },
    panel: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        width: Math.min(width - 32, 380),
        maxHeight: '70%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 8,
        overflow: 'hidden',
    },
    panelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    panelTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerBtn: {
        padding: 6,
    },
    headerBtnText: {
        fontSize: 13,
        color: '#3B82F6',
        fontWeight: '600',
    },
    closeBtn: {
        padding: 4,
    },
    emptyState: {
        alignItems: 'center',
        padding: 32,
    },
    enableIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginTop: 12,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
    },
    enableBtn: {
        marginTop: 20,
        backgroundColor: '#3B82F6',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
    },
    enableBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },
    notificationList: {
        maxHeight: 400,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    notifDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 6,
        marginRight: 12,
    },
    notifContent: {
        flex: 1,
    },
    notifTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 4,
    },
    notifBody: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
    },
    notifTime: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 6,
    },
    urlIndicator: {
        marginLeft: 8,
    },
    viewLinkText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#3B82F6',
    },
    typeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    typeTagText: {
        fontSize: 9,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    viewAction: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    }
});

export default NotificationCenter;
