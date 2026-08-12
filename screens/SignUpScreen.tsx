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
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuthStore } from '../state/authStore';
import OnboardingShell from '../components/onboarding/ui/OnboardingShell';
import PrimaryButton from '../components/onboarding/ui/PrimaryButton';
import { OB } from '../components/onboarding/ui/onboardingTheme';
import { AUTH_BRAND } from '../components/onboarding/ui/authBrand';

export default function SignUpScreen({ navigation }: any) {
  const [authMethod, setAuthMethod] = useState<'options' | 'email'>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [emailError, setEmailError] = useState<{
    message: string;
    isBounce?: boolean;
    isInvalidEmail?: boolean;
  } | null>(null);
  const [showResendOption, setShowResendOption] = useState(false);

  const signUp = useAuthStore((state) => state.signUp);
  const signInWithApple = useAuthStore((state) => state.signInWithApple);
  const resendVerificationEmail = useAuthStore((state) => state.resendVerificationEmail);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => setAppleAvailable(false));
    }
  }, []);

  useEffect(() => {
    if (user) setLoading(false);
  }, [user]);

  const goBackRoot = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Welcome');
  };

  const handleAppleSignUp = async () => {
    setAppleLoading(true);
    const { error } = await signInWithApple();
    setAppleLoading(false);
    if (error) {
      Alert.alert('Apple Sign Up', error.message || 'Could not continue with Apple.');
    }
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
      if (error.isBounce || error.isInvalidEmail) {
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
      setEmailError(null);
      setShowResendOption(false);
    }
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
        "Please check your inbox for the verification email. If you don't see it, check your spam folder."
      );
      setShowResendOption(false);
      setEmailError(null);
    }
  };

  return (
    <OnboardingShell hideHeader showProgress={false}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={goBackRoot} style={styles.backBtn} hitSlop={12}>
              <Ionicons name="chevron-back" size={22} color={OB.text} />
            </TouchableOpacity>

            <Animated.View entering={FadeIn.duration(500)} style={styles.brandBlock}>
              <Text style={styles.brand}>NUTRAGISE</Text>
              <Text style={styles.tagline}>reach your peak</Text>
            </Animated.View>
          </View>

          <View style={styles.mid}>
            <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.formBlock}>
              <Text style={styles.title}>Join Nutragise</Text>
              <Text style={styles.subtitle}>Start your habit journey today.</Text>

              {authMethod === 'options' ? (
                <View style={styles.options}>
                  {appleAvailable ? (
                    <View style={styles.appleWrap}>
                      {appleLoading ? (
                        <View style={styles.appleLoading}>
                          <ActivityIndicator color="#FFFFFF" />
                        </View>
                      ) : (
                        <AppleAuthentication.AppleAuthenticationButton
                          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
                          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                          cornerRadius={16}
                          style={styles.appleBtn}
                          onPress={handleAppleSignUp}
                        />
                      )}
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={styles.methodBtn}
                    onPress={() => setAuthMethod('email')}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="mail-outline" size={20} color={OB.text} />
                    <Text style={styles.methodText}>Continue with Email</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.options}>
                  <TouchableOpacity
                    style={styles.backToOptions}
                    onPress={() => setAuthMethod('options')}
                    hitSlop={8}
                  >
                    <Ionicons name="chevron-back" size={18} color={OB.textMuted} />
                    <Text style={styles.backToOptionsText}>Other options</Text>
                  </TouchableOpacity>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor={OB.textSoft}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor={OB.textSoft}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirm password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm your password"
                      placeholderTextColor={OB.textSoft}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                    />
                  </View>

                  {emailError ? (
                    <View style={styles.errorContainer}>
                      <Ionicons name="warning-outline" size={18} color="#B91C1C" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.errorText}>{emailError.message}</Text>
                        {emailError.isInvalidEmail ? (
                          <Text style={styles.errorHint}>
                            Please check your email address and try again.
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ) : null}

                  <PrimaryButton
                    label="Sign up"
                    onPress={handleEmailSignUp}
                    loading={loading}
                    disabled={loading}
                    variant="white"
                    showArrow={false}
                    style={styles.signUpBtn}
                  />

                  {showResendOption ? (
                    <TouchableOpacity
                      style={styles.resendBtn}
                      onPress={handleResendEmail}
                      disabled={loading}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="mail-outline" size={18} color={OB.primaryDark} />
                      <Text style={styles.resendText}>Resend verification email</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                  <Text style={styles.linkText}>Sign in</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: AUTH_BRAND.bodyPaddingTop,
    paddingBottom: 40,
  },
  header: {
    position: 'relative',
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: 0,
    top: AUTH_BRAND.brandMarginTop,
    zIndex: 2,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: OB.white,
    borderWidth: 1,
    borderColor: OB.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBlock: {
    alignSelf: 'center',
    marginTop: AUTH_BRAND.brandMarginTop,
  },
  brand: {
    ...AUTH_BRAND.brand,
    color: OB.text,
  },
  tagline: {
    ...AUTH_BRAND.tagline,
    color: OB.textMuted,
  },
  mid: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 24,
  },
  formBlock: {
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: OB.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: OB.textMuted,
    textAlign: 'center',
    marginBottom: 12,
  },
  options: {
    gap: 12,
  },
  appleWrap: {
    width: '100%',
    height: 52,
  },
  appleBtn: {
    width: '100%',
    height: 52,
  },
  appleLoading: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(31, 41, 55, 0.12)',
  },
  methodText: {
    fontSize: 16,
    fontWeight: '700',
    color: OB.text,
  },
  backToOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  backToOptionsText: {
    fontSize: 14,
    fontWeight: '600',
    color: OB.textMuted,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: OB.text,
  },
  input: {
    backgroundColor: OB.white,
    borderWidth: 1,
    borderColor: OB.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: OB.text,
  },
  signUpBtn: {
    marginTop: 4,
    alignSelf: 'stretch',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(185, 28, 28, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(185, 28, 28, 0.25)',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B91C1C',
  },
  errorHint: {
    fontSize: 12,
    color: OB.textMuted,
    marginTop: 4,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: OB.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  resendText: {
    fontSize: 15,
    fontWeight: '700',
    color: OB.primaryDark,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  footerText: {
    fontSize: 14,
    color: OB.textMuted,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
    color: OB.primaryDark,
  },
});
