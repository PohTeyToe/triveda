/**
 * Expandable/collapsible tradition section within the Constitution Card.
 *
 * Collapsed titles use plain English (no tradition names).
 * Framer Motion height animation for expand/collapse.
 * Focus management: content on expand, toggle on collapse.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

interface ConstitutionSectionProps {
  title: string;
  content: string;
  defaultExpanded: boolean;
  sectionId: string;
}

export function ConstitutionSection({
  title,
  content,
  defaultExpanded,
  sectionId,
}: ConstitutionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const titleId = useId();
  const contentRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip focus management on initial render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (isExpanded) {
      contentRef.current?.focus();
    } else {
      toggleRef.current?.focus();
    }
  }, [isExpanded]);

  return (
    <div className="border-b border-gray-200 dark:border-dark-border last:border-b-0">
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        aria-controls={sectionId}
        className="w-full flex items-center justify-between py-3 px-1 text-left
          hover:bg-gray-100 dark:hover:bg-dark-surface/50 rounded-lg
          transition-colors focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"
      >
        <span id={titleId} className="font-body text-lg font-semibold text-dark dark:text-light">
          {title}
        </span>
        <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.span>
      </button>

      <AnimatePresence initial={defaultExpanded}>
        {isExpanded && (
          <motion.section
            id={sectionId}
            aria-labelledby={titleId}
            ref={contentRef}
            tabIndex={-1}
            initial={defaultExpanded ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden outline-none"
          >
            <p className="font-body text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed pb-4 px-1">
              {content}
            </p>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
