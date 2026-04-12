import { type QueryClient, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { BrowseFood, BrowseHerb, BrowseResponse } from '../../lib/types';

// ---- Foods Browse ----

interface FoodsBrowseParams {
  category?: string | null;
  season?: string | null;
  search?: string;
}

export function useFoodsBrowse({ category, season, search }: FoodsBrowseParams = {}) {
  const result = useInfiniteQuery<BrowseResponse<BrowseFood>>({
    queryKey: [
      'foods',
      'browse',
      { category: category ?? null, season: season ?? null, search: search ?? '' },
    ],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set('limit', '20');
      if (pageParam) params.set('cursor', pageParam as string);
      if (category) params.set('category', category);
      if (season) params.set('season', season);

      return apiFetch<BrowseResponse<BrowseFood>>(`/foods/browse?${params.toString()}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  const allItems = result.data?.pages.flatMap((p) => p.items) ?? [];

  return { ...result, allItems };
}

// ---- Herbs Browse ----

interface HerbsBrowseParams {
  category?: string | null;
  search?: string;
}

export function useHerbsBrowse({ category, search }: HerbsBrowseParams = {}) {
  const result = useInfiniteQuery<BrowseResponse<BrowseHerb>>({
    queryKey: ['herbs', 'browse', { category: category ?? null, search: search ?? '' }],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set('limit', '20');
      if (pageParam) params.set('cursor', pageParam as string);
      if (category) params.set('category', category);

      return apiFetch<BrowseResponse<BrowseHerb>>(`/herbs/browse?${params.toString()}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  const allItems = result.data?.pages.flatMap((p) => p.items) ?? [];

  return { ...result, allItems };
}

// ---- Food Detail ----

export function useFoodDetail(foodId: string | undefined) {
  return useQuery<BrowseFood>({
    queryKey: ['foods', foodId],
    queryFn: () => apiFetch<BrowseFood>(`/foods/${foodId}`),
    enabled: !!foodId,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });
}

export function prefetchFoodDetail(queryClient: QueryClient, foodId: string) {
  return queryClient.prefetchQuery({
    queryKey: ['foods', foodId],
    queryFn: () => apiFetch<BrowseFood>(`/foods/${foodId}`),
    staleTime: 1000 * 60 * 10,
  });
}

// ---- Herb Detail ----

export function useHerbDetail(herbId: string | undefined) {
  return useQuery<BrowseHerb>({
    queryKey: ['herbs', herbId],
    queryFn: () => apiFetch<BrowseHerb>(`/herbs/${herbId}`),
    enabled: !!herbId,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });
}

export function prefetchHerbDetail(queryClient: QueryClient, herbId: string) {
  return queryClient.prefetchQuery({
    queryKey: ['herbs', herbId],
    queryFn: () => apiFetch<BrowseHerb>(`/herbs/${herbId}`),
    staleTime: 1000 * 60 * 10,
  });
}
