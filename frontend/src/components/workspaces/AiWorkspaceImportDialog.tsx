import { useState, type DragEvent } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { alpha } from '@mui/material/styles';
import type { AiWorkspaceMode } from '../../services/aiWorkspaceService';

type AiWorkspaceImportDialogProps = {
  open: boolean;
  mode: AiWorkspaceMode;
  fileName: string | null;
  processing: boolean;
  onModeChange: (mode: AiWorkspaceMode) => void;
  onFileChange: (file: File | null) => void;
  onClose: () => void;
  onContinue: () => void;
};

const modes: Array<{
  value: AiWorkspaceMode;
  label: string;
  description: string;
  icon: typeof FactCheckOutlinedIcon;
}> = [
  {
    value: 'EXTRACTION',
    label: 'Requirements Import',
    description: 'Turn only the requirements already stated in the document into tickets.',
    icon: FactCheckOutlinedIcon,
  },
  {
    value: 'GENERATION',
    label: 'Plan Generation',
    description: 'Extract requirements and create the additional tasks needed for a complete delivery plan.',
    icon: AutoAwesomeOutlinedIcon,
  },
];

export function AiWorkspaceImportDialog({
  open,
  mode,
  fileName,
  processing,
  onModeChange,
  onFileChange,
  onClose,
  onContinue,
}: AiWorkspaceImportDialogProps) {
  const selectedMode = modes.find((option) => option.value === mode) ?? modes[0];
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const chooseFile = (file: File | null) => {
    setFileError(null);
    if (!file) {
      onFileChange(null);
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setFileError('Please upload a PDF document.');
      onFileChange(null);
      return;
    }

    onFileChange(file);
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (!processing) setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (processing) return;
    chooseFile(event.dataTransfer.files?.[0] ?? null);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      BackdropProps={{ sx: { backgroundColor: 'rgba(0, 0, 0, 0.55)' } }}
    >
      <DialogTitle sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 20 }}>
        {processing ? `Creating ${selectedMode.label}` : 'Create Workspace with AI'}
      </DialogTitle>
      <DialogContent sx={{ pt: 0, pb: 0 }}>
        {processing ? (
          <Stack spacing={2.5} sx={{ pt: 1, pb: 2 }}>
            <Box>
              <Typography sx={{ color: 'text.secondary', mb: 1 }}>
                AI is reading the PDF and shaping a workspace draft. This can take a little while for longer documents.
              </Typography>
              <LinearProgress sx={{ borderRadius: 999, height: 6 }} />
            </Box>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.1 : 0.035),
                borderColor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.28 : 0.14),
              }}
            >
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Skeleton variant="rounded" width={42} height={42} sx={{ borderRadius: 2 }} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton width="58%" height={26} />
                    <Skeleton width="36%" height={18} />
                  </Box>
                </Stack>

                {[0, 1].map((board) => (
                  <Paper key={board} variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.paper' }}>
                    <Stack spacing={1.25}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Skeleton variant="circular" width={24} height={24} />
                        <Skeleton width="48%" height={22} />
                      </Stack>
                      {[0, 1, 2].map((task) => (
                        <Box
                          key={task}
                          sx={{
                            p: 1.25,
                            borderRadius: 1.5,
                            bgcolor: (theme) => theme.palette.mode === 'dark'
                              ? alpha(theme.palette.common.white, 0.045)
                              : alpha(theme.palette.common.white, 0.86),
                          }}
                        >
                          <Skeleton width={`${76 - task * 12}%`} height={20} />
                          <Skeleton width={`${48 - task * 6}%`} height={16} />
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          </Stack>
        ) : (
        <Stack spacing={2.5} sx={{ pt: 1, pb: 2 }}>
          <Typography sx={{ color: 'text.secondary' }}>
            Start by uploading the project PDF, then choose whether AI should only import stated requirements or build a fuller plan.
          </Typography>

          <Stack spacing={1.25}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label="1" size="small" color="primary" />
              <Typography sx={{ fontWeight: 800 }}>Upload documentation</Typography>
            </Stack>
            <Paper
              component="label"
              variant="outlined"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              sx={{
                display: 'block',
                p: 3,
                borderRadius: 3,
                cursor: processing ? 'default' : 'pointer',
                borderStyle: 'dashed',
                borderWidth: 2,
                borderColor: fileError ? 'error.main' : isDragging ? 'primary.main' : 'divider',
                bgcolor: (theme) => isDragging
                  ? theme.palette.action.hover
                  : theme.palette.mode === 'dark'
                  ? 'background.default'
                  : 'background.paper',
                transition: 'border-color 160ms ease, background-color 160ms ease, transform 160ms ease',
                transform: isDragging ? 'scale(1.01)' : 'scale(1)',
              }}
            >
              <Stack spacing={1.5} alignItems="center" textAlign="center">
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: fileName ? 'success.main' : 'primary.main',
                    color: 'common.white',
                  }}
                >
                  {fileName ? <CheckCircleOutlineIcon /> : <UploadFileOutlinedIcon />}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800 }}>
                    {fileName ? fileName : isDragging ? 'Drop your PDF here' : 'Drag and drop your PDF'}
                  </Typography>
                  <Typography sx={{ color: fileError ? 'error.main' : 'text.secondary', fontSize: 13, mt: 0.5 }}>
                    {fileError || (fileName ? 'Ready to configure AI behavior.' : 'or click to browse your files')}
                  </Typography>
                </Box>
                <Button
                  component="span"
                  variant={fileName ? 'outlined' : 'contained'}
                  disabled={processing}
                  startIcon={<DescriptionOutlinedIcon />}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  {fileName ? 'Replace PDF' : 'Select PDF'}
                </Button>
              </Stack>
              <input
                type="file"
                hidden
                disabled={processing}
                accept=".pdf,application/pdf"
                onChange={(event) => {
                  chooseFile(event.target.files?.[0] ?? null);
                  event.currentTarget.value = '';
                }}
              />
            </Paper>
          </Stack>

          <Divider />

          <Stack spacing={1.25} sx={{ opacity: fileName ? 1 : 0.58 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label="2" size="small" color={fileName ? 'primary' : 'default'} />
              <Typography sx={{ fontWeight: 800 }}>Choose AI behavior</Typography>
            </Stack>
            <ToggleButtonGroup
              exclusive
              fullWidth
              value={mode}
              disabled={!fileName || processing}
              onChange={(_, nextMode: AiWorkspaceMode | null) => {
                if (nextMode) onModeChange(nextMode);
              }}
              sx={{
                gap: 1.25,
                '& .MuiToggleButtonGroup-grouped': {
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  mx: 0,
                },
              }}
            >
              {modes.map((option) => {
                const Icon = option.icon;
                return (
                  <ToggleButton
                    key={option.value}
                    value={option.value}
                    sx={{
                      flex: 1,
                      alignItems: 'flex-start',
                      justifyContent: 'flex-start',
                      gap: 1.25,
                      p: 1.75,
                      textAlign: 'left',
                      textTransform: 'none',
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        borderColor: 'primary.main',
                        '&:hover': { bgcolor: 'primary.dark' },
                      },
                    }}
                  >
                    <Icon sx={{ mt: 0.25 }} />
                    <Box>
                      <Typography sx={{ color: 'inherit', fontWeight: 800 }}>{option.label}</Typography>
                      <Typography sx={{ color: 'inherit', fontSize: 12.5, opacity: 0.78 }}>
                        {option.description}
                      </Typography>
                    </Box>
                  </ToggleButton>
                );
              })}
            </ToggleButtonGroup>
            <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
              You will review and edit the {selectedMode.label.toLowerCase()} draft before creating the workspace.
            </Typography>
          </Stack>
        </Stack>
        )}
      </DialogContent>
      {!processing ? (
        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button
          disabled={processing}
          onClick={onClose}
          sx={{ fontFamily: 'Montserrat, sans-serif', textTransform: 'none', color: 'text.primary' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onContinue}
          disabled={!fileName || processing}
          startIcon={processing ? <CircularProgress size={18} color="inherit" /> : undefined}
          sx={{
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' },
            textTransform: 'none',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
          }}
        >
          {processing ? 'Processing' : mode === 'EXTRACTION' ? 'Import Requirements' : 'Generate Plan'}
        </Button>
        </DialogActions>
      ) : null}
    </Dialog>
  );
}
