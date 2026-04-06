import { memo } from 'react';
import { Grid3x3 } from 'lucide-react';

interface BatchOperationButtonProps {
  position: { x: number; y: number };
  selectedCount: number;
  onClick: () => void;
}

export const BatchOperationButton = memo(({
  position,
  selectedCount,
  onClick,
}: BatchOperationButtonProps) => {
  if (selectedCount <= 1) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="fixed z-50 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-white shadow-lg shadow-accent/50 hover:bg-accent/80 hover:scale-105 transition-all duration-200 animate-in fade-in slide-in-from-bottom-4"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)',
      }}
      title={`批量操作 ${selectedCount} 个节点`}
    >
      <Grid3x3 className="h-5 w-5" />
      <span className="font-medium">
        批量操作 ({selectedCount})
      </span>
    </button>
  );
});

BatchOperationButton.displayName = 'BatchOperationButton';
