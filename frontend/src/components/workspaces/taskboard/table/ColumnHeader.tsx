// ─── ColumnHeader — renders the dynamic column headers ───

import { Box, Typography } from '@mui/material';
import { useTaskBoard } from '../TaskBoardContext';

interface ColumnHeaderProps {
  groupColor?: string;
}

export default function ColumnHeader(_props: ColumnHeaderProps) {
  const { boardConfig } = useTaskBoard();
  const visibleColumns = boardConfig.columns
    .filter((c) => c.isVisible)
    .sort((a, b) => a.order - b.order);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'stretch',
        borderBottom: '2px solid',
        borderColor: 'divider',
        minHeight: 36,
        position: 'sticky',
        top: 0,
        bgcolor: 'background.default',
        zIndex: 1,
      }}
    >
      {/* Spacer for Selection border indicator */}
      <Box sx={{ width: 4 }} />

      {/* Spacer for Checkbox and Drag Handle Area */}
      <Box
        sx={{
          width: 50,
          borderRight: '1px solid',
          borderColor: 'divider',
        }}
      />

      {/* Dynamic Headers */}
      <Box sx={{ display: 'flex', flex: 1 }}>
        {visibleColumns.map((col) => (
          <Box
            key={col.id}
            sx={{
              flex: col.width ? `0 0 ${col.width}px` : 1,
              minWidth: col.width || 120,
              borderRight: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              px: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {col.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
