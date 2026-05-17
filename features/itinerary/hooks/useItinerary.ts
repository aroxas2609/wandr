import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchActivitiesForDay,
  fetchActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  reorderActivity,
  fetchActivitiesForTrip,
} from '../services/itineraryService';
import type { Activity, ItineraryDay } from '@/types';
import type { ActivityFormData } from '../schemas/activitySchema';
import { tripKeys } from '@/features/trips/hooks/useTrips';
import { useAuthStore } from '@/stores/authStore';

export const itineraryKeys = {
  day: (dayId: string) => ['activities', dayId] as const,
  activity: (id: string) => ['activity', id] as const,
  trip: (tripId: string) => ['trip-activities', tripId] as const,
};

export function useDayActivities(dayId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  return useQuery({
    queryKey: itineraryKeys.day(dayId),
    queryFn: () => fetchActivitiesForDay(dayId),
    enabled: !!dayId && isHydrated && isAuthenticated && sessionReady,
  });
}

export function useActivity(id: string) {
  return useQuery({
    queryKey: itineraryKeys.activity(id),
    queryFn: () => fetchActivity(id),
    enabled: !!id,
  });
}

export function useTripActivities(days: ItineraryDay[], tripId: string) {
  return useQuery({
    queryKey: itineraryKeys.trip(tripId),
    queryFn: () => fetchActivitiesForTrip(days),
    enabled: days.length > 0 && !!tripId,
  });
}

export function useCreateActivity(dayId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (form: ActivityFormData) => createActivity(dayId, form),
    onSuccess: (activity) => {
      queryClient.setQueryData(itineraryKeys.day(dayId), (prev: Activity[] | undefined) => {
        const list = prev ?? [];
        if (list.some((a) => a.id === activity.id)) return list;
        return [...list, activity].sort((a, b) => a.sortOrder - b.sortOrder);
      });
      queryClient.invalidateQueries({ queryKey: itineraryKeys.day(dayId) });
    },
  });
}

export function useUpdateActivity(id: string, dayId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (form: ActivityFormData) => updateActivity(id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itineraryKeys.day(dayId) });
      queryClient.invalidateQueries({ queryKey: itineraryKeys.activity(id) });
    },
  });
}

export function useDeleteActivity(dayId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itineraryKeys.day(dayId) });
    },
  });
}

export function useReorderActivity(dayId: string, tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, direction }: { id: string; direction: 'up' | 'down' }) =>
      reorderActivity(id, direction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itineraryKeys.day(dayId) });
      queryClient.invalidateQueries({ queryKey: itineraryKeys.trip(tripId) });
    },
  });
}
