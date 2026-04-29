import type { WorkspaceProjectCardData } from '../components/workspaces/WorkspaceProjectCard';

const workspaceProjectsMock: WorkspaceProjectCardData[] = [
  {
    id: 'magenta',
    title: 'Magenta',
    description: 'Development of new API endpoints and database optimization',
    imageUrl:
      'https://www.figma.com/api/mcp/asset/1c1a46bf-f7f8-4fc7-b4ee-e7a5f4e41535',
    members: ['C', 'A', 'M'],
    currentProgress: 42,
    estimatedProgress: 40,
    dueDate: 'Jun 15, 2026',
    budgetLabel: '30k',
    status: 'in-progress',
  },
  {
    id: 'blue',
    title: 'Blue',
    description: 'Complete security review and vulnerability assessment',
    imageUrl:
      'https://www.figma.com/api/mcp/asset/d5c182b2-7194-40ea-a267-d3cecb667a5e',
    members: ['LC', 'A'],
    currentProgress: 15,
    estimatedProgress: 20,
    dueDate: 'Jun 25, 2026',
    budgetLabel: '20k',
    status: 'planning',
  },
  {
    id: 'green',
    title: 'Green',
    description: 'Development of new API endpoints and database optimization',
    imageUrl:
      'https://www.figma.com/api/mcp/asset/a962f8cc-0fd7-45d7-82cd-b2640e97bf6c',
    members: ['C', 'M'],
    currentProgress: 100,
    estimatedProgress: 100,
    dueDate: 'Jun 15, 2026',
    budgetLabel: '30k',
    status: 'completed',
  },
  {
    id: 'nose',
    title: 'Nosexd',
    description: 'Prueba1',
    imageUrl:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTscILWZbpFWPfa5gBlr54NQqL8MFa1c_eEYw&s',
    members: ['C', 'M'],
    currentProgress: 100,
    estimatedProgress: 100,
    dueDate: 'Jun 15, 2026',
    budgetLabel: '30k',
    status: 'completed',
  },
  {
    id: 'waza',
    title: 'Waza777',
    description: 'Prueba2',
    imageUrl:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZzxFDqDUEmKb85BiPyvdtZEwI1mrx-LHK8w&s',
    members: ['C', 'M'],
    currentProgress: 100,
    estimatedProgress: 100,
    dueDate: 'Jun 15, 2026',
    budgetLabel: '30k',
    status: 'completed',
  },
];

export async function getWorkspaceProjects(): Promise<WorkspaceProjectCardData[]> {
  // TODO: Replace this mock response with API call once backend endpoint is available.
  // Example: return (await apiClient.get('/workspaces')).data;
  return Promise.resolve(workspaceProjectsMock);
}
