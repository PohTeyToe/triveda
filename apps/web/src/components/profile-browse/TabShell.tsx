import { motion } from 'framer-motion';
import { type ReactNode, useCallback, useRef } from 'react';

interface TabShellProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: ReactNode;
}

export function TabShell({ tabs, activeTab, onTabChange, children }: TabShellProps) {
  const tabsRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const container = tabsRef.current;
      if (!container) return;
      const buttons = container.querySelectorAll<HTMLButtonElement>('[role="tab"]');

      let nextIndex: number | null = null;
      if (e.key === 'ArrowRight') {
        nextIndex = (index + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = tabs.length - 1;
      }

      if (nextIndex !== null) {
        e.preventDefault();
        const nextTab = tabs[nextIndex];
        if (nextTab) {
          onTabChange(nextTab.id);
          buttons[nextIndex]?.focus();
        }
      }
    },
    [tabs, onTabChange],
  );

  const panelId = `tabpanel-${activeTab}`;

  return (
    <div>
      <div
        ref={tabsRef}
        role="tablist"
        className="flex gap-1 bg-dark-surface-low rounded-xl p-1 mb-4"
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`relative rounded-lg px-4 py-2 font-body text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-teal min-h-[44px] flex-1 ${
                isActive ? 'text-dark' : 'text-cream/50 hover:text-cream/70'
              }`}
            >
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-0 bg-teal rounded-lg -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div id={panelId} role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {children}
      </div>
    </div>
  );
}
