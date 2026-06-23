import React, { memo, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { Clock, EyeOff, MousePointer2, Plus, X } from 'lucide-react';
import { NodeActionContext } from './NodeActionContext';
import type { TimelineCanvasNodeData, TimelineTrackDataValue } from '../../../types';
import { eventToShortcut, isShortcutEvent, normalizeShortcut } from '../../shortcuts';
export type { TimelineTick, TimelineTrackDataValue as TimelineTrackDataState } from '../../../types';

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
  const {
    onDeleteNode,
    onUpdateContent,
    onExitTimelineFocus,
    timelineFocusDisabledIds,
    selectedNodeCount = 0,
    shortcuts,
  } = useContext(NodeActionContext);
  const updateNodeInternals = useUpdateNodeInternals();
  const [state, setState] = useState<TimelineTrackDataValue>(() => getTimelineDataFromNode(data));
  const [isTimelineAddMode, setIsTimelineAddMode] = useState(false);
  const isFocusDisabled = timelineFocusDisabledIds?.has(id) ?? false;

  // Keep a ref of the current state so drag-and-resize events can access it safely without stale closures
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, state.ticks, state.width, updateNodeInternals]);

  useEffect(() => {
    const syncModifierState = (event: KeyboardEvent) => {
      setIsTimelineAddMode(event.ctrlKey && event.altKey);
    };
    const resetModifierState = () => setIsTimelineAddMode(false);

    window.addEventListener('keydown', syncModifierState);
    window.addEventListener('keyup', syncModifierState);
    window.addEventListener('blur', resetModifierState);
    return () => {
      window.removeEventListener('keydown', syncModifierState);
      window.removeEventListener('keyup', syncModifierState);
      window.removeEventListener('blur', resetModifierState);
    };
  }, []);

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
    const currentState = stateRef.current;
    const sortedTicks = normalizeTickOrder(currentState.ticks);
    const tickIndex = sortedTicks.findIndex((tick) => tick.id === tickId);
    if (tickIndex === -1) return;

    const minSeconds = tickIndex === 0 ? 0 : sortedTicks[tickIndex - 1].seconds + MIN_TICK_GAP_SECONDS;
    const maxSeconds = tickIndex === sortedTicks.length - 1
      ? Math.max(minSeconds, nextSeconds)
      : sortedTicks[tickIndex + 1].seconds - MIN_TICK_GAP_SECONDS;
    const clampedSeconds = Math.max(minSeconds, Math.min(maxSeconds, Math.round(nextSeconds)));
    const nextTicks = sortedTicks.map((tick) => tick.id === tickId ? { ...tick, seconds: clampedSeconds } : tick);
    const nextState = { ...currentState, ticks: normalizeTickOrder(nextTicks) };
    setState(nextState);
    saveStateToParent(nextState);
  };

  useEffect(() => {
    if (!state.activeTickId || !shortcuts) return;

    const handleTickShortcutKeyDown = (event: KeyboardEvent) => {
      const target = event.target as Element | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;

      const matchesTimelineShortcut = (binding: string) => {
        if (isShortcutEvent(event, binding)) return true;
        if (!event.shiftKey) return false;
        return eventToShortcut(event).replace('Shift+', '') === normalizeShortcut(binding);
      };

      const isMoveLeft = matchesTimelineShortcut(shortcuts['timeline.moveActiveTickLeft']);
      const isMoveRight = matchesTimelineShortcut(shortcuts['timeline.moveActiveTickRight']);
      if (!isMoveLeft && !isMoveRight) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const sortedTicks = normalizeTickOrder(stateRef.current.ticks);
      const activeIndex = sortedTicks.findIndex((tick) => tick.id === stateRef.current.activeTickId);
      if (activeIndex <= 0 || activeIndex >= sortedTicks.length - 1) return;

      const activeTick = sortedTicks[activeIndex];
      const stepSeconds = event.shiftKey ? 10 : 1;
      updateTickSeconds(activeTick.id, activeTick.seconds + (isMoveLeft ? -stepSeconds : stepSeconds));
    };

    window.addEventListener('keydown', handleTickShortcutKeyDown, true);
    return () => window.removeEventListener('keydown', handleTickShortcutKeyDown, true);
  }, [shortcuts, state.activeTickId]);

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

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteNode?.(id);
  };

  const managerContent = (
    <>
      <div className="flex items-center justify-between border-b border-neutral-100 px-1 pb-3">
        <span className="flex items-center gap-2 text-sm font-bold text-neutral-950">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
            <Clock className="h-4 w-4" />
          </span>
          <span>轨道管理器</span>
        </span>
        <div className="flex items-center gap-1.5">
          {selectedNodeCount > 1 && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onExitTimelineFocus?.(id, true);
              }}
              className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg px-2 text-[11px] font-bold text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
              data-tooltip="隐藏轨道管理器，保留轨道批量选中"
              data-tooltip-placement="bottom"
            >
              <EyeOff className="h-3.5 w-3.5" />
              退出聚焦
            </button>
          )}
          {selectedNodeCount > 1 && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onExitTimelineFocus?.(id, false);
              }}
              className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg px-2 text-[11px] font-bold text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
              data-tooltip="取消选中轨道，仅保留其他批量节点"
              data-tooltip-placement="bottom"
            >
              <MousePointer2 className="h-3.5 w-3.5" />
              移出批量
            </button>
          )}
          <button
            onClick={onDelete}
            className="h-8 cursor-pointer px-1 text-[12px] font-bold text-red-600 transition-colors hover:text-red-700"
            data-tooltip="删除轨道"
            data-tooltip-placement="bottom"
          >
            删除
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-1.5">
        <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5 shadow-xs">
          <span className="whitespace-nowrap text-[10px] font-medium text-neutral-400">上方字号</span>
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
            className="h-1 min-w-0 flex-1 cursor-ew-resize appearance-none rounded-lg bg-neutral-100 accent-neutral-900 focus:outline-none"
            data-tooltip="调节上方时刻标签字体大小"
            data-tooltip-placement="bottom"
          />
          <span className="w-7 text-right font-sans text-xs font-bold tabular-nums text-neutral-900">{state.fontSize || 12}px</span>
        </div>
      </div>

      <div
        className="space-y-1 overflow-y-auto overflow-x-hidden pr-0.5"
        style={{
          maxHeight: `${Math.min(state.ticks.length, 6) * 36 + Math.max(0, Math.min(state.ticks.length, 6) - 1) * 4}px`,
        }}
      >
        {state.ticks.map((tick, index) => {
          const hours = Math.floor(tick.seconds / 3600);
          const minutes = Math.floor((tick.seconds % 3600) / 60);
          const seconds = tick.seconds % 60;
          const percent = getTickPercent(tick.seconds, state.ticks);
          const isBoundaryTick = index === 0 || index === state.ticks.length - 1;

          return (
            <div key={tick.id} className="grid grid-cols-[auto_minmax(42px,1fr)_28px_18px] items-center gap-1.5 rounded-xl border border-transparent bg-white px-1 py-1 transition-colors hover:border-neutral-100 hover:bg-neutral-50">
              <div className="flex items-center gap-0.5">
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
                  className="timeline-time-input h-7 w-8 rounded-lg border border-neutral-200 bg-neutral-50/80 px-1 text-center font-sans text-xs font-bold tabular-nums text-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-400"
                  aria-label="小时"
                />
                <span className="font-sans text-xs font-bold text-neutral-300">:</span>
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
                  className="timeline-time-input h-7 w-8 rounded-lg border border-neutral-200 bg-neutral-50/80 px-1 text-center font-sans text-xs font-bold tabular-nums text-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-400"
                  aria-label="分钟"
                />
                <span className="font-sans text-xs font-bold text-neutral-300">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const nextSeconds = Math.max(0, Math.min(59, Number.parseInt(e.target.value || '0', 10)));
                    updateTickSeconds(tick.id, hours * 3600 + minutes * 60 + nextSeconds);
                  }}
                  className="timeline-time-input h-7 w-8 rounded-lg border border-neutral-200 bg-neutral-50/80 px-1 text-center font-sans text-xs font-bold tabular-nums text-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-400"
                  aria-label="秒"
                />
              </div>
              <div className="h-1.5 min-w-0 overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full bg-neutral-800" style={{ width: `${percent}%` }} />
              </div>
              <span className="text-right font-sans text-[10px] font-bold tabular-nums text-neutral-400">{Math.round(percent)}%</span>
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
                className="rounded-lg p-1 text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-transparent"
                data-tooltip={isBoundaryTick ? '头尾边界不可删除' : '移除此时刻'}
                data-tooltip-placement="bottom"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-neutral-100 px-1 pt-2">
        <button
          onClick={addTickInLargestGap}
          className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-neutral-950 px-3 text-[11px] font-bold text-white shadow-xs transition-all hover:bg-neutral-800"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>添加时刻</span>
        </button>
      </div>
    </>
  );

  return (
    <div
      style={{ width: `${state.width}px` }}
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
                zIndex: isActive ? 40 : 10,
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
                }}
                className={`nodrag font-sans font-bold tabular-nums px-2.5 py-0.5 rounded border shadow-xs transition-all cursor-pointer ${
                  isActive
                    ? 'text-white bg-neutral-950 border-neutral-950 scale-105 shadow-sm'
                    : 'text-neutral-700 bg-white hover:bg-neutral-50 hover:border-neutral-300 border-neutral-200'
                }`}
                style={{
                  fontSize: `${state.fontSize || 12}px`,
                  lineHeight: '1.2'
                }}
                data-tooltip="显示对应卡片连线"
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
                  width: '13px',
                  height: '13px',
                  backgroundColor: '#ffffff',
                  border: '2.5px solid #171717',
                  borderRadius: '50%',
                  cursor: 'crosshair',
                  transform: 'translateX(-50%) scale(1.15)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                }}
                aria-label="点击时间镜头显示对应卡片连线"
              />
            </div>
          );
        })}
      </div>

      {/* 2. MAIN HORIZONTAL TRACK RAIL LINE */}
      <div
        className="relative w-full h-[8px] bg-neutral-900 rounded-full mt-2.5"
        data-tooltip=" Ctrl + Alt 新增时间点"
      >
        <div
          className={`absolute inset-x-0 -top-4 -bottom-4 z-10 ${isTimelineAddMode ? 'pointer-events-auto cursor-copy' : 'pointer-events-none'}`}
          onClick={handleRailClick}
        />

        {/* Right Pointer Arrowhead */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1.5 w-0 h-0 border-y-[8px] border-y-transparent border-l-[12px] border-l-neutral-900" />

        {/* Drag Resize Handle on right tip */}
          <div
            onPointerDown={handleResize}
            className="nodrag absolute -right-12 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center cursor-ew-resize bg-white rounded-full border border-neutral-300 shadow-md text-neutral-600 hover:text-neutral-950 hover:border-neutral-600 transition-colors z-20"
            data-tooltip="调整轨道长度"
          >
          <span className="text-[11px] font-bold">↔</span>
        </div>
      </div>

      {selected && !isFocusDisabled && createPortal(
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="fixed right-4 top-24 z-[9000] flex w-[320px] max-w-[calc(100vw-2rem)] flex-col gap-2.5 overflow-x-hidden rounded-2xl border border-neutral-200/80 bg-white/95 p-2.5 text-left shadow-2xl shadow-neutral-900/10 backdrop-blur-md animate-in fade-in slide-in-from-right-2 duration-150"
        >
          {managerContent}
        </div>,
        document.body,
      )}
    </div>
  );
});

TimelineNode.displayName = 'TimelineNode';
