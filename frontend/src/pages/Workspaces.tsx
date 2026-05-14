import { useEffect, useRef, useState } from 'react';
import { Box, Button, CircularProgress, Typography, useTheme } from '@mui/material';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import WorkspaceProjectCard, {
  type WorkspaceProjectCardData,
} from '../components/workspaces/WorkspaceProjectCard';
import { CreateWorkspaceModal } from '../components/workspaces/CreateWorkspaceModal';
import { WorkspaceFilterBar, type WorkspaceFilters } from '../components/workspaces/WorkspaceFilterBar';
import { getWorkspaceProjects, createWorkspaceProject } from '../services/workspacesService';

function Workspaces() {
  const [projects, setProjects] = useState<WorkspaceProjectCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const theme = useTheme();
  const [filters, setFilters] = useState<WorkspaceFilters>({
    status: [],
    members: [],
    dateFrom: '',
    dateTo: '',
    progressComparison: 'all',
  });
  const isCreatingRef = useRef(false);

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

  const parseDateString = (value: string): Date | null => {
    const mmddyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const mmddMatch = mmddyyyy.exec(value);
    if (mmddMatch) {
      const [, month, day, year] = mmddMatch;
      return new Date(`${year}-${month}-${day}T00:00:00`);
    }
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (isoMatch) {
      return new Date(`${value}T00:00:00`);
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const filterProjects = (allProjects: WorkspaceProjectCardData[]): WorkspaceProjectCardData[] => {
    return allProjects.filter((project) => {
      // Filter by status
      if (filters.status.length > 0 && !filters.status.includes(project.status)) {
        return false;
      }

      // Filter by members
      if (filters.members.length > 0) {
        const hasAllMembers = filters.members.every((member) => project.members.includes(member));
        if (!hasAllMembers) return false;
      }

      // Filter by date range
      if (filters.dateFrom || filters.dateTo) {
        const projectDate = parseDateString(project.dueDate);
        if (!projectDate) return false;
        if (filters.dateFrom) {
          const dateFrom = parseDateString(filters.dateFrom);
          if (!dateFrom || projectDate < dateFrom) return false;
        }
        if (filters.dateTo) {
          const dateTo = parseDateString(filters.dateTo);
          if (!dateTo || projectDate > dateTo) return false;
        }
      }

      // Filter by progress comparison
      if (filters.progressComparison !== 'all') {
        if (filters.progressComparison === 'greater' && project.currentProgress <= project.estimatedProgress) {
          return false;
        }
        if (filters.progressComparison === 'less' && project.currentProgress >= project.estimatedProgress) {
          return false;
        }
        if (filters.progressComparison === 'equal' && project.currentProgress !== project.estimatedProgress) {
          return false;
        }
      }

      return true;
    });
  };

  const filteredProjects = filterProjects(projects);

  const handleCreateWorkspace = async (
    workspace: Omit<WorkspaceProjectCardData, 'id' | 'currentProgress' | 'estimatedProgress'>
  ) => {
    if (isCreatingRef.current || isSaving) return;
    isCreatingRef.current = true;
    setIsSaving(true);
    try {
      const newProject = await createWorkspaceProject(workspace);
      setProjects((prev) => [newProject, ...prev]);
      setIsCreateOpen(false);
    } finally {
      isCreatingRef.current = false;
      setIsSaving(false);
    }
  };


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
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
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
            Manage and track workspaces
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant={isFilterOpen ? 'contained' : 'outlined'}
            disableElevation
            onClick={() => setIsFilterOpen((prev) => !prev)}
            sx={{
              borderRadius: '5px',
              minWidth: 120,
              minHeight: 28,
              textTransform: 'none',
              fontSize: 14,
              fontWeight: 700,
              color:
                isFilterOpen || theme.palette.mode === 'dark'
                  ? 'common.white'
                  : 'primary.main',
              borderColor:
                isFilterOpen || theme.palette.mode === 'dark'
                  ? undefined
                  : 'primary.main',
              backgroundColor: isFilterOpen ? 'primary.main' : 'transparent',
              '&:hover': {
                backgroundColor: isFilterOpen
                  ? 'primary.dark'
                  : theme.palette.mode === 'light'
                  ? 'rgba(95, 2, 41, 0.08)'
                  : 'rgba(255,255,255,0.12)',
              },
            }}
            startIcon={<FilterListOutlinedIcon />}
          >
            Filter
          </Button>
          <Button
            variant="contained"
            disableElevation
            disabled={isSaving}
            onClick={() => setIsCreateOpen(true)}
            sx={{
              bgcolor: 'primary.main',
              borderRadius: '5px',
              minWidth: 169,
              minHeight: 28,
              textTransform: 'none',
              fontSize: 14,
              fontWeight: 700,
              '&:hover': { bgcolor: 'primary.dark' },
              '&:disabled': { opacity: 0.6 },
            }}
          >
            {isSaving ? 'Creating...' : '+ Create Workspace'}
          </Button>
        </Box>
      </Box>

      <CreateWorkspaceModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={handleCreateWorkspace}
      />

      {isFilterOpen && <WorkspaceFilterBar filters={filters} onFiltersChange={setFilters} />}

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
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => <WorkspaceProjectCard key={project.id} project={project} />)
          ) : (
            <Typography
              sx={{
                fontFamily: 'Montserrat, sans-serif',
                color: 'text.secondary',
                fontSize: 14,
                gridColumn: '1 / -1',
                textAlign: 'center',
                py: 4,
              }}
            >
              No workspaces match the selected filters
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

export default Workspaces;
