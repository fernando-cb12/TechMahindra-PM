import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { Responsive } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import MetricCard from './MetricCard';
import { useDashboard } from './useDashboard';
import type { Card } from './types';

const GRID_COLS = 12;

function DashboardGrid() {
  const { cards, metrics, isEditMode, removeCard, updateLayouts } = useDashboard();
  const containerRef = useRef<HTMLDivElement>(null);
  const [rowHeight, setRowHeight] = useState(80);
  const [containerWidth, setContainerWidth] = useState(1200);

  // Keep row height = column width (square cells) + track container width
  useEffect(() => {
    function recalc() {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(width);
        // account for margins (10px gap × 11 inner gaps)
        const colWidth = (width - 10 * (GRID_COLS - 1)) / GRID_COLS;
        setRowHeight(Math.max(colWidth, 40));
      }
    }
    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, []);

  // Convert our Card[] to react-grid-layout layout items
  const rglLayout = useMemo(
    () =>
      cards.map((c) => ({
        i: c.id,
        x: c.layout.x,
        y: c.layout.y,
        w: c.layout.w,
        h: c.layout.h,
        static: !isEditMode,
      })),
    [cards, isEditMode],
  );

  const handleLayoutChange = useCallback(
    (layout: Layout) => {
      if (!isEditMode) return;
      const updated: Card[] = cards.map((card) => {
        const item = layout.find((l) => l.i === card.id);
        if (!item) return card;
        return {
          ...card,
          layout: { x: item.x, y: item.y, w: item.w, h: item.h },
        };
      });
      updateLayouts(updated);
    },
    [cards, isEditMode, updateLayouts],
  );

  const metricsMap = useMemo(() => {
    const map = new Map(metrics.map((m) => [m.id, m]));
    return map;
  }, [metrics]);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        minHeight: 400,
        // Subtle grid lines in edit mode
        ...(isEditMode && {
          backgroundImage: (theme) =>
            `linear-gradient(${theme.palette.divider} 1px, transparent 1px),
             linear-gradient(90deg, ${theme.palette.divider} 1px, transparent 1px)`,
          backgroundSize: `calc(100% / ${GRID_COLS}) ${rowHeight + 10}px`,
          backgroundPosition: '-1px -1px',
        }),
      }}
    >
      <Responsive
        className="mmd-grid"
        width={containerWidth}
        layouts={{ lg: rglLayout }}
        breakpoints={{ lg: 0 }}
        cols={{ lg: GRID_COLS }}
        rowHeight={rowHeight}
        margin={[10, 10] as [number, number]}
        resizeConfig={{ enabled: isEditMode }}
        dragConfig={{ enabled: isEditMode, handle: '.mmd-drag-handle' }}
        onLayoutChange={handleLayoutChange}
      >
        {cards.map((card) => (
          <div key={card.id}>
            {/* Invisible drag handle that covers the card header area */}
            {isEditMode && (
              <div
                className="mmd-drag-handle"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 32,
                  cursor: 'grab',
                  zIndex: 1,
                }}
              />
            )}
            <MetricCard
              card={card}
              metric={metricsMap.get(card.metricId)}
              isEditMode={isEditMode}
              onRemove={removeCard}
            />
          </div>
        ))}
      </Responsive>
    </Box>
  );
}

export default DashboardGrid;
