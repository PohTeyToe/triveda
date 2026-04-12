import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { ChipScroller } from './ChipScroller';
import { ConfidenceBadge } from './ConfidenceBadge';
import { GlyphFallback } from './GlyphFallback';
import type { SourceCitationRowProps } from './SourceCitationRow';
import { SourceCitationRow } from './SourceCitationRow';
import { TraditionSection } from './TraditionSection';

interface DetailLayoutProps {
  name: string;
  imageUrl?: string | null;
  category: string;
  subcategory?: string | null;
  traditions: string[];
  ayurvedaSection: ReactNode;
  tcmSection: ReactNode;
  naturopathySection: ReactNode;
  sources: SourceCitationRowProps['sources'];
  confidenceScore: number;
  personalizedPanel?: ReactNode;
  relatedItems?: ReactNode;
  backLabel: string;
  onBack: () => void;
}

export function DetailLayout({
  name,
  imageUrl,
  category,
  subcategory,
  traditions,
  ayurvedaSection,
  tcmSection,
  naturopathySection,
  sources,
  confidenceScore,
  personalizedPanel,
  relatedItems,
  backLabel,
  onBack,
}: DetailLayoutProps) {
  return (
    <div className="py-6 max-w-2xl mx-auto">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-light/50 hover:text-teal transition-colors mb-6 focus:outline-none focus:ring-2 focus:ring-teal rounded"
      >
        <ArrowLeft className="w-4 h-4" />
        {backLabel}
      </button>

      {/* Hero section */}
      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-[200px] h-[200px] rounded-2xl object-cover shrink-0 self-center sm:self-start"
          />
        ) : (
          <div className="self-center sm:self-start">
            <GlyphFallback name={name} category={category} size={200} />
          </div>
        )}

        <div className="flex flex-col justify-center text-center sm:text-left">
          <h1 className="font-heading text-3xl font-bold">{name}</h1>
          <p className="text-light/50 capitalize mt-1">
            {category}
            {subcategory ? ` / ${subcategory}` : ''}
          </p>

          {/* Tradition chips */}
          <div className="mt-3">
            <ChipScroller>
              {traditions.map((t) => (
                <li
                  key={t}
                  className="text-xs px-3 py-1 rounded-full bg-dark-border text-light/60 snap-start shrink-0 list-none"
                >
                  {t}
                </li>
              ))}
            </ChipScroller>
          </div>
        </div>
      </div>

      {/* Personalized panel */}
      {personalizedPanel && (
        <div className="border-l-2 border-teal bg-teal/5 rounded-r-xl p-4 mb-6">
          <p className="text-xs text-teal font-medium uppercase tracking-wide mb-1">
            Why this matters for you
          </p>
          {personalizedPanel}
        </div>
      )}

      {/* Tradition sections */}
      <div className="space-y-1 mb-8">
        <TraditionSection title="Ayurveda" id="detail-ayurveda" defaultExpanded>
          {ayurvedaSection}
        </TraditionSection>
        <TraditionSection title="Traditional Chinese Medicine" id="detail-tcm" defaultExpanded>
          {tcmSection}
        </TraditionSection>
        <TraditionSection title="Naturopathy" id="detail-naturopathy" defaultExpanded>
          {naturopathySection}
        </TraditionSection>
      </div>

      {/* Source citations + confidence */}
      <div className="space-y-3 mb-8">
        <p className="text-xs text-light/40 font-medium uppercase tracking-wide">Sources</p>
        <SourceCitationRow sources={sources} />
        <ConfidenceBadge score={confidenceScore} />
      </div>

      {/* Related items */}
      {relatedItems && (
        <div>
          <p className="text-xs text-light/40 font-medium uppercase tracking-wide mb-3">Related</p>
          {relatedItems}
        </div>
      )}
    </div>
  );
}
