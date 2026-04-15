import { Avatar, Box, Chip, LinearProgress, Paper, Typography } from '@mui/material';

export interface RecentProjectData {
  title: string;
  description: string;
  members: string[];
  extraMembers?: number;
  progress: number;
  status: 'active' | 'in-progress' | 'planning';
}

interface RecentProjectsSectionProps {
  projects: RecentProjectData[];
}

const statusConfig: Record<RecentProjectData['status'], { label: string; bg: string; color: string }> = {
  active: { label: 'Active', bg: '#2C2C2C', color: '#FFFFFF' },
  'in-progress': { label: 'In Progress', bg: '#EAC24F', color: '#5A1800' },
  planning: { label: 'Planning', bg: '#B3B3B3', color: '#FFFFFF' },
};

function RecentProjectCard({ project }: { project: RecentProjectData }) {
  const status = statusConfig[project.status];

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '5px',
        bgcolor: '#FFFFFF',
        width: '100%',
        minHeight: 129,
        px: 1.5,
        py: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
        <Typography
          sx={{
            color: 'primary.dark',
            fontSize: '10.5px',
            fontWeight: 700,
            lineHeight: 1.3,
          }}
        >
          {project.title}
        </Typography>
        <Chip
          label={status.label}
          size="small"
          sx={{
            height: 16,
            fontSize: '7px',
            fontWeight: 700,
            borderRadius: '2px',
            bgcolor: status.bg,
            color: status.color,
            '& .MuiChip-label': { px: 0.75 },
          }}
        />
      </Box>

      <Typography
        sx={{
          mt: 0.8,
          color: '#2C2C2C',
          fontSize: '8px',
          fontWeight: 400,
          lineHeight: 1.3,
          minHeight: 28,
        }}
      >
        {project.description}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {project.members.map((member, index) => (
            <Avatar
              key={`${project.title}-${member}-${index}`}
              sx={{
                width: 18,
                height: 18,
                fontSize: '9px',
                fontWeight: 700,
                bgcolor: 'primary.main',
                border: '1px solid #FFFFFF',
                ml: index === 0 ? 0 : -0.45,
              }}
            >
              {member}
            </Avatar>
          ))}
        </Box>
        {project.extraMembers ? (
          <Typography sx={{ ml: 1, color: '#2C2C2C', fontSize: '8px', fontWeight: 400 }}>
            +{project.extraMembers}
          </Typography>
        ) : null}
      </Box>

      <Box sx={{ mt: 0.8 }}>
        <LinearProgress
          variant="determinate"
          value={project.progress}
          sx={{
            height: 5,
            borderRadius: '2px',
            bgcolor: '#D9D9D9',
            '& .MuiLinearProgress-bar': {
              borderRadius: '2px',
              bgcolor: 'primary.main',
            },
          }}
        />
        <Typography sx={{ mt: 0.5, color: '#2C2C2C', fontSize: '8px', fontWeight: 400 }}>
          {project.progress}% Complete
        </Typography>
      </Box>
    </Paper>
  );
}

function RecentProjectsSection({ projects }: RecentProjectsSectionProps) {
  return (
    <Box sx={{ mt: 3 }}>
      <Typography sx={{ color: 'primary.dark', fontSize: '15px', fontWeight: 700, mb: 1.5 }}>
        Recent Projects
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(4, minmax(0, 1fr))',
          },
          gap: 1.5,
        }}
      >
        {projects.map((project) => (
          <RecentProjectCard key={project.title} project={project} />
        ))}
      </Box>
    </Box>
  );
}

export default RecentProjectsSection;
