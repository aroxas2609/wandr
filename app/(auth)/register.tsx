import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { ScreenHeader, GlassCard, PremiumButton, FormInput } from '@/components';
import { registerSchema, type RegisterFormData } from '@/features/auth/schemas/authSchema';
import { signUp, EmailConfirmationRequiredError } from '@/services/auth/authService';
import { useAuthStore } from '@/stores/authStore';
import { getPendingInviteToken } from '@/lib/pendingInvite';
import { colors, typography, spacing } from '@/theme';

export default function RegisterScreen() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const user = await signUp({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
      });
      setUser(user);
      setOnboardingComplete(true);
      const pendingInvite = getPendingInviteToken();
      router.replace(
        pendingInvite
          ? `/trip/join?token=${encodeURIComponent(pendingInvite)}`
          : '/(tabs)'
      );
    } catch (e) {
      if (e instanceof EmailConfirmationRequiredError) {
        setSuccess(
          `${e.message} If nothing arrives, check spam or wait before trying again (Supabase limits how many emails can be sent per hour).`
        );
        return;
      }
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Create account" subtitle="Start planning your next adventure" showBack />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <GlassCard>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput label="Full Name" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.fullName?.message} />
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput label="Email" value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="email-address" autoCapitalize="none" error={errors.email?.message} />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput label="Password" value={value} onChangeText={onChange} onBlur={onBlur} secureTextEntry error={errors.password?.message} />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput label="Confirm Password" value={value} onChangeText={onChange} onBlur={onBlur} secureTextEntry error={errors.confirmPassword?.message} />
            )}
          />
          {success ? <Text style={styles.success}>{success}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PremiumButton label="Create Account" onPress={handleSubmit(onSubmit)} loading={loading} />
        </GlassCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
  error: { ...typography.caption, color: colors.danger, marginBottom: 12 },
  success: { ...typography.caption, color: colors.sage, marginBottom: 12 },
});
