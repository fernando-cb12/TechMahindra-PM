import { useState, useEffect, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Backdrop from "@mui/material/Backdrop";
import { useTheme } from "@mui/material/styles";
import BoltIcon from "@mui/icons-material/Bolt";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import type { ReactNode } from "react";
import type { IconVariant } from "./RewardCard";

const iconMeta: Record<IconVariant, { bg: string; darkBg: string; color: string }> = {
  crimson: { bg: "#FBF0F3", darkBg: "rgba(163,51,77,0.16)", color: "#5F0229" },
  green:   { bg: "#EAF3DE", darkBg: "rgba(39,80,10,0.16)",  color: "#27500A" },
  amber:   { bg: "#FAEEDA", darkBg: "rgba(99,56,6,0.16)",   color: "#633806" },
  blue:    { bg: "#E6F1FB", darkBg: "rgba(12,68,124,0.16)", color: "#0C447C" },
  purple:  { bg: "#F3E8FF", darkBg: "rgba(92,46,173,0.16)", color: "#5F2D8E" },
  grey:    { bg: "#F2F3F5", darkBg: "rgba(179,179,179,0.1)", color: "#9F9F9F" },
};

export interface RedeemModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  reward: {
    icon: ReactNode;
    iconVariant: IconVariant;
    name: string;
    description: string;
    meta?: string;
    cost: number;
  };
  userBalance: number;
}

type Phase = "idle" | "confirming" | "success";

export default function RedeemModal({
  open,
  onClose,
  onConfirm,
  reward,
  userBalance,
}: RedeemModalProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const ico = iconMeta[reward.iconVariant];
  const canAfford = userBalance >= reward.cost;
  const remaining = userBalance - reward.cost;
  const [phase, setPhase] = useState<Phase>("idle");
  const [mounted, setMounted] = useState(false);

  // Animate in/out — all setState deferred so none run synchronously in the effect body
  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(raf);
    } else {
      const t1 = setTimeout(() => setMounted(false), 0);
      const t2 = setTimeout(() => setPhase("idle"), 300);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [open]);

  const handleConfirm = useCallback(() => {
    if (!canAfford) return;
    setPhase("confirming");
    setTimeout(() => {
      setPhase("success");
      onConfirm?.();
    }, 700);
  }, [canAfford, onConfirm]);

  // Keyboard close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open && !mounted) return null;

  return (
    <Backdrop
      open={open}
      onClick={onClose}
      sx={{
        zIndex: 1300,
        bgcolor: isDark ? "rgba(0,0,0,0.6)" : "rgba(18,18,18,0.35)",
        backdropFilter: "blur(3px)",
        transition: "opacity 0.2s ease",
      }}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-label={`Redeem ${reward.name}`}
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: 380,
          bgcolor: "background.paper",
          border: "0.5px solid",
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: isDark
            ? "0 24px 64px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.06)"
            : "0 24px 64px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.06)",
          transform: mounted ? "translateY(0) scale(1)" : "translateY(12px) scale(0.97)",
          opacity: mounted ? 1 : 0,
          transition: "transform 0.25s cubic-bezier(0.16,1,0.3,1), opacity 0.2s ease",
        }}
      >
        {/* ── SUCCESS STATE ── */}
        {phase === "success" ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 5,
              px: 3.5,
              gap: 1.25,
              animation: "fadeUp 0.3s ease both",
              "@keyframes fadeUp": {
                from: { opacity: 0, transform: "translateY(8px)" },
                to:   { opacity: 1, transform: "translateY(0)" },
              },
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                bgcolor: isDark ? "rgba(76,175,80,0.15)" : "#EAF3DE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "success.main",
                mb: 0.5,
              }}
            >
              <CheckCircleOutlineIcon sx={{ fontSize: 22 }} />
            </Box>
            <Typography
              sx={{ fontSize: 15, fontWeight: 800, color: "text.primary", letterSpacing: "-0.02em", textAlign: "center" }}
            >
              Redemption confirmed
            </Typography>
            <Typography
              sx={{ fontSize: 12, color: "text.secondary", textAlign: "center", lineHeight: 1.6, maxWidth: 260 }}
            >
              <strong>{reward.name}</strong> has been redeemed.{" "}
              {reward.meta ?? "You'll receive a confirmation shortly."}
            </Typography>
            <Box
              component="button"
              onClick={onClose}
              sx={{
                mt: 1.5,
                px: 2.5,
                py: 0.875,
                bgcolor: "primary.main",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: "0.01em",
                transition: "background 0.12s",
                "&:hover": { bgcolor: "primary.dark" },
              }}
            >
              Done
            </Box>
          </Box>
        ) : (
          <>
            {/* ── HEADER ── */}
            <Box
              sx={{
                px: 2.25,
                pt: 2,
                pb: 1.75,
                borderBottom: "0.5px solid",
                borderColor: isDark ? "rgba(255,255,255,0.06)" : "#EBEBEB",
                display: "flex",
                alignItems: "flex-start",
                gap: 1.5,
              }}
            >
              {/* Icon */}
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: isDark ? ico.darkBg : ico.bg,
                  color: ico.color,
                  flexShrink: 0,
                  "& svg": { fontSize: "20px !important" },
                }}
              >
                {reward.icon}
              </Box>

              {/* Title block */}
              <Box sx={{ flex: 1, minWidth: 0, pt: "1px" }}>
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: "text.primary",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                    mb: 0.375,
                  }}
                >
                  {reward.name}
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: "text.secondary", lineHeight: 1.5 }}>
                  {reward.description}
                </Typography>
                {reward.meta && (
                  <Typography
                    sx={{ fontSize: 10.5, color: isDark ? "rgba(255,255,255,0.28)" : "#B3B3B3", fontWeight: 600, mt: 0.375 }}
                  >
                    {reward.meta}
                  </Typography>
                )}
              </Box>

              {/* Close */}
              <Box
                component="button"
                aria-label="Close"
                onClick={onClose}
                sx={{
                  width: 26,
                  height: 26,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "6px",
                  border: "none",
                  bgcolor: "transparent",
                  color: "text.disabled",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "background 0.1s, color 0.1s",
                  "&:hover": {
                    bgcolor: isDark ? "rgba(255,255,255,0.08)" : "#F2F3F5",
                    color: "text.primary",
                  },
                }}
              >
                <CloseIcon sx={{ fontSize: 15 }} />
              </Box>
            </Box>

            {/* ── POINTS SUMMARY ── */}
            <Box
              sx={{
                mx: 2.25,
                my: 1.75,
                bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#F7F7F7",
                border: "0.5px solid",
                borderColor: isDark ? "rgba(255,255,255,0.07)" : "#EBEBEB",
                borderRadius: "9px",
                overflow: "hidden",
              }}
            >
              {[
                { label: "Cost",            value: reward.cost,    negate: true  },
                { label: "Your balance",    value: userBalance,    negate: false },
                { label: "Balance after",   value: remaining,      negate: false, final: true },
              ].map((row, i) => (
                <Box
                  key={row.label}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 1.5,
                    py: 0.875,
                    borderBottom: i < 2 ? "0.5px solid" : "none",
                    borderColor: isDark ? "rgba(255,255,255,0.06)" : "#EBEBEB",
                    bgcolor: row.final
                      ? canAfford
                        ? isDark ? "rgba(95,2,41,0.06)" : "rgba(95,2,41,0.03)"
                        : isDark ? "rgba(251,72,91,0.06)" : "rgba(251,72,91,0.04)"
                      : "transparent",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 11.5,
                      color: row.final ? "text.primary" : "text.secondary",
                      fontWeight: row.final ? 700 : 400,
                    }}
                  >
                    {row.label}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.25 }}>
                    {row.negate && (
                      <Typography component="span" sx={{ fontSize: 11, color: "text.disabled", mr: "1px" }}>
                        −
                      </Typography>
                    )}
                    <BoltIcon
                      sx={{
                        fontSize: 11,
                        color: row.final
                          ? canAfford ? "primary.light" : "error.main"
                          : "primary.light",
                        mb: "-1px",
                      }}
                    />
                    <Typography
                      component="span"
                      sx={{
                        fontSize: 13,
                        fontWeight: 800,
                        letterSpacing: "-0.025em",
                        fontVariantNumeric: "tabular-nums",
                        color: row.final
                          ? canAfford ? "text.primary" : "error.main"
                          : "text.primary",
                      }}
                    >
                      {Math.abs(row.value).toLocaleString()}
                    </Typography>
                    <Typography component="span" sx={{ fontSize: 10, color: "text.disabled", ml: "2px" }}>
                      pts
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* ── INSUFFICIENT POINTS NOTICE ── */}
            {!canAfford && (
              <Box
                role="alert"
                sx={{
                  mx: 2.25,
                  mb: 1.75,
                  mt: -0.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.875,
                  px: 1.375,
                  py: 1,
                  bgcolor: isDark ? "rgba(251,72,91,0.08)" : "rgba(251,72,91,0.05)",
                  border: "0.5px solid",
                  borderColor: isDark ? "rgba(251,72,91,0.2)" : "rgba(251,72,91,0.18)",
                  borderRadius: "8px",
                }}
              >
                <WarningAmberOutlinedIcon sx={{ fontSize: 14, color: "error.main", flexShrink: 0 }} />
                <Typography sx={{ fontSize: 11.5, color: "error.main", lineHeight: 1.45 }}>
                  You need{" "}
                  <strong>{(reward.cost - userBalance).toLocaleString()} more pts</strong>{" "}
                  to redeem this reward.
                </Typography>
              </Box>
            )}

            {/* ── FOOTER ── */}
            <Box
              sx={{
                px: 2.25,
                pb: 2,
                display: "flex",
                gap: 1,
              }}
            >
              {/* Cancel */}
              <Box
                component="button"
                onClick={onClose}
                sx={{
                  flex: 1,
                  py: 0.875,
                  borderRadius: "8px",
                  border: "0.5px solid",
                  borderColor: "divider",
                  bgcolor: "transparent",
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "text.secondary",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  letterSpacing: "0.005em",
                  transition: "all 0.1s",
                  "&:hover": {
                    bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#F2F3F5",
                    color: "text.primary",
                  },
                }}
              >
                Cancel
              </Box>

              {/* Confirm */}
              <Box
                component="button"
                onClick={handleConfirm}
                disabled={!canAfford || phase === "confirming"}
                sx={{
                  flex: 2,
                  py: 0.875,
                  borderRadius: "8px",
                  border: "none",
                  bgcolor: canAfford ? "primary.main" : isDark ? "rgba(255,255,255,0.07)" : "#EBEBEB",
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: canAfford ? "#fff" : "text.disabled",
                  cursor: canAfford ? "pointer" : "not-allowed",
                  fontFamily: "inherit",
                  letterSpacing: "0.01em",
                  transition: "background 0.12s, opacity 0.12s",
                  opacity: phase === "confirming" ? 0.7 : 1,
                  "&:hover": canAfford ? { bgcolor: "primary.dark" } : {},
                }}
              >
                {phase === "confirming" ? "Confirming…" : "Confirm redemption"}
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Backdrop>
  );
}
