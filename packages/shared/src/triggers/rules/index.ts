/**
 * Trigger rule registry.
 *
 * Fixed-order array of TriggerRule functions.
 * Registration order determines tie-breaking in rankBySeverity().
 * Adding a new rule: import it and append to the array.
 */

import type { TriggerRule } from '../types.js';
import { digestiveRule } from './digestive-rule.js';
import { energyRule } from './energy-rule.js';
import { sleepRule } from './sleep-rule.js';
import { stressRule } from './stress-rule.js';

export const TRIGGER_RULES: TriggerRule[] = [stressRule, digestiveRule, energyRule, sleepRule];
