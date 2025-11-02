import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../state/authStore';
import { useTheme } from '../state/themeStore';

export default function SignUpScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [authMethod, setAuthMethod] = useState<'none' | 'email' | 'google' | 'apple'>('none');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<{ message: string; isBounce?: boolean; isInvalidEmail?: boolean } | null>(null);
  const [showResendOption, setShowResendOption] = useState(false);
  const signUp = useAuthStore(state => state.signUp);
  const resendVerificationEmail = useAuthStore(state => state.resendVerificationEmail);
  const user = useAuthStore(state => state.user);

  // Reset auth method to 'none' when screen mounts if no user (first time visiting)
  useEffect(() => {
    // Only reset if there's no user (first time sign-up, not returning user)
    if (!user && authMethod !== 'none') {
      setAuthMethod('none');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }
  }, []); // Only run on mount

  // Reset loading when user is set (App.tsx will handle navigation)
  useEffect(() => {
    if (user) {
      console.log('✅ User created, App.tsx will handle navigation to onboarding');
      setLoading(false);
      // Don't navigate here - let App.tsx handle stack switching
    }
  }, [user]);

  const handleGoogleSignUp = async () => {
    Alert.alert('Coming Soon', 'Google sign-up will be available soon!');
    // TODO: Implement Google OAuth
    // const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const handleAppleSignUp = async () => {
    Alert.alert('Coming Soon', 'Apple sign-up will be available soon!');
    // TODO: Implement Apple OAuth
    // const { error } = await supabase.auth.signInWithOAuth({ provider: 'apple' });
  };

  const handleEmailSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setEmailError(null);
    setShowResendOption(false);
    
    const { error } = await signUp({ email, password });
    
    if (error) {
      setLoading(false);
      
      // Check if it's an email bounce or invalid email error
      const isEmailRelatedError = error.isBounce || error.isInvalidEmail;
      
      if (isEmailRelatedError) {
        setEmailError({
          message: error.message,
          isBounce: error.isBounce,
          isInvalidEmail: error.isInvalidEmail,
        });
        setShowResendOption(true);
      } else {
        Alert.alert('Sign Up Error', error.message);
      }
    } else {
      // Success - clear any previous errors
      setEmailError(null);
      setShowResendOption(false);
    }
    // Navigation will happen automatically via useEffect when user state is set
  };

  const handleResendEmail = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    const { error } = await resendVerificationEmail(email);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert(
        'Email Sent',
        'Please check your inbox for the verification email. If you don\'t see it, check your spam folder.'
      );
      setShowResendOption(false);
      setEmailError(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Join Nutrapp</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Start your health journey today
            </Text>
          </View>

        {authMethod === 'none' ? (
          // Social Auth Options
          <View style={styles.form}>
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: '#000', borderColor: '#000' }]}
              onPress={handleGoogleSignUp}
            >
              <Ionicons name="logo-google" size={24} color="#fff" />
              <Text style={[styles.socialButtonText, { color: '#fff' }]}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: '#000' }]}
              onPress={handleAppleSignUp}
            >
              <Ionicons name="logo-apple" size={24} color="#fff" />
              <Text style={[styles.socialButtonText, { color: '#fff' }]}>
                Continue with Apple
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.borderSecondary }]} />
              <Text style={[styles.dividerText, { color: theme.textSecondary }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.borderSecondary }]} />
            </View>

            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: 'rgba(128, 128, 128, 0.15)', borderColor: theme.borderSecondary }]}
              onPress={() => setAuthMethod('email')}
            >
              <Ionicons name="mail-outline" size={24} color={theme.textPrimary} />
              <Text style={[styles.socialButtonText, { color: theme.textPrimary }]}>
                Continue with Email
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Email/Password Form
          <View style={styles.form}>
            <TouchableOpacity
              style={styles.backToOptionsButton}
              onPress={() => setAuthMethod('none')}
            >
              <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
              <Text style={[styles.backToOptionsText, { color: theme.textPrimary }]}>
                Back to options
              </Text>
            </TouchableOpacity>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>Email</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: 'rgba(128, 128, 128, 0.15)',
                  color: theme.textPrimary,
                  borderColor: theme.borderSecondary
                }]}
                placeholder="Enter your email"
                placeholderTextColor={theme.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>Password</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: 'rgba(128, 128, 128, 0.15)',
                  color: theme.textPrimary,
                  borderColor: theme.borderSecondary
                }]}
                placeholder="Enter your password"
                placeholderTextColor={theme.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>Confirm Password</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: 'rgba(128, 128, 128, 0.15)',
                  color: theme.textPrimary,
                  borderColor: theme.borderSecondary
                }]}
                placeholder="Confirm your password"
                placeholderTextColor={theme.textTertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            {emailError && (
              <View style={[styles.errorContainer, { backgroundColor: 'rgba(255, 107, 107, 0.1)', borderColor: '#FF6B6B' }]}>
                <Ionicons name="warning-outline" size={20} color="#FF6B6B" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
                    {emailError.message}
                  </Text>
                  {emailError.isInvalidEmail && (
                    <Text style={[styles.errorHint, { color: theme.textSecondary }]}>
                      Please check your email address and try again.
                    </Text>
                  )}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.button, 
                { backgroundColor: loading ? 'rgba(128, 128, 128, 0.3)' : theme.primary }
              ]}
              onPress={handleEmailSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            {showResendOption && (
              <TouchableOpacity
                style={[styles.resendButton, { borderColor: theme.primary }]}
                onPress={handleResendEmail}
                disabled={loading}
              >
                <Ionicons name="mail-outline" size={20} color={theme.primary} />
                <Text style={[styles.resendButtonText, { color: theme.primary }]}>
                  Resend Verification Email
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={[styles.linkText, { color: theme.primary }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 16,
  },
  linkText: {
    fontWeight: '600',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
  },
  backToOptionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backToOptionsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  errorHint: {
    fontSize: 12,
    marginTop: 4,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 8,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 