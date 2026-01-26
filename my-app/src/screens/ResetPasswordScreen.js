import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { SmartTextInput } from '../components/SmartTextInput';
import { useAuth } from '../context/AuthContext';

export default function ResetPasswordScreen({ navigation }) {
    const { resetPassword } = useAuth();
    const [status, setStatus] = useState('verifying');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        handleTokenVerification();
    }, []);

    const handleTokenVerification = async () => {
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

                console.log('[ResetPassword] Processing:', { type, hasAccessToken: !!accessToken, errorCode });

                // Handle errors
                if (errorCode) {
                    setStatus('error');
                    setError(errorDescription || 'Invalid or expired reset link');
                    return;
                }

                // Validate it's a recovery type
                if (type !== 'recovery') {
                    setStatus('error');
                    setError('Invalid reset link');
                    return;
                }

                if (!accessToken) {
                    setStatus('error');
                    setError('Invalid or expired reset link');
                    return;
                }

                // Set the session from the recovery tokens
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (sessionError) {
                    console.error('[ResetPassword] Session error:', sessionError);
                    setStatus('error');
                    setError('Failed to verify reset link');
                    return;
                }

                // Ready to accept new password
                setStatus('ready');
            }
        } catch (err) {
            console.error('[ResetPassword] Error:', err);
            setStatus('error');
            setError('Something went wrong');
        }
    };

    const handleResetPassword = async () => {
        if (!password.trim()) {
            Alert.alert('Error', 'Please enter a new password');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        try {
            setIsLoading(true);
            await resetPassword(password);
            setStatus('success');

            // Redirect to login after success
            setTimeout(() => {
                navigation.replace('Login');
            }, 2000);
        } catch (err) {
            Alert.alert('Error', err.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    // Verifying state
    if (status === 'verifying') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.statusText}>Verifying reset link...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error state
    if (status === 'error') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContent}>
                    <View style={styles.iconContainerError}>
                        <Ionicons name="close-circle" size={64} color="#EF4444" />
                    </View>
                    <Text style={styles.errorTitle}>Reset Link Invalid</Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.replace('Login')}
                    >
                        <Text style={styles.backButtonText}>Back to Login</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Success state
    if (status === 'success') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContent}>
                    <View style={styles.iconContainerSuccess}>
                        <Ionicons name="checkmark-circle" size={64} color="#10B981" />
                    </View>
                    <Text style={styles.successTitle}>Password Updated!</Text>
                    <Text style={styles.successMessage}>
                        Your password has been reset successfully. Redirecting to login...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Ready state - show password form
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.iconContainerPrimary}>
                        <Ionicons name="lock-closed" size={32} color="#3B82F6" />
                    </View>
                    <Text style={styles.title}>Reset Password</Text>
                    <Text style={styles.subtitle}>Enter your new password below</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>New Password</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                            <SmartTextInput
                                style={styles.input}
                                placeholder="Enter new password"
                                placeholderTextColor="#9CA3AF"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeButton}
                            >
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color="#6B7280"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                            <SmartTextInput
                                style={styles.input}
                                placeholder="Confirm new password"
                                placeholderTextColor="#9CA3AF"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, isLoading && styles.buttonDisabled]}
                        onPress={handleResetPassword}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Text style={styles.submitButtonText}>Update Password</Text>
                                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
        maxWidth: 400,
        alignSelf: 'center',
        width: '100%',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainerPrimary: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    iconContainerSuccess: {
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
        fontSize: 28,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
    },
    statusText: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 16,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    successMessage: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    errorMessage: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    backButton: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    backButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        height: 52,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: '#1A1A1A',
    },
    eyeButton: {
        padding: 4,
    },
    submitButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 8,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});
