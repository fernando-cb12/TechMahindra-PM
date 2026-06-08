package com.mahindra.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mahindra.backend.dto.career.CareerBadgeDto;
import com.mahindra.backend.dto.career.CareerPageDto;
import com.mahindra.backend.dto.career.CareerRankStepDto;
import com.mahindra.backend.dto.career.CareerStatDto;
import com.mahindra.backend.dto.rewards.RewardActivityDto;
import com.mahindra.backend.dto.rewards.RewardItemDto;
import com.mahindra.backend.dto.rewards.RewardRedemptionResponseDto;
import com.mahindra.backend.dto.rewards.RewardsPageDto;
import com.mahindra.backend.entity.Badge;
import com.mahindra.backend.entity.RankConfig;
import com.mahindra.backend.entity.Reward;
import com.mahindra.backend.entity.RewardPointsLedger;
import com.mahindra.backend.entity.Task;
import com.mahindra.backend.entity.User;
import com.mahindra.backend.entity.UserBadge;
import com.mahindra.backend.entity.UserPoint;
import com.mahindra.backend.entity.UserRank;
import com.mahindra.backend.entity.UserReward;
import com.mahindra.backend.exception.ResourceNotFoundException;
import com.mahindra.backend.repository.BadgeRepository;
import com.mahindra.backend.repository.RankConfigRepository;
import com.mahindra.backend.repository.RewardPointsLedgerRepository;
import com.mahindra.backend.repository.RewardRepository;
import com.mahindra.backend.repository.UserBadgeRepository;
import com.mahindra.backend.repository.UserPointRepository;
import com.mahindra.backend.repository.UserRankRepository;
import com.mahindra.backend.repository.UserRepository;
import com.mahindra.backend.repository.UserRewardRepository;

@Service
public class CareerRewardsService {

    private static final String TASK_COMPLETED = "task_completed";
    private static final DateTimeFormatter EARNED_DATE_FORMAT =
            DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.ENGLISH).withZone(ZoneOffset.UTC);

    private final UserRepository userRepository;
    private final RankConfigRepository rankConfigRepository;
    private final UserRankRepository userRankRepository;
    private final UserPointRepository userPointRepository;
    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final RewardRepository rewardRepository;
    private final UserRewardRepository userRewardRepository;
    private final RewardPointsLedgerRepository rewardLedgerRepository;

    public CareerRewardsService(UserRepository userRepository, RankConfigRepository rankConfigRepository,
            UserRankRepository userRankRepository, UserPointRepository userPointRepository,
            BadgeRepository badgeRepository, UserBadgeRepository userBadgeRepository,
            RewardRepository rewardRepository, UserRewardRepository userRewardRepository,
            RewardPointsLedgerRepository rewardLedgerRepository) {
        this.userRepository = userRepository;
        this.rankConfigRepository = rankConfigRepository;
        this.userRankRepository = userRankRepository;
        this.userPointRepository = userPointRepository;
        this.badgeRepository = badgeRepository;
        this.userBadgeRepository = userBadgeRepository;
        this.rewardRepository = rewardRepository;
        this.userRewardRepository = userRewardRepository;
        this.rewardLedgerRepository = rewardLedgerRepository;
    }

    @Transactional
    public void awardTaskCompletion(Task task) {
        List<User> recipients = taskRecipients(task);
        for (User recipient : recipients) {
            awardTaskCompletion(task, recipient);
        }
    }

    @Transactional(readOnly = true)
    public CareerPageDto careerForCurrentUser(Authentication authentication) {
        User user = resolveUser(authentication);
        List<RankConfig> ranks = rankConfigRepository.findAllByOrderByRankLevelAsc();
        int totalXp = userPointRepository.sumCareerPoints(user.getId());
        RankConfig currentRank = currentRank(totalXp, ranks);
        int maxXp = currentRank != null ? currentRank.getMaxPoints() : Math.max(totalXp, 1);
        int minXp = currentRank != null ? currentRank.getMinPoints() : 0;
        int rankProgress = maxXp <= minXp ? 100
                : Math.max(0, Math.min(100, (int) Math.round(((double) (totalXp - minXp) / (maxXp - minXp)) * 100)));

        long completedTasks = userPointRepository.countCompletedTasks(user.getId());
        Instant weekStart = LocalDate.now(ZoneOffset.UTC).minusDays(6).atStartOfDay().toInstant(ZoneOffset.UTC);
        long weeklyTasks = userPointRepository.countCompletedTasksSince(user.getId(), weekStart);
        String multiplier = currentRank != null
                ? "x" + currentRank.getPointMultiplier().stripTrailingZeros().toPlainString()
                : "x1";

        List<CareerStatDto> stats = List.of(
                new CareerStatDto("points", "Total Points", String.format("%,d", totalXp), false),
                new CareerStatDto("tasks", "Tasks Done", String.valueOf(completedTasks), false),
                new CareerStatDto("streak", "Weekly Task", String.valueOf(weeklyTasks), false),
                new CareerStatDto("multiplier", "Multiplier", multiplier, true));

        Map<Long, UserBadge> earnedByBadgeId = userBadgeRepository.findByUserId(user.getId()).stream()
                .collect(Collectors.toMap(ub -> ub.getBadge().getId(), Function.identity()));
        List<CareerBadgeDto> badges = badgeRepository.findByActiveTrueOrderByIdAsc().stream()
                .map(b -> toCareerBadgeDto(b, earnedByBadgeId.get(b.getId())))
                .toList();

        return new CareerPageDto(
                rankProgress,
                totalXp,
                maxXp,
                earnedByBadgeId.size(),
                badges.size(),
                ranks.stream().map(r -> toRankStep(r, totalXp, currentRank)).toList(),
                stats,
                badges);
    }

    @Transactional(readOnly = true)
    public RewardsPageDto rewardsForCurrentUser(Authentication authentication) {
        User user = resolveUser(authentication);
        Instant monthStart = LocalDate.now(ZoneOffset.UTC).withDayOfMonth(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        int balance = rewardLedgerRepository.balance(user.getId());
        return new RewardsPageDto(
                balance,
                rewardLedgerRepository.earnedSince(user.getId(), monthStart),
                rewardLedgerRepository.redeemedTotal(user.getId()),
                1,
                rewardRepository.findByActiveTrueOrderByPointsRequiredAscIdAsc().stream().map(this::toRewardItem).toList(),
                rewardLedgerRepository.findTop3ByUserIdOrderByCreatedAtDesc(user.getId()).stream().map(this::toActivity).toList());
    }

    @Transactional(readOnly = true)
    public List<RewardActivityDto> rewardActivityForCurrentUser(Authentication authentication) {
        User user = resolveUser(authentication);
        return rewardLedgerRepository.findTop100ByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toActivity)
                .toList();
    }

    @Transactional
    public RewardRedemptionResponseDto redeem(Authentication authentication, Long rewardId) {
        User user = resolveUser(authentication);
        Reward reward = rewardRepository.findById(rewardId)
                .filter(r -> Boolean.TRUE.equals(r.getActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Reward not found"));
        int balance = rewardLedgerRepository.balance(user.getId());
        if (balance < reward.getPointsRequired()) {
            throw new IllegalArgumentException("Insufficient rewards balance");
        }

        UserReward redemption = new UserReward();
        redemption.setUser(user);
        redemption.setReward(reward);
        redemption.setStatus("pending");
        redemption.setPointsSpent(reward.getPointsRequired());
        userRewardRepository.save(redemption);

        RewardPointsLedger ledger = new RewardPointsLedger();
        ledger.setUser(user);
        ledger.setReward(reward);
        ledger.setRedemption(redemption);
        ledger.setPointsDelta(-reward.getPointsRequired());
        ledger.setReason("reward_redeemed");
        ledger.setDescription("Redeemed: " + reward.getName());
        rewardLedgerRepository.save(ledger);

        int updatedBalance = balance - reward.getPointsRequired();
        return new RewardRedemptionResponseDto(
                String.valueOf(redemption.getId()),
                redemption.getStatus(),
                updatedBalance,
                toActivity(ledger));
    }

    private void awardTaskCompletion(Task task, User user) {
        if (userPointRepository.existsByUserIdAndTaskIdAndReason(user.getId(), task.getId(), TASK_COMPLETED)) {
            return;
        }

        int basePoints = task.getPointsValue() != null ? task.getPointsValue() : 10;
        int currentTotal = userPointRepository.sumCareerPoints(user.getId());
        RankConfig rank = currentRank(currentTotal, rankConfigRepository.findAllByOrderByRankLevelAsc());
        BigDecimal multiplier = rank != null ? rank.getPointMultiplier() : BigDecimal.ONE;
        int finalPoints = multiplier.multiply(BigDecimal.valueOf(basePoints)).setScale(0, RoundingMode.HALF_UP).intValue();

        UserPoint careerPoint = new UserPoint();
        careerPoint.setUser(user);
        careerPoint.setTask(task);
        careerPoint.setBasePoints(basePoints);
        careerPoint.setMultiplier(multiplier);
        careerPoint.setFinalPoints(finalPoints);
        careerPoint.setReason(TASK_COMPLETED);
        userPointRepository.save(careerPoint);

        if (!rewardLedgerRepository.existsByUserIdAndTaskIdAndReason(user.getId(), task.getId(), TASK_COMPLETED)) {
            RewardPointsLedger rewardPoint = new RewardPointsLedger();
            rewardPoint.setUser(user);
            rewardPoint.setTask(task);
            rewardPoint.setPointsDelta(finalPoints);
            rewardPoint.setReason(TASK_COMPLETED);
            rewardPoint.setDescription("Completed task: " + task.getTitle());
            rewardLedgerRepository.save(rewardPoint);
        }

        refreshUserRank(user);
        refreshBadges(user);
    }

    private void refreshUserRank(User user) {
        int total = userPointRepository.sumCareerPoints(user.getId());
        RankConfig rank = currentRank(total, rankConfigRepository.findAllByOrderByRankLevelAsc());
        if (rank == null) {
            return;
        }
        UserRank userRank = userRankRepository.findByUserId(user.getId()).orElseGet(() -> {
            UserRank created = new UserRank();
            created.setUser(user);
            return created;
        });
        userRank.setRankLevel(rank.getRankLevel());
        userRank.setRankName(rank.getRankName());
        userRank.setTotalPoints(total);
        userRank.setUpdatedAt(Instant.now());
        userRankRepository.save(userRank);
    }

    private void refreshBadges(User user) {
        long completedTasks = userPointRepository.countCompletedTasks(user.getId());
        int totalXp = userPointRepository.sumCareerPoints(user.getId());
        for (Badge badge : badgeRepository.findByActiveTrueOrderByIdAsc()) {
            boolean qualifies = switch (badge.getCondition()) {
                case "tasks_completed" -> completedTasks >= badge.getThreshold();
                case "career_points" -> totalXp >= badge.getThreshold();
                default -> false;
            };
            if (qualifies && userBadgeRepository.findByUserIdAndBadgeId(user.getId(), badge.getId()).isEmpty()) {
                UserBadge userBadge = new UserBadge();
                userBadge.setUser(user);
                userBadge.setBadge(badge);
                userBadgeRepository.save(userBadge);
            }
        }
    }

    private List<User> taskRecipients(Task task) {
        if (!task.getAssignees().isEmpty()) {
            return task.getAssignees().stream()
                    .sorted(Comparator.comparing(User::getId))
                    .toList();
        }
        return task.getAssignedTo() != null ? List.of(task.getAssignedTo()) : List.of();
    }

    private RankConfig currentRank(int points, List<RankConfig> ranks) {
        return ranks.stream()
                .filter(r -> points >= r.getMinPoints() && points <= r.getMaxPoints())
                .findFirst()
                .orElseGet(() -> ranks.stream()
                        .filter(r -> points >= r.getMinPoints())
                        .max(Comparator.comparing(RankConfig::getRankLevel))
                        .orElse(null));
    }

    private CareerRankStepDto toRankStep(RankConfig rank, int totalXp, RankConfig currentRank) {
        boolean current = currentRank != null && rank.getRankLevel().equals(currentRank.getRankLevel());
        return new CareerRankStepDto(
                String.valueOf(rank.getRankLevel()),
                rank.getRankName(),
                rank.getMinPoints(),
                current,
                totalXp >= rank.getMinPoints());
    }

    private CareerBadgeDto toCareerBadgeDto(Badge badge, UserBadge earned) {
        return new CareerBadgeDto(
                String.valueOf(badge.getId()),
                badge.getName(),
                badge.getDescription(),
                badge.getDescription(),
                badge.getIconUrl(),
                earned != null ? "earned" : "locked",
                earned != null ? EARNED_DATE_FORMAT.format(earned.getEarnedAt()) : null);
    }

    private RewardItemDto toRewardItem(Reward reward) {
        return new RewardItemDto(
                String.valueOf(reward.getId()),
                reward.getName(),
                reward.getDescription(),
                reward.getMeta(),
                reward.getPointsRequired(),
                reward.getCategory(),
                reward.getIconVariant(),
                reward.getBadge());
    }

    private RewardActivityDto toActivity(RewardPointsLedger ledger) {
        String category = ledger.getPointsDelta() < 0 ? "redemption" : "task";
        String detail = switch (ledger.getReason()) {
            case "task_completed" -> "Task completed";
            case "reward_redeemed" -> "Reward request pending";
            default -> "Points adjustment";
        };
        return new RewardActivityDto(
                String.valueOf(ledger.getId()),
                ledger.getPointsDelta() >= 0 ? "earned" : "spent",
                category,
                ledger.getDescription(),
                detail,
                ledger.getPointsDelta(),
                ledger.getCreatedAt().toString());
    }

    private User resolveUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));
    }
}
