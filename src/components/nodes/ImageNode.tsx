import React, { memo, useContext, useEffect, useRef, useState } from 'react';
import { Check, Edit3, Image as ImageIcon, Plus, Trash2, Upload } from 'lucide-react';
import { NodeActionContext } from './NodeActionContext';
import StandardHandles from './StandardHandles';
import type { ImageCanvasNodeData } from '../../types';

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempUrl.trim()) {
      setImageUrl(tempUrl.trim());
      setIsUrlInput(false);
      onUpdateContent?.(id, data.content, titleVal, tempUrl.trim(), caption);
    }
  };

  const handleCaptionChange = (newCaption: string) => {
    setCaption(newCaption);
    onUpdateContent?.(id, data.content, titleVal, imageUrl, newCaption);
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

  return (
    <div 
      ref={nodeRef}
      className={`relative w-[280px] bg-white rounded-lg border text-left transition-all ${
        selected 
          ? 'shadow-lg border-neutral-800 ring-1 ring-neutral-800' 
          : 'shadow-sm border-neutral-200/80 hover:border-neutral-300'
      }`}
    >
      <StandardHandles />

      {/* Node Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-neutral-50/50 border-b border-neutral-100 rounded-t-lg">
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
              title="保存"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="p-1 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-700 rounded transition-colors cursor-pointer"
              title="重命名卡片"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          <button 
            onClick={onDelete}
            className="p-1 hover:bg-red-50 text-neutral-400 hover:text-red-600 rounded transition-colors cursor-pointer"
            title="删除图片节点"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Image Content Container */}
      <div className="p-3" onDoubleClick={() => setIsEditing(true)}>
        {imageUrl ? (
          <div className="space-y-2">
            <div className="relative group overflow-hidden rounded border border-neutral-100 max-h-[180px] bg-neutral-50 flex items-center justify-center">
              <img 
                src={imageUrl} 
                alt="Uploaded resource" 
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[180px] object-contain"
              />
              <button
                onClick={() => { setImageUrl(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="absolute top-1.5 right-1.5 text-xs bg-black/60 hover:bg-black/80 text-white px-2 py-0.5 rounded cursor-pointer transition-all"
              >
                更换图片
              </button>
            </div>
            <input
              type="text"
              value={caption}
              placeholder="添加图片批注或说明..."
              onChange={(e) => handleCaptionChange(e.target.value)}
              className="w-full text-xs text-neutral-500 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white border border-transparent focus:border-neutral-200 px-2 py-1 rounded focus:outline-none"
            />
          </div>
        ) : (
          <div className="border border-dashed border-neutral-200 hover:border-neutral-300 rounded p-4 flex flex-col items-center justify-center bg-neutral-50/50 transition-colors">
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
      <div className="px-3.5 py-1.5 bg-neutral-50/20 border-t border-neutral-50 text-[10px] text-neutral-400 flex justify-between items-center select-none rounded-b-lg">
        <span>画布插图</span>
        <span>ID: {id.slice(0, 6)}</span>
      </div>
    </div>
  );
});

ImageNode.displayName = 'ImageNode';


