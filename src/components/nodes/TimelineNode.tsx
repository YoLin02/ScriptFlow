import React, { memo, useContext, useEffect, useRef, useState } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { Clock, Plus, Trash2, X } from 'lucide-react';
import { NodeActionContext } from './NodeActionContext';
import type { TimelineCanvasNodeData, TimelineTrackDataValue } from '../../types';
export type { TimelineTick, TimelineTrackDataValue as TimelineTrackDataState } from '../../types';

const DEFAULT_TIMELINE_DATA: TimelineTrackDataValue = {
  ticks: [
    { id: 'tick-0', seconds: 0 },
    { id: 'tick-1', seconds: 600 },
    { id: 'tick-2', seconds: 1200 },
  ],
  width: 750,
  activeTickId: null,
  fontSize: 12,
};

const MIN_TICK_GAP_SECONDS = 1;

function parseTimeToSeconds(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(':').map((part) => Number.parseInt(part, 10));
  if (parts.some((part) => Number.isNaN(part))) return null;
  if (parts.length === 1) return Math.max(0, parts[0]);
  if (parts.length === 2) {
    const minutes = parts[0] || 0;
    const seconds = Math.max(0, Math.min(59, parts[1] || 0));
    return Math.max(0, minutes * 60 + seconds);
  }
  const hours = parts[0] || 0;
  const minutes = Math.max(0, Math.min(59, parts[1] || 0));
  const seconds = Math.max(0, Math.min(59, parts[2] || 0));
  return Math.max(0, hours * 3600 + minutes * 60 + seconds);
}

function formatSecondsToTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function getTickSeconds(tick: { seconds?: unknown; time?: unknown }, index: number) {
  if (typeof tick.seconds === 'number' && Number.isFinite(tick.seconds)) {
    return Math.max(0, Math.round(tick.seconds));
  }
  return parseTimeToSeconds(tick.time) ?? index * 600;
}

function normalizeTickOrder(ticks: TimelineTrackDataValue['ticks']) {
  return [...ticks].sort((a, b) => a.seconds - b.seconds);
}

function getTickPercent(tickSeconds: number, ticks: TimelineTrackDataValue['ticks']) {
  if (ticks.length <= 1) return 0;
  const startSeconds = ticks[0].seconds;
  const endSeconds = ticks[ticks.length - 1].seconds;
  const duration = endSeconds - startSeconds;
  if (duration <= 0) return 0;
  return Math.max(0, Math.min(100, ((tickSeconds - startSeconds) / duration) * 100));
}

function normalizeTimelineData(value: unknown): TimelineTrackDataValue | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<TimelineTrackDataValue>;
  if (!Array.isArray(candidate.ticks)) return null;
  const ticks = normalizeTickOrder(candidate.ticks.map((tick, index) => ({
    id: String(tick.id || `tick-${index}`),
    seconds: getTickSeconds(tick, index),
  })));

  return {
    ticks: ticks.length >= 2 ? ticks : DEFAULT_TIMELINE_DATA.ticks,
    width: typeof candidate.width === 'number' ? candidate.width : 750,
    activeTickId: candidate.activeTickId ? String(candidate.activeTickId) : null,
    fontSize: typeof candidate.fontSize === 'number' ? candidate.fontSize : 12,
  };
}

function getTimelineDataFromNode(data: TimelineCanvasNodeData): TimelineTrackDataValue {
  const structured = normalizeTimelineData(data.timelineData);
  if (structured) return structured;

  try {
    if (data.content && data.content.trim().startsWith('{')) {
      const legacy = normalizeTimelineData(JSON.parse(data.content));
      if (legacy) return legacy;
    }
  } catch (e) {
    console.warn('Failed to parse timeline content JSON', e);
  }

  return DEFAULT_TIMELINE_DATA;
}

export const TimelineNode = memo(({ id, data, selected }: { id: string; data: TimelineCanvasNodeData; selected?: boolean }) => {
  const { onDeleteNode, onUpdateContent } = useContext(NodeActionContext);
  const updateNodeInternals = useUpdateNodeInternals();
  const [state, setState] = useState<TimelineTrackDataValue>(() => getTimelineDataFromNode(data));
  const [clickX, setClickX] = useState<number | null>(null);

  // Reset click offset when node is deselected
  useEffect(() => {
    if (!selected) {
      setClickX(null);
    }
  }, [selected]);

  // Keep a ref of the current state so drag-and-resize events can access it safely without stale closures
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, state.ticks, state.width, updateNodeInternals]);

  // Sync state if outer representation changes safely
  useEffect(() => {
    const nextState = getTimelineDataFromNode(data);
    if (JSON.stringify(nextState) !== JSON.stringify(stateRef.current)) {
      setState(nextState);
    }
  }, [data.timelineData, data.content]);

  // Handle pointer-based multi-device drag to resize width
  const handleResize = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = stateRef.current.width;
    const element = e.currentTarget as HTMLElement;
    element.setPointerCapture(e.pointerId);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      // Step size of 10px spacing
      const nextWidth = Math.max(300, Math.min(3000, Math.round((startWidth + deltaX) / 10) * 10));
      const nextState = { ...stateRef.current, width: nextWidth };
      
      setState(nextState);
      onUpdateContent?.(id, '', `时间轴轨道`, undefined, undefined, { timelineData: nextState });
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      element.releasePointerCapture(upEvent.pointerId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const saveStateToParent = (updatedState: TimelineTrackDataValue) => {
    onUpdateContent?.(id, '', `时间轴轨道`, undefined, undefined, {
      timelineData: {
        ...updatedState,
        ticks: normalizeTickOrder(updatedState.ticks),
      },
    });
  };

  const updateTickSeconds = (tickId: string, nextSeconds: number) => {
    const sortedTicks = normalizeTickOrder(state.ticks);
    const tickIndex = sortedTicks.findIndex((tick) => tick.id === tickId);
    if (tickIndex === -1) return;

    const minSeconds = tickIndex === 0 ? 0 : sortedTicks[tickIndex - 1].seconds + MIN_TICK_GAP_SECONDS;
    const maxSeconds = tickIndex === sortedTicks.length - 1
      ? Math.max(minSeconds, nextSeconds)
      : sortedTicks[tickIndex + 1].seconds - MIN_TICK_GAP_SECONDS;
    const clampedSeconds = Math.max(minSeconds, Math.min(maxSeconds, Math.round(nextSeconds)));
    const nextTicks = sortedTicks.map((tick) => tick.id === tickId ? { ...tick, seconds: clampedSeconds } : tick);
    const nextState = { ...state, ticks: normalizeTickOrder(nextTicks) };
    setState(nextState);
    saveStateToParent(nextState);
  };

  const addTickInLargestGap = () => {
    const sortedTicks = normalizeTickOrder(state.ticks);
    if (sortedTicks.length < 2) return;

    let gapStartIndex = 0;
    let maxGap = -1;
    for (let index = 0; index < sortedTicks.length - 1; index += 1) {
      const gap = sortedTicks[index + 1].seconds - sortedTicks[index].seconds;
      if (gap > maxGap) {
        maxGap = gap;
        gapStartIndex = index;
      }
    }

    if (maxGap <= MIN_TICK_GAP_SECONDS) return;
    const nextSeconds = Math.round((sortedTicks[gapStartIndex].seconds + sortedTicks[gapStartIndex + 1].seconds) / 2);
    const nextTicks = normalizeTickOrder([
      ...sortedTicks,
      { id: `tick-${Date.now()}`, seconds: nextSeconds },
    ]);
    const nextState = { ...state, ticks: nextTicks };
    setState(nextState);
    saveStateToParent(nextState);
  };

  const addTickAtSeconds = (targetSeconds: number) => {
    const sortedTicks = normalizeTickOrder(stateRef.current.ticks);
    if (sortedTicks.length < 2) return;

    const startSeconds = sortedTicks[0].seconds;
    const endSeconds = sortedTicks[sortedTicks.length - 1].seconds;
    if (endSeconds - startSeconds <= MIN_TICK_GAP_SECONDS * 2) return;

    const clampedSeconds = Math.max(
      startSeconds + MIN_TICK_GAP_SECONDS,
      Math.min(endSeconds - MIN_TICK_GAP_SECONDS, Math.round(targetSeconds)),
    );
    const hasNearbyTick = sortedTicks.some((tick) => Math.abs(tick.seconds - clampedSeconds) < MIN_TICK_GAP_SECONDS);
    if (hasNearbyTick) return;

    const nextTick = { id: `tick-${Date.now()}`, seconds: clampedSeconds };
    const nextState = { ...stateRef.current, ticks: normalizeTickOrder([...sortedTicks, nextTick]), activeTickId: nextTick.id };
    setState(nextState);
    saveStateToParent(nextState);
  };

  const handleRailClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!e.ctrlKey || !e.altKey) return;
    e.preventDefault();
    e.stopPropagation();

    const sortedTicks = normalizeTickOrder(stateRef.current.ticks);
    if (sortedTicks.length < 2) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPercent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const startSeconds = sortedTicks[0].seconds;
    const endSeconds = sortedTicks[sortedTicks.length - 1].seconds;
    addTickAtSeconds(startSeconds + (endSeconds - startSeconds) * clickPercent);
  };

  const getPopoverLeft = () => {
    const popoverHalfWidth = 190; // 380px / 2
    const currentWidth = state.width || 750;
    if (clickX === null) {
      return '50%';
    }
    const minLeft = Math.min(popoverHalfWidth, currentWidth / 2);
    const maxLeft = Math.max(currentWidth - popoverHalfWidth, currentWidth / 2);
    const clamped = Math.max(minLeft, Math.min(maxLeft, clickX));
    return `${clamped}px`;
  };

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteNode?.(id);
  };

  return (
    <div
      style={{ width: `${state.width}px` }}
      onClick={(e) => {
        if (e.ctrlKey && e.altKey) {
          return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        setClickX(x);
      }}
      className={`relative py-4 flex flex-col justify-end min-h-[50px] transition-all select-none ${
        selected ? 'z-50' : ''
      }`}
    >
      {/* 1. TIMELINE TICK LABELS & TICKS LAYER */}
      <div className="relative h-10 w-full">
        {state.ticks.map((tick) => {
          const isActive = state.activeTickId === tick.id;
          const tickPercent = getTickPercent(tick.seconds, state.ticks);
          return (
            <div
              key={tick.id}
              className="absolute flex flex-col items-center"
              style={{
                left: `${tickPercent}%`,
                transform: 'translateX(-50%)',
                bottom: '0px',
              }}
            >
              {/* Timestamp text */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const nextActive = state.activeTickId === tick.id ? null : tick.id;
                  const nextState = { ...state, activeTickId: nextActive };
                  setState(nextState);
                  saveStateToParent(nextState);

                  // Set popover pointer to the selected tick
                  const calculatedX = (tickPercent / 100) * stateRef.current.width;
                  setClickX(calculatedX);
                }}
                className={`nodrag font-semibold font-mono px-2.5 py-0.5 rounded border shadow-xs transition-all cursor-pointer ${
                  isActive
                    ? 'text-white bg-neutral-950 border-neutral-950 scale-105 shadow-sm'
                    : 'text-neutral-700 bg-white hover:bg-neutral-50 hover:border-neutral-300 border-neutral-200'
                }`}
                style={{
                  fontSize: `${state.fontSize || 12}px`,
                  lineHeight: '1.2'
                }}
                title="选择并高亮该镜头对应的所有卡片连线"
              >
                {formatSecondsToTime(tick.seconds)}
              </button>

              {/* Vertical Tick Mark line */}
              <div className="w-[2px] h-2.5 bg-neutral-400 mt-1" />

              {/* Source handle under tick mark on the rail */}
              <Handle
                type="source"
                position={Position.Bottom}
                id={tick.id}
                style={{
                  bottom: '-5px',
                  width: '11px',
                  height: '11px',
                  backgroundColor: '#ffffff',
                  border: '2.5px solid #171717',
                  borderRadius: '50%',
                  cursor: 'crosshair',
                  transform: 'translateX(-50%) scale(1.15)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                }}
                title="按住此处拉去镜头对应内容卡片连线"
              />
            </div>
          );
        })}
      </div>

      {/* 2. MAIN HORIZONTAL RED TRACK RAIL LINE */}
        <div
          className="relative w-full h-[8px] bg-neutral-900 rounded-full mt-2.5"
          onClick={handleRailClick}
          title="按住 Ctrl + Alt 点击轨道可新增时间点"
        >
        {/* Right Pointer Arrowhead */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1.5 w-0 h-0 border-y-[8px] border-y-transparent border-l-[12px] border-l-neutral-900" />

        {/* Drag Resize Handle on right tip */}
          <div
            onPointerDown={handleResize}
            className="nodrag absolute -right-12 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center cursor-ew-resize bg-white rounded-full border border-neutral-300 shadow-md text-neutral-600 hover:text-neutral-950 hover:border-neutral-600 transition-colors z-20"
            title="左右拖拽拉伸轨道长度"
          >
          <span className="text-[11px] font-bold">↔</span>
        </div>
      </div>

      {/* 3. DROPDOWN TICK MANAGER CONTROLLER (Only displayed when selected/active) */}
      {selected && (
        <div 
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{
            left: getPopoverLeft(),
            transform: 'translateX(-50%)',
          }}
          className="nodrag absolute top-[92px] bg-white border border-neutral-200 shadow-xl rounded-lg p-3.5 w-[380px] z-50 flex flex-col gap-3 text-left animate-in fade-in duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <span className="font-bold text-[11px] text-neutral-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-neutral-600" />
              <span>轨道时刻管理器</span>
            </span>
            <button
              onClick={onDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50/50 border border-red-100/40 bg-white px-2 py-1 rounded text-[10px] font-medium transition-all cursor-pointer flex items-center gap-1"
              title="删除此时间线轨道"
            >
              <Trash2 className="w-3 h-3" />
              <span>删除轨道</span>
            </button>
          </div>

          {/* Width & Font Size info Row */}
          <div className="flex items-center justify-between text-[10px] text-neutral-500 gap-2 border-b border-neutral-100 pb-2">
            <span>当前宽度: <span className="font-mono font-bold text-neutral-800">{state.width}px</span></span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-neutral-400">上方字号:</span>
              <input
                type="range"
                min="10"
                max="24"
                value={state.fontSize || 12}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const size = parseInt(e.target.value, 10);
                  const nextState = { ...state, fontSize: size };
                  setState(nextState);
                  saveStateToParent(nextState);
                }}
                className="w-14 h-1 bg-neutral-100 rounded-lg appearance-none cursor-ew-resize accent-neutral-800 focus:outline-none"
                title="调节上方时刻标签字体大小"
              />
              <span className="font-mono font-bold text-neutral-800 w-5 text-right">{state.fontSize || 12}px</span>
            </div>
          </div>

          {/* Timestamp items list */}
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
            {state.ticks.map((tick, index) => {
              const hours = Math.floor(tick.seconds / 3600);
              const minutes = Math.floor((tick.seconds % 3600) / 60);
              const seconds = tick.seconds % 60;
              const percent = getTickPercent(tick.seconds, state.ticks);
              const isBoundaryTick = index === 0 || index === state.ticks.length - 1;

              return (
              <div key={tick.id} className="flex items-center gap-2 border-b border-neutral-50 pb-1.5 last:border-none last:pb-0">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    value={hours}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const nextHours = Math.max(0, Number.parseInt(e.target.value || '0', 10));
                      updateTickSeconds(tick.id, nextHours * 3600 + minutes * 60 + seconds);
                    }}
                    className="timeline-time-input text-xs font-mono font-bold text-neutral-800 bg-neutral-50/80 hover:bg-neutral-100/60 border border-neutral-200 rounded px-1.5 py-0.5 w-11 text-center focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:bg-white"
                    title="小时"
                  />
                  <span className="text-xs font-mono font-bold text-neutral-400">:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const nextMinutes = Math.max(0, Math.min(59, Number.parseInt(e.target.value || '0', 10)));
                      updateTickSeconds(tick.id, hours * 3600 + nextMinutes * 60 + seconds);
                    }}
                    className="timeline-time-input text-xs font-mono font-bold text-neutral-800 bg-neutral-50/80 hover:bg-neutral-100/60 border border-neutral-200 rounded px-1.5 py-0.5 w-11 text-center focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:bg-white"
                    title="分钟"
                  />
                  <span className="text-xs font-mono font-bold text-neutral-400">:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={seconds}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const nextSeconds = Math.max(0, Math.min(59, Number.parseInt(e.target.value || '0', 10)));
                      updateTickSeconds(tick.id, minutes * 60 + nextSeconds);
                    }}
                    className="timeline-time-input text-xs font-mono font-bold text-neutral-800 bg-neutral-50/80 hover:bg-neutral-100/60 border border-neutral-200 rounded px-1.5 py-0.5 w-12 text-center focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:bg-white"
                    title="秒"
                  />
                </div>
                <div className="w-24 h-1 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full bg-neutral-800" style={{ width: `${percent}%` }} />
                </div>
                <span className="text-[10px] font-mono text-neutral-400 w-8 text-right">{Math.round(percent)}%</span>
                {/* Single Tick Deletion */}
                <button
                  onClick={() => {
                    if (state.ticks.length <= 2 || isBoundaryTick) return;
                    const nextTicks = normalizeTickOrder(state.ticks.filter((t) => t.id !== tick.id));
                    const nextActiveId = state.activeTickId === tick.id ? null : state.activeTickId;
                    const nextState = { ...state, ticks: nextTicks, activeTickId: nextActiveId };
                    setState(nextState);
                    saveStateToParent(nextState);
                  }}
                  disabled={state.ticks.length <= 2 || isBoundaryTick}
                  className="p-1 hover:bg-red-50 text-neutral-400 hover:text-red-500 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                  title={isBoundaryTick ? '头尾边界不可删除' : '移除此时刻'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
            })}
          </div>

          {/* Controls Footer buttons */}
          <div className="flex items-center justify-between border-t border-neutral-100 pt-2 bg-neutral-25/10">
            <button
              onClick={addTickInLargestGap}
              className="inline-flex items-center gap-1 text-[10px] font-bold bg-neutral-900 hover:bg-neutral-800 text-white px-2.5 py-1.5 rounded-md transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3 h-3" />
              <span>添加刻度时刻</span>
            </button>
            <span className="text-[9px] text-neutral-400 font-mono">点击时刻点高亮对应卡片</span>
          </div>
        </div>
      )}
    </div>
  );
});

TimelineNode.displayName = 'TimelineNode';

