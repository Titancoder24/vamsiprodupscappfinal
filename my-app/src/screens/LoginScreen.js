import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Animated,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { SmartTextInput } from '../components/SmartTextInput';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
  const { signInWithEmail, signUpWithEmail, sendPasswordResetEmail, sendMagicLink } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isMagicMode, setIsMagicMode] = useState(true); // Default to Magic Link
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 4000);
  };

  const handleMagicLink = async () => {
    if (!email.trim()) {
      showError('Please enter your email');
      return;
    }

    if (isSignUp && !name.trim()) {
      showError('Please enter your name');
      return;
    }

    try {
      setIsLoading(true);
      setLoadingType('email');
      setError('');

      await sendMagicLink(email.trim().toLowerCase(), isSignUp ? name.trim() : null);

      Alert.alert(
        'Magic Link Sent!',
        'Check your email and click the link to sign in instantly. No password required.',
        [{ text: 'OK' }]
      );
    } catch (err) {
      showError(err.message || 'Failed to send magic link');
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const handleEmailLogin = async () => {
    if (isMagicMode) {
      return handleMagicLink();
    }

    if (!email.trim()) {
      showError('Please enter your email');
      return;
    }

    // Check password for both Login and Sign Up
    if (!password.trim()) {
      showError('Please enter your password');
      return;
    }

    if (isSignUp && !name.trim()) {
      showError('Please enter your name');
      return;
    }

    try {
      setIsLoading(true);
      setLoadingType('email');
      setError('');

      if (isSignUp) {
        // Sign Up with Email + Password
        const result = await signUpWithEmail(email.trim().toLowerCase(), password, name.trim());

        // If no user returned or email not confirmed, show the check email message
        if (!result || !result.email_confirmed_at) {
          Alert.alert(
            'Verify Your Email',
            'We have sent a verification link to your email. Please check your inbox and click the link to activate your account.',
            [{ text: 'OK', onPress: () => setIsSignUp(false) }]
          );
        }
        // If email is confirmed (email confirmation disabled), user will be logged in automatically
      } else {
        // Login with Password
        await signInWithEmail(email.trim().toLowerCase(), password);
      }
    } catch (err) {
      let errorMessage = 'Failed to sign in. Please check your credentials.';
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      showError(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address first.');
      return;
    }

    try {
      setIsLoading(true);
      setLoadingType('forgot');
      await sendPasswordResetEmail(email.trim().toLowerCase());
      Alert.alert('Check Your Email', 'If an account exists, a password reset link has been sent.');
    } catch (err) {
      Alert.alert('Check Your Email', 'If an account exists, a password reset link has been sent.');
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Logo Section */}
            <View style={styles.logoSection}>
              <Image
                source={require('../../assets/prepassist-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                {isSignUp ? 'Create account' : 'Welcome back'}
              </Text>
              <Text style={styles.subtitle}>
                {isSignUp
                  ? 'Start your preparation journey'
                  : 'Sign in to continue learning'}
              </Text>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Form */}
            <View style={styles.form}>
              {isSignUp && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                    <SmartTextInput
                      style={styles.input}
                      placeholder="Enter your name"
                      placeholderTextColor="#9CA3AF"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      editable={!isLoading}
                    />
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                  <SmartTextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
              </View>

              {!isMagicMode && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                    <SmartTextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
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
              )}

              {/* Mode Switch Helper */}
              <TouchableOpacity
                style={styles.magicToggle}
                onPress={() => setIsMagicMode(!isMagicMode)}
              >
                <Ionicons name={isMagicMode ? "key-outline" : "mail-open-outline"} size={16} color="#4F46E5" />
                <Text style={styles.magicToggleText}>
                  {isMagicMode ? "Use password instead" : "Send magic link (passwordless)"}
                </Text>
              </TouchableOpacity>

              {/* Forgot Password */}
              {!isSignUp && (
                <TouchableOpacity
                  onPress={handleForgotPassword}
                  style={styles.forgotButton}
                  disabled={isLoading}
                >
                  {loadingType === 'forgot' ? (
                    <ActivityIndicator size="small" color="#6B7280" />
                  ) : (
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.buttonDisabled]}
                onPress={handleEmailLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {loadingType === 'email' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>
                      {isMagicMode
                        ? (isSignUp ? 'Create account' : 'Send link')
                        : (isSignUp ? 'Create account' : 'Sign in')}
                    </Text>
                    <Ionicons name={isMagicMode ? "send" : "arrow-forward"} size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              {/* Switch Mode */}
              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  disabled={isLoading}
                >
                  <Text style={styles.switchLink}>
                    {isSignUp ? 'Sign in' : 'Sign up'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By continuing, you agree to our{' '}
                <Text style={styles.footerLink}>Terms</Text> and{' '}
                <Text style={styles.footerLink}>Privacy Policy</Text>
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 200,
    height: 100,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    gap: 10,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
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
  forgotButton: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#1A1A1A',
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  switchText: {
    fontSize: 14,
    color: '#6B7280',
  },
  switchLink: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  magicToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: -8,
    marginBottom: 8,
  },
  magicToggleText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: '#6B7280',
    fontWeight: '500',
  },
});
