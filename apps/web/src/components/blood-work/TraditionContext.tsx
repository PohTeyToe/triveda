/**
 * TraditionContext -- three-tradition interpretation panel for a single biomarker.
 * Shows Ayurveda, TCM, and Naturopathy perspectives in a responsive grid.
 */

import type { BloodWorkTraditionContext } from '../../lib/types';

interface TraditionContextProps {
  context: BloodWorkTraditionContext;
}

interface TraditionCardProps {
  label: string;
  accentColor: string;
  text: string;
}

function TraditionCard({ label, accentColor, text }: TraditionCardProps) {
  return (
    <div className={`rounded-lg border p-3 ${accentColor}`}>
      <h4 className="text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">{label}</h4>
      <p className="text-xs leading-relaxed text-light/70 dark:text-light/70">{text}</p>
    </div>
  );
}

export function TraditionContext({ context }: TraditionContextProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3">
      <TraditionCard
        label="Ayurveda"
        accentColor="border-amber-500/30 bg-amber-500/5"
        text={context.ayurveda}
      />
      <TraditionCard
        label="Traditional Chinese Medicine"
        accentColor="border-red-500/30 bg-red-500/5"
        text={context.tcm}
      />
      <TraditionCard
        label="Naturopathy"
        accentColor="border-emerald-500/30 bg-emerald-500/5"
        text={context.naturopathy}
      />
    </div>
  );
}
