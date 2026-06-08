import { Box, Paper, Typography, Chip, FormControl, MenuItem, Select, useTheme } from '@mui/material';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import type { WorkspaceProjectCardData, WorkspaceProjectStatus } from '../WorkspaceProjectCard';
import { WORKSPACE_STATUS_OPTIONS } from '../workspaceStatus';

interface WorkspaceHeaderProps {
  workspace: WorkspaceProjectCardData;
  canManageStatus?: boolean;
  isUpdatingStatus?: boolean;
  onStatusChange?: (status: WorkspaceProjectStatus) => void;
}

function WorkspaceHeader({
  workspace,
  canManageStatus = false,
  isUpdatingStatus = false,
  onStatusChange,
}: WorkspaceHeaderProps) {
  const theme = useTheme();

  const statusConfig: Record<WorkspaceProjectStatus, { label: string; bg: string; color: string }> = {
    planning: { label: 'Planning', bg: theme.palette.grey[400], color: theme.palette.common.white },
    'in-progress': { label: 'In Progress', bg: theme.palette.warning.main, color: theme.palette.grey[900] },
    'on-hold': { label: 'On Hold', bg: theme.palette.grey[700], color: theme.palette.common.white },
    completed: { label: 'Completed', bg: theme.palette.success.main, color: theme.palette.common.white },
  };

  const status = statusConfig[workspace.status] || statusConfig.planning;

  const parseProjectDate = (value: string): Date | null => {
    const mmddyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const mmddMatch = mmddyyyy.exec(value);
    if (mmddMatch) {
      const [, month, day, year] = mmddMatch;
      return new Date(`${year}-${month}-${day}T00:00:00`);
    }
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (isoMatch) {
      return new Date(`${value}T00:00:00`);
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const projectDueDate = parseProjectDate(workspace.dueDate);
  const dueDateLabel = projectDueDate
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(projectDueDate)
    : workspace.dueDate;

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderRadius: '5px',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: 120,
          background:
            workspace.imageUrl ??
            'linear-gradient(135deg, rgba(95,2,41,0.95) 0%, rgba(163,51,77,0.95) 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {workspace.imageUrl ? (
          <Box
            component="img"
            src={workspace.imageUrl}
            alt={workspace.title}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : null}
      </Box>

      <Box sx={{ px: 3, py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography
              variant="h2"
              data-page-title="true"
              sx={{
                mb: 0.5,
              }}
            >
              {workspace.title}
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
              {workspace.description}
            </Typography>
          </Box>
          {canManageStatus && onStatusChange ? (
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={workspace.status}
                disabled={isUpdatingStatus}
                onChange={(event) => onStatusChange(event.target.value as WorkspaceProjectStatus)}
                sx={{
                  borderRadius: '5px',
                  bgcolor: status.bg,
                  color: status.color,
                  fontWeight: 700,
                  fontSize: 12,
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                  '& .MuiSvgIcon-root': { color: status.color },
                }}
              >
                {WORKSPACE_STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Chip
              label={status.label}
              sx={{
                height: 24,
                borderRadius: '5px',
                bgcolor: status.bg,
                color: status.color,
                fontWeight: 700,
                fontSize: 12,
                '& .MuiChip-label': { px: 1.5 },
              }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CalendarMonthOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography sx={{ color: 'text.primary', fontSize: 14, fontWeight: 600 }}>
            Due: {dueDateLabel}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

export default WorkspaceHeader;
