package com.mahindra.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mahindra.backend.dto.career.CareerPageDto;
import com.mahindra.backend.service.CareerRewardsService;

import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/career")
@Tag(name = "Career")
public class CareerController {

    private final CareerRewardsService careerRewardsService;

    public CareerController(CareerRewardsService careerRewardsService) {
        this.careerRewardsService = careerRewardsService;
    }

    @GetMapping("/me")
    public ResponseEntity<CareerPageDto> me(Authentication authentication) {
        return ResponseEntity.ok(careerRewardsService.careerForCurrentUser(authentication));
    }
}
