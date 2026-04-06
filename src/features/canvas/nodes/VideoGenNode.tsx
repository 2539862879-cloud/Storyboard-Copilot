import {
  memo,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Video, Play, Pause } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  CANVAS_NODE_TYPES,
  type VideoGenNodeData,
  type VideoDuration,
  type VideoResolution,
  type VideoFrameRate,
} from '@/features/canvas/domain/canvasNodes';
import { resolveNodeDisplayName } from '@/features/canvas/domain/nodeDisplay';
import { NodeHeader, NODE_HEADER_FLOATING_POSITION_CLASS } from '@/features/canvas/ui/NodeHeader';
import { NodeResizeHandle } from '@/features/canvas/ui/NodeResizeHandle';
import {
  DEFAULT_VIDEO_MODEL_ID,
  getVideoModel,
  listVideoModels,
} from '@/features/canvas/models';
import {
  NODE_CONTROL_MODEL_CHIP_CLASS,
  NODE_CONTROL_ICON_CLASS,
  NODE_CONTROL_PARAMS_CHIP_CLASS,
  NODE_CONTROL_PRIMARY_BUTTON_CLASS,
} from '@/features/canvas/ui/nodeControlStyles';
import { UiButton } from '@/components/ui';
import { useCanvasStore } from '@/stores/canvasStore';

type VideoGenNodeProps = NodeProps & {
  id: string;
  data: VideoGenNodeData;
  selected?: boolean;
};

const VIDEO_GEN_NODE_MIN_WIDTH = 390;
const VIDEO_GEN_NODE_MIN_HEIGHT = 280;
const VIDEO_GEN_NODE_MAX_WIDTH = 1400;
const VIDEO_GEN_NODE_MAX_HEIGHT = 1000;
const VIDEO_GEN_NODE_DEFAULT_WIDTH = 520;
const VIDEO_GEN_NODE_DEFAULT_HEIGHT = 450;
const VIDEO_PREVIEW_MIN_HEIGHT = 200;

const VIDEO_DURATIONS: { value: VideoDuration; label: string }[] = [
  { value: '3s', label: '3秒' },
  { value: '5s', label: '5秒' },
  { value: '15s', label: '15秒' },
];

const VIDEO_RESOLUTIONS: { value: VideoResolution; label: string }[] = [
  { value: '720p', label: '720p' },
  { value: '1080p', label: '1080p' },
];

const VIDEO_FRAME_RATES: { value: VideoFrameRate; label: string }[] = [
  { value: '24fps', label: '24 fps' },
  { value: '30fps', label: '30 fps' },
];

export const VideoGenNode = memo(({ id, data }: VideoGenNodeProps) => {
  const { t } = useTranslation();
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);

  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 获取当前视频模型
  const currentModel = useMemo(() => {
    return getVideoModel(data.model || DEFAULT_VIDEO_MODEL_ID);
  }, [data.model]);

  // 计算节点尺寸
  const resolvedNodeWidth = useMemo(() => {
    const width = data.width;
    if (width && typeof width === 'object' && 'value' in width) {
      return Math.round(Number(width.value) || VIDEO_GEN_NODE_DEFAULT_WIDTH);
    }
    return VIDEO_GEN_NODE_DEFAULT_WIDTH;
  }, [data.width]);

  const resolvedNodeHeight = useMemo(() => {
    const height = data.height;
    if (height && typeof height === 'object' && 'value' in height) {
      return Math.round(Number(height.value) || VIDEO_GEN_NODE_DEFAULT_HEIGHT);
    }
    return VIDEO_GEN_NODE_DEFAULT_HEIGHT;
  }, [data.height]);

  // 可用宽高比
  const aspectRatioChoices = useMemo(() => {
    return currentModel.aspectRatios.map((ratio) => ({
      value: ratio.value,
      label: ratio.label,
    }));
  }, [currentModel.aspectRatios]);

  // 处理模型变更
  const handleModelChange = useCallback(
    (modelId: string) => {
      const newModel = getVideoModel(modelId);
      updateNodeData(id, {
        model: modelId,
        requestAspectRatio: newModel.defaultAspectRatio,
        duration: newModel.durations[0] as VideoDuration,
        resolution: newModel.resolutions[0] as VideoResolution,
        frameRate: newModel.frameRates[0] as VideoFrameRate,
      });
    },
    [id, updateNodeData]
  );

  // 处理提示词变更
  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData(id, { prompt: e.target.value });
    },
    [id, updateNodeData]
  );

  // 处理宽高比变更
  const handleAspectRatioChange = useCallback(
    (aspectRatio: string) => {
      updateNodeData(id, { requestAspectRatio: aspectRatio });
    },
    [id, updateNodeData]
  );

  // 处理时长变更
  const handleDurationChange = useCallback(
    (duration: VideoDuration) => {
      updateNodeData(id, { duration });
    },
    [id, updateNodeData]
  );

  // 处理分辨率变更
  const handleResolutionChange = useCallback(
    (resolution: VideoResolution) => {
      updateNodeData(id, { resolution });
    },
    [id, updateNodeData]
  );

  // 处理帧率变更
  const handleFrameRateChange = useCallback(
    (frameRate: VideoFrameRate) => {
      updateNodeData(id, { frameRate });
    },
    [id, updateNodeData]
  );

  // 处理视频播放/暂停
  const handleTogglePlayback = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  // 处理生成视频
  const handleGenerate = useCallback(() => {
    // TODO: 实现视频生成逻辑
    console.log('Generate video with:', {
      prompt: data.prompt,
      model: data.model,
      duration: data.duration,
      resolution: data.resolution,
      frameRate: data.frameRate,
    });
  }, [data]);

  // 视频预览高度
  const videoPreviewHeight = Math.max(
    VIDEO_PREVIEW_MIN_HEIGHT,
    resolvedNodeHeight - 220 // 减去控制区域高度
  );

  return (
    <div
      className="relative flex flex-col rounded-lg border border-border-dark bg-surface-dark text-text-dark shadow-lg"
      style={{
        width: resolvedNodeWidth,
        height: resolvedNodeHeight,
        minWidth: VIDEO_GEN_NODE_MIN_WIDTH,
        minHeight: VIDEO_GEN_NODE_MIN_HEIGHT,
        maxWidth: VIDEO_GEN_NODE_MAX_WIDTH,
        maxHeight: VIDEO_GEN_NODE_MAX_HEIGHT,
      }}
    >
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-8 !w-8 !border-2 !border-surface-dark !bg-accent/50 !shadow-lg !shadow-accent/30 hover:!scale-110 hover:!bg-accent/70"
      >
        <div className="flex h-full w-full items-center justify-center text-white/80 text-lg font-bold pointer-events-none">
          +
        </div>
      </Handle>

      {/* 节点头部 */}
      <div className={NODE_HEADER_FLOATING_POSITION_CLASS}>
        <NodeHeader
          title={resolveNodeDisplayName(CANVAS_NODE_TYPES.videoGen, data)}
          icon={<Video className="h-4 w-4" />}
        />
      </div>

      {/* 主内容区域 */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* 提示词输入区 */}
        <div className="px-4 pt-4 pb-2">
          <label className="block text-xs text-text-secondary-dark mb-1">
            {t('node.prompt')}
          </label>
          <textarea
            value={data.prompt}
            onChange={handlePromptChange}
            placeholder="描述你想要生成的视频内容..."
            className="w-full h-20 px-3 py-2 bg-bg-dark border border-border-dark rounded-md text-sm text-text-dark placeholder-text-placeholder-dark resize-none focus:outline-none focus:border-accent"
          />
        </div>

        {/* 视频预览区 */}
        <div className="flex-1 px-4 pb-2">
          <div
            className="relative w-full bg-black rounded-lg overflow-hidden flex items-center justify-center"
            style={{ height: videoPreviewHeight }}
          >
            {data.videoUrl ? (
              <>
                <video
                  ref={videoRef}
                  src={data.videoUrl}
                  className="w-full h-full object-contain"
                  onEnded={() => setIsPlaying(false)}
                />
                <button
                  onClick={handleTogglePlayback}
                  className="absolute bottom-2 right-2 flex items-center justify-center w-10 h-10 bg-black/70 hover:bg-black/90 rounded-full transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  )}
                </button>
              </>
            ) : data.previewImageUrl ? (
              <img
                src={data.previewImageUrl}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-text-placeholder-dark">
                <Video className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">视频预览</p>
              </div>
            )}
          </div>
        </div>

        {/* 控制区域 */}
        <div className="px-4 pb-4 space-y-2">
          {/* 模型选择 */}
          <div className={NODE_CONTROL_MODEL_CHIP_CLASS}>
            <select
              value={data.model}
              onChange={(e) => handleModelChange(e.target.value)}
              className="bg-transparent text-sm text-text-dark focus:outline-none cursor-pointer flex-1"
            >
              {listVideoModels().map((model) => (
                <option key={model.id} value={model.id}>
                  {model.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* 参数控制区 */}
          <div className="grid grid-cols-3 gap-2">
            {/* 时长 */}
            <div className={NODE_CONTROL_PARAMS_CHIP_CLASS}>
              <label className="text-xs text-text-secondary-dark">时长</label>
              <select
                value={data.duration}
                onChange={(e) => handleDurationChange(e.target.value as VideoDuration)}
                className="w-full bg-transparent text-sm text-text-dark focus:outline-none cursor-pointer"
              >
                {VIDEO_DURATIONS.map((duration) => (
                  <option key={duration.value} value={duration.value}>
                    {duration.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 分辨率 */}
            <div className={NODE_CONTROL_PARAMS_CHIP_CLASS}>
              <label className="text-xs text-text-secondary-dark">分辨率</label>
              <select
                value={data.resolution}
                onChange={(e) => handleResolutionChange(e.target.value as VideoResolution)}
                className="w-full bg-transparent text-sm text-text-dark focus:outline-none cursor-pointer"
              >
                {VIDEO_RESOLUTIONS.map((resolution) => (
                  <option key={resolution.value} value={resolution.value}>
                    {resolution.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 帧率 */}
            <div className={NODE_CONTROL_PARAMS_CHIP_CLASS}>
              <label className="text-xs text-text-secondary-dark">帧率</label>
              <select
                value={data.frameRate}
                onChange={(e) => handleFrameRateChange(e.target.value as VideoFrameRate)}
                className="w-full bg-transparent text-sm text-text-dark focus:outline-none cursor-pointer"
              >
                {VIDEO_FRAME_RATES.map((frameRate) => (
                  <option key={frameRate.value} value={frameRate.value}>
                    {frameRate.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 宽高比 */}
          <div className={NODE_CONTROL_PARAMS_CHIP_CLASS}>
            <label className="text-xs text-text-secondary-dark">宽高比</label>
            <div className="flex gap-1 flex-wrap">
              {aspectRatioChoices.map((ratio) => (
                <button
                  key={ratio.value}
                  onClick={() => handleAspectRatioChange(ratio.value)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    data.requestAspectRatio === ratio.value
                      ? 'bg-accent text-white'
                      : 'bg-bg-dark text-text-dark hover:bg-surface-dark'
                  }`}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
          </div>

          {/* 额外参数控制 */}
          {currentModel.extraParamsSchema && currentModel.extraParamsSchema.length > 0 && (
            <div className="space-y-2">
              {currentModel.extraParamsSchema.map((param) => (
                <div key={param.key} className={NODE_CONTROL_PARAMS_CHIP_CLASS}>
                  <label className="text-xs text-text-secondary-dark">
                    {param.labelKey ? t(param.labelKey) : param.label}
                  </label>
                  {param.type === 'number' ? (
                    <input
                      type="number"
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      value={(data.extraParams?.[param.key] as number) ?? param.defaultValue}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        updateNodeData(id, {
                          extraParams: {
                            ...data.extraParams,
                            [param.key]: value,
                          },
                        });
                      }}
                      className="w-full bg-bg-dark border border-border-dark rounded px-2 py-1 text-sm text-text-dark focus:outline-none focus:border-accent"
                    />
                  ) : null}
                  {param.description && (
                    <p className="text-xs text-text-placeholder-dark mt-1">{param.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 生成按钮 */}
          <UiButton
            onClick={handleGenerate}
            disabled={!data.prompt || data.isGenerating}
            className={NODE_CONTROL_PRIMARY_BUTTON_CLASS}
          >
            {data.isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                生成中...
              </>
            ) : (
              <>
                <Video className={NODE_CONTROL_ICON_CLASS} />
                生成视频
              </>
            )}
          </UiButton>
        </div>
      </div>

      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-8 !w-8 !border-2 !border-surface-dark !bg-accent/50 !shadow-lg !shadow-accent/30 hover:!scale-110 hover:!bg-accent/70"
      >
        <div className="flex h-full w-full items-center justify-center text-white/80 text-lg font-bold pointer-events-none">
          +
        </div>
      </Handle>

      {/* 调整大小手柄 */}
      <NodeResizeHandle
        minWidth={VIDEO_GEN_NODE_MIN_WIDTH}
        minHeight={VIDEO_GEN_NODE_MIN_HEIGHT}
        maxWidth={VIDEO_GEN_NODE_MAX_WIDTH}
        maxHeight={VIDEO_GEN_NODE_MAX_HEIGHT}
      />
    </div>
  );
});

VideoGenNode.displayName = 'VideoGenNode';
