/**
 * SkeletonDailyCard -- loading placeholder matching the exact dimensions
 * of DailyCardHeader + DailyFoodCard. Prevents CLS during initial load.
 */

const PULSE = 'animate-pulse rounded';
const SKELETON_BG = 'bg-dark-surface-high';

export function SkeletonDailyCard() {
  return (
    <div data-testid="skeleton-daily-card">
      {/* Header skeleton */}
      <div className="py-4 space-y-1">
        <div className={`w-20 h-3 ${SKELETON_BG} ${PULSE}`} />
        <div className="flex items-baseline gap-2">
          <div className={`w-32 h-6 ${SKELETON_BG} ${PULSE}`} />
          <div className={`w-24 h-4 ${SKELETON_BG} ${PULSE}`} />
        </div>
        <div className={`w-16 h-3 ${SKELETON_BG} ${PULSE}`} />
      </div>

      {/* Card skeleton */}
      <div className="bg-dark-elevated rounded-2xl p-5 mt-4">
        {/* Image placeholder */}
        <div className={`w-full h-40 ${SKELETON_BG} rounded-xl ${PULSE} mb-4`} />

        {/* Food name */}
        <div className={`w-48 h-7 ${SKELETON_BG} ${PULSE}`} />

        {/* Rationale line 1 */}
        <div className={`w-full h-4 ${SKELETON_BG} ${PULSE} mt-3`} />
        {/* Rationale line 2 */}
        <div className={`w-4/5 h-4 ${SKELETON_BG} ${PULSE} mt-1.5`} />

        {/* Feedback row */}
        <div className="flex gap-2 mt-4">
          <div className={`w-11 h-11 ${SKELETON_BG} rounded-full ${PULSE}`} />
          <div className={`w-11 h-11 ${SKELETON_BG} rounded-full ${PULSE}`} />
          <div className={`w-20 h-8 ${SKELETON_BG} rounded-full ${PULSE} self-center`} />
        </div>
      </div>

      {/* Why button skeleton */}
      <div className={`w-28 h-8 ${SKELETON_BG} ${PULSE} mt-4 rounded-lg`} />
    </div>
  );
}
