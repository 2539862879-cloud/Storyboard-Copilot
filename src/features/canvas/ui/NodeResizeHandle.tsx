import { NodeResizeControl } from '@xyflow/react';

type NodeResizeHandleProps = {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
};

const DEFAULT_MIN_WIDTH = 160;
const DEFAULT_MIN_HEIGHT = 100;
const DEFAULT_MAX_WIDTH = 1400;
const DEFAULT_MAX_HEIGHT = 1400;

export function NodeResizeHandle({
  minWidth = DEFAULT_MIN_WIDTH,
  minHeight = DEFAULT_MIN_HEIGHT,
  maxWidth = DEFAULT_MAX_WIDTH,
  maxHeight = DEFAULT_MAX_HEIGHT,
}: NodeResizeHandleProps) {
  return (
    <NodeResizeControl
      minWidth={minWidth}
      minHeight={minHeight}
      maxWidth={maxWidth}
      maxHeight={maxHeight}
      position="bottom-right"
      className="!h-6 !w-6 !min-h-0 !min-w-0 !rounded-none !border-0 !bg-transparent !p-0 hover:!opacity-100 focus-within:!opacity-100"
      style={{ opacity: 0 }}
    >
      {/* 更大的可点击区域 - 16x16px */}
      <div className="absolute inset-0 flex items-end justify-end pointer-events-none">
        <div className="pointer-events-auto h-4 w-4 cursor-se-resize flex items-end justify-end group">
          {/* 视觉指示器 */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-purple-500/20 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          <div className="relative z-10 w-full h-full">
            <svg
              viewBox="0 0 16 16"
              className="w-full h-full text-white/40 group-hover:text-accent transition-colors duration-200 drop-shadow-lg"
              fill="currentColor"
            >
              <path d="M 10 6 L 10 10 L 14 10 L 10 6 M 6 10 L 6 14 L 10 14 L 6 10 M 13 13 L 16 13 L 16 16 L 13 16 L 13 13" />
            </svg>
          </div>
        </div>
      </div>
    </NodeResizeControl>
  );
}
