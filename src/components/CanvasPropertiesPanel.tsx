import { Edge, MarkerType } from '@xyflow/react';
import { Check, ChevronDown, Link2, MousePointer2, Palette, SquareDashedMousePointer } from 'lucide-react';
import type { ReactNode } from 'react';
import { WorkspaceNode } from '../types';

interface CanvasPropertiesPanelProps {
  selectedNodes: WorkspaceNode[];
  selectedEdge: Edge | null;
  onUpdateNodes: (nodeIds: string[], patch: Partial<WorkspaceNode['data']>) => void;
  onResizeNodes: (nodeIds: string[], width?: number, height?: number) => void;
  onUpdateEdge: (edgeId: string, patch: Partial<Edge>) => void;
}

const STATUS_OPTIONS = ['', '草稿', '待补充', '已确认', '重点', '废弃'];
const COLOR_OPTIONS = ['#ffffff', '#f8fafc', '#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3'];
const EDGE_COLOR_OPTIONS = ['#737373', '#171717', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b'];

export default function CanvasPropertiesPanel({
  selectedNodes,
  selectedEdge,
  onUpdateNodes,
  onResizeNodes,
  onUpdateEdge,
}: CanvasPropertiesPanelProps) {
  if (selectedNodes.length === 0 && !selectedEdge) return null;

  if (selectedEdge) {
    const edgeColor = typeof selectedEdge.style?.stroke === 'string' ? selectedEdge.style.stroke : '#737373';
    const isDashed = typeof selectedEdge.style?.strokeDasharray === 'string' && selectedEdge.style.strokeDasharray.length > 0;

    return (
      <PanelShell title="连线属性" subtitle="编辑当前关系线" icon={<Link2 className="h-4 w-4" />}>
        <Field label="关系名称">
          <input
            value={String(selectedEdge.label || '')}
            onChange={(event) => onUpdateEdge(selectedEdge.id, { label: event.target.value })}
            className="panel-input"
            placeholder="例如：镜头关联"
          />
        </Field>
        <Field label="线条颜色">
          <ColorSwatches
            colors={EDGE_COLOR_OPTIONS}
            activeColor={edgeColor}
            onSelect={(color) =>
              onUpdateEdge(selectedEdge.id, {
                style: { ...selectedEdge.style, stroke: color },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  width: 16,
                  height: 16,
                  color,
                },
                animated: isDashed,
              })
            }
          />
        </Field>
        <Field label="线型">
          <SegmentedControl
            value={isDashed ? 'dashed' : 'solid'}
            options={[
              { value: 'solid', label: '实线' },
              { value: 'dashed', label: '虚线' },
            ]}
            onChange={(value) =>
              onUpdateEdge(selectedEdge.id, {
                animated: value === 'dashed',
                style: {
                  ...selectedEdge.style,
                  strokeDasharray: value === 'dashed' ? '6 4' : undefined,
                },
              })
            }
          />
        </Field>
      </PanelShell>
    );
  }

  const nodeIds = selectedNodes.map((node) => node.id);
  const firstNode = selectedNodes[0];
  const isSingle = selectedNodes.length === 1;
  const commonStatus = getCommonValue(selectedNodes.map((node) => node.data.status || ''));
  const commonColor = getCommonValue(selectedNodes.map((node) => node.data.color || '#ffffff')) || '#ffffff';
  const commonWidth = getCommonValue(selectedNodes.map((node) => String(node.data.width || node.width || '')));
  const commonHeight = getCommonValue(selectedNodes.map((node) => String(node.data.height || node.height || '')));
  const commonTags = getCommonValue(selectedNodes.map((node) => (node.data.tags || []).join(', ')));

  return (
    <PanelShell
      title={isSingle ? '节点属性' : '批量节点属性'}
      subtitle={isSingle ? firstNode.data.title || firstNode.id : `已选择 ${selectedNodes.length} 个节点`}
      icon={isSingle ? <MousePointer2 className="h-4 w-4" /> : <SquareDashedMousePointer className="h-4 w-4" />}
    >
      {isSingle && (
        <>
          <Field label="标题">
            <input
              value={firstNode.data.title || ''}
              onChange={(event) => onUpdateNodes(nodeIds, { title: event.target.value })}
              className="panel-input"
              placeholder="节点标题"
            />
          </Field>
          <Field label="内容">
            <textarea
              value={firstNode.data.content || ''}
              onChange={(event) => onUpdateNodes(nodeIds, { content: event.target.value })}
              className="panel-input min-h-20 resize-y"
              placeholder="节点内容"
            />
          </Field>
        </>
      )}

      <Field label="标签">
        <input
          value={commonTags}
          onChange={(event) =>
            onUpdateNodes(nodeIds, {
              tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean),
            })
          }
          className="panel-input"
          placeholder="用英文逗号分隔"
        />
      </Field>

      <Field label="状态">
        <StatusPicker
          value={commonStatus}
          onChange={(status) => onUpdateNodes(nodeIds, { status: status || undefined })}
        />
      </Field>

      <Field label="颜色">
        <ColorSwatches
          colors={COLOR_OPTIONS}
          activeColor={commonColor}
          onSelect={(color) => onUpdateNodes(nodeIds, { color })}
          trailing={<Palette className="ml-auto h-4 w-4 text-neutral-300" />}
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="宽度">
          <input
            type="number"
            min={160}
            value={commonWidth}
            onChange={(event) => onResizeNodes(nodeIds, Number(event.target.value) || undefined, undefined)}
            className="panel-input"
            placeholder="auto"
          />
        </Field>
        <Field label="高度">
          <input
            type="number"
            min={80}
            value={commonHeight}
            onChange={(event) => onResizeNodes(nodeIds, undefined, Number(event.target.value) || undefined)}
            className="panel-input"
            placeholder="auto"
          />
        </Field>
      </div>
    </PanelShell>
  );
}

function PanelShell({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="absolute right-4 top-20 z-30 w-72 rounded-2xl border border-neutral-200/80 bg-white/95 p-3 text-left shadow-xl shadow-neutral-900/10 backdrop-blur-md">
      <div className="mb-3 flex items-start gap-2 border-b border-neutral-100 pb-2">
        <div className="mt-0.5 text-neutral-500">{icon}</div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
          <p className="truncate text-[11px] text-neutral-400">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-neutral-500">{label}</span>
      {children}
    </label>
  );
}

function ColorSwatches({
  colors,
  activeColor,
  trailing,
  onSelect,
}: {
  colors: string[];
  activeColor: string;
  trailing?: ReactNode;
  onSelect: (color: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {colors.map((color) => (
        <button
          key={color}
          onClick={() => onSelect(color)}
          className={`relative h-7 w-7 cursor-pointer rounded-full border transition-all ${
            activeColor === color ? 'border-neutral-900 ring-2 ring-neutral-200' : 'border-neutral-200 hover:scale-105'
          }`}
          style={{ backgroundColor: color }}
          title={color}
        >
          {activeColor === color && (
            <Check className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-neutral-900 drop-shadow-[0_1px_0_rgba(255,255,255,0.75)]" />
          )}
        </button>
      ))}
      {trailing}
    </div>
  );
}

function StatusPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-1">
      <div className="mb-1 flex items-center justify-between px-2 text-[11px] text-neutral-400">
        <span>{value || '无状态'}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </div>
      <div className="grid grid-cols-3 gap-1">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status || 'none'}
            onClick={() => onChange(status)}
            className={`h-7 cursor-pointer rounded-lg px-2 text-[11px] transition-colors ${
              value === status
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {status || '无状态'}
          </button>
        ))}
      </div>
    </div>
  );
}

function SegmentedControl({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl border border-neutral-200 bg-white p-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`h-8 cursor-pointer rounded-lg text-xs font-medium transition-colors ${
            value === option.value
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function getCommonValue(values: string[]) {
  if (values.length === 0) return '';
  return values.every((value) => value === values[0]) ? values[0] : '';
}
