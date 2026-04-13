/**
 * Shared Framer Motion animation presets.
 * Centralizes animation config so it is not scattered across components.
 *
 * Design system: "Vedic Manuscript" -- expressive easing, spring physics,
 * staggered children. 300ms base duration, cubic-bezier(0.4, 0, 0.2, 1).
 */

import type { Variants } from 'framer-motion';

/** Expressive easing used across the design system */
const expressiveEase = [0.4, 0, 0.2, 1] as const;

/** Page-level route transition (AnimatePresence in root layout) */
export const pageTransitionProps = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: {
    duration: 0.3,
    ease: expressiveEase,
  },
} as const;

/** Spring config for card entrances */
export const cardSpring = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};

/** Card entrance (home food card, constitution card) */
export const cardEntranceProps = {
  initial: { opacity: 0, y: 20, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: cardSpring,
} as const;

/** Staggered children container */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/** Staggered child item */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: expressiveEase },
  },
};

/** Question slide transition (onboarding) -- slide left for next, right for prev */
export const questionSlide = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
};

export const questionSlideTransition = {
  x: { type: 'spring' as const, stiffness: 300, damping: 30 },
  opacity: { duration: 0.2 },
};

/** Constitution reveal -- scale-up spring + staggered children */
export const constitutionRevealProps = {
  initial: { opacity: 0, scale: 0.92, y: 24 },
  animate: { opacity: 1, scale: 1, y: 0 },
  transition: {
    type: 'spring' as const,
    stiffness: 260,
    damping: 24,
    mass: 0.8,
  },
} as const;

/** Section expand/collapse (Why? traditions, constitution sections) */
export const sectionExpandProps = {
  initial: false as const,
  animate: (isExpanded: boolean) => ({
    height: isExpanded ? 'auto' : 0,
  }),
  transition: {
    duration: 0.3,
    ease: expressiveEase,
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

/** Food card tap feedback */
export const foodCardTap = {
  whileTap: { scale: 0.98 },
  transition: { duration: 0.1 },
} as const;

/** Bottom nav slide-up on first render */
export const bottomNavEntrance = {
  initial: { y: 80 },
  animate: { y: 0 },
  transition: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
    delay: 0.2,
  },
} as const;

/** Welcome screen staggered entrance */
export const welcomeStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

export const welcomeItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: expressiveEase,
    },
  },
};
