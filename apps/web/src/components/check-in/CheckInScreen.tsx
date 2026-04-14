/**
 * CheckInScreen -- daily check-in form for mood, energy, digestion.
 *
 * Sends POST /api/v1/daily-check-in with the backend's expected schema:
 *   mood: 'great' | 'good' | 'okay' | 'poor' | 'bad'
 *   energy: 'high' | 'medium' | 'low'
 *   digestion: 'great' | 'good' | 'okay' | 'poor' | 'bad'
 */

import { Check } from 'lucide-react';
import { useState } from 'react';
import { apiFetch } from '../../lib/api-client';

type Mood = 'great' | 'good' | 'okay' | 'poor' | 'bad';
type Energy = 'high' | 'medium' | 'low';
type Digestion = 'great' | 'good' | 'okay' | 'poor' | 'bad';

const MOOD_OPTIONS: { value: Mood; label: string; emoji: string }[] = [
  { value: 'great', label: 'Great', emoji: '😊' },
  { value: 'good', label: 'Good', emoji: '🙂' },
  { value: 'okay', label: 'Okay', emoji: '😐' },
  { value: 'poor', label: 'Poor', emoji: '😔' },
  { value: 'bad', label: 'Bad', emoji: '😞' },
];

const ENERGY_OPTIONS: { value: Energy; label: string }[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const DIGESTION_OPTIONS: { value: Digestion; label: string }[] = [
  { value: 'great', label: 'Great' },
  { value: 'good', label: 'Good' },
  { value: 'okay', label: 'Okay' },
  { value: 'poor', label: 'Poor' },
  { value: 'bad', label: 'Bad' },
];

export function CheckInScreen() {
  const [mood, setMood] = useState<Mood | null>(null);
  const [energy, setEnergy] = useState<Energy | null>(null);
  const [digestion, setDigestion] = useState<Digestion | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = mood && energy && digestion && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      await apiFetch('/daily-check-in', {
        method: 'POST',
        body: JSON.stringify({ mood, energy, digestion }),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="rounded-2xl border border-teal/20 bg-teal/5 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-teal/20 flex items-center justify-center mx-auto">
            <Check className="w-6 h-6 text-teal" />
          </div>
          <h2 className="font-heading text-xl font-bold text-teal">Check-in recorded</h2>
          <p className="text-sm text-light/40 dark:text-light/40">
            Your daily check-in has been saved. Come back tomorrow!
          </p>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setMood(null);
              setEnergy(null);
              setDigestion(null);
            }}
            className="text-sm text-teal underline underline-offset-2"
          >
            Update today's check-in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-teal mb-1">Daily Check-in</h1>
        <p className="text-sm text-light/40 dark:text-light/40">
          A quick snapshot of how you're feeling today. Takes 30 seconds.
        </p>
      </div>

      {/* Mood */}
      <fieldset className="space-y-3">
        <legend className="font-heading text-sm font-semibold text-light/70 dark:text-light/70 uppercase tracking-wide">
          Mood
        </legend>
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMood(opt.value)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                mood === opt.value
                  ? 'bg-teal text-cream shadow-md shadow-teal/20'
                  : 'bg-white/5 border border-light/10 text-light/60 hover:border-teal/40 hover:text-teal'
              }`}
            >
              <span className="mr-1.5">{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Energy */}
      <fieldset className="space-y-3">
        <legend className="font-heading text-sm font-semibold text-light/70 dark:text-light/70 uppercase tracking-wide">
          Energy Level
        </legend>
        <div className="flex gap-2">
          {ENERGY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setEnergy(opt.value)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                energy === opt.value
                  ? 'bg-teal text-cream shadow-md shadow-teal/20'
                  : 'bg-white/5 border border-light/10 text-light/60 hover:border-teal/40 hover:text-teal'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Digestion */}
      <fieldset className="space-y-3">
        <legend className="font-heading text-sm font-semibold text-light/70 dark:text-light/70 uppercase tracking-wide">
          Digestion
        </legend>
        <div className="flex flex-wrap gap-2">
          {DIGESTION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDigestion(opt.value)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                digestion === opt.value
                  ? 'bg-teal text-cream shadow-md shadow-teal/20'
                  : 'bg-white/5 border border-light/10 text-light/60 hover:border-teal/40 hover:text-teal'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Error */}
      {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-xl px-4 py-2">{error}</p>}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full py-3 rounded-xl bg-teal-500 text-cream font-medium hover:bg-teal-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? 'Saving...' : 'Save Check-in'}
      </button>
    </div>
  );
}
