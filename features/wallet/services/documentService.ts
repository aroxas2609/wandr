import { getJson, setJson, StorageKeys } from '@/lib/mmkv';
import { generateId } from '@/lib/ids';
import { getSupabaseClient } from '@/services/supabase/client';
import { enqueue } from '@/services/sync/syncQueue';
import type { TravelDocument } from '@/types';
import type { DocumentFormData } from '../schemas/documentSchema';

const TRAVEL_DOCS_PREFIX = 'travel-docs:';

function getLocalDocuments(): TravelDocument[] {
  return getJson<TravelDocument[]>(StorageKeys.documents) ?? [];
}

function saveDocuments(docs: TravelDocument[]): void {
  setJson(StorageKeys.documents, docs);
}

function mapDbDocument(row: Record<string, unknown>): TravelDocument {
  return {
    id: row.id as string,
    tripId: row.trip_id as string | undefined,
    userId: row.user_id as string,
    type: row.type as TravelDocument['type'],
    title: row.title as string,
    fileUrl: row.file_url as string | undefined,
    expiryDate: row.expiry_date as string | undefined,
    createdAt: row.created_at as string,
  };
}

function mapDocumentToDb(doc: TravelDocument) {
  return {
    id: doc.id,
    trip_id: doc.tripId,
    user_id: doc.userId,
    type: doc.type,
    title: doc.title,
    file_url: doc.fileUrl,
    expiry_date: doc.expiryDate,
  };
}

async function resolveDocumentFileUrl(
  fileUrl: string | undefined
): Promise<string | undefined> {
  if (!fileUrl) return undefined;
  if (
    fileUrl.startsWith('http://') ||
    fileUrl.startsWith('https://') ||
    fileUrl.startsWith('file:') ||
    fileUrl.startsWith('blob:')
  ) {
    return fileUrl;
  }

  if (!fileUrl.startsWith(TRAVEL_DOCS_PREFIX)) return fileUrl;

  const client = getSupabaseClient();
  if (!client) return fileUrl;

  const path = fileUrl.slice(TRAVEL_DOCS_PREFIX.length);
  const { data, error } = await client.storage
    .from('travel-docs')
    .createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) return fileUrl;
  return data.signedUrl;
}

export async function fetchDocuments(tripId: string): Promise<TravelDocument[]> {
  const client = getSupabaseClient();
  if (!client) {
    return getLocalDocuments().filter((d) => d.tripId === tripId);
  }

  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) {
    return getLocalDocuments().filter((d) => d.tripId === tripId);
  }

  const { data, error } = await client
    .from('travel_documents')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const docs = await Promise.all(
    (data ?? []).map(async (row) => {
      const doc = mapDbDocument(row);
      return {
        ...doc,
        fileUrl: await resolveDocumentFileUrl(doc.fileUrl),
      };
    })
  );

  if (docs.length > 0) {
    const all = getLocalDocuments().filter((d) => d.tripId !== tripId);
    saveDocuments([...all, ...docs]);
  }
  return docs;
}

export async function createDocument(
  tripId: string,
  userId: string,
  form: DocumentFormData,
  documentId?: string
): Promise<TravelDocument> {
  const doc: TravelDocument = {
    id: documentId ?? generateId(),
    tripId,
    userId,
    type: form.type,
    title: form.title,
    fileUrl: form.fileUrl,
    expiryDate: form.expiryDate,
    createdAt: new Date().toISOString(),
  };

  saveDocuments([...getLocalDocuments(), doc]);

  const client = getSupabaseClient();
  if (client) {
    const { error } = await client.from('travel_documents').insert(mapDocumentToDb(doc));
    if (error) throw error;
  } else {
    enqueue('insert', 'travel_documents', doc as unknown as Record<string, unknown>);
  }

  return doc;
}

export async function deleteDocument(id: string): Promise<void> {
  saveDocuments(getLocalDocuments().filter((d) => d.id !== id));

  const client = getSupabaseClient();
  if (client) {
    const { error } = await client.from('travel_documents').delete().eq('id', id);
    if (error) throw error;
  } else {
    enqueue('delete', 'travel_documents', { id });
  }
}
