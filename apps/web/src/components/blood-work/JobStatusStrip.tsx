/**
 * JobStatusStrip -- pipeline stage visualization during processing.
 * Shows stages as a horizontal stepper (desktop) or vertical (mobile).
 * Auto-navigates to results on completion.
 */

import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useBloodWorkJob } from '../../hooks/useBloodWorkJob';

interface JobStatusStripProps {
  jobId: string;
  reportId: string;
  fileName: string;
}

const STAGES = [
  'Upload',
  'Extract Text',
  'Detect Vendor',
  'Map Biomarkers',
  'Compute Influences',
  'Done',
] as const;

function getActiveStageIndex(stage: string | null, status: string): number {
  if (status === 'complete') return STAGES.length - 1;
  if (status === 'failed') return -1;
  if (!stage) return 0;

  const stageMap: Record<string, number> = {
    extracting_text: 1,
    detecting_vendor: 2,
    mapping_biomarkers: 3,
    computing_influences: 4,
  };

  return stageMap[stage] ?? 0;
}

export function JobStatusStrip({ jobId, reportId, fileName }: JobStatusStripProps) {
  const navigate = useNavigate();
  const { data: job } = useBloodWorkJob(jobId);

  const status = job?.status ?? 'pending';
  const activeIndex = getActiveStageIndex(job?.stage ?? null, status);
  const isComplete = status === 'complete';
  const isFailed = status === 'failed';

  // Auto-navigate to results on completion
  useEffect(() => {
    if (isComplete && reportId) {
      const timer = setTimeout(() => {
        navigate({ to: '/blood-work', search: { view: '', report: reportId } });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, reportId, navigate]);

  return (
    <div className="rounded-xl border border-dark-border/30 dark:border-dark-border p-4 bg-dark-surface/50 dark:bg-dark-surface/50">
      <p className="text-xs text-light/40 dark:text-light/40 mb-3 truncate">{fileName}</p>

      {/* Stage stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STAGES.map((label, i) => {
          const isActive = i === activeIndex && !isComplete && !isFailed;
          const isDone = i < activeIndex || isComplete;

          return (
            <div key={label} className="flex items-center gap-1">
              {/* Stage dot */}
              <div className="flex flex-col items-center gap-1">
                <div className="relative">
                  {isDone ? (
                    <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-3.5 h-3.5 text-teal-400"
                        aria-hidden="true"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                  ) : isActive ? (
                    <motion.div
                      className="w-6 h-6 rounded-full bg-teal-500/30 flex items-center justify-center"
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                    </motion.div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-dark-border/30 dark:bg-dark-border/30 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-light/20 dark:bg-light/20" />
                    </div>
                  )}
                </div>
                <span
                  className={`text-[10px] whitespace-nowrap ${
                    isDone || isActive ? 'text-teal-400' : 'text-light/30 dark:text-light/30'
                  }`}
                >
                  {label}
                </span>
              </div>

              {/* Connector line */}
              {i < STAGES.length - 1 && (
                <div
                  className={`w-4 h-px mt-[-14px] ${
                    isDone ? 'bg-teal-500/40' : 'bg-dark-border/30 dark:bg-dark-border/30'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Error message */}
      {isFailed && job?.errorMessage && (
        <div className="mt-3 text-sm text-red-400" role="alert">
          {job.errorMessage}
        </div>
      )}

      {/* Completion message */}
      {isComplete && (
        <p className="mt-3 text-sm text-emerald-400">
          Processing complete. Redirecting to results...
        </p>
      )}
    </div>
  );
}
