import {
  Box,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { ManagedUser } from '../../services/adminUsersStore';
import { formatUserRole, formatUserStatus } from '../../data/adminUsersMock';

type AdminUsersTableProps = {
  users: ManagedUser[];
  onEdit: (user: ManagedUser) => void;
  onDelete: (user: ManagedUser) => void;
};

const statusColors: Record<string, string> = {
  active: '#4CAF50',
  inactive: '#9F9F9F',
  banned: '#FB485B',
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function AdminUsersTable({ users, onEdit, onDelete }: AdminUsersTableProps) {
  if (users.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: '5px',
          bgcolor: 'background.paper',
          textAlign: 'center',
        }}
      >
        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', color: 'text.secondary' }}>
          No users match your search or filters.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ borderRadius: '5px', bgcolor: 'background.paper', overflow: 'hidden' }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {['Name', 'Email', 'Role', 'Status', 'Created', 'Actions'].map((header) => (
                <TableCell
                  key={header}
                  sx={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 700,
                    fontSize: 13,
                    color: (theme) =>
                      theme.palette.mode === 'dark'
                        ? theme.palette.common.white
                        : theme.palette.primary.main,
                    py: 1.5,
                    borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => {
              const primaryRole = user.roles[0];
              const statusColor = statusColors[user.status] ?? '#9F9F9F';
              return (
                <TableRow key={user.id} hover>
                  <TableCell sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>
                    {user.name}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14 }}>
                    {user.email}
                  </TableCell>
                  <TableCell>
                    {primaryRole ? (
                      <Chip
                        label={formatUserRole(primaryRole)}
                        size="small"
                        sx={{
                          fontFamily: 'Montserrat, sans-serif',
                          fontWeight: 600,
                          fontSize: 11,
                          bgcolor: (theme) =>
                            theme.palette.mode === 'dark'
                              ? alpha(theme.palette.common.white, 0.12)
                              : alpha(theme.palette.primary.main, 0.1),
                          color: (theme) =>
                            theme.palette.mode === 'dark'
                              ? theme.palette.common.white
                              : theme.palette.primary.main,
                        }}
                      />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={formatUserStatus(user.status)}
                      size="small"
                      sx={{
                        fontFamily: 'Montserrat, sans-serif',
                        fontWeight: 600,
                        fontSize: 11,
                        bgcolor: alpha(statusColor, 0.15),
                        color: statusColor,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13 }}>
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Edit user">
                        <IconButton
                          size="small"
                          onClick={() => onEdit(user)}
                          aria-label="Edit user"
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete user">
                        <IconButton
                          size="small"
                          onClick={() => onDelete(user)}
                          aria-label="Delete user"
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export { AdminUsersTable };
