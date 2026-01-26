/**
 * Notification Context
 * Handles real-time notifications using Supabase and Browser Notification API
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Platform, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export interface AppNotification {
    id: string;
    title: string;
    body: string;
    type: string;
    content_id?: string;
    content_url?: string;
    is_read: boolean;
    created_at: string;
}

interface NotificationContextType {
    notifications: AppNotification[];
    unreadCount: number;
    isEnabled: boolean;
    permission: string;
    enableNotifications: () => Promise<boolean>;
    disableNotifications: () => void;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

interface Props {
    children: ReactNode;
}

export const NotificationProvider: React.FC<Props> = ({ children }) => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isEnabled, setIsEnabled] = useState(false);
    const [permission, setPermission] = useState('default');
    const [channel, setChannel] = useState<any>(null);

    // Check if browser notifications are supported
    const isBrowserSupported = Platform.OS === 'web' && 'Notification' in window;

    // Calculate unread count
    const unreadCount = notifications.filter(n => !n.is_read).length;

    // Fetch notifications from Supabase
    const refreshNotifications = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error('[Notification] Fetch error:', error);
        }
    }, []);

    // Show browser notification
    const showBrowserNotification = useCallback((title: string, body: string, url?: string) => {
        if (!isBrowserSupported || Notification.permission !== 'granted') return;

        try {
            const notification = new Notification(title, {
                body,
                icon: '/icon.png',
                tag: 'prepassist-' + Date.now(),
            });

            notification.onclick = () => {
                window.focus();
                if (url) {
                    window.location.href = url;
                }
                notification.close();
            };

            // Auto close after 8 seconds
            setTimeout(() => notification.close(), 8000);
        } catch (error) {
            console.error('[Notification] Browser notification error:', error);
        }
    }, [isBrowserSupported]);

    // Subscribe to realtime notifications
    const subscribeToRealtime = useCallback(() => {
        if (channel) {
            supabase.removeChannel(channel);
        }

        const newChannel = supabase
            .channel('notifications-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications'
                },
                (payload) => {
                    console.log('[Notification] New notification received:', payload);
                    const newNotification = payload.new as AppNotification;

                    // Add to state
                    setNotifications(prev => [newNotification, ...prev]);

                    // Show browser notification if enabled
                    if (isEnabled && Notification.permission === 'granted') {
                        showBrowserNotification(
                            newNotification.title,
                            newNotification.body,
                            newNotification.content_url
                        );
                    }

                    // Also show an in-app alert on mobile/web
                    if (Platform.OS === 'web') {
                        // Create a toast-like notification for web
                        const toast = document.createElement('div');
                        toast.innerHTML = `
                            <div style="
                                position: fixed;
                                top: 20px;
                                right: 20px;
                                background: linear-gradient(135deg, #3B82F6, #2563EB);
                                color: white;
                                padding: 16px 20px;
                                border-radius: 12px;
                                box-shadow: 0 10px 40px rgba(59, 130, 246, 0.3);
                                z-index: 10000;
                                max-width: 350px;
                                animation: slideIn 0.3s ease;
                                cursor: pointer;
                            ">
                                <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">
                                    ${newNotification.title}
                                </div>
                                <div style="font-size: 13px; opacity: 0.9;">
                                    ${newNotification.body}
                                </div>
                            </div>
                            <style>
                                @keyframes slideIn {
                                    from { transform: translateX(100%); opacity: 0; }
                                    to { transform: translateX(0); opacity: 1; }
                                }
                            </style>
                        `;
                        document.body.appendChild(toast);

                        // Remove after 5 seconds
                        setTimeout(() => {
                            toast.style.transition = 'opacity 0.3s';
                            toast.style.opacity = '0';
                            setTimeout(() => toast.remove(), 300);
                        }, 5000);

                        toast.onclick = () => {
                            if (newNotification.content_url) {
                                window.location.href = newNotification.content_url;
                            }
                            toast.remove();
                        };
                    }
                }
            )
            .subscribe((status) => {
                console.log('[Notification] Realtime status:', status);
            });

        setChannel(newChannel);
    }, [isEnabled, showBrowserNotification]);

    // Enable notifications
    const enableNotifications = async (): Promise<boolean> => {
        if (!isBrowserSupported) {
            setIsEnabled(true);
            subscribeToRealtime();
            return true;
        }

        try {
            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm === 'granted') {
                setIsEnabled(true);
                subscribeToRealtime();
                return true;
            }
            return false;
        } catch (error) {
            console.error('[Notification] Enable error:', error);
            return false;
        }
    };

    // Disable notifications
    const disableNotifications = () => {
        setIsEnabled(false);
        if (channel) {
            supabase.removeChannel(channel);
            setChannel(null);
        }
    };

    // Mark notification as read
    const markAsRead = async (id: string) => {
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('[Notification] Mark read error:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('is_read', false);

            setNotifications(prev =>
                prev.map(n => ({ ...n, is_read: true }))
            );
        } catch (error) {
            console.error('[Notification] Mark all read error:', error);
        }
    };

    // Initialize on mount
    useEffect(() => {
        if (isBrowserSupported) {
            setPermission(Notification.permission);
            if (Notification.permission === 'granted') {
                setIsEnabled(true);
            }
        }

        // Always subscribe to realtime to show in-app toasts
        subscribeToRealtime();
        refreshNotifications();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, []);

    // Re-subscribe when isEnabled changes
    useEffect(() => {
        if (isEnabled) {
            subscribeToRealtime();
        }
    }, [isEnabled]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                isEnabled,
                permission,
                enableNotifications,
                disableNotifications,
                markAsRead,
                markAllAsRead,
                refreshNotifications,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationProvider;
