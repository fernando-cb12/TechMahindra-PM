import React, { useRef } from "react";
import { Box, Typography, IconButton, Paper } from "@mui/material";
import { alpha } from "@mui/material/styles";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import RewardCard from "./RewardCard";
import type { RewardCardData } from "./RewardCard";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FreeBreakfastIcon from "@mui/icons-material/FreeBreakfast";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";

export const FEATURED_REWARDS: RewardCardData[] = [
  {
    id: "amazon-15",
    title: "Amazon Gift 15$ Card",
    description: "Redeem on Amazon.com for products",
    points: 300,
    tag: "Popular",
    icon: <ShoppingBagIcon sx={{ color: "#fff", fontSize: 28 }} />,
    iconBg: "#FF9900",
  },
  {
    id: "starbucks-10",
    title: "Starbucks Gift 10$ Card",
    description: "Enjoy your favorite coffee and treats",
    points: 200,
    tag: "Popular",
    icon: <LocalCafeIcon sx={{ color: "#fff", fontSize: 28 }} />,
    iconBg: "#00704A",
  },
  {
    id: "leave-early",
    title: "Leave earlier from work",
    description: "Leave 1 hour earlier from work",
    points: 150,
    tag: "Exclusive",
    icon: <AccessTimeIcon sx={{ color: "#fff", fontSize: 28 }} />,
    iconBg: "#1565C0",
  },
  {
    id: "free-breakfast",
    title: "Free office Breakfast",
    description: "Get a free breakfast from the office cafeteria",
    points: 150,
    tag: "Trending",
    icon: <FreeBreakfastIcon sx={{ color: "#fff", fontSize: 28 }} />,
    iconBg: "#E65100",
  },
  {
    id: "reward-bonus",
    title: "Reward Bonus Pack",
    description: "Get a bundle of exclusive perks",
    points: 400,
    tag: "Plus",
    icon: <CardGiftcardIcon sx={{ color: "#fff", fontSize: 28 }} />,
    iconBg: "#6A1B9A",
  },
];

interface FeaturedRewardsProps {
  rewards?: RewardCardData[];
  onSelect?: (reward: RewardCardData) => void;
}

const FeaturedRewards: React.FC<FeaturedRewardsProps> = ({
  rewards = FEATURED_REWARDS,
  onSelect,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -260 : 260, behavior: "smooth" });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "20px",
        border: "1px solid",
        borderColor: "grey.200",
        p: "24px 28px",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LocalFireDepartmentIcon sx={{ color: "primary.main", fontSize: 22 }} />
          <Typography fontWeight={700} fontSize="18px" color="text.primary">
            Featured Rewards
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 0.75 }}>
          {(["left", "right"] as const).map((dir) => (
            <IconButton
              key={dir}
              onClick={() => scroll(dir)}
              size="small"
              sx={{
                border: "1px solid",
                borderColor: "grey.200",
                borderRadius: "8px",
                width: 32,
                height: 32,
                "&:hover": { bgcolor: alpha("#5F0229", 0.06) },
              }}
            >
              {dir === "left" ? (
                <ChevronLeftIcon sx={{ fontSize: 18 }} />
              ) : (
                <ChevronRightIcon sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          ))}
        </Box>
      </Box>

      {/* Scroll container */}
      <Box
        ref={scrollRef}
        sx={{
          display: "flex",
          gap: 2,
          overflowX: "auto",
          pb: 1,
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {rewards.map((r) => (
          <Box key={r.id} sx={{ minWidth: 220, flex: "0 0 auto" }}>
            <RewardCard reward={r} onSelect={onSelect} />
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default FeaturedRewards;
