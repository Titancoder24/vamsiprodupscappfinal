/**
 * Notification Toggle Component
 * Shows in header to enable/disable browser notifications
 * Uses native Browser Notification API - no third-party services
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Platform,
    Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

const NotificationToggle: React.FC<Props> = ({ iconColor = '#FFF', size = 24 }) => {
    const [supported, setSupported] = useState(false);
    const [permission, setPermission] = useState<string>('default');
    const [enabled, setEnabled] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = () => {
        if (Platform.OS !== 'web') return;

        const isSupported = isBrowserNotificationSupported();
        setSupported(isSupported);

        if (isSupported) {
            const perm = getNotificationPermission();
            setPermission(perm as string);
            setEnabled(perm === 'granted');

            // Subscribe to realtime if already granted
            if (perm === 'granted') {
                subscribeToNotifications((notification) => {
                    console.log('New notification:', notification);
                });
            }
        }
    };

    const handleToggle = async () => {
        if (enabled) {
            // Disable - just unsubscribe from realtime
            unsubscribeFromNotifications();
            setEnabled(false);
        } else {
            // Enable - request permission
            const result = await requestNotificationPermission();
            setPermission(result as string);

            if (result === 'granted') {
                setEnabled(true);
                subscribeToNotifications((notification) => {
                    console.log('New notification:', notification);
                });
                setShowModal(false);
            }
        }
    };

    // Don't show on non-web platforms
    if (Platform.OS !== 'web' || !supported) {
        return null;
    }

    return (
        <>
            <TouchableOpacity
                onPress={() => setShowModal(true)}
                style={styles.iconButton}
            >
                <Ionicons
                    name={enabled ? 'notifications' : 'notifications-outline'}
                    size={size}
                    color={enabled ? '#10B981' : iconColor}
                />
                {enabled && <View style={styles.activeDot} />}
            </TouchableOpacity>

            <Modal
                visible={showModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowModal(false)}
                >
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <View style={styles.modalHeader}>
                            <Ionicons name="notifications" size={32} color="#3B82F6" />
                            <Text style={styles.modalTitle}>Browser Notifications</Text>
                        </View>

                        <Text style={styles.modalDesc}>
                            Get instant alerts when new articles or question papers are posted.
                        </Text>

                        {permission === 'denied' ? (
                            <View style={styles.deniedBox}>
                                <Ionicons name="warning" size={24} color="#F59E0B" />
                                <Text style={styles.deniedText}>
                                    Notifications are blocked. Please enable them in your browser settings (click the lock icon in the address bar).
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.toggleRow}>
                                <View>
                                    <Text style={styles.toggleLabel}>
                                        {enabled ? 'Notifications Enabled' : 'Enable Notifications'}
                                    </Text>
                                    <Text style={styles.toggleSubtext}>
                                        {enabled ? 'You will receive alerts' : 'Allow browser notifications'}
                                    </Text>
                                </View>
                                <Switch
                                    value={enabled}
                                    onValueChange={handleToggle}
                                    trackColor={{ false: '#E2E8F0', true: '#10B981' }}
                                    thumbColor="#FFF"
                                />
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => setShowModal(false)}
                        >
                            <Text style={styles.closeBtnText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    iconButton: {
        padding: 8,
        position: 'relative',
    },
    activeDot: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
    },
    modalDesc: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 22,
        marginBottom: 20,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    toggleLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0F172A',
    },
    toggleSubtext: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    deniedBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: '#FEF3C7',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    deniedText: {
        flex: 1,
        fontSize: 13,
        color: '#92400E',
        lineHeight: 20,
    },
    closeBtn: {
        backgroundColor: '#3B82F6',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    closeBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFF',
    },
});

export default NotificationToggle;
