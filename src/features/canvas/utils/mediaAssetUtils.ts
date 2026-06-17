import type { CanvasMediaAsset, WorkspaceNode } from '../../../types';

export function getNameWithoutExtension(fileName: string) {
  return fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
}

export function createMediaAsset(name: string, url: string): CanvasMediaAsset {
  return {
    id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    url,
    name,
    uploadedAt: Date.now(),
  };
}

export function createImageNodeFromAsset(asset: CanvasMediaAsset, position: { x: number; y: number }): WorkspaceNode {
  const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  return {
    id: nodeId,
    type: 'image',
    position,
    data: {
      id: nodeId,
      type: 'image',
      content: '',
      title: asset.name,
      imageUrl: asset.url,
      imageCaption: asset.name,
      imageNodeDisplayMode: 'image-only',
      imageDisplayMode: 'cover',
      width: 280,
      height: 180,
      createdAt: Date.now(),
    },
  };
}

export function getImageExtension(url: string) {
  if (url.startsWith('data:image/jpeg') || url.startsWith('data:image/jpg')) return 'jpg';
  if (url.startsWith('data:image/webp')) return 'webp';
  if (url.startsWith('data:image/gif')) return 'gif';
  return 'png';
}
