/**
 * In-App Notification Service
 * Uses Supabase Realtime + Browser Notification API
 * NO third-party push services required
 */

import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';

export interface AppNotification {
    id: string;
    title: string;
    body: string;
    type: 'article' | 'question_paper' | 'general';
    content_id?: string;
    content_url?: string;
    is_read: boolean;
    created_at: string;
}

let realtimeChannel: any = null;
let notificationCallback: ((notification: AppNotification) => void) | null = null;

/**
 * Check if browser notifications are supported
 */
export const isBrowserNotificationSupported = (): boolean => {
    if (Platform.OS !== 'web') return false;
    return 'Notification' in window;
};

/**
 * Get current notification permission
 */
export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
    if (!isBrowserNotificationSupported()) return 'unsupported';
    return Notification.permission;
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
    if (!isBrowserNotificationSupported()) return 'unsupported';

    try {
        const permission = await Notification.requestPermission();
        return permission;
    } catch (error) {
        console.error('[Notification] Permission request failed:', error);
        return 'denied';
    }
};

/**
 * Show a browser notification
 */
export const showBrowserNotification = (title: string, body: string, onClick?: () => void): void => {
    if (!isBrowserNotificationSupported()) return;
    if (Notification.permission !== 'granted') return;

    try {
        const notification = new Notification(title, {
            body,
            icon: '/icon.png',
            badge: '/badge.png',
            tag: 'prepassist-notification',
            requireInteraction: false,
        });

        if (onClick) {
            notification.onclick = () => {
                window.focus();
                onClick();
                notification.close();
            };
        }

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);
    } catch (error) {
        console.error('[Notification] Show failed:', error);
    }
};

/**
 * Fetch all notifications
 */
export const fetchNotifications = async (limit = 50): Promise<AppNotification[]> => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('[Notification] Fetch failed:', error);
        return [];
    }
};

/**
 * Fetch unread notification count
 */
export const getUnreadCount = async (): Promise<number> => {
    try {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false);

        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('[Notification] Count failed:', error);
        return 0;
    }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('[Notification] Mark read failed:', error);
        return false;
    }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('is_read', false);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('[Notification] Mark all read failed:', error);
        return false;
    }
};

/**
 * Subscribe to real-time notifications
 */
export const subscribeToNotifications = (
    onNewNotification: (notification: AppNotification) => void
): void => {
    if (Platform.OS !== 'web') return;

    // Store callback
    notificationCallback = onNewNotification;

    // Unsubscribe existing channel
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
    }

    // Subscribe to new notifications
    realtimeChannel = supabase
        .channel('notifications-channel')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications'
            },
            (payload) => {
                console.log('[Notification] New notification received:', payload);
                const notification = payload.new as AppNotification;

                // Show browser notification
                if (Notification.permission === 'granted') {
                    showBrowserNotification(notification.title, notification.body, () => {
                        if (notification.content_url) {
                            window.location.href = notification.content_url;
                        }
                    });
                }

                // Call callback
                if (notificationCallback) {
                    notificationCallback(notification);
                }
            }
        )
        .subscribe((status) => {
            console.log('[Notification] Realtime subscription status:', status);
        });
};

/**
 * Unsubscribe from real-time notifications
 */
export const unsubscribeFromNotifications = (): void => {
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
    }
    notificationCallback = null;
};

/**
 * Initialize notification system
 */
export const initializeNotifications = async (): Promise<void> => {
    if (Platform.OS !== 'web') return;

    console.log('[Notification] Initializing...');

    // Request permission if not already granted
    if (Notification.permission === 'default') {
        // Don't auto-request, let user click the toggle
    }
};

export default {
    isBrowserNotificationSupported,
    getNotificationPermission,
    requestNotificationPermission,
    showBrowserNotification,
    fetchNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    initializeNotifications,
};
