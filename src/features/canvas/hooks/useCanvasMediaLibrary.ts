import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { CanvasMediaAsset, WorkspaceNode } from '../../../types';
import { dbGet, dbSet } from '../../../shared/storage/db';
import { useFeedback } from '../../../shared/feedback/FeedbackProvider';
import { CANVAS_MEDIA_ASSETS_KEY } from '../constants';
import { createImageNodeFromAsset, createMediaAsset, getImageExtension } from '../utils/mediaAssetUtils';

interface UseCanvasMediaLibraryOptions {
  setNodes: Dispatch<SetStateAction<WorkspaceNode[]>>;
  getCenteredNodePosition: (xOffset?: number, yOffset?: number) => { x: number; y: number };
}

export function useCanvasMediaLibrary({
  setNodes,
  getCenteredNodePosition,
}: UseCanvasMediaLibraryOptions) {
  const { toast } = useFeedback();
  const [isOpen, setOpen] = useState(false);
  const [assets, setAssets] = useState<CanvasMediaAsset[]>([]);
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadAssets() {
      try {
        const saved = await dbGet<CanvasMediaAsset[]>(CANVAS_MEDIA_ASSETS_KEY);
        if (saved) {
          setAssets(saved);
        }
      } catch (error) {
        console.error('Failed to load media assets', error);
      } finally {
        setIsAssetsLoaded(true);
      }
    }

    loadAssets();
  }, []);

  useEffect(() => {
    if (!isAssetsLoaded) return;

    dbSet(CANVAS_MEDIA_ASSETS_KEY, assets).catch((error) => {
      console.error('Failed to save media assets', error);
    });
  }, [assets, isAssetsLoaded]);

  const upload = useCallback((files: File[]) => {
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const asset = createMediaAsset(file.name, reader.result as string);

        setAssets((currentAssets) => {
          if (currentAssets.some((currentAsset) => currentAsset.name === asset.name)) {
            return currentAssets;
          }
          return [asset, ...currentAssets];
        });
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const insertAsset = useCallback((asset: CanvasMediaAsset) => {
    setNodes((currentNodes) => {
      const selectedNode = currentNodes.find((node) => node.selected);
      if (selectedNode) {
        return currentNodes.map((node) => {
          if (node.id !== selectedNode.id) return node;
          return {
            ...node,
            type: 'image',
            data: {
              ...node.data,
              type: 'image',
              imageUrl: asset.url,
              title: asset.name,
              imageCaption: asset.name,
              imageNodeDisplayMode: 'image-only',
              imageDisplayMode: 'cover',
              width: node.data.width || 280,
              height: node.data.height || 180,
            },
          } as WorkspaceNode;
        });
      }

      const newNode = createImageNodeFromAsset(asset, getCenteredNodePosition(140, 100));
      return [...currentNodes, newNode];
    });
  }, [getCenteredNodePosition, setNodes]);

  const deleteAsset = useCallback((assetId: string) => {
    setAssets((currentAssets) => currentAssets.filter((asset) => asset.id !== assetId));
  }, []);

  const downloadAll = useCallback(() => {
    if (assets.length === 0) {
      toast('配图文件夹中现在没有图片。');
      return;
    }

    assets.forEach((asset, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = asset.url;
        link.download = `${asset.name}.${getImageExtension(asset.url)}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 250);
    });
  }, [assets, toast]);

  return {
    isOpen,
    setOpen,
    assets,
    fileInputRef,
    upload,
    insertAsset,
    deleteAsset,
    downloadAll,
  };
}
