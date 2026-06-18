import React, { memo, useContext, useEffect, useRef, useState } from 'react';
import { Check, Edit3, FileText, Trash2 } from 'lucide-react';
import { NodeActionContext } from './NodeActionContext';
import CardResizeControls from './CardResizeControls';
import StandardHandles from './StandardHandles';
import { useDynamicHandleClick } from './useDynamicHandleClick';
import type { TextCanvasNodeData } from '../../../types';

const DEFAULT_TEXT_NODE_WIDTH = 280;
const TEXT_NODE_MIN_HEIGHT = 120;
const TEXT_NODE_VERTICAL_CHROME = 106;
const TEXT_NODE_BODY_HORIZONTAL_PADDING = 32;
const TEXT_NODE_DISPLAY_VERTICAL_CHROME = 104;

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draftHeight, setDraftHeight] = useState<number | null>(null);
  const handleDynamicHandleClick = useDynamicHandleClick(id);

  const measureDraftHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return data.height || TEXT_NODE_MIN_HEIGHT;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
    return Math.max(TEXT_NODE_MIN_HEIGHT, textarea.scrollHeight + TEXT_NODE_VERTICAL_CHROME);
  };

  const measureDisplayHeight = (text: string) => {
    if (typeof document === 'undefined') return measureDraftHeight();
    const nodeWidth = nodeRef.current?.getBoundingClientRect().width || data.width || DEFAULT_TEXT_NODE_WIDTH;
    const measureEl = document.createElement('div');
    measureEl.textContent = text || '空白文本卡片... 双击进行编辑';
    Object.assign(measureEl.style, {
      position: 'fixed',
      left: '-9999px',
      top: '0',
      width: `${Math.max(80, nodeWidth - TEXT_NODE_BODY_HORIZONTAL_PADDING)}px`,
      visibility: 'hidden',
      whiteSpace: 'pre-wrap',
      overflowWrap: 'anywhere',
      wordBreak: 'break-word',
      fontSize: '12px',
      fontFamily: 'sans-serif',
      lineHeight: '1.625',
    });
    document.body.appendChild(measureEl);
    const measuredHeight = measureEl.scrollHeight;
    measureEl.remove();
    return Math.max(TEXT_NODE_MIN_HEIGHT, measuredHeight + TEXT_NODE_DISPLAY_VERTICAL_CHROME);
  };

  const persistContent = () => {
    const nextHeight = Math.max(
      draftHeight || measureDraftHeight(),
      measureDisplayHeight(editorVal),
      data.height || TEXT_NODE_MIN_HEIGHT,
    );
    onUpdateContent?.(id, editorVal, titleVal, undefined, undefined, {
      width: data.width || DEFAULT_TEXT_NODE_WIDTH,
      height: nextHeight,
    });
  };

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
  }, [editingId, id, editorVal, titleVal, onUpdateContent, draftHeight]);

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
      className={`relative flex min-w-[280px] flex-col bg-white rounded-lg border text-left transition-all ${
        selected 
          ? 'shadow-lg border-neutral-800 ring-1 ring-neutral-800' 
          : 'shadow-sm border-neutral-200/80 hover:border-neutral-300'
      }`}
      style={{
        width: `${data.width || DEFAULT_TEXT_NODE_WIDTH}px`,
        height: isEditing
          ? `${draftHeight || data.height || TEXT_NODE_MIN_HEIGHT}px`
          : data.height
            ? `${data.height}px`
            : undefined,
        backgroundColor: data.color || undefined,
      }}
      onClickCapture={handleDynamicHandleClick}
    >
      <CardResizeControls id={id} selected={selected} minWidth={240} minHeight={120} />
      <StandardHandles nodeId={id} customHandles={data.customHandles} />

      {/* Node Header */}
      <div className="flex shrink-0 items-center justify-between px-3.5 py-2.5 bg-neutral-50/50 border-b border-neutral-100 rounded-t-lg">
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
              data-tooltip="保存"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="p-1 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-700 rounded transition-colors cursor-pointer"
              data-tooltip="编辑内容"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          <button 
            onClick={onDelete}
            className="p-1 hover:bg-red-50 text-neutral-400 hover:text-red-600 rounded transition-colors cursor-pointer animate-none"
            data-tooltip="删除卡片"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Node Content Body */}
      <div className="flex min-h-0 flex-1 p-4" onDoubleClick={() => setIsEditing(true)}>
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editorVal}
            onChange={(e) => setEditorVal(e.target.value)}
            className="nodrag min-h-[100px] w-full resize-none overflow-hidden text-xs font-sans text-neutral-700 bg-white border border-neutral-200 p-2 rounded focus:outline-none focus:border-neutral-400"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <p className="h-full min-h-0 w-full overflow-y-auto break-words text-xs font-sans leading-relaxed text-neutral-600 whitespace-pre-wrap [overflow-wrap:anywhere] select-text">
            {data.content || <span className="text-neutral-400 italic">空白文本卡片... 双击进行编辑</span>}
          </p>
        )}
      </div>

      {/* Node Footer Meta */}
      <div className="flex shrink-0 justify-between items-center px-3.5 py-1.5 bg-neutral-50/20 border-t border-neutral-50 text-[10px] text-neutral-400 select-none rounded-b-lg">
          <span>{data.status || '文本切片'}</span>
        <span>ID: {id.slice(0, 6)}</span>
      </div>
    </div>
  );
});

TextNode.displayName = 'TextNode';


