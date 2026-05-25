import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import RecentActivity from "./RecentActivity";

interface RewardsActivityZoneProps {
  onSeeAll?: () => void;
}

export default function RewardsActivityZone({ onSeeAll }: RewardsActivityZoneProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography
          sx={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 15,
            fontWeight: 700,
            color: "text.primary",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          Recent activity
        </Typography>
      </Box>

      <RecentActivity onSeeAll={onSeeAll} />
    </Box>
  );
}
