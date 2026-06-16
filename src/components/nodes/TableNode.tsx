import React, { memo, useContext, useEffect, useState } from 'react';
import { Plus, Table, Trash2 } from 'lucide-react';
import { NodeActionContext } from './NodeActionContext';
import StandardHandles from './StandardHandles';
import type { TableCanvasNodeData, TableCellSelection, TableNodeDataValue, TableTextAlign } from '../../types';

const DEFAULT_TABLE_DATA: TableNodeDataValue = {
  headers: ['姓名', '岗位', '进度'],
  rows: [
    ['张三', '开发', '90%'],
    ['李四', '设计', '60%'],
  ],
};

function normalizeTableData(value: unknown): TableNodeDataValue | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<TableNodeDataValue>;
  if (!Array.isArray(candidate.headers) || !Array.isArray(candidate.rows)) return null;

  return {
    headers: candidate.headers.map((header) => String(header)),
    rows: candidate.rows.map((row) => Array.isArray(row) ? row.map((cell) => String(cell)) : []),
  };
}

function getTableDataFromNode(data: TableCanvasNodeData): TableNodeDataValue {
  const structured = normalizeTableData(data.tableData);
  if (structured) return structured;

  try {
    if (data.content && data.content.trim().startsWith('{')) {
      const legacy = normalizeTableData(JSON.parse(data.content));
      if (legacy) return legacy;
    }
  } catch (e) {
    console.warn('Failed to parse table content JSON', e);
  }

  return DEFAULT_TABLE_DATA;
}

function getTableCellKey(selection: TableCellSelection) {
  return selection.section === 'header'
    ? `header-${selection.columnIndex}`
    : `body-${selection.rowIndex ?? 0}-${selection.columnIndex}`;
}

export const TableNode = memo(({ id, data, selected }: { id: string; data: TableCanvasNodeData; selected?: boolean }) => {
  const { onDeleteNode, onUpdateContent } = useContext(NodeActionContext);
  const [titleVal, setTitleVal] = useState(data.title || '自定义表格');
  const [table, setTable] = useState<TableNodeDataValue>(() => getTableDataFromNode(data));

  useEffect(() => {
    const nextTable = getTableDataFromNode(data);
    if (JSON.stringify(nextTable) !== JSON.stringify(table)) {
      setTable(nextTable);
    }
  }, [data.tableData, data.content]);

  useEffect(() => {
    setTitleVal(data.title || '自定义表格');
  }, [data.title]);

  const saveTableData = (updatedTable: typeof table, updatedTitle = titleVal) => {
    onUpdateContent?.(id, '', updatedTitle, undefined, undefined, { tableData: updatedTable });
  };

  const selectTableCell = (selection: TableCellSelection) => {
    onUpdateContent?.(id, '', titleVal, undefined, undefined, { tableData: table, activeTableCell: selection });
  };

  const getCellAlignment = (selection: TableCellSelection): TableTextAlign => {
    const key = getTableCellKey(selection);
    return data.tableCellAlignments?.[key] || data.tableAlign || 'left';
  };

  const updateHeaderCell = (colIdx: number, value: string) => {
    const newHeaders = [...table.headers];
    newHeaders[colIdx] = value;
    const nextTable = { ...table, headers: newHeaders };
    setTable(nextTable);
    saveTableData(nextTable);
  };

  const updateBodyCell = (rowIdx: number, colIdx: number, value: string) => {
    const newRows = table.rows.map((r: string[], rIdx: number) => {
      if (rIdx === rowIdx) {
        const nextRow = [...r];
        nextRow[colIdx] = value;
        return nextRow;
      }
      return r;
    });
    const nextTable = { ...table, rows: newRows };
    setTable(nextTable);
    saveTableData(nextTable);
  };

  const addRow = () => {
    const newRow = Array(table.headers.length).fill('');
    const nextTable = {
      ...table,
      rows: [...table.rows, newRow],
    };
    setTable(nextTable);
    saveTableData(nextTable);
  };

  const deleteRow = (rIdx: number) => {
    if (table.rows.length <= 1) return;
    const nextTable = {
      ...table,
      rows: table.rows.filter((_, idx) => idx !== rIdx),
    };
    setTable(nextTable);
    saveTableData(nextTable);
  };

  const addColumn = () => {
    const newHeader = `新列 ${table.headers.length + 1}`;
    const nextTable = {
      headers: [...table.headers, newHeader],
      rows: table.rows.map((row: string[]) => [...row, '']),
    };
    setTable(nextTable);
    saveTableData(nextTable);
  };

  const deleteColumn = (cIdx: number) => {
    if (table.headers.length <= 1) return;
    const nextTable = {
      headers: table.headers.filter((_, idx) => idx !== cIdx),
      rows: table.rows.map((row: string[]) => row.filter((_, idx) => idx !== cIdx)),
    };
    setTable(nextTable);
    saveTableData(nextTable);
  };

  const handleTitleBlur = () => {
    onUpdateContent?.(id, '', titleVal, undefined, undefined, { tableData: table });
  };

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteNode?.(id);
  };

  return (
    <div
      className={`relative min-w-[320px] max-w-[420px] bg-white rounded-lg border text-left transition-all ${
        selected
          ? 'shadow-lg border-neutral-800 ring-1 ring-neutral-800'
          : 'shadow-sm border-neutral-200/85 hover:border-neutral-300'
      }`}
      style={{
        width: data.width ? `${data.width}px` : undefined,
        minHeight: data.height ? `${data.height}px` : undefined,
        backgroundColor: data.color || undefined,
      }}
    >
      <StandardHandles />

      {/* Node Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-neutral-50/50 border-b border-neutral-100 rounded-t-lg">
        <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-2">
          <Table className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
          <input
            type="text"
            value={titleVal}
            onChange={(e) => setTitleVal(e.target.value)}
            onBlur={handleTitleBlur}
            className="nodrag text-xs font-semibold text-neutral-700 bg-transparent border-none p-0 w-full focus:outline-none focus:ring-0"
            onClick={(e) => e.stopPropagation()}
            placeholder="表格卡片"
          />
        </div>
        <div className="flex items-center">
          <button
            onClick={onDelete}
            className="p-1 hover:bg-red-50 text-neutral-400 hover:text-red-600 rounded transition-colors cursor-pointer"
            data-tooltip="删除表格"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Node Content Body */}
      <div className="p-3">
        <div className="overflow-x-auto max-w-full rounded border border-neutral-150">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/60 border-b border-neutral-200">
                {table.headers.map((hdr: string, cIdx: number) => (
                  <th key={cIdx} className="p-1.5 min-w-[80px] border-r last:border-r-0 border-neutral-200 relative group/col h-8">
                    <input
                      type="text"
                      value={hdr}
                      onChange={(e) => updateHeaderCell(cIdx, e.target.value)}
                      className="nodrag w-full text-[11px] font-bold text-neutral-700 bg-transparent border-none p-0 focus:outline-none focus:ring-0"
                      style={{ textAlign: getCellAlignment({ section: 'header', columnIndex: cIdx }) }}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={() => selectTableCell({ section: 'header', columnIndex: cIdx })}
                      />
                    {table.headers.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteColumn(cIdx);
                        }}
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-red-500 rounded px-1 opacity-0 group-hover/col:opacity-100 transition-opacity cursor-pointer text-[10px]"
                        data-tooltip="删除此列"
                      >
                        ✕
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row: string[], rIdx: number) => (
                <tr key={rIdx} className="border-b last:border-b-0 border-neutral-150 group/row">
                  {row.map((cell: string, cIdx: number) => (
                    <td key={cIdx} className="p-1.5 min-w-[80px] border-r last:border-r-0 border-neutral-150 relative h-8">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => updateBodyCell(rIdx, cIdx, e.target.value)}
                        className="nodrag w-full text-xs text-neutral-600 bg-transparent border-none p-0 focus:outline-none focus:ring-0"
                        style={{ textAlign: getCellAlignment({ section: 'body', rowIndex: rIdx, columnIndex: cIdx }) }}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={() => selectTableCell({ section: 'body', rowIndex: rIdx, columnIndex: cIdx })}
                      />
                      {cIdx === row.length - 1 && table.rows.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRow(rIdx);
                          }}
                          className="absolute right-1 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-red-500 rounded px-1 opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer text-[10px]"
                          data-tooltip="删除此行"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Column and row controls */}
        <div className="flex items-center gap-1.5 mt-2">
          <button
            onClick={addRow}
            className="flex items-center gap-1 text-[10px] font-semibold bg-neutral-50 hover:bg-neutral-100/90 border border-neutral-200 text-neutral-600 px-2.5 py-1 rounded shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-2.5 h-2.5" />
            <span>添加行</span>
          </button>
          <button
            onClick={addColumn}
            className="flex items-center gap-1 text-[10px] font-semibold bg-neutral-50 hover:bg-neutral-100/90 border border-neutral-200 text-neutral-600 px-2.5 py-1 rounded shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-2.5 h-2.5" />
            <span>添加列</span>
          </button>
        </div>
      </div>

      {/* Node Footer */}
      <div className="px-3 py-1 bg-neutral-50/10 border-t border-neutral-50 text-[10px] text-neutral-400 flex justify-between items-center select-none rounded-b-lg">
        <span>{data.status || '结构表格'}</span>
        <span>ID: {id.slice(0, 6)}</span>
      </div>
    </div>
  );
});

TableNode.displayName = 'TableNode';


