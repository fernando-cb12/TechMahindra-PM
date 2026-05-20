import React from "react";
import { Button } from "@mui/material";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../app/routes";

interface GoToRewardsButtonProps {
  fullWidth?: boolean;
}

const GoToRewardsButton: React.FC<GoToRewardsButtonProps> = ({ fullWidth = false }) => {
  const navigate = useNavigate();

  return (
    <Button
      variant="contained"
      fullWidth={fullWidth}
      startIcon={<CardGiftcardIcon />}
      onClick={() => navigate(ROUTES.rewards)}
      sx={{
        bgcolor: "primary.main",
        borderRadius: "10px",
        fontWeight: 700,
        fontSize: "13px",
        px: 2.5,
        py: 1,
        "&:hover": { bgcolor: "primary.dark" },
      }}
    >
      Rewards
    </Button>
  );
};

export default GoToRewardsButton;
