import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import WorkspaceProjectCard, {
  type WorkspaceProjectCardData,
} from '../components/workspaces/WorkspaceProjectCard';
import { getWorkspaceProjects } from '../services/workspacesService';

function Workspaces() {
  const [projects, setProjects] = useState<WorkspaceProjectCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadProjects = async () => {
      try {
        const data = await getWorkspaceProjects();
        if (mounted) setProjects(data);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadProjects();
    return () => {
      mounted = false;
    };
  }, []);

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
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography
            sx={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700,
              fontSize: 43 / 2,
              color: (theme) =>
                theme.palette.mode === 'dark'
                  ? theme.palette.text.primary
                  : theme.palette.primary.main,
            }}
          >
            Workspaces
          </Typography>
          <Typography
            sx={{
              mt: 0.2,
              color: (theme) =>
                theme.palette.mode === 'dark'
                  ? theme.palette.text.primary
                  : theme.palette.primary.main,
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            Manage and track your workspaces
          </Typography>
        </Box>
        <Button
          variant="contained"
          disableElevation
          sx={{
            bgcolor: 'primary.main',
            borderRadius: '5px',
            minWidth: 169,
            minHeight: 28,
            textTransform: 'none',
            fontSize: 14,
            fontWeight: 700,
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          + Create Workspace
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={24} sx={{ color: 'primary.main' }} />
        </Box>
      ) : (
        <Box
          sx={{
            mt: 3,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 300px)',
            columnGap: '22px',
            rowGap: '12px',
            alignItems: 'start',
            width: '100%',
            justifyContent: 'start',
          }}
        >
          {projects.map((project) => (
            <WorkspaceProjectCard key={project.id} project={project} />
          ))}
        </Box>
      )}
    </Box>
  );
}

export default Workspaces;
