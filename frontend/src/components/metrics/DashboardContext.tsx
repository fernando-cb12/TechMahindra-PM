import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Card, ChartType, DashboardState, Metric } from './types';
import { DEFAULT_SIZES } from './types';
import { getMetrics } from '../../services/metricsService';

// ── localStorage helpers ────────────────────────────────────────────
const STORAGE_KEY = 'mmd_layout';

interface StoredLayout {
  version: number;
  cards: Card[];
}

function loadLayout(): Card[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: StoredLayout = JSON.parse(raw);
    if (parsed.version === 1 && Array.isArray(parsed.cards)) return parsed.cards;
  } catch {
    // corrupted — ignore
  }
  return [];
}

function saveLayout(cards: Card[]) {
  const payload: StoredLayout = { version: 1, cards };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

// ── Context value shape ─────────────────────────────────────────────
interface DashboardContextValue extends DashboardState {
  metrics: Metric[];
  hasUnsavedChanges: boolean;
  toggleEditMode: () => void;
  openAddModal: () => void;
  closeAddModal: () => void;
  addCard: (metricId: string, chartType: ChartType) => void;
  removeCard: (cardId: string) => void;
  updateLayouts: (updated: Card[]) => void;
  confirmEdit: () => void;
  discardChanges: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

// ── Provider ────────────────────────────────────────────────────────
export function DashboardProvider({ children }: { children: ReactNode }) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [cards, setCards] = useState<Card[]>(() => loadLayout());
  const [originalCards, setOriginalCards] = useState<Card[]>(() => loadLayout());
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Load metric definitions once
  useEffect(() => {
    getMetrics().then(setMetrics);
  }, []);

  // ── helpers ─────────────────────────────────────────────────────
  const findFirstEmpty = useCallback(
    (w: number, h: number, currentCards: Card[]): { x: number; y: number } => {
      const cols = 12;
      // Build an occupancy bitmap
      const occupied = new Set<string>();
      for (const c of currentCards) {
        for (let dx = 0; dx < c.layout.w; dx++) {
          for (let dy = 0; dy < c.layout.h; dy++) {
            occupied.add(`${c.layout.x + dx},${c.layout.y + dy}`);
          }
        }
      }
      // Scan row-by-row for a free rectangle
      for (let y = 0; y < 100; y++) {
        for (let x = 0; x <= cols - w; x++) {
          let fits = true;
          for (let dx = 0; dx < w && fits; dx++) {
            for (let dy = 0; dy < h && fits; dy++) {
              if (occupied.has(`${x + dx},${y + dy}`)) fits = false;
            }
          }
          if (fits) return { x, y };
        }
      }
      return { x: 0, y: 0 };
    },
    [],
  );

  // ── detect changes ──────────────────────────────────────────────
  const hasUnsavedChanges = JSON.stringify(cards) !== JSON.stringify(originalCards);

  // ── actions ─────────────────────────────────────────────────────
  const toggleEditMode = useCallback(() => setIsEditMode((prev) => !prev), []);
  const openAddModal = useCallback(() => setIsAddModalOpen(true), []);
  const closeAddModal = useCallback(() => setIsAddModalOpen(false), []);

  const addCard = useCallback(
    (metricId: string, chartType: ChartType) => {
      const size = DEFAULT_SIZES[chartType];
      setCards((prev) => {
        const pos = findFirstEmpty(size.w, size.h, prev);
        const newCard: Card = {
          id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          metricId,
          chartType,
          timeRangeLabel: 'Last 30 days',
          layout: { ...pos, ...size },
        };
        return [...prev, newCard];
      });
      setIsEditMode(true);
      setIsAddModalOpen(false);
    },
    [findFirstEmpty],
  );

  const removeCard = useCallback((cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  }, []);

  const updateLayouts = useCallback((updated: Card[]) => {
    setCards(updated);
  }, []);

  const confirmEdit = useCallback(() => {
    setIsEditMode(false);
    saveLayout(cards);
    setOriginalCards(cards);
  }, [cards]);

  const discardChanges = useCallback(() => {
    setCards(originalCards);
    setIsEditMode(false);
  }, [originalCards]);

  // ── memoised value ─────────────────────────────────────────────
  const value = useMemo<DashboardContextValue>(
    () => ({
      metrics,
      cards,
      isEditMode,
      isAddModalOpen,
      hasUnsavedChanges,
      toggleEditMode,
      openAddModal,
      closeAddModal,
      addCard,
      removeCard,
      updateLayouts,
      confirmEdit,
      discardChanges,
    }),
    [
      metrics,
      cards,
      isEditMode,
      isAddModalOpen,
      hasUnsavedChanges,
      toggleEditMode,
      openAddModal,
      closeAddModal,
      addCard,
      removeCard,
      updateLayouts,
      confirmEdit,
      discardChanges,
    ],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

// ── Hook ────────────────────────────────────────────────────────────
export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within <DashboardProvider>');
  return ctx;
}
