const API_URL = 'http://localhost:5000/api';

const getHeaders = (isFormData = false) => {
  const token = localStorage.getItem('token');
  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only set application/json if we are NOT sending a file (FormData)
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const api = {
  // --- Auth Endpoints ---
  login: async (credentials) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  register: async (userData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  // --- Claim Endpoints ---
  submitClaim: async (formData) => {
    const response = await fetch(`${API_URL}/claims/submit`, {
      method: 'POST',
      headers: getHeaders(true), // true = omit Content-Type for FormData
      body: formData,
    });
    return handleResponse(response);
  },

  getUserClaims: async () => {
    const response = await fetch(`${API_URL}/claims/my-claims`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // --- Admin Endpoints ---
  getAllClaims: async () => {
    const response = await fetch(`${API_URL}/claims`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  reviewClaim: async (claimId, reviewData) => {
    const response = await fetch(`${API_URL}/claims/${claimId}/review`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(reviewData),
    });
    return handleResponse(response);
  }
};