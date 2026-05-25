import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

interface RewardsHeroProps {
  balance: number;
  earnedThisMonth: number;
  redeemedTotal: number;
  teamRank: number;
}

export default function RewardsHero({
  balance,
  earnedThisMonth,
  redeemedTotal,
  teamRank,
}: RewardsHeroProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const sep = isDark ? "divider" : "#EBEBEB";

  const stats = [
    { label: "Earned this month", value: `+${earnedThisMonth.toLocaleString()}`, accent: true },
    { label: "Redeemed total", value: redeemedTotal.toLocaleString(), accent: false },
    { label: "Team rank", value: `#${teamRank}`, accent: false, narrow: true },
  ];

  return (
    <Box
      component="section"
      aria-label="Points summary"
      sx={{
        bgcolor: "background.paper",
        border: "0.5px solid",
        borderColor: "divider",
        borderRadius: "12px",
        display: "flex",
        overflow: "hidden",
        mb: 2,
      }}
    >
      {/* Balance */}
      <Box
        sx={{
          px: 2.5,
          py: 1.875,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flexShrink: 0,
          minWidth: 152,
          borderRight: "0.5px solid",
          borderColor: sep,
        }}
      >
        <Typography
          sx={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: isDark ? "primary.light" : "#C8A0AB",
            textTransform: "uppercase",
            mb: 0.5,
          }}
        >
          Your balance
        </Typography>
        <Typography
          sx={{
            fontSize: 30,
            fontWeight: 800,
            color: "primary.main",
            letterSpacing: "-0.04em",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {balance.toLocaleString()}
        </Typography>
        <Typography sx={{ fontSize: 11, color: "text.disabled", mt: 0.5 }}>
          pts available
        </Typography>
      </Box>

      {/* Stats */}
      <Box sx={{ display: "flex", flex: 1 }}>
        {stats.map((s, i) => (
          <Box
            key={s.label}
            sx={{
              px: 2.25,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 0.375,
              flex: s.narrow ? 0.65 : 1,
              borderRight: i < stats.length - 1 ? "0.5px solid" : "none",
              borderColor: sep,
            }}
          >
            <Typography sx={{ fontSize: 11, color: "text.secondary", lineHeight: 1 }}>
              {s.label}
            </Typography>
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 700,
                color: s.accent ? "success.main" : "text.primary",
                letterSpacing: "-0.025em",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1.15,
              }}
            >
              {s.value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
