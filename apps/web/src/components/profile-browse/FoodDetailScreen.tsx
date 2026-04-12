import { useNavigate } from '@tanstack/react-router';
import { useFoodDetail, useProfile } from '../../hooks/profile-browse';
import type { BrowseFood } from '../../lib/types';
import { ChipScroller } from './ChipScroller';
import { DetailLayout } from './DetailLayout';
import { getDominantDosha, getFoodPersonalization } from './personalization-templates';

// ---- Ayurveda Section ----

function AyurvedaContent({ food }: { food: BrowseFood }) {
  return (
    <div className="space-y-4">
      {/* Rasa */}
      {food.rasa?.length ? (
        <div>
          <p className="text-xs text-light/40 mb-1">Rasa (Taste)</p>
          <div className="flex flex-wrap gap-1">
            {food.rasa.map((r) => (
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

      {/* Virya */}
      {food.virya && (
        <div>
          <p className="text-xs text-light/40 mb-1">Virya (Potency)</p>
          <span
            className={`text-xs px-2.5 py-1 rounded-full capitalize ${
              food.virya === 'ushna'
                ? 'bg-terracotta/20 text-terracotta'
                : 'bg-blue-400/20 text-blue-400'
            }`}
          >
            {food.virya === 'ushna'
              ? 'Ushna (heating)'
              : food.virya === 'sheeta'
                ? 'Sheeta (cooling)'
                : food.virya}
          </span>
        </div>
      )}

      {/* Vipaka */}
      {food.vipaka && (
        <div>
          <p className="text-xs text-light/40 mb-1">Vipaka (Post-digestive)</p>
          <span className="text-xs px-2.5 py-1 rounded-full bg-dark-border text-light/70 capitalize">
            {food.vipaka}
          </span>
        </div>
      )}

      {/* Guna */}
      {food.guna?.length ? (
        <div>
          <p className="text-xs text-light/40 mb-1">Guna (Qualities)</p>
          <ChipScroller>
            {food.guna.map((g) => (
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

      {/* Dosha effects */}
      {food.dosha_effects && (
        <div>
          <p className="text-xs text-light/40 mb-1">Dosha Effects</p>
          <div className="space-y-1.5">
            {Object.entries(food.dosha_effects).map(([dosha, effect]) => (
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
                    style={{
                      width: `${Math.abs(effect) * 25}%`,
                    }}
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

      {/* Ritu scores */}
      {food.ritu_scores && Object.keys(food.ritu_scores).length > 0 && (
        <div>
          <p className="text-xs text-light/40 mb-1">Seasonal Fit (Ritu)</p>
          <div className="space-y-1">
            {Object.entries(food.ritu_scores).map(([ritu, score]) => (
              <div key={ritu} className="flex items-center gap-2">
                <span className="text-xs text-light/60 w-20 capitalize">{ritu}</span>
                <div className="flex-1 h-2 bg-dark-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      score > 0.7 ? 'bg-teal' : score >= 0.4 ? 'bg-amber-400' : 'bg-dark-border'
                    }`}
                    style={{ width: `${score * 100}%` }}
                  />
                </div>
                <span className="text-xs text-light/40 w-8 text-right">
                  {Math.round(score * 100)}%
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

function TcmContent({ food }: { food: BrowseFood }) {
  const thermalColors: Record<string, string> = {
    hot: 'bg-red-500/20 text-red-400',
    warm: 'bg-orange-500/20 text-orange-400',
    neutral: 'bg-gray-500/20 text-gray-400',
    cool: 'bg-blue-400/20 text-blue-400',
    cold: 'bg-blue-600/20 text-blue-300',
  };

  return (
    <div className="space-y-4">
      {food.thermal_nature && (
        <div>
          <p className="text-xs text-light/40 mb-1">Thermal Nature</p>
          <span
            className={`text-xs px-2.5 py-1 rounded-full capitalize ${
              thermalColors[food.thermal_nature.toLowerCase()] ?? 'bg-dark-border text-light/70'
            }`}
          >
            {food.thermal_nature}
          </span>
        </div>
      )}

      {food.tcm_flavor?.length ? (
        <div>
          <p className="text-xs text-light/40 mb-1">Flavor</p>
          <div className="flex flex-wrap gap-1">
            {food.tcm_flavor.map((f) => (
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

      {food.organ_affinity?.length ? (
        <div>
          <p className="text-xs text-light/40 mb-1">Organ Affinity</p>
          <div className="flex flex-wrap gap-1">
            {food.organ_affinity.map((o) => (
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

      {food.tcm_actions?.length ? (
        <div>
          <p className="text-xs text-light/40 mb-1">Actions</p>
          <div className="flex flex-wrap gap-1">
            {food.tcm_actions.map((a) => (
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

      {food.element_scores && Object.keys(food.element_scores).length > 0 && (
        <div>
          <p className="text-xs text-light/40 mb-1">Element Fit</p>
          <div className="flex gap-2">
            {Object.entries(food.element_scores).map(([el, score]) => {
              const elColors: Record<string, string> = {
                wood: 'bg-green',
                fire: 'bg-red-500',
                earth: 'bg-amber-400',
                metal: 'bg-gray-400',
                water: 'bg-blue-500',
              };
              return (
                <div key={el} className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center">
                    <div
                      className={`rounded-full ${elColors[el] ?? 'bg-dark-border'}`}
                      style={{ width: Math.max(8, score * 32), height: Math.max(8, score * 32) }}
                    />
                  </div>
                  <span className="text-[10px] text-light/40 capitalize">{el}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Naturopathy Section ----

function NaturopathyContent({ food }: { food: BrowseFood }) {
  const evidenceLevelStyle: Record<string, string> = {
    strong: 'bg-green/20 text-green',
    moderate: 'bg-teal/20 text-teal',
    emerging: 'bg-amber-500/20 text-amber-400',
    'traditional only': 'bg-dark-border text-light/50',
  };

  return (
    <div className="space-y-4">
      {/* Glycemic Index */}
      {food.glycemic_index != null && (
        <div>
          <p className="text-xs text-light/40 mb-1">Glycemic Index</p>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              food.glycemic_index <= 55
                ? 'bg-green/20 text-green'
                : food.glycemic_index <= 69
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-red-500/20 text-red-400'
            }`}
          >
            GI: {food.glycemic_index}
          </span>
        </div>
      )}

      {/* Bioactive Compounds */}
      {food.bioactive_compounds?.length ? (
        <div>
          <p className="text-xs text-light/40 mb-1">Bioactive Compounds</p>
          <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs">
            <span className="text-light/40 font-medium">Compound</span>
            <span className="text-light/40 font-medium">Amount</span>
            <span className="text-light/40 font-medium">Unit</span>
            {food.bioactive_compounds.slice(0, 5).map((c) => (
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
      {food.evidence_claims?.length ? (
        <div>
          <p className="text-xs text-light/40 mb-1">Evidence-Based Claims</p>
          <div className="space-y-2">
            {food.evidence_claims.map((claim) => (
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
          <div className="flex gap-2 mt-2">
            <div className="h-6 bg-dark-border rounded-full w-16" />
            <div className="h-6 bg-dark-border rounded-full w-16" />
          </div>
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

interface FoodDetailScreenProps {
  foodId: string;
}

export function FoodDetailScreen({ foodId }: FoodDetailScreenProps) {
  const navigate = useNavigate();
  const { data: food, isLoading, isError, error, refetch } = useFoodDetail(foodId);
  const { data: profile } = useProfile();

  if (isLoading) return <DetailSkeleton />;

  if (isError || !food) {
    return (
      <div className="py-6 text-center">
        <p className="text-red-400 mb-4">
          {error?.message ?? 'Something went wrong loading this food.'}
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
    const text = getFoodPersonalization({
      dominantDosha,
      thermalNature: food.virya ?? food.thermal_nature ?? null,
      foodName: food.name,
      rasa: food.rasa ?? undefined,
      guna: food.guna ?? undefined,
    });
    if (text) {
      personalizedPanel = <p className="text-sm text-light/70">{text}</p>;
    }
  }

  const traditions = food.traditions?.length ? food.traditions : ['Ayurveda', 'TCM', 'Naturopathy'];

  const sources = food.sources ?? [{ name: 'Bhavaprakash' }, { name: 'USDA' }];

  return (
    <DetailLayout
      name={food.name}
      imageUrl={food.image_url}
      category={food.category}
      subcategory={food.subcategory}
      traditions={traditions}
      ayurvedaSection={<AyurvedaContent food={food} />}
      tcmSection={<TcmContent food={food} />}
      naturopathySection={<NaturopathyContent food={food} />}
      sources={sources}
      confidenceScore={food.confidence_score ?? 0.85}
      personalizedPanel={personalizedPanel}
      backLabel="Back to foods"
      onBack={() => navigate({ to: '/browse', search: { tab: 'foods', food: '', herb: '' } })}
    />
  );
}
