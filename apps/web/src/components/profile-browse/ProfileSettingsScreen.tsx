import { useProfile, useUpdateProfile } from '../../hooks/profile-browse';
import type { Profile } from '../../lib/types';
import { ChipMultiSelect } from './ChipMultiSelect';

// ---- Constants ----

const DIETARY_OPTIONS = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten-free' },
  { value: 'dairy-free', label: 'Dairy-free' },
  { value: 'egg-free', label: 'Egg-free' },
  { value: 'shellfish-allergy', label: 'Shellfish allergy' },
  { value: 'tree-nut-allergy', label: 'Tree nut allergy' },
  { value: 'peanut-allergy', label: 'Peanut allergy' },
  { value: 'nightshade-free', label: 'Nightshade-free' },
  { value: 'low-fodmap', label: 'Low-FODMAP' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
];

const CUISINE_OPTIONS = [
  { value: 'indian', label: 'Indian' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'thai', label: 'Thai' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'caribbean', label: 'Caribbean/Jamaican' },
  { value: 'west-african', label: 'West African' },
  { value: 'ethiopian', label: 'Ethiopian' },
  { value: 'middle-eastern', label: 'Middle Eastern' },
  { value: 'korean', label: 'Korean' },
  { value: 'vietnamese', label: 'Vietnamese' },
];

// ---- Skeleton ----

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-dark-surface border border-dark-border p-6 animate-pulse">
      <div className="h-5 bg-dark-border rounded w-1/3 mb-4" />
      <div className="h-4 bg-dark-border rounded w-2/3 mb-2" />
      <div className="h-4 bg-dark-border rounded w-1/2" />
    </div>
  );
}

// ---- Card Components ----

function ConstitutionCard({ profile }: { profile: Profile }) {
  const { dosha_ratios } = profile as Profile & {
    dosha_ratios?: { vata: number; pitta: number; kapha: number };
  };

  const ratios = dosha_ratios ?? { vata: 0.33, pitta: 0.34, kapha: 0.33 };
  const dominant = Object.entries(ratios).sort(([, a], [, b]) => b - a)[0];
  const secondary = Object.entries(ratios).sort(([, a], [, b]) => b - a)[1];

  const doshaColors: Record<string, string> = {
    vata: 'bg-blue-400',
    pitta: 'bg-terracotta',
    kapha: 'bg-sage',
  };

  return (
    <div className="rounded-2xl bg-dark-surface border border-dark-border p-6">
      <h2 className="font-heading text-lg font-bold mb-4">Constitution</h2>
      <div className="space-y-2 mb-4">
        {Object.entries(ratios).map(([dosha, ratio]) => (
          <div key={dosha} className="flex items-center gap-3">
            <span className="text-sm text-light/60 w-12 capitalize">{dosha}</span>
            <div className="flex-1 h-3 bg-dark-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${doshaColors[dosha] ?? 'bg-teal'}`}
                style={{ width: `${ratio * 100}%` }}
              />
            </div>
            <span className="text-sm text-light/40 w-10 text-right">
              {Math.round(ratio * 100)}%
            </span>
          </div>
        ))}
      </div>
      {dominant && secondary && (
        <p className="text-sm text-light/60">
          You are primarily <span className="text-teal capitalize">{dominant[0]}</span> with{' '}
          <span className="capitalize">{secondary[0]}</span> secondary.
        </p>
      )}
    </div>
  );
}

function DietaryRestrictionsCard({
  profile,
  onUpdate,
}: { profile: Profile; onUpdate: (data: Partial<Profile>) => void }) {
  return (
    <div className="rounded-2xl bg-dark-surface border border-dark-border p-6">
      <h2 className="font-heading text-lg font-bold mb-4">Dietary Restrictions</h2>
      <ChipMultiSelect
        options={DIETARY_OPTIONS}
        values={profile.dietary_restrictions}
        onChange={(values) => onUpdate({ dietary_restrictions: values })}
        label="Dietary restrictions"
        allowCustom
        customPlaceholder="Add other restriction"
      />
    </div>
  );
}

function LocationCard({
  profile,
  onUpdate,
}: { profile: Profile; onUpdate: (data: Partial<Profile>) => void }) {
  return (
    <div className="rounded-2xl bg-dark-surface border border-dark-border p-6">
      <h2 className="font-heading text-lg font-bold mb-4">Location</h2>
      <p className="text-xs text-light/40 mb-3">
        Triveda uses your location to determine your local season and weather. Your coordinates are
        stored in your profile and never shared.
      </p>
      {profile.city ? (
        <div className="flex items-center justify-between">
          <span className="text-light/80">{profile.city}</span>
          <button
            type="button"
            onClick={() => onUpdate({ lat: null, lon: null, city: null })}
            className="text-sm text-teal hover:text-teal-soft transition-colors"
          >
            Change
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            if ('geolocation' in navigator) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  onUpdate({
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                    city: `${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`,
                  });
                },
                () => {
                  // Geolocation denied or failed -- silent
                },
              );
            }
          }}
          className="w-full min-h-11 px-4 py-2 rounded-xl border border-teal text-teal hover:bg-teal/10 transition-colors text-sm font-medium"
        >
          Use my location
        </button>
      )}
    </div>
  );
}

function TraditionVisibilityCard({
  profile,
  onUpdate,
}: { profile: Profile; onUpdate: (data: Partial<Profile>) => void }) {
  const traditions = ['ayurveda', 'tcm', 'naturopathy'] as const;
  const labels: Record<string, string> = {
    ayurveda: 'Ayurveda',
    tcm: 'TCM',
    naturopathy: 'Naturopathy',
  };

  return (
    <div className="rounded-2xl bg-dark-surface border border-dark-border p-6">
      <h2 className="font-heading text-lg font-bold mb-4">Tradition Visibility</h2>
      <div className="space-y-3">
        {traditions.map((tradition) => {
          const isOn = profile.tradition_visibility[tradition];
          return (
            <div key={tradition} className="flex items-center justify-between">
              <span className="text-sm text-light/80">{labels[tradition]}</span>
              <button
                type="button"
                role="switch"
                aria-checked={isOn}
                onClick={() =>
                  onUpdate({
                    tradition_visibility: {
                      ...profile.tradition_visibility,
                      [tradition]: !isOn,
                    },
                  })
                }
                className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal ${
                  isOn ? 'bg-teal' : 'bg-dark-border'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    isOn ? 'translate-x-5.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-light/40 mt-4">
        Hiding a tradition only changes what you see. Recommendations still use all three
        traditions.
      </p>
    </div>
  );
}

function CuisinePreferencesCard({
  profile,
  onUpdate,
}: { profile: Profile; onUpdate: (data: Partial<Profile>) => void }) {
  return (
    <div className="rounded-2xl bg-dark-surface border border-dark-border p-6">
      <h2 className="font-heading text-lg font-bold mb-4">Cuisine Preferences</h2>
      <p className="text-xs text-light/40 mb-3">
        Triveda uses your cuisine preferences to prioritize familiar foods. It will not exclude
        foods from other cuisines.
      </p>
      <ChipMultiSelect
        options={CUISINE_OPTIONS}
        values={profile.cultural_cuisine_preferences}
        onChange={(values) => onUpdate({ cultural_cuisine_preferences: values })}
        label="Cuisine preferences"
        allowCustom
        customPlaceholder="Add cuisine"
      />
    </div>
  );
}

// ---- Main Screen ----

export function ProfileSettingsScreen() {
  const { data: profile, isLoading, isError, error } = useProfile();
  const { mutate: updateProfile } = useUpdateProfile();

  if (isLoading) {
    return (
      <div className="py-6">
        <h1 className="font-heading text-2xl font-bold text-teal mb-6">Profile Settings</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-6 text-center">
        <h1 className="font-heading text-2xl font-bold text-teal mb-4">Profile Settings</h1>
        <p className="text-red-400">Failed to load profile: {error?.message ?? 'Unknown error'}</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="py-6">
      <h1 className="font-heading text-2xl font-bold text-teal mb-6">Profile Settings</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ConstitutionCard profile={profile} />
        <DietaryRestrictionsCard profile={profile} onUpdate={updateProfile} />
        <LocationCard profile={profile} onUpdate={updateProfile} />
        <TraditionVisibilityCard profile={profile} onUpdate={updateProfile} />
        <CuisinePreferencesCard profile={profile} onUpdate={updateProfile} />
      </div>
    </div>
  );
}
