import axios from 'axios'
import { firebaseAuth } from './firebase'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use(async (config) => {
  const token = await firebaseAuth.currentUser?.getIdToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export function apiErrorMessage(err: unknown): string {
  const anyErr = err as any
  const detail = anyErr?.response?.data?.detail
  if (typeof detail === 'string' && detail) return detail
  if (anyErr?.response?.status === 503) {
    return 'The workspace service is temporarily unavailable: its database is offline. Nothing was lost - please retry in a moment.'
  }
  return anyErr?.message || 'Something went wrong'
}

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
  status: string
  error_message: string | null
  created_at: string
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
  classes?: string[]
  feature_importance?: { feature: string; importance: number }[]
  sample_predictions?: { actual: number; predicted: number }[]
  cluster_sizes?: { cluster: string; count: number }[]
  insight?: string
  error?: string
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
  usage: { datasets: number; dashboards: number; storage_mb: number }
}
