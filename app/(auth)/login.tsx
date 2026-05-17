import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { ScreenHeader, GlassCard, PremiumButton, FormInput } from '@/components';
import { loginSchema, type LoginFormData } from '@/features/auth/schemas/authSchema';
import { signIn } from '@/services/auth/authService';
import { useAuthStore } from '@/stores/authStore';
import { TestIds } from '@/constants/testIds';
import { colors, typography, spacing } from '@/theme';

export default function LoginScreen() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError('');
    try {
      const user = await signIn(data);
      setUser(user);
      setOnboardingComplete(true);
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Welcome back" subtitle="Sign in to continue your journey" showBack />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <GlassCard>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                label="Email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                label="Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                error={errors.password?.message}
              />
            )}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PremiumButton
            label="Sign In"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            testID={TestIds.loginButton}
          />
        </GlassCard>
        <PremiumButton
          label="Create Account"
          variant="ghost"
          onPress={() => router.push('/(auth)/register')}
        />
        <PremiumButton
          label="Forgot Password?"
          variant="outline"
          onPress={() => router.push('/(auth)/forgot-password')}
          style={styles.forgotButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
  error: { ...typography.caption, color: colors.danger, marginBottom: 12 },
  forgotButton: { marginTop: 8 },
});
