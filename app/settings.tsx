import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { ScreenHeader, GlassCard } from '@/components';
import { colors, typography, spacing } from '@/theme';
import { useState } from 'react';

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Settings" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Appearance</Text>
        <GlassCard>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Dark Mode</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: colors.elevated, true: colors.gold }}
              thumbColor={colors.primary}
            />
          </View>
          <Text style={styles.hint}>Light mode coming in a future update</Text>
        </GlassCard>

        <Text style={styles.sectionLabel}>Data</Text>
        <GlassCard>
          <Text style={styles.hint}>Export trips from Profile → Export Data</Text>
          <Text style={styles.placeholder}>Calendar import — coming soon</Text>
        </GlassCard>

        <Text style={styles.sectionLabel}>About</Text>
        <GlassCard>
          <Text style={styles.version}>Wandr v1.0.0</Text>
          <Text style={styles.hint}>Premium travel planning</Text>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
  sectionLabel: { ...typography.overline, marginBottom: spacing.sm, marginTop: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { ...typography.label, color: colors.primary },
  hint: { ...typography.caption, marginTop: 8 },
  placeholder: { ...typography.body, marginBottom: 8, opacity: 0.6 },
  version: { ...typography.h3, fontSize: 16 },
});
