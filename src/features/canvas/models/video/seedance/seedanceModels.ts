import type { VideoModelDefinition } from '../../types';
import { createMultiplierPricing } from '@/features/canvas/pricing';

export const SEEDANCE_1_0_PRO_MODEL_ID = 'seedance/seedance-1.0-pro';
export const SEEDANCE_1_5_PRO_MODEL_ID = 'seedance/seedance-1.5-pro';
export const SEEDANCE_2_0_MODEL_ID = 'seedance/seedance-2.0';

const SEEDANCE_ASPECT_RATIOS = [
  '16:9',
  '9:16',
  '1:1',
];

const SEEDANCE_DURATIONS = ['3s', '5s', '15s'];
const SEEDANCE_RESOLUTIONS = ['720p', '1080p'];
const SEEDANCE_FRAME_RATES = ['24fps', '30fps'];

function createSeedanceModel(
  id: string,
  displayName: string,
  eta: string,
  expectedDurationMs: number
): VideoModelDefinition {
  return {
    id,
    mediaType: 'video',
    displayName,
    providerId: 'seedance',
    description: `Seedance · ${displayName} 视频生成`,
    eta,
    expectedDurationMs,
    defaultAspectRatio: '16:9',
    aspectRatios: SEEDANCE_ASPECT_RATIOS.map((value) => ({ value, label: value })),
    durations: SEEDANCE_DURATIONS,
    resolutions: SEEDANCE_RESOLUTIONS,
    frameRates: SEEDANCE_FRAME_RATES,
    extraParamsSchema: [
      {
        key: 'motion_score',
        label: 'Motion Score',
        labelKey: 'modelParams.motionScore',
        type: 'number',
        defaultValue: 5,
        min: 1,
        max: 10,
        step: 1,
        description: '控制视频运动的强度 (1-10)',
      },
      {
        key: 'cfg_scale',
        label: 'CFG Scale',
        labelKey: 'modelParams.cfgScale',
        type: 'number',
        defaultValue: 7.5,
        min: 1,
        max: 20,
        step: 0.5,
        description: '提示词引导强度',
      },
    ],
    defaultExtraParams: {
      motion_score: 5,
      cfg_scale: 7.5,
    },
    pricing: createMultiplierPricing({
      currency: 'USD',
      baseAmount: 0.5,
      resolutionMultipliers: {
        '720p': 1,
        '1080p': 1.5,
      },
      resolveExtraCharges: ({ extraParams }) => {
        // 根据duration计算额外费用
        const duration = (extraParams as any)?.duration || '5s';
        const durationMultiplier: Record<string, number> = {
          '3s': 1,
          '5s': 1.5,
          '15s': 3,
        };
        return (durationMultiplier[duration] ?? 1.5) - 1; // 返回额外费用
      },
    }),
    resolveRequest: ({ referenceImageCount, storyboardFrameCount }) => ({
      requestModel: id,
      modeLabel: referenceImageCount > 0
        ? storyboardFrameCount > 0
          ? '分镜视频模式'
          : '图生视频模式'
        : '文生视频模式',
    }),
  };
}

export const seedance10ProModel: VideoModelDefinition = createSeedanceModel(
  SEEDANCE_1_0_PRO_MODEL_ID,
  'Seedance 1.0 Pro',
  '3min',
  180000
);

export const seedance15ProModel: VideoModelDefinition = createSeedanceModel(
  SEEDANCE_1_5_PRO_MODEL_ID,
  'Seedance 1.5 Pro',
  '4min',
  240000
);

export const seedance20Model: VideoModelDefinition = createSeedanceModel(
  SEEDANCE_2_0_MODEL_ID,
  'Seedance 2.0',
  '5min',
  300000
);
