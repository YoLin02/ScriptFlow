import React, { memo, useContext, useEffect, useRef, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Clock, Plus, Trash2, X } from 'lucide-react';
import { NodeActionContext } from './NodeActionContext';
export interface TimelineTick {
  id: string;
  time: string;
  percent: number;
}

export interface TimelineTrackDataState {
  ticks: TimelineTick[];
  width: number;
  activeTickId: string | null;
  fontSize?: number;
}

export const TimelineNode = memo(({ id, data, selected }: { id: string; data: any; selected?: boolean }) => {
  const { onDeleteNode, onUpdateContent } = useContext(NodeActionContext);

  const getInitialTimeline = (): TimelineTrackDataState => {
    try {
      if (data.content && data.content.trim().startsWith('{')) {
        const parsed = JSON.parse(data.content);
        if (parsed.ticks && Array.isArray(parsed.ticks)) {
          return {
            ticks: parsed.ticks,
            width: parsed.width || 500,
            activeTickId: parsed.activeTickId || null,
            fontSize: parsed.fontSize || 12,
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse timeline content JSON', e);
    }
    // Default initial ticks
    return {
      ticks: [
        { id: 'tick-0', time: '00:00', percent: 10 },
        { id: 'tick-1', time: '10:00', percent: 50 },
        { id: 'tick-2', time: '20:00', percent: 90 },
      ],
      width: 750,
      activeTickId: null,
      fontSize: 12,
    };
  };

  const [state, setState] = useState<TimelineTrackDataState>(getInitialTimeline);
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

  // Sync state if outer representation changes safely
  useEffect(() => {
    try {
      if (data.content && data.content.trim().startsWith('{')) {
        const parsed = JSON.parse(data.content);
        if (parsed.ticks && Array.isArray(parsed.ticks)) {
          const contentTicksStr = JSON.stringify(parsed.ticks);
          const stateTicksStr = JSON.stringify(stateRef.current.ticks);
          const hasChanged = contentTicksStr !== stateTicksStr ||
            (parsed.width || 500) !== stateRef.current.width ||
            (parsed.activeTickId || null) !== stateRef.current.activeTickId ||
            (parsed.fontSize || 12) !== stateRef.current.fontSize;
          
          if (hasChanged) {
            setState({
              ticks: parsed.ticks,
              width: parsed.width || 500,
              activeTickId: parsed.activeTickId || null,
              fontSize: parsed.fontSize || 12,
            });
          }
        }
      }
    } catch (e) {}
  }, [data.content]);

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
      const updateFn = onUpdateContent || data.onUpdateContent;
      if (updateFn) {
        updateFn(id, JSON.stringify(nextState), `时间轴轨道`);
      }
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      element.releasePointerCapture(upEvent.pointerId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const saveStateToParent = (updatedState: TimelineTrackDataState) => {
    const updateFn = onUpdateContent || data.onUpdateContent;
    if (updateFn) {
      updateFn(id, JSON.stringify(updatedState), `时间轴轨道`);
    }
  };

  const getPopoverLeft = () => {
    const popoverHalfWidth = 165; // 330px / 2
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
    const deleteFn = onDeleteNode || data.onDeleteNode;
    if (deleteFn) {
      deleteFn(id);
    }
  };

  return (
    <div
      style={{ width: `${state.width}px` }}
      onClick={(e) => {
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
          return (
            <div
              key={tick.id}
              className="absolute flex flex-col items-center"
              style={{
                left: `${tick.percent}%`,
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
                  const pct = tick.percent;
                  const calculatedX = (pct / 100) * stateRef.current.width;
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
                {tick.time}
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
      <div className="relative w-full h-[8px] bg-neutral-900 rounded-full mt-2.5">
        {/* Right Pointer Arrowhead */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1.5 w-0 h-0 border-y-[8px] border-y-transparent border-l-[12px] border-l-neutral-900" />

        {/* Drag Resize Handle on right tip */}
        <div
          onPointerDown={handleResize}
          className="nodrag absolute right-0 top-1/2 -translate-y-1/2 translate-x-3.5 w-7 h-7 flex items-center justify-center cursor-ew-resize bg-white rounded-full border border-neutral-300 shadow-md text-neutral-600 hover:text-neutral-950 hover:border-neutral-600 transition-colors z-10"
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
          className="nodrag absolute top-[58px] bg-white border border-neutral-200 shadow-xl rounded-lg p-3.5 w-[330px] z-50 flex flex-col gap-3 text-left animate-in fade-in duration-150"
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
            {state.ticks.map((tick) => (
              <div key={tick.id} className="flex items-center gap-2 border-b border-neutral-50 pb-1.5 last:border-none last:pb-0">
                {/* Time Input */}
                <input
                  type="text"
                  value={tick.time}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const val = e.target.value;
                    const nextTicks = state.ticks.map((t) => (t.id === tick.id ? { ...t, time: val } : t));
                    const nextState = { ...state, ticks: nextTicks };
                    setState(nextState);
                    saveStateToParent(nextState);
                  }}
                  className="text-xs font-mono font-bold text-neutral-800 bg-neutral-50/80 hover:bg-neutral-100/60 border border-neutral-200 rounded px-2 py-0.5 w-16 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:bg-white"
                  placeholder="00:00"
                  title="标记时刻点"
                />
                {/* Micro slider */}
                <input
                  type="range"
                  min="2"
                  max="98"
                  value={tick.percent}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    const nextTicks = state.ticks.map((t) => (t.id === tick.id ? { ...t, percent: val } : t));
                    const nextState = { ...state, ticks: nextTicks };
                    setState(nextState);
                    saveStateToParent(nextState);
                  }}
                  className="flex-1 h-1 bg-neutral-100 rounded-lg appearance-none cursor-ew-resize accent-neutral-800 focus:outline-none"
                  title="调整百分比位置"
                />
                <span className="text-[10px] font-mono text-neutral-400 w-8 text-right">{tick.percent}%</span>
                {/* Single Tick Deletion */}
                <button
                  onClick={() => {
                    const nextTicks = state.ticks.filter((t) => t.id !== tick.id);
                    const nextActiveId = state.activeTickId === tick.id ? null : state.activeTickId;
                    const nextState = { ...state, ticks: nextTicks, activeTickId: nextActiveId };
                    setState(nextState);
                    saveStateToParent(nextState);
                  }}
                  disabled={state.ticks.length <= 1}
                  className="p-1 hover:bg-red-50 text-neutral-400 hover:text-red-500 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                  title="移除此时刻"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Controls Footer buttons */}
          <div className="flex items-center justify-between border-t border-neutral-100 pt-2 bg-neutral-25/10">
            <button
              onClick={() => {
                const nextId = `tick-${Date.now()}`;
                let lastPercent = 50;
                if (state.ticks.length > 0) {
                  lastPercent = state.ticks[state.ticks.length - 1].percent;
                }
                const nextPercent = Math.min(95, lastPercent + 15);
                
                // Formulate a logical default label based on last tick
                let nextLabel = '30:00';
                if (state.ticks.length > 0) {
                  const lastLabel = state.ticks[state.ticks.length - 1].time;
                  if (lastLabel.includes(':')) {
                    const secs = parseInt(lastLabel.split(':').pop() || '0', 10);
                    const mins = parseInt(lastLabel.split(':')[0] || '0', 10);
                    const totalSecs = mins * 60 + secs + 10;
                    const nextMins = Math.floor(totalSecs / 60);
                    const nextSecs = totalSecs % 60;
                    nextLabel = `${nextMins.toString().padStart(2, '0')}:${nextSecs.toString().padStart(2, '0')}`;
                  }
                }

                const nextTicks = [...state.ticks, { id: nextId, time: nextLabel, percent: nextPercent }];
                const nextState = { ...state, ticks: nextTicks };
                setState(nextState);
                saveStateToParent(nextState);
              }}
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

