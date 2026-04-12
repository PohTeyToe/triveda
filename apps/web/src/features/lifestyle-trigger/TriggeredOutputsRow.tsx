/**
 * TriggeredOutputsRow -- slot component for the daily card screen.
 *
 * Fetches active triggers and renders a single LifestyleTriggerCard
 * for the top-ranked trigger (display: true). Renders null when no
 * triggers are active.
 *
 * This is the public API of the trigger frontend -- split 08 imports
 * this component and places it above the daily food card.
 */

import type { DismissalType } from '@triveda/shared';
import { LifestyleTriggerCard } from './LifestyleTriggerCard';
import { useTriggerDismiss } from './useTriggerDismiss';
import { useTriggeredRecs } from './useTriggeredRecs';

export function TriggeredOutputsRow() {
  const { data } = useTriggeredRecs();
  const dismiss = useTriggerDismiss();

  if (!data || data.triggers.length === 0) {
    return null;
  }

  const displayTrigger = data.triggers.find((t) => t.display);
  if (!displayTrigger) {
    return null;
  }

  const handleDismiss = (dismissalType: DismissalType) => {
    dismiss.mutate({
      trigger_type: displayTrigger.type,
      dismissal_type: dismissalType,
    });
  };

  return (
    <div className="mb-3">
      <LifestyleTriggerCard trigger={displayTrigger} onDismiss={handleDismiss} />
    </div>
  );
}
