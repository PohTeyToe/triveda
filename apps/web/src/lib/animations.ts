/**
 * Shared Framer Motion animation presets.
 * Centralizes animation config so it is not scattered across components.
 */

import type { Variants } from 'framer-motion';

/** Page-level route transition (used in root layout AnimatePresence) */
export const pageTransitionProps = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: {
    duration: 0.25,
    ease: [0.4, 0, 0.2, 1],
  },
} as const;

/** Section expand/collapse (used in ConstitutionSection) */
export const sectionExpandProps = {
  initial: false as const,
  animate: (isExpanded: boolean) => ({
    height: isExpanded ? 'auto' : 0,
  }),
  transition: {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1],
  },
} as const;

/** Daily profiling card entrance */
export const slideDownEntrance = {
  initial: { opacity: 0, y: -12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: {
    duration: 0.3,
    ease: [0, 0, 0.2, 1],
  },
} as const;

/** Error banner slide-down */
export const bannerSlideDown = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: 'easeOut' },
} as const;

/** Fade-out and collapse for daily profiling question after submit */
export const fadeCollapseVariants: Variants = {
  visible: { opacity: 1, height: 'auto' },
  hidden: {
    opacity: 0,
    height: 0,
    transition: {
      opacity: { duration: 0.2 },
      height: { duration: 0.3, delay: 0.1 },
    },
  },
};
