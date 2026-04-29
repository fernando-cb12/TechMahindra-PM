import { useTheme } from '@mui/material/styles';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { PieData } from '../types';

interface PieDonutChartProps {
  data: PieData;
}

const COLORS = ['#5F0229', '#A3334D', '#EAC24F', '#4CAF50', '#29251D', '#7C7C7C'];

function PieDonutChart({ data }: PieDonutChartProps) {
  const theme = useTheme();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data.segments}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius="40%"
          outerRadius="70%"
          paddingAngle={2}
          stroke="none"
        >
          {data.segments.map((_entry, idx) => (
            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Pie>
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
        <Legend
          wrapperStyle={{ fontSize: 10, color: theme.palette.text.secondary }}
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default PieDonutChart;
