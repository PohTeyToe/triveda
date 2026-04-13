import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { pageTransitionProps } from '../../lib/animations';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/** Wraps page content with consistent enter/exit animation */
export function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <motion.div {...pageTransitionProps} className={className}>
      {children}
    </motion.div>
  );
}
