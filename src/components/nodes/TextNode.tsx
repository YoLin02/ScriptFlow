import React, { memo, useContext, useEffect, useRef, useState } from 'react';
import { Check, Edit3, FileText, Trash2 } from 'lucide-react';
import { NodeActionContext } from './NodeActionContext';
import StandardHandles from './StandardHandles';
import type { TextCanvasNodeData } from '../../types';

export const TextNode = memo(({ id, data, selected }: { id: string; data: TextCanvasNodeData; selected?: boolean }) => {
  const { onDeleteNode, onUpdateContent, editingId, setEditingId } = useContext(NodeActionContext);
  const isEditing = editingId === id;
  const setIsEditing = (val: boolean) => {
    if (setEditingId) {
      setEditingId(val ? id : null);
    }
  };
  const [editorVal, setEditorVal] = useState(data.content || '');
  const [titleVal, setTitleVal] = useState(data.title || 'Untitled Card');
  const nodeRef = useRef<HTMLDivElement>(null);

  // Keep state synced with outer data changes (e.g. preset loaded/reconstructed) when not actively editing
  useEffect(() => {
    if (!isEditing) {
      setEditorVal(data.content || '');
    }
  }, [data.content, isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setTitleVal(data.title || 'Untitled Card');
    }
  }, [data.title, isEditing]);

  const onSave = () => {
    setIsEditing(false);
    onUpdateContent?.(id, editorVal, titleVal);
  };

  // Automate saving on dismiss of edit mode
  const wasEditing = useRef(false);
  useEffect(() => {
    const active = editingId === id;
    if (wasEditing.current && !active) {
      onUpdateContent?.(id, editorVal, titleVal);
    }
    wasEditing.current = active;
  }, [editingId, id, editorVal, titleVal, onUpdateContent]);

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
    onDeleteNode?.(id);
  };

  return (
    <div 
      ref={nodeRef}
      className={`relative min-w-[280px] max-w-[340px] bg-white rounded-lg border text-left transition-all ${
        selected 
          ? 'shadow-lg border-neutral-800 ring-1 ring-neutral-800' 
          : 'shadow-sm border-neutral-200/80 hover:border-neutral-300'
      }`}
    >
      <StandardHandles />

      {/* Node Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-neutral-50/50 border-b border-neutral-100 rounded-t-lg">
        <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-2">
          <FileText className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
          {isEditing ? (
            <input
              type="text"
              value={titleVal}
              onChange={(e) => setTitleVal(e.target.value)}
              className="nodrag text-xs font-semibold text-neutral-800 bg-white border border-neutral-200 px-1.5 py-0.5 rounded w-full focus:outline-none focus:border-neutral-400"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-xs font-semibold text-neutral-700 truncate">{titleVal}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
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
              title="编辑内容"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          <button 
            onClick={onDelete}
            className="p-1 hover:bg-red-50 text-neutral-400 hover:text-red-600 rounded transition-colors cursor-pointer animate-none"
            title="删除卡片"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Node Content Body */}
      <div className="p-4" onDoubleClick={() => setIsEditing(true)}>
        {isEditing ? (
          <textarea
            value={editorVal}
            onChange={(e) => setEditorVal(e.target.value)}
            className="nodrag w-full min-h-[100px] text-xs font-sans text-neutral-700 bg-white border border-neutral-200 p-2 rounded focus:outline-none focus:border-neutral-400 resize-y"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <p className="text-xs font-sans text-neutral-600 leading-relaxed whitespace-pre-wrap select-text">
            {data.content || <span className="text-neutral-400 italic">空白文本卡片... 双击进行编辑</span>}
          </p>
        )}
      </div>

      {/* Node Footer Meta */}
      <div className="px-3.5 py-1.5 bg-neutral-50/20 border-t border-neutral-50 text-[10px] text-neutral-400 flex justify-between items-center select-none rounded-b-lg">
        <span>文本切片</span>
        <span>ID: {id.slice(0, 6)}</span>
      </div>
    </div>
  );
});

TextNode.displayName = 'TextNode';


