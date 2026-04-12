/**
 * Shared types for profile-browse feature.
 */

export interface Profile {
  user_id: string;
  dietary_restrictions: string[];
  tradition_visibility: { ayurveda: boolean; tcm: boolean; naturopathy: boolean };
  cultural_cuisine_preferences: string[];
  lat: number | null;
  lon: number | null;
  city: string | null;
  weekly_herb_day: number;
  timezone: string;
  profile_completeness: number;
}

export interface BrowseFood {
  id: string;
  name: string;
  category: string;
  subcategory?: string | null;
  image_url?: string | null;
  rasa?: string[] | null;
  virya?: string | null;
  vipaka?: string | null;
  guna?: string[] | null;
  dosha_effects?: Record<string, number> | null;
  thermal_nature?: string | null;
  tcm_flavor?: string[] | null;
  organ_affinity?: string[] | null;
  tcm_actions?: string[] | null;
  glycemic_index?: number | null;
  bioactive_compounds?: { name: string; amount: number; unit: string }[] | null;
  evidence_claims?:
    | { claim: string; level: string; citation?: string; pubmed_id?: string }[]
    | null;
  ritu_scores?: Record<string, number> | null;
  element_scores?: Record<string, number> | null;
  sources?: { name: string; url?: string; isLlmGenerated?: boolean }[] | null;
  confidence_score?: number | null;
  traditions?: string[];
}

export interface BrowseHerb {
  id: string;
  name: string;
  category: string;
  subcategory?: string | null;
  image_url?: string | null;
  herb_actions?: string[] | null;
  rasa?: string[] | null;
  virya?: string | null;
  vipaka?: string | null;
  guna?: string[] | null;
  prabhava?: string | null;
  dosha_effects?: Record<string, number> | null;
  thermal_nature?: string | null;
  tcm_flavor?: string[] | null;
  organ_affinity?: string[] | null;
  tcm_actions?: string[] | null;
  bioactive_compounds?: { name: string; amount: number; unit: string }[] | null;
  evidence_claims?:
    | { claim: string; level: string; citation?: string; pubmed_id?: string }[]
    | null;
  pregnancy_safety?: string | null;
  dosage_forms?: string[] | null;
  contraindications?: string[] | null;
  sources?: { name: string; url?: string; isLlmGenerated?: boolean }[] | null;
  confidence_score?: number | null;
  traditions?: string[];
}

export interface BrowseResponse<T> {
  items: T[];
  nextCursor: string | null;
}

export interface SeasonalTransition {
  active: boolean;
  transition: {
    from_ritu: string;
    to_ritu: string;
    from_tcm_phase: string;
    to_tcm_phase: string;
    ayurveda_explanation: string;
    tcm_explanation: string;
    naturopathy_explanation: string;
    tension: boolean;
  } | null;
}
