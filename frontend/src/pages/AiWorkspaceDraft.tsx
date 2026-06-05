import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import {
  approveAiWorkspaceDraft,
  discardAiWorkspaceDraft,
  getAiWorkspaceDraft,
  type AiWorkspaceDraft as AiWorkspaceDraftType,
  type DraftTask,
} from '../services/aiWorkspaceService';
import { showAppNotification, showAppError } from '../components/shared/appNotifications';

const priorityOptions = ['low', 'medium', 'high', 'critical'] as const;
const statusOptions = ['todo', 'in_progress', 'review', 'done', 'blocked'] as const;

function AiWorkspaceDraft() {
  const { draftId } = useParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<AiWorkspaceDraftType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!draftId) {
      showAppNotification({ message: 'Draft not found', severity: 'error' });
      setLoading(false);
      return;
    }
    void getAiWorkspaceDraft(draftId)
      .then((payload) => {
        if (!cancelled) setDraft(payload);
      })
      .catch((err) => {
        if (!cancelled) showAppError(err, 'Could not load AI draft');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [draftId]);

  const totals = useMemo(() => {
    const boards = draft?.boards.length ?? 0;
    const groups = draft?.boards.reduce((sum, board) => sum + board.groups.length, 0) ?? 0;
    const tasks = draft?.boards.reduce(
      (sum, board) => sum + board.groups.reduce((groupSum, group) => groupSum + group.tasks.length, 0),
      0
    ) ?? 0;
    return { boards, groups, tasks };
  }, [draft]);

  const updateWorkspace = (field: keyof AiWorkspaceDraftType['workspace'], value: string) => {
    setDraft((current) => current ? {
      ...current,
      workspace: { ...current.workspace, [field]: value },
    } : current);
  };

  const updateBoard = (boardIndex: number, field: 'name' | 'description', value: string) => {
    setDraft((current) => current ? {
      ...current,
      boards: current.boards.map((board, index) => index === boardIndex ? { ...board, [field]: value } : board),
    } : current);
  };

  const updateGroup = (boardIndex: number, groupIndex: number, value: string) => {
    setDraft((current) => current ? {
      ...current,
      boards: current.boards.map((board, index) => index === boardIndex ? {
        ...board,
        groups: board.groups.map((group, nestedIndex) => nestedIndex === groupIndex ? { ...group, name: value } : group),
      } : board),
    } : current);
  };

  const updateTask = (
    boardIndex: number,
    groupIndex: number,
    taskIndex: number,
    field: keyof DraftTask,
    value: string
  ) => {
    setDraft((current) => current ? {
      ...current,
      boards: current.boards.map((board, index) => index === boardIndex ? {
        ...board,
        groups: board.groups.map((group, nestedIndex) => nestedIndex === groupIndex ? {
          ...group,
          tasks: group.tasks.map((task, taskNestedIndex) => taskNestedIndex === taskIndex
            ? { ...task, [field]: value || null }
            : task),
        } : group),
      } : board),
    } : current);
  };

  const removeBoard = (boardIndex: number) => {
    setDraft((current) => current ? {
      ...current,
      boards: current.boards.filter((_, index) => index !== boardIndex),
    } : current);
  };

  const removeGroup = (boardIndex: number, groupIndex: number) => {
    setDraft((current) => current ? {
      ...current,
      boards: current.boards.map((board, index) => index === boardIndex ? {
        ...board,
        groups: board.groups.filter((_, nestedIndex) => nestedIndex !== groupIndex),
      } : board),
    } : current);
  };

  const removeTask = (boardIndex: number, groupIndex: number, taskIndex: number) => {
    setDraft((current) => current ? {
      ...current,
      boards: current.boards.map((board, index) => index === boardIndex ? {
        ...board,
        groups: board.groups.map((group, nestedIndex) => nestedIndex === groupIndex ? {
          ...group,
          tasks: group.tasks.filter((_, taskNestedIndex) => taskNestedIndex !== taskIndex),
        } : group),
      } : board),
    } : current);
  };

  const handleApprove = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const response = await approveAiWorkspaceDraft(draft);
      window.dispatchEvent(new CustomEvent('workspace:created', { detail: { workspaceId: response.workspaceId } }));
      window.dispatchEvent(new CustomEvent('app:feedback', { detail: { message: 'AI workspace created' } }));
      navigate(response.firstBoardId
        ? `/workspaces/${response.workspaceId}/boards/${response.firstBoardId}`
        : `/workspaces/${response.workspaceId}`);
    } catch (err) {
      showAppError(err, 'Could not approve AI draft');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = async () => {
    if (draft?.id) {
      await discardAiWorkspaceDraft(draft.id).catch(() => undefined);
    }
    navigate('/workspaces');
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!draft) {
    return (
      <Box sx={{ minHeight: '100vh', p: 4, bgcolor: 'background.default' }}>
        <Typography sx={{ fontWeight: 700, fontSize: 24 }}>
          Draft not found
        </Typography>
        <Button onClick={() => navigate('/workspaces')} sx={{ mt: 2, textTransform: 'none' }}>
          Back to workspaces
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: { xs: 2, md: 4 } }}>
      <Stack spacing={3} sx={{ maxWidth: 1180, mx: 'auto' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: 26, md: 32 } }}>
              Review AI Draft
            </Typography>
            <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>
              {draft.sourceFileName || 'Imported PDF'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={`${totals.boards} boards`} />
            <Chip label={`${totals.groups} groups`} />
            <Chip label={`${totals.tasks} tasks`} />
          </Stack>
        </Stack>

        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Stack spacing={2}>
            <TextField
              label="Workspace title"
              value={draft.workspace.title}
              onChange={(event) => updateWorkspace('title', event.target.value)}
              fullWidth
            />
            <TextField
              label="Description"
              value={draft.workspace.description}
              onChange={(event) => updateWorkspace('description', event.target.value)}
              multiline
              minRows={3}
              fullWidth
            />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Due date"
                type="date"
                value={draft.workspace.dueDate ?? ''}
                onChange={(event) => updateWorkspace('dueDate', event.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Budget"
                value={draft.workspace.budgetLabel ?? ''}
                onChange={(event) => updateWorkspace('budgetLabel', event.target.value)}
                fullWidth
              />
            </Stack>
          </Stack>
        </Box>

        <Stack spacing={2}>
          {draft.boards.map((board, boardIndex) => (
            <Accordion
              key={`${board.name}-${boardIndex}`}
              defaultExpanded={boardIndex === 0}
              sx={{
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                overflow: 'hidden',
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%', pr: 1 }}>
                  <Typography sx={{ fontWeight: 800, flex: 1 }}>
                    {board.name || 'Untitled board'}
                  </Typography>
                  <Chip size="small" label={`${board.groups.length} groups`} />
                  <IconButton
                    aria-label="Remove board"
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeBoard(boardIndex);
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <TextField
                    label="Board name"
                    value={board.name}
                    onChange={(event) => updateBoard(boardIndex, 'name', event.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Board description"
                    value={board.description}
                    onChange={(event) => updateBoard(boardIndex, 'description', event.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                  {board.groups.map((group, groupIndex) => (
                    <Box
                      key={`${group.name}-${groupIndex}`}
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        border: 1,
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                      }}
                    >
                      <Stack spacing={2}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TextField
                            label="Group name"
                            value={group.name}
                            onChange={(event) => updateGroup(boardIndex, groupIndex, event.target.value)}
                            fullWidth
                          />
                          <IconButton aria-label="Remove group" onClick={() => removeGroup(boardIndex, groupIndex)}>
                            <DeleteOutlineIcon />
                          </IconButton>
                        </Stack>
                        {group.tasks.map((task, taskIndex) => (
                          <Box
                            key={`${task.name}-${taskIndex}`}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              bgcolor: 'background.paper',
                              border: 1,
                              borderColor: 'divider',
                            }}
                          >
                            <Stack spacing={1.5}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <TextField
                                  label="Task"
                                  value={task.name}
                                  onChange={(event) => updateTask(boardIndex, groupIndex, taskIndex, 'name', event.target.value)}
                                  fullWidth
                                />
                                <IconButton aria-label="Remove task" onClick={() => removeTask(boardIndex, groupIndex, taskIndex)}>
                                  <DeleteOutlineIcon />
                                </IconButton>
                              </Stack>
                              <TextField
                                label="Description"
                                value={task.description ?? ''}
                                onChange={(event) => updateTask(boardIndex, groupIndex, taskIndex, 'description', event.target.value)}
                                fullWidth
                                multiline
                                minRows={2}
                              />
                              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                                <TextField
                                  select
                                  label="Status"
                                  value={task.status}
                                  onChange={(event) => updateTask(boardIndex, groupIndex, taskIndex, 'status', event.target.value)}
                                  fullWidth
                                >
                                  {statusOptions.map((option) => <MenuItem key={option} value={option}>{option.replace('_', ' ')}</MenuItem>)}
                                </TextField>
                                <TextField
                                  select
                                  label="Priority"
                                  value={task.priority}
                                  onChange={(event) => updateTask(boardIndex, groupIndex, taskIndex, 'priority', event.target.value)}
                                  fullWidth
                                >
                                  {priorityOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                                </TextField>
                                <TextField
                                  label="Due date"
                                  type="date"
                                  value={task.dueDate ?? ''}
                                  onChange={(event) => updateTask(boardIndex, groupIndex, taskIndex, 'dueDate', event.target.value)}
                                  InputLabelProps={{ shrink: true }}
                                  fullWidth
                                />
                              </Stack>
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-end">
          <Button
            variant="outlined"
            startIcon={<CloseOutlinedIcon />}
            onClick={handleDiscard}
            disabled={saving}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Discard
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveOutlinedIcon />}
            onClick={handleApprove}
            disabled={saving || !draft.workspace.title.trim() || draft.boards.length === 0}
            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            Approve Workspace
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

export default AiWorkspaceDraft;
