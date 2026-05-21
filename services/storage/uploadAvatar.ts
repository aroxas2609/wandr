import { requireSupabaseClient } from '@/services/supabase/client';

export async function uploadAvatar(
  userId: string,
  localUri: string,
  mimeType = 'image/jpeg'
): Promise<string> {
  const client = requireSupabaseClient();

  const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
  const path = `${userId}/avatar.${ext}`;

  const response = await fetch(localUri);
  const blob = await response.blob();

  const { error } = await client.storage.from('avatars').upload(path, blob, {
    upsert: true,
    contentType: mimeType,
  });
  if (error) throw error;

  const { data } = client.storage.from('avatars').getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
