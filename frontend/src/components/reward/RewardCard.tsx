import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import BoltIcon from "@mui/icons-material/Bolt";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useTheme } from "@mui/material/styles";
import type { ReactNode } from "react";

// ─── Badge ────────────────────────────────────────────────────────────────────

export type BadgeVariant = "popular" | "new" | "limited";

const badgeMeta: Record<
  BadgeVariant,
  { label: string; bg: string; darkBg: string; color: string }
> = {
  popular: { label: "Popular", bg: "#EAF3DE", darkBg: "rgba(39,80,10,0.18)",  color: "#27500A" },
  new:     { label: "New",     bg: "#FBF0F3", darkBg: "rgba(95,2,41,0.18)",   color: "#5F0229" },
  limited: { label: "Limited", bg: "#FAEEDA", darkBg: "rgba(99,56,6,0.18)",   color: "#633806" },
};

// ─── Icon variant ─────────────────────────────────────────────────────────────

export type IconVariant = "crimson" | "green" | "amber" | "blue" | "purple" | "grey";

const iconMeta: Record<IconVariant, { bg: string; darkBg: string; color: string }> = {
  crimson: { bg: "#FBF0F3", darkBg: "rgba(163,51,77,0.16)",   color: "#5F0229" },
  green:   { bg: "#EAF3DE", darkBg: "rgba(39,80,10,0.16)",    color: "#27500A" },
  amber:   { bg: "#FAEEDA", darkBg: "rgba(99,56,6,0.16)",     color: "#633806" },
  blue:    { bg: "#E6F1FB", darkBg: "rgba(12,68,124,0.16)",   color: "#0C447C" },
  purple:  { bg: "#EEEDFE", darkBg: "rgba(60,52,137,0.16)",   color: "#3C3489" },
  grey:    { bg: "#F2F3F5", darkBg: "rgba(179,179,179,0.1)",  color: "#9F9F9F" },
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface RewardCardProps {
  /** The icon rendered inside the coloured chip. */
  icon: ReactNode;
  iconVariant: IconVariant;
  name: string;
  description: string;
  /** Small secondary label shown below the description (e.g. "Routed to HR"). */
  meta?: string;
  cost?: number;
  badge?: BadgeVariant;
  /** Renders a crimson left-accent stripe and subtly tinted hover state. */
  featured?: boolean;
  /** Called when the card is clicked or activated via keyboard. */
  onRedeem?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RewardCard({
  icon,
  iconVariant,
  name,
  description,
  meta,
  cost,
  badge,
  featured = false,
  onRedeem,
}: RewardCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const ico = iconMeta[iconVariant];

  return (
    <Box
      component="article"
      role="button"
      tabIndex={0}
      aria-label={`${name}, ${cost?.toLocaleString()} points`}
      onClick={onRedeem}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onRedeem?.();
        }
      }}
      sx={{
        bgcolor: "background.paper",
        border: "0.5px solid",
        borderColor: featured
          ? isDark ? "rgba(95,2,41,0.35)" : "rgba(95,2,41,0.15)"
          : "divider",
        borderRadius: "10px",
        p: "13px 13px 11px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        outline: "none",
        transition: "border-color 0.15s ease, background 0.15s ease, transform 0.1s ease",
        userSelect: "none",

        // Focus-visible ring (keyboard navigation)
        "&:focus-visible": {
          boxShadow: "0 0 0 2px",
          boxShadowColor: "primary.main",
        },

        // Featured left accent stripe
        ...(featured && {
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0, left: 0, bottom: 0,
            width: "2.5px",
            bgcolor: "primary.main",
            borderRadius: "10px 0 0 10px",
          },
        }),

        // Hover
        "&:hover": {
          borderColor: featured
            ? isDark ? "rgba(95,2,41,0.55)" : "rgba(95,2,41,0.3)"
            : isDark ? "rgba(255,255,255,0.18)" : "#C8C8C8",
          bgcolor: isDark
            ? "rgba(255,255,255,0.025)"
            : featured ? "#FEF9FB" : "#FAFAFA",
          "& .redeem-arrow": { opacity: 1, transform: "translateX(0)" },
        },

        // Press
        "&:active": { transform: "scale(0.985)" },
      }}
    >
      {/* Row 1 — icon + badge */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          mb: 1.375,
        }}
      >
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: isDark ? ico.darkBg : ico.bg,
            color: ico.color,
            flexShrink: 0,
            "& svg": { fontSize: "15px !important" },
          }}
        >
          {icon}
        </Box>

        {badge && (
          <Box
            sx={{
              fontSize: 10,
              fontWeight: 700,
              px: 0.875,
              py: "2px",
              borderRadius: "5px",
              letterSpacing: "0.02em",
              lineHeight: 1.6,
              bgcolor: isDark ? badgeMeta[badge].darkBg : badgeMeta[badge].bg,
              color: badge === "new" ? "primary.main" : badgeMeta[badge].color,
            }}
          >
            {badgeMeta[badge].label}
          </Box>
        )}
      </Box>

      {/* Row 2 — name */}
      <Typography
        sx={{
          fontSize: 12.5,
          fontWeight: 700,
          color: "text.primary",
          lineHeight: 1.2,
          letterSpacing: "-0.015em",
          mb: 0.375,
        }}
      >
        {name}
      </Typography>

      {/* Row 3 — description */}
      <Typography
        sx={{
          fontSize: 11,
          color: "text.secondary",
          lineHeight: 1.55,
          mb: meta ? 0.5 : 0,
        }}
      >
        {description}
      </Typography>

      {/* Optional meta tag */}
      {meta && (
        <Typography
          sx={{
            fontSize: 10.5,
            fontWeight: 600,
            color: isDark ? "rgba(255,255,255,0.28)" : "#B3B3B3",
            letterSpacing: "0.01em",
          }}
        >
          {meta}
        </Typography>
      )}

      {/* Footer — cost + hover arrow */}
      <Box
        sx={{
          mt: "auto",
          pt: 1.25,
          borderTop: "0.5px solid",
          borderColor: isDark ? "divider" : "#EBEBEB",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.25 }}>
          <BoltIcon sx={{ fontSize: 12, color: "primary.light", mb: "-1px" }} />
          <Typography
            component="span"
            sx={{
              fontSize: 13.5,
              fontWeight: 800,
              color: "text.primary",
              letterSpacing: "-0.025em",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
            }}
          >
            {cost?.toLocaleString()}
          </Typography>
          <Typography
            component="span"
            sx={{ fontSize: 10.5, color: "text.secondary", fontWeight: 500, ml: "2px" }}
          >
            pts
          </Typography>
        </Box>

        <Box
          className="redeem-arrow"
          aria-hidden="true"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 22,
            height: 22,
            borderRadius: "50%",
            bgcolor: isDark ? "rgba(95,2,41,0.18)" : "#FBF0F3",
            color: "primary.main",
            opacity: 0,
            transform: "translateX(-4px)",
            transition: "opacity 0.15s ease, transform 0.15s ease",
            flexShrink: 0,
          }}
        >
          <ArrowForwardIcon sx={{ fontSize: 12 }} />
        </Box>
      </Box>
    </Box>
  );
}
