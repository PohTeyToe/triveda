/**
 * useCameraPermission -- manages camera permission state machine.
 *
 * Handles grant, deny, timeout, no-camera, and in-use states.
 * Cleans up the media stream on unmount.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraState =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'no_camera'
  | 'in_use'
  | 'error';

export type UseCameraPermissionReturn = {
  state: CameraState;
  stream: MediaStream | null;
  requestCamera: () => Promise<void>;
  stopCamera: () => void;
};

export function useCameraPermission(): UseCameraPermissionReturn {
  const [state, setState] = useState<CameraState>('idle');
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) {
        t.stop();
      }
      streamRef.current = null;
    }
    setState('idle');
  }, []);

  const requestCamera = useCallback(async () => {
    setState('requesting');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setState('no_camera');
      return;
    }

    try {
      const mediaPromise = navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });

      // Race against 10-second timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 10_000),
      );

      const stream = await Promise.race([mediaPromise, timeoutPromise]);
      streamRef.current = stream;
      setState('granted');
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setState('denied');
        } else if (err.name === 'NotFoundError') {
          setState('no_camera');
        } else if (err.name === 'NotReadableError') {
          setState('in_use');
        } else {
          setState('error');
        }
      } else {
        setState('error');
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        for (const t of streamRef.current.getTracks()) {
          t.stop();
        }
      }
    };
  }, []);

  return { state, stream: streamRef.current, requestCamera, stopCamera };
}
