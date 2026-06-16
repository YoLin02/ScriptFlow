import { Pipette, Palette } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { hexToHsv, hsvToHex, isValidHexColor, normalizeHexColor, resolveVisibleHueSelection } from './colorUtils';
import type { HsvColor } from './colorUtils';

interface ColorSwatchesProps {
  colors: string[];
  activeColor: string;
  onSelect: (color: string) => void;
}

type EyeDropperConstructor = new () => {
  open: () => Promise<{ sRGBHex: string }>;
};

type ColorSelectionMode = 'preset' | 'custom';

export default function ColorSwatches({ colors, activeColor, onSelect }: ColorSwatchesProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState<ColorSelectionMode>('preset');
  const [customColor, setCustomColor] = useState(() => normalizeHexColor(activeColor));
  const normalizedActiveColor = normalizeHexColor(activeColor);
  const isPresetColor = colors.some((color) => normalizeHexColor(color) === normalizedActiveColor);
  const pickerColor = selectionMode === 'custom' ? customColor : normalizedActiveColor;

  useEffect(() => {
    if (!isPresetColor) {
      setCustomColor(normalizedActiveColor);
      setSelectionMode('custom');
      return;
    }

    if (!isPickerOpen) {
      setSelectionMode('preset');
    }
  }, [isPickerOpen, isPresetColor, normalizedActiveColor]);

  const selectPresetColor = (color: string) => {
    setSelectionMode('preset');
    onSelect(color);
  };

  const selectCustomColor = (color: string) => {
    const normalizedColor = normalizeHexColor(color);
    setSelectionMode('custom');
    setCustomColor(normalizedColor);
    onSelect(normalizedColor);
  };

  useEffect(() => {
    if (!isPickerOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setIsPickerOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsPickerOpen(false);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPickerOpen]);

  return (
    <div ref={rootRef} className="relative flex items-center gap-1.5">
      {colors.map((color) => {
        const normalizedColor = normalizeHexColor(color);
        const isActive = selectionMode === 'preset' && normalizedColor === normalizedActiveColor;

        return (
          <button
            key={color}
            onClick={() => selectPresetColor(normalizedColor)}
            className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-all ${
              isActive ? 'bg-neutral-200 ring-1 ring-neutral-200' : 'bg-transparent hover:bg-neutral-50'
            }`}
            data-tooltip={normalizedColor}
          >
            <span
              className="h-[18px] w-[18px] rounded-full border border-transparent transition-transform"
              style={{ backgroundColor: normalizedColor }}
            />
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => setIsPickerOpen((value) => !value)}
        className={`ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors ${
          isPickerOpen || selectionMode === 'custom' ? 'bg-neutral-200 text-neutral-900' : 'text-neutral-300 hover:bg-neutral-50 hover:text-neutral-600'
        }`}
        data-tooltip="自定义颜色"
      >
        <Palette className="h-4 w-4" />
      </button>

      {isPickerOpen && (
        <CustomColorPicker
          color={pickerColor}
          onSelect={selectCustomColor}
          onActivateCustom={() => setSelectionMode('custom')}
        />
      )}
    </div>
  );
}

function CustomColorPicker({
  color,
  onSelect,
  onActivateCustom,
}: {
  color: string;
  onSelect: (color: string) => void;
  onActivateCustom: () => void;
}) {
  const colorAreaRef = useRef<HTMLDivElement>(null);
  const hueSliderRef = useRef<HTMLDivElement>(null);
  const [hsv, setHsv] = useState<HsvColor>(() => hexToHsv(color));
  const [draftHex, setDraftHex] = useState(color);
  const hsvRef = useRef(hsv);
  const latestHexRef = useRef(color);
  const visibleHex = useMemo(() => hsvToHex(hsv), [hsv]);
  const hueColor = hsvToHex({ h: hsv.h, s: 1, v: 1 });

  useEffect(() => {
    const nextHsv = hexToHsv(color);
    const currentHex = hsvToHex(hsvRef.current);
    setDraftHex(color);
    if (normalizeHexColor(color) !== normalizeHexColor(currentHex)) {
      hsvRef.current = nextHsv;
      setHsv(nextHsv);
    }
  }, [color]);

  const applyHsv = (nextHsv: HsvColor, commit = true) => {
    const nextHex = hsvToHex(nextHsv);
    hsvRef.current = nextHsv;
    latestHexRef.current = nextHex;
    setHsv(nextHsv);
    setDraftHex(nextHex);
    if (commit) onSelect(nextHex);
  };

  const updateFromColorArea = (clientX: number, clientY: number) => {
    const rect = colorAreaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const s = clamp((clientX - rect.left) / rect.width);
    const v = clamp(1 - (clientY - rect.top) / rect.height);
    applyHsv({ ...hsvRef.current, s, v });
  };

  const updateFromHueSlider = (clientX: number) => {
    const rect = hueSliderRef.current?.getBoundingClientRect();
    if (!rect) return;
    applyHsv(resolveVisibleHueSelection(
      hsvRef.current,
      Math.round(clamp((clientX - rect.left) / rect.width) * 360),
    ));
  };

  const beginDrag = (
    event: ReactPointerEvent<HTMLElement>,
    handler: (clientX: number, clientY: number) => void,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    onActivateCustom();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    handler(event.clientX, event.clientY);

    const onPointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      handler(moveEvent.clientX, moveEvent.clientY);
    };
    const onPointerUp = (upEvent: PointerEvent) => {
      upEvent.preventDefault();
      upEvent.stopPropagation();
      onSelect(latestHexRef.current);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleHexChange = (value: string) => {
    onActivateCustom();
    setDraftHex(value);
    if (!isValidHexColor(value)) return;
    const normalized = normalizeHexColor(value);
    const nextHsv = hexToHsv(normalized);
    hsvRef.current = nextHsv;
    latestHexRef.current = normalized;
    setHsv(nextHsv);
    onSelect(normalized);
  };

  const handlePickFromScreen = async () => {
    onActivateCustom();
    const EyeDropper = (window as Window & { EyeDropper?: EyeDropperConstructor }).EyeDropper;
    if (!EyeDropper) return;
    const result = await new EyeDropper().open();
    const nextHex = normalizeHexColor(result.sRGBHex);
    latestHexRef.current = nextHex;
    hsvRef.current = hexToHsv(nextHex);
    setHsv(hsvRef.current);
    setDraftHex(nextHex);
    onSelect(nextHex);
  };

  return (
    <div
      className="nodrag nopan absolute right-0 top-[calc(100%+8px)] z-50 w-[252px] rounded-xl border border-neutral-200 bg-white p-2.5 shadow-xl shadow-neutral-900/15"
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
    >
      <div
        ref={colorAreaRef}
          className="nodrag nopan relative h-32 cursor-crosshair overflow-hidden rounded-lg border border-neutral-200"
        style={{
          backgroundColor: hueColor,
          backgroundImage:
            'linear-gradient(to right, #ffffff, rgba(255,255,255,0)), linear-gradient(to top, #000000, rgba(0,0,0,0))',
        }}
        onPointerDown={(event) => beginDrag(event, updateFromColorArea)}
      >
        <span
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.55),0_2px_8px_rgba(0,0,0,0.22)]"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
        />
      </div>

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={handlePickFromScreen}
          disabled={!('EyeDropper' in window)}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-300"
          data-tooltip="吸取屏幕颜色"
        >
          <Pipette className="h-4 w-4" />
        </button>

        <div
          ref={hueSliderRef}
          className="nodrag nopan relative flex h-8 flex-1 cursor-ew-resize items-center"
          onPointerDown={(event) => beginDrag(event, (clientX) => updateFromHueSlider(clientX))}
        >
          <span
            className="h-2 w-full rounded-full"
            style={{
              background:
                'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
            }}
          />
          <span
            className="pointer-events-none absolute top-1/2 h-4 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-neutral-900 bg-white shadow-sm"
            style={{ left: `${(hsv.h / 360) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span
          className="h-8 w-8 rounded-lg border border-neutral-200"
          style={{ backgroundColor: visibleHex }}
        />
        <input
          value={draftHex}
          onChange={(event) => handleHexChange(event.target.value)}
          className="panel-input h-8 flex-1 font-mono uppercase"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}
