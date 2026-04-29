# Main Metric Dashboard (MMD) Specification

## 0. Project Audit (Complete Before Any Code)

Before creating any file, audit the existing project and document findings directly 
in this spec under each subsection:

### 0.1 Existing Component Inventory
- **`Sidebar`** (`src/components/layout/Sidebar.tsx`): Navigation component.
  - *Props*: `SidebarProps` (navItems, projects, etc.)
  - *Usage*: Main application layout navigation.
- **`SettingsCard`** (`src/components/settings/SettingsCard.tsx`): Reusable wrapper around MUI `Paper` for white, rounded containers.
  - *Props*: `SettingsCardProps` (extends `PaperProps`)
  - *Usage*: Potential base wrapper for `MetricCard` to maintain consistent styling.
- **`SummaryCards`** (`src/components/dashboard/SummaryCards.tsx`): Renders KPI values.
  - *Props*: `SummaryCardsProps` (items: `SummaryCardData[]`)
  - *Usage*: We will reuse the internal KPI styling for our `KpiChart` component.
- **Modals**: No shared custom modal component found. We will use standard `@mui/material/Dialog` for the `AddMetricModal`.

### 0.2 Theme & Design Tokens
- **Theme File**: `src/styles/theme.ts` (MUI `createTheme`)
- **Colors**: 
  - Primary (`#5F0229` main, `#A3334D` light)
  - Secondary (`#29251D` sidebar)
  - Neutral (Grays 50-900)
  - Status (Success `#4CAF50`, Error `#FB485B`, Warning `#EAC24F`)
- **Typography**: `'Montserrat', 'Roboto', sans-serif`. Base size `14px`. `h1` (36px), `h2` (30px), `h3` (24px).
- **Border Radius**: Global MUI shape `borderRadius` is `8`.
- **Framework**: Standard MUI styling (`sx` props), no Tailwind config present.

### 0.3 Existing Patterns
- **Modals**: Standard MUI components are used (e.g., `Dialog`, `Popover`), no custom library for modals.
- **Global State**: No external library (Redux/Zustand) is installed. Context API or local state with prop drilling is the established pattern. We will use React Context for `DashboardState`.
- **API Calls**: Structured as services (e.g., `src/services/workspacesService.ts`). We will create a `metricsService.ts`.
- **Chart Library**: None currently installed.
- **Drag-and-Drop Library**: None currently installed.
- **Icons**: `@mui/icons-material` is used.

### 0.4 Library Constraints
**PROPOSED LIBRARIES FOR APPROVAL:**
1. **`react-grid-layout`**: To handle the 12-column grid, drag-and-drop, and resizing capabilities efficiently without writing complex matrix math from scratch.
2. **`recharts`**: A React-friendly chart library for rendering Line, Bar, and Pie charts using SVG.

*approval granted*


## 1. Overview
The Main Metric Dashboard (MMD) provides a customizable grid interface for viewing key metrics. The dashboard supports adding, resizing, and arranging various charts (KPIs, bar charts, line charts, pie charts, and tables) on a 12-column grid.

## 2. Component Tree

> Every component in this tree must first check if an equivalent already exists 
> in the project. If it does, extend or wrap it — do not create a parallel version.
> Document the decision (reuse vs. new) next to each component in the final spec.

- **`MetricDashboard`** (Main container)
  - **`DashboardHeader`**: Contains dashboard title, "+ New component" button, and "Edit" / "Confirm" mode toggle button.
  - **`Sidebar`** (Existing Component - `src/components/layout/Sidebar.tsx`): Provides application navigation.
  - **`DashboardGrid`**: The 12-column droppable/resizable grid area. (Will use `react-grid-layout` if approved).
    - **`MetricCard`**: Wrapper for individual metrics. Handles drag-and-drop, resizing (in edit mode), and displays the card's header (metric name, delete affordance) and time range subtitle. (Will wrap MUI `Paper` similar to `SettingsCard` existing pattern).
      - **`ChartRenderer`**: Dynamically renders the appropriate chart component based on the configuration.
        - `KpiChart`: Will reuse typography tokens from existing `SummaryCards`.
        - `BarChart` / `LineChart` / `PieDonutChart`: Will wrap `recharts` components.
        - `TableChart`: Will use MUI `Table`.
  - **`AddMetricModal`** (Pop-up): The two-step flow to add a new metric. (Will use MUI `Dialog`).
    - **`Step1_SelectMetric`**: List of available metrics with descriptions.
    - **`Step2_SelectChartType`**: List of compatible chart types (incompatible options visible but disabled with a clear label).

## 3. TypeScript Interfaces

```typescript
export type ChartType = 'kpi' | 'bar' | 'line' | 'pie' | 'table';


export interface KpiData { value: number; unit: string; trend?: number; }
export interface BarData { labels: string[]; values: number[]; }
export interface LineData { points: { x: string; y: number }[]; }
export interface PieData { segments: { label: string; value: number }[]; }
export interface TableData { columns: string[]; rows: Record[]; }

export type MetricMockData = KpiData | BarData | LineData | PieData | TableData;

export interface MetricDataByChart {
  kpi?: KpiData;
  bar?: BarData;
  line?: LineData;
  pie?: PieData;
  table?: TableData;
}

export interface Metric {
  id: string;
  name: string;
  description: string;
  compatibleChartTypes: ChartType[];
  mockData: MetricDataByChart; // cada key presente = chart type soportado
}

// Card and Layout 
export interface Card {
  id: string;
  metricId: string;
  chartType: ChartType;
  timeRangeLabel: string;
  layout: GridLayout;
}

export interface GridLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardState {
  isEditMode: boolean;
  cards: Card[];
  isAddModalOpen: boolean;
}
```

## 4. Grid System & Card Defaults
- **Grid Layout**: 12-column base grid. Row height = column width.
- **Interactions**: Cards snap to grid on drop. No overlap. Overlapping moves are blocked with a visual indicator (e.g., red tint).

**Default Sizes (columns × rows):**
- Single number / KPI: 2×2
- Bar chart: 4×3
- Line chart: 4×3
- Pie / donut chart: 3×3
- Table: 6×4

## 5. Compatibility Matrix (Mock Data)

| Metric ID | Name | KPI (2x2) | Bar (4x3) | Line (4x3) | Pie (3x3) | Table (6x4) |
|---|---|:---:|:---:|:---:|:---:|:---:|
| `m_rev` | Total Revenue | ✅ | ✅ | ✅ | ❌ | ✅ |
| `m_users` | Active Users | ✅ | ✅ | ✅ | ❌ | ❌ |
| `m_conv` | Conversion Rate | ✅ | ❌ | ✅ | ❌ | ❌ |
| `m_src` | Traffic Sources | ❌ | ✅ | ❌ | ✅ | ✅ |
| `m_satisf`| Customer Satisfaction | ✅ | ❌ | ✅ | ❌ | ❌ |
| `m_top_prod`| Top Products | ❌ | ✅ | ❌ | ✅ | ✅ |
| `m_err` | System Errors | ✅ | ❌ | ✅ | ❌ | ✅ |

## 6. State Management Plan
- **Global State (e.g., React Context or Zustand):**
  - `cards`: Array of currently placed metric cards.
  - `isEditMode`: Boolean to toggle the global edit mode.
  - `isAddModalOpen`: Boolean to control the "Add component" pop-up.
- **Local State:**
  - `AddMetricModal`: Current step (1 or 2), selected metric (step 1), selected chart type (step 2).
  - `DashboardGrid`: Temporary drag/resize layout state (to show visual indicators before drop is confirmed).

## 7. localStorage Schema
Layout is persisted using the `mmd_layout` key.
```json
{
  "version": 1,
  "cards": [
    {
      "id": "card-uuid-1",
      "metricId": "m_rev",
      "chartType": "line",
      "timeRangeLabel": "Last 30 days",
      "layout": { "x": 0, "y": 0, "w": 4, "h": 3 }
    }
  ]
}
```

## 8. Backend Integration Path
When integrating the real backend, the following changes will be needed:
1. **Service Layer**: Update `useMetricsData()` to fetch `Metric` definitions and `DashboardState` from an API endpoint instead of `mocks/metrics.ts`.
2. **Data Fetching**: Replace the static `mockData` payload with asynchronous API calls per card. Consider implementing loading skeletons and error boundaries in the `ChartRenderer`.
3. **Persistence**: Replace `localStorage.setItem('mmd_layout', ...)` with an API call (e.g., `PUT /api/dashboard/layout`) triggered upon clicking "Confirm" to exit Edit Mode.
4. **Initial Load**: Fetch the initial layout on dashboard mount, falling back to an empty dashboard or default template.
