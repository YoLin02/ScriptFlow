import { Download, FolderOpen, Image, Trash2, Upload, X } from 'lucide-react';
import { CanvasMediaAsset } from '../../../types';
import { useFeedback } from '../../../shared/feedback/FeedbackProvider';

interface MediaLibraryDrawerProps {
  open: boolean;
  assets: CanvasMediaAsset[];
  fileInputRef: React.RefObject<HTMLInputElement>;
  onClose: () => void;
  onUpload: (files: File[]) => void;
  onInsertAsset: (asset: CanvasMediaAsset) => void;
  onDeleteAsset: (assetId: string) => void;
  onDownloadAll: () => void;
}

export default function MediaLibraryDrawer({
  open,
  assets,
  fileInputRef,
  onClose,
  onUpload,
  onInsertAsset,
  onDeleteAsset,
  onDownloadAll,
}: MediaLibraryDrawerProps) {
  const { confirm: askConfirm } = useFeedback();

  if (!open) return null;

  return (
    <div className="absolute right-4 top-[72px] bottom-4 w-80 bg-white/95 backdrop-blur-md border border-neutral-200/95 shadow-25 rounded-xl z-40 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200 text-xs text-neutral-800 pointer-events-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 bg-neutral-50/50">
        <div className="flex items-center gap-1.5">
          <FolderOpen className="w-4 h-4 text-neutral-700" />
          <span className="font-semibold text-neutral-800 text-xs">配图文件夹</span>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-700 p-1 hover:bg-neutral-100 rounded cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 border-b border-neutral-100 space-y-3 bg-neutral-50/30">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
              onUpload(Array.from(files));
            }
          }}
          className="border border-dashed border-neutral-250 hover:border-neutral-400 rounded-lg p-5 flex flex-col items-center justify-center bg-white cursor-pointer transition-all hover:bg-neutral-50/20 group"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-6 h-6 text-neutral-400 group-hover:text-neutral-700 transition-colors mb-2" />
          <span className="text-[11px] font-semibold text-neutral-700">拖拽上传 / 批量选择</span>
          <span className="text-[9px] text-neutral-400 mt-0.5">支持批量上传到文件夹，自动插到画布</span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                onUpload(Array.from(files));
              }
            }}
          />
        </div>

        {assets.length > 0 && (
          <div className="flex justify-between items-center bg-white px-3 py-2 border border-neutral-150 rounded-md shadow-xs">
            <span className="text-[10px] text-neutral-500 font-medium">共计 <span className="text-neutral-850 font-bold">{assets.length}</span> 张配图</span>
            <button
              onClick={onDownloadAll}
              className="inline-flex items-center gap-1 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold px-2.5 py-1 text-[10px] rounded transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-2.5 h-2.5" />
              <span>一键打包下载</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {assets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400 space-y-2 select-none">
            <Image className="w-10 h-10 text-neutral-200 stroke-[1.2]" />
            <p className="text-[11px] font-semibold text-neutral-500">配图文件夹为空</p>
            <p className="text-[10px] text-neutral-400 leading-relaxed">
              请在此上传图片。我们将为您自动在画布中插入同名配图卡片，并可在未来一键打包下载！
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="group relative bg-neutral-50 border border-neutral-200 rounded-lg overflow-hidden flex flex-col transition-all hover:shadow-xs hover:border-neutral-300"
              >
                <div
                  onClick={() => onInsertAsset(asset)}
                  className="h-20 w-full bg-neutral-100 flex items-center justify-center cursor-pointer overflow-hidden relative"
                  data-tooltip="点击将配图卡片插入到画布中"
                >
                  <img
                    src={asset.url}
                    alt={asset.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-neutral-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-semibold text-[10px] gap-1 select-none">
                    <span>插入画布</span>
                  </div>
                </div>

                <div className="px-2 py-1.5 border-t border-neutral-150 bg-white flex items-center justify-between gap-1">
                  <span className="text-[10px] text-neutral-700 truncate font-semibold flex-1" data-tooltip={asset.name}>
                    {asset.name}
                  </span>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const confirmed = await askConfirm({
                        title: '删除媒体资源',
                        message: `确定要从媒体库删除 "${asset.name}" 吗？这不会直接清除正在画布中引用的节点。`,
                        confirmText: '删除',
                        cancelText: '取消',
                        destructive: true,
                      });
                      if (confirmed) {
                        onDeleteAsset(asset.id);
                      }
                    }}
                    className="text-neutral-400 hover:text-red-650 hover:bg-neutral-50 p-1 rounded transition-colors cursor-pointer shrink-0"
                    data-tooltip="自文件夹中删除"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
