import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { ScreenHeader, GlassCard, PremiumButton, FormInput } from '@/components';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/features/auth/schemas/authSchema';
import { resetPassword } from '@/services/auth/authService';
import { colors, typography, spacing } from '@/theme';

export default function ForgotPasswordScreen() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    try {
      await resetPassword(data.email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Reset password" subtitle="We'll send you a recovery link" showBack />
      <View style={styles.content}>
        <GlassCard>
          {sent ? (
            <Text style={styles.success}>
              If an account exists for that email, you'll receive a reset link shortly.
            </Text>
          ) : (
            <>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormInput label="Email" value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="email-address" autoCapitalize="none" error={errors.email?.message} />
                )}
              />
              <PremiumButton label="Send Reset Link" onPress={handleSubmit(onSubmit)} loading={loading} />
            </>
          )}
        </GlassCard>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl },
  success: { ...typography.body, textAlign: 'center' },
});
