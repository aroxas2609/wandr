import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPackingItems,
  createPackingItem,
  togglePackingItem,
  deletePackingItem,
  suggestPackingItems,
} from '../services/packingService';

export const packingKeys = {
  trip: (tripId: string) => ['packing', tripId] as const,
};

export function usePackingItems(tripId: string) {
  return useQuery({
    queryKey: packingKeys.trip(tripId),
    queryFn: () => fetchPackingItems(tripId),
    enabled: !!tripId,
  });
}

export function useCreatePackingItem(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, category }: { name: string; category: string }) =>
      createPackingItem(tripId, name, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: packingKeys.trip(tripId) });
    },
  });
}

export function useTogglePacking(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, packed }: { id: string; packed: boolean }) =>
      togglePackingItem(id, packed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: packingKeys.trip(tripId) });
    },
  });
}

export function useDeletePackingItem(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePackingItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: packingKeys.trip(tripId) });
    },
  });
}

export function useSuggestPacking(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (destination: string) => suggestPackingItems(tripId, destination),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: packingKeys.trip(tripId) });
    },
  });
}
