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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { SmartTextInput } from '../components/SmartTextInput';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
  const { signInWithEmail, signUpWithEmail, sendPasswordOTP, verifyOTPAndResetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

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

  const handleEmailLogin = async () => {
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

    if (isSignUp && phone.trim() && !/^[+]?[0-9]{10,15}$/.test(phone.replace(/\s/g, ''))) {
      showError('Please enter a valid mobile number');
      return;
    }

    try {
      setIsLoading(true);
      setLoadingType('email');
      setError('');

      console.log(`[Login] Attempting ${isSignUp ? 'SignUp' : 'SignIn'} for: ${email}`);

      if (isSignUp) {
        // Sign Up with Email + Password
        const result = await signUpWithEmail(email.trim().toLowerCase(), password, name.trim(), phone.trim());

        console.log('[Login] SignUp Result:', !!result);

        // If no user returned or email not confirmed, show the check email message
        if (!result || !result.email_confirmed_at) {
          setSuccessMessage('Account created! Verification email sent.');
          Alert.alert(
            'Verify Your Email',
            'Please check your inbox and click the link to activate your account.',
            [{
              text: 'OK', onPress: () => {
                setIsSignUp(false);
                setSuccessMessage('');
              }
            }]
          );
        } else {
          setSuccessMessage('Successfully signed up! Logging you in...');
        }
      } else {
        // Login with Password
        await signInWithEmail(email.trim().toLowerCase(), password);
      }
    } catch (err) {
      console.error('[Login] Auth Error:', err);
      let errorMessage = err?.message || 'Authentication failed. Please check your credentials.';

      if (errorMessage.includes('database error')) {
        errorMessage = 'This email might already be in use. Try logging in.';
      } else if (errorMessage.includes('Redirect URL')) {
        errorMessage = 'Configuration error: Redirect URL not allowed. Please contact support.';
      }

      setError(errorMessage);
      if (Platform.OS === 'web') alert('Auth Error: ' + errorMessage);
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  // Helper to mask email (e.g., "no****@gmail.com")
  const maskEmail = (emailStr) => {
    if (!emailStr) return '';
    const [localPart, domain] = emailStr.split('@');
    if (!domain) return emailStr;
    const visibleChars = Math.min(2, localPart.length);
    const masked = localPart.slice(0, visibleChars) + '****';
    return `${masked}@${domain}`;
  };

  // Open forgot password modal and send OTP immediately
  const openForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address first.');
      return;
    }

    setResetEmail(email.trim().toLowerCase());
    setForgotStep(2); // Start at OTP step directly
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError('');
    setShowForgotModal(true);

    // Send OTP immediately
    try {
      setForgotLoading(true);
      await sendPasswordOTP(email.trim().toLowerCase());
      Alert.alert('Code Sent', `A verification code has been sent to ${maskEmail(email.trim().toLowerCase())}`);
    } catch (err) {
      setForgotError(err.message || 'Failed to send verification code');
    } finally {
      setForgotLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    try {
      setForgotLoading(true);
      setForgotError('');
      await sendPasswordOTP(resetEmail);
      Alert.alert('Code Sent', `A new verification code has been sent to ${maskEmail(resetEmail)}`);
    } catch (err) {
      setForgotError(err.message || 'Failed to send verification code');
    } finally {
      setForgotLoading(false);
    }
  };

  // Verify OTP and proceed to new password
  const handleVerifyOTP = () => {
    if (!otpCode.trim() || otpCode.length < 6) {
      setForgotError('Please enter the 6-digit code from your email');
      return;
    }
    setForgotError('');
    setForgotStep(3);
  };

  // Step 3: Reset password
  const handleResetPassword = async () => {
    if (!newPassword.trim() || newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match');
      return;
    }

    try {
      setForgotLoading(true);
      setForgotError('');
      await verifyOTPAndResetPassword(resetEmail.trim().toLowerCase(), otpCode.trim(), newPassword);
      setShowForgotModal(false);
      Alert.alert('Success', 'Your password has been reset. Please login with your new password.');
    } catch (err) {
      setForgotError(err.message || 'Failed to reset password');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep(1);
    setForgotError('');
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

            {/* Success Message */}
            {successMessage ? (
              <View style={[styles.errorContainer, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                <Text style={[styles.errorText, { color: '#16A34A' }]}>{successMessage}</Text>
              </View>
            ) : null}

            {/* Form */}
            <View style={styles.form}>
              {isSignUp && (
                <>
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
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Mobile Number <Text style={styles.optionalLabel}>(Optional)</Text></Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="call-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                      <SmartTextInput
                        style={styles.input}
                        placeholder="+91 9876543210"
                        placeholderTextColor="#9CA3AF"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                        editable={!isLoading}
                      />
                    </View>
                  </View>
                </>
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

              {/* Forgot Password */}
              {!isSignUp && (
                <TouchableOpacity
                  onPress={openForgotPassword}
                  style={styles.forgotButton}
                  disabled={isLoading}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
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
                      {isSignUp ? 'Create account' : 'Sign in'}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
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

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeForgotModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {forgotStep === 2 && 'Enter Verification Code'}
                {forgotStep === 3 && 'Set New Password'}
              </Text>
              <TouchableOpacity onPress={closeForgotModal} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {forgotError ? (
              <View style={styles.modalErrorContainer}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.modalErrorText}>{forgotError}</Text>
              </View>
            ) : null}

            {/* OTP is sent immediately - no step 1 needed */}

            {/* Step 2: Enter OTP */}
            {forgotStep === 2 && (
              <>
                <Text style={styles.modalSubtitle}>
                  OTP has been sent to {maskEmail(resetEmail)}
                </Text>
                <View style={styles.modalInputContainer}>
                  <Ionicons name="key-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                  <SmartTextInput
                    style={styles.modalInput}
                    placeholder="Enter 8-digit code"
                    placeholderTextColor="#9CA3AF"
                    value={otpCode}
                    onChangeText={setOtpCode}
                    keyboardType="number-pad"
                    maxLength={8}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.modalButton, forgotLoading && styles.buttonDisabled]}
                  onPress={handleVerifyOTP}
                  disabled={forgotLoading}
                >
                  <Text style={styles.modalButtonText}>Verify Code</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleResendOTP} disabled={forgotLoading}>
                  <Text style={styles.resendText}>
                    {forgotLoading ? 'Sending...' : 'Resend Code'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Step 3: New Password */}
            {forgotStep === 3 && (
              <>
                <Text style={styles.modalSubtitle}>
                  Create a new password for your account.
                </Text>
                <View style={styles.modalInputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                  <SmartTextInput
                    style={styles.modalInput}
                    placeholder="New password"
                    placeholderTextColor="#9CA3AF"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />
                </View>
                <View style={styles.modalInputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                  <SmartTextInput
                    style={styles.modalInput}
                    placeholder="Confirm password"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                </View>
                <TouchableOpacity
                  style={[styles.modalButton, forgotLoading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalButtonText}>Reset Password</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  optionalLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  modalInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#1A1A1A',
  },
  modalButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  modalErrorText: {
    color: '#DC2626',
    fontSize: 13,
    flex: 1,
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
});
