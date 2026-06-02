import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import { useTheme } from "@mui/material/styles";
import RewardCard from "./RewardCard";
import type { RewardModalItem } from "./RewardRedemptionModal";
import type { RewardItem } from "../../services/rewardsService";

const TABS = ["All", "Time off", "Perks", "Tools", "Team"] as const;
type Tab = (typeof TABS)[number];

const SORT_OPTIONS = ["Cost: Low to high", "Cost: High to low", "Newest"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

interface RewardsBrowseZoneProps {
  onRedeem?: (reward: RewardModalItem) => void;
  rewards?: RewardItem[];
}

function iconForCategory(category: string) {
  switch (category) {
    case "time_off":
      return <WbSunnyOutlinedIcon sx={{ fontSize: 18 }} />;
    case "tools":
      return <BuildOutlinedIcon sx={{ fontSize: 18 }} />;
    case "team":
      return <GroupsOutlinedIcon sx={{ fontSize: 18 }} />;
    case "perks":
      return <SchoolOutlinedIcon sx={{ fontSize: 18 }} />;
    default:
      return <CardGiftcardOutlinedIcon sx={{ fontSize: 18 }} />;
  }
}

function tabMatchesReward(tab: Tab, reward: RewardModalItem & { category?: string }) {
  if (tab === "All") return true;
  if (tab === "Time off") return reward.category === "time_off";
  if (tab === "Perks") return reward.category === "perks";
  if (tab === "Tools") return reward.category === "tools";
  if (tab === "Team") return reward.category === "team";
  return true;
}

export default function RewardsBrowseZone({ onRedeem, rewards = [] }: RewardsBrowseZoneProps) {
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("Cost: Low to high");
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const rewardItems = rewards
    .map((reward) => ({
      id: reward.id,
      icon: reward.category === "time_off" && reward.name.toLowerCase().includes("day")
        ? <CalendarMonthOutlinedIcon sx={{ fontSize: 18 }} />
        : iconForCategory(reward.category),
      iconVariant: reward.iconVariant,
      name: reward.name,
      description: reward.description,
      meta: reward.meta ?? undefined,
      cost: reward.cost,
      badge: reward.badge ?? undefined,
      category: reward.category,
    }))
    .filter((reward) => tabMatchesReward(activeTab, reward))
    .sort((a, b) => {
      if (sortBy === "Cost: High to low") return b.cost - a.cost;
      if (sortBy === "Newest") return Number(b.id) - Number(a.id);
      return a.cost - b.cost;
    });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.primary", letterSpacing: "-0.01em" }}>
          Browse rewards
        </Typography>

        <Typography
          tabIndex={0}
          role="button"
          sx={{
            fontSize: 11.5,
            color: "primary.main",
            fontWeight: 600,
            cursor: "pointer",
            opacity: 0.8,
            transition: "opacity 0.12s",
            "&:hover": { opacity: 1 },
          }}
        >
          Suggest a reward
        </Typography>
      </Box>

      <Box
        role="toolbar"
        aria-label="Filter and sort rewards"
        sx={{
          bgcolor: "background.paper",
          border: "0.5px solid",
          borderColor: "divider",
          borderRadius: "9px",
          px: 0.5,
          py: 0.5,
          display: "flex",
          alignItems: "center",
          gap: 0.125,
          mb: 1.25,
        }}
      >
        {TABS.map((tab) => (
          <Box
            key={tab}
            component="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: "6px",
              fontSize: 12,
              fontWeight: activeTab === tab ? 700 : 400,
              color: activeTab === tab ? "#fff" : "text.secondary",
              bgcolor: activeTab === tab ? "primary.main" : "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              lineHeight: 1.5,
              transition: "background 0.1s, color 0.1s",
              whiteSpace: "nowrap",
              "&:hover": activeTab !== tab
                ? { bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#F2F3F5", color: "text.primary" }
                : {},
            }}
          >
            {tab}
          </Box>
        ))}

        <Box sx={{ ml: "auto", position: "relative" }}>
          <Box
            component="button"
            aria-label="Sort rewards"
            aria-expanded={sortOpen}
            onClick={() => setSortOpen((open) => !open)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              px: 1,
              py: 0.5,
              borderRadius: "6px",
              border: "0.5px solid",
              borderColor: sortOpen ? (isDark ? "rgba(255,255,255,0.2)" : "#C8C8C8") : "divider",
              bgcolor: sortOpen
                ? isDark ? "rgba(255,255,255,0.07)" : "#F2F3F5"
                : isDark ? "rgba(255,255,255,0.03)" : "#F7F7F7",
              fontSize: 11.5,
              color: "text.secondary",
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 500,
              transition: "all 0.1s",
              whiteSpace: "nowrap",
              "&:hover": { borderColor: isDark ? "rgba(255,255,255,0.18)" : "#B3B3B3", color: "text.primary" },
            }}
          >
            <UnfoldMoreIcon sx={{ fontSize: 13 }} />
            {sortBy.split(":")[0]}
          </Box>

          {sortOpen && (
            <Box
              sx={{
                position: "absolute",
                top: "calc(100% + 4px)",
                right: 0,
                bgcolor: "background.paper",
                border: "0.5px solid",
                borderColor: isDark ? "rgba(255,255,255,0.12)" : "#D9D9D9",
                borderRadius: "8px",
                py: 0.5,
                zIndex: 10,
                minWidth: 170,
                boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.5)" : "0 4px 16px rgba(0,0,0,0.1)",
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <Box
                  key={option}
                  component="button"
                  onClick={() => {
                    setSortBy(option);
                    setSortOpen(false);
                  }}
                  sx={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    px: 1.5,
                    py: 0.75,
                    fontSize: 12,
                    fontWeight: option === sortBy ? 700 : 400,
                    color: option === sortBy ? "primary.main" : "text.primary",
                    bgcolor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "background 0.1s",
                    "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#F7F7F7" },
                  }}
                >
                  {option}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      <Box
        component="section"
        aria-label="Available rewards"
        sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px" }}
      >
        {rewardItems.length === 0 ? (
          <Box
            sx={{
              gridColumn: "1 / -1",
              bgcolor: "background.paper",
              border: "0.5px solid",
              borderColor: "divider",
              borderRadius: "10px",
              px: 2,
              py: 2,
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.primary" }}>
              No rewards available
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: "text.secondary", mt: 0.5 }}>
              Try another category or check back later.
            </Typography>
          </Box>
        ) : rewardItems.map((reward) => (
          <RewardCard
            key={reward.id}
            icon={reward.icon}
            iconVariant={reward.iconVariant}
            name={reward.name}
            description={reward.description}
            meta={reward.meta}
            cost={reward.cost}
            badge={reward.badge}
            featured={reward.badge === "popular"}
            onRedeem={() => onRedeem?.(reward)}
          />
        ))}
      </Box>
    </Box>
  );
}
