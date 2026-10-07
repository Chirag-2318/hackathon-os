import { useQuery } from '@tanstack/react-query';
import { authApi } from './api';
import { useAuthStore } from './useAuthStore';
import { useEffect } from 'react';

export function useCurrentUser() {
  const setUser = useAuthStore((s) => s.setUser);
  const query = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.me,
    retry: false,
  });

  useEffect(() => {
    if (query.data) setUser(query.data);
    if (query.isError) setUser(null);
  }, [query.data, query.isError, setUser]);

  return query;
}
