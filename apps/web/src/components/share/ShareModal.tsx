/**
 * ShareModal -- desktop fallback for sharing a constitution.
 *
 * Options: Copy Link, Share on X, Share on LinkedIn, Instagram Story (mobile only).
 * Uses Framer Motion for enter/exit animations.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, ExternalLink, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { trackShareInitiated } from '../../lib/telemetry-events';
import {
  attemptInstagramStoryShare,
  buildLinkedInShareUrl,
  buildShareText,
  buildShareUrl,
  buildTwitterIntentUrl,
  isMobile,
} from './share-utils';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  constitutionId: string;
  summary: string;
}

export function ShareModal({ isOpen, onClose, constitutionId, summary }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [instagramMsg, setInstagramMsg] = useState('');
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  const shareUrl = buildShareUrl(constitutionId);

  // Focus first button on open
  useEffect(() => {
    if (isOpen) {
      // Small delay to let animation start
      const timer = setTimeout(() => firstButtonRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleCopyLink = useCallback(async () => {
    trackShareInitiated(constitutionId, 'clipboard');
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Fallback for browsers without clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [constitutionId, shareUrl]);

  const handleShareX = useCallback(() => {
    trackShareInitiated(constitutionId, 'twitter');
    const text = buildShareText(summary, 'twitter');
    window.open(buildTwitterIntentUrl(text, shareUrl), '_blank', 'noopener');
  }, [constitutionId, summary, shareUrl]);

  const handleShareLinkedIn = useCallback(() => {
    trackShareInitiated(constitutionId, 'linkedin');
    window.open(buildLinkedInShareUrl(shareUrl), '_blank', 'noopener');
  }, [constitutionId, shareUrl]);

  const handleInstagram = useCallback(async () => {
    trackShareInitiated(constitutionId, 'instagram');
    const opened = await attemptInstagramStoryShare(shareUrl);
    if (!opened) {
      setInstagramMsg('Link copied! Open Instagram and paste it in your Story.');
      setTimeout(() => setInstagramMsg(''), 4000);
    }
  }, [constitutionId, shareUrl]);

  const showMobile = isMobile();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Share your constitution"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
          >
            <div className="bg-dark-surface border border-dark-border rounded-xl p-5 w-full max-w-sm pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-body text-lg font-medium text-light">
                  Share your constitution
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close share dialog"
                  className="p-1 rounded-lg hover:bg-dark-border/50 transition-colors text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Share options */}
              <div className="space-y-2">
                {/* Copy Link */}
                <button
                  ref={firstButtonRef}
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    hover:bg-dark-border/30 transition-colors text-left
                    focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-1"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-teal shrink-0" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-400 shrink-0" />
                  )}
                  <span className="font-body text-sm text-light">
                    {copied ? 'Copied!' : 'Copy Link'}
                  </span>
                </button>

                {/* Share on X */}
                <button
                  type="button"
                  onClick={handleShareX}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    hover:bg-dark-border/30 transition-colors text-left
                    focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-1"
                >
                  <ExternalLink className="w-5 h-5 text-gray-400 shrink-0" />
                  <span className="font-body text-sm text-light">Share on X</span>
                </button>

                {/* Share on LinkedIn */}
                <button
                  type="button"
                  onClick={handleShareLinkedIn}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    hover:bg-dark-border/30 transition-colors text-left
                    focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-1"
                >
                  <ExternalLink className="w-5 h-5 text-gray-400 shrink-0" />
                  <span className="font-body text-sm text-light">Share on LinkedIn</span>
                </button>

                {/* Instagram Story (mobile only) */}
                {showMobile && (
                  <div>
                    <button
                      type="button"
                      onClick={handleInstagram}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
                        hover:bg-dark-border/30 transition-colors text-left
                        focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-1"
                    >
                      <ExternalLink className="w-5 h-5 text-gray-400 shrink-0" />
                      <span className="font-body text-sm text-light">Share to Instagram Story</span>
                    </button>
                    {instagramMsg && (
                      <p className="px-4 py-1 text-xs text-teal font-body">{instagramMsg}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
