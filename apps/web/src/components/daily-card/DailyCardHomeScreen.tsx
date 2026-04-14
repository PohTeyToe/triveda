/**
 * DailyCardHomeScreen -- top-level shell component composing all
 * Daily Card sub-components. Wrapped in ErrorBoundary.
 */

import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';
import { useDailyFood } from '../../hooks/useDailyFood';
import { useDemoDay } from '../../hooks/useDemoDay';
import { slideDownEntrance } from '../../lib/animations';
import { DailyProfilingQuestion } from '../onboarding/DailyProfilingQuestion';
import { TriggeredRecsBanner } from '../triggered/TriggeredRecsBanner';
import { DailyCardErrorFallback } from './DailyCardErrorBoundary';
import { DailyCardHeader } from './DailyCardHeader';
import { DailyFoodCard } from './DailyFoodCard';
import { DayTravelControl } from './DayTravelControl';
import { SkeletonDailyCard } from './SkeletonDailyCard';
import { TwentyTwoFeatureCreditRow } from './TwentyTwoFeatureCreditRow';
import { WhyPanel } from './WhyPanel';

type DailyCardHomeScreenProps = {
  userId?: string;
  authToken?: string;
  apiUrl?: string;
};

export function DailyCardHomeScreen({ userId, authToken, apiUrl }: DailyCardHomeScreenProps) {
  const demoDay = useDemoDay(apiUrl, authToken);

  return (
    <ErrorBoundary FallbackComponent={DailyCardErrorFallback}>
      <DailyCardContent userId={userId} authToken={authToken} apiUrl={apiUrl} demoDay={demoDay} />
      <Toaster position="bottom-center" />
    </ErrorBoundary>
  );
}

// ---------------------------------------------------------------------------
// Inner content
// ---------------------------------------------------------------------------

function DailyCardContent({
  userId,
  authToken,
  apiUrl,
  demoDay,
}: DailyCardHomeScreenProps & { demoDay: ReturnType<typeof useDemoDay> }) {
  const { data, isPending } = useDailyFood(userId, demoDay.day);
  const [creditRowVisible, setCreditRowVisible] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const handleWhyFirstOpen = () => {
    setCreditRowVisible(true);
  };

  return (
    <main className="pb-28">
      <LayoutGroup>
        {isPending || !data ? (
          <SkeletonDailyCard />
        ) : (
          <>
            <TriggeredRecsBanner />

            <DailyProfilingQuestion />

            <motion.div {...slideDownEntrance}>
              <p
                className="font-body text-xs uppercase tracking-[0.18em] text-teal/70 pt-4"
                data-testid="daily-greeting"
              >
                {greeting}
              </p>
              <DailyCardHeader
                date={data.date}
                seasonLabel={data.seasonLabel}
                weatherSummary={data.weatherSummary}
              />
            </motion.div>

            {/* aria-live region for screen reader announcements on day change */}
            <div aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.div
                  key={demoDay.day}
                  initial={{
                    x: demoDay.direction === 'forward' ? 80 : -80,
                    opacity: 0,
                  }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{
                    x: demoDay.direction === 'forward' ? -80 : 80,
                    opacity: 0,
                  }}
                  transition={{
                    type: 'tween',
                    duration: 0.25,
                  }}
                >
                  <div className="mt-4">
                    <DailyFoodCard
                      food={data.food}
                      rationale={data.rationale}
                      suggestionId={data.suggestionId}
                      feedbackState={data.feedback}
                      userId={userId}
                      demoDay={demoDay.day}
                      apiUrl={apiUrl}
                      authToken={authToken}
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Why panel */}
            <div className="mt-4">
              <WhyPanel
                convergence={data.convergence}
                demoDay={demoDay.day}
                onFirstOpen={handleWhyFirstOpen}
              />
            </div>

            {/* Credit row -- visible after first Why panel open */}
            <TwentyTwoFeatureCreditRow credits={data.credits} visible={creditRowVisible} />
          </>
        )}
      </LayoutGroup>

      {/* Day travel control (demo only) */}
      <div className="mt-8">
        <DayTravelControl demoDay={demoDay} />
      </div>

      {/* Brand footer */}
      <footer className="mt-10 pt-6 border-t border-cream/10 text-center" data-testid="home-footer">
        <p className="font-body text-[11px] uppercase tracking-[0.22em] text-cream/35">
          Powered by three traditions
        </p>
        <p className="font-heading text-sm italic text-cream/50 mt-1.5">
          Ayurveda · Traditional Chinese Medicine · Naturopathy
        </p>
      </footer>
    </main>
  );
}
