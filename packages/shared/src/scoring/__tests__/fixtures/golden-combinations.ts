/**
 * Generates 180 combinations: 10 profiles x 6 seasons x 3 weather.
 * Each entry has all data needed for a golden snapshot test case.
 */

import type {
  ConstitutionalProfile,
  ScoringContext,
  SeasonalContext,
  WeatherContext,
} from '../../types.js';
import {
  SEASONS,
  SEASON_NAMES,
  WEATHER_CONDITIONS,
  WEATHER_NAMES,
  buildContext,
} from './contexts.js';
import { PROFILES, PROFILE_NAMES } from './profiles.js';

export interface GoldenCombination {
  profileName: string;
  profile: ConstitutionalProfile;
  seasonName: string;
  seasonal: SeasonalContext;
  weatherName: string;
  weather: WeatherContext;
  context: ScoringContext;
  snapshotName: string;
}

export const goldenCombinations: GoldenCombination[] = [];

for (const profileName of PROFILE_NAMES) {
  for (const seasonName of SEASON_NAMES) {
    for (const weatherName of WEATHER_NAMES) {
      const profile = PROFILES[profileName];
      const seasonal = SEASONS[seasonName] as SeasonalContext;
      const weather = WEATHER_CONDITIONS[weatherName] as WeatherContext;
      goldenCombinations.push({
        profileName,
        profile,
        seasonName,
        seasonal,
        weatherName,
        weather,
        context: buildContext(seasonal, weather),
        snapshotName: `${profileName}-${seasonName}-${weatherName}`,
      });
    }
  }
}
