import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Alert, Button, useTheme } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import type { WorkspaceProjectCardData } from '../components/workspaces/WorkspaceProjectCard';
import { getWorkspace } from '../services/workspacesService';
import WorkspaceHeader from '../components/workspaces/detail/WorkspaceHeader';
import WorkspaceStats from '../components/workspaces/detail/WorkspaceStats';
import WorkspaceIssuesSection from '../components/workspaces/detail/WorkspaceIssuesSection';
import WorkspaceBoardsSection from '../components/workspaces/detail/WorkspaceBoardsSection';
import WorkspaceMetricsSection from '../components/workspaces/detail/WorkspaceMetricsSection';
import WorkspaceUsersSection from '../components/workspaces/detail/WorkspaceUsersSection';

function WorkspaceDetail() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [workspace, setWorkspace] = useState<WorkspaceProjectCardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkspace = async () => {
      if (!workspaceId) {
        setError('Workspace ID not found');
        setIsLoading(false);
        return;
      }

      try {
        const found = await getWorkspace(workspaceId);
        setWorkspace(found);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load workspace');
      } finally {
        setIsLoading(false);
      }
    };

    void loadWorkspace();
  }, [workspaceId]);

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

  if (error || !workspace) {
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
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/workspaces')}
          sx={{
            textTransform: 'none',
            mb: 2,
            color: 'primary.main',
            fontWeight: 600,
            fontSize: 14,
            '&:hover': { bgcolor: 'rgba(95, 2, 41, 0.08)' },
          }}
        >
          Back to Workspaces
        </Button>
        <Alert severity="error">{error || 'Workspace not found'}</Alert>
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
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/workspaces')}
        sx={{
          textTransform: 'none',
          mb: 3,
          color: theme.palette.mode === 'dark' ? '#fff' : 'primary.main',
          fontWeight: 600,
          fontSize: 14,
          '&:hover': { bgcolor: 'rgba(95, 2, 41, 0.08)' },
        }}
      >
        Back to Workspaces
      </Button>

      <WorkspaceHeader workspace={workspace} />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
          gap: 3,
          mt: 4,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <WorkspaceIssuesSection workspace={workspace} />
          <WorkspaceBoardsSection workspaceId={workspace.id} />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <WorkspaceMetricsSection />
          <WorkspaceUsersSection workspace={workspace} />
        </Box>
      </Box>

      <Box sx={{ mt: 3 }}>
        <WorkspaceStats workspace={workspace} />
      </Box>
    </Box>
  );
}

export default WorkspaceDetail;
