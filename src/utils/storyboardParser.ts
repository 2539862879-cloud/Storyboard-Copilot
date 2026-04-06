/**
 * 智能分镜提示词解析器
 * 自动识别并分离核心提示词和分镜提示词
 */

export interface ParsedStoryboard {
  globalPrompt: string; // 核心提示词
  frames: Array<{
    shotNumber: string; // 镜号
    time?: string; // 时间
    description: string; // 描述
  }>;
}

/**
 * 解析分镜提示词
 *
 * 支持的格式:
 * 1. "镜头1 00:05 描述"
 * 2. "1. 00:05 描述"
 * 3. "镜头1 描述" (无时间)
 * 4. "1 描述" (简化格式)
 *
 * @param input 用户输入的完整提示词
 * @returns 解析后的分镜数据
 */
export function parseStoryboardPrompt(input: string): ParsedStoryboard {
  const lines = input.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const frames: ParsedStoryboard['frames'] = [];
  const globalPromptLines: string[] = [];

  let inFramesSection = false;

  for (const line of lines) {
    // 尝试匹配分镜格式
    const match = matchStoryboardLine(line);

    if (match) {
      // 这是一个分镜行
      inFramesSection = true;
      frames.push(match);
    } else if (inFramesSection) {
      // 已经在分镜区域，但这行不是分镜格式
      // 可能是上一行描述的延续
      if (frames.length > 0) {
        const lastFrame = frames[frames.length - 1];
        lastFrame.description += '\n' + line;
      }
    } else {
      // 还没有进入分镜区域，这是核心提示词
      globalPromptLines.push(line);
    }
  }

  // 如果没有识别到分镜，但有内容，全部作为核心提示词
  if (frames.length === 0 && globalPromptLines.length > 0) {
    return {
      globalPrompt: globalPromptLines.join('\n'),
      frames: [],
    };
  }

  return {
    globalPrompt: globalPromptLines.join('\n').trim(),
    frames,
  };
}

/**
 * 匹配分镜行
 */
function matchStoryboardLine(line: string): ParsedStoryboard['frames'][0] | null {
  // 格式1: "镜头1 00:05 描述" 或 "镜头1 描述"
  let match = line.match(/^镜头\s*(\d+)(?:\s+([0-9:]+))?\s*(.+)?$/);
  if (match) {
    return {
      shotNumber: match[1],
      time: match[2] || undefined,
      description: match[3] || '',
    };
  }

  // 格式2: "第(\d+)镜 00:05 描述"
  match = line.match(/^第\s*(\d+)\s*镜(?:\s+([0-9:]+))?\s*(.+)?$/);
  if (match) {
    return {
      shotNumber: match[1],
      time: match[2] || undefined,
      description: match[3] || '',
    };
  }

  // 格式3: "1. 00:05 描述" 或 "1、00:05 描述"
  match = line.match(/^(\d+)[.、](?:\s+([0-9:]+))?\s*(.+)?$/);
  if (match) {
    return {
      shotNumber: match[1],
      time: match[2] || undefined,
      description: match[3] || '',
    };
  }

  // 格式4: "1 00:05 描述" (纯数字开头，后跟时间)
  match = line.match(/^(\d+)\s+([0-9:]+)\s*(.+)?$/);
  if (match) {
    return {
      shotNumber: match[1],
      time: match[2],
      description: match[3] || '',
    };
  }

  // 格式5: "#1 00:05 描述"
  match = line.match(/^#(\d+)(?:\s+([0-9:]+))?\s*(.+)?$/);
  if (match) {
    return {
      shotNumber: match[1],
      time: match[2] || undefined,
      description: match[3] || '',
    };
  }

  return null;
}

/**
 * 将解析结果应用到节点数据
 */
export function applyParsedStoryboard(
  parsed: ParsedStoryboard,
  targetFrameCount: number
): {
  globalPrompt: string;
  frames: Array<{ id: string; description: string; referenceIndex: number | null }>;
} {
  // 生成帧ID
  const generateId = (index: number) => `frame-${Date.now()}-${index}`;

  // 创建分镜帧
  const frames: Array<{ id: string; description: string; referenceIndex: number | null }> = [];

  // 使用解析的帧
  for (let i = 0; i < Math.max(parsed.frames.length, targetFrameCount); i++) {
    const parsedFrame = parsed.frames[i];

    frames.push({
      id: generateId(i),
      description: parsedFrame?.description || '',
      referenceIndex: null,
    });
  }

  return {
    globalPrompt: parsed.globalPrompt,
    frames,
  };
}

/**
 * 根据帧数量计算最佳网格布局
 */
export function optimalGridSize(frameCount: number): { rows: number; cols: number } {
  if (frameCount <= 0) return { rows: 1, cols: 1 };

  // 计算最佳行列数（接近正方形）
  const cols = Math.ceil(Math.sqrt(frameCount));
  const rows = Math.ceil(frameCount / cols);

  return { rows, cols };
}
