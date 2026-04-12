/**
 * DailyCardHomeScreen -- top-level shell component composing all
 * Daily Card sub-components. Wrapped in ErrorBoundary and
 * TraditionStreamProvider.
 */

import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';
import { TraditionStreamProvider } from '../../contexts/TraditionStreamContext';
import { useDailyFood } from '../../hooks/useDailyFood';
import { useDemoDay } from '../../hooks/useDemoDay';
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
      <TraditionStreamProvider
        userId={userId}
        demoDay={demoDay.day}
        authToken={authToken}
        apiUrl={apiUrl}
      >
        <DailyCardContent userId={userId} authToken={authToken} apiUrl={apiUrl} demoDay={demoDay} />
      </TraditionStreamProvider>
      <Toaster position="bottom-center" />
    </ErrorBoundary>
  );
}

// ---------------------------------------------------------------------------
// Inner content (needs TraditionStreamProvider above)
// ---------------------------------------------------------------------------

function DailyCardContent({
  userId,
  authToken,
  apiUrl,
  demoDay,
}: DailyCardHomeScreenProps & { demoDay: ReturnType<typeof useDemoDay> }) {
  const { data, isPending } = useDailyFood(userId, demoDay.day);
  const [creditRowVisible, setCreditRowVisible] = useState(false);

  const handleWhyFirstOpen = () => {
    setCreditRowVisible(true);
  };

  return (
    <main>
      <div className="max-w-2xl mx-auto">
        <LayoutGroup>
          {isPending || !data ? (
            <SkeletonDailyCard />
          ) : (
            <>
              <DailyCardHeader
                date={data.date}
                seasonLabel={data.seasonLabel}
                weatherSummary={data.weatherSummary}
              />

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
                    <div className="mt-3">
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
              <div className="mt-3">
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
        <DayTravelControl demoDay={demoDay} />
      </div>
    </main>
  );
}
