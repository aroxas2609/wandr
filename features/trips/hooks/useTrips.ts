import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTrips,
  fetchTrip,
  createTrip,
  updateTrip,
  deleteTrip,
  archiveTrip,
  unarchiveTrip,
  fetchTripDays,
} from '../services/tripService';
import { fetchTripMembers } from '@/features/collaboration/services/memberService';
import { useAuthStore } from '@/stores/authStore';
import type { TripFormData } from '../schemas/tripSchema';

export const tripKeys = {
  all: ['trips'] as const,
  detail: (id: string) => ['trip', id] as const,
  days: (tripId: string) => ['days', tripId] as const,
  members: (tripId: string) => ['members', tripId] as const,
};

export function useTrips() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  return useQuery({
    queryKey: tripKeys.all,
    queryFn: fetchTrips,
    enabled: isHydrated && isAuthenticated && sessionReady,
  });
}

export function useTrip(id: string) {
  return useQuery({
    queryKey: tripKeys.detail(id),
    queryFn: () => fetchTrip(id),
    enabled: !!id,
  });
}

export function useTripDays(tripId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  return useQuery({
    queryKey: tripKeys.days(tripId),
    queryFn: () => fetchTripDays(tripId),
    enabled: !!tripId && isHydrated && isAuthenticated && sessionReady,
  });
}

export function useTripMembers(tripId: string) {
  return useQuery({
    queryKey: tripKeys.members(tripId),
    queryFn: () => fetchTripMembers(tripId),
    enabled: !!tripId,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ form }: { form: TripFormData }) => createTrip(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKeys.all });
    },
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, form }: { id: string; form: TripFormData }) =>
      updateTrip(id, form),
    onMutate: async ({ id, form }) => {
      await queryClient.cancelQueries({ queryKey: tripKeys.detail(id) });
      const previous = queryClient.getQueryData(tripKeys.detail(id));
      queryClient.setQueryData(tripKeys.detail(id), (old: unknown) => ({
        ...(old as object),
        ...form,
      }));
      return { previous };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(tripKeys.detail(id), context.previous);
      }
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.all });
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(id) });
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKeys.all });
    },
  });
}

export function useArchiveTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveTrip,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.all });
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(id) });
    },
  });
}

export function useUnarchiveTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unarchiveTrip,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.all });
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(id) });
    },
  });
}
