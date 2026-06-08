import { Button, type ButtonProps } from '@mui/material';

function WorkspaceActionPillButton({ sx, ...props }: ButtonProps) {
  return (
    <Button
      size="small"
      variant="outlined"
      {...props}
      sx={[
        {
          minHeight: 30,
          fontSize: 12,
          lineHeight: 1.2,
          '& .MuiButton-startIcon': {
            '& > *:nth-of-type(1)': { fontSize: 17 },
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    />
  );
}

export default WorkspaceActionPillButton;
