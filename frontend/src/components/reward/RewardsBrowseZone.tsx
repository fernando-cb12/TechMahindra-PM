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

const TABS = ["All", "Time off", "Perks", "Tools", "Team"] as const;
type Tab = (typeof TABS)[number];

const SORT_OPTIONS = ["Cost: Low to high", "Cost: High to low", "Newest"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

interface RewardsBrowseZoneProps {
  onRedeem?: (reward: RewardModalItem) => void;
}

export default function RewardsBrowseZone({ onRedeem }: RewardsBrowseZoneProps) {
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("Cost: Low to high");
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const rewardItems: RewardModalItem[] = [
    {
      id: "half-day-off",
      icon: <WbSunnyOutlinedIcon sx={{ fontSize: 18 }} />,
      iconVariant: "crimson",
      name: "Half-day off",
      description: "Take a well-earned afternoon away from the desk.",
      meta: "Routed directly to HR",
      cost: 800,
      badge: "popular",
    },
    {
      id: "learning-budget",
      icon: <SchoolOutlinedIcon sx={{ fontSize: 18 }} />,
      iconVariant: "blue",
      name: "Learning budget",
      description: "Add $100 to your L&D fund for any approved course or resource.",
      meta: "One-time per quarter",
      cost: 1200,
      badge: "new",
    },
    {
      id: "premium-tool-access",
      icon: <BuildOutlinedIcon sx={{ fontSize: 18 }} />,
      iconVariant: "green",
      name: "Premium tool access",
      description: "Unlock any premium integration in your workspace.",
      meta: "30-day access",
      cost: 600,
      badge: "limited",
    },
    {
      id: "team-lunch",
      icon: <GroupsOutlinedIcon sx={{ fontSize: 18 }} />,
      iconVariant: "amber",
      name: "Team lunch",
      description: "Organize a lunch for your squad — covered up to 5 people.",
      meta: "Expense claim included",
      cost: 500,
    },
    {
      id: "full-day-off",
      icon: <CalendarMonthOutlinedIcon sx={{ fontSize: 18 }} />,
      iconVariant: "grey",
      name: "Full day off",
      description: "A complete day away. Submitted automatically to HR.",
      cost: 0,
    },
    {
      id: "merch-credit",
      icon: <CardGiftcardOutlinedIcon sx={{ fontSize: 18 }} />,
      iconVariant: "crimson",
      name: "Merch credit",
      description: "Redeem against the company store — hoodies, gear, and more.",
      meta: "Ships within 5 days",
      cost: 400,
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", mb: 2 }}>

      {/* Section header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
          <Typography
            sx={{ fontSize: 13, fontWeight: 700, color: "text.primary", letterSpacing: "-0.01em" }}
          >
            Browse rewards
          </Typography>
        </Box>

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

      {/* Filter + sort bar */}
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
              "&:hover":
                activeTab !== tab
                  ? { bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#F2F3F5", color: "text.primary" }
                  : {},
            }}
          >
            {tab}
          </Box>
        ))}

        {/* Right side sort */}
        <Box sx={{ ml: "auto", position: "relative" }}>
          <Box
            component="button"
            aria-label="Sort rewards"
            aria-expanded={sortOpen}
            onClick={() => setSortOpen((o) => !o)}
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

          {/* Dropdown */}
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
                boxShadow: isDark
                  ? "0 4px 16px rgba(0,0,0,0.5)"
                  : "0 4px 16px rgba(0,0,0,0.1)",
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <Box
                  key={opt}
                  component="button"
                  onClick={() => { setSortBy(opt); setSortOpen(false); }}
                  sx={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    px: 1.5,
                    py: 0.75,
                    fontSize: 12,
                    fontWeight: opt === sortBy ? 700 : 400,
                    color: opt === sortBy ? "primary.main" : "text.primary",
                    bgcolor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "background 0.1s",
                    "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#F7F7F7" },
                  }}
                >
                  {opt}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Cards grid */}
      <Box
        component="section"
        aria-label="Available rewards"
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "8px",
        }}
      >
        {rewardItems.map((reward) => (
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
