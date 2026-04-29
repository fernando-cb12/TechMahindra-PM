import { useTheme } from '@mui/material/styles';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { BarData } from '../types';

interface BarChartViewProps {
  data: BarData;
}

function BarChartView({ data }: BarChartViewProps) {
  const theme = useTheme();
  const chartData = data.labels.map((label, i) => ({ name: label, value: data.values[i] }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : theme.palette.background.paper,
            border: `1px solid ${theme.palette.mode === 'dark' ? '#555' : theme.palette.divider}`,
            borderRadius: 4,
            fontSize: 12,
            color: theme.palette.text.primary,
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          }}
          labelStyle={{ color: theme.palette.text.primary, fontWeight: 600 }}
          itemStyle={{ color: theme.palette.text.secondary }}
        />
        <Bar dataKey="value" fill={theme.palette.primary.main} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default BarChartView;
