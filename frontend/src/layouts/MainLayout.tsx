import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar, Stack, Typography } from '@mui/material';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { pathToActiveNavItem } from '../app/routes';
import { useAuth } from '../auth/useAuth';
import { ROUTES } from '../app/routes';
import type { Project } from '../components/layout/types';
import {
  createWorkspaceBoard,
  createWorkspaceProject,
  deleteWorkspaceProject,
  getAssignableWorkspaceUsers,
  getWorkspaceBoards,
  getWorkspaceProjects,
  restoreWorkspaceProject,
  updateWorkspaceProject,
  type AssignableUser,
  type CreateWorkspaceProjectPayload,
} from '../services/workspacesService';
import { deleteBoard, restoreBoard, updateBoard } from '../services/taskBoardService';
import { CreateWorkspaceModal } from '../components/workspaces/CreateWorkspaceModal';
import { AiWorkspaceImportDialog } from '../components/workspaces/AiWorkspaceImportDialog';
import { processAiWorkspacePdf, type AiWorkspaceMode } from '../services/aiWorkspaceService';

type DeleteNotice =
  | { type: 'workspace'; id: string; label: string }
  | { type: 'board'; workspaceId: string; boardId: string; label: string }
  | null;

function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, hasRoleAtLeast } = useAuth();
  const canManageWorkspaceActions = hasRoleAtLeast('TEAM_LEAD');
  const [sidebarProjects, setSidebarProjects] = useState<Project[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const [isCreateChoiceOpen, setIsCreateChoiceOpen] = useState(false);
  const [isAIUploadOpen, setIsAIUploadOpen] = useState(false);
  const [aiMode, setAiMode] = useState<AiWorkspaceMode>('EXTRACTION');
  const [aiSelectedFile, setAISelectedFile] = useState<File | null>(null);
  const [aiSelectedFileName, setAISelectedFileName] = useState<string | null>(null);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState<DeleteNotice>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const creatingBoardWorkspaceRef = useRef<string | null>(null);
  const boardCreateCooldownRef = useRef<Record<string, number>>({});
  const activeNavItem = pathToActiveNavItem(location.pathname);

  // Check if we are inside a workspace board to highlight the sidebar correctly
  const boardMatch = location.pathname.match(/\/workspaces\/([^/]+)\/boards\/([^/]+)/);
  const workspaceMatch = location.pathname.match(/\/workspaces\/([^/]+)/);
  const activeProject = boardMatch ? boardMatch[1] : workspaceMatch ? workspaceMatch[1] : undefined;
  const activeSubsection = boardMatch ? boardMatch[2] : undefined;

  const handleLogout = () => {
    logout();
    navigate(ROUTES.login, { replace: true });
  };

  const loadSidebarProjects = useCallback(async () => {
    try {
      const workspaces = await getWorkspaceProjects();
      const projects = await Promise.all(
        workspaces.map(async (workspace) => {
          const boards = await getWorkspaceBoards(workspace.id);
          return {
            id: workspace.id,
            label: workspace.title,
            subsections: boards.map((board) => ({
              id: board.id,
              label: board.name,
            })),
          };
        })
      );
      setSidebarProjects(projects);
    } catch (error) {
      console.error('Failed to load sidebar workspaces', error);
      setSidebarProjects([]);
    }
  }, []);

  useEffect(() => {
    void loadSidebarProjects();
  }, [loadSidebarProjects]);

  useEffect(() => {
    if (!isCreateWorkspaceOpen || !hasRoleAtLeast('TEAM_LEAD')) return;
    let cancelled = false;
    void getAssignableWorkspaceUsers()
      .then((users) => {
        if (!cancelled) setAssignableUsers(users);
      })
      .catch(() => {
        if (!cancelled) setAssignableUsers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isCreateWorkspaceOpen, hasRoleAtLeast]);

  useEffect(() => {
    const handleBoardRenamed = (event: Event) => {
      const detail = (event as CustomEvent<{ workspaceId: string; boardId: string; name: string }>).detail;
      if (!detail?.workspaceId || !detail.boardId || !detail.name) return;
      setSidebarProjects((projects) => projects.map((project) => (
        project.id === detail.workspaceId
          ? {
              ...project,
              subsections: project.subsections.map((board) => (
                board.id === detail.boardId ? { ...board, label: detail.name } : board
              )),
            }
          : project
      )));
    };

    window.addEventListener('taskboard:board-renamed', handleBoardRenamed);
    return () => window.removeEventListener('taskboard:board-renamed', handleBoardRenamed);
  }, []);

  useEffect(() => {
    const refresh = () => void loadSidebarProjects();
    const showFeedback = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      setFeedback(detail?.message || 'Done');
    };
    window.addEventListener('workspace:created', refresh);
    window.addEventListener('workspace:renamed', refresh);
    window.addEventListener('workspace:deleted', refresh);
    window.addEventListener('workspace:restored', refresh);
    window.addEventListener('board:created', refresh);
    window.addEventListener('board:deleted', refresh);
    window.addEventListener('board:restored', refresh);
    window.addEventListener('app:feedback', showFeedback);
    return () => {
      window.removeEventListener('workspace:created', refresh);
      window.removeEventListener('workspace:renamed', refresh);
      window.removeEventListener('workspace:deleted', refresh);
      window.removeEventListener('workspace:restored', refresh);
      window.removeEventListener('board:created', refresh);
      window.removeEventListener('board:deleted', refresh);
      window.removeEventListener('board:restored', refresh);
      window.removeEventListener('app:feedback', showFeedback);
    };
  }, [loadSidebarProjects]);

  const copyLink = async (path: string) => {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setFeedback('Link copied');
    } catch {
      setFeedback(url);
    }
  };

  const handleCreateWorkspace = async (payload: CreateWorkspaceProjectPayload) => {
    if (!canManageWorkspaceActions) return;
    try {
      const workspace = await createWorkspaceProject(payload);
      setIsCreateWorkspaceOpen(false);
      setAISelectedFileName(null);
      window.dispatchEvent(new CustomEvent('workspace:created', { detail: { workspaceId: workspace.id } }));
      setFeedback('Workspace created');
      void loadSidebarProjects();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Failed to create workspace');
    }
  };

  const handleCreateBoard = async (workspaceId: string) => {
    if (!canManageWorkspaceActions) return;
    const now = Date.now();
    const lastCreateAt = boardCreateCooldownRef.current[workspaceId] ?? 0;
    if (creatingBoardWorkspaceRef.current === workspaceId || now - lastCreateAt < 2000) return;
    boardCreateCooldownRef.current[workspaceId] = now;
    creatingBoardWorkspaceRef.current = workspaceId;
    try {
      const workspace = sidebarProjects.find((project) => project.id === workspaceId);
      const existingNames = new Set(workspace?.subsections.map((board) => board.label.trim().toLowerCase()) ?? []);
      let boardName = 'Task Board';
      let suffix = 2;
      while (existingNames.has(boardName.toLowerCase())) {
        boardName = `Task Board ${suffix}`;
        suffix += 1;
      }
      const board = await createWorkspaceBoard(workspaceId, { name: boardName });
      window.dispatchEvent(new CustomEvent('board:created', { detail: { workspaceId, boardId: board.id } }));
      await loadSidebarProjects();
      navigate(`/workspaces/${workspaceId}/boards/${board.id}`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Failed to create board');
    } finally {
      creatingBoardWorkspaceRef.current = null;
    }
  };

  const handleManualCreate = () => {
    if (!canManageWorkspaceActions) return;
    setIsCreateChoiceOpen(false);
    setIsCreateWorkspaceOpen(true);
  };

  const handleAISelect = () => {
    if (!canManageWorkspaceActions) return;
    setIsCreateChoiceOpen(false);
    setIsAIUploadOpen(true);
  };

  const handleAIFileChange = (file: File | null) => {
    setAISelectedFile(file);
    setAISelectedFileName(file?.name ?? null);
  };

  const handleAIContinue = async () => {
    if (!canManageWorkspaceActions) return;
    if (!aiSelectedFile || isAIProcessing) return;
    setIsAIProcessing(true);
    try {
      const draft = await processAiWorkspacePdf(aiSelectedFile, aiMode);
      setIsAIUploadOpen(false);
      setAISelectedFile(null);
      setAISelectedFileName(null);
      navigate(`/workspaces/ai-draft/${draft.id}`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Failed to process PDF with AI');
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

  const handleWorkspaceRename = async (workspaceId: string, name: string) => {
    if (!canManageWorkspaceActions) return;
    await updateWorkspaceProject(workspaceId, { title: name });
    window.dispatchEvent(new CustomEvent('workspace:renamed', { detail: { workspaceId, name } }));
    setSidebarProjects((projects) => projects.map((project) => project.id === workspaceId ? { ...project, label: name } : project));
  };

  const handleBoardRename = async (workspaceId: string, boardId: string, name: string) => {
    if (!canManageWorkspaceActions) return;
    const payload = await updateBoard(workspaceId, boardId, { name });
    window.dispatchEvent(new CustomEvent('taskboard:board-renamed', {
      detail: { workspaceId, boardId, name: payload.boardConfig.boardName ?? name },
    }));
  };

  const handleWorkspaceDelete = async (workspaceId: string) => {
    if (!canManageWorkspaceActions) return;
    const workspace = sidebarProjects.find((project) => project.id === workspaceId);
    await deleteWorkspaceProject(workspaceId);
    setDeleteNotice({ type: 'workspace', id: workspaceId, label: workspace?.label ?? 'Workspace' });
    setSidebarProjects((projects) => projects.filter((project) => project.id !== workspaceId));
    window.dispatchEvent(new CustomEvent('workspace:deleted', { detail: { workspaceId } }));
    if (activeProject === workspaceId) navigate('/workspaces');
  };

  const handleBoardDelete = async (workspaceId: string, boardId: string) => {
    if (!canManageWorkspaceActions) return;
    const workspace = sidebarProjects.find((project) => project.id === workspaceId);
    const board = workspace?.subsections.find((item) => item.id === boardId);
    await deleteBoard(workspaceId, boardId);
    setDeleteNotice({ type: 'board', workspaceId, boardId, label: board?.label ?? 'Board' });
    setSidebarProjects((projects) => projects.map((project) => (
      project.id === workspaceId
        ? { ...project, subsections: project.subsections.filter((item) => item.id !== boardId) }
        : project
    )));
    window.dispatchEvent(new CustomEvent('board:deleted', { detail: { workspaceId, boardId } }));
    if (activeProject === workspaceId && activeSubsection === boardId) navigate(`/workspaces/${workspaceId}`);
  };

  const undoDelete = async () => {
    if (!deleteNotice) return;
    if (deleteNotice.type === 'workspace') {
      await restoreWorkspaceProject(deleteNotice.id);
      window.dispatchEvent(new CustomEvent('workspace:restored', { detail: { workspaceId: deleteNotice.id } }));
    } else {
      await restoreBoard(deleteNotice.workspaceId, deleteNotice.boardId);
      window.dispatchEvent(new CustomEvent('board:restored', { detail: { workspaceId: deleteNotice.workspaceId, boardId: deleteNotice.boardId } }));
    }
    setDeleteNotice(null);
    void loadSidebarProjects();
  };

  return (
  <Box sx={{ display: 'flex', minHeight: '100vh' }}>
    <Sidebar
      activeNavItem={activeNavItem}
      activeProject={activeProject}
      activeSubsection={activeSubsection}
      onSubsectionClick={(projectId, subId) => {
        navigate(`/workspaces/${projectId}/boards/${subId}`);
      }}
      onWorkspaceOpen={(projectId) => navigate(`/workspaces/${projectId}`)}
      onWorkspaceCreateBoard={canManageWorkspaceActions ? handleCreateBoard : undefined}
      onWorkspaceCreateWorkspace={canManageWorkspaceActions ? () => setIsCreateChoiceOpen(true) : undefined}
      onWorkspaceRename={canManageWorkspaceActions ? handleWorkspaceRename : undefined}
      onWorkspaceDelete={canManageWorkspaceActions ? handleWorkspaceDelete : undefined}
      onBoardRename={canManageWorkspaceActions ? handleBoardRename : undefined}
      onBoardDelete={canManageWorkspaceActions ? handleBoardDelete : undefined}
      onCopyLink={copyLink}
      onLogout={handleLogout}
      projects={sidebarProjects}
    />
    <Box
      component="main"
      sx={{ flex: 1, ml: '220px', minHeight: '100vh', overflowX: 'hidden' }}
    >
      <Outlet />
    </Box>
    <CreateWorkspaceModal
      open={canManageWorkspaceActions && isCreateWorkspaceOpen}
      onClose={() => {
        setIsCreateWorkspaceOpen(false);
        setAISelectedFile(null);
        setAISelectedFileName(null);
      }}
      onSave={handleCreateWorkspace}
      assignableUsers={assignableUsers}
      aiImportFileName={aiSelectedFileName ?? undefined}
    />
    <Dialog
      open={canManageWorkspaceActions && isCreateChoiceOpen}
      onClose={() => setIsCreateChoiceOpen(false)}
      fullWidth
      maxWidth="sm"
      BackdropProps={{ sx: { backgroundColor: 'rgba(0, 0, 0, 0.55)' } }}
    >
      <DialogTitle sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 20 }}>
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
        <Button onClick={() => setIsCreateChoiceOpen(false)} sx={{ fontFamily: 'Montserrat, sans-serif', textTransform: 'none', color: 'text.primary' }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
    <AiWorkspaceImportDialog
      open={canManageWorkspaceActions && isAIUploadOpen}
      mode={aiMode}
      fileName={aiSelectedFileName}
      processing={isAIProcessing}
      onModeChange={setAiMode}
      onFileChange={handleAIFileChange}
      onClose={handleAIUploadClose}
      onContinue={handleAIContinue}
    />
    <Snackbar
      open={Boolean(deleteNotice)}
      autoHideDuration={6000}
      onClose={() => setDeleteNotice(null)}
      message={deleteNotice ? `${deleteNotice.label} deleted` : ''}
      action={<Button size="small" onClick={undoDelete} sx={{ color: 'common.white', fontWeight: 700 }}>Undo</Button>}
    />
    <Snackbar
      open={Boolean(feedback)}
      autoHideDuration={2500}
      onClose={() => setFeedback(null)}
      message={feedback ?? ''}
    />
  </Box>
  );  
}

export default MainLayout;
