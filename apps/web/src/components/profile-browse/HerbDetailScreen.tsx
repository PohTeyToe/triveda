import { useNavigate } from '@tanstack/react-router';
import { AlertTriangle } from 'lucide-react';
import { useHerbDetail, useProfile } from '../../hooks/profile-browse';
import type { BrowseHerb } from '../../lib/types';
import { ChipScroller } from './ChipScroller';
import { DetailLayout } from './DetailLayout';
import { getDominantDosha, getHerbPersonalization } from './personalization-templates';

// ---- Ayurveda Section ----

function AyurvedaContent({ herb }: { herb: BrowseHerb }) {
  return (
    <div className="space-y-4">
      {herb.rasa?.length ? (
        <div>
          <p className="text-xs text-light/40 mb-1">Rasa (Taste)</p>
          <div className="flex flex-wrap gap-1">
            {herb.rasa.map((r) => (
              <span
                key={r}
                className="text-xs px-2.5 py-1 rounded-full bg-dark-border text-light/70 capitalize"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {herb.virya && (
        <div>
          <p className="text-xs text-light/40 mb-1">Virya (Potency)</p>
          <span
            className={`text-xs px-2.5 py-1 rounded-full capitalize ${
              herb.virya === 'ushna'
                ? 'bg-terracotta/20 text-terracotta'
                : 'bg-blue-400/20 text-blue-400'
            }`}
          >
            {herb.virya === 'ushna'
              ? 'Ushna (heating)'
              : herb.virya === 'sheeta'
                ? 'Sheeta (cooling)'
                : herb.virya}
          </span>
        </div>
      )}

      {herb.vipaka && (
        <div>
          <p className="text-xs text-light/40 mb-1">Vipaka (Post-digestive)</p>
          <span className="text-xs px-2.5 py-1 rounded-full bg-dark-border text-light/70 capitalize">
            {herb.vipaka}
          </span>
        </div>
      )}

      {herb.guna?.length ? (
        <div>
          <p className="text-xs text-light/40 mb-1">Guna (Qualities)</p>
          <ChipScroller>
            {herb.guna.map((g) => (
              <li
                key={g}
                className="text-xs px-2.5 py-1 rounded-full bg-dark-border text-light/70 snap-start shrink-0 capitalize list-none"
              >
                {g}
              </li>
            ))}
          </ChipScroller>
        </div>
      ) : null}

      {/* Prabhava (special potency) */}
      {herb.prabhava && (
        <div className="bg-teal/10 border border-teal/20 rounded-lg p-3">
          <p className="text-xs text-teal font-medium">Special potency (Prabhava)</p>
          <p className="text-sm text-light/70 mt-1">{herb.prabhava}</p>
        </div>
      )}

      {herb.dosha_effects && (
        <div>
          <p className="text-xs text-light/40 mb-1">Dosha Effects</p>
          <div className="space-y-1.5">
            {Object.entries(herb.dosha_effects).map(([dosha, effect]) => (
              <div key={dosha} className="flex items-center gap-2">
                <span className="text-xs text-light/60 w-12 capitalize">{dosha}</span>
                <div className="flex-1 h-2 bg-dark-border rounded-full relative overflow-hidden">
                  <div
                    className={`absolute top-0 h-full rounded-full ${
                      effect < 0
                        ? 'bg-green right-1/2'
                        : effect > 0
                          ? 'bg-red-400 left-1/2'
                          : 'bg-light/20'
                    }`}
                    style={{ width: `${Math.abs(effect) * 25}%` }}
                  />
                  <div className="absolute left-1/2 top-0 w-px h-full bg-light/20" />
                </div>
                <span className="text-xs text-light/40 w-6 text-right">
                  {effect > 0 ? `+${effect}` : effect}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- TCM Section ----

function TcmContent({ herb }: { herb: BrowseHerb }) {
  const thermalColors: Record<string, string> = {
    hot: 'bg-red-500/20 text-red-400',
    warm: 'bg-orange-500/20 text-orange-400',
    neutral: 'bg-gray-500/20 text-gray-400',
    cool: 'bg-blue-400/20 text-blue-400',
    cold: 'bg-blue-600/20 text-blue-300',
  };

  return (
    <div className="space-y-4">
      {herb.thermal_nature && (
        <div>
          <p className="text-xs text-light/40 mb-1">Thermal Nature</p>
          <span
            className={`text-xs px-2.5 py-1 rounded-full capitalize ${
              thermalColors[herb.thermal_nature.toLowerCase()] ?? 'bg-dark-border text-light/70'
            }`}
          >
            {herb.thermal_nature}
          </span>
        </div>
      )}

      {herb.tcm_flavor?.length ? (
        <div>
          <p className="text-xs text-light/40 mb-1">Flavor</p>
          <div className="flex flex-wrap gap-1">
            {herb.tcm_flavor.map((f) => (
              <span
                key={f}
                className="text-xs px-2.5 py-1 rounded-full bg-dark-border text-light/70 capitalize"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {herb.organ_affinity?.length ? (
        <div>
          <p className="text-xs text-light/40 mb-1">Organ Affinity</p>
          <div className="flex flex-wrap gap-1">
            {herb.organ_affinity.map((o) => (
              <span
                key={o}
                className="text-xs px-2.5 py-1 rounded-full bg-dark-border text-light/70 capitalize"
              >
                {o}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {herb.tcm_actions?.length ? (
        <div>
          <p className="text-xs text-light/40 mb-1">Actions</p>
          <div className="flex flex-wrap gap-1">
            {herb.tcm_actions.map((a) => (
              <span
                key={a}
                className="text-xs px-2.5 py-1 rounded-full bg-dark-border text-light/70"
              >
                {a.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ---- Naturopathy Section ----

function NaturopathyContent({ herb }: { herb: BrowseHerb }) {
  const evidenceLevelStyle: Record<string, string> = {
    strong: 'bg-green/20 text-green',
    moderate: 'bg-teal/20 text-teal',
    emerging: 'bg-amber-500/20 text-amber-400',
    'traditional only': 'bg-dark-border text-light/50',
  };

  return (
    <div className="space-y-4">
      {/* Herb actions */}
      {herb.herb_actions?.length ? (
        <div>
          <p className="text-xs text-light/40 mb-1">Herb Actions</p>
          <div className="flex flex-wrap gap-1">
            {herb.herb_actions.map((a) => (
              <span
                key={a}
                className="text-xs px-2.5 py-1 rounded-full bg-teal/20 text-teal capitalize"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Dosage forms */}
      {herb.dosage_forms?.length ? (
        <div>
          <p className="text-xs text-light/40 mb-1">Dosage Forms</p>
          <div className="flex flex-wrap gap-1">
            {herb.dosage_forms.map((d) => (
              <span
                key={d}
                className="text-xs px-2.5 py-1 rounded-full bg-dark-border text-light/70 capitalize"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Pregnancy safety */}
      {herb.pregnancy_safety && (
        <div>
          <p className="text-xs text-light/40 mb-1">Pregnancy Safety</p>
          <span
            className={`text-xs px-2.5 py-1 rounded-full ${
              herb.pregnancy_safety.toLowerCase() === 'safe'
                ? 'bg-green/20 text-green'
                : herb.pregnancy_safety.toLowerCase() === 'caution'
                  ? 'bg-amber-500/20 text-amber-400'
                  : herb.pregnancy_safety.toLowerCase() === 'contraindicated'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-dark-border text-light/50'
            }`}
          >
            {herb.pregnancy_safety}
          </span>
        </div>
      )}

      {/* Contraindications */}
      {herb.contraindications?.length ? (
        <div>
          <p className="text-xs text-light/40 mb-1">Contraindications</p>
          <ul className="space-y-1">
            {herb.contraindications.map((c) => (
              <li key={c} className="flex items-start gap-2 text-xs text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Bioactive Compounds */}
      {herb.bioactive_compounds?.length ? (
        <div>
          <p className="text-xs text-light/40 mb-1">Bioactive Compounds</p>
          <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs">
            <span className="text-light/40 font-medium">Compound</span>
            <span className="text-light/40 font-medium">Amount</span>
            <span className="text-light/40 font-medium">Unit</span>
            {herb.bioactive_compounds.slice(0, 5).map((c) => (
              <div key={c.name} className="contents">
                <span className="text-light/70">{c.name}</span>
                <span className="text-light/70">{c.amount}</span>
                <span className="text-light/70">{c.unit}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Evidence Claims */}
      {herb.evidence_claims?.length ? (
        <div>
          <p className="text-xs text-light/40 mb-1">Evidence-Based Claims</p>
          <div className="space-y-2">
            {herb.evidence_claims.map((claim) => (
              <div key={claim.claim} className="flex items-start gap-2">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
                    evidenceLevelStyle[claim.level.toLowerCase()] ?? 'bg-dark-border text-light/50'
                  }`}
                >
                  {claim.level}
                </span>
                <div>
                  <p className="text-xs text-light/70">{claim.claim}</p>
                  {claim.citation && (
                    <p className="text-[10px] text-light/40 mt-0.5">
                      {claim.pubmed_id ? (
                        <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/${claim.pubmed_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal hover:underline"
                        >
                          {claim.citation}
                        </a>
                      ) : (
                        claim.citation
                      )}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ---- Skeleton ----

function DetailSkeleton() {
  return (
    <div className="py-6 max-w-2xl mx-auto animate-pulse">
      <div className="h-4 bg-dark-border rounded w-24 mb-6" />
      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        <div className="w-[200px] h-[200px] rounded-2xl bg-dark-border self-center sm:self-start" />
        <div className="space-y-3 flex-1">
          <div className="h-8 bg-dark-border rounded w-48" />
          <div className="h-4 bg-dark-border rounded w-32" />
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-dark-surface border border-dark-border rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ---- Main Screen ----

interface HerbDetailScreenProps {
  herbId: string;
}

export function HerbDetailScreen({ herbId }: HerbDetailScreenProps) {
  const navigate = useNavigate();
  const { data: herb, isLoading, isError, error, refetch } = useHerbDetail(herbId);
  const { data: profile } = useProfile();

  if (isLoading) return <DetailSkeleton />;

  if (isError || !herb) {
    return (
      <div className="py-6 text-center">
        <p className="text-red-400 mb-4">
          {error?.message ?? 'Something went wrong loading this herb.'}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-sm text-teal hover:text-teal-soft transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  // Personalization
  let personalizedPanel: React.ReactNode = null;
  const profileWithDosha = profile as typeof profile & {
    dosha_ratios?: { vata: number; pitta: number; kapha: number };
  };

  if (profileWithDosha) {
    const dominantDosha = getDominantDosha(profileWithDosha.dosha_ratios);
    const text = getHerbPersonalization({
      dominantDosha,
      thermalNature: herb.virya ?? herb.thermal_nature ?? null,
      foodName: herb.name,
      herbActions: herb.herb_actions ?? undefined,
    });
    if (text) {
      personalizedPanel = <p className="text-sm text-light/70">{text}</p>;
    }
  }

  const traditions = herb.traditions?.length ? herb.traditions : ['Ayurveda', 'TCM', 'Naturopathy'];

  const sources = herb.sources ?? [{ name: 'Bhavaprakash' }];

  return (
    <DetailLayout
      name={herb.name}
      imageUrl={herb.image_url}
      category={herb.category}
      subcategory={herb.subcategory}
      traditions={traditions}
      ayurvedaSection={<AyurvedaContent herb={herb} />}
      tcmSection={<TcmContent herb={herb} />}
      naturopathySection={<NaturopathyContent herb={herb} />}
      sources={sources}
      confidenceScore={herb.confidence_score ?? 0.85}
      personalizedPanel={personalizedPanel}
      backLabel="Back to herbs"
      onBack={() => navigate({ to: '/browse', search: { tab: 'herbs', food: '', herb: '' } })}
    />
  );
}
