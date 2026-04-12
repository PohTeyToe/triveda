/**
 * ShareButton -- triggers Web Share API on supported platforms,
 * falls back to ShareModal on desktop browsers.
 */

import { Share2 } from 'lucide-react';
import { useState } from 'react';
import { trackShareCompleted, trackShareInitiated } from '../../lib/telemetry-events';
import { ShareModal } from './ShareModal';
import { buildShareText, buildShareUrl } from './share-utils';

interface ShareButtonProps {
  constitutionId: string;
  summary: string;
  className?: string;
}

export function ShareButton({ constitutionId, summary, className = '' }: ShareButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleClick = async () => {
    trackShareInitiated(constitutionId, 'native');

    // Try Web Share API first (mobile browsers)
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'My Triveda Constitution',
          text: buildShareText(summary, 'native'),
          url: buildShareUrl(constitutionId),
        });
        trackShareCompleted(constitutionId);
      } catch (err) {
        // AbortError means user cancelled -- not an error
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('[share] Web Share API error:', err);
        }
      }
      return;
    }

    // Fallback: open modal
    setModalOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Share your constitution"
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg
          text-teal bg-transparent hover:bg-teal/10
          transition-colors
          focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-dark
          ${className}
        `}
      >
        <Share2 className="w-4 h-4" />
        <span className="font-body">Share</span>
      </button>

      <ShareModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        constitutionId={constitutionId}
        summary={summary}
      />
    </>
  );
}
