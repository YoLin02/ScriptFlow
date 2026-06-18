import React, { memo, useContext, useEffect, useRef, useState } from 'react';
import { Check, Edit3, Image as ImageIcon, Plus, Trash2, Upload } from 'lucide-react';
import { NodeActionContext } from './NodeActionContext';
import CardResizeControls from './CardResizeControls';
import StandardHandles from './StandardHandles';
import { useDynamicHandleClick } from './useDynamicHandleClick';
import type { ImageCanvasNodeData } from '../../../types';

export const ImageNode = memo(({ id, data, selected }: { id: string; data: ImageCanvasNodeData; selected?: boolean }) => {
  const { onDeleteNode, onUpdateContent, editingId, setEditingId } = useContext(NodeActionContext);
  const isEditing = editingId === id;
  const setIsEditing = (val: boolean) => {
    if (setEditingId) {
      setEditingId(val ? id : null);
    }
  };
  const [caption, setCaption] = useState(data.imageCaption || '');
  const [imageUrl, setImageUrl] = useState(data.imageUrl || '');
  const [titleVal, setTitleVal] = useState(data.title || '图片资源卡片');
  const [isUrlInput, setIsUrlInput] = useState(false);
  const [tempUrl, setTempUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const handleDynamicHandleClick = useDynamicHandleClick(id);
  const imageNodeDisplayMode = data.imageNodeDisplayMode || 'image-only';
  const imageDisplayMode = data.imageDisplayMode || (imageNodeDisplayMode === 'image-only' ? 'cover' : 'contain');
  const imageClassName = imageDisplayMode === 'cover'
    ? 'h-full w-full object-cover'
    : imageDisplayMode === 'original'
      ? 'max-h-full max-w-full object-contain'
      : 'max-h-full max-w-full object-contain';
  const isPureImageMode = imageNodeDisplayMode === 'image-only';

  // Sync state with outer modifications
  useEffect(() => {
    if (!isEditing) {
      setCaption(data.imageCaption || '');
      setImageUrl(data.imageUrl || '');
      setTitleVal(data.title || '图片资源卡片');
    }
  }, [data.imageCaption, data.imageUrl, data.title, isEditing]);

  const onSave = () => {
    setIsEditing(false);
    onUpdateContent?.(id, data.content, titleVal, imageUrl, caption);
  };

  const applyImageFile = (file: File) => {
    const nameWithoutExtension = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImageUrl(base64String);
      setTitleVal(nameWithoutExtension);
      setCaption(nameWithoutExtension);
      onUpdateContent?.(id, data.content, nameWithoutExtension, base64String, nameWithoutExtension);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      applyImageFile(file);
    }
    e.target.value = '';
  };

  const handleImageDragOver = (e: React.DragEvent) => {
    const hasImage = Array.from(e.dataTransfer.items || []).some((item) => item.kind === 'file' && item.type.startsWith('image/'));
    if (!hasImage) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleImageDrop = (e: React.DragEvent) => {
    const file = Array.from(e.dataTransfer.files || []).find((item) => item.type.startsWith('image/'));
    if (!file) return;
    e.preventDefault();
    e.stopPropagation();
    applyImageFile(file);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempUrl.trim()) {
      setImageUrl(tempUrl.trim());
      setIsUrlInput(false);
      onUpdateContent?.(id, data.content, titleVal, tempUrl.trim(), caption);
    }
  };

  // Automate saving on dismiss of edit mode
  const wasEditing = useRef(false);
  useEffect(() => {
    const active = editingId === id;
    if (wasEditing.current && !active) {
      onUpdateContent?.(id, data.content, titleVal, imageUrl, caption);
    }
    wasEditing.current = active;
  }, [editingId, id, data.content, titleVal, imageUrl, caption, onUpdateContent]);

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

  if (isPureImageMode) {
    return (
      <div
        ref={nodeRef}
        className={`group relative flex rounded-lg border bg-white text-left transition-all ${
          selected
            ? 'shadow-lg border-neutral-800 ring-1 ring-neutral-800'
            : 'shadow-sm border-neutral-200/80 hover:border-neutral-300'
        }`}
        style={{
          width: `${data.width || 280}px`,
          height: `${data.height || 180}px`,
          backgroundColor: data.color || undefined,
        }}
        onDoubleClick={() => setIsEditing(true)}
        onClickCapture={handleDynamicHandleClick}
        onDragOver={handleImageDragOver}
        onDrop={handleImageDrop}
      >
        <CardResizeControls id={id} selected={selected} minWidth={160} minHeight={110} />
        <StandardHandles nodeId={id} customHandles={data.customHandles} />

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {imageUrl ? (
          <div className="h-full w-full overflow-hidden rounded-[inherit]">
            <img
              src={imageUrl}
              alt={caption || titleVal || '图片节点'}
              referrerPolicy="no-referrer"
              className={imageClassName}
            />
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-[inherit] border border-dashed border-neutral-200 bg-neutral-50/60 p-4 text-center">
            <ImageIcon className="mb-2 h-7 w-7 text-neutral-400 stroke-[1.5]" />
            <span className="text-[11px] font-semibold text-neutral-500">拖放或上传图片</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 text-[10px] font-semibold text-neutral-600 shadow-xs transition-colors hover:bg-neutral-50"
            >
              <Upload className="h-3 w-3" />
              本地上传
            </button>
          </div>
        )}

        <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md bg-white/90 px-2 py-1 text-[10px] font-semibold text-neutral-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
            data-tooltip="更换图片"
            data-tooltip-placement="top"
          >
            换图
          </button>
          <button
            onClick={onDelete}
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md bg-white/90 text-neutral-400 shadow-sm backdrop-blur-sm transition-colors hover:bg-red-50 hover:text-red-600"
            data-tooltip="删除图片节点"
            data-tooltip-placement="top"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={nodeRef}
      className={`relative flex w-[280px] flex-col bg-white rounded-lg border text-left transition-all ${
        selected 
          ? 'shadow-lg border-neutral-800 ring-1 ring-neutral-800' 
          : 'shadow-sm border-neutral-200/80 hover:border-neutral-300'
      }`}
      style={{
        width: `${data.width || 280}px`,
        height: data.height ? `${data.height}px` : undefined,
        backgroundColor: data.color || undefined,
      }}
      onClickCapture={handleDynamicHandleClick}
    >
      <CardResizeControls id={id} selected={selected} minWidth={240} minHeight={150} />
      <StandardHandles nodeId={id} customHandles={data.customHandles} />

      {/* Node Header */}
      <div className="flex shrink-0 items-center justify-between px-3.5 py-2.5 bg-neutral-50/50 border-b border-neutral-100 rounded-t-lg">
        <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-2">
          <ImageIcon className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
          {isEditing ? (
            <input
              type="text"
              value={titleVal}
              onChange={(e) => setTitleVal(e.target.value)}
              className="nodrag text-xs font-semibold text-neutral-800 bg-white border border-neutral-200 px-1.5 py-0.5 rounded w-full focus:outline-none focus:border-neutral-400"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-xs font-semibold text-neutral-700 truncate" onDoubleClick={() => setIsEditing(true)}>{titleVal}</span>
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
              data-tooltip="重命名卡片"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          <button 
            onClick={onDelete}
            className="p-1 hover:bg-red-50 text-neutral-400 hover:text-red-600 rounded transition-colors cursor-pointer"
            data-tooltip="删除图片节点"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Image Content Container */}
      <div className="flex min-h-0 flex-1 p-3" onDoubleClick={() => setIsEditing(true)}>
        {imageUrl ? (
          <div className="flex min-h-0 w-full flex-col gap-2">
            <div className="relative group flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded border border-neutral-100 bg-neutral-50">
              <img 
                src={imageUrl} 
                alt="Uploaded resource" 
                referrerPolicy="no-referrer"
                className={imageClassName}
              />
              <button
                onClick={() => { setImageUrl(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="absolute top-1.5 right-1.5 text-xs bg-black/60 hover:bg-black/80 text-white px-2 py-0.5 rounded cursor-pointer transition-all"
              >
                更换图片
              </button>
            </div>
          </div>
        ) : (
          <div
            className="flex min-h-[120px] w-full flex-col items-center justify-center rounded border border-dashed border-neutral-200 bg-neutral-50/50 p-4 transition-colors hover:border-neutral-300"
            onDragOver={handleImageDragOver}
            onDrop={handleImageDrop}
          >
            {isUrlInput ? (
              <form onSubmit={handleUrlSubmit} className="w-full space-y-2 text-center">
                <input
                  type="url"
                  placeholder="粘贴图片 URL 地址..."
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  className="w-full text-xs font-sans text-neutral-700 bg-white border border-neutral-200 p-1.5 rounded focus:outline-none focus:border-neutral-400"
                />
                <div className="flex gap-2 justify-center">
                  <button 
                    type="submit"
                    className="text-[11px] font-medium text-white bg-neutral-900 hover:bg-neutral-800 px-2.5 py-1 rounded transition-colors cursor-pointer"
                  >
                    确定
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsUrlInput(false)}
                    className="text-[11px] font-medium text-neutral-500 hover:text-neutral-700 px-2.5 py-1 rounded transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className="w-6 h-6 text-neutral-400 stroke-[1.5]" />
                <span className="text-[11px] text-neutral-500 font-medium">拖放或上传图片</span>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                
                <div className="flex items-center gap-1.5 mt-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 text-[10px] bg-white border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-600 px-2 py-1 rounded shadow-xs transition-all cursor-pointer"
                  >
                    <Upload className="w-2.5 h-2.5" />
                    <span>本地上传</span>
                  </button>
                  <button
                    onClick={() => setIsUrlInput(true)}
                    className="flex items-center gap-1 text-[10px] bg-white border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-600 px-2 py-1 rounded shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>网络链接</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Node Footer */}
      <div className="flex shrink-0 justify-between items-center px-3.5 py-1.5 bg-neutral-50/20 border-t border-neutral-50 text-[10px] text-neutral-400 select-none rounded-b-lg">
        <span>{data.status || '画布插图'}</span>
        <span>ID: {id.slice(0, 6)}</span>
      </div>
    </div>
  );
});

ImageNode.displayName = 'ImageNode';


