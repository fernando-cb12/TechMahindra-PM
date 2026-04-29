// ── Chart type enum ──────────────────────────────────────────────────
export type ChartType = 'kpi' | 'bar' | 'line' | 'pie' | 'table';

// ── Per-chart data shapes ────────────────────────────────────────────
export interface KpiData {
  value: number;
  unit: string;
  trend?: number; // percentage change (positive = up, negative = down)
}

export interface BarData {
  labels: string[];
  values: number[];
}

export interface LineData {
  points: { x: string; y: number }[];
}

export interface PieData {
  segments: { label: string; value: number }[];
}

export interface TableData {
  columns: string[];
  rows: Record<string, string | number>[];
}

export type MetricMockData = KpiData | BarData | LineData | PieData | TableData;

// Map of chart-type key → typed data. Each present key = supported chart type.
export interface MetricDataByChart {
  kpi?: KpiData;
  bar?: BarData;
  line?: LineData;
  pie?: PieData;
  table?: TableData;
}

// ── Metric definition (from mock / future API) ──────────────────────
export interface Metric {
  id: string;
  name: string;
  description: string;
  compatibleChartTypes: ChartType[];
  mockData: MetricDataByChart;
}

// ── Card & grid layout ──────────────────────────────────────────────
export interface GridLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Card {
  id: string;
  metricId: string;
  chartType: ChartType;
  timeRangeLabel: string;
  layout: GridLayout;
}

// ── Dashboard-level state ───────────────────────────────────────────
export interface DashboardState {
  isEditMode: boolean;
  cards: Card[];
  isAddModalOpen: boolean;
}

// ── Default sizes per chart type (columns × rows) ───────────────────
export const DEFAULT_SIZES: Record<ChartType, { w: number; h: number }> = {
  kpi:   { w: 2, h: 2 },
  bar:   { w: 4, h: 3 },
  line:  { w: 4, h: 3 },
  pie:   { w: 3, h: 3 },
  table: { w: 6, h: 4 },
};

// ── Chart type labels (for UI) ──────────────────────────────────────
export const CHART_TYPE_LABELS: Record<ChartType, string> = {
  kpi:   'KPI / Single Number',
  bar:   'Bar Chart',
  line:  'Line Chart',
  pie:   'Pie / Donut Chart',
  table: 'Table',
};
