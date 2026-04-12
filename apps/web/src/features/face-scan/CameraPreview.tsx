/**
 * CameraPreview -- renders camera feed or fallback based on permission state.
 *
 * The camera preview is cosmetic only. We never process the video feed.
 * The mock generator runs independently.
 */

import { AlertTriangle, Camera, CameraOff, Loader2, Lock } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { CameraState } from './useCameraPermission';

type CameraPreviewProps = {
  cameraState: CameraState;
  stream: MediaStream | null;
  onRequestCamera: () => void;
  onGenerateWithout: () => void;
};

function PlaceholderCircle({
  icon,
  text,
  onClick,
}: {
  icon: React.ReactNode;
  text: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-gray-800 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-teal-500 transition-colors"
    >
      {icon}
      <p className="text-gray-400 text-sm text-center px-4">{text}</p>
    </button>
  );
}

export function CameraPreview({
  cameraState,
  stream,
  onRequestCamera,
  onGenerateWithout,
}: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // playsInline is critical for iOS Safari (prevents fullscreen autoplay)
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="flex flex-col items-center gap-4">
      {cameraState === 'idle' && (
        <PlaceholderCircle
          icon={<Camera className="w-12 h-12 text-gray-500" />}
          text="Tap to start your face scan"
          onClick={onRequestCamera}
        />
      )}

      {cameraState === 'requesting' && (
        <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
        </div>
      )}

      {cameraState === 'granted' && (
        <div className="w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden relative">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          {/* Circular reticle border */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-teal-500 pointer-events-none" />
        </div>
      )}

      {cameraState === 'denied' && (
        <PlaceholderCircle
          icon={<Lock className="w-12 h-12 text-gray-500" />}
          text="Camera access denied. You can still generate a simulated reading below."
        />
      )}

      {cameraState === 'no_camera' && (
        <PlaceholderCircle
          icon={<CameraOff className="w-12 h-12 text-gray-500" />}
          text="No camera detected."
        />
      )}

      {cameraState === 'in_use' && (
        <PlaceholderCircle
          icon={<AlertTriangle className="w-12 h-12 text-gray-500" />}
          text="Camera is in use by another application."
        />
      )}

      {cameraState === 'error' && (
        <PlaceholderCircle
          icon={<AlertTriangle className="w-12 h-12 text-gray-500" />}
          text="Unable to access camera."
        />
      )}

      {/* Show fallback button for all non-granted states except idle and requesting */}
      {cameraState !== 'idle' && cameraState !== 'requesting' && cameraState !== 'granted' && (
        <button
          type="button"
          onClick={onGenerateWithout}
          className="text-teal-400 underline text-sm hover:text-teal-300 transition-colors"
        >
          Generate reading without camera
        </button>
      )}
    </div>
  );
}
