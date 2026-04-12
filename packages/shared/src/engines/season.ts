/**
 * SeasonEngine interface.
 *
 * Determines the current Ayurvedic season (Ritu) based on date and
 * geographic latitude. Implemented in split 02.
 */

export type Season =
  | 'shishira' // late winter
  | 'vasanta' // spring
  | 'grishma' // summer
  | 'varsha' // monsoon / rainy
  | 'sharad' // autumn
  | 'hemanta'; // early winter

export interface SeasonResult {
  season: Season;
  confidence: number;
}

export interface SeasonEngine {
  /** Determine the Ayurvedic season for a given date and latitude. */
  getCurrentSeason(date: Date, latitude: number): SeasonResult;
}
