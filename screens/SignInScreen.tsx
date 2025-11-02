import React, { useState } from 'react';
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
import { useAuthStore } from '../state/authStore';
import { useTheme } from '../state/themeStore';

export default function SignInScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const signIn = useAuthStore(state => state.signIn);
  const { theme } = useTheme();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { error } = await signIn({ email, password });
    setLoading(false);

    if (error) {
      console.error('❌ Sign-in error:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      
      // Check if it's an email confirmation error
      if (error.code === 'email_not_confirmed' || 
          (error.message?.toLowerCase().includes('email') && 
           (error.message?.toLowerCase().includes('confirm') || 
            error.message?.toLowerCase().includes('not confirmed')))) {
        Alert.alert(
          'Email Not Verified',
          'Your email address needs to be verified before you can sign in. This setting is currently enabled in your Supabase project.\n\nPlease check your inbox for the verification email, or contact support to verify your account.',
          [
            { text: 'OK', style: 'default' },
            {
              text: 'Need Help?',
              onPress: () => {
                Alert.alert(
                  'Troubleshooting',
                  'To disable email confirmation requirement:\n\n1. Go to Supabase Dashboard\n2. Authentication → Settings\n3. Disable "Confirm email" option\n4. Save changes\n5. Wait 1-2 minutes for changes to propagate\n\nIf this persists, the setting may not have saved correctly. Try toggling it off/on again.'
                );
              }
            }
          ]
        );
      } else {
        Alert.alert('Sign In Error', error.message || 'Failed to sign in. Please check your credentials and try again.');
      }
    }
  };

    return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: 'transparent' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Share your journey, inspire the world
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>Email</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: 'rgba(128, 128, 128, 0.15)',
                borderColor: 'rgba(128, 128, 128, 0.3)',
                color: theme.textPrimary
              }]}
              placeholder="Enter your email"
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
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
                borderColor: 'rgba(128, 128, 128, 0.3)',
                color: theme.textPrimary
              }]}
              placeholder="Enter your password"
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }, loading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={[styles.linkText, { color: '#EA580C' }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
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
  buttonDisabled: {
    backgroundColor: '#9ca3af',
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
  },
  linkText: {
    fontWeight: '600',
  },
}); 