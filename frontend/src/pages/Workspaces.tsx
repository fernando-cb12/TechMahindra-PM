import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import WorkspaceProjectCard, {
  type WorkspaceProjectCardData,
} from '../components/workspaces/WorkspaceProjectCard';
import { CreateWorkspaceModal } from '../components/workspaces/CreateWorkspaceModal';
import { AiWorkspaceImportDialog } from '../components/workspaces/AiWorkspaceImportDialog';
import { WorkspaceFilterBar, type WorkspaceFilters } from '../components/workspaces/WorkspaceFilterBar';
import {
  createWorkspaceProject,
  getAssignableWorkspaceUsers,
  getWorkspaceProjects,
  type AssignableUser,
  type CreateWorkspaceProjectPayload,
} from '../services/workspacesService';
import { hasMinimumRole, loadSession } from '../auth/auth';
import { processAiWorkspacePdf, type AiWorkspaceMode } from '../services/aiWorkspaceService';
import { showAppError } from '../components/shared/appNotifications';

function Workspaces() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<WorkspaceProjectCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateChoiceOpen, setIsCreateChoiceOpen] = useState(false);
  const [isAIUploadOpen, setIsAIUploadOpen] = useState(false);
  const [aiMode, setAiMode] = useState<AiWorkspaceMode>('EXTRACTION');
  const [aiSelectedFile, setAISelectedFile] = useState<File | null>(null);
  const [aiSelectedFileName, setAISelectedFileName] = useState<string | null>(null);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const theme = useTheme();
  const [filters, setFilters] = useState<WorkspaceFilters>({
    status: [],
    members: [],
    dateFrom: '',
    dateTo: '',
    progressComparison: 'all',
  });
  const isCreatingRef = useRef(false);

  const canCreateWorkspaces = useMemo(() => {
    const session = loadSession();
    return session ? hasMinimumRole(session.roles, 'TEAM_LEAD') : false;
  }, []);

  const memberFilterOptions = useMemo(() => {
    const names = projects.flatMap((p) => p.members);
    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
  }, [projects]);

  const loadProjects = useCallback(async () => {
    try {
      const data = await getWorkspaceProjects();
      setProjects(data);
    } catch (e) {
      setProjects([]);
      showAppError(e, 'Failed to load workspaces');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    const refresh = () => void loadProjects();
    window.addEventListener('workspace:created', refresh);
    window.addEventListener('workspace:renamed', refresh);
    window.addEventListener('workspace:deleted', refresh);
    window.addEventListener('workspace:restored', refresh);
    window.addEventListener('workspace:status-changed', refresh);
    return () => {
      window.removeEventListener('workspace:created', refresh);
      window.removeEventListener('workspace:renamed', refresh);
      window.removeEventListener('workspace:deleted', refresh);
      window.removeEventListener('workspace:restored', refresh);
      window.removeEventListener('workspace:status-changed', refresh);
    };
  }, [loadProjects]);

  useEffect(() => {
    if (!canCreateWorkspaces) {
      setAssignableUsers([]);
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        const users = await getAssignableWorkspaceUsers();
        if (!cancelled) setAssignableUsers(users);
      } catch {
        if (!cancelled) setAssignableUsers([]);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [canCreateWorkspaces]);

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
      if (filters.status.length > 0 && !filters.status.includes(project.status)) {
        return false;
      }

      if (filters.members.length > 0) {
        const hasAllMembers = filters.members.every((member) => project.members.includes(member));
        if (!hasAllMembers) return false;
      }

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

  const handleCreateWorkspace = async (payload: CreateWorkspaceProjectPayload) => {
    if (!canCreateWorkspaces) return;
    if (isCreatingRef.current || isSaving) return;
    isCreatingRef.current = true;
    setIsSaving(true);
    try {
      const newProject = await createWorkspaceProject(payload);
      setProjects((prev) => [newProject, ...prev]);
      setIsCreateOpen(false);
      setAISelectedFile(null);
      setAISelectedFileName(null);
      window.dispatchEvent(new CustomEvent('workspace:created', { detail: { workspaceId: newProject.id } }));
    } catch (e) {
      showAppError(e, 'Create failed');
    } finally {
      isCreatingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleManualCreate = () => {
    if (!canCreateWorkspaces) return;
    setIsCreateChoiceOpen(false);
    setIsCreateOpen(true);
  };

  const handleAISelect = () => {
    if (!canCreateWorkspaces) return;
    setIsCreateChoiceOpen(false);
    setIsAIUploadOpen(true);
  };

  const handleAIFileChange = (file: File | null) => {
    setAISelectedFile(file);
    setAISelectedFileName(file?.name ?? null);
  };

  const handleAIContinue = async () => {
    if (!canCreateWorkspaces) return;
    if (!aiSelectedFile || isAIProcessing) return;
    setIsAIProcessing(true);
    try {
      const draft = await processAiWorkspacePdf(aiSelectedFile, aiMode);
      setIsAIUploadOpen(false);
      setAISelectedFile(null);
      setAISelectedFileName(null);
      navigate(`/workspaces/ai-draft/${draft.id}`);
    } catch (e) {
      showAppError(e, 'Failed to process PDF with AI');
    } finally {
      setIsAIProcessing(false);
    }
  };

  const handleAIUploadClose = () => {
    if (isAIProcessing) return;
    setIsAIUploadOpen(false);
    setAISelectedFile(null);
    setAISelectedFileName(null);
  };

  const handleSelectWorkspace = useCallback((workspaceId: string) => {
    navigate(`/workspaces/${workspaceId}`);
  }, [navigate]);

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
          {canCreateWorkspaces ? (
            <Button
              variant="contained"
              disableElevation
              disabled={isSaving}
              onClick={() => {
                setIsCreateChoiceOpen(true);
              }}
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
          ) : null}
        </Box>
      </Box>

      <CreateWorkspaceModal
        open={canCreateWorkspaces && isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setAISelectedFile(null);
          setAISelectedFileName(null);
        }}
        onSave={handleCreateWorkspace}
        assignableUsers={assignableUsers}
        aiImportFileName={aiSelectedFileName ?? undefined}
      />

      <Dialog
        open={canCreateWorkspaces && isCreateChoiceOpen}
        onClose={() => setIsCreateChoiceOpen(false)}
        fullWidth
        maxWidth="sm"
        BackdropProps={{ sx: { backgroundColor: 'rgba(0, 0, 0, 0.55)' } }}
      >
        <DialogTitle
          sx={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: 20,
          }}
        >
          How do you want to create your workspace?
        </DialogTitle>
        <DialogContent sx={{ pt: 0, pb: 0 }}>
          <Box sx={{ pt: 1, pb: 2 }}>
            <Typography sx={{ fontFamily: 'Montserrat, sans-serif', color: 'text.secondary', mb: 2 }}>
              Import requirements, generate a delivery plan, or create a workspace from scratch.
            </Typography>
            <Stack spacing={2}>
              <Button
                variant="outlined"
                onClick={handleAISelect}
                startIcon={<UploadFileOutlinedIcon />}
                sx={{
                  textTransform: 'none',
                  justifyContent: 'flex-start',
                  p: 2,
                  borderRadius: 2,
                  borderColor: 'primary.main',
                  color: 'text.primary',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 700,
                }}
              >
                Create with AI
              </Button>
              <Button
                variant="contained"
                onClick={handleManualCreate}
                startIcon={<AddCircleOutlinedIcon />}
                sx={{
                  textTransform: 'none',
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' },
                  color: 'common.white',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 700,
                }}
              >
                Create from Scratch
              </Button>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button
            onClick={() => setIsCreateChoiceOpen(false)}
            sx={{
              fontFamily: 'Montserrat, sans-serif',
              textTransform: 'none',
              color: 'text.primary',
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <AiWorkspaceImportDialog
        open={canCreateWorkspaces && isAIUploadOpen}
        mode={aiMode}
        fileName={aiSelectedFileName}
        processing={isAIProcessing}
        onModeChange={setAiMode}
        onFileChange={handleAIFileChange}
        onClose={handleAIUploadClose}
        onContinue={handleAIContinue}
      />

      {isFilterOpen && (
        <WorkspaceFilterBar filters={filters} onFiltersChange={setFilters} memberOptions={memberFilterOptions} />
      )}

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
            filteredProjects.map((project) => (
              <WorkspaceProjectCard
                key={project.id}
                project={project}
                onSelect={handleSelectWorkspace}
              />
            ))
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
              {projects.length === 0
                ? 'No workspaces yet'
                : 'No workspaces match the selected filters'}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

export default Workspaces;
