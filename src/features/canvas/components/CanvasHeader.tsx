/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, memo } from 'react';
import { 
  BookOpen, Download, HelpCircle, Compass, Image as ImageIcon, MoreHorizontal, Rows3, Trash2, Upload, Keyboard
} from 'lucide-react';
import { WorkspaceSaveState } from '../../../types';
import { useFeedback } from '../../../shared/feedback/FeedbackProvider';
import { APP_NAME, APP_VERSION } from '../../../appMetadata';
import {
  getDefaultImageNodeDisplayMode,
  setDefaultImageNodeDisplayMode,
  type ImageNodeDisplayMode,
} from '../utils/imageNodePreferences';

interface CanvasHeaderProps {
  onExportState: () => void;
  onImportState: (state: WorkspaceSaveState) => void;
  leadingActions?: React.ReactNode;
  rightActions?: React.ReactNode;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
  onAutoLayout?: () => void;
  onAssembleDocument?: () => void;
  onRequestClearCanvas?: () => void;
  onOpenShortcutSettings?: () => void;
}

const CanvasHeader = memo(function CanvasHeader({ 
  onExportState, 
  onImportState, 
  leadingActions,
  rightActions,
  menuOpen,
  onMenuOpenChange,
  onAutoLayout,
  onAssembleDocument,
  onRequestClearCanvas,
  onOpenShortcutSettings
}: CanvasHeaderProps) {
  const { toast } = useFeedback();
  const [localShowMenu, setLocalShowMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [defaultImageMode, setDefaultImageMode] = useState<ImageNodeDisplayMode>(() => getDefaultImageNodeDisplayMode());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);

  const isMenuOpen = menuOpen !== undefined ? menuOpen : localShowMenu;
  const setIsMenuOpen = onMenuOpenChange !== undefined ? onMenuOpenChange : setLocalShowMenu;

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        const clickedHelpButton = event.target instanceof Element && event.target.closest('button') && (event.target.textContent?.includes('指南') || event.target.closest('[data-tooltip="协同书写指南"]'));
        if (!clickedHelpButton) {
          setShowHelp(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsMenuOpen]);

  const handleFileImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const stateObj = JSON.parse(event.target?.result as string);
          if (stateObj.mainDocumentHtml !== undefined && Array.isArray(stateObj.nodes)) {
            onImportState(stateObj);
            toast('工作空间导入成功。', 'success');
          } else {
            toast('无效的文件格式，请导入本应用导出的 JSON 文件。', 'error');
          }
        } catch (err) {
          toast('解析导入文件失败，可能不是标准 JSON。', 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImportClick = () => {
    setIsMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleExportClick = () => {
    setIsMenuOpen(false);
    onExportState();
  };

  const handleHelpClick = () => {
    setIsMenuOpen(false);
    setShowHelp(true);
  };

  const handleShortcutSettingsClick = () => {
    setIsMenuOpen(false);
    onOpenShortcutSettings?.();
  };

  const handleAutoLayoutClick = () => {
    setIsMenuOpen(false);
    onAutoLayout?.();
  };

  const handleAssembleDocumentClick = () => {
    setIsMenuOpen(false);
    onAssembleDocument?.();
  };

  const handleClearCanvasClick = () => {
    setIsMenuOpen(false);
    onRequestClearCanvas?.();
  };

  const handleDefaultImageModeChange = (mode: ImageNodeDisplayMode) => {
    setDefaultImageMode(mode);
    setDefaultImageNodeDisplayMode(mode);
    toast(mode === 'image-only' ? '新建图片节点默认使用纯图片。' : '新建图片节点默认使用图文描述。', 'success');
  };

  const hasCanvasTools = !!(onAutoLayout || onAssembleDocument || onRequestClearCanvas);

  return (
    <header className="absolute top-4 left-4 right-4 bg-transparent select-none z-30 flex items-center justify-between pointer-events-none">
      {/* Brand Identity / Title info */}
      <div className="flex items-center gap-2.5 bg-white/80 backdrop-blur-md border border-neutral-200/80 shadow-md py-1.5 px-3 rounded-lg pointer-events-auto">
        <img
          src="/scriptflow-brand-icon.png"
          alt=""
          aria-hidden="true"
          className="h-6 w-6 rounded-md object-cover"
        />
        <h1 className="text-sm font-semibold tracking-tight text-neutral-950 flex items-center gap-1.5">
          <span>{APP_NAME}</span>
          <span className="text-[10px] font-normal font-mono text-neutral-400">
            {APP_VERSION}
          </span>
        </h1>
      </div>

      <div className="flex items-start gap-2 pointer-events-auto">
        {leadingActions}

        {/* Extreme Minimalist Controls: Right actions and the shadow-free '...' menu */}
        <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur-md border border-neutral-200/50 shadow-md py-1 px-1.5 rounded-lg" ref={menuRef}>
          {rightActions}
          {rightActions && <div className="h-4 w-px bg-neutral-200/60 mx-0.5" />}
          
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex items-center justify-center w-7 h-7 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-150 bg-transparent transition-all cursor-pointer ${isMenuOpen ? 'text-neutral-900 bg-neutral-100' : ''}`}
              data-tooltip="功能菜单"
              data-tooltip-placement="bottom"
              id="header-menu-button"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {/* Dropdown Menu Container */}
            {isMenuOpen && (
              <div className="absolute right-0 top-[34px] w-56 bg-white/95 backdrop-blur-md border border-neutral-200 shadow-xl rounded-lg py-1.5 z-50 text-neutral-700 animate-in fade-in slide-in-from-top-1">
            
              <button
                onClick={handleImportClick}
                className="w-full px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 transition-colors text-left cursor-pointer font-medium"
              >
                <Upload className="w-3.5 h-3.5 text-neutral-400" />
                <span>导入数据</span>
              </button>
              <button
                onClick={handleExportClick}
                className="w-full px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 transition-colors text-left cursor-pointer font-medium"
              >
                <Download className="w-3.5 h-3.5 text-neutral-400" />
                <span>导出数据</span>
              </button>

              <div className="h-px bg-neutral-100 my-1.5" />

              {hasCanvasTools && (
                <>
                  {onAutoLayout && (
                    <button
                      onClick={handleAutoLayoutClick}
                      className="w-full px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 transition-colors text-left cursor-pointer font-medium"
                    >
                      <Rows3 className="w-3.5 h-3.5 text-neutral-400" />
                      <span>整理画布</span>
                    </button>
                  )}
                  {onAssembleDocument && (
                    <button
                      onClick={handleAssembleDocumentClick}
                      className="w-full px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 transition-colors text-left cursor-pointer font-medium"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-neutral-400" />
                      <span>还原文档</span>
                    </button>
                  )}
                  {onRequestClearCanvas && (
                    <button
                      onClick={handleClearCanvasClick}
                      className="w-full px-3 py-1.5 text-xs text-neutral-800 hover:bg-red-50 flex items-center gap-2 transition-colors text-left cursor-pointer font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-red-700/90">清空画布</span>
                    </button>
                  )}

                  <div className="h-px bg-neutral-100 my-1.5" />
                </>
              )}

              <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-700">
                <ImageIcon className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                <span className="shrink-0 font-medium">新建图片默认</span>
                <div className="ml-auto flex rounded-md border border-neutral-200 bg-neutral-50 p-0.5">
                  <button
                    type="button"
                    onClick={() => handleDefaultImageModeChange('image-only')}
                    className={`h-6 cursor-pointer rounded px-2 text-[10px] font-bold transition-colors ${
                      defaultImageMode === 'image-only'
                        ? 'bg-neutral-200 text-neutral-900'
                        : 'text-neutral-400 hover:text-neutral-700'
                    }`}
                  >
                    纯图
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDefaultImageModeChange('image-card')}
                    className={`h-6 cursor-pointer rounded px-2 text-[10px] font-bold transition-colors ${
                      defaultImageMode === 'image-card'
                        ? 'bg-neutral-200 text-neutral-900'
                        : 'text-neutral-400 hover:text-neutral-700'
                    }`}
                  >
                    图文
                  </button>
                </div>
              </div>

              <div className="h-px bg-neutral-100 my-1.5" />

              <button
                onClick={handleShortcutSettingsClick}
                className="w-full px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 transition-colors text-left cursor-pointer font-medium"
              >
                <Keyboard className="w-3.5 h-3.5 text-neutral-400" />
                <span>快捷键设置</span>
              </button>
              <button
                onClick={handleHelpClick}
                className="w-full px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 transition-colors text-left cursor-pointer font-medium"
              >
                <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
                <span>协同书写指南</span>
              </button>
            </div>
          )}
          </div>
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileImportChange} 
        accept=".json" 
        className="hidden" 
      />

      {/* Guidelines Modal Popover overlay */}
      {showHelp && (
        <div ref={helpRef} className="absolute right-6 top-[54px] w-[340px] bg-white border border-neutral-250/90 shadow-2xl rounded-lg p-5 z-50 text-neutral-700 text-xs text-left animate-in fade-in slide-in-from-top-1 pointer-events-auto">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Compass className="w-4 h-4 text-neutral-800" />
            <h4 className="font-semibold text-neutral-900">非线性写作协同工作指南</h4>
          </div>
          <div className="space-y-2 text-neutral-600 leading-normal">
            <p>
              本应用是一个支持非线性结构布局的文本写作大纲白板。你可以将左侧结构严谨的长文拆解或合并到电白板自由排布。
            </p>
            <div className="border-t border-neutral-100 pt-2.5 space-y-2">
              <div className="flex items-start gap-1.5">
                <span className="text-neutral-800 font-semibold font-mono">1.</span>
                <p>
                  <strong>主文档书写</strong>：在左侧编辑器中构思或粘贴你的基础文章草稿，支持各级大纲标题、加粗、引用与列表。
                </p>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-neutral-800 font-semibold font-mono">2.</span>
                <p>
                  <strong>卡片切片化 (段落一键切片)</strong>：鼠标选中左侧某些文字点击 <strong>[选取切片]</strong>，或者在下方段落管理器中点击 ➔ 按钮，皆可快速生成独立的画布卡片节点。
                </p>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-neutral-800 font-semibold font-mono">3.</span>
                <p>
                  <strong>逻辑线条联结</strong>：双击卡片、手动拖拽圆点，可设定“承接”、“对比冲突”、“分支并行”等关系图线。
                </p>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-neutral-800 font-semibold font-mono">4.</span>
                <p>
                  <strong>逆向逆推还原</strong>：点击画布右上角 <strong>[逆向重组主文档]</strong> 按钮，算法将自动依照拓扑关联，反向合并并一键同步覆盖到主文字区域中！
                </p>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between text-neutral-400">
              <span>视觉风格：极简白色 / 灰色</span>
              <button 
                onClick={() => setShowHelp(false)}
                className="text-neutral-800 hover:underline cursor-pointer font-semibold"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
});

CanvasHeader.displayName = 'CanvasHeader';

export default CanvasHeader;
