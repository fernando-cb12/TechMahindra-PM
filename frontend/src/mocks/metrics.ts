import type { Metric } from '../components/metrics/types';

/**
 * Mock metrics for a task-management / project-monitoring application.
 *
 * Each metric includes data shaped for every compatible chart type so
 * the ChartRenderer can consume it without transformation.
 */
export const MOCK_METRICS: Metric[] = [
  // ─── 1. Open Issues ────────────────────────────────────────────────
  {
    id: 'm_open_issues',
    name: 'Open Issues',
    description: 'Total number of unresolved issues across all projects',
    compatibleChartTypes: ['kpi', 'bar', 'line', 'table'],
    mockData: {
      kpi: { value: 47, unit: 'issues', trend: 12 },
      bar: {
        labels: ['Magenta', 'Blue', 'Green', 'Delta', 'Omega'],
        values: [18, 9, 7, 8, 5],
      },
      line: {
        points: [
          { x: 'Week 1', y: 32 },
          { x: 'Week 2', y: 38 },
          { x: 'Week 3', y: 35 },
          { x: 'Week 4', y: 41 },
          { x: 'Week 5', y: 44 },
          { x: 'Week 6', y: 47 },
        ],
      },
      table: {
        columns: ['Project', 'Critical', 'High', 'Medium', 'Low'],
        rows: [
          { Project: 'Magenta', Critical: 3, High: 5, Medium: 7, Low: 3 },
          { Project: 'Blue', Critical: 1, High: 3, Medium: 3, Low: 2 },
          { Project: 'Green', Critical: 0, High: 2, Medium: 3, Low: 2 },
          { Project: 'Delta', Critical: 2, High: 1, Medium: 3, Low: 2 },
          { Project: 'Omega', Critical: 0, High: 2, Medium: 2, Low: 1 },
        ],
      },
    },
  },

  // ─── 2. Sprint Velocity ────────────────────────────────────────────
  {
    id: 'm_velocity',
    name: 'Sprint Velocity',
    description: 'Average story points completed per sprint',
    compatibleChartTypes: ['kpi', 'bar', 'line'],
    mockData: {
      kpi: { value: 34, unit: 'pts/sprint', trend: 6 },
      bar: {
        labels: ['Sprint 18', 'Sprint 19', 'Sprint 20', 'Sprint 21', 'Sprint 22', 'Sprint 23'],
        values: [28, 32, 30, 35, 31, 34],
      },
      line: {
        points: [
          { x: 'Sprint 18', y: 28 },
          { x: 'Sprint 19', y: 32 },
          { x: 'Sprint 20', y: 30 },
          { x: 'Sprint 21', y: 35 },
          { x: 'Sprint 22', y: 31 },
          { x: 'Sprint 23', y: 34 },
        ],
      },
    },
  },

  // ─── 3. Task Completion Rate ───────────────────────────────────────
  {
    id: 'm_completion',
    name: 'Task Completion Rate',
    description: 'Percentage of tasks completed on time this month',
    compatibleChartTypes: ['kpi', 'line'],
    mockData: {
      kpi: { value: 78, unit: '%', trend: -3 },
      line: {
        points: [
          { x: 'Jan', y: 82 },
          { x: 'Feb', y: 79 },
          { x: 'Mar', y: 85 },
          { x: 'Apr', y: 81 },
          { x: 'May', y: 78 },
        ],
      },
    },
  },

  // ─── 4. Issues by Priority ────────────────────────────────────────
  {
    id: 'm_priority_dist',
    name: 'Issues by Priority',
    description: 'Distribution of open issues by priority level',
    compatibleChartTypes: ['bar', 'pie', 'table'],
    mockData: {
      bar: {
        labels: ['Critical', 'High', 'Medium', 'Low'],
        values: [6, 13, 18, 10],
      },
      pie: {
        segments: [
          { label: 'Critical', value: 6 },
          { label: 'High', value: 13 },
          { label: 'Medium', value: 18 },
          { label: 'Low', value: 10 },
        ],
      },
      table: {
        columns: ['Priority', 'Count', '% of Total'],
        rows: [
          { Priority: 'Critical', Count: 6, '% of Total': '12.8%' },
          { Priority: 'High', Count: 13, '% of Total': '27.7%' },
          { Priority: 'Medium', Count: 18, '% of Total': '38.3%' },
          { Priority: 'Low', Count: 10, '% of Total': '21.3%' },
        ],
      },
    },
  },

  // ─── 5. Team Workload ─────────────────────────────────────────────
  {
    id: 'm_workload',
    name: 'Team Workload',
    description: 'Number of tasks assigned per team member',
    compatibleChartTypes: ['bar', 'pie', 'table'],
    mockData: {
      bar: {
        labels: ['Marco', 'Luis Carlos', 'Camou', 'Antonio', 'Diana'],
        values: [12, 9, 11, 7, 8],
      },
      pie: {
        segments: [
          { label: 'Marco', value: 12 },
          { label: 'Luis Carlos', value: 9 },
          { label: 'Camou', value: 11 },
          { label: 'Antonio', value: 7 },
          { label: 'Diana', value: 8 },
        ],
      },
      table: {
        columns: ['Member', 'Assigned', 'In Progress', 'Done'],
        rows: [
          { Member: 'Marco', Assigned: 12, 'In Progress': 5, Done: 7 },
          { Member: 'Luis Carlos', Assigned: 9, 'In Progress': 4, Done: 5 },
          { Member: 'Camou', Assigned: 11, 'In Progress': 6, Done: 5 },
          { Member: 'Antonio', Assigned: 7, 'In Progress': 2, Done: 5 },
          { Member: 'Diana', Assigned: 8, 'In Progress': 3, Done: 5 },
        ],
      },
    },
  },

  // ─── 6. Avg. Resolution Time ──────────────────────────────────────
  {
    id: 'm_resolution',
    name: 'Avg. Resolution Time',
    description: 'Average time to resolve an issue (in hours)',
    compatibleChartTypes: ['kpi', 'line', 'table'],
    mockData: {
      kpi: { value: 18.5, unit: 'hours', trend: -8 },
      line: {
        points: [
          { x: 'Jan', y: 24 },
          { x: 'Feb', y: 22 },
          { x: 'Mar', y: 20 },
          { x: 'Apr', y: 19.5 },
          { x: 'May', y: 18.5 },
        ],
      },
      table: {
        columns: ['Month', 'Avg. Hours', 'Issues Resolved'],
        rows: [
          { Month: 'January', 'Avg. Hours': 24, 'Issues Resolved': 35 },
          { Month: 'February', 'Avg. Hours': 22, 'Issues Resolved': 41 },
          { Month: 'March', 'Avg. Hours': 20, 'Issues Resolved': 38 },
          { Month: 'April', 'Avg. Hours': 19.5, 'Issues Resolved': 44 },
          { Month: 'May', 'Avg. Hours': 18.5, 'Issues Resolved': 47 },
        ],
      },
    },
  },

  // ─── 7. Bug Rate ──────────────────────────────────────────────────
  {
    id: 'm_bugs',
    name: 'Bug Rate',
    description: 'New bugs reported per week',
    compatibleChartTypes: ['kpi', 'line'],
    mockData: {
      kpi: { value: 5, unit: 'bugs/week', trend: -20 },
      line: {
        points: [
          { x: 'W1', y: 8 },
          { x: 'W2', y: 7 },
          { x: 'W3', y: 9 },
          { x: 'W4', y: 6 },
          { x: 'W5', y: 5 },
        ],
      },
    },
  },
];
