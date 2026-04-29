import type { Metric } from '../components/metrics/types';
import { MOCK_METRICS } from '../mocks/metrics';

/**
 * Service layer for metric definitions.
 *
 * Currently backed by mock data. When the backend is ready, replace
 * the body of each function with an HTTP call — nothing outside this
 * file needs to change.
 */
export async function getMetrics(): Promise<Metric[]> {
  // TODO: Replace with API call, e.g. return (await api.get('/metrics')).data;
  return Promise.resolve(MOCK_METRICS);
}

export async function getMetricById(id: string): Promise<Metric | undefined> {
  // TODO: Replace with API call
  return Promise.resolve(MOCK_METRICS.find((m) => m.id === id));
}
