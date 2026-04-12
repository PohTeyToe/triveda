// Triggered outputs barrel export

// Types
export type {
  TriggerType,
  DismissalType,
  FeedbackType,
  DailyCheckIn,
  TriggerSuppressionState,
  TriggerFeedback,
  UserState,
  BreathworkTemplate,
  FoodBias,
  TriggerRecommendation,
  TriggerCandidate,
  ActiveTrigger,
  TriggerRule,
  ChipFieldMapping,
} from './types.js';

// Config constants
export {
  MIN_CHECKINS_FOR_DETECTION,
  TRIGGER_WINDOW_DAYS,
  TRIGGER_THRESHOLD,
  TRIGGER_WEIGHTS,
  SUPPRESSION_DURATIONS,
  CHIP_TO_FIELD_MAP,
  COPY_TEMPLATES,
  COPY_DENY_LIST,
  BREATHWORK_ROTATION_ORDER,
} from './trigger-config.js';

// Breathwork templates
export {
  BREATHWORK_TEMPLATES,
  getBreathworkTemplate,
  getBreathworkByRotation,
} from './breathwork-templates.js';

// Pattern detector
export { detectPatterns } from './pattern-detector.js';

// Severity
export { computeSeverity, rankBySeverity } from './severity.js';

// Suppression
export { isSuppressed, computeSuppressionEnd } from './suppression.js';

// Counting
export { countMatchingCheckIns } from './count-matching.js';
export type { CountResult } from './count-matching.js';

// Weekly herb config
export {
  HERB_WEIGHTS,
  HERB_DECAY_STEPS,
  DEFAULT_DELIVERY_DAY,
  herbToScoringInput,
} from './weekly-herb-config.js';
export type { HerbDecayStep, HerbFeedback, HerbRow } from './weekly-herb-config.js';
