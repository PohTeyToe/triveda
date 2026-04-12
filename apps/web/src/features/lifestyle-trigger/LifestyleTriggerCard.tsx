/**
 * LifestyleTriggerCard -- single triggered lifestyle recommendation card.
 *
 * Shows a "pattern noticed" header, recommendation body, optional breathwork
 * walkthrough, and dismiss controls.
 */

import type { ActiveTrigger, DismissalType } from '@triveda/shared';
import { useState } from 'react';
import { BreathworkWalkthrough } from './BreathworkWalkthrough';
import { TriggerDismissControls } from './TriggerDismissControls';

interface LifestyleTriggerCardProps {
  trigger: ActiveTrigger;
  onDismiss: (dismissalType: DismissalType) => void;
}

export function LifestyleTriggerCard({ trigger, onDismiss }: LifestyleTriggerCardProps) {
  const [breathworkExpanded, setBreathworkExpanded] = useState(false);
  const { recommendation } = trigger;

  return (
    <div className="bg-gray-50 dark:bg-dark-elevated border border-dark-border/30 dark:border-dark-border rounded-xl p-3 space-y-2">
      {/* Pattern noticed header */}
      <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">
        Pattern noticed
      </p>

      {/* Title */}
      <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
        {recommendation.title}
      </h3>

      {/* Body */}
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {recommendation.body}
      </p>

      {/* Learn more (breathwork expansion for stress triggers) */}
      {recommendation.learnMore && (
        <BreathworkWalkthrough
          template={recommendation.learnMore}
          isExpanded={breathworkExpanded}
          onToggle={() => setBreathworkExpanded(!breathworkExpanded)}
        />
      )}

      {/* Dismiss controls */}
      <TriggerDismissControls onDismiss={onDismiss} />
    </div>
  );
}
