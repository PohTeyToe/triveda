/**
 * FaceScanScreen -- full-page route component for the face scan pathway.
 *
 * Composes CameraPreview, CaptureAnimation, SimulatedBadge, and FaceScanResults.
 * The camera preview is cosmetic only -- the mock generator produces readings.
 */

import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { CameraPreview } from './CameraPreview';
import { CaptureAnimation } from './CaptureAnimation';
import { FaceScanResults } from './FaceScanResults';
import { SimulatedBadge } from './SimulatedBadge';
import { useCameraPermission } from './useCameraPermission';
import { useFaceScan } from './useFaceScan';

type FaceScanScreenProps = {
  userId: string;
};

export function FaceScanScreen({ userId }: FaceScanScreenProps) {
  const navigate = useNavigate();
  const camera = useCameraPermission();
  const scan = useFaceScan(userId);

  const handleBack = () => {
    camera.stopCamera();
    navigate({ to: '/' });
  };

  const handleSkip = () => {
    camera.stopCamera();
    navigate({ to: '/' });
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-6 px-4">
      {/* Top bar */}
      <div className="w-full max-w-md flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={handleBack}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <SimulatedBadge variant="capture" />
      </div>

      {/* Main content */}
      {scan.state === 'complete' && scan.reading ? (
        <div className="w-full flex flex-col items-center gap-6">
          <FaceScanResults reading={scan.reading} />
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={scan.retake}
              className="bg-gray-700 text-gray-300 rounded-lg px-6 py-2 text-sm hover:bg-gray-600 transition-colors"
            >
              Retake
            </button>
            <p className="text-gray-500 text-xs text-center">
              Results are stable within the hour. A new reading will be available next hour.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <CameraPreview
              cameraState={camera.state}
              stream={camera.stream}
              onRequestCamera={camera.requestCamera}
              onGenerateWithout={scan.generateWithoutCamera}
            />
            <CaptureAnimation
              isActive={scan.state === 'capturing'}
              onComplete={scan.onCaptureComplete}
            />
          </div>

          {/* Disclosure text */}
          <p className="text-gray-500 text-xs text-center max-w-xs">
            This is a simulated face scan. We are not analyzing your face. Real MediaPipe
            integration is planned.
          </p>

          {/* Action buttons */}
          <div className="flex gap-4">
            {camera.state === 'granted' && scan.state === 'idle' && (
              <button
                type="button"
                onClick={scan.startCapture}
                className="bg-teal-600 text-white rounded-lg px-6 py-2.5 font-medium hover:bg-teal-500 transition-colors"
              >
                Capture
              </button>
            )}
            {scan.state === 'idle' && (
              <button
                type="button"
                onClick={handleSkip}
                className="text-gray-400 underline text-sm hover:text-gray-300 transition-colors"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
