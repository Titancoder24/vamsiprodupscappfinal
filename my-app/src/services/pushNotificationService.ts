/**
 * Web Push Notification Service
 * Handles subscription and permission management
 */

import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';

// VAPID public key - generate your own at https://web-push-codelab.glitch.me/
// This is a placeholder - you need to generate real VAPID keys
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Check if push notifications are supported
 */
export const isPushSupported = (): boolean => {
    if (Platform.OS !== 'web') return false;
    return 'serviceWorker' in navigator && 'PushManager' in window;
};

/**
 * Get current notification permission status
 */
export const getPermissionStatus = (): NotificationPermission | 'unsupported' => {
    if (!isPushSupported()) return 'unsupported';
    return Notification.permission;
};

/**
 * Request notification permission
 */
export const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isPushSupported()) {
        throw new Error('Push notifications not supported');
    }
    return await Notification.requestPermission();
};

/**
 * Register service worker
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    if (!isPushSupported()) return null;

    try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('[Push] Service worker registered:', registration.scope);
        return registration;
    } catch (error) {
        console.error('[Push] Service worker registration failed:', error);
        return null;
    }
};

/**
 * Subscribe to push notifications
 */
export const subscribeToPush = async (): Promise<boolean> => {
    try {
        // Check support
        if (!isPushSupported()) {
            console.log('[Push] Not supported');
            return false;
        }

        // Request permission
        const permission = await requestPermission();
        if (permission !== 'granted') {
            console.log('[Push] Permission denied');
            return false;
        }

        // Get service worker registration
        const registration = await navigator.serviceWorker.ready;

        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });

        console.log('[Push] Subscribed:', subscription.endpoint);

        // Extract keys
        const rawKey = subscription.getKey('p256dh');
        const rawAuth = subscription.getKey('auth');

        if (!rawKey || !rawAuth) {
            throw new Error('Failed to get subscription keys');
        }

        const p256dh = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(rawKey))));
        const auth = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(rawAuth))));

        // Save to Supabase
        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                endpoint: subscription.endpoint,
                p256dh: p256dh,
                auth: auth,
                user_agent: navigator.userAgent,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'endpoint'
            });

        if (error) {
            console.error('[Push] Failed to save subscription:', error);
            return false;
        }

        console.log('[Push] Subscription saved to database');
        return true;
    } catch (error) {
        console.error('[Push] Subscribe error:', error);
        return false;
    }
};

/**
 * Unsubscribe from push notifications
 */
export const unsubscribeFromPush = async (): Promise<boolean> => {
    try {
        if (!isPushSupported()) return false;

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            // Remove from Supabase
            await supabase
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', subscription.endpoint);

            // Unsubscribe
            await subscription.unsubscribe();
            console.log('[Push] Unsubscribed');
        }

        return true;
    } catch (error) {
        console.error('[Push] Unsubscribe error:', error);
        return false;
    }
};

/**
 * Check if currently subscribed
 */
export const isSubscribed = async (): Promise<boolean> => {
    try {
        if (!isPushSupported()) return false;

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        return !!subscription;
    } catch (error) {
        return false;
    }
};

/**
 * Initialize push notifications
 * Call this on app start
 */
export const initializePushNotifications = async (): Promise<void> => {
    if (!isPushSupported()) {
        console.log('[Push] Not supported on this platform');
        return;
    }

    // Register service worker
    await registerServiceWorker();
};

export default {
    isPushSupported,
    getPermissionStatus,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    isSubscribed,
    initializePushNotifications
};
