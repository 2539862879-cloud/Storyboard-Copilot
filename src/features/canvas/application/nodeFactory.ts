import type { XYPosition } from '@xyflow/react';

import type { CanvasNode, CanvasNodeData, CanvasNodeType } from '../domain/canvasNodes';
import type { IdGenerator, NodeCatalog, NodeFactory } from './ports';

export class CanvasNodeFactory implements NodeFactory {
  constructor(
    private readonly idGenerator: IdGenerator,
    private readonly nodeCatalog: NodeCatalog
  ) {}

  createNode(
    type: CanvasNodeType,
    position: XYPosition,
    data: Partial<CanvasNodeData> = {}
  ): CanvasNode {
    const definition = this.nodeCatalog.getDefinition(type);
    const nodeData = {
      ...definition.createDefaultData(),
      ...data,
    } as CanvasNodeData;

    // 为分镜生成节点设置初始尺寸，避免创建后需要手动调整
    const initialStyle = type === 'storyboardGenNode'
      ? { width: 320, height: 700 }
      : undefined;

    return {
      id: this.idGenerator.next(),
      type,
      position,
      data: nodeData,
      ...(initialStyle ? { style: initialStyle } : {}),
    };
  }
}
