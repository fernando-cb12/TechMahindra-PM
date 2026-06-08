import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import type { WorkspaceProjectCardData, WorkspaceProjectStatus } from '../components/workspaces/WorkspaceProjectCard';
import { getWorkspace, updateWorkspaceProject } from '../services/workspacesService';
import WorkspaceHeader from '../components/workspaces/detail/WorkspaceHeader';
import WorkspaceStats from '../components/workspaces/detail/WorkspaceStats';
import WorkspaceIssuesSection from '../components/workspaces/detail/WorkspaceIssuesSection';
import WorkspaceBoardsSection from '../components/workspaces/detail/WorkspaceBoardsSection';
import WorkspaceMetricsSection from '../components/workspaces/detail/WorkspaceMetricsSection';
import WorkspaceUsersSection from '../components/workspaces/detail/WorkspaceUsersSection';
import { getWorkspaceStatusLabel } from '../components/workspaces/workspaceStatus';
import { showAppNotification, showAppError } from '../components/shared/appNotifications';
import WorkspaceActionPillButton from '../components/workspaces/detail/WorkspaceActionPillButton';
import { useAuth } from '../auth/useAuth';

function WorkspaceDetail() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { hasRoleAtLeast } = useAuth();
  const [workspace, setWorkspace] = useState<WorkspaceProjectCardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const loadWorkspace = async () => {
      if (!workspaceId) {
        showAppNotification({ message: 'Workspace ID not found', severity: 'error' });
        setIsLoading(false);
        return;
      }

      try {
        const found = await getWorkspace(workspaceId);
        setWorkspace(found);
      } catch (e) {
        showAppError(e, 'Failed to load workspace');
      } finally {
        setIsLoading(false);
      }
    };

    void loadWorkspace();
  }, [workspaceId]);

  const handleWorkspaceStatusChange = async (status: WorkspaceProjectStatus) => {
    if (!workspaceId || !workspace || workspace.status === status || isUpdatingStatus) {
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const updated = await updateWorkspaceProject(workspaceId, { status });
      setWorkspace(updated);
      window.dispatchEvent(new CustomEvent('workspace:status-changed', {
        detail: { workspaceId: updated.id, status: updated.status },
      }));
      showAppNotification({ message: `Workspace marked as ${getWorkspaceStatusLabel(updated.status)}`, severity: 'success' });
    } catch (e) {
      showAppError(e, 'Failed to update workspace status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <Box
        component="main"
        sx={{
          flex: 1,
          minHeight: '100vh',
          backgroundColor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={40} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  if (!workspace) {
    return (
      <Box
        component="main"
        sx={{
          flex: 1,
          minHeight: '100vh',
          backgroundColor: 'background.default',
          px: { xs: 2, sm: 4 },
          py: 3,
        }}
      >
        <WorkspaceActionPillButton
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/workspaces')}
          sx={{
            mb: 2,
            fontSize: 14,
          }}
        >
          Back to Workspaces
        </WorkspaceActionPillButton>
        <Typography sx={{ color: 'text.secondary', fontFamily: 'Montserrat, sans-serif' }}>
          Workspace not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 4 },
        py: 3,
      }}
    >
      <WorkspaceActionPillButton
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/workspaces')}
        sx={{
          mb: 3,
          fontSize: 14,
        }}
      >
        Back to Workspaces
      </WorkspaceActionPillButton>

      <WorkspaceHeader
        workspace={workspace}
        canManageStatus={hasRoleAtLeast('TEAM_LEAD')}
        isUpdatingStatus={isUpdatingStatus}
        onStatusChange={handleWorkspaceStatusChange}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
          gap: 3,
          mt: 4,
          alignItems: 'stretch',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, minHeight: 0 }}>
          <WorkspaceIssuesSection workspace={workspace} />
          <Box sx={{ flex: 1, minHeight: 340 }}>
            <WorkspaceBoardsSection workspaceId={workspace.id} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, minHeight: 0 }}>
          <WorkspaceMetricsSection workspaceId={workspace.id} />
          <Box sx={{ flex: 1, minHeight: 340 }}>
            <WorkspaceUsersSection workspace={workspace} onWorkspaceChange={setWorkspace} />
          </Box>
        </Box>
      </Box>

      <Box sx={{ mt: 3 }}>
        <WorkspaceStats workspace={workspace} />
      </Box>
    </Box>
  );
}

export default WorkspaceDetail;
