/**
 * Template-based personalization for food/herb detail pages.
 *
 * No LLM needed -- pick a template from the dominant dosha + thermal nature
 * combination and fill in the blanks.
 */

interface PersonalizationInput {
  dominantDosha: string;
  thermalNature: string | null;
  foodName: string;
  rasa?: string[];
  guna?: string[];
  herbActions?: string[];
}

const FOOD_TEMPLATES: Record<string, string> = {
  // Vata
  'vata-heating':
    'As a Vata-dominant person, this warming {name} helps ground your airy constitution. Its {rasa} taste provides the stability Vata needs.',
  'vata-cooling':
    'As a Vata-dominant person, be mindful with this cooling {name}. Balance it with warming spices to avoid aggravating Vata.',
  'vata-neutral':
    'This {name} is neutral in temperature, which can work well for your Vata constitution when combined with warming preparations.',

  // Pitta
  'pitta-heating':
    'As a Pitta-dominant person, use this warming {name} moderately. Its heating nature may increase Pitta if overused.',
  'pitta-cooling':
    'As a Pitta-dominant person, this cooling {name} is excellent for balancing your natural heat. Its {rasa} taste specifically pacifies Pitta.',
  'pitta-neutral':
    'This {name} is temperature-neutral, making it generally suitable for your Pitta constitution without aggravation.',

  // Kapha
  'kapha-heating':
    'As a Kapha-dominant person, this warming {name} supports your metabolism and helps counter Kapha heaviness.',
  'kapha-cooling':
    'As a Kapha-dominant person, use this cooling {name} in moderation. Its cooling nature can increase Kapha stagnation.',
  'kapha-neutral':
    'This {name} is neutral in temperature. For your Kapha constitution, pairing it with warming spices enhances its benefits.',
};

const HERB_TEMPLATES: Record<string, string> = {
  'vata-heating':
    'As a Vata-dominant person, this warming herb helps ground and stabilize. Its {actions} properties support Vata balance.',
  'vata-cooling':
    'As a Vata-dominant person, this cooling herb should be used thoughtfully. Its {actions} properties are beneficial, but monitor for Vata aggravation.',
  'vata-neutral':
    'This herb is temperature-neutral, suitable for Vata when used as part of a balanced regimen. {actions} properties support overall wellness.',

  'pitta-heating':
    'As a Pitta-dominant person, use this warming herb with care. Its {actions} properties are valuable, but heating herbs can increase Pitta.',
  'pitta-cooling':
    'As a Pitta-dominant person, this cooling herb supports your constitution well. Its {actions} properties help manage Pitta heat.',
  'pitta-neutral':
    'This neutral herb works well for Pitta constitutions. Its {actions} properties provide support without thermal imbalance.',

  'kapha-heating':
    'As a Kapha-dominant person, this warming herb supports metabolism and movement. Its {actions} properties help counter Kapha heaviness.',
  'kapha-cooling':
    'As a Kapha-dominant person, use this cooling herb moderately. Its {actions} properties are beneficial but cooling can increase Kapha.',
  'kapha-neutral':
    'This neutral herb is suitable for Kapha when combined with warming preparations. Its {actions} properties support balance.',
};

function normalizeThermal(thermal: string | null): string {
  if (!thermal) return 'neutral';
  const lower = thermal.toLowerCase();
  if (lower.includes('hot') || lower.includes('warm') || lower === 'ushna') return 'heating';
  if (lower.includes('cold') || lower.includes('cool') || lower === 'sheeta') return 'cooling';
  return 'neutral';
}

export function getFoodPersonalization(input: PersonalizationInput): string {
  const thermalKey = normalizeThermal(input.thermalNature);
  const key = `${input.dominantDosha}-${thermalKey}`;
  const template = FOOD_TEMPLATES[key] ?? FOOD_TEMPLATES[`${input.dominantDosha}-neutral`] ?? '';

  return template
    .replace('{name}', input.foodName)
    .replace('{rasa}', input.rasa?.join(', ') ?? '')
    .replace('{guna}', input.guna?.join(', ') ?? '');
}

export function getHerbPersonalization(input: PersonalizationInput): string {
  const thermalKey = normalizeThermal(input.thermalNature);
  const key = `${input.dominantDosha}-${thermalKey}`;
  const template = HERB_TEMPLATES[key] ?? HERB_TEMPLATES[`${input.dominantDosha}-neutral`] ?? '';

  return template
    .replace('{name}', input.foodName)
    .replace('{actions}', input.herbActions?.join(', ') ?? '');
}

export function getDominantDosha(ratios?: { vata: number; pitta: number; kapha: number }): string {
  if (!ratios) return 'vata';
  const entries = Object.entries(ratios);
  entries.sort(([, a], [, b]) => b - a);
  return entries[0]?.[0] ?? 'vata';
}
