/**
 * SkeletonDailyCard -- loading placeholder matching the exact dimensions
 * of DailyCardHeader + DailyFoodCard. Prevents CLS during initial load.
 */

import { Card } from '../layout/Card';
import {
  BODY_LINE_HEIGHT,
  CARD_GAP,
  CARD_PADDING,
  FEEDBACK_ROW_HEIGHT,
  HEADER_GAP,
  HEADER_LINE_HEIGHT,
  HEADING_HEIGHT,
  WHY_BUTTON_HEIGHT,
} from './dimensions';

const PULSE = 'animate-pulse rounded';
const SKELETON_BG = 'bg-light-muted dark:bg-dark-elevated';

export function SkeletonDailyCard() {
  return (
    <div data-testid="skeleton-daily-card">
      {/* Header skeleton */}
      <div className={HEADER_GAP}>
        <div className={`w-40 ${HEADER_LINE_HEIGHT} ${SKELETON_BG} ${PULSE}`} />
        <div className={`w-24 ${HEADER_LINE_HEIGHT} ${SKELETON_BG} ${PULSE}`} />
        <div className={`w-56 ${HEADER_LINE_HEIGHT} ${SKELETON_BG} ${PULSE}`} />
      </div>

      {/* Card skeleton */}
      <Card variant="elevated" className={`${CARD_PADDING} ${CARD_GAP}`}>
        {/* Food name */}
        <div className={`w-64 ${HEADING_HEIGHT} ${SKELETON_BG} ${PULSE}`} />

        {/* Rationale line 1 */}
        <div className={`w-full ${BODY_LINE_HEIGHT} ${SKELETON_BG} ${PULSE} mt-2`} />
        {/* Rationale line 2 */}
        <div className={`w-4/5 ${BODY_LINE_HEIGHT} ${SKELETON_BG} ${PULSE} mt-1`} />

        {/* Feedback row */}
        <div className={`flex gap-2 ${CARD_GAP}`}>
          <div className={`w-11 ${FEEDBACK_ROW_HEIGHT} ${SKELETON_BG} rounded-full ${PULSE}`} />
          <div className={`w-11 ${FEEDBACK_ROW_HEIGHT} ${SKELETON_BG} rounded-full ${PULSE}`} />
          <div className={`w-11 ${FEEDBACK_ROW_HEIGHT} ${SKELETON_BG} rounded-full ${PULSE}`} />
        </div>
      </Card>

      {/* Why button skeleton */}
      <div className={`w-12 ${WHY_BUTTON_HEIGHT} ${SKELETON_BG} ${PULSE} ${CARD_GAP}`} />
    </div>
  );
}
