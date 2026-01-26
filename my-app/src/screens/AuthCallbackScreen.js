import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function AuthCallbackScreen({ navigation, route }) {
    const [status, setStatus] = useState('processing');
    const [message, setMessage] = useState('Processing your request...');

    useEffect(() => {
        handleCallback();
    }, []);

    const handleCallback = async () => {
        try {
            // For web, get tokens from URL hash
            if (Platform.OS === 'web') {
                const hash = window.location.hash;
                const params = new URLSearchParams(hash.substring(1));

                const accessToken = params.get('access_token');
                const refreshToken = params.get('refresh_token');
                const type = params.get('type');
                const errorCode = params.get('error_code');
                const errorDescription = params.get('error_description');

                console.log('[AuthCallback] Processing:', { type, hasAccessToken: !!accessToken, errorCode });

                // Handle errors
                if (errorCode) {
                    setStatus('error');
                    setMessage(errorDescription || 'Authentication failed');
                    setTimeout(() => navigation.replace('Login'), 3000);
                    return;
                }

                // Handle password recovery
                if (type === 'recovery' && accessToken) {
                    setStatus('success');
                    setMessage('Password reset verified! Redirecting...');

                    // Set the session from the recovery tokens
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });

                    if (error) {
                        console.error('[AuthCallback] Session error:', error);
                        setStatus('error');
                        setMessage('Failed to verify reset link');
                        setTimeout(() => navigation.replace('Login'), 3000);
                        return;
                    }

                    // Navigate to a password update screen or settings
                    setTimeout(() => navigation.replace('Settings'), 2000);
                    return;
                }

                // Handle email confirmation / signup
                if (type === 'signup' || type === 'email' || accessToken) {
                    setStatus('success');
                    setMessage('Email verified successfully! Logging you in...');

                    // Set the session from the confirmation tokens
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });

                    if (error) {
                        console.error('[AuthCallback] Session error:', error);
                        setStatus('error');
                        setMessage('Failed to verify email. Please try logging in.');
                        setTimeout(() => navigation.replace('Login'), 3000);
                        return;
                    }

                    // Auth listener will handle navigation to Home
                    setTimeout(() => navigation.replace('Home'), 2000);
                    return;
                }

                // No valid tokens found
                setStatus('error');
                setMessage('Invalid or expired link');
                setTimeout(() => navigation.replace('Login'), 3000);
            }
        } catch (error) {
            console.error('[AuthCallback] Error:', error);
            setStatus('error');
            setMessage('Something went wrong');
            setTimeout(() => navigation.replace('Login'), 3000);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {status === 'processing' && (
                    <>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={styles.title}>Please wait</Text>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <View style={styles.iconContainer}>
                            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
                        </View>
                        <Text style={styles.title}>Success!</Text>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <View style={styles.iconContainerError}>
                            <Ionicons name="close-circle" size={64} color="#EF4444" />
                        </View>
                        <Text style={styles.title}>Oops!</Text>
                    </>
                )}

                <Text style={styles.message}>{message}</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    iconContainerError: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FEF2F2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
        marginTop: 16,
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
    },
});
