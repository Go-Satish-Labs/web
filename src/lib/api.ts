import axios from 'axios'
import { firebaseAuth } from './firebase'

/**
 * Same-origin by default, and not configurable.
 *
 * Requests go to `/api/*` on this host and are forwarded to the API by the
 * Vite dev proxy locally and by the `rewrites` entry in vercel.json in
 * production. Both strip the `/api` prefix and land on the same backend path.
 *
 * This deliberately does not read VITE_API_URL. It was set to the absolute API
 * origin in the Vercel project settings, and because Vite inlines VITE_ vars at
 * build time and process env beats .env, that silently overrode the proxy:
 * every request went cross-origin, which meant CORS could reject it and an
 * ad blocker could intercept it. One code path with no override is harder to
 * misconfigure than a documented default with a footgun.
 */
export const BASE_URL = '/api'

export const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use(async (config) => {
  const token = await firebaseAuth.currentUser?.getIdToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Error wording lives in lib/errors.ts, which also understands Firebase auth
// codes. This helper only unwrapped axios, so a Firebase failure fell through
// to `err.message` and the user saw "Firebase: Error (auth/invalid-credential)".

/** True when the backend answered 503, i.e. it is up but its database is not. */
export function isServiceUnavailable(err: unknown): boolean {
  return (err as any)?.response?.status === 503
}

// ---- Types ----
export interface Dataset {
  id: string
  original_filename: string
  file_size_bytes: number
  row_count: number
  column_count: number
  detected_category: string
  status: 'uploaded' | 'profiled' | 'analyzed' | 'error'
  error_message?: string | null
  created_at: string
  hours_until_deletion?: number | null
}

export interface KpiCard {
  metric: string
  sum: number | null
  average: number | null
  min: number | null
  max: number | null
  count: number | null
  growth_pct?: number | null
}

export interface ChartReading {
  purpose: string
  takeaway: string
}

export interface ChartSpec {
  type: string
  title: string
  data?: { x: string; y: number | null }[]
  top?: { label: string; value: number | null }[]
  bottom?: { label: string; value: number | null }[]
  x_label?: string
  y_label?: string
  categories?: string[]
  series?: { name: string; data: (number | null)[] }[]
  /** Plain-language explanation computed by the server from the chart's own
      numbers, so the wording cannot contradict the picture above it. */
  reading?: ChartReading
}

export interface Prediction {
  model_type: 'classification' | 'regression' | 'clustering' | null
  algorithm?: string
  target_column?: string | null
  features_used?: string[]
  is_labeled?: boolean
  accuracy?: number
  accuracy_pct?: number
  r2_score?: number
  r2_pct?: number
  mean_absolute_error?: number
  classes?: string[]
  per_class?: { label: string; count: number; accuracy_pct: number }[]
  n_clusters?: number
  cluster_sizes?: { cluster: string; count: number }[]
  cluster_profiles?: { cluster: string; notable: string[] }[]
  feature_importance?: { feature: string; importance: number }[]
  sample_predictions?: { actual: number; predicted: number }[]
  insight?: string
  error?: string
}

export interface Feedback {
  id: string
  category: string
  rating: number | null
  message: string
  status: string
  created_at: string
}

export interface RetentionNotice {
  retention_hours: number
  window: string
  headline: string
  message: string
  short: string
}

export interface AskInterpretation {
  intent: string
  metric: string | null
  group_by: string | null
  aggregate: string
  horizon: number | null
  horizon_unit: string
  direction_asked: string | null
  matched_terms: string[]
}

export interface ForecastPoint {
  x: string
  y: number
}

/** Returned when a question needed a forward projection. */
export interface Forecast {
  kind: 'time_series' | 'holdout_backtest'
  metric: string
  date_column?: string
  unit?: string
  frequency?: string
  frequency_label?: string
  last_actual?: number
  last_actual_date?: string
  predicted_value?: number
  predicted_date?: string
  change_pct?: number | null
  trend_change_pct?: number
  signal_strength?: number
  slope_per_period?: number
  direction?: 'increasing' | 'decreasing' | 'flat'
  r2?: number
  r2_pct?: number
  confidence?: 'high' | 'moderate' | 'low'
  method?: string
  history?: ForecastPoint[]
  fitted_history?: ForecastPoint[]
  forecast?: ForecastPoint[]
  note?: string
  features_used?: string[]
  mean_absolute_error?: number
  rows_total?: number
  rows_held_out?: number
}

export interface AskResponse {
  answer: string
  used_facts: Record<string, unknown>
  disclaimer: string
  remaining_ai_questions: number
  interpretation: AskInterpretation | null
  forecast: Forecast | null
  engine: string
}

export interface PredictOptions {
  is_labeled: boolean
  suggested_target: string | null
  suggested_mode: string
  date_column: string | null
  numeric_columns: string[]
  categorical_columns: string[]
  clusterable: boolean
  summary: string
  hint: string
}

export interface PredictRequest {
  dataset_id: string
  target: string | null
  features: string[]
  mode: string
  n_clusters?: number
}

export interface DataStructure {
  is_labeled: boolean
  has_headers: boolean
  label_column: string | null
  label_type: string | null
  numeric_count: number
  categorical_count: number
  summary: string
}

export interface DashboardConfig {
  kpi_cards: KpiCard[]
  charts: ChartSpec[]
  correlations: { field_a: string; field_b: string; correlation: number }[]
  anomalies: { column: string | null; type: string; count?: number; value?: number }[]
  data_quality: { row_count: number; duplicate_row_count: number; columns_with_missing: string[] }
  data_structure?: DataStructure
  predictions?: Prediction
}

export interface UsageInfo {
  plan: string
  limits: { max_datasets: number; max_storage_mb: number; max_dashboards: number; max_ai_questions: number }
  usage: {
    /** Uploads metered against the plan. Deleting a file does not free a
        slot, so the limit cannot be churned by upload-delete-upload. */
    datasets: number
    /** Files actually stored right now. Lower than `datasets` once something
        has been deleted. */
    current_datasets?: number
    dashboards: number
    storage_mb: number
  }
}
