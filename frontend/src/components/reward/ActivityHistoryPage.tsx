import { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BoltIcon from "@mui/icons-material/Bolt";
import SearchIcon from "@mui/icons-material/Search";
import CheckBoxOutlinedIcon from "@mui/icons-material/CheckBoxOutlined";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import type { ReactNode } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────

type ActivityCategory = "task" | "milestone" | "peer" | "streak" | "redemption" | "badge";

interface ActivityEntry {
  id: string;
  type: "earned" | "spent";
  category: ActivityCategory;
  label: string;
  detail?: string;
  points: number;
  date: string;     // ISO-ish display string
  dateGroup: string; // Used for grouping header
}

const HISTORY: ActivityEntry[] = [
  // Today
  { id: "a1",  type: "earned",  category: "task",       label: "Closed 3 tasks ahead of deadline", detail: "Sprint goals",         points: 120,  date: "Today, 10:42 AM",    dateGroup: "Today" },
  { id: "a2",  type: "earned",  category: "peer",       label: "Team contribution bonus",           detail: "Peer recognition",     points: 200,  date: "Today, 9:15 AM",     dateGroup: "Today" },
  // Yesterday
  { id: "a3",  type: "earned",  category: "streak",     label: "Weekly delivery streak",            detail: "4 weeks in a row",     points: 75,   date: "Yesterday, 6:00 PM", dateGroup: "Yesterday" },
  { id: "a4",  type: "earned",  category: "task",       label: "On-time delivery — Auth refactor",  detail: "Sprint completion",    points: 80,   date: "Yesterday, 2:30 PM", dateGroup: "Yesterday" },
  // May 20
  { id: "a5",  type: "spent",   category: "redemption", label: "Redeemed: Team lunch",              detail: "Reward used",          points: -500, date: "May 20, 1:17 PM",    dateGroup: "May 20" },
  { id: "a6",  type: "earned",  category: "peer",       label: "Kudos from Martina R.",             detail: "Code review help",     points: 50,   date: "May 20, 11:05 AM",   dateGroup: "May 20" },
  // May 18
  { id: "a7",  type: "earned",  category: "milestone",  label: "Goal completed — Q2 shipping",      detail: "Milestone hit",        points: 350,  date: "May 18, 5:00 PM",    dateGroup: "May 18" },
  { id: "a8",  type: "earned",  category: "badge",      label: "Badge unlocked: Speed King",        detail: "First solo sprint",    points: 100,  date: "May 18, 5:00 PM",    dateGroup: "May 18" },
  { id: "a9",  type: "earned",  category: "task",       label: "Completed 5 tasks this week",       detail: "Sprint wrap-up",       points: 60,   date: "May 18, 3:22 PM",    dateGroup: "May 18" },
  // May 15
  { id: "a10", type: "earned",  category: "streak",     label: "Weekly delivery streak",            detail: "3 weeks in a row",     points: 75,   date: "May 15, 6:00 PM",    dateGroup: "May 15" },
  { id: "a11", type: "spent",   category: "redemption", label: "Redeemed: Learning budget",         detail: "Reward used",          points: -1200,date: "May 15, 11:30 AM",   dateGroup: "May 15" },
  // May 10
  { id: "a12", type: "earned",  category: "milestone",  label: "Delivered API v2 on schedule",      detail: "Project milestone",    points: 250,  date: "May 10, 4:00 PM",    dateGroup: "May 10" },
  { id: "a13", type: "earned",  category: "task",       label: "Closed sprint with 0 carry-over",   detail: "Sprint goal",          points: 80,   date: "May 10, 2:15 PM",    dateGroup: "May 10" },
];

// ─── Category meta ────────────────────────────────────────────────────────────

const catMeta: Record<ActivityCategory, {
  label: string;
  icon: ReactNode;
  bg: string;
  darkBg: string;
  color: string;
}> = {
  task:       { label: "Task",        icon: <CheckBoxOutlinedIcon sx={{ fontSize: 13 }} />,              bg: "#FBF0F3", darkBg: "rgba(163,51,77,0.15)",   color: "#5F0229" },
  milestone:  { label: "Milestone",   icon: <GpsFixedIcon sx={{ fontSize: 13 }} />,                      bg: "#EAF3DE", darkBg: "rgba(39,80,10,0.15)",    color: "#27500A" },
  peer:       { label: "Peer",        icon: <GroupsOutlinedIcon sx={{ fontSize: 13 }} />,                bg: "#FAEEDA", darkBg: "rgba(99,56,6,0.15)",     color: "#633806" },
  streak:     { label: "Streak",      icon: <LocalFireDepartmentOutlinedIcon sx={{ fontSize: 13 }} />,   bg: "#E6F1FB", darkBg: "rgba(12,68,124,0.15)",   color: "#0C447C" },
  redemption: { label: "Redemption",  icon: <CardGiftcardOutlinedIcon sx={{ fontSize: 13 }} />,          bg: "#F2F3F5", darkBg: "rgba(179,179,179,0.12)", color: "#7C7C7C" },
  badge:      { label: "Badge",       icon: <EmojiEventsOutlinedIcon sx={{ fontSize: 13 }} />,           bg: "#FBF0F3", darkBg: "rgba(163,51,77,0.15)",   color: "#A3334D" },
};

const FILTER_TABS = ["All", "Earned", "Redeemed"] as const;
const CAT_FILTERS: { label: string; value: ActivityCategory | "all" }[] = [
  { label: "All types",   value: "all" },
  { label: "Tasks",       value: "task" },
  { label: "Milestones",  value: "milestone" },
  { label: "Peer",        value: "peer" },
  { label: "Streaks",     value: "streak" },
  { label: "Redemptions", value: "redemption" },
  { label: "Badges",      value: "badge" },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function TabButton({
  active,
  children,
  onClick,
  isDark,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  isDark: boolean;
}) {
  return (
    <Box
      component="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      sx={{
        px: 1.5,
        py: 0.5,
        borderRadius: "6px",
        fontSize: 12,
        fontWeight: active ? 700 : 400,
        color: active ? "#fff" : "text.secondary",
        bgcolor: active ? "primary.main" : "transparent",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        lineHeight: 1.5,
        transition: "all 0.1s",
        whiteSpace: "nowrap",
        "&:hover": active
          ? {}
          : { bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#F2F3F5", color: "text.primary" },
      }}
    >
      {children}
    </Box>
  );
}

function CatChip({
  active,
  children,
  onClick,
  isDark,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  isDark: boolean;
}) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        px: 1.125,
        py: "3px",
        borderRadius: "6px",
        fontSize: 11,
        fontWeight: active ? 700 : 400,
        border: "0.5px solid",
        borderColor: active
          ? isDark ? "rgba(95,2,41,0.5)" : "rgba(95,2,41,0.25)"
          : "divider",
        bgcolor: active
          ? isDark ? "rgba(95,2,41,0.15)" : "rgba(95,2,41,0.06)"
          : "transparent",
        color: active ? "primary.main" : "text.secondary",
        cursor: "pointer",
        fontFamily: "inherit",
        whiteSpace: "nowrap",
        transition: "all 0.1s",
        "&:hover": active
          ? {}
          : {
              borderColor: isDark ? "rgba(255,255,255,0.15)" : "#C8C8C8",
              color: "text.primary",
            },
      }}
    >
      {children}
    </Box>
  );
}

function ActivityRow({ entry, isDark, isLast }: { entry: ActivityEntry; isDark: boolean; isLast: boolean }) {
  const cat = catMeta[entry.category];
  const isEarned = entry.type === "earned";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.375,
        px: 1.75,
        py: 1,
        borderBottom: isLast ? "none" : "0.5px solid",
        borderColor: isDark ? "rgba(255,255,255,0.05)" : "#F0F0F0",
        transition: "background 0.1s",
        "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#FAFAFA" },
      }}
    >
      {/* Category icon */}
      <Box
        aria-hidden="true"
        sx={{
          width: 28,
          height: 28,
          borderRadius: "7px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: isDark ? cat.darkBg : cat.bg,
          color: cat.color,
          flexShrink: 0,
        }}
      >
        {cat.icon}
      </Box>

      {/* Label + detail */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 500,
            color: "text.primary",
            lineHeight: 1.3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {entry.label}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: "1px" }}>
          <Typography sx={{ fontSize: 10.5, color: "text.disabled" }}>
            {entry.date}
          </Typography>
          {entry.detail && (
            <>
              <Box
                aria-hidden="true"
                sx={{ width: 2, height: 2, borderRadius: "50%", bgcolor: "text.disabled", opacity: 0.4 }}
              />
              <Typography sx={{ fontSize: 10.5, color: "text.disabled" }}>
                {entry.detail}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      {/* Category chip */}
      <Box
        sx={{
          display: { xs: "none", sm: "flex" },
          px: 0.875,
          py: "2px",
          borderRadius: "5px",
          fontSize: 10,
          fontWeight: 600,
          bgcolor: isDark ? cat.darkBg : cat.bg,
          color: cat.color,
          letterSpacing: "0.02em",
          flexShrink: 0,
        }}
      >
        {cat.label}
      </Box>

      {/* Points delta */}
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.25, flexShrink: 0, minWidth: 64, justifyContent: "flex-end" }}>
        <Typography component="span" sx={{ fontSize: 11, color: "text.disabled", mr: "1px" }}>
          {isEarned ? "+" : "−"}
        </Typography>
        <BoltIcon
          sx={{
            fontSize: 11,
            color: isEarned ? "success.main" : "primary.light",
            mb: "-1px",
            opacity: 0.8,
          }}
        />
        <Typography
          component="span"
          sx={{
            fontSize: 13,
            fontWeight: 800,
            color: isEarned
              ? isDark ? "#6FCF74" : "#347D39"
              : isDark ? "primary.light" : "#A3334D",
            letterSpacing: "-0.025em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {Math.abs(entry.points).toLocaleString()}
        </Typography>
        <Typography component="span" sx={{ fontSize: 10, color: "text.disabled", ml: "2px" }}>
          pts
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

interface ActivityHistoryPageProps {
  onBack?: () => void;
  userBalance?: number;
}

export default function ActivityHistoryPage({ onBack, userBalance = 2340 }: ActivityHistoryPageProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [typeFilter, setTypeFilter] = useState<(typeof FILTER_TABS)[number]>("All");
  const [catFilter, setCatFilter] = useState<ActivityCategory | "all">("all");
  const [search, setSearch] = useState("");

  // Derived totals
  const totalEarned = HISTORY.filter((e) => e.type === "earned").reduce((s, e) => s + e.points, 0);
  const totalSpent = Math.abs(HISTORY.filter((e) => e.type === "spent").reduce((s, e) => s + e.points, 0));

  // Filtered list
  const filtered = useMemo(() => {
    return HISTORY.filter((e) => {
      if (typeFilter === "Earned" && e.type !== "earned") return false;
      if (typeFilter === "Redeemed" && e.type !== "spent") return false;
      if (catFilter !== "all" && e.category !== catFilter) return false;
      if (search && !e.label.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [typeFilter, catFilter, search]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, ActivityEntry[]>();
    for (const entry of filtered) {
      if (!map.has(entry.dateGroup)) map.set(entry.dateGroup, []);
      map.get(entry.dateGroup)!.push(entry);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Montserrat', 'Roboto', sans-serif",
        color: "text.primary",
      }}
    >
      {/* ── Top bar ── */}
      <Box
        sx={{
          bgcolor: "background.paper",
          borderBottom: "0.5px solid",
          borderColor: "divider",
          height: 42,
          px: 2.5,
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexShrink: 0,
        }}
      >
        {/* Back */}
        <Box
          component="button"
          aria-label="Back to Rewards"
          onClick={onBack}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            px: 0.875,
            py: 0.375,
            borderRadius: "6px",
            border: "none",
            bgcolor: "transparent",
            color: "text.secondary",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all 0.1s",
            "&:hover": {
              bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#F2F3F5",
              color: "text.primary",
            },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 13 }} />
          Rewards
        </Box>

        {/* Breadcrumb */}
        <Typography sx={{ fontSize: 11, color: "text.disabled", opacity: 0.5 }}>›</Typography>
        <Typography
          sx={{
            fontFamily: "Montserrat, sans-serif",
            fontSize: 13,
            fontWeight: 700,
            color: (theme) =>
              theme.palette.mode === "dark"
                ? theme.palette.text.primary
                : theme.palette.primary.main,
            letterSpacing: "-0.01em",
          }}
        >
          Activity history
        </Typography>

        {/* Balance pill — right */}
        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 0.5 }}>
          <BoltIcon sx={{ fontSize: 12, color: "primary.main" }} />
          <Typography
            sx={{ fontSize: 12, fontWeight: 700, color: "primary.main", fontVariantNumeric: "tabular-nums" }}
          >
            {userBalance.toLocaleString()} pts
          </Typography>
        </Box>
      </Box>

      {/* ── Body ── */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 2.5,
          pt: 2,
          pb: 4,
          "&::-webkit-scrollbar": { width: "3px" },
          "&::-webkit-scrollbar-thumb": { bgcolor: "divider", borderRadius: "2px" },
        }}
      >
        {/* ── Summary strip ── */}
        <Box
          sx={{
            display: "flex",
            gap: "8px",
            mb: 2,
          }}
        >
          {[
            { label: "Total earned",   value: totalEarned,             accent: true  },
            { label: "Total redeemed", value: totalSpent,              accent: false },
            { label: "Net balance",    value: totalEarned - totalSpent, accent: false },
          ].map((s) => (
            <Box
              key={s.label}
              sx={{
                flex: 1,
                bgcolor: "background.paper",
                border: "0.5px solid",
                borderColor: "divider",
                borderRadius: "10px",
                px: 1.875,
                py: 1.25,
              }}
            >
              <Typography sx={{ fontSize: 10.5, color: "text.secondary", mb: 0.25 }}>
                {s.label}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.25 }}>
                <BoltIcon sx={{ fontSize: 11, color: s.accent ? "success.main" : "primary.light", mb: "-1px" }} />
                <Typography
                  sx={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: s.accent ? "success.main" : "text.primary",
                    letterSpacing: "-0.03em",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {s.value.toLocaleString()}
                </Typography>
                <Typography sx={{ fontSize: 10, color: "text.disabled", ml: "2px" }}>pts</Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* ── Filters ── */}
        <Box
          sx={{
            bgcolor: "background.paper",
            border: "0.5px solid",
            borderColor: "divider",
            borderRadius: "10px",
            mb: 1.5,
            overflow: "hidden",
          }}
        >
          {/* Top row — type tabs + search */}
          <Box
            sx={{
              px: 0.5,
              py: 0.5,
              borderBottom: "0.5px solid",
              borderColor: isDark ? "rgba(255,255,255,0.05)" : "#F0F0F0",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <Box role="tablist" sx={{ display: "flex", gap: 0.125 }}>
              {FILTER_TABS.map((t) => (
                <TabButton key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)} isDark={isDark}>
                  {t}
                </TabButton>
              ))}
            </Box>

            {/* Search */}
            <Box
              sx={{
                ml: "auto",
                display: "flex",
                alignItems: "center",
                gap: 0.625,
                px: 1.125,
                py: 0.5,
                borderRadius: "7px",
                border: "0.5px solid",
                borderColor: search ? (isDark ? "rgba(255,255,255,0.18)" : "#C8C8C8") : "divider",
                bgcolor: search
                  ? isDark ? "rgba(255,255,255,0.05)" : "#FAFAFA"
                  : isDark ? "rgba(255,255,255,0.03)" : "#F7F7F7",
                transition: "border-color 0.1s, background 0.1s",
              }}
            >
              <SearchIcon sx={{ fontSize: 13, color: "text.disabled", flexShrink: 0 }} />
              <Box
                component="input"
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                placeholder="Search activity…"
                aria-label="Search activity"
                sx={{
                  border: "none",
                  bgcolor: "transparent",
                  outline: "none",
                  fontSize: 11.5,
                  color: "text.primary",
                  fontFamily: "inherit",
                  width: 140,
                  "::placeholder": { color: "text.disabled" },
                }}
              />
            </Box>
          </Box>

          {/* Bottom row — category chips */}
          <Box
            sx={{
              px: 1.25,
              py: 0.75,
              display: "flex",
              gap: 0.5,
              flexWrap: "wrap",
            }}
          >
            {CAT_FILTERS.map((c) => (
              <CatChip
                key={c.value}
                active={catFilter === c.value}
                onClick={() => setCatFilter(c.value)}
                isDark={isDark}
              >
                {c.label}
              </CatChip>
            ))}
          </Box>
        </Box>

        {/* ── Timeline ── */}
        {grouped.length === 0 ? (
          /* Empty state */
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 8,
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#F2F3F5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 0.5,
              }}
            >
              <SearchIcon sx={{ fontSize: 17, color: "text.disabled" }} />
            </Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.primary" }}>
              No activity found
            </Typography>
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
              Try adjusting your filters or search term.
            </Typography>
            <Box
              component="button"
              onClick={() => { setSearch(""); setTypeFilter("All"); setCatFilter("all"); }}
              sx={{
                mt: 0.5,
                px: 1.5,
                py: 0.625,
                border: "0.5px solid",
                borderColor: "divider",
                borderRadius: "7px",
                bgcolor: "transparent",
                fontSize: 12,
                color: "text.secondary",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 600,
                transition: "all 0.1s",
                "&:hover": { color: "text.primary", borderColor: isDark ? "rgba(255,255,255,0.2)" : "#B3B3B3" },
              }}
            >
              Clear filters
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {grouped.map(([dateGroup, entries]) => (
              <Box key={dateGroup}>
                {/* Date group header */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    mb: 0.75,
                    px: 0.25,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "text.disabled",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      flexShrink: 0,
                    }}
                  >
                    {dateGroup}
                  </Typography>
                  <Box
                    sx={{
                      flex: 1,
                      height: "0.5px",
                      bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#EBEBEB",
                    }}
                  />
                  {/* Group delta */}
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "text.disabled",
                      fontVariantNumeric: "tabular-nums",
                      flexShrink: 0,
                    }}
                  >
                    {(() => {
                      const net = entries.reduce((s, e) => s + e.points, 0);
                      return `${net >= 0 ? "+" : ""}${net.toLocaleString()} pts`;
                    })()}
                  </Typography>
                </Box>

                {/* Entries panel */}
                <Box
                  sx={{
                    bgcolor: "background.paper",
                    border: "0.5px solid",
                    borderColor: "divider",
                    borderRadius: "10px",
                    overflow: "hidden",
                  }}
                >
                  {entries.map((entry, i) => (
                    <ActivityRow
                      key={entry.id}
                      entry={entry}
                      isDark={isDark}
                      isLast={i === entries.length - 1}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
