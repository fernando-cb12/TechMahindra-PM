import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import type { TableData } from '../types';

interface TableChartProps {
  data: TableData;
}

function TableChart({ data }: TableChartProps) {
  return (
    <TableContainer sx={{ height: '100%', overflow: 'auto' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {data.columns.map((col) => (
              <TableCell
                key={col}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  py: 0.5,
                  backgroundColor: 'background.paper',
                  whiteSpace: 'nowrap',
                }}
              >
                {col}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.rows.map((row, idx) => (
            <TableRow key={idx} hover>
              {data.columns.map((col) => (
                <TableCell
                  key={col}
                  sx={{
                    fontSize: '0.7rem',
                    py: 0.4,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row[col] ?? '—'}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default TableChart;
