import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader, GlassCard, PremiumButton, ViewOnlyBanner } from '@/components';
import { useTripAccess } from '@/hooks/useTripAccess';
import { useTrip } from '@/features/trips/hooks/useTrips';
import {
  usePackingItems,
  useTogglePacking,
  useCreatePackingItem,
  useSuggestPacking,
  useDeletePackingItem,
} from '@/features/packing/hooks/usePacking';
import { getPackingProgress, groupPackingByCategory } from '@/utils/packing';
import { confirmDelete } from '@/lib/confirm';
import { getErrorMessage } from '@/lib/errors';
import { TestIds } from '@/constants/testIds';
import { colors, typography, spacing } from '@/theme';

export default function PackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip } = useTrip(id);
  const { canEdit, isViewer } = useTripAccess(id);
  const { data: items = [] } = usePackingItems(id);
  const togglePacking = useTogglePacking(id);
  const createItem = useCreatePackingItem(id);
  const suggest = useSuggestPacking(id);
  const deleteItem = useDeletePackingItem(id);
  const [newItemName, setNewItemName] = useState('');
  const [actionError, setActionError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const progress = getPackingProgress(items);
  const grouped = groupPackingByCategory(items);

  const handleAdd = async () => {
    if (!newItemName.trim()) return;
    setActionError('');
    try {
      await createItem.mutateAsync({ name: newItemName.trim(), category: 'Custom' });
      setNewItemName('');
    } catch (e) {
      setActionError(getErrorMessage(e, 'Could not add item.'));
    }
  };

  const handleSuggest = async () => {
    if (!trip) return;
    setActionError('');
    try {
      await suggest.mutateAsync(trip.destination ?? '');
    } catch (e) {
      setActionError(getErrorMessage(e, 'Could not suggest items.'));
    }
  };

  const removeItem = (item: { id: string; name: string }) => {
    const runDelete = confirmDelete(
      'Remove item?',
      `Remove "${item.name}" from your packing list?`,
      async () => {
        setActionError('');
        try {
          await deleteItem.mutateAsync(item.id);
        } catch (e) {
          setActionError(getErrorMessage(e, 'Could not remove item.'));
        }
      }
    );
    runDelete();
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Packing List"
        showBack
        backHref={`/trip/${id}`}
        subtitle={trip?.title}
        rightAction={
          canEdit && items.length > 0 ? (
            <Pressable
              onPress={() => setIsEditing((v) => !v)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={isEditing ? 'Done editing' : 'Edit packing list'}
            >
              <Text style={styles.editAction}>{isEditing ? 'Done' : 'Edit'}</Text>
            </Pressable>
          ) : undefined
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        {isViewer ? <ViewOnlyBanner /> : null}
        <GlassCard style={styles.progressCard}>
          <Text style={styles.progressText}>
            {progress.packed} of {progress.total} packed ({progress.percentage}%)
          </Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress.percentage}%` }]} />
          </View>
          {canEdit ? (
            <PremiumButton
              label="Suggest items"
              variant="outline"
              onPress={() => void handleSuggest()}
              loading={suggest.isPending}
              disabled={!trip}
            />
          ) : null}
        </GlassCard>

        {actionError ? <Text style={styles.error}>{actionError}</Text> : null}

        {canEdit ? (
        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            placeholder="Add item..."
            placeholderTextColor={colors.muted}
            value={newItemName}
            onChangeText={setNewItemName}
            onSubmitEditing={() => void handleAdd()}
            returnKeyType="done"
          />
          <Pressable
            style={styles.addBtn}
            onPress={() => void handleAdd()}
            disabled={createItem.isPending || !newItemName.trim()}
          >
            <Ionicons name="add" size={24} color={colors.background} />
          </Pressable>
        </View>
        ) : null}

        {isEditing ? (
          <Text style={styles.editHint}>Tap × to remove an item</Text>
        ) : items.length > 0 && Platform.OS !== 'web' ? (
          <Text style={styles.editHint}>Tap Edit to remove items</Text>
        ) : null}

        {Object.entries(grouped).map(([category, categoryItems]) => (
          <View key={category} style={styles.section}>
            <Text style={styles.category}>{category}</Text>
            {categoryItems.map((item) => (
              <View key={item.id} style={styles.row}>
                <Pressable
                  style={styles.rowMain}
                  onPress={() => {
                    if (isEditing || !canEdit) return;
                    togglePacking.mutate({ id: item.id, packed: !item.packed });
                  }}
                  onLongPress={
                    !isEditing && Platform.OS !== 'web'
                      ? () => removeItem(item)
                      : undefined
                  }
                  delayLongPress={450}
                  testID={TestIds.packingCheckbox}
                >
                  <Ionicons
                    name={item.packed ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={item.packed ? colors.gold : colors.muted}
                  />
                  <Text style={[styles.itemName, item.packed && styles.itemPacked]}>
                    {item.name}
                  </Text>
                </Pressable>
                {isEditing ? (
                  <Pressable
                    onPress={() => removeItem(item)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.name}`}
                    style={styles.removeBtn}
                  >
                    <Ionicons name="close-circle" size={22} color={colors.muted} />
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        ))}

        {items.length === 0 && (
          <Text style={styles.empty}>No items yet. Add some or tap Suggest items.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: 48 },
  progressCard: { marginBottom: spacing.lg },
  progressText: { ...typography.label, marginBottom: spacing.sm },
  track: {
    height: 6,
    backgroundColor: colors.elevated,
    borderRadius: 3,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.gold },
  addRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.primary,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAction: {
    ...typography.label,
    color: colors.gold,
    minWidth: 40,
    textAlign: 'right',
  },
  editHint: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  section: { marginBottom: spacing.lg },
  category: { ...typography.overline, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 10,
  },
  removeBtn: {
    paddingVertical: 10,
    paddingLeft: spacing.sm,
  },
  itemName: { ...typography.body, color: colors.primary, flex: 1 },
  itemPacked: { color: colors.muted, textDecorationLine: 'line-through' },
  empty: { ...typography.body, textAlign: 'center', marginTop: spacing.xl },
  error: { ...typography.caption, color: colors.danger, marginBottom: spacing.md },
});
