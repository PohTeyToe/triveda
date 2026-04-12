/**
 * CulturalInfluenceExplainer -- presentational component for the Why panel.
 *
 * Renders a single muted sentence explaining when cultural matching
 * influenced a recommendation. No state, no effects, no API calls.
 */

import { getCuisineLabel } from '@triveda/shared/cuisines';
import { Globe } from 'lucide-react';

type CulturalInfluenceExplainerProps = {
  cuisineCode: string;
  relationship: 'native' | 'common' | 'fusion';
  foodName: string;
};

const TEMPLATES: Record<string, (foodName: string, label: string) => string> = {
  native: (foodName, label) => `Nudged up because ${foodName} is a staple in ${label} cooking`,
  common: (foodName, label) => `Nudged up because ${foodName} is common in ${label} cooking`,
  fusion: (foodName, label) => `Slightly nudged because ${foodName} has ${label} fusion roots`,
};

export function CulturalInfluenceExplainer({
  cuisineCode,
  relationship,
  foodName,
}: CulturalInfluenceExplainerProps) {
  const label = getCuisineLabel(cuisineCode);
  const template = TEMPLATES[relationship];
  if (!template) return null;

  return (
    <p className="text-gray-400 text-sm font-sans">
      <Globe className="w-3 h-3 inline mr-1" />
      {template(foodName, label)}
    </p>
  );
}
