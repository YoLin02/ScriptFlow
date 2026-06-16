import { Edge, MarkerType } from '@xyflow/react';
import { AlignCenter, AlignLeft, AlignRight, CornerDownRight, Link2, MousePointer2, Route, SquareDashedMousePointer, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { TableCellSelection, TableNodeDataValue, TableTextAlign, WorkspaceNode } from '../../../types';
import ColorSwatches from './color/ColorSwatches';

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
const IMAGE_DISPLAY_OPTIONS = [
  { value: 'contain', label: '适应' },
  { value: 'cover', label: '填充' },
  { value: 'original', label: '原始' },
];
const EDGE_ROUTE_OPTIONS: Array<{ value: 'default' | 'step'; label: string; icon: ReactNode }> = [
  { value: 'default', label: '弧线', icon: <Route className="h-4 w-4" /> },
  { value: 'step', label: '折线', icon: <CornerDownRight className="h-4 w-4" /> },
];
const ALIGNMENT_OPTIONS: Array<{ value: TableTextAlign; label: string; icon: ReactNode }> = [
  { value: 'left', label: '左对齐', icon: <AlignLeft className="h-4 w-4" /> },
  { value: 'center', label: '居中', icon: <AlignCenter className="h-4 w-4" /> },
  { value: 'right', label: '右对齐', icon: <AlignRight className="h-4 w-4" /> },
];

export default function CanvasPropertiesPanel({
  selectedNodes,
  selectedEdge,
  onUpdateNodes,
  onResizeNodes,
  onUpdateEdge,
}: CanvasPropertiesPanelProps) {
  if (selectedNodes.length === 0 && !selectedEdge) return null;

  if (selectedEdge) {
    return <EdgePropertiesPanel selectedEdge={selectedEdge} onUpdateEdge={onUpdateEdge} />;
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
      <CommonNodeFields
        isSingle={isSingle}
        nodeIds={nodeIds}
        firstNode={firstNode}
        commonTags={commonTags}
        commonStatus={commonStatus}
        commonColor={commonColor}
        commonWidth={commonWidth}
        commonHeight={commonHeight}
        onUpdateNodes={onUpdateNodes}
        onResizeNodes={onResizeNodes}
      />

      {isSingle && firstNode.type !== 'timeline' && (
        <SpecificFieldsShell key={firstNode.type || firstNode.data.type}>
          <NodeSpecificFields node={firstNode} nodeIds={nodeIds} onUpdateNodes={onUpdateNodes} />
        </SpecificFieldsShell>
      )}
    </PanelShell>
  );
}

function EdgePropertiesPanel({
  selectedEdge,
  onUpdateEdge,
}: {
  selectedEdge: Edge;
  onUpdateEdge: (edgeId: string, patch: Partial<Edge>) => void;
}) {
  const edgeColor = typeof selectedEdge.style?.stroke === 'string' ? selectedEdge.style.stroke : '#737373';
  const isDashed = typeof selectedEdge.style?.strokeDasharray === 'string' && selectedEdge.style.strokeDasharray.length > 0;
  const edgeRouteType = selectedEdge.type === 'step' ? 'step' : 'default';

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
      <InlineField label="线型">
        <CompactTextSegmentedControl
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
      </InlineField>
      <InlineField label="路径形态">
        <EdgeRouteControl
          value={edgeRouteType}
          options={EDGE_ROUTE_OPTIONS}
          onChange={(value) => onUpdateEdge(selectedEdge.id, { type: value })}
        />
      </InlineField>
    </PanelShell>
  );
}

function CommonNodeFields({
  isSingle,
  nodeIds,
  firstNode,
  commonTags,
  commonStatus,
  commonColor,
  commonWidth,
  commonHeight,
  onUpdateNodes,
  onResizeNodes,
}: {
  isSingle: boolean;
  nodeIds: string[];
  firstNode: WorkspaceNode;
  commonTags: string;
  commonStatus: string;
  commonColor: string;
  commonWidth: string;
  commonHeight: string;
  onUpdateNodes: (nodeIds: string[], patch: Partial<WorkspaceNode['data']>) => void;
  onResizeNodes: (nodeIds: string[], width?: number, height?: number) => void;
}) {
  return (
    <section className="space-y-1.5">
      {isSingle && (
        <Field label="标题">
          <input
            value={firstNode.data.title || ''}
            onChange={(event) => onUpdateNodes(nodeIds, { title: event.target.value })}
            className="panel-input"
            placeholder="节点标题"
          />
        </Field>
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
    </section>
  );
}

function NodeSpecificFields({
  node,
  nodeIds,
  onUpdateNodes,
}: {
  node: WorkspaceNode;
  nodeIds: string[];
  onUpdateNodes: (nodeIds: string[], patch: Partial<WorkspaceNode['data']>) => void;
}) {
  if (node.type === 'image' || node.data.type === 'image') {
    return <ImageSpecificFields node={node} nodeIds={nodeIds} onUpdateNodes={onUpdateNodes} />;
  }

  if (node.type === 'idea' || node.data.type === 'idea') {
    return (
      <Field label="想法内容">
        <textarea
          value={node.data.content || ''}
          onChange={(event) => onUpdateNodes(nodeIds, { content: event.target.value })}
          className="panel-input min-h-16 resize-y"
          placeholder="记录灵感、疑问或批注..."
        />
      </Field>
    );
  }

  if (node.type === 'table' || node.data.type === 'table') {
    const table = isTableData(node.data.tableData) ? node.data.tableData : undefined;
    const rowCount = table?.rows.length || 0;
    const columnCount = table?.headers.length || table?.rows[0]?.length || 0;

    return (
      <>
        <TableSummary rowCount={rowCount} columnCount={columnCount} />
        <TableAlignmentFields node={node} nodeIds={nodeIds} onUpdateNodes={onUpdateNodes} />
      </>
    );
  }

  return (
    <>
      <Field label="正文内容">
        <textarea
          value={node.data.content || ''}
          onChange={(event) => onUpdateNodes(nodeIds, { content: event.target.value })}
          className="panel-input min-h-16 resize-y"
          placeholder="节点内容"
        />
      </Field>
    </>
  );
}

function ImageSpecificFields({
  node,
  nodeIds,
  onUpdateNodes,
}: {
  node: WorkspaceNode;
  nodeIds: string[];
  onUpdateNodes: (nodeIds: string[], patch: Partial<WorkspaceNode['data']>) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = String(reader.result || '');
      const nameWithoutExtension = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      onUpdateNodes(nodeIds, {
        imageUrl,
        imageCaption: node.data.imageCaption || nameWithoutExtension,
        title: node.data.title || nameWithoutExtension,
      });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 shadow-xs transition-colors hover:bg-neutral-50"
        >
          <Upload className="h-3.5 w-3.5" />
          本地上传
        </button>
        <button
          type="button"
          onClick={() => setShowUrlInput((value) => !value)}
          className={`flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border text-xs font-medium shadow-xs transition-colors ${
            showUrlInput ? 'border-neutral-200 bg-neutral-200 text-neutral-900' : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          <span className="text-base leading-none">+</span>
          网络链接
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {showUrlInput && (
        <Field label="图片地址">
          <input
            value={node.data.imageUrl || ''}
            onChange={(event) => onUpdateNodes(nodeIds, { imageUrl: event.target.value })}
            className="panel-input"
            placeholder="https://..."
          />
        </Field>
      )}

      <Field label="图片说明">
        <textarea
          value={node.data.imageCaption || ''}
          onChange={(event) => onUpdateNodes(nodeIds, { imageCaption: event.target.value })}
          className="panel-input min-h-14 resize-y"
          placeholder="图片说明 / Caption"
        />
      </Field>
      <Field label="显示模式">
        <SegmentedControl
          value={String(node.data.imageDisplayMode || 'contain')}
          options={IMAGE_DISPLAY_OPTIONS}
          onChange={(value) => onUpdateNodes(nodeIds, { imageDisplayMode: value as 'contain' | 'cover' | 'original' })}
        />
      </Field>
    </>
  );
}

function TableAlignmentFields({
  node,
  nodeIds,
  onUpdateNodes,
}: {
  node: WorkspaceNode;
  nodeIds: string[];
  onUpdateNodes: (nodeIds: string[], patch: Partial<WorkspaceNode['data']>) => void;
}) {
  const activeCell = isTableCellSelection(node.data.activeTableCell) ? node.data.activeTableCell : null;
  const activeCellKey = activeCell ? getTableCellKey(activeCell) : null;
  const tableAlign = isTableTextAlign(node.data.tableAlign) ? node.data.tableAlign : 'left';
  const cellAlignments = isTableCellAlignments(node.data.tableCellAlignments) ? node.data.tableCellAlignments : {};
  const activeCellAlign = activeCellKey
    ? (cellAlignments[activeCellKey] || tableAlign)
    : tableAlign;

  const updateTableAlign = (align: TableTextAlign) => {
    onUpdateNodes(nodeIds, { tableAlign: align });
  };

  const updateCellAlign = (align: TableTextAlign) => {
    if (!activeCellKey) return;
    onUpdateNodes(nodeIds, {
      tableCellAlignments: {
        ...cellAlignments,
        [activeCellKey]: align,
      },
    });
  };

  return (
    <>
      <Field label="整体表格对齐">
        <IconSegmentedControl value={tableAlign} options={ALIGNMENT_OPTIONS} onChange={updateTableAlign} />
      </Field>
      <Field label={activeCell ? '当前单元格对齐' : '当前单元格对齐（先点击单元格）'}>
        <IconSegmentedControl
          value={activeCellAlign}
          options={ALIGNMENT_OPTIONS}
          onChange={updateCellAlign}
          disabled={!activeCell}
        />
      </Field>
    </>
  );
}

function PanelShell({ title, subtitle: _subtitle, icon, children }: { title: string; subtitle: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="absolute right-4 top-20 z-30 w-[17.5rem] max-w-[calc(100vw-2rem)] rounded-xl border border-neutral-200/80 bg-white/95 p-2.5 text-left shadow-xl shadow-neutral-900/10 backdrop-blur-md">
      <div className="mb-2.5 flex items-start gap-2 border-b border-neutral-100 pb-2">
        <div className="mt-0.5 text-neutral-500">{icon}</div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
        </div>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SpecificFieldsShell({ children }: { children: ReactNode }) {
  return (
    <section className="node-specific-fields border-t border-neutral-100 pt-2">
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="block">
      <span className="mb-1 block text-[11px] font-medium text-neutral-500">{label}</span>
      {children}
    </div>
  );
}

function InlineField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] font-medium text-neutral-500">{label}</span>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function TableSummary({ rowCount, columnCount }: { rowCount: number; columnCount: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs">
      <span className="text-neutral-500">表格规模</span>
      <div className="flex items-center gap-2 font-semibold text-neutral-800">
        <span>{rowCount} 行</span>
        <span className="h-3 w-px bg-neutral-200" />
        <span>{columnCount} 列</span>
      </div>
    </div>
  );
}

function StatusPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl border border-neutral-200 bg-white p-1">
      {STATUS_OPTIONS.map((status) => (
        <button
          key={status || 'none'}
          onClick={() => onChange(status)}
          className={`h-7 cursor-pointer rounded-lg px-2 text-[11px] transition-colors ${
            value === status
              ? 'bg-neutral-200 text-neutral-900'
              : 'bg-transparent text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          {status || '无状态'}
        </button>
      ))}
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
    <div
      className="grid gap-1 rounded-xl border border-neutral-200 bg-white p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`h-8 cursor-pointer rounded-lg px-1 text-xs font-medium transition-colors ${
            value === option.value
              ? 'bg-neutral-200 text-neutral-900'
              : 'text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function CompactTextSegmentedControl({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-grid grid-cols-2 gap-1 rounded-xl border border-neutral-200 bg-white p-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`h-8 w-14 cursor-pointer rounded-lg text-xs font-medium transition-colors ${
            value === option.value
              ? 'bg-neutral-200 text-neutral-900'
              : 'text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function IconSegmentedControl({
  value,
  options,
  disabled = false,
  onChange,
}: {
  value: TableTextAlign;
  options: Array<{ value: TableTextAlign; label: string; icon: ReactNode }>;
  disabled?: boolean;
  onChange: (value: TableTextAlign) => void;
}) {
  return (
    <div className={`grid grid-cols-3 gap-1 rounded-xl border border-neutral-200 bg-white p-1 ${disabled ? 'opacity-45' : ''}`}>
      {options.map((option) => (
        <button
          key={option.value}
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={`flex h-8 items-center justify-center rounded-lg transition-colors ${
            disabled ? 'cursor-not-allowed' : 'cursor-pointer'
          } ${
            value === option.value
              ? 'bg-neutral-200 text-neutral-900'
              : 'text-neutral-600 hover:bg-neutral-50'
          }`}
          data-tooltip={option.label}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}

function EdgeRouteControl({
  value,
  options,
  onChange,
}: {
  value: 'default' | 'step';
  options: Array<{ value: 'default' | 'step'; label: string; icon: ReactNode }>;
  onChange: (value: 'default' | 'step') => void;
}) {
  return (
    <div className="inline-grid grid-cols-2 gap-1 rounded-xl border border-neutral-200 bg-white p-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`flex h-8 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors ${
            value === option.value
              ? 'bg-neutral-200 text-neutral-900'
              : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
          }`}
          data-tooltip={option.label}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}

function getCommonValue(values: string[]) {
  if (values.length === 0) return '';
  return values.every((value) => value === values[0]) ? values[0] : '';
}

function isTableData(value: unknown): value is TableNodeDataValue {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<TableNodeDataValue>;
  return Array.isArray(candidate.headers) && Array.isArray(candidate.rows);
}

function isTableCellSelection(value: unknown): value is TableCellSelection {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<TableCellSelection>;
  return (candidate.section === 'header' || candidate.section === 'body')
    && typeof candidate.columnIndex === 'number';
}

function getTableCellKey(selection: TableCellSelection) {
  return selection.section === 'header'
    ? `header-${selection.columnIndex}`
    : `body-${selection.rowIndex ?? 0}-${selection.columnIndex}`;
}

function isTableTextAlign(value: unknown): value is TableTextAlign {
  return value === 'left' || value === 'center' || value === 'right';
}

function isTableCellAlignments(value: unknown): value is Record<string, TableTextAlign> {
  if (!value || typeof value !== 'object') return false;
  return Object.values(value).every(isTableTextAlign);
}
