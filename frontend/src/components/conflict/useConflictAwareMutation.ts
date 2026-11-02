import { useState, useCallback } from 'react';
import { ApiError } from '@/lib/apiClient';
import { useDraftStore } from '@/app/layout/use-draft-store';
import { toast } from 'sonner';

export interface ConflictDetails {
  isOpen: boolean;
  entityType: string;
  entityId?: string;
  localContent: string;
  remoteContent: string;
  serverVersion: number;
  lastEditorName?: string;
  updatedAt?: string;
}

const initialConflictState: ConflictDetails = {
  isOpen: false,
  entityType: 'document',
  localContent: '',
  remoteContent: '',
  serverVersion: 0,
};

export function useConflictAwareMutation() {
  const [conflictState, setConflictState] = useState<ConflictDetails>(initialConflictState);

  const handleConflict = useCallback(
    (err: unknown, localContent: string, entityType: string, entityId?: string): boolean => {
      const isConflict =
        (err instanceof ApiError && (err.status === 409 || err.code === 'EDIT_CONFLICT' || err.code === 'VERSION_CONFLICT')) ||
        (err as any)?.status === 409 ||
        (err as any)?.code === 'EDIT_CONFLICT';

      if (!isConflict) {
        return false;
      }

      const details = (err as any)?.details || (err as any)?.response || {};
      const serverVersion = Number(details?.currentVersion ?? details?.version ?? 0);
      const lastEditorName =
        details?.lastEditorName ||
        details?.lastEditedBy?.displayName ||
        details?.lastEditedBy?.login ||
        'A teammate';
      const updatedAt = details?.updatedAt || new Date().toISOString();

      let remoteContent = '';
      if (typeof details?.currentContent === 'string') {
        remoteContent = details.currentContent;
      } else if (typeof details?.currentCopy?.content === 'string') {
        remoteContent = details.currentCopy.content;
      } else if (typeof details?.currentCopy?.text === 'string') {
        remoteContent = details.currentCopy.text;
      } else if (typeof details?.currentCopy === 'string') {
        remoteContent = details.currentCopy;
      } else if (typeof details?.latestData?.content === 'string') {
        remoteContent = details.latestData.content;
      } else if (typeof details?.latestData?.text === 'string') {
        remoteContent = details.latestData.text;
      } else if (typeof details?.latestData === 'string') {
        remoteContent = details.latestData;
      }

      // Stash unsaved local content safely in draft storage
      try {
        const draftKey = `hos:conflict:${entityType}:${entityId || 'current'}`;
        localStorage.setItem(draftKey, JSON.stringify({
          localContent,
          timestamp: Date.now(),
          entityType,
          entityId
        }));
      } catch (storageErr) {
        console.warn('Failed to stash conflict draft to localStorage', storageErr);
      }

      setConflictState({
        isOpen: true,
        entityType,
        entityId,
        localContent,
        remoteContent,
        serverVersion,
        lastEditorName,
        updatedAt,
      });

      toast.error('Conflict detected: teammate saved changes while you were editing', {
        id: 'conflict-toast',
      });

      return true;
    },
    []
  );

  const closeConflict = useCallback(() => {
    setConflictState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    conflictState,
    setConflictState,
    handleConflict,
    closeConflict,
  };
}

