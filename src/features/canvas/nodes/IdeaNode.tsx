import React, { memo, useContext, useEffect, useRef, useState } from 'react';
import { Check, Edit3, Lightbulb, Trash2 } from 'lucide-react';
import { NodeActionContext } from './NodeActionContext';
import CardResizeControls from './CardResizeControls';
import StandardHandles from './StandardHandles';
import { useDynamicHandleClick } from './useDynamicHandleClick';
import type { IdeaCanvasNodeData } from '../../../types';

const DEFAULT_IDEA_NODE_WIDTH = 260;
const IDEA_NODE_MIN_HEIGHT = 100;
const IDEA_NODE_VERTICAL_CHROME = 68;

export const IdeaNode = memo(({ id, data, selected }: { id: string; data: IdeaCanvasNodeData; selected?: boolean }) => {
  const { onDeleteNode, onUpdateContent, editingId, setEditingId } = useContext(NodeActionContext);
  const isEditing = editingId === id;
  const setIsEditing = (val: boolean) => {
    if (setEditingId) {
      setEditingId(val ? id : null);
    }
  };
  const [editorVal, setEditorVal] = useState(data.content || '');
  const nodeRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draftHeight, setDraftHeight] = useState<number | null>(null);
  const handleDynamicHandleClick = useDynamicHandleClick(id);

  const measureDraftHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return data.height || IDEA_NODE_MIN_HEIGHT;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
    return Math.max(IDEA_NODE_MIN_HEIGHT, textarea.scrollHeight + IDEA_NODE_VERTICAL_CHROME);
  };

  const persistContent = () => {
    const nextHeight = Math.max(draftHeight || measureDraftHeight(), data.height || IDEA_NODE_MIN_HEIGHT);
    onUpdateContent?.(id, editorVal, undefined, undefined, undefined, {
      width: data.width || DEFAULT_IDEA_NODE_WIDTH,
      height: nextHeight,
    });
  };

  // Keep state synced with outer data changes when not editing
  useEffect(() => {
    if (!isEditing) {
      setEditorVal(data.content || '');
    }
  }, [data.content, isEditing]);

  const onSave = () => {
    persistContent();
    setIsEditing(false);
  };

  // Automate saving on dismiss of edit mode
  const wasEditing = useRef(false);
  useEffect(() => {
    const active = editingId === id;
    if (wasEditing.current && !active) {
      persistContent();
      setDraftHeight(null);
    }
    wasEditing.current = active;
  }, [editingId, id, editorVal, onUpdateContent, draftHeight]);

  useEffect(() => {
    if (!isEditing) return;
    requestAnimationFrame(() => {
      setDraftHeight(measureDraftHeight());
    });
  }, [editorVal, isEditing]);

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
      className={`relative flex min-w-[220px] flex-col bg-neutral-50/80 rounded-lg border border-dashed text-left transition-all ${
        selected 
          ? 'shadow-lg border-neutral-800 ring-1 ring-neutral-800' 
          : 'shadow-sm border-neutral-300/80 hover:border-neutral-400'
      }`}
      style={{
        width: `${data.width || DEFAULT_IDEA_NODE_WIDTH}px`,
        height: isEditing
          ? `${draftHeight || data.height || IDEA_NODE_MIN_HEIGHT}px`
          : data.height
            ? `${data.height}px`
            : undefined,
        backgroundColor: data.color || undefined,
      }}
      onClickCapture={handleDynamicHandleClick}
    >
      <CardResizeControls id={id} selected={selected} minWidth={200} minHeight={100} />
      <StandardHandles nodeId={id} customHandles={data.customHandles} />

      {/* Node Header Custom minimal */}
      <div className="flex shrink-0 items-center justify-between px-3.5 py-2">
        <div className="flex min-w-0 items-center gap-1 text-neutral-400">
          <Lightbulb className="w-3.5 h-3.5 text-neutral-500" />
          <span className="truncate text-[11px] font-semibold text-neutral-700">
            {data.title || '灵感火花'}
          </span>
        </div>
        <div className="flex gap-1">
          {isEditing ? (
            <button 
              onClick={onSave}
              className="p-1 hover:bg-neutral-200 text-neutral-700 rounded transition-colors cursor-pointer"
              data-tooltip="保存"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="p-1 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-700 rounded transition-colors cursor-pointer"
              data-tooltip="编辑想法"
            >
              <Edit3 className="w-3.5 h-3.5 animate-none" />
            </button>
          )}
          <button 
            onClick={onDelete}
            className="p-1 hover:bg-red-50 text-neutral-400 hover:text-red-600 rounded transition-colors cursor-pointer"
            data-tooltip="删除想法"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 p-3 pt-1" onDoubleClick={() => setIsEditing(true)}>
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editorVal}
            onChange={(e) => setEditorVal(e.target.value)}
            className="nodrag min-h-[80px] w-full resize-none overflow-hidden text-xs font-sans text-neutral-700 bg-white border border-neutral-200 p-2 rounded focus:outline-none focus:border-neutral-400"
            onClick={(e) => e.stopPropagation()}
            placeholder="写下你的灵感火花..."
          />
        ) : (
          <p className="w-full overflow-visible break-words text-xs font-sans text-neutral-600 italic bg-white/40 p-2.5 rounded border border-neutral-100 [overflow-wrap:anywhere]">
            {data.content || <span className="text-neutral-400 italic">空白灵感卡... 双击进行编辑</span>}
          </p>
        )}
      </div>
    </div>
  );
});

IdeaNode.displayName = 'IdeaNode';


