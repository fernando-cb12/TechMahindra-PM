import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import { Avatar, Box, Chip, LinearProgress, Paper, Typography } from '@mui/material';

export type WorkspaceProjectStatus = 'in-progress' | 'planning' | 'active' | 'completed';

export interface WorkspaceProjectCardData {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  members: string[];
  currentProgress: number;
  estimatedProgress: number;
  dueDate: string;
  budgetLabel: string;
  status: WorkspaceProjectStatus;
}

const statusConfig: Record<WorkspaceProjectStatus, { label: string; bg: string; color: string }> = {
  active: { label: 'Active', bg: '#2C2C2C', color: '#FFFFFF' },
  'in-progress': { label: 'In Progress', bg: '#EAC24F', color: '#5A1800' },
  planning: { label: 'Planning', bg: '#B3B3B3', color: '#FFFFFF' },
  completed: { label: 'Completed', bg: '#4CAF50', color: '#FFFFFF' },
};

interface WorkspaceProjectCardProps {
  project: WorkspaceProjectCardData;
}

function WorkspaceProjectCard({ project }: WorkspaceProjectCardProps) {
  const status = statusConfig[project.status];

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        maxWidth: 300,
        minHeight: 330,
        borderRadius: '5px',
        bgcolor: '#FFFFFF',
        px: 2,
        py: 2.5,
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: 78,
          borderRadius: '5px',
          overflow: 'hidden',
          background:
            project.imageUrl ??
            'linear-gradient(135deg, rgba(95,2,41,0.95) 0%, rgba(163,51,77,0.95) 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          mb: 1.5,
        }}
      >
        {project.imageUrl ? (
          <Box
            component="img"
            src={project.imageUrl}
            alt={`${project.title} workspace`}
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : null}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
        <Typography sx={{ color: '#5f0229', fontSize: '10.5px', fontWeight: 700, py: 1 }}>{project.title}</Typography>
        <Chip
          label={status.label}
          size="small"
          sx={{
            height: 16,
            borderRadius: '2px',
            bgcolor: status.bg,
            color: status.color,
            fontSize: '7px',
            fontWeight: 700,
            '& .MuiChip-label': { px: 0.8 },
            marginTop: 1,
          }}
        />
      </Box>

      <Typography sx={{ mt: 0.5, color: '#2C2C2C', fontSize: '8px', minHeight: 28, lineHeight: 1.35 }}>
        {project.description}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.25 }}>
        {project.members.map((member, index) => (
          <Avatar
            key={`${project.id}-${member}-${index}`}
            sx={{
              width: 18,
              height: 18,
              fontSize: '9px',
              fontWeight: 700,
              bgcolor: '#5f0229',
              border: '1px solid #FFFFFF',
              ml: index === 0 ? 0 : -0.45,
            }}
          >
            {member}
          </Avatar>
        ))}
      </Box>

      <Box sx={{ mt: 1 }}>
        <LinearProgress
          variant="determinate"
          value={project.currentProgress}
          sx={{
            height: 5,
            borderRadius: '2px',
            bgcolor: '#D9D9D9',
            '& .MuiLinearProgress-bar': { bgcolor: '#5f0229' },
          }}
        />
        <Typography sx={{ mt: 0.5, color: '#2C2C2C', fontSize: '8px' }}>
          {project.currentProgress}% Current Progress
        </Typography>
      </Box>

      <Box sx={{ mt: 0.6, borderTop: '1px solid rgba(95,2,41,0.5)', pt: 0.7 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          <CalendarMonthOutlinedIcon sx={{ fontSize: 9, color: '#5f0229' }} />
          <Typography sx={{ color: '#2C2C2C', fontSize: '8px' }}>Due: {project.dueDate}</Typography>
        </Box>
        <Typography sx={{ mt: 0.7, color: '#2C2C2C', fontSize: '8px' }}>
          Development Budget: {project.budgetLabel}
        </Typography>
      </Box>

      <Box sx={{ mt: 0.9 }}>
        <LinearProgress
          variant="determinate"
          value={project.estimatedProgress}
          sx={{
            height: 5,
            borderRadius: '2px',
            bgcolor: '#D9D9D9',
            '& .MuiLinearProgress-bar': { bgcolor: 'rgba(95,2,41,0.58)' },
          }}
        />
        <Typography sx={{ mt: 0.5, color: '#2C2C2C', fontSize: '8px' }}>
          {project.estimatedProgress}% Estimated Progress
        </Typography>
      </Box>
    </Paper>
  );
}

export default WorkspaceProjectCard;
