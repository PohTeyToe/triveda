/**
 * DayTravelControl -- demo-only UI strip for navigating between simulated days.
 * Returns null in production. Fenced behind VITE_ENABLE_DEMO_MODE.
 */

import { ChevronDown, ChevronUp } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import type { UseDemoDayReturn } from '../../hooks/useDemoDay';

type DayTravelControlProps = {
  demoDay: UseDemoDayReturn;
};

export function DayTravelControl({ demoDay }: DayTravelControlProps) {
  const [jumpInput, setJumpInput] = useState('');

  if (!demoDay.isDemo) return null;

  const handleJump = (e: FormEvent) => {
    e.preventDefault();
    const target = Number.parseInt(jumpInput, 10);
    if (Number.isNaN(target) || target < 1 || target > 30) return;
    demoDay.jumpTo(target);
    setJumpInput('');
  };

  return (
    <div
      className="
        flex items-center gap-3 p-3 rounded-lg
        bg-white dark:bg-dark-surface
        border border-neutral-200 dark:border-dark-border
        mt-3
      "
      data-testid="day-travel-control"
    >
      {/* Day label */}
      <span className="font-body text-sm font-medium text-teal">Day {demoDay.day}</span>

      {/* Advance (up = next day) */}
      <button
        type="button"
        onClick={() => demoDay.advance()}
        disabled={demoDay.day >= 30}
        aria-label="Next day"
        className="
          min-w-[44px] min-h-[44px] flex items-center justify-center
          rounded-lg border border-neutral-200 dark:border-dark-border
          text-neutral-600 dark:text-neutral-400
          hover:border-teal/30 hover:text-teal
          disabled:opacity-30 disabled:cursor-not-allowed
          transition-colors
          focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-dark
        "
      >
        <ChevronUp className="w-5 h-5" />
      </button>

      {/* Rewind (down = previous day) */}
      <button
        type="button"
        onClick={() => demoDay.rewind()}
        disabled={demoDay.day <= 1}
        aria-label="Previous day"
        className="
          min-w-[44px] min-h-[44px] flex items-center justify-center
          rounded-lg border border-neutral-200 dark:border-dark-border
          text-neutral-600 dark:text-neutral-400
          hover:border-teal/30 hover:text-teal
          disabled:opacity-30 disabled:cursor-not-allowed
          transition-colors
          focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-dark
        "
      >
        <ChevronDown className="w-5 h-5" />
      </button>

      {/* Jump input */}
      <form onSubmit={handleJump} className="flex items-center gap-1">
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={30}
          value={jumpInput}
          onChange={(e) => setJumpInput(e.target.value)}
          aria-label="Jump to day"
          placeholder="Day"
          className="
            w-14 px-2 py-1.5 rounded-lg
            text-xs font-body
            bg-light-muted dark:bg-dark-elevated
            border border-neutral-200 dark:border-dark-border
            text-neutral-800 dark:text-neutral-200
            focus-visible:ring-2 focus-visible:ring-teal
          "
        />
        <button
          type="submit"
          className="
            font-body text-xs px-2 py-1.5 rounded-lg
            bg-teal text-white
            hover:bg-teal-soft
            transition-colors
            focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-dark
          "
        >
          Go
        </button>
      </form>

      {/* Reset */}
      <button
        type="button"
        onClick={() => demoDay.reset()}
        aria-label="Reset demo to day 1"
        className="
          font-body text-xs text-neutral-400
          hover:text-teal transition-colors
          focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-dark
          rounded px-1 py-0.5
        "
      >
        Reset Demo
      </button>
    </div>
  );
}
