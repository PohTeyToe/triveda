/**
 * DailyCheckInChips -- self-contained daily check-in widget.
 *
 * Sits above the daily card. Manages its own state, storage, and sync.
 * The parent just renders <DailyCheckInChips userId={userId} /> and
 * optionally handles onSubmit/onDismiss callbacks.
 */

import { CHIP_PAIRS } from '@triveda/shared/check-in-mapping';
import type { DailyCheckInAnswer } from '@triveda/shared/inputs';
import { AnimatePresence, motion } from 'framer-motion';
import { ChipPair } from './ChipPair';
import { useCheckIn } from './useCheckIn';
import { useOfflineSync } from './useOfflineSync';

type DailyCheckInChipsProps = {
  userId: string;
  onSubmit?: (answer: DailyCheckInAnswer) => void;
  onDismiss?: () => void;
};

export function DailyCheckInChips({ userId, onSubmit, onDismiss }: DailyCheckInChipsProps) {
  const checkIn = useCheckIn(userId);
  useOfflineSync(userId);

  // Don't render if dismissed for today
  if (checkIn.isDismissed) return null;

  // Loading skeleton
  if (!checkIn.isLoaded) {
    return (
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 animate-pulse">
        <div className="h-5 bg-gray-700 rounded w-48 mb-4" />
        <div className="flex flex-wrap gap-3">
          {['skel-1', 'skel-2', 'skel-3', 'skel-4', 'skel-5', 'skel-6'].map((id) => (
            <div key={id} className="flex gap-2">
              <div className="h-8 bg-gray-700 rounded-full w-20" />
              <div className="h-8 bg-gray-700 rounded-full w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    await checkIn.save();
    const answer: DailyCheckInAnswer = {
      date: new Date().toISOString().slice(0, 10),
      selections: checkIn.selections,
      dismissed: false,
      synced: true,
    };
    onSubmit?.(answer);
  };

  const handleDismiss = async () => {
    await checkIn.dismiss();
    onDismiss?.();
  };

  const hasSelections = Object.values(checkIn.selections).some((v) => v !== null);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="bg-gray-800 rounded-xl p-4 border border-gray-700"
      >
        <h3 className="text-gray-300 font-semibold mb-3">How are you feeling today?</h3>

        {checkIn.isSynced && hasSelections && (
          <p className="text-gray-500 text-xs mb-2">Already checked in today</p>
        )}

        <div className="flex flex-wrap gap-3">
          {CHIP_PAIRS.map((pair) => (
            <ChipPair
              key={pair.id}
              pair={pair}
              value={checkIn.selections[pair.id] ?? null}
              onChange={(value) => checkIn.updateSelection(pair.id, value)}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            type="button"
            onClick={handleSave}
            className="bg-teal-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-teal-500 transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-gray-400 underline text-sm hover:text-gray-300 transition-colors"
          >
            Skip today
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
