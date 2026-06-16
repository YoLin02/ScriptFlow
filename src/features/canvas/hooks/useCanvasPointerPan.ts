import { useCallback, useRef, useState } from 'react';

export function useCanvasPointerPan() {
  const [isPanningByPointer, setIsPanningByPointer] = useState(false);
  const rightPointerRef = useRef({ active: false, startX: 0, startY: 0, moved: false });

  const beginPointerPan = useCallback((clientX: number, clientY: number) => {
    rightPointerRef.current = { active: true, startX: clientX, startY: clientY, moved: false };
    setIsPanningByPointer(true);
  }, []);

  const updatePointerPan = useCallback((clientX: number, clientY: number) => {
    const pointerState = rightPointerRef.current;
    if (!pointerState.active) return;

    const distance = Math.hypot(clientX - pointerState.startX, clientY - pointerState.startY);
    if (distance > 6) {
      pointerState.moved = true;
    }
  }, []);

  const endPointerPan = useCallback(() => {
    setIsPanningByPointer(false);
  }, []);

  const resetPointerPan = useCallback(() => {
    rightPointerRef.current = { active: false, startX: 0, startY: 0, moved: false };
    setIsPanningByPointer(false);
  }, []);

  return {
    isPanningByPointer,
    rightPointerRef,
    beginPointerPan,
    updatePointerPan,
    endPointerPan,
    resetPointerPan,
  };
}
