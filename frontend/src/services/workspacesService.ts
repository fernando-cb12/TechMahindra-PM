import type { WorkspaceProjectCardData } from '../components/workspaces/WorkspaceProjectCard';
import loginBg from '../assets/loginbg.png';

const workspaceProjectsMock: WorkspaceProjectCardData[] = [
  {
    id: 'magenta',
    title: 'Magenta',
    description: 'Development of new API endpoints and database optimization',
    imageUrl:
      'https://mikeelectronica.com/cdn/shop/articles/B-MK_02_2121x.progressive.jpg?v=1607535378',
    members: ['Camou Bejarano', 'Antonio Calderon', 'Marco Ibarra'],
    currentProgress: 42,
    estimatedProgress: 40,
    dueDate: '2026-06-15',
    budgetLabel: '30k',
    status: 'in-progress',
  },
  {
    id: 'blue',
    title: 'Blue',
    description: 'Complete security review and vulnerability assessment',
    imageUrl:
      'https://www.santanderopenacademy.com/content/dam/becasmicrosites/01-soa-blog/avances-en-la-tecnologia.jpg',
    members: ['Luis Carlos', 'Antonio Calderon'],
    currentProgress: 15,
    estimatedProgress: 20,
    dueDate: '2026-06-25',
    budgetLabel: '20k',
    status: 'planning',
  },
  {
    id: 'green',
    title: 'Green',
    description: 'Development of new API endpoints and database optimization',
    imageUrl:
      'https://i.pinimg.com/564x/32/1e/77/321e771354614cab0985ea18983d4e82.jpg',
    members: ['Camou Bejarano', 'Marco Ibarra'],
    currentProgress: 100,
    estimatedProgress: 100,
    dueDate: '2026-06-15',
    budgetLabel: '30k',
    status: 'completed',
  },
  {
    id: 'nose',
    title: 'Nosexd',
    description: 'Prueba1',
    imageUrl:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTscILWZbpFWPfa5gBlr54NQqL8MFa1c_eEYw&s',
    members: ['Camou Bejarano', 'Marco Ibarra'],
    currentProgress: 100,
    estimatedProgress: 100,
    dueDate: '2026-06-15',
    budgetLabel: '30k',
    status: 'completed',
  },
  {
    id: 'waza',
    title: 'Waza777',
    description: 'Prueba2',
    imageUrl:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZzxFDqDUEmKb85BiPyvdtZEwI1mrx-LHK8w&s',
    members: ['Camou Bejarano', 'Marco Ibarra'],
    currentProgress: 100,
    estimatedProgress: 100,
    dueDate: '2026-06-15',
    budgetLabel: '30k',
    status: 'completed',
  },
];

export async function getWorkspaceProjects(): Promise<WorkspaceProjectCardData[]> {
  // TODO: Replace this mock response with API call once backend endpoint is available.
  // Example: return (await apiClient.get('/workspaces')).data;
  return Promise.resolve([...workspaceProjectsMock]);
}

export async function createWorkspaceProject(
  workspace: Omit<WorkspaceProjectCardData, 'id' | 'currentProgress' | 'estimatedProgress'>
): Promise<WorkspaceProjectCardData> {
  // TODO: Replace with real API call when backend is available.
  // Example: return (await apiClient.post('/workspaces', workspace)).data;
  const newId = `workspace_${Date.now()}`;
  const newProject: WorkspaceProjectCardData = {
    id: newId,
    title: workspace.title,
    description: workspace.description,
    imageUrl: workspace.imageUrl || loginBg,
    members: workspace.members,
    currentProgress: 0,
    estimatedProgress: 0,
    dueDate: workspace.dueDate,
    budgetLabel: workspace.budgetLabel,
    status: workspace.status,
  };
  workspaceProjectsMock.unshift(newProject);
  return Promise.resolve(newProject);
}

