// ─── TableToolbar — contains search, new button dropdown, and sorting controls ───

import { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Popover,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ColumnManager from '../ColumnManager';
import { useTaskBoard } from '../useTaskBoard';

export default function TableToolbar() {
  const {
    addTaskToFirstGroup,
    addGroupAtSecondPosition,
    searchQuery,
    setSearchQuery,
    sortMode,
    setSortMode,
    sortDirection,
    setSortDirection,
  } = useTaskBoard();

  const [settingsAnchor, setSettingsAnchor] = useState<HTMLButtonElement | null>(null);
  const [newButtonAnchor, setNewButtonAnchor] = useState<HTMLButtonElement | null>(null);

  // Cycle through Task Count sorting: Descending -> Ascending -> None
  const handleTaskCountSort = () => {
    if (sortMode !== 'taskCount') {
      setSortMode('taskCount');
      setSortDirection('desc');
    } else if (sortDirection === 'desc') {
      setSortDirection('asc');
    } else {
      setSortMode('none');
    }
  };

  // Cycle through Alphabetical sorting: Ascending -> Descending -> None
  const handleAlphabeticalSort = () => {
    if (sortMode !== 'alphabetical') {
      setSortMode('alphabetical');
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortMode('none');
    }
  };

  const isTaskCountActive = sortMode === 'taskCount';
  const isAlphabeticalActive = sortMode === 'alphabetical';

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
        {/* "New" button with Dropdown Menu */}
        <Button
          variant="contained"
          size="small"
          endIcon={<KeyboardArrowDownIcon />}
          onClick={(e) => setNewButtonAnchor(e.currentTarget)}
          sx={{ px: 2 }}
        >
          New
        </Button>

        <Menu
          anchorEl={newButtonAnchor}
          open={Boolean(newButtonAnchor)}
          onClose={() => setNewButtonAnchor(null)}
          slotProps={{ paper: { sx: { mt: 0.5, borderRadius: 2, minWidth: 160 } } }}
        >
          <MenuItem
            onClick={() => {
              addTaskToFirstGroup();
              setNewButtonAnchor(null);
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>New Item</Typography>
          </MenuItem>
          <MenuItem
            onClick={() => {
              addGroupAtSecondPosition();
              setNewButtonAnchor(null);
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>New Group of Items</Typography>
          </MenuItem>
        </Menu>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Live Search Field */}
          <TextField
            placeholder="Search tasks, members, status..."
            size="small"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 999, bgcolor: 'background.paper', height: 36, width: 260, fontSize: 13 }
              }
            }}
          />

          {/* Left Button - Sort Groups by Task Count */}
          <IconButton
            size="small"
            onClick={handleTaskCountSort}
            title={
              isTaskCountActive
                ? `Sorted by Task Count (${sortDirection === 'desc' ? 'High to Low' : 'Low to High'}). Click to cycle.`
                : 'Sort Groups by Task Count'
            }
            sx={{
              bgcolor: isTaskCountActive ? 'primary.light' : 'background.paper',
              color: isTaskCountActive ? 'white' : 'text.secondary',
              border: isTaskCountActive ? 'none' : '1px solid',
              borderColor: 'divider',
              '&:hover': {
                bgcolor: isTaskCountActive ? 'primary.main' : 'grey.100',
              },
              width: 36,
              height: 36,
              borderRadius: 999,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <FilterListIcon fontSize="small" />
              {isTaskCountActive && (
                sortDirection === 'desc' ? <ArrowDownwardIcon sx={{ fontSize: 10 }} /> : <ArrowUpwardIcon sx={{ fontSize: 10 }} />
              )}
            </Box>
          </IconButton>

          {/* Right Button - Sort Groups Alphabetically */}
          <IconButton
            size="small"
            onClick={handleAlphabeticalSort}
            title={
              isAlphabeticalActive
                ? `Sorted Alphabetically (${sortDirection === 'asc' ? 'A to Z' : 'Z to A'}). Click to cycle.`
                : 'Sort Groups Alphabetically'
            }
            sx={{
              bgcolor: isAlphabeticalActive ? 'primary.light' : 'background.paper',
              color: isAlphabeticalActive ? 'white' : 'text.secondary',
              border: isAlphabeticalActive ? 'none' : '1px solid',
              borderColor: 'divider',
              '&:hover': {
                bgcolor: isAlphabeticalActive ? 'primary.main' : 'grey.100',
              },
              width: 36,
              height: 36,
              borderRadius: 999,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <SortIcon fontSize="small" />
              {isAlphabeticalActive && (
                sortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 10 }} /> : <ArrowDownwardIcon sx={{ fontSize: 10 }} />
              )}
            </Box>
          </IconButton>
        </Box>
      </Box>

      {/* Column Manager Settings button */}
      <Box>
        <IconButton
          onClick={(e) => setSettingsAnchor(e.currentTarget)}
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 999,
            width: 36,
            height: 36,
          }}
        >
          <SettingsOutlinedIcon fontSize="small" />
        </IconButton>

        <Popover
          open={Boolean(settingsAnchor)}
          anchorEl={settingsAnchor}
          onClose={() => setSettingsAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ paper: { sx: { width: 320, mt: 1, p: 2, borderRadius: 2 } } }}
        >
          <ColumnManager />
        </Popover>
      </Box>
    </Box>
  );
}
