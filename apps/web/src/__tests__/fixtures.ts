/**
 * Mock data fixtures for onboarding tests.
 */

import type { ConstitutionProfile, Question } from '../lib/query-options';

export const mockProfile: ConstitutionProfile = {
  dosha_ratios: { vata: 0.5, pitta: 0.35, kapha: 0.15 },
  element_type: 'wood',
  plain_language_summary:
    'You run hot-cold: intense creative energy that burns fast, then crashes. ' +
    'Your digestion is your barometer. Wind and cold weather hit you hardest. ' +
    'Stress lands in your gut before your mind processes it. ' +
    'You do best with warm, regular meals and a morning routine that is the same every day.',
  tradition_sections: {
    ayurveda: 'dual dosha: vata-dominant',
    tcm: 'Primary element: wood',
    naturopathy: 'Metabolic type: fast_oxidizer',
  },
  completeness: 17,
  answer_count: 3,
};

export const mockCompleteProfile: ConstitutionProfile = {
  ...mockProfile,
  completeness: 100,
  answer_count: 18,
};

export const mockQuickStartQuestions: Question[] = [
  {
    id: '9',
    text: 'How is your appetite?',
    type: 'single_choice',
    options: [
      { value: 'a', label: 'Irregular, sometimes forget to eat' },
      { value: 'b', label: 'Strong, cannot skip meals' },
      { value: 'c', label: 'Moderate, can skip meals easily' },
    ],
  },
  {
    id: '1',
    text: 'How would you describe your body frame?',
    type: 'single_choice',
    options: [
      { value: 'a', label: 'Thin, light, hard to gain weight' },
      { value: 'b', label: 'Medium, athletic build' },
      { value: 'c', label: 'Large, solid, gains weight easily' },
    ],
  },
  {
    id: '4',
    text: 'How would you describe your digestion?',
    type: 'single_choice',
    options: [
      { value: 'a', label: 'Irregular, variable appetite' },
      { value: 'b', label: 'Strong, sharp hunger' },
      { value: 'c', label: 'Slow, steady digestion' },
    ],
  },
];

export const mockNextQuestion: Question = {
  id: '5',
  text: 'What temperature do you dislike most?',
  type: 'single_choice',
  options: [
    { value: 'a', label: 'Cold weather' },
    { value: 'b', label: 'Hot weather' },
    { value: 'c', label: 'Damp, cold weather' },
  ],
};

export const mockAssessResponse = {
  profile: mockProfile,
  credits: [
    {
      featureId: 'dosha-analysis',
      featureName: 'Dosha Analysis',
      active: true,
      contribution: 'Constitutional scoring from assessment answers',
    },
    {
      featureId: 'progressive-profiling',
      featureName: 'Progressive Profiling',
      active: true,
      contribution: 'Profile 17% complete',
    },
  ],
};

export const mockAnswerResponse = {
  profile: {
    ...mockProfile,
    answer_count: 4,
    completeness: 22,
  },
  completeness: 22,
  credits: [
    {
      featureId: 'dosha-analysis',
      featureName: 'Dosha Analysis',
      active: true,
      contribution: 'Constitutional scoring from assessment answers',
    },
    {
      featureId: 'progressive-profiling',
      featureName: 'Progressive Profiling',
      active: true,
      contribution: 'Profile 22% complete',
    },
  ],
};
