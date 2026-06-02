// ─── TaskDetailPanel — right slide-in drawer for task details & attachments (Section 11/12 of spec) ───

import {
  Box,
  Drawer,
  IconButton,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Avatar,
  Chip,
  Popover,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import HistoryIcon from '@mui/icons-material/History';
import { useTaskBoard } from '../useTaskBoard';
import { useState, useRef, useMemo, useEffect } from 'react';
import type { TaskUpdate, FileAttachment, User, TaskActivity } from '../types';
import { useParams } from 'react-router-dom';
import { uploadTaskUpdateFile } from '../../../../services/taskBoardService';
import { useAuth } from '../../../../auth/useAuth';
import { showAppNotification } from '../../../shared/appNotifications';

// Format file size in KB or MB
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Helper to determine file icon depending on MIME type
function getFileIcon(type: string) {
  if (type.startsWith('image/')) return <ImageIcon color="primary" />;
  if (type.includes('pdf')) return <PictureAsPdfIcon color="error" />;
  return <InsertDriveFileIcon color="action" />;
}

// ─── 1. UPDATES TAB COMPONENT (Section 11.1/11.2/12.1 of spec) ───
function UpdatesTab({
  taskId,
  workspaceId: workspaceIdOverride,
  boardId: boardIdOverride,
}: {
  taskId: string;
  workspaceId?: string;
  boardId?: string;
}) {
  const { tasks, users, postTaskUpdate, editTaskUpdate } = useTaskBoard();
  const { session } = useAuth();
  const { workspaceId: routeWorkspaceId = '', boardId: routeBoardId = '' } = useParams();
  const workspaceId = workspaceIdOverride ?? routeWorkspaceId;
  const boardId = boardIdOverride ?? routeBoardId;
  const task = tasks[taskId];
  
  const [newUpdate, setNewUpdate] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  
  // Mention Autocomplete States
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [mentionAnchor, setMentionAnchor] = useState<HTMLElement | null>(null);
  const textfieldRef = useRef<HTMLDivElement>(null);

  // Files draft attachments uploader state
  const [draftFiles, setDraftFiles] = useState<FileAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = useMemo(
    () => Object.values(users).find((user) => user.email === session?.email) ?? Object.values(users)[0],
    [session?.email, users]
  );
  const activeUser = currentUser || { id: '', name: 'Current user', initials: '?', avatarUrl: null };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewUpdate(val);

    // Track "@" trigger at cursor position
    const cursor = e.target.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursor);
    const lastAt = textBeforeCursor.lastIndexOf('@');

    if (lastAt !== -1 && !textBeforeCursor.slice(lastAt, cursor).includes(' ')) {
      const search = textBeforeCursor.slice(lastAt + 1, cursor);
      setMentionSearch(search);
      setMentionAnchor(textfieldRef.current);
    } else {
      setMentionSearch(null);
    }
  };

  const handleSelectMention = (member: User) => {
    if (!textfieldRef.current) return;
    const input = textfieldRef.current.querySelector('textarea') || textfieldRef.current.querySelector('input');
    if (!input) return;

    const val = newUpdate;
    const cursor = input.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursor);
    const lastAt = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = val.slice(cursor);

    const mentionStr = `@${member.name} `;
    const updatedVal = val.slice(0, lastAt) + mentionStr + textAfterCursor;
    
    setNewUpdate(updatedVal);
    setMentionSearch(null);
    
    // Focus back on text area
    setTimeout(() => {
      input.focus();
      const nextCursorPos = lastAt + mentionStr.length;
      input.setSelectionRange(nextCursorPos, nextCursorPos);
    }, 50);
  };

  const handleFileAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let fileUrl = '';
    try {
      if (workspaceId && boardId && taskId) {
        const uploaded = await uploadTaskUpdateFile(workspaceId, boardId, taskId, file);
        fileUrl = uploaded.publicUrl;
      } else {
        throw new Error('Missing task context for upload');
      }
    } catch (error) {
      console.error('Failed to upload task file', error);
      showAppNotification({ message: 'File upload failed. Please try again.', severity: 'error' });
      e.target.value = '';
      return;
    }

    const newFileAttach: FileAttachment = {
      id: `file_${Date.now()}`,
      name: file.name,
      url: fileUrl,
      type: file.type || 'application/octet-stream',
      size: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: activeUser,
    };

    setDraftFiles((prev) => [...prev, newFileAttach]);
    e.target.value = '';
  };

  const getMentionedIds = (content: string) => {
    const mentionedIds: string[] = [];
    Object.values(users).forEach((member) => {
      if (content.includes(`@${member.name}`)) {
        mentionedIds.push(member.id);
      }
    });
    return mentionedIds;
  };

  const handlePost = () => {
    if (!newUpdate.trim() && draftFiles.length === 0) return;

    postTaskUpdate(taskId, newUpdate, draftFiles, getMentionedIds(newUpdate));

    // Reset editor
    setNewUpdate('');
    setDraftFiles([]);
  };

  const handleStartEditComment = (upd: TaskUpdate) => {
    setEditingCommentId(upd.id);
    setEditingCommentText(upd.content);
  };

  const handleSaveEditComment = (updId: string) => {
    if (!editingCommentText.trim()) return;
    editTaskUpdate(taskId, updId, editingCommentText, getMentionedIds(editingCommentText));
    setEditingCommentId(null);
  };

  const filteredMembers = useMemo(() => {
    if (mentionSearch === null) return [];
    return Object.values(users).filter((u) =>
      u.name.toLowerCase().includes(mentionSearch.toLowerCase())
    );
  }, [mentionSearch, users]);

  if (!task) return null;

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
      
      {/* Comment Composer */}
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, mb: 4, bgcolor: 'background.paper' }}>
        <TextField
          ref={textfieldRef}
          multiline
          minRows={2}
          placeholder="Write an update... Use @ to mention someone."
          value={newUpdate}
          onChange={handleTextChange}
          variant="standard"
          InputProps={{ disableUnderline: true, sx: { fontSize: 13.5 } }}
          fullWidth
        />

        {/* Local attachments preview area */}
        {draftFiles.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 1.5 }}>
            {draftFiles.map((file) => (
              <Chip
                key={file.id}
                icon={<AttachFileIcon />}
                label={`${file.name.slice(0, 15)}... (${formatFileSize(file.size)})`}
                size="small"
                onDelete={() => setDraftFiles((prev) => prev.filter((f) => f.id !== file.id))}
                sx={{ borderRadius: 1 }}
              />
            ))}
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <IconButton size="small" onClick={handleFileAttachClick} sx={{ color: 'text.secondary' }} title="Attach File">
            <AttachFileIcon fontSize="small" />
          </IconButton>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          <Button variant="contained" size="small" onClick={handlePost} sx={{ textTransform: 'none', fontWeight: 600, px: 2.5 }}>
            Update
          </Button>
        </Box>
      </Box>

      {/* Autocomplete mention dropdown */}
      <Popover
        open={mentionSearch !== null && filteredMembers.length > 0}
        anchorEl={mentionAnchor}
        onClose={() => setMentionSearch(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        disableAutoFocus
        disableEnforceFocus
        slotProps={{ paper: { sx: { mt: 0.5, maxHeight: 200, width: 220, borderRadius: 2 } } }}
      >
        <List dense sx={{ py: 0.5 }}>
          {filteredMembers.map((m) => (
            <MenuItem key={m.id} onClick={() => handleSelectMention(m)}>
              <Avatar sx={{ width: 20, height: 20, fontSize: 9, mr: 1, bgcolor: 'primary.main' }}>
                {m.initials}
              </Avatar>
              <ListItemText primary={m.name} primaryTypographyProps={{ fontSize: 13 }} />
            </MenuItem>
          ))}
        </List>
      </Popover>

      {/* Updates / Comments Feed */}
      <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5 }}>
        {task.updates && task.updates.length > 0 ? (
          [...task.updates].reverse().map((upd) => {
            const author = users[upd.authorId];
            const date = new Date(upd.createdAt).toLocaleString([], {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            const isEditing = editingCommentId === upd.id;
            const isOwnComment = Boolean(currentUser?.id && upd.authorId === currentUser.id);

            return (
              <Box key={upd.id} sx={{ display: 'flex', gap: 2, mb: 4 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13 }}>
                  {author?.initials || '?'}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  
                  {/* Meta / Date */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{author?.name || 'Unknown'}</Typography>
                      <Typography sx={{ color: 'text.disabled', fontSize: 11.5 }}>
                        {date} {upd.updatedAt && ' • Edited'}
                      </Typography>
                    </Box>
                    
                    {/* Edit Comment Action button */}
                    {isOwnComment && !isEditing && (
                      <IconButton size="small" onClick={() => handleStartEditComment(upd)} sx={{ p: 0.25 }} title="Edit Comment">
                        <EditIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    )}
                  </Box>

                  {/* Comment Body */}
                  {isEditing ? (
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <TextField
                        size="small"
                        multiline
                        minRows={2}
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        fullWidth
                        InputProps={{ sx: { fontSize: 13, borderRadius: 1.5 } }}
                      />
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button size="small" onClick={() => setEditingCommentId(null)} sx={{ textTransform: 'none' }}>
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<SaveIcon />}
                          onClick={() => handleSaveEditComment(upd.id)}
                          disabled={!editingCommentText.trim()}
                          sx={{ textTransform: 'none', px: 2 }}
                        >
                          Save
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <>
                      <Typography sx={{ fontSize: 13.5, whiteSpace: 'pre-wrap', color: 'text.secondary', lineHeight: 1.4 }}>
                        {upd.content}
                      </Typography>

                      {/* Render comment attachment chips */}
                      {upd.attachments && upd.attachments.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                          {upd.attachments.map((file) => (
                            <Chip
                              key={file.id}
                              icon={<FilePresentIcon />}
                              label={file.name}
                              size="small"
                              sx={{ borderRadius: 1, fontSize: 11, bgcolor: 'grey.50' }}
                            />
                          ))}
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              </Box>
            );
          })
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8, color: 'text.disabled' }}>
            <ChatBubbleOutlineIcon sx={{ fontSize: 40, mb: 1.5, opacity: 0.5 }} />
            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>No updates found</Typography>
            <Typography sx={{ fontSize: 11.5 }}>Be the first to post a status update.</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ─── 2. FILES TAB COMPENDIUM COMPONENT (Section 11.3 of spec) ───
function FilesTab({ taskId }: { taskId: string }) {
  const { tasks } = useTaskBoard();
  const task = tasks[taskId];
  const filesList = task?.files || [];

  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);

  const handleDownload = (file: FileAttachment) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ p: 3, boxSizing: 'border-box', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle2" sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 2 }}>
        Task Uploads Compendium ({filesList.length})
      </Typography>

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {filesList.length > 0 ? (
          <List disablePadding>
            {filesList.map((file) => {
              const fileDate = new Date(file.uploadedAt).toLocaleDateString([], {
                month: 'short', day: 'numeric', year: 'numeric'
              });
              return (
                <ListItem
                  key={file.id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    mb: 1.5,
                    p: 1.5,
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getFileIcon(file.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={file.name}
                    secondary={`${formatFileSize(file.size)} • Uploaded by ${file.uploadedBy.name} on ${fileDate}`}
                    primaryTypographyProps={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    secondaryTypographyProps={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mt: 0.5 }}
                    sx={{ pr: 1 }}
                  />
                  
                  {/* File click actions */}
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => setPreviewFile(file)} title="Preview File">
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDownload(file)} title="Download File">
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8, color: 'text.disabled' }}>
            <FilePresentIcon sx={{ fontSize: 40, mb: 1.5, opacity: 0.5 }} />
            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>No files uploaded</Typography>
            <Typography sx={{ fontSize: 11.5 }}>Attach files to comments in the Updates tab.</Typography>
          </Box>
        )}
      </Box>

      {/* Custom Modal preview (image, PDF, Text, CSV) */}
      <Dialog
        open={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        {previewFile && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getFileIcon(previewFile.type)}
                <Typography variant="h6" sx={{ fontSize: 15, fontWeight: 600 }}>{previewFile.name}</Typography>
              </Box>
              <IconButton onClick={() => setPreviewFile(null)} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3, bgcolor: 'grey.50', minHeight: 350 }}>
              {previewFile.type.startsWith('image/') ? (
                <Box
                  component="img"
                  src={previewFile.url}
                  alt={previewFile.name}
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '65vh',
                    objectFit: 'contain',
                    borderRadius: 2,
                    boxShadow: 2,
                  }}
                />
              ) : previewFile.type.includes('pdf') || previewFile.type.startsWith('text/') ? (
                <iframe
                  src={previewFile.url}
                  title={previewFile.name}
                  style={{
                    width: '100%',
                    height: '60vh',
                    border: 'none',
                    borderRadius: 8,
                    backgroundColor: 'white',
                  }}
                />
              ) : (
                <Box sx={{ textAlign: 'center', p: 4, color: 'text.secondary' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Preview not available
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, mb: 2 }}>
                    Unsupported file type: {previewFile.type}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownload(previewFile)}
                    sx={{ textTransform: 'none' }}
                  >
                    Download File
                  </Button>
                </Box>
              )}
            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 1.5 }}>
              <Button onClick={() => setPreviewFile(null)} size="small" sx={{ textTransform: 'none' }}>
                Close
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownload(previewFile)}
                sx={{ textTransform: 'none' }}
              >
                Download
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

// ─── 3. ACTIVITY LOG TAB ───
function summarizeActivity(activity: TaskActivity) {
  const FIELD_LABELS: Record<string, string> = {
    name: 'name',
    status: 'status',
    priority: 'priority',
    dueDate: 'due date',
    progress: 'progress',
    budget: 'budget',
    assigneeIds: 'assignees',
    group: 'group',
    board: 'board',
    columns: 'columns',
  };

  const valueLabel = (value: unknown) => {
    if (value === null || value === undefined || value === '') return 'empty';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'object') {
      const map = value as Record<string, unknown>;
      if ('name' in map && typeof map.name === 'string') return map.name;
      if ('label' in map && typeof map.label === 'string') return map.label;
      if ('group' in map || 'board' in map) {
        const board = typeof map.board === 'string' ? map.board : null;
        const group = typeof map.group === 'string' ? map.group : null;
        return [board, group].filter(Boolean).join(' / ') || 'multiple fields';
      }
      return Object.entries(map)
        .filter(([, item]) => item !== null && item !== undefined && item !== '')
        .slice(0, 3)
        .map(([key, item]) => `${key}: ${String(item)}`)
        .join(', ') || 'multiple fields';
    }
    return String(value);
  };

  const changedFieldSummaries = (oldValue: unknown, newValue: unknown) => {
    if (!oldValue || !newValue || typeof oldValue !== 'object' || typeof newValue !== 'object') return [];
    const before = oldValue as Record<string, unknown>;
    const after = newValue as Record<string, unknown>;
    return Object.entries(after)
      .filter(([key, value]) => JSON.stringify(before[key]) !== JSON.stringify(value))
      .map(([key, value]) => {
        const label = FIELD_LABELS[key] ?? key;
        return `${label} from ${valueLabel(before[key])} to ${valueLabel(value)}`;
      });
  };

  const fieldLabel = FIELD_LABELS[activity.fieldKey] ?? activity.fieldKey ?? 'task';

  switch (activity.eventType) {
    case 'task_created':
      return 'created this task';
    case 'task_updated':
      if (activity.fieldKey === 'task') {
        const summaries = changedFieldSummaries(activity.oldValue, activity.newValue);
        return summaries.length > 0 ? `updated ${summaries[0]}` : 'updated this task';
      }
      if (activity.fieldKey === 'name') {
        return `renamed this task from ${valueLabel(activity.oldValue)} to ${valueLabel(activity.newValue)}`;
      }
      return `updated ${fieldLabel} from ${valueLabel(activity.oldValue)} to ${valueLabel(activity.newValue)}`;
    case 'task_deleted':
      return 'deleted this task';
    case 'task_restored':
      return 'restored this task';
    case 'task_moved':
      return `moved this task from ${valueLabel(activity.oldValue)} to ${valueLabel(activity.newValue)}`;
    case 'update_created':
      return 'posted an update';
    case 'update_edited':
      return 'edited an update';
    case 'group_created':
      return `created group ${valueLabel(activity.newValue)}`;
    case 'group_updated': {
      const summaries = changedFieldSummaries(activity.oldValue, activity.newValue);
      return summaries.length > 0 ? `updated group ${summaries.join(', ')}` : 'updated a group';
    }
    case 'column_created':
      return `created column ${valueLabel(activity.newValue)}`;
    case 'columns_updated':
      return 'updated board columns';
    case 'board_renamed':
      return `renamed this board to ${valueLabel(activity.newValue)}`;
    case 'custom_values_discarded':
      return 'discarded incompatible custom values';
    default:
      return activity.eventType.replace(/_/g, ' ');
  }
}

function ActivityTab({ taskId }: { taskId: string }) {
  const { tasks } = useTaskBoard();
  const activities = tasks[taskId]?.activities ?? [];

  return (
    <Box sx={{ p: 3, height: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
      {activities.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {activities.map((activity) => {
            const date = new Date(activity.createdAt).toLocaleString([], {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            return (
              <Box key={activity.id} sx={{ display: 'flex', gap: 1.5 }}>
                <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: '#5F0229' }}>
                  {activity.actorInitials || '?'}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13, color: 'text.primary' }}>
                    <Box component="span" sx={{ fontWeight: 700 }}>{activity.actorName}</Box>{' '}
                    {summarizeActivity(activity)}
                  </Typography>
                  <Typography sx={{ mt: 0.25, fontSize: 11.5, color: 'text.disabled' }}>
                    {date}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', color: 'text.secondary', pt: 8 }}>
          <HistoryIcon sx={{ fontSize: 40, mb: 1.5, opacity: 0.45 }} />
          <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>No activity yet</Typography>
          <Typography sx={{ fontSize: 11.5 }}>Task changes will appear here.</Typography>
        </Box>
      )}
    </Box>
  );
}

// ─── MAIN COMPONENT ───
export default function TaskDetailPanel({
  workspaceId,
  boardId,
}: {
  workspaceId?: string;
  boardId?: string;
} = {}) {
  const {
    panel,
    closePanel,
    setPanelTab,
    tasks,
    updateTask,
    taskRenameRequestId,
    consumeTaskRenameRequest,
  } = useTaskBoard();
  const task = panel.taskId ? tasks[panel.taskId] : null;
  const [isRenamingTitle, setIsRenamingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!task || taskRenameRequestId !== task.id) return;
    const timeoutId = window.setTimeout(() => {
      setDraftTitle(task.name);
      setIsRenamingTitle(true);
      consumeTaskRenameRequest(task.id);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [task, taskRenameRequestId, consumeTaskRenameRequest]);

  useEffect(() => {
    if (!isRenamingTitle) return;
    window.setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 0);
  }, [isRenamingTitle]);

  const saveTitle = () => {
    if (!task) return;
    const nextName = draftTitle.trim();
    if (!nextName) {
      setDraftTitle(task.name);
      setIsRenamingTitle(false);
      return;
    }
    if (nextName !== task.name) {
      updateTask(task.id, { name: nextName });
    }
    setIsRenamingTitle(false);
  };

  return (
    <Drawer
      anchor="right"
      open={panel.isOpen}
      onClose={closePanel}
      elevation={4}
      slotProps={{
        backdrop: {
          sx: { backgroundColor: 'transparent' },
        },
      }}
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
              {isRenamingTitle ? (
                <TextField
                  inputRef={titleInputRef}
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') saveTitle();
                    if (event.key === 'Escape') {
                      setDraftTitle(task.name);
                      setIsRenamingTitle(false);
                    }
                  }}
                  variant="standard"
                  fullWidth
                  InputProps={{ disableUnderline: true, sx: { fontSize: 22, fontWeight: 700, lineHeight: 1.25 } }}
                  sx={{ flex: 1, pr: 2 }}
                />
              ) : (
                <Typography
                  variant="h5"
                  onClick={() => {
                    setDraftTitle(task.name);
                    setIsRenamingTitle(true);
                  }}
                  sx={{
                    fontWeight: 600,
                    fontSize: 22,
                    flex: 1,
                    pr: 2,
                    cursor: 'text',
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  {task.name}
                </Typography>
              )}
              <IconButton onClick={closePanel} size="small" sx={{ ml: 'auto' }}>
                <CloseIcon />
              </IconButton>
            </Box>
            
            <Tabs
              value={panel.activeTab}
              onChange={(_, val) => setPanelTab(val)}
              sx={{ minHeight: 36 }}
            >
              <Tab label="Updates" value="updates" sx={{ textTransform: 'none', minHeight: 36, py: 0, fontWeight: 600, fontSize: 12.5 }} />
              <Tab label="Files" value="files" sx={{ textTransform: 'none', minHeight: 36, py: 0, fontWeight: 600, fontSize: 12.5 }} />
              <Tab label="Activity Log" value="activity" sx={{ textTransform: 'none', minHeight: 36, py: 0, fontWeight: 600, fontSize: 12.5 }} />
            </Tabs>
          </Box>
          <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />

          {/* Content */}
          <Box sx={{ flex: 1, overflowY: 'hidden' }}>
            {panel.activeTab === 'updates' && <UpdatesTab taskId={task.id} workspaceId={workspaceId} boardId={boardId} />}
            {panel.activeTab === 'files' && <FilesTab taskId={task.id} />}
            {panel.activeTab === 'activity' && <ActivityTab taskId={task.id} />}
          </Box>
        </Box>
      )}
    </Drawer>
  );
}
