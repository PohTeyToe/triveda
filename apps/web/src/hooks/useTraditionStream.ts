/**
 * useTraditionStream -- thin wrapper reading per-tradition streaming state
 * from TraditionStreamContext.
 */

import { useContext } from 'react';
import {
  TraditionStreamContext,
  type TraditionStreamState,
} from '../contexts/TraditionStreamContext';

const FALLBACK: TraditionStreamState = {
  ayurveda: { text: '', state: 'idle' },
  tcm: { text: '', state: 'idle' },
  naturopathy: { text: '', state: 'idle' },
  synthesis: { text: '', state: 'idle' },
};

export function useTraditionStream(): TraditionStreamState {
  const ctx = useContext(TraditionStreamContext);
  if (!ctx) return FALLBACK;
  return ctx.traditions;
}
