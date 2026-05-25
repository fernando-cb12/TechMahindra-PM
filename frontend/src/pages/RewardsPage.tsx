import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import RewardsHero from '../components/reward/RewardsHero';
import RewardsBrowseZone from '../components/reward/RewardsBrowseZone';
import RewardsActivityZone from '../components/reward/RewardsActivityZone';
import ActivityHistoryPage from "../components/reward/ActivityHistoryPage";
import RewardRedemptionModal from "../components/reward/RewardRedemptionModal";
import type { RewardModalItem } from "../components/reward/RewardRedemptionModal";

type View = "rewards" | "history";

export default function RewardsPage() {
  const [view, setView] = useState<View>("rewards");
  const [userBalance, setUserBalance] = useState(2340);
  const [selectedReward, setSelectedReward] = useState<RewardModalItem | null>(null);

  const handleRedeem = (reward: RewardModalItem) => {
    setUserBalance((current) => Math.max(0, current - reward.cost));
  };

  if (view === "history") {
    return (
      <ActivityHistoryPage
        onBack={() => setView("rewards")}
        userBalance={2340}
      />
    );
  }

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        fontFamily: "'Montserrat', 'Roboto', sans-serif",
        fontSize: 13,
        color: 'text.primary',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2.5,
          pt: 2,
          pb: 3.5,
          display: 'flex',
          flexDirection: 'column',
          '&::-webkit-scrollbar': { width: '3px' },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'divider',
            borderRadius: '2px',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
            mb: 3,
            flexWrap: 'wrap',
          }}
        >
          <Box>
            <Typography
              sx={{
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: 700,
                fontSize: 21.5,
                color: (theme) =>
                  theme.palette.mode === 'dark'
                    ? theme.palette.text.primary
                    : theme.palette.primary.main,
                mb: 3,
              }}
            >
              Rewards
            </Typography>
          </Box>
        </Box>

        <RewardsHero
          balance={userBalance}
          earnedThisMonth={840}
          redeemedTotal={1200}
          teamRank={2}
        />

        <RewardsBrowseZone onRedeem={setSelectedReward} />

        <RewardsActivityZone onSeeAll={() => setView('history')} />
      </Box>

      <RewardRedemptionModal
        open={Boolean(selectedReward)}
        reward={selectedReward}
        userBalance={userBalance}
        onClose={() => setSelectedReward(null)}
        onRedeem={handleRedeem}
      />
    </Box>
  );
}
