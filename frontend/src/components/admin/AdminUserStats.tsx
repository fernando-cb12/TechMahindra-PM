import { Box, Paper, Typography } from '@mui/material';
import type { ManagedUser } from '../../services/adminUsersStore';

type AdminUserStatsProps = {
  users: ManagedUser[];
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        minWidth: 140,
        p: 2,
        borderRadius: '5px',
        bgcolor: 'background.paper',
      }}
    >
      <Typography
        sx={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 12,
          fontWeight: 600,
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          mb: 0.5,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 700,
          fontSize: 28,
          color: (theme) =>
            theme.palette.mode === 'dark'
              ? theme.palette.common.white
              : theme.palette.primary.main,
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
}

function AdminUserStats({ users }: AdminUserStatsProps) {
  const activeCount = users.filter((user) => user.status === 'active').length;
  const inactiveCount = users.filter((user) => user.status === 'inactive').length;
  const adminCount = users.filter((user) => user.roles.includes('ADMIN')).length;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
      <StatCard label="Total users" value={users.length} />
      <StatCard label="Active" value={activeCount} />
      <StatCard label="Inactive" value={inactiveCount} />
      <StatCard label="Admins" value={adminCount} />
    </Box>
  );
}

export { AdminUserStats };
