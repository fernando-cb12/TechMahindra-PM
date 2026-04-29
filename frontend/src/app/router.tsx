import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Settings from '../pages/Settings';
import Issues from '../pages/Issues';
import Workspaces from '../pages/Workspaces';
import Metrics from '../pages/Metrics';
import TaskBoardPage from '../components/workspaces/taskboard/TaskBoardPage';
import { ROUTES } from './routes';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to={ROUTES.login} replace /> },
  { path: ROUTES.login, element: <Login /> },
  {
    element: <MainLayout />,
    children: [
      { path: ROUTES.dashboard, element: <Dashboard /> },
      { path: ROUTES.workspaces, element: <Workspaces /> },
      { path: ROUTES.workspaceBoard, element: <TaskBoardPage /> },
      { path: ROUTES.issues, element: <Issues /> },
      { path: ROUTES.metrics, element: <Metrics /> },
      { path: ROUTES.settings, element: <Settings /> },
    ],
  },
]);
