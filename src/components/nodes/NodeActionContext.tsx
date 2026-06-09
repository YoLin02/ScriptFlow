import { createContext } from 'react';
import type { CanvasNodeData } from '../../types';

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
  editingId?: string | null;
  setEditingId?: (id: string | null) => void;
}

export const NodeActionContext = createContext<NodeActionContextProps>({});

export interface NodeActionCallbacks {
  onDeleteNode: (id: string) => void;
  onUpdateContent: NodeActionContextProps['onUpdateContent'];
}
