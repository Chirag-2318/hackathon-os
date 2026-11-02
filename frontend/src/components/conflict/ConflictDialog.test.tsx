// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConflictDialog } from './ConflictDialog';
import { useConflictAwareMutation } from './useConflictAwareMutation';
import { renderHook } from '@testing-library/react';
import { ApiError } from '@/lib/apiClient';

describe('Conflict Resolution UX', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('useConflictAwareMutation stashes unsaved local text and parses 409 response', () => {
    const { result } = renderHook(() => useConflictAwareMutation());

    const fake409 = new ApiError(
      409,
      'Document was modified by another teammate',
      'EDIT_CONFLICT',
      undefined,
      {
        currentVersion: 3,
        lastEditorName: 'Alice',
        updatedAt: new Date(Date.now() - 60000).toISOString(),
        currentContent: '# Server Header\nServer text',
      }
    );

    let handled = false;
    act(() => {
      handled = result.current.handleConflict(
        fake409,
        '# Local Header\nMy unsaved edits',
        'document',
        'README.md'
      );
    });

    expect(handled).toBe(true);
    expect(result.current.conflictState.isOpen).toBe(true);
    expect(result.current.conflictState.serverVersion).toBe(3);
    expect(result.current.conflictState.lastEditorName).toBe('Alice');
    expect(result.current.conflictState.remoteContent).toBe('# Server Header\nServer text');
    expect(result.current.conflictState.localContent).toBe('# Local Header\nMy unsaved edits');

    // Verify localStorage draft stashing
    const saved = localStorage.getItem('hos:conflict:document:README.md');
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved!);
    expect(parsed.localContent).toBe('# Local Header\nMy unsaved edits');
  });

  it('Keep mine triggers onKeepMine with server version', async () => {
    const onKeepMine = vi.fn();

    render(
      <ConflictDialog
        open={true}
        onOpenChange={() => {}}
        entityType="document"
        entityName="DEMO_SCRIPT.md"
        localContent="Local edit"
        remoteContent="Remote edit"
        serverVersion={5}
        lastEditorName="Alice"
        updatedAt={new Date(Date.now() - 120000).toISOString()}
        onKeepMine={onKeepMine}
        onTakeTheirs={() => {}}
        onSaveMerged={() => {}}
      />
    );

    expect(screen.getAllByText(/Alice/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Edit Conflict Detected/i)).toBeTruthy();

    const keepMineBtn = screen.getByRole('button', { name: /keep mine/i });
    await act(async () => {
      fireEvent.click(keepMineBtn);
    });
    expect(onKeepMine).toHaveBeenCalledWith(5);
  });

  it('Take theirs triggers onTakeTheirs with remote content and version', async () => {
    const onTakeTheirs = vi.fn();

    render(
      <ConflictDialog
        open={true}
        onOpenChange={() => {}}
        entityType="document"
        entityName="DEMO_SCRIPT.md"
        localContent="Local edit"
        remoteContent="Remote edit"
        serverVersion={5}
        lastEditorName="Alice"
        updatedAt={new Date(Date.now() - 120000).toISOString()}
        onKeepMine={() => {}}
        onTakeTheirs={onTakeTheirs}
        onSaveMerged={() => {}}
      />
    );

    const takeTheirsBtn = screen.getByRole('button', { name: /take theirs/i });
    await act(async () => {
      fireEvent.click(takeTheirsBtn);
    });
    expect(onTakeTheirs).toHaveBeenCalledWith('Remote edit', 5);
  });

  it('Compare & merge opens diff and submits merged text', async () => {
    const onSaveMerged = vi.fn();

    render(
      <ConflictDialog
        open={true}
        onOpenChange={() => {}}
        entityType="document"
        entityName="DEMO_SCRIPT.md"
        localContent="Line 1: my edit\nLine 2: common"
        remoteContent="Line 1: alice edit\nLine 2: common"
        serverVersion={5}
        lastEditorName="Alice"
        updatedAt={new Date(Date.now() - 120000).toISOString()}
        onKeepMine={() => {}}
        onTakeTheirs={() => {}}
        onSaveMerged={onSaveMerged}
      />
    );

    const compareMergeBtn = screen.getByRole('button', { name: /compare & merge/i });
    await act(async () => {
      fireEvent.click(compareMergeBtn);
    });

    expect(screen.getByText(/Line Diff/i)).toBeTruthy();
    expect(screen.getByText(/Merged output/i)).toBeTruthy();

    const textarea = screen.getByRole('textbox', { name: /merged output/i });
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Line 1: merged\nLine 2: common' } });
    });

    const saveMergedBtn = screen.getByRole('button', { name: /save merged version/i });
    await act(async () => {
      fireEvent.click(saveMergedBtn);
    });
    expect(onSaveMerged).toHaveBeenCalledWith('Line 1: merged\nLine 2: common', 5);
  });
});
