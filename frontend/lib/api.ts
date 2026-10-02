import { getActiveAuthToken } from './supabase';
import {
  Profile,
  BodyMeasurement,
  FoodItemParsed,
  FoodLog,
  FoodNutrientData,
  LabReport,
  LabValue,
  DashboardData,
  AIChatResponse,
  AIConversation,
  AIChatMessage,
  DietAnalysis
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = await getActiveAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      let errorMsg = `Server error (${res.status})`;
      try {
        const errJson = await res.json();
        errorMsg = errJson.detail || errorMsg;
      } catch {
        // Fallback text
      }
      throw new Error(errorMsg);
    }

    return await res.json();
  } catch (err: any) {
    // Return friendly errors
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error("Unable to connect to the backend server. Please verify the Python FastAPI server is running on port 8000.");
    }
    throw err;
  }
}

export const api = {
  // Profile
  getProfile: async (): Promise<Profile> => {
    return fetchWithAuth('/api/profile');
  },
  createProfile: async (data: Omit<Profile, 'id'>): Promise<Profile> => {
    return fetchWithAuth('/api/profile', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateProfile: async (data: Partial<Profile>): Promise<Profile> => {
    return fetchWithAuth('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  addMeasurement: async (data: Partial<BodyMeasurement>): Promise<BodyMeasurement> => {
    return fetchWithAuth('/api/profile/measurements', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Food
  parseFoodText: async (text: string, mealType?: string): Promise<FoodItemParsed[]> => {
    return fetchWithAuth('/api/food/parse', {
      method: 'POST',
      body: JSON.stringify({ text, meal_type: mealType })
    });
  },
  searchFoodNutrients: async (query: string, quantity = 1, unit = 'serving'): Promise<FoodNutrientData> => {
    return fetchWithAuth(`/api/food/search?query=${encodeURIComponent(query)}&quantity=${quantity}&unit=${encodeURIComponent(unit)}`);
  },
  logFood: async (payload: {
    food_name: string;
    quantity: number;
    unit: string;
    meal_type: string;
    date?: string;
    time?: string;
    raw_query?: string;
    is_estimate?: boolean;
    nutrients?: FoodNutrientData;
  }): Promise<FoodLog> => {
    return fetchWithAuth('/api/food/log', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  getFoodLogs: async (dateStr?: string): Promise<FoodLog[]> => {
    const q = dateStr ? `?target_date=${dateStr}` : '';
    return fetchWithAuth(`/api/food/logs${q}`);
  },
  deleteFoodLog: async (logId: string): Promise<void> => {
    return fetchWithAuth(`/api/food/logs/${logId}`, {
      method: 'DELETE'
    });
  },

  // Labs
  uploadLabReport: async (file: File, reportDate?: string): Promise<LabReport> => {
    const formData = new FormData();
    formData.append('file', file);
    if (reportDate) {
      formData.append('report_date', reportDate);
    }
    return fetchWithAuth('/api/labs/upload', {
      method: 'POST',
      body: formData
    });
  },
  getLabReports: async (): Promise<LabReport[]> => {
    return fetchWithAuth('/api/labs/reports');
  },
  getLabMarkers: async (): Promise<string[]> => {
    return fetchWithAuth('/api/labs/markers');
  },
  getLabValues: async (marker?: string): Promise<LabValue[]> => {
    const q = marker ? `?marker=${encodeURIComponent(marker)}` : '';
    return fetchWithAuth(`/api/labs/values${q}`);
  },
  addManualLabValue: async (record: {
    test_name: string;
    value: number;
    unit: string;
    reference_range?: string | null;
    test_date: string;
    notes?: string;
  }): Promise<LabValue> => {
    return fetchWithAuth('/api/labs/values/manual', {
      method: 'POST',
      body: JSON.stringify(record)
    });
  },

  // Dashboard
  getDashboard: async (): Promise<DashboardData> => {
    return fetchWithAuth('/api/dashboard');
  },

  // AI Copilot
  sendMessage: async (message: string, conversationId?: string): Promise<AIChatResponse> => {
    return fetchWithAuth('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversation_id: conversationId })
    });
  },
  getConversations: async (): Promise<AIConversation[]> => {
    return fetchWithAuth('/api/ai/conversations');
  },
  getConversationMessages: async (conversationId: string): Promise<AIChatMessage[]> => {
    return fetchWithAuth(`/api/ai/conversations/${conversationId}/messages`);
  },
  analyzeDietEffectiveness: async (): Promise<DietAnalysis> => {
    return fetchWithAuth('/api/ai/is-my-diet-working', {
      method: 'POST'
    });
  },

  // Personal History
  getHistory: async (category?: string): Promise<{
    body: BodyMeasurement[];
    food: FoodLog[];
    laboratory: LabValue[];
    insights: any[];
  }> => {
    const q = category ? `?category=${category}` : '';
    return fetchWithAuth(`/api/history${q}`);
  }
};
