import axios from "axios";

// Base API client for talking to FastAPI backend.
// Adjust baseURL if your backend runs on a different host/port.
export const api = axios.create({
  baseURL: "http://localhost:8000/api/v1",
});

export interface Customer {
  customer_id: string;
  customer_name: string;
  display_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  product_alignment_scores?: Record<string, number> | null; // Strategic-Fit Matrix: {"Cement": 0-3, "Dry-Mix": 0-3, ...}
  sales_stage?: string | null; // Current sales stage (1-7 from Brian Tracy process)
}

export interface Interaction {
  id: string;
  customer_id: string;
  user_id?: string | null;
  input_text?: string | null;
  ai_response?: string | null;
  file_url?: string | null;
  file_type?: string | null;
  tds_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CustomerListResponse {
  customers: Customer[];
  total: number;
}

export interface InteractionListResponse {
  interactions: Interaction[];
  total: number;
}

export interface CustomerChatRequest {
  input_text: string;
  tds_id?: string | null;
}

export interface InteractionUpdate {
  input_text?: string | null;
  ai_response?: string | null;
  tds_id?: string | null;
}

export interface CustomerUpdate {
  customer_name?: string | null;
  display_id?: string | null;
}

export async function fetchChemicalTypes(params?: { limit?: number; offset?: number }) {
  const res = await api.get<ChemicalTypeListResponse>("/pms/chemicals", {
    params: {
      limit: params?.limit ?? 200,
      offset: params?.offset ?? 0,
    },
  });
  return res.data;
}

// PMS: Chemical Types
export interface ChemicalType {
  id: string;
  name: string;
  category?: string | null;
  hs_code?: string | null;
  applications?: string[] | null;
}

export interface ChemicalTypeListResponse {
  chemicals: ChemicalType[];
  total: number;
}

// Dashboard Models
export interface DashboardMetrics {
  total_customers: number;
  total_interactions: number;
  customers_with_interactions: number;
  sales_stages_distribution: Record<string, number>;
}


