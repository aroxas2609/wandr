import { requireSupabaseClient } from '@/services/supabase/client';

export async function uploadTripCover(
  userId: string,
  tripId: string,
  localUri: string,
  mimeType = 'image/jpeg'
): Promise<string> {
  const client = requireSupabaseClient();

  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  const path = `${userId}/${tripId}/cover.${ext}`;

  const response = await fetch(localUri);
  const blob = await response.blob();

  const { error } = await client.storage.from('trip-covers').upload(path, blob, {
    upsert: true,
    contentType: mimeType,
  });
  if (error) throw error;

  const { data } = client.storage.from('trip-covers').getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function uploadTravelDocument(
  userId: string,
  documentId: string,
  localUri: string,
  mimeType = 'application/pdf'
): Promise<string> {
  const client = requireSupabaseClient();

  const ext = mimeType.includes('png')
    ? 'png'
    : mimeType.includes('webp')
      ? 'webp'
      : mimeType.includes('pdf')
        ? 'pdf'
        : 'jpg';
  const path = `${userId}/${documentId}.${ext}`;

  const response = await fetch(localUri);
  const blob = await response.blob();

  const { error } = await client.storage.from('travel-docs').upload(path, blob, {
    upsert: true,
    contentType: mimeType,
  });
  if (error) throw error;

  return `travel-docs:${path}`;
}
