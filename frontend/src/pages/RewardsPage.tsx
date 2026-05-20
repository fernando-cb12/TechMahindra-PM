import React, { useState } from "react";
import { Box, Typography, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { alpha } from "@mui/material/styles";
import BalanceCard from "../components/reward/BalanceCard";
import FeaturedRewards from "../components/reward/FeaturedRewards";
import RecentCashouts from "../components/reward/RecentCashouts";
import MoreRewards from "../components/reward/MoreRewards";
import type { RewardCardData } from "../components/reward/RewardCard";

type TabValue = "all" | "benefits" | "giftcards";

const RewardsPage: React.FC = () => {
  const [tab, setTab] = useState<TabValue>("all");

  const handleSelect = (reward: RewardCardData) => {
    console.log("Redeemed:", reward);
    // hook up to your API here
  };

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 3,
        p: 3,
        bgcolor: 'background.default',
        minHeight: '100vh',
      }}
    >
      {/* ── Left / Main column ── */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        {/* Page header + tabs */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              fontWeight={700}
              color="text.primary"
              letterSpacing="-0.5px"
            >
              Cashout Options
            </Typography>
          </Box>

          <ToggleButtonGroup
            value={tab}
            exclusive
            onChange={(_, v) => v && setTab(v)}
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'grey.200',
              borderRadius: '12px',
              p: '4px',
              gap: '4px',
              '& .MuiToggleButtonGroup-grouped': {
                border: 'none !important',
                borderRadius: '8px !important',
              },
              '& .MuiToggleButton-root': {
                px: 2.5,
                py: 0.75,
                fontSize: '13px',
                fontWeight: 600,
                color: 'text.secondary',
                textTransform: 'none',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: '#fff',
                  '&:hover': { bgcolor: 'primary.dark' },
                },
                '&:hover': { bgcolor: alpha('#5F0229', 0.06) },
              },
            }}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="benefits">Benefits</ToggleButton>
            <ToggleButton value="giftcards">Gift Cards</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Balance banner */}
        <BalanceCard
          points={250}
          pointsToNextTier={750}
          tierMax={1000}
          onViewBenefits={() => setTab('benefits')}
        />

        {/* Featured rewards */}
        <FeaturedRewards onSelect={handleSelect} />

        {/* More rewards grid */}
        <MoreRewards onSelect={handleSelect} />
      </Box>

      {/* ── Right column ── */}
      <Box sx={{ width: 300, flexShrink: 0 }}>
        <RecentCashouts
          onViewAll={() => console.log('view all')}
          onViewAllHistory={() => console.log('view all history')}
        />
      </Box>
    </Box>
  );
};

export default RewardsPage;
