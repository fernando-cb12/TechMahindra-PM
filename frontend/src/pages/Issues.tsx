import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  useTheme,
  type SelectChangeEvent,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NewIssue from '../components/issue/NewIssue';
import IssueList from '../components/issue/IssueList';
import IssuesTabs from '../components/issue/IssuesTabs';
import IssuesFilters from '../components/issue/IssuesFilters';
import IssuesSummaryCards from '../components/issue/IssuesSummaryCards';
import { createIssue, getIssues } from '../services/issueService';
import { getWorkspace } from '../services/workspacesService';
import type { WorkspaceProjectCardData } from '../components/workspaces/WorkspaceProjectCard';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { IssueCardProps } from '../components/issue/types';

function Issues() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [searchParams] = useSearchParams();
  const isWorkspaceScope = Boolean(workspaceId);

  const [issues, setIssues] = useState<IssueCardProps[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceProjectCardData | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<'all' | 'mine'>('mine');
  const [projectFilter, setProjectFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Legacy links: /issues?workspaceId=… → /workspaces/:id/issues
  useEffect(() => {
    if (isWorkspaceScope) {
      return;
    }
    const legacyWorkspaceId = searchParams.get('workspaceId');
    if (legacyWorkspaceId) {
      navigate(`/workspaces/${legacyWorkspaceId}/issues`, { replace: true });
    }
  }, [isWorkspaceScope, navigate, searchParams]);

  const loadIssues = useCallback(async () => {
    setLoadError(null);
    setIsLoading(true);
    try {
      const data = await getIssues(workspaceId);
      setIssues(data);
    } catch (error) {
      setIssues([]);
      setLoadError(error instanceof Error ? error.message : 'Failed to load issues');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (!isWorkspaceScope) {
      setWorkspace(null);
      setWorkspaceError(null);
      void loadIssues();
      return;
    }

    let mounted = true;
    const run = async () => {
      setWorkspaceError(null);
      setIsLoading(true);
      try {
        const ws = await getWorkspace(workspaceId!);
        if (!mounted) {
          return;
        }
        setWorkspace(ws);
        const data = await getIssues(workspaceId);
        if (!mounted) {
          return;
        }
        setIssues(data);
        setProjectFilter(ws.title);
      } catch (error) {
        if (!mounted) {
          return;
        }
        setWorkspace(null);
        setIssues([]);
        setWorkspaceError(
          error instanceof Error ? error.message : 'Failed to load workspace',
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [isWorkspaceScope, workspaceId, loadIssues]);

  const assigneeOptions = useMemo(
    () => ['all', ...Array.from(new Set(issues.map((issue) => issue.assignee)))],
    [issues],
  );

  const projectOptions = useMemo(() => {
    if (isWorkspaceScope && workspace) {
      return ['all', workspace.title];
    }
    return ['all', ...Array.from(new Set(issues.map((issue) => issue.project)))];
  }, [issues, isWorkspaceScope, workspace]);

  const createProjectOptions = useMemo(() => {
    if (isWorkspaceScope && workspace) {
      return [workspace.title];
    }
    return projectOptions.filter((p) => p !== 'all');
  }, [isWorkspaceScope, workspace, projectOptions]);

  const visibleIssues = useMemo(() => {
    const filteredByTab =
      tab === 'mine'
        ? issues.filter((issue) => issue.assignee === 'Antonio Calderon')
        : issues;

    return filteredByTab
      .filter(
        (issue) =>
          isWorkspaceScope ||
          projectFilter === 'all' ||
          issue.project === projectFilter,
      )
      .filter(
        (issue) => assigneeFilter === 'all' || issue.assignee === assigneeFilter,
      )
      .filter((issue) => {
        const searchText = searchQuery.toLowerCase();
        return [issue.issueKey, issue.summary, issue.assignee, issue.project]
          .join(' ')
          .toLowerCase()
          .includes(searchText);
      });
  }, [issues, tab, projectFilter, assigneeFilter, searchQuery, isWorkspaceScope]);

  const issueStats = useMemo(
    () => ({
      total: visibleIssues.length,
      high: visibleIssues.filter((issue) => issue.priority === 'high').length,
      inProgress: visibleIssues.filter((issue) => issue.status === 'In Progress').length,
      done: visibleIssues.filter((issue) => issue.status === 'Done').length,
    }),
    [visibleIssues],
  );

  const handleProjectChange = (e: SelectChangeEvent) => {
    setProjectFilter(e.target.value);
  };

  const handleAssigneeChange = (e: SelectChangeEvent) => {
    setAssigneeFilter(e.target.value);
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleCloseModal = () => {
    if (isCreating) return;
    setOpenModal(false);
    setCreateError(null);
  };

  const handleNewIssue = async (issue: {
    issueKey: string;
    project: string;
    summary: string;
    assignee: string;
    priority: 'high' | 'medium' | 'low';
    status: string;
  }) => {
    const targetWorkspaceId =
      workspaceId ?? issues.find((item) => item.project === issue.project)?.workspaceId;
    if (!targetWorkspaceId) {
      setCreateError('Could not determine workspace for the selected project.');
      return;
    }

    setCreateError(null);
    setIsCreating(true);
    try {
      await createIssue({
        project: issue.project,
        workspaceId: targetWorkspaceId,
        summary: issue.summary,
        assignee: issue.assignee,
        priority: issue.priority,
        status: issue.status,
      });
      await loadIssues();
      setOpenModal(false);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Failed to create issue');
    } finally {
      setIsCreating(false);
    }
  };

  if (isWorkspaceScope && workspaceError) {
    return (
      <Box
        component="main"
        sx={{
          flex: 1,
          minHeight: '100vh',
          backgroundColor: 'background.default',
          px: { xs: 2, sm: 4 },
          py: 4,
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
          }}
        >
          Back to Workspaces
        </Button>
        <Alert severity="error">{workspaceError}</Alert>
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
        py: 4,
      }}
    >
      {isWorkspaceScope ? (
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/workspaces/${workspaceId}`)}
          sx={{
            textTransform: 'none',
            mb: 3,
            color: theme.palette.mode === 'dark' ? '#fff' : 'primary.main',
            fontWeight: 600,
            fontSize: 14,
            '&:hover': { bgcolor: 'rgba(95, 2, 41, 0.08)' },
          }}
        >
          Back to Workspace
        </Button>
      ) : null}

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 3, gap: 3 }}
      >
        <Box sx={{ maxWidth: 680 }}>
          <Typography
            sx={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700,
              fontSize: { xs: 28, sm: 32 },
              color: 'text.primary',
              mb: 1,
            }}
          >
            Issues
          </Typography>
          <Typography
            sx={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 14,
              color: 'text.secondary',
            }}
          >
            {isWorkspaceScope && workspace
              ? `Tasks for ${workspace.title}`
              : 'All tasks across every workspace'}
          </Typography>
        </Box>

        <Button
          onClick={() => {
            setCreateError(null);
            setOpenModal(true);
          }}
          variant="contained"
          disableElevation
          disabled={isWorkspaceScope && !workspace}
          sx={{
            bgcolor: 'primary.main',
            borderRadius: '5px',
            minHeight: 42,
            px: 3,
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: 14,
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': { bgcolor: 'primary.dark', boxShadow: 'none' },
          }}
        >
          + Create Issue
        </Button>
      </Stack>

      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            boxShadow: 'none',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '5px',
          },
        }}
        BackdropProps={{ sx: { backgroundColor: 'rgba(0, 0, 0, 0.55)' } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: 20,
            pb: 1,
          }}
        >
          Create Issue
          <IconButton onClick={handleCloseModal} size="small" disabled={isCreating} aria-label="Close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Typography
            sx={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 14,
              color: 'text.secondary',
              mb: 2,
            }}
          >
            {isWorkspaceScope
              ? 'Add a new task to this workspace.'
              : 'Add a new task to track work, assign ownership, and set priority.'}
          </Typography>
          {createError ? (
            <Alert severity="error" sx={{ mb: 2, boxShadow: 'none' }}>
              {createError}
            </Alert>
          ) : null}
          <NewIssue
            open={openModal}
            projectOptions={createProjectOptions}
            onSubmit={handleNewIssue}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
          <Button
            onClick={handleCloseModal}
            disabled={isCreating}
            sx={{
              fontFamily: 'Montserrat, sans-serif',
              textTransform: 'none',
              fontWeight: 600,
              color: 'text.primary',
              boxShadow: 'none',
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-issue-form"
            variant="contained"
            disableElevation
            disabled={isCreating}
            sx={{
              fontFamily: 'Montserrat, sans-serif',
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: 'primary.main',
              borderRadius: '5px',
              minWidth: 120,
              boxShadow: 'none',
              '&:hover': { bgcolor: 'primary.dark', boxShadow: 'none' },
            }}
          >
            {isCreating ? 'Creating...' : 'Create Issue'}
          </Button>
        </DialogActions>
      </Dialog>

      {loadError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {loadError}
        </Alert>
      ) : null}

      <IssuesTabs tab={tab} onTabChange={setTab} />

      <IssuesFilters
        searchQuery={searchQuery}
        projectFilter={projectFilter}
        assigneeFilter={assigneeFilter}
        projectOptions={projectOptions}
        assigneeOptions={assigneeOptions}
        onSearchChange={handleSearchChange}
        onProjectChange={handleProjectChange}
        onAssigneeChange={handleAssigneeChange}
        hideProjectFilter={isWorkspaceScope}
      />

      {isLoading ? (
        <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={24} sx={{ color: 'primary.main' }} />
        </Box>
      ) : (
        <IssueList issues={visibleIssues} />
      )}

      <IssuesSummaryCards stats={issueStats} />
    </Box>
  );
}

export default Issues;
