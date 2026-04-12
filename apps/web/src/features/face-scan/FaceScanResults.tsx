/**
 * FaceScanResults -- displays mock reading values with simulated badges.
 *
 * Mobile-first stacked card layout: dosha shifts, element hints, wellness.
 */

import type { FaceScanReading } from '@triveda/shared/inputs';
import { SimulatedBadge } from './SimulatedBadge';

type FaceScanResultsProps = {
  reading: FaceScanReading;
};

function getDeltaLabel(delta: number): string {
  const abs = Math.abs(delta);
  if (abs < 0.15) return 'Stable';
  if (abs < 0.5) return delta > 0 ? 'Mild increase' : 'Mild decrease';
  return delta > 0 ? 'Significant increase' : 'Significant decrease';
}

function DoshaGauge({ label, delta }: { label: string; delta: number }) {
  const abs = Math.abs(delta);
  const widthPercent = Math.min(abs * 100, 100);
  const isPositive = delta >= 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-300 text-sm w-16 shrink-0">{label}</span>
      <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden relative">
        <div
          className={`h-full rounded-full transition-all ${isPositive ? 'bg-teal-500 ml-auto' : 'bg-amber-500'}`}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
      <span className="text-gray-400 text-xs w-28 text-right shrink-0">{getDeltaLabel(delta)}</span>
    </div>
  );
}

const ELEMENT_LABELS: Record<string, string> = {
  wood_hint: 'Wood',
  fire_hint: 'Fire',
  earth_hint: 'Earth',
  metal_hint: 'Metal',
  water_hint: 'Water',
};

function getStressZone(level: number): { label: string; color: string } {
  if (level < 0.33) return { label: 'Low', color: 'text-green-400' };
  if (level < 0.66) return { label: 'Moderate', color: 'text-amber-400' };
  return { label: 'High', color: 'text-red-400' };
}

export function FaceScanResults({ reading }: FaceScanResultsProps) {
  // Sort element hints by value descending
  const elements = Object.entries(ELEMENT_LABELS)
    .map(([key, label]) => ({
      label,
      value: reading[key as keyof FaceScanReading] as number,
    }))
    .sort((a, b) => b.value - a.value);

  const topElements = elements.slice(0, 2);
  const stressZone = getStressZone(reading.stress_level);

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
      {/* Card 1: Dosha Shifts */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Today's Dosha Reading</h3>
          <SimulatedBadge variant="result" />
        </div>
        <div className="flex flex-col gap-2">
          <DoshaGauge label="Vata" delta={reading.vata_delta} />
          <DoshaGauge label="Pitta" delta={reading.pitta_delta} />
          <DoshaGauge label="Kapha" delta={reading.kapha_delta} />
        </div>
      </div>

      {/* Card 2: Element Hints */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Five Element Hints</h3>
          <SimulatedBadge variant="result" />
        </div>
        <div className="flex flex-col gap-2">
          {topElements.map((el) => (
            <div key={el.label} className="flex items-center gap-3">
              <span className="text-gray-300 text-sm w-16 shrink-0">{el.label}</span>
              <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full"
                  style={{ width: `${el.value * 100}%` }}
                />
              </div>
              <span className="text-gray-400 text-xs w-12 text-right">
                {Math.round(el.value * 100)}%
              </span>
            </div>
          ))}
        </div>
        <details className="mt-2">
          <summary className="text-gray-500 text-xs cursor-pointer hover:text-gray-400">
            Show all elements
          </summary>
          <div className="flex flex-col gap-2 mt-2">
            {elements.slice(2).map((el) => (
              <div key={el.label} className="flex items-center gap-3">
                <span className="text-gray-400 text-sm w-16 shrink-0">{el.label}</span>
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-500 rounded-full"
                    style={{ width: `${el.value * 100}%` }}
                  />
                </div>
                <span className="text-gray-500 text-xs w-12 text-right">
                  {Math.round(el.value * 100)}%
                </span>
              </div>
            ))}
          </div>
        </details>
      </div>

      {/* Card 3: Wellness */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Wellness Indicators</h3>
          <SimulatedBadge variant="result" />
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-gray-400 text-xs mb-1">Stress Level</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full"
                  style={{ width: `${reading.stress_level * 100}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${stressZone.color}`}>{stressZone.label}</span>
            </div>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">Skin Tone</p>
            <span className="inline-block bg-gray-700 text-gray-300 text-sm rounded-full px-3 py-1">
              {reading.skin_tone}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 text-xs space-y-1">
        <p>Confidence: {Math.round(reading.confidence * 100)}% (simulated)</p>
        <p>
          These readings are soft signals that nudge food scoring. They do not override your
          constitutional profile.
        </p>
      </div>
    </div>
  );
}
