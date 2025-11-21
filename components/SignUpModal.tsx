import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';

interface SignUpModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SignUpModal({ visible, onClose, onSuccess }: SignUpModalProps) {
  const { theme } = useTheme();
  const signUp = useAuthStore(state => state.signUp);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      onClose();
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { error: signUpError } = await signUp({ email, password });
      setLoading(false);
      if (signUpError) {
        setError(signUpError.message || 'Sign up failed');
        return;
      }
      // success
      reset();
      onClose();
      onSuccess && onSuccess();
    } catch (e: any) {
      setLoading(false);
      setError(e?.message || 'Sign up failed');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
            <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>Create Account</Text>
              {!!error && <Text style={[styles.errorText, { color: '#ff6b6b' }]}>{error}</Text>}

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: theme.textPrimary }]}>Email</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: 'rgba(128,128,128,0.15)', color: theme.textPrimary, borderColor: theme.borderSecondary }]}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: theme.textPrimary }]}>Password</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: 'rgba(128,128,128,0.15)', color: theme.textPrimary, borderColor: theme.borderSecondary }]}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.textTertiary}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: theme.textPrimary }]}>Confirm Password</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: 'rgba(128,128,128,0.15)', color: theme.textPrimary, borderColor: theme.borderSecondary }]}
                  placeholder="Confirm your password"
                  placeholderTextColor={theme.textTertiary}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={[styles.button, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]} onPress={handleClose} disabled={loading}>
                  <Text style={[styles.buttonText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleSignUp} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.buttonText, { color: '#fff' }]}>Create</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 8,
  },
  fieldGroup: { marginTop: 8 },
  label: { fontSize: 14, marginBottom: 6, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
});


