import React, { memo, useContext, useEffect, useRef, useState } from 'react';
import { Check, Edit3, Lightbulb, Trash2 } from 'lucide-react';
import { NodeActionContext } from './NodeActionContext';
import StandardHandles from './StandardHandles';
export const IdeaNode = memo(({ id, data, selected }: { id: string; data: any; selected?: boolean }) => {
  const { onDeleteNode, onUpdateContent, editingId, setEditingId } = useContext(NodeActionContext);
  const isEditing = editingId === id;
  const setIsEditing = (val: boolean) => {
    if (setEditingId) {
      setEditingId(val ? id : null);
    }
  };
  const [editorVal, setEditorVal] = useState(data.content || '');
  const nodeRef = useRef<HTMLDivElement>(null);

  // Keep state synced with outer data changes when not editing
  useEffect(() => {
    if (!isEditing) {
      setEditorVal(data.content || '');
    }
  }, [data.content, isEditing]);

  const onSave = () => {
    setIsEditing(false);
    const updateFn = onUpdateContent || data.onUpdateContent;
    if (updateFn) {
      updateFn(id, editorVal);
    }
  };

  // Automate saving on dismiss of edit mode
  const wasEditing = useRef(false);
  useEffect(() => {
    const active = editingId === id;
    if (wasEditing.current && !active) {
      const updateFn = onUpdateContent || data.onUpdateContent;
      if (updateFn) {
        updateFn(id, editorVal);
      }
    }
    wasEditing.current = active;
  }, [editingId, id, editorVal, onUpdateContent, data.onUpdateContent]);

  useEffect(() => {
    if (!isEditing) return;

    function handleClickOutside(event: MouseEvent) {
      if (nodeRef.current && !nodeRef.current.contains(event.target as Node)) {
        setIsEditing(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside, { capture: true });
    document.addEventListener('touchstart', handleClickOutside, { capture: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, { capture: true });
      document.removeEventListener('touchstart', handleClickOutside, { capture: true });
    };
  }, [isEditing, setIsEditing]);

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const deleteFn = onDeleteNode || data.onDeleteNode;
    if (deleteFn) {
      deleteFn(id);
    }
  };

  return (
    <div 
      ref={nodeRef}
      className={`relative min-w-[220px] max-w-[280px] bg-neutral-50/80 rounded-lg border border-dashed text-left transition-all ${
        selected 
          ? 'shadow-lg border-neutral-800 ring-1 ring-neutral-800' 
          : 'shadow-sm border-neutral-300/80 hover:border-neutral-400'
      }`}
    >
      <StandardHandles />

      {/* Node Header Custom minimal */}
      <div className="flex items-center justify-between px-3.5 py-2">
        <div className="flex items-center gap-1 text-neutral-400">
          <Lightbulb className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-[10px] uppercase tracking-wider font-semibold">脑洞 / 想法</span>
        </div>
        <div className="flex gap-1">
          {isEditing ? (
            <button 
              onClick={onSave}
              className="p-1 hover:bg-neutral-200 text-neutral-700 rounded transition-colors cursor-pointer"
              title="保存"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="p-1 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-700 rounded transition-colors cursor-pointer"
              title="编辑想法"
            >
              <Edit3 className="w-3.5 h-3.5 animate-none" />
            </button>
          )}
          <button 
            onClick={onDelete}
            className="p-1 hover:bg-red-50 text-neutral-400 hover:text-red-600 rounded transition-colors cursor-pointer"
            title="删除想法"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 pt-1" onDoubleClick={() => setIsEditing(true)}>
        {isEditing ? (
          <textarea
            value={editorVal}
            onChange={(e) => setEditorVal(e.target.value)}
            className="nodrag w-full min-h-[80px] text-xs font-sans text-neutral-700 bg-white border border-neutral-200 p-2 rounded focus:outline-none focus:border-neutral-400 resize-y"
            onClick={(e) => e.stopPropagation()}
            placeholder="写下你的灵感火花..."
          />
        ) : (
          <p className="text-xs font-sans text-neutral-600 italic bg-white/40 p-2.5 rounded border border-neutral-100">
            {data.content || <span className="text-neutral-400 italic">空白灵感卡... 双击进行编辑</span>}
          </p>
        )}
      </div>
    </div>
  );
});

IdeaNode.displayName = 'IdeaNode';


