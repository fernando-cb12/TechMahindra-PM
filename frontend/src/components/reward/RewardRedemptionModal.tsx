/**
 * RewardRedemptionModal
 *
 * Opens when a RewardCard is clicked. Displays the selected reward details,
 * the user's current balance vs the cost, and handles the redeem action.
 *
 * Features
 * ─────────
 * • Spring-scale open / slide-down close animation via MUI Fade + sx transform
 * • Insufficient-points guard: disables the Redeem button and shows a hint
 * • Animated progress bar (balance / cost)
 * • Success confirmation state after redemption
 * • Keyboard: Escape closes; focus trapped inside modal
 * • Click-outside (Backdrop) closes
 */

import {
  Dialog,
  DialogContent,
  Backdrop,
  Box,
  Typography,
  Button,
  LinearProgress,
  Fade,
  Slide,
  Divider,
} from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import { useTheme, alpha } from "@mui/material/styles";
import { useState, useEffect, type ReactNode, forwardRef } from "react";
import type { TransitionProps } from "@mui/material/transitions";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RewardModalItem {
  id: number | string;
  icon: ReactNode;
  /** Must match one of the keys in iconMeta (used for icon chip colour). */
  iconVariant: "crimson" | "green" | "amber" | "blue" | "purple" | "grey";
  name: string;
  description: string;
  meta?: string;
  cost: number;
  badge?: "popular" | "new" | "limited";
}

interface RewardRedemptionModalProps {
  open: boolean;
  reward: RewardModalItem | null;
  /** Current authenticated user's points balance. */
  userBalance: number;
  onClose: () => void;
  /** Called when the user confirms the redemption.
   *  The parent is responsible for deducting points from the balance. */
  onRedeem: (reward: RewardModalItem) => void;
}

// ─── Design tokens (matching the page palette) ────────────────────────────────

const iconMeta: Record<
  RewardModalItem["iconVariant"],
  { bg: string; darkBg: string; color: string }
> = {
  crimson: { bg: "#FBF0F3", darkBg: "rgba(163,51,77,0.16)",  color: "#5F0229" },
  green:   { bg: "#EAF3DE", darkBg: "rgba(39,80,10,0.16)",   color: "#27500A" },
  amber:   { bg: "#FAEEDA", darkBg: "rgba(99,56,6,0.16)",    color: "#633806" },
  blue:    { bg: "#E6F1FB", darkBg: "rgba(12,68,124,0.16)",  color: "#0C447C" },
  purple:  { bg: "#EEEDFE", darkBg: "rgba(60,52,137,0.16)",  color: "#3C3489" },
  grey:    { bg: "#F2F3F5", darkBg: "rgba(179,179,179,0.1)", color: "#9F9F9F" },
};

const badgeMeta = {
  popular: { label: "Popular", bg: "#EAF3DE", darkBg: "rgba(39,80,10,0.18)",  color: "#27500A" },
  new:     { label: "New",     bg: "#FBF0F3", darkBg: "rgba(95,2,41,0.18)",   color: "#5F0229" },
  limited: { label: "Limited", bg: "#FAEEDA", darkBg: "rgba(99,56,6,0.18)",   color: "#633806" },
};

// ─── Slide-up transition ──────────────────────────────────────────────────────

const SlideUp = forwardRef(function SlideUp(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// ─── Main component ───────────────────────────────────────────────────────────

export default function RewardRedemptionModal({
  open,
  reward,
  userBalance,
  onClose,
  onRedeem,
}: RewardRedemptionModalProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [redeemed, setRedeemed] = useState(false);

  // Reset confirmation state whenever the modal opens or a new reward is loaded.
  useEffect(() => {
    if (open) {
      setRedeemed(false);
    }
  }, [open, reward?.id]);

  if (!reward) return null;

  const ico = iconMeta[reward.iconVariant];
  const canAfford = userBalance >= reward.cost;
  const shortage = reward.cost - userBalance;
  // Clamp the bar so it never overflows visually when balance > cost
  const progressPct = Math.min(100, Math.round((userBalance / reward.cost) * 100));

  function handleRedeem() {
    onRedeem(reward!);
    setRedeemed(true);
  }

  function handleClose() {
    setRedeemed(false);
    onClose();
  }

  const badgeInfo = reward.badge ? badgeMeta[reward.badge] : null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionComponent={SlideUp}
      TransitionProps={{ timeout: { enter: 240, exit: 180 } }}
      keepMounted={false}
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: isDark ? "rgba(0,0,0,0.72)" : "rgba(15,13,10,0.52)",
            backdropFilter: "blur(2px)",
          },
        },
      }}
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: "14px",
          border: "0.5px solid",
          borderColor: isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)",
          bgcolor: "background.paper",
          width: "100%",
          maxWidth: 400,
          overflow: "hidden",
          m: 2,
        },
      }}
    >
      {/* ── Close button ── */}
      <IconButton
        aria-label="Close"
        onClick={handleClose}
        size="small"
        sx={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 1,
          width: 26,
          height: 26,
          border: "0.5px solid",
          borderColor: "divider",
          color: "text.disabled",
          "&:hover": { color: "text.primary", bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#F5F5F5" },
        }}
      >
        <CloseIcon sx={{ fontSize: 12 }} />
      </IconButton>

      {/* ══════════════════════════════════════════════════════════
          DEFAULT state — reward details + redeem CTA
      ══════════════════════════════════════════════════════════ */}
      <Fade in={!redeemed} timeout={{ enter: 220, exit: 140 }} unmountOnExit>
        <Box>
          {/* Icon + title row */}
          <Box
            sx={{
              px: "24px",
              pt: "28px",
              pb: "20px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <Box
              aria-hidden="true"
              sx={{
                width: 46,
                height: 46,
                borderRadius: "12px",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: isDark ? ico.darkBg : ico.bg,
                color: ico.color,
                "& svg": { fontSize: "22px !important" },
              }}
            >
              {reward.icon}
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                id="reward-modal-title"
                sx={{
                  fontSize: 15.5,
                  fontWeight: 700,
                  color: "text.primary",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                }}
              >
                {reward.name}
              </Typography>

              {badgeInfo && (
                <Box
                  component="span"
                  sx={{
                    display: "inline-block",
                    mt: 0.5,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    px: 0.875,
                    py: "2px",
                    borderRadius: "5px",
                    bgcolor: isDark ? badgeInfo.darkBg : badgeInfo.bg,
                    color: reward.badge === "new" ? "primary.main" : badgeInfo.color,
                  }}
                >
                  {badgeInfo.label}
                </Box>
              )}
            </Box>
          </Box>

          <DialogContent sx={{ pt: 0, pb: "20px", px: "24px" }}>
            {/* Description */}
            <Typography sx={{ fontSize: 13, color: "text.secondary", lineHeight: 1.6 }}>
              {reward.description}
            </Typography>

            {/* Meta tag */}
            {reward.meta && (
              <Typography
                sx={{
                  mt: 0.75,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: isDark ? "rgba(255,255,255,0.28)" : "#B3B3B3",
                  letterSpacing: "0.01em",
                }}
              >
                {reward.meta}
              </Typography>
            )}

            <Divider sx={{ my: "16px", borderColor: isDark ? "divider" : "#EBEBEB" }} />

            {/* Cost row */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: "8px",
              }}
            >
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>Cost</Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
                <BoltIcon sx={{ fontSize: 12, color: "primary.light", mb: "-1px" }} />
                <Typography
                  component="span"
                  sx={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "text.primary",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {reward.cost.toLocaleString()}
                </Typography>
                <Typography component="span" sx={{ fontSize: 11, color: "text.secondary" }}>
                  &nbsp;pts
                </Typography>
              </Box>
            </Box>

            {/* Balance row */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: "12px",
              }}
            >
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>Your balance</Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
                <BoltIcon sx={{ fontSize: 12, color: "primary.light", mb: "-1px" }} />
                <Typography
                  component="span"
                  sx={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "text.primary",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {userBalance.toLocaleString()}
                </Typography>
                <Typography component="span" sx={{ fontSize: 11, color: "text.secondary" }}>
                  &nbsp;pts
                </Typography>
              </Box>
            </Box>

            {/* Progress bar */}
            <LinearProgress
              variant="determinate"
              value={progressPct}
              sx={{
                height: 4,
                borderRadius: 2,
                bgcolor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 2,
                  bgcolor: canAfford ? "primary.light" : "error.main",
                  transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
                },
              }}
            />

            {/* Insufficient-points notice */}
            {!canAfford && (
              <Fade in timeout={200}>
                <Box
                  sx={{
                    mt: "10px",
                    p: "8px 10px",
                    borderRadius: "7px",
                    bgcolor: alpha(theme.palette.error.main, 0.07),
                    border: "0.5px solid",
                    borderColor: alpha(theme.palette.error.main, 0.2),
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <InfoOutlinedIcon
                    sx={{ fontSize: 14, color: "error.main", flexShrink: 0 }}
                  />
                  <Typography sx={{ fontSize: 11.5, color: "error.dark" }}>
                    You need{" "}
                    <Box component="strong" sx={{ fontWeight: 700 }}>
                      {shortage.toLocaleString()} more pts
                    </Box>{" "}
                    to redeem this reward.
                  </Typography>
                </Box>
              </Fade>
            )}
          </DialogContent>

          {/* Footer */}
          <Box
            sx={{
              px: "24px",
              pb: "20px",
              pt: "16px",
              borderTop: "0.5px solid",
              borderColor: isDark ? "divider" : "#EBEBEB",
              display: "flex",
              gap: "8px",
            }}
          >
            <Button
              variant="outlined"
              onClick={handleClose}
              sx={{
                flex: 1,
                fontSize: 13,
                fontWeight: 600,
                borderRadius: "8px",
                borderColor: "divider",
                color: "text.secondary",
                py: "9px",
                textTransform: "none",
                "&:hover": { borderColor: "divider", bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#F5F5F5" },
              }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              disabled={!canAfford}
              onClick={handleRedeem}
              disableElevation
              sx={{
                flex: 2,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                borderRadius: "8px",
                py: "9px",
                textTransform: "none",
                bgcolor: "primary.main",
                color: "#fff",
                "&:hover": { bgcolor: "primary.dark" },
                "&:active": { transform: "scale(0.97)" },
                "&:disabled": {
                  bgcolor: isDark ? "rgba(255,255,255,0.08)" : "#EBEBEB",
                  color: "text.disabled",
                },
                transition: "opacity 0.12s ease, transform 0.1s ease",
              }}
            >
              Redeem reward
            </Button>
          </Box>
        </Box>
      </Fade>

      {/* ══════════════════════════════════════════════════════════
          SUCCESS state — confirmation after redeeming
      ══════════════════════════════════════════════════════════ */}
      <Fade in={redeemed} timeout={{ enter: 240, exit: 140 }} unmountOnExit>
        <Box sx={{ px: "24px", py: "36px", textAlign: "center" }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              bgcolor: isDark ? "rgba(39,80,10,0.2)" : "#EAF3DE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: "14px",
            }}
          >
            <CheckCircleOutlineIcon sx={{ fontSize: 26, color: "#27500A" }} />
          </Box>

          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 700,
              color: "text.primary",
              letterSpacing: "-0.02em",
            }}
          >
            Reward redeemed!
          </Typography>

          <Typography
            sx={{
              mt: 0.5,
              fontSize: 13,
              color: "text.secondary",
              lineHeight: 1.55,
            }}
          >
            {reward.name} has been added to your account.
          </Typography>

          <Typography
            sx={{
              mt: 1.25,
              fontSize: 12,
              fontWeight: 600,
              color: isDark ? "rgba(255,255,255,0.3)" : "#B3B3B3",
            }}
          >
            Remaining balance:{" "}
            {(userBalance - reward.cost).toLocaleString()} pts
          </Typography>

          <Button
            variant="outlined"
            fullWidth
            onClick={handleClose}
            sx={{
              mt: "20px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: "8px",
              borderColor: "divider",
              color: "text.secondary",
              py: "9px",
              textTransform: "none",
              "&:hover": { borderColor: "divider", bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#F5F5F5" },
            }}
          >
            Done
          </Button>
        </Box>
      </Fade>
    </Dialog>
  );
}
