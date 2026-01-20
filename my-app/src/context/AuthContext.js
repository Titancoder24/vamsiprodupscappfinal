import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

const USER_STORAGE_KEY = '@upsc_user';
const GUEST_USER_KEY = '@upsc_guest_user';
const SUPABASE_SESSION_KEY = '@upsc_supabase_session';

// Generate a unique guest ID
const generateGuestId = () => {
  return 'guest_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);

  // Check for existing user session on app launch
  useEffect(() => {
    checkUserSession();

    // Set up Supabase auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth state changed:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        await handleSupabaseUser(session.user, session);
      } else if (event === 'SIGNED_OUT') {
        // Only clear if user is not in guest mode
        if (!isGuestMode) {
          await clearUserData();
        }
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleSupabaseUser = async (supabaseUser, session) => {
    try {
      const userData = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.name ||
          supabaseUser.user_metadata?.full_name ||
          supabaseUser.email?.split('@')[0] || 'User',
        picture: supabaseUser.user_metadata?.picture || null,
        provider: 'supabase',
        isGuest: false,
        signedInAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      if (session) {
        await AsyncStorage.setItem(SUPABASE_SESSION_KEY, JSON.stringify(session));
      }
      await AsyncStorage.setItem('@has_launched', 'true');

      setUser(userData);
      setIsGuestMode(false);
      setIsFirstLaunch(false);

      console.log('[AuthContext] Supabase user signed in:', userData.email);
    } catch (error) {
      console.error('[AuthContext] Error handling Supabase user:', error);
    }
  };

  const clearUserData = async () => {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    await AsyncStorage.removeItem(SUPABASE_SESSION_KEY);
    setUser(null);
    setIsGuestMode(false);
  };

  const checkUserSession = async () => {
    try {
      console.log('[AuthContext] Checking user session...');

      const hasLaunched = await AsyncStorage.getItem('@has_launched');
      if (hasLaunched) {
        setIsFirstLaunch(false);
      }

      // First, check for active Supabase session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (session?.user && !error) {
        console.log('[AuthContext] Found active Supabase session');
        await handleSupabaseUser(session.user, session);
        setIsLoading(false);
        return;
      }

      // Check for stored user (regular or guest)
      const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
      const guestUser = await AsyncStorage.getItem(GUEST_USER_KEY);

      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);

          // If it's a Supabase user but no active session, clear it
          if (userData.provider === 'supabase' && !session) {
            console.log('[AuthContext] Supabase user stored but no session, clearing');
            await clearUserData();
          } else {
            setUser(userData);
            setIsGuestMode(userData.isGuest || false);
            console.log('[AuthContext] User restored from storage:', userData.email || userData.name);
          }
        } catch (e) {
          console.error('[AuthContext] Error parsing stored user:', e);
        }
      } else if (guestUser) {
        try {
          const userData = JSON.parse(guestUser);
          setUser(userData);
          setIsGuestMode(true);
          console.log('[AuthContext] Guest user restored:', userData.name);
        } catch (e) {
          console.error('[AuthContext] Error parsing guest user:', e);
        }
      }
    } catch (error) {
      console.error('[AuthContext] Error checking user session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (userData) => {
    try {
      console.log('[AuthContext] Signing in user:', userData.email || userData.name);
      const userToStore = {
        ...userData,
        signedInAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userToStore));
      await AsyncStorage.setItem('@has_launched', 'true');
      setUser(userToStore);
      setIsGuestMode(userData.isGuest || false);
      setIsFirstLaunch(false);
    } catch (error) {
      console.error('[AuthContext] Error signing in:', error);
      throw error;
    }
  };

  // Sign in as guest - no backend required
  const signInAsGuest = async (name = 'Guest User') => {
    try {
      console.log('[AuthContext] Signing in as guest:', name);
      const guestUser = {
        id: generateGuestId(),
        name: name,
        email: null,
        picture: null,
        provider: 'guest',
        isGuest: true,
        signedInAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(guestUser));
      await AsyncStorage.setItem(GUEST_USER_KEY, JSON.stringify(guestUser));
      await AsyncStorage.setItem('@has_launched', 'true');
      setUser(guestUser);
      setIsGuestMode(true);
      setIsFirstLaunch(false);
      return guestUser;
    } catch (error) {
      console.error('[AuthContext] Error signing in as guest:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('[AuthContext] Signing out user');

      // Sign out from Supabase if authenticated
      if (user?.provider === 'supabase') {
        await supabase.auth.signOut();
      }

      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      await AsyncStorage.removeItem(GUEST_USER_KEY);
      await AsyncStorage.removeItem(SUPABASE_SESSION_KEY);
      setUser(null);
      setIsGuestMode(false);
    } catch (error) {
      console.error('[AuthContext] Error signing out:', error);
      // Force clear even on error
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      await AsyncStorage.removeItem(GUEST_USER_KEY);
      await AsyncStorage.removeItem(SUPABASE_SESSION_KEY);
      setUser(null);
      setIsGuestMode(false);
    }
  };

  // Supabase sign in with email and password
  const signInWithEmail = async (email, password) => {
    try {
      console.log('[AuthContext] Signing in with Supabase:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthContext] Sign in error:', error.message);
        throw new Error(error.message);
      }

      if (!data?.user) {
        throw new Error('No user data returned from sign in');
      }

      // The onAuthStateChange listener will handle setting the user
      console.log('[AuthContext] Sign in successful:', data.user.email);
      return data.user;
    } catch (error) {
      console.error('[AuthContext] Error in signInWithEmail:', error);
      throw error;
    }
  };

  // Supabase sign up with email and password
  const signUpWithEmail = async (email, password, name) => {
    try {
      console.log('[AuthContext] Signing up with Supabase:', email);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            full_name: name,
          },
          // Skip email confirmation for immediate login
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        console.error('[AuthContext] Sign up error:', error.message);
        throw new Error(error.message);
      }

      if (!data?.user) {
        throw new Error('No user data returned from sign up');
      }

      console.log('[AuthContext] Sign up response:', {
        userId: data.user.id,
        email: data.user.email,
        emailConfirmed: !!data.user.email_confirmed_at,
        hasSession: !!data.session,
      });

      // If we got a session, the user is signed in (email confirmation disabled)
      if (data.session) {
        console.log('[AuthContext] User signed in immediately after signup');
        // Directly handle the user to ensure state update
        await handleSupabaseUser(data.user, data.session);
        return data.user;
      }

      // If no session, email confirmation might be required
      // Auto-sign in immediately since we have the password
      console.log('[AuthContext] No session returned, attempting auto sign-in...');

      // Small delay to allow Supabase to process the signup
      await new Promise(resolve => setTimeout(resolve, 500));

      // Try to sign in immediately
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // If sign in fails due to email confirmation, inform the user
        if (signInError.message?.includes('Email not confirmed')) {
          console.log('[AuthContext] Email confirmation required');
          throw new Error('Please check your email to confirm your account, then sign in.');
        }
        console.error('[AuthContext] Auto sign-in error:', signInError.message);
        throw new Error(signInError.message);
      }

      if (signInData?.user && signInData?.session) {
        console.log('[AuthContext] Auto sign-in successful:', signInData.user.email);
        // Directly handle the user to ensure state update
        await handleSupabaseUser(signInData.user, signInData.session);
        return signInData.user;
      }

      // Fallback - just return the created user (auth state listener should handle it)
      return data.user;
    } catch (error) {
      console.error('[AuthContext] Error in signUpWithEmail:', error);
      throw error;
    }
  };

  // Send password reset email
  const sendPasswordResetEmail = async (email) => {
    try {
      console.log('[AuthContext] Sending password reset email to:', email);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'upscprep://reset-password', // Deep link for mobile app
      });

      if (error) {
        console.error('[AuthContext] Password reset error:', error.message);
        throw new Error(error.message);
      }

      console.log('[AuthContext] Password reset email sent successfully');
      return true;
    } catch (error) {
      console.error('[AuthContext] Error in sendPasswordResetEmail:', error);
      throw error;
    }
  };

  // Reset password with new password (after clicking reset link)
  const resetPassword = async (newPassword) => {
    try {
      console.log('[AuthContext] Resetting password');

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('[AuthContext] Reset password error:', error.message);
        throw new Error(error.message);
      }

      console.log('[AuthContext] Password reset successful');
      return true;
    } catch (error) {
      console.error('[AuthContext] Error in resetPassword:', error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      // Clear all user data
      const keysToRemove = [
        USER_STORAGE_KEY,
        '@upsc_stats',
        '@upsc_streak',
        '@upsc_test_history',
        '@upsc_settings',
        '@question_bank',
      ];
      await AsyncStorage.multiRemove(keysToRemove);
      setUser(null);
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  const updateUser = async (updates) => {
    try {
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@has_launched', 'true');
      setIsFirstLaunch(false);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isFirstLaunch,
        isGuestMode,
        signIn,
        signOut,
        signInAsGuest,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordResetEmail,
        resetPassword,
        deleteAccount,
        updateUser,
        completeOnboarding,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

