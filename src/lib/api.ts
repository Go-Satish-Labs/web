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
  return anyErr?.response?.data?.detail || anyErr?.message || 'Something went wrong'
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
}

export interface DashboardConfig {
  kpi_cards: KpiCard[]
  charts: ChartSpec[]
  correlations: { field_a: string; field_b: string; correlation: number }[]
  anomalies: { column: string | null; type: string; count?: number; value?: number }[]
  data_quality: { row_count: number; duplicate_row_count: number; columns_with_missing: string[] }
}

export interface UsageInfo {
  plan: string
  limits: { max_datasets: number; max_storage_mb: number; max_dashboards: number; max_ai_questions: number }
  usage: { datasets: number; dashboards: number; storage_mb: number }
}
