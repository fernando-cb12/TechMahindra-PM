import React from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import StarIcon from "@mui/icons-material/Star";

export interface RewardCardData {
  id: string;
  title: string;
  description: string;
  points: number;
  tag?: "Popular" | "Exclusive" | "Trending" | "Plus";
  tagColor?: string;
  icon: React.ReactNode;
  iconBg: string;
}

const TAG_COLORS: Record<string, string> = {
  Popular: "#4CAF50",
  Exclusive: "#9C27B0",
  Trending: "#FF9800",
  Plus: "#2196F3",
};

interface RewardCardProps {
  reward: RewardCardData;
  onSelect?: (reward: RewardCardData) => void;
}

const RewardCard: React.FC<RewardCardProps> = ({ reward, onSelect }) => {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const tagColor = reward.tagColor ?? (reward.tag ? TAG_COLORS[reward.tag] : undefined);

  const handleConfirm = () => {
    setDialogOpen(false);
    onSelect?.(reward);
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          borderRadius: "16px",
          border: "1px solid",
          borderColor: "grey.200",
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          minWidth: 200,
          position: "relative",
          transition: "transform 0.18s ease, box-shadow 0.18s ease",
          "&:hover": {
            transform: "translateY(-3px)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
          },
        }}
      >
        {/* Tag */}
        {reward.tag && (
          <Chip
            label={reward.tag}
            size="small"
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              bgcolor: alpha(tagColor!, 0.12),
              color: tagColor,
              fontWeight: 700,
              fontSize: "10px",
              height: 22,
              borderRadius: "6px",
            }}
          />
        )}

        {/* Icon */}
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "14px",
            bgcolor: reward.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
          }}
        >
          {reward.icon}
        </Box>

        {/* Title & description */}
        <Box>
          <Typography fontWeight={700} fontSize="15px" color="text.primary" lineHeight={1.3}>
            {reward.title}
          </Typography>
          <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
            {reward.description}
          </Typography>
        </Box>

        {/* Footer: points + button */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: "auto" }}>
          <Typography fontWeight={800} fontSize="15px" color="text.primary">
            {reward.points} pts
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={() => setDialogOpen(true)}
            sx={{
              bgcolor: "primary.main",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "13px",
              px: 2,
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            Select
          </Button>
        </Box>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: "16px", p: 1, minWidth: 340 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "18px" }}>
          Confirm Redemption
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "12px",
                bgcolor: reward.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                flexShrink: 0,
              }}
            >
              {reward.icon}
            </Box>
            <Box>
              <Typography fontWeight={700}>{reward.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {reward.description}
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              bgcolor: "grey.50",
              borderRadius: "10px",
              p: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <StarIcon sx={{ color: "warning.main", fontSize: 20 }} />
            <Typography fontWeight={700} fontSize="15px">
              {reward.points} pts
            </Typography>
            <Typography variant="caption" color="text.secondary">
              will be deducted from your balance
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setDialogOpen(false)}
            variant="outlined"
            sx={{ borderRadius: "8px", flex: 1, borderColor: "grey.300", color: "text.primary" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            sx={{ borderRadius: "8px", flex: 1, bgcolor: "primary.main", "&:hover": { bgcolor: "primary.dark" } }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RewardCard;
