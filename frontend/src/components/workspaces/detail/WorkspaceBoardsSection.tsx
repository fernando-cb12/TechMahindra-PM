import { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, Paper, Typography, Button, useTheme, alpha } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import AddIcon from '@mui/icons-material/Add';
import { getWorkspaceBoards, type WorkspaceBoard } from '../../../services/workspacesService';
import { useNavigate } from 'react-router-dom';

interface WorkspaceBoardsSectionProps {
  workspaceId: string;
}

function WorkspaceBoardsSection({ workspaceId }: WorkspaceBoardsSectionProps): React.ReactNode {
  const theme = useTheme();
  const navigate = useNavigate();
  const [boards, setBoards] = useState<WorkspaceBoard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadBoards = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getWorkspaceBoards(workspaceId);
        if (!cancelled) setBoards(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load boards');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void loadBoards();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderRadius: '5px',
        p: 3,
        minHeight: 340,
        maxHeight: 460,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: (theme) =>
              theme.palette.mode === 'dark'
                ? theme.palette.text.primary
                : theme.palette.primary.main,
          }}
        >
          Boards
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          sx={{
            textTransform: 'none',
            fontSize: 12,
            fontWeight: 600,
            color: theme.palette.mode === 'dark' ? '#fff' : 'primary.main',
            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
          }}
        >
          New
        </Button>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          pr: 0.5,
          '&::-webkit-scrollbar': {
            width: 8,
            backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.06) : alpha(theme.palette.grey[300], 0.35),
          },
          '&::-webkit-scrollbar-thumb': {
            borderRadius: '5px',
            backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.grey[600], 0.75) : alpha(theme.palette.grey[500], 0.75),
          },
        }}
      >
        {isLoading ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={24} sx={{ color: 'primary.main' }} />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : boards.length === 0 ? (
          <Typography sx={{ color: 'text.secondary', fontSize: 13, py: 2 }}>
            No boards yet
          </Typography>
        ) : boards.map((board) => (
          <Box
            key={board.id}
            onClick={() => navigate(`/workspaces/${workspaceId}/boards/${board.id}`)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 1.5,
              borderRadius: '5px',
              bgcolor: alpha(theme.palette.primary.main, 0.03),
              border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.06),
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '5px',
                bgcolor: board.color,
                opacity: 0.8,
              }}
            >
              <FolderIcon sx={{ color: '#fff', fontSize: 20 }} />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: 13,
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {board.name}
              </Typography>
              <Typography
                sx={{
                  fontSize: 12,
                  color: 'text.secondary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  mt: 0.25,
                }}
              >
                {board.description}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

export default WorkspaceBoardsSection;
