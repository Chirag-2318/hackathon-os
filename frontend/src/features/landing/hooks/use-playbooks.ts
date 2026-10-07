/**
 * usePlaybooks — TanStack Query hook for playbook list.
 * Source: PRD §4 F-1, tech_stack.md §4.1.
 */
import { useQuery } from '@tanstack/react-query';
import { fetchPlaybooks, type PlaybookCard } from '@/api/client';

export function usePlaybooks() {
  return useQuery<PlaybookCard[]>({
    queryKey: ['playbooks'],
    queryFn: fetchPlaybooks,
  });
}
