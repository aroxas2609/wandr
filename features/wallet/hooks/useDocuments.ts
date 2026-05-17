import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDocuments, createDocument, deleteDocument } from '../services/documentService';
import type { DocumentFormData } from '../schemas/documentSchema';

export const documentKeys = {
  trip: (tripId: string) => ['documents', tripId] as const,
};

export function useDocuments(tripId: string) {
  return useQuery({
    queryKey: documentKeys.trip(tripId),
    queryFn: () => fetchDocuments(tripId),
    enabled: !!tripId,
  });
}

export function useCreateDocument(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      form,
      userId,
      documentId,
    }: {
      form: DocumentFormData;
      userId: string;
      documentId?: string;
    }) => createDocument(tripId, userId, form, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.trip(tripId) });
    },
  });
}

export function useDeleteDocument(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.trip(tripId) });
    },
  });
}
