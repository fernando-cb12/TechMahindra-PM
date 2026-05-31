// ─── TaskBoardPage — top level layout connecting everything ───

import { Alert, Box, Typography, Button, Tabs, Tab, IconButton, Popover, LinearProgress } from '@mui/material';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import TableChartIcon from '@mui/icons-material/TableChart';
import InsertChartIcon from '@mui/icons-material/InsertChart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import AddIcon from '@mui/icons-material/Add';
import { useParams } from 'react-router-dom';

import { TaskBoardProvider } from './TaskBoardContext';
import { useTaskBoard } from './useTaskBoard';
import MainTableView from './table/MainTableView';
import ChartView from './chart/ChartView';
import CalendarView from './calendar/CalendarView';
import KanbanView from './kanban/KanbanView';
import TaskDetailPanel from './panel/TaskDetailPanel';
import type { BoardView } from './types';
import { useState } from 'react';

// The actual content inside the provider
function TaskBoardContent() {
  const { boardConfig, activeView, setActiveView, isLoading, error } = useTaskBoard();
  const [addViewAnchor, setAddViewAnchor] = useState<HTMLButtonElement | null>(null);
  
  // Format the board title (e.g., frontend -> Frontend Design)
  const boardTitle = boardConfig.boardName || 'Task Board';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {isLoading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }} />}
      
      {/* Header */}
      <Box sx={{ px: 4, py: 3, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {boardTitle}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<PersonAddAlt1Icon />}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Invite / 1
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tabs
            value={activeView}
            onChange={(_, val: BoardView) => setActiveView(val)}
            sx={{ minHeight: 40 }}
          >
            <Tab 
              icon={<TableChartIcon sx={{ fontSize: 18 }} />} 
              iconPosition="start" 
              label="Main Table" 
              value="table" 
              sx={{ textTransform: 'none', minHeight: 40, py: 0, fontWeight: 600 }} 
            />
            <Tab 
              icon={<InsertChartIcon sx={{ fontSize: 18 }} />} 
              iconPosition="start" 
              label="Insights" 
              value="insights" 
              sx={{ textTransform: 'none', minHeight: 40, py: 0, fontWeight: 600 }} 
            />
            <Tab 
              icon={<CalendarMonthIcon sx={{ fontSize: 18 }} />} 
              iconPosition="start" 
              label="Calendar" 
              value="calendar" 
              sx={{ textTransform: 'none', minHeight: 40, py: 0, fontWeight: 600 }} 
            />
            <Tab
              icon={<ViewKanbanIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label="Kanban"
              value="kanban"
              sx={{ textTransform: 'none', minHeight: 40, py: 0, fontWeight: 600 }}
            />
          </Tabs>

          <IconButton
            size="small"
            onClick={(e) => setAddViewAnchor(e.currentTarget)}
            sx={{
              ml: 1,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              width: 32,
              height: 32,
              bgcolor: 'background.paper',
            }}
            title="Add New View"
          >
            <AddIcon fontSize="small" />
          </IconButton>

          <Popover
            open={Boolean(addViewAnchor)}
            anchorEl={addViewAnchor}
            onClose={() => setAddViewAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            slotProps={{ paper: { sx: { mt: 0.5, p: 2, borderRadius: 2, minWidth: 200 } } }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: 14 }}>
              Add New View
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 12, mt: 0.5 }}>
              Custom view templates coming soon.
            </Typography>
          </Popover>
        </Box>
      </Box>


      {/* Main Content Area */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: activeView === 'table' ? 4 : 2, py: activeView === 'table' ? 0 : 2 }}>
        {error && (
          <Alert severity="warning" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}
        {/* We keep all views mounted (or just table) to preserve scroll if desired, 
            but standard is conditional rendering. Let's do conditional rendering for now 
            except for Table which might be heavy to re-mount. */}
        <Box sx={{ display: activeView === 'table' ? 'block' : 'none', height: '100%' }}>
          <MainTableView />
        </Box>
        
        {activeView === 'insights' && <ChartView />}
        {activeView === 'calendar' && <CalendarView />}
        {activeView === 'kanban' && <KanbanView />}
      </Box>

      {/* Slide-in Panel */}
      <TaskDetailPanel />
    </Box>
  );
}

// Wrapper to provide Context
export default function TaskBoardPage() {
  const { workspaceId = 'magenta', boardId = 'frontend' } = useParams();

  return (
    <Box sx={{ flex: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <TaskBoardProvider workspaceId={workspaceId} boardId={boardId}>
        <TaskBoardContent />
      </TaskBoardProvider>
    </Box>
  );
}
