import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import RecentActivity from "./RecentActivity";

interface RewardsActivityZoneProps {
  onSeeAll?: () => void;
}

export default function RewardsActivityZone({ onSeeAll }: RewardsActivityZoneProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Typography
        sx={{ fontSize: 13, fontWeight: 700, color: "text.primary", letterSpacing: "-0.01em", mb: 1 }}
      >
        Recent activity
      </Typography>
      <RecentActivity onSeeAll={onSeeAll} />
    </Box>
  );
}
