/**
 * FaceScanScreen -- photo-upload variant of face scan.
 *
 * Lets the user upload or capture a photo and then runs the simulated
 * face scan generator. Results are framed through three tradition
 * perspectives (Ayurveda, TCM, Naturopathy).
 *
 * Photos are previewed in the browser only and are NOT uploaded --
 * only the simulated reading payload is POSTed to /api/v1/face-scan.
 */

import { generateFaceScanReading } from '@triveda/shared/face-scan-mock';
import type { FaceScanReading } from '@triveda/shared/inputs';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Loader2, Sparkles, Upload, X } from 'lucide-react';
import { type ChangeEvent, type DragEvent, useCallback, useRef, useState } from 'react';
import { apiFetch } from '../../lib/api-client';

type FaceScanScreenProps = {
  userId: string;
};

type ScanState = 'idle' | 'previewing' | 'processing' | 'complete' | 'error';

type TraditionPerspective = {
  tradition: 'Ayurveda' | 'TCM' | 'Naturopathy';
  headline: string;
  body: string;
  accent: string;
};

function buildPerspectives(reading: FaceScanReading): TraditionPerspective[] {
  // Dominant dosha shift
  const doshaShifts: Array<{ name: string; delta: number }> = [
    { name: 'Vata', delta: reading.vata_delta },
    { name: 'Pitta', delta: reading.pitta_delta },
    { name: 'Kapha', delta: reading.kapha_delta },
  ];
  const topDosha = [...doshaShifts].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0] ?? {
    name: 'Vata',
    delta: 0,
  };
  const direction = topDosha.delta >= 0 ? 'elevated' : 'softened';

  // Dominant element
  const elements: Array<{ name: string; value: number }> = [
    { name: 'Wood', value: reading.wood_hint },
    { name: 'Fire', value: reading.fire_hint },
    { name: 'Earth', value: reading.earth_hint },
    { name: 'Metal', value: reading.metal_hint },
    { name: 'Water', value: reading.water_hint },
  ];
  const topElement = [...elements].sort((a, b) => b.value - a.value)[0] ?? {
    name: 'Earth',
    value: 0.5,
  };

  // Stress band
  const stress = reading.stress_level;
  const stressLabel = stress < 0.33 ? 'low' : stress < 0.66 ? 'moderate' : 'elevated';

  return [
    {
      tradition: 'Ayurveda',
      headline: `${topDosha.name} appears ${direction} today`,
      body: `Your skin tone reads as ${reading.skin_tone.toLowerCase()}. Favor warm, grounding foods that balance ${topDosha.name.toLowerCase()} energy -- cooked grains, root vegetables, and warming spices like ginger or cumin.`,
      accent: 'text-teal-400',
    },
    {
      tradition: 'TCM',
      headline: `${topElement.name} element dominant`,
      body: `The ${topElement.name.toLowerCase()} element is showing most strongly in your reading. This suggests prioritizing foods that nourish the corresponding organ system and maintain the body's seasonal rhythm.`,
      accent: 'text-teal-400',
    },
    {
      tradition: 'Naturopathy',
      headline: `Stress signal is ${stressLabel}`,
      body:
        stress < 0.5
          ? 'Your stress indicators look manageable. Stay hydrated, prioritize whole foods, and maintain your sleep routine -- no drastic changes needed.'
          : 'Your stress indicators are slightly elevated. Consider magnesium-rich foods (leafy greens, pumpkin seeds), reduce caffeine after noon, and aim for 7-8 hours of sleep.',
      accent: 'text-teal-400',
    },
  ];
}

export function FaceScanScreen({ userId }: FaceScanScreenProps) {
  const [state, setState] = useState<ScanState>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [reading, setReading] = useState<FaceScanReading | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select an image file.');
        setState('error');
        return;
      }

      // Revoke prior preview to avoid memory leak
      if (previewUrl) URL.revokeObjectURL(previewUrl);

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setState('processing');
      setErrorMessage('');

      try {
        // Generate the deterministic simulated reading locally
        const generated = generateFaceScanReading(userId);

        // POST to backend (demo: this will fail if no session, but we still show results)
        try {
          await apiFetch('/face-scan', {
            method: 'POST',
            body: JSON.stringify(generated),
          });
        } catch {
          // Swallow network/auth errors in demo mode -- results are simulated anyway
        }

        // Small artificial delay so the processing state is visible
        await new Promise((resolve) => setTimeout(resolve, 800));

        setReading(generated);
        setState('complete');
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
        setState('error');
      }
    },
    [userId, previewUrl],
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = '';
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleReset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setReading(null);
    setErrorMessage('');
    setState('idle');
  }, [previewUrl]);

  const perspectives = reading ? buildPerspectives(reading) : [];

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      {/* Heading */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-teal tracking-tight">Face Scan</h1>
        <p className="font-body text-sm text-cream/50 mt-1">
          Upload a photo for a simulated constitutional analysis through three wellness traditions.
        </p>
      </div>

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Idle -- upload area */}
      {state === 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="w-full bg-dark-elevated rounded-2xl border-2 border-dashed border-dark-border hover:border-teal/60 transition-colors p-10 flex flex-col items-center gap-3 text-center"
          >
            <div className="w-14 h-14 rounded-full bg-teal/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <p className="font-heading text-base font-semibold text-cream">
                Upload a photo for constitutional analysis
              </p>
              <p className="font-body text-xs text-cream/40 mt-1">
                Drag and drop, or tap to choose a photo
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 min-h-[48px] rounded-2xl bg-teal-600 hover:bg-teal-500 transition-colors text-white font-body font-medium"
          >
            <Camera className="w-5 h-5" />
            Take Photo
          </button>

          <p className="font-body text-xs text-cream/40 text-center">
            Photos are processed in demo mode only -- not stored or shared.
          </p>
        </motion.div>
      )}

      {/* Processing / Complete / Error -- show preview */}
      {state !== 'idle' && previewUrl && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-dark-elevated rounded-2xl overflow-hidden"
        >
          <img src={previewUrl} alt="Uploaded preview" className="w-full max-h-96 object-cover" />
          <button
            type="button"
            onClick={handleReset}
            aria-label="Remove photo"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 transition-colors flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </motion.div>
      )}

      {/* Processing state */}
      {state === 'processing' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-dark-elevated rounded-2xl p-6 flex items-center gap-3"
        >
          <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
          <div>
            <p className="font-heading text-sm font-semibold text-cream">Analyzing...</p>
            <p className="font-body text-xs text-cream/40">
              Running three-tradition constitutional analysis.
            </p>
          </div>
        </motion.div>
      )}

      {/* Error state */}
      {state === 'error' && (
        <div className="bg-dark-elevated rounded-2xl p-5 border border-red-400/30">
          <p className="font-body text-sm text-red-400">{errorMessage}</p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-3 font-body text-sm text-teal-400 hover:text-teal-300 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {state === 'complete' && reading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-cream/60">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span className="font-body text-xs uppercase tracking-wider">
                Three tradition perspectives
              </span>
            </div>

            {perspectives.map((p, i) => (
              <motion.div
                key={p.tradition}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-dark-elevated rounded-2xl p-5 border border-dark-border/40"
              >
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className={`font-heading text-lg font-bold ${p.accent}`}>{p.tradition}</h3>
                  <span className="font-body text-[10px] uppercase tracking-wider text-cream/30">
                    Simulated
                  </span>
                </div>
                <p className="font-heading text-base text-cream mb-2">{p.headline}</p>
                <p className="font-body text-sm text-cream/70 leading-relaxed">{p.body}</p>
              </motion.div>
            ))}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 min-h-[48px] rounded-2xl bg-dark-elevated hover:bg-dark-surface-high transition-colors text-cream font-body font-medium border border-dark-border/40"
              >
                Scan another photo
              </button>
            </div>

            <p className="font-body text-xs text-cream/40 text-center">
              Confidence: {Math.round(reading.confidence * 100)}% (simulated). These readings are
              soft signals and do not override your constitutional profile.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
