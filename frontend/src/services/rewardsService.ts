import { apiClient } from './apiClient';

export type RewardItem = {
  id: string;
  name: string;
  description: string;
  meta?: string | null;
  cost: number;
  category: 'time_off' | 'perks' | 'tools' | 'team' | string;
  iconVariant: 'crimson' | 'green' | 'amber' | 'blue' | 'purple' | 'grey';
  badge?: 'popular' | 'new' | 'limited' | null;
};

export type RewardActivity = {
  id: string;
  type: 'earned' | 'spent';
  category: 'task' | 'milestone' | 'peer' | 'streak' | 'redemption' | 'badge' | string;
  label: string;
  detail?: string | null;
  points: number;
  createdAt: string;
};

export type RewardsPageData = {
  balance: number;
  earnedThisMonth: number;
  redeemedTotal: number;
  teamRank: number;
  rewards: RewardItem[];
  recentActivity: RewardActivity[];
};

export type RewardRedemptionResponse = {
  redemptionId: string;
  status: string;
  balance: number;
  activity: RewardActivity;
};

export async function getRewardsPage(): Promise<RewardsPageData> {
  const response = await apiClient.get<RewardsPageData>('/api/rewards/me');
  return response.data;
}

export async function getRewardActivity(): Promise<RewardActivity[]> {
  const response = await apiClient.get<RewardActivity[]>('/api/rewards/activity');
  return response.data;
}

export async function redeemReward(rewardId: string): Promise<RewardRedemptionResponse> {
  const response = await apiClient.post<RewardRedemptionResponse>(`/api/rewards/${rewardId}/redeem`);
  return response.data;
}
