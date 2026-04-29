// ─── TaskDetailPanel — right slide-in drawer for task details (Section 2) ───

import { Box, Drawer, IconButton, Typography, Tabs, Tab, TextField, Button, Avatar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTaskBoard } from '../TaskBoardContext';
import { useState } from 'react';
import type { TaskUpdate } from '../types';

function UpdatesTab({ taskId }: { taskId: string }) {
  const { tasks, users, updateTask } = useTaskBoard();
  const task = tasks[taskId];
  const [newUpdate, setNewUpdate] = useState('');

  if (!task) return null;

  const handlePost = () => {
    if (!newUpdate.trim()) return;
    const upd: TaskUpdate = {
      id: `upd_${Date.now()}`,
      taskId,
      authorId: 'u1', // Hardcoded to active user 'u1' for now
      content: newUpdate,
      createdAt: new Date().toISOString(),
    };
    updateTask(taskId, { updates: [...task.updates, upd] });
    setNewUpdate('');
  };

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Input area */}
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, mb: 4, bgcolor: 'background.paper' }}>
        <TextField
          multiline
          minRows={3}
          placeholder="Write an update... Use @ to mention someone."
          value={newUpdate}
          onChange={(e) => setNewUpdate(e.target.value)}
          variant="standard"
          InputProps={{ disableUnderline: true, sx: { fontSize: 14 } }}
          fullWidth
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button variant="contained" size="small" onClick={handlePost} sx={{ textTransform: 'none' }}>
            Update
          </Button>
        </Box>
      </Box>

      {/* Feed */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {[...task.updates].reverse().map((upd) => {
          const author = users[upd.authorId];
          const date = new Date(upd.createdAt).toLocaleString([], {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          });
          return (
            <Box key={upd.id} sx={{ display: 'flex', gap: 2, mb: 4 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13 }}>
                {author?.initials || '?'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{author?.name || 'Unknown'}</Typography>
                  <Typography sx={{ color: 'text.disabled', fontSize: 12 }}>{date}</Typography>
                </Box>
                <Typography sx={{ fontSize: 14, whiteSpace: 'pre-wrap', color: 'text.secondary' }}>
                  {upd.content}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function FilesTab() {
  return (
    <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', pt: 8 }}>
      <Typography>Files and attachments coming soon.</Typography>
    </Box>
  );
}

function ActivityTab() {
  return (
    <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', pt: 8 }}>
      <Typography>Activity log coming soon.</Typography>
    </Box>
  );
}

export default function TaskDetailPanel() {
  const { panel, closePanel, setPanelTab, tasks } = useTaskBoard();
  const task = panel.taskId ? tasks[panel.taskId] : null;

  return (
    <Drawer
      anchor="right"
      open={panel.isOpen}
      onClose={closePanel}
      hideBackdrop
      elevation={4}
      PaperProps={{
        sx: {
          width: 500,
          borderLeft: '1px solid',
          borderColor: 'divider',
          boxShadow: '-4px 0 16px rgba(0,0,0,0.05)',
        },
      }}
    >
      {task && (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ p: 3, pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, fontSize: 24, flex: 1, pr: 2 }}>
                {task.name}
              </Typography>
              <IconButton onClick={closePanel} size="small" sx={{ ml: 'auto' }}>
                <CloseIcon />
              </IconButton>
            </Box>
            
            <Tabs
              value={panel.activeTab}
              onChange={(_, val) => setPanelTab(val)}
              sx={{ minHeight: 36 }}
            >
              <Tab label="Updates" value="updates" sx={{ textTransform: 'none', minHeight: 36, py: 0 }} />
              <Tab label="Files" value="files" sx={{ textTransform: 'none', minHeight: 36, py: 0 }} />
              <Tab label="Activity Log" value="activity" sx={{ textTransform: 'none', minHeight: 36, py: 0 }} />
            </Tabs>
          </Box>
          <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />

          {/* Content */}
          <Box sx={{ flex: 1, overflowY: 'hidden' }}>
            {panel.activeTab === 'updates' && <UpdatesTab taskId={task.id} />}
            {panel.activeTab === 'files' && <FilesTab />}
            {panel.activeTab === 'activity' && <ActivityTab />}
          </Box>
        </Box>
      )}
    </Drawer>
  );
}
