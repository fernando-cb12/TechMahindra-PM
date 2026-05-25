import { Box, Paper, Typography, Button, useTheme, alpha } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import AddIcon from '@mui/icons-material/Add';

interface Board {
  id: string;
  name: string;
  description: string;
  color: string;
}

function WorkspaceBoardsSection(): React.ReactNode {
  const theme = useTheme();

  // Mock data - replace with actual API call
  const boards: Board[] = [
    {
      id: 'board-1',
      name: 'Frontend Design',
      description: 'UI/UX and frontend implementation',
      color: '#FF6B6B',
    },
    {
      id: 'board-2',
      name: 'Backend Design',
      description: 'API and database architecture',
      color: '#4ECDC4',
    },
    {
      id: 'board-3',
      name: 'Requirements',
      description: 'Project requirements and specifications',
      color: '#FFE66D',
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
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
            borderRadius: 8,
            backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.grey[600], 0.75) : alpha(theme.palette.grey[500], 0.75),
          },
        }}
      >
        {boards.map((board) => (
          <Box
            key={board.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 1.5,
              borderRadius: 1,
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
                borderRadius: 1,
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
