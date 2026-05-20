import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import FilterListIcon from "@mui/icons-material/FilterList";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";
import RewardCard from "./RewardCard";
import type { RewardCardData } from "./RewardCard";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FreeBreakfastIcon from "@mui/icons-material/FreeBreakfast";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import SpaIcon from "@mui/icons-material/Spa";
import ComputerIcon from "@mui/icons-material/Computer";
import FlightIcon from "@mui/icons-material/Flight";
import GridOnIcon from "@mui/icons-material/GridOn";

const MORE_REWARDS: RewardCardData[] = [
  { id: "m1", title: "Netflix 1 Month", description: "Stream your favorite shows", points: 200, tag: "Popular", icon: <ComputerIcon sx={{ color: "#fff", fontSize: 28 }} />, iconBg: "#E50914" },
  { id: "m2", title: "Spa Day Pass", description: "Relax at a partner spa", points: 500, tag: "Exclusive", icon: <SpaIcon sx={{ color: "#fff", fontSize: 28 }} />, iconBg: "#7B1FA2" },
  { id: "m3", title: "Flight Upgrade", description: "Business class on your next trip", points: 1000, tag: "Plus", icon: <FlightIcon sx={{ color: "#fff", fontSize: 28 }} />, iconBg: "#0277BD" },
  { id: "m4", title: "Starbucks Gift 10$ Card", description: "Coffee and treats on us", points: 200, tag: "Trending", icon: <LocalCafeIcon sx={{ color: "#fff", fontSize: 28 }} />, iconBg: "#00704A" },
  { id: "m5", title: "Amazon Gift 15$ Card", description: "Redeem for any Amazon product", points: 300, tag: "Popular", icon: <ShoppingBagIcon sx={{ color: "#fff", fontSize: 28 }} />, iconBg: "#FF9900" },
  { id: "m6", title: "Leave Earlier Pack", description: "3 early-leave passes", points: 400, icon: <AccessTimeIcon sx={{ color: "#fff", fontSize: 28 }} />, iconBg: "#1565C0" },
  { id: "m7", title: "Free Breakfast Week", description: "7 days of free breakfast", points: 350, tag: "Trending", icon: <FreeBreakfastIcon sx={{ color: "#fff", fontSize: 28 }} />, iconBg: "#E65100" },
  { id: "m8", title: "Mystery Reward Box", description: "Surprise reward inside!", points: 250, icon: <CardGiftcardIcon sx={{ color: "#fff", fontSize: 28 }} />, iconBg: "#4A148C" },
];

const CATEGORIES = ["All Categories", "Gift Cards", "Work Perks", "Food & Drink", "Experience"];
const SORT_OPTIONS = ["Popular", "Newest", "Lowest Points", "Highest Points"];

interface MoreRewardsProps {
  rewards?: RewardCardData[];
  onSelect?: (reward: RewardCardData) => void;
}

const MoreRewards: React.FC<MoreRewardsProps> = ({
  rewards = MORE_REWARDS,
  onSelect,
}) => {
  const [category, setCategory] = useState("All Categories");
  const [sort, setSort] = useState("Popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "20px",
        border: "1px solid",
        borderColor: "grey.200",
        p: "24px 28px",
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
        <GridOnIcon sx={{ fontSize: 20, color: "text.secondary" }} />
        <Typography fontWeight={700} fontSize="18px">
          More Rewards
        </Typography>
      </Box>

      {/* Filters row */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3, flexWrap: "wrap" }}>
        {/* Filter button */}
        <Button
          startIcon={<FilterListIcon />}
          variant="outlined"
          size="small"
          sx={{
            borderRadius: "10px",
            borderColor: "grey.300",
            color: "text.primary",
            fontWeight: 600,
            fontSize: "13px",
            px: 2,
            "&:hover": { borderColor: "primary.main", bgcolor: alpha("#5F0229", 0.04) },
          }}
        >
          Filters
        </Button>

        {/* Category select */}
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          size="small"
          sx={{
            borderRadius: "10px",
            fontSize: "13px",
            minWidth: 150,
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "grey.300" },
          }}
        >
          {CATEGORIES.map((c) => (
            <MenuItem key={c} value={c} sx={{ fontSize: "13px" }}>
              {c}
            </MenuItem>
          ))}
        </Select>

        {/* Sort select */}
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          size="small"
          renderValue={(v) => `Sort by: ${v}`}
          sx={{
            borderRadius: "10px",
            fontSize: "13px",
            minWidth: 160,
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "grey.300" },
          }}
        >
          {SORT_OPTIONS.map((s) => (
            <MenuItem key={s} value={s} sx={{ fontSize: "13px" }}>
              {s}
            </MenuItem>
          ))}
        </Select>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* View toggle */}
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, v) => v && setViewMode(v)}
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              border: "1px solid",
              borderColor: "grey.300",
              borderRadius: "10px !important",
              mx: 0.25,
              width: 36,
              height: 36,
              "&.Mui-selected": {
                bgcolor: "primary.main",
                color: "#fff",
                "&:hover": { bgcolor: "primary.dark" },
              },
            },
          }}
        >
          <ToggleButton value="grid">
            <GridViewIcon sx={{ fontSize: 18 }} />
          </ToggleButton>
          <ToggleButton value="list">
            <ViewListIcon sx={{ fontSize: 18 }} />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Grid / List */}
      {viewMode === "grid" ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 2,
          }}
        >
          {rewards.map((r) => (
            <RewardCard key={r.id} reward={r} onSelect={onSelect} />
          ))}
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {rewards.map((r) => (
            <Paper
              key={r.id}
              elevation={0}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: "14px 16px",
                border: "1px solid",
                borderColor: "grey.100",
                borderRadius: "12px",
                "&:hover": { bgcolor: "grey.50" },
                transition: "background 0.15s",
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "12px",
                  bgcolor: r.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: "22px",
                }}
              >
                {r.icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontWeight={700} fontSize="14px" noWrap>{r.title}</Typography>
                <Typography variant="caption" color="text.secondary">{r.description}</Typography>
              </Box>
              <Typography fontWeight={800} fontSize="14px" whiteSpace="nowrap" mr={2}>
                {r.points} pts
              </Typography>
              <Button
                variant="contained"
                size="small"
                sx={{
                  bgcolor: "primary.main",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "12px",
                  flexShrink: 0,
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                Select
              </Button>
            </Paper>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default MoreRewards;
