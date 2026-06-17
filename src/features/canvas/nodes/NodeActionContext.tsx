import { createContext } from 'react';
import type { CanvasNodeData, CanvasNodeHandleData } from '../../../types';
import type { ShortcutMap } from '../../shortcuts';

export interface NodeActionContextProps {
  onDeleteNode?: (id: string) => void;
  onUpdateContent?: (
    id: string,
    newContent: string,
    newTitle?: string,
    imageUrl?: string,
    imageCaption?: string,
    extraData?: Partial<CanvasNodeData>,
  ) => void;
  onAddCustomHandle?: (nodeId: string, handle: CanvasNodeHandleData) => void;
  onDeleteCustomHandle?: (nodeId: string, handleId: string) => void;
  editingId?: string | null;
  setEditingId?: (id: string | null) => void;
  shortcuts?: ShortcutMap;
}

export const NodeActionContext = createContext<NodeActionContextProps>({});

export interface NodeActionCallbacks {
  onDeleteNode: (id: string) => void;
  onUpdateContent: NodeActionContextProps['onUpdateContent'];
}
