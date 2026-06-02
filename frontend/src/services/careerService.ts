import { apiClient } from './apiClient';

export type CareerRankStep = {
  id: string;
  label: string;
  pointsRequired?: number;
  current: boolean;
  unlocked: boolean;
};

export type CareerStat = {
  id: string;
  label: string;
  value: string;
  highlight: boolean;
};

export type CareerBadge = {
  id: string;
  name: string;
  subtitle: string;
  description?: string;
  icon?: string;
  status: 'earned' | 'locked';
  earnedDate?: string | null;
};

export type CareerPageData = {
  rankProgress: number;
  currentXp: number;
  maxXp: number;
  earnedBadges: number;
  totalBadges: number;
  ranks: CareerRankStep[];
  stats: CareerStat[];
  badges: CareerBadge[];
};

export async function getCareerPage(): Promise<CareerPageData> {
  const response = await apiClient.get<CareerPageData>('/api/career/me');
  return response.data;
}
