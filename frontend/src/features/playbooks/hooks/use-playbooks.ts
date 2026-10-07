import { useQuery } from '@tanstack/react-query';
import { fetchPlaybooks, fetchPlaybookDetail, type PlaybookCard, type PlaybookDetail } from '@/api/client';

export function usePlaybooks() {
  return useQuery<PlaybookCard[]>({
    queryKey: ['playbooks'],
    queryFn: fetchPlaybooks,
  });
}

export function usePlaybookDetail(slug: string) {
  return useQuery<PlaybookDetail>({
    queryKey: ['playbooks', slug],
    queryFn: () => fetchPlaybookDetail(slug),
    enabled: !!slug,
  });
}
