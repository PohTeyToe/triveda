/**
 * useFaceScan -- orchestrates capture -> mock generation -> state.
 *
 * Does NOT handle API calls. The screen component (FaceScanScreen)
 * handles uploading after the reading is generated.
 */

import { generateFaceScanReading } from '@triveda/shared/face-scan-mock';
import type { FaceScanReading } from '@triveda/shared/inputs';
import { useCallback, useState } from 'react';

type FaceScanState = 'idle' | 'capturing' | 'complete';

type UseFaceScanReturn = {
  state: FaceScanState;
  reading: FaceScanReading | null;
  startCapture: () => void;
  onCaptureComplete: () => void;
  generateWithoutCamera: () => void;
  retake: () => void;
};

export function useFaceScan(userId: string): UseFaceScanReturn {
  const [state, setState] = useState<FaceScanState>('idle');
  const [reading, setReading] = useState<FaceScanReading | null>(null);

  const startCapture = useCallback(() => {
    setState('capturing');
  }, []);

  const onCaptureComplete = useCallback(() => {
    const result = generateFaceScanReading(userId);
    setReading(result);
    setState('complete');
  }, [userId]);

  const generateWithoutCamera = useCallback(() => {
    const result = generateFaceScanReading(userId);
    setReading(result);
    setState('complete');
  }, [userId]);

  const retake = useCallback(() => {
    setReading(null);
    setState('idle');
  }, []);

  return {
    state,
    reading,
    startCapture,
    onCaptureComplete,
    generateWithoutCamera,
    retake,
  };
}
