"use client";

export function RelapseToast({
  isOpen,
  overBy,
  onKeep,
  onEase,
  onStop,
  onClose,
}: {
  isOpen: boolean;
  overBy: number;
  onKeep: () => void;
  onEase: () => void;
  onStop: () => void;
  onClose: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 overflow-hidden">
      <div className="w-full max-w-md bg-background text-foreground rounded-xl p-4 shadow-lg border border-black/10 dark:border-white/10">
        <div className="text-sm mb-2">
          You went over by {overBy.toFixed(2)} g. No problem — pick a next step.
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onKeep}
            className="px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 text-sm"
          >
            Keep plan
          </button>
          <button
            onClick={onEase}
            className="px-3 py-2 rounded-lg border-2 border-emerald-600 text-emerald-600 text-sm hover:bg-emerald-600 hover:text-white transition-colors"
          >
            Ease plan
          </button>
          <button
            onClick={onStop}
            className="px-3 py-2 rounded-lg border border-red-600 text-red-600 text-sm"
          >
            Stop
          </button>
        </div>
        <div className="text-right mt-2">
          <button onClick={onClose} className="text-xs text-foreground/60">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
