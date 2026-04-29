// ─── TaskBoardPage — top level layout connecting everything ───

import { Box, Typography, Button, Tabs, Tab } from '@mui/material';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import TableChartIcon from '@mui/icons-material/TableChart';
import InsertChartIcon from '@mui/icons-material/InsertChart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useParams } from 'react-router-dom';

import { TaskBoardProvider, useTaskBoard } from './TaskBoardContext';
import MainTableView from './table/MainTableView';
import ChartView from './chart/ChartView';
import CalendarView from './calendar/CalendarView';
import TaskDetailPanel from './panel/TaskDetailPanel';
import type { BoardView } from './types';

// The actual content inside the provider
function TaskBoardContent() {
  const { boardConfig, activeView, setActiveView } = useTaskBoard();
  
  // Format the board title (e.g., frontend -> Frontend Design)
  const boardTitle = boardConfig.boardName || 'Task Board';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      
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
            label="Charts" 
            value="chart" 
            sx={{ textTransform: 'none', minHeight: 40, py: 0, fontWeight: 600 }} 
          />
          <Tab 
            icon={<CalendarMonthIcon sx={{ fontSize: 18 }} />} 
            iconPosition="start" 
            label="Calendar" 
            value="calendar" 
            sx={{ textTransform: 'none', minHeight: 40, py: 0, fontWeight: 600 }} 
          />
        </Tabs>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: activeView === 'table' ? 4 : 2, py: activeView === 'table' ? 0 : 2 }}>
        {/* We keep all views mounted (or just table) to preserve scroll if desired, 
            but standard is conditional rendering. Let's do conditional rendering for now 
            except for Table which might be heavy to re-mount. */}
        <Box sx={{ display: activeView === 'table' ? 'block' : 'none', height: '100%' }}>
          <MainTableView />
        </Box>
        
        {activeView === 'chart' && <ChartView />}
        {activeView === 'calendar' && <CalendarView />}
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
      <TaskBoardProvider workspaceId={`${workspaceId}_${boardId}`}>
        <TaskBoardContent />
      </TaskBoardProvider>
    </Box>
  );
}
