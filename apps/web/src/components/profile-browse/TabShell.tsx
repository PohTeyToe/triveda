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
      <div ref={tabsRef} role="tablist" className="flex gap-0 border-b border-dark-border mb-4">
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
              className={`relative px-6 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-teal rounded-t ${
                isActive ? 'text-teal' : 'text-light/50 hover:text-light/70'
              }`}
            >
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal"
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
