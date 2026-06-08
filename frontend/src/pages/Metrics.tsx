import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import type { Blocker } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SaveIcon from '@mui/icons-material/Save';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { Responsive } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  createMetricDashboard,
  deleteMetricDashboard,
  deleteMetricPresetOverride,
  duplicateMetricDashboard,
  getMetricCatalog,
  getMetricDashboards,
  getMetricPresetOverrides,
  updateMetricPresetOverride,
  updateMetricFieldMapping,
  updateMetricDashboard,
  type MetricCatalog,
  type MetricDashboardConfig,
  type MetricDashboardRecord,
  type MetricFieldMappingRequest,
  type MetricSemanticField,
  type MetricWidgetConfig,
} from '../services/metricsService';
import {
  getWorkspaceBoards,
  getWorkspaceProjects,
  type WorkspaceBoard,
} from '../services/workspacesService';
import { showAppError, showAppNotification } from '../components/shared/appNotifications';
import { PRESETS, PRESET_WIDGETS } from '../components/metrics/analytics/presets';
import MetricWidget from '../components/metrics/analytics/MetricWidget';
import MetricBuilderDialog from '../components/metrics/analytics/MetricBuilderDialog';
import MetricDrilldownDialog from '../components/metrics/analytics/MetricDrilldownDialog';
import MetricFiltersBar from '../components/metrics/analytics/MetricFiltersBar';
import MetricHealthPanel from '../components/metrics/analytics/MetricHealthPanel';
import MetricFieldMappingDialog from '../components/metrics/analytics/MetricFieldMappingDialog';
import MetricRenameDialog from '../components/metrics/analytics/MetricRenameDialog';
import MetricDeleteDialog from '../components/metrics/analytics/MetricDeleteDialog';
import MetricUnsavedChangesDialog from '../components/metrics/analytics/MetricUnsavedChangesDialog';
import {
  DEFAULT_FILTERS,
  type DrilldownState,
  type GlobalFilters,
} from '../components/metrics/analytics/types';
import { useTheme } from '@mui/material/styles';

const METRICS_SELECTED_VIEW_STORAGE_KEY = 'metrics:selectedView';
const METRICS_FILTERS_STORAGE_KEY = 'metrics:globalFilters';
const METRICS_PRESET_OVERRIDES_STORAGE_KEY = 'metrics:presetOverrides';

type PresetOverride = {
  config?: MetricDashboardConfig;
};

function minimumWidgetHeight(widgetConfig: MetricWidgetConfig) {
  return widgetConfig.visualization === 'kpi' ? 2 : 2;
}

function normalizeMetricWidget(widgetConfig: MetricWidgetConfig): MetricWidgetConfig {
  const minHeight = minimumWidgetHeight(widgetConfig);
  const minWidth = widgetConfig.visualization === 'kpi' ? 2 : 2;
  if (widgetConfig.layout.h >= minHeight && widgetConfig.layout.w >= minWidth) return widgetConfig;
  return {
    ...widgetConfig,
    layout: {
      ...widgetConfig.layout,
      w: Math.max(widgetConfig.layout.w, minWidth),
      h: Math.max(widgetConfig.layout.h, minHeight),
    },
  };
}

function normalizeMetricWidgets(widgets: MetricWidgetConfig[] = []) {
  return widgets.map(normalizeMetricWidget);
}

function readStoredSelectedDashboardId() {
  try {
    return window.localStorage.getItem(METRICS_SELECTED_VIEW_STORAGE_KEY);
  } catch {
    return null;
  }
}

function readStoredFilters(): GlobalFilters | null {
  try {
    const raw = window.localStorage.getItem(METRICS_FILTERS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GlobalFilters>;
    return {
      ...DEFAULT_FILTERS,
      workspaceIds: Array.isArray(parsed.workspaceIds) ? parsed.workspaceIds.map(String) : [],
      boardIds: Array.isArray(parsed.boardIds) ? parsed.boardIds.map(String) : [],
      dateFrom: typeof parsed.dateFrom === 'string' ? parsed.dateFrom : '',
      dateTo: typeof parsed.dateTo === 'string' ? parsed.dateTo : '',
      workflow: typeof parsed.workflow === 'string' ? parsed.workflow : '',
      priority: typeof parsed.priority === 'string' ? parsed.priority : '',
      assigneeId: typeof parsed.assigneeId === 'string' ? parsed.assigneeId : '',
      dueDateState: typeof parsed.dueDateState === 'string' ? parsed.dueDateState : '',
    };
  } catch {
    return null;
  }
}

function readPresetOverrides(): Record<string, PresetOverride> {
  try {
    const raw = window.localStorage.getItem(METRICS_PRESET_OVERRIDES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, PresetOverride>;
    return Object.fromEntries(Object.entries(parsed).map(([presetId, override]) => [
      presetId,
      {
        config: {
          filters: override.config?.filters,
          widgets: Array.isArray(override.config?.widgets)
            ? normalizeMetricWidgets(override.config.widgets)
            : Array.isArray((override as { widgets?: MetricWidgetConfig[] }).widgets)
              ? normalizeMetricWidgets((override as { widgets?: MetricWidgetConfig[] }).widgets)
              : undefined,
        },
      },
    ]));
  } catch {
    return {};
  }
}

function presetWidgets(presetId: string, overrides: Record<string, PresetOverride>) {
  return normalizeMetricWidgets(overrides[presetId]?.config?.widgets ?? PRESET_WIDGETS[presetId] ?? PRESET_WIDGETS.delivery);
}

function isPresetDashboardId(id: string) {
  return id.startsWith('preset:') && PRESETS.some((preset) => `preset:${preset.id}` === id);
}

function resolveWidgetsForSelection(id: string, dashboards: MetricDashboardRecord[], presetOverrides: Record<string, PresetOverride>) {
  if (id.startsWith('preset:')) {
    return presetWidgets(id.slice('preset:'.length), presetOverrides);
  }
  const dashboard = dashboards.find((item) => item.id === id);
  return normalizeMetricWidgets(dashboard?.config.widgets ?? []);
}

function resolveFiltersForSelection(id: string, dashboards: MetricDashboardRecord[]) {
  if (id.startsWith('preset:')) {
    return DEFAULT_FILTERS;
  }
  const dashboard = dashboards.find((item) => item.id === id);
  return { ...DEFAULT_FILTERS, ...(dashboard?.config.filters ?? {}) };
}

function Metrics() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [catalog, setCatalog] = useState<MetricCatalog | null>(null);
  const [dashboards, setDashboards] = useState<MetricDashboardRecord[]>([]);
  const [presetOverrides, setPresetOverrides] = useState<Record<string, PresetOverride>>(() => readPresetOverrides());
  const [selectedDashboardId, setSelectedDashboardId] = useState<string>(() => readStoredSelectedDashboardId() ?? 'preset:delivery');
  const [widgets, setWidgets] = useState<MetricWidgetConfig[]>(() => presetWidgets('delivery', readPresetOverrides()));
  const [filters, setFilters] = useState<GlobalFilters>(DEFAULT_FILTERS);
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; title: string }>>([]);
  const [boards, setBoards] = useState<Array<WorkspaceBoard & { workspaceId: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<MetricWidgetConfig | null>(null);
  const [drilldown, setDrilldown] = useState<DrilldownState | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [pendingDashboardId, setPendingDashboardId] = useState<string | null>(null);
  const [pendingRouteBlocker, setPendingRouteBlocker] = useState<Blocker | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<HTMLElement | null>(null);
  const [mappingField, setMappingField] = useState<MetricSemanticField | null>(null);
  const [metricsRefreshKey, setMetricsRefreshKey] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  const selectedPreset = useMemo(() => PRESETS.find((preset) => `preset:${preset.id}` === selectedDashboardId), [selectedDashboardId]);
  const selectedDashboard = useMemo(() => dashboards.find((dashboard) => dashboard.id === selectedDashboardId), [dashboards, selectedDashboardId]);
  const savedConfig = useMemo(() => {
    if (selectedDashboard) {
      return {
        filters: { ...DEFAULT_FILTERS, ...(selectedDashboard.config.filters ?? {}) },
        widgets: normalizeMetricWidgets(selectedDashboard.config.widgets ?? []),
      };
    }
    if (selectedPreset) {
      return {
        filters,
        widgets: presetWidgets(selectedPreset.id, presetOverrides),
      };
    }
    return { filters: DEFAULT_FILTERS, widgets: presetWidgets('delivery', presetOverrides) };
  }, [filters, presetOverrides, selectedDashboard, selectedPreset]);
  const isDirty = JSON.stringify({ filters, widgets }) !== JSON.stringify(savedConfig);
  const canSaveDashboard = Boolean(selectedDashboard && isDirty);
  const canUpdatePreset = Boolean(selectedPreset && isDirty);
  const routeBlocker = useBlocker(({ currentLocation, nextLocation }) => (
    isEditMode
    && isDirty
    && currentLocation.pathname !== nextLocation.pathname
  ));

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [catalogData, dashboardData, workspaceData] = await Promise.all([
        getMetricCatalog(),
        getMetricDashboards(),
        getWorkspaceProjects(),
      ]);
      const presetOverrideData = await getMetricPresetOverrides();
      const backendPresetOverrides = Object.fromEntries(presetOverrideData.map((override) => [
        override.presetId,
        { config: { ...override.config, widgets: normalizeMetricWidgets(override.config.widgets ?? []) } },
      ]));
      const localPresetOverrides = readPresetOverrides();
      const currentPresetOverrides = { ...localPresetOverrides, ...backendPresetOverrides };
      if (Object.keys(localPresetOverrides).length > 0) {
        void Promise.all(Object.entries(localPresetOverrides)
          .filter(([presetId]) => !backendPresetOverrides[presetId])
          .map(([presetId, override]) => updateMetricPresetOverride(presetId, override.config ?? {})))
          .then(() => window.localStorage.removeItem(METRICS_PRESET_OVERRIDES_STORAGE_KEY))
          .catch(() => undefined);
      }
      setCatalog(catalogData);
      setDashboards(dashboardData);
      const defaultDashboard = dashboardData.find((dashboard) => dashboard.isDefault);
      const storedSelectedId = readStoredSelectedDashboardId();
      const storedSelectionIsValid = storedSelectedId
        && (isPresetDashboardId(storedSelectedId) || dashboardData.some((dashboard) => dashboard.id === storedSelectedId));
      const nextSelectedId = storedSelectionIsValid
        ? storedSelectedId
        : defaultDashboard?.id ?? 'preset:delivery';
      setPresetOverrides(currentPresetOverrides);
      setSelectedDashboardId(nextSelectedId);
      setWidgets(resolveWidgetsForSelection(nextSelectedId, dashboardData, currentPresetOverrides));
      setFilters(readStoredFilters() ?? resolveFiltersForSelection(nextSelectedId, dashboardData));
      setWorkspaces(workspaceData.map((workspace) => ({ id: workspace.id, title: workspace.title })));
      const boardGroups = await Promise.all(workspaceData.map(async (workspace) => {
        const workspaceBoards = await getWorkspaceBoards(workspace.id);
        return workspaceBoards.map((board) => ({ ...board, workspaceId: workspace.id }));
      }));
      setBoards(boardGroups.flat());
    } catch (e) {
      showAppError(e, 'Failed to load Metrics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (isLoading) return;
    let cancelled = false;
    getMetricCatalog({ workspaceIds: filters.workspaceIds, boardIds: filters.boardIds })
      .then((catalogData) => {
        if (!cancelled) setCatalog(catalogData);
      })
      .catch((e) => {
        if (!cancelled) showAppError(e, 'Failed to refresh Metrics health');
      });
    return () => {
      cancelled = true;
    };
  }, [filters.boardIds, filters.workspaceIds, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    window.localStorage.setItem(METRICS_SELECTED_VIEW_STORAGE_KEY, selectedDashboardId);
  }, [isLoading, selectedDashboardId]);

  useEffect(() => {
    if (isLoading) return;
    window.localStorage.setItem(METRICS_FILTERS_STORAGE_KEY, JSON.stringify(filters));
  }, [filters, isLoading]);

  useEffect(() => {
    if (routeBlocker.state === 'blocked') {
      setPendingRouteBlocker(routeBlocker);
    }
  }, [routeBlocker]);

  useEffect(() => {
    if (!isEditMode || !isDirty) return undefined;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, isEditMode]);

  useEffect(() => {
    const element = gridRef.current;
    if (!element) return undefined;

    let frameId = 0;
    const recalc = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        setContainerWidth(Math.max(320, Math.floor(element.getBoundingClientRect().width)));
      });
    };

    recalc();
    const observer = new ResizeObserver(recalc);
    observer.observe(element);
    window.addEventListener('resize', recalc);
    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener('resize', recalc);
    };
  }, [isLoading, widgets.length]);

  const applySelect = (id: string) => {
    setSelectedDashboardId(id);
    setWidgets(resolveWidgetsForSelection(id, dashboards, presetOverrides));
    setFilters(resolveFiltersForSelection(id, dashboards));
  };

  const handleSelect = (id: string) => {
    if (id === selectedDashboardId) return;
    if (isDirty) {
      setPendingDashboardId(id);
      return;
    }
    applySelect(id);
  };

  const handleLayoutChange = (layout: Layout) => {
    if (!isEditMode) return;
    setWidgets((prev) => prev.map((item) => {
      const nextLayout = layout.find((layoutItem) => layoutItem.i === item.id);
      return nextLayout
        ? { ...item, layout: { x: nextLayout.x, y: nextLayout.y, w: nextLayout.w, h: nextLayout.h } }
        : item;
    }));
  };

  const saveCurrentSelection = async () => {
    setIsSaving(true);
    try {
      if (selectedDashboard) {
        const updated = await updateMetricDashboard(selectedDashboard.id, {
          name: selectedDashboard.name,
          scopeType: selectedDashboard.scopeType,
          scopeId: selectedDashboard.scopeId,
          isDefault: selectedDashboard.isDefault,
          visibility: selectedDashboard.visibility,
          config: { filters, widgets },
        });
        setDashboards((prev) => prev.map((item) => item.id === updated.id ? updated : item));
        showAppNotification({ message: 'Metrics dashboard saved', severity: 'success' });
        return true;
      }
      if (selectedPreset) {
        const config: MetricDashboardConfig = { widgets: normalizeMetricWidgets(widgets) };
        const updated = await updateMetricPresetOverride(selectedPreset.id, config);
        const next = {
          ...presetOverrides,
          [selectedPreset.id]: { config: { ...updated.config, widgets: normalizeMetricWidgets(updated.config.widgets ?? []) } },
        };
        setPresetOverrides(next);
        showAppNotification({ message: `${selectedPreset.label} preset updated`, severity: 'success' });
        return true;
      }
      const created = await createMetricDashboard({
        name: 'My Metrics Dashboard',
        scopeType: 'global',
        scopeId: null,
        isDefault: false,
        visibility: 'private',
        config: { filters, widgets },
      });
      setDashboards((prev) => [created, ...prev]);
      setSelectedDashboardId(created.id);
      showAppNotification({ message: 'Metrics dashboard saved', severity: 'success' });
      return true;
    } catch (e) {
      showAppError(e, selectedPreset ? 'Failed to update preset' : 'Failed to save Metrics dashboard');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    await saveCurrentSelection();
  };

  const handleDuplicate = async () => {
    if (!selectedDashboard) {
      try {
        const created = await createMetricDashboard({
          name: selectedPreset ? `${selectedPreset.label} Copy` : 'My Metrics Dashboard',
          scopeType: 'global',
          scopeId: null,
          isDefault: false,
          visibility: 'private',
          config: { filters, widgets },
        });
        setDashboards((prev) => [created, ...prev]);
        setSelectedDashboardId(created.id);
        showAppNotification({ message: 'Metrics dashboard duplicated', severity: 'success' });
      } catch (e) {
        showAppError(e, 'Failed to duplicate Metrics dashboard');
      }
      return;
    }
    try {
      const copy = await duplicateMetricDashboard(selectedDashboard.id);
      setDashboards((prev) => [copy, ...prev]);
      setSelectedDashboardId(copy.id);
      setWidgets(normalizeMetricWidgets(copy.config.widgets ?? []));
      setFilters({ ...DEFAULT_FILTERS, ...(copy.config.filters ?? {}) });
      showAppNotification({ message: 'Metrics dashboard duplicated', severity: 'success' });
    } catch (e) {
      showAppError(e, 'Failed to duplicate Metrics dashboard');
    }
  };

  const handleRename = async () => {
    if (!selectedDashboard) {
      showAppNotification({ message: 'Save this preset as a dashboard before renaming it.', severity: 'info' });
      return;
    }
    setRenameValue(selectedDashboard.name);
    setRenameDialogOpen(true);
  };

  const confirmRename = async () => {
    if (!selectedDashboard) return;
    const nextName = renameValue.trim();
    if (!nextName || nextName === selectedDashboard.name) {
      setRenameDialogOpen(false);
      return;
    }
    try {
      const updated = await updateMetricDashboard(selectedDashboard.id, {
        name: nextName,
        scopeType: selectedDashboard.scopeType,
        scopeId: selectedDashboard.scopeId,
        isDefault: selectedDashboard.isDefault,
        visibility: selectedDashboard.visibility,
        config: { filters, widgets },
      });
      setDashboards((prev) => prev.map((item) => item.id === updated.id ? updated : item));
      setRenameDialogOpen(false);
      showAppNotification({ message: 'Metrics dashboard renamed', severity: 'success' });
    } catch (e) {
      showAppError(e, 'Failed to rename Metrics dashboard');
    }
  };

  const handleDelete = async () => {
    if (!selectedDashboard) {
      showAppNotification({ message: 'Presets cannot be deleted. Duplicate the preset to create an editable dashboard.', severity: 'info' });
      return;
    }
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedDashboard) return;
    try {
      await deleteMetricDashboard(selectedDashboard.id);
      setDashboards((prev) => prev.filter((item) => item.id !== selectedDashboard.id));
      setSelectedDashboardId('preset:delivery');
      setWidgets(normalizeMetricWidgets(PRESET_WIDGETS.delivery));
      setFilters(DEFAULT_FILTERS);
      setDeleteDialogOpen(false);
      showAppNotification({ message: 'Metrics dashboard deleted', severity: 'success' });
    } catch (e) {
      showAppError(e, 'Failed to delete Metrics dashboard');
    }
  };

  const handleSetDefault = async () => {
    if (!selectedDashboard) {
      showAppNotification({ message: 'Save this preset as a dashboard before setting it as default.', severity: 'info' });
      return;
    }
    try {
      const updated = await updateMetricDashboard(selectedDashboard.id, {
        name: selectedDashboard.name,
        scopeType: selectedDashboard.scopeType,
        scopeId: selectedDashboard.scopeId,
        isDefault: true,
        visibility: selectedDashboard.visibility,
        config: { filters, widgets },
      });
      setDashboards((prev) => prev.map((item) => ({ ...item, isDefault: item.id === updated.id })));
      showAppNotification({ message: 'Default Metrics dashboard updated', severity: 'success' });
    } catch (e) {
      showAppError(e, 'Failed to set default dashboard');
    }
  };

  const handleUpdatePreset = async () => {
    if (!selectedPreset) {
      showAppNotification({ message: 'Update preset is available while viewing a preset.', severity: 'info' });
      return;
    }
    await saveCurrentSelection();
  };

  const handleResetPreset = async () => {
    if (!selectedPreset) {
      showAppNotification({ message: 'Reset is available while viewing a preset.', severity: 'info' });
      return;
    }
    try {
      await deleteMetricPresetOverride(selectedPreset.id);
      window.localStorage.removeItem(METRICS_PRESET_OVERRIDES_STORAGE_KEY);
      setPresetOverrides((prev) => {
      const next = { ...prev };
      delete next[selectedPreset.id];
      return next;
      });
      setWidgets(normalizeMetricWidgets(PRESET_WIDGETS[selectedPreset.id] ?? PRESET_WIDGETS.delivery));
      setFilters(DEFAULT_FILTERS);
      showAppNotification({ message: 'Preset reset', severity: 'success' });
    } catch (e) {
      showAppError(e, 'Failed to reset preset');
    }
  };

  const discardPendingSelection = () => {
    if (!pendingDashboardId) return;
    const id = pendingDashboardId;
    setPendingDashboardId(null);
    setIsEditMode(false);
    applySelect(id);
  };

  const savePendingSelection = async () => {
    if (!pendingDashboardId) return;
    const id = pendingDashboardId;
    const saved = await saveCurrentSelection();
    if (!saved) return;
    setPendingDashboardId(null);
    setIsEditMode(false);
    applySelect(id);
  };

  const cancelPendingRouteNavigation = () => {
    pendingRouteBlocker?.reset?.();
    routeBlocker.reset?.();
    setPendingRouteBlocker(null);
  };

  const discardPendingRouteNavigation = () => {
    const blocker = pendingRouteBlocker;
    setPendingRouteBlocker(null);
    setIsEditMode(false);
    blocker?.proceed?.();
  };

  const savePendingRouteNavigation = async () => {
    const blocker = pendingRouteBlocker;
    const saved = await saveCurrentSelection();
    if (!saved) return;
    setPendingRouteBlocker(null);
    setIsEditMode(false);
    blocker?.proceed?.();
  };

  const handleEditLayoutToggle = async () => {
    if (!isEditMode) {
      setIsEditMode(true);
      return;
    }
    if (isDirty) {
      const saved = await saveCurrentSelection();
      if (!saved) return;
    }
    setIsEditMode(false);
  };

  const handleSaveWidget = (widgetConfig: MetricWidgetConfig) => {
    setWidgets((prev) => {
      const normalizedWidget = normalizeMetricWidget(widgetConfig);
      const exists = prev.some((item) => item.id === widgetConfig.id);
      if (exists) {
        return prev.map((item) => item.id === widgetConfig.id ? normalizedWidget : item);
      }
      return [...prev, { ...normalizedWidget, id: `${normalizedWidget.id}-${Date.now()}` }];
    });
    setEditingWidget(null);
  };

  const handleRemoveWidget = (widgetConfig: MetricWidgetConfig) => {
    setWidgets((prev) => prev.filter((item) => item.id !== widgetConfig.id));
  };

  const closeMoreMenu = () => {
    setMoreMenuAnchor(null);
  };

  const runMenuAction = (action: () => void | Promise<void>) => {
    closeMoreMenu();
    void action();
  };

  const refreshCatalogForCurrentScope = async () => {
    const catalogData = await getMetricCatalog({ workspaceIds: filters.workspaceIds, boardIds: filters.boardIds });
    setCatalog(catalogData);
  };

  const handleSaveFieldMapping = async (payload: MetricFieldMappingRequest) => {
    if (!mappingField) return;
    try {
      await updateMetricFieldMapping(mappingField.boardId, mappingField.semanticKey, payload);
      await refreshCatalogForCurrentScope();
      setMetricsRefreshKey((value) => value + 1);
      showAppNotification({ message: `${mappingField.label} mapping updated`, severity: 'success' });
    } catch (e) {
      showAppError(e, 'Failed to update field mapping');
      throw e;
    }
  };

  const layouts = {
    lg: widgets.map((item) => ({
      i: item.id,
      x: item.layout.x,
      y: item.layout.y,
      w: item.layout.w,
      h: Math.max(item.layout.h, minimumWidgetHeight(item)),
      minW: 2,
      minH: minimumWidgetHeight(item),
      static: !isEditMode,
    })),
  };

  return (
    <Box component="main" sx={{ flex: 1, minHeight: '100vh', backgroundColor: 'background.default', px: { xs: 2, sm: 4 }, py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 28, color: isDark ? '#FFFFFF' : 'primary.main', lineHeight: 1 }}>Metrics</Typography>
          <Typography sx={{ mt: 0.8, color: 'text.secondary', fontSize: 13 }}>
            Deep observability for delivery, workflow, workload, risk, and custom board signals.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            size="small"
            color="warning"
            label="Unsaved changes"
            sx={{
              alignSelf: 'center',
              opacity: isDirty ? 1 : 0,
              transform: isDirty ? 'translateY(0)' : 'translateY(-4px)',
              maxWidth: isDirty ? 140 : 0,
              transition: 'opacity 180ms ease, transform 180ms ease, max-width 180ms ease, margin 180ms ease',
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          />
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>View</InputLabel>
            <Select label="View" value={selectedDashboardId} onChange={(event) => handleSelect(event.target.value)}>
              {PRESETS.map((preset) => <MenuItem key={preset.id} value={`preset:${preset.id}`}>{preset.label}</MenuItem>)}
              {dashboards.map((dashboard) => <MenuItem key={dashboard.id} value={dashboard.id}>{dashboard.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => { setEditingWidget(null); setIsAddOpen(true); }}
            sx={isDark ? {
              color: '#FFFFFF',
              borderColor: alpha('#FFFFFF', 0.32),
              '&:hover': {
                borderColor: alpha('#FFFFFF', 0.5),
                bgcolor: alpha('#FFFFFF', 0.06),
              },
            } : undefined}
          >
            Add Metric
          </Button>
          <Button
            variant={isEditMode ? 'contained' : 'outlined'}
            startIcon={<EditIcon />}
            disabled={isSaving}
            onClick={() => void handleEditLayoutToggle()}
            sx={isDark ? (
              isEditMode
                ? { bgcolor: '#FFFFFF', color: '#1F1F1F', '&:hover': { bgcolor: alpha('#FFFFFF', 0.9) } }
                : {
                    color: '#FFFFFF',
                    borderColor: alpha('#FFFFFF', 0.32),
                    '&:hover': {
                      borderColor: alpha('#FFFFFF', 0.5),
                      bgcolor: alpha('#FFFFFF', 0.06),
                    },
                  }
            ) : undefined}
          >
            {isSaving && isEditMode ? 'Saving' : isEditMode ? 'Done' : 'Edit Layout'}
          </Button>
          <Box
            sx={{
              display: 'inline-flex',
              opacity: canSaveDashboard && !isEditMode ? 1 : 0,
              transform: canSaveDashboard && !isEditMode ? 'scale(1)' : 'scale(0.96)',
              maxWidth: canSaveDashboard && !isEditMode ? 110 : 0,
              transition: 'opacity 180ms ease, transform 180ms ease, max-width 180ms ease',
              overflow: 'hidden',
              pointerEvents: canSaveDashboard && !isEditMode ? 'auto' : 'none',
            }}
          >
            <Button variant="contained" startIcon={<SaveIcon />} disabled={isSaving} onClick={() => void handleSave()}>
              {isSaving ? 'Saving' : 'Save'}
            </Button>
          </Box>
          <Button
            variant="outlined"
            startIcon={<MoreVertIcon />}
            onClick={(event) => setMoreMenuAnchor(event.currentTarget)}
            sx={{
              transition: 'background-color 160ms ease, border-color 160ms ease, transform 160ms ease',
              ...(isDark ? {
                color: '#FFFFFF',
                borderColor: alpha('#FFFFFF', 0.32),
                '&:hover': {
                  borderColor: alpha('#FFFFFF', 0.5),
                  bgcolor: alpha('#FFFFFF', 0.06),
                  transform: 'translateY(-1px)',
                },
              } : {
                '&:hover': { transform: 'translateY(-1px)' },
              }),
            }}
          >
            More
          </Button>
          <Menu
            anchorEl={moreMenuAnchor}
            open={Boolean(moreMenuAnchor)}
            onClose={closeMoreMenu}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                sx: {
                  mt: 0.75,
                  minWidth: 220,
                  borderRadius: 2,
                  transformOrigin: 'top right',
                  animation: 'metricsMenuIn 160ms ease both',
                  '@keyframes metricsMenuIn': {
                    from: { opacity: 0, transform: 'translateY(-6px) scale(0.98)' },
                    to: { opacity: 1, transform: 'translateY(0) scale(1)' },
                  },
                },
              },
            }}
          >
            <MenuItem onClick={() => runMenuAction(handleDuplicate)}>
              <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Duplicate" />
            </MenuItem>
            <MenuItem disabled={!canUpdatePreset} onClick={() => runMenuAction(handleUpdatePreset)}>
              <ListItemIcon><SaveIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Update preset" />
            </MenuItem>
            <MenuItem disabled={!selectedDashboard} onClick={() => runMenuAction(handleRename)}>
              <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Rename" />
            </MenuItem>
            <MenuItem disabled={!selectedDashboard || selectedDashboard?.isDefault} onClick={() => runMenuAction(handleSetDefault)}>
              <ListItemIcon>{selectedDashboard?.isDefault ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}</ListItemIcon>
              <ListItemText primary={selectedDashboard?.isDefault ? 'Default dashboard' : 'Set as default'} />
            </MenuItem>
            <MenuItem disabled={!selectedPreset} onClick={() => runMenuAction(handleResetPreset)}>
              <ListItemIcon><RestartAltIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Reset preset" />
            </MenuItem>
            <Divider />
            <MenuItem disabled={!selectedDashboard} onClick={() => runMenuAction(handleDelete)} sx={{ color: 'error.main' }}>
              <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
              <ListItemText primary="Delete dashboard" />
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <MetricFiltersBar
        filters={filters}
        workspaces={workspaces}
        boards={boards}
        assignees={catalog?.assignees ?? []}
        onChange={setFilters}
      />

      <MetricHealthPanel
        warnings={catalog?.warnings ?? []}
        semanticFields={catalog?.semanticFields ?? []}
        onMapField={setMappingField}
      />

      {isLoading ? (
        <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress size={28} /></Box>
      ) : widgets.length === 0 ? (
        <Paper elevation={0} sx={{ p: 4, borderRadius: '5px', border: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontWeight: 900, fontSize: 18 }}>No metrics yet</Typography>
          <Typography sx={{ mt: 0.75, color: 'text.secondary', maxWidth: 560 }}>
            Add a metric or switch to a preset to start building this dashboard.
          </Typography>
          <Button sx={{ mt: 2 }} variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingWidget(null); setIsAddOpen(true); }}>
            Add Metric
          </Button>
        </Paper>
      ) : (
        <Box ref={gridRef}>
          <Responsive
            className="metrics-grid"
            width={containerWidth}
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 900, sm: 600, xs: 0 }}
            cols={{ lg: 12, md: 8, sm: 4, xs: 1 }}
            rowHeight={96}
            margin={[16, 16]}
            resizeConfig={{ enabled: isEditMode }}
            dragConfig={{ enabled: isEditMode }}
            onLayoutChange={handleLayoutChange}
          >
            {widgets.map((item) => (
              <Box key={item.id}>
                <MetricWidget
                  widgetConfig={item}
                  filters={filters}
                  catalog={catalog}
                  refreshKey={metricsRefreshKey}
                  isEditMode={isEditMode}
                  onEdit={(widgetConfig) => {
                    setEditingWidget(widgetConfig);
                    setIsAddOpen(true);
                  }}
                  onRemove={handleRemoveWidget}
                  onOpenDrilldown={(widgetConfig, segmentLabel) => setDrilldown({ widgetConfig, segmentLabel })}
                />
              </Box>
            ))}
          </Responsive>
        </Box>
      )}

      <MetricBuilderDialog
        open={isAddOpen}
        catalog={catalog}
        initialWidget={editingWidget}
        filters={filters}
        onClose={() => {
          setIsAddOpen(false);
          setEditingWidget(null);
        }}
        onSave={handleSaveWidget}
      />
      <MetricDrilldownDialog
        open={Boolean(drilldown)}
        state={drilldown}
        filters={filters}
        onClose={() => setDrilldown(null)}
      />
      <MetricFieldMappingDialog
        open={Boolean(mappingField)}
        field={mappingField}
        catalog={catalog}
        onClose={() => setMappingField(null)}
        onSave={handleSaveFieldMapping}
      />
      <MetricRenameDialog
        open={renameDialogOpen}
        value={renameValue}
        onChange={setRenameValue}
        onClose={() => setRenameDialogOpen(false)}
        onConfirm={() => void confirmRename()}
      />
      <MetricDeleteDialog
        open={deleteDialogOpen}
        dashboardName={selectedDashboard?.name}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => void confirmDelete()}
      />
      <MetricUnsavedChangesDialog
        open={Boolean(pendingDashboardId || pendingRouteBlocker)}
        title={pendingRouteBlocker ? 'Leave Metrics?' : 'Unsaved Changes'}
        message={pendingRouteBlocker
          ? 'You have unsaved layout changes. Save them before leaving Metrics, or discard them and continue navigation.'
          : 'Save the current Metrics view before switching views, or discard the local changes.'}
        saveLabel={selectedPreset ? 'Update preset' : 'Save changes'}
        onCancel={() => {
          if (pendingRouteBlocker) {
            cancelPendingRouteNavigation();
            return;
          }
          setPendingDashboardId(null);
        }}
        onDiscard={pendingRouteBlocker ? discardPendingRouteNavigation : discardPendingSelection}
        onSave={() => {
          if (pendingRouteBlocker) {
            void savePendingRouteNavigation();
            return;
          }
          void savePendingSelection();
        }}
      />
    </Box>
  );
}

export default Metrics;
