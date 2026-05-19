import UnsavedChangesDialog from '../shared/UnsavedChangesDialog';
import { useMetricsNavigation } from './useMetricsNavigation';

function MetricsUnsavedDialog() {
  const {
    isNavigating,
    handleNavigationCancel,
    handleNavigationDiscard,
    handleNavigationSave,
  } = useMetricsNavigation();

  return (
    <UnsavedChangesDialog
      open={isNavigating}
      onCancel={handleNavigationCancel}
      onDiscard={handleNavigationDiscard}
      onSave={handleNavigationSave}
    />
  );
}

export default MetricsUnsavedDialog;
