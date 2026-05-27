import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
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
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { IssueCardProps } from '../components/issue/types';

function Issues() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [issues, setIssues] = useState<IssueCardProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<'all' | 'mine'>('mine');
  const [searchParams] = useSearchParams();
  const projectFromParam = searchParams.get('project');
  const workspaceIdFromParam = searchParams.get('workspaceId');
  const [projectFilter, setProjectFilter] = useState<string>(projectFromParam ?? 'all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoadError(null);
      try {
        const data = await getIssues();
        setIssues(data);
      } catch (error) {
        setIssues([]);
        setLoadError(error instanceof Error ? error.message : 'Failed to load issues');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const assigneeOptions = useMemo(
    () => ['all', ...Array.from(new Set(issues.map((issue) => issue.assignee)))],
    [issues]
  );

  const projectOptions = useMemo(
    () => ['all', ...Array.from(new Set(issues.map((issue) => issue.project)))],
    [issues]
  );

  const issueStats = useMemo(
    () => ({
      total: issues.length,
      high: issues.filter((issue) => issue.priority === 'high').length,
      inProgress: issues.filter((issue) => issue.status === 'In Progress').length,
      done: issues.filter((issue) => issue.status === 'Done').length,
    }),
    [issues]
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
    setCreateError(null);
    setIsCreating(true);
    try {
      await createIssue({
        project: issue.project,
        summary: issue.summary,
        assignee: issue.assignee,
        priority: issue.priority,
        status: issue.status,
      });
      const data = await getIssues();
      setIssues(data);
      setOpenModal(false);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Failed to create issue');
    } finally {
      setIsCreating(false);
    }
  };

  const visibleIssues = useMemo(() => {
    const filteredByTab =
      tab === 'mine'
        ? issues.filter((issue) => issue.assignee === 'Antonio Calderon')
        : issues;

    return filteredByTab
      .filter(
        (issue) =>
          projectFilter === 'all' || issue.project === projectFilter
      )
      .filter(
        (issue) =>
          assigneeFilter === 'all' || issue.assignee === assigneeFilter
      )
      .filter((issue) => {
        const searchText = searchQuery.toLowerCase();
        return [issue.issueKey, issue.summary, issue.assignee, issue.project]
          .join(' ')
          .toLowerCase()
          .includes(searchText);
      });
  }, [issues, tab, projectFilter, assigneeFilter, searchQuery]);

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
        onClick={() => navigate(workspaceIdFromParam ? `/workspaces/${workspaceIdFromParam}` : '/workspaces')}
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
        </Box>

        <Button
          onClick={() => {
            setCreateError(null);
            setOpenModal(true);
          }}
          variant="contained"
          disableElevation
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
            Add a new issue to track work, assign ownership, and set priority.
          </Typography>
          {createError ? (
            <Alert severity="error" sx={{ mb: 2, boxShadow: 'none' }}>
              {createError}
            </Alert>
          ) : null}
          <NewIssue
            open={openModal}
            projectOptions={projectOptions.filter((p) => p !== 'all')}
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
        hideProjectFilter={Boolean(projectFromParam)}
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
