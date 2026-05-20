import React from "react";
import { Box, Paper, Typography, Button } from "@mui/material";
import { alpha } from "@mui/material/styles";
import HistoryIcon from "@mui/icons-material/History";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import FreeBreakfastIcon from "@mui/icons-material/FreeBreakfast";

export interface CashoutItem {
  id: string;
  title: string;
  timeAgo: string;
  points: number;
  icon: React.ReactNode;
  iconBg: string;
}

const DEFAULT_CASHOUTS: CashoutItem[] = [
  {
    id: "1",
    title: "Amazon Gift Card",
    timeAgo: "1 week ago",
    points: 300,
    icon: <ShoppingBagIcon sx={{ color: "#fff", fontSize: 18 }} />,
    iconBg: "#FF9900",
  },
  {
    id: "2",
    title: "Free office Breakfast",
    timeAgo: "2 days ago",
    points: 150,
    icon: <FreeBreakfastIcon sx={{ color: "#fff", fontSize: 18 }} />,
    iconBg: "#E65100",
  },
];

interface RecentCashoutsProps {
  cashouts?: CashoutItem[];
  onViewAll?: () => void;
  onViewAllHistory?: () => void;
}

const RecentCashouts: React.FC<RecentCashoutsProps> = ({
  cashouts = DEFAULT_CASHOUTS,
  onViewAll,
  onViewAllHistory,
}) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

      {/* Earn more card */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "20px",
          background: "linear-gradient(145deg, #5F0229 0%, #3a0119 100%)",
          p: "28px 24px",
          color: "#fff",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", bgcolor: alpha("#fff", 0.05) }} />
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            bgcolor: "#EAC24F",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
          }}
        >
          <EmojiEventsIcon sx={{ color: "#fff", fontSize: 28 }} />
        </Box>
        <Typography fontWeight={700} fontSize="16px" mb={1}>
          Earn more. Unlock more.
        </Typography>
        <Typography fontSize="13px" sx={{ color: alpha("#fff", 0.75), mb: 2.5, lineHeight: 1.5 }}>
          Complete tasks, maintain streaks and climb the ranks!
        </Typography>
        <Button
          endIcon={<ArrowForwardIcon sx={{ fontSize: "14px !important" }} />}
          variant="contained"
          onClick={onViewAll}
          sx={{
            bgcolor: alpha("#fff", 0.15),
            color: "#fff",
            borderRadius: "10px",
            fontWeight: 700,
            fontSize: "13px",
            px: 2.5,
            "&:hover": { bgcolor: alpha("#fff", 0.25) },
            boxShadow: "none",
          }}
        >
          How to earn points
        </Button>
      </Paper>

      {/* Recent cashouts list */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "20px",
          border: "1px solid",
          borderColor: "grey.200",
          p: "20px 20px 16px",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <HistoryIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            <Typography fontWeight={700} fontSize="15px">
              Recent Cashouts
            </Typography>
          </Box>
          <Button
            size="small"
            onClick={onViewAll}
            sx={{ fontSize: "12px", color: "primary.main", fontWeight: 600, p: 0, minWidth: 0 }}
          >
            View All
          </Button>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {cashouts.map((item) => (
            <Box
              key={item.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1,
                borderRadius: "10px",
                "&:hover": { bgcolor: "grey.50" },
                transition: "background 0.15s",
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  bgcolor: item.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontWeight={600} fontSize="13px" noWrap>
                  {item.title}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {item.timeAgo}
                </Typography>
              </Box>
              <Typography fontWeight={700} fontSize="13px" color="text.primary" whiteSpace="nowrap">
                {item.points} pts
              </Typography>
            </Box>
          ))}
        </Box>

        <Button
          endIcon={<ArrowForwardIcon sx={{ fontSize: "14px !important" }} />}
          onClick={onViewAllHistory}
          fullWidth
          sx={{
            mt: 2,
            color: "primary.main",
            fontWeight: 700,
            fontSize: "13px",
            justifyContent: "center",
            "&:hover": { bgcolor: alpha("#5F0229", 0.05) },
          }}
        >
          View All History
        </Button>
      </Paper>
    </Box>
  );
};

export default RecentCashouts;
