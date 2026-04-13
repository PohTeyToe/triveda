import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { welcomeItem, welcomeStagger } from '../../lib/animations';
import { LeafIcon } from '../layout/LeafIcon';

export function WelcomeLandingScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0e0d] px-6">
      <motion.div
        className="flex flex-col items-center w-full max-w-sm"
        variants={welcomeStagger}
        initial="hidden"
        animate="visible"
      >
        {/* Leaf icon with pulse */}
        <motion.div variants={welcomeItem}>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          >
            <LeafIcon className="w-12 h-12 text-teal" />
          </motion.div>
        </motion.div>

        {/* Wordmark */}
        <motion.h1
          variants={welcomeItem}
          className="mt-6 font-heading text-3xl font-bold text-teal tracking-[-0.02em]"
        >
          Triveda
        </motion.h1>

        {/* Tagline */}
        <motion.p variants={welcomeItem} className="mt-3 font-body text-base text-cream/60">
          Your daily food companion
        </motion.p>

        {/* Spacer */}
        <motion.div variants={welcomeItem} className="mt-12 w-full">
          <button
            type="button"
            onClick={() => navigate({ to: '/quick-start' })}
            className="w-full min-h-[48px] rounded-2xl bg-teal text-dark font-body font-medium text-base transition hover:bg-teal-soft"
          >
            Get Started
          </button>
        </motion.div>

        {/* Sign in link */}
        <motion.p
          variants={welcomeItem}
          className="mt-4 font-body text-sm text-cream/40 transition hover:text-teal"
        >
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate({ to: '/login' })}
            className="underline underline-offset-2 cursor-pointer"
          >
            Sign in
          </button>
        </motion.p>
      </motion.div>
    </div>
  );
}
