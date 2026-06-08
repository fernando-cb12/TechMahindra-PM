import { useState } from 'react';
import { Menu, MenuItem, Chip } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { priorityColors } from '../../styles/theme';

const PriorityButton: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selected, setSelected] = useState('High');
  const open = Boolean(anchorEl);

  const options = [
    { label: 'High', color: priorityColors.High },
    { label: 'Medium', color: priorityColors.Medium },
    { label: 'Low', color: priorityColors.Low },
  ];

  const selectedColor = options.find((o) => o.label === selected)?.color;

  return (
    <>
      <Chip
        label={selected}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        deleteIcon={<KeyboardArrowDownIcon style={{ color: 'white' }} />}
        onDelete={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          bgcolor: selectedColor,
          color: 'white',
          fontSize: 12,
          cursor: 'pointer',
        }}
      />

      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        {options.map((option) => (
          <MenuItem
            key={option.label}
            onClick={() => {
              setSelected(option.label);
              setAnchorEl(null);
            }}
          >
            <Chip
              label={option.label}
              size="small"
              sx={{
                bgcolor: option.color,
                color: 'white',
                fontSize: 12,
                cursor: 'pointer',
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default PriorityButton;
