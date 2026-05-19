type SaveHandler = () => Promise<void> | void;
type DiscardHandler = () => void;

let hasUnsavedChanges = false;
let saveHandler: SaveHandler | null = null;
let discardHandler: DiscardHandler | null = null;

export function setMetricsUnsavedState(value: boolean) {
  hasUnsavedChanges = value;
}

export function getMetricsUnsavedState() {
  return hasUnsavedChanges;
}

export function registerMetricsUnsavedHandlers(handlers: {
  onSave: SaveHandler;
  onDiscard: DiscardHandler;
}) {
  saveHandler = handlers.onSave;
  discardHandler = handlers.onDiscard;
}

export function clearMetricsUnsavedHandlers() {
  saveHandler = null;
  discardHandler = null;
}

export function invokeMetricsUnsavedSave() {
  return saveHandler ? saveHandler() : undefined;
}

export function invokeMetricsUnsavedDiscard() {
  discardHandler?.();
}
