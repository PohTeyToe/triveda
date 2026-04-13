/**
 * DailyFoodCard -- the single food recommendation card.
 * Shows food name (h1), two-sentence rationale, and FeedbackButtons.
 * Rationale updates seamlessly when synthesis completes.
 */

import { motion } from 'framer-motion';
import { useTraditionStream } from '../../hooks/useTraditionStream';
import { cardEntranceProps } from '../../lib/animations';
import { FeedbackButtons } from './FeedbackButtons';

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
    <motion.div
      {...cardEntranceProps}
      whileTap={{ scale: 0.98 }}
      className="bg-dark-elevated rounded-2xl p-5"
    >
      {/* Food image placeholder */}
      <div className="bg-dark-surface-high rounded-xl h-40 flex items-center justify-center mb-4">
        <span className="text-4xl opacity-40" aria-hidden="true">
          🍲
        </span>
      </div>

      <h1 className="font-heading text-2xl font-bold text-teal tracking-tight">{food.name}</h1>

      <p className="font-body text-sm text-cream/70 leading-relaxed mt-2">{displayRationale}</p>

      <div className="mt-4">
        <FeedbackButtons
          suggestionId={suggestionId}
          currentFeedback={feedbackState}
          userId={userId}
          demoDay={demoDay}
          apiUrl={apiUrl}
          authToken={authToken}
        />
      </div>
    </motion.div>
  );
}
