/**
 * DailyFoodCard -- the single food recommendation card.
 * Shows food name (h1), two-sentence rationale, and FeedbackButtons.
 * Rationale updates seamlessly when synthesis completes.
 */

import { useTraditionStream } from '../../hooks/useTraditionStream';
import { Card } from '../layout/Card';
import { FeedbackButtons } from './FeedbackButtons';
import { BODY_CLASSES, CARD_GAP, CARD_PADDING, HEADING_CLASSES } from './dimensions';

type DailyFoodCardProps = {
  food: { id: string; name: string };
  rationale: string;
  suggestionId: string;
  feedbackState?: 'tried' | 'rejected' | null;
  userId?: string;
  demoDay?: number;
  apiUrl?: string;
  authToken?: string;
};

export function DailyFoodCard({
  food,
  rationale,
  suggestionId,
  feedbackState,
  userId,
  demoDay,
  apiUrl,
  authToken,
}: DailyFoodCardProps) {
  const traditions = useTraditionStream();

  // Use synthesis rationale when available, otherwise pre-computed fallback
  let displayRationale = rationale;
  if (traditions.synthesis.state === 'complete' && traditions.synthesis.text) {
    // Try to extract two_sentence_rationale from synthesis text
    try {
      const parsed = JSON.parse(traditions.synthesis.text);
      if (parsed.two_sentence_rationale) {
        displayRationale = parsed.two_sentence_rationale;
      }
    } catch {
      // If synthesis text is plain text (not JSON), use it directly
      if (traditions.synthesis.text.length > 10) {
        displayRationale = traditions.synthesis.text;
      }
    }
  }

  return (
    <Card variant="elevated" className={CARD_PADDING}>
      <h1 className={`font-heading ${HEADING_CLASSES} text-neutral-900 dark:text-white`}>
        {food.name}
      </h1>
      <p className={`font-body ${BODY_CLASSES} text-neutral-700 dark:text-neutral-300 ${CARD_GAP}`}>
        {displayRationale}
      </p>
      <div className={CARD_GAP}>
        <FeedbackButtons
          suggestionId={suggestionId}
          currentFeedback={feedbackState}
          userId={userId}
          demoDay={demoDay}
          apiUrl={apiUrl}
          authToken={authToken}
        />
      </div>
    </Card>
  );
}
