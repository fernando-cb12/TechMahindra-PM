import React from "react";
import { Box, Typography } from "@mui/material";
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

const rankSteps: RankStep[] = [
  { id: "rookie",      label: "Rookie",      isUnlocked: true,  icon: <MilitaryTechIcon /> },
  { id: "contributor", label: "Contributor", isUnlocked: true,  icon: <WorkspacePremiumIcon /> },
  { id: "performant",  label: "Performant",  isCurrent: true,   icon: <EmojiEventsIcon /> },
  { id: "expert",      label: "Expert",      pointsRequired: 3500, icon: <DiamondIcon /> },
  { id: "legend",      label: "Legend",      pointsRequired: 7500, icon: <WorkspacePremiumIcon /> },
];

const statCards: StatCardData[] = [
  { id: 'points',     label: 'Total Points', value: '12,450', icon: <PaidIcon /> },
  { id: 'tasks',      label: 'Tasks Done',   value: 156,      icon: <CheckCircleIcon /> },
  { id: 'streak',     label: 'Weekly Task',  value: 23,       icon: <CheckCircleIcon /> },
  { id: 'multiplier', label: 'Multiplier',   value: 'x1.5',   icon: <BoltIcon />, highlight: true   },
];

const badges: BadgeData[] = [
  { id: "primero",     name: "Primero",     subtitle: "First Solve",    icon: <EmojiEventsIcon />, status: "earned", color: "warning", accentColor: "warning" },
  { id: "preciso",     name: "Preciso",     subtitle: "99% Accuracy",   icon: <WorkspacePremiumIcon />, status: "earned", color: "info", accentColor: "info" },
  { id: "rapido",      name: "Rápido",      subtitle: "Speed King",     icon: <BoltIcon />, status: "earned", color: "primary", accentColor: "primary" },
  { id: "mentor",      name: "Mentor",      subtitle: "Team Player",    icon: <FavoriteIcon />, status: "earned", color: "error", accentColor: "error" },
  { id: "bug-hunter",  name: "Bug Hunter",  subtitle: "Find 50 bugs",   icon: <BugReportIcon />, status: "locked" },
  { id: "sprint-king", name: "Sprint King", subtitle: "Win a sprint",   icon: <DirectionsRunIcon />, status: "locked" },
  { id: "architect",   name: "Architect",   subtitle: "Design a system",icon: <ArchitectureIcon />, status: "locked" },
  { id: "lead-spirit", name: "Lead Spirit", subtitle: "Lead a team",    icon: <GroupsIcon />, status: "locked" },
];

// ── Page ──────────────────────────────────────────────────────────

const CareerPage: React.FC = () => {
  const [sort, setSort] = React.useState('recent');

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
      {/* ── Page header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
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
            Career
          </Typography>
        </Box>

        <GoToRewardsButton />
      </Box>

      <RankTimeline
        rankProgress={82}
        currentXP={4250}
        maxXP={5000}
        steps={rankSteps}
      />

      <StatCards cards={statCards} />

      <BadgeGallery
        badges={badges}
        earned={4}
        total={32}
        sortValue={sort}
        onSortChange={setSort}
      />
    </Box>
  );
};

export default CareerPage;
