import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import ArchitectureIcon from '@mui/icons-material/Architecture';
import BoltIcon from '@mui/icons-material/Bolt';
import BugReportIcon from '@mui/icons-material/BugReport';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DiamondIcon from '@mui/icons-material/Diamond';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FavoriteIcon from '@mui/icons-material/Favorite';
import GroupsIcon from '@mui/icons-material/Groups';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import PaidIcon from '@mui/icons-material/Paid';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import RankTimeline, { type RankStep } from '../components/career/RankTimeline';
import StatCards, { type StatCardData } from '../components/career/StatsCard';
import BadgeGallery, { type BadgeData } from '../components/career/Badges';
import GoToRewardsButton from '../components/reward/GoToRewardButton';
import { showAppError } from "../components/shared/appNotifications";
import { getCareerPage, type CareerPageData } from "../services/careerService";

const rankIcons = [<MilitaryTechIcon />, <WorkspacePremiumIcon />, <EmojiEventsIcon />, <DiamondIcon />, <WorkspacePremiumIcon />];

function iconForStat(id: string) {
  switch (id) {
    case "points":
      return <PaidIcon />;
    case "multiplier":
      return <BoltIcon />;
    default:
      return <CheckCircleIcon />;
  }
}

function iconForBadge(icon?: string) {
  switch (icon) {
    case "workspace_premium":
      return <WorkspacePremiumIcon />;
    case "bolt":
      return <BoltIcon />;
    case "favorite":
      return <FavoriteIcon />;
    case "bug_report":
      return <BugReportIcon />;
    case "directions_run":
      return <DirectionsRunIcon />;
    case "architecture":
      return <ArchitectureIcon />;
    case "groups":
      return <GroupsIcon />;
    default:
      return <EmojiEventsIcon />;
  }
}

const CareerPage: React.FC = () => {
  const [sort, setSort] = React.useState('recent');
  const [data, setData] = useState<CareerPageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getCareerPage()
      .then((pageData) => {
        if (!cancelled) setData(pageData);
      })
      .catch((error) => showAppError(error, "Unable to load career data"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rankSteps: RankStep[] = (data?.ranks ?? []).map((rank, index) => ({
    id: rank.id,
    label: rank.label,
    pointsRequired: rank.pointsRequired,
    isCurrent: rank.current,
    isUnlocked: rank.unlocked,
    icon: rankIcons[index] ?? <WorkspacePremiumIcon />,
  }));

  const statCards: StatCardData[] = (data?.stats ?? []).map((stat) => ({
    id: stat.id,
    label: stat.label,
    value: stat.value,
    icon: iconForStat(stat.id),
    highlight: stat.highlight,
  }));

  const badges: BadgeData[] = (data?.badges ?? []).map((badge, index) => ({
    id: badge.id,
    name: badge.name,
    subtitle: badge.subtitle,
    description: badge.description,
    earnedDate: badge.earnedDate ?? undefined,
    icon: iconForBadge(badge.icon),
    status: badge.status,
    color: index % 4 === 0 ? "warning" : index % 4 === 1 ? "info" : index % 4 === 2 ? "primary" : "error",
    accentColor: index % 4 === 0 ? "warning" : index % 4 === 1 ? "info" : index % 4 === 2 ? "primary" : "error",
  }));

  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
        p: 3,
        bgcolor: theme.palette.background.default,
        minHeight: '100vh',
        transition: 'background-color 0.2s ease',
      })}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h2" data-page-title="true">
            Career
          </Typography>
          <Typography
            sx={{
              mt: 0.2,
              color: (theme) =>
                theme.palette.mode === 'dark'
                  ? theme.palette.text.primary
                  : theme.palette.primary.main,
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            Track your growth, rewards progress, and earned badges in one place.
          </Typography>
        </Box>

        <GoToRewardsButton />
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <>
          <RankTimeline
            rankProgress={data?.rankProgress ?? 0}
            currentXP={data?.currentXp ?? 0}
            maxXP={data?.maxXp ?? 1}
            steps={rankSteps}
          />

          <StatCards cards={statCards} />

          <BadgeGallery
            badges={badges}
            earned={data?.earnedBadges ?? 0}
            total={data?.totalBadges ?? badges.length}
            sortValue={sort}
            onSortChange={setSort}
          />
        </>
      )}
    </Box>
  );
};

export default CareerPage;
