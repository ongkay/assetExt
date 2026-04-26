type OverlayPanelProps = {
  isVisible: boolean;
  onHide: () => void;
  onShow: () => void;
  onIncrementBadge: () => void;
};

export function OverlayPanel({
  isVisible,
  onHide,
  onShow,
  onIncrementBadge,
}: OverlayPanelProps) {
  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4">
        <button
          className="rounded-full border border-white/10 bg-gray-900 px-3 py-2 text-xs text-white shadow-lg hover:bg-gray-800"
          type="button"
          onClick={onShow}
        >
          Show
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-52 rounded-lg border border-white/10 bg-gray-900 p-3 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">Overlay</p>
        <button
          className="text-xs text-gray-400 hover:text-white"
          type="button"
          onClick={onHide}
        >
          Hide
        </button>
      </div>
      <div className="mt-3">
        <button
          className="w-full rounded-md border border-white/10 px-2 py-1 text-xs text-white hover:bg-white/10"
          type="button"
          onClick={onIncrementBadge}
        >
          Badge +
        </button>
      </div>
    </div>
  );
}
