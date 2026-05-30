import { Box, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import { useDashboard } from './useDashboard';

function DashboardHeader() {
  const { isEditMode, hasUnsavedChanges, toggleEditMode, confirmEdit, openAddModal } =
    useDashboard();

  const handleEditButtonClick = () => {
    if (isEditMode) {
      confirmEdit();
    } else {
      toggleEditMode();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 2.5,
      }}
    >
      <Typography
        variant="h3"
        sx={{
          color: (theme) =>
            theme.palette.mode === 'dark'
              ? theme.palette.text.primary
              : theme.palette.primary.main,
          fontWeight: 700,
          fontSize: '32px',
          lineHeight: 1,
        }}
      >
        Metrics
      </Typography>

      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={openAddModal}
          sx={{
            textTransform: 'none',
            fontWeight: 500,
            fontSize: 13,
            borderColor: (theme) =>
              theme.palette.mode === 'dark'
                ? theme.palette.grey[600]
                : theme.palette.divider,
            color: 'text.primary',
            '&:hover': {
              borderColor: (theme) =>
                theme.palette.mode === 'dark'
                  ? theme.palette.grey[300]
                  : theme.palette.primary.main,
              color: (theme) =>
                theme.palette.mode === 'dark'
                  ? theme.palette.text.primary
                  : theme.palette.primary.main,
            },
          }}
        >
          New component
        </Button>

        <Button
          variant={isEditMode ? 'contained' : 'outlined'}
          size="small"
          startIcon={isEditMode ? <CheckIcon /> : <EditIcon />}
          onClick={handleEditButtonClick}
          sx={{
            textTransform: 'none',
            fontWeight: 500,
            fontSize: 13,
            ...(isEditMode
              ? {
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? theme.palette.grey[600]
                      : theme.palette.primary.main,
                  color: '#fff',
                  '&:hover': {
                    bgcolor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? theme.palette.grey[500]
                        : theme.palette.primary.dark,
                  },
                  ...(hasUnsavedChanges && {
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#FF9500',
                    },
                  }),
                }
              : {
                  borderColor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? theme.palette.grey[600]
                      : theme.palette.divider,
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? theme.palette.grey[300]
                        : theme.palette.primary.main,
                    color: (theme) =>
                      theme.palette.mode === 'dark'
                        ? theme.palette.text.primary
                        : theme.palette.primary.main,
                  },
                }),
          }}
        >
          {isEditMode ? 'Confirm' : 'Edit'}
        </Button>
      </Box>
    </Box>
  );
}

export default DashboardHeader;
