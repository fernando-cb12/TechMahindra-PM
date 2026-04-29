// ─── TableToolbar — contains search, new task, and column settings ───

import { useState } from 'react';
import { Box, Button, IconButton, TextField, InputAdornment, Popover } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import ColumnManager from '../ColumnManager';

export default function TableToolbar() {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 2,
        px: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        mb: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="contained"
          size="small"
          sx={{ textTransform: 'none', fontWeight: 600 }}
          // onClick opens a new task row in the first group (mock behavior for header button)
        >
          New Task
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            placeholder="Search"
            size="small"
            variant="outlined"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 8, bgcolor: 'background.paper' }
              }
            }}
          />
          <IconButton size="small" sx={{ bgcolor: 'background.paper' }} title="Filter (Coming soon)">
            <FilterListIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ bgcolor: 'background.paper' }} title="Sort (Coming soon)">
            <SortIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Box>
        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
        >
          <SettingsOutlinedIcon />
        </IconButton>
        
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ paper: { sx: { width: 320, mt: 1, p: 2 } } }}
        >
          <ColumnManager />
        </Popover>
      </Box>
    </Box>
  );
}
