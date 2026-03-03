import { generateImage, setApiKey } from '@/commands/ai';
import { imageUrlToDataUrl } from '@/features/canvas/application/imageData';

import type { AiGateway, GenerateImagePayload } from '../application/ports';

export const tauriAiGateway: AiGateway = {
  setApiKey,
  generateImage: async (payload: GenerateImagePayload) => {
    const normalizedReferenceImages = payload.referenceImages
      ? await Promise.all(payload.referenceImages.map((imageUrl) => imageUrlToDataUrl(imageUrl)))
      : undefined;

    return await generateImage({
      prompt: payload.prompt,
      model: payload.model,
      size: payload.size,
      aspect_ratio: payload.aspectRatio,
      reference_images: normalizedReferenceImages,
    });
  },
};
