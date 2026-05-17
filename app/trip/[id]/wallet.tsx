import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenHeader,
  GlassCard,
  PremiumButton,
  FormInput,
  TagChip,
  FloatingActionButton,
  DeleteIconButton,
} from '@/components';
import { useTrip } from '@/features/trips/hooks/useTrips';
import { useDocuments, useCreateDocument, useDeleteDocument } from '@/features/wallet/hooks/useDocuments';
import { uploadTravelDocument } from '@/services/storage/upload';
import { useAuthStore } from '@/stores/authStore';
import type { PickedDocumentImage } from '@/lib/pickDocumentImage';
import { takeDocumentPhoto, pickImageFromLibrary } from '@/lib/pickDocumentImage';
import { generateId } from '@/lib/ids';
import { getErrorMessage } from '@/lib/errors';
import { confirmDelete } from '@/lib/confirm';
import type { DocumentType } from '@/types';
import { colors, typography, spacing, radius } from '@/theme';

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'boarding_pass', label: 'Boarding Pass' },
  { value: 'ticket', label: 'Ticket' },
  { value: 'passport', label: 'Passport' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'reservation', label: 'Reservation' },
  { value: 'other', label: 'Other' },
];

export default function WalletScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { data: trip } = useTrip(id);
  const { data: documents = [] } = useDocuments(id);
  const createDoc = useCreateDocument(id);
  const deleteDoc = useDeleteDocument(id);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<DocumentType>('other');
  const [attachment, setAttachment] = useState<PickedDocumentImage | undefined>();
  const [formError, setFormError] = useState('');

  const handleSave = async () => {
    setFormError('');
    if (!user) {
      setFormError('Sign in to save documents.');
      return;
    }
    if (!title.trim()) {
      setFormError('Enter a name for this document.');
      return;
    }

    try {
      const documentId = generateId();
      let fileUrl: string | undefined;
      if (attachment) {
        fileUrl = await uploadTravelDocument(
          user.id,
          documentId,
          attachment.uri,
          attachment.mimeType
        );
      }
      await createDoc.mutateAsync({
        userId: user.id,
        documentId,
        form: { title: title.trim(), type: docType, fileUrl },
      });
      setTitle('');
      setAttachment(undefined);
      setShowForm(false);
    } catch (e) {
      const message = getErrorMessage(e, 'Could not save document.');
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Save failed', message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Travel Wallet"
        showBack
        backHref={`/trip/${id}`}
        subtitle={trip?.title}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {showForm && (
          <GlassCard style={styles.form}>
            <FormInput label="Document title" value={title} onChangeText={setTitle} />
            <Text style={styles.label}>Type</Text>
            <View style={styles.chips}>
              {DOC_TYPES.map((t) => (
                <TagChip
                  key={t.value}
                  label={t.label}
                  selected={docType === t.value}
                  onPress={() => setDocType(t.value)}
                  compact
                />
              ))}
            </View>

            <Text style={styles.label}>Document photo</Text>
            {attachment ? (
              <View style={styles.previewWrap}>
                <Image source={{ uri: attachment.uri }} style={styles.preview} contentFit="cover" />
                <Pressable style={styles.removePhoto} onPress={() => setAttachment(undefined)}>
                  <Ionicons name="close-circle" size={28} color={colors.danger} />
                </Pressable>
              </View>
            ) : null}

            <View style={styles.attachRow}>
              <Pressable
                style={styles.attachOption}
                onPress={() => void takeDocumentPhoto().then((img) => img && setAttachment(img))}
              >
                <Ionicons name="camera-outline" size={24} color={colors.gold} />
                <Text style={styles.attachLabel}>Take photo</Text>
              </Pressable>
              <Pressable
                style={styles.attachOption}
                onPress={() => void pickImageFromLibrary().then((img) => img && setAttachment(img))}
              >
                <Ionicons name="images-outline" size={24} color={colors.gold} />
                <Text style={styles.attachLabel}>Photo library</Text>
              </Pressable>
            </View>

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}
            <PremiumButton
              label="Save document"
              onPress={() => void handleSave()}
              loading={createDoc.isPending}
            />
          </GlassCard>
        )}

        {documents.map((doc) => {
          const canOpen = !!doc.fileUrl;
          const isImage =
            canOpen && /\.(jpg|jpeg|png|webp|gif)/i.test(doc.fileUrl ?? '');

          return (
            <View key={doc.id} style={styles.docCard}>
              <View style={styles.docRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.docMain,
                    canOpen && pressed && styles.docMainPressed,
                  ]}
                  onPress={() => {
                    if (doc.fileUrl) void Linking.openURL(doc.fileUrl);
                  }}
                  disabled={!canOpen}
                  accessibilityRole="button"
                  accessibilityLabel={
                    canOpen ? `Open ${doc.title}` : `${doc.title}, no file attached`
                  }
                >
                  {isImage ? (
                    <Image source={{ uri: doc.fileUrl }} style={styles.docThumb} contentFit="cover" />
                  ) : (
                    <View style={styles.docIconWrap}>
                      <Ionicons name="document-outline" size={24} color={colors.gold} />
                    </View>
                  )}
                  <View style={styles.docInfo}>
                    <Text style={styles.docTitle}>{doc.title}</Text>
                    <Text style={styles.docType}>{doc.type.replace('_', ' ')}</Text>
                    {canOpen ? (
                      <Text style={styles.docHint}>Tap to open</Text>
                    ) : null}
                  </View>
                  {canOpen ? (
                    <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                  ) : null}
                </Pressable>

                <DeleteIconButton
                  onPress={confirmDelete('Delete document?', doc.title, () =>
                    deleteDoc.mutate(doc.id)
                  )}
                  accessibilityLabel={`Delete ${doc.title}`}
                />
              </View>
            </View>
          );
        })}

        {documents.length === 0 && !showForm && (
          <Text style={styles.empty}>Store boarding passes, tickets, and more.</Text>
        )}
      </ScrollView>
      {!showForm && <FloatingActionButton onPress={() => setShowForm(true)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: 120 },
  form: { marginBottom: spacing.lg },
  formError: { ...typography.caption, color: colors.danger, marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  attachRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  attachOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.card,
  },
  attachLabel: { ...typography.caption, color: colors.primary },
  previewWrap: {
    position: 'relative',
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: 180,
    backgroundColor: colors.elevated,
  },
  removePhoto: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.background,
    borderRadius: 14,
  },
  docCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  docMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
  },
  docMainPressed: { opacity: 0.85 },
  docThumb: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.elevated,
  },
  docIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfo: { flex: 1 },
  docTitle: { ...typography.label, color: colors.primary },
  docType: { ...typography.caption, textTransform: 'capitalize', marginTop: 2 },
  docHint: { ...typography.caption, color: colors.muted, marginTop: 4 },
  empty: { ...typography.body, textAlign: 'center', marginTop: spacing.xl },
});
