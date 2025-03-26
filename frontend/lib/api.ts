// Types for API data
import { UUID } from 'crypto';

export interface ApiError {
  detail: string;
  status: number;
}

export type RiskLevel = 'Low' | 'Medium' | 'High';

export type MitigationType = 'Flag' | 'Note' | 'Action' | 'Monitor';

export type MitigationStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';

export interface CustomerFeatures {
  age?: number;
  income?: number;
  credit_score?: number;
  account_balance?: number;
  num_transactions?: number;
  transaction_frequency?: number;
  average_transaction_amount?: number;
  [key: string]: any;
}

export interface Customer {
  id: string;
  external_id?: string;
  name: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at?: string;
}

export interface CustomerWithRisk extends Customer {
  risk_level: RiskLevel;
  confidence_score?: number;
  last_prediction?: string;
}

export interface RiskPrediction {
  id: string;
  customer_id: string;
  risk_level: RiskLevel;
  confidence_score?: number;
  prediction_timestamp: string;
}

export interface RiskDistribution {
  low_risk_count: number;
  medium_risk_count: number;
  high_risk_count: number;
  total_customers: number;
  last_updated: string;
}

export interface Mitigation {
  id: string;
  customer_id: string;
  risk_level: RiskLevel;
  mitigation_type: MitigationType;
  description: string;
  assigned_to?: string;
  due_date?: string;
  created_at: string;
  updated_at?: string;
  status: MitigationStatus;
}

export interface MitigationCreate {
  customer_id: string;
  risk_level: RiskLevel;
  mitigation_type: MitigationType;
  description: string;
  assigned_to?: string;
  due_date?: string;
}

// API client
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

/**
 * Base function to make API requests
 */
async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;
  
  // Build URL with query parameters
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
  }
  
  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };
  
  try {
    const response = await fetch(url.toString(), {
      ...fetchOptions,
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        detail: errorData.detail || `API request failed with status ${response.status}`,
        status: response.status,
      };
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Risk API endpoints
export const riskApi = {
  /**
   * Predict risk level for a customer
   */
  predictRisk: async (customerId: string, features: CustomerFeatures): Promise<RiskPrediction> => {
    return fetchApi<RiskPrediction>('/predictions/predict', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: customerId,
        customer_features: features,
      }),
    });
  },
  
  /**
   * Get risk distribution statistics
   */
  getRiskDistribution: async (): Promise<RiskDistribution> => {
    return fetchApi<RiskDistribution>('/predictions/statistics');
  },
};

// Customers API endpoints
export const customersApi = {
  /**
   * Get list of customers with their risk levels
   */
  getCustomers: async (params?: {
    risk_level?: RiskLevel;
    skip?: number;
    limit?: number;
  }): Promise<CustomerWithRisk[]> => {
    return fetchApi<CustomerWithRisk[]>('/customers', {
      params: params as Record<string, string>,
    });
  },
  
  /**
   * Get customer details by ID
   */
  getCustomerById: async (id: string): Promise<CustomerWithRisk> => {
    return fetchApi<CustomerWithRisk>(`/customers/${id}`);
  },
};

// Mitigations API endpoints
export const mitigationsApi = {
  /**
   * Create a new mitigation
   */
  createMitigation: async (mitigation: MitigationCreate): Promise<Mitigation> => {
    return fetchApi<Mitigation>('/mitigations', {
      method: 'POST',
      body: JSON.stringify(mitigation),
    });
  },
  
  /**
   * Get list of mitigations
   */
  getMitigations: async (params?: {
    customer_id?: string;
    status?: MitigationStatus;
    skip?: number;
    limit?: number;
  }): Promise<Mitigation[]> => {
    return fetchApi<Mitigation[]>('/mitigations', {
      params: params as Record<string, string>,
    });
  },
  
  /**
   * Get mitigation details by ID
   */
  getMitigationById: async (id: string): Promise<Mitigation> => {
    return fetchApi<Mitigation>(`/mitigations/${id}`);
  },
  
  /**
   * Update mitigation status
   */
  updateMitigationStatus: async (id: string, status: MitigationStatus): Promise<Mitigation> => {
    return fetchApi<Mitigation>(`/mitigations/${id}/status`, {
      method: 'PUT',
      params: { status },
    });
  },
};