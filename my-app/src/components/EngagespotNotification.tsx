/**
 * Engagespot Notification Component
 * Uses @engagespot/react-component for In-App Inbox and Web Push
 * 
 * Note: Renders via ReactDOM Portal to escape React Native Web stacking context
 */

import React, { useEffect, useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';

// Engagespot API Key from dashboard
const ENGAGESPOT_API_KEY = 'n6csieradej08ctf465vlhr';

interface Props {
    userId: string;
}

const EngagespotNotification: React.FC<Props> = ({ userId }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (Platform.OS === 'web' && userId) {
            setMounted(true);
            // Register service worker for web push
            registerServiceWorker();
        }
    }, [userId]);

    const registerServiceWorker = async () => {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                console.log('[Engagespot] Service worker registered:', registration.scope);
            } catch (error) {
                console.error('[Engagespot] Service worker registration failed:', error);
            }
        }
    };

    // Only render on web
    if (Platform.OS !== 'web' || !userId || !mounted) {
        return null;
    }

    // Dynamic imports for web only
    const EngagespotComponent = require('@engagespot/react-component').Engagespot;
    const ReactDOM = require('react-dom');

    // Portal container logic
    let portalRoot = document.getElementById('engagespot-portal-root');
    if (!portalRoot) {
        portalRoot = document.createElement('div');
        portalRoot.id = 'engagespot-portal-root';
        document.body.appendChild(portalRoot);
    }

    // Render into body to escape all RNW stacking contexts
    return ReactDOM.createPortal(
        <div style={{
            position: 'fixed',
            top: '20px', // Standard header padding
            right: '80px', // Adjusted to be left of the user/settings icon usually
            zIndex: 2147483647, // Max int
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <style>
                {`
                    /* Force the notification panel to be top-level and correctly positioned */
                    .engagespot-panel {
                        position: fixed !important;
                        top: 70px !important;
                        right: 80px !important;
                        z-index: 2147483647 !important;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.2) !important;
                    }
                `}
            </style>

            <EngagespotComponent
                apiKey={ENGAGESPOT_API_KEY}
                userId={userId}
                dataRegion="us"
                theme={{
                    colors: {
                        brandingPrimary: '#3B82F6',
                        colorPrimary: '#0F172A',
                        colorSecondary: '#64748B',
                    },
                    notificationButton: {
                        iconFill: '#0F172A',
                    },
                    header: {
                        title: 'Notifications',
                    },
                    panel: {
                        width: '380px',
                        height: '500px',
                        zIndex: '2147483647',
                    },
                }}
            />
        </div>,
        portalRoot
    );
};

const styles = StyleSheet.create({
    // no styles needed as we use portal
});

export default EngagespotNotification;
