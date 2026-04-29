import { Typography } from '@mui/material';
import type { ChartType, MetricDataByChart } from './types';
import KpiChart from './charts/KpiChart';
import BarChartView from './charts/BarChartView';
import LineChartView from './charts/LineChartView';
import PieDonutChart from './charts/PieDonutChart';
import TableChart from './charts/TableChart';

interface ChartRendererProps {
  chartType: ChartType;
  data: MetricDataByChart;
}

function ChartRenderer({ chartType, data }: ChartRendererProps) {
  switch (chartType) {
    case 'kpi':
      return data.kpi ? <KpiChart data={data.kpi} /> : null;
    case 'bar':
      return data.bar ? <BarChartView data={data.bar} /> : null;
    case 'line':
      return data.line ? <LineChartView data={data.line} /> : null;
    case 'pie':
      return data.pie ? <PieDonutChart data={data.pie} /> : null;
    case 'table':
      return data.table ? <TableChart data={data.table} /> : null;
    default:
      return <Typography color="error">Unknown chart type</Typography>;
  }
}

export default ChartRenderer;
