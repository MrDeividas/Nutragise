import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuthStore } from '../state/authStore';
import OnboardingShell from '../components/onboarding/ui/OnboardingShell';
import PrimaryButton from '../components/onboarding/ui/PrimaryButton';
import { OB } from '../components/onboarding/ui/onboardingTheme';
import { AUTH_BRAND } from '../components/onboarding/ui/authBrand';

export default function SignInScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const signIn = useAuthStore((state) => state.signIn);
  const signInWithApple = useAuthStore((state) => state.signInWithApple);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => setAppleAvailable(false));
    }
  }, []);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { error } = await signIn({ email, password });
    setLoading(false);

    if (error) {
      if (
        error.code === 'email_not_confirmed' ||
        (error.message?.toLowerCase().includes('email') &&
          (error.message?.toLowerCase().includes('confirm') ||
            error.message?.toLowerCase().includes('not confirmed')))
      ) {
        Alert.alert(
          'Email Not Verified',
          'Your email address needs to be verified before you can sign in. Please check your inbox for the verification email.',
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert(
          'Sign In Error',
          error.message || 'Failed to sign in. Please check your credentials and try again.'
        );
      }
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    const { error } = await signInWithApple();
    setAppleLoading(false);
    if (error) {
      Alert.alert('Apple Sign In', error.message || 'Could not continue with Apple.');
    }
  };

  return (
    <OnboardingShell hideHeader showProgress={false}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.header}>
          <Animated.View entering={FadeIn.duration(500)} style={styles.brandBlock}>
            <Text style={styles.brand}>NUTRAGISE</Text>
            <Text style={styles.tagline}>reach your peak</Text>
          </Animated.View>
        </View>

        <View style={styles.mid}>
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.formBlock}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue your habit journey.</Text>

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

            <PrimaryButton
              label="Sign in"
              onPress={handleSignIn}
              loading={loading}
              disabled={loading}
              variant="white"
              showArrow={false}
              style={styles.signInBtn}
              textStyle={styles.signInBtnText}
            />

            {appleAvailable ? (
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>
            ) : null}

            {appleAvailable ? (
              <View style={styles.appleWrap}>
                {appleLoading ? (
                  <View style={styles.appleLoading}>
                    <ActivityIndicator color="#FFFFFF" />
                  </View>
                ) : (
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={16}
                    style={styles.appleBtn}
                    onPress={handleAppleSignIn}
                  />
                )}
              </View>
            ) : null}

            <TouchableOpacity
              onPress={() => navigation.navigate('SignUp')}
              style={styles.footerBtn}
              activeOpacity={0.75}
            >
              <Text style={styles.footerText}>
                Don&apos;t have an account?{' '}
                <Text style={styles.linkText}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: AUTH_BRAND.bodyPaddingTop,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
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
    marginTop: 28,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(31, 41, 55, 0.18)',
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '600',
    color: OB.textSoft,
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
  signInBtn: {
    marginTop: 8,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 36,
    minWidth: 160,
  },
  signInBtnText: {
    textAlign: 'center',
    width: '100%',
    fontSize: 15,
  },
  footerBtn: {
    marginTop: 16,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: OB.border,
  },
  footerText: {
    fontSize: 15,
    fontWeight: '600',
    color: OB.text,
    textAlign: 'center',
  },
  linkText: {
    fontSize: 15,
    fontWeight: '800',
    color: OB.primaryDark,
    textDecorationLine: 'underline',
  },
});
