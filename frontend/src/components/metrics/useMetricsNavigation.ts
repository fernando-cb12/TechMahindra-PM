import { useCallback, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import type { Blocker } from 'react-router-dom';
import { useDashboard } from './DashboardContext';

interface UseMetricsNavigationReturn {
  isNavigating: boolean;
  pendingBlocker: Blocker | null;
  handleNavigationCancel: () => void;
  handleNavigationDiscard: () => void;
  handleNavigationSave: () => void;
}

export function useMetricsNavigation(): UseMetricsNavigationReturn {
  const { hasUnsavedChanges, confirmEdit, discardChanges } = useDashboard();
  const [pendingBlocker, setPendingBlocker] = useState<Blocker | null>(null);

  // Block navigation when there are unsaved changes
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    return (
      hasUnsavedChanges &&
      currentLocation.pathname !== nextLocation.pathname
    );
  });

  // Store the blocker when navigation is blocked
  if (blocker.state === 'blocked' && !pendingBlocker) {
    setPendingBlocker(blocker);
  }

  const handleNavigationCancel = useCallback(() => {
    blocker.reset?.();
    setPendingBlocker(null);
  }, [blocker]);

  const handleNavigationDiscard = useCallback(() => {
    discardChanges();
    if (pendingBlocker) {
      pendingBlocker.proceed?.();
    }
    blocker.reset?.();
    setPendingBlocker(null);
  }, [pendingBlocker, blocker, discardChanges]);

  const handleNavigationSave = useCallback(() => {
    confirmEdit();
    if (pendingBlocker) {
      pendingBlocker.proceed?.();
    }
    blocker.reset?.();
    setPendingBlocker(null);
  }, [pendingBlocker, blocker, confirmEdit]);

  return {
    isNavigating: blocker.state === 'blocked',
    pendingBlocker,
    handleNavigationCancel,
    handleNavigationDiscard,
    handleNavigationSave,
  };
}
