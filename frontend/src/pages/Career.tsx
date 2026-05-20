import React from "react";
import { Box, Typography } from "@mui/material";
import RankTimeline, { type RankStep } from '../components/career/RankTimeline';
import StatCards, { type StatCardData } from '../components/career/StatsCard';
import BadgeGallery, { type BadgeData } from '../components/career/Badges';
import GoToRewardsButton from '../components/reward/GoToRewardsButton';

// ── Sample data ───────────────────────────────────────────────────

const rankSteps: RankStep[] = [
  { id: "rookie",      label: "Rookie",      isUnlocked: true,  icon: "🥉" },
  { id: "contributor", label: "Contributor", isUnlocked: true,  icon: "🥈" },
  { id: "performant",  label: "Performant",  isCurrent: true,   icon: "👑" },
  { id: "expert",      label: "Expert",      pointsRequired: 3500, icon: "💎" },
  { id: "legend",      label: "Legend",      pointsRequired: 7500, icon: "🔷" },
];

const statCards: StatCardData[] = [
  { id: 'points',     label: 'Total Points', value: '12,450', icon: '🪙', iconBg: '#e8f4ff' },
  { id: 'tasks',      label: 'Tasks Done',   value: 156,      icon: '✅', iconBg: '#eafaf1' },
  { id: 'streak',     label: 'Weekly Task',  value: 23,       icon: '✅', iconBg: '#fff4e6' },
  { id: 'multiplier', label: 'Multiplier',   value: 'x1.5',   icon: '⚡', highlight: true   },
];

const badges: BadgeData[] = [
  { id: "primero",     name: "Primero",     subtitle: "First Solve",    icon: "🏆", status: "earned", color: "#ffe8cc", accentColor: "#e07b00" },
  { id: "preciso",     name: "Preciso",     subtitle: "99% Accuracy",   icon: "🎯", status: "earned", color: "#cce8ff", accentColor: "#0072e5" },
  { id: "rapido",      name: "Rápido",      subtitle: "Speed King",     icon: "⚡", status: "earned", color: "#e8e4ff", accentColor: "#7c3aed" },
  { id: "mentor",      name: "Mentor",      subtitle: "Team Player",    icon: "💖", status: "earned", color: "#ffd6d6", accentColor: "#d63384" },
  { id: "bug-hunter",  name: "Bug Hunter",  subtitle: "Find 50 bugs",   icon: "🐛", status: "locked" },
  { id: "sprint-king", name: "Sprint King", subtitle: "Win a sprint",   icon: "🏃", status: "locked" },
  { id: "architect",   name: "Architect",   subtitle: "Design a system",icon: "🏗️", status: "locked" },
  { id: "lead-spirit", name: "Lead Spirit", subtitle: "Lead a team",    icon: "🌟", status: "locked" },
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
            variant="h5"
            fontWeight={700}
            color="text.primary"
            letterSpacing="-0.5px"
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
