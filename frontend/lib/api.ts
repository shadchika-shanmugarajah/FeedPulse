const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const safeJson = async (response: Response) => {
  const data = await response.json().catch(() => null);
  return data || { success: false, message: 'Invalid server response' };
};

const networkError = { success: false, message: 'Cannot reach the API. Start the backend (port 4000) with npm run dev from the project root.', error: 'network_error' };

export const postFeedback = async (payload: Record<string, unknown>) => {
  try {
    const response = await fetch(`${API_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return safeJson(response);
  } catch {
    return networkError;
  }
};

export const loginAdmin = async (payload: { email: string; password: string }) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return safeJson(response);
  } catch {
    return networkError;
  }
};

export const fetchFeedback = async (token: string, query: Record<string, string | number>) => {
  try {
    const queryString = new URLSearchParams(query as Record<string, string>).toString();
    const response = await fetch(`${API_URL}/api/feedback?${queryString}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return safeJson(response);
  } catch {
    return networkError;
  }
};

export const updateFeedbackStatus = async (token: string, id: string, status: string) => {
  try {
    const response = await fetch(`${API_URL}/api/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    return safeJson(response);
  } catch {
    return networkError;
  }
};
