/**
 * 6 seasonal contexts x 3 weather variations = 18 day contexts
 * for golden snapshot tests.
 *
 * All contexts share a fixed organ clock (stomach hour, 8 AM)
 * and empty recentFoods / restrictions arrays.
 */

import type {
  OrganClockContext,
  ScoringContext,
  SeasonalContext,
  WeatherContext,
} from '../../types.js';

// ---------------------------------------------------------------------------
// Fixed organ clock (stomach hour)
// ---------------------------------------------------------------------------

const STOMACH_HOUR: OrganClockContext = {
  activeOrgan: 'stomach',
  pairedOrgan: 'spleen',
  element: 'earth',
  isDigestiveWindow: true,
  isWindDownWindow: false,
};

// ---------------------------------------------------------------------------
// 6 seasonal contexts (one per Ritu)
// ---------------------------------------------------------------------------

export const SEASONS: Record<string, SeasonalContext> = {
  hemanta: {
    ayurvedaRitu: 'hemanta',
    tcmPhase: 'water',
    isTransition: false,
    transitionProgress: 0,
    seasonalIntensity: 0.89,
  },
  shishira: {
    ayurvedaRitu: 'shishira',
    tcmPhase: 'water',
    isTransition: false,
    transitionProgress: 0,
    seasonalIntensity: 0.89,
  },
  vasanta: {
    ayurvedaRitu: 'vasanta',
    tcmPhase: 'wood',
    isTransition: false,
    transitionProgress: 0,
    seasonalIntensity: 0.89,
  },
  grishma: {
    ayurvedaRitu: 'grishma',
    tcmPhase: 'fire',
    isTransition: false,
    transitionProgress: 0,
    seasonalIntensity: 0.89,
  },
  varsha: {
    ayurvedaRitu: 'varsha',
    tcmPhase: 'earth',
    isTransition: false,
    transitionProgress: 0,
    seasonalIntensity: 0.89,
  },
  sharad: {
    ayurvedaRitu: 'sharad',
    tcmPhase: 'metal',
    isTransition: false,
    transitionProgress: 0,
    seasonalIntensity: 0.89,
  },
};

export const SEASON_NAMES = Object.keys(SEASONS);

// ---------------------------------------------------------------------------
// 3 weather variations
// ---------------------------------------------------------------------------

export const WEATHER_CONDITIONS: Record<string, WeatherContext> = {
  'cold-windy': {
    thermalNeed: 0.9,
    vataAggravation: 0.8,
    kaphaAggravation: 0.0,
    pittaAggravation: 0.0,
    tcmWindPattern: 'wind_cold',
  },
  'hot-humid': {
    thermalNeed: -0.8,
    vataAggravation: 0.0,
    kaphaAggravation: 0.6,
    pittaAggravation: 0.7,
    tcmWindPattern: 'wind_heat',
  },
  'mild-neutral': {
    thermalNeed: 0.0,
    vataAggravation: 0.1,
    kaphaAggravation: 0.1,
    pittaAggravation: 0.1,
    tcmWindPattern: 'none',
  },
};

export const WEATHER_NAMES = Object.keys(WEATHER_CONDITIONS);

// ---------------------------------------------------------------------------
// Context builder
// ---------------------------------------------------------------------------

export function buildContext(seasonal: SeasonalContext, weather: WeatherContext): ScoringContext {
  return {
    seasonal,
    weather,
    organClock: STOMACH_HOUR,
    recentFoods: [],
    dietaryRestrictions: [],
    allergies: [],
    explicitDislikes: [],
    today: '2026-01-15',
  };
}
