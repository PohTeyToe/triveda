import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { type ReactNode, useState } from 'react';

interface TraditionSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: ReactNode;
  id: string;
}

export function TraditionSection({
  title,
  defaultExpanded = true,
  children,
  id,
}: TraditionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentId = `${id}-content`;

  return (
    <div className="border-b border-dark-border last:border-b-0">
      <button
        type="button"
        id={id}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between py-3 px-1 text-left focus:outline-none focus:ring-2 focus:ring-teal rounded"
      >
        <span className="font-heading text-lg font-bold">{title}</span>
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-light/40"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={contentId}
            role="region"
            aria-labelledby={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-4 px-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
