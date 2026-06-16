import { ImageNode, IdeaNode, TableNode, TextNode, TimelineNode } from './nodes';

export const CANVAS_MEDIA_ASSETS_KEY = 'canvas_media_assets';
export const RELATION_TAGS_STORAGE_KEY = 'custom_relation_tags';

export const DEFAULT_RELATION_TAGS = ['承接', '转折/对比', '因果/推导', '分支/并行', '补充证据', '批注备注'];

export const CANVAS_NODE_TYPES = {
  text: TextNode,
  image: ImageNode,
  idea: IdeaNode,
  table: TableNode,
  timeline: TimelineNode,
};
