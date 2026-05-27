import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  useTheme,
  alpha,
} from "@mui/material";
import type { WorkspaceProjectCardData } from "../WorkspaceProjectCard";

interface WorkspaceStatsProps {
  workspace: WorkspaceProjectCardData;
}

function WorkspaceStats({ workspace }: WorkspaceStatsProps) {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        borderRadius: '5px',
        p: 3,
        minHeight: 240,
        maxHeight: 320,
        overflow: "hidden",
      }}
    >
      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color:
                theme.palette.mode === "dark"
                  ? theme.palette.text.primary
                  : "text.primary",
            }}
          >
            Current Progress
          </Typography>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: theme.palette.mode === "dark" ? "#fff" : "primary.main",
            }}
          >
            {workspace.currentProgress}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={workspace.currentProgress}
          sx={{
            height: 8,
            borderRadius: '5px',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            "& .MuiLinearProgress-bar": { bgcolor: "primary.main" },
          }}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color:
                theme.palette.mode === "dark"
                  ? theme.palette.text.primary
                  : "text.primary",
            }}
          >
            Estimated Progress
          </Typography>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: theme.palette.mode === "dark" ? "#fff" : "primary.main",
            }}
          >
            {workspace.estimatedProgress}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={workspace.estimatedProgress}
          sx={{
            height: 8,
            borderRadius: '5px',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            "& .MuiLinearProgress-bar": {
              bgcolor: alpha(theme.palette.primary.main, 0.6),
            },
          }}
        />
      </Box>

      <Box>
        <Typography
          sx={{
            fontSize: 12,
            color: "text.secondary",
            mb: 0.5,
          }}
        >
          Development Budget
        </Typography>
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 600,
            color:
              theme.palette.mode === "dark"
                ? theme.palette.text.primary
                : "text.primary",
          }}
        >
          {workspace.budgetLabel}
        </Typography>
      </Box>
    </Paper>
  );
}

export default WorkspaceStats;
