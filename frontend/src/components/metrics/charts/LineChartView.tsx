import { useTheme } from '@mui/material/styles';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { LineData } from '../types';

interface LineChartViewProps {
  data: LineData;
}

function LineChartView({ data }: LineChartViewProps) {
  const theme = useTheme();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data.points} margin={{ top: 8, right: 8, bottom: 4, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis
          dataKey="x"
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
        <Line
          type="monotone"
          dataKey="y"
          stroke={theme.palette.primary.main}
          strokeWidth={2}
          dot={{ r: 3, fill: theme.palette.primary.main }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default LineChartView;
