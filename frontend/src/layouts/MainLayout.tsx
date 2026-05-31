import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { pathToActiveNavItem } from '../app/routes';
import { useAuth } from '../auth/useAuth';
import { ROUTES } from '../app/routes';
import type { Project } from '../components/layout/types';
import { getWorkspaceBoards, getWorkspaceProjects } from '../services/workspacesService';

function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [sidebarProjects, setSidebarProjects] = useState<Project[]>([]);
  const activeNavItem = pathToActiveNavItem(location.pathname);

  // Check if we are inside a workspace board to highlight the sidebar correctly
  const boardMatch = location.pathname.match(/\/workspaces\/([^/]+)\/boards\/([^/]+)/);
  const activeProject = boardMatch ? boardMatch[1] : undefined;
  const activeSubsection = boardMatch ? boardMatch[2] : undefined;

  const handleLogout = () => {
    logout();
    navigate(ROUTES.login, { replace: true });
  };

  useEffect(() => {
    let cancelled = false;

    async function loadSidebarProjects() {
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
        if (!cancelled) {
          setSidebarProjects(projects);
        }
      } catch (error) {
        console.error('Failed to load sidebar workspaces', error);
        if (!cancelled) {
          setSidebarProjects([]);
        }
      }
    }

    void loadSidebarProjects();
    return () => {
      cancelled = true;
    };
  }, []);

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

  return (
  <Box sx={{ display: 'flex', minHeight: '100vh' }}>
    <Sidebar
      activeNavItem={activeNavItem}
      activeProject={activeProject}
      activeSubsection={activeSubsection}
      onSubsectionClick={(projectId, subId) => {
        navigate(`/workspaces/${projectId}/boards/${subId}`);
      }}
      onLogout={handleLogout}
      projects={sidebarProjects}
    />
    <Box
      component="main"
      sx={{ flex: 1, ml: '220px', minHeight: '100vh', overflowX: 'hidden' }}
    >
      <Outlet />
    </Box>
  </Box>
  );  
}

export default MainLayout;
