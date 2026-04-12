/**
 * CaptureAnimation -- 3-second progress ring with flash effect.
 *
 * Uses Framer Motion for the SVG stroke animation and a white flash
 * overlay at the 2.5-second mark.
 */

import { AnimatePresence, motion } from 'framer-motion';

type CaptureAnimationProps = {
  isActive: boolean;
  onComplete: () => void;
};

const RING_SIZE = 280;
const STROKE_WIDTH = 4;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CaptureAnimation({ isActive, onComplete }: CaptureAnimationProps) {
  return (
    <AnimatePresence>
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Progress ring */}
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            className="absolute"
            role="img"
            aria-label="Capture progress"
          >
            <title>Capture progress ring</title>
            <motion.circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="rgb(20 184 166)" /* teal-500 */
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 3, ease: 'linear' }}
              onAnimationComplete={onComplete}
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
            />
          </svg>

          {/* White flash at 2.5s mark */}
          <motion.div
            className="absolute inset-0 rounded-full bg-white"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0, 0, 0.8, 0],
            }}
            transition={{
              duration: 3,
              times: [0, 0.8, 0.833, 0.85, 1],
              ease: 'linear',
            }}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
