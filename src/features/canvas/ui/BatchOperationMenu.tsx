import { memo } from 'react';
import { Image, Sparkles, Grid3x3 } from 'lucide-react';

interface BatchOperationMenuProps {
  position: { x: number; y: number };
  selectedCount: number;
  onBatchImageGen: () => void;
  onBatchStoryboardGen: () => void;
  onOrganizeLayout: () => void;
  onClose: () => void;
}

export const BatchOperationMenu = memo(({
  position,
  selectedCount,
  onBatchImageGen,
  onBatchStoryboardGen,
  onOrganizeLayout,
}: BatchOperationMenuProps) => {

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className="fixed z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%) translateY(-10px)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col gap-2 rounded-lg border border-accent/30 bg-surface-dark/95 p-2 shadow-xl shadow-accent/20 backdrop-blur-sm">
        <div className="px-2 py-1 text-xs text-text-muted border-b border-white/10 mb-1">
          已选择 {selectedCount} 个节点
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBatchImageGen();
          }}
          className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm text-text-dark hover:bg-accent/20 transition-colors"
        >
          <Image className="h-4 w-4 text-accent" />
          <div className="flex flex-col">
            <span className="font-medium">批量生成图片</span>
            <span className="text-[10px] text-text-muted/60">
              将选中的节点连接到图片生成节点
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBatchStoryboardGen();
          }}
          className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm text-text-dark hover:bg-accent/20 transition-colors"
        >
          <Sparkles className="h-4 w-4 text-accent" />
          <div className="flex flex-col">
            <span className="font-medium">批量生成分镜</span>
            <span className="text-[10px] text-text-muted/60">
              将选中的节点连接到分镜生成节点
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOrganizeLayout();
          }}
          className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm text-text-dark hover:bg-accent/20 transition-colors"
        >
          <Grid3x3 className="h-4 w-4 text-green-500" />
          <div className="flex flex-col">
            <span className="font-medium">整理布局</span>
            <span className="text-[10px] text-text-muted/60">
              自动排列选中的节点为网格布局
            </span>
          </div>
        </button>
      </div>
    </div>
  );
});

BatchOperationMenu.displayName = 'BatchOperationMenu';
