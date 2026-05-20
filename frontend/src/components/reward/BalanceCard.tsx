import React from "react";
import { Box, Typography, LinearProgress, Button } from "@mui/material";
import { alpha } from "@mui/material/styles";
import StarIcon from "@mui/icons-material/Star";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LocationOnIcon from "@mui/icons-material/LocationOn";

interface BalanceCardProps {
  points: number;
  pointsToNextTier: number;
  tierMax: number;
  message?: string;
  onViewBenefits?: () => void;
}

const BalanceCard: React.FC<BalanceCardProps> = ({
  points,
  pointsToNextTier,
  tierMax,
  message = "Keep earning points and unlock more rewards!",
  onViewBenefits,
}) => {
  const progress = ((tierMax - pointsToNextTier) / tierMax) * 100;

  return (
    <Box
      sx={{
        borderRadius: "20px",
        background: "linear-gradient(135deg, #5F0229 0%, #3a0119 60%, #2a0112 100%)",
        p: "28px 32px",
        position: "relative",
        overflow: "hidden",
        color: "#fff",
      }}
    >
      {/* Decorative circles */}
      <Box sx={{ position: "absolute", top: -40, right: 120, width: 180, height: 180, borderRadius: "50%", bgcolor: alpha("#fff", 0.04), pointerEvents: "none" }} />
      <Box sx={{ position: "absolute", top: 20, right: 60, width: 80, height: 80, borderRadius: "50%", bgcolor: alpha("#fff", 0.05), pointerEvents: "none" }} />
      <Box sx={{ position: "absolute", bottom: -30, right: 200, width: 100, height: 100, borderRadius: "50%", bgcolor: alpha("#fff", 0.03), pointerEvents: "none" }} />

      {/* Sparkle dots */}
      {[{ top: "18%", right: "38%" }, { top: "55%", right: "52%" }, { bottom: "20%", right: "30%" }].map((pos, i) => (
        <Box key={i} sx={{ position: "absolute", ...pos, width: 5, height: 5, borderRadius: "50%", bgcolor: alpha("#FFD700", 0.7), pointerEvents: "none" }} />
      ))}

      {/* Gift box illustration placeholder */}
      <Box
        sx={{
          position: "absolute",
          right: 32,
          top: "50%",
          transform: "translateY(-50%)",
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,100,100,0.15) 0%, transparent 70%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "80px",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        🎁
      </Box>

      {/* Content */}
      <Typography sx={{ fontSize: "13px", fontWeight: 500, color: alpha("#fff", 0.75), mb: 1 }}>
        Your Balance
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            bgcolor: "#EAC24F",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <StarIcon sx={{ color: "#fff", fontSize: 20 }} />
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: "36px", letterSpacing: "-1px", lineHeight: 1 }}>
          {points.toLocaleString()}
        </Typography>
        <Typography sx={{ fontWeight: 600, fontSize: "18px", color: alpha("#fff", 0.75), alignSelf: "flex-end", mb: 0.5 }}>
          pts
        </Typography>
      </Box>

      <Typography sx={{ fontSize: "13px", color: alpha("#fff", 0.65), mb: 2.5 }}>
        {message}
      </Typography>

      {/* Progress bar */}
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 8,
          borderRadius: 99,
          bgcolor: alpha("#fff", 0.15),
          mb: 1.5,
          maxWidth: 520,
          "& .MuiLinearProgress-bar": {
            borderRadius: 99,
            background: "linear-gradient(90deg, #FF6B9D, #FF9A3C)",
          },
        }}
      />

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 520 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <LocationOnIcon sx={{ fontSize: 16, color: alpha("#fff", 0.6) }} />
          <Typography sx={{ fontSize: "12px", color: alpha("#fff", 0.65) }}>
            {pointsToNextTier.toLocaleString()} pts to next tier
          </Typography>
        </Box>
        <Button
          endIcon={<ArrowForwardIcon sx={{ fontSize: "14px !important" }} />}
          onClick={onViewBenefits}
          sx={{
            color: "#EAC24F",
            fontWeight: 700,
            fontSize: "13px",
            p: 0,
            minWidth: 0,
            "&:hover": { bgcolor: "transparent", opacity: 0.8 },
          }}
        >
          View benefits
        </Button>
      </Box>
    </Box>
  );
};

export default BalanceCard;
