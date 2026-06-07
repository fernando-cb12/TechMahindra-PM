import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import type { RewardActivity } from "../../services/rewardsService";

interface RecentActivityProps {
  onSeeAll?: () => void;
  items?: RewardActivity[];
}

const fallbackItems: RewardActivity[] = [];

export default function RecentActivity({ onSeeAll, items = fallbackItems }: RecentActivityProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const recentItems = items.map((item) => ({
    id: item.id,
    title: item.label,
    subtitle: item.detail ?? item.category,
    points: `${item.points >= 0 ? "+" : ""}${item.points.toLocaleString()} pts`,
  }));

  return (
    <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
      {recentItems.length === 0 ? (
        <Box sx={{ px: 2, py: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "text.primary" }}>
            No rewards activity yet
          </Typography>
          <Typography sx={{ fontSize: 11, color: "text.secondary", mt: 0.5 }}>
            Complete assigned tasks to start earning reward points.
          </Typography>
        </Box>
      ) : recentItems.map((item, index) => (
        <Box key={item.id} sx={{ px: 2, py: 1.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "text.primary", lineHeight: 1.2 }}>
                {item.title}
              </Typography>
              <Typography sx={{ fontSize: 11, color: "text.secondary", mt: 0.5 }}>
                {item.subtitle}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "primary.main", whiteSpace: "nowrap" }}>
              {item.points}
            </Typography>
          </Box>
          {index < recentItems.length - 1 && <Divider sx={{ mt: 1.5, borderColor: "divider" }} />}
        </Box>
      ))}
      {onSeeAll ? (
        <Box sx={{ display: "flex", justifyContent: "flex-end", px: 2, py: 1 }}>
          <Button
            onClick={onSeeAll}
            size="small"
            sx={{ fontSize: 12, fontWeight: 700, textTransform: "none", color: isDark ? "#FFFFFF" : "primary.main", minWidth: 0, px: 0 }}
          >
            See all activity
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}
