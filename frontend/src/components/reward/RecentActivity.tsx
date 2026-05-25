import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";

interface RecentActivityProps {
  onSeeAll?: () => void;
}

const recentItems = [
  {
    id: "item-1",
    title: "Closed design review tasks",
    subtitle: "Sprint update",
    points: "+120 pts",
  },
  {
    id: "item-2",
    title: "Redeemed team lunch",
    subtitle: "Reward used",
    points: "-500 pts",
  },
  {
    id: "item-3",
    title: "Peer recognition bonus",
    subtitle: "Kudos from product team",
    points: "+200 pts",
  },
];

export default function RecentActivity({ onSeeAll }: RecentActivityProps) {
  return (
    <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
      {recentItems.map((item, index) => (
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
            sx={{ fontSize: 12, fontWeight: 700, textTransform: "none", color: "primary.main", minWidth: 0, px: 0 }}
          >
            See all activity
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}
