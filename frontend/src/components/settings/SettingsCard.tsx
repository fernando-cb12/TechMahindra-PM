import { Paper, type PaperProps } from '@mui/material';

type SettingsCardProps = PaperProps;

function SettingsCard({ children, sx, ...props }: SettingsCardProps) {
  return (
    <Paper
      elevation={0}
      {...props}
      sx={{
        borderRadius: '5px',
        bgcolor: '#fff',
        overflow: 'hidden',
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}

export { SettingsCard };
