import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import RewardsHero from '../components/reward/RewardsHero';
import RewardsBrowseZone from '../components/reward/RewardsBrowseZone';
import RewardsActivityZone from '../components/reward/RewardsActivityZone';
import ActivityHistoryPage from "../components/reward/ActivityHistoryPage";
import RewardRedemptionModal from "../components/reward/RewardRedemptionModal";
import type { RewardModalItem } from "../components/reward/RewardRedemptionModal";
import { getRewardActivity, getRewardsPage, redeemReward, type RewardActivity, type RewardsPageData } from "../services/rewardsService";
import { showAppError } from "../components/shared/appNotifications";

type View = "rewards" | "history";

export default function RewardsPage() {
  const [view, setView] = useState<View>("rewards");
  const [data, setData] = useState<RewardsPageData | null>(null);
  const [activity, setActivity] = useState<RewardActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<RewardModalItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getRewardsPage(), getRewardActivity()])
      .then(([pageData, history]) => {
        if (cancelled) return;
        setData(pageData);
        setActivity(history);
      })
      .catch((error) => showAppError(error, "Unable to load rewards"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRedeem = async (reward: RewardModalItem) => {
    const response = await redeemReward(String(reward.id));
    setData((current) => current
      ? {
          ...current,
          balance: response.balance,
          redeemedTotal: current.redeemedTotal + reward.cost,
          recentActivity: [response.activity, ...current.recentActivity].slice(0, 3),
        }
      : current);
    setActivity((current) => [response.activity, ...current]);
  };

  if (view === "history") {
    return (
      <ActivityHistoryPage
        onBack={() => setView("rewards")}
        userBalance={data?.balance ?? 0}
        activities={activity}
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

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
            <RewardsHero
              balance={data?.balance ?? 0}
              earnedThisMonth={data?.earnedThisMonth ?? 0}
              redeemedTotal={data?.redeemedTotal ?? 0}
              teamRank={data?.teamRank ?? 1}
            />

            <RewardsBrowseZone rewards={data?.rewards ?? []} onRedeem={setSelectedReward} />

            <RewardsActivityZone items={data?.recentActivity ?? []} onSeeAll={() => setView('history')} />
          </>
        )}
      </Box>

      <RewardRedemptionModal
        open={Boolean(selectedReward)}
        reward={selectedReward}
        userBalance={data?.balance ?? 0}
        onClose={() => setSelectedReward(null)}
        onRedeem={handleRedeem}
      />
    </Box>
  );
}
