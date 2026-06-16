import type { CanvasNodeData, NodeType, TableNodeDataValue, TimelineTrackDataValue, WorkspaceNode } from '../../../types';

export function createCanvasNode(type: NodeType, position: { x: number; y: number }): WorkspaceNode {
  const id = `node-${Date.now()}`;
  let content = '';
  let title = '新建卡片';
  let extraData: Partial<CanvasNodeData> = {};

  if (type === 'image') {
    content = '';
    title = '图片节点';
  } else if (type === 'idea') {
    content = '';
    title = '灵感火花';
  } else if (type === 'table') {
    content = '';
    const tableData: TableNodeDataValue = {
      headers: ['项目', '分工', '状态'],
      rows: [
        ['模块A', '张三', '进行中'],
        ['模块B', '李四', '未开始'],
      ],
    };
    extraData = { tableData } as Partial<CanvasNodeData>;
    title = '结构化数据表';
  } else if (type === 'timeline') {
    content = '';
    const timelineData: TimelineTrackDataValue = {
      ticks: [
        { id: `tick-${Date.now()}-0`, seconds: 0 },
        { id: `tick-${Date.now()}-1`, seconds: 600 },
        { id: `tick-${Date.now()}-2`, seconds: 1200 },
      ],
      width: 750,
      activeTickId: null,
      fontSize: 12,
    };
    extraData = { timelineData } as Partial<CanvasNodeData>;
    title = '时间轴轨道';
  }

  return {
    id,
    type,
    position,
    data: {
      id,
      type,
      content,
      title,
      createdAt: Date.now(),
      ...extraData,
    },
  } as WorkspaceNode;
}

export function createExtractedTextNode(
  slice: { text: string; title?: string },
  position: { x: number; y: number },
): WorkspaceNode {
  const id = `node-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  return {
    id,
    type: 'text',
    position,
    data: {
      id,
      type: 'text',
      title: slice.title || '切片文本卡片',
      content: slice.text,
      createdAt: Date.now(),
    },
  };
}
