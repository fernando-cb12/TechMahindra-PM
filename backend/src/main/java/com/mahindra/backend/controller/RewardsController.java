package com.mahindra.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mahindra.backend.dto.rewards.RewardActivityDto;
import com.mahindra.backend.dto.rewards.RewardRedemptionResponseDto;
import com.mahindra.backend.dto.rewards.RewardsPageDto;
import com.mahindra.backend.service.CareerRewardsService;

import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/rewards")
@Tag(name = "Rewards")
public class RewardsController {

    private final CareerRewardsService careerRewardsService;

    public RewardsController(CareerRewardsService careerRewardsService) {
        this.careerRewardsService = careerRewardsService;
    }

    @GetMapping("/me")
    public ResponseEntity<RewardsPageDto> me(Authentication authentication) {
        return ResponseEntity.ok(careerRewardsService.rewardsForCurrentUser(authentication));
    }

    @GetMapping("/activity")
    public ResponseEntity<List<RewardActivityDto>> activity(Authentication authentication) {
        return ResponseEntity.ok(careerRewardsService.rewardActivityForCurrentUser(authentication));
    }

    @PostMapping("/{rewardId}/redeem")
    public ResponseEntity<RewardRedemptionResponseDto> redeem(Authentication authentication, @PathVariable Long rewardId) {
        return ResponseEntity.ok(careerRewardsService.redeem(authentication, rewardId));
    }
}
