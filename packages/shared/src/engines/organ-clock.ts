/**
 * OrganClock interface.
 *
 * Maps the current time to the active TCM organ meridian.
 * Implemented in split 02.
 */

export interface OrganMeridian {
  organ: string;
  element: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
  startHour: number;
  endHour: number;
}

export interface OrganClock {
  /** Get the active TCM organ meridian for a given time. */
  getActiveOrgan(time: Date): OrganMeridian;
}
